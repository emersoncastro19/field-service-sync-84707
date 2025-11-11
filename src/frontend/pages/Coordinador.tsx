import { useEffect, useState } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Users, MapPin, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { Card } from "@/frontend/components/ui/card";
import { supabase } from "@/backend/config/supabaseClient";

export default function Coordinador() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    tecnicosActivos: 0,
    serviciosEnCurso: 0,
    impedimentos: 0,
    eficiencia: 0
  });
  const [tecnicos, setTecnicos] = useState<any[]>([]);

  // Mostrar mensaje de bienvenida solo cuando es un nuevo ingreso (después de login)
  useEffect(() => {
    if (usuario) {
      // Verificar si es un nuevo ingreso
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Coordinador');
      
      if (nuevoIngreso === 'true') {
        // Mostrar mensaje solo en nuevo ingreso
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de coordinador. Supervisa y coordina los servicios técnicos del sistema.'
          );
          // Eliminar la marca para que no vuelva a aparecer hasta el próximo login
          sessionStorage.removeItem('nuevo_ingreso_Coordinador');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);

  useEffect(() => {
    if (usuario) {
      cargarEstadisticas();
    }
  }, [usuario]);

  const cargarEstadisticas = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el ID del coordinador logueado
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('coordinadores_campo')
        .select('id_coordinador')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (coordinadorError) throw coordinadorError;

      if (!coordinadorData || !coordinadorData.id_coordinador) {
        console.warn('⚠️ No se encontró id_coordinador para el coordinador logueado');
        setTecnicos([]);
        setEstadisticas({
          tecnicosActivos: 0,
          serviciosEnCurso: 0,
          impedimentos: 0,
          eficiencia: 0
        });
        return;
      }

      const idCoordinador = coordinadorData.id_coordinador;

      // 2. Cargar técnicos asignados a este coordinador (por id_coordinador_supervisor)
      const { data: tecnicosData, error: tecnicosError } = await supabase
        .from('tecnicos')
        .select(`
          id_tecnico,
          disponibilidad,
          usuarios!inner (
            nombre_completo
          )
        `)
        .eq('disponibilidad', 'Activo')
        .eq('id_coordinador_supervisor', idCoordinador);

      if (tecnicosError) throw tecnicosError;

      const tecnicosActivos = tecnicosData?.length || 0;

      // 3. Cargar órdenes en curso de los técnicos asignados a este coordinador
      const tecnicosIds = (tecnicosData || []).map(t => t.id_tecnico);
      let serviciosEnCurso = 0;
      let ordenesCompletadas = 0;

      if (tecnicosIds.length > 0) {
        // Órdenes en curso
        const { data: ordenesEnCurso, error: ordenesError } = await supabase
          .from('ordenes_servicio')
          .select('id_orden')
          .in('id_tecnico_asignado', tecnicosIds)
          .in('estado', ['Asignada', 'En Proceso']);

        if (ordenesError) throw ordenesError;
        serviciosEnCurso = ordenesEnCurso?.length || 0;

        // Órdenes completadas
        const { data: ordenesCompletadasData, error: completadasError } = await supabase
          .from('ordenes_servicio')
          .select('id_orden')
          .in('id_tecnico_asignado', tecnicosIds)
          .eq('estado', 'Completada');

        if (completadasError) throw completadasError;
        ordenesCompletadas = ordenesCompletadasData?.length || 0;
      }

      // 4. Cargar impedimentos de los técnicos asignados a este coordinador
      let impedimentos = 0;
      if (tecnicosIds.length > 0) {
        const { data: impedimentosData, error: impedimentosError } = await supabase
          .from('impedimentos')
          .select('id_impedimento')
          .in('id_tecnico', tecnicosIds)
          .eq('estado', 'Pendiente');

        if (impedimentosError && impedimentosError.code !== 'PGRST116') {
          console.error('Error cargando impedimentos:', impedimentosError);
        } else {
          impedimentos = impedimentosData?.length || 0;
        }
      }

      // 5. Calcular eficiencia (órdenes completadas / total de órdenes asignadas)
      const totalAsignadas = serviciosEnCurso + ordenesCompletadas;
      const eficiencia = totalAsignadas > 0 ? Math.round((ordenesCompletadas / totalAsignadas) * 100) : 0;

      // 6. Cargar técnicos con sus órdenes activas para mostrar en la lista
      const tecnicosConOrdenes = await Promise.all(
        (tecnicosData || []).map(async (tecnico: any) => {
          const { data: ordenesTecnico } = await supabase
            .from('ordenes_servicio')
            .select('id_orden')
            .eq('id_tecnico_asignado', tecnico.id_tecnico)
            .in('estado', ['Asignada', 'En Proceso']);

          return {
            id: `T-${tecnico.id_tecnico}`,
            name: tecnico.usuarios.nombre_completo,
            status: tecnico.disponibilidad === 'Activo' ? 'Disponible' : 'En servicio',
            activeOrders: ordenesTecnico?.length || 0
          };
        })
      );

      setTecnicos(tecnicosConOrdenes);
      setEstadisticas({
        tecnicosActivos,
        serviciosEnCurso,
        impedimentos,
        eficiencia
      });
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
      error('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario?.nombre_completo}
          </p>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando estadísticas...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <div className="p-6">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Técnicos Activos</p>
                  <p className="text-3xl font-bold">{estadisticas.tecnicosActivos}</p>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
                <div className="p-6">
                  <MapPin className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Servicios en Curso</p>
                  <p className="text-3xl font-bold">{estadisticas.serviciosEnCurso}</p>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="p-6">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Impedimentos</p>
                  <p className="text-3xl font-bold">{estadisticas.impedimentos}</p>
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="p-6">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Eficiencia</p>
                  <p className="text-3xl font-bold">{estadisticas.eficiencia}%</p>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardCard
                title="Supervisión de Técnicos"
                description="Estado actual de los técnicos"
                icon={Users}
              >
                <div className="space-y-3">
                  {tecnicos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay técnicos activos en este momento
                    </p>
                  ) : (
                    tecnicos.map((tech) => (
                      <div
                        key={tech.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tech.activeOrders} órdenes activas
                          </p>
                        </div>
                        <Badge variant={tech.status === "Disponible" ? "default" : "secondary"}>
                          {tech.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <Button className="w-full mt-4" asChild>
                  <Link to="/coordinador/tecnicos">Ver Todos los Técnicos</Link>
                </Button>
              </DashboardCard>

              <DashboardCard
                title="Asignar/Reasignar Órdenes"
                description="Gestionar asignaciones"
                icon={MapPin}
              >
                <Button className="w-full" asChild>
                  <Link to="/coordinador/asignar">
                    <MapPin className="mr-2 h-4 w-4" />
                    Gestionar Asignaciones
                  </Link>
                </Button>
              </DashboardCard>
            </div>

            <DashboardCard
              title="Gestionar Citas de Servicio"
              description="Calendario de servicios"
              icon={Calendar}
            >
              <Button variant="outline" className="w-full" asChild>
                <Link to="/coordinador/citas">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Calendario
                </Link>
              </Button>
            </DashboardCard>
          </>
        )}
      </div>
    </Layout>
  );
}
