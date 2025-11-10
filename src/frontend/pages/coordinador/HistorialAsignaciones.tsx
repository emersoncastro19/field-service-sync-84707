import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Search, FileText, Calendar, User, Wrench, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface OrdenAsignada {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  prioridad: string;
  estado: string;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  direccion_servicio: string;
  cliente: {
    nombre_completo: string;
    email: string;
    telefono: string | null;
  };
  tecnico?: {
    nombre_completo: string;
    telefono: string;
    zona_cobertura: string;
  };
  cita?: {
    fecha_programada: string;
    estado_cita: string;
  };
}

export default function HistorialAsignaciones() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenAsignada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setCargando(true);

      // Cargar órdenes que tienen técnico asignado (que fueron asignadas por el coordinador)
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          prioridad,
          estado,
          fecha_solicitud,
          fecha_asignacion,
          direccion_servicio,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              email,
              telefono
            )
          ),
          tecnicos (
            usuarios!inner (
              nombre_completo,
              telefono
            ),
            zona_cobertura
          ),
          citas (
            fecha_programada,
            estado_cita
          )
        `)
        .not('id_tecnico_asignado', 'is', null)
        .order('fecha_asignacion', { ascending: false })
        .limit(100);

      if (ordenesError) throw ordenesError;

      // Transformar datos
      const ordenesFormateadas: OrdenAsignada[] = (ordenesData || []).map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        prioridad: orden.prioridad,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        fecha_asignacion: orden.fecha_asignacion,
        direccion_servicio: orden.direccion_servicio,
        cliente: {
          nombre_completo: orden.clientes.usuarios.nombre_completo,
          email: orden.clientes.usuarios.email,
          telefono: orden.clientes.usuarios.telefono
        },
        tecnico: orden.tecnicos ? {
          nombre_completo: orden.tecnicos.usuarios.nombre_completo,
          telefono: orden.tecnicos.usuarios.telefono,
          zona_cobertura: orden.tecnicos.zona_cobertura
        } : undefined,
        cita: orden.citas && orden.citas.length > 0 ? {
          fecha_programada: orden.citas[0].fecha_programada,
          estado_cita: orden.citas[0].estado_cita
        } : undefined
      }));

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando historial de asignaciones:', err);
      error('Error', 'No se pudieron cargar las asignaciones');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string, icon: any }> = {
      'Asignada': { variant: 'default', className: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
      'En Proceso': { variant: 'default', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Completada': { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'Completada (pendiente de confirmación)': { variant: 'default', className: 'bg-orange-100 text-orange-800', icon: Clock },
    };

    const estilo = estilos[estado] || { variant: 'secondary' as const, icon: FileText };
    const Icon = estilo.icon || FileText;

    return (
      <Badge variant={estilo.variant} className={estilo.className}>
        <Icon className="h-3 w-3 mr-1" />
        {estado}
      </Badge>
    );
  };

  const getPrioridadBadge = (prioridad: string) => {
    const estilos: Record<string, string> = {
      'Baja': 'bg-blue-100 text-blue-800',
      'Media': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={estilos[prioridad] || ''}>
        {prioridad}
      </Badge>
    );
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No asignada';
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFechaCita = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    const coincideBusqueda = busqueda === "" || 
      orden.numero_orden.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.cliente.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.tipo_servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
      (orden.tecnico && orden.tecnico.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));
    
    const coincideEstado = filtroEstado === "todos" || orden.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  if (cargando) {
    return (
      <Layout role="coordinator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando historial...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Asignaciones</h1>
          <p className="text-muted-foreground mt-2">
            Consulta las órdenes a las que has asignado técnicos y programado citas ({ordenes.length} órdenes)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar y Filtrar
            </CardTitle>
            <CardDescription>Filtra por número de orden, cliente, técnico o estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar por número de orden, cliente, técnico o tipo de servicio..." 
                className="flex-1"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtroEstado === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("todos")}
              >
                Todas
              </Button>
              <Button
                variant={filtroEstado === "Asignada" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("Asignada")}
              >
                Asignadas
              </Button>
              <Button
                variant={filtroEstado === "En Proceso" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("En Proceso")}
              >
                En Proceso
              </Button>
              <Button
                variant={filtroEstado === "Completada" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("Completada")}
              >
                Completadas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Órdenes Asignadas
            </CardTitle>
            <CardDescription>
              {ordenesFiltradas.length} {ordenesFiltradas.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron órdenes asignadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordenesFiltradas.map((orden) => (
                  <div
                    key={orden.id_orden}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-lg">{orden.numero_orden}</p>
                            {getEstadoBadge(orden.estado)}
                            {getPrioridadBadge(orden.prioridad)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Cliente:</span>
                              </div>
                              <p className="text-muted-foreground ml-6">{orden.cliente.nombre_completo}</p>
                              <p className="text-muted-foreground ml-6 text-xs">{orden.cliente.email}</p>
                            </div>
                            {orden.tecnico && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Wrench className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Técnico:</span>
                                </div>
                                <p className="text-muted-foreground ml-6">{orden.tecnico.nombre_completo}</p>
                                <p className="text-muted-foreground ml-6 text-xs">{orden.tecnico.zona_cobertura}</p>
                              </div>
                            )}
                            {orden.cita && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Cita Programada:</span>
                                </div>
                                <p className="text-muted-foreground ml-6">{formatFechaCita(orden.cita.fecha_programada)}</p>
                                <Badge variant="outline" className="ml-6 mt-1">
                                  {orden.cita.estado_cita}
                                </Badge>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Dirección:</span>
                              </div>
                              <p className="text-muted-foreground ml-6 text-xs">{orden.direccion_servicio}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <span>
                              <strong>Solicitada:</strong> {formatFecha(orden.fecha_solicitud)}
                            </span>
                            {orden.fecha_asignacion && (
                              <span>
                                <strong>Asignada:</strong> {formatFecha(orden.fecha_asignacion)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/coordinador/asignar`}>
                          Ver/Reasignar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

