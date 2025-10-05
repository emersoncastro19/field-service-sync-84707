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
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/agente/detalles-orden">
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
