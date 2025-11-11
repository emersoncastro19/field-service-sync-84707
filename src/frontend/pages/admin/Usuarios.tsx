import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Users, UserPlus, Shield, Mail, Edit2, Trash2, CheckCircle, XCircle, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { supabase } from "@/backend/config/supabaseClient";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { enviarEmail, generarEmailContraseñaTemporal } from "@/backend/services/emailService";
import bcrypt from 'bcryptjs';

interface UsuarioLista {
  id_usuario: number;
  username: string;
  email: string;
  telefono: string;
  nombre_completo: string;
  tipo_usuario: string;
  estado: string;
}

const roleLabels: Record<string, string> = {
  'Cliente': "Cliente",
  'Agente': "Agente",
  'Coordinador': "Coordinador",
  'Tecnico': "Técnico",
  'Admin': "Administrador",
};

export default function Usuarios() {
  const { usuario } = useAuth();
  const { success, error } = useToast();

  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioLista | null>(null);
  const [editando, setEditando] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [cambiarContraseña, setCambiarContraseña] = useState(false);
  const [mostrarNuevaContraseña, setMostrarNuevaContraseña] = useState(false);
  const [zonaEdicion, setZonaEdicion] = useState(""); // Zona para edición de técnicos/coordinadores

  // Zonas disponibles
  const zonasDisponibles = [
    'Zona Norte',
    'Zona Sur',
    'Zona Este',
    'Zona Oeste',
    'Zona Centro'
  ];

  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: '',
    email: '',
    telefono: '',
    nombre_completo: '',
    tipo_usuario: 'Agente' as 'Agente' | 'Tecnico' | 'Coordinador',
    contraseña_temp: '',
    zona: '' // Zona para técnicos y coordinadores
  });

  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);

      // Ordenar por id_usuario (más confiable que fecha_creacion que puede no existir)
      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select('*')
        .order('id_usuario', { ascending: false });

      if (queryError) {
        console.error('Error en query:', queryError);
        throw queryError;
      }

      console.log('Usuarios cargados:', data?.length || 0);
      setUsuarios(data || []);

      if (!data || data.length === 0) {
        console.warn('No se encontraron usuarios. Verifica las políticas RLS de Supabase.');
      }

    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      error('Error', `No se pudieron cargar los usuarios: ${err.message || 'Error desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  const generarContraseñaTemporal = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contraseña = '';
    for (let i = 0; i < 12; i++) {
      contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contraseña;
  };

  const handleGenerarContraseña = () => {
    const tempPassword = generarContraseñaTemporal();
    setNuevoUsuario({ ...nuevoUsuario, contraseña_temp: tempPassword });
    setMostrarContraseña(true);
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario.username || !nuevoUsuario.email || !nuevoUsuario.nombre_completo || !nuevoUsuario.tipo_usuario) {
      error('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!nuevoUsuario.contraseña_temp) {
      error('Contraseña requerida', 'Debes generar una contraseña temporal para este usuario');
      return;
    }

    // Validar zona para técnicos y coordinadores
    if ((nuevoUsuario.tipo_usuario === 'Tecnico' || nuevoUsuario.tipo_usuario === 'Coordinador') && !nuevoUsuario.zona) {
      error('Zona requerida', `Debes seleccionar una zona para el ${nuevoUsuario.tipo_usuario === 'Tecnico' ? 'técnico' : 'coordinador'}`);
      return;
    }

    setCreando(true);
    try {
      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const contraseñaEncriptada = await bcrypt.hash(
        nuevoUsuario.contraseña_temp || 'temp123', 
        salt
      );

      // 1. Crear usuario (marcar que requiere cambio de contraseña - todos los usuarios creados por admin lo requieren)
      const requiereCambio = true;
      const { data: usuarioCreado, error: usuarioError } = await supabase
        .from('usuarios')
        .insert([
          {
            username: nuevoUsuario.username,
            contraseña: contraseñaEncriptada,
            email: nuevoUsuario.email,
            telefono: nuevoUsuario.telefono || null,
            nombre_completo: nuevoUsuario.nombre_completo,
            tipo_usuario: nuevoUsuario.tipo_usuario,
            estado: 'Activo',
            intentos_fallidos: 0,
            requiere_cambio_contraseña: requiereCambio
          }
        ])
        .select()
        .single();

      if (usuarioError) throw usuarioError;

      // 2. Crear perfil según el tipo
      if (nuevoUsuario.tipo_usuario === 'Agente') {
        await supabase.from('agentes_servicio').insert([{ id_usuario: usuarioCreado.id_usuario }]);
      } else if (nuevoUsuario.tipo_usuario === 'Tecnico') {
        // Buscar el coordinador que tiene la misma zona para asignarlo al técnico
        let idCoordinadorSupervisor = null;
        if (nuevoUsuario.zona) {
          const { data: coordinadorData } = await supabase
            .from('coordinadores_campo')
            .select('id_coordinador')
            .eq('zona_responsabilidad', nuevoUsuario.zona)
            .maybeSingle();
          
          idCoordinadorSupervisor = coordinadorData?.id_coordinador || null;
        }

        await supabase.from('tecnicos').insert([
          {
            id_usuario: usuarioCreado.id_usuario,
            zona_cobertura: nuevoUsuario.zona,
            disponibilidad: 'Activo',
            id_coordinador_supervisor: idCoordinadorSupervisor
          }
        ]);
      } else if (nuevoUsuario.tipo_usuario === 'Coordinador') {
        await supabase.from('coordinadores_campo').insert([
          {
            id_usuario: usuarioCreado.id_usuario,
            zona_responsabilidad: nuevoUsuario.zona
          }
        ]);
      }

      // 3. Enviar email con contraseña temporal
      if (nuevoUsuario.contraseña_temp) {
        try {
          // Generar plantilla de email
          const emailTemplate = generarEmailContraseñaTemporal(
            nuevoUsuario.nombre_completo,
            nuevoUsuario.username,
            nuevoUsuario.contraseña_temp
          );

          // Enviar email
          await enviarEmail({
            ...emailTemplate,
            to: nuevoUsuario.email
          });

          console.log('✅ Email enviado exitosamente a:', nuevoUsuario.email);
        } catch (emailError: any) {
          console.error('⚠️ Error enviando email:', emailError);
          // No fallar la creación si el email falla, pero mostrar advertencia
          // El admin puede ver la contraseña en el mensaje de éxito
          console.warn('⚠️ La cuenta se creó pero el email no se pudo enviar. La contraseña temporal es:', nuevoUsuario.contraseña_temp);
        }
      }

      // 4. Log de auditoría
      await supabase.from('logs_auditoria').insert([
        {
          id_usuario: usuario?.id_usuario,
          accion: 'CREAR_USUARIO',
          descripcion: `Admin creó usuario ${nuevoUsuario.email} - Rol: ${nuevoUsuario.tipo_usuario}`,
          timestamp: new Date().toISOString()
        }
      ]);

      // Mensaje de éxito según si se envió email o no
      let mensajeExito = `Usuario ${nuevoUsuario.email} creado exitosamente.`;
      
      if (requiereCambio && nuevoUsuario.contraseña_temp) {
        // Verificar si el email se envió (verificar en el catch anterior)
        // Por ahora mostramos ambos casos
        mensajeExito += `\n\nContraseña temporal: ${nuevoUsuario.contraseña_temp}`;
        mensajeExito += `\n\nUn email con las credenciales ha sido enviado al usuario.`;
        mensajeExito += `\nSi el email no llegó, comparte esta contraseña manualmente.`;
      }
      
      success('Usuario creado', mensajeExito);
      
      // Recargar lista
      await cargarUsuarios();
      
      // Cerrar dialog y limpiar
      setDialogOpen(false);
      setNuevoUsuario({
        username: '',
        email: '',
        telefono: '',
        nombre_completo: '',
        tipo_usuario: 'Agente',
        contraseña_temp: '',
        zona: ''
      });
      setMostrarContraseña(false);

    } catch (err: any) {
      console.error('Error creando usuario:', err);
      error('Error', 'No se pudo crear el usuario: ' + err.message);
    } finally {
      setCreando(false);
    }
  };

  const toggleEstado = async (idUsuario: number, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ estado: nuevoEstado })
        .eq('id_usuario', idUsuario);

      if (updateError) throw updateError;

      await supabase.from('logs_auditoria').insert([
        {
          id_usuario: usuario?.id_usuario,
          accion: 'CAMBIAR_ESTADO_USUARIO',
          descripcion: `Cambió estado de usuario ${idUsuario} a ${nuevoEstado}`,
          timestamp: new Date().toISOString()
        }
      ]);

      success('Estado actualizado', `Usuario ${nuevoEstado.toLowerCase()}`);
      cargarUsuarios();

    } catch (err: any) {
      error('Error', 'No se pudo cambiar el estado del usuario');
    }
  };

  const abrirEditar = async (user: UsuarioLista) => {
    setCargandoUsuario(true);
    setEditDialogOpen(true);
    try {
      // Cargar datos completos del usuario desde la base de datos
      const { data: usuarioCompleto, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', user.id_usuario)
        .single();

      if (usuarioError) throw usuarioError;

      // Establecer los datos del usuario
      setUsuarioEditando({
        id_usuario: usuarioCompleto.id_usuario,
        username: usuarioCompleto.username || '',
        email: usuarioCompleto.email || '',
        telefono: usuarioCompleto.telefono || '',
        nombre_completo: usuarioCompleto.nombre_completo || '',
        tipo_usuario: usuarioCompleto.tipo_usuario || 'Cliente',
        estado: usuarioCompleto.estado || 'Activo'
      });

      // Cargar zona si es técnico o coordinador
      if (usuarioCompleto.tipo_usuario === 'Tecnico') {
        const { data: tecnicoData } = await supabase
          .from('tecnicos')
          .select('zona_cobertura')
          .eq('id_usuario', user.id_usuario)
          .maybeSingle();
        
        setZonaEdicion(tecnicoData?.zona_cobertura || '');
      } else if (usuarioCompleto.tipo_usuario === 'Coordinador') {
        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('zona_responsabilidad')
          .eq('id_usuario', user.id_usuario)
          .maybeSingle();
        
        setZonaEdicion(coordinadorData?.zona_responsabilidad || '');
      } else {
        setZonaEdicion('');
      }

      // Limpiar campos de contraseña
      setNuevaContraseña("");
      setCambiarContraseña(false);
      setMostrarNuevaContraseña(false);
    } catch (err: any) {
      console.error('Error cargando usuario:', err);
      error('Error', 'No se pudieron cargar los datos del usuario');
      setEditDialogOpen(false);
    } finally {
      setCargandoUsuario(false);
    }
  };

  const guardarEdicion = async () => {
    if (!usuarioEditando) return;

    if (!usuarioEditando.nombre_completo || !usuarioEditando.email || !usuarioEditando.username) {
      error('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar contraseña si se está cambiando
    if (cambiarContraseña && nuevaContraseña.trim().length < 6) {
      error('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar zona para técnicos y coordinadores
    if ((usuarioEditando.tipo_usuario === 'Tecnico' || usuarioEditando.tipo_usuario === 'Coordinador') && !zonaEdicion) {
      error('Zona requerida', `Debes seleccionar una zona para el ${usuarioEditando.tipo_usuario === 'Tecnico' ? 'técnico' : 'coordinador'}`);
      return;
    }

    setEditando(true);
    try {
      // Preparar datos de actualización
      const datosActualizacion: any = {
        username: usuarioEditando.username,
        email: usuarioEditando.email,
        telefono: usuarioEditando.telefono || null,
        nombre_completo: usuarioEditando.nombre_completo,
        tipo_usuario: usuarioEditando.tipo_usuario,
      };

      // Si se está cambiando la contraseña, encriptarla
      if (cambiarContraseña && nuevaContraseña.trim()) {
        const salt = await bcrypt.genSalt(10);
        const contraseñaEncriptada = await bcrypt.hash(nuevaContraseña.trim(), salt);
        datosActualizacion.contraseña = contraseñaEncriptada;
        datosActualizacion.requiere_cambio_contraseña = false; // Ya no requiere cambio
      }

      // Actualizar usuario
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(datosActualizacion)
        .eq('id_usuario', usuarioEditando.id_usuario);

      if (updateError) throw updateError;

      // Actualizar zona si es técnico o coordinador
      if (usuarioEditando.tipo_usuario === 'Tecnico' && zonaEdicion) {
        // Buscar el coordinador que tiene la misma zona para asignarlo al técnico
        let idCoordinadorSupervisor = null;
        const { data: coordinadorData } = await supabase
          .from('coordinadores_campo')
          .select('id_coordinador')
          .eq('zona_responsabilidad', zonaEdicion)
          .maybeSingle();
        
        idCoordinadorSupervisor = coordinadorData?.id_coordinador || null;

        const { error: tecnicoError } = await supabase
          .from('tecnicos')
          .update({ 
            zona_cobertura: zonaEdicion,
            id_coordinador_supervisor: idCoordinadorSupervisor
          })
          .eq('id_usuario', usuarioEditando.id_usuario);
        
        if (tecnicoError) throw tecnicoError;
      } else if (usuarioEditando.tipo_usuario === 'Coordinador' && zonaEdicion) {
        const { error: coordinadorError } = await supabase
          .from('coordinadores_campo')
          .update({ zona_responsabilidad: zonaEdicion })
          .eq('id_usuario', usuarioEditando.id_usuario);
        
        if (coordinadorError) throw coordinadorError;

        // Si el coordinador cambia de zona, actualizar los técnicos de su zona anterior
        // y asignar los técnicos de la nueva zona a este coordinador
        // (Opcional: esto se puede hacer manualmente o con un trigger en la BD)
      }

      // Log de auditoría
      let descripcionLog = `Editó información del usuario ${usuarioEditando.email}`;
      if (cambiarContraseña) {
        descripcionLog += ' y cambió la contraseña';
      }
      if (zonaEdicion && (usuarioEditando.tipo_usuario === 'Tecnico' || usuarioEditando.tipo_usuario === 'Coordinador')) {
        descripcionLog += ` y actualizó la zona a ${zonaEdicion}`;
      }

      await supabase.from('logs_auditoria').insert([
        {
          id_usuario: usuario?.id_usuario,
          accion: 'EDITAR_USUARIO',
          descripcion: descripcionLog,
          timestamp: new Date().toISOString()
        }
      ]);

      success('Usuario actualizado', 'Los cambios se guardaron correctamente');
      await cargarUsuarios();
      setEditDialogOpen(false);
      setUsuarioEditando(null);
      setNuevaContraseña("");
      setCambiarContraseña(false);
      setMostrarNuevaContraseña(false);
      setZonaEdicion("");

    } catch (err: any) {
      console.error('Error actualizando usuario:', err);
      error('Error', 'No se pudo actualizar el usuario: ' + err.message);
    } finally {
      setEditando(false);
    }
  };

  const copiarContraseña = () => {
    if (nuevoUsuario.contraseña_temp) {
      navigator.clipboard.writeText(nuevoUsuario.contraseña_temp);
      success('Copiado', 'Contraseña copiada al portapapeles');
    }
  };

  if (cargando) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando usuarios...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-2">
              Administra usuarios y roles del sistema ({usuarios.length} usuarios)
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea una cuenta para agente, técnico o coordinador
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Solo puedes crear usuarios de tipo: Agente, Técnico o Coordinador.
                    Los clientes se registran desde la página de Registro público.
                  </AlertDescription>
                </Alert>

                {/* Tipo de Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="tipo_usuario">Tipo de Usuario *</Label>
                  <Select
                    value={nuevoUsuario.tipo_usuario}
                    onValueChange={(value: 'Agente' | 'Tecnico' | 'Coordinador') =>
                      setNuevoUsuario({ ...nuevoUsuario, tipo_usuario: value, contraseña_temp: '', zona: '' })
                    }
                  >
                    <SelectTrigger id="tipo_usuario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agente">Agente de Servicio</SelectItem>
                      <SelectItem value="Tecnico">Técnico</SelectItem>
                      <SelectItem value="Coordinador">Coordinador de Campo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Zona (solo para Técnicos y Coordinadores) */}
                {(nuevoUsuario.tipo_usuario === 'Tecnico' || nuevoUsuario.tipo_usuario === 'Coordinador') && (
                  <div className="space-y-2">
                    <Label htmlFor="zona">
                      {nuevoUsuario.tipo_usuario === 'Tecnico' ? 'Zona de Cobertura' : 'Zona de Responsabilidad'} *
                    </Label>
                    <Select
                      value={nuevoUsuario.zona}
                      onValueChange={(value) =>
                        setNuevoUsuario({ ...nuevoUsuario, zona: value })
                      }
                    >
                      <SelectTrigger id="zona">
                        <SelectValue placeholder="Selecciona una zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonasDisponibles.map((zona) => (
                          <SelectItem key={zona} value={zona}>
                            {zona}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {nuevoUsuario.tipo_usuario === 'Tecnico' 
                        ? 'Zona geográfica donde el técnico presta servicios'
                        : 'Zona geográfica de la cual el coordinador es responsable'}
                    </p>
                  </div>
                )}

                {/* Campos Básicos */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                    <Input
                      id="nombre_completo"
                      value={nuevoUsuario.nombre_completo}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre_completo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario *</Label>
                    <Input
                      id="username"
                      value={nuevoUsuario.username}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={nuevoUsuario.telefono}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                    />
                  </div>
                </div>

                {/* Contraseña Temporal */}
                <div className="space-y-2">
                  <Label htmlFor="contraseña_temp">Contraseña Temporal *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="contraseña_temp"
                      type="text"
                      value={nuevoUsuario.contraseña_temp}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerarContraseña}
                      disabled={mostrarContraseña}
                    >
                      {mostrarContraseña ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Generada
                        </>
                      ) : 'Generar'}
                    </Button>
                    {mostrarContraseña && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copiarContraseña}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El usuario deberá cambiar esta contraseña en su primer acceso
                  </p>
                </div>

                {/* Mostrar contraseña generada */}
                {mostrarContraseña && nuevoUsuario.contraseña_temp && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Contraseña generada:</strong> {nuevoUsuario.contraseña_temp}
                      <br />
                      <span className="text-xs">¡Cópiala y compártela con el usuario!</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setNuevoUsuario({
                      username: '',
                      email: '',
                      telefono: '',
                      nombre_completo: '',
                      tipo_usuario: 'Agente',
                      contraseña_temp: '',
                      zona: ''
                    });
                    setMostrarContraseña(false);
                  }}
                  disabled={creando}
                >
                  Cancelar
                </Button>
                <Button onClick={crearUsuario} disabled={creando}>
                  {creando ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Usuarios */}
        <div className="grid gap-4">
          {usuarios.map((user) => (
            <Card key={user.id_usuario}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div>
                      <CardTitle>{user.nombre_completo}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {roleLabels[user.tipo_usuario] || user.tipo_usuario}
                    </Badge>
                    <Badge variant={user.estado === 'Activo' ? 'default' : 'secondary'}>
                      {user.estado === 'Activo' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          {user.estado}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => abrirEditar(user)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEstado(user.id_usuario, user.estado)}
                    className="flex-1"
                  >
                    {user.estado === 'Activo' ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Edición */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario seleccionado
              </DialogDescription>
            </DialogHeader>

            {cargandoUsuario ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando datos del usuario...</p>
                </div>
              </div>
            ) : usuarioEditando ? (
              <div className="space-y-4 py-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Modifica la información del usuario. Los cambios se guardarán al hacer clic en "Guardar Cambios".
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_nombre_completo">Nombre Completo *</Label>
                    <Input
                      id="edit_nombre_completo"
                      value={usuarioEditando.nombre_completo}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre_completo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_username">Nombre de Usuario *</Label>
                    <Input
                      id="edit_username"
                      value={usuarioEditando.username}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Correo Electrónico *</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={usuarioEditando.email}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_telefono">Teléfono</Label>
                    <Input
                      id="edit_telefono"
                      type="tel"
                      value={usuarioEditando.telefono || ''}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_tipo_usuario">Tipo de Usuario *</Label>
                  <Select
                    value={usuarioEditando.tipo_usuario}
                    onValueChange={(value: string) => {
                      setUsuarioEditando({ ...usuarioEditando, tipo_usuario: value as any });
                      // Si cambia el tipo y no es técnico/coordinador, limpiar zona
                      if (value !== 'Tecnico' && value !== 'Coordinador') {
                        setZonaEdicion('');
                      }
                    }}
                  >
                    <SelectTrigger id="edit_tipo_usuario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Agente">Agente de Servicio</SelectItem>
                      <SelectItem value="Tecnico">Técnico</SelectItem>
                      <SelectItem value="Coordinador">Coordinador de Campo</SelectItem>
                      <SelectItem value="Admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Zona (solo para Técnicos y Coordinadores en edición) */}
                {(usuarioEditando.tipo_usuario === 'Tecnico' || usuarioEditando.tipo_usuario === 'Coordinador') && (
                  <div className="space-y-2">
                    <Label htmlFor="edit_zona">
                      {usuarioEditando.tipo_usuario === 'Tecnico' ? 'Zona de Cobertura' : 'Zona de Responsabilidad'} *
                    </Label>
                    <Select
                      value={zonaEdicion}
                      onValueChange={(value) => setZonaEdicion(value)}
                    >
                      <SelectTrigger id="edit_zona">
                        <SelectValue placeholder="Selecciona una zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonasDisponibles.map((zona) => (
                          <SelectItem key={zona} value={zona}>
                            {zona}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {usuarioEditando.tipo_usuario === 'Tecnico' 
                        ? 'Zona geográfica donde el técnico presta servicios'
                        : 'Zona geográfica de la cual el coordinador es responsable'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Badge variant={usuarioEditando.estado === 'Activo' ? 'default' : 'secondary'}>
                    {usuarioEditando.estado}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Para cambiar el estado, usa el botón "Activar/Desactivar" en la lista
                  </p>
                </div>

                {/* Cambiar Contraseña */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cambiar_contraseña"
                      checked={cambiarContraseña}
                      onChange={(e) => {
                        setCambiarContraseña(e.target.checked);
                        if (!e.target.checked) {
                          setNuevaContraseña("");
                          setMostrarNuevaContraseña(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="cambiar_contraseña" className="text-sm font-medium cursor-pointer">
                      Cambiar contraseña
                    </Label>
                  </div>

                  {cambiarContraseña && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="edit_nueva_contraseña">Nueva Contraseña *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit_nueva_contraseña"
                          type={mostrarNuevaContraseña ? "text" : "password"}
                          value={nuevaContraseña}
                          onChange={(e) => setNuevaContraseña(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setMostrarNuevaContraseña(!mostrarNuevaContraseña)}
                        >
                          {mostrarNuevaContraseña ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La contraseña debe tener al menos 6 caracteres. El usuario podrá iniciar sesión con esta nueva contraseña.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setUsuarioEditando(null);
                  setNuevaContraseña("");
                  setCambiarContraseña(false);
                  setMostrarNuevaContraseña(false);
                  setZonaEdicion("");
                }}
                disabled={editando || cargandoUsuario}
              >
                Cancelar
              </Button>
              <Button 
                onClick={guardarEdicion} 
                disabled={editando || cargandoUsuario || !usuarioEditando}
              >
                {editando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
