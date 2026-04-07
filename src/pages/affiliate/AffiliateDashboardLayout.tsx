import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliate } from "@/hooks/useAffiliate";
import AffiliateSidebar from "./AffiliateSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function AffiliateDashboardLayout() {
  const navigate = useNavigate();
  const { affiliate, loading } = useAffiliate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/login");
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Perfil de afiliado não encontrado.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AffiliateSidebar affiliateName={affiliate.full_name} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">Painel do Afiliado</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet context={{ affiliate }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
