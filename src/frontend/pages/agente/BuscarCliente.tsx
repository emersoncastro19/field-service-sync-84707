import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Search, User, Phone, Mail, MapPin, FileText, Badge as BadgeIcon, Calendar, Building2, CheckCircle2, XCircle, Eye, Plus, Hash, CreditCard } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Separator } from "@/frontend/components/ui/separator";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { useNavigate } from "react-router-dom";

interface ClienteResultado {
  id_cliente: number;
  tipo_identificacion: string;
  identificacion: string;
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
    username: string;
  };
  ordenes_count?: number;
  ordenes_activas?: number;
}

export default function BuscarCliente() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteResultado | null>(null);
  const [ordenesCliente, setOrdenesCliente] = useState<any[]>([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);

  const buscarClientes = async () => {
    if (!searchTerm.trim()) {
      error('Error', 'Por favor ingresa un término de búsqueda');
      return;
    }

    setBuscando(true);
    setResultados([]);
    setClienteSeleccionado(null);
    setOrdenesCliente([]);

    try {
      const terminoBusqueda = searchTerm.trim();

      // Estrategia: Buscar primero en usuarios y luego obtener clientes asociados
      // También buscar directamente en clientes por identificación
      
      // 1. Buscar usuarios que coincidan con nombre, email, teléfono o username
      // Filtrar solo usuarios que tienen un registro en clientes
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select(`
          id_usuario,
          nombre_completo,
          email,
          telefono,
          username,
          clientes!inner (
            id_cliente,
            tipo_identificacion,
            identificacion,
            direccion_principal,
            direccion_servicio,
            referencias_ubicacion,
            tipo_cliente,
            estado_cuenta
          )
        `)
        .or(`nombre_completo.ilike.%${terminoBusqueda}%,email.ilike.%${terminoBusqueda}%,telefono.ilike.%${terminoBusqueda}%,username.ilike.%${terminoBusqueda}%`)
        .limit(20);

      if (usuariosError) {
        console.error('Error buscando usuarios:', usuariosError);
        // Continuar con búsqueda por identificación
      } else {
        console.log('✅ Usuarios encontrados:', usuariosData?.length || 0, usuariosData);
      }

      // 2. Buscar clientes por identificación
      const { data: clientesPorIdentificacion, error: clientesIdError } = await supabase
        .from('clientes')
        .select(`
          id_cliente,
          tipo_identificacion,
          identificacion,
          direccion_principal,
          direccion_servicio,
          referencias_ubicacion,
          tipo_cliente,
          estado_cuenta,
          usuarios!inner (
            id_usuario,
            nombre_completo,
            email,
            telefono,
            username
          )
        `)
        .ilike('identificacion', `%${terminoBusqueda}%`)
        .limit(20);

      if (clientesIdError) {
        console.error('Error buscando clientes por identificación:', clientesIdError);
      } else {
        console.log('✅ Clientess por identificación encontrados:', clientesPorIdentificacion?.length || 0, clientesPorIdentificacion);
      }

      // 3. Combinar resultados
      const clientesEncontrados: any[] = [];
      const idsClientesVistos = new Set<number>();

      // Agregar clientes encontrados por usuarios
      if (usuariosData && Array.isArray(usuariosData)) {
        usuariosData.forEach((usuario: any) => {
          if (usuario && usuario.clientes) {
            const clientes = Array.isArray(usuario.clientes) ? usuario.clientes : [usuario.clientes];
            clientes.forEach((cliente: any) => {
              if (cliente && cliente.id_cliente && !idsClientesVistos.has(cliente.id_cliente)) {
                idsClientesVistos.add(cliente.id_cliente);
                const clienteFormateado = {
                  ...cliente,
                  usuario: {
                    id_usuario: usuario.id_usuario,
                    nombre_completo: usuario.nombre_completo || 'Sin nombre',
                    email: usuario.email || '',
                    telefono: usuario.telefono || null,
                    username: usuario.username || ''
                  }
                };
                console.log('📋 Cliente agregado desde usuarios:', clienteFormateado);
                clientesEncontrados.push(clienteFormateado);
              }
            });
          } else {
            console.warn('⚠️ Usuario sin clientes:', usuario);
          }
        });
      } else {
        console.log('⚠️ usuariosData no es un array válido:', usuariosData);
      }
      
      console.log('📊 Total clientes encontrados después de usuarios:', clientesEncontrados.length);

      // Agregar clientes encontrados por identificación
      if (clientesPorIdentificacion && Array.isArray(clientesPorIdentificacion)) {
        clientesPorIdentificacion.forEach((cliente: any) => {
          if (cliente && cliente.id_cliente && !idsClientesVistos.has(cliente.id_cliente)) {
            idsClientesVistos.add(cliente.id_cliente);
            const usuarioData = Array.isArray(cliente.usuarios) ? cliente.usuarios[0] : cliente.usuarios;
            if (usuarioData) {
              const clienteFormateado = {
                ...cliente,
                usuario: {
                  id_usuario: usuarioData.id_usuario,
                  nombre_completo: usuarioData.nombre_completo || 'Sin nombre',
                  email: usuarioData.email || '',
                  telefono: usuarioData.telefono || null,
                  username: usuarioData.username || ''
                }
              };
              console.log('📋 Cliente agregado desde identificación:', clienteFormateado);
              clientesEncontrados.push(clienteFormateado);
            } else {
              console.warn('⚠️ Cliente sin usuario:', cliente);
            }
          }
        });
      }
      
      console.log('📊 Total clientes encontrados después de identificación:', clientesEncontrados.length);

      if (clientesEncontrados.length === 0) {
        error('Sin resultados', 'No se encontraron clientes con ese criterio de búsqueda');
        setBuscando(false);
        return;
      }

      const clientesData = clientesEncontrados;

      // Obtener conteo de órdenes para cada cliente
      const clientesConOrdenes = await Promise.all(
        clientesData.map(async (cliente: any) => {
          if (!cliente || !cliente.id_cliente) {
            return null;
          }

          try {
            // Obtener total de órdenes
            const { count: totalOrdenes } = await supabase
              .from('ordenes_servicio')
              .select('*', { count: 'exact', head: true })
              .eq('id_cliente', cliente.id_cliente);

            // Obtener órdenes activas (no completadas ni canceladas)
            const { count: ordenesActivas } = await supabase
              .from('ordenes_servicio')
              .select('*', { count: 'exact', head: true })
              .eq('id_cliente', cliente.id_cliente)
              .not('estado', 'in', '(Completada,Cancelada)');

            return {
              ...cliente,
              ordenes_count: totalOrdenes || 0,
              ordenes_activas: ordenesActivas || 0
            };
          } catch (err) {
            console.error('Error obteniendo conteo de órdenes para cliente:', cliente.id_cliente, err);
            return {
              ...cliente,
              ordenes_count: 0,
              ordenes_activas: 0
            };
          }
        })
      );

      // Filtrar valores null y asegurar que tengan usuario válido
      const clientesValidos = clientesConOrdenes.filter((c: any) => {
        return c !== null && c.usuario && c.usuario.nombre_completo;
      });
      
      if (clientesValidos.length === 0) {
        error('Sin resultados', 'No se encontraron clientes con ese criterio de búsqueda');
        setBuscando(false);
        return;
      }
      
      if (clientesValidos.length === 1) {
        // Si solo hay un resultado, mostrarlo automáticamente
        verDetallesCliente(clientesValidos[0]);
      } else {
        success('Búsqueda exitosa', `Se encontraron ${clientesValidos.length} cliente(s)`);
      }
      
      setResultados(clientesValidos);

    } catch (err: any) {
      console.error('Error buscando clientes:', err);
      error('Error', 'No se pudieron buscar los clientes. Por favor intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  const verDetallesCliente = async (cliente: ClienteResultado) => {
    setClienteSeleccionado(cliente);
    setCargandoOrdenes(true);
    setOrdenesCliente([]);

    try {
      // Obtener órdenes del cliente
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id_orden,
          numero_orden,
          tipo_servicio,
          estado,
          fecha_solicitud,
          fecha_asignacion,
          fecha_completada,
          descripcion_solicitud,
          direccion_servicio
        `)
        .eq('id_cliente', cliente.id_cliente)
        .order('fecha_solicitud', { ascending: false })
        .limit(10);

      if (ordenesError) throw ordenesError;

      setOrdenesCliente(ordenesData || []);
    } catch (err: any) {
      console.error('Error cargando órdenes del cliente:', err);
      error('Error', 'No se pudieron cargar las órdenes del cliente');
    } finally {
      setCargandoOrdenes(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'Activo') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Inactivo</Badge>;
  };

  const getEstadoOrdenBadge = (estado: string) => {
    const estilos: Record<string, any> = {
      'Creada': { variant: 'secondary' as const, label: 'Creada' },
      'Validada': { variant: 'default' as const, label: 'Validada' },
      'Asignada': { variant: 'default' as const, label: 'Asignada' },
      'En Proceso': { variant: 'default' as const, label: 'En Proceso' },
      'Completada': { variant: 'default' as const, label: 'Completada' },
      'Cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
    };

    const config = estilos[estado] || { variant: 'secondary' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const crearOrdenParaCliente = () => {
    if (!clienteSeleccionado) return;
    // Redirigir a nueva orden con el cliente pre-seleccionado
    navigate(`/agente/nueva-orden?cliente=${clienteSeleccionado.id_cliente}`);
  };

  const verOrden = (idOrden: number) => {
    navigate(`/agente/detalles-orden?id=${idOrden}`);
  };

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buscar Cliente</h1>
          <p className="text-muted-foreground mt-2">
            Busca clientes por nombre, email, teléfono o identificación
          </p>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Búsqueda de Cliente</CardTitle>
            <CardDescription>
              Ingresa el nombre, email, teléfono o número de identificación del cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="Nombre, email, teléfono o identificación..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarClientes()}
                className="flex-1"
              />
              <Button 
                onClick={buscarClientes}
                disabled={buscando || !searchTerm.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados de búsqueda */}
        {resultados.length > 0 && !clienteSeleccionado && (
          <Card>
                <CardHeader>
              <CardTitle>Resultados de Búsqueda ({resultados.length})</CardTitle>
                </CardHeader>
                <CardContent>
          <div className="space-y-4">
                {resultados.map((cliente) => (
                  <Card 
                    key={cliente.id_cliente} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => verDetallesCliente(cliente)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{cliente.usuario?.nombre_completo || 'Cliente sin nombre'}</h3>
                            {getEstadoBadge(cliente.estado_cuenta)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{cliente.usuario?.email || 'Sin email'}</span>
                            </div>
                            {cliente.usuario?.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{cliente.usuario.telefono}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              <span>{cliente.tipo_identificacion}: {cliente.identificacion}</span>
                    </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{cliente.ordenes_count || 0} orden(es) - {cliente.ordenes_activas || 0} activa(s)</span>
                    </div>
                    </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            verDetallesCliente(cliente);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </CardContent>
          </Card>
        )}

        {/* Detalles del cliente seleccionado */}
        {clienteSeleccionado && (
          <div className="space-y-6">
            <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                  <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {clienteSeleccionado.usuario?.nombre_completo || 'Cliente sin nombre'}
                    </CardTitle>
                    <CardDescription>Información completa del cliente</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setClienteSeleccionado(null);
                        setOrdenesCliente([]);
                      }}
                    >
                      Volver
                    </Button>
                    <Button 
                      onClick={crearOrdenParaCliente}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Orden
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre Completo</p>
                      <p className="font-medium">{clienteSeleccionado.usuario?.nombre_completo || 'Sin nombre'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {clienteSeleccionado.usuario?.email || 'Sin email'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {clienteSeleccionado.usuario?.telefono || 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium">{clienteSeleccionado.usuario?.username || 'Sin username'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información de Identificación */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Identificación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Identificación</p>
                      <p className="font-medium">{clienteSeleccionado.tipo_identificacion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Identificación</p>
                      <p className="font-medium">{clienteSeleccionado.identificacion}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información de Servicio */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Información de Servicio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                      <p className="font-medium">{clienteSeleccionado.tipo_cliente}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado de Cuenta</p>
                      <div className="mt-1">
                        {getEstadoBadge(clienteSeleccionado.estado_cuenta)}
                      </div>
                    </div>
                    <div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Órdenes</p>
                      <p className="font-medium">{clienteSeleccionado.ordenes_count || 0} orden(es)</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Direcciones */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direcciones
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Dirección Principal</p>
                      <p className="font-medium bg-muted p-3 rounded-md">
                        {clienteSeleccionado.direccion_principal || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Dirección de Servicio</p>
                      <p className="font-medium bg-muted p-3 rounded-md">
                        {clienteSeleccionado.direccion_servicio || 'No especificada'}
                      </p>
                    </div>
                    {clienteSeleccionado.referencias_ubicacion && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Referencias de Ubicación</p>
                        <p className="font-medium bg-muted p-3 rounded-md">
                          {clienteSeleccionado.referencias_ubicacion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Órdenes del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Órdenes del Cliente
                </CardTitle>
                <CardDescription>
                  Historial de órdenes de servicio ({clienteSeleccionado.ordenes_count || 0} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cargandoOrdenes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Cargando órdenes...</p>
                  </div>
                ) : ordenesCliente.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Este cliente no tiene órdenes registradas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {ordenesCliente.map((orden) => (
                      <Card key={orden.id_orden} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">{orden.numero_orden}</h4>
                                {getEstadoOrdenBadge(orden.estado)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>Tipo:</strong> {orden.tipo_servicio}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Fecha de solicitud:</strong> {formatFecha(orden.fecha_solicitud)}
                              </p>
                              {orden.descripcion_solicitud && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  <strong>Descripción:</strong> {orden.descripcion_solicitud}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => verOrden(orden.id_orden)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Orden
                            </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
                    {clienteSeleccionado.ordenes_count && clienteSeleccionado.ordenes_count > 10 && (
                      <Alert>
                        <AlertDescription>
                          Mostrando las últimas 10 órdenes de {clienteSeleccionado.ordenes_count} total.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensaje cuando no hay búsqueda */}
        {resultados.length === 0 && !buscando && !clienteSeleccionado && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Ingresa un término de búsqueda para encontrar clientes
                </p>
                <p className="text-sm text-muted-foreground">
                  Puedes buscar por nombre, email, teléfono o número de identificación
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
