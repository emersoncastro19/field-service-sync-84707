import { Toaster } from "@/frontend/components/ui/toaster";
import { Toaster as Sonner } from "@/frontend/components/ui/sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/frontend/context/AuthContext";
import { ToastProvider } from "@/frontend/context/ToastContext";
import { ToastContainer } from "@/frontend/components/ToastContainer";
import Login from "@/frontend/pages/Login";
import Registro from "@/frontend/pages/Registro";
import RecuperarContraseña from "@/frontend/pages/RecuperarContraseña";
import Cliente from "@/frontend/pages/Cliente";
import ClienteOrdenes from "@/frontend/pages/cliente/Ordenes";
import Agente from "@/frontend/pages/Agente";
import BuscarCliente from "@/frontend/pages/agente/BuscarCliente";
import AgenteOrdenes from "@/frontend/pages/agente/Ordenes";
import Coordinador from "@/frontend/pages/Coordinador";
import AsignarOrdenes from "@/frontend/pages/coordinador/AsignarOrdenes";
import Tecnicos from "@/frontend/pages/coordinador/Tecnicos";
import Tecnico from "@/frontend/pages/Tecnico";
import TecnicoOrdenes from "@/frontend/pages/tecnico/Ordenes";
import Especialidades from "@/frontend/pages/tecnico/Especialidades";
import Admin from "@/frontend/pages/Admin";
import Usuarios from "@/frontend/pages/admin/Usuarios";
import Roles from "@/frontend/pages/admin/Roles";
import Notificaciones from "@/frontend/pages/admin/Notificaciones";
import Auditoria from "@/frontend/pages/admin/Auditoria";
import Herramientas from "@/frontend/pages/Herramientas";
import Reportes from "@/frontend/pages/Reportes";
import Ayuda from "@/frontend/pages/Ayuda";
import NotFound from "@/frontend/pages/NotFound";
import ClienteNuevaOrden from "@/frontend/pages/cliente/NuevaOrden";
import ClientePerfil from "@/frontend/pages/cliente/Perfil";
import ClienteCitas from "@/frontend/pages/cliente/Citas";
import ClienteConfirmacionServicio from "@/frontend/pages/cliente/ConfirmacionServicio";
import ClienteDetallesOrden from "@/frontend/pages/cliente/DetallesOrden";
import AgenteNuevaOrden from "@/frontend/pages/agente/NuevaOrden";
import AgenteHistorial from "@/frontend/pages/agente/Historial";
import AgenteCancelarOrden from "@/frontend/pages/agente/CancelarOrden";
import AgenteDetallesOrden from "@/frontend/pages/agente/DetallesOrden";
import AgenteValidarOrdenes from "@/frontend/pages/agente/ValidarOrdenes";
import CoordinadorCitas from "@/frontend/pages/coordinador/Citas";
import CoordinadorHistorial from "@/frontend/pages/coordinador/HistorialAsignaciones";
import TecnicoDocumentar from "@/frontend/pages/tecnico/Documentar";
import TecnicoReportarImpedimento from "@/frontend/pages/tecnico/ReportarImpedimento";
import TecnicoGestionarEjecucion from "@/frontend/pages/tecnico/GestionarEjecucion";
import TecnicoCitas from "@/frontend/pages/tecnico/Citas";
import TecnicoOrdenesCompletadas from "@/frontend/pages/tecnico/OrdenesCompletadas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastProvider>
        <AuthProvider>
          <ToastContainer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-contraseña" element={<RecuperarContraseña />} />
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/cliente/ordenes" element={<ClienteOrdenes />} />
            <Route path="/cliente/detalles-orden" element={<ClienteDetallesOrden />} />
            <Route path="/cliente/nueva-orden" element={<ClienteNuevaOrden />} />
            <Route path="/cliente/perfil" element={<ClientePerfil />} />
            <Route path="/cliente/citas" element={<ClienteCitas />} />
            <Route path="/cliente/confirmacion-servicio" element={<ClienteConfirmacionServicio />} />
            <Route path="/agente" element={<Agente />} />
            <Route path="/agente/buscar" element={<BuscarCliente />} />
            <Route path="/agente/ordenes" element={<AgenteOrdenes />} />
            <Route path="/agente/nueva-orden" element={<AgenteNuevaOrden />} />
            <Route path="/agente/historial" element={<AgenteHistorial />} />
            <Route path="/agente/cancelar-orden" element={<AgenteCancelarOrden />} />
            <Route path="/agente/detalles-orden" element={<AgenteDetallesOrden />} />
            <Route path="/agente/validar-ordenes" element={<AgenteValidarOrdenes />} />
            <Route path="/coordinador" element={<Coordinador />} />
            <Route path="/coordinador/asignar" element={<AsignarOrdenes />} />
            <Route path="/coordinador/tecnicos" element={<Tecnicos />} />
            <Route path="/coordinador/citas" element={<CoordinadorCitas />} />
            <Route path="/coordinador/historial" element={<CoordinadorHistorial />} />
            <Route path="/tecnico" element={<Tecnico />} />
            <Route path="/tecnico/ordenes" element={<TecnicoOrdenes />} />
            <Route path="/tecnico/especialidades" element={<Especialidades />} />
            <Route path="/tecnico/documentar" element={<TecnicoDocumentar />} />
            <Route path="/tecnico/reportar-impedimento" element={<TecnicoReportarImpedimento />} />
            <Route path="/tecnico/gestionar-ejecucion" element={<TecnicoGestionarEjecucion />} />
            <Route path="/tecnico/citas" element={<TecnicoCitas />} />
            <Route path="/tecnico/ordenes-completadas" element={<TecnicoOrdenesCompletadas />} />
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
        </AuthProvider>
      </ToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;