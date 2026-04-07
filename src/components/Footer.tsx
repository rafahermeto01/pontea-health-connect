import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-primary">Pontea</h3>
            <p className="text-sm text-muted-foreground">A ponte entre você e seu médico ideal.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Pacientes</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/buscar" className="hover:text-foreground">Buscar Médicos</Link>
              <Link to="/" className="hover:text-foreground">Como Funciona</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Profissionais</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/para-medicos" className="hover:text-foreground">Para Médicos</Link>
              <Link to="/para-afiliados" className="hover:text-foreground">Para Afiliados</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Conta</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground">Entrar</Link>
              <Link to="/cadastro/medico" className="hover:text-foreground">Cadastro Médico</Link>
              <Link to="/cadastro/afiliado" className="hover:text-foreground">Cadastro Afiliado</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pontea. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
