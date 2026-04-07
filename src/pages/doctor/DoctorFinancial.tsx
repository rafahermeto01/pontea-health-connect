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
        .eq("status", "completed")
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Relatório Financeiro</h2>
        <p className="text-muted-foreground">Acompanhe seus rendimentos pelas consultas realizadas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Bruto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalGross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Taxas da Plataforma</CardTitle>
            <WalletCards className="h-4 w-4 text-red-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatBRL(totalFees)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Total Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatBRL(totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-border mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">Taxa (Pontea)</TableHead>
              <TableHead className="text-right">Valor Líquido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {loading ? "Carregando..." : "Nenhuma consulta faturada ainda."}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{new Date(app.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{app.patient_name || "—"}</TableCell>
                  <TableCell className="text-right">{formatBRL(app.price_cents || 0)}</TableCell>
                  <TableCell className="text-right text-red-500">-{formatBRL(app.platform_fee_cents || 0)}</TableCell>
                  <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                    {formatBRL((app.price_cents || 0) - (app.platform_fee_cents || 0))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
