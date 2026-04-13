import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, DollarSign, Star, Users, Clock } from "lucide-react";


export default function DoctorOverview() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [metrics, setMetrics] = useState({
    appointmentsThisMonth: 0,
    revenueThisMonth: 0,
    pendingAppointments: 0,
  });

  useEffect(() => {
    async function loadMetrics() {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Confirmed + Completed appointments for metrics
      const { data, error } = await supabase
        .from("appointments")
        .select("price_cents, status")
        .eq("doctor_id", doctor.id)
        .in("status", ["completed", "confirmed"])
        .gte("created_at", firstDayOfMonth);

      // Pending appointments (no date filter — total pending)
      const { count: pendingCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctor.id)
        .eq("status", "pending");

      if (!error && data) {
        const apps = data.length;
        const rev = data.reduce((sum, app) => sum + (app.price_cents || 0), 0);
        setMetrics({
          appointmentsThisMonth: apps,
          revenueThisMonth: rev,
          pendingAppointments: pendingCount || 0,
        });
      }
    }

    loadMetrics();
  }, [doctor.id]);

  const rating = Number(doctor.avg_rating || 0).toFixed(1);
  const reviewsCount = doctor.total_reviews || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
        <p className="text-slate-500 mt-1">Acompanhe seus resultados e avaliações.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Card 1 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Consultas (Mês)</CardTitle>
            <div className="h-11 w-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <CalendarCheck className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{metrics.appointmentsThisMonth}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+12%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Receita (Mês)</CardTitle>
            <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">
                {(metrics.revenueThisMonth / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+8%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Consultas Pendentes */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Pendentes</CardTitle>
            <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{metrics.pendingAppointments}</div>
              <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-md mb-1">aguardando</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Avaliação Média</CardTitle>
            <div className="h-11 w-11 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
               <Star className="h-5 w-5 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{rating}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+2%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5 */}
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total de Avaliações</CardTitle>
            <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-end justify-between">
              <div className="font-heading text-3xl font-bold text-slate-900">{reviewsCount}</div>
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md mb-1">+5%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
