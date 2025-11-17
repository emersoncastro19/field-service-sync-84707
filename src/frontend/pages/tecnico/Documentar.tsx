import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Camera, FileText, Upload, Loader2, ArrowLeft, CheckCircle, Pencil, AlertCircle } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";

interface Orden {
  id_orden: number;
  numero_orden: string;
  tipo_servicio: string;
  estado: string;
  descripcion_solicitud: string;
  direccion_servicio: string;
  cliente: {
    nombre_completo: string;
  };
  ejecucion?: {
    id_ejecucion: number;
    trabajo_realizado: string | null;
  };
}

export default function Documentar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { success, error } = useToast();
  
  const idOrden = searchParams.get("id");
  const [orden, setOrden] = useState<Orden | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // Campos de documentación
  const [resumenTrabajo, setResumenTrabajo] = useState("");
  const [equiposUtilizados, setEquiposUtilizados] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [imagenesUrls, setImagenesUrls] = useState<string[]>([]);
  const [trabajoFinalizado, setTrabajoFinalizado] = useState(false);

  useEffect(() => {
    if (!idOrden) {
      error('Error', 'No se especificó el ID de la orden');
      navigate('/tecnico/gestionar-ejecucion');
      return;
    }
    cargarOrden();
  }, [idOrden]);

  const cargarOrden = async () => {
    if (!idOrden || !usuario) return;

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

      // 2. Obtener la orden
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          descripcion_solicitud,
          direccion_servicio,
          clientes!inner (
            usuarios!inner (
              nombre_completo
            )
          )
        `)
        .eq('id_orden', parseInt(idOrden, 10))
        .eq('id_tecnico_asignado', tecnicoData.id_tecnico)
        .single();

      if (ordenError) throw ordenError;

      // 3. Obtener ejecución de servicio (incluir imagenes_urls en caso de que se use JSON)
      const { data: ejecucionData } = await supabase
        .from('ejecuciones_servicio')
        .select('id_ejecucion, trabajo_realizado, fecha_fin, imagenes_urls')
        .eq('id_orden', parseInt(idOrden, 10))
        .single();

      const ordenFormateada: Orden = {
        id_orden: ordenData.id_orden,
        numero_orden: ordenData.numero_orden,
        tipo_servicio: ordenData.tipo_servicio,
        estado: ordenData.estado,
        descripcion_solicitud: ordenData.descripcion_solicitud,
        direccion_servicio: ordenData.direccion_servicio,
        cliente: {
          nombre_completo: (() => {
            const clientes = ordenData.clientes as any;
            if (Array.isArray(clientes?.usuarios)) {
              return clientes?.usuarios[0]?.nombre_completo;
            }
            return clientes?.usuarios?.nombre_completo;
          })() || 'Cliente desconocido'
        },
        ejecucion: ejecucionData ? {
          id_ejecucion: ejecucionData.id_ejecucion,
          trabajo_realizado: ejecucionData.trabajo_realizado
        } : undefined
      };

      setOrden(ordenFormateada);

      // Si ya hay trabajo realizado, cargarlo y parsearlo
      if (ejecucionData?.trabajo_realizado) {
        const trabajo = ejecucionData.trabajo_realizado;
        const partes = trabajo.split('\n\n');
        setResumenTrabajo(partes[0] || '');
        
        partes.forEach((parte: string) => {
          if (parte.startsWith('Equipos Utilizados:')) {
            setEquiposUtilizados(parte.replace('Equipos Utilizados:', '').trim());
          } else if (parte.startsWith('Recomendaciones:')) {
            setRecomendaciones(parte.replace('Recomendaciones:', '').trim());
          }
        });
        
        // Si ya hay documentación o el trabajo fue finalizado (fecha_fin no null), iniciar en modo solo lectura
        const estaFinalizado = ejecucionData.fecha_fin !== null && ejecucionData.fecha_fin !== undefined;
        setTrabajoFinalizado(estaFinalizado);
        setModoEdicion(!estaFinalizado); // Si el trabajo está finalizado, no permitir edición
      } else {
        // Si no hay documentación, permitir edición
        setModoEdicion(true);
      }
      
      // Cargar imágenes de la ejecución si existe
      if (ejecucionData?.id_ejecucion) {
        console.log('🔍 Buscando imágenes para ejecución:', ejecucionData.id_ejecucion);
        
        // Intentar cargar desde tabla imagenes_servicio
        const { data: imagenesData, error: imagenesError } = await supabase
          .from('imagenes_servicio')
          .select('*')
          .eq('id_ejecucion', ejecucionData.id_ejecucion);
        
        if (imagenesError) {
          console.warn('⚠️ Error cargando desde imagenes_servicio:', imagenesError);
        }
        
        if (imagenesData && imagenesData.length > 0) {
          // Guardar URLs de imágenes para mostrar
          const urls = imagenesData.map((img: any) => img.url_imagen);
          setImagenesUrls(urls);
          console.log('✅ Imágenes cargadas desde imagenes_servicio:', urls.length, urls);
        } else if (ejecucionData.imagenes_urls && Array.isArray(ejecucionData.imagenes_urls) && ejecucionData.imagenes_urls.length > 0) {
          // Si no hay tabla imagenes_servicio, intentar desde ejecuciones_servicio (campo JSON)
          setImagenesUrls(ejecucionData.imagenes_urls);
          console.log('✅ Imágenes cargadas desde imagenes_urls (JSON):', ejecucionData.imagenes_urls.length, ejecucionData.imagenes_urls);
        } else {
          console.log('ℹ️ No se encontraron imágenes para esta ejecución');
          setImagenesUrls([]);
        }
      }
    } catch (err: any) {
      console.error('Error cargando orden:', err);
      error('Error', 'No se pudo cargar la información de la orden');
      navigate('/tecnico/gestionar-ejecucion');
    } finally {
      setCargando(false);
    }
  };

  const guardarDocumentacion = async () => {
    if (!orden || !orden.ejecucion) {
      error('Error', 'No se encontró la ejecución de servicio. Primero debes iniciar el trabajo.');
      return;
    }

    if (!resumenTrabajo.trim()) {
      error('Error', 'Debes proporcionar al menos un resumen del trabajo realizado');
      return;
    }

    setGuardando(true);
    try {
      // Combinar toda la documentación en un solo campo trabajo_realizado
      // Si hay repuestos y recomendaciones, los incluimos en el resumen
      let documentacionCompleta = resumenTrabajo.trim();
      
      if (equiposUtilizados.trim()) {
        documentacionCompleta += `\n\nEquipos Utilizados:\n${equiposUtilizados.trim()}`;
      }
      
      if (recomendaciones.trim()) {
        documentacionCompleta += `\n\nRecomendaciones:\n${recomendaciones.trim()}`;
      }

      // Actualizar la ejecución de servicio con la documentación completa
      const { error: updateError } = await supabase
        .from('ejecuciones_servicio')
        .update({
          trabajo_realizado: documentacionCompleta
        })
        .eq('id_ejecucion', orden.ejecucion.id_ejecucion);

      if (updateError) throw updateError;

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
      // Volver a modo solo lectura después de guardar
      setModoEdicion(false);
      // No navegar, permitir que el usuario vea la documentación guardada
    } catch (err: any) {
      console.error('Error guardando documentación:', err);
      error('Error', 'No se pudo guardar la documentación');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout role="technician">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando información de la orden...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orden) {
    return (
      <Layout role="technician">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontró la orden</p>
          <Button asChild>
            <button onClick={() => navigate('/tecnico/gestionar-ejecucion')}>Volver a Gestionar Ejecución</button>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!orden.ejecucion) {
    return (
      <Layout role="technician">
        <div className="max-w-3xl space-y-6">
          <Alert>
            <AlertDescription>
              Debes iniciar el trabajo antes de documentarlo. Ve a "Gestionar Ejecución" e inicia el trabajo primero.
            </AlertDescription>
          </Alert>
          <Button asChild>
            <button onClick={() => navigate('/tecnico/gestionar-ejecucion')}>Volver a Gestionar Ejecución</button>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="technician">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentar Trabajo</h1>
            <p className="text-muted-foreground mt-2">Registra evidencias y notas del servicio</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/tecnico/gestionar-ejecucion')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
            <CardDescription>Orden {orden.numero_orden} - {orden.tipo_servicio}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Cliente:</span> {orden.cliente.nombre_completo}</p>
              <p className="text-sm"><span className="font-medium">Dirección:</span> {orden.direccion_servicio}</p>
              <p className="text-sm"><span className="font-medium">Descripción del servicio:</span> {orden.descripcion_solicitud}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotografías
            </CardTitle>
            <CardDescription>Sube fotos del trabajo realizado (próximamente)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-not-allowed opacity-50">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Funcionalidad de carga de fotos próximamente disponible
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG hasta 10MB cada una
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas del Servicio
            </CardTitle>
            <CardDescription>Describe el trabajo realizado en detalle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!modoEdicion && orden.ejecucion?.trabajo_realizado && !trabajoFinalizado && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModoEdicion(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Documentación
                  </Button>
                </div>
              )}
              {trabajoFinalizado && (
                <Alert className="bg-gray-50 border-gray-200">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-gray-800">
                    Este trabajo ha sido finalizado. La documentación no se puede editar.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="work-summary">Resumen del Trabajo *</Label>
                {modoEdicion ? (
                  <>
                    <Textarea
                      id="work-summary"
                      placeholder="Describe brevemente el trabajo realizado, acciones tomadas, materiales usados, etc."
                      rows={5}
                      value={resumenTrabajo}
                      onChange={(e) => setResumenTrabajo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este campo es requerido. Es el mismo que se usa en "Finalizar Trabajo".
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-50 p-3 rounded border min-h-[125px]">
                    <p className="text-sm whitespace-pre-wrap">{resumenTrabajo || 'No especificado'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parts-used">Equipos Utilizados</Label>
                {modoEdicion ? (
                  <Textarea
                    id="parts-used"
                    placeholder="Lista de equipos y herramientas usadas..."
                    rows={3}
                    value={equiposUtilizados}
                    onChange={(e) => setEquiposUtilizados(e.target.value)}
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded border min-h-[75px]">
                    <p className="text-sm whitespace-pre-wrap">{equiposUtilizados || 'No especificado'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recomendaciones</Label>
                {modoEdicion ? (
                  <Textarea
                    id="recommendations"
                    placeholder="Sugerencias para el cliente..."
                    rows={3}
                    value={recomendaciones}
                    onChange={(e) => setRecomendaciones(e.target.value)}
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded border min-h-[75px]">
                    <p className="text-sm whitespace-pre-wrap">{recomendaciones || 'No especificado'}</p>
                  </div>
                )}
              </div>

              {/* Mostrar imágenes si existen */}
              {imagenesUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Fotografías del Trabajo</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imagenesUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Nota:</strong> El campo "Resumen del Trabajo" es el mismo que aparece en "Gestionar Ejecución" 
                  cuando finalizas un trabajo. Los campos adicionales (Equipos y Recomendaciones) se guardarán 
                  junto con el resumen en la documentación completa.
                </AlertDescription>
              </Alert>

              {modoEdicion && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={guardarDocumentacion}
                    disabled={guardando || !resumenTrabajo.trim()}
                  >
                    {guardando ? (
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
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/tecnico/gestionar-ejecucion')}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
