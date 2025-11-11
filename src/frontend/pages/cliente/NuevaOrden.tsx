import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { FileText, MapPin, AlertCircle, CheckCircle2, Home } from "lucide-react";
import { useAuth } from "@/frontend/context/AuthContext";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";

interface ClienteData {
  id_cliente: number;
  direccion_principal: string;
  direccion_servicio: string;
  referencias_ubicacion: string;
  tipo_cliente: string;
}

export default function NuevaOrden() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { success, error } = useToast();
  
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [usarDireccionPrincipal, setUsarDireccionPrincipal] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_servicio: "",
    descripcion_solicitud: "",
    direccion_servicio: "",
    referencias_ubicacion: ""
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar datos del cliente
  useEffect(() => {
    const cargarDatosCliente = async () => {
      if (!usuario) return;

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id_usuario', typeof usuario.id_usuario === 'string' ? parseInt(usuario.id_usuario, 10) : usuario.id_usuario)
          .single();

        if (error) throw error;
        setClienteData(data);
      } catch (err) {
        console.error('Error cargando datos del cliente:', err);
        error('Error', 'No se pudieron cargar los datos del cliente');
      }
    };

    cargarDatosCliente();
  }, [usuario]);

  // Usar dirección principal
  useEffect(() => {
    if (usarDireccionPrincipal && clienteData) {
      setFormData(prev => ({
        ...prev,
        direccion_servicio: clienteData.direccion_principal,
        referencias_ubicacion: clienteData.referencias_ubicacion || ""
      }));
    }
  }, [usarDireccionPrincipal, clienteData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.tipo_servicio) {
      nuevosErrores.tipo_servicio = "El tipo de servicio es obligatorio";
    }

    if (!formData.descripcion_solicitud.trim()) {
      nuevosErrores.descripcion_solicitud = "La descripción es obligatoria";
    } else if (formData.descripcion_solicitud.trim().length < 20) {
      nuevosErrores.descripcion_solicitud = "La descripción debe tener al menos 20 caracteres";
    }

    if (!formData.direccion_servicio.trim()) {
      nuevosErrores.direccion_servicio = "La dirección de servicio es obligatoria";
    } else if (formData.direccion_servicio.trim().length < 10) {
      nuevosErrores.direccion_servicio = "La dirección debe tener al menos 10 caracteres";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const generarNumeroOrden = (): string => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${año}${mes}${dia}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      error('Error de validación', 'Por favor corrige los campos marcados');
      return;
    }

    if (!clienteData) {
      error('Error', 'No se encontraron datos del cliente');
      return;
    }

    setCargando(true);

    try {
      // Generar número de orden único
      const numeroOrden = generarNumeroOrden();

      // Crear la orden de servicio
      const { data, error: insertError } = await supabase
        .from('ordenes_servicio')
        .insert([
          {
            numero_orden: numeroOrden,
            id_cliente: clienteData.id_cliente,
            id_agente_creador: null, // NULL cuando es creada por el cliente
            tipo_servicio: formData.tipo_servicio,
            prioridad: "Media", // Valor por defecto en la BD (campo interno, no visible en UI)
            descripcion_solicitud: formData.descripcion_solicitud,
            direccion_servicio: formData.direccion_servicio,
            estado: 'Creada',
            fecha_solicitud: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Actualizar referencias de ubicación del cliente si se modificaron
      if (formData.referencias_ubicacion && formData.referencias_ubicacion !== clienteData.referencias_ubicacion) {
        await supabase
          .from('clientes')
          .update({ referencias_ubicacion: formData.referencias_ubicacion })
          .eq('id_cliente', clienteData.id_cliente);
      }

      // Log de auditoría
      await supabase
        .from('logs_auditoria')
        .insert([
          {
            id_usuario: usuario?.id_usuario,
            id_orden: data.id_orden,
            accion: 'CREAR_ORDEN',
            descripcion: `Cliente creó orden ${numeroOrden} - Tipo: ${formData.tipo_servicio}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('¡Orden creada exitosamente!', `Número de orden: ${numeroOrden}`);
      
      // Redirigir a la lista de órdenes después de 2 segundos
      setTimeout(() => {
        navigate('/cliente/ordenes');
      }, 2000);

    } catch (err: any) {
      console.error('Error creando orden:', err);
      error('Error al crear la orden', err.message || 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/cliente/ordenes');
  };

  return (
    <Layout role="client">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Orden de Servicio</h1>
          <p className="text-muted-foreground mt-2">
            Completa el formulario para solicitar un servicio técnico
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalles del Servicio
              </CardTitle>
              <CardDescription>
                Proporciona información sobre el servicio que necesitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Servicio */}
              <div className="space-y-2">
                <Label htmlFor="tipo_servicio" className="required">
                  Tipo de Servicio *
                </Label>
                <Select 
                  value={formData.tipo_servicio} 
                  onValueChange={(value) => handleChange('tipo_servicio', value)}
                >
                  <SelectTrigger id="tipo_servicio" className={errores.tipo_servicio ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona el tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instalación">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Instalación
                      </div>
                    </SelectItem>
                    <SelectItem value="Reparación">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Reparación
                      </div>
                    </SelectItem>
                    <SelectItem value="Cambio_Plan">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Cambio de Plan
                      </div>
                    </SelectItem>
                    <SelectItem value="Retiro">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-600" />
                        Retiro de Servicio
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errores.tipo_servicio && (
                  <p className="text-sm text-red-600">{errores.tipo_servicio}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion_solicitud" className="required">
                  Descripción del Problema o Necesidad *
                </Label>
                <Textarea
                  id="descripcion_solicitud"
                  value={formData.descripcion_solicitud}
                  onChange={(e) => handleChange('descripcion_solicitud', e.target.value)}
                  placeholder="Describe detalladamente el problema, falla o servicio que necesitas. Incluye cualquier información relevante que ayude al técnico."
                  rows={5}
                  className={errores.descripcion_solicitud ? 'border-red-500' : ''}
                />
                {errores.descripcion_solicitud && (
                  <p className="text-sm text-red-600">{errores.descripcion_solicitud}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 20 caracteres. Sé específico para una mejor atención.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ubicación del Servicio
              </CardTitle>
              <CardDescription>
                Indica dónde se debe realizar el servicio técnico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Checkbox para usar dirección principal */}
              {clienteData && (
                <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="usar-direccion-principal"
                    checked={usarDireccionPrincipal}
                    onChange={(e) => setUsarDireccionPrincipal(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="usar-direccion-principal" className="cursor-pointer font-normal">
                    Usar mi dirección principal: <strong>{clienteData.direccion_principal}</strong>
                  </Label>
                </div>
              )}

              {/* Dirección del Servicio */}
              <div className="space-y-2">
                <Label htmlFor="direccion_servicio" className="required">
                  Dirección del Servicio *
                </Label>
                <Textarea
                  id="direccion_servicio"
                  value={formData.direccion_servicio}
                  onChange={(e) => handleChange('direccion_servicio', e.target.value)}
                  placeholder="Calle, número, urbanización, ciudad, estado"
                  rows={3}
                  className={errores.direccion_servicio ? 'border-red-500' : ''}
                />
                {errores.direccion_servicio && (
                  <p className="text-sm text-red-600">{errores.direccion_servicio}</p>
                )}
              </div>

              {/* Referencias de Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="referencias_ubicacion">
                  Referencias de Ubicación (Opcional)
                </Label>
                <Textarea
                  id="referencias_ubicacion"
                  value={formData.referencias_ubicacion}
                  onChange={(e) => handleChange('referencias_ubicacion', e.target.value)}
                  placeholder="Puntos de referencia, indicaciones para llegar, edificio, piso, etc."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Ayuda al técnico a ubicar más fácilmente el lugar del servicio
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <Card>
            <CardContent className="pt-6">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Al crear la orden, un agente de servicio la validará y se asignará un técnico 
                  en un plazo de 24-48 horas. Recibirás notificaciones sobre el estado de tu solicitud.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creando orden...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Crear Orden de Servicio
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancelar}
                  disabled={cargando}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
