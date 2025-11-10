import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { BarChart3, TrendingUp, Users, AlertTriangle, FileText } from "lucide-react";
import { useAuth } from "@/frontend/context/AuthContext";

export default function Reportes() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Obtener el rol del usuario autenticado
  const getRole = (): "client" | "agent" | "coordinator" | "technician" | "admin" => {
    if (!usuario) {
      return 'client'; // Valor temporal mientras se carga
    }
    
    // Mapear tipo_usuario de la BD al formato del Layout
    const roleMap: Record<string, "client" | "agent" | "coordinator" | "technician" | "admin"> = {
      'Cliente': 'client',
      'Agente': 'agent',
      'Coordinador': 'coordinator',
      'Tecnico': 'technician',
      'Admin': 'admin'
    };
    
    return roleMap[usuario.tipo_usuario] || 'client';
  };

  // Redirigir al login si no hay usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usuario) {
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [usuario, navigate]);
  const reports = [
    {
      title: "Reporte de Órdenes por Estado",
      description: "Visualiza el estado de todas las órdenes de servicio",
      icon: FileText,
      stats: { total: 156, pendientes: 45, enProgreso: 32, completadas: 79 }
    },
    {
      title: "Reporte de Técnicos y Productividad",
      description: "Analiza el rendimiento de los técnicos",
      icon: TrendingUp,
      stats: { tecnicos: 12, promServDia: 4.5, eficiencia: "92%" }
    },
    {
      title: "Reporte de Clientes Activos/Inactivos",
      description: "Estado de la base de clientes",
      icon: Users,
      stats: { activos: 234, inactivos: 56, nuevos: 23 }
    },
    {
      title: "Reporte de Impedimentos y Resoluciones",
      description: "Seguimiento de problemas y soluciones",
      icon: AlertTriangle,
      stats: { total: 28, resueltos: 22, pendientes: 6, tiempoPromedio: "2.5h" }
    }
  ];

  return (
    <Layout role={getRole()}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Análisis y métricas del sistema</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <DashboardCard
                key={report.title}
                title={report.title}
                description={report.description}
                icon={Icon}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(report.stats).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-2xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Reporte Completo
                    </Button>
                    <Button variant="outline">Exportar</Button>
                  </div>
                </div>
              </DashboardCard>
            );
          })}
        </div>

        <DashboardCard
          title="Generar Reporte Personalizado"
          description="Crea reportes con filtros específicos"
          icon={BarChart3}
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline">Fecha de Inicio</Button>
              <Button variant="outline">Fecha de Fin</Button>
              <Button variant="outline">Tipo de Reporte</Button>
            </div>
            <Button className="w-full">
              Generar Reporte Personalizado
            </Button>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
