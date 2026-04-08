import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DoctorSidebar from "./DoctorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function DoctorDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate a simple breadcrumb from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 2 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1).replace('-', ' ')
    : "Visão Geral";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setDoctor(data);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFB] gap-4">
        <p className="text-slate-500">Perfil de médico não encontrado.</p>
        <button onClick={() => navigate("/login")} className="text-teal-600 hover:text-teal-700 underline font-medium">Voltar para login</button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F8FAFB]">
        <DoctorSidebar doctorName={doctor.full_name} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400 hover:text-slate-600" />
              <div className="h-5 w-px bg-slate-200"></div>
              <div className="text-sm">
                <span className="text-slate-400">Painel do Médico</span>
                <span className="text-slate-300 mx-2">/</span>
                <span className="text-slate-700 font-medium">{currentPage}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border border-slate-100 p-1.5 pr-4 rounded-full bg-slate-50">
               <img src={doctor.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
               <span className="text-sm font-medium text-slate-700">{doctor.full_name?.split(' ')[0]}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              <Outlet context={{ doctor }} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
