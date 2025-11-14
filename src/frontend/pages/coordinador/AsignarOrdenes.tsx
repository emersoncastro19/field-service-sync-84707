import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { FileText, User, Wrench, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { crearFechaVenezuelaUTC, verificarHoraVenezuela, formatearFechaVenezuela, formatearSoloFechaVenezuela, formatearHoraVenezuela, parsearFechaUTC } from "@/shared/utils/dateUtils";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  fecha_solicitud: string;
  direccion_servicio: string;
  id_cliente: number;
  cliente: {
    nombre_completo: string;
  };
}

interface Tecnico {
  id_tecnico: number;
  nombre_completo: string;
  telefono: string;
  zona_cobertura: string;
  disponibilidad: string;
  especialidades: string[];
}

export default function AsignarOrdenes() {
  const { usuario } = useAuth();
  const { success, error } = useToast();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [asignando, setAsignando] = useState(false);

  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fechaCita, setFechaCita] = useState("");
  const [horaCita, setHoraCita] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // Cargar órdenes validadas sin técnico asignado
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          direccion_servicio,
          id_cliente,
          clientes!inner (
            usuarios!inner (
              nombre_completo,
              id_usuario
            )
          )
        `)
        .eq('estado', 'Validada')
        .is('id_tecnico_asignado', null)
        .order('fecha_solicitud', { ascending: false });

      if (ordenesError) throw ordenesError;

      // Transformar datos de órdenes
      const ordenesFormateadas = ordenesData.map((orden: any) => ({
        id_orden: orden.id_orden,
        numero_orden: orden.numero_orden,
        tipo_servicio: orden.tipo_servicio,
        estado: orden.estado,
        fecha_solicitud: orden.fecha_solicitud,
        direccion_servicio: orden.direccion_servicio,
        id_cliente: orden.id_cliente,
        cliente: {
          nombre_completo: orden.clientes.usuarios.nombre_completo
        }
      }));

      setOrdenes(ordenesFormateadas);

      // 1. Obtener el ID del coordinador logueado
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('coordinadores_campo')
        .select('id_coordinador, zona_responsabilidad')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (coordinadorError) throw coordinadorError;

      const idCoordinador = coordinadorData?.id_coordinador || null;

      // 2. Cargar técnicos asignados a este coordinador (por id_coordinador_supervisor)
      if (!idCoordinador) {
        // Si no hay id_coordinador, no hay técnicos disponibles para asignar
        console.warn('⚠️ El coordinador no tiene un id_coordinador asignado. No se pueden cargar técnicos.');
        setTecnicos([]);
        setCargando(false);
        error('Error', 'No se encontró el ID del coordinador. Contacta al administrador.');
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
        .eq('disponibilidad', 'Activo')
        .eq('id_coordinador_supervisor', idCoordinador);

      if (tecnicosError) throw tecnicosError;

      // Transformar datos de técnicos
      const tecnicosFormateados = tecnicosData.map((tec: any) => ({
        id_tecnico: tec.id_tecnico,
        nombre_completo: tec.usuarios.nombre_completo,
        telefono: tec.usuarios.telefono || 'No disponible',
        zona_cobertura: tec.zona_cobertura,
        disponibilidad: tec.disponibilidad,
        especialidades: tec.especialidades_tecnicos.map((e: any) => e.especialidad)
      }));

      setTecnicos(tecnicosFormateados);

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      error('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const abrirDialogAsignacion = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    setTecnicoSeleccionado("");
    // Establecer fecha por defecto (mañana) y hora por defecto (10:00 AM)
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    setFechaCita(mañana.toISOString().split('T')[0]);
    setHoraCita("10:00");
    setDialogOpen(true);
  };

  const asignarTecnico = async () => {
    if (!ordenSeleccionada || !tecnicoSeleccionado || !fechaCita || !horaCita) {
      error('Error', 'Debes seleccionar un técnico, fecha y hora para la cita');
      return;
    }

    setAsignando(true);
    try {
      const tecnicoId = parseInt(tecnicoSeleccionado);
      
      // Combinar fecha y hora para crear fecha_programada usando función helper
      // Esta función garantiza que la conversión sea correcta sin importar
      // la zona horaria del navegador del usuario
      const fechaProgramada = crearFechaVenezuelaUTC(fechaCita, horaCita);
      
      // VERIFICACIÓN: Verificar que la hora sea correcta
      const horaIngresada = horaCita; // Formato HH:MM
      const horaCoincide = verificarHoraVenezuela(fechaProgramada, horaIngresada);
      
      console.log('📅 Fecha y hora de cita:', {
        entrada: `${fechaCita} ${horaCita}`,
        fechaProgramada,
        horaIngresada,
        horaCoincide,
        zonaHorariaNavegador: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Si no coincide, mostrar error
      if (!horaCoincide) {
        console.error('⚠️ ERROR: La hora no coincide!', {
          ingresada: horaIngresada,
          fechaProgramada
        });
      }

      // 0. Obtener el ID del coordinador que está asignando
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('coordinadores_campo')
        .select('id_coordinador')
        .eq('id_usuario', idUsuario)
        .maybeSingle();

      if (coordinadorError) {
        console.error('Error obteniendo coordinador:', coordinadorError);
      }

      const idCoordinador = coordinadorData?.id_coordinador || null;

      // 1. Actualizar la orden con el técnico asignado y el coordinador que asignó
      const datosActualizacion: any = {
        id_tecnico_asignado: tecnicoId,
        estado: 'Asignada',
        fecha_asignacion: new Date().toISOString()
      };

      // Agregar id_coordinador_supervisor (el campo que ya existe en la BD)
      if (idCoordinador !== null) {
        // Convertir a bigint si es necesario
        datosActualizacion.id_coordinador_supervisor = idCoordinador;
      }

      const { error: updateError } = await supabase
        .from('ordenes_servicio')
        .update(datosActualizacion)
        .eq('id_orden', ordenSeleccionada.id_orden);

      if (updateError) throw updateError;

      // 2. Crear la cita en estado "Programada" para que el cliente la confirme
      // Usamos "Programada" (10 chars) que está permitido en el constraint CHECK de la BD
      console.log('📤 INSERTANDO CITA EN SUPABASE:', {
        id_orden: ordenSeleccionada.id_orden,
        fecha_programada_STRING: fechaProgramada,
        fecha_programada_TYPE: typeof fechaProgramada,
        fecha_programada_ISO: fechaProgramada,
        estado_cita: 'Programada'
      });
      
      const { data: citaData, error: citaError } = await supabase
        .from('citas')
        .insert([
          {
            id_orden: ordenSeleccionada.id_orden,
            fecha_programada: fechaProgramada,
            estado_cita: 'Programada'
          }
        ])
        .select()
        .single();

      if (citaError) {
        console.error('❌ Error creando cita:', citaError);
        throw new Error('No se pudo crear la cita: ' + citaError.message);
      }
      
      // DEBUG: Verificar qué devolvió Supabase
      console.log('✅ CITA CREADA EN SUPABASE:', {
        citaData,
        fecha_programada_DEVUELTA: citaData?.fecha_programada,
        fecha_programada_TYPE: typeof citaData?.fecha_programada,
        fecha_programada_ISO: citaData?.fecha_programada,
        fecha_programada_DATE: citaData?.fecha_programada ? parsearFechaUTC(citaData.fecha_programada).toISOString() : null,
        fecha_programada_VENEZUELA: citaData?.fecha_programada ? formatearHoraVenezuela(citaData.fecha_programada) : null
      });

      // 3. Obtener IDs de usuario del cliente y técnico para notificaciones
      // Obtener ID del cliente directamente de la tabla clientes
      console.log('🔍 Buscando cliente con id_cliente:', ordenSeleccionada.id_cliente);
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id_usuario, id_cliente')
        .eq('id_cliente', ordenSeleccionada.id_cliente)
        .maybeSingle();

      if (clienteError) {
        console.error('❌ Error obteniendo cliente:', clienteError);
        console.error('❌ Detalles del error:', JSON.stringify(clienteError, null, 2));
      } else {
        console.log('✅ Cliente encontrado:', clienteData);
      }

      // Obtener ID del técnico directamente de la tabla tecnicos
      console.log('🔍 Buscando técnico con id_tecnico:', tecnicoId);
      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id_usuario, id_tecnico')
        .eq('id_tecnico', tecnicoId)
        .maybeSingle();

      if (tecnicoError) {
        console.error('❌ Error obteniendo técnico:', tecnicoError);
        console.error('❌ Detalles del error:', JSON.stringify(tecnicoError, null, 2));
      } else {
        console.log('✅ Técnico encontrado:', tecnicoData);
      }

      // Extraer IDs asegurándonos de que sean números
      let idUsuarioCliente: number | null = null;
      if (clienteData?.id_usuario !== undefined && clienteData.id_usuario !== null) {
        idUsuarioCliente = typeof clienteData.id_usuario === 'string' 
          ? parseInt(clienteData.id_usuario, 10) 
          : Number(clienteData.id_usuario);
        if (isNaN(idUsuarioCliente)) {
          console.error('❌ id_usuario del cliente no es un número válido:', clienteData.id_usuario);
          idUsuarioCliente = null;
        }
      }

      let idUsuarioTecnico: number | null = null;
      if (tecnicoData?.id_usuario !== undefined && tecnicoData.id_usuario !== null) {
        idUsuarioTecnico = typeof tecnicoData.id_usuario === 'string' 
          ? parseInt(tecnicoData.id_usuario, 10) 
          : Number(tecnicoData.id_usuario);
        if (isNaN(idUsuarioTecnico)) {
          console.error('❌ id_usuario del técnico no es un número válido:', tecnicoData.id_usuario);
          idUsuarioTecnico = null;
        }
      }

      console.log('🔔 Datos para notificaciones:', {
        idUsuarioCliente,
        idUsuarioTecnico,
        numeroOrden: ordenSeleccionada.numero_orden,
        idCliente: ordenSeleccionada.id_cliente,
        idTecnico: tecnicoId,
        clienteData,
        tecnicoData,
        fechaProgramada,
        horaCita
      });

      // 4. Crear notificaciones con validación exhaustiva
      const notificaciones = [];
      
      if (!idUsuarioCliente) {
        console.error('❌ No se pudo obtener id_usuario del cliente');
      } else {
        const notifCliente = {
          id_orden: ordenSeleccionada.id_orden,
          id_destinatario: idUsuarioCliente,
          tipo_notificacion: 'Cita Programada',
          canal: 'Sistema_Interno',
          mensaje: `Se ha programado una cita para tu orden ${ordenSeleccionada.numero_orden} el ${formatearSoloFechaVenezuela(fechaProgramada)} a las ${horaCita}. Por favor, confirma si esta fecha te parece bien o solicita una reprogramación.`,
          fecha_enviada: new Date().toISOString(),
          leida: false
        };
        console.log('📝 Notificación para cliente preparada:', notifCliente);
        notificaciones.push(notifCliente);
      }

      if (!idUsuarioTecnico) {
        console.error('❌ No se pudo obtener id_usuario del técnico');
      } else {
        const notifTecnico = {
          id_orden: ordenSeleccionada.id_orden,
          id_destinatario: idUsuarioTecnico,
          tipo_notificacion: 'Asignación de Orden',
          canal: 'Sistema_Interno',
          mensaje: `Se te ha asignado la orden ${ordenSeleccionada.numero_orden}. Cita programada para el ${formatearSoloFechaVenezuela(fechaProgramada)} a las ${horaCita}`,
          fecha_enviada: new Date().toISOString(),
          leida: false
        };
        console.log('📝 Notificación para técnico preparada:', notifTecnico);
        notificaciones.push(notifTecnico);
      }

      // 4. Crear notificaciones - INSERTAR INDIVIDUALMENTE CON VERIFICACIÓN DETALLADA
      if (notificaciones.length > 0) {
        console.log('📤 Preparando', notificaciones.length, 'notificaciones para insertar...');
        
        let notificacionesExitosas = 0;
        let notificacionesFallidas = 0;
        const erroresDetallados: Array<{tipo: string, error: string}> = [];

        // Insertar cada notificación individualmente con verificación exhaustiva
        for (let i = 0; i < notificaciones.length; i++) {
          const notif = notificaciones[i];
          
          console.log(`\n📝 === NOTIFICACIÓN ${i + 1}/${notificaciones.length} ===`);
          console.log('Tipo:', notif.tipo_notificacion);
          console.log('Destinatario:', notif.id_destinatario);
          console.log('Orden:', notif.id_orden);
          console.log('Mensaje (primeros 50 chars):', notif.mensaje.substring(0, 50));
          
          // Validar campos requeridos
          if (!notif.id_destinatario || notif.id_destinatario === null) {
            console.error('❌ ERROR: id_destinatario es null o undefined');
            notificacionesFallidas++;
            erroresDetallados.push({ tipo: notif.tipo_notificacion, error: 'id_destinatario es null' });
            continue;
          }

          if (!notif.tipo_notificacion || notif.tipo_notificacion.trim().length === 0) {
            console.error('❌ ERROR: tipo_notificacion está vacío');
            notificacionesFallidas++;
            erroresDetallados.push({ tipo: 'Desconocido', error: 'tipo_notificacion está vacío' });
            continue;
          }

          if (!notif.mensaje || notif.mensaje.trim().length === 0) {
            console.error('❌ ERROR: mensaje está vacío');
            notificacionesFallidas++;
            erroresDetallados.push({ tipo: notif.tipo_notificacion, error: 'mensaje está vacío' });
            continue;
          }

          // Preparar objeto para inserción (asegurar tipos correctos)
          const notificacionParaInsertar = {
            id_orden: notif.id_orden || null,
            id_destinatario: Number(notif.id_destinatario), // Asegurar que sea número
            tipo_notificacion: String(notif.tipo_notificacion).trim(),
            canal: String(notif.canal || 'Sistema_Interno').trim(),
            mensaje: String(notif.mensaje).trim(),
            fecha_enviada: notif.fecha_enviada || new Date().toISOString(),
            leida: notif.leida !== undefined ? Boolean(notif.leida) : false
          };

          console.log('📤 Objeto a insertar:', JSON.stringify(notificacionParaInsertar, null, 2));

          try {
            const { data: notifData, error: notifError } = await supabase
              .from('notificaciones')
              .insert([notificacionParaInsertar])
              .select();

            if (notifError) {
              console.error(`❌ ERROR insertando notificación ${i + 1}:`, {
                code: notifError.code,
                message: notifError.message,
                details: notifError.details,
                hint: notifError.hint,
                error_completo: JSON.stringify(notifError, null, 2)
              });
              
              notificacionesFallidas++;
              erroresDetallados.push({ 
                tipo: notif.tipo_notificacion, 
                error: `${notifError.code}: ${notifError.message}` 
              });

              // Si es error de permisos RLS, mostrar mensaje específico
              if (notifError.code === 'PGRST116' || notifError.message?.includes('permission') || notifError.message?.includes('RLS') || notifError.message?.includes('policy')) {
                console.error('🔒 ERROR DE PERMISOS RLS DETECTADO');
                console.error('💡 SOLUCIÓN: Verifica las políticas RLS en Supabase para la tabla notificaciones');
                console.error('💡 La política debe permitir INSERT para usuarios autenticados');
              }
            } else {
              console.log(`✅ Notificación ${i + 1} insertada exitosamente:`, notifData);
              notificacionesExitosas++;
            }
          } catch (err: any) {
            console.error(`❌ EXCEPCIÓN al insertar notificación ${i + 1}:`, err);
            console.error('Stack trace:', err.stack);
            notificacionesFallidas++;
            erroresDetallados.push({ 
              tipo: notif.tipo_notificacion, 
              error: `Excepción: ${err.message}` 
            });
          }
        }

        // Resumen final
        console.log(`\n📊 === RESUMEN DE NOTIFICACIONES ===`);
        console.log(`✅ Exitosas: ${notificacionesExitosas}`);
        console.log(`❌ Fallidas: ${notificacionesFallidas}`);
        if (erroresDetallados.length > 0) {
          console.error('❌ Errores detallados:', erroresDetallados);
        }

        // Mostrar mensaje al usuario
        if (notificacionesFallidas > 0 && notificacionesExitosas === 0) {
          error('Error', `No se pudieron crear las notificaciones. ${erroresDetallados.map(e => `${e.tipo}: ${e.error}`).join('; ')}. Revisa la consola para más detalles.`);
        } else if (notificacionesFallidas > 0) {
          console.warn(`⚠️ Se crearon ${notificacionesExitosas} notificaciones, pero ${notificacionesFallidas} fallaron`);
          // No mostrar error al usuario si al menos una se creó exitosamente
        } else {
          console.log(`✅ Todas las ${notificacionesExitosas} notificaciones fueron creadas exitosamente`);
        }
      } else {
        console.warn('⚠️ No se crearon notificaciones - IDs de usuario no encontrados');
        console.warn('⚠️ Detalles del problema:', {
          tieneIdCliente: !!idUsuarioCliente,
          tieneIdTecnico: !!idUsuarioTecnico,
          idUsuarioCliente,
          idUsuarioTecnico,
          clienteData: clienteData ? {
            id_cliente: clienteData.id_cliente,
            id_usuario: clienteData.id_usuario,
            tipo_id_usuario: typeof clienteData.id_usuario
          } : 'NO ENCONTRADO',
          tecnicoData: tecnicoData ? {
            id_tecnico: tecnicoData.id_tecnico,
            id_usuario: tecnicoData.id_usuario,
            tipo_id_usuario: typeof tecnicoData.id_usuario
          } : 'NO ENCONTRADO'
        });
        
        // Mostrar error solo si es crítico (ninguna notificación se pudo crear)
        if (!idUsuarioCliente && !idUsuarioTecnico) {
          error('Advertencia', 'No se pudieron crear las notificaciones automáticas porque no se encontraron los IDs de usuario. La asignación fue exitosa, pero las notificaciones no se enviaron. Verifica la consola para más detalles.');
        }
      }

      // 5. Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario?.id_usuario,
            id_orden: ordenSeleccionada.id_orden,
            accion: 'ASIGNAR_TECNICO',
            descripcion: `Coordinador asignó técnico a orden ${ordenSeleccionada.numero_orden} y programó cita para el ${formatearSoloFechaVenezuela(fechaProgramada)}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('Técnico asignado y cita programada', `Orden ${ordenSeleccionada.numero_orden} asignada exitosamente. Cita programada para el ${formatearSoloFechaVenezuela(fechaProgramada)} a las ${horaCita}`);
      
      // Recargar datos
      await cargarDatos();
      
      // Cerrar dialog
      setDialogOpen(false);
      setOrdenSeleccionada(null);
      setTecnicoSeleccionado("");
      setFechaCita("");
      setHoraCita("");

    } catch (err: any) {
      console.error('Error asignando técnico:', err);
      error('Error', err.message || 'No se pudo asignar el técnico');
    } finally {
      setAsignando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return formatearSoloFechaVenezuela(fecha);
  };


  if (cargando) {
    return (
      <Layout role="coordinator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando órdenes y técnicos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asignar Órdenes</h1>
          <p className="text-muted-foreground mt-2">
            Asigna técnicos a las órdenes de servicio validadas ({ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'} pendientes, {tecnicos.length} técnicos activos disponibles)
          </p>
        </div>

        {/* Lista de Órdenes */}
        {ordenes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay órdenes pendientes de asignación</h3>
                <p className="text-muted-foreground">
                  No hay órdenes pendientes de asignación en este momento.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Alerta informativa cuando hay órdenes */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Hay {ordenes.length} {ordenes.length === 1 ? 'orden que necesita' : 'órdenes que necesitan'} un técnico asignado.
                {tecnicos.length > 0 && ` ${tecnicos.length} técnicos activos disponibles.`}
              </AlertDescription>
            </Alert>

            {/* Grid de Órdenes */}
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
                      Cliente: {orden.cliente.nombre_completo}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="secondary">{orden.estado}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Tipo de Servicio
                    </p>
                    <p className="font-medium">{orden.tipo_servicio}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fecha de Solicitud
                    </p>
                    <p className="font-medium">{formatFecha(orden.fecha_solicitud)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dirección</p>
                    <p className="font-medium text-xs line-clamp-2">{orden.direccion_servicio}</p>
                  </div>
                </div>

                {/* Botón Asignar */}
                <Button 
                  onClick={() => abrirDialogAsignacion(orden)}
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  Asignar Técnico
                </Button>
              </CardContent>
            </Card>
              ))}
            </div>
          </>
        )}

        {/* Dialog de Asignación */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asignar Técnico a Orden</DialogTitle>
              <DialogDescription>
                {ordenSeleccionada && (
                  <>Orden: {ordenSeleccionada.numero_orden} - {ordenSeleccionada.tipo_servicio}</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Información de la Orden */}
              {ordenSeleccionada && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm"><strong>Cliente:</strong> {ordenSeleccionada.cliente.nombre_completo}</p>
                  <p className="text-sm"><strong>Tipo:</strong> {ordenSeleccionada.tipo_servicio}</p>
                </div>
              )}

              {/* Selector de Técnico */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Seleccionar Técnico *
                </Label>
                <Select value={tecnicoSeleccionado} onValueChange={setTecnicoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un técnico disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {tecnicos.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No hay técnicos disponibles en este momento
                      </div>
                    ) : (
                      tecnicos.map((tecnico) => (
                        <SelectItem key={tecnico.id_tecnico} value={tecnico.id_tecnico.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tecnico.nombre_completo}</span>
                            <span className="text-xs text-muted-foreground">
                              {tecnico.zona_cobertura}
                              {tecnico.especialidades.length > 0 && ` | Especialidades: ${tecnico.especialidades.join(', ')}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona un técnico disponible de la lista
                </p>
              </div>

              {/* Fecha y Hora de la Cita */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Fecha de la Cita *
                  </Label>
                  <Input
                    type="date"
                    value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Hora de la Cita *
                  </Label>
                  <Input
                    type="time"
                    value={horaCita}
                    onChange={(e) => setHoraCita(e.target.value)}
                  />
                </div>
              </div>

              {/* Info de Técnicos Disponibles */}
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  {tecnicos.length} técnicos activos disponibles para asignar
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={asignando}
              >
                Cancelar
              </Button>
              <Button
                onClick={asignarTecnico}
                disabled={!tecnicoSeleccionado || !fechaCita || !horaCita || asignando}
              >
                {asignando ? (
                  <>Asignando...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Asignación
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
