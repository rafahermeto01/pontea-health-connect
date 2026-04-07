import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateData } from "@/hooks/useAffiliate";
import { Loader2 } from "lucide-react";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function statusBadge(status: string | null) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Concluído</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Cancelado</Badge>;
    default:
      return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">Pendente</Badge>;
  }
}

interface CommissionRow {
  created_at: string;
  doctor_name: string;
  patient_name: string | null;
  price_cents: number;
  commission_cents: number;
  status: string | null;
}

export default function AffiliateCommissions() {
  const { affiliate } = useOutletContext<{ affiliate: AffiliateData }>();
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch appointments with doctor info
      const { data: appts } = await supabase
        .from("appointments")
        .select("created_at, patient_name, price_cents, affiliate_commission_cents, status, doctor_id")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false });

      if (!appts || appts.length === 0) { setLoading(false); return; }

      // Fetch doctor names
      const doctorIds = [...new Set(appts.map((a) => a.doctor_id).filter(Boolean))] as string[];
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, full_name")
        .in("id", doctorIds);

      const doctorMap: Record<string, string> = {};
      doctors?.forEach((d) => { doctorMap[d.id] = d.full_name ?? "—"; });

      setRows(
        appts.map((a) => ({
          created_at: a.created_at ?? "",
          doctor_name: a.doctor_id ? doctorMap[a.doctor_id] ?? "—" : "—",
          patient_name: a.patient_name,
          price_cents: a.price_cents ?? 0,
          commission_cents: a.affiliate_commission_cents ?? 0,
          status: a.status,
        }))
      );
      setLoading(false);
    }
    load();
  }, [affiliate.id]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Comissões</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma comissão registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="text-right">Consulta</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(r.created_at)}</TableCell>
                    <TableCell>{r.doctor_name}</TableCell>
                    <TableCell>{r.patient_name?.split(" ")[0] ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.price_cents)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatBRL(r.commission_cents)}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
