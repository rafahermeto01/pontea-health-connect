import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliate } from "@/hooks/useAffiliate";
import AffiliateSidebar from "./AffiliateSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function AffiliateDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { affiliate, loading } = useAffiliate();

  // Generate a simple breadcrumb from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 2 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1).replace('-', ' ')
    : "Visão Geral";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/login");
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
        <p className="text-slate-500">Perfil de afiliado não encontrado.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F8FAFB]">
        <AffiliateSidebar affiliateName={affiliate.full_name} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400 hover:text-slate-600" />
              <div className="h-5 w-px bg-slate-200"></div>
              <div className="text-sm">
                <span className="text-slate-400">Painel do Afiliado</span>
                <span className="text-slate-300 mx-2">/</span>
                <span className="text-slate-700 font-medium">{currentPage}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border border-slate-100 p-1.5 pr-4 rounded-full bg-slate-50">
               <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold font-heading">
                 {affiliate.full_name?.charAt(0).toUpperCase() || 'A'}
               </div>
               <span className="text-sm font-medium text-slate-700">{affiliate.full_name?.split(' ')[0]}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              <Outlet context={{ affiliate }} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
