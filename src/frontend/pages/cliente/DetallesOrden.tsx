import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Separator } from "@/frontend/components/ui/separator";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { 
  ArrowLeft, FileText, Clock, CheckCircle, User, Calendar, MapPin, 
  Wrench, AlertCircle, AlertTriangle, Package, Phone, Mail,
  CheckCircle2, XCircle, Timer
} from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";

interface OrdenDetalle {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  descripcion_solicitud: string;
  direccion_servicio: string;
  estado: string;
  fecha_solicitud: string;
  fecha_limite: string | null;
  fecha_asignacion: string | null;
  fecha_completada: string | null;
  motivo_rechazo?: string | null;
  // Relaciones
  tecnico?: {
    nombre_completo: string;
    telefono: string;
    email: string;
    zona_cobertura: string;
  };
  agente_creador?: {
    nombre_completo: string;
  };
  citas?: Array<{
    id_cita: number;
    fecha_programada: string;
    fecha_confirmada: string | null;
    estado_cita: string;
    motivo_reprogramacion: string | null;
  }>;
  ejecuciones?: Array<{
    id_ejecucion: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    trabajo_realizado: string | null;
    estado_resultado: string;
    confirmacion_cliente: string;
    imagenes?: Array<{
      id_imagen: number;
      url_imagen: string;
      descripcion: string | null;
    }>;
  }>;
  impedimentos?: Array<{
    id_impedimento: number;
    tipo_impedimento: string;
    descripcion: string;
    estado_resolucion: string;
  }>;
}

