import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Wrench } from "lucide-react";
import { loginUsuario } from "@/backend/services/authService";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/hooks/useToast";
import { validateLogin } from "@/shared/validation";
import { LoginData } from "@/shared/types";

export default function Login() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    contraseña: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'warning' | 'info', texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Limpiar mensaje cuando el usuario empiece a escribir
    if (mensaje) {
      setMensaje(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setValidationErrors({});
    setMensaje(null);
    
    // Validar formulario
    const errors = validateLogin(formData);
    if (errors.length > 0) {
      const errorMap: Record<string, string> = {};
      errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setValidationErrors(errorMap);
      setCargando(false);
      return;
    }
    
    try {
      const usuario = await loginUsuario(formData.email, formData.contraseña);
      setUsuario(usuario);
      
      // Mensaje de éxito específico
      setMensaje({
        tipo: 'success',
        texto: `¡Bienvenido ${usuario.nombre_completo}! Acceso exitoso.`
      });
      
      // Redirigir según el tipo de usuario después de mostrar el mensaje
      setTimeout(() => {
        const routes: { [key: string]: string } = {
          "Cliente": "/cliente",
          "Agente": "/agente", 
          "Coordinador": "/coordinador",
          "Tecnico": "/tecnico",
          "Admin": "/admin"
        };
        
        const ruta = routes[usuario.tipo_usuario] || "/";
        navigate(ruta);
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      
      // Mensajes específicos según el tipo de error
      if (err.message.includes('bloqueado')) {
        setMensaje({
          tipo: 'error',
          texto: '⚠️ Usuario bloqueado por múltiples intentos fallidos. Contacta al administrador.'
        });
      } else if (err.message.includes('Contraseña incorrecta')) {
        setMensaje({
          tipo: 'error',
          texto: `❌ ${err.message}`
        });
      } else if (err.message.includes('Usuario no encontrado')) {
        setMensaje({
          tipo: 'error',
          texto: '❌ Usuario no encontrado. Verifica tu email.'
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: `❌ Error de autenticación: ${err.message}`
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
            <Wrench className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Sistema de Gestión de Servicios Técnicos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={validationErrors.email ? 'border-red-500' : ''}
                required
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.contraseña}
                onChange={(e) => handleInputChange('contraseña', e.target.value)}
                className={validationErrors.contraseña ? 'border-red-500' : ''}
                required
              />
              {validationErrors.contraseña && (
                <p className="text-sm text-red-500">{validationErrors.contraseña}</p>
              )}
            </div>
            
            {/* Mensaje de estado del login */}
            {mensaje && (
              <div className={`p-3 rounded-lg border text-sm font-medium ${
                mensaje.tipo === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : mensaje.tipo === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : mensaje.tipo === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {mensaje.texto}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <a href="/recuperar-contraseña" className="text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
              <a href="/registro" className="text-primary hover:underline">
                Crear Cuenta
              </a>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={cargando}>
              {cargando ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
