import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Camera, FileText, Upload } from "lucide-react";

export default function Documentar() {
  return (
    <Layout role="technician">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentar Trabajo</h1>
          <p className="text-muted-foreground mt-2">Registra evidencias y notas del servicio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Orden</CardTitle>
            <CardDescription>Elige la orden que deseas documentar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="order-select">Orden de Servicio</Label>
              <Input id="order-select" placeholder="Buscar orden..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotografías
            </CardTitle>
            <CardDescription>Sube fotos del trabajo realizado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Haz clic para subir fotos o arrastra aquí
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG hasta 10MB cada una
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas del Servicio
            </CardTitle>
            <CardDescription>Describe el trabajo realizado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="work-summary">Resumen del Trabajo</Label>
                <Textarea
                  id="work-summary"
                  placeholder="Describe brevemente el trabajo realizado..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parts-used">Repuestos Utilizados</Label>
                <Textarea
                  id="parts-used"
                  placeholder="Lista de repuestos y materiales usados..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recomendaciones</Label>
                <Textarea
                  id="recommendations"
                  placeholder="Sugerencias para el cliente..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Guardar Documentación
                </Button>
                <Button variant="outline">Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
