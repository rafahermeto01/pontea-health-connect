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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, WalletCards } from "lucide-react";

export default function DoctorFinancial() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancial() {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctor.id)
        .in("status", ["completed", "confirmed"])
        .order("created_at", { ascending: false });

      setAppointments(data || []);
      setLoading(false);
    }
    fetchFinancial();
  }, [doctor.id]);

  const totalGross = appointments.reduce((sum, app) => sum + (app.price_cents || 0), 0);
  const totalFees = appointments.reduce((sum, app) => sum + (app.platform_fee_cents || 0), 0);
  const totalNet = totalGross - totalFees;

  const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none">Pago</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none shadow-none">Pendente</Badge>;
      case "refunded":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none shadow-none">Reembolsado</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-200">{status || "—"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Relatório Financeiro</h2>
        <p className="text-slate-500 mt-1">Acompanhe seus rendimentos pelas consultas realizadas.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Valor Bruto Total</CardTitle>
            <div className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
               <DollarSign className="h-5 w-5 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="font-heading text-3xl font-bold text-slate-900">{formatBRL(totalGross)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Taxas da Plataforma</CardTitle>
            <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <WalletCards className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="font-heading text-3xl font-bold text-red-500">{formatBRL(totalFees)}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-emerald-700 font-medium">Total Líquido</CardTitle>
            <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center shrink-0 border border-emerald-100">
               <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="font-heading text-3xl font-bold text-emerald-700">{formatBRL(totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden mt-8">
        <Table>
          <TableHeader className="bg-slate-50 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_th]:font-medium border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">Taxa (Pontea)</TableHead>
              <TableHead className="text-right">Valor Líquido</TableHead>
              <TableHead>Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? "Carregando..." : "Nenhuma consulta faturada ainda."}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((app) => (
                <TableRow key={app.id} className="hover:bg-slate-50/80 border-b border-slate-100">
                  <TableCell className="text-slate-600">
                    {new Date(app.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">{app.patient_name || "—"}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-slate-600">{formatBRL(app.price_cents || 0)}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-red-500">-{formatBRL(app.platform_fee_cents || 0)}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-emerald-600">
                    {formatBRL((app.price_cents || 0) - (app.platform_fee_cents || 0))}
                  </TableCell>
                  <TableCell>{getPaymentBadge(app.payment_status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
