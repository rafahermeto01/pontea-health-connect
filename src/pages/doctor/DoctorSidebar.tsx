import { BarChart3, Calendar, User, DollarSign, Star, LogOut } from "lucide-react";
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
  { title: "Visão Geral", url: "/dashboard/medico", icon: BarChart3 },
  { title: "Agendamentos", url: "/dashboard/medico/agendamentos", icon: Calendar },
  { title: "Meu Perfil", url: "/dashboard/medico/perfil", icon: User },
  { title: "Financeiro", url: "/dashboard/medico/financeiro", icon: DollarSign },
  { title: "Avaliações", url: "/dashboard/medico/avaliacoes", icon: Star },
];

export default function DoctorSidebar({ doctorName }: { doctorName: string | null }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-4 border-b border-border">
            <p className="text-xs text-muted-foreground">Médico</p>
            <p className="text-sm font-semibold text-foreground truncate">{doctorName ?? "—"}</p>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                        className={`hover:bg-primary/10 ${active ? "bg-primary/10 border-l-2 border-primary text-primary font-medium" : ""}`}
                        activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
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
      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
