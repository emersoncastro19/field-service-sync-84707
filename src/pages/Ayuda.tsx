import Layout from "@/components/Layout";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Info, BookOpen, HelpCircle, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Ayuda() {
  const faqs = [
    {
      question: "¿Cómo creo una nueva orden de servicio?",
      answer: "Para crear una orden de servicio, ve al panel correspondiente a tu rol y busca el botón 'Crear Nueva Orden'. Completa todos los campos requeridos incluyendo tipo de servicio, descripción y datos del cliente."
    },
    {
      question: "¿Cómo puedo cambiar mi contraseña?",
      answer: "Puedes cambiar tu contraseña desde la página de Herramientas o contactando al administrador del sistema. Si olvidaste tu contraseña, usa la opción '¿Olvidaste tu contraseña?' en la página de inicio de sesión."
    },
    {
      question: "¿Qué hago si encuentro un problema durante el servicio?",
      answer: "Los técnicos pueden reportar impedimentos directamente desde su panel usando el botón 'Reportar Problema'. Esto notificará automáticamente al coordinador de campo para su resolución."
    },
    {
      question: "¿Cómo puedo ver el historial de servicios?",
      answer: "Cada rol tiene acceso a diferentes niveles de historial. Los clientes pueden ver su historial personal, mientras que los agentes y coordinadores tienen acceso a historiales más amplios desde sus respectivos paneles."
    },
    {
      question: "¿Cómo funcionan las notificaciones?",
      answer: "El sistema envía notificaciones automáticas para eventos importantes como nuevas asignaciones, cambios de estado, y confirmaciones de servicio. Puedes ver todas tus notificaciones en tu panel principal."
    }
  ];

  return (
    <Layout role="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayuda e Información</h1>
          <p className="text-muted-foreground">Encuentra respuestas a tus preguntas</p>
        </div>

        <DashboardCard
          title="Acerca del Sistema"
          description="Información general"
          icon={Info}
        >
          <div className="space-y-4">
            <p className="text-sm">
              <strong>Sistema de Gestión de Servicios Técnicos</strong> es una plataforma completa 
              diseñada para coordinar y gestionar servicios técnicos de manera eficiente. 
              El sistema facilita la comunicación entre clientes, agentes de servicio, técnicos 
              y coordinadores de campo.
            </p>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Versión: 1.0.0</p>
              <p className="text-sm font-medium">Última actualización: Enero 2024</p>
              <p className="text-sm font-medium">Soporte: soporte@serviciotecnico.com</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Manual de Usuario"
          description="Guías detalladas de uso"
          icon={BookOpen}
        >
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Descargar Manual Completo (PDF)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Guía Rápida de Inicio
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Tutoriales en Video
            </Button>
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
                <AccordionTrigger className="text-left">
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Si no encuentras la respuesta que buscas, nuestro equipo de soporte está disponible para ayudarte.
            </p>
            <Button className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Mensaje al Soporte
            </Button>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
