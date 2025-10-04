import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

export default function NuevaOrden() {
  return (
    <Layout role="client">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Orden de Servicio</h1>
          <p className="text-muted-foreground mt-2">Solicita un nuevo servicio técnico</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Servicio
            </CardTitle>
            <CardDescription>Completa los detalles de tu solicitud</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service-type">Tipo de Servicio</Label>
                <Select>
                  <SelectTrigger id="service-type">
                    <SelectValue placeholder="Selecciona el tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reparacion">Reparación</SelectItem>
                    <SelectItem value="instalacion">Instalación</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="consultoria">Consultoría</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipo/Dispositivo</Label>
                <Input id="equipment" placeholder="Ej: Computadora portátil HP" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Problema</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe detalladamente el problema o servicio requerido"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección del Servicio</Label>
                <Input id="address" placeholder="Dirección completa" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-date">Fecha Preferida</Label>
                <Input id="preferred-date" type="date" />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Crear Orden de Servicio</Button>
                <Button type="button" variant="outline">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
