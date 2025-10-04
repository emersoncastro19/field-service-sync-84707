import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Users, Bell, Shield, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración del Sistema</h1>
          <p className="text-muted-foreground">Gestiona usuarios, roles y configuraciones</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Total Usuarios</p>
              <p className="text-3xl font-bold">156</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Roles Activos</p>
              <p className="text-3xl font-bold">5</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-6">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Notificaciones Enviadas</p>
              <p className="text-3xl font-bold">1,234</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <Settings className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Sistema Activo</p>
              <p className="text-3xl font-bold">100%</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Gestión de Usuarios y Roles"
            description="Administrar usuarios del sistema"
            icon={Users}
          >
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/admin/usuarios">
                  <Users className="mr-2 h-4 w-4" />
                  Crear Nuevo Usuario
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/usuarios">Ver Todos los Usuarios</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/roles">Gestionar Roles y Permisos</Link>
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Motor de Notificaciones"
            description="Configurar y enviar notificaciones"
            icon={Bell}
          >
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/admin/notificaciones">
                  <Bell className="mr-2 h-4 w-4" />
                  Enviar Notificación
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/notificaciones">Configurar Plantillas</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/notificaciones">Ver Historial</Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard
          title="Auditoría del Sistema"
          description="Logs y reportes de actividad"
          icon={Shield}
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Ver Logs de Acceso</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Cambios en el Sistema</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Generar Reporte</Link>
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Selecciona una opción para ver los detalles de auditoría
              </p>
            </div>
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
