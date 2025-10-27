import Layout from "@/frontend/components/Layout";
import { Wrench, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Checkbox } from "@/frontend/components/ui/checkbox";

const availableSpecialties = [
  { id: "repair", name: "Reparación de Hardware", active: true },
  { id: "software", name: "Instalación de Software", active: true },
  { id: "maintenance", name: "Mantenimiento Preventivo", active: false },
  { id: "network", name: "Configuración de Redes", active: true },
  { id: "security", name: "Seguridad Informática", active: false },
];

export default function Especialidades() {
  return (
    <Layout role="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Especialidades</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus áreas de especialización técnica</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Especialidades Técnicas
            </CardTitle>
            <CardDescription>
              Selecciona las áreas en las que tienes experiencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableSpecialties.map((specialty) => (
                <div 
                  key={specialty.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id={specialty.id} 
                      checked={specialty.active}
                    />
                    <label 
                      htmlFor={specialty.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {specialty.name}
                    </label>
                  </div>
                  {specialty.active && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Activa
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
