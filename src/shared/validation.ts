import { LoginData, RegistroData, PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateLogin = (data: LoginData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'El usuario o email es requerido' });
  } else {
    // Si contiene @, debe ser un email válido. Si no, es username
    if (data.email.includes('@')) {
      if (!isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'El formato del email no es válido' });
      }
    } else {
      // Validar que sea un username válido
      if (!isValidUsername(data.email)) {
        errors.push({ field: 'email', message: 'El nombre de usuario no es válido' });
      }
    }
  }

  if (!data.contraseña) {
    errors.push({ field: 'contraseña', message: 'La contraseña es requerida' });
  }

  return errors;
};

export const validateRegistro = (data: RegistroData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.username) {
    errors.push({ field: 'username', message: 'El nombre de usuario es requerido' });
  } else if (data.username.length < USERNAME_MIN_LENGTH) {
    errors.push({ 
      field: 'username', 
      message: `El nombre de usuario debe tener al menos ${USERNAME_MIN_LENGTH} caracteres` 
    });
  } else if (!isValidUsername(data.username)) {
    errors.push({ 
      field: 'username', 
      message: 'El nombre de usuario solo puede contener letras, números y guiones bajos' 
    });
  }

  if (!data.email) {
    errors.push({ field: 'email', message: 'El email es requerido' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'El formato del email no es válido' });
  }

  if (!data.nombre_completo) {
    errors.push({ field: 'nombre_completo', message: 'El nombre completo es requerido' });
  }

  if (!data.contraseña) {
    errors.push({ field: 'contraseña', message: 'La contraseña es requerida' });
  } else if (data.contraseña.length < PASSWORD_MIN_LENGTH) {
    errors.push({ 
      field: 'contraseña', 
      message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` 
    });
  }

  if (data.telefono && !isValidPhone(data.telefono)) {
    errors.push({ field: 'telefono', message: 'El formato del teléfono no es válido' });
  }

  // Validaciones específicas para Cliente
  if (data.tipo_usuario === 'Cliente') {
    if (!data.tipo_identificacion) {
      errors.push({ field: 'tipo_identificacion', message: 'El tipo de identificación es requerido' });
    }

    if (!data.identificacion) {
      errors.push({ field: 'identificacion', message: 'El número de identificación es requerido' });
    } else if (data.identificacion.trim().length === 0) {
      errors.push({ field: 'identificacion', message: 'El número de identificación no puede estar vacío' });
    }

    if (!data.direccion_principal) {
      errors.push({ field: 'direccion_principal', message: 'La dirección principal es requerida' });
    } else if (data.direccion_principal.trim().length < 10) {
      errors.push({ field: 'direccion_principal', message: 'La dirección debe ser más específica (mínimo 10 caracteres)' });
    }

    if (!data.direccion_servicio) {
      errors.push({ field: 'direccion_servicio', message: 'La dirección de servicio es requerida' });
    } else if (data.direccion_servicio.trim().length < 10) {
      errors.push({ field: 'direccion_servicio', message: 'La dirección debe ser más específica (mínimo 10 caracteres)' });
    }

    if (!data.tipo_cliente) {
      errors.push({ field: 'tipo_cliente', message: 'El tipo de cliente es requerido' });
    }
  }

  return errors;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= PASSWORD_MIN_LENGTH;
};

export const isValidUsername = (username: string): boolean => {
  return username.length >= USERNAME_MIN_LENGTH && /^[a-zA-Z0-9_]+$/.test(username);
};


