import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Bell, CheckCircle, User, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Cliente() {
  const mockOrders = [
    { id: "OS-001", service: "Reparación de PC", status: "En progreso", date: "2024-01-15" },
    { id: "OS-002", service: "Instalación de Software", status: "Completado", date: "2024-01-10" },
    { id: "OS-003", service: "Mantenimiento", status: "Pendiente", date: "2024-01-20" },
  ];

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de control</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Órdenes Activas</p>
              <p className="text-3xl font-bold">3</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Próximas Citas</p>
              <p className="text-3xl font-bold">2</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Completados</p>
              <p className="text-3xl font-bold">12</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-6">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Notificaciones</p>
              <p className="text-3xl font-bold">5</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Crear Nueva Orden"
            description="Solicita un nuevo servicio técnico"
            icon={Plus}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas un servicio técnico? Crea una nueva orden de servicio y nuestro equipo se pondrá en contacto contigo.
              </p>
              <Button className="w-full" asChild>
                <Link to="/cliente/nueva-orden">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden de Servicio
                </Link>
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Actualizar Datos Personales"
            description="Mantén tu información actualizada"
            icon={User}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Actualiza tu información de contacto, dirección y preferencias de notificación.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/cliente/perfil">
                  <User className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard
          title="Mis Órdenes de Servicio"
          description="Historial de servicios solicitados"
          icon={FileText}
        >
          <div className="space-y-3">
            <div className="flex justify-end gap-2 pb-2">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte Individual
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Reporte por Fecha
              </Button>
            </div>
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{order.id} - {order.service}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
                <Badge
                  variant={
                    order.status === "Completado"
                      ? "default"
                      : order.status === "En progreso"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}
