import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, AlertCircle, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Badge } from "@/frontend/components/ui/badge";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { cn } from "@/frontend/lib/utils";

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

export default function NotificationBell() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [open, setOpen] = useState(false);

  const cargarNotificaciones = useCallback(async () => {
    if (!usuario?.id_usuario) {
      console.log('⚠️ No hay usuario, no se pueden cargar notificaciones');
      setCargando(false);
      return;
    }

    try {
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      // Verificar que el id_usuario sea válido
      if (isNaN(idUsuario) || idUsuario <= 0) {
        console.error('❌ ID de usuario inválido:', usuario.id_usuario);
        setCargando(false);
        return;
      }

      console.log('🔔 Cargando notificaciones para usuario:', idUsuario);
      console.log('🔔 Tipo de id_usuario:', typeof idUsuario);

      // Verificar sesión de Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 Sesión de Supabase:', sessionData?.session ? 'Activa' : 'Inactiva');
      
      if (!sessionData?.session) {
        console.warn('⚠️ No hay sesión activa de Supabase');
      }

      // Primero obtener las notificaciones básicas
      console.log('📤 Ejecutando query de notificaciones...');
      const { data: notificacionesData, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('id_destinatario', idUsuario)
        .order('fecha_enviada', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error en query de notificaciones:', error);
        console.error('❌ Código del error:', error.code);
        console.error('❌ Mensaje del error:', error.message);
        console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
        
        // Si es un error de permisos, informar al usuario
        if (error.code === 'PGRST116' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
          console.error('🚫 ERROR DE PERMISOS: Las políticas RLS están bloqueando el acceso a las notificaciones');
          console.error('💡 SOLUCIÓN: Ejecuta el script fix-notificaciones-rls.sql en Supabase para corregir las políticas RLS');
        }
        
        setNotificaciones([]);
        setNoLeidas(0);
        return;
      }

      console.log('📬 Notificaciones encontradas (sin relaciones):', notificacionesData?.length || 0);
      if (notificacionesData && notificacionesData.length > 0) {
        console.log('📬 Primera notificación:', JSON.stringify(notificacionesData[0], null, 2));
      }

      // Si hay notificaciones con id_orden, obtener los números de orden
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

      const data = notificacionesData || [];

      console.log('📬 Notificaciones encontradas:', data.length);
      console.log('📬 Mapa de órdenes:', ordenesMap);

      // Construir notificaciones con información de órdenes
      const notifs = data.map((n: any) => ({
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
      const noLeidasCount = notifs.filter((n: Notificacion) => !n.leida).length;
      setNoLeidas(noLeidasCount);
      console.log('✅ Notificaciones cargadas:', notifs.length, 'No leídas:', noLeidasCount);
    } catch (err) {
      console.error('❌ Error cargando notificaciones:', err);
    } finally {
      setCargando(false);
    }
  }, [usuario?.id_usuario]);

  const marcarComoLeida = async (idNotificacion: number) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id_notificacion', idNotificacion);

      if (error) throw error;

      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(n =>
          n.id_notificacion === idNotificacion ? { ...n, leida: true } : n
        )
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (err) {
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

      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  const handleClickNotificacion = async (notificacion: Notificacion) => {
    // Marcar como leída
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id_notificacion);
    }

    // Navegar según el tipo de usuario y si hay orden
    if (notificacion.id_orden) {
      const tipoUsuario = usuario?.tipo_usuario;
      
      if (tipoUsuario === 'Cliente') {
        navigate(`/cliente/detalles-orden?id=${notificacion.id_orden}`);
      } else if (tipoUsuario === 'Tecnico') {
        // Para técnicos, navegar a gestionar ejecución (ahí pueden ver sus órdenes)
        navigate(`/tecnico/gestionar-ejecucion`);
      } else if (tipoUsuario === 'Coordinador') {
        // Para coordinadores, navegar a asignar órdenes
        navigate(`/coordinador/asignar`);
      } else if (tipoUsuario === 'Agente') {
        // Para agentes, navegar a validar órdenes
        navigate(`/agente/validar-ordenes`);
      }
    }

    setOpen(false);
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'Cita Programada':
      case 'Asignación de Orden':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'Servicio Completado':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Confirmación de Servicio':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Servicio Rechazado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFecha = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    return fechaNotif.toLocaleDateString('es-VE');
  };

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarNotificaciones();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario?.id_usuario, cargarNotificaciones]);

  // Recargar notificaciones cuando se abre el popover
  useEffect(() => {
    if (open && usuario?.id_usuario) {
      cargarNotificaciones();
    }
  }, [open, usuario?.id_usuario, cargarNotificaciones]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {noLeidas > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
          )}
          {noLeidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLeidas}
              className="h-8 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {cargando ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="ml-3 text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground mt-1">Te notificaremos cuando haya nuevas actualizaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificaciones.map((notificacion) => (
                <button
                  key={notificacion.id_notificacion}
                  onClick={() => handleClickNotificacion(notificacion)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted transition-colors",
                    !notificacion.leida && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIconoTipo(notificacion.tipo_notificacion)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {notificacion.tipo_notificacion}
                        </p>
                        {!notificacion.leida && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notificacion.mensaje}
                      </p>
                      {notificacion.ordenes_servicio && (
                        <p className="text-xs font-medium text-primary mb-1">
                          Orden: {notificacion.ordenes_servicio.numero_orden}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatFecha(notificacion.fecha_enviada)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notificaciones.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setOpen(false);
                // Navegar según el rol del usuario
                const tipoUsuario = usuario?.tipo_usuario;
                if (tipoUsuario === 'Admin') {
                  navigate('/admin/notificaciones');
                } else {
                  // Para otros usuarios, navegar a su página principal de órdenes
                  if (tipoUsuario === 'Cliente') {
                    navigate('/cliente/ordenes');
                  } else if (tipoUsuario === 'Tecnico') {
                    navigate('/tecnico/ordenes');
                  } else if (tipoUsuario === 'Coordinador') {
                    navigate('/coordinador/asignar');
                  } else if (tipoUsuario === 'Agente') {
                    navigate('/agente/validar-ordenes');
                  }
                }
              }}
            >
              Ver más notificaciones
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

