import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Users } from "lucide-react";

const roles = [
  { id: "admin", name: "Administrador", users: 3, color: "bg-red-500" },
  { id: "coordinator", name: "Coordinador", users: 8, color: "bg-blue-500" },
  { id: "agent", name: "Agente", users: 25, color: "bg-green-500" },
  { id: "technician", name: "Técnico", users: 45, color: "bg-purple-500" },
  { id: "client", name: "Cliente", users: 856, color: "bg-gray-500" },
];

const permissions = [
  { id: "users", name: "Gestionar Usuarios", description: "Crear, editar y eliminar usuarios" },
  { id: "orders", name: "Gestionar Órdenes", description: "Ver y modificar órdenes de servicio" },
  { id: "assign", name: "Asignar Servicios", description: "Asignar técnicos a órdenes" },
  { id: "reports", name: "Ver Reportes", description: "Acceso a reportes del sistema" },
  { id: "config", name: "Configuración", description: "Modificar configuraciones del sistema" },
  { id: "audit", name: "Auditoría", description: "Ver logs de auditoría" },
];

export default function Roles() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Roles y Permisos</h1>
            <p className="text-muted-foreground mt-2">Configura los permisos de cada rol</p>
          </div>
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {roles.map((role) => (
            <Card key={role.id}>
              <div className="p-6">
                <div className={`h-12 w-12 rounded-lg ${role.color} flex items-center justify-center mb-3`}>
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold mb-1">{role.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {role.users} usuarios
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos por Rol
            </CardTitle>
            <CardDescription>Configura los permisos de acceso para cada rol</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Permiso</th>
                    {roles.map((role) => (
                      <th key={role.id} className="text-center py-3 px-4 font-medium">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{permission.name}</p>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center py-4 px-4">
                          <Checkbox />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-6">
              <Button className="flex-1">Guardar Cambios</Button>
              <Button variant="outline">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
