import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { 
  Play, Square, Camera, FileText, CheckCircle, Clock, User, MapPin, 
  AlertCircle, Upload, X, Loader2, Wrench
} from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { formatearFechaVenezuela, formatearHoraVenezuela, formatearSoloFechaVenezuela, parsearFechaUTC, obtenerFechaActualVenezuelaUTC } from "@/shared/utils/dateUtils";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
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
    repuestos_utilizados?: string | null;
    recomendaciones?: string | null;
  };
  cita?: {
    id_cita: number;
    fecha_programada: string;
    estado_cita: string;
  } | null;
  impedimentos?: Array<{
    id_impedimento: number;
    tipo_impedimento: string;
    descripcion: string;
    estado_resolucion: string;
    fecha_reporte: string;
  }>;
  imagenes?: Array<{
    id_imagen: number;
    url_imagen: string;
    descripcion: string | null;
  }>;
}

export default function GestionarEjecucion() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<Record<number, boolean>>({});
  const [guardandoDocumentacion, setGuardandoDocumentacion] = useState<Record<number, boolean>>({});

  // Estados para cada orden (usando Map para manejar múltiples órdenes)
  const [trabajoRealizado, setTrabajoRealizado] = useState<Record<number, string>>({});
  const [repuestosUtilizados, setRepuestosUtilizados] = useState<Record<number, string>>({});
  const [recomendaciones, setRecomendaciones] = useState<Record<number, string>>({});
  const [imagenes, setImagenes] = useState<Record<number, File[]>>({});
  const [imagenesPreview, setImagenesPreview] = useState<Record<number, string[]>>({});
  const [subiendoImagenes, setSubiendoImagenes] = useState<Record<number, boolean>>({});
  
  // Estados para reportar impedimentos
  const [tipoImpedimento, setTipoImpedimento] = useState<Record<number, string>>({});
  const [descripcionImpedimento, setDescripcionImpedimento] = useState<Record<number, string>>({});
  const [reportandoImpedimento, setReportandoImpedimento] = useState<Record<number, boolean>>({});

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

      // 4. Obtener citas de estas órdenes
      let citasData: any[] = [];
      if (ordenIds.length > 0) {
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select('*')
          .in('id_orden', ordenIds)
          .order('fecha_programada', { ascending: false });
        
        if (citasError) {
          console.error('Error obteniendo citas:', citasError);
        } else {
          citasData = citas || [];
          
          // DEBUG: Verificar formato de fecha que devuelve Supabase
          if (citasData.length > 0) {
            citasData.forEach((c, index) => {
              const fechaRaw = c.fecha_programada;
              const fechaNormalizada = parsearFechaUTC(fechaRaw);
              
              console.log(`🔍 DEBUG - Cita ${index + 1} de Supabase:`, {
                id_cita: c.id_cita,
                fecha_programada_RAW: fechaRaw,
                fecha_programada_tieneZ: fechaRaw?.endsWith('Z'),
                fecha_programada_NORMALIZADA: fechaRaw && !fechaRaw.endsWith('Z') && !fechaRaw.match(/[+-]\d{2}:\d{2}$/) ? fechaRaw + 'Z' : fechaRaw,
                fechaDate_SIN_Z: fechaRaw ? new Date(fechaRaw).toISOString() : null,
                fechaDate_CON_Z: fechaNormalizada.toISOString(),
                hora_SIN_Z: fechaRaw ? new Date(fechaRaw).toLocaleTimeString('en-US', {
                  timeZone: 'America/Caracas',
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                }) : null,
                hora_CON_Z: fechaNormalizada.toLocaleTimeString('en-US', {
                  timeZone: 'America/Caracas',
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                formatearHoraVenezuela_RESULT: formatearHoraVenezuela(c.fecha_programada)
              });
            });
          }
        }
      }

      // 5. Obtener impedimentos de estas órdenes
      let impedimentosData: any[] = [];
      if (ordenIds.length > 0) {
        const { data: impedimentos } = await supabase
          .from('impedimentos')
          .select('*')
          .in('id_orden', ordenIds)
          .order('fecha_reporte', { ascending: false });
        
        impedimentosData = impedimentos || [];
      }

      // 6. Combinar datos
      const ordenesFormateadas: Orden[] = ordenesData.map((orden: any) => {
        const ejecucion = ejecucionesData.find((e: any) => e.id_orden === orden.id_orden);
        const impedimentosOrden = impedimentosData.filter((i: any) => i.id_orden === orden.id_orden);
        // Obtener la cita más reciente para esta orden (puede haber múltiples citas por reprogramaciones)
        const citaOrden = citasData
          .filter((c: any) => c.id_orden === orden.id_orden)
          .sort((a: any, b: any) => parsearFechaUTC(b.fecha_programada).getTime() - parsearFechaUTC(a.fecha_programada).getTime())[0];
        
        // Parsear trabajo_realizado para extraer repuestos y recomendaciones si existen
        let repuestos = '';
        let recomendaciones = '';
        let trabajoRealizadoTexto = ejecucion?.trabajo_realizado || '';
        
        if (ejecucion?.trabajo_realizado) {
          const partes = ejecucion.trabajo_realizado.split('\n\n');
          trabajoRealizadoTexto = partes[0] || '';
          
          partes.forEach((parte: string) => {
            if (parte.startsWith('Repuestos Utilizados:')) {
              repuestos = parte.replace('Repuestos Utilizados:', '').trim();
            } else if (parte.startsWith('Recomendaciones:')) {
              recomendaciones = parte.replace('Recomendaciones:', '').trim();
            }
          });
        }

        return {
          id_orden: orden.id_orden,
          numero_orden: orden.numero_orden,
          tipo_servicio: orden.tipo_servicio,
          estado: orden.estado,
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
            trabajo_realizado: trabajoRealizadoTexto,
            estado_resultado: ejecucion.estado_resultado,
            repuestos_utilizados: repuestos,
            recomendaciones: recomendaciones
          } : undefined,
          cita: citaOrden ? {
            id_cita: citaOrden.id_cita,
            fecha_programada: citaOrden.fecha_programada,
            estado_cita: citaOrden.estado_cita
          } : null,
          impedimentos: impedimentosOrden.length > 0 ? impedimentosOrden.map((imp: any) => ({
            id_impedimento: imp.id_impedimento,
            tipo_impedimento: imp.tipo_impedimento,
            descripcion: imp.descripcion,
            estado_resolucion: imp.estado_resolucion,
            fecha_reporte: imp.fecha_reporte || imp.fecha_creacion || new Date().toISOString()
          })) : undefined
        };
      });

      // 6. Inicializar estados con los datos cargados
      ordenesFormateadas.forEach(orden => {
        if (orden.ejecucion) {
          setTrabajoRealizado(prev => ({
            ...prev,
            [orden.id_orden]: orden.ejecucion?.trabajo_realizado || ''
          }));
          setRepuestosUtilizados(prev => ({
            ...prev,
            [orden.id_orden]: orden.ejecucion?.repuestos_utilizados || ''
          }));
          setRecomendaciones(prev => ({
            ...prev,
            [orden.id_orden]: orden.ejecucion?.recomendaciones || ''
          }));
        }
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

    // Validar que la fecha actual sea mayor o igual a la fecha programada (si existe cita)
    if (orden.cita) {
      const fechaActual = new Date();
      
      // Normalizar la fecha de la cita para forzar interpretación como UTC
      const fechaProgramada = parsearFechaUTC(orden.cita.fecha_programada);
      
      if (fechaActual < fechaProgramada) {
        // Formatear en zona horaria de Venezuela usando formato numérico simple
        const fecha = parsearFechaUTC(orden.cita.fecha_programada);
        const fechaFormateada = fecha.toLocaleDateString('es-VE', {
          timeZone: 'America/Caracas',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const horaFormateada = formatearHoraVenezuela(orden.cita.fecha_programada);
        error('Error', `Esta cita aún no está disponible para ejecución. La fecha programada es el ${fechaFormateada} a las ${horaFormateada}.`);
        setProcesando(prev => ({ ...prev, [orden.id_orden]: false }));
        return;
      }
    }

    setProcesando(prev => ({ ...prev, [orden.id_orden]: true }));
    try {
      // 1. Obtener el id_tecnico del usuario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) throw tecnicoError;

      // 2. Crear ejecución de servicio
      const fechaActualInicio = obtenerFechaActualVenezuelaUTC();
      const ejecucionDataBase = {
        id_orden: orden.id_orden,
        id_tecnico: tecnicoData.id_tecnico,
        fecha_inicio: fechaActualInicio,
        trabajo_realizado: null
      };

      let ejecucionInsertada: any = null;
      
      const { data: data1, error: error1 } = await supabase
        .from('ejecuciones_servicio')
        .insert([ejecucionDataBase])
        .select()
        .single();

      if (error1) {
        if (error1.code === '23514' && error1.message?.includes('estado_resultado_check')) {
          const ejecucionDataConPendiente = {
            ...ejecucionDataBase,
            estado_resultado: 'Pendiente'
          };
          
          const { data: data2, error: error2 } = await supabase
            .from('ejecuciones_servicio')
            .insert([ejecucionDataConPendiente])
            .select()
            .single();
          
          if (error2) throw error2;
          ejecucionInsertada = data2;
        } else {
          throw error1;
        }
      } else {
        ejecucionInsertada = data1;
      }

      // 3. Actualizar estado de la orden
      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update({ estado: 'En Proceso' })
        .eq('id_orden', orden.id_orden);

      if (updateError) throw updateError;

      // 4. Actualizar estado de la cita si existe (de "Confirmada" a "En Proceso")
      if (orden.cita?.id_cita) {
        const { error: citaError } = await supabase
          .from('citas')
          .update({ 
            estado_cita: 'En Proceso'
          })
          .eq('id_cita', orden.cita.id_cita);

        if (citaError) {
          console.warn('Error actualizando estado de la cita a "En Proceso":', citaError);
          // No lanzamos error, solo registramos la advertencia
        }
      }

      // 5. Obtener IDs para notificaciones
      // Obtener ID del cliente
      const { data: ordenDataCliente } = await supabase
        .from('ordenes_servicio')
        .select('id_cliente')
        .eq('id_orden', orden.id_orden)
        .single();

      let idUsuarioCliente: number | null = null;

      if (ordenDataCliente?.id_cliente) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('id_usuario')
          .eq('id_cliente', ordenDataCliente.id_cliente)
          .single();

        if (clienteData?.id_usuario) {
          idUsuarioCliente = typeof clienteData.id_usuario === 'string' 
            ? parseInt(clienteData.id_usuario, 10) 
            : clienteData.id_usuario;
        }
      }

      // Obtener ID del coordinador
      const { data: ordenDataCoordinador } = await supabase
        .from('ordenes_servicio')
        .select('id_coordinador_supervisor')
        .eq('id_orden', orden.id_orden)
        .single();

      let idUsuarioCoordinador: number | null = null;

      if (ordenDataCoordinador?.id_coordinador_supervisor) {
        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('id_usuario')
          .eq('id_coordinador', ordenDataCoordinador.id_coordinador_supervisor)
          .single();

        if (coordinadorData?.id_usuario) {
          idUsuarioCoordinador = typeof coordinadorData.id_usuario === 'string' 
            ? parseInt(coordinadorData.id_usuario, 10) 
            : coordinadorData.id_usuario;
        }
      }

      // Obtener nombre del técnico
      const nombreTecnico = usuario?.nombre_completo || 'Técnico';

      // 6. Crear notificaciones
      const notificaciones = [];

      // Notificar al cliente
      if (idUsuarioCliente) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: idUsuarioCliente,
          tipo_notificacion: 'Trabajo Iniciado',
          canal: 'Sistema_Interno',
          mensaje: `El técnico ha iniciado el trabajo en tu orden ${orden.numero_orden}.`,
          fecha_enviada: fechaActualInicio,
          leida: false
        });
      }

      // Notificar al coordinador
      if (idUsuarioCoordinador) {
        notificaciones.push({
          id_orden: orden.id_orden,
          id_destinatario: idUsuarioCoordinador,
          tipo_notificacion: 'Trabajo Iniciado',
          canal: 'Sistema_Interno',
          mensaje: `El técnico ${nombreTecnico} ha iniciado el trabajo en la orden ${orden.numero_orden}.`,
          fecha_enviada: fechaActualInicio,
          leida: false
        });
      }

      if (notificaciones.length > 0) {
        const { error: notifError } = await supabase
          .from('notificaciones')
          .insert(notificaciones);

        if (notifError) {
          console.error('Error enviando notificaciones:', notifError);
        } else {
          console.log(`✅ ${notificaciones.length} notificaciones enviadas (Cliente y Coordinador)`);
        }
      }

      // 7. Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: idUsuario,
            id_orden: orden.id_orden,
            accion: 'INICIAR_TRABAJO',
            descripcion: `Técnico inició trabajo en orden ${orden.numero_orden}`,
            timestamp: fechaActualInicio
          }
        ]);

      success('Trabajo iniciado', `Has iniciado el trabajo en la orden ${orden.numero_orden}. El cliente y el coordinador han sido notificados.`);
      await cargarOrdenes();
    } catch (err: any) {
      console.error('Error iniciando trabajo:', err);
      error('Error', err.message || 'No se pudo iniciar el trabajo');
    } finally {
      setProcesando(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  const finalizarTrabajo = async (orden: Orden) => {
    if (!orden.ejecucion) {
      error('Error', 'No hay una ejecución iniciada para esta orden');
      return;
    }

    // Obtener el trabajo realizado de la documentación (tab "Documentar")
    const trabajo = trabajoRealizado[orden.id_orden] || '';
    
    if (!trabajo.trim()) {
      error('Error', 'Debes documentar el trabajo realizado en la pestaña "Documentar" antes de finalizar');
      return;
    }

    setProcesando(prev => ({ ...prev, [orden.id_orden]: true }));
    try {
      // Combinar toda la documentación del tab "Documentar"
      let documentacionCompleta = trabajo.trim();
      const repuestos = repuestosUtilizados[orden.id_orden] || '';
      const recom = recomendaciones[orden.id_orden] || '';
      
      if (repuestos.trim()) {
        documentacionCompleta += `\n\nRepuestos Utilizados:\n${repuestos.trim()}`;
      }
      
      if (recom.trim()) {
        documentacionCompleta += `\n\nRecomendaciones:\n${recom.trim()}`;
      }

      // 1. Subir imágenes primero (si hay) - no bloqueamos el proceso si falla
      const imagenesOrden = imagenes[orden.id_orden] || [];
      if (imagenesOrden.length > 0) {
        try {
          await subirImagenes(orden.id_orden, orden.ejecucion.id_ejecucion, imagenesOrden);
        } catch (err) {
          // No lanzamos el error, solo lo registramos - el proceso continúa
          console.warn('⚠️ Advertencia: No se pudieron subir algunas imágenes, pero el proceso continuará:', err);
        }
      }

      // 2. Actualizar ejecución de servicio
      const fechaActual = obtenerFechaActualVenezuelaUTC();
      const { error: ejecucionError } = await supabase
        .from('ejecuciones_servicio')
        .update({
          fecha_fin: fechaActual,
          trabajo_realizado: documentacionCompleta,
          estado_resultado: 'Completado',
          confirmacion_cliente: 'Pendiente'
        })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

      if (ejecucionError) throw ejecucionError;

      // 3. NO actualizamos el estado de la orden aquí - mantenemos "En Proceso"
      // El campo confirmacion_cliente = 'Pendiente' en ejecuciones_servicio indica que está esperando confirmación
      // La orden solo se marca como "Completada" cuando el cliente confirma
      // Esto evita errores con estados no permitidos en la base de datos (CHECK constraint)
      console.log(`✅ Ejecución completada - El estado confirmacion_cliente = 'Pendiente' indica que está esperando confirmación del cliente`);

      // 5. Obtener ID del cliente para notificación
      // Primero obtener id_cliente de la orden
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_cliente')
        .eq('id_orden', orden.id_orden)
        .single();

      let idUsuarioCliente: number | null = null;

      if (ordenData?.id_cliente) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id_usuario')
          .eq('id_cliente', ordenData.id_cliente)
          .maybeSingle();

        if (cliente?.id_usuario) {
          idUsuarioCliente = typeof cliente.id_usuario === 'string' 
            ? parseInt(cliente.id_usuario, 10) 
            : cliente.id_usuario;
        }
      }

      // 6. Crear notificación al cliente (no bloqueamos si falla)
      if (idUsuarioCliente) {
        try {
          const { error: notifError } = await supabase
            .from('notificaciones')
            .insert([
              {
                id_orden: orden.id_orden,
                id_destinatario: idUsuarioCliente,
                tipo_notificacion: 'Servicio Completado',
                canal: 'Sistema_Interno',
                mensaje: `El técnico ha completado el trabajo en tu orden ${orden.numero_orden}. Por favor confirma si el servicio fue realizado satisfactoriamente.`,
                fecha_enviada: obtenerFechaActualVenezuelaUTC(),
                leida: false
              }
            ]);

          if (notifError) {
            console.warn('⚠️ No se pudo enviar la notificación al cliente:', notifError);
          } else {
            console.log('✅ Notificación enviada al cliente');
          }
        } catch (err) {
          console.warn('⚠️ Error al crear notificación:', err);
          // No lanzamos el error, el proceso continúa
        }
      }

      // 7. Log de auditoría
      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;

      if (idUsuario) {
        await supabase
          .from('logs_auditoria')
          .insert([
            {
              id_usuario: idUsuario,
              id_orden: orden.id_orden,
              accion: 'FINALIZAR_TRABAJO',
              descripcion: `Técnico finalizó trabajo en orden ${orden.numero_orden}`,
              timestamp: fechaActual
            }
          ]);
      }

      success('Trabajo finalizado', `Has finalizado el trabajo en la orden ${orden.numero_orden}. La orden está esperando confirmación del cliente. El cliente ha sido notificado y debe confirmar para que la orden se marque como "Completada".`);
      
      // Limpiar estados
      setTrabajoRealizado(prev => ({ ...prev, [orden.id_orden]: '' }));
      setRepuestosUtilizados(prev => ({ ...prev, [orden.id_orden]: '' }));
      setRecomendaciones(prev => ({ ...prev, [orden.id_orden]: '' }));
      setImagenes(prev => ({ ...prev, [orden.id_orden]: [] }));
      setImagenesPreview(prev => ({ ...prev, [orden.id_orden]: [] }));
      
      await cargarOrdenes();
    } catch (err: any) {
      console.error('Error finalizando trabajo:', err);
      error('Error', 'No se pudo finalizar el trabajo');
    } finally {
      setProcesando(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  const subirImagenes = async (idOrden: number, idEjecucion: number, archivos: File[]) => {
    setSubiendoImagenes(prev => ({ ...prev, [idOrden]: true }));
    
    try {
      // Crear bucket si no existe (esto debe hacerse manualmente en Supabase)
      // Por ahora, intentamos subir a un bucket llamado 'documentacion-servicios'
      const bucketName = 'documentacion-servicios';
      
      const urls: string[] = [];
      let erroresSubida = 0;
      
      for (const archivo of archivos) {
        try {
          const nombreArchivo = `${idOrden}_${idEjecucion}_${Date.now()}_${archivo.name}`;
          const ruta = `orden-${idOrden}/${nombreArchivo}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(ruta, archivo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error subiendo imagen:', uploadError);
            erroresSubida++;
            
            // Si el bucket no existe, mostrar advertencia pero continuar
            if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
              console.warn('⚠️ Bucket no encontrado. Por favor crea el bucket "documentacion-servicios" en Supabase Storage.');
              // Si el bucket no existe, no intentamos subir más imágenes
              break;
            }
            continue;
          }

          // Obtener URL pública
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(ruta);

          if (urlData?.publicUrl) {
            urls.push(urlData.publicUrl);
          }
        } catch (err: any) {
          console.error('Error procesando imagen individual:', err);
          erroresSubida++;
        }
      }

      if (urls.length > 0) {
        console.log(`✅ ${urls.length} imagen(es) subida(s) correctamente`);
        
        // TODO: Guardar URLs en ejecuciones_servicio (como JSON en un campo de texto o crear tabla separada)
        // Por ahora, solo mostramos éxito
      }
      
      if (erroresSubida > 0 && urls.length === 0) {
        // Si todas las imágenes fallaron, mostrar advertencia
        console.warn('⚠️ No se pudieron subir las imágenes. Verifica que el bucket "documentacion-servicios" exista en Supabase Storage.');
      }
    } catch (err: any) {
      console.error('Error en subirImagenes:', err);
      // No lanzamos el error, solo lo registramos - el proceso principal continúa
      console.warn('⚠️ Error al subir imágenes, pero el proceso de finalización continuará');
    } finally {
      setSubiendoImagenes(prev => ({ ...prev, [idOrden]: false }));
    }
  };

  const guardarDocumentacion = async (orden: Orden) => {
    if (!orden.ejecucion) {
      error('Error', 'Debes iniciar el trabajo antes de documentar');
      return;
    }

    setGuardandoDocumentacion(prev => ({ ...prev, [orden.id_orden]: true }));
    try {
      const trabajo = trabajoRealizado[orden.id_orden] || '';
      const repuestos = repuestosUtilizados[orden.id_orden] || '';
      const recom = recomendaciones[orden.id_orden] || '';
      
      if (!trabajo.trim()) {
        error('Error', 'Debes proporcionar al menos un resumen del trabajo realizado');
        return;
      }

      // Combinar toda la documentación
      let documentacionCompleta = trabajo.trim();
      
      if (repuestos.trim()) {
        documentacionCompleta += `\n\nRepuestos Utilizados:\n${repuestos.trim()}`;
      }
      
      if (recom.trim()) {
        documentacionCompleta += `\n\nRecomendaciones:\n${recom.trim()}`;
      }

      // Actualizar ejecución de servicio
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({
          trabajo_realizado: documentacionCompleta
        })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

      if (updateError) throw updateError;

      // Subir imágenes si hay
      const imagenesOrden = imagenes[orden.id_orden] || [];
      if (imagenesOrden.length > 0) {
        await subirImagenes(orden.id_orden, orden.ejecucion.id_ejecucion, imagenesOrden);
      }

      // Log de auditoría
      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;

      if (idUsuario) {
        await supabase
          .from('logs_auditoria')
          .insert([
            {
              id_usuario: idUsuario,
              id_orden: orden.id_orden,
              accion: 'DOCUMENTAR_TRABAJO',
              descripcion: `Técnico documentó el trabajo en orden ${orden.numero_orden}`,
              timestamp: new Date().toISOString()
            }
          ]);
      }

      success('Documentación guardada', 'La documentación del trabajo ha sido guardada exitosamente');
      await cargarOrdenes();
    } catch (err: any) {
      console.error('Error guardando documentación:', err);
      error('Error', 'No se pudo guardar la documentación');
    } finally {
      setGuardandoDocumentacion(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  const reportarImpedimento = async (orden: Orden) => {
    const tipo = tipoImpedimento[orden.id_orden] || '';
    const descripcion = descripcionImpedimento[orden.id_orden] || '';

    if (!tipo) {
      error('Error', 'Debes seleccionar un tipo de impedimento');
      return;
    }

    if (!descripcion.trim()) {
      error('Error', 'Debes describir el impedimento');
      return;
    }

    setReportandoImpedimento(prev => ({ ...prev, [orden.id_orden]: true }));
    
    try {
      // 1. Obtener el id_tecnico
      const idUsuario = typeof usuario?.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario?.id_usuario;

      if (!idUsuario) throw new Error('No se encontró el usuario');

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_tecnico')
        .eq('id_usuario', idUsuario)
        .single();

      if (tecnicoError) throw tecnicoError;

      // 2. Crear impedimento
      const datosImpedimento: any = {
        id_orden: orden.id_orden,
        id_tecnico: tecnicoData.id_tecnico,
        tipo_impedimento: tipo,
        descripcion: descripcion.trim(),
        estado_resolucion: 'Pendiente'
      };

      // Agregar fecha_reporte solo si el campo existe en la tabla
      // (algunas tablas pueden usar fecha_creacion o tener un default)
      datosImpedimento.fecha_reporte = new Date().toISOString();

      const { data: impedimentoData, error: impedimentoError } = await supabase
        .from('impedimentos')
        .insert([datosImpedimento])
        .select()
        .single();

      if (impedimentoError) throw impedimentoError;

      // 3. Obtener el coordinador asignado para notificar
      // Primero obtener el id_coordinador_supervisor de la orden
      const { data: ordenData } = await supabase
        .from('ordenes_servicio')
        .select('id_coordinador_supervisor')
        .eq('id_orden', orden.id_orden)
        .maybeSingle();

      let idUsuarioCoordinador: number | null = null;

      if (ordenData?.id_coordinador_supervisor) {
        // Obtener el id_usuario del coordinador
        const idCoord = typeof ordenData.id_coordinador_supervisor === 'string' 
          ? parseInt(ordenData.id_coordinador_supervisor, 10) 
          : ordenData.id_coordinador_supervisor;

        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('id_usuario')
          .eq('id_coordinador', idCoord)
          .maybeSingle();

        if (coordinadorData?.id_usuario) {
          idUsuarioCoordinador = typeof coordinadorData.id_usuario === 'string' 
            ? parseInt(coordinadorData.id_usuario, 10) 
            : coordinadorData.id_usuario;
        }
      }

      // 4. Crear notificación al coordinador
      if (idUsuarioCoordinador) {
        await supabase
          .from('notificaciones')
          .insert([
            {
              id_orden: orden.id_orden,
              id_destinatario: idUsuarioCoordinador,
              tipo_notificacion: 'Impedimento Reportado',
              canal: 'Sistema_Interno',
              mensaje: `El técnico ha reportado un impedimento en la orden ${orden.numero_orden}: ${tipo}`,
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
            id_usuario: idUsuario,
            id_orden: orden.id_orden,
            accion: 'REPORTAR_IMPEDIMENTO',
            descripcion: `Técnico reportó impedimento en orden ${orden.numero_orden}: ${tipo}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Impedimento reportado', 'El impedimento ha sido reportado y el coordinador ha sido notificado');
      
      // Limpiar formulario
      setTipoImpedimento(prev => ({ ...prev, [orden.id_orden]: '' }));
      setDescripcionImpedimento(prev => ({ ...prev, [orden.id_orden]: '' }));
      
      await cargarOrdenes();
    } catch (err: any) {
      console.error('Error reportando impedimento:', err);
      error('Error', err.message || 'No se pudo reportar el impedimento');
    } finally {
      setReportandoImpedimento(prev => ({ ...prev, [orden.id_orden]: false }));
    }
  };

  const handleImagenesChange = (ordenId: number, archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    const nuevosArchivos = Array.from(archivos);
    const archivosActuales = imagenes[ordenId] || [];
    const todosArchivos = [...archivosActuales, ...nuevosArchivos];

    // Limitar a 10 imágenes por orden
    if (todosArchivos.length > 10) {
      error('Error', 'Solo se pueden subir hasta 10 imágenes por orden');
      return;
    }

    setImagenes(prev => ({ ...prev, [ordenId]: todosArchivos }));

    // Crear previews
    const nuevasPreviews = nuevosArchivos.map(archivo => URL.createObjectURL(archivo));
    setImagenesPreview(prev => ({
      ...prev,
      [ordenId]: [...(prev[ordenId] || []), ...nuevasPreviews]
    }));
  };

  const eliminarImagen = (ordenId: number, index: number) => {
    const archivosActuales = imagenes[ordenId] || [];
    const previewsActuales = imagenesPreview[ordenId] || [];

    archivosActuales.splice(index, 1);
    URL.revokeObjectURL(previewsActuales[index]);
    previewsActuales.splice(index, 1);

    setImagenes(prev => ({ ...prev, [ordenId]: archivosActuales }));
    setImagenesPreview(prev => ({ ...prev, [ordenId]: previewsActuales }));
  };

  if (cargando) {
    return (
      <Layout role="technician">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando órdenes...</p>
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
          <div className="grid gap-6">
            {ordenes.map((orden) => (
              <Card key={orden.id_orden} className="w-full">
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
                    <Badge variant={orden.estado === 'En Proceso' ? 'default' : 'secondary'}>
                      {orden.estado}
                    </Badge>
                  </div>
            </CardHeader>
                <CardContent>
                  {/* Información básica de la orden */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b">
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
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground">Descripción</p>
                      <p className="font-medium text-xs">{orden.descripcion_solicitud}</p>
                    </div>
                    {orden.cita && (
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Cita Programada
                        </p>
                        <p className="font-medium text-xs">
                          {formatearFechaVenezuela(orden.cita.fecha_programada)} - Estado: {orden.cita.estado_cita}
                        </p>
                      </div>
                    )}
                    {orden.ejecucion?.fecha_inicio && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Inicio
                        </p>
                        <p className="font-medium text-xs">
                          {formatearFechaVenezuela(orden.ejecucion.fecha_inicio)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tabs para las tres funcionalidades */}
                  <Tabs defaultValue="trabajo" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="trabajo" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Trabajo
                      </TabsTrigger>
                      <TabsTrigger value="documentar" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Documentar
                      </TabsTrigger>
                      <TabsTrigger value="impedimentos" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Impedimentos
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Iniciar/Finalizar Trabajo */}
                    <TabsContent value="trabajo" className="space-y-4 mt-4">
                      {!orden.ejecucion ? (
                        <div className="space-y-4">
                          {/* Verificar si hay cita programada y si la fecha actual es menor que la fecha programada */}
                          {orden.cita && (() => {
                            const fechaActual = new Date();
                            
                            // Normalizar la fecha de la cita para forzar interpretación como UTC
                            const fechaProgramada = parsearFechaUTC(orden.cita.fecha_programada);
                            const puedeIniciar = fechaActual >= fechaProgramada;
                            
                            // Formatear fecha y hora en zona horaria de Venezuela usando función helper
                            // Usar formato numérico simple (DD/MM/YYYY) para evitar que incluya hora
                            const fecha = parsearFechaUTC(orden.cita.fecha_programada);
                            const fechaFormateada = fecha.toLocaleDateString('es-VE', {
                              timeZone: 'America/Caracas',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            });
                            const horaFormateada = formatearHoraVenezuela(orden.cita.fecha_programada);
                            
                            if (!puedeIniciar) {
                              return (
                                <Alert className="bg-amber-50 border-amber-200">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <AlertDescription className="text-amber-800">
                                    <p className="font-semibold mb-2">Esta cita aún no está disponible para ejecución.</p>
                                    <p>La fecha programada es el <strong>{fechaFormateada} a las {horaFormateada}</strong>.</p>
                                    <p className="mt-2 text-sm">Debes esperar hasta la fecha programada para iniciar el trabajo.</p>
                                  </AlertDescription>
                                </Alert>
                              );
                            }
                            
                            return (
                              <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                  <p className="font-semibold">Cita programada: {fechaFormateada} a las {horaFormateada}</p>
                                  <p className="text-sm mt-1">Puedes iniciar el trabajo ahora.</p>
                                </AlertDescription>
                              </Alert>
                            );
                          })()}
                          
                          {/* Mostrar alerta si la cita está pendiente de confirmación del cliente */}
                          {orden.cita && (orden.cita.estado_cita === 'Programada' || orden.cita.estado_cita === 'Propuesta' || orden.cita.estado_cita === 'Pendiente de Confirmación') && (
                            <Alert className="bg-amber-50 border-amber-200">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-800">
                                <p className="font-semibold">Cita pendiente de confirmación del cliente</p>
                                <p className="text-sm mt-1">El cliente aún no ha confirmado esta cita. Espera a que el cliente confirme la fecha antes de proceder.</p>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Mostrar alerta si la cita está confirmada pero la fecha aún no ha llegado */}
                          {orden.cita && orden.cita.estado_cita === 'Confirmada' && (() => {
                            const fechaActual = new Date();
                            const fechaProgramada = parsearFechaUTC(orden.cita.fecha_programada);
                            const puedeIniciar = fechaActual >= fechaProgramada;
                            
                            if (!puedeIniciar) {
                              const fechaFormateada = fechaProgramada.toLocaleDateString('es-VE', {
                                timeZone: 'America/Caracas',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              });
                              const horaFormateada = formatearHoraVenezuela(orden.cita.fecha_programada);
                              
                              return (
                                <Alert className="bg-amber-50 border-amber-200">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <AlertDescription className="text-amber-800">
                                    <p className="font-semibold">Cita confirmada por el cliente</p>
                                    <p className="text-sm mt-1">La fecha programada aún no ha llegado. La cita es el <strong>{fechaFormateada} a las {horaFormateada}</strong>. Podrás iniciar el trabajo cuando llegue la fecha.</p>
                                  </AlertDescription>
                                </Alert>
                              );
                            }
                            
                            return (
                              <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                  <p className="font-semibold">Cita confirmada por el cliente</p>
                                  <p className="text-sm mt-1">El cliente ha confirmado la cita y la fecha ya llegó. Puedes iniciar el trabajo ahora.</p>
                                </AlertDescription>
                              </Alert>
                            );
                          })()}
                          
                          {/* Mostrar botón de iniciar trabajo */}
                          <div className="text-center py-4">
                            <p className="text-muted-foreground mb-4">
                              {orden.ejecucion 
                                ? 'El trabajo ya ha sido iniciado' 
                                : (orden.cita?.estado_cita === 'Programada' || orden.cita?.estado_cita === 'Propuesta' || orden.cita?.estado_cita === 'Pendiente de Confirmación')
                                ? 'Esperando confirmación del cliente'
                                : orden.cita?.estado_cita === 'Confirmada' && (() => {
                                    const fechaActual = new Date();
                                    const fechaProgramada = parsearFechaUTC(orden.cita.fecha_programada);
                                    return fechaActual < fechaProgramada;
                                  })()
                                ? 'Esperando a que llegue la fecha programada'
                                : 'El trabajo aún no ha sido iniciado'}
                            </p>
                            <Button 
                              onClick={() => iniciarTrabajo(orden)}
                              disabled={
                                procesando[orden.id_orden] || 
                                (orden.cita && (
                                  (orden.cita.estado_cita === 'Programada' || orden.cita.estado_cita === 'Propuesta' || orden.cita.estado_cita === 'Pendiente de Confirmación') ||
                                  (orden.cita.estado_cita === 'Confirmada' && (() => {
                                    const fechaActual = new Date();
                                    const fechaProgramada = parsearFechaUTC(orden.cita.fecha_programada);
                                    return fechaActual < fechaProgramada;
                                  })())
                                ))
                              }
                              size="lg"
                            >
                              {procesando[orden.id_orden] ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Iniciando...
                                </>
                              ) : (
                                <>
                <Play className="mr-2 h-4 w-4" />
                                  Iniciar Trabajo
                                </>
                              )}
              </Button>
                          </div>
                        </div>
                      ) : orden.ejecucion.fecha_fin ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Trabajo completado el {formatearFechaVenezuela(orden.ejecucion.fecha_fin)}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              <p className="font-semibold mb-2">Trabajo en curso</p>
                              <p className="text-sm">El trabajo ha sido iniciado. Puedes documentar el servicio en la pestaña "Documentar" y luego finalizar el trabajo.</p>
                            </AlertDescription>
                          </Alert>
                          <Button 
                            className="w-full" 
                            onClick={() => finalizarTrabajo(orden)}
                            disabled={procesando[orden.id_orden]}
                          >
                            {procesando[orden.id_orden] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finalizando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Finalizar Trabajo
                              </>
                            )}
              </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 2: Documentar */}
                    <TabsContent value="documentar" className="space-y-4 mt-4">
                      {!orden.ejecucion ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Debes iniciar el trabajo antes de documentarlo.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Resumen del Trabajo *</Label>
                            <Textarea
                              placeholder="Describe brevemente el trabajo realizado, acciones tomadas, materiales usados, etc."
                              value={trabajoRealizado[orden.id_orden] || ''}
                              onChange={(e) => setTrabajoRealizado(prev => ({ ...prev, [orden.id_orden]: e.target.value }))}
                              rows={4}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Repuestos Utilizados</Label>
                            <Textarea
                              placeholder="Lista de repuestos y materiales usados..."
                              value={repuestosUtilizados[orden.id_orden] || ''}
                              onChange={(e) => setRepuestosUtilizados(prev => ({ ...prev, [orden.id_orden]: e.target.value }))}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Recomendaciones</Label>
                            <Textarea
                              placeholder="Sugerencias para el cliente..."
                              value={recomendaciones[orden.id_orden] || ''}
                              onChange={(e) => setRecomendaciones(prev => ({ ...prev, [orden.id_orden]: e.target.value }))}
                              rows={3}
                            />
                          </div>

                          {/* Subida de imágenes */}
                          <div className="space-y-2">
                            <Label>Fotografías del Trabajo</Label>
                            <div className="border-2 border-dashed rounded-lg p-6">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImagenesChange(orden.id_orden, e.target.files)}
                                className="hidden"
                                id={`imagenes-${orden.id_orden}`}
                                disabled={subiendoImagenes[orden.id_orden]}
                              />
                              <label
                                htmlFor={`imagenes-${orden.id_orden}`}
                                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                              >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center">
                                  Haz clic para subir imágenes (máximo 10)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG hasta 10MB cada una
                                </p>
                              </label>
                            </div>

                            {/* Previews de imágenes */}
                            {imagenesPreview[orden.id_orden] && imagenesPreview[orden.id_orden].length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imagenesPreview[orden.id_orden].map((preview, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => eliminarImagen(orden.id_orden, index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {imagenes[orden.id_orden] && imagenes[orden.id_orden].length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {imagenes[orden.id_orden].length} imagen(es) seleccionada(s)
                              </p>
                            )}
                          </div>

                          <Button 
                            className="w-full" 
                            onClick={() => guardarDocumentacion(orden)}
                            disabled={guardandoDocumentacion[orden.id_orden] || subiendoImagenes[orden.id_orden] || !trabajoRealizado[orden.id_orden]?.trim()}
                          >
                            {guardandoDocumentacion[orden.id_orden] || subiendoImagenes[orden.id_orden] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                  <FileText className="mr-2 h-4 w-4" />
                                Guardar Documentación
                              </>
                            )}
              </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 3: Reportar Impedimentos */}
                    <TabsContent value="impedimentos" className="space-y-4 mt-4">
                      {/* Lista de impedimentos existentes */}
                      {orden.impedimentos && orden.impedimentos.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <Label>Impedimentos Reportados</Label>
                          {orden.impedimentos.map((impedimento) => (
                            <Alert key={impedimento.id_impedimento} variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <p className="font-semibold">{impedimento.tipo_impedimento}</p>
                                <p className="text-sm mt-1">{impedimento.descripcion}</p>
                                <Badge className="mt-2" variant={impedimento.estado_resolucion === 'Resuelto' ? 'default' : 'destructive'}>
                                  {impedimento.estado_resolucion}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Reportado: {formatearFechaVenezuela(impedimento.fecha_reporte)}
                                </p>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}

                      {/* Formulario para reportar nuevo impedimento */}
                      <div className="space-y-4 border-t pt-4">
                        <Label>Reportar Nuevo Impedimento</Label>
                        
                        <div className="space-y-2">
                          <Label>Tipo de Impedimento *</Label>
                          <Select
                            value={tipoImpedimento[orden.id_orden] || ''}
                            onValueChange={(value) => setTipoImpedimento(prev => ({ ...prev, [orden.id_orden]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Falta de repuestos">Falta de repuestos</SelectItem>
                              <SelectItem value="Cliente no disponible">Cliente no disponible</SelectItem>
                              <SelectItem value="Problemas de acceso">Problemas de acceso</SelectItem>
                              <SelectItem value="Falta de herramientas">Falta de herramientas</SelectItem>
                              <SelectItem value="Problema técnico complejo">Problema técnico complejo</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Descripción del Problema *</Label>
                          <Textarea
                            placeholder="Describe detalladamente el impedimento encontrado..."
                            value={descripcionImpedimento[orden.id_orden] || ''}
                            onChange={(e) => setDescripcionImpedimento(prev => ({ ...prev, [orden.id_orden]: e.target.value }))}
                            rows={4}
                          />
                        </div>

                        <Button 
                          variant="destructive"
                          className="w-full"
                          onClick={() => reportarImpedimento(orden)}
                          disabled={reportandoImpedimento[orden.id_orden] || !tipoImpedimento[orden.id_orden] || !descripcionImpedimento[orden.id_orden]?.trim()}
                        >
                          {reportandoImpedimento[orden.id_orden] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Reportando...
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Reportar Impedimento
                            </>
                          )}
              </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
            </CardContent>
          </Card>
            ))}
        </div>
        )}
      </div>
    </Layout>
  );
}
