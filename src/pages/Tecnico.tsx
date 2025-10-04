import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { FileText, Play, Square, Camera, AlertCircle, CheckCircle, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Tecnico() {
  const mockOrders = [
    { id: "OS-010", client: "Juan Pérez", service: "Reparación PC", address: "Calle 123", priority: "Alta" },
    { id: "OS-015", client: "María García", service: "Instalación", address: "Av. Principal", priority: "Media" },
    { id: "OS-020", client: "Carlos López", service: "Mantenimiento", address: "Calle 45", priority: "Baja" },
  ];

  return (
    <Layout role="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Técnico</h1>
          <p className="text-muted-foreground">Gestiona tus servicios asignados</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Órdenes Asignadas</p>
              <p className="text-3xl font-bold">6</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <Play className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">En Progreso</p>
              <p className="text-3xl font-bold">2</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Completados Hoy</p>
              <p className="text-3xl font-bold">4</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-6">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Pendientes</p>
              <p className="text-3xl font-bold">3</p>
            </div>
          </Card>
        </div>

        <DashboardCard
          title="Órdenes Asignadas"
          description="Servicios pendientes de realizar"
          icon={FileText}
        >
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{order.id} - {order.service}</p>
                    <p className="text-sm text-muted-foreground">{order.client}</p>
                    <p className="text-sm text-muted-foreground">{order.address}</p>
                  </div>
                  <Badge variant={
                    order.priority === "Alta" ? "destructive" :
                    order.priority === "Media" ? "secondary" : "outline"
                  }>
                    {order.priority}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar
                  </Button>
                  <Button size="sm" variant="outline">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Gestión de Trabajo"
            description="Controla tu tiempo de servicio"
            icon={Square}
          >
            <div className="space-y-3">
              <Button className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Registrar Inicio de Trabajo
              </Button>
              <Button variant="destructive" className="w-full">
                <Square className="mr-2 h-4 w-4" />
                Registrar Fin de Trabajo
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Documentación"
            description="Registro de evidencias"
            icon={Camera}
          >
            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <Camera className="mr-2 h-4 w-4" />
                  Subir Fotos del Trabajo
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <FileText className="mr-2 h-4 w-4" />
                  Añadir Notas
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Reportar Impedimentos"
            description="Informa problemas encontrados"
            icon={AlertCircle}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tecnico/reportar-impedimento">
                <AlertCircle className="mr-2 h-4 w-4" />
                Reportar Problema
              </Link>
            </Button>
          </DashboardCard>

          <DashboardCard
            title="Mis Especialidades"
            description="Áreas de experiencia"
            icon={Wrench}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tecnico/especialidades">
                <Wrench className="mr-2 h-4 w-4" />
                Gestionar Especialidades
              </Link>
            </Button>
          </DashboardCard>
        </div>
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
