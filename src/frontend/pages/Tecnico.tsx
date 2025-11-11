import { useEffect, useState } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { FileText, Play, Square, Camera, AlertCircle, Wrench, Loader2 } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { supabase } from "@/backend/config/supabaseClient";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_asignacion: string;
  direccion_servicio: string;
  cliente: {
    nombre_completo: string;
  };
  citas?: {
    fecha_programada: string;
    estado_cita: string;
  }[];
}

export default function Tecnico() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);

  // Mostrar mensaje de bienvenida solo cuando es un nuevo ingreso (después de login)
  useEffect(() => {
    if (usuario) {
      // Verificar si es un nuevo ingreso
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Tecnico');
      
      if (nuevoIngreso === 'true') {
        // Mostrar mensaje solo en nuevo ingreso
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de técnico. Aquí puedes gestionar tus servicios asignados y documentar tus trabajos.'
          );
          // Eliminar la marca para que no vuelva a aparecer hasta el próximo login
          sessionStorage.removeItem('nuevo_ingreso_Tecnico');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);

  // Cargar órdenes reales del técnico
  useEffect(() => {
    if (usuario) {
      cargarOrdenes();
    }
  }, [usuario]);

  const cargarOrdenes = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el técnico asociado al usuario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) {
        console.error('Error obteniendo técnico:', tecnicoError);
        throw tecnicoError;
      }

      // 2. Obtener las órdenes asignadas al técnico (todas las asignadas, no solo activas)
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_asignacion,
          direccion_servicio,
          descripcion_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              telefono,
              email
            )
          ),
          citas (
            id_cita,
            fecha_programada,
            estado_cita,
            motivo_reprogramacion
          )
        `)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .in('estado', ['Asignada', 'En Proceso', 'Completada', 'Completada (pendiente de confirmación)'])
        .order('fecha_asignacion', { ascending: false })
        .limit(10);

      if (ordenesError) {
        console.error('Error cargando órdenes:', ordenesError);
        throw ordenesError;
      }

      // Transformar los datos
      const ordenesFormateadas: Orden[] = (ordenesData || []).map((orden: any) => {
        // Procesar citas - puede ser array o objeto único
        let citasArray = [];
        if (orden.citas) {
          if (Array.isArray(orden.citas)) {
            citasArray = orden.citas;
          } else {
            citasArray = [orden.citas];
          }
        }

        return {
          id_orden: orden.id_orden,
          numero_orden: orden.numero_orden,
          tipo_servicio: orden.tipo_servicio,
          estado: orden.estado,
          fecha_asignacion: orden.fecha_asignacion,
          direccion_servicio: orden.direccion_servicio,
          cliente: {
            nombre_completo: orden.clientes?.usuarios?.nombre_completo || 'Cliente desconocido'
          },
          citas: citasArray.length > 0 ? citasArray : undefined
        };
      });

      console.log('✅ Órdenes cargadas:', ordenesFormateadas.length);
      console.log('📋 Órdenes con citas:', ordenesFormateadas.filter(o => o.citas && o.citas.length > 0).length);

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes asignadas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <Layout role="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario?.nombre_completo}
          </p>
        </div>

        <DashboardCard
          title="Órdenes Asignadas"
          description="Servicios pendientes de realizar"
          icon={FileText}
        >
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando órdenes...</span>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tienes órdenes asignadas en este momento</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                asChild
                onClick={() => navigate('/tecnico/ordenes')}
              >
                <Link to="/tecnico/ordenes">Ver todas las órdenes</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenes.map((orden) => (
                <div
                  key={orden.id_orden}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{orden.numero_orden} - {orden.tipo_servicio}</p>
                      <p className="text-sm text-muted-foreground">{orden.cliente.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">{orden.direccion_servicio}</p>
                      {orden.citas && orden.citas.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-primary">
                            📅 Cita Programada: {formatFecha(orden.citas[0].fecha_programada)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estado: {orden.citas[0].estado_cita}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1" 
                      asChild
                      onClick={() => navigate(`/tecnico/gestionar-ejecucion`)}
                    >
                      <Link to="/tecnico/gestionar-ejecucion">
                        <Play className="mr-2 h-4 w-4" />
                        Gestionar
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                      onClick={() => navigate(`/tecnico/ordenes`)}
                    >
                      <Link to="/tecnico/ordenes">
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {ordenes.length >= 5 && (
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/tecnico/ordenes">
                      Ver todas las órdenes
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DashboardCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Gestión de Trabajo"
            description="Controla tu tiempo de servicio"
            icon={Square}
          >
            <div className="space-y-3">
              <Button className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Registrar Inicio de Trabajo
              </Button>
              <Button variant="destructive" className="w-full">
                <Square className="mr-2 h-4 w-4" />
                Registrar Fin de Trabajo
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Documentación"
            description="Registro de evidencias"
            icon={Camera}
          >
            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <Camera className="mr-2 h-4 w-4" />
                  Subir Fotos del Trabajo
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tecnico/documentar">
                  <FileText className="mr-2 h-4 w-4" />
                  Añadir Notas
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Reportar Impedimentos"
            description="Informa problemas encontrados"
            icon={AlertCircle}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tecnico/reportar-impedimento">
                <AlertCircle className="mr-2 h-4 w-4" />
                Reportar Problema
              </Link>
            </Button>
          </DashboardCard>

          <DashboardCard
            title="Mis Especialidades"
            description="Áreas de experiencia"
            icon={Wrench}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tecnico/especialidades">
                <Wrench className="mr-2 h-4 w-4" />
                Gestionar Especialidades
              </Link>
            </Button>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
