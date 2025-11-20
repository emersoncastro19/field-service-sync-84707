import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Calendar, Clock, MapPin, User, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearSoloFechaVenezuela, formatearHoraVenezuela, crearFechaVenezuelaUTC, obtenerFechaActualVenezuelaUTC } from "@/shared/utils/dateUtils";

interface Cita {
  id_cita: number;
  id_orden: number;
  fecha_programada: string;
  estado_cita: string;
  motivo_reprogramacion: string | null;
  orden: {
    numero_orden: string;
    tipo_servicio: string;
    direccion_servicio: string;
    estado: string;
  };
  tecnico: {
    nombre_completo: string;
    telefono: string | null;
  } | null;
}

export default function ClienteCitas() {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogReprogramacion, setDialogReprogramacion] = useState<{ open: boolean; cita: Cita | null }>({ open: false, cita: null });
  const [nuevaFechaCita, setNuevaFechaCita] = useState("");
  const [nuevaHoraCita, setNuevaHoraCita] = useState("");
  const [motivoReprogramacion, setMotivoReprogramacion] = useState("");
  const [procesando, setProcesando] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  const cargarCitas = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (clienteError) throw clienteError;
      if (!clienteData) throw new Error('No se encontraron datos del cliente');

      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select('id_orden, numero_orden, tipo_servicio, direccion_servicio, estado, id_tecnico_asignado')
        .eq('id_cliente', clienteData.id_cliente)
        .not('id_tecnico_asignado', 'is', null)
        .in('estado', ['Asignada', 'En Proceso', 'Completada']);

      if (ordenesError) throw ordenesError;
      if (!ordenesData || ordenesData.length === 0) {
        setCitas([]);
        return;
      }

      const ordenIds = ordenesData.map(o => o.id_orden);
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('*')
        .in('id_orden', ordenIds)
        .order('fecha_programada', { ascending: false });

      if (citasError) throw citasError;

      const tecnicoIds = [...new Set(ordenesData.map(o => o.id_tecnico_asignado).filter(id => id !== null))];
      let tecnicosMap: Record<number, { nombre_completo: string; telefono: string | null }> = {};
      
      if (tecnicoIds.length > 0) {
        const { data: tecnicosData } = await supabase
          .from('tecnicos')
          .select('id_tecnico, usuarios!inner(nombre_completo, telefono)')
          .in('id_tecnico', tecnicoIds);

        if (tecnicosData) {
          tecnicosMap = tecnicosData.reduce((acc, tecnico: any) => {
            acc[tecnico.id_tecnico] = {
              nombre_completo: tecnico.usuarios?.nombre_completo || 'Técnico desconocido',
              telefono: tecnico.usuarios?.telefono || null
            };
            return acc;
          }, {});
        }
      }

      const citasCompletas: Cita[] = (citasData || []).map((cita: any) => {
        const orden = ordenesData.find(o => o.id_orden === cita.id_orden);
        const tecnico = orden ? tecnicosMap[orden.id_tecnico_asignado] || null : null;
        return {
          ...cita,
          orden: {
            numero_orden: orden?.numero_orden || 'N/A',
            tipo_servicio: orden?.tipo_servicio || 'N/A',
            direccion_servicio: orden?.direccion_servicio || 'N/A',
            estado: orden?.estado || 'N/A'
          },
          tecnico: tecnico
        };
      });

      setCitas(citasCompletas);
    } catch (err: any) {
      console.error('Error cargando citas:', err);
      showToast('error', 'Error', 'No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => formatearSoloFechaVenezuela(fecha);
  const formatHora = (fecha: string) => formatearHoraVenezuela(fecha);

  const confirmarCita = async (cita: Cita) => {
    setProcesando(prev => ({ ...prev, [cita.id_cita]: true }));
    try {
      const fechaActual = obtenerFechaActualVenezuelaUTC();
      const { error: citaError } = await supabase
        .from('citas')
        .update({ estado_cita: 'Confirmada', fecha_confirmada: fechaActual })
        .eq('id_cita', cita.id_cita);
      if (citaError) throw citaError;

      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_tecnico_asignado, tecnicos!inner(usuarios!inner(id_usuario))')
        .eq('id_orden', cita.id_orden)
        .single();

      const idUsuarioTecnico = (ordenData?.tecnicos as any)?.usuarios?.id_usuario;
      if (idUsuarioTecnico) {
        await supabase.from('notificaciones').insert([{
          id_orden: cita.id_orden,
          id_destinatario: idUsuarioTecnico,
          tipo_notificacion: 'Cita Confirmada por Cliente',
          canal: 'Sistema_Interno',
          mensaje: `El cliente ha confirmado la cita. La fecha programada es ${formatFecha(cita.fecha_programada)} a las ${formatHora(cita.fecha_programada)}.`,
          fecha_enviada: fechaActual,
          leida: false
        }]);
      }

      const { data: coordinadoresData } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('tipo_usuario', 'Coordinador')
        .eq('estado', 'Activo');

      if (coordinadoresData && coordinadoresData.length > 0) {
        const notificacionesCoordinadores = coordinadoresData
          .filter(coord => coord.id_usuario != null)
          .map(coord => ({
            id_orden: cita.id_orden,
            id_destinatario: Number(coord.id_usuario),
            tipo_notificacion: 'Cita Confirmada por Cliente',
            canal: 'Sistema_Interno',
            mensaje: `El cliente ha confirmado la cita. La fecha programada es ${formatFecha(cita.fecha_programada)} a las ${formatHora(cita.fecha_programada)}.`,
            fecha_enviada: fechaActual,
            leida: false
          }));
        if (notificacionesCoordinadores.length > 0) {
          await supabase.from('notificaciones').insert(notificacionesCoordinadores);
        }
      }

      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;
      if (idUsuario) {
        await supabase.from('logs_auditoria').insert([{
          id_usuario: idUsuario,
          id_orden: cita.id_orden,
          accion: 'CONFIRMAR_CITA_CLIENTE',
          descripcion: `Cliente confirmó cita para orden ${cita.orden.numero_orden}`,
          timestamp: fechaActual
        }]);
      }

      showToast('success', 'Cita confirmada', 'Has confirmado la fecha programada. El técnico y el coordinador han sido notificados.');
      await cargarCitas();
    } catch (err: any) {
      console.error('Error confirmando cita:', err);
      showToast('error', 'Error', 'No se pudo confirmar la cita');
    } finally {
      setProcesando(prev => ({ ...prev, [cita.id_cita]: false }));
    }
  };

  const solicitarReprogramacion = async () => {
    if (!dialogReprogramacion.cita) return;
    const { cita } = dialogReprogramacion;

    if (!nuevaFechaCita || !nuevaHoraCita || !motivoReprogramacion.trim()) {
      showToast('error', 'Error', 'Debes seleccionar fecha, hora y especificar un motivo.');
      return;
    }

    setProcesando(prev => ({ ...prev, [cita.id_cita]: true }));
    try {
      const fechaActual = obtenerFechaActualVenezuelaUTC();
      const nuevaFechaProgramada = crearFechaVenezuelaUTC(nuevaFechaCita, nuevaHoraCita);

      const { error: citaError } = await supabase
        .from('citas')
        .update({ 
          estado_cita: 'Reprogramada',
          fecha_programada: nuevaFechaProgramada,
          motivo_reprogramacion: motivoReprogramacion.trim(),
          fecha_confirmada: null
        })
        .eq('id_cita', cita.id_cita);
      if (citaError) throw citaError;

      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_coordinador_supervisor')
        .eq('id_orden', cita.id_orden)
        .single();

      if (ordenData?.id_coordinador_supervisor) {
        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('id_usuario')
          .eq('id_coordinador', ordenData.id_coordinador_supervisor)
          .maybeSingle();
        if (coordinadorData?.id_usuario) {
          await supabase.from('notificaciones').insert([{
            id_orden: cita.id_orden,
            id_destinatario: coordinadorData.id_usuario,
            tipo_notificacion: 'Solicitud de Reprogramación',
            canal: 'Sistema_Interno',
            mensaje: `El cliente ha solicitado reprogramar la cita. Nueva fecha: ${formatFecha(nuevaFechaProgramada)} a las ${formatHora(nuevaFechaProgramada)}. Motivo: ${motivoReprogramacion.trim()}`,
            fecha_enviada: fechaActual,
            leida: false
          }]);
        }
      }

      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;
      if (idUsuario) {
        await supabase.from('logs_auditoria').insert([{
          id_usuario: idUsuario,
          id_orden: cita.id_orden,
          accion: 'SOLICITAR_REPROGRAMACION',
          descripcion: `Cliente solicitó reprogramar cita para orden ${cita.orden.numero_orden}. Motivo: ${motivoReprogramacion.trim()}`,
          timestamp: fechaActual
        }]);
      }

      showToast('success', 'Solicitud enviada', 'El coordinador revisará tu solicitud.');
      setDialogReprogramacion({ open: false, cita: null });
      await cargarCitas();
    } catch (err: any) {
      console.error('Error solicitando reprogramación:', err);
      showToast('error', 'Error', 'No se pudo solicitar la reprogramación');
    } finally {
      setProcesando(prev => ({ ...prev, [cita.id_cita]: false }));
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Propuesta': { variant: 'secondary', label: 'Propuesta del Coordinador' },
      'Pendiente de Confirmación': { variant: 'secondary', label: 'Propuesta del Coordinador' },
      'Programada': { variant: 'secondary', label: 'Programada' },
      'Reprogramada': { variant: 'default', label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' },
      'Solic Reprogram': { variant: 'default', label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' },
      'Solicitud de Reprogramación': { variant: 'default', label: 'Solicitud de Reprogramación', className: 'bg-orange-100 text-orange-800' },
      'Confirmada': { variant: 'default', label: 'Confirmada' },
      'Cancelada': { variant: 'destructive', label: 'Cancelada' },
      'Completada': { variant: 'default', label: 'Completada' },
      'En Proceso': { variant: 'default', label: 'En Proceso' },
    };
    const config = estilos[estado] || { variant: 'secondary', label: estado };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando citas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">Citas de servicio programadas</p>
        </div>

        {citas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes citas programadas</h3>
              <p className="text-muted-foreground">Las citas aparecerán aquí cuando se programen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {citas.map((cita) => (
              <Card key={cita.id_cita}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {cita.orden.tipo_servicio}
                      </CardTitle>
                      <CardDescription>Orden: {cita.orden.numero_orden}</CardDescription>
                    </div>
                    {getEstadoBadge(cita.estado_cita)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha</p>
                        <p className="font-medium">{formatFecha(cita.fecha_programada)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Hora</p>
                        <p className="font-medium">{formatHora(cita.fecha_programada)}</p>
                      </div>
                      {cita.tecnico && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Técnico</p>
                          <p className="font-medium">{cita.tecnico.nombre_completo}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Dirección</p>
                        <p className="font-medium">{cita.orden.direccion_servicio}</p>
                      </div>
                    </div>

                    {cita.motivo_reprogramacion && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground"><strong>Motivo de reprogramación:</strong> {cita.motivo_reprogramacion}</p>
                      </div>
                    )}

                    {(['Programada', 'Propuesta', 'Pendiente de Confirmación'].includes(cita.estado_cita)) && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <p className="font-semibold mb-2">Propuesta de cita del coordinador</p>
                          <p className="text-sm mb-3">Por favor, confirma si te parece bien o solicita una reprogramación.</p>
                          <div className="flex gap-2 mt-3">
                            <Button onClick={() => confirmarCita(cita)} disabled={procesando[cita.id_cita]} className="flex-1" size="sm">
                              {procesando[cita.id_cita] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmando...</> : <><CheckCircle className="mr-2 h-4 w-4" />Confirmar Cita</>}
                            </Button>
                            <Button variant="outline" onClick={() => setDialogReprogramacion({ open: true, cita })} disabled={procesando[cita.id_cita]} className="flex-1" size="sm">
                              <XCircle className="mr-2 h-4 w-4" />Solicitar Reprogramación
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {(['Reprogramada', 'Solic Reprogram', 'Solicitud de Reprogramación'].includes(cita.estado_cita)) && (
                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <p className="font-semibold mb-2">Solicitud de reprogramación enviada</p>
                          <p className="text-sm mb-2">El coordinador revisará tu solicitud y te notificará.</p>
                          {cita.motivo_reprogramacion && <p className="text-xs mt-2 italic">Motivo: {cita.motivo_reprogramacion}</p>}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogReprogramacion.open} onOpenChange={(open) => !open && setDialogReprogramacion({ open: false, cita: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Reprogramación de Cita</DialogTitle>
            <DialogDescription>Selecciona una nueva fecha y especifica el motivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">Nueva Fecha</Label>
              <Input id="new-date" type="date" value={nuevaFechaCita} onChange={(e) => setNuevaFechaCita(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-time">Nueva Hora</Label>
              <Input id="new-time" type="time" value={nuevaHoraCita} onChange={(e) => setNuevaHoraCita(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de Reprogramación *</Label>
              <Textarea id="reason" placeholder="Explica por qué necesitas reprogramar..." value={motivoReprogramacion} onChange={(e) => setMotivoReprogramacion(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogReprogramacion({ open: false, cita: null })}>Cancelar</Button>
              <Button className="flex-1" onClick={solicitarReprogramacion} disabled={!!procesando[dialogReprogramacion.cita?.id_cita || 0] || !nuevaFechaCita || !nuevaHoraCita || !motivoReprogramacion.trim()}>
                {procesando[dialogReprogramacion.cita?.id_cita || 0] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar Solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
