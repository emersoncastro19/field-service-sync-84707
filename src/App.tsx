import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cliente from "./pages/Cliente";
import ClienteOrdenes from "./pages/cliente/Ordenes";
import Agente from "./pages/Agente";
import BuscarCliente from "./pages/agente/BuscarCliente";
import AgenteOrdenes from "./pages/agente/Ordenes";
import Coordinador from "./pages/Coordinador";
import AsignarOrdenes from "./pages/coordinador/AsignarOrdenes";
import Tecnicos from "./pages/coordinador/Tecnicos";
import Tecnico from "./pages/Tecnico";
import TecnicoOrdenes from "./pages/tecnico/Ordenes";
import Especialidades from "./pages/tecnico/Especialidades";
import Admin from "./pages/Admin";
import Usuarios from "./pages/admin/Usuarios";
import Roles from "./pages/admin/Roles";
import Notificaciones from "./pages/admin/Notificaciones";
import Auditoria from "./pages/admin/Auditoria";
import Herramientas from "./pages/Herramientas";
import Reportes from "./pages/Reportes";
import Ayuda from "./pages/Ayuda";
import NotFound from "./pages/NotFound";
import ClienteNuevaOrden from "./pages/cliente/NuevaOrden";
import ClientePerfil from "./pages/cliente/Perfil";
import AgenteNuevaOrden from "./pages/agente/NuevaOrden";
import AgenteHistorial from "./pages/agente/Historial";
import AgenteCancelarOrden from "./pages/agente/CancelarOrden";
import CoordinadorImpedimentos from "./pages/coordinador/Impedimentos";
import CoordinadorCitas from "./pages/coordinador/Citas";
import TecnicoDocumentar from "./pages/tecnico/Documentar";
import TecnicoReportarImpedimento from "./pages/tecnico/ReportarImpedimento";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cliente" element={<Cliente />} />
          <Route path="/cliente/ordenes" element={<ClienteOrdenes />} />
          <Route path="/cliente/nueva-orden" element={<ClienteNuevaOrden />} />
          <Route path="/cliente/perfil" element={<ClientePerfil />} />
          <Route path="/agente" element={<Agente />} />
          <Route path="/agente/buscar" element={<BuscarCliente />} />
          <Route path="/agente/ordenes" element={<AgenteOrdenes />} />
          <Route path="/agente/nueva-orden" element={<AgenteNuevaOrden />} />
          <Route path="/agente/historial" element={<AgenteHistorial />} />
          <Route path="/agente/cancelar-orden" element={<AgenteCancelarOrden />} />
          <Route path="/coordinador" element={<Coordinador />} />
          <Route path="/coordinador/asignar" element={<AsignarOrdenes />} />
          <Route path="/coordinador/tecnicos" element={<Tecnicos />} />
          <Route path="/coordinador/impedimentos" element={<CoordinadorImpedimentos />} />
          <Route path="/coordinador/citas" element={<CoordinadorCitas />} />
          <Route path="/tecnico" element={<Tecnico />} />
          <Route path="/tecnico/ordenes" element={<TecnicoOrdenes />} />
          <Route path="/tecnico/especialidades" element={<Especialidades />} />
          <Route path="/tecnico/documentar" element={<TecnicoDocumentar />} />
          <Route path="/tecnico/reportar-impedimento" element={<TecnicoReportarImpedimento />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/notificaciones" element={<Notificaciones />} />
          <Route path="/admin/auditoria" element={<Auditoria />} />
          <Route path="/herramientas" element={<Herramientas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/ayuda" element={<Ayuda />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
