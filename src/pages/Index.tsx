import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, 
  Users, 
  CalendarCheck, 
  Activity, 
  Brain, 
  Bone, 
  Heart, 
  Apple, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";

const howItWorks = [
  { 
    id: "01",
    title: "Encontre seu Médico", 
    desc: "Procure por especialidade, localização ou nome. Filtre por quem aceita seu convênio.",
    icon: Stethoscope 
  },
  { 
    id: "02",
    title: "Compare Avaliações", 
    desc: "Veja a experiência real de outros pacientes para escolher com total segurança.",
    icon: Star 
  },
  { 
    id: "03",
    title: "Agende Online", 
    desc: "Escolha o melhor horário na agenda do médico e confirme em segundos.",
    icon: CalendarCheck 
  },
];

const specialtiesData = [
  { icon: Activity, name: "Endocrinologia", count: "124 médicos" },
  { icon: Apple, name: "Nutrologia", count: "86 médicos" },
  { icon: Sparkles, name: "Dermatologia", count: "210 médicos" },
  { icon: Brain, name: "Psiquiatria", count: "95 médicos" },
  { icon: Bone, name: "Ortopedia", count: "112 médicos" },
  { icon: Heart, name: "Nutrição", count: "156 médicos" },
];

const features = [
  { title: "Médicos Verificados", desc: "Todos os profissionais possuem CRM ativo e histórico verificado.", icon: ShieldCheck },
  { title: "Avaliações Reais", desc: "Feedback autêntico de pacientes que realmente realizaram consultas.", icon: Star },
  { title: "Agendamento 24h", desc: "Marque sua consulta a qualquer hora, de qualquer lugar, pelo celular.", icon: CalendarCheck },
  { title: "Programa de Indicação", desc: "Ganhe benefícios ao indicar novos pacientes ou médicos parceiros.", icon: UserPlus },
];

// Reusing UserPlus from Lucide
import { UserPlus } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-0 font-body">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Saúde simplificada no Brasil</span>
          </div>
          
          <h1 className="mx-auto max-w-4xl font-heading text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl">
            A ponte entre você e seu <br />
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">médico ideal</span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-xl text-slate-500 leading-relaxed">
            Agende consultas com os melhores especialistas, veja avaliações reais e gerencie sua saúde de forma simples e segura.
          </p>
          
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to="/buscar">
              <Button size="lg" className="h-14 rounded-xl bg-primary px-8 text-lg font-bold shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] hover:bg-primary/90">
                Encontrar Médico
              </Button>
            </Link>
            <Link to="/para-medicos">
              <Button size="lg" variant="outline" className="h-14 rounded-xl border-2 border-primary px-8 text-lg font-bold text-primary transition-all hover:scale-[1.02] hover:bg-teal-50">
                Sou Profissional
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>+2.500 Médicos Verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>50+ Especialidades</span>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="bg-slate-50/80 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">Como Funciona</h2>
            <p className="mt-4 text-slate-500">Três passos simples para cuidar da sua saúde</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.id} className="group relative flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-md">
                <span className="absolute top-4 right-6 font-heading text-4xl font-black text-teal-600 opacity-10 group-hover:opacity-20 transition-opacity">
                  {item.id}
                </span>
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-primary transition-transform group-hover:scale-110">
                  <item.icon className="h-10 w-10" />
                </div>
                <h3 className="mb-3 font-heading text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades Section */}
      <section className="container py-24">
        <div className="mb-16 flex items-end justify-between">
          <div className="text-left">
            <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">Especialidades em Destaque</h2>
            <p className="mt-4 text-slate-500">Os profissionais mais buscados da nossa rede</p>
          </div>
          <Link to="/buscar" className="hidden items-center gap-2 text-primary font-bold hover:underline md:flex">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specialtiesData.map((s) => (
            <Link
              key={s.name}
              to={`/buscar?esp=${encodeURIComponent(s.name)}`}
              className="flex items-center gap-5 rounded-2xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-primary/40 hover:bg-teal-50/30 hover:shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-primary">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-bold text-slate-900">{s.name}</span>
                <span className="text-sm text-slate-400">{s.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Por que a Pontea Section */}
      <section className="bg-white py-24">
        <div className="container">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl leading-tight">
                Por que escolher a Pontea para sua saúde?
              </h2>
              <p className="mt-6 text-lg text-slate-500 leading-relaxed">
                Nascemos para resolver a burocracia do agendamento médico. Nossa plataforma garante segurança para pacientes e visibilidade para médicos.
              </p>
              
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-primary">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-heading font-bold text-slate-900">{f.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-teal-100/50 blur-2xl" />
              <div className="relative aspect-square overflow-hidden rounded-3xl border-8 border-white bg-slate-50 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-217359f4ecf8?auto=format&fit=crop&q=80&w=800" 
                  alt="Doctor at work" 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-24">
        <div className="rounded-[32px] bg-primary px-8 py-16 text-center text-white shadow-2xl shadow-teal-900/20 md:px-16 md:py-24">
          <h2 className="mx-auto max-w-2xl font-heading text-4xl font-black md:text-5xl leading-tight">
            Pronto para encontrar o médico certo para você?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-teal-50 opacity-90">
            Junte-se a milhares de pacientes que já transformaram seu acesso à saúde com a Pontea.
          </p>
          <div className="mt-10">
            <Link to="/buscar">
              <Button size="lg" className="h-16 rounded-2xl bg-white px-10 text-xl font-black text-primary hover:bg-teal-50 transition-all hover:scale-[1.05]">
                Agendar Minha Consulta
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
