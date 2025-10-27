import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/frontend/hooks/use-toast";

const mockOrdenesCompletadas = [
  { 
    id: "OS-002", 
    service: "Instalación de Software", 
    technician: "Pedro Martínez",
    date: "2024-01-15",
    description: "Instalación completa de software empresarial y configuración de red",
    requiresConfirmation: true
  },
];

export default function ConfirmacionServicio() {
  const [comentario, setComentario] = useState("");
  const { toast } = useToast();

  const handleConfirmarFinalizacion = (orderId: string) => {
    toast({
      title: "Servicio Confirmado",
      description: "Has confirmado la finalización del servicio exitosamente.",
    });
  };

  const handleReportarProblema = (orderId: string) => {
    toast({
      title: "Problema Reportado",
      description: "Tu reporte ha sido enviado al equipo de coordinación.",
      variant: "destructive",
    });
  };

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Confirmación de Servicio</h1>
          <p className="text-muted-foreground mt-2">Confirma la finalización de los servicios completados</p>
        </div>

        <div className="grid gap-6">
          {mockOrdenesCompletadas.map((orden) => (
            <Card key={orden.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {orden.service}
                    </CardTitle>
                    <CardDescription>Orden: {orden.id}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendiente de Confirmación
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Técnico</p>
                        <p className="font-medium">{orden.technician}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha de Finalización</p>
                        <p className="font-medium">{orden.date}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Descripción del Servicio</p>
                      <p className="font-medium mt-1">{orden.description}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirmación del Cliente
                    </p>
                    <p className="text-sm text-muted-foreground">
                      El técnico ha completado el trabajo. Por favor confirme que el servicio fue realizado satisfactoriamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`comentario-${orden.id}`}>
                      Comentarios (Opcional)
                    </Label>
                    <Textarea
                      id={`comentario-${orden.id}`}
                      placeholder="Agregue cualquier comentario sobre el servicio recibido..."
                      rows={4}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1"
                      onClick={() => handleConfirmarFinalizacion(orden.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar Finalización
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleReportarProblema(orden.id)}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Reportar un Problema
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
