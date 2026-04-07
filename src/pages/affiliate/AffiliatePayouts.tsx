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
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-0">Transferido</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500 border-0">Em análise</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-500 border-0">Processando</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 border-0">Falho</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Saques</h2>
        <p className="text-slate-400">Gerencie seus resgates para a sua conta via PIX.</p>
      </div>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Saldo Disponível para Saque</p>
              <div className="flex items-center gap-2 mt-1">
                <Wallet className="h-6 w-6 text-emerald-400" />
                <span className="text-3xl font-bold text-white">
                  {formatBRL(affiliate.balance_cents)}
                </span>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0D9488] hover:bg-[#0f766e] text-white">
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0F172A] border-slate-800 text-slate-100 sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-white">Resgatar Saldo</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    O valor será depositado na sua conta via PIX em até 2 dias úteis.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestPayout} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="50"
                      value={amountStr} 
                      onChange={e => setAmountStr(e.target.value)} 
                      className="bg-[#1E293B] border-slate-700 text-white"
                      required 
                    />
                    <p className="text-xs text-slate-500">Mínimo de saque: R$ 50,00</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Chave PIX</Label>
                    <Input 
                      value={pixKey} 
                      onChange={e => setPixKey(e.target.value)} 
                      className="bg-[#1E293B] border-slate-700 text-white"
                      placeholder="CPF, E-mail, Celular ou Aleatória"
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white mt-4">
                    {submitting ? "Processando..." : "Confirmar Solicitação"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Landmark className="h-5 w-5 text-[#0D9488]" />
            <CardTitle className="text-white">Histórico de Saques</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700 bg-[#0F172A] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1E293B] border-b border-slate-700">
                <TableRow className="border-b border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-300">Data Solicitação</TableHead>
                  <TableHead className="text-slate-300">Valor</TableHead>
                  <TableHead className="text-slate-300">Chave PIX</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Data Processamento</TableHead>
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
                    <TableRow key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300 font-medium">
                        {new Date(row.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        {formatBRL(row.amount_cents)}
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-sm max-w-[150px] truncate">
                        {row.pix_key}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(row.status)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
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
