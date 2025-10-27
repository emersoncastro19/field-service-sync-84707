import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrarUsuario } from '@/backend/services/authService'
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { UserPlus } from "lucide-react";
import { useToast } from '@/frontend/hooks/useToast';
import { validateRegistro } from '@/shared/validation';
import { RegistroData } from '@/shared/types';

export default function Registro() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [formData, setFormData] = useState<RegistroData>({
    username: '',
    contraseña: '',
    email: '',
    telefono: '',
    nombre_completo: '',
    tipo_usuario: 'Cliente',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(false)

  const handleChange = (field: keyof RegistroData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

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
      success("¡Registro exitoso!", "Tu cuenta ha sido creada correctamente")
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      console.error(err)
      error("Error al registrar", err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Registro de Usuario</CardTitle>
          <CardDescription>
            Crea tu cuenta en el sistema de gestión
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
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
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
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
              <Label htmlFor="telefono">Teléfono (Opcional)</Label>
              <Input
                id="telefono"
                name="telefono"
                placeholder="+1 234 567 8900"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className={validationErrors.telefono ? 'border-red-500' : ''}
              />
              {validationErrors.telefono && (
                <p className="text-sm text-red-500">{validationErrors.telefono}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuario</Label>
              <Select 
                value={formData.tipo_usuario} 
                onValueChange={(value) => handleChange('tipo_usuario', value)}
              >
                <SelectTrigger id="tipo_usuario">
                  <SelectValue placeholder="Seleccione su rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Agente">Agente</SelectItem>
                  <SelectItem value="Coordinador">Coordinador</SelectItem>
                  <SelectItem value="Tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contraseña">Contraseña</Label>
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
            
            <div className="text-sm text-center">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <a href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </a>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={cargando}>
              {cargando ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
