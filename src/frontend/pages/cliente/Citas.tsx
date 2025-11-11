import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Calendar, Clock, MapPin, User, Loader2 } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { Link } from "react-router-dom";

interface Cita {
  id_cita: number;
  id_orden: number;
  fecha_programada: string;
  estado_cita: string;
  motivo_reprogramacion: string | null;
  orden: {
    numero_orden: string;
    tipo_servicio: string;
    direccion_servicio: string;
    estado: string;
  };
  tecnico: {
    nombre_completo: string;
    telefono: string | null;
  } | null;
}

export default function ClienteCitas() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  const cargarCitas = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener el cliente asociado al usuario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id_cliente')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (clienteError) throw clienteError;

      if (!clienteData) {
        throw new Error('No se encontraron datos del cliente');
      }

      // 2. Obtener órdenes del cliente
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          direccion_servicio,
          estado,
          id_tecnico_asignado
        `)
        .eq('id_cliente', clienteData.id_cliente)
        .not('id_tecnico_asignado', 'is', null)
        .in('estado', ['Asignada', 'En Proceso', 'Completada']);

      if (ordenesError) throw ordenesError;

      if (!ordenesData || ordenesData.length === 0) {
        setCitas([]);
        return;
      }

      // 3. Obtener citas de las órdenes
      const ordenIds = ordenesData.map(o => o.id_orden);
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('*')
        .in('id_orden', ordenIds)
        .order('fecha_programada', { ascending: true });

      if (citasError) throw citasError;

      // 4. Obtener información de técnicos para las órdenes
      const tecnicoIds = [...new Set(ordenesData.map(o => o.id_tecnico_asignado).filter(id => id !== null))];
      
      let tecnicosMap: Record<number, { nombre_completo: string; telefono: string | null }> = {};
      
      if (tecnicoIds.length > 0) {
        const { data: tecnicosData } = await supabase
          .from('tecnicos')
          .select(`
            id_tecnico,
            usuarios!inner (
              nombre_completo,
              telefono
            )
          `)
          .in('id_tecnico', tecnicoIds);

        if (tecnicosData) {
          tecnicosMap = tecnicosData.reduce((acc, tecnico: any) => {
            acc[tecnico.id_tecnico] = {
              nombre_completo: tecnico.usuarios?.nombre_completo || 'Técnico desconocido',
              telefono: tecnico.usuarios?.telefono || null
            };
            return acc;
          }, {} as Record<number, { nombre_completo: string; telefono: string | null }>);
        }
      }

      // 5. Combinar datos de citas, órdenes y técnicos
      const citasCompletas: Cita[] = (citasData || []).map((cita: any) => {
        const orden = ordenesData.find(o => o.id_orden === cita.id_orden);
        const tecnico = orden ? tecnicosMap[orden.id_tecnico_asignado] || null : null;

        return {
          id_cita: cita.id_cita,
          id_orden: cita.id_orden,
          fecha_programada: cita.fecha_programada,
          estado_cita: cita.estado_cita,
          motivo_reprogramacion: cita.motivo_reprogramacion,
          orden: {
            numero_orden: orden?.numero_orden || 'N/A',
            tipo_servicio: orden?.tipo_servicio || 'N/A',
            direccion_servicio: orden?.direccion_servicio || 'N/A',
            estado: orden?.estado || 'N/A'
          },
          tecnico: tecnico
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

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      'Reprogramada': { variant: 'default' as const, label: 'Reprogramada' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando citas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">Citas de servicio programadas</p>
        </div>

        {citas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes citas programadas</h3>
                <p className="text-muted-foreground">
                  Las citas aparecerán aquí cuando se programen para tus órdenes de servicio
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {citas.map((cita) => (
              <Card key={cita.id_cita}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {cita.orden.tipo_servicio}
                      </CardTitle>
                      <CardDescription>Orden: {cita.orden.numero_orden}</CardDescription>
                    </div>
                    {getEstadoBadge(cita.estado_cita)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                      {cita.tecnico && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Técnico
                          </p>
                          <p className="font-medium">{cita.tecnico.nombre_completo}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Dirección
                        </p>
                        <p className="font-medium">{cita.orden.direccion_servicio}</p>
                      </div>
                    </div>

                    {cita.motivo_reprogramacion && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Motivo de reprogramación:</strong> {cita.motivo_reprogramacion}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1" disabled={cita.estado_cita === 'Cancelada' || cita.estado_cita === 'Completada'}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Reprogramar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reprogramar Cita</DialogTitle>
                            <DialogDescription>
                              Selecciona una nueva fecha para tu cita de servicio
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-date">Nueva Fecha</Label>
                              <Input id="new-date" type="date" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-time">Nueva Hora</Label>
                              <Input id="new-time" type="time" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="reason">Motivo (Opcional)</Label>
                              <Input id="reason" placeholder="Motivo de la reprogramación" />
                            </div>
                            <Button className="w-full">Confirmar Reprogramación</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" asChild>
                        <Link to={`/cliente/detalles-orden?id=${cita.id_orden}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
