import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, TrendingUp, Users, Shield } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { SchemaMarkup, getFAQSchema, getBreadcrumbSchema } from "@/components/SchemaMarkup";

const benefits = [
  { icon: TrendingUp, text: "Visibilidade para pacientes que já estão buscando sua especialidade" },
  { icon: Shield, text: "Perfil profissional completo com CRM verificado e avaliações" },
  { icon: Check, text: "Agenda integrada — pacientes agendam direto no seu Cal.com, Calendly ou WhatsApp" },
  { icon: Users, text: "Sem custo por clique — mensalidade fixa e previsível" },
];

const faqs = [
  { 
    q: "O que é a Pontea Saúde para médicos?", 
    a: "A Pontea Saúde é um marketplace médico que conecta profissionais de saúde a milhares de pacientes em busca de consultas particulares, oferecendo ferramentas de agendamento e visibilidade online." 
  },
  { 
    q: "Quanto custa anunciar meu consultório na Pontea?", 
    a: "Oferecemos planos a partir de R$ 79,90/mês para o perfil Básico e R$ 179,90/mês para o plano Premium com destaque na busca e consultas ilimitadas." 
  }
];

const plans = [
  {
    name: "Básico", price: "R$ 79,90", period: "/mês",
    features: ["Perfil no marketplace", "Receber agendamentos de pacientes", "Painel de agendamentos", "Até 50 consultas/mês"],
  },
  {
    name: "Premium", price: "R$ 179,90", period: "/mês", featured: true,
    features: ["Tudo do Básico", "Consultas ilimitadas", "Destaque no marketplace (aparece primeiro)", "Relatórios financeiros avançados", "Suporte prioritário", "Badge 'Recomendado'"],
  },
];

export default function ForDoctorsPage() {
  return (
    <div className="container py-16">
      <SEOHead 
        title="Para Médicos — Pontea Saúde"
        description="Cadastre seu perfil e receba novos pacientes todos os meses sem investir em marketing."
        canonical="https://ponteasaude.com.br/para-medicos"
      />
      <SchemaMarkup data={getFAQSchema(faqs)} />
      <SchemaMarkup data={getBreadcrumbSchema([
        { name: "Início", url: "/" },
        { name: "Para Médicos", url: "/para-medicos" }
      ])} />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl text-slate-900 font-heading">
          Receba novos pacientes <span className="text-primary block mt-2">todos os meses</span>
        </h1>
        <p className="mt-4 text-lg text-slate-500 font-medium">
          Crie sua conta gratuitamente e escolha um plano para começar a receber pacientes.
        </p>
        <p className="mt-2 text-lg text-slate-500">
          A Pontea Saúde é uma plataforma de marketing médico que conecta especialistas verificados a pacientes qualificados, permitindo que você aumente sua base de pacientes particulares sem investir em anúncios complexos.
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
                  Cadastrar meu consultório
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
