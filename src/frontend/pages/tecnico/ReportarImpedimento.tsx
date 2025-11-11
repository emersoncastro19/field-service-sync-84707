import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Label } from "@/frontend/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ReportarImpedimento() {
  return (
    <Layout role="technician">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportar Impedimento</h1>
          <p className="text-muted-foreground mt-2">Informa sobre problemas que impiden completar el servicio</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Reporta cualquier situación que impida o retrase la ejecución del servicio. El coordinador será notificado inmediatamente.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Información del Impedimento
            </CardTitle>
            <CardDescription>Completa los detalles del problema</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="order-id">ID de la Orden</Label>
                <Input id="order-id" placeholder="OS-001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impediment-type">Tipo de Impedimento</Label>
                <Select>
                  <SelectTrigger id="impediment-type">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repuestos">Falta de repuestos</SelectItem>
                    <SelectItem value="cliente">Cliente no disponible</SelectItem>
                    <SelectItem value="acceso">Problemas de acceso</SelectItem>
                    <SelectItem value="herramientas">Falta de herramientas</SelectItem>
                    <SelectItem value="tecnico">Problema técnico complejo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Problema</Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente el impedimento encontrado..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested-solution">Solución Sugerida (Opcional)</Label>
                <Textarea
                  id="suggested-solution"
                  placeholder="Si tienes alguna sugerencia para resolver el problema..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="destructive" className="flex-1">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Reportar Impedimento
                </Button>
                <Button type="button" variant="outline">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
