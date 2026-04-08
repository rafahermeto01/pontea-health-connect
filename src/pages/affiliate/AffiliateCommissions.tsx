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
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none">Concluído</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none shadow-none">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none shadow-none">Cancelado</Badge>;
      case "no_show":
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none shadow-none">Faltou</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Comissões Recebidas</h2>
        <p className="text-slate-500 mt-1">Acompanhe todas as consultas geradas pelos seus links e as respectivas recompensas.</p>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">Histórico de Indicações</CardTitle>
          </div>
          <CardDescription className="text-slate-500 mt-1">
            A comissão em status "Concluído" já está liberada no seu saldo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_th]:font-medium border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="text-right">Valor Consulta</TableHead>
                  <TableHead className="text-right">Sua Comissão</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableRow key={i} className="hover:bg-slate-50/80 border-b border-slate-100">
                      <TableCell className="text-slate-600">
                        {new Date(row.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-slate-800 font-medium whitespace-nowrap">
                        {row.doctors?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {getFirstName(row.patient_name)}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 font-heading font-semibold">
                        {formatBRL(row.price_cents)}
                      </TableCell>
                      <TableCell className="text-right font-heading font-semibold text-emerald-600">
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
