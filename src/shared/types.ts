// Tipos para el sistema de autenticación y usuarios
export interface Usuario {
  id_usuario: string;
  username: string;
  email: string;
  nombre_completo: string;
  tipo_usuario: 'Cliente' | 'Agente' | 'Coordinador' | 'Tecnico' | 'Admin';
  telefono?: string;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado';
  intentos_fallidos: number;
  ultimo_acceso?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  requiere_cambio_contraseña?: boolean;
}

export interface LoginData {
  email: string;
  contraseña: string;
}

export interface RegistroData {
  username: string;
  contraseña: string;
  email: string;
  telefono?: string;
  nombre_completo: string;
  tipo_usuario: 'Cliente' | 'Agente' | 'Coordinador' | 'Tecnico' | 'Admin';
  // Campos específicos para Cliente
  tipo_identificacion?: 'Cedula' | 'Pasaporte' | 'RIF';
  identificacion?: string;
  direccion_principal?: string;
  direccion_servicio?: string;
  referencias_ubicacion?: string;
  tipo_cliente?: 'Residencial' | 'Comercial' | 'Empresarial';
}

export interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  logout: () => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface PasswordRecoveryData {
  email: string;
  token?: string;
  nueva_contraseña?: string;
}

// Constantes para el sistema
export const MAX_LOGIN_ATTEMPTS = 5;
export const TOAST_DURATION = 5000; // 5 segundos
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_MIN_LENGTH = 3;


