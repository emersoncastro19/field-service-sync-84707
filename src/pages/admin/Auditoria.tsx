import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Search, Calendar } from "lucide-react";

const auditLogs = [
  {
    id: 1,
    user: "admin@sistema.com",
    action: "Inicio de sesión",
    module: "Autenticación",
    date: "2024-01-15 10:30:45",
    ip: "192.168.1.100",
    status: "Exitoso"
  },
  {
    id: 2,
    user: "coordinador@sistema.com",
    action: "Asignación de orden OS-045",
    module: "Órdenes",
    date: "2024-01-15 10:25:12",
    ip: "192.168.1.105",
    status: "Exitoso"
  },
  {
    id: 3,
    user: "agente@sistema.com",
    action: "Creación de orden OS-046",
    module: "Órdenes",
    date: "2024-01-15 10:20:33",
    ip: "192.168.1.110",
    status: "Exitoso"
  },
  {
    id: 4,
    user: "admin@sistema.com",
    action: "Modificación de rol de usuario",
    module: "Usuarios",
    date: "2024-01-15 09:15:28",
    ip: "192.168.1.100",
    status: "Exitoso"
  },
  {
    id: 5,
    user: "desconocido",
    action: "Intento de inicio de sesión fallido",
    module: "Autenticación",
    date: "2024-01-15 09:05:00",
    ip: "203.45.67.89",
    status: "Fallido"
  },
];

export default function Auditoria() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditoría del Sistema</h1>
            <p className="text-muted-foreground mt-2">Logs y reportes de actividad del sistema</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Eventos Hoy</p>
              <p className="text-2xl font-bold">234</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Search className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Accesos Exitosos</p>
              <p className="text-2xl font-bold">198</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Intentos Fallidos</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Cambios Sistema</p>
              <p className="text-2xl font-bold">36</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
            <CardDescription>Filtra los logs de auditoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Input placeholder="Buscar usuario..." />
              </div>
              <div className="space-y-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="auth">Autenticación</SelectItem>
                    <SelectItem value="users">Usuarios</SelectItem>
                    <SelectItem value="orders">Órdenes</SelectItem>
                    <SelectItem value="config">Configuración</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Button className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Registro de Actividad
            </CardTitle>
            <CardDescription>Logs recientes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Fecha/Hora</th>
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Acción</th>
                    <th className="text-left py-3 px-4 font-medium">Módulo</th>
                    <th className="text-left py-3 px-4 font-medium">IP</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{log.date}</td>
                      <td className="py-3 px-4 text-sm">{log.user}</td>
                      <td className="py-3 px-4 text-sm">{log.action}</td>
                      <td className="py-3 px-4 text-sm">{log.module}</td>
                      <td className="py-3 px-4 text-sm font-mono">{log.ip}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={log.status === "Exitoso" ? "default" : "destructive"}
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
