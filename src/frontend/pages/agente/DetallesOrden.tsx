import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { 
  FileText, User, Calendar, MapPin, Phone, Mail, 
  Clock, AlertCircle, XCircle 
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/frontend/components/ui/alert-dialog";

// Mock data - en producción vendría de la URL o estado
const mockOrden = {
  id: "OS-101",
  client: {
    name: "Carlos Rodríguez",
    phone: "+505 8888-8888",
    email: "carlos@ejemplo.com",
    address: "Calle Principal #123, Managua"
  },
  service: "Reparación de PC",
  description: "Computadora no enciende, posible problema con fuente de poder",
  priority: "Alta",
  status: "in_progress",
  createdDate: "2024-01-15",
  scheduledDate: "2024-01-20",
  assignedTechnician: "Pedro Martínez",
  equipment: "Dell Inspiron 15",
  notes: "Cliente disponible en horario de tarde"
};

export default function DetallesOrden() {
  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalles de Orden</h1>
            <p className="text-muted-foreground mt-2">Información completa de la orden de servicio</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/agente/ordenes">Volver a Órdenes</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {mockOrden.id}
                    </CardTitle>
                    <CardDescription>{mockOrden.service}</CardDescription>
                  </div>
                  <Badge variant={mockOrden.status === "in_progress" ? "default" : "secondary"}>
                    {mockOrden.status === "in_progress" ? "En Proceso" : "Pendiente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Descripción del Servicio</h3>
                  <p className="text-muted-foreground">{mockOrden.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Creación
                    </p>
                    <p className="font-medium">{mockOrden.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Fecha Programada
                    </p>
                    <p className="font-medium">{mockOrden.scheduledDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Prioridad
                    </p>
                    <Badge variant={mockOrden.priority === "Alta" ? "destructive" : "default"}>
                      {mockOrden.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equipo</p>
                    <p className="font-medium">{mockOrden.equipment}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Técnico Asignado</h3>
                  <p className="text-muted-foreground">{mockOrden.assignedTechnician}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Notas Adicionales</h3>
                  <p className="text-muted-foreground">{mockOrden.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{mockOrden.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </p>
                  <p className="font-medium">{mockOrden.client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correo
                  </p>
                  <p className="font-medium text-sm">{mockOrden.client.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </p>
                  <p className="font-medium text-sm">{mockOrden.client.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Zona de Acción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Orden
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción cancelará la orden de servicio {mockOrden.id}. 
                        Esta operación no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground">
                        Confirmar Cancelación
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
