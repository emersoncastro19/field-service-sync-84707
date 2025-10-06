import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, CreditCard, Building2, Hash, Shield, Key, Edit2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Perfil() {
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingService, setEditingService] = useState(false);

  return (
    <Layout role="client">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Información personal, seguridad y de servicio</p>
        </div>

        {/* Identidad y Contacto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Identidad y Contacto
                </CardTitle>
                <CardDescription>Datos personales y de contacto</CardDescription>
              </div>
              {!editingIdentity && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingIdentity(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setEditingIdentity(false); }}>
              <div className="space-y-2">
                <Label htmlFor="full-name">Nombre Completo</Label>
                <Input 
                  id="full-name" 
                  defaultValue="Carlos Rodríguez" 
                  disabled={!editingIdentity}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue="carlos@email.com" 
                  disabled={!editingIdentity}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  defaultValue="+506 8888-8888" 
                  disabled={!editingIdentity}
                />
              </div>

              {editingIdentity && (
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Guardar Cambios</Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setEditingIdentity(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Identificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Identificación
            </CardTitle>
            <CardDescription>Información de identificación (solo lectura)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id-type">Tipo de Identificación</Label>
                <Input id="id-type" defaultValue="Cédula Nacional" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id-number" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Número de Identificación
                </Label>
                <Input id="id-number" defaultValue="1-2345-6789" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input id="username" defaultValue="carlos.rodriguez" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Gestión de contraseña y acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Cambiar Contraseña
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cambiar Contraseña</DialogTitle>
                  <DialogDescription>
                    Introduce tu contraseña actual y la nueva contraseña que deseas establecer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Contraseña Actual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Actualizar Contraseña</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Información de Servicio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información de Servicio
                </CardTitle>
                <CardDescription>Datos relacionados con el servicio</CardDescription>
              </div>
              {!editingService && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingService(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setEditingService(false); }}>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección Principal
                </Label>
                <Input 
                  id="address" 
                  defaultValue="San José, Costa Rica" 
                  disabled={!editingService}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">Referencias de Ubicación</Label>
                <Input 
                  id="references" 
                  defaultValue="100 metros norte de la iglesia" 
                  disabled={!editingService}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan Actual</Label>
                  <Input id="plan" defaultValue="Plan Premium" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-type">Tipo de Cliente</Label>
                  <Input id="client-type" defaultValue="Residencial" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-status">Estado de la Cuenta</Label>
                <Input id="account-status" defaultValue="Activo" disabled />
              </div>

              {editingService && (
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Guardar Cambios</Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setEditingService(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
