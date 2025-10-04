import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("client");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Route based on selected role
    const routes: { [key: string]: string } = {
      client: "/cliente",
      agent: "/agente",
      coordinator: "/coordinador",
      technician: "/tecnico",
      admin: "/admin",
    };
    navigate(routes[role] || "/cliente");
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
