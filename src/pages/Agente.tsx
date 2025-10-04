import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, History, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Agente() {
  const mockOrders = [
    { id: "OS-001", client: "Juan Pérez", service: "Reparación", status: "En progreso" },
    { id: "OS-002", client: "María García", service: "Instalación", status: "Completado" },
    { id: "OS-003", client: "Carlos López", service: "Mantenimiento", status: "Pendiente" },
  ];

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Agente de Servicio</h1>
          <p className="text-muted-foreground">Gestiona las órdenes de servicio y clientes</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Buscar y Validar Cliente"
            description="Encuentra información del cliente"
            icon={Search}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre, ID o teléfono..."
                  className="flex-1"
                />
                <Button>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Ingresa los datos del cliente para buscar
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Crear Nueva Orden de Servicio"
            description="Registra una nueva solicitud"
            icon={Plus}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="ID del Cliente" />
                <Input placeholder="Tipo de Servicio" />
                <Input placeholder="Descripción del problema" />
              </div>
              <Button className="w-full" asChild>
                <Link to="/agente/nueva-orden">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard
          title="Órdenes de Servicio Recientes"
          description="Últimas órdenes creadas"
          icon={FileText}
        >
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{order.id} - {order.client}</p>
                  <p className="text-sm text-muted-foreground">{order.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "Completado" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Consultar Historial"
            description="Ver órdenes anteriores"
            icon={History}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/agente/historial">
                <History className="mr-2 h-4 w-4" />
                Ver Historial Completo
              </Link>
            </Button>
          </DashboardCard>

          <DashboardCard
            title="Cancelar Órdenes"
            description="Gestionar cancelaciones"
            icon={XCircle}
          >
            <Button variant="destructive" className="w-full" asChild>
              <Link to="/agente/cancelar-orden">
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Orden
              </Link>
            </Button>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
