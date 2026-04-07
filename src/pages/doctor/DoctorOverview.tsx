import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, DollarSign, Star, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // Assuming a utility, or I can just format inline

export default function DoctorOverview() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [metrics, setMetrics] = useState({
    appointmentsThisMonth: 0,
    revenueThisMonth: 0,
  });

  useEffect(() => {
    async function loadMetrics() {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select("price_cents")
        .eq("doctor_id", doctor.id)
        .eq("status", "completed")
        .gte("created_at", firstDayOfMonth);

      if (!error && data) {
        const apps = data.length;
        const rev = data.reduce((sum, app) => sum + (app.price_cents || 0), 0);
        setMetrics({
          appointmentsThisMonth: apps,
          revenueThisMonth: rev,
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h2>
        <p className="text-muted-foreground">Acompanhe seus resultados e avaliações.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas (Mês)</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.appointmentsThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.revenueThisMonth / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
