import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

export default function AffiliateCommissions() {
  const { affiliate } = useOutletContext<{ affiliate: any }>();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommissions() {
      // appointments joined with doctors
      const { data } = await supabase
        .from("appointments")
        .select("created_at, patient_name, price_cents, affiliate_commission_cents, status, doctors(full_name)")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false });

      setCommissions(data || []);
      setLoading(false);
    }
    
    fetchCommissions();
  }, [affiliate.id]);

  const formatBRL = (cents: number) => {
    if (!cents) return "R$ 0,00";
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return "—";
    return fullName.split(" ")[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-0">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-0">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-0">Cancelado</Badge>;
      case "no_show":
        return <Badge className="bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 border-0">Faltou</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Comissões Recebidas</h2>
        <p className="text-slate-400">Acompanhe todas as consultas geradas pelos seus links e as respectivas recompensas.</p>
      </div>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-[#0D9488]" />
            <CardTitle className="text-white">Histórico de Indicações</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            A comissão em status "Concluído" já está liberada no seu saldo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700 bg-[#0F172A] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1E293B] border-b border-slate-700">
                <TableRow className="border-b border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-300">Data</TableHead>
                  <TableHead className="text-slate-300">Médico</TableHead>
                  <TableHead className="text-slate-300">Paciente</TableHead>
                  <TableHead className="text-right text-slate-300">Valor Consulta</TableHead>
                  <TableHead className="text-right text-slate-300">Sua Comissão</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Carregando comissões...</TableCell>
                  </TableRow>
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Nenhuma indicação registrada.</TableCell>
                  </TableRow>
                ) : (
                  commissions.map((row, i) => (
                    <TableRow key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300">
                        {new Date(row.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {row.doctors?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {getFirstName(row.patient_name)}
                      </TableCell>
                      <TableCell className="text-right text-slate-400">
                        {formatBRL(row.price_cents)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-400">
                        {formatBRL(row.affiliate_commission_cents)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(row.status)}
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
