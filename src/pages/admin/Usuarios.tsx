import Layout from "@/components/Layout";
import { Users, UserPlus, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const users = [
  { id: "U001", name: "Carlos Rodríguez", email: "carlos@email.com", role: "client", status: "active" },
  { id: "U002", name: "Juan Pérez", email: "juan@email.com", role: "technician", status: "active" },
  { id: "U003", name: "María García", email: "maria@email.com", role: "agent", status: "active" },
  { id: "U004", name: "Ana Martínez", email: "ana@email.com", role: "coordinator", status: "inactive" },
];

const roleLabels: Record<string, string> = {
  client: "Cliente",
  agent: "Agente",
  coordinator: "Coordinador",
  technician: "Técnico",
  admin: "Administrador",
};

export default function Usuarios() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-2">Administra usuarios y roles del sistema</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div>
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {roleLabels[user.role]}
                    </Badge>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button variant="outline" size="sm">
                    {user.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
