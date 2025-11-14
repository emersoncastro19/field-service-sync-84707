import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { FileText, MapPin, User, Calendar, Play, CheckCircle, Clock, AlertCircle, Wrench, Package, XCircle, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela, formatearSoloFechaVenezuela } from "@/shared/utils/dateUtils";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  direccion_servicio: string;
  descripcion_solicitud: string;
  cliente: {
    nombre_completo: string;
    telefono: string | null;
    email: string;
  };
  citas?: {
    id_cita: number;
    fecha_programada: string;
    estado_cita: string;
    motivo_reprogramacion?: string | null;
  }[];
}

const statusConfig = {
  'Asignada': { 
    label: "Asignada", 
    icon: Clock, 
    color: "bg-purple-100 text-purple-800",
    variant: "default" as const
  },
  'En Proceso': { 
    label: "En Proceso", 
    icon: Play, 
    color: "bg-yellow-100 text-yellow-800",
    variant: "default" as const
  },
  'Completada': { 
    label: "Completada", 
    icon: CheckCircle2, 
    color: "bg-green-100 text-green-800",
    variant: "default" as const
  },
  'Cancelada': { 
    label: "Cancelada", 
    icon: XCircle, 
    color: "bg-red-100 text-red-800",
    variant: "destructive" as const
  },
  'Con_Impedimento': { 
    label: "Con Impedimento", 
    icon: AlertTriangle, 
    color: "bg-orange-100 text-orange-800",
    variant: "destructive" as const
  },
};

export default function TecnicoOrdenes() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);

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

      // 2. Obtener las órdenes asignadas al técnico con sus citas
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          fecha_asignacion,
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
            estado_cita,
            motivo_reprogramacion
          )
        `)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .in('estado', ['Asignada', 'En Proceso', 'Completada', 'Cancelada', 'Con_Impedimento'])
        .order('fecha_asignacion', { ascending: false });

      if (ordenesError) throw ordenesError;

      // Transformar los datos
      const ordenesFormateadas: Orden[] = ordenesData.map((orden: any) => {
        // Procesar citas - puede ser array o objeto único
        let citasArray = [];
        if (orden.citas) {
          if (Array.isArray(orden.citas)) {
            citasArray = orden.citas;
          } else {
            citasArray = [orden.citas];
          }
        }

        return {
          id_orden: orden.id_orden,
          numero_orden: orden.numero_orden,
          tipo_servicio: orden.tipo_servicio,
          estado: orden.estado,
          fecha_solicitud: orden.fecha_solicitud,
          fecha_asignacion: orden.fecha_asignacion,
          direccion_servicio: orden.direccion_servicio,
          descripcion_solicitud: orden.descripcion_solicitud,
          cliente: {
            nombre_completo: orden.clientes?.usuarios?.nombre_completo || 'Cliente desconocido',
            telefono: orden.clientes?.usuarios?.telefono || null,
            email: orden.clientes?.usuarios?.email || ''
          },
          citas: citasArray.length > 0 ? citasArray : undefined
        };
      });

      console.log('✅ Órdenes cargadas:', ordenesFormateadas.length);
      console.log('📋 Órdenes con citas:', ordenesFormateadas.filter(o => o.citas && o.citas.length > 0).length);

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes asignadas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    return formatearSoloFechaVenezuela(fecha);
  };


  if (cargando) {
    return (
      <Layout role="technician">
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
    <Layout role="technician">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Órdenes Asignadas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus órdenes de servicio asignadas ({ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'})
          </p>
        </div>

        {/* Lista de Órdenes */}
        {ordenes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes órdenes asignadas</h3>
                <p className="text-muted-foreground">
                  Las órdenes aparecerán aquí cuando se te asignen
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {ordenes.map((orden) => {
              const statusInfo = statusConfig[orden.estado as keyof typeof statusConfig] || statusConfig['Asignada'];
              const StatusIcon = statusInfo.icon;
              
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
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
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
                          <p className="text-muted-foreground">Fecha de Asignación</p>
                          <p className="font-medium">{formatFecha(orden.fecha_asignacion)}</p>
                        </div>
                      </div>
                      {orden.citas && orden.citas.length > 0 && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <p className="text-muted-foreground">Cita Programada</p>
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

                    {/* Botones de Acción */}
                    <div className="flex gap-2 pt-2">
                      {orden.estado === 'Asignada' && (
                        <Button className="flex-1" asChild>
                          <Link to={`/tecnico/gestionar-ejecucion?orden=${orden.id_orden}`}>
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Trabajo
                          </Link>
                        </Button>
                      )}
                      {orden.estado === 'En Proceso' && (
                        <Button className="flex-1" asChild>
                          <Link to={`/tecnico/gestionar-ejecucion?orden=${orden.id_orden}`}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Gestionar Trabajo
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/tecnico/ordenes`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Información adicional */}
        {ordenes.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Las órdenes se muestran desde la más reciente a la más antigua. 
              Haz clic en "Iniciar Trabajo" para comenzar a trabajar en una orden asignada.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
}
