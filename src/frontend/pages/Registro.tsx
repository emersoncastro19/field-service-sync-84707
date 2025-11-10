import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrarUsuario } from '@/backend/services/authService'
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { UserPlus, Info } from "lucide-react";
import { useToast } from '@/frontend/context/ToastContext';
import { validateRegistro } from '@/shared/validation';
import { RegistroData } from '@/shared/types';
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";

export default function Registro() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [formData, setFormData] = useState<RegistroData>({
    username: '',
    contraseña: '',
    email: '',
    telefono: '',
    nombre_completo: '',
    tipo_usuario: 'Cliente', // Siempre Cliente para registro público
    tipo_identificacion: 'Cedula',
    identificacion: '',
    direccion_principal: '',
    direccion_servicio: '',
    referencias_ubicacion: '',
    tipo_cliente: 'Residencial',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(false)
  const [usarDireccionPrincipal, setUsarDireccionPrincipal] = useState(true);

  // Función para obtener el placeholder del número de identificación según el tipo
  const getPlaceholderIdentificacion = (tipo: string) => {
    switch (tipo) {
      case 'Cedula':
        return 'V-12345678';
      case 'Pasaporte':
        return 'A1234567';
      case 'RIF':
        return 'J-12345678-9';
      default:
        return 'V-12345678';
    }
  };

  // Función para formatear el número de teléfono
  const formatearTelefono = (valor: string): string => {
    // Si el campo está vacío, retornar vacío
    if (valor.trim() === '') return '';
    
    // Remover todo excepto números y +
    let numeros = valor.replace(/[^\d+]/g, '');
    
    // Si el usuario empieza a escribir sin +58, agregarlo automáticamente
    // Solo si no tiene ningún + o si tiene un + pero no es +58
    if (!numeros.startsWith('+58')) {
      if (!numeros.includes('+')) {
        // Si no hay +, agregar +58 automáticamente
        numeros = '+58' + numeros;
      } else if (numeros.startsWith('+') && numeros.length > 1 && numeros.substring(0, 3) !== '+58') {
        // Si tiene + pero no es +58, reemplazar con +58
        numeros = '+58' + numeros.substring(1);
      }
    }
    
    // Formatear: +58 XXX XXXXXXX
    if (numeros.startsWith('+58')) {
      const sinPrefijo = numeros.substring(3).replace(/[^0-9]/g, ''); // Solo números después de +58
      if (sinPrefijo.length === 0) {
        return '+58';
      } else if (sinPrefijo.length <= 3) {
        return `+58 ${sinPrefijo}`;
      } else {
        return `+58 ${sinPrefijo.substring(0, 3)} ${sinPrefijo.substring(3, 10)}`;
      }
    }
    
    return numeros;
  };

  // Función para formatear el número de identificación según el tipo
  const formatearIdentificacion = (valor: string, tipo: string): string => {
    // Remover caracteres no alfanuméricos excepto guiones
    let limpio = valor.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    
    switch (tipo) {
      case 'Cedula':
        // Formato: V-12345678
        if (limpio.length === 0) return '';
        // Permitir letra al inicio
        let letra = '';
        let numeros = '';
        
        if (/^[A-Z]/.test(limpio)) {
          letra = limpio[0];
          numeros = limpio.substring(1).replace(/[^0-9]/g, '').substring(0, 8);
        } else {
          numeros = limpio.replace(/[^0-9]/g, '').substring(0, 8);
        }
        
        if (letra && numeros) {
          return `${letra}-${numeros}`;
        } else if (letra) {
          return letra;
        } else {
          return numeros;
        }
        
      case 'Pasaporte':
        // Formato: A1234567 (sin guiones, solo letra + números)
        return limpio.replace(/-/g, '').substring(0, 10);
        
      case 'RIF':
        // Formato: J-12345678-9
        if (limpio.length === 0) return '';
        
        let letraRif = '';
        let numerosRif = '';
        let digitoVerificador = '';
        
        if (/^[A-Z]/.test(limpio)) {
          letraRif = limpio[0];
          const resto = limpio.substring(1).replace(/[^0-9]/g, '');
          if (resto.length <= 8) {
            numerosRif = resto;
          } else {
            numerosRif = resto.substring(0, 8);
            digitoVerificador = resto.substring(8, 9);
          }
        } else {
          numerosRif = limpio.replace(/[^0-9]/g, '').substring(0, 8);
        }
        
        if (letraRif && numerosRif && digitoVerificador) {
          return `${letraRif}-${numerosRif}-${digitoVerificador}`;
        } else if (letraRif && numerosRif) {
          return `${letraRif}-${numerosRif}`;
        } else if (letraRif) {
          return letraRif;
        } else {
          return numerosRif;
        }
        
      default:
        return limpio;
    }
  };

  const handleChange = (field: keyof RegistroData, value: string) => {
    let valorFormateado = value;
    
    // Aplicar formateo automático según el campo
    if (field === 'telefono') {
      valorFormateado = formatearTelefono(value);
    } else if (field === 'identificacion') {
      valorFormateado = formatearIdentificacion(value, formData.tipo_identificacion);
    }
    
    setFormData(prev => ({ ...prev, [field]: valorFormateado }))
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Si cambia la dirección principal y está marcado usar principal, actualizar servicio
    if (field === 'direccion_principal' && usarDireccionPrincipal) {
      setFormData(prev => ({ ...prev, direccion_servicio: valorFormateado }))
    }
  }

  const handleUsarDireccionPrincipal = (checked: boolean) => {
    setUsarDireccionPrincipal(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, direccion_servicio: prev.direccion_principal }));
      setValidationErrors(prev => ({ ...prev, direccion_servicio: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setValidationErrors({})
    
    // Validar formulario
    const errors = validateRegistro(formData)
    if (errors.length > 0) {
      const errorMap: Record<string, string> = {}
      errors.forEach(err => {
        errorMap[err.field] = err.message
      })
      setValidationErrors(errorMap)
      setCargando(false)
      return
    }
    
    try {
      await registrarUsuario(formData)
      success("Registro exitoso", `Tu cuenta ha sido creada correctamente. Bienvenido/a ${formData.nombre_completo}!`)
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      console.error(err)
      error("Error al registrar", err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary p-4 py-6">
      <Card className="w-full max-w-5xl shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2 shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">Registro de Cliente</CardTitle>
          <CardDescription className="text-sm">
            Crea tu cuenta como cliente para solicitar servicios técnicos
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario *</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="usuario123"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={validationErrors.username ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.username && (
                  <p className="text-sm text-red-500">{validationErrors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  placeholder="Juan Pérez"
                  value={formData.nombre_completo}
                  onChange={(e) => handleChange('nombre_completo', e.target.value)}
                  className={validationErrors.nombre_completo ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.nombre_completo && (
                  <p className="text-sm text-red-500">{validationErrors.nombre_completo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={validationErrors.email ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="+58 412 1234567"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={validationErrors.telefono ? 'border-red-500' : ''}
                />
                {validationErrors.telefono && (
                  <p className="text-sm text-red-500">{validationErrors.telefono}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_identificacion">Tipo de Identificación *</Label>
                <Select
                  value={formData.tipo_identificacion}
                  onValueChange={(value) => {
                    // Validar que el valor sea uno de los tipos permitidos
                    const nuevoTipo = value as 'Cedula' | 'Pasaporte' | 'RIF';
                    // Primero actualizar el tipo
                    setFormData(prev => {
                      // Reformatear la identificación si existe
                      let nuevaIdentificacion = prev.identificacion || '';
                      if (prev.identificacion) {
                        const valorLimpio = prev.identificacion.replace(/[^A-Za-z0-9]/g, '');
                        nuevaIdentificacion = formatearIdentificacion(valorLimpio, nuevoTipo);
                      }
                      return { ...prev, tipo_identificacion: nuevoTipo, identificacion: nuevaIdentificacion };
                    });
                    // Limpiar error si existe
                    if (validationErrors.tipo_identificacion) {
                      setValidationErrors(prev => ({ ...prev, tipo_identificacion: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={validationErrors.tipo_identificacion ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cedula">Cédula</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="RIF">RIF</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.tipo_identificacion && (
                  <p className="text-sm text-red-500">{validationErrors.tipo_identificacion}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identificacion">Número de Identificación *</Label>
                <Input
                  id="identificacion"
                  name="identificacion"
                  placeholder={getPlaceholderIdentificacion(formData.tipo_identificacion)}
                  value={formData.identificacion}
                  onChange={(e) => handleChange('identificacion', e.target.value)}
                  className={validationErrors.identificacion ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.identificacion && (
                  <p className="text-sm text-red-500">{validationErrors.identificacion}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                <Select
                  value={formData.tipo_cliente}
                  onValueChange={(value) => handleChange('tipo_cliente', value)}
                >
                  <SelectTrigger className={validationErrors.tipo_cliente ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residencial">Residencial</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.tipo_cliente && (
                  <p className="text-sm text-red-500">{validationErrors.tipo_cliente}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraseña">Contraseña *</Label>
                <Input
                  id="contraseña"
                  name="contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={formData.contraseña}
                  onChange={(e) => handleChange('contraseña', e.target.value)}
                  className={validationErrors.contraseña ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.contraseña && (
                  <p className="text-sm text-red-500">{validationErrors.contraseña}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion_principal">Dirección Principal *</Label>
              <Textarea
                id="direccion_principal"
                name="direccion_principal"
                placeholder="Calle, número, edificio, sector, ciudad, estado"
                value={formData.direccion_principal}
                onChange={(e) => handleChange('direccion_principal', e.target.value)}
                className={validationErrors.direccion_principal ? 'border-red-500' : ''}
                rows={1}
                required
              />
              {validationErrors.direccion_principal && (
                <p className="text-sm text-red-500">{validationErrors.direccion_principal}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="usar-direccion-principal"
                checked={usarDireccionPrincipal}
                onChange={(e) => handleUsarDireccionPrincipal(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="usar-direccion-principal" className="cursor-pointer font-normal text-sm">
                Usar dirección principal como dirección de servicio
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direccion_servicio">Dirección de Servicio *</Label>
                <Textarea
                  id="direccion_servicio"
                  name="direccion_servicio"
                  placeholder="Calle, número, edificio, sector, ciudad, estado"
                  value={formData.direccion_servicio}
                  onChange={(e) => handleChange('direccion_servicio', e.target.value)}
                  className={validationErrors.direccion_servicio ? 'border-red-500' : ''}
                  rows={1}
                  disabled={usarDireccionPrincipal}
                  required
                />
                {validationErrors.direccion_servicio && (
                  <p className="text-sm text-red-500">{validationErrors.direccion_servicio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencias_ubicacion">Referencias de Ubicación</Label>
                <Textarea
                  id="referencias_ubicacion"
                  name="referencias_ubicacion"
                  placeholder="Puntos de referencia, indicaciones adicionales (opcional)"
                  value={formData.referencias_ubicacion}
                  onChange={(e) => handleChange('referencias_ubicacion', e.target.value)}
                  rows={1}
                />
              </div>
            </div>
            
            <Alert className="py-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Este registro es exclusivo para clientes. Si necesitas una cuenta de trabajador (Agente, Técnico o Coordinador), contacta al administrador.
              </AlertDescription>
            </Alert>
            
            <div className="text-xs text-center pt-1">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <a href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </a>
            </div>
          </CardContent>
          
          <CardFooter className="pt-3">
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
