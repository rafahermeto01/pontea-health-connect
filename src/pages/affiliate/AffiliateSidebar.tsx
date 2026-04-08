import { BarChart3, Link as LinkIcon, MousePointerClick, DollarSign, Wallet, LogOut, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  { title: "Visão Geral", url: "/dashboard/afiliado", icon: BarChart3 },
  { title: "Gerar Links", url: "/dashboard/afiliado/links", icon: LinkIcon },
  { title: "Meus Links", url: "/dashboard/afiliado/meus-links", icon: MousePointerClick },
  { title: "Comissões", url: "/dashboard/afiliado/comissoes", icon: DollarSign },
  { title: "Saques", url: "/dashboard/afiliado/saques", icon: Wallet },
];

export default function AffiliateSidebar({ affiliateName }: { affiliateName: string | null }) {
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
            <img src="/logo-pontea.png" alt="Pontea" className="h-8 w-auto" />
          ) : (
            <img src="/logo-pontea.png" alt="Pontea" className="h-8 w-auto mx-auto" />
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
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{affiliateName ?? "—"}</p>
                <p className="text-xs text-slate-400">Afiliado</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-colors" title="Sair">
             <LogOut className="h-4 w-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
