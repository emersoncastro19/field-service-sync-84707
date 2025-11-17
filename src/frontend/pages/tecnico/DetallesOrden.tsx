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
  cliente?: {
    nombre_completo: string;
    email: string;
    telefono: string | null;
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

export default function TecnicoDetallesOrden() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { error } = useToast();
  
  const idOrden = searchParams.get("id");
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!idOrden) {
      error('Error', 'No se especificó el ID de la orden');
      navigate('/tecnico/ordenes-completadas');
      return;
    }

    cargarDetallesOrden();
  }, [idOrden]);

  const cargarDetallesOrden = async () => {
    try {
      setCargando(true);

      // Obtener el técnico actual para verificar que es el asignado
      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;

      // Obtener el técnico_id del usuario actual
      const { data: tecnicoData } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (!tecnicoData) {
        error('Error', 'No se encontró el perfil de técnico');
        navigate('/tecnico/ordenes-completadas');
        return;
      }

      // Obtener la orden con todas sus relaciones
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes_servicio')
        .select(`
          *,
          agente:agentes_servicio!id_agente_creador (
            usuario:usuarios!agentes_servicio_id_usuario_fkey (
              nombre_completo
            )
          ),
          clientes (
            usuarios (
              nombre_completo,
              email,
              telefono
            )
          )
        `)
        .eq('id_orden', idOrden)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
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
          const match = logRechazo.descripcion.match(/Motivo:\s*(.+)/);
          if (match && match[1]) {
            motivoRechazo = match[1].trim();
          } else {
            motivoRechazo = logRechazo.descripcion;
          }
        }
      }

      // Construir objeto completo
      const ordenCompleta: OrdenDetalle = {
        ...ordenData,
        motivo_rechazo: motivoRechazo,
        agente_creador: ordenData.agente?.usuario ? {
          nombre_completo: ordenData.agente.usuario.nombre_completo
        } : undefined,
        cliente: ordenData.clientes?.usuarios ? {
          nombre_completo: ordenData.clientes.usuarios.nombre_completo,
          email: ordenData.clientes.usuarios.email,
          telefono: ordenData.clientes.usuarios.telefono
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
    return formatearFechaVenezuela(fecha);
  };

  if (cargando) {
    return (
      <Layout role="technician">
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
      <Layout role="technician">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró la orden solicitada o no tienes acceso a ella
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout role="technician">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/tecnico/ordenes-completadas">
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

            {/* Ejecuciones y Documentación */}
            {orden.ejecuciones && orden.ejecuciones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Ejecución del Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orden.ejecuciones.map((ejecucion) => (
                      <div key={ejecucion.id_ejecucion} className="border rounded-lg p-4 space-y-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Inicio</p>
                            <p className="font-medium text-sm">{formatFecha(ejecucion.fecha_inicio)}</p>
                          </div>
                          {ejecucion.fecha_fin && (
                            <div>
                              <p className="text-sm text-muted-foreground">Fin</p>
                              <p className="font-medium text-sm">{formatFecha(ejecucion.fecha_fin)}</p>
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

                        <div className="flex gap-4 text-sm pt-2 border-t">
                          <div>
                            <p className="text-muted-foreground">Estado:</p>
                            <Badge>{ejecucion.estado_resultado}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Confirmación Cliente:</p>
                            <Badge variant={ejecucion.confirmacion_cliente === 'Confirmada' ? 'default' : 'outline'}>
                              {ejecucion.confirmacion_cliente}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
            {/* Cliente */}
            {orden.cliente && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{orden.cliente.nombre_completo}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Teléfono
                    </p>
                    <p className="font-medium">{orden.cliente.telefono || 'No disponible'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="font-medium text-sm">{orden.cliente.email}</p>
                  </div>
                </CardContent>
              </Card>
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
              <Link to="/tecnico/ordenes-completadas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Órdenes Completadas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

