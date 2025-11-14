import { useEffect, useState } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { FileText, Wrench, Loader2, Calendar, Clock } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { supabase } from "@/backend/config/supabaseClient";
import { formatearHoraVenezuela, formatearSoloFechaVenezuela, parsearFechaUTC } from "@/shared/utils/dateUtils";

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
  const [citasDelDia, setCitasDelDia] = useState<Array<{ id_cita: number; fecha_programada: string; numero_orden: string; hora: string }>>([]);

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
        .in('estado', ['Asignada', 'En Proceso'])
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
      
      // Verificar citas del día
      verificarCitasDelDia(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes asignadas');
    } finally {
      setCargando(false);
    }
  };
  
  const verificarCitasDelDia = (ordenes: Orden[]) => {
    // Crear fecha actual en UTC para comparar correctamente
    const ahora = new Date();
    const fechaActualUTC = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate(),
      0, 0, 0, 0
    ));
    const fechaFinDiaUTC = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate(),
      23, 59, 59, 999
    ));
    
    const citasHoy: Array<{ id_cita: number; fecha_programada: string; numero_orden: string; hora: string }> = [];
    
    ordenes.forEach(orden => {
      if (orden.citas && orden.citas.length > 0) {
        orden.citas.forEach(cita => {
          // Normalizar la fecha para forzar interpretación como UTC
          const fechaProgramada = parsearFechaUTC(cita.fecha_programada);
          
          // Verificar si la cita es hoy (comparar en UTC)
          if (fechaProgramada >= fechaActualUTC && fechaProgramada <= fechaFinDiaUTC && cita.estado_cita === 'Programada') {
            const hora = formatearHoraVenezuela(cita.fecha_programada);
            citasHoy.push({
              id_cita: cita.id_cita || 0,
              fecha_programada: cita.fecha_programada,
              numero_orden: orden.numero_orden,
              hora: hora
            });
          }
        });
      }
    });
    
    setCitasDelDia(citasHoy);
    
    // Mostrar notificación si hay citas del día
    if (citasHoy.length > 0) {
      const mensaje = citasHoy.length === 1
        ? `Tienes 1 cita programada para hoy a las ${citasHoy[0].hora} (Orden: ${citasHoy[0].numero_orden})`
        : `Tienes ${citasHoy.length} citas programadas para hoy.`;
      
      // Solo mostrar notificación si es un nuevo ingreso o si no se ha mostrado antes
      const ahora = new Date();
      const fechaHoy = ahora.toISOString().split('T')[0];
      const citasNotificadas = sessionStorage.getItem('citas_del_dia_notificadas');
      if (!citasNotificadas || citasNotificadas !== fechaHoy) {
        setTimeout(() => {
          success('Citas del Día', mensaje);
          sessionStorage.setItem('citas_del_dia_notificadas', fechaHoy);
        }, 1500);
      }
    }
  };

  const formatFecha = (fecha: string) => {
    return formatearSoloFechaVenezuela(fecha);
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
          title="Órdenes Activas"
          description="Servicios pendientes de realizar"
          icon={FileText}
        >
          {/* Sección de Citas del Día integrada */}
          {citasDelDia.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-semibold mb-2">
                  {citasDelDia.length === 1 ? 'Tienes 1 cita programada para hoy' : `Tienes ${citasDelDia.length} citas programadas para hoy`}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {citasDelDia.map((cita, index) => (
                    <li key={index}>
                      Orden {cita.numero_orden} a las <strong>{cita.hora}</strong>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigate('/tecnico/citas')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Todas las Citas
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando órdenes...</span>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tienes órdenes asignadas en este momento</p>
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
                    >
                      <Link to="/tecnico/gestionar-ejecucion">
                        <Wrench className="mr-2 h-4 w-4" />
                        Gestionar Ejecución
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>


      </div>
    </Layout>
  );
}
