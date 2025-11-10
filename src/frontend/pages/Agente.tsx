import { useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Search, Plus, FileText, History, XCircle } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

export default function Agente() {
  const { usuario } = useAuth();
  const { success } = useToast();

  // Mostrar mensaje de bienvenida solo cuando es un nuevo ingreso (después de login)
  useEffect(() => {
    if (usuario) {
      // Verificar si es un nuevo ingreso
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Agente');
      
      if (nuevoIngreso === 'true') {
        // Mostrar mensaje solo en nuevo ingreso
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de agente. Aquí puedes gestionar órdenes y asignar técnicos.'
          );
          // Eliminar la marca para que no vuelva a aparecer hasta el próximo login
          sessionStorage.removeItem('nuevo_ingreso_Agente');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);
  const mockOrders = [
    { id: "OS-001", client: "Juan Pérez", service: "Reparación", status: "En progreso" },
    { id: "OS-002", client: "María García", service: "Instalación", status: "Completado" },
    { id: "OS-003", client: "Carlos López", service: "Mantenimiento", status: "Pendiente" },
  ];

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Agente de Servicio</h1>
          <p className="text-muted-foreground">Gestiona las órdenes de servicio y clientes</p>
        </div>

        <DashboardCard
          title="Órdenes de Servicio Recientes"
          description="Últimas órdenes creadas"
          icon={FileText}
        >
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{order.id} - {order.client}</p>
                  <p className="text-sm text-muted-foreground">{order.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "Completado" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/agente/detalles-orden">
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
