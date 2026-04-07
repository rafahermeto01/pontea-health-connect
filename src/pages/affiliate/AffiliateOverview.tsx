import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, CalendarCheck, Percent, DollarSign } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function AffiliateOverview() {
  const { affiliate } = useOutletContext<{ affiliate: any }>();
  const [metrics, setMetrics] = useState({ clicks: 0, appointments: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      // 1. Total Metrics
      const [{ count: clicksCount }, { count: appointmentsCount }] = await Promise.all([
        supabase.from("referral_clicks").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliate.id)
      ]);

      setMetrics({
        clicks: clicksCount || 0,
        appointments: appointmentsCount || 0
      });

      // 2. Chart Data (Last 30 days)
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30)).toISOString();
      const [{ data: clicksData }, { data: appsData }] = await Promise.all([
        supabase.from("referral_clicks").select("created_at").eq("affiliate_id", affiliate.id).gte("created_at", thirtyDaysAgo),
        supabase.from("appointments").select("created_at").eq("affiliate_id", affiliate.id).gte("created_at", thirtyDaysAgo)
      ]);

      // Group by day
      const daysMap: Record<string, { name: string; clicks: number; appointments: number }> = {};
      
      // Initialize last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dayStr = format(d, "yyyy-MM-dd");
        const niceStr = format(d, "dd/MM");
        daysMap[dayStr] = { name: niceStr, clicks: 0, appointments: 0 };
      }

      clicksData?.forEach(item => {
        const dayStr = item.created_at.substring(0, 10);
        if (daysMap[dayStr]) daysMap[dayStr].clicks += 1;
      });

      appsData?.forEach(item => {
        const dayStr = item.created_at.substring(0, 10);
        if (daysMap[dayStr]) daysMap[dayStr].appointments += 1;
      });

      setChartData(Object.values(daysMap));
    }
    loadData();
  }, [affiliate.id]);

  const conversionRate = metrics.clicks > 0 ? ((metrics.appointments / metrics.clicks) * 100).toFixed(1) : "0.0";
  const formattedBalance = ((affiliate.balance_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-8 bg-[#0F172A] min-h-full p-4 rounded-xl text-slate-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Visão Geral</h2>
        <p className="text-slate-400">Acompanhe seu desempenho em tempo real.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1E293B] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-[#0D9488]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clicks}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1E293B] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Agendamentos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[#22C55E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.appointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1E293B] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1E293B] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Saldo Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedBalance}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Cliques e Agendamentos (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }}/>
                <Line 
                  name="Cliques"
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#0D9488" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  name="Agendamentos"
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#22C55E" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
