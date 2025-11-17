import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Calendar, Clock, MapPin, User, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela, formatearHoraVenezuela, formatearSoloFechaVenezuela, parsearFechaUTC, obtenerFechaActualVenezuelaUTC } from "@/shared/utils/dateUtils";

interface Cita {
  id_cita: number;
  id_orden: number;
  numero_orden: string;
  fecha_programada: string;
  estado_cita: string;
  motivo_reprogramacion: string | null;
  cliente: {
    nombre_completo: string;
  };
  tecnico: {
    nombre_completo: string;
  };
  direccion_servicio: string;
  tipo_servicio: string;
}

export default function Citas() {
  const { usuario } = useAuth();
  const { error, success } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<Record<number, boolean>>({});
  const [estadisticas, setEstadisticas] = useState({
    hoy: 0,
    estaSemana: 0,
    confirmadas: 0,
    pendientes: 0,
    solicitudesReprogramacion: 0
  });

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  const cargarCitas = async () => {
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

      if (!coordinadorData?.id_coordinador) {
        console.warn('⚠️ No se encontró id_coordinador para el coordinador logueado');
        setCitas([]);
        setCargando(false);
        return;
      }

      const idCoordinador = coordinadorData.id_coordinador;

      // 2. Obtener órdenes asignadas por este coordinador
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          direccion_servicio,
          id_tecnico_asignado,
          clientes!inner (
            usuarios!inner (
              nombre_completo
            )
          ),
          tecnicos:id_tecnico_asignado (
            usuarios!inner (
              nombre_completo
            )
          )
        `)
        .eq('id_coordinador_supervisor', idCoordinador)
        .not('id_tecnico_asignado', 'is', null);

      if (ordenesError) throw ordenesError;

      // 3. Obtener citas de estas órdenes
      const ordenIds = (ordenesData || []).map(o => o.id_orden);
      let citasData: any[] = [];

      if (ordenIds.length > 0) {
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select('*')
          .in('id_orden', ordenIds)
          .order('fecha_programada', { ascending: false });

        if (citasError) throw citasError;
        citasData = citas || [];
      }

      // 4. Combinar datos de citas con órdenes
      const citasFormateadas: Cita[] = citasData.map((cita: any) => {
        const orden = ordenesData?.find((o: any) => o.id_orden === cita.id_orden);
        return {
          id_cita: cita.id_cita,
          id_orden: cita.id_orden,
          numero_orden: orden?.numero_orden || 'N/A',
          fecha_programada: cita.fecha_programada,
          estado_cita: cita.estado_cita,
          motivo_reprogramacion: cita.motivo_reprogramacion,
          cliente: {
            nombre_completo: orden?.clientes?.usuarios?.nombre_completo || 'Cliente desconocido'
          },
          tecnico: {
            nombre_completo: orden?.tecnicos?.usuarios?.nombre_completo || 'Técnico desconocido'
          },
          direccion_servicio: orden?.direccion_servicio || '',
          tipo_servicio: orden?.tipo_servicio || ''
        };
      });

      setCitas(citasFormateadas);

      // 5. Calcular estadísticas
      // Crear fechas en UTC para comparar correctamente
      const ahora = new Date();
      const hoyUTC = new Date(Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate(),
        0, 0, 0, 0
      ));
      const finSemanaUTC = new Date(Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate() + 7,
        23, 59, 59, 999
      ));

      const citasHoy = citasFormateadas.filter(cita => {
        // Normalizar la fecha para forzar interpretación como UTC
        const fechaCita = parsearFechaUTC(cita.fecha_programada);
        // Crear una fecha solo con la parte de la fecha (sin hora) en UTC
        const fechaCitaSoloFecha = new Date(Date.UTC(
          fechaCita.getUTCFullYear(),
          fechaCita.getUTCMonth(),
          fechaCita.getUTCDate()
        ));
        return fechaCitaSoloFecha.getTime() === hoyUTC.getTime();
      });

      const citasEstaSemana = citasFormateadas.filter(cita => {
        // Normalizar la fecha para forzar interpretación como UTC
        const fechaCita = parsearFechaUTC(cita.fecha_programada);
        return fechaCita >= hoyUTC && fechaCita <= finSemanaUTC;
      });

      const citasConfirmadas = citasFormateadas.filter(cita => cita.estado_cita === 'Confirmada');
      const citasPendientes = citasFormateadas.filter(cita => cita.estado_cita === 'Programada' || cita.estado_cita === 'Propuesta' || cita.estado_cita === 'Pendiente de Confirmación');
      const solicitudesReprogramacion = citasFormateadas.filter(cita => cita.estado_cita === 'Reprogramada' || cita.estado_cita === 'Solic Reprogram' || cita.estado_cita === 'Solicitud de Reprogramación');

      setEstadisticas({
        hoy: citasHoy.length,
        estaSemana: citasEstaSemana.length,
        confirmadas: citasConfirmadas.length,
        pendientes: citasPendientes.length,
        solicitudesReprogramacion: solicitudesReprogramacion.length
      });
    } catch (err: any) {
      console.error('Error cargando citas:', err);
      error('Error', 'No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return formatearFechaVenezuela(fecha, {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatHora = (fecha: string) => {
    return formatearHoraVenezuela(fecha);
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Programada': { variant: 'secondary' as const, label: 'Propuesta (Esperando Cliente)', className: 'bg-blue-100 text-blue-800' },
      'Propuesta': { variant: 'secondary' as const, label: 'Propuesta (Esperando Cliente)', className: 'bg-blue-100 text-blue-800' }, // Compatibilidad
      'Pendiente de Confirmación': { variant: 'secondary' as const, label: 'Propuesta (Esperando Cliente)', className: 'bg-blue-100 text-blue-800' }, // Compatibilidad
      'Reprogramada': { variant: 'default' as const, label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' },
      'Solic Reprogram': { variant: 'default' as const, label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' }, // Compatibilidad
      'Solicitud de Reprogramación': { variant: 'default' as const, label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' }, // Compatibilidad
      'Confirmada': { variant: 'default' as const, label: 'Confirmada', className: 'bg-green-100 text-green-800' },
      'Pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
      'En Proceso': { variant: 'default' as const, label: 'En Proceso' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const aprobarReprogramacion = async (cita: Cita) => {
    setProcesando(prev => ({ ...prev, [cita.id_cita]: true }));
    try {
      const fechaActual = obtenerFechaActualVenezuelaUTC();

      // Cambiar estado de "Reprogramada" a "Programada"
      // para que el cliente confirme la nueva fecha propuesta
      const { error: citaError } = await supabase
        .from('citas')
        .update({ 
          estado_cita: 'Programada'
          // Mantener la fecha_programada que el cliente solicitó
          // Mantener el motivo_reprogramacion
        })
        .eq('id_cita', cita.id_cita);

      if (citaError) throw citaError;

      // Obtener ID del cliente para notificación
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_cliente, clientes!inner(id_usuario)')
        .eq('id_orden', cita.id_orden)
        .single();

      const idUsuarioCliente = ordenData?.clientes?.id_usuario;

      // Crear notificación al cliente
      if (idUsuarioCliente) {
        await supabase
          .from('notificaciones')
          .insert([
            {
              id_orden: cita.id_orden,
              id_destinatario: idUsuarioCliente,
              tipo_notificacion: 'Cita Reprogramada',
              canal: 'Sistema_Interno',
              mensaje: `Se ha aprobado tu solicitud de reprogramación. Nueva fecha: ${formatearSoloFechaVenezuela(cita.fecha_programada)} a las ${formatearHoraVenezuela(cita.fecha_programada)}. Por favor, confirma esta nueva cita.`,
              fecha_enviada: fechaActual,
              leida: false
            }
          ]);
      }

      // Log de auditoría
      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;

      if (idUsuario) {
        await supabase
          .from('logs_auditoria')
          .insert([
            {
              id_usuario: idUsuario,
              id_orden: cita.id_orden,
              accion: 'APROBAR_REPROGRAMACION',
              descripcion: `Coordinador aprobó reprogramación de cita para orden ${cita.numero_orden}`,
              timestamp: fechaActual
            }
          ]);
      }

      success('Reprogramación aprobada', 'Se ha aprobado la reprogramación. El cliente ha sido notificado y debe confirmar la nueva fecha.');
      await cargarCitas();
    } catch (err: any) {
      console.error('Error aprobando reprogramación:', err);
      error('Error', 'No se pudo aprobar la reprogramación');
    } finally {
      setProcesando(prev => ({ ...prev, [cita.id_cita]: false }));
    }
  };

  if (cargando) {
    return (
      <Layout role="coordinator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando citas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Citas</h1>
            <p className="text-muted-foreground mt-2">Calendario de servicios programados</p>
          </div>
        </div>

        <div className={`grid gap-4 ${estadisticas.solicitudesReprogramacion > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <Card>
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Hoy</p>
              <p className="text-2xl font-bold">{estadisticas.hoy}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
              <p className="text-2xl font-bold">{estadisticas.estaSemana}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <User className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold">{estadisticas.confirmadas}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <MapPin className="h-8 w-8 mb-2 text-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
            </div>
          </Card>

          {estadisticas.solicitudesReprogramacion > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <div className="p-6">
                <AlertCircle className="h-8 w-8 mb-2 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">Solicitudes de Reprogramación</p>
                <p className="text-2xl font-bold text-orange-900">{estadisticas.solicitudesReprogramacion}</p>
            </div>
          </Card>
          )}
        </div>

        <div className="space-y-4">
          {citas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay citas programadas</p>
              </CardContent>
            </Card>
          ) : (
            citas.map((cita) => (
              <Card key={cita.id_cita}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                      CITA-{cita.id_cita.toString().padStart(3, '0')} - Orden {cita.numero_orden}
                  </CardTitle>
                    {getEstadoBadge(cita.estado_cita)}
                </div>
                  <CardDescription>Cliente: {cita.cliente.nombre_completo}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                      <span>Técnico: {cita.tecnico.nombre_completo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatFecha(cita.fecha_programada)} a las {formatHora(cita.fecha_programada)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{cita.direccion_servicio}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tipo de servicio:</span>
                      <span className="font-medium">{cita.tipo_servicio}</span>
                  </div>

                    {/* Mostrar alerta y botón para solicitudes de reprogramación */}
                    {(cita.estado_cita === 'Reprogramada' || cita.estado_cita === 'Solic Reprogram' || cita.estado_cita === 'Solicitud de Reprogramación') && (
                      <Alert className="bg-orange-50 border-orange-200 mt-4">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <p className="font-semibold mb-2">Solicitud de Reprogramación del Cliente</p>
                          <p className="text-sm mb-2">El cliente ha solicitado reprogramar esta cita.</p>
                          {cita.motivo_reprogramacion && (
                            <p className="text-xs mb-3 italic bg-orange-100 p-2 rounded">
                              <strong>Motivo:</strong> {cita.motivo_reprogramacion}
                            </p>
                          )}
                          <Button
                            onClick={() => aprobarReprogramacion(cita)}
                            disabled={procesando[cita.id_cita]}
                            size="sm"
                            className="mt-2"
                          >
                            {procesando[cita.id_cita] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aprobando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprobar Reprogramación
                              </>
                            )}
                    </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
