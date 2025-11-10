import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Key, Trash2, Database, HardDrive } from "lucide-react";
import { useAuth } from "@/frontend/context/AuthContext";

export default function Herramientas() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Obtener el rol del usuario autenticado
  const getRole = (): "client" | "agent" | "coordinator" | "technician" | "admin" => {
    if (!usuario) {
      return 'admin'; // Valor temporal mientras se carga (por defecto admin para este módulo)
    }
    
    // Mapear tipo_usuario de la BD al formato del Layout
    const roleMap: Record<string, "client" | "agent" | "coordinator" | "technician" | "admin"> = {
      'Cliente': 'client',
      'Agente': 'agent',
      'Coordinador': 'coordinator',
      'Tecnico': 'technician',
      'Admin': 'admin'
    };
    
    return roleMap[usuario.tipo_usuario] || 'admin';
  };

  // Redirigir al login si no hay usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usuario) {
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [usuario, navigate]);

  return (
    <Layout role={getRole()}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Herramientas del Sistema</h1>
          <p className="text-muted-foreground">Gestión de contraseñas, productos y datos</p>
        </div>

        <DashboardCard
          title="Gestión de Contraseñas"
          description="Administrar contraseñas de usuarios"
          icon={Key}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Añadir Nueva Contraseña</Label>
              <div className="flex gap-2">
                <Input placeholder="Usuario" />
                <Input type="password" placeholder="Nueva contraseña" />
                <Button>Añadir</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Recuperar Contraseña</Label>
              <div className="flex gap-2">
                <Input placeholder="Email del usuario" />
                <Button variant="outline">Enviar</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Modificar Contraseña Existente</Label>
              <div className="flex gap-2">
                <Input placeholder="Usuario" />
                <Input type="password" placeholder="Nueva contraseña" />
                <Button variant="secondary">Modificar</Button>
              </div>
            </div>
          </div>
        </DashboardCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Gestión de Productos/Servicios"
            description="Eliminar productos o servicios"
            icon={Trash2}
          >
            <div className="space-y-3">
              <Input placeholder="ID del producto/servicio" />
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Producto/Servicio
              </Button>
              <p className="text-sm text-muted-foreground">
                Esta acción es irreversible. Asegúrate de verificar el ID antes de eliminar.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Gestión de Datos"
            description="Respaldo y restauración"
            icon={Database}
          >
            <div className="space-y-3">
              <Button className="w-full">
                <HardDrive className="mr-2 h-4 w-4" />
                Hacer Copia de Seguridad
              </Button>
              <Button variant="outline" className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Restaurar Datos
              </Button>
              <p className="text-sm text-muted-foreground">
                Última copia de seguridad: 15 de Enero, 2024 - 14:30
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
