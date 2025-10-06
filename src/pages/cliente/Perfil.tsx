import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, CreditCard, Building2, Hash } from "lucide-react";

export default function Perfil() {
  return (
    <Layout role="client">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Información personal y de servicio</p>
        </div>

        {/* Identidad y Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identidad y Contacto
            </CardTitle>
            <CardDescription>Datos personales y de contacto</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nombre Completo</Label>
                <Input id="full-name" defaultValue="Carlos Rodríguez" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <Input id="email" type="email" defaultValue="carlos@email.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input id="phone" type="tel" defaultValue="+506 8888-8888" />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Guardar Cambios</Button>
                <Button type="button" variant="outline">Cancelar</Button>
              </div>
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

        {/* Información de Servicio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de Servicio
            </CardTitle>
            <CardDescription>Datos relacionados con el servicio</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección Principal
                </Label>
                <Input id="address" defaultValue="San José, Costa Rica" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">Referencias de Ubicación</Label>
                <Input id="references" defaultValue="100 metros norte de la iglesia" />
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

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Guardar Cambios</Button>
                <Button type="button" variant="outline">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
