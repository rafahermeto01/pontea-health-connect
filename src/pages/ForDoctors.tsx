import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, TrendingUp, Users, Shield } from "lucide-react";

const benefits = [
  { icon: TrendingUp, text: "Pacientes que chegam já motivados e informados" },
  { icon: Users, text: "Sem custo por clique — pague apenas a mensalidade" },
  { icon: Shield, text: "Perfil profissional com CRM verificado e avaliações" },
  { icon: Check, text: "Agenda integrada com Cal.com, Calendly ou WhatsApp" },
];

const plans = [
  {
    name: "Básico", price: "R$ 149", period: "/mês",
    features: ["Perfil no marketplace", "Até 30 agendamentos/mês", "Link personalizado", "Suporte por email"],
  },
  {
    name: "Pro", price: "R$ 399", period: "/mês", featured: true,
    features: ["Tudo do Básico", "Agendamentos ilimitados", "Destaque na busca", "Analytics avançado", "Suporte prioritário", "Badge 'Recomendado'"],
  },
];

export default function ForDoctorsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl text-slate-900 font-heading">
          Receba pacientes qualificados <span className="text-primary block mt-2">sem gastar com marketing</span>
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Na Pontea, influenciadores e profissionais de saúde indicam a plataforma para milhares de seguidores. Você só precisa cadastrar seu perfil e atender.
        </p>
      </div>

      {/* Benefits */}
      <div className="mx-auto mt-12 grid max-w-2xl gap-6">
        {benefits.map((b) => (
          <div key={b.text} className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-foreground">{b.text}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Planos</h2>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-6 ${plan.featured ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/cadastro/medico">
                <Button className="mt-6 w-full" variant={plan.featured ? "default" : "outline"}>
                  Começar agora
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
