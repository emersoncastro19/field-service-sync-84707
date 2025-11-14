import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Label } from "@/frontend/components/ui/label";
import { Badge } from "@/frontend/components/ui/badge";
import { Bell, Send, Mail, Clock, Loader2, Search, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";

interface Notificacion {
  id_notificacion: number;
  id_destinatario: number;
  id_orden: number | null;
  tipo_notificacion: string;
  mensaje: string;
  fecha_enviada: string;
  leida: boolean;
  usuarios?: {
    nombre_completo: string;
    email: string;
    tipo_usuario: string;
  };
  ordenes_servicio?: {
    numero_orden: string;
  };
}

interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  email: string;
  tipo_usuario: string;
}

export default function Notificaciones() {
  const { success, error } = useToast();
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    enviadasHoy: 0,
    programadas: 0,
    totalMes: 0
  });

  // Formulario de nueva notificación
  const [formData, setFormData] = useState({
    destinatarios: 'all',
    tipoNotificacion: 'info',
    titulo: '',
    mensaje: '',
    idOrden: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await Promise.all([
        cargarNotificaciones(),
        cargarUsuarios(),
        cargarEstadisticas()
      ]);
    } catch (err) {
      console.error('Error cargando datos:', err);
      error('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarNotificaciones = async () => {
    try {
      const { data, error: err } = await supabase
        .from('notificaciones')
        .select(`
          *,
          usuarios:usuarios!id_destinatario (
            nombre_completo,
            email,
            tipo_usuario
          ),
          ordenes_servicio:ordenes_servicio!id_orden (
            numero_orden
          )
        `)
        .order('fecha_enviada', { ascending: false })
        .limit(100);

      if (err) throw err;
      setNotificaciones(data || []);
    } catch (err: any) {
      console.error('Error cargando notificaciones:', err);
      error('Error', 'No se pudieron cargar las notificaciones');
    }
  };

  const cargarUsuarios = async () => {
    try {
      const { data, error: err } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo, email, tipo_usuario')
        .eq('estado', 'Activo')
        .order('nombre_completo');

      if (err) throw err;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Notificaciones enviadas hoy
      const { count: hoyCount } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_enviada', hoy.toISOString());

      // Total del mes
      const { count: mesCount } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_enviada', inicioMes.toISOString());

      setEstadisticas({
        enviadasHoy: hoyCount || 0,
        programadas: 0, // Por ahora no hay programación
        totalMes: mesCount || 0
      });
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const enviarNotificacion = async () => {
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      error('Error', 'El título y mensaje son requeridos');
      return;
    }

    try {
      setEnviando(true);

      // Determinar destinatarios
      let destinatariosIds: number[] = [];

      if (formData.destinatarios === 'all') {
        destinatariosIds = usuarios.map(u => u.id_usuario);
      } else {
        const usuariosFiltrados = usuarios.filter(u => 
          u.tipo_usuario.toLowerCase() === formData.destinatarios.toLowerCase()
        );
        destinatariosIds = usuariosFiltrados.map(u => u.id_usuario);
      }

      if (destinatariosIds.length === 0) {
        error('Error', 'No se encontraron destinatarios');
        return;
      }

      // Crear notificaciones
      const notificaciones = destinatariosIds.map(idDestinatario => ({
        id_destinatario: idDestinatario,
        id_orden: formData.idOrden ? parseInt(formData.idOrden) : null,
        tipo_notificacion: formData.titulo,
        mensaje: formData.mensaje,
        fecha_enviada: new Date().toISOString(),
        leida: false
      }));

      // Insertar notificaciones
      const { error: insertError } = await supabase
        .from('notificaciones')
        .insert(notificaciones);

      if (insertError) throw insertError;

      success('Notificación enviada', `Se enviaron ${notificaciones.length} notificaciones exitosamente`);
      
      // Limpiar formulario
      setFormData({
        destinatarios: 'all',
        tipoNotificacion: 'info',
        titulo: '',
        mensaje: '',
        idOrden: ''
      });

      // Recargar datos
      await cargarDatos();
    } catch (err: any) {
      console.error('Error enviando notificación:', err);
      error('Error', 'No se pudo enviar la notificación: ' + (err.message || 'Error desconocido'));
    } finally {
      setEnviando(false);
    }
  };

  const getIconoTipo = (tipo: string) => {
    if (tipo.toLowerCase().includes('error') || tipo.toLowerCase().includes('rechaz')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (tipo.toLowerCase().includes('complet') || tipo.toLowerCase().includes('confirm')) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (tipo.toLowerCase().includes('advertencia') || tipo.toLowerCase().includes('warning')) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  const notificacionesFiltradas = notificaciones.filter(notif => {
    const coincideTipo = filtroTipo === 'todos' || 
      (filtroTipo === 'leidas' && notif.leida) ||
      (filtroTipo === 'noLeidas' && !notif.leida);
    
    const coincideBusqueda = !busqueda.trim() ||
      notif.tipo_notificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.usuarios?.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.ordenes_servicio?.numero_orden.toLowerCase().includes(busqueda.toLowerCase());

    return coincideTipo && coincideBusqueda;
  });

  if (cargando) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motor de Notificaciones</h1>
          <p className="text-muted-foreground mt-2">Envía y gestiona notificaciones del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <Send className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Enviadas Hoy</p>
              <p className="text-2xl font-bold">{estadisticas.enviadasHoy}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Programadas</p>
              <p className="text-2xl font-bold">{estadisticas.programadas}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Mail className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Este Mes</p>
              <p className="text-2xl font-bold">{estadisticas.totalMes}</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Nueva Notificación
            </CardTitle>
            <CardDescription>Crea y envía notificaciones a los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Destinatarios</Label>
                  <Select value={formData.destinatarios} onValueChange={(value) => setFormData({...formData, destinatarios: value})}>
                    <SelectTrigger id="recipient">
                      <SelectValue placeholder="Selecciona los destinatarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      <SelectItem value="cliente">Solo clientes</SelectItem>
                      <SelectItem value="tecnico">Solo técnicos</SelectItem>
                      <SelectItem value="agente">Solo agentes</SelectItem>
                      <SelectItem value="coordinador">Solo coordinadores</SelectItem>
                      <SelectItem value="admin">Solo administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-type">Tipo de Notificación</Label>
                  <Select value={formData.tipoNotificacion} onValueChange={(value) => setFormData({...formData, tipoNotificacion: value})}>
                    <SelectTrigger id="notification-type">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="alert">Alerta</SelectItem>
                      <SelectItem value="update">Actualización</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  placeholder="Título de la notificación"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe el contenido de la notificación..."
                  rows={6}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idOrden">ID de Orden (Opcional)</Label>
                <Input 
                  id="idOrden" 
                  type="number"
                  placeholder="ID de orden relacionada (opcional)"
                  value={formData.idOrden}
                  onChange={(e) => setFormData({...formData, idOrden: e.target.value})}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  className="flex-1"
                  onClick={enviarNotificacion}
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Ahora
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setFormData({
                    destinatarios: 'all',
                    tipoNotificacion: 'info',
                    titulo: '',
                    mensaje: '',
                    idOrden: ''
                  })}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historial de Notificaciones
            </CardTitle>
            <CardDescription>Últimas notificaciones enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar notificaciones..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="noLeidas">No leídas</SelectItem>
                    <SelectItem value="leidas">Leídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {notificacionesFiltradas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    notificacionesFiltradas.map((notif) => (
                      <div
                        key={notif.id_notificacion}
                        className={`flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                          !notif.leida ? 'border-blue-200 bg-blue-50/50' : ''
                        }`}
                      >
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
                          <p className="text-sm text-muted-foreground mb-2">
                            {notif.mensaje}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              <strong>Para:</strong> {notif.usuarios?.nombre_completo || 'N/A'} ({notif.usuarios?.tipo_usuario || 'N/A'})
                            </span>
                            {notif.ordenes_servicio && (
                              <span>
                                <strong>Orden:</strong> {notif.ordenes_servicio.numero_orden}
                              </span>
                            )}
                            <span>
                              <strong>Fecha:</strong> {formatearFechaVenezuela(notif.fecha_enviada)}
                            </span>
                          </div>
                        </div>
                      </div>
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
