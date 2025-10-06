import Layout from "@/components/Layout";
import { FileText, Clock, CheckCircle, XCircle, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockOrders = [
  { id: "OS-001", service: "Reparación de PC", status: "completed", date: "2024-01-15", technician: "Juan Pérez" },
  { id: "OS-002", service: "Instalación de Software", status: "in_progress", date: "2024-01-20", technician: "María García" },
  { id: "OS-003", service: "Mantenimiento", status: "pending", date: "2024-01-22", technician: "Pendiente" },
  { id: "OS-004", service: "Soporte Técnico", status: "cancelled", date: "2024-01-18", technician: "N/A" },
];

const statusConfig = {
  completed: { label: "Completado", icon: CheckCircle, color: "bg-green-500" },
  in_progress: { label: "En Proceso", icon: Clock, color: "bg-blue-500" },
  pending: { label: "Pendiente", icon: Calendar, color: "bg-yellow-500" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500" },
};

export default function ClienteOrdenes() {
  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Órdenes de Servicio</h1>
          <p className="text-muted-foreground mt-2">Consulta el historial y estado de tus órdenes</p>
        </div>

        <div className="grid gap-4">
          {mockOrders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
            const statusLabel = statusConfig[order.status as keyof typeof statusConfig].label;
            
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {order.id}
                      </CardTitle>
                      <CardDescription>{order.service}</CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="font-medium">{order.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Técnico</p>
                      <p className="font-medium">{order.technician}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/cliente/detalles-orden?id=${order.id}`} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
