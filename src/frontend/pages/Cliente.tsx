import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { FileText, Calendar, Bell, CheckCircle, User, Plus, Eye } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface OrdenResumen {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
}

interface CitaResumen {
  id_cita: number;
  fecha_programada: string;
  estado_cita: string;
}

export default function Cliente() {
  const { usuario } = useAuth();
  const { error, success } = useToast();

  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [ordenesCompletadas, setOrdenesCompletadas] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario) {
      const nuevoIngreso = sessionStorage.getItem('nuevo_ingreso_Cliente');
      
      if (nuevoIngreso === 'true') {
        const timeoutId = setTimeout(() => {
          success(
            `Bienvenido/a, ${usuario.nombre_completo}`,
            'Has ingresado al panel de cliente. Aquí puedes gestionar tus órdenes y servicios.'
          );
          sessionStorage.removeItem('nuevo_ingreso_Cliente');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [usuario, success]);

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [usuario]); 
 const cargarDatos = async () => {
    if (!usuario) return;

    try {
      setCargando(true);
      let erroresEncontrados: string[] = [];

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
        setTimeout(() => {
          error(
            'Error',
            'No se pudo obtener la información del cliente. Por favor, recarga la página o contacta al administrador.'
          );
        }, 2000);
        setCargando(false);
        return;
      }

      if (!clienteData) {
        console.error('No se encontró el cliente para el usuario:', idUsuario);
        setTimeout(() => {
          error(
            'Error',
            'No se encontraron datos del cliente. Por favor, contacta al administrador para completar tu perfil.'
          );
        }, 2000);
        setCargando(false);
        return;
      }      try {
        const { data: ordenesData, error: ordenesError } = await supabase
          .from('ordenes_servicio')
          .select('id_orden, numero_orden, tipo_servicio, estado, fecha_solicitud')
          .eq('id_cliente', clienteData.id_cliente)
          .in('estado', ['Creada', 'Validada', 'Asignada', 'En Proceso'])
          .order('fecha_solicitud', { ascending: false })
          .limit(5);

        if (ordenesError) {
          console.error('Error obteniendo órdenes:', ordenesError);
          erroresEncontrados.push('órdenes activas');
        } else {
          setOrdenes(ordenesData || []);
        }
      } catch (error) {
        console.error('Error procesando órdenes:', error);
        erroresEncontrados.push('órdenes activas');
      }

      try {
        const { count: completadasCount } = await supabase
          .from('ordenes_servicio')
          .select('*', { count: 'exact', head: true })
          .eq('id_cliente', clienteData.id_cliente)
          .eq('estado', 'Completada');

        setOrdenesCompletadas(completadasCount || 0);
      } catch (err) {
        console.error('Error contando órdenes completadas:', err);
        erroresEncontrados.push('conteo de órdenes');
      }   
   try {
        const { data: citasData, error: citasError } = await supabase
          .from('citas')
          .select(`
            id_cita,
            fecha_programada,
            estado_cita,
            ordenes_servicio!inner(id_cliente)
          `)
          .eq('ordenes_servicio.id_cliente', clienteData.id_cliente)
          .gte('fecha_programada', new Date().toISOString())
          .in('estado_cita', ['Programada', 'Confirmada'])
          .order('fecha_programada', { ascending: true })
          .limit(5);

        if (citasError) {
          console.error('Error obteniendo citas:', citasError);
          erroresEncontrados.push('próximas citas');
        } else {
          setCitas(citasData || []);
        }
      } catch (err) {
        console.error('Error procesando citas:', err);
        erroresEncontrados.push('próximas citas');
      }

      if (erroresEncontrados.length > 0) {
        setTimeout(() => {
          error('Advertencia', `No se pudieron cargar: ${erroresEncontrados.join(', ')}. El resto del dashboard está disponible.`);
        }, 2000);
      }

    } catch (err: any) {
      console.error('Error crítico cargando datos:', err);
      setTimeout(() => {
        error('Error', err.message || 'No se pudieron cargar los datos del dashboard. Por favor, recarga la página.');
      }, 2000);
    } finally {
      setCargando(false);
    }
  };  const 
formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Creada': { variant: 'secondary', label: 'Creada' },
      'Validada': { variant: 'default', label: 'Validada' },
      'Asignada': { variant: 'default', label: 'Asignada' },
      'En Proceso': { variant: 'default', label: 'En Proceso' },
      'Completada': { variant: 'default', label: 'Completada' },
    };

    const config = estilos[estado] || estilos['Creada'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario?.nombre_completo}
          </p>
        </div>        <
div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Órdenes Activas</p>
              {cargando ? (
                <div className="h-9 w-12 bg-white/20 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold">{ordenes.length}</p>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Próximas Citas</p>
              {cargando ? (
                <div className="h-9 w-12 bg-white/20 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold">{citas.length}</p>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Completadas</p>
              {cargando ? (
                <div className="h-9 w-12 bg-white/20 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold">{ordenesCompletadas}</p>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-6">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Notificaciones</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </Card>
        </div>     
   <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Crear Nueva Orden"
            description="Solicita un nuevo servicio técnico"
            icon={Plus}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas un servicio técnico? Crea una nueva orden de servicio y nuestro equipo se pondrá en contacto contigo.
              </p>
              <Button className="w-full" asChild>
                <Link to="/cliente/nueva-orden">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden de Servicio
                </Link>
              </Button>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Actualizar Datos Personales"
            description="Mantén tu información actualizada"
            icon={User}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Actualiza tu información de contacto, dirección y preferencias de notificación.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/cliente/perfil">
                  <User className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Link>
              </Button>
            </div>
          </DashboardCard>
        </div>   
     <DashboardCard
          title="Mis Órdenes de Servicio"
          description="Historial de servicios solicitados"
          icon={FileText}
        >
          <div className="space-y-3">
            <div className="flex justify-end gap-2 pb-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/cliente/ordenes">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Todas las Órdenes
                </Link>
              </Button>
            </div>

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
                <p className="text-muted-foreground mb-4">No tienes órdenes activas</p>
                <Button asChild>
                  <Link to="/cliente/nueva-orden">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Orden
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {ordenes.map((orden) => (
                  <div
                    key={orden.id_orden}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">
                        {orden.numero_orden} - {orden.tipo_servicio}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFecha(orden.fecha_solicitud)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getEstadoBadge(orden.estado)}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/cliente/detalles-orden?id=${orden.id_orden}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}