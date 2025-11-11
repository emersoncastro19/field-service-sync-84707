import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Calendar, Clock, MapPin, User, Loader2 } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface Cita {
  id_cita: number;
  id_orden: number;
  numero_orden: string;
  fecha_programada: string;
  estado_cita: string;
  cliente: {
    nombre_completo: string;
  };
  tecnico: {
    nombre_completo: string;
  };
  direccion_servicio: string;
  tipo_servicio: string;
}

export default function Citas() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    hoy: 0,
    estaSemana: 0,
    confirmadas: 0,
    pendientes: 0
  });

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  const cargarCitas = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el ID del coordinador logueado
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('coordinadores_campo')
        .select('id_coordinador')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (coordinadorError) throw coordinadorError;

      if (!coordinadorData?.id_coordinador) {
        console.warn('⚠️ No se encontró id_coordinador para el coordinador logueado');
        setCitas([]);
        setCargando(false);
        return;
      }

      const idCoordinador = coordinadorData.id_coordinador;

      // 2. Obtener órdenes asignadas por este coordinador
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          direccion_servicio,
          id_tecnico_asignado,
          clientes!inner (
            usuarios!inner (
              nombre_completo
            )
          ),
          tecnicos:id_tecnico_asignado (
            usuarios!inner (
              nombre_completo
            )
          )
        `)
        .eq('id_coordinador_supervisor', idCoordinador)
        .not('id_tecnico_asignado', 'is', null);

      if (ordenesError) throw ordenesError;

      // 3. Obtener citas de estas órdenes
      const ordenIds = (ordenesData || []).map(o => o.id_orden);
      let citasData: any[] = [];

      if (ordenIds.length > 0) {
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select('*')
          .in('id_orden', ordenIds)
          .order('fecha_programada', { ascending: false });

        if (citasError) throw citasError;
        citasData = citas || [];
      }

      // 4. Combinar datos de citas con órdenes
      const citasFormateadas: Cita[] = citasData.map((cita: any) => {
        const orden = ordenesData?.find((o: any) => o.id_orden === cita.id_orden);
        return {
          id_cita: cita.id_cita,
          id_orden: cita.id_orden,
          numero_orden: orden?.numero_orden || 'N/A',
          fecha_programada: cita.fecha_programada,
          estado_cita: cita.estado_cita,
          cliente: {
            nombre_completo: orden?.clientes?.usuarios?.nombre_completo || 'Cliente desconocido'
          },
          tecnico: {
            nombre_completo: orden?.tecnicos?.usuarios?.nombre_completo || 'Técnico desconocido'
          },
          direccion_servicio: orden?.direccion_servicio || '',
          tipo_servicio: orden?.tipo_servicio || ''
        };
      });

      setCitas(citasFormateadas);

      // 5. Calcular estadísticas
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);

      const citasHoy = citasFormateadas.filter(cita => {
        const fechaCita = new Date(cita.fecha_programada);
        fechaCita.setHours(0, 0, 0, 0);
        return fechaCita.getTime() === hoy.getTime();
      });

      const citasEstaSemana = citasFormateadas.filter(cita => {
        const fechaCita = new Date(cita.fecha_programada);
        return fechaCita >= hoy && fechaCita <= finSemana;
      });

      const citasConfirmadas = citasFormateadas.filter(cita => cita.estado_cita === 'Confirmada');
      const citasPendientes = citasFormateadas.filter(cita => cita.estado_cita === 'Pendiente' || cita.estado_cita === 'Programada');

      setEstadisticas({
        hoy: citasHoy.length,
        estaSemana: citasEstaSemana.length,
        confirmadas: citasConfirmadas.length,
        pendientes: citasPendientes.length
      });
    } catch (err: any) {
      console.error('Error cargando citas:', err);
      error('Error', 'No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Programada': { variant: 'secondary' as const, label: 'Programada' },
      'Confirmada': { variant: 'default' as const, label: 'Confirmada' },
      'Pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'Reprogramada': { variant: 'outline' as const, label: 'Reprogramada' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (cargando) {
    return (
      <Layout role="coordinator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando citas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Citas</h1>
            <p className="text-muted-foreground mt-2">Calendario de servicios programados</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Hoy</p>
              <p className="text-2xl font-bold">{estadisticas.hoy}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Clock className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
              <p className="text-2xl font-bold">{estadisticas.estaSemana}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <User className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold">{estadisticas.confirmadas}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <MapPin className="h-8 w-8 mb-2 text-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {citas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay citas programadas</p>
              </CardContent>
            </Card>
          ) : (
            citas.map((cita) => (
              <Card key={cita.id_cita}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      CITA-{cita.id_cita.toString().padStart(3, '0')} - Orden {cita.numero_orden}
                    </CardTitle>
                    {getEstadoBadge(cita.estado_cita)}
                  </div>
                  <CardDescription>Cliente: {cita.cliente.nombre_completo}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Técnico: {cita.tecnico.nombre_completo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatFecha(cita.fecha_programada)} a las {formatHora(cita.fecha_programada)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{cita.direccion_servicio}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tipo de servicio:</span>
                      <span className="font-medium">{cita.tipo_servicio}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
