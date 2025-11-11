import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Users, Bell, Shield, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { Card } from "@/frontend/components/ui/card";

export default function Admin() {
  const { usuario } = useAuth();
  const { success } = useToast();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    rolesActivos: 5,
    notificacionesEnviadas: 0,
    sistemaActivo: "100%"
  });
  const [cargando, setCargando] = useState(true);

  // Mostrar mensaje de bienvenida solo cuando es un nuevo ingreso (después de login)
  useEffect(() => {
    if (usuario) {
      // Verificar si es un nuevo ingreso
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Admin');
      
      if (nuevoIngreso === 'true') {
        // Mostrar mensaje solo en nuevo ingreso
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de administración. Gestiona usuarios, roles y configuraciones del sistema.'
          );
          // Eliminar la marca para que no vuelva a aparecer hasta el próximo login
          sessionStorage.removeItem('nuevo_ingreso_Admin');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Contar total de usuarios
      const { count: totalUsuarios } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      // Contar notificaciones enviadas
      const { count: notificaciones } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsuarios: totalUsuarios || 0,
        rolesActivos: 5, // Siempre 5 roles disponibles
        notificacionesEnviadas: notificaciones || 0,
        sistemaActivo: "100%"
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario?.nombre_completo}
          </p>
        </div>

        {/* Cards de Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Total Usuarios</p>
              {cargando ? (
                <div className="h-9 w-16 bg-white/20 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold">{stats.totalUsuarios}</p>
              )}
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Roles Activos</p>
              <p className="text-3xl font-bold">{stats.rolesActivos}</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-6">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Notificaciones Enviadas</p>
              {cargando ? (
                <div className="h-9 w-16 bg-white/20 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold">{stats.notificacionesEnviadas}</p>
              )}
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <Settings className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Sistema Activo</p>
              <p className="text-3xl font-bold">{stats.sistemaActivo}</p>
            </div>
          </Card>
        </div>

        {/* Acciones Principales */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Gestión de Usuarios y Roles"
            description="Administrar usuarios del sistema"
            icon={Users}
          >
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/admin/usuarios">
                  <Users className="mr-2 h-4 w-4" />
                  Crear Nuevo Usuario
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/usuarios">Ver Todos los Usuarios</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/roles">Gestionar Roles y Permisos</Link>
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Motor de Notificaciones"
            description="Configurar y enviar notificaciones"
            icon={Bell}
          >
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/admin/notificaciones">
                  <Bell className="mr-2 h-4 w-4" />
                  Enviar Notificación
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/notificaciones">Configurar Plantillas</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/notificaciones">Ver Historial</Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        {/* Auditoría */}
        <DashboardCard
          title="Auditoría del Sistema"
          description="Logs y reportes de actividad"
          icon={Shield}
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Ver Logs de Acceso</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Cambios en el Sistema</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/auditoria">Generar Reporte</Link>
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Selecciona una opción para ver los detalles de auditoría
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}
