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
      // Total Metrics: clicks and appointments attributed to this affiliate
      const [{ count: clicksCount }, { count: appointmentsCount }] = await Promise.all([
        supabase.from("referral_clicks").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliate.id).in("status", ["pending", "completed"])
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
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
        <p className="text-slate-500 mt-1">Acompanhe seu desempenho em tempo real.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total de Cliques</CardTitle>
            <div className="h-11 w-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
               <MousePointerClick className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{metrics.clicks}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+12%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Agendamentos</CardTitle>
            <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
               <CalendarCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{metrics.appointments}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+8%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Taxa de Conversão</CardTitle>
            <div className="h-11 w-11 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
               <Percent className="h-5 w-5 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{conversionRate}%</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+2%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Saldo Disponível</CardTitle>
            <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
               <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{formattedBalance}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="font-heading text-lg font-semibold text-slate-900">Cliques e Agendamentos (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }}/>
                <Line 
                  name="Cliques"
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  name="Agendamentos"
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#10b981" 
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
