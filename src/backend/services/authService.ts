import { supabase } from '../config/supabaseClient'
import { Usuario, LoginData, RegistroData, MAX_LOGIN_ATTEMPTS } from '@/shared/types'
import bcrypt from 'bcryptjs'
import { enviarEmail, generarEmailRecuperacionContraseña } from './emailService'

// Registro de usuario
export const registrarUsuario = async (nuevoUsuario: RegistroData) => {
  // 1. Validar que el username no exista
  const { data: existingUsername, error: usernameCheckError } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('username', nuevoUsuario.username)
    .maybeSingle()

  if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
    throw new Error('Error al verificar el nombre de usuario: ' + usernameCheckError.message)
  }

  if (existingUsername) {
    throw new Error('El nombre de usuario ya está en uso. Por favor, elige otro.')
  }

  // 2. Validar que el email no exista
  const { data: existingEmail, error: emailCheckError } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('email', nuevoUsuario.email)
    .maybeSingle()

  if (emailCheckError && emailCheckError.code !== 'PGRST116') {
    throw new Error('Error al verificar el email: ' + emailCheckError.message)
  }

  if (existingEmail) {
    throw new Error('El email ya está registrado. Por favor, usa otro email o inicia sesión.')
  }

  // 3. Si es cliente, validar que la identificación no exista
  if (nuevoUsuario.tipo_usuario === 'Cliente' && nuevoUsuario.identificacion) {
    const { data: existingIdentificacion, error: identCheckError } = await supabase
      .from('clientes')
      .select('id_cliente')
      .eq('identificacion', nuevoUsuario.identificacion)
      .maybeSingle()

    if (identCheckError && identCheckError.code !== 'PGRST116') {
      throw new Error('Error al verificar la identificación: ' + identCheckError.message)
    }

    if (existingIdentificacion) {
      throw new Error('Esta identificación ya está registrada. Por favor, verifica tus datos.')
    }
  }

  // 4. Encriptar contraseña antes de guardar
  const hashed = await hashPassword(nuevoUsuario.contraseña)

  // 5. Insertar usuario
  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .insert([
      {
        username: nuevoUsuario.username,
        contraseña: hashed,
        email: nuevoUsuario.email,
        telefono: nuevoUsuario.telefono,
        nombre_completo: nuevoUsuario.nombre_completo,
        tipo_usuario: nuevoUsuario.tipo_usuario,
        estado: 'Activo',
        intentos_fallidos: 0,
      },
    ])
    .select()
    .single()

  if (usuarioError) {
    // Manejar errores específicos de duplicados
    if (usuarioError.code === '23505') {
      if (usuarioError.message.includes('username')) {
        throw new Error('El nombre de usuario ya está en uso. Por favor, elige otro.')
      }
      if (usuarioError.message.includes('email')) {
        throw new Error('El email ya está registrado. Por favor, usa otro email o inicia sesión.')
      }
      throw new Error('Ya existe un usuario con estos datos. Por favor, verifica la información.')
    }
    throw new Error('Error al crear el usuario: ' + usuarioError.message)
  }

  // 6. Si es un Cliente, crear registro en tabla clientes
  if (nuevoUsuario.tipo_usuario === 'Cliente') {
    const { error: clienteError } = await supabase
      .from('clientes')
      .insert([
        {
          id_usuario: usuarioData.id_usuario,
          tipo_identificacion: nuevoUsuario.tipo_identificacion || 'Cedula',
          identificacion: nuevoUsuario.identificacion || '',
          direccion_principal: nuevoUsuario.direccion_principal || '',
          direccion_servicio: nuevoUsuario.direccion_servicio || nuevoUsuario.direccion_principal || '',
          referencias_ubicacion: nuevoUsuario.referencias_ubicacion || null,
          tipo_cliente: nuevoUsuario.tipo_cliente || 'Residencial',
          estado_cuenta: 'Activo',
        }
      ])

    if (clienteError) {
      // Si falla la creación del cliente, eliminar el usuario creado
      await supabase.from('usuarios').delete().eq('id_usuario', usuarioData.id_usuario)
      
      // Manejar errores específicos
      if (clienteError.code === '23505') {
        if (clienteError.message.includes('identificacion')) {
          throw new Error('Esta identificación ya está registrada. Por favor, verifica tus datos.')
        }
        throw new Error('Ya existe un cliente con estos datos. Por favor, verifica la información.')
      }
      throw new Error('Error al crear el perfil de cliente: ' + clienteError.message)
    }
  }

  // 3. Si es un Agente, crear registro en tabla agentes_servicio
  if (nuevoUsuario.tipo_usuario === 'Agente') {
    const { error: agenteError } = await supabase
      .from('agentes_servicio')
      .insert([{ id_usuario: usuarioData.id_usuario }])

    if (agenteError) {
      await supabase.from('usuarios').delete().eq('id_usuario', usuarioData.id_usuario)
      throw new Error('Error al crear el perfil de agente: ' + agenteError.message)
    }
  }

  // 4. Si es un Técnico, crear registro en tabla tecnicos
  if (nuevoUsuario.tipo_usuario === 'Tecnico') {
    const { error: tecnicoError } = await supabase
      .from('tecnicos')
      .insert([
        {
          id_usuario: usuarioData.id_usuario,
          zona_cobertura: 'Por asignar',
          disponibilidad: 'Activo'
        }
      ])

    if (tecnicoError) {
      await supabase.from('usuarios').delete().eq('id_usuario', usuarioData.id_usuario)
      throw new Error('Error al crear el perfil de técnico: ' + tecnicoError.message)
    }
  }

  // 5. Si es un Coordinador, crear registro en tabla coordinadores_campo
  if (nuevoUsuario.tipo_usuario === 'Coordinador') {
    const { error: coordinadorError } = await supabase
      .from('coordinadores_campo')
      .insert([
        {
          id_usuario: usuarioData.id_usuario,
          zona_responsabilidad: 'Por asignar'
        }
      ])

    if (coordinadorError) {
      await supabase.from('usuarios').delete().eq('id_usuario', usuarioData.id_usuario)
      throw new Error('Error al crear el perfil de coordinador: ' + coordinadorError.message)
    }
  }

  return usuarioData
}

