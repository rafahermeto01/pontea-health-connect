import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navLinks = [
  { label: "Buscar Médicos", href: "/buscar" },
  { label: "Para Médicos", href: "/para-medicos" },
  { label: "Para Afiliados", href: "/para-afiliados" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="container flex min-h-[72px] md:min-h-[80px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <img src="/logo-pontea.png" alt="Pontea - Saúde que Conecta" className="h-12 md:h-16 w-auto object-contain py-3" />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link 
              key={l.href} 
              to={l.href} 
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login">
            <Button variant="ghost" className="text-slate-600 hover:text-primary">Entrar</Button>
          </Link>
          <Link to="/cadastro/medico">
            <Button className="bg-primary text-white hover:bg-primary/90">Começar Agora</Button>
          </Link>
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white">
            <SheetTitle className="text-left font-heading font-bold text-slate-900">Menu</SheetTitle>
            <div className="mt-8 flex flex-col gap-6">
              {navLinks.map((l) => (
                <Link 
                  key={l.href} 
                  to={l.href} 
                  onClick={() => setOpen(false)} 
                  className="text-lg font-medium text-slate-700 hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
              <hr className="border-slate-100" />
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-slate-200 text-slate-700">Entrar</Button>
              </Link>
              <Link to="/cadastro/medico" onClick={() => setOpen(false)}>
                <Button className="w-full bg-primary text-white">Começar Agora</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
