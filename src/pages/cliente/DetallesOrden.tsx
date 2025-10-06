import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Clock, CheckCircle, User, Calendar, MapPin, Wrench } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function ClienteDetallesOrden() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id") || "OS-001";

  // Mock data - en producción vendría de la base de datos
  const orderDetails = {
    id: orderId,
    service: "Reparación de PC",
    status: "completed",
    statusLabel: "Completado",
    date: "2024-01-15",
    technician: "Juan Pérez",
    technicianPhone: "+506 8888-1234",
    address: "San José, Costa Rica",
    description: "Reparación de computadora de escritorio. Problema con la fuente de poder y disco duro.",
    estimatedTime: "2-3 horas",
    actualTime: "2.5 horas",
    priority: "Media",
    notes: "Se reemplazó la fuente de poder y se actualizó el sistema operativo.",
  };

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente/ordenes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalles de la Orden</h1>
            <p className="text-muted-foreground mt-2">Información completa de la orden de servicio</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {orderDetails.id}
                    </CardTitle>
                    <CardDescription>{orderDetails.service}</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {orderDetails.statusLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Descripción del Servicio</h3>
                  <p className="text-sm text-muted-foreground">{orderDetails.description}</p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                    <p className="font-medium">{orderDetails.estimatedTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo Real</p>
                    <p className="font-medium">{orderDetails.actualTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prioridad</p>
                    <p className="font-medium">{orderDetails.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Servicio</p>
                    <p className="font-medium">{orderDetails.date}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-2">Notas del Técnico</h3>
                  <p className="text-sm text-muted-foreground">{orderDetails.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Técnico y Ubicación */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Técnico Asignado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{orderDetails.technician}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{orderDetails.technicianPhone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{orderDetails.address}</p>
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline" asChild>
              <Link to="/cliente/ordenes">
                Volver a Mis Órdenes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
