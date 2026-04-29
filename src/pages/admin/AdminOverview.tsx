import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, AlertCircle, Package, DollarSign } from "lucide-react";

export default function AdminOverview() {
  const [metrics, setMetrics] = useState({
    quizzesToday: 0,
    quizzesPending: 0,
    ordersAwaiting: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Quizzes Today
        const { count: qToday } = await supabase
          .from("quiz_responses")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString());

        // 2. Quizzes Pending
        const { count: qPending } = await supabase
          .from("quiz_responses")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // 3. Orders Awaiting Review
        const { count: oAwaiting } = await supabase
          .from("treatment_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "awaiting_review");

        // 4. Monthly Revenue (sum of amount where created_at >= firstDayOfMonth)
        // Note: adjust the query to match your actual payment status if applicable.
        const { data: oPaid } = await supabase
          .from("treatment_orders")
          .select("amount")
          .gte("created_at", firstDayOfMonth.toISOString());
          // if payment_status exists, add .eq("payment_status", "paid")

        const revenue = oPaid?.reduce((sum, order) => sum + (Number(order.amount) || 0), 0) || 0;

        setMetrics({
          quizzesToday: qToday || 0,
          quizzesPending: qPending || 0,
          ordersAwaiting: oAwaiting || 0,
          monthlyRevenue: revenue,
        });
      } catch (err) {
        console.error("Error fetching metrics", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>

      {loading ? (
        <p className="text-slate-500">Carregando métricas...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Hoje</CardTitle>
              <ClipboardList className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.quizzesToday}</div>
              <p className="text-xs text-slate-500">Questionários recebidos hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{metrics.quizzesPending}</div>
              <p className="text-xs text-slate-500">Aguardando avaliação médica</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos em Revisão</CardTitle>
              <Package className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{metrics.ordersAwaiting}</div>
              <p className="text-xs text-slate-500">Pedidos pagos aguardando análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(metrics.monthlyRevenue)}
              </div>
              <p className="text-xs text-slate-500">Volume transacionado no mês atual</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
