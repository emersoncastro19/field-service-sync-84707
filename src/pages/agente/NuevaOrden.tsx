import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileText, Search } from "lucide-react";

export default function NuevaOrden() {
  return (
    <Layout role="agent">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Orden de Servicio</h1>
          <p className="text-muted-foreground mt-2">Registra una nueva solicitud de servicio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Cliente</CardTitle>
            <CardDescription>Ingresa el ID o nombre del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="ID, nombre o teléfono del cliente..." className="flex-1" />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles de la Orden
            </CardTitle>
            <CardDescription>Completa la información del servicio</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client-id">ID del Cliente</Label>
                <Input id="client-id" placeholder="CLI-001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-type">Tipo de Servicio</Label>
                <Select>
                  <SelectTrigger id="service-type">
                    <SelectValue placeholder="Selecciona el tipo" />
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
                <Input id="equipment" placeholder="Descripción del equipo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Descripción del Problema</Label>
                <Textarea 
                  id="problem" 
                  placeholder="Detalla el problema reportado por el cliente"
                  rows={5}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecciona" />
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
                  <Label htmlFor="zone">Zona</Label>
                  <Select>
                    <SelectTrigger id="zone">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="norte">Zona Norte</SelectItem>
                      <SelectItem value="sur">Zona Sur</SelectItem>
                      <SelectItem value="este">Zona Este</SelectItem>
                      <SelectItem value="oeste">Zona Oeste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección del Servicio</Label>
                <Input id="address" placeholder="Dirección completa" />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Crear Orden</Button>
                <Button type="button" variant="outline">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
