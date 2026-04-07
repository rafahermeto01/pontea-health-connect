import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Share2, TrendingUp, Zap } from "lucide-react";

const benefits = [
  { icon: DollarSign, title: "Comissão por Consulta", desc: "Ganhe até 10% por cada consulta agendada via seu link." },
  { icon: Share2, title: "Links Personalizados", desc: "Compartilhe links rastreáveis para cada médico do catálogo." },
  { icon: TrendingUp, title: "Dashboard Completo", desc: "Acompanhe cliques, conversões e ganhos em tempo real." },
  { icon: Zap, title: "Pagamento Rápido", desc: "Receba seus ganhos via PIX com saque mínimo de R$50." },
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
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Monetize sua audiência com a <span className="text-primary">Pontea</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Indique médicos de confiança e ganhe comissão por cada consulta
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
            <label className="mb-2 block text-sm font-medium text-foreground">Seguidores</label>
            <Input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(Number(e.target.value))}
              min={0}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Taxa de Conversão: {conversionRate[0].toFixed(1)}%
            </label>
            <Slider min={0.1} max={5} step={0.1} value={conversionRate} onValueChange={setConversionRate} />
          </div>
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm text-muted-foreground">Ganho mensal estimado</p>
            <p className="text-3xl font-extrabold text-primary">
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
