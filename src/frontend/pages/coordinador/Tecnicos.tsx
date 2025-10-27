import Layout from "@/frontend/components/Layout";
import { User, MapPin, Wrench, CheckCircle } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";

const technicians = [
  { 
    id: "T001", 
    name: "Juan Pérez", 
    specialty: "Reparación de Hardware", 
    zone: "Zona Norte",
    status: "active",
    ordersCompleted: 45,
    ordersInProgress: 3
  },
  { 
    id: "T002", 
    name: "María García", 
    specialty: "Instalación de Software", 
    zone: "Zona Sur",
    status: "active",
    ordersCompleted: 38,
    ordersInProgress: 2
  },
  { 
    id: "T003", 
    name: "Pedro López", 
    specialty: "Mantenimiento", 
    zone: "Zona Este",
    status: "inactive",
    ordersCompleted: 52,
    ordersInProgress: 0
  },
];

export default function Tecnicos() {
  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Técnicos</h1>
          <p className="text-muted-foreground mt-2">Supervisa el estado y rendimiento de los técnicos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {technicians.map((tech) => (
            <Card key={tech.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <div>
                      <CardTitle>{tech.name}</CardTitle>
                      <CardDescription>{tech.id}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={tech.status === "active" ? "default" : "secondary"}>
                    {tech.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>{tech.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{tech.zone}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completados</p>
                        <p className="text-lg font-semibold">{tech.ordersCompleted}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">En Proceso</p>
                        <p className="text-lg font-semibold">{tech.ordersInProgress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
