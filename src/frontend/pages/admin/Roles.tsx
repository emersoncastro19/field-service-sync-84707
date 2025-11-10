import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Shield, Users } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";

interface Rol {
  id: string;
  name: string;
  users: number;
  color: string;
  tipo_usuario: string;
}

const permissions = [
  { id: "users", name: "Gestionar Usuarios", description: "Crear, editar y eliminar usuarios" },
  { id: "orders", name: "Gestionar Órdenes", description: "Ver y modificar órdenes de servicio" },
  { id: "assign", name: "Asignar Servicios", description: "Asignar técnicos a órdenes" },
  { id: "reports", name: "Ver Reportes", description: "Acceso a reportes del sistema" },
  { id: "config", name: "Configuración", description: "Modificar configuraciones del sistema" },
  { id: "audit", name: "Auditoría", description: "Ver logs de auditoría" },
];

export default function Roles() {
  const { error } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      setCargando(true);

      // Obtener todos los usuarios y contar por tipo_usuario
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('tipo_usuario, estado');

      if (usuariosError) throw usuariosError;

      // Contar usuarios por tipo (solo activos)
      const conteos: Record<string, number> = {
        'Admin': 0,
        'Coordinador': 0,
        'Agente': 0,
        'Tecnico': 0,
        'Cliente': 0
      };

      usuariosData?.forEach((usuario) => {
        if (usuario.estado === 'Activo' && usuario.tipo_usuario in conteos) {
          conteos[usuario.tipo_usuario as keyof typeof conteos]++;
        }
      });

      // Mapear a la estructura de roles
      const rolesConConteos: Rol[] = [
        { 
          id: "admin", 
          name: "Administrador", 
          users: conteos['Admin'] || 0, 
          color: "bg-red-500",
          tipo_usuario: 'Admin'
        },
        { 
          id: "coordinator", 
          name: "Coordinador", 
          users: conteos['Coordinador'] || 0, 
          color: "bg-blue-500",
          tipo_usuario: 'Coordinador'
        },
        { 
          id: "agent", 
          name: "Agente", 
          users: conteos['Agente'] || 0, 
          color: "bg-green-500",
          tipo_usuario: 'Agente'
        },
        { 
          id: "technician", 
          name: "Técnico", 
          users: conteos['Tecnico'] || 0, 
          color: "bg-purple-500",
          tipo_usuario: 'Tecnico'
        },
        { 
          id: "client", 
          name: "Cliente", 
          users: conteos['Cliente'] || 0, 
          color: "bg-gray-500",
          tipo_usuario: 'Cliente'
        },
      ];

      setRoles(rolesConConteos);
    } catch (err: any) {
      console.error('Error cargando roles:', err);
      error('Error', 'No se pudieron cargar las estadísticas de roles');
      // En caso de error, usar valores por defecto
      setRoles([
        { id: "admin", name: "Administrador", users: 0, color: "bg-red-500", tipo_usuario: 'Admin' },
        { id: "coordinator", name: "Coordinador", users: 0, color: "bg-blue-500", tipo_usuario: 'Coordinador' },
        { id: "agent", name: "Agente", users: 0, color: "bg-green-500", tipo_usuario: 'Agente' },
        { id: "technician", name: "Técnico", users: 0, color: "bg-purple-500", tipo_usuario: 'Tecnico' },
        { id: "client", name: "Cliente", users: 0, color: "bg-gray-500", tipo_usuario: 'Cliente' },
      ]);
    } finally {
      setCargando(false);
    }
  };

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
          {cargando ? (
            // Mostrar skeletons mientras carga
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <div className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-muted animate-pulse mb-3"></div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                </div>
              </Card>
            ))
          ) : (
            roles.map((role) => (
              <Card key={role.id}>
                <div className="p-6">
                  <div className={`h-12 w-12 rounded-lg ${role.color} flex items-center justify-center mb-3`}>
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold mb-1">{role.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.users} {role.users === 1 ? 'usuario' : 'usuarios'}
                  </p>
                </div>
              </Card>
            ))
          )}
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
            {cargando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando permisos...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
