import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart3, ClipboardList, Package, UserCheck, Users, LogOut } from "lucide-react";
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
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Visão Geral", url: "/admin", icon: BarChart3 },
  { title: "Quizzes", url: "/admin/quizzes", icon: ClipboardList },
  { title: "Pedidos", url: "/admin/pedidos", icon: Package },
  { title: "Médicos", url: "/admin/medicos", icon: UserCheck },
  { title: "Afiliados", url: "/admin/afiliados", icon: Users },
];

function AdminSidebar() {
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
          <img src="/logo-pontea.png" alt="Pontea" className="h-10 w-auto object-contain mx-auto mb-2" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 px-6 py-4 text-xs font-medium uppercase tracking-wider">Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={`flex items-center w-full py-3 px-4 rounded-[10px] text-sm transition-colors ${
                          active 
                            ? "bg-indigo-50 text-indigo-700 font-medium border-l-[3px] border-indigo-600" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent"
                        }`}
                      >
                        <item.icon className={`mr-3 h-5 w-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
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
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Administrador</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button onClick={handleLogout} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-colors" title="Sair">
               <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1).replace('-', ' ')
    : "Visão Geral";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F8FAFB]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400 hover:text-slate-600" />
              <div className="h-5 w-px bg-slate-200"></div>
              <div className="text-sm">
                <span className="text-slate-400">Admin</span>
                <span className="text-slate-300 mx-2">/</span>
                <span className="text-slate-700 font-medium">{currentPage}</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
