import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XCircle, Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CancelarOrden() {
  return (
    <Layout role="agent">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cancelar Orden de Servicio</h1>
          <p className="text-muted-foreground mt-2">Gestiona la cancelación de órdenes</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription>
            La cancelación de una orden es una acción importante. Asegúrate de documentar la razón correctamente.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Orden
            </CardTitle>
            <CardDescription>Ingresa el ID de la orden a cancelar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="ID de la orden (Ej: OS-001)" className="flex-1" />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Orden</CardTitle>
            <CardDescription>Verifica la información antes de cancelar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">OS-001</p>
                  <Badge>En progreso</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Cliente: Juan Pérez</p>
                <p className="text-sm text-muted-foreground">Servicio: Reparación de PC</p>
                <p className="text-sm text-muted-foreground">Fecha: 2024-01-15</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de Cancelación</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe el motivo de la cancelación..."
                  rows={5}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="destructive" className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Orden
                </Button>
                <Button variant="outline">Volver</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
