import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Share2, TrendingUp, Zap } from "lucide-react";

const benefits = [
  { icon: DollarSign, title: "Comissão Direta", desc: "Comissão por cada consulta agendada pelo seu link." },
  { icon: Share2, title: "Links Únicos", desc: "Links personalizados por especialidade e cidade." },
  { icon: TrendingUp, title: "Dashboard Transparente", desc: "Painel completo com cliques, conversões e ganhos em tempo real." },
  { icon: Zap, title: "Saque na Hora", desc: "Saques via PIX quando quiser." },
];

export default function ForAffiliatesPage() {
  const [followers, setFollowers] = useState(10000);
  const [conversionRate, setConversionRate] = useState([0.5]);
  const avgTicket = 300;
  const commission = 0.1;
  const estimatedMonthly = followers * (conversionRate[0] / 100) * avgTicket * commission;

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl font-heading">
          Monetize sua audiência indicando <span className="text-primary block mt-2">médicos de confiança</span>
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Se você é influenciador fitness, personal trainer, nutricionista ou coach de saúde, ganhe comissão por cada paciente que agendar uma consulta através do seu link.
        </p>
      </div>

      {/* Benefits */}
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        {benefits.map((b) => (
          <div key={b.title} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Simulator */}
      <div className="mx-auto mt-16 max-w-lg rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground">Simulador de Ganhos</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Seus seguidores</label>
            <Input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(Number(e.target.value))}
              min={0}
              className="bg-slate-50 border-slate-200 h-12 rounded-xl"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Taxa de conversão estimada: {conversionRate[0].toFixed(1)}%
            </label>
            <Slider min={0.1} max={5} step={0.1} value={conversionRate} onValueChange={setConversionRate} className="[&_[role=slider]]:bg-teal-600 [&_[role=slider]]:border-teal-600 [&_.bg-primary]:bg-teal-600" />
          </div>
          <div className="rounded-2xl bg-teal-50 border border-teal-100 p-6 text-center mt-6">
            <p className="text-sm font-medium text-teal-700 mb-1">Ganho mensal estimado</p>
            <p className="text-4xl font-heading font-extrabold text-teal-600">
              {estimatedMonthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>
        <Link to="/cadastro/afiliado">
          <Button className="mt-6 w-full" size="lg">Quero ser afiliado</Button>
        </Link>
      </div>
    </div>
  );
}
