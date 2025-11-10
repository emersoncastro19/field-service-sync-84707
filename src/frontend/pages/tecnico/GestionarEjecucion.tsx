import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Play, Square, Camera, FileText, CheckCircle, Clock, User, MapPin, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  prioridad: string;
  fecha_asignacion: string;
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
    estado_resultado: string;
  };
}

export default function GestionarEjecucion() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [trabajoRealizado, setTrabajoRealizado] = useState("");
  const [procesando, setProcesando] = useState(false);

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

      // 2. Obtener las órdenes asignadas al técnico (solo Asignada o En Proceso)
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          prioridad,
          fecha_asignacion,
          direccion_servicio,
          descripcion_solicitud,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              telefono,
              email
            )
          )
        `)
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .in('estado', ['Asignada', 'En Proceso'])
        .order('fecha_asignacion', { ascending: false });

      if (ordenesError) throw ordenesError;

      // 3. Obtener ejecuciones de estas órdenes
      const ordenIds = ordenesData.map((o: any) => o.id_orden);
      let ejecucionesData: any[] = [];
      
      if (ordenIds.length > 0) {
        const { data: ejecuciones } = await supabase
          .from('ejecuciones_servicio')
          .select('*')
          .in('id_orden', ordenIds);
        
        ejecucionesData = ejecuciones || [];
      }

      // 4. Combinar datos
      const ordenesFormateadas: Orden[] = ordenesData.map((orden: any) => {
        const ejecucion = ejecucionesData.find((e: any) => e.id_orden === orden.id_orden);
        return {
          id_orden: orden.id_orden,
          numero_orden: orden.numero_orden,
          tipo_servicio: orden.tipo_servicio,
          estado: orden.estado,
          prioridad: orden.prioridad,
          fecha_asignacion: orden.fecha_asignacion,
          direccion_servicio: orden.direccion_servicio,
          descripcion_solicitud: orden.descripcion_solicitud,
          cliente: {
            nombre_completo: orden.clientes?.usuarios?.nombre_completo || 'Cliente desconocido',
            telefono: orden.clientes?.usuarios?.telefono || null,
            email: orden.clientes?.usuarios?.email || ''
          },
          ejecucion: ejecucion ? {
            id_ejecucion: ejecucion.id_ejecucion,
            fecha_inicio: ejecucion.fecha_inicio,
            fecha_fin: ejecucion.fecha_fin,
            trabajo_realizado: ejecucion.trabajo_realizado,
            estado_resultado: ejecucion.estado_resultado
          } : undefined
        };
      });

      setOrdenes(ordenesFormateadas);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      error('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setCargando(false);
    }
  };

  const iniciarTrabajo = async (orden: Orden) => {
    if (!usuario) {
      error('Error', 'No hay usuario autenticado');
      return;
    }

    setProcesando(true);
    try {
      console.log('🚀 Iniciando trabajo para orden:', orden.numero_orden);
      console.log('📋 Datos de la orden:', {
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        estado_actual: orden.estado
      });

      // 1. Obtener el id_tecnico del usuario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      console.log('🔍 Obteniendo id_tecnico para usuario:', idUsuario);

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) {
        console.error('❌ Error obteniendo técnico:', tecnicoError);
        throw new Error(`Error al obtener información del técnico: ${tecnicoError.message}`);
      }

      if (!tecnicoData || !tecnicoData.id_tecnico) {
        throw new Error('No se encontró el técnico asociado al usuario');
      }

      console.log('✅ Técnico encontrado:', tecnicoData);

      // 2. Crear ejecución de servicio (incluyendo id_tecnico)
      // NOTA: estado_resultado debe ser un valor válido según el constraint CHECK de la base de datos
      // El constraint no acepta 'En Proceso', así que usaremos NULL o 'Pendiente'
      // El estado_resultado se establecerá cuando se finalice el trabajo
      const ejecucionDataBase = {
        id_orden: orden.id_orden,
        id_tecnico: tecnicoData.id_tecnico,
        fecha_inicio: new Date().toISOString(),
        trabajo_realizado: null
      };

      console.log('📝 Intentando insertar ejecución:', ejecucionDataBase);

      // Intentar insertar la ejecución
      // El constraint CHECK puede requerir un valor específico para estado_resultado
      // Intentaremos primero sin estado_resultado (NULL), luego con 'Pendiente'
      let ejecucionInsertada: any = null;
      
      // INTENTO 1: Sin estado_resultado (NULL o valor por defecto)
      const { data: data1, error: error1 } = await supabase
        .from('ejecuciones_servicio')
        .insert([ejecucionDataBase])
        .select()
        .single();

      if (error1) {
        console.error('❌ Error insertando ejecución (sin estado_resultado):', {
          code: error1.code,
          message: error1.message,
          details: error1.details
        });
        
        // Si es error de constraint CHECK, intentar con 'Pendiente'
        if (error1.code === '23514' && error1.message?.includes('estado_resultado_check')) {
          console.log('🔄 El constraint requiere un valor. Intentando con estado_resultado = "Pendiente"...');
          
          // INTENTO 2: Con 'Pendiente'
          const ejecucionDataConPendiente = {
            ...ejecucionDataBase,
            estado_resultado: 'Pendiente'
          };
          
          const { data: data2, error: error2 } = await supabase
            .from('ejecuciones_servicio')
            .insert([ejecucionDataConPendiente])
            .select()
            .single();
          
          if (error2) {
            console.error('❌ Error con "Pendiente":', error2);
            throw new Error(`Error de constraint: El valor de estado_resultado no es válido. Ejecuta SOLUCION_RAPIDA_ESTADO_RESULTADO.sql en Supabase. Error: ${error2.message}`);
          }
          
          ejecucionInsertada = data2;
          console.log('✅ Ejecución creada con "Pendiente":', ejecucionInsertada);
        } else if (error1.code === 'PGRST116' || error1.message?.includes('permission') || error1.message?.includes('RLS')) {
          throw new Error('Error de permisos: Verifica las políticas RLS en Supabase para la tabla ejecuciones_servicio.');
        } else {
          throw new Error(`Error al crear ejecución: ${error1.message} (${error1.code})`);
        }
      } else {
        ejecucionInsertada = data1;
        console.log('✅ Ejecución creada exitosamente:', ejecucionInsertada);
      }

      if (!ejecucionInsertada) {
        throw new Error('No se pudo crear la ejecución. Revisa la consola para más detalles.');
      }

      // 3. Actualizar estado de la orden
      console.log('🔄 Actualizando estado de la orden a "En Proceso"...');
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({ estado: 'En Proceso' })
        .eq('id_orden', orden.id_orden);

      if (updateError) {
        console.error('❌ Error actualizando orden:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message
        });
        throw new Error(`Error al actualizar orden: ${updateError.message} (${updateError.code})`);
      }

      console.log('✅ Estado de orden actualizado exitosamente');

      // 4. Log de auditoría (no crítico, no lanzamos error si falla)

      const { error: logError } = await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: idUsuario,
            id_orden: orden.id_orden,
            accion: 'INICIAR_TRABAJO',
            descripcion: `Técnico inició trabajo en orden ${orden.numero_orden}`,
            timestamp: new Date().toISOString()
          }
        ]);

      if (logError) {
        console.warn('⚠️ Error registrando log (no crítico):', logError);
      } else {
        console.log('✅ Log de auditoría registrado');
      }

      success('Trabajo iniciado', `Has iniciado el trabajo en la orden ${orden.numero_orden}`);
      await cargarOrdenes();
    } catch (err: any) {
      console.error('❌ Error completo iniciando trabajo:', err);
      console.error('❌ Stack trace:', err.stack);
      
      // Mostrar mensaje de error específico
      const mensajeError = err.message || 'No se pudo iniciar el trabajo. Revisa la consola para más detalles.';
      error('Error', mensajeError);
    } finally {
      setProcesando(false);
    }
  };

  const finalizarTrabajo = async (orden: Orden) => {
    if (!trabajoRealizado.trim()) {
      error('Error', 'Debes describir el trabajo realizado');
      return;
    }

    if (!orden.ejecucion) {
      error('Error', 'No hay una ejecución iniciada para esta orden');
      return;
    }

    setProcesando(true);
    try {
      // 1. Actualizar ejecución de servicio
      const { error: ejecucionError } = await supabase
        .from('ejecuciones_servicio')
        .update({
          fecha_fin: new Date().toISOString(),
          trabajo_realizado: trabajoRealizado.trim(),
          estado_resultado: 'Completado',
          confirmacion_cliente: 'Pendiente'
        })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

      if (ejecucionError) throw ejecucionError;

      // 2. Actualizar estado de la orden
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({ 
          estado: 'Completada',
          fecha_completada: new Date().toISOString()
        })
        .eq('id_orden', orden.id_orden);

      if (updateError) throw updateError;

      // 3. Obtener ID del cliente para notificación
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_cliente, clientes!inner(id_usuario)')
        .eq('id_orden', orden.id_orden)
        .single();

      const idUsuarioCliente = ordenData?.clientes?.id_usuario;

      // 4. Crear notificación al cliente
      if (idUsuarioCliente) {
        await supabase
          .from('notificaciones')
          .insert([
            {
              id_orden: orden.id_orden,
              id_destinatario: idUsuarioCliente,
              tipo_notificacion: 'Servicio Completado',
              canal: 'Sistema_Interno',
              mensaje: `El técnico ha completado el trabajo en tu orden ${orden.numero_orden}. Por favor confirma si el servicio fue realizado satisfactoriamente.`,
              fecha_enviada: new Date().toISOString(),
              leida: false
            }
          ]);
      }

      // 5. Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario?.id_usuario,
            id_orden: orden.id_orden,
            accion: 'FINALIZAR_TRABAJO',
            descripcion: `Técnico finalizó trabajo en orden ${orden.numero_orden}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Trabajo finalizado', `Has completado el trabajo en la orden ${orden.numero_orden}. El cliente ha sido notificado.`);
      setOrdenSeleccionada(null);
      setTrabajoRealizado("");
      await cargarOrdenes();
    } catch (err: any) {
      console.error('Error finalizando trabajo:', err);
      error('Error', 'No se pudo finalizar el trabajo');
    } finally {
      setProcesando(false);
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    const estilos: Record<string, string> = {
      'Baja': 'bg-blue-100 text-blue-800',
      'Media': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800',
    };
    return <Badge className={estilos[prioridad] || estilos['Media']}>{prioridad}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionar Ejecución de Servicio</h1>
          <p className="text-muted-foreground mt-2">Control y registro del servicio en curso</p>
        </div>

        {ordenes.length === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              No tienes órdenes asignadas para gestionar en este momento.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {ordenes.map((orden) => (
              <Card key={orden.id_orden}>
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
                      <Badge variant={orden.estado === 'En Proceso' ? 'default' : 'secondary'}>
                        {orden.estado}
                      </Badge>
                      {getPrioridadBadge(orden.prioridad)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Cliente
                      </p>
                      <p className="font-medium">{orden.cliente.nombre_completo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Dirección
                      </p>
                      <p className="font-medium text-xs">{orden.direccion_servicio}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Descripción</p>
                      <p className="font-medium text-xs">{orden.descripcion_solicitud}</p>
                    </div>
                    {orden.ejecucion?.fecha_inicio && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Inicio
                        </p>
                        <p className="font-medium text-xs">
                          {new Date(orden.ejecucion.fecha_inicio).toLocaleString('es-VE')}
                        </p>
                      </div>
                    )}
                  </div>

                  {!orden.ejecucion ? (
                    <Button 
                      className="w-full" 
                      onClick={() => iniciarTrabajo(orden)}
                      disabled={procesando}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Trabajo
                    </Button>
                  ) : orden.ejecucion.fecha_fin ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Trabajo completado el {new Date(orden.ejecucion.fecha_fin).toLocaleString('es-VE')}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Trabajo Realizado *</Label>
                        <Textarea
                          placeholder="Describe el trabajo realizado, acciones tomadas, materiales usados, etc."
                          value={trabajoRealizado}
                          onChange={(e) => setTrabajoRealizado(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => finalizarTrabajo(orden)}
                          disabled={procesando || !trabajoRealizado.trim()}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Finalizar Trabajo
                        </Button>
                        <Button 
                          variant="outline" 
                          asChild
                        >
                          <Link to="/tecnico/documentar">
                            <Camera className="mr-2 h-4 w-4" />
                            Documentar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
