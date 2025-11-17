import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Badge } from "@/frontend/components/ui/badge";
import { FileText, MapPin, AlertCircle, CheckCircle2, Home, User, Mail, Phone, ArrowLeft, Search } from "lucide-react";
import { useAuth } from "@/frontend/context/AuthContext";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";
import { obtenerFechaActualVenezuelaUTC } from "@/shared/utils/dateUtils";

interface ClienteData {
  id_cliente: number;
  direccion_principal: string;
  direccion_servicio: string;
  referencias_ubicacion: string | null;
  tipo_cliente: string;
  estado_cuenta: string;
  usuario: {
    id_usuario: number;
    nombre_completo: string;
    email: string;
    telefono: string | null;
  };
}

export default function NuevaOrden() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const { success, error } = useToast();
  
  const idClienteParam = searchParams.get('cliente');
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [usarDireccionPrincipal, setUsarDireccionPrincipal] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_servicio: "",
    descripcion_solicitud: "",
    direccion_servicio: "",
    referencias_ubicacion: ""
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar cliente desde parámetro de URL
  useEffect(() => {
    if (idClienteParam) {
      cargarCliente(parseInt(idClienteParam, 10));
    }
  }, [idClienteParam]);

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

  const cargarCliente = async (idCliente: number) => {
    setCargandoCliente(true);
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select(`
          id_cliente,
          direccion_principal,
          direccion_servicio,
          referencias_ubicacion,
          tipo_cliente,
          estado_cuenta,
          usuarios!inner (
            id_usuario,
            nombre_completo,
            email,
            telefono
          )
        `)
        .eq('id_cliente', idCliente)
        .single();

      if (clienteError) throw clienteError;

      setClienteData({
        ...clienteData,
        usuario: Array.isArray(clienteData.usuarios) ? clienteData.usuarios[0] : clienteData.usuarios
      });
      
      // Establecer dirección por defecto
      setFormData(prev => ({
        ...prev,
        direccion_servicio: clienteData.direccion_servicio || clienteData.direccion_principal
      }));
    } catch (err: any) {
      console.error('Error cargando cliente:', err);
      error('Error', 'No se pudo cargar la información del cliente');
    } finally {
      setCargandoCliente(false);
    }
  };

  const buscarCliente = async () => {
    if (!busquedaCliente.trim()) {
      error('Error', 'Por favor ingresa un término de búsqueda');
      return;
    }

    setCargandoCliente(true);
    try {
      const terminoBusqueda = busquedaCliente.trim();

      // Estrategia: Buscar primero en usuarios y luego obtener clientes asociados
      // También buscar directamente en clientes por identificación
      
      // 1. Buscar usuarios que coincidan con nombre, email o teléfono
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select(`
          id_usuario,
          nombre_completo,
          email,
          telefono,
          clientes (
            id_cliente,
            direccion_principal,
            direccion_servicio,
            referencias_ubicacion,
            tipo_cliente,
            estado_cuenta
          )
        `)
        .or(`nombre_completo.ilike.%${terminoBusqueda}%,email.ilike.%${terminoBusqueda}%,telefono.ilike.%${terminoBusqueda}%`)
        .limit(5);

      if (usuariosError) {
        console.error('Error buscando usuarios:', usuariosError);
      }

      // 2. Buscar clientes por identificación
      const { data: clientesPorIdentificacion, error: clientesIdError } = await supabase
        .from('clientes')
        .select(`
          id_cliente,
          direccion_principal,
          direccion_servicio,
          referencias_ubicacion,
          tipo_cliente,
          estado_cuenta,
          usuarios!inner (
            id_usuario,
            nombre_completo,
            email,
            telefono
          )
        `)
        .ilike('identificacion', `%${terminoBusqueda}%`)
        .limit(5);

      if (clientesIdError) {
        console.error('Error buscando clientes por identificación:', clientesIdError);
      }

      // 3. Combinar resultados
      const clientesEncontrados: any[] = [];
      const idsClientesVistos = new Set<number>();

      // Agregar clientes encontrados por usuarios
      if (usuariosData) {
        usuariosData.forEach((usuario: any) => {
          if (usuario.clientes) {
            const clientes = Array.isArray(usuario.clientes) ? usuario.clientes : [usuario.clientes];
            clientes.forEach((cliente: any) => {
              if (!idsClientesVistos.has(cliente.id_cliente)) {
                idsClientesVistos.add(cliente.id_cliente);
                clientesEncontrados.push({
                  ...cliente,
                  usuario: {
                    id_usuario: usuario.id_usuario,
                    nombre_completo: usuario.nombre_completo,
                    email: usuario.email,
                    telefono: usuario.telefono
                  }
                });
              }
            });
          }
        });
      }

      // Agregar clientes encontrados por identificación
      if (clientesPorIdentificacion) {
        clientesPorIdentificacion.forEach((cliente: any) => {
          if (!idsClientesVistos.has(cliente.id_cliente)) {
            idsClientesVistos.add(cliente.id_cliente);
            clientesEncontrados.push({
              ...cliente,
              usuario: Array.isArray(cliente.usuarios) ? cliente.usuarios[0] : cliente.usuarios
            });
          }
        });
      }

      if (clientesEncontrados.length === 0) {
        error('Sin resultados', 'No se encontraron clientes con ese criterio');
        return;
      }

      const clientesData = clientesEncontrados;

      if (clientesData.length === 1) {
        // Si solo hay un resultado, seleccionarlo automáticamente
        const cliente = clientesData[0];
        setClienteData({
          ...cliente,
          usuario: Array.isArray(cliente.usuarios) ? cliente.usuarios[0] : cliente.usuarios
        });
        setFormData(prev => ({
          ...prev,
          direccion_servicio: cliente.direccion_servicio || cliente.direccion_principal
        }));
        setBusquedaCliente("");
      } else {
        // Si hay múltiples resultados, mostrar mensaje (por ahora seleccionamos el primero)
        const cliente = clientesData[0];
        setClienteData({
          ...cliente,
          usuario: Array.isArray(cliente.usuarios) ? cliente.usuarios[0] : cliente.usuarios
        });
        setFormData(prev => ({
          ...prev,
          direccion_servicio: cliente.direccion_servicio || cliente.direccion_principal
        }));
        success('Cliente seleccionado', `Se seleccionó: ${cliente.usuarios?.nombre_completo || 'Cliente'}`);
        setBusquedaCliente("");
      }
    } catch (err: any) {
      console.error('Error buscando cliente:', err);
      error('Error', 'No se pudo buscar el cliente');
    } finally {
      setCargandoCliente(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!clienteData) {
      nuevosErrores.cliente = "Debes seleccionar un cliente";
    }

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

    if (!clienteData || !usuario) {
      error('Error', 'No se encontraron datos del cliente o usuario');
      return;
    }

    setCargando(true);

    try {
      // Obtener el ID del agente
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      const { data: agenteData, error: agenteError } = await supabase
        .from('agentes_servicio')
        .select('id_agente')
        .eq('id_usuario', idUsuario)
        .single();

      if (agenteError) throw agenteError;

      // Generar número de orden único
      const numeroOrden = generarNumeroOrden();

      // Crear la orden de servicio
      const { data, error: insertError } = await supabase
        .from('ordenes_servicio')
        .insert([
          {
            numero_orden: numeroOrden,
            id_cliente: clienteData.id_cliente,
            id_agente_creador: agenteData.id_agente, // ID del agente que crea la orden
            tipo_servicio: formData.tipo_servicio,
            prioridad: "Media",
            descripcion_solicitud: formData.descripcion_solicitud,
            direccion_servicio: formData.direccion_servicio,
            estado: 'Creada',
            fecha_solicitud: obtenerFechaActualVenezuelaUTC()
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
            id_usuario: usuario.id_usuario,
            id_orden: data.id_orden,
            accion: 'CREAR_ORDEN',
            descripcion: `Agente creó orden ${numeroOrden} para cliente ${clienteData.usuario.nombre_completo} - Tipo: ${formData.tipo_servicio}`,
            timestamp: new Date().toISOString()
          }
        ]);

      success('¡Orden creada exitosamente!', `Número de orden: ${numeroOrden}`);
      
      // Redirigir a validar órdenes después de 2 segundos
      setTimeout(() => {
        navigate('/agente/validar-ordenes');
      }, 2000);

    } catch (err: any) {
      console.error('Error creando orden:', err);
      error('Error al crear la orden', err.message || 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/agente');
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'Activo') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Inactivo</Badge>;
  };

  return (
    <Layout role="agent">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/agente">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Nueva Orden de Servicio</h1>
            <p className="text-muted-foreground mt-2">
              Crea una nueva orden de servicio para un cliente
            </p>
          </div>
        </div>

        {/* Búsqueda/Selección de Cliente */}
        {!clienteData && (
          <Card>
            <CardHeader>
              <CardTitle>Buscar Cliente</CardTitle>
              <CardDescription>
                Busca un cliente por nombre, email, teléfono o identificación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nombre, email, teléfono o identificación..." 
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarCliente()}
                  className="flex-1"
                />
                <Button 
                  onClick={buscarCliente}
                  disabled={cargandoCliente || !busquedaCliente.trim()}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {cargandoCliente ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/agente/buscar')}
                >
                  Ver Todos los Clientes
                </Button>
              </div>
              {errores.cliente && (
                <p className="text-sm text-red-600 mt-2">{errores.cliente}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información del Cliente Seleccionado */}
        {clienteData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Cliente Seleccionado
                  </CardTitle>
                  <CardDescription>Información del cliente</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setClienteData(null);
                    setFormData({
                      tipo_servicio: "",
                      descripcion_solicitud: "",
                      direccion_servicio: "",
                      referencias_ubicacion: ""
                    });
                  }}
                >
                  Cambiar Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">{clienteData.usuario.nombre_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {clienteData.usuario.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {clienteData.usuario.telefono || 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado de Cuenta</p>
                  <div className="mt-1">
                    {getEstadoBadge(clienteData.estado_cuenta)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                  <p className="font-medium">{clienteData.tipo_cliente}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        {clienteData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Detalles del Servicio
                </CardTitle>
                <CardDescription>
                  Proporciona información sobre el servicio a realizar
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
                    placeholder="Describe detalladamente el problema, falla o servicio que necesita el cliente. Incluye cualquier información relevante."
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
                      Usar dirección principal del cliente: <strong>{clienteData.direccion_principal}</strong>
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
                    La orden será creada en estado "Creada" y deberá ser validada antes de asignar un técnico.
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
        )}
      </div>
    </Layout>
  );
}
