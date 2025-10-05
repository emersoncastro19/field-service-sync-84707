import Layout from "@/components/Layout";
import { FileText, Clock, CheckCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockOrders = [
  { id: "OS-101", client: "Carlos Rodríguez", service: "Reparación de PC", status: "in_progress", date: "2024-01-20" },
  { id: "OS-102", client: "Ana Martínez", service: "Instalación", status: "pending", date: "2024-01-22" },
  { id: "OS-103", client: "Luis González", service: "Mantenimiento", status: "completed", date: "2024-01-18" },
];

export default function AgenteOrdenes() {
  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Órdenes de Servicio</h1>
            <p className="text-muted-foreground mt-2">Gestiona las órdenes de servicio creadas</p>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        <div className="grid gap-4">
          {mockOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{order.id}</CardTitle>
                    <CardDescription>Cliente: {order.client}</CardDescription>
                  </div>
                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                    {order.status === "completed" ? "Completado" : 
                     order.status === "in_progress" ? "En Proceso" : "Pendiente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Servicio</p>
                    <p className="font-medium">{order.service}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium">{order.date}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/agente/detalles-orden">Ver Detalles</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
