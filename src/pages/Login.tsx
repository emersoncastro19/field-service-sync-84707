import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import intercableLogo from "@/assets/intercable-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState("client");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "¡Acceso exitoso!",
      description: "Bienvenido al sistema de gestión de servicios técnicos.",
    });
    
    // Route based on selected role
    const routes: { [key: string]: string } = {
      client: "/cliente",
      agent: "/agente",
      coordinator: "/coordinador",
      technician: "/tecnico",
      admin: "/admin",
    };
    
    setTimeout(() => {
      navigate(routes[role] || "/cliente");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-48 h-auto mb-2">
            <img 
              src={intercableLogo} 
              alt="Intercable Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-base">
              Sistema de Gestión de Servicios Técnicos
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuario</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccione su rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="agent">Agente de Servicio</SelectItem>
                  <SelectItem value="coordinator">Coordinador de Campo</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <a href="#" className="text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
              <a href="#" className="text-primary hover:underline">
                Crear Cuenta
              </a>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
