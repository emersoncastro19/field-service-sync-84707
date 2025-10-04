import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Users, MapPin, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Coordinador() {
  const mockTechnicians = [
    { id: "T-001", name: "Pedro Martínez", status: "Disponible", activeOrders: 2 },
    { id: "T-002", name: "Ana Rodríguez", status: "En servicio", activeOrders: 1 },
    { id: "T-003", name: "Luis Fernández", status: "Disponible", activeOrders: 0 },
  ];

  const mockImpediments = [
    { id: "IMP-001", order: "OS-015", issue: "Falta de repuestos", priority: "Alta" },
    { id: "IMP-002", order: "OS-018", issue: "Cliente no disponible", priority: "Media" },
  ];

  return (
    <Layout role="coordinator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Coordinador de Campo</h1>
          <p className="text-muted-foreground">Supervisa y coordina los servicios técnicos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="p-6">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Técnicos Activos</p>
              <p className="text-3xl font-bold">8</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <div className="p-6">
              <MapPin className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Servicios en Curso</p>
              <p className="text-3xl font-bold">15</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-6">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Impedimentos</p>
              <p className="text-3xl font-bold">3</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-6">
              <TrendingUp className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Eficiencia</p>
              <p className="text-3xl font-bold">94%</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Supervisión de Técnicos"
            description="Estado actual de los técnicos"
            icon={Users}
          >
            <div className="space-y-3">
              {mockTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tech.activeOrders} órdenes activas
                    </p>
                  </div>
                  <Badge variant={tech.status === "Disponible" ? "default" : "secondary"}>
                    {tech.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4">Ver Todos los Técnicos</Button>
          </DashboardCard>

          <DashboardCard
            title="Impedimentos Activos"
            description="Problemas que requieren atención"
            icon={AlertCircle}
          >
            <div className="space-y-3">
              {mockImpediments.map((imp) => (
                <div
                  key={imp.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{imp.order}</p>
                    <Badge variant={imp.priority === "Alta" ? "destructive" : "secondary"}>
                      {imp.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{imp.issue}</p>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link to="/coordinador/impedimentos">Resolver</Link>
                  </Button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            title="Asignar/Reasignar Órdenes"
            description="Gestionar asignaciones"
            icon={MapPin}
          >
            <Button className="w-full" asChild>
              <Link to="/coordinador/asignar">
                <MapPin className="mr-2 h-4 w-4" />
                Gestionar Asignaciones
              </Link>
            </Button>
          </DashboardCard>

          <DashboardCard
            title="Gestionar Citas de Servicio"
            description="Calendario de servicios"
            icon={Calendar}
          >
            <Button variant="outline" className="w-full" asChild>
              <Link to="/coordinador/citas">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Calendario
              </Link>
            </Button>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}
