import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const mockCitas = [
  { 
    id: "CITA-001", 
    orderId: "OS-001", 
    service: "Reparación de PC", 
    date: "2024-01-20",
    time: "10:00 AM",
    technician: "Pedro Martínez",
    address: "Calle 123, Ciudad",
    status: "Pendiente"
  },
  { 
    id: "CITA-002", 
    orderId: "OS-003", 
    service: "Mantenimiento", 
    date: "2024-01-25",
    time: "2:00 PM",
    technician: "Ana Rodríguez",
    address: "Av. Principal 456, Ciudad",
    status: "Confirmada"
  },
];

export default function ClienteCitas() {
  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">Citas de servicio programadas</p>
        </div>

        <div className="grid gap-4">
          {mockCitas.map((cita) => (
            <Card key={cita.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {cita.service}
                    </CardTitle>
                    <CardDescription>Orden: {cita.orderId}</CardDescription>
                  </div>
                  <Badge variant={cita.status === "Confirmada" ? "default" : "secondary"}>
                    {cita.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha
                      </p>
                      <p className="font-medium">{cita.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hora
                      </p>
                      <p className="font-medium">{cita.time}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Técnico
                      </p>
                      <p className="font-medium">{cita.technician}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Dirección
                      </p>
                      <p className="font-medium">{cita.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="mr-2 h-4 w-4" />
                          Reprogramar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reprogramar Cita</DialogTitle>
                          <DialogDescription>
                            Selecciona una nueva fecha para tu cita de servicio
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-date">Nueva Fecha</Label>
                            <Input id="new-date" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-time">Nueva Hora</Label>
                            <Input id="new-time" type="time" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reason">Motivo (Opcional)</Label>
                            <Input id="reason" placeholder="Motivo de la reprogramación" />
                          </div>
                          <Button className="w-full">Confirmar Reprogramación</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost">Ver Detalles</Button>
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
