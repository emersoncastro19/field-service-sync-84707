import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Input } from "@/frontend/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Label } from "@/frontend/components/ui/label";
import { Calendar, Clock, MapPin, User, Search, Filter, Eye, CheckCircle2, XCircle, AlertCircle, Phone, Mail, Wrench, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface Cita {
  id_cita: number;
  id_orden: number;
  fecha_programada: string;
  fecha_confirmada: string | null;
  estado_cita: string;
  motivo_reprogramacion: string | null;
  orden: {
    numero_orden: string;
    tipo_servicio: string;
    direccion_servicio: string;
    estado: string;
    descripcion_solicitud: string;
    cliente: {
      nombre_completo: string;
      telefono: string;
      email: string;
    };
  };
}

export default function TecnicoCitas() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  
  // Estados para diálogo de detalles
  const [dialogDetalles, setDialogDetalles] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtroEstado, busqueda]);

  const cargarCitas = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el técnico asociado al usuario
      // Convertir id_usuario a número si es necesario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) throw tecnicoError;

      // 2. Obtener órdenes asignadas al técnico
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          direccion_servicio,
          estado,
          descripcion_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              telefono,
              email
            )
          )
        `)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .in('estado', ['Asignada', 'En Proceso', 'Completada']);

      if (ordenesError) throw ordenesError;

      // 3. Obtener citas de las órdenes
      const ordenIds = ordenesData.map(o => o.id_orden);
      if (ordenIds.length === 0) {
        setCitas([]);
        setCitasFiltradas([]);
        return;
      }

      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('*')
        .in('id_orden', ordenIds)
        .order('fecha_programada', { ascending: true });

      if (citasError) throw citasError;

      // 4. Combinar datos
      const citasCompletas: Cita[] = citasData.map((cita: any) => {
        const orden = ordenesData.find((o: any) => o.id_orden === cita.id_orden);
        return {
          ...cita,
          orden: {
            numero_orden: orden?.numero_orden || '',
            tipo_servicio: orden?.tipo_servicio || '',
            direccion_servicio: orden?.direccion_servicio || '',
            estado: orden?.estado || '',
            descripcion_solicitud: orden?.descripcion_solicitud || '',
            cliente: {
              nombre_completo: orden?.clientes?.usuarios?.nombre_completo || '',
              telefono: orden?.clientes?.usuarios?.telefono || '',
              email: orden?.clientes?.usuarios?.email || ''
            }
          }
        };
      });

      setCitas(citasCompletas);
    } catch (err: any) {
      console.error('Error cargando citas:', err);
      error('Error', 'No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...citas];

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(cita => cita.estado_cita === filtroEstado);
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(cita =>
        cita.orden.numero_orden.toLowerCase().includes(busquedaLower) ||
        cita.orden.tipo_servicio.toLowerCase().includes(busquedaLower) ||
        cita.orden.cliente.nombre_completo.toLowerCase().includes(busquedaLower)
      );
    }

    setCitasFiltradas(resultado);
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, { variant: any; className: string; icon: any }> = {
      'Programada': { 
        variant: 'secondary', 
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Clock
      },
      'Confirmada': { 
        variant: 'default', 
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle2
      },
      'Reprogramada': { 
        variant: 'default', 
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: AlertCircle
      },
      'Cancelada': { 
        variant: 'destructive', 
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      },
    };

    const estilo = estilos[estado] || estilos['Programada'];
    const Icon = estilo.icon;

    return (
      <Badge variant={estilo.variant} className={estilo.className}>
        <Icon className="h-3 w-3 mr-1" />
        {estado}
      </Badge>
    );
  };


  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFechaCompleta = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <Layout role="technician">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando citas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="technician">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">
            Citas programadas para tus órdenes de servicio asignadas
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por orden, servicio o cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las citas</SelectItem>
                    <SelectItem value="Programada">Programadas</SelectItem>
                    <SelectItem value="Confirmada">Confirmadas</SelectItem>
                    <SelectItem value="Reprogramada">Reprogramadas</SelectItem>
                    <SelectItem value="Cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Citas */}
        {citasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {citas.length === 0 ? 'No tienes citas programadas' : 'No se encontraron citas'}
                </h3>
                <p className="text-muted-foreground">
                  {citas.length === 0 
                    ? 'Las citas aparecerán aquí cuando se programen para tus órdenes asignadas'
                    : 'Intenta ajustar los filtros de búsqueda'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {citasFiltradas.map((cita) => (
              <Card key={cita.id_cita} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        {cita.orden.tipo_servicio}
                      </CardTitle>
                      <CardDescription>Orden: {cita.orden.numero_orden}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getEstadoBadge(cita.estado_cita)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Información de la cita */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Fecha
                        </p>
                        <p className="font-medium">{formatFecha(cita.fecha_programada)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hora
                        </p>
                        <p className="font-medium">{formatHora(cita.fecha_programada)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Cliente
                        </p>
                        <p className="font-medium">{cita.orden.cliente.nombre_completo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Dirección
                        </p>
                        <p className="font-medium line-clamp-2">{cita.orden.direccion_servicio}</p>
                      </div>
                    </div>

                    {cita.motivo_reprogramacion && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Motivo de reprogramación:</strong> {cita.motivo_reprogramacion}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCitaSeleccionada(cita);
                          setDialogDetalles(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/tecnico/ordenes`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Orden
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog: Ver Detalles */}
        <Dialog open={dialogDetalles} onOpenChange={setDialogDetalles}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Cita</DialogTitle>
              <DialogDescription>
                Información completa de la cita programada
              </DialogDescription>
            </DialogHeader>
            {citaSeleccionada && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Orden de Servicio</Label>
                    <p className="text-sm">{citaSeleccionada.orden.numero_orden}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Tipo de Servicio</Label>
                    <p className="text-sm">{citaSeleccionada.orden.tipo_servicio}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Estado de la Orden</Label>
                    <Badge>{citaSeleccionada.orden.estado}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Fecha Programada</Label>
                      <p className="text-sm">{formatFechaCompleta(citaSeleccionada.fecha_programada)}</p>
                    </div>
                    {citaSeleccionada.fecha_confirmada && (
                      <div>
                        <Label className="text-sm font-semibold">Fecha Confirmada</Label>
                        <p className="text-sm">{formatFechaCompleta(citaSeleccionada.fecha_confirmada)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Estado de la Cita</Label>
                    <div className="mt-1">
                      {getEstadoBadge(citaSeleccionada.estado_cita)}
                    </div>
                  </div>
                  {citaSeleccionada.motivo_reprogramacion && (
                    <div>
                      <Label className="text-sm font-semibold">Motivo de Reprogramación</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {citaSeleccionada.motivo_reprogramacion}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-semibold">Descripción del Servicio</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-3 rounded">
                      {citaSeleccionada.orden.descripcion_solicitud}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Dirección del Servicio</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {citaSeleccionada.orden.direccion_servicio}
                    </p>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-sm font-semibold">Nombre</Label>
                        <p className="text-sm">{citaSeleccionada.orden.cliente.nombre_completo}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Teléfono
                          </Label>
                          <p className="text-sm">{citaSeleccionada.orden.cliente.telefono || 'No disponible'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </Label>
                          <p className="text-sm">{citaSeleccionada.orden.cliente.email || 'No disponible'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" asChild className="flex-1">
                    <Link to={`/tecnico/ordenes`}>
                      Ver Orden Completa
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

