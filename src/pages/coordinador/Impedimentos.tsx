import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const impediments = [
  {
    id: "IMP-001",
    order: "OS-015",
    technician: "Juan Pérez",
    issue: "Falta de repuestos necesarios",
    priority: "Alta",
    status: "Pendiente",
    date: "2024-01-15",
    description: "El técnico necesita un disco duro de 1TB que no está disponible en inventario."
  },
  {
    id: "IMP-002",
    order: "OS-018",
    technician: "María García",
    issue: "Cliente no disponible",
    priority: "Media",
    status: "En proceso",
    date: "2024-01-14",
    description: "El cliente no se encuentra en la dirección indicada y no responde llamadas."
  },
  {
    id: "IMP-003",
    order: "OS-022",
    technician: "Pedro López",
    issue: "Acceso restringido al área",
    priority: "Alta",
    status: "Pendiente",
    date: "2024-01-13",
    description: "Se requiere autorización especial para acceder al datacenter del cliente."
  },
];

export default function Impedimentos() {
  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Impedimentos</h1>
          <p className="text-muted-foreground mt-2">Resuelve problemas reportados por los técnicos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="p-6">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Pendientes</p>
              <p className="text-3xl font-bold">2</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">En Proceso</p>
              <p className="text-3xl font-bold">1</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Resueltos Hoy</p>
              <p className="text-3xl font-bold">5</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {impediments.map((imp) => (
            <Card key={imp.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {imp.id} - {imp.issue}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={imp.priority === "Alta" ? "destructive" : "secondary"}>
                      {imp.priority}
                    </Badge>
                    <Badge variant={imp.status === "Pendiente" ? "outline" : "default"}>
                      {imp.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Orden: {imp.order} | Técnico: {imp.technician} | Fecha: {imp.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{imp.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Solución / Notas</Label>
                    <Textarea placeholder="Describe la solución o acciones tomadas..." rows={3} />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Resuelto
                    </Button>
                    <Button variant="outline">Ver Detalles</Button>
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
