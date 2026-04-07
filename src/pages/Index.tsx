import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, Users, CalendarCheck, Activity, Brain, Bone, Heart, Apple, Sparkles } from "lucide-react";

const howItWorks = [
  { icon: Stethoscope, title: "Médico", desc: "Cadastra seu perfil, define valores e conecta sua agenda online." },
  { icon: Users, title: "Afiliado", desc: "Divulga médicos para sua audiência e ganha comissão por consulta." },
  { icon: CalendarCheck, title: "Paciente", desc: "Encontra o especialista ideal, compara avaliações e agenda consulta." },
];

const specialtiesData = [
  { icon: Activity, name: "Endocrinologia" },
  { icon: Apple, name: "Nutrologia" },
  { icon: Sparkles, name: "Dermatologia" },
  { icon: Brain, name: "Psiquiatria" },
  { icon: Bone, name: "Ortopedia" },
  { icon: Heart, name: "Nutrição" },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center py-20 text-center lg:py-32">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          A ponte entre você e seu{" "}
          <span className="text-primary">médico</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Encontre especialistas avaliados por quem você confia
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/buscar">
            <Button size="lg" className="text-base">Encontrar Médico</Button>
          </Link>
          <Link to="/para-medicos">
            <Button size="lg" variant="outline" className="text-base">Sou Médico</Button>
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-border bg-card py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">Como Funciona</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.title} className="flex flex-col items-center rounded-lg border border-border bg-background p-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="container py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">Especialidades em Destaque</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {specialtiesData.map((s) => (
            <Link
              key={s.name}
              to={`/buscar?esp=${encodeURIComponent(s.name)}`}
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <s.icon className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
