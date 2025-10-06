import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Users, Wrench, MapPin, Settings, FileText, HelpCircle, 
  Menu, X, LogOut, BarChart3, Bell, Calendar,
  Plus, History, Play, Camera, AlertCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  role?: "client" | "agent" | "coordinator" | "technician" | "admin";
}

const menuItems = {
  client: [
    { icon: Home, label: "Panel de Control", path: "/cliente" },
    { icon: FileText, label: "Órdenes de Servicio", path: "/cliente/ordenes" },
    { icon: Users, label: "Citas", path: "/cliente/citas" },
    { icon: Settings, label: "Perfil y Configuración", path: "/cliente/perfil", subItems: [
      { icon: Settings, label: "Perfil", path: "/cliente/perfil" },
      { icon: Settings, label: "Configuración", path: "/cliente/configuracion" },
    ]},
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  agent: [
    { icon: Home, label: "Órdenes Recientes", path: "/agente" },
    { icon: Users, label: "Buscar Clientes", path: "/agente/buscar" },
    { icon: Plus, label: "Crear Nueva Orden", path: "/agente/nueva-orden" },
    { icon: History, label: "Consultar Historial", path: "/agente/historial" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  coordinator: [
    { icon: Home, label: "Panel del Coordinador", path: "/coordinador" },
    { icon: Calendar, label: "Gestionar Citas de Servicio", path: "/coordinador/citas" },
    { icon: MapPin, label: "Asignar o Reasignar Órdenes", path: "/coordinador/asignar" },
    { icon: BarChart3, label: "Reportes", path: "/reportes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  technician: [
    { icon: Home, label: "Panel del Técnico", path: "/tecnico" },
    { icon: FileText, label: "Órdenes Asignadas", path: "/tecnico/ordenes" },
    { icon: Wrench, label: "Gestionar Ejecución de Servicio", path: "/tecnico/gestionar-ejecucion", subItems: [
      { icon: Play, label: "Iniciar/Finalizar Trabajo", path: "/tecnico/gestionar-ejecucion" },
      { icon: Camera, label: "Documentar Servicio", path: "/tecnico/documentar" },
    ]},
    { icon: AlertCircle, label: "Reportar Impedimentos", path: "/tecnico/reportar-impedimento" },
    { icon: Wrench, label: "Gestionar Especialidades", path: "/tecnico/especialidades" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
  admin: [
    { icon: Home, label: "Administración", path: "/admin" },
    { icon: Users, label: "Gestión de Usuarios", path: "/admin/usuarios" },
    { icon: Bell, label: "Motor de Notificaciones", path: "/admin/notificaciones" },
    { icon: Settings, label: "Herramientas", path: "/herramientas" },
    { icon: BarChart3, label: "Reportes", path: "/reportes" },
    { icon: HelpCircle, label: "Ayuda", path: "/ayuda" },
  ],
};

export default function Layout({ children, role = "client" }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const items = menuItems[role];

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

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
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Link>
            </Button>
          </div>
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
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.path);
              const isSubItemActive = hasSubItems && item.subItems?.some(sub => location.pathname === sub.path);
              
              return (
                <div key={item.path}>
                  {hasSubItems ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.path)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isSubItemActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded ? "rotate-180" : ""
                        )} />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                  isSubActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
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
                    </Link>
                  )}
                </div>
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
