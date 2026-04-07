import { BarChart3, Link as LinkIcon, MousePointerClick, DollarSign, Wallet, LogOut } from "lucide-react";
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
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-slate-900 text-slate-100">
      <SidebarContent className="bg-[#0F172A]">
        {!collapsed && (
          <div className="px-4 py-4 border-b border-slate-800">
            <p className="text-xs text-slate-400">Afiliado</p>
            <p className="text-sm font-semibold text-slate-100 truncate">{affiliateName ?? "—"}</p>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`hover:bg-[#0D9488]/10 text-slate-200 transition-colors ${
                          active 
                            ? "bg-[#0D9488]/10 border-l-2 border-[#0D9488] text-[#0D9488] font-medium" 
                            : "border-l-2 border-transparent"
                        }`}
                        activeClassName="bg-[#0D9488]/10 text-[#0D9488] font-medium border-[#0D9488]"
                      >
                        <item.icon className={`mr-2 h-4 w-4 ${active ? "text-[#0D9488]" : "text-slate-400"}`} />
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
      <SidebarFooter className="bg-[#0F172A] border-t border-slate-800">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
