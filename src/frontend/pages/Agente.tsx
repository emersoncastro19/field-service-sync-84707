import { useEffect, useState } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { supabase } from "@/backend/config/supabaseClient";

interface OrdenResumen {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  cliente: {
    nombre_completo: string;
  };
}

export default function Agente() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  // Mostrar mensaje de bienvenida solo cuando es un nuevo ingreso (después de login)
  useEffect(() => {
    if (usuario) {
      // Verificar si es un nuevo ingreso
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Agente');
      
      if (nuevoIngreso === 'true') {
        // Mostrar mensaje solo en nuevo ingreso
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de agente. Aquí puedes gestionar órdenes y asignar técnicos.'
          );
          // Eliminar la marca para que no vuelva a aparecer hasta el próximo login
          sessionStorage.removeItem('nuevo_ingreso_Agente');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setCargando(true);

      // Cargar las últimas órdenes creadas (todas las órdenes, independientemente del estado)
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo
            )
          )
        `)
        .order('fecha_solicitud', { ascending: false })
        .limit(10);

      if (ordenesError) throw ordenesError;

      // Transformar datos
      const ordenesFormateadas: OrdenResumen[] = (ordenesData || []).map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        cliente: {
          nombre_completo: orden.clientes?.usuarios?.nombre_completo || 'Cliente desconocido'
        }
      }));

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Creada': { variant: 'secondary' as const, label: 'Creada' },
      'Validada': { variant: 'default' as const, label: 'Validada' },
      'Asignada': { variant: 'default' as const, label: 'Asignada' },
      'En Proceso': { variant: 'default' as const, label: 'En Proceso' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
      'Completada (pendiente de confirmación)': { variant: 'default' as const, label: 'Pendiente Confirmación' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario?.nombre_completo}
          </p>
        </div>

        <DashboardCard
          title="Órdenes de Servicio Recientes"
          description="Últimas órdenes creadas"
          icon={FileText}
        >
          <div className="space-y-3">
            {cargando ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : ordenes.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No hay órdenes disponibles</p>
              </div>
            ) : (
              ordenes.map((orden) => (
                <div
                  key={orden.id_orden}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{orden.numero_orden} - {orden.cliente.nombre_completo}</p>
                    <p className="text-sm text-muted-foreground">{orden.tipo_servicio}</p>
                    <p className="text-xs text-muted-foreground">{formatFecha(orden.fecha_solicitud)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(orden.estado)}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/agente/detalles-orden?id=${orden.id_orden}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
