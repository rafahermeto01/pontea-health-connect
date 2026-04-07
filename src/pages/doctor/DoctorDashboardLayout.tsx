import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DoctorSidebar from "./DoctorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function DoctorDashboardLayout() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Perfil de médico não encontrado.</p>
        <button onClick={() => navigate("/login")} className="text-primary underline">Voltar para login</button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DoctorSidebar doctorName={doctor.full_name} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">Painel do Médico</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet context={{ doctor }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
