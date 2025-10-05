import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Camera, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function GestionarEjecucion() {
  return (
    <Layout role="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionar Ejecución de Servicio</h1>
          <p className="text-muted-foreground mt-2">Control y registro del servicio en curso</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Control de Tiempo
              </CardTitle>
              <CardDescription>Registra inicio y fin del trabajo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Registrar Inicio de Trabajo
              </Button>
              <Button variant="destructive" className="w-full">
                <Square className="mr-2 h-4 w-4" />
                Registrar Fin de Trabajo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Documentación
              </CardTitle>
              <CardDescription>Evidencias del servicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <Camera className="mr-2 h-4 w-4" />
                  Subir Fotos del Trabajo
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <FileText className="mr-2 h-4 w-4" />
                  Añadir Notas
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Finalizar Servicio
              </CardTitle>
              <CardDescription>Completa y cierra la orden de servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar Servicio como Completado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
