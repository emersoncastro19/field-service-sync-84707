import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Info, BookOpen, HelpCircle, Mail, Package, Calendar, Phone, Lightbulb } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";
import { useAuth } from "@/frontend/context/AuthContext";

export default function Ayuda() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  
  // Obtener el rol del usuario autenticado
  const getRole = (): "client" | "agent" | "coordinator" | "technician" | "admin" => {
    if (!usuario) {
      return 'client'; // Valor temporal mientras se carga
    }
    
    // Mapear tipo_usuario de la BD al formato del Layout
    const roleMap: Record<string, "client" | "agent" | "coordinator" | "technician" | "admin"> = {
      'Cliente': 'client',
      'Agente': 'agent',
      'Coordinador': 'coordinator',
      'Tecnico': 'technician',
      'Admin': 'admin'
    };
    
    return roleMap[usuario.tipo_usuario] || 'client';
  };

  // Redirigir al login si no hay usuario (solo después de verificar que realmente no existe)
  useEffect(() => {
    // Dar un pequeño delay para permitir que el AuthContext cargue el usuario
    const timer = setTimeout(() => {
      if (!usuario) {
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [usuario, navigate]);

  const faqs = [
    {
      question: "¿Cómo creo una nueva orden de servicio?",
      answer: "Para crear una orden de servicio, ve al panel correspondiente a tu rol y busca el botón 'Crear Nueva Orden'. Completa todos los campos requeridos incluyendo tipo de servicio, descripción y datos del cliente."
    },
    {
      question: "¿Cómo puedo cambiar mi contraseña?",
      answer: "Puedes cambiar tu contraseña desde la página de recuperación de contraseña. Si olvidaste tu contraseña, usa la opción '¿Olvidaste tu contraseña?' en la página de inicio de sesión."
    },
    {
      question: "¿Qué hago si encuentro un problema durante el servicio?",
      answer: "Los técnicos pueden reportar impedimentos directamente desde su panel usando el botón 'Reportar Impedimento'. Esto notificará automáticamente al coordinador de campo para su resolución."
    },
    {
      question: "¿Cómo puedo ver el historial de servicios?",
      answer: "Cada rol tiene acceso a diferentes niveles de historial. Los clientes pueden ver su historial personal desde 'Órdenes de Servicio', mientras que los agentes y coordinadores tienen acceso a historiales más amplios desde sus respectivos paneles."
    },
    {
      question: "¿Cómo funcionan las notificaciones?",
      answer: "El sistema envía notificaciones automáticas para eventos importantes como nuevas asignaciones, cambios de estado, y confirmaciones de servicio. Puedes ver todas tus notificaciones en tu panel principal (icono de campana en el header)."
    },
    {
      question: "¿Cómo asigno un técnico a una orden?",
      answer: "Los coordinadores pueden asignar técnicos desde el panel 'Asignar o Reasignar Órdenes'. Selecciona la orden y elige el técnico disponible con las especialidades requeridas."
    },
    {
      question: "¿Cómo confirmo que un servicio fue realizado?",
      answer: "Los clientes pueden confirmar la realización del servicio desde los 'Detalles de la Orden'. Verás botones de 'Confirmar' o 'Rechazar' cuando el técnico haya completado el trabajo."
    }
  ];

  return (
    <Layout role={getRole()}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
          <p className="text-muted-foreground">Encuentra respuestas a tus preguntas y aprende a usar el sistema</p>
        </div>

        <DashboardCard
          title="Acerca del Sistema"
          description="Información general"
          icon={Info}
        >
          <div className="space-y-4">
            <p className="text-sm">
              <strong>Sistema de Gestión de Servicios Técnicos</strong> es una plataforma completa 
              diseñada para coordinar y gestionar órdenes de servicio de manera eficiente. 
              El sistema facilita la comunicación entre clientes, agentes de servicio, técnicos 
              y coordinadores de campo.
            </p>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Versión: 1.0.0
              </p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Última actualización: Octubre 2025
              </p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Soporte: soporte@serviciotecnico.com
              </p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono: +58 424-XXXXXXX
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Guías de Usuario"
          description="Documentación y tutoriales"
          icon={BookOpen}
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">Manual de Cliente</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Cómo crear y gestionar órdenes</span>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">Manual de Técnico</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Gestión de servicios y reportes</span>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">Guía de Coordinador</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Asignación y supervisión</span>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">Tutoriales en Video</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Aprende con videos paso a paso</span>
                </div>
              </Button>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Preguntas Frecuentes (FAQ)"
          description="Respuestas a preguntas comunes"
          icon={HelpCircle}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DashboardCard>

        <DashboardCard
          title="Contactar Soporte"
          description="¿Necesitas ayuda adicional?"
          icon={Mail}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si no encuentras la respuesta que buscas, nuestro equipo de soporte está disponible para ayudarte.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
              <Button variant="outline" className="w-full">
                <HelpCircle className="mr-2 h-4 w-4" />
                Chat en Vivo
              </Button>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Horario de Atención
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Lunes a Viernes: 8:00 AM - 6:00 PM<br/>
                Sábados: 9:00 AM - 1:00 PM<br/>
                Domingos: Cerrado
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
