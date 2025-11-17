import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Badge } from "@/frontend/components/ui/badge";
import { 
  Bell, Search, Check, Loader2, CheckCircle2, XCircle, AlertCircle, 
  Calendar, Info 
} from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { cn } from "@/frontend/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

interface Notificacion {
  id_notificacion: number;
  id_orden: number | null;
  tipo_notificacion: string;
  mensaje: string;
  fecha_enviada: string;
  leida: boolean;
  ordenes_servicio?: {
    numero_orden: string;
  };
}

export default function Notificaciones() {
  const { usuario } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [noLeidas, setNoLeidas] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    if (!usuario?.id_usuario) {
      setCargando(false);
      return;
    }

    try {
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      if (isNaN(idUsuario) || idUsuario <= 0) {
        console.error('❌ ID de usuario inválido:', usuario.id_usuario);
        setCargando(false);
        return;
      }

      const { data: notificacionesData, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('id_destinatario', idUsuario)
        .order('fecha_enviada', { ascending: false });

      if (error) throw error;

      // Obtener números de orden si existen
      const ordenesIds = [...new Set((notificacionesData || [])
        .filter(n => n.id_orden)
        .map(n => n.id_orden))];

      let ordenesMap: Record<number, { numero_orden: string }> = {};
      
      if (ordenesIds.length > 0) {
        const { data: ordenesData } = await supabase
          .from('ordenes_servicio')
          .select('id_orden, numero_orden')
          .in('id_orden', ordenesIds);

        if (ordenesData) {
          ordenesMap = ordenesData.reduce((acc, orden) => {
            acc[orden.id_orden] = { numero_orden: orden.numero_orden };
            return acc;
          }, {} as Record<number, { numero_orden: string }>);
        }
      }

      const notifs = (notificacionesData || []).map((n: any) => ({
        id_notificacion: n.id_notificacion,
        id_orden: n.id_orden,
        tipo_notificacion: n.tipo_notificacion,
        mensaje: n.mensaje,
        fecha_enviada: n.fecha_enviada,
        leida: n.leida,
        ordenes_servicio: n.id_orden && ordenesMap[n.id_orden] 
          ? ordenesMap[n.id_orden] 
          : null
      }));

      setNotificaciones(notifs);
      const noLeidasCount = notifs.filter(n => !n.leida).length;
      setNoLeidas(noLeidasCount);
    } catch (err: any) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setCargando(false);
    }
  }, [usuario?.id_usuario]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const marcarComoLeida = async (idNotificacion: number) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_notificacion', idNotificacion);

      if (error) throw error;

      setNotificaciones(prev =>
        prev.map(n =>
          n.id_notificacion === idNotificacion ? { ...n, leida: true } : n
        )
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marcando notificación como leída:', err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (!usuario?.id_usuario || noLeidas === 0) return;

    try {
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_destinatario', idUsuario)
        .eq('leida', false);

      if (error) throw error;

      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
      success('Notificaciones marcadas', 'Todas las notificaciones han sido marcadas como leídas');
    } catch (err: any) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  const handleClickNotificacion = async (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id_notificacion);
    }

    if (notificacion.id_orden) {
      // Si es una notificación de cita, redirigir a citas
      if (notificacion.tipo_notificacion === 'Cita Programada' || 
          notificacion.tipo_notificacion === 'Cita Reprogramada') {
        navigate(`/cliente/citas`);
      } else {
        // Para todas las notificaciones relacionadas con órdenes, redirigir a detalles de la orden
        navigate(`/cliente/detalles-orden?id=${notificacion.id_orden}`);
      }
    }
  };

  const getIconoTipo = (tipo: string) => {
    if (tipo.toLowerCase().includes('error') || tipo.toLowerCase().includes('rechaz')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (tipo.toLowerCase().includes('complet') || tipo.toLowerCase().includes('confirm')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (tipo.toLowerCase().includes('cita') || tipo.toLowerCase().includes('asign')) {
      return <Calendar className="h-5 w-5 text-blue-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-600" />;
  };

  const formatFecha = (fecha: string) => {
    return formatearFechaVenezuela(fecha);
  };

  const notificacionesFiltradas = notificaciones.filter(notif => {
    const coincideEstado = filtroEstado === 'todas' || 
      (filtroEstado === 'leidas' && notif.leida) ||
      (filtroEstado === 'noLeidas' && !notif.leida);
    
    const coincideBusqueda = !busqueda.trim() ||
      notif.tipo_notificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.ordenes_servicio?.numero_orden.toLowerCase().includes(busqueda.toLowerCase());

    return coincideEstado && coincideBusqueda;
  });

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Notificaciones</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y revisa todas tus notificaciones
            </p>
          </div>
          {noLeidas > 0 && (
            <Button onClick={marcarTodasComoLeidas} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como leídas ({noLeidas})
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones ({notificaciones.length})
            </CardTitle>
            <CardDescription>
              {noLeidas > 0 && (
                <span className="text-primary font-medium">
                  {noLeidas} {noLeidas === 1 ? 'notificación no leída' : 'notificaciones no leídas'}
                </span>
              )}
              {noLeidas === 0 && 'Todas las notificaciones están leídas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar notificaciones..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="noLeidas">No leídas</SelectItem>
                    <SelectItem value="leidas">Leídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {notificacionesFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No hay notificaciones</p>
                      <p className="text-sm mt-2">
                        {busqueda || filtroEstado !== 'todas' 
                          ? 'No se encontraron notificaciones con los filtros aplicados'
                          : 'Te notificaremos cuando haya nuevas actualizaciones'}
                      </p>
                    </div>
                  ) : (
                    notificacionesFiltradas.map((notif) => (
                      <button
                        key={notif.id_notificacion}
                        onClick={() => handleClickNotificacion(notif)}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border transition-colors hover:bg-muted",
                          !notif.leida ? "bg-blue-50/50 border-blue-200" : "bg-card"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getIconoTipo(notif.tipo_notificacion)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium">{notif.tipo_notificacion}</p>
                              {!notif.leida && (
                                <Badge variant="default" className="text-xs">Nueva</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notif.mensaje}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {notif.ordenes_servicio && (
                                <span className="text-primary font-medium">
                                  Orden: {notif.ordenes_servicio.numero_orden}
                                </span>
                              )}
                              <span>{formatFecha(notif.fecha_enviada)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

