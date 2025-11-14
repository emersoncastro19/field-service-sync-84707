import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { FileText, MapPin, User, Calendar, CheckCircle2, Clock, Eye, Filter } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela, formatearSoloFechaVenezuela } from "@/shared/utils/dateUtils";

interface OrdenCompletada {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  fecha_completada: string | null;
  direccion_servicio: string;
  descripcion_solicitud: string;
  cliente: {
    nombre_completo: string;
    telefono: string | null;
    email: string;
  };
  ejecucion?: {
    id_ejecucion: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    trabajo_realizado: string | null;
    confirmacion_cliente: string;
  };
  citas?: {
    id_cita: number;
    fecha_programada: string;
    estado_cita: string;
  }[];
}

export default function OrdenesCompletadas() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenCompletada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  useEffect(() => {
    if (usuario) {
      cargarOrdenes();
    }
  }, [usuario]);

  const cargarOrdenes = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el técnico asociado al usuario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) throw tecnicoError;

      // 2. Obtener las órdenes completadas del técnico
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          fecha_asignacion,
          fecha_completada,
          direccion_servicio,
          descripcion_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              telefono,
              email
            )
          ),
          citas (
            id_cita,
            fecha_programada,
            estado_cita
          ),
          ejecuciones_servicio (
            id_ejecucion,
            fecha_inicio,
            fecha_fin,
            trabajo_realizado,
            confirmacion_cliente
          )
        `)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .eq('estado', 'Completada')
        .order('fecha_completada', { ascending: false });

      if (ordenesError) throw ordenesError;

      // Transformar los datos
      const ordenesFormateadas: OrdenCompletada[] = ordenesData.map((orden: any) => {
        // Procesar citas
        let citasArray = [];
        if (orden.citas) {
          citasArray = Array.isArray(orden.citas) ? orden.citas : [orden.citas];
        }

        // Procesar ejecuciones (debería haber una sola)
        let ejecucionData = null;
        if (orden.ejecuciones_servicio) {
          const ejecuciones = Array.isArray(orden.ejecuciones_servicio) 
            ? orden.ejecuciones_servicio 
            : [orden.ejecuciones_servicio];
          ejecucionData = ejecuciones.length > 0 ? ejecuciones[0] : null;
        }

        return {
          id_orden: orden.id_orden,
          numero_orden: orden.numero_orden,
          tipo_servicio: orden.tipo_servicio,
          estado: orden.estado,
          fecha_solicitud: orden.fecha_solicitud,
          fecha_asignacion: orden.fecha_asignacion,
          fecha_completada: orden.fecha_completada,
          direccion_servicio: orden.direccion_servicio,
          descripcion_solicitud: orden.descripcion_solicitud,
          cliente: {
            nombre_completo: orden.clientes?.usuarios?.nombre_completo || 'Cliente desconocido',
            telefono: orden.clientes?.usuarios?.telefono || null,
            email: orden.clientes?.usuarios?.email || ''
          },
          ejecucion: ejecucionData ? {
            id_ejecucion: ejecucionData.id_ejecucion,
            fecha_inicio: ejecucionData.fecha_inicio,
            fecha_fin: ejecucionData.fecha_fin,
            trabajo_realizado: ejecucionData.trabajo_realizado,
            confirmacion_cliente: ejecucionData.confirmacion_cliente || 'Pendiente'
          } : undefined,
          citas: citasArray.length > 0 ? citasArray : undefined
        };
      });

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes completadas:', err);
      error('Error', 'No se pudieron cargar las órdenes completadas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    return formatearSoloFechaVenezuela(fecha);
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    const coincideBusqueda = busqueda === "" || 
      orden.numero_orden.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.cliente.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.tipo_servicio.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideTipo = filtroTipo === "todos" || orden.tipo_servicio === filtroTipo;
    
    return coincideBusqueda && coincideTipo;
  });

  // Obtener tipos de servicio únicos para el filtro
  const tiposServicio = Array.from(new Set(ordenes.map(o => o.tipo_servicio))).sort();

  if (cargando) {
    return (
      <Layout role="technician">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando órdenes completadas...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Órdenes Completadas</h1>
          <p className="text-muted-foreground mt-2">
            Historial de órdenes que has completado exitosamente ({ordenesFiltradas.length} {ordenesFiltradas.length === 1 ? 'orden' : 'órdenes'})
          </p>
        </div>

        {/* Filtros */}
        {ordenes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Buscar por número de orden, cliente o tipo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Servicio</label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      {tiposServicio.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Órdenes Completadas */}
        {ordenesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                {ordenes.length === 0 ? (
                  <>
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes órdenes completadas</h3>
                    <p className="text-muted-foreground">
                      Las órdenes completadas aparecerán aquí cuando termines el trabajo y el cliente confirme el servicio.
                    </p>
                  </>
                ) : (
                  <>
                    <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron órdenes</h3>
                    <p className="text-muted-foreground">
                      Intenta ajustar los filtros de búsqueda
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {ordenesFiltradas.map((orden) => (
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
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completada
                      </Badge>
                      {orden.ejecucion && (
                        <Badge 
                          variant={orden.ejecucion.confirmacion_cliente === 'Confirmada' ? 'default' : 'secondary'}
                          className={
                            orden.ejecucion.confirmacion_cliente === 'Confirmada' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {orden.ejecucion.confirmacion_cliente === 'Confirmada' ? 'Confirmada por cliente' : 'Pendiente confirmación'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descripción */}
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {orden.descripcion_solicitud}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Cliente</p>
                        <p className="font-medium">{orden.cliente.nombre_completo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Fecha de Completación</p>
                        <p className="font-medium">
                          {orden.fecha_completada ? formatearFechaVenezuela(orden.fecha_completada) : 'No definida'}
                        </p>
                      </div>
                    </div>
                    {orden.ejecucion && orden.ejecucion.fecha_inicio && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Inicio de Trabajo</p>
                          <p className="font-medium">
                            {formatearFechaVenezuela(orden.ejecucion.fecha_inicio)}
                          </p>
                        </div>
                      </div>
                    )}
                    {orden.ejecucion && orden.ejecucion.fecha_fin && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Finalización de Trabajo</p>
                          <p className="font-medium">
                            {formatearFechaVenezuela(orden.ejecucion.fecha_fin)}
                          </p>
                        </div>
                      </div>
                    )}
                    {orden.citas && orden.citas.length > 0 && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">Cita Realizada</p>
                          <p className="font-medium">
                            {formatearFechaVenezuela(orden.citas[0].fecha_programada)} - {orden.citas[0].estado_cita}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">Dirección</p>
                        <p className="font-medium">{orden.direccion_servicio}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trabajo Realizado (si existe) */}
                  {orden.ejecucion && orden.ejecucion.trabajo_realizado && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Trabajo Realizado:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                        {orden.ejecucion.trabajo_realizado}
                      </p>
                    </div>
                  )}

                  {/* Botón Ver Detalles */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to={`/tecnico/gestionar-ejecucion?orden=${orden.id_orden}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Información adicional */}
        {ordenes.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Se muestran {ordenesFiltradas.length} de {ordenes.length} órdenes completadas. 
              Las órdenes se ordenan por fecha de completación (más recientes primero).
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
}


