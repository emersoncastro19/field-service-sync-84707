import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { FileText, Clock, CheckCircle, XCircle, Calendar, Eye, AlertCircle, Package, Plus } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  descripcion_solicitud: string;
  tecnico?: {
    nombre_completo: string;
  };
}

const statusConfig = {
  'Creada': { 
    label: "Creada", 
    icon: Clock, 
    color: "bg-gray-100 text-gray-800",
    variant: "secondary" as const
  },
  'Validada': { 
    label: "Validada", 
    icon: CheckCircle, 
    color: "bg-blue-100 text-blue-800",
    variant: "default" as const
  },
  'Asignada': { 
    label: "Asignada", 
    icon: Calendar, 
    color: "bg-purple-100 text-purple-800",
    variant: "default" as const
  },
  'En Proceso': { 
    label: "En Proceso", 
    icon: Package, 
    color: "bg-yellow-100 text-yellow-800",
    variant: "default" as const
  },
  'Completada': { 
    label: "Completada", 
    icon: CheckCircle, 
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
    icon: AlertCircle, 
    color: "bg-orange-100 text-orange-800",
    variant: "destructive" as const
  },
};

export default function ClienteOrdenes() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarOrdenes();
  }, [usuario]);

  const cargarOrdenes = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el cliente asociado al usuario
      // Convertir id_usuario a número si es necesario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (clienteError) {
        console.error('Error obteniendo cliente:', clienteError);
        throw new Error('No se pudo obtener la información del cliente: ' + clienteError.message);
      }

      if (!clienteData) {
        throw new Error('No se encontraron datos del cliente. Por favor, contacta al administrador.');
      }

      // 2. Obtener las órdenes del cliente con el técnico asignado
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          descripcion_solicitud,
          tecnico:tecnicos!id_tecnico_asignado (
            usuario:usuarios!tecnicos_id_usuario_fkey (
              nombre_completo
            )
          )
        `)
        .eq('id_cliente', clienteData.id_cliente)
        .order('fecha_solicitud', { ascending: false });

      if (ordenesError) throw ordenesError;

      // Transformar los datos
      const ordenesFormateadas = ordenesData.map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        descripcion_solicitud: orden.descripcion_solicitud,
        tecnico: orden.tecnico?.usuario ? {
          nombre_completo: orden.tecnico.usuario.nombre_completo
        } : undefined
      }));

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  if (cargando) {
    return (
      <Layout role="client">
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
    <Layout role="client">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Órdenes de Servicio</h1>
            <p className="text-muted-foreground mt-2">
              Consulta el historial y estado de tus órdenes ({ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'})
            </p>
          </div>
          <Button asChild>
            <Link to="/cliente/nueva-orden">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Link>
          </Button>
        </div>

        {/* Lista de Órdenes */}
        {ordenes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes órdenes aún</h3>
                <p className="text-muted-foreground mb-6">
                  Crea tu primera orden de servicio para comenzar
                </p>
                <Button asChild>
                  <Link to="/cliente/nueva-orden">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Orden
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {ordenes.map((orden) => {
              const statusInfo = statusConfig[orden.estado as keyof typeof statusConfig] || statusConfig['Creada'];
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
                    <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                      <div>
                        <p className="text-muted-foreground">Fecha de Solicitud</p>
                        <p className="font-medium">{formatFecha(orden.fecha_solicitud)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Técnico Asignado</p>
                        <p className="font-medium">
                          {orden.tecnico?.nombre_completo || (
                            <span className="text-muted-foreground">Pendiente</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Botón Ver Detalles */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2" 
                      asChild
                    >
                      <Link to={`/cliente/detalles-orden?id=${orden.id_orden}`} className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        Ver Detalles Completos
                      </Link>
                    </Button>
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
              Haz clic en "Ver Detalles" para más información sobre cada orden.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
}
