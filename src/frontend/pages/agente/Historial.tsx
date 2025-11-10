import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Search, FileText, Calendar, User, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface OrdenHistorial {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  prioridad: string;
  estado: string;
  fecha_solicitud: string;
  fecha_validacion?: string;
  descripcion_solicitud: string;
  cliente: {
    nombre_completo: string;
    email: string;
    telefono: string | null;
  };
}

export default function Historial() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setCargando(true);

      // Cargar órdenes validadas o rechazadas (que ya fueron procesadas por el agente)
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          prioridad,
          estado,
          fecha_solicitud,
          descripcion_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              email,
              telefono
            )
          )
        `)
        .in('estado', ['Validada', 'Cancelada', 'Asignada', 'En Proceso', 'Completada'])
        .order('fecha_solicitud', { ascending: false })
        .limit(100);

      if (ordenesError) throw ordenesError;

      // Transformar datos
      const ordenesFormateadas: OrdenHistorial[] = (ordenesData || []).map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        prioridad: orden.prioridad,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        descripcion_solicitud: orden.descripcion_solicitud,
        cliente: {
          nombre_completo: orden.clientes.usuarios.nombre_completo,
          email: orden.clientes.usuarios.email,
          telefono: orden.clientes.usuarios.telefono
        }
      }));

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      error('Error', 'No se pudieron cargar las órdenes del historial');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string, icon: any }> = {
      'Validada': { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'Cancelada': { variant: 'destructive', icon: XCircle },
      'Asignada': { variant: 'default', className: 'bg-blue-100 text-blue-800', icon: Clock },
      'En Proceso': { variant: 'default', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Completada': { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
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

  const formatFecha = (fecha: string) => {
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
      orden.tipo_servicio.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === "todos" || orden.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  if (cargando) {
    return (
      <Layout role="agent">
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
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Órdenes</h1>
          <p className="text-muted-foreground mt-2">
            Consulta las órdenes que has validado o rechazado ({ordenes.length} órdenes)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar y Filtrar
            </CardTitle>
            <CardDescription>Filtra por número de orden, cliente, tipo de servicio o estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar por número de orden, cliente o tipo de servicio..." 
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
                variant={filtroEstado === "Validada" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("Validada")}
              >
                Validadas
              </Button>
              <Button
                variant={filtroEstado === "Cancelada" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("Cancelada")}
              >
                Canceladas
              </Button>
              <Button
                variant={filtroEstado === "Asignada" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("Asignada")}
              >
                Asignadas
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
              Órdenes Procesadas
            </CardTitle>
            <CardDescription>
              {ordenesFiltradas.length} {ordenesFiltradas.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron órdenes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordenesFiltradas.map((orden) => (
                  <div
                    key={orden.id_orden}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{orden.numero_orden}</p>
                          {getEstadoBadge(orden.estado)}
                          {getPrioridadBadge(orden.prioridad)}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{orden.cliente.nombre_completo}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {orden.tipo_servicio} - {orden.descripcion_solicitud.substring(0, 100)}
                          {orden.descripcion_solicitud.length > 100 && '...'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatFecha(orden.fecha_solicitud)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/agente/detalles-orden?id=${orden.id_orden}`}>
                        Ver Detalles
                      </Link>
                    </Button>
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
