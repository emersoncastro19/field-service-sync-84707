import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { User, MapPin, Wrench, CheckCircle, Clock, Phone, Users } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";
import { useAuth } from "@/frontend/context/AuthContext";

interface Tecnico {
  id_tecnico: number;
  nombre_completo: string;
  telefono: string | null;
  zona_cobertura: string;
  disponibilidad: string;
  especialidades: string[];
  ordenesCompletadas: number;
  ordenesEnProceso: number;
}

export default function Tecnicos() {
  const { usuario } = useAuth();
  const { error } = useToast();
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [zonaCoordinador, setZonaCoordinador] = useState<string>("");
  const [nombreCoordinador, setNombreCoordinador] = useState<string>("");

  useEffect(() => {
    if (usuario) {
      cargarTecnicos();
    }
  }, [usuario]);

  const cargarTecnicos = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // 1. Obtener la zona del coordinador logueado
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('coordinadores_campo')
        .select(`
          id_coordinador,
          zona_responsabilidad,
          usuarios!inner (
            nombre_completo
          )
        `)
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (coordinadorError) throw coordinadorError;

      if (!coordinadorData) {
        error('Error', 'No se encontraron datos del coordinador');
        return;
      }

      const zona = coordinadorData.zona_responsabilidad || '';
      const nombreCoord = coordinadorData.usuarios?.nombre_completo || usuario.nombre_completo || '';
      const idCoordinadorSupervisor = coordinadorData.id_coordinador || null;

      setZonaCoordinador(zona);
      setNombreCoordinador(nombreCoord);

      // 3. Cargar técnicos asignados a este coordinador (por id_coordinador_supervisor)
      if (!idCoordinadorSupervisor) {
        // Si no hay id_coordinador, no hay técnicos asignados
        setTecnicos([]);
        setCargando(false);
        return;
      }

      const { data: tecnicosData, error: tecnicosError } = await supabase
        .from('tecnicos')
        .select(`
          id_tecnico,
          zona_cobertura,
          disponibilidad,
          id_coordinador_supervisor,
          usuarios!inner (
            nombre_completo,
            telefono
          ),
          especialidades_tecnicos (
            especialidad
          )
        `)
        .eq('id_coordinador_supervisor', idCoordinadorSupervisor)
        .order('id_tecnico', { ascending: true });

      if (tecnicosError) throw tecnicosError;

      // 2. Para cada técnico, contar sus órdenes completadas y en proceso
      const tecnicosConEstadisticas = await Promise.all(
        (tecnicosData || []).map(async (tec: any) => {
          // Contar órdenes completadas
          const { count: completadas } = await supabase
            .from('ordenes_servicio')
            .select('*', { count: 'exact', head: true })
            .eq('id_tecnico_asignado', tec.id_tecnico)
            .eq('estado', 'Completada');

          // Contar órdenes en proceso
          const { count: enProceso } = await supabase
            .from('ordenes_servicio')
            .select('*', { count: 'exact', head: true })
            .eq('id_tecnico_asignado', tec.id_tecnico)
            .in('estado', ['Asignada', 'En Proceso']);

          return {
            id_tecnico: tec.id_tecnico,
            nombre_completo: tec.usuarios?.nombre_completo || 'Nombre no disponible',
            telefono: tec.usuarios?.telefono || null,
            zona_cobertura: tec.zona_cobertura || 'No definida',
            disponibilidad: tec.disponibilidad || 'Desconocida',
            especialidades: (tec.especialidades_tecnicos || []).map((e: any) => e.especialidad),
            ordenesCompletadas: completadas || 0,
            ordenesEnProceso: enProceso || 0
          };
        })
      );

      setTecnicos(tecnicosConEstadisticas);
    } catch (err: any) {
      console.error('Error cargando técnicos:', err);
      error('Error', 'No se pudieron cargar los técnicos');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <Layout role="coordinator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando técnicos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Técnicos</h1>
          <p className="text-muted-foreground mt-2">
            Supervisa el estado y rendimiento de los técnicos de tu zona ({tecnicos.length} {tecnicos.length === 1 ? 'técnico' : 'técnicos'})
          </p>
          {zonaCoordinador && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Zona de Responsabilidad: {zonaCoordinador}</p>
                  <p className="text-sm text-muted-foreground">
                    Coordinador: {nombreCoordinador}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {tecnicos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {zonaCoordinador ? `No tienes técnicos asignados` : 'No hay técnicos registrados'}
                </h3>
                <p className="text-muted-foreground">
                  {zonaCoordinador 
                    ? `No tienes técnicos asignados en tu zona de responsabilidad (${zonaCoordinador}). Los técnicos se asignan automáticamente cuando se crean con la misma zona que tienes asignada.`
                    : 'No hay técnicos disponibles en el sistema en este momento.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tecnicos.map((tech) => (
              <Card key={tech.id_tecnico}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <div>
                        <CardTitle>{tech.nombre_completo}</CardTitle>
                        <CardDescription>ID: T-{tech.id_tecnico}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={tech.disponibilidad === "Activo" ? "default" : "secondary"}>
                      {tech.disponibilidad === "Activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tech.especialidades.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-muted-foreground mb-1">Especialidades:</p>
                          <div className="flex flex-wrap gap-1">
                            {tech.especialidades.map((esp, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{tech.zona_cobertura}</span>
                    </div>
                    {tech.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{tech.telefono}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Completados</p>
                          <p className="text-lg font-semibold">{tech.ordenesCompletadas}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">En Proceso</p>
                          <p className="text-lg font-semibold">{tech.ordenesEnProceso}</p>
                        </div>
                      </div>
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
