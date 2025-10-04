import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Mail, Clock } from "lucide-react";

const notificationHistory = [
  { id: 1, title: "Actualización de Sistema", recipient: "Todos", date: "2024-01-15", status: "Enviado" },
  { id: 2, title: "Mantenimiento Programado", recipient: "Técnicos", date: "2024-01-14", status: "Enviado" },
  { id: 3, title: "Nuevas Políticas", recipient: "Todos", date: "2024-01-10", status: "Enviado" },
];

export default function Notificaciones() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motor de Notificaciones</h1>
          <p className="text-muted-foreground mt-2">Envía y gestiona notificaciones del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <Send className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Enviadas Hoy</p>
              <p className="text-2xl font-bold">45</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Programadas</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Mail className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Este Mes</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Nueva Notificación
            </CardTitle>
            <CardDescription>Crea y envía notificaciones a los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipient">Destinatarios</Label>
                <Select>
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Selecciona los destinatarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="clients">Solo clientes</SelectItem>
                    <SelectItem value="technicians">Solo técnicos</SelectItem>
                    <SelectItem value="agents">Solo agentes</SelectItem>
                    <SelectItem value="coordinators">Solo coordinadores</SelectItem>
                    <SelectItem value="admins">Solo administradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-type">Tipo de Notificación</Label>
                <Select>
                  <SelectTrigger id="notification-type">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Información</SelectItem>
                    <SelectItem value="warning">Advertencia</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="update">Actualización</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Título de la notificación" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe el contenido de la notificación..."
                  rows={6}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Ahora
                </Button>
                <Button type="button" variant="outline">
                  Programar Envío
                </Button>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historial de Notificaciones
            </CardTitle>
            <CardDescription>Últimas notificaciones enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificationHistory.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Para: {notif.recipient} | {notif.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{notif.status}</Badge>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
