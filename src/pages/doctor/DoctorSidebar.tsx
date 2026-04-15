import { BarChart3, Calendar, User, DollarSign, Star, LogOut, Clock, Crown, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/config/support";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Visão Geral", url: "/dashboard/medico", icon: BarChart3 },
  { title: "Agendamentos", url: "/dashboard/medico/agendamentos", icon: Calendar },
  { title: "Minha Agenda", url: "/dashboard/medico/agenda", icon: Clock },
  { title: "Meu Perfil", url: "/dashboard/medico/perfil", icon: User },
  { title: "Financeiro", url: "/dashboard/medico/financeiro", icon: DollarSign },
  { title: "Avaliações", url: "/dashboard/medico/avaliacoes", icon: Star },
];

export default function DoctorSidebar({ doctorName, planType }: { doctorName: string | null, planType?: string | null }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarContent>
        <div className="flex items-center px-6 py-6 border-b border-slate-100">
          {!collapsed ? (
            <img src="/logo-pontea.png" alt="Pontea" className="h-10 md:h-14 w-auto object-contain mx-auto mb-6" />
          ) : (
            <img src="/logo-pontea.png" alt="Pontea" className="h-10 md:h-14 w-auto object-contain mx-auto mb-6" />
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 px-6 py-4 text-xs font-medium uppercase tracking-wider">Menu</SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center w-full py-3 px-4 rounded-[10px] text-sm transition-colors ${
                          active 
                            ? "bg-teal-50 text-teal-700 font-medium border-l-[3px] border-teal-600" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent"
                        }`}
                        activeClassName="bg-teal-50 text-teal-700 font-medium border-l-[3px] border-teal-600"
                      >
                        <item.icon className={`mr-3 h-5 w-5 ${active ? "text-teal-600" : "text-slate-400"}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100 p-4">
        {!collapsed ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{doctorName ?? "—"}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-slate-400">Médico</p>
                    {planType === "basic" && (
                      <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-[1px] text-[10px] font-medium text-slate-600 truncate">
                        Plano Básico
                      </span>
                    )}
                    {planType === "premium" && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-[1px] text-[10px] font-medium text-amber-700 truncate">
                        <Crown className="h-2.5 w-2.5 shrink-0" /> Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 px-2 flex flex-col gap-1">
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 transition-colors font-medium">
                <HelpCircle className="h-4 w-4" />
                Suporte
              </a>
              <p className="text-[10px] text-slate-400 pl-6">{SUPPORT_PHONE_DISPLAY}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button onClick={handleLogout} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-colors" title="Sair">
               <LogOut className="h-4 w-4" />
            </button>
            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-teal-600 transition-colors" title="Suporte">
              <HelpCircle className="h-4 w-4" />
            </a>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
