import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/">
              <img src="/logo-pontea.png" alt="Pontea" className="h-12 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              A tecnologia que aproxima médicos e pacientes, facilitando o acesso à saúde de qualidade em todo o Brasil.
            </p>
          </div>
          <div>
            <h4 className="mb-6 font-heading font-semibold text-white">Pacientes</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/buscar" className="transition-colors hover:text-primary">Encontrar Médico</Link>
              <Link to="/" className="transition-colors hover:text-primary">Especialidades</Link>
              <Link to="/" className="transition-colors hover:text-primary">Como Funciona</Link>
              <Link to="/" className="transition-colors hover:text-primary">Avaliações</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-heading font-semibold text-white">Profissionais</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/para-medicos" className="transition-colors hover:text-primary">Pontea para Médicos</Link>
              <Link to="/para-afiliados" className="transition-colors hover:text-primary">Programa de Afiliados</Link>
              <Link to="/cadastro/medico" className="transition-colors hover:text-primary">Cadastrar Perfil</Link>
              <Link to="/login" className="transition-colors hover:text-primary">Painel do Profissional</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-heading font-semibold text-white">Contato</h4>
            <div className="flex flex-col gap-3 text-sm text-slate-400">
              <p>suporte@pontea.com.br</p>
              <p>Segunda a Sexta, 09h às 18h</p>
              <div className="mt-4 flex gap-4">
                {/* Social placeholders could go here */}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Pontea Health. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
