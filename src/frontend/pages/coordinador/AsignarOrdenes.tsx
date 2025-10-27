import Layout from "@/frontend/components/Layout";
import { MapPin, User, FileText } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

const pendingOrders = [
  { id: "OS-201", client: "Carlos R.", service: "Reparación", location: "Zona Norte" },
  { id: "OS-202", client: "Ana M.", service: "Instalación", location: "Zona Sur" },
  { id: "OS-203", client: "Luis G.", service: "Mantenimiento", location: "Zona Este" },
];

const technicians = [
  { id: "T001", name: "Juan Pérez", specialty: "Reparación", zone: "Norte" },
  { id: "T002", name: "María García", specialty: "Instalación", zone: "Sur" },
  { id: "T003", name: "Pedro López", specialty: "Mantenimiento", zone: "Este" },
];

export default function AsignarOrdenes() {
  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asignar Órdenes</h1>
          <p className="text-muted-foreground mt-2">Asigna órdenes pendientes a técnicos disponibles</p>
        </div>

        <div className="grid gap-4">
          {pendingOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {order.id}
                </CardTitle>
                <CardDescription>Cliente: {order.client} - {order.service}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {order.location}
                    </div>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name} - {tech.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Asignar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
