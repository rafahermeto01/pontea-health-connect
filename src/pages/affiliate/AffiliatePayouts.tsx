import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Landmark } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AffiliatePayouts() {
  const { affiliate } = useOutletContext<{ affiliate: any }>();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState(((affiliate.balance_cents || 0) / 100).toFixed(2));
  const [pixKey, setPixKey] = useState(affiliate.pix_key || "");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payouts")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false });

    setPayouts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayouts();
  }, [affiliate.id]);

  const handleRequestPayout = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const amountCents = Math.round(parseFloat(amountStr.replace(",", ".")) * 100);
      const availableCents = affiliate.balance_cents || 0;

      if (isNaN(amountCents) || amountCents <= 0) {
        throw new Error("Valor inválido");
      }
      
      if (amountCents < 5000) {
        throw new Error("O valor mínimo para saque é R$ 50,00");
      }
      
      if (amountCents > availableCents) {
        throw new Error("Saldo insuficiente");
      }

      if (!pixKey.trim()) {
        throw new Error("Chave PIX obrigatória");
      }

      // Insert payout request
      const { error: insertError } = await supabase.from("payouts").insert({
        affiliate_id: affiliate.id,
        amount_cents: amountCents,
        pix_key: pixKey.trim(),
        status: "pending"
      });

      if (insertError) throw insertError;

      // Update affiliate balance
      const { error: updateError } = await supabase.from("affiliates").update({
        balance_cents: availableCents - amountCents
      }).eq("id", affiliate.id);

      if (updateError) throw updateError;
      
      // Update local state temporarily (usually you'd refresh context, but this is a quick fix for UX)
      affiliate.balance_cents = availableCents - amountCents; 
      
      toast.success("Solicitação de saque enviada com sucesso!");
      setOpen(false);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar saque");
    } finally {
      setSubmitting(false);
    }
  };

  const formatBRL = (cents: number) => {
    if (!cents) return "R$ 0,00";
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none">Transferido</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none shadow-none">Em análise</Badge>;
      case "processing":
        return <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-100 border-none shadow-none">Processando</Badge>;
      case "failed":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none shadow-none">Falho</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Saques</h2>
        <p className="text-slate-500 mt-1">Gerencie seus resgates para a sua conta via PIX.</p>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Disponível</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-heading text-3xl font-bold text-slate-900">
                  {formatBRL(affiliate.balance_cents)}
                </span>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow-sm mt-2 sm:mt-0 px-6 h-12">
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-slate-200 rounded-2xl shadow-xl sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg font-semibold text-slate-900">Resgatar Saldo</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    O valor será depositado na sua conta via PIX em até 2 dias úteis.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestPayout} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="50"
                      value={amountStr} 
                      onChange={e => setAmountStr(e.target.value)} 
                      className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 font-medium"
                      required 
                    />
                    <p className="text-xs text-slate-500 mt-1">Mínimo de saque: R$ 50,00</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Chave PIX</Label>
                    <Input 
                      value={pixKey} 
                      onChange={e => setPixKey(e.target.value)} 
                      className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500"
                      placeholder="CPF, E-mail, Celular ou Aleatória"
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-teal-600 text-white rounded-xl hover:bg-teal-700 mt-5 h-11">
                    {submitting ? "Processando..." : "Confirmar Solicitação"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center space-x-2">
            <Landmark className="h-5 w-5 text-teal-600" />
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">Histórico de Saques</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_th]:font-medium border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Processamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">Carregando saques...</TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">Nenhum saque solicitado ainda.</TableCell>
                  </TableRow>
                ) : (
                  payouts.map((row, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/80 border-b border-slate-100">
                      <TableCell className="text-slate-600 font-medium">
                        {new Date(row.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-slate-900 font-heading font-bold">
                        {formatBRL(row.amount_cents)}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-sm max-w-[150px] truncate">
                        {row.pix_key}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(row.status)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm font-medium">
                        {row.processed_at ? new Date(row.processed_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
