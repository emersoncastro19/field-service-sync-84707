import { useEffect, useState } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { 
  FileText, User, Calendar, MapPin, Phone, Mail, 
  Clock, XCircle, Loader2, UserCheck
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/frontend/components/ui/alert-dialog";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";

interface OrdenDetalle {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  direccion_servicio: string;
  descripcion_solicitud: string;
  id_coordinador_supervisor: number | null;
  cliente: {
    nombre_completo: string;
    telefono: string | null;
    email: string;
    direccion: string | null;
  };
  tecnico?: {
    nombre_completo: string;
    telefono: string | null;
  } | null;
  coordinador?: {
    nombre_completo: string;
  } | null;
  cita?: {
    fecha_programada: string;
    estado_cita: string;
  } | null;
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
}

export default function DetallesOrden() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const idOrden = searchParams.get("id");
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!idOrden) {
      error('Error', 'No se especificó el ID de la orden');
      navigate('/agente');
      return;
    }
    cargarDetallesOrden();
  }, [idOrden]);

  const cargarDetallesOrden = async () => {
    if (!idOrden) return;

    try {
      setCargando(true);
      const idOrdenNum = parseInt(idOrden, 10);

      if (isNaN(idOrdenNum)) {
        throw new Error('ID de orden inválido');
      }

      console.log('🔍 Cargando detalles de orden:', idOrdenNum);

      // 1. Obtener la orden básica (sin relaciones complejas)
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes_servicio')
        .select('*')
        .eq('id_orden', idOrdenNum)
        .single();

      if (ordenError) {
        console.error('❌ Error obteniendo orden:', ordenError);
        throw new Error(`Error al obtener la orden: ${ordenError.message}`);
      }

      if (!ordenData) {
        throw new Error('No se encontró la orden');
      }

      console.log('✅ Orden obtenida:', ordenData);

      // 2. Obtener información del cliente
      let clienteInfo = {
        nombre_completo: 'Cliente desconocido',
        telefono: null as string | null,
        email: '',
        direccion: ordenData.direccion_servicio || ''
      };

      if (ordenData.id_cliente) {
        try {
          // Primero obtener el cliente (con dirección principal o servicio)
          const { data: clienteData, error: clienteError } = await supabase
            .from('clientes')
            .select('id_cliente, direccion_principal, direccion_servicio, id_usuario')
            .eq('id_cliente', ordenData.id_cliente)
            .maybeSingle();

          if (clienteError) {
            console.error('⚠️ Error obteniendo cliente:', clienteError);
          } else if (clienteData?.id_usuario) {
            // Luego obtener el usuario del cliente
            const idUsuarioCliente = typeof clienteData.id_usuario === 'string' 
              ? parseInt(clienteData.id_usuario, 10) 
              : clienteData.id_usuario;

            const { data: usuarioData, error: usuarioError } = await supabase
              .from('usuarios')
              .select('nombre_completo, telefono, email')
              .eq('id_usuario', idUsuarioCliente)
              .maybeSingle();

            if (usuarioError) {
              console.error('⚠️ Error obteniendo usuario del cliente:', usuarioError);
            } else if (usuarioData) {
              clienteInfo = {
                nombre_completo: usuarioData.nombre_completo || 'Cliente desconocido',
                telefono: usuarioData.telefono || null,
                email: usuarioData.email || '',
                direccion: clienteData.direccion_principal || clienteData.direccion_servicio || ordenData.direccion_servicio || ''
              };
            }
          }
        } catch (err: any) {
          console.error('⚠️ Error en proceso de cliente:', err);
          // Continuar con valores por defecto
        }
      }

      // 3. Obtener información del técnico (si está asignado)
      let tecnicoInfo: { nombre_completo: string; telefono: string | null } | null = null;

      if (ordenData.id_tecnico_asignado) {
        try {
          const { data: tecnicoData, error: tecnicoError } = await supabase
            .from('tecnicos')
            .select('id_usuario')
            .eq('id_tecnico', ordenData.id_tecnico_asignado)
            .maybeSingle();

          if (!tecnicoError && tecnicoData?.id_usuario) {
            const idUsuarioTecnico = typeof tecnicoData.id_usuario === 'string' 
              ? parseInt(tecnicoData.id_usuario, 10) 
              : tecnicoData.id_usuario;

            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('nombre_completo, telefono')
              .eq('id_usuario', idUsuarioTecnico)
              .maybeSingle();

            if (usuarioData) {
              tecnicoInfo = {
                nombre_completo: usuarioData.nombre_completo || 'Técnico desconocido',
                telefono: usuarioData.telefono || null
              };
            }
          }
        } catch (err: any) {
          console.error('⚠️ Error obteniendo técnico:', err);
          // Continuar sin técnico
        }
      }

      // 4. Obtener información del coordinador (si está asignado)
      let coordinadorInfo: { nombre_completo: string } | null = null;

      if (ordenData.id_coordinador_supervisor !== null && ordenData.id_coordinador_supervisor !== undefined) {
        try {
          // Convertir a número si es necesario (puede ser BIGINT)
          const idCoord = typeof ordenData.id_coordinador_supervisor === 'string' 
            ? parseInt(ordenData.id_coordinador_supervisor, 10) 
            : Number(ordenData.id_coordinador_supervisor);

          if (!isNaN(idCoord)) {
            const { data: coordinadorData, error: coordinadorError } = await supabase
              .from('coordinadores_campo')
              .select('id_usuario')
              .eq('id_coordinador', idCoord)
              .maybeSingle();

            if (!coordinadorError && coordinadorData?.id_usuario) {
              const idUsuarioCoord = typeof coordinadorData.id_usuario === 'string' 
                ? parseInt(coordinadorData.id_usuario, 10) 
                : coordinadorData.id_usuario;

              const { data: usuarioData } = await supabase
                .from('usuarios')
                .select('nombre_completo')
                .eq('id_usuario', idUsuarioCoord)
                .maybeSingle();

              if (usuarioData) {
                coordinadorInfo = {
                  nombre_completo: usuarioData.nombre_completo || 'Coordinador desconocido'
                };
              }
            }
          }
        } catch (err: any) {
          console.error('⚠️ Error obteniendo coordinador:', err);
          // Continuar sin coordinador
        }
      }

      // 5. Obtener cita asociada
      let citaInfo: { fecha_programada: string; estado_cita: string } | null = null;
      try {
        const { data: citaData } = await supabase
          .from('citas')
          .select('fecha_programada, estado_cita')
          .eq('id_orden', idOrdenNum)
          .order('fecha_programada', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (citaData) {
          citaInfo = {
            fecha_programada: citaData.fecha_programada,
            estado_cita: citaData.estado_cita
          };
        }
      } catch (err: any) {
        console.error('⚠️ Error obteniendo cita:', err);
        // Continuar sin cita
      }

      // 6. Obtener ejecuciones e imágenes
      let ejecucionesData: any[] = [];
      let imagenesData: any[] = [];
      try {
        const { data: ejecuciones } = await supabase
          .from('ejecuciones_servicio')
          .select('*')
          .eq('id_orden', idOrdenNum)
          .order('fecha_inicio', { ascending: false });

        ejecucionesData = ejecuciones || [];

        if (ejecucionesData.length > 0) {
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
      } catch (err: any) {
        console.error('⚠️ Error obteniendo ejecuciones/imágenes:', err);
      }

      // 7. Formatear datos
      const ordenFormateada: OrdenDetalle = {
        id_orden: ordenData.id_orden,
        numero_orden: ordenData.numero_orden || `ORD-${ordenData.id_orden}`,
        tipo_servicio: ordenData.tipo_servicio || 'N/A',
        estado: ordenData.estado || 'Desconocido',
        fecha_solicitud: ordenData.fecha_solicitud || new Date().toISOString(),
        fecha_asignacion: ordenData.fecha_asignacion || null,
        direccion_servicio: ordenData.direccion_servicio || '',
        descripcion_solicitud: ordenData.descripcion_solicitud || '',
        id_coordinador_supervisor: ordenData.id_coordinador_supervisor || null,
        cliente: clienteInfo,
        tecnico: tecnicoInfo,
        coordinador: coordinadorInfo,
        cita: citaInfo,
        ejecuciones: ejecucionesData.map((ejecucion: any) => ({
          ...ejecucion,
          imagenes: imagenesData.filter((img: any) => img.id_ejecucion === ejecucion.id_ejecucion).map((img: any) => ({
            id_imagen: img.id_imagen,
            url_imagen: img.url_imagen,
            descripcion: img.descripcion
          }))
        }))
      };

      console.log('✅ Orden formateada:', ordenFormateada);
      setOrden(ordenFormateada);
    } catch (err: any) {
      console.error('❌ Error completo cargando detalles de orden:', err);
      console.error('❌ Stack:', err.stack);
      const mensajeError = err.message || 'Error desconocido al cargar los detalles';
      error('Error', `No se pudieron cargar los detalles de la orden: ${mensajeError}`);
      
      // No redirigir automáticamente, dejar que el usuario vea el error
      // navigate('/agente');
    } finally {
      setCargando(false);
    }
  };

  const cancelarOrden = async () => {
    if (!orden) return;

    setCancelando(true);
    try {
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({ estado: 'Cancelada' })
        .eq('id_orden', orden.id_orden);

      if (updateError) throw updateError;

      success('Orden cancelada', `La orden ${orden.numero_orden} ha sido cancelada`);
      navigate('/agente');
    } catch (err: any) {
      console.error('Error cancelando orden:', err);
      error('Error', 'No se pudo cancelar la orden');
    } finally {
      setCancelando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Creada': { variant: 'secondary' as const, label: 'Creada' },
      'Validada': { variant: 'default' as const, label: 'Validada' },
      'Asignada': { variant: 'default' as const, label: 'Asignada' },
      'En Proceso': { variant: 'default' as const, label: 'En Proceso' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    // Usar formatearFechaVenezuela para manejar correctamente la zona horaria
    return formatearFechaVenezuela(fecha);
  };

  if (cargando) {
    return (
      <Layout role="agent">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando detalles de la orden...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orden) {
    return (
      <Layout role="agent">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontró la orden</p>
          <Button asChild>
            <Link to="/agente">Volver al Panel</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalles de Orden</h1>
            <p className="text-muted-foreground mt-2">Información completa de la orden de servicio</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/agente">Volver al Panel</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {orden.numero_orden}
                    </CardTitle>
                    <CardDescription>{orden.tipo_servicio}</CardDescription>
                  </div>
                  {getEstadoBadge(orden.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Descripción del Servicio</h3>
                  <p className="text-muted-foreground">{orden.descripcion_solicitud}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Creación
                    </p>
                    <p className="font-medium">{formatFecha(orden.fecha_solicitud)}</p>
                  </div>
                  {orden.fecha_asignacion && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Fecha de Asignación
                      </p>
                      <p className="font-medium">{formatFecha(orden.fecha_asignacion)}</p>
                    </div>
                  )}
                  {orden.cita && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Cita Programada
                      </p>
                      <p className="font-medium">{formatFecha(orden.cita.fecha_programada)}</p>
                      <Badge variant="outline" className="mt-1">{orden.cita.estado_cita}</Badge>
                    </div>
                  )}
                </div>

                {orden.tecnico && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Técnico Asignado
                    </h3>
                    <p className="text-muted-foreground">{orden.tecnico.nombre_completo}</p>
                    {orden.tecnico.telefono && (
                      <p className="text-sm text-muted-foreground mt-1">Tel: {orden.tecnico.telefono}</p>
                    )}
                  </div>
                )}

                {orden.coordinador && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Coordinador Asignador
                    </h3>
                    <p className="text-muted-foreground">{orden.coordinador.nombre_completo}</p>
                    {orden.id_coordinador_supervisor && (
                      <p className="text-sm text-muted-foreground mt-1">ID: {orden.id_coordinador_supervisor}</p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección de Servicio
                  </h3>
                  <p className="text-muted-foreground">{orden.direccion_servicio}</p>
                </div>

                {/* Mostrar ejecuciones y documentación si existen */}
                {orden.ejecuciones && orden.ejecuciones.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Ejecución del Servicio
                    </h3>
                    {orden.ejecuciones.map((ejecucion) => (
                      <div key={ejecucion.id_ejecucion} className="border rounded-lg p-4 space-y-3">
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

                        <div className="flex gap-4 text-sm">
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
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{orden.cliente.nombre_completo}</p>
                </div>
                {orden.cliente.telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </p>
                    <p className="font-medium">{orden.cliente.telefono}</p>
                  </div>
                )}
                {orden.cliente.email && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Correo
                    </p>
                    <p className="font-medium text-sm">{orden.cliente.email}</p>
                  </div>
                )}
                {orden.cliente.direccion && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </p>
                    <p className="font-medium text-sm">{orden.cliente.direccion}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {orden.estado !== 'Cancelada' && orden.estado !== 'Completada' && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Acciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={cancelando}>
                        {cancelando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar Orden
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción cancelará la orden de servicio {orden.numero_orden}. 
                          Esta operación no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground"
                          onClick={cancelarOrden}
                        >
                          Confirmar Cancelación
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
