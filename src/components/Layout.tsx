import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Users, Wrench, MapPin, Settings, FileText, HelpCircle, 
  Menu, X, LogOut, ChevronRight, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  role?: "client" | "agent" | "coordinator" | "technician" | "admin";
}

const menuItems = {
  client: [
    { icon: Home, label: "Panel del Cliente", path: "/cliente" },
    { icon: FileText, label: "Órdenes de Servicio", path: "/cliente/ordenes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  agent: [
    { icon: Home, label: "Panel del Agente", path: "/agente" },
    { icon: Users, label: "Buscar Cliente", path: "/agente/buscar" },
    { icon: FileText, label: "Órdenes", path: "/agente/ordenes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  coordinator: [
    { icon: Home, label: "Panel del Coordinador", path: "/coordinador" },
    { icon: MapPin, label: "Asignar Órdenes", path: "/coordinador/asignar" },
    { icon: Wrench, label: "Técnicos", path: "/coordinador/tecnicos" },
    { icon: BarChart3, label: "Reportes", path: "/reportes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  technician: [
    { icon: Home, label: "Panel del Técnico", path: "/tecnico" },
    { icon: FileText, label: "Órdenes Asignadas", path: "/tecnico/ordenes" },
    { icon: Wrench, label: "Especialidades", path: "/tecnico/especialidades" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  admin: [
    { icon: Home, label: "Administración", path: "/admin" },
    { icon: Users, label: "Gestión de Usuarios", path: "/admin/usuarios" },
    { icon: Settings, label: "Herramientas", path: "/herramientas" },
    { icon: BarChart3, label: "Reportes", path: "/reportes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
};

export default function Layout({ children, role = "client" }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const items = menuItems[role];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block">
                Sistema de Gestión Técnica
              </span>
            </Link>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-16"
          )}
        >
          <nav className="space-y-1 p-4">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
