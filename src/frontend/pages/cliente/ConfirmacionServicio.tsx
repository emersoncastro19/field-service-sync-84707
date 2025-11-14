import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { CheckCircle, AlertTriangle, FileText, Clock, User, Calendar } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { supabase } from "@/backend/config/supabaseClient";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";
import { useNavigate } from "react-router-dom";

interface OrdenCompletada {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  descripcion_solicitud: string;
  fecha_completada: string;
  ejecucion: {
    id_ejecucion: number;
    fecha_inicio: string;
    fecha_fin: string;
    trabajo_realizado: string;
  };
  tecnico: {
    nombre_completo: string;
  };
}

export default function ConfirmacionServicio() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState<OrdenCompletada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [procesando, setProcesando] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (usuario) {
      cargarOrdenesPendientes();
    }
  }, [usuario]);

  const cargarOrdenesPendientes = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el cliente
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('id_usuario', idUsuario)
        .single();

      if (clienteError) throw clienteError;

      // 2. Obtener órdenes completadas del cliente
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          descripcion_solicitud,
          fecha_completada,
          tecnicos!inner (
            usuarios!inner (
              nombre_completo
            )
          )
        `)
        .eq('id_cliente', clienteData.id_cliente)
        .in('estado', ['Completada', 'En Proceso'])
        .order('fecha_completada', { ascending: false });

      if (ordenesError) throw ordenesError;

      // 3. Obtener ejecuciones pendientes de confirmación
      // Filtrar solo las órdenes que tienen ejecuciones con confirmacion_cliente = 'Pendiente'
      const { data: ejecucionesData, error: ejecucionesError } = await supabase
        .from('ejecuciones_servicio')
        .select('*')
        .eq('confirmacion_cliente', 'Pendiente')
        .order('fecha_fin', { ascending: false });

      if (ejecucionesError) throw ejecucionesError;

      // Obtener IDs de órdenes de las ejecuciones pendientes
      const ordenIdsPendientes = ejecucionesData?.map((e: any) => e.id_orden) || [];
      
      if (ordenIdsPendientes.length === 0) {
        setOrdenes([]);
        return;
      }

      // Filtrar órdenes que están en "En Proceso" y tienen ejecuciones pendientes
      const ordenesConEjecucionesPendientes = ordenesData.filter((orden: any) => 
        ordenIdsPendientes.includes(orden.id_orden)
      );

      // 4. Combinar datos
      const ordenesCompletadas: OrdenCompletada[] = ordenesConEjecucionesPendientes
        .map((orden: any) => {
          const ejecucion = ejecucionesData?.find((e: any) => e.id_orden === orden.id_orden);
          return {
            id_orden: orden.id_orden,
            numero_orden: orden.numero_orden,
            tipo_servicio: orden.tipo_servicio,
            descripcion_solicitud: orden.descripcion_solicitud,
            fecha_completada: orden.fecha_completada,
            ejecucion: {
              id_ejecucion: ejecucion.id_ejecucion,
              fecha_inicio: ejecucion.fecha_inicio,
              fecha_fin: ejecucion.fecha_fin,
              trabajo_realizado: ejecucion.trabajo_realizado
            },
            tecnico: {
              nombre_completo: orden.tecnicos?.usuarios?.nombre_completo || 'Técnico desconocido'
            }
          };
        });

      setOrdenes(ordenesCompletadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes pendientes de confirmación');
    } finally {
      setCargando(false);
    }
  };

  const confirmarServicio = async (orden: OrdenCompletada) => {
    setProcesando(prev => ({ ...prev, [orden.id_orden]: true }));
    try {
      // 1. Actualizar ejecución de servicio
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({ confirmacion_cliente: 'Confirmada' })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

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
      const { data: todasLasCitas, error: citasError } = await supabase
        .from('citas')
        .select('id_cita, estado_cita')
        .eq('id_orden', orden.id_orden);

      if (!citasError && todasLasCitas && todasLasCitas.length > 0) {
        // Actualizar todas las citas a "Completada"
        for (const cita of todasLasCitas) {
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

      // 4. Obtener ID del técnico para notificación
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

      // 5. Obtener coordinador para notificación
      const { data: ordenDataCoordinador } = await supabase
        .from('ordenes_servicio')
        .select('id_coordinador_supervisor')
        .eq('id_orden', orden.id_orden)
        .single();

      let idUsuarioCoordinador: number | null = null;

      if (ordenDataCoordinador?.id_coordinador_supervisor) {
        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('id_usuario')
          .eq('id_coordinador', ordenDataCoordinador.id_coordinador_supervisor)
          .single();

        if (coordinadorData?.id_usuario) {
          idUsuarioCoordinador = typeof coordinadorData.id_usuario === 'string' 
            ? parseInt(coordinadorData.id_usuario, 10) 
            : coordinadorData.id_usuario;
        }
      }

      // 6. Crear notificaciones (usar la fechaActual ya declarada anteriormente)
      const notificaciones = [];

      // Notificar al técnico
      if (idUsuarioTecnico) {
        const idTecnico = typeof idUsuarioTecnico === 'string' 
          ? parseInt(idUsuarioTecnico, 10) 
          : idUsuarioTecnico;

        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: idTecnico,
          tipo_notificacion: 'Servicio Confirmado por Cliente',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha confirmado que el servicio de la orden ${orden.numero_orden} fue realizado satisfactoriamente.`,
          fecha_enviada: fechaActual,
          leida: false
        });
      }

      // Notificar al coordinador
      if (idUsuarioCoordinador) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: idUsuarioCoordinador,
          tipo_notificacion: 'Servicio Confirmado',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha confirmado el servicio completado en la orden ${orden.numero_orden}.`,
          fecha_enviada: fechaActual,
          leida: false
        });
      }

      if (notificaciones.length > 0) {
        const { error: notifError } = await supabase
          .from('notificaciones')
          .insert(notificaciones);

        if (notifError) {
          console.error('Error enviando notificaciones:', notifError);
        } else {
          console.log(`✅ ${notificaciones.length} notificaciones enviadas (Técnico y Coordinador)`);
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
      await cargarOrdenesPendientes();
    } catch (err: any) {
      console.error('Error confirmando servicio:', err);
      error('Error', 'No se pudo confirmar el servicio');
    } finally {
      setProcesando(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  const rechazarServicio = async (orden: OrdenCompletada) => {
    setProcesando(prev => ({ ...prev, [orden.id_orden]: true }));
    try {
      // 1. Actualizar ejecución de servicio
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({ confirmacion_cliente: 'Rechazada' })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

      if (updateError) throw updateError;

      // 2. Actualizar estado de la orden para revisión
      const { error: ordenError } = await supabase
        .from('ordenes_servicio')
        .update({ estado: 'En Proceso' })
        .eq('id_orden', orden.id_orden);

      if (ordenError) throw ordenError;

      // 3. Obtener IDs para notificaciones
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

      // 4. Obtener coordinador
      const { data: coordinadores } = await supabase
        .from('coordinadores_campo')
        .select('id_usuario')
        .limit(1)
        .single();

      // 5. Crear notificaciones
      const notificaciones = [];
      
      if (coordinadores?.id_usuario) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: coordinadores.id_usuario,
          tipo_notificacion: 'Servicio Rechazado',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha rechazado el servicio de la orden ${orden.numero_orden}. Se requiere revisión.`,
          fecha_enviada: new Date().toISOString(),
          leida: false
        });
      }

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

      // 6. Log de auditoría
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
      await cargarOrdenesPendientes();
    } catch (err: any) {
      console.error('Error rechazando servicio:', err);
      error('Error', 'No se pudo rechazar el servicio');
    } finally {
      setProcesando(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando órdenes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Confirmación de Servicio</h1>
          <p className="text-muted-foreground mt-2">Confirma la finalización de los servicios completados</p>
        </div>

        {ordenes.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes servicios pendientes de confirmación en este momento.
            </AlertDescription>
          </Alert>
        ) : (
        <div className="grid gap-6">
            {ordenes.map((orden) => (
              <Card key={orden.id_orden} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                        {orden.tipo_servicio}
                    </CardTitle>
                      <CardDescription>Orden: {orden.numero_orden}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendiente de Confirmación
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Técnico
                          </p>
                          <p className="font-medium">{orden.tecnico.nombre_completo}</p>
                      </div>
                      <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Fecha de Finalización
                          </p>
                          <p className="font-medium">
                            {formatearFechaVenezuela(orden.ejecucion.fecha_fin)}
                          </p>
                      </div>
                    </div>
                    
                    <div>
                        <p className="text-muted-foreground">Descripción del Problema</p>
                        <p className="font-medium mt-1">{orden.descripcion_solicitud}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-2">Trabajo Realizado</p>
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                          {(() => {
                            const trabajo = orden.ejecucion.trabajo_realizado || '';
                            if (!trabajo) {
                              return <p className="text-muted-foreground italic">No especificado</p>;
                            }
                            
                            // Parsear trabajo_realizado para separar trabajo, repuestos y recomendaciones
                            const partes = trabajo.split('\n\n');
                            const trabajoRealizado = partes[0] || '';
                            let repuestos = '';
                            let recomendaciones = '';
                            
                            partes.forEach((parte: string) => {
                              if (parte.startsWith('Repuestos Utilizados:')) {
                                repuestos = parte.replace('Repuestos Utilizados:', '').trim();
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
                                {repuestos && (
                                  <div className="pt-2 border-t">
                                    <p className="font-semibold text-sm mb-1">Repuestos utilizados:</p>
                                    <p className="text-sm whitespace-pre-wrap">{repuestos}</p>
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
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirmación del Cliente
                    </p>
                    <p className="text-sm text-muted-foreground">
                      El técnico ha completado el trabajo. Por favor confirme que el servicio fue realizado satisfactoriamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor={`comentario-${orden.id_orden}`}>
                      Comentarios (Opcional)
                    </Label>
                    <Textarea
                        id={`comentario-${orden.id_orden}`}
                      placeholder="Agregue cualquier comentario sobre el servicio recibido..."
                      rows={4}
                        value={comentarios[orden.id_orden] || ""}
                        onChange={(e) => setComentarios(prev => ({ ...prev, [orden.id_orden]: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1"
                        onClick={() => confirmarServicio(orden)}
                        disabled={procesando[orden.id_orden]}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                        {procesando[orden.id_orden] ? 'Confirmando...' : 'Confirmar Finalización'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                        onClick={() => rechazarServicio(orden)}
                        disabled={procesando[orden.id_orden]}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                        {procesando[orden.id_orden] ? 'Rechazando...' : 'Reportar un Problema'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>
    </Layout>
  );
}
