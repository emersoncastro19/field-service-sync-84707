import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";

const appointments = [
  {
    id: "CITA-001",
    order: "OS-010",
    client: "Juan Pérez",
    technician: "Pedro Martínez",
    date: "2024-01-16",
    time: "09:00 AM",
    address: "Calle 123, San José",
    status: "Confirmada"
  },
  {
    id: "CITA-002",
    order: "OS-015",
    client: "María García",
    technician: "Ana Rodríguez",
    date: "2024-01-16",
    time: "11:00 AM",
    address: "Av. Central, Heredia",
    status: "Pendiente"
  },
  {
    id: "CITA-003",
    order: "OS-020",
    client: "Carlos López",
    technician: "Luis Fernández",
    date: "2024-01-16",
    time: "02:00 PM",
    address: "Residencial Los Álamos",
    status: "Confirmada"
  },
  {
    id: "CITA-004",
    order: "OS-025",
    client: "Ana Martínez",
    technician: "Pedro Martínez",
    date: "2024-01-17",
    time: "10:00 AM",
    address: "Calle 45, Cartago",
    status: "Reprogramada"
  },
];

export default function Citas() {
  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Citas</h1>
            <p className="text-muted-foreground mt-2">Calendario de servicios programados</p>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Hoy</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <User className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <MapPin className="h-8 w-8 mb-2 text-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">4</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {apt.id} - Orden {apt.order}
                  </CardTitle>
                  <Badge
                    variant={
                      apt.status === "Confirmada"
                        ? "default"
                        : apt.status === "Pendiente"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
                <CardDescription>Cliente: {apt.client}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Técnico: {apt.technician}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{apt.date} a las {apt.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{apt.address}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Editar Cita
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Reprogramar
                    </Button>
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
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
