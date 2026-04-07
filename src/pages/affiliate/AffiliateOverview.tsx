import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { MousePointerClick, CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateData } from "@/hooks/useAffiliate";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AffiliateOverview() {
  const { affiliate } = useOutletContext<{ affiliate: AffiliateData }>();
  const [clicks, setClicks] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [chartData, setChartData] = useState<{ dia: string; cliques: number; agendamentos: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [clicksRes, appointmentsRes, clicksByDay, appointmentsByDay] = await Promise.all([
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
        supabase.from("referral_clicks").select("created_at").eq("affiliate_id", affiliate.id).gte("created_at", thirtyDaysAgo),
        supabase.from("appointments").select("created_at").eq("affiliate_id", affiliate.id).gte("created_at", thirtyDaysAgo),
      ]);

      setClicks(clicksRes.count ?? 0);
      setAppointments(appointmentsRes.count ?? 0);

      // Build chart data
      const dayMap: Record<string, { cliques: number; agendamentos: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { cliques: 0, agendamentos: 0 };
      }

      clicksByDay.data?.forEach((r) => {
        const key = r.created_at?.slice(0, 10);
        if (key && dayMap[key]) dayMap[key].cliques++;
      });

      appointmentsByDay.data?.forEach((r) => {
        const key = r.created_at?.slice(0, 10);
        if (key && dayMap[key]) dayMap[key].agendamentos++;
      });

      setChartData(
        Object.entries(dayMap).map(([dia, vals]) => ({
          dia: dia.slice(5), // MM-DD
          ...vals,
        }))
      );

      setLoading(false);
    }
    load();
  }, [affiliate.id]);

  const conversionRate = clicks > 0 ? ((appointments / clicks) * 100).toFixed(1) : "0.0";

  const metrics = [
    { label: "Cliques", value: clicks, icon: MousePointerClick, color: "text-primary" },
    { label: "Agendamentos", value: appointments, icon: CalendarCheck, color: "text-green-500" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: TrendingUp, color: "text-yellow-500" },
    { label: "Saldo Disponível", value: formatBRL(affiliate.balance_cents ?? 0), icon: Wallet, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="cliques" stroke="#0D9488" strokeWidth={2} dot={false} name="Cliques" />
                <Line type="monotone" dataKey="agendamentos" stroke="#22C55E" strokeWidth={2} dot={false} name="Agendamentos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