// 🔐 Login de usuario con control de intentos fallidos
export const loginUsuario = async (emailOUsername: string, contraseña: string): Promise<Usuario> => {
  // Buscar por email o username
  const esEmail = emailOUsername.includes('@');
  
  let query = supabase.from('usuarios').select('*');
  
  if (esEmail) {
    query = query.eq('email', emailOUsername);
  } else {
    query = query.eq('username', emailOUsername);
  }
  
  const { data, error } = await query.single();

  if (error) throw new Error('Usuario no encontrado')
  if (!data) throw new Error('Usuario no encontrado')

  // Verificar si el usuario está inactivo
  if (data.estado === 'Inactivo') {
    throw new Error('USUARIO_INACTIVO')
  }

  // Verificar si el usuario está bloqueado
  if (data.estado === 'Bloqueado') {
    throw new Error('Usuario bloqueado por múltiples intentos fallidos')
  }

  const esValida = await comparePassword(contraseña, data.contraseña)
  
  if (!esValida) {
    // Incrementar intentos fallidos
    const nuevosIntentos = (data.intentos_fallidos || 0) + 1
    const nuevoEstado = nuevosIntentos >= MAX_LOGIN_ATTEMPTS ? 'Bloqueado' : 'Activo'
    
    await supabase
      .from('usuarios')
      .update({ 
        intentos_fallidos: nuevosIntentos,
        estado: nuevoEstado
      })
      .eq('id_usuario', data.id_usuario)

    if (nuevoEstado === 'Bloqueado') {
      throw new Error('Usuario bloqueado por múltiples intentos fallidos')
    }
    
    // Mensaje específico según intentos restantes
    const intentosRestantes = MAX_LOGIN_ATTEMPTS - nuevosIntentos
    throw new Error(`Contraseña incorrecta. Te quedan ${intentosRestantes} intentos.`)
  }

  // Login exitoso - resetear intentos fallidos
  await supabase
    .from('usuarios')
    .update({ 
      intentos_fallidos: 0,
      ultimo_acceso: new Date().toISOString()
    })
    .eq('id_usuario', data.id_usuario)

  // Guardar sesión en localStorage
  localStorage.setItem('usuarioActual', JSON.stringify(data))

  return data as Usuario
}