export default function ClienteDetallesOrden() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { success, error } = useToast();
  
  const idOrden = searchParams.get("id");
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!idOrden) {
      error('Error', 'No se especificó el ID de la orden');
      navigate('/cliente/ordenes');
      return;
    }

    cargarDetallesOrden();
  }, [idOrden]);

  const cargarDetallesOrden = async () => {
    try {
      setCargando(true);

      // Obtener la orden con todas sus relaciones
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes_servicio')
        .select(`
          *,
          tecnico:tecnicos!id_tecnico_asignado (
            id_tecnico,
            usuario:usuarios!tecnicos_id_usuario_fkey (
              nombre_completo,
              telefono,
              email
            ),
            zona_cobertura
          ),
          agente:agentes_servicio!id_agente_creador (
            usuario:usuarios!agentes_servicio_id_usuario_fkey (
              nombre_completo
            )
          )
        `)
        .eq('id_orden', idOrden)
        .single();

      if (ordenError) throw ordenError;

      // Obtener citas
      const { data: citasData } = await supabase
        .from('citas')
        .select('*')
        .eq('id_orden', idOrden)
        .order('fecha_programada', { ascending: false });

      // Obtener ejecuciones
      const { data: ejecucionesData } = await supabase
        .from('ejecuciones_servicio')
        .select('*')
        .eq('id_orden', idOrden)
        .order('fecha_inicio', { ascending: false });

      // Obtener imágenes de las ejecuciones
      let imagenesData: any[] = [];
      if (ejecucionesData && ejecucionesData.length > 0) {
        const ejecucionIds = ejecucionesData.map((e: any) => e.id_ejecucion);
        
        // Intentar cargar desde tabla imagenes_servicio
        const { data: imagenes } = await supabase
          .from('imagenes_servicio')
          .select('*')
          .in('id_ejecucion', ejecucionIds);
        
        if (imagenes && imagenes.length > 0) {
          // Eliminar duplicados por URL
          const urlsUnicas = new Set<string>();
          imagenesData = imagenes.filter((img: any) => {
            if (urlsUnicas.has(img.url_imagen)) {
              return false; // Duplicado, omitir
            }
            urlsUnicas.add(img.url_imagen);
            return true;
          });
        }
        
        // Si no hay suficientes imágenes en imagenes_servicio, complementar con imagenes_urls (solo si no hay en tabla)
        if (imagenesData.length === 0) {
          ejecucionesData.forEach((ejecucion: any) => {
            if (ejecucion.imagenes_urls && Array.isArray(ejecucion.imagenes_urls)) {
              // Eliminar duplicados del array JSON
              const urlsUnicas = Array.from(new Set(ejecucion.imagenes_urls));
              // Verificar que no estén ya en imagenesData
              const urlsExistentes = new Set(imagenesData.map((img: any) => img.url_imagen));
              urlsUnicas.forEach((url: string, index: number) => {
                if (!urlsExistentes.has(url)) {
                  imagenesData.push({
                    id_imagen: index + 1,
                    id_ejecucion: ejecucion.id_ejecucion,
                    id_orden: ejecucion.id_orden,
                    url_imagen: url,
                    descripcion: null
                  });
                }
              });
            }
          });
        }
      }

      // Obtener impedimentos
      const { data: impedimentosData } = await supabase
        .from('impedimentos')
        .select('*')
        .eq('id_orden', idOrden)
        .order('id_impedimento', { ascending: false });

      // Obtener motivo de rechazo desde logs_auditoria si la orden está cancelada
      let motivoRechazo: string | null = null;
      if (ordenData.estado === 'Cancelada') {
        const { data: logRechazo } = await supabase
          .from('logs_auditoria')
          .select('descripcion')
          .eq('id_orden', idOrden)
          .eq('accion', 'RECHAZAR_ORDEN')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (logRechazo?.descripcion) {
          // Extraer el motivo del formato: "Agente rechazó orden XXXX - Motivo: [MOTIVO]"
          const match = logRechazo.descripcion.match(/Motivo:\s*(.+)/);
          if (match && match[1]) {
            motivoRechazo = match[1].trim();
          } else {
            // Si no tiene el formato esperado, usar toda la descripción
            motivoRechazo = logRechazo.descripcion;
          }
        }
      }

      // Construir objeto completo
      const ordenCompleta: OrdenDetalle = {
        ...ordenData,
        motivo_rechazo: motivoRechazo,
        tecnico: ordenData.tecnico ? {
          nombre_completo: ordenData.tecnico.usuario.nombre_completo,
          telefono: ordenData.tecnico.usuario.telefono,
          email: ordenData.tecnico.usuario.email,
          zona_cobertura: ordenData.tecnico.zona_cobertura
        } : undefined,
        agente_creador: ordenData.agente?.usuario ? {
          nombre_completo: ordenData.agente.usuario.nombre_completo
        } : undefined,
        citas: citasData || [],
        ejecuciones: (ejecucionesData || []).map((ejecucion: any) => ({
          ...ejecucion,
          imagenes: imagenesData.filter((img: any) => img.id_ejecucion === ejecucion.id_ejecucion).map((img: any) => ({
            id_imagen: img.id_imagen,
            url_imagen: img.url_imagen,
            descripcion: img.descripcion
          }))
        })),
        impedimentos: impedimentosData || []
      };

      setOrden(ordenCompleta);
    } catch (err: any) {
      console.error('Error cargando detalles:', err);
      error('Error', 'No se pudieron cargar los detalles de la orden');
    } finally {
      setCargando(false);
    }
  };

  const confirmarServicio = async (idEjecucion: number) => {
    if (!orden) return;

    try {
      // 1. Actualizar ejecución de servicio
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({ confirmacion_cliente: 'Confirmada' })
        .eq('id_ejecucion', idEjecucion);

      if (updateError) throw updateError;

      // 2. Actualizar estado de la orden a "Completada" (definitivamente)
      // Ahora también actualizamos fecha_completada cuando el cliente confirma
      const fechaActual = new Date().toISOString();
      const { error: ordenError } = await supabase
        .from('ordenes_servicio')
        .update({ 
          estado: 'Completada',
          fecha_completada: fechaActual
        })
        .eq('id_orden', orden.id_orden);

      if (ordenError) throw ordenError;

      // 3. Actualizar TODAS las citas de la orden a "Completada" cuando el cliente confirma
      // Esto asegura que todas las citas (incluyendo las anteriores por reprogramaciones) se actualicen
      if (orden.citas && orden.citas.length > 0) {
        // Actualizar todas las citas a "Completada"
        for (const cita of orden.citas) {
          if (cita.id_cita) {
            // Intentar actualizar a "Completada" primero
            const { error: citaError1 } = await supabase
              .from('citas')
              .update({ estado_cita: 'Completada' })
              .eq('id_cita', cita.id_cita);

            if (citaError1) {
              // Si "Completada" falla, intentar con "Confirmada"
              console.warn(`Error actualizando cita ${cita.id_cita} a "Completada":`, citaError1);
              
              const { error: citaError2 } = await supabase
                .from('citas')
                .update({ estado_cita: 'Confirmada' })
                .eq('id_cita', cita.id_cita);

              if (citaError2) {
                console.warn(`Error actualizando cita ${cita.id_cita} a "Confirmada":`, citaError2);
                // No lanzamos error, solo registramos la advertencia
              } else {
                console.log(`✅ Cita ${cita.id_cita} actualizada a "Confirmada" para orden ${orden.id_orden}`);
              }
            } else {
              console.log(`✅ Cita ${cita.id_cita} actualizada a "Completada" para orden ${orden.id_orden}`);
            }
          }
        }
      }

      // 4. Obtener IDs para notificaciones
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_tecnico_asignado,
          tecnicos!inner (
            usuarios!inner (
              id_usuario
            )
          )
        `)
        .eq('id_orden', orden.id_orden)
        .single();

      // Manejar si tecnicos es array o objeto único, y si usuarios es array o objeto único
      let idUsuarioTecnico: any = null;
      if (ordenData?.tecnicos) {
        const tecnico = Array.isArray(ordenData.tecnicos) ? ordenData.tecnicos[0] : (ordenData.tecnicos as any);
        if (tecnico?.usuarios) {
          const usuarios = tecnico.usuarios;
          idUsuarioTecnico = Array.isArray(usuarios) ? (usuarios[0] as any)?.id_usuario : (usuarios as any)?.id_usuario;
        }
      }

      // 4. Crear notificaciones
      if (idUsuarioTecnico) {
        await supabase
          .from('notificaciones')
          .insert([
            {
              id_orden: orden.id_orden,
              id_destinatario: idUsuarioTecnico,
              tipo_notificacion: 'Confirmación de Servicio',
              canal: 'Sistema_Interno',
              mensaje: `El cliente ha confirmado el servicio`,
              fecha_enviada: fechaActual,
              leida: false
            }
          ]);
      }

      // 5. Notificar a todos los coordinadores activos
      const { data: coordinadoresData, error: coordinadoresError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('tipo_usuario', 'Coordinador')
        .eq('estado', 'Activo');

      // Crear notificaciones para todos los coordinadores activos
      if (coordinadoresData && coordinadoresData.length > 0) {
        const notificacionesCoordinadores = coordinadoresData
          .filter(coord => coord.id_usuario != null)
          .map(coord => {
            const idDestinatario = typeof coord.id_usuario === 'string' 
              ? parseInt(coord.id_usuario, 10) 
              : coord.id_usuario;
            
            return {
              id_orden: orden.id_orden,
              id_destinatario: Number(idDestinatario),
              tipo_notificacion: 'Servicio Confirmado por Cliente',
              canal: 'Sistema_Interno',
              mensaje: `El cliente ha confirmado que el servicio fue realizado satisfactoriamente.`,
              fecha_enviada: fechaActual,
              leida: false
            };
          });

        if (notificacionesCoordinadores.length > 0) {
          await supabase
            .from('notificaciones')
            .insert(notificacionesCoordinadores);
        }
      }

      // 6. Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario?.id_usuario,
            id_orden: orden.id_orden,
            accion: 'CONFIRMAR_SERVICIO',
            descripcion: `Cliente confirmó el servicio de la orden ${orden.numero_orden}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Servicio confirmado', 'Has confirmado la ejecución del servicio. La orden ha sido cerrada exitosamente.');
      cargarDetallesOrden();
    } catch (err: any) {
      console.error('Error confirmando servicio:', err);
      error('Error', 'No se pudo confirmar el servicio');
    }
  };

  const rechazarServicio = async (idEjecucion: number) => {
    if (!orden) return;

    try {
      // 1. Actualizar ejecución de servicio
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({ confirmacion_cliente: 'Rechazada' })
        .eq('id_ejecucion', idEjecucion);

      if (updateError) throw updateError;

      // 2. Actualizar estado de la orden a "Rechazada" o mantener "En Proceso" para revisión
      const { error: ordenError } = await supabase
        .from('ordenes_servicio')
        .update({ estado: 'En Proceso' }) // Mantener en proceso para que el coordinador revise
        .eq('id_orden', orden.id_orden);

      if (ordenError) throw ordenError;

      // 3. Obtener ID del coordinador para notificación
      // Buscar un coordinador (podría mejorarse para obtener el coordinador específico)
      const { data: coordinadores } = await supabase
        .from('coordinadores_campo')
        .select('id_usuario')
        .limit(1)
        .single();

      // 4. Crear notificaciones
      const notificaciones = [];
      
      if (coordinadores?.id_usuario) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: coordinadores.id_usuario,
          tipo_notificacion: 'Servicio Rechazado',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha rechazado el servicio. Se requiere revisión.`,
          fecha_enviada: new Date().toISOString(),
          leida: false
        });
      }

      // Notificar también al técnico
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_tecnico_asignado,
          tecnicos!inner (
            usuarios!inner (
              id_usuario
            )
          )
        `)
        .eq('id_orden', orden.id_orden)
        .single();

      const idUsuarioTecnico = ordenData?.tecnicos?.usuarios?.id_usuario;
      
      if (idUsuarioTecnico) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: idUsuarioTecnico,
          tipo_notificacion: 'Servicio Rechazado',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha rechazado el servicio de la orden ${orden.numero_orden}`,
          fecha_enviada: new Date().toISOString(),
          leida: false
        });
      }

      if (notificaciones.length > 0) {
        await supabase
          .from('notificaciones')
          .insert(notificaciones);
      }

      // 5. Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario?.id_usuario,
            id_orden: orden.id_orden,
            accion: 'RECHAZAR_SERVICIO',
            descripcion: `Cliente rechazó el servicio de la orden ${orden.numero_orden}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Servicio rechazado', 'Se ha notificado que rechazas el servicio. El coordinador revisará el caso.');
      cargarDetallesOrden();
    } catch (err: any) {
      console.error('Error rechazando servicio:', err);
      error('Error', 'No se pudo rechazar el servicio');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, { variant: any; icon: any; className: string }> = {
      'Creada': { variant: 'secondary', icon: Clock, className: 'bg-gray-100 text-gray-800' },
      'Validada': { variant: 'secondary', icon: CheckCircle, className: 'bg-blue-100 text-blue-800' },
      'Asignada': { variant: 'default', icon: User, className: 'bg-purple-100 text-purple-800' },
      'En Proceso': { variant: 'default', icon: Wrench, className: 'bg-yellow-100 text-yellow-800' },
      'Completada': { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
      'Cancelada': { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800' },
      'Con_Impedimento': { variant: 'destructive', icon: AlertTriangle, className: 'bg-orange-100 text-orange-800' },
    };

    const estilo = estilos[estado] || estilos['Creada'];
    const Icon = estilo.icon;

    return (
      <Badge variant={estilo.variant} className={estilo.className}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.replace('_', ' ')}
      </Badge>
    );
  };


  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    // Usar la función de dateUtils que maneja correctamente la zona horaria de Venezuela
    return formatearFechaVenezuela(fecha);
  };

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando detalles...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orden) {
    return (
      <Layout role="client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró la orden solicitada
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente/ordenes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Detalles de la Orden</h1>
            <p className="text-muted-foreground mt-1">
              Orden #{orden.numero_orden}
            </p>
          </div>
          {getEstadoBadge(orden.estado)}
        </div>

        {/* Mostrar motivo de rechazo si la orden está cancelada */}
        {orden.estado === 'Cancelada' && orden.motivo_rechazo && (
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold text-base">Orden Rechazada</p>
              <div className="space-y-1">
                <p className="text-sm font-medium">Motivo del rechazo:</p>
                <p className="text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {orden.motivo_rechazo}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información de la Orden */}
            <Card>
              <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Información del Servicio
                    </CardTitle>
                <CardDescription>Detalles de la solicitud</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <p className="text-sm text-muted-foreground">Tipo de Servicio</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Package className="h-4 w-4 text-primary" />
                      <p className="font-medium">{orden.tipo_servicio}</p>
                  </div>
                  </div>
                </div>

                <Separator />

                  <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Descripción del Problema
                  </h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    {orden.descripcion_solicitud}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección del Servicio
                  </h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    {orden.direccion_servicio}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline de Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Cronología
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Fecha de Solicitud</p>
                      <p className="text-sm text-muted-foreground">{formatFecha(orden.fecha_solicitud)}</p>
                    </div>
                  </div>

                  {orden.fecha_asignacion && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-100 p-2">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Fecha de Asignación</p>
                        <p className="text-sm text-muted-foreground">{formatFecha(orden.fecha_asignacion)}</p>
                      </div>
                    </div>
                  )}

                  {orden.fecha_limite && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-100 p-2">
                        <Timer className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Fecha Límite</p>
                        <p className="text-sm text-muted-foreground">{formatFecha(orden.fecha_limite)}</p>
                      </div>
                    </div>
                  )}

                  {orden.fecha_completada && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Fecha de Completación</p>
                        <p className="text-sm text-muted-foreground">{formatFecha(orden.fecha_completada)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Citas */}
            {orden.citas && orden.citas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Citas Programadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orden.citas.map((cita) => (
                      <div key={cita.id_cita} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge>{cita.estado_cita}</Badge>
                          <p className="text-sm text-muted-foreground">
                            {formatFecha(cita.fecha_programada)}
                          </p>
                        </div>
                        {cita.motivo_reprogramacion && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Motivo de reprogramación:</strong> {cita.motivo_reprogramacion}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Ejecuciones */}
            {orden.ejecuciones && orden.ejecuciones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Ejecución del Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orden.ejecuciones.map((ejecucion) => (
                    <div key={ejecucion.id_ejecucion} className="p-4 border rounded-lg space-y-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Inicio</p>
                          <p className="font-medium">{formatFecha(ejecucion.fecha_inicio)}</p>
                        </div>
                        {ejecucion.fecha_fin && (
                          <div>
                            <p className="text-sm text-muted-foreground">Fin</p>
                            <p className="font-medium">{formatFecha(ejecucion.fecha_fin)}</p>
                          </div>
                        )}
                      </div>

                      {ejecucion.trabajo_realizado && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Documentación del Trabajo:</p>
                          <div className="bg-gray-50 p-3 rounded space-y-3">
                            {(() => {
                              const trabajo = ejecucion.trabajo_realizado || '';
                              if (!trabajo) {
                                return <p className="text-muted-foreground italic">No especificado</p>;
                              }
                              
                              // Parsear trabajo_realizado para separar trabajo, equipos y recomendaciones
                              const partes = trabajo.split('\n\n');
                              const trabajoRealizado = partes[0] || '';
                              let equipos = '';
                              let recomendaciones = '';
                              
                              partes.forEach((parte: string) => {
                                if (parte.startsWith('Equipos Utilizados:')) {
                                  equipos = parte.replace('Equipos Utilizados:', '').trim();
                                } else if (parte.startsWith('Recomendaciones:')) {
                                  recomendaciones = parte.replace('Recomendaciones:', '').trim();
                                }
                              });
                              
                              return (
                                <div className="space-y-4">
                                  {trabajoRealizado && (
                                    <div>
                                      <p className="font-semibold text-sm mb-1">Descripción del trabajo:</p>
                                      <p className="text-sm whitespace-pre-wrap">{trabajoRealizado}</p>
                                    </div>
                                  )}
                                  {equipos && (
                                    <div className="pt-2 border-t">
                                      <p className="font-semibold text-sm mb-1">Equipos utilizados:</p>
                                      <p className="text-sm whitespace-pre-wrap">{equipos}</p>
                                    </div>
                                  )}
                                  {recomendaciones && (
                                    <div className="pt-2 border-t">
                                      <p className="font-semibold text-sm mb-1">Recomendaciones:</p>
                                      <p className="text-sm whitespace-pre-wrap">{recomendaciones}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Mostrar imágenes si existen */}
                      {ejecucion.imagenes && ejecucion.imagenes.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Fotografías del Trabajo:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {ejecucion.imagenes.map((imagen) => (
                              <div key={imagen.id_imagen} className="relative group">
                                <img
                                  src={imagen.url_imagen}
                                  alt={imagen.descripcion || `Imagen ${imagen.id_imagen}`}
                                  className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(imagen.url_imagen, '_blank')}
                                />
                                {imagen.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">{imagen.descripcion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Estado del Resultado</p>
                        <Badge>{ejecucion.estado_resultado}</Badge>
                      </div>

                      {ejecucion.confirmacion_cliente === 'Pendiente' && ejecucion.fecha_inicio && ejecucion.fecha_fin && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold mb-3">¿Confirmas que el servicio fue realizado?</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => confirmarServicio(ejecucion.id_ejecucion)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rechazarServicio(ejecucion.id_ejecucion)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      )}

                      {ejecucion.confirmacion_cliente === 'Confirmada' && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Servicio confirmado por el cliente
                          </AlertDescription>
                        </Alert>
                      )}

                      {ejecucion.confirmacion_cliente === 'Rechazada' && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            Servicio rechazado por el cliente
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Impedimentos */}
            {orden.impedimentos && orden.impedimentos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Impedimentos Reportados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orden.impedimentos.map((impedimento) => (
                    <Alert key={impedimento.id_impedimento} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold">{impedimento.tipo_impedimento}</p>
                        <p className="text-sm mt-1">{impedimento.descripcion}</p>
                        <Badge className="mt-2">{impedimento.estado_resolucion}</Badge>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna Lateral */}
          <div className="space-y-6">
            {/* Técnico Asignado */}
            {orden.tecnico ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                  Técnico Asignado
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{orden.tecnico.nombre_completo}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Teléfono
                    </p>
                    <p className="font-medium">{orden.tecnico.telefono || 'No disponible'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="font-medium text-sm">{orden.tecnico.email}</p>
                </div>
                  
                  <Separator />
                  
                <div>
                    <p className="text-sm text-muted-foreground">Zona de Cobertura</p>
                    <p className="font-medium">{orden.tecnico.zona_cobertura}</p>
                </div>
              </CardContent>
            </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aún no se ha asignado un técnico a esta orden
                </AlertDescription>
              </Alert>
            )}

            {/* Agente Creador */}
            {orden.agente_creador && (
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Creada por
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="font-medium">{orden.agente_creador.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground mt-1">Agente de Servicio</p>
              </CardContent>
            </Card>
            )}

            {/* Botón de Volver */}
            <Button className="w-full" variant="outline" asChild>
              <Link to="/cliente/ordenes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Mis Órdenes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
