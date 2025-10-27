import { supabase } from '../config/supabaseClient'
import { Usuario, LoginData, RegistroData, MAX_LOGIN_ATTEMPTS } from '@/shared/types'

// 🔐 Registro de usuario
export const registrarUsuario = async (nuevoUsuario: RegistroData) => {
  // Encriptar contraseña antes de guardar
  const hashed = await hashPassword(nuevoUsuario.contraseña)

  // 1. Insertar usuario
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

  if (usuarioError) throw usuarioError

  // 2. Si es un Cliente, crear registro en tabla clientes
  if (nuevoUsuario.tipo_usuario === 'Cliente') {
    const { error: clienteError } = await supabase
      .from('clientes')
      .insert([
        {
          id_usuario: usuarioData.id_usuario,
          tipo_identificacion: 'Cedula',
          identificacion: 'V-' + usuarioData.id_usuario, // Temporal, puede actualizarse después
          direccion_principal: 'Por definir',
          direccion_servicio: 'Por definir',
          referencias_ubicacion: null,
          tipo_cliente: 'Residencial',
          estado_cuenta: 'Activo',
          plan_actual: null
        }
      ])

    if (clienteError) {
      // Si falla la creación del cliente, eliminar el usuario creado
      await supabase.from('usuarios').delete().eq('id_usuario', usuarioData.id_usuario)
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
export const loginUsuario = async (email: string, contraseña: string): Promise<Usuario> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw new Error('Usuario no encontrado')
  if (!data) throw new Error('Usuario no encontrado')

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

// 🔓 Cerrar sesión
export const logoutUsuario = () => {
  localStorage.removeItem('usuarioActual')
}

// 🧠 Obtener usuario actual
export const obtenerUsuarioActual = (): Usuario | null => {
  const usuario = localStorage.getItem('usuarioActual')
  return usuario ? JSON.parse(usuario) : null
}

// 🔑 Solicitar recuperación de contraseña
export const solicitarRecuperacionContraseña = async (email: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, email, nombre_completo')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error('Email no encontrado')
  }

  // Generar token de recuperación (en un caso real, esto se enviaría por email)
  const token = Math.random().toString(36).substr(2, 15)
  
  // Guardar token en la base de datos (podrías crear una tabla tokens_recuperacion)
  // Por ahora, lo guardamos en una columna temporal o en localStorage
  localStorage.setItem(`recovery_token_${email}`, token)
  
  return {
    email: data.email,
    nombre: data.nombre_completo,
    token: token
  }
}

// 🔑 Cambiar contraseña con token
export const cambiarContraseñaConToken = async (email: string, token: string, nuevaContraseña: string) => {
  // Verificar token
  const tokenGuardado = localStorage.getItem(`recovery_token_${email}`)
  if (!tokenGuardado || tokenGuardado !== token) {
    throw new Error('Token de recuperación inválido')
  }

  // Encriptar nueva contraseña
  const hashed = await hashPassword(nuevaContraseña)

  // Actualizar contraseña
  const { error } = await supabase
    .from('usuarios')
    .update({ 
      contraseña: hashed,
      intentos_fallidos: 0,
      estado: 'Activo'
    })
    .eq('email', email)

  if (error) throw error

  // Limpiar token
  localStorage.removeItem(`recovery_token_${email}`)
  
  return true
}

// --- 🔧 Funciones auxiliares para contraseñas ---
import bcrypt from 'bcryptjs'

async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(plain, salt)
}

async function comparePassword(plain: string, hashed: string) {
  return await bcrypt.compare(plain, hashed)
}


