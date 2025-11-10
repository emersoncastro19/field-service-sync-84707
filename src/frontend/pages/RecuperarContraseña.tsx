import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { KeyRound, ArrowLeft } from "lucide-react";
import { solicitarRecuperacionContraseña, cambiarContraseñaConToken } from "@/backend/services/authService";
import { useToast } from "@/frontend/context/ToastContext";

export default function RecuperarContraseña() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [step, setStep] = useState<'email' | 'token' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSolicitarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error("Error", "Por favor ingresa tu email");
      return;
    }

    setCargando(true);
    try {
      const result = await solicitarRecuperacionContraseña(email);
      success("Token enviado", `Se ha enviado un token de recuperación a ${result.email}`);
      setStep('token');
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      error("Error", "Por favor ingresa el token");
      return;
    }

    setStep('password');
  };

  const handleCambiarContraseña = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaContraseña || !confirmarContraseña) {
      error("Error", "Por favor completa todos los campos");
      return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
      error("Error", "Las contraseñas no coinciden");
      return;
    }

    if (nuevaContraseña.length < 6) {
      error("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      await cambiarContraseñaConToken(email, token, nuevaContraseña);
      success("¡Contraseña cambiada!", "Tu contraseña ha sido actualizada correctamente");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
            <KeyRound className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'email' && 'Recuperar Contraseña'}
            {step === 'token' && 'Verificar Token'}
            {step === 'password' && 'Nueva Contraseña'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Ingresa tu email para recibir un token de recuperación'}
            {step === 'token' && 'Ingresa el token que recibiste por email'}
            {step === 'password' && 'Crea una nueva contraseña segura'}
          </CardDescription>
        </CardHeader>

        {step === 'email' && (
          <form onSubmit={handleSolicitarRecuperacion}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" size="lg" disabled={cargando}>
                {cargando ? "Enviando..." : "Enviar Token"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'token' && (
          <form onSubmit={handleVerificarToken}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token de Recuperación</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Ingresa el token recibido"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Revisa tu email para obtener el token de recuperación
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" size="lg">
                Verificar Token
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleCambiarContraseña}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nuevaContraseña">Nueva Contraseña</Label>
                <Input
                  id="nuevaContraseña"
                  type="password"
                  placeholder="••••••••"
                  value={nuevaContraseña}
                  onChange={(e) => setNuevaContraseña(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarContraseña">Confirmar Contraseña</Label>
                <Input
                  id="confirmarContraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirmarContraseña}
                  onChange={(e) => setConfirmarContraseña(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" size="lg" disabled={cargando}>
                {cargando ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setStep('token')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

