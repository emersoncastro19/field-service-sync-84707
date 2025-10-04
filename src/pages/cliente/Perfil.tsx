import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin } from "lucide-react";

export default function Perfil() {
  return (
    <Layout role="client">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Actualiza tu información personal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Mantén tus datos actualizados</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input id="first-name" defaultValue="Carlos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input id="last-name" defaultValue="Rodríguez" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
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

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección
                </Label>
                <Input id="address" defaultValue="San José, Costa Rica" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" defaultValue="San José" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal-code">Código Postal</Label>
                <Input id="postal-code" defaultValue="10101" />
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
