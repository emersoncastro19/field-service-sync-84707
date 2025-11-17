import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Label } from "@/frontend/components/ui/label";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { User, Mail, Phone, MapPin, CreditCard, Building2, Hash, Shield, Key, Edit2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import bcrypt from 'bcryptjs';

interface PerfilData {
  // Usuario
  usuario_id: number;
  username: string;
  email: string;
  telefono: string;
  nombre_completo: string;
  // Cliente
  cliente_id: number;
  tipo_identificacion: string;
  identificacion: string;
  direccion_principal: string;
  direccion_servicio: string;
  referencias_ubicacion: string;
  tipo_cliente: string;
  estado_cuenta: string;
}

export default function Perfil() {
  const { usuario, setUsuario } = useAuth();
  const { success, error } = useToast();
  
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingService, setEditingService] = useState(false);
  
  // Formularios
  const [formIdentity, setFormIdentity] = useState({
    nombre_completo: '',
    email: '',
    telefono: ''
  });

  const [formService, setFormService] = useState({
    direccion_principal: '',
    direccion_servicio: '',
    referencias_ubicacion: ''
  });

  const [formPassword, setFormPassword] = useState({
    contraseña_actual: '',
    nueva_contraseña: '',
    confirmar_contraseña: ''
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, [usuario]);

  const cargarPerfil = async () => {
    if (!usuario) return;

    try {
      setCargando(true);

      // Convertir id_usuario a número si es necesario
      const idUsuario = typeof usuario.id_usuario === 'string' 
        ? parseInt(usuario.id_usuario, 10) 
        : usuario.id_usuario;

      // Obtener datos del usuario y cliente
      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select(`
          id_usuario,
          username,
          email,
          telefono,
          nombre_completo,
          clientes (
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
        .eq('id_usuario', idUsuario)
        .single();

      if (queryError) throw queryError;

      const clienteData = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;

      const perfilData: PerfilData = {
        usuario_id: data.id_usuario,
        username: data.username,
        email: data.email,
        telefono: data.telefono || '',
        nombre_completo: data.nombre_completo,
        cliente_id: clienteData.id_cliente,
        tipo_identificacion: clienteData.tipo_identificacion,
        identificacion: clienteData.identificacion,
        direccion_principal: clienteData.direccion_principal,
        direccion_servicio: clienteData.direccion_servicio,
        referencias_ubicacion: clienteData.referencias_ubicacion || '',
        tipo_cliente: clienteData.tipo_cliente,
        estado_cuenta: clienteData.estado_cuenta,
      };

      setPerfil(perfilData);
      
      // Inicializar formularios
      setFormIdentity({
        nombre_completo: perfilData.nombre_completo,
        email: perfilData.email,
        telefono: perfilData.telefono
      });

      setFormService({
        direccion_principal: perfilData.direccion_principal,
        direccion_servicio: perfilData.direccion_servicio,
        referencias_ubicacion: perfilData.referencias_ubicacion
      });

    } catch (err: any) {
      console.error('Error cargando perfil:', err);
      error('Error', 'No se pudo cargar la información del perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil) return;

    setGuardando(true);
    try {
      // Actualizar usuario
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nombre_completo: formIdentity.nombre_completo,
          email: formIdentity.email,
          telefono: formIdentity.telefono
        })
        .eq('id_usuario', perfil.usuario_id);

      if (updateError) throw updateError;

      // Actualizar estado local
      setPerfil({
        ...perfil,
        nombre_completo: formIdentity.nombre_completo,
        email: formIdentity.email,
        telefono: formIdentity.telefono
      });

      // Actualizar contexto de auth
      if (usuario) {
        setUsuario({
          ...usuario,
          nombre_completo: formIdentity.nombre_completo,
          email: formIdentity.email,
          telefono: formIdentity.telefono
        });
      }

      setEditingIdentity(false);
      success('Cambios guardados', 'Tu información personal ha sido actualizada');
    } catch (err: any) {
      console.error('Error guardando:', err);
      error('Error', 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil) return;

    setGuardando(true);
    try {
      // Actualizar cliente
      const { error: updateError } = await supabase
        .from('clientes')
        .update({
          direccion_principal: formService.direccion_principal,
          direccion_servicio: formService.direccion_servicio,
          referencias_ubicacion: formService.referencias_ubicacion
        })
        .eq('id_cliente', perfil.cliente_id);

      if (updateError) throw updateError;

      // Actualizar estado local
      setPerfil({
        ...perfil,
        direccion_principal: formService.direccion_principal,
        direccion_servicio: formService.direccion_servicio,
        referencias_ubicacion: formService.referencias_ubicacion
      });

      setEditingService(false);
      success('Cambios guardados', 'Tu información de servicio ha sido actualizada');
    } catch (err: any) {
      console.error('Error guardando:', err);
      error('Error', 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil) return;

    // Validaciones
    if (!formPassword.contraseña_actual || !formPassword.nueva_contraseña || !formPassword.confirmar_contraseña) {
      error('Campos requeridos', 'Por favor completa todos los campos');
      return;
    }

    if (formPassword.nueva_contraseña.length < 6) {
      error('Contraseña débil', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formPassword.nueva_contraseña !== formPassword.confirmar_contraseña) {
      error('Contraseñas no coinciden', 'Las contraseñas nuevas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      // Obtener contraseña actual de la BD
      const { data: userData, error: fetchError } = await supabase
        .from('usuarios')
        .select('contraseña')
        .eq('id_usuario', perfil.usuario_id)
        .single();

      if (fetchError) throw fetchError;

      // Verificar contraseña actual
      const esValida = await bcrypt.compare(formPassword.contraseña_actual, (userData as any).contraseña);
      
      if (!esValida) {
        error('Contraseña incorrecta', 'La contraseña actual no es correcta');
        setGuardando(false);
        return;
      }

      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(formPassword.nueva_contraseña, salt);

      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ contraseña: hashedPassword })
        .eq('id_usuario', perfil.usuario_id);

      if (updateError) throw updateError;

      // Limpiar formulario y cerrar dialog
      setFormPassword({
        contraseña_actual: '',
        nueva_contraseña: '',
        confirmar_contraseña: ''
      });
      setDialogOpen(false);
      success('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente');
    } catch (err: any) {
      console.error('Error cambiando contraseña:', err);
      error('Error', 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout role="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!perfil) {
    return (
      <Layout role="client">
        <Alert variant="destructive">
          <AlertDescription>No se pudo cargar la información del perfil</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout role="client">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Información personal, seguridad y de servicio</p>
        </div>

        {/* Identidad y Contacto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Identidad y Contacto
                </CardTitle>
                <CardDescription>Datos personales y de contacto</CardDescription>
              </div>
              {!editingIdentity && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingIdentity(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSaveIdentity}>
              <div className="space-y-2">
                <Label htmlFor="full-name">Nombre Completo</Label>
                <Input 
                  id="full-name" 
                  value={formIdentity.nombre_completo}
                  onChange={(e) => setFormIdentity({...formIdentity, nombre_completo: e.target.value})}
                  disabled={!editingIdentity}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formIdentity.email}
                  onChange={(e) => setFormIdentity({...formIdentity, email: e.target.value})}
                  disabled={!editingIdentity}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={formIdentity.telefono}
                  onChange={(e) => setFormIdentity({...formIdentity, telefono: e.target.value})}
                  disabled={!editingIdentity}
                  placeholder="0424-1234567"
                />
              </div>

              {editingIdentity && (
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingIdentity(false);
                      setFormIdentity({
                        nombre_completo: perfil.nombre_completo,
                        email: perfil.email,
                        telefono: perfil.telefono
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Identificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Identificación
            </CardTitle>
            <CardDescription>Información de identificación (solo lectura)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input id="username" value={perfil.username} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id-type">Tipo de Identificación</Label>
                <Input id="id-type" value={perfil.tipo_identificacion} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id-number" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Número de Identificación
                </Label>
                <Input id="id-number" value={perfil.identificacion} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Gestión de contraseña y acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Cambiar Contraseña
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleChangePassword}>
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                      Introduce tu contraseña actual y la nueva contraseña que deseas establecer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Contraseña Actual *</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        value={formPassword.contraseña_actual}
                        onChange={(e) => setFormPassword({...formPassword, contraseña_actual: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva Contraseña * (mínimo 6 caracteres)</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={formPassword.nueva_contraseña}
                        onChange={(e) => setFormPassword({...formPassword, nueva_contraseña: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nueva Contraseña *</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={formPassword.confirmar_contraseña}
                        onChange={(e) => setFormPassword({...formPassword, confirmar_contraseña: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={guardando}>
                      {guardando ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Información de Servicio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información de Servicio
                </CardTitle>
                <CardDescription>Datos relacionados con el servicio</CardDescription>
              </div>
              {!editingService && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingService(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSaveService}>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección Principal
                </Label>
                <Textarea 
                  id="address" 
                  value={formService.direccion_principal}
                  onChange={(e) => setFormService({...formService, direccion_principal: e.target.value})}
                  disabled={!editingService}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-address">Dirección de Servicio</Label>
                <Textarea 
                  id="service-address" 
                  value={formService.direccion_servicio}
                  onChange={(e) => setFormService({...formService, direccion_servicio: e.target.value})}
                  disabled={!editingService}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">Referencias de Ubicación</Label>
                <Textarea 
                  id="references" 
                  value={formService.referencias_ubicacion}
                  onChange={(e) => setFormService({...formService, referencias_ubicacion: e.target.value})}
                  disabled={!editingService}
                  placeholder="Puntos de referencia, indicaciones, etc."
                  rows={2}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-type">Tipo de Cliente</Label>
                  <Input id="client-type" value={perfil.tipo_cliente} disabled />
                </div>
                <div className="space-y-2">
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-status">Estado de la Cuenta</Label>
                <div className="flex items-center gap-2">
                  <Input id="account-status" value={perfil.estado_cuenta} disabled className="flex-1" />
                  {perfil.estado_cuenta === 'Activo' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {editingService && (
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingService(false);
                      setFormService({
                        direccion_principal: perfil.direccion_principal,
                        direccion_servicio: perfil.direccion_servicio,
                        referencias_ubicacion: perfil.referencias_ubicacion
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
