import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Textarea } from "@/frontend/components/ui/textarea";
import { 
  FileText, User, CheckCircle2, XCircle, AlertCircle, Calendar, 
  MapPin, Phone, Mail, ShieldCheck, AlertTriangle, Clock 
} from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  direccion_servicio: string;
  descripcion_solicitud: string;
  cliente: {
    id_cliente: number;
    nombre_completo: string;
    email: string;
    telefono: string | null;
    tipo_cliente: string;
    estado_cuenta: string;
  };
}

export default function ValidarOrdenes() {
  const { usuario } = useAuth();
  const { success, error } = useToast();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [validando, setValidando] = useState(false);
  
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [esDialogRechazo, setEsDialogRechazo] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setCargando(true);

      // Cargar órdenes con estado "Creada"
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          direccion_servicio,
          descripcion_solicitud,
          clientes!inner (
            id_cliente,
            tipo_cliente,
            estado_cuenta,
            usuarios!inner (
              nombre_completo,
              email,
              telefono
            )
          )
        `)
        .eq('estado', 'Creada')
        .order('fecha_solicitud', { ascending: false });

      if (ordenesError) throw ordenesError;

      // Transformar datos de órdenes
      const ordenesFormateadas: Orden[] = ordenesData.map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        direccion_servicio: orden.direccion_servicio,
        descripcion_solicitud: orden.descripcion_solicitud,
        cliente: {
          id_cliente: orden.clientes.id_cliente,
          nombre_completo: orden.clientes.usuarios.nombre_completo,
          email: orden.clientes.usuarios.email,
          telefono: orden.clientes.usuarios.telefono,
          tipo_cliente: orden.clientes.tipo_cliente,
          estado_cuenta: orden.clientes.estado_cuenta
        }
      }));

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes pendientes de validación');
    } finally {
      setCargando(false);
    }
  };

  const abrirDialogValidacion = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    setMotivoRechazo("");
    setEsDialogRechazo(false);
    setDialogOpen(true);
  };

  const abrirDialogRechazo = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    setMotivoRechazo("");
    setEsDialogRechazo(true);
    setDialogOpen(true);
  };

  const validarOrden = async () => {
    if (!ordenSeleccionada || !usuario) return;

    // Verificaciones
    const validaciones = {
      clienteActivo: ordenSeleccionada.cliente.estado_cuenta === 'Activo',
      descripcionClara: ordenSeleccionada.descripcion_solicitud.trim().length >= 20,
      direccionValida: ordenSeleccionada.direccion_servicio && ordenSeleccionada.direccion_servicio.trim().length > 0,
      informacionCompleta: ordenSeleccionada.cliente.telefono && ordenSeleccionada.cliente.email
    };

    // Validar que todas las condiciones se cumplan
    if (!validaciones.clienteActivo) {
      error('No se puede validar', 'El cliente no está activo');
      return;
    }

    if (!validaciones.descripcionClara) {
      error('No se puede validar', 'La descripción de la orden no cumple con el mínimo de caracteres requeridos (20 caracteres)');
      return;
    }

    if (!validaciones.direccionValida) {
      error('No se puede validar', 'La dirección de servicio no es válida');
      return;
    }

    if (!validaciones.informacionCompleta) {
      error('No se puede validar', 'La información de contacto del cliente está incompleta');
      return;
    }

    setValidando(true);
    try {
      // Actualizar el estado de la orden a "Validada"
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({
          estado: 'Validada'
        })
        .eq('id_orden', ordenSeleccionada.id_orden);

      if (updateError) {
        console.error('Error actualizando orden:', updateError);
        throw updateError;
      }

      // Registrar en LOGS_AUDITORIA
      const { error: logError } = await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario.id_usuario,
            id_orden: ordenSeleccionada.id_orden,
            accion: 'VALIDAR_ORDEN',
            descripcion: `Agente validó orden ${ordenSeleccionada.numero_orden} - Cliente: ${ordenSeleccionada.cliente.nombre_completo} - Tipo: ${ordenSeleccionada.tipo_servicio}`,
            timestamp: new Date().toISOString()
          }
        ]);

      if (logError) {
        console.error('Error registrando log de validación:', logError);
      }

      // Obtener ID del cliente para notificación
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id_usuario')
        .eq('id_cliente', ordenSeleccionada.cliente.id_cliente)
        .single();

      // Obtener coordinadores para notificación
      const { data: coordinadoresData } = await supabase
        .from('coordinadores_campo')
        .select('id_usuario');

      const fechaActual = new Date().toISOString();
      const notificaciones = [];

      // Notificar al cliente
      if (clienteData?.id_usuario) {
        const idUsuarioCliente = typeof clienteData.id_usuario === 'string' 
          ? parseInt(clienteData.id_usuario, 10) 
          : clienteData.id_usuario;

        notificaciones.push({
          id_orden: ordenSeleccionada.id_orden,
          id_destinatario: idUsuarioCliente,
          tipo_notificacion: 'Orden Validada',
          canal: 'Sistema_Interno',
          mensaje: `Tu orden ha sido validada y está en proceso de asignación.`,
          fecha_enviada: fechaActual,
          leida: false
        });
      }

      // Notificar a todos los coordinadores
      if (coordinadoresData && coordinadoresData.length > 0) {
        coordinadoresData.forEach((coordinador: any) => {
          if (coordinador.id_usuario) {
            const idUsuarioCoordinador = typeof coordinador.id_usuario === 'string' 
              ? parseInt(coordinador.id_usuario, 10) 
              : coordinador.id_usuario;

            notificaciones.push({
              id_orden: ordenSeleccionada.id_orden,
              id_destinatario: idUsuarioCoordinador,
              tipo_notificacion: 'Orden Validada',
              canal: 'Sistema_Interno',
              mensaje: `Nueva orden validada y lista para asignación de técnico.`,
              fecha_enviada: fechaActual,
              leida: false
            });
          }
        });
      }

      // Insertar notificaciones
      if (notificaciones.length > 0) {
        const { error: notifError } = await supabase
          .from('notificaciones')
          .insert(notificaciones);

        if (notifError) {
          console.error('Error enviando notificaciones:', notifError);
        } else {
          console.log(`✅ ${notificaciones.length} notificaciones enviadas (Cliente y Coordinadores)`);
        }
      }

      success('Orden validada', `La orden ${ordenSeleccionada.numero_orden} ha sido validada exitosamente. El cliente y los coordinadores han sido notificados.`);
      
      // Recargar datos
      await cargarOrdenes();
      
      // Cerrar dialog y limpiar estado
      setDialogOpen(false);
      setOrdenSeleccionada(null);
      setEsDialogRechazo(false);

    } catch (err: any) {
      console.error('Error validando orden:', err);
      error('Error', err.message || 'No se pudo validar la orden');
    } finally {
      setValidando(false);
    }
  };

  const rechazarOrden = async () => {
    if (!ordenSeleccionada || !usuario) {
      error('Error', 'No hay orden seleccionada o usuario no autenticado');
      return;
    }

    // Validar que el motivo tenga al menos 10 caracteres
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      error('Error', 'Debes proporcionar un motivo de rechazo de al menos 10 caracteres');
      return;
    }

    setValidando(true);
    try {
      // Actualizar el estado de la orden a "Cancelada"
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({
          estado: 'Cancelada'
        })
        .eq('id_orden', ordenSeleccionada.id_orden);

      if (updateError) throw updateError;

      // Registrar en LOGS_AUDITORIA con el motivo del rechazo
      const { error: logError } = await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario.id_usuario,
            id_orden: ordenSeleccionada.id_orden,
            accion: 'RECHAZAR_ORDEN',
            descripcion: `Agente rechazó orden ${ordenSeleccionada.numero_orden} - Motivo: ${motivoRechazo.trim()}`,
            timestamp: new Date().toISOString()
          }
        ]);

      if (logError) {
        console.error('Error registrando log de rechazo:', logError);
        // No lanzamos error, solo lo registramos
      }

      // Obtener ID del cliente para notificación
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id_usuario')
        .eq('id_cliente', ordenSeleccionada.cliente.id_cliente)
        .single();

      // Crear notificación al cliente
      if (clienteData?.id_usuario) {
        const idUsuarioCliente = typeof clienteData.id_usuario === 'string' 
          ? parseInt(clienteData.id_usuario, 10) 
          : clienteData.id_usuario;

        const fechaActual = new Date().toISOString();

        const { error: notifError } = await supabase
          .from('notificaciones')
          .insert([
            {
              id_orden: ordenSeleccionada.id_orden,
              id_destinatario: idUsuarioCliente,
              tipo_notificacion: 'Orden Rechazada',
              canal: 'Sistema_Interno',
              mensaje: `Tu orden ha sido rechazada. Motivo: ${motivoRechazo.trim()}`,
              fecha_enviada: fechaActual,
              leida: false
            }
          ]);

        if (notifError) {
          console.error('Error enviando notificación al cliente:', notifError);
        } else {
          console.log('✅ Notificación enviada al cliente sobre rechazo de orden');
        }
      }

      success('Orden rechazada', `La orden ${ordenSeleccionada.numero_orden} ha sido rechazada. Motivo: ${motivoRechazo.trim()}. El cliente ha sido notificado.`);
      
      // Recargar datos
      await cargarOrdenes();
      
      // Cerrar dialog y limpiar estado
      setDialogOpen(false);
      setOrdenSeleccionada(null);
      setMotivoRechazo("");
      setEsDialogRechazo(false);

    } catch (err: any) {
      console.error('Error rechazando orden:', err);
      error('Error', err.message || 'No se pudo rechazar la orden');
    } finally {
      setValidando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    // Usar formatearFechaVenezuela para manejar correctamente la zona horaria
    return formatearFechaVenezuela(fecha);
  };


  const getEstadoClienteBadge = (estado: string) => {
    if (estado === 'Activo') {
      return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
    }
    return <Badge variant="destructive">Inactivo</Badge>;
  };

  if (cargando) {
    return (
      <Layout role="agent">
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
    <Layout role="agent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validar Órdenes</h1>
          <p className="text-muted-foreground mt-2">
            Valida las órdenes creadas por clientes antes de asignar técnicos ({ordenes.length} {ordenes.length === 1 ? 'orden pendiente' : 'órdenes pendientes'})
          </p>
        </div>

        {/* Lista de Órdenes */}
        {ordenes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay órdenes pendientes de validación</h3>
                <p className="text-muted-foreground">
                  Todas las órdenes han sido validadas o no hay órdenes nuevas
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {ordenes.map((orden) => {
              const clienteActivo = orden.cliente.estado_cuenta === 'Activo';
              const descripcionClara = orden.descripcion_solicitud.trim().length >= 20;
              const direccionValida = orden.direccion_servicio && orden.direccion_servicio.trim().length > 0;
              const informacionCompleta = orden.cliente.telefono && orden.cliente.email;
              const puedeValidar = clienteActivo && descripcionClara && direccionValida && informacionCompleta;

              return (
                <Card key={orden.id_orden} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {orden.numero_orden}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {orden.tipo_servicio}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente de Validación
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Información del Cliente */}
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Información del Cliente
                        </h4>
                        {getEstadoClienteBadge(orden.cliente.estado_cuenta)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nombre</p>
                          <p className="font-medium">{orden.cliente.nombre_completo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tipo de Cliente</p>
                          <p className="font-medium">{orden.cliente.tipo_cliente}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contacto</p>
                          <div className="flex items-center gap-2">
                            {orden.cliente.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {orden.cliente.telefono}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {orden.cliente.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Descripción de la Orden */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Descripción de la Solicitud
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {orden.descripcion_solicitud}
                      </p>
                      {!descripcionClara && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            La descripción es muy corta (mínimo 20 caracteres requeridos)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Información Adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Fecha de Solicitud</p>
                          <p className="font-medium">{formatFecha(orden.fecha_solicitud)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">Dirección de Servicio</p>
                          <p className="font-medium">{orden.direccion_servicio}</p>
                        </div>
                      </div>
                    </div>

                    {/* Verificaciones */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h4 className="font-semibold text-sm">Verificaciones</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          {clienteActivo ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Cliente activo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {descripcionClara ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Mínimo de caracteres en descripción (20 caracteres)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {direccionValida ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Dirección de servicio válida</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {informacionCompleta ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Información de contacto completa</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => abrirDialogValidacion(orden)}
                        disabled={!puedeValidar}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Validar Orden
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => abrirDialogRechazo(orden)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                    {!puedeValidar && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No se puede validar esta orden. Verifica que el cliente esté activo y la descripción tenga el mínimo de caracteres requeridos.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de Validación/Rechazo */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setOrdenSeleccionada(null);
            setMotivoRechazo("");
            setEsDialogRechazo(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {esDialogRechazo ? 'Rechazar Orden' : 'Validar Orden'}
              </DialogTitle>
              <DialogDescription>
                {esDialogRechazo 
                  ? `¿Estás seguro de que deseas rechazar la orden ${ordenSeleccionada?.numero_orden}? Debes proporcionar un motivo.`
                  : `¿Estás seguro de que deseas validar la orden ${ordenSeleccionada?.numero_orden}? Esta acción notificará al coordinador.`}
              </DialogDescription>
            </DialogHeader>
            
            {/* Campo de motivo de rechazo - Siempre visible cuando es rechazo */}
            {esDialogRechazo && (
              <div className="space-y-2">
                <label htmlFor="motivo-rechazo" className="text-sm font-medium">
                  Motivo del Rechazo *
                </label>
                <Textarea
                  id="motivo-rechazo"
                  className="w-full min-h-[100px]"
                  placeholder="Describe el motivo por el cual se rechaza esta orden (mínimo 10 caracteres)..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
                {motivoRechazo.trim().length > 0 && motivoRechazo.trim().length < 10 && (
                  <p className="text-xs text-red-600">
                    El motivo debe tener al menos 10 caracteres
                  </p>
                )}
              </div>
            )}
            
            {/* Información de advertencia si no cumple condiciones para validar */}
            {!esDialogRechazo && ordenSeleccionada && (
              ordenSeleccionada.cliente.estado_cuenta !== 'Activo' || 
              ordenSeleccionada.descripcion_solicitud.trim().length < 20
            ) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Esta orden no cumple las condiciones para ser validada. 
                  {ordenSeleccionada.cliente.estado_cuenta !== 'Activo' && ' El cliente no está activo.'}
                  {ordenSeleccionada.descripcion_solicitud.trim().length < 20 && ' La descripción es muy corta.'}
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setOrdenSeleccionada(null);
                  setMotivoRechazo("");
                  setEsDialogRechazo(false);
                }}
                disabled={validando}
              >
                Cancelar
              </Button>
              
              {esDialogRechazo ? (
                <Button 
                  variant="destructive" 
                  onClick={rechazarOrden} 
                  disabled={validando || !motivoRechazo.trim() || motivoRechazo.trim().length < 10}
                >
                  {validando ? 'Rechazando...' : 'Rechazar Orden'}
                </Button>
              ) : (
                <Button 
                  onClick={validarOrden} 
                  disabled={validando || 
                    (ordenSeleccionada && (
                      ordenSeleccionada.cliente.estado_cuenta !== 'Activo' || 
                      ordenSeleccionada.descripcion_solicitud.trim().length < 20
                    ))
                  }
                >
                  {validando ? 'Validando...' : 'Validar Orden'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


