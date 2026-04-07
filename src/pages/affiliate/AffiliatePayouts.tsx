import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AffiliateData } from "@/hooks/useAffiliate";
import { useAffiliate } from "@/hooks/useAffiliate";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

function payoutStatusBadge(status: string | null) {
  switch (status) {
    case "completed": return <Badge className="bg-green-500/20 text-green-400">Concluído</Badge>;
    case "processing": return <Badge className="bg-blue-500/20 text-blue-400">Processando</Badge>;
    case "failed": return <Badge className="bg-red-500/20 text-red-400">Falhou</Badge>;
    default: return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
  }
}

interface Payout {
  id: string;
  created_at: string | null;
  amount_cents: number | null;
  pix_key: string | null;
  status: string | null;
  processed_at: string | null;
}

export default function AffiliatePayouts() {
  const { affiliate } = useOutletContext<{ affiliate: AffiliateData }>();
  const { refetch } = useAffiliate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState(affiliate.pix_key ?? "");
  const [submitting, setSubmitting] = useState(false);

  const balance = affiliate.balance_cents ?? 0;

  async function loadPayouts() {
    const { data } = await supabase
      .from("payouts")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false });
    setPayouts((data as Payout[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadPayouts(); }, [affiliate.id]);

  const handleRequest = async () => {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents < 5000) {
      toast.error("Valor mínimo de R$ 50,00.");
      return;
    }
    if (amountCents > balance) {
      toast.error("Valor excede o saldo disponível.");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX.");
      return;
    }

    setSubmitting(true);

    const { error: insertErr } = await supabase.from("payouts").insert({
      id: crypto.randomUUID(),
      affiliate_id: affiliate.id,
      amount_cents: amountCents,
      pix_key: pixKey,
      status: "pending",
    });

    if (insertErr) {
      toast.error("Erro ao solicitar saque.");
      setSubmitting(false);
      return;
    }

    // Update balance — use RPC or direct update
    const newBalance = balance - amountCents;
    await supabase.from("affiliates").update({ balance_cents: newBalance }).eq("id", affiliate.id);

    toast.success("Saque solicitado com sucesso!");
    setModalOpen(false);
    setSubmitting(false);
    await refetch();
    await loadPayouts();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl font-bold text-foreground">{formatBRL(balance)}</p>
            </div>
          </div>
          <Button onClick={() => { setAmount((balance / 100).toFixed(2)); setModalOpen(true); }} disabled={balance < 5000}>
            Solicitar Saque
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum saque realizado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(p.amount_cents ?? 0)}</TableCell>
                      <TableCell className="font-mono text-xs">{p.pix_key}</TableCell>
                      <TableCell>{payoutStatusBadge(p.status)}</TableCell>
                      <TableCell>{formatDate(p.processed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Solicitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Valor (R$)</label>
              <Input type="number" step="0.01" min="50" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Mínimo: R$ 50,00 — Saldo: {formatBRL(balance)}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Chave PIX</label>
              <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, email, telefone ou chave aleatória" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleRequest} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
