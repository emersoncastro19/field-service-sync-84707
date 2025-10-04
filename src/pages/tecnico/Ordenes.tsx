import Layout from "@/components/Layout";
import { FileText, MapPin, User, Calendar, Play, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const assignedOrders = [
  { 
    id: "OS-301", 
    client: "Carlos Rodríguez", 
    service: "Reparación de PC",
    address: "Calle Principal 123",
    date: "2024-01-22",
    status: "assigned"
  },
  { 
    id: "OS-302", 
    client: "Ana Martínez", 
    service: "Instalación de Software",
    address: "Av. Secundaria 456",
    date: "2024-01-23",
    status: "in_progress"
  },
];

export default function TecnicoOrdenes() {
  return (
    <Layout role="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes Asignadas</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus órdenes de servicio</p>
        </div>

        <div className="grid gap-4">
          {assignedOrders.map((order) => (
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
                  <Badge variant={order.status === "in_progress" ? "default" : "secondary"}>
                    {order.status === "in_progress" ? "En Proceso" : "Asignada"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{order.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{order.address}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {order.status === "assigned" ? (
                      <Button className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Trabajo
                      </Button>
                    ) : (
                      <Button className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Trabajo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
