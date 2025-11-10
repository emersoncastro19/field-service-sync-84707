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

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  prioridad: string;
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
    plan_actual: string | null;
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
          prioridad,
          estado,
          fecha_solicitud,
          direccion_servicio,
          descripcion_solicitud,
          clientes!inner (
            id_cliente,
            tipo_cliente,
            estado_cuenta,
            plan_actual,
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
        prioridad: orden.prioridad,
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
          estado_cuenta: orden.clientes.estado_cuenta,
          plan_actual: orden.clientes.plan_actual
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
    setDialogOpen(true);
  };

  const validarOrden = async () => {
    if (!ordenSeleccionada || !usuario) return;

    // Verificaciones
    const validaciones = {
      clienteActivo: ordenSeleccionada.cliente.estado_cuenta === 'Activo',
      sinDeudas: ordenSeleccionada.cliente.estado_cuenta === 'Activo',
      descripcionClara: ordenSeleccionada.descripcion_solicitud.trim().length >= 20,
      servicioAplicable: true
    };

    // Validar que todas las condiciones se cumplan
    if (!validaciones.clienteActivo || !validaciones.sinDeudas) {
      error('No se puede validar', 'El cliente no está activo o tiene deudas pendientes');
      return;
    }

    if (!validaciones.descripcionClara) {
      error('No se puede validar', 'La descripción de la orden no es suficientemente clara (mínimo 20 caracteres)');
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

      // Notificar al coordinador (registro en logs)
      const { error: notifError } = await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario.id_usuario,
            id_orden: ordenSeleccionada.id_orden,
            accion: 'NOTIFICAR_COORDINADOR',
            descripcion: `Orden ${ordenSeleccionada.numero_orden} validada y lista para asignación de técnico`,
            timestamp: new Date().toISOString()
          }
        ]);

      if (notifError) {
        console.error('Error registrando notificación:', notifError);
      }

      success('Orden validada', `La orden ${ordenSeleccionada.numero_orden} ha sido validada exitosamente. El coordinador ha sido notificado.`);
      
      // Recargar datos
      await cargarOrdenes();
      
      // Cerrar dialog
      setDialogOpen(false);
      setOrdenSeleccionada(null);

    } catch (err: any) {
      console.error('Error validando orden:', err);
      error('Error', err.message || 'No se pudo validar la orden');
    } finally {
      setValidando(false);
    }
  };

  const rechazarOrden = async () => {
    if (!ordenSeleccionada || !usuario || !motivoRechazo.trim()) {
      error('Error', 'Debes proporcionar un motivo de rechazo');
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

      // Registrar en LOGS_AUDITORIA
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario.id_usuario,
            id_orden: ordenSeleccionada.id_orden,
            accion: 'RECHAZAR_ORDEN',
            descripcion: `Agente rechazó orden ${ordenSeleccionada.numero_orden} - Motivo: ${motivoRechazo}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Orden rechazada', `La orden ${ordenSeleccionada.numero_orden} ha sido rechazada.`);
      
      // Recargar datos
      await cargarOrdenes();
      
      // Cerrar dialog
      setDialogOpen(false);
      setOrdenSeleccionada(null);
      setMotivoRechazo("");

    } catch (err: any) {
      console.error('Error rechazando orden:', err);
      error('Error', 'No se pudo rechazar la orden');
    } finally {
      setValidando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrioridadBadge = (prioridad: string) => {
    const estilos: Record<string, string> = {
      'Baja': 'bg-blue-100 text-blue-800',
      'Media': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={estilos[prioridad] || estilos['Media']}>
        {prioridad}
      </Badge>
    );
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
              const puedeValidar = clienteActivo && descripcionClara;

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
                        {getPrioridadBadge(orden.prioridad)}
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
                          <p className="text-muted-foreground">Plan Actual</p>
                          <p className="font-medium">{orden.cliente.plan_actual || 'Sin plan asignado'}</p>
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
                          <span>Cliente activo y sin deudas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {descripcionClara ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>Descripción clara (mínimo 20 caracteres)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Servicio aplicable según plan</span>
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
                        onClick={() => {
                          setOrdenSeleccionada(orden);
                          setMotivoRechazo("");
                          setDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                    {!puedeValidar && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No se puede validar esta orden. Verifica que el cliente esté activo y la descripción sea clara.
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {ordenSeleccionada && ordenSeleccionada.cliente.estado_cuenta === 'Activo' && 
                 ordenSeleccionada.descripcion_solicitud.trim().length >= 20
                  ? 'Validar Orden' 
                  : 'Rechazar Orden'}
              </DialogTitle>
              <DialogDescription>
                {ordenSeleccionada && ordenSeleccionada.cliente.estado_cuenta === 'Activo' && 
                 ordenSeleccionada.descripcion_solicitud.trim().length >= 20
                  ? `¿Estás seguro de que deseas validar la orden ${ordenSeleccionada?.numero_orden}? Esta acción notificará al coordinador.`
                  : `¿Estás seguro de que deseas rechazar la orden ${ordenSeleccionada?.numero_orden}? Debes proporcionar un motivo.`}
              </DialogDescription>
            </DialogHeader>
            {ordenSeleccionada && (!ordenSeleccionada.cliente.estado_cuenta || ordenSeleccionada.cliente.estado_cuenta !== 'Activo' || ordenSeleccionada.descripcion_solicitud.trim().length < 20) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo del Rechazo *</label>
                <Textarea
                  className="w-full min-h-[100px]"
                  placeholder="Describe el motivo por el cual se rechaza esta orden..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                setOrdenSeleccionada(null);
                setMotivoRechazo("");
              }}>
                Cancelar
              </Button>
              {ordenSeleccionada && ordenSeleccionada.cliente.estado_cuenta === 'Activo' && 
               ordenSeleccionada.descripcion_solicitud.trim().length >= 20 ? (
                <Button onClick={validarOrden} disabled={validando}>
                  {validando ? 'Validando...' : 'Validar Orden'}
                </Button>
              ) : (
                <Button variant="destructive" onClick={rechazarOrden} disabled={validando || !motivoRechazo.trim()}>
                  {validando ? 'Rechazando...' : 'Rechazar Orden'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