// 🔑 Cambiar contraseña (para cambio obligatorio)
export const cambiarContraseña = async (usuarioId: string, contraseñaActual: string, nuevaContraseña: string): Promise<void> => {
  console.log('🔑 cambiarContraseña llamado con:', { usuarioId, tipoUsuarioId: typeof usuarioId });
  
  // Obtener usuario actual - convertir id a número si es necesario
  const idNumerico = typeof usuarioId === 'string' && !isNaN(Number(usuarioId)) 
    ? Number(usuarioId) 
    : usuarioId;
    
  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id_usuario', idNumerico)
    .single()

  if (usuarioError) {
    console.error('❌ Error obteniendo usuario:', usuarioError);
    throw new Error('Usuario no encontrado: ' + usuarioError.message)
  }
  
  if (!usuario) {
    console.error('❌ Usuario no encontrado en BD');
    throw new Error('Usuario no encontrado')
  }

  console.log('✅ Usuario encontrado:', usuario.id_usuario, usuario.username);

  // Verificar contraseña actual
  console.log('🔍 Verificando contraseña actual...');
  const esValida = await comparePassword(contraseñaActual, usuario.contraseña)
  if (!esValida) {
    console.error('❌ Contraseña actual incorrecta');
    throw new Error('La contraseña actual es incorrecta')
  }
  console.log('✅ Contraseña actual válida');

  // Verificar que la nueva contraseña sea diferente
  const esMismaContraseña = await comparePassword(nuevaContraseña, usuario.contraseña)
  if (esMismaContraseña) {
    console.error('❌ Nueva contraseña es igual a la actual');
    throw new Error('La nueva contraseña debe ser diferente a la actual')
  }

  // Encriptar nueva contraseña
  console.log('🔐 Encriptando nueva contraseña...');
  const hashed = await hashPassword(nuevaContraseña)
  console.log('✅ Contraseña encriptada');

  // Actualizar contraseña y quitar el flag de cambio obligatorio
  console.log('💾 Actualizando usuario en BD...');
  const { error: updateError } = await supabase
    .from('usuarios')
    .update({
      contraseña: hashed,
      requiere_cambio_contraseña: false
      // Nota: fecha_actualizacion no existe en la tabla, se removió
    })
    .eq('id_usuario', idNumerico)

  if (updateError) {
    console.error('❌ Error actualizando contraseña:', updateError);
    throw new Error('Error al actualizar la contraseña: ' + updateError.message)
  }
  
  console.log('✅ Usuario actualizado exitosamente en BD');
}

// 🔓 Cerrar sesión
export const logoutUsuario = () => {
  localStorage.removeItem('usuarioActual')
  // Limpiar marcas de nuevo ingreso en sessionStorage
  const tiposUsuario = ['Cliente', 'Admin', 'Agente', 'Tecnico', 'Coordinador'];
  tiposUsuario.forEach(tipo => {
    sessionStorage.removeItem(`nuevo_ingreso_${tipo}`);
  });
}

// Obtener usuario actual
export const obtenerUsuarioActual = (): Usuario | null => {
  const usuario = localStorage.getItem('usuarioActual')
  return usuario ? JSON.parse(usuario) : null
}

