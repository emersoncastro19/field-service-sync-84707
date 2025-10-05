import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const historyOrders = [
  { id: "OS-001", client: "Juan Pérez", service: "Reparación", status: "Completado", date: "2024-01-15" },
  { id: "OS-002", client: "María García", service: "Instalación", status: "Completado", date: "2024-01-10" },
  { id: "OS-003", client: "Carlos López", service: "Mantenimiento", status: "Cancelado", date: "2024-01-05" },
  { id: "OS-004", client: "Ana Martínez", service: "Consultoría", status: "Completado", date: "2024-01-03" },
  { id: "OS-005", client: "Luis Rodríguez", service: "Reparación", status: "Completado", date: "2023-12-28" },
];

export default function Historial() {
  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Órdenes</h1>
          <p className="text-muted-foreground mt-2">Consulta todas las órdenes anteriores</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar en Historial
            </CardTitle>
            <CardDescription>Filtra por ID, cliente o fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Buscar..." className="flex-1" />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Órdenes Anteriores
            </CardTitle>
            <CardDescription>{historyOrders.length} órdenes encontradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historyOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-medium">{order.id} - {order.client}</p>
                      <p className="text-sm text-muted-foreground">{order.service}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {order.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        order.status === "Completado"
                          ? "default"
                          : order.status === "Cancelado"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/agente/detalles-orden">Ver Detalles</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