// 🔑 Solicitar recuperación de contraseña
export const solicitarRecuperacionContraseña = async (email: string) => {
  console.log('🔑 Iniciando recuperación de contraseña para:', email);
  
  // 1. Buscar usuario por email
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, email, nombre_completo')
    .eq('email', email)
    .single()

  if (error || !data) {
    console.error('❌ Usuario no encontrado:', error);
    throw new Error('Email no encontrado')
  }

  console.log('✅ Usuario encontrado:', data.email);

  // 2. Generar token de recuperación (código de 6 dígitos)
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 3. Guardar token en localStorage con expiración de 1 hora
  const tokenData = {
    token,
    email: data.email,
    timestamp: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hora
  };
  
  localStorage.setItem(`recovery_token_${email}`, JSON.stringify(tokenData));
  console.log('✅ Token guardado:', token);
  
  // 4. Generar plantilla de email
  const emailData = generarEmailRecuperacionContraseña(
    data.nombre_completo || 'Usuario',
    token,
    data.email
  );

  // 5. Enviar email con el token
  try {
    console.log('📧 Enviando email de recuperación...');
    await enviarEmail(emailData);
    console.log('✅ Email enviado exitosamente');
  } catch (emailError: any) {
    console.error('❌ Error enviando email:', emailError);
    // Limpiar token si falla el envío
    localStorage.removeItem(`recovery_token_${email}`);
    throw new Error(`No se pudo enviar el email: ${emailError.message}. Por favor, verifica la configuración del servicio de email o contacta al administrador.`);
  }
  
  return {
    email: data.email,
    nombre: data.nombre_completo,
    token: token // Devolver token para testing (en producción, no debería devolverse)
  }
}

// 🔑 Cambiar contraseña con token
export const cambiarContraseñaConToken = async (email: string, token: string, nuevaContraseña: string) => {
  console.log('🔑 Cambiando contraseña con token para:', email);
  
  // 1. Verificar token
  const tokenDataStr = localStorage.getItem(`recovery_token_${email}`)
  if (!tokenDataStr) {
    console.error('❌ Token no encontrado en localStorage');
    throw new Error('Token de recuperación no encontrado o expirado')
  }

  let tokenData;
  try {
    tokenData = JSON.parse(tokenDataStr);
  } catch {
    // Compatibilidad con formato antiguo (solo token como string)
    const oldToken = tokenDataStr;
    if (oldToken !== token) {
      throw new Error('Token de recuperación inválido');
    }
    // Si coincide, proceder (pero sin validación de expiración)
    tokenData = { token: oldToken, timestamp: Date.now(), expiresAt: Date.now() + (60 * 60 * 1000) };
  }

  // 2. Verificar que el token coincida
  if (tokenData.token !== token) {
    console.error('❌ Token no coincide');
    throw new Error('Token de recuperación inválido')
  }

  // 3. Verificar expiración
  const now = Date.now();
  if (tokenData.expiresAt && now > tokenData.expiresAt) {
    console.error('❌ Token expirado');
    localStorage.removeItem(`recovery_token_${email}`);
    throw new Error('Token de recuperación expirado. Por favor, solicita uno nuevo.')
  }

  console.log('✅ Token válido, procediendo a cambiar contraseña');

  // 4. Encriptar nueva contraseña
  const hashed = await hashPassword(nuevaContraseña)

  // 5. Actualizar contraseña en la base de datos
  const { error } = await supabase
    .from('usuarios')
    .update({ 
      contraseña: hashed,
      intentos_fallidos: 0,
      estado: 'Activo'
    })
    .eq('email', email)

  if (error) {
    console.error('❌ Error actualizando contraseña:', error);
    throw new Error('Error al actualizar la contraseña: ' + error.message)
  }

  console.log('✅ Contraseña actualizada exitosamente');

  // 6. Limpiar token
  localStorage.removeItem(`recovery_token_${email}`)
  
  return true
}

// --- 🔧 Funciones auxiliares para contraseñas ---
async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(plain, salt)
}

async function comparePassword(plain: string, hashed: string) {
  return await bcrypt.compare(plain, hashed)
}


