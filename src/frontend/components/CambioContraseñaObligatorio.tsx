import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cambiarContraseña } from "@/backend/services/authService";
import { useToast } from "@/frontend/context/ToastContext";
import { useAuth } from "@/frontend/context/AuthContext";
import { supabase } from "@/backend/config/supabaseClient";

interface CambioContraseñaObligatorioProps {
  open: boolean;
  onSuccess: () => void;
}

export default function CambioContraseñaObligatorio({
  open,
  onSuccess,
}: CambioContraseñaObligatorioProps) {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [formData, setFormData] = useState({
    contraseñaActual: "",
    nuevaContraseña: "",
    confirmarContraseña: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.contraseñaActual) {
      nuevosErrores.contraseñaActual = "La contraseña actual es requerida";
    }

    if (!formData.nuevaContraseña) {
      nuevosErrores.nuevaContraseña = "La nueva contraseña es requerida";
    } else if (formData.nuevaContraseña.length < 6) {
      nuevosErrores.nuevaContraseña = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.confirmarContraseña) {
      nuevosErrores.confirmarContraseña = "Debes confirmar la nueva contraseña";
    } else if (formData.nuevaContraseña !== formData.confirmarContraseña) {
      nuevosErrores.confirmarContraseña = "Las contraseñas no coinciden";
    }

    if (formData.contraseñaActual === formData.nuevaContraseña) {
      nuevosErrores.nuevaContraseña = "La nueva contraseña debe ser diferente a la actual";
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    if (!usuario) {
      error("Error", "No se encontró información del usuario");
      return;
    }

    setCargando(true);
    try {
      console.log('🔄 Iniciando cambio de contraseña...', {
        usuarioId: usuario.id_usuario,
        tipoId: typeof usuario.id_usuario
      });

      await cambiarContraseña(
        String(usuario.id_usuario), // Asegurar que sea string
        formData.contraseñaActual,
        formData.nuevaContraseña
      );

      console.log('✅ Contraseña cambiada exitosamente');

      success(
        "Contraseña actualizada",
        "Tu contraseña ha sido actualizada exitosamente. Ya puedes usar el sistema normalmente."
      );

      // Limpiar formulario
      setFormData({
        contraseñaActual: "",
        nuevaContraseña: "",
        confirmarContraseña: "",
      });

      // Recargar usuario desde la BD para obtener la versión actualizada
      console.log('🔄 Recargando usuario desde BD...', usuario.id_usuario);
      
      const { data: usuarioActualizado, error: reloadError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', usuario.id_usuario)
        .single();

      if (reloadError || !usuarioActualizado) {
        console.error('⚠️ Error recargando usuario:', reloadError);
        // Aún así continuar, pero usar datos locales
        const usuarioLocal = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
        usuarioLocal.requiere_cambio_contraseña = false;
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioLocal));
        console.log('✅ Usuario actualizado en localStorage (fallback)');
      } else {
        // Actualizar con datos de la BD
        console.log('✅ Usuario recargado desde BD:', usuarioActualizado);
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActualizado));
      }

      console.log('🔄 Llamando onSuccess...');
      onSuccess();
      console.log('✅ onSuccess ejecutado');
    } catch (err: any) {
      console.error("Error cambiando contraseña:", err);
      error("Error", err.message || "No se pudo cambiar la contraseña");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Cambio de Contraseña Requerido
          </DialogTitle>
          <DialogDescription>
            Por seguridad, debes cambiar tu contraseña antes de continuar usando el sistema.
          </DialogDescription>
        </DialogHeader>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta es la primera vez que inicias sesión o tu contraseña ha sido restablecida.
            Por favor, establece una nueva contraseña segura.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contraseñaActual">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="contraseñaActual"
                type={mostrarActual ? "text" : "password"}
                placeholder="Ingresa tu contraseña temporal"
                value={formData.contraseñaActual}
                onChange={(e) => handleChange("contraseñaActual", e.target.value)}
                className={errors.contraseñaActual ? "border-red-500" : ""}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setMostrarActual(!mostrarActual)}
              >
                {mostrarActual ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.contraseñaActual && (
              <p className="text-sm text-red-500">{errors.contraseñaActual}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevaContraseña">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="nuevaContraseña"
                type={mostrarNueva ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.nuevaContraseña}
                onChange={(e) => handleChange("nuevaContraseña", e.target.value)}
                className={errors.nuevaContraseña ? "border-red-500" : ""}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setMostrarNueva(!mostrarNueva)}
              >
                {mostrarNueva ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.nuevaContraseña && (
              <p className="text-sm text-red-500">{errors.nuevaContraseña}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarContraseña">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmarContraseña"
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={formData.confirmarContraseña}
                onChange={(e) => handleChange("confirmarContraseña", e.target.value)}
                className={errors.confirmarContraseña ? "border-red-500" : ""}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
              >
                {mostrarConfirmar ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmarContraseña && (
              <p className="text-sm text-red-500">{errors.confirmarContraseña}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Actualizando..." : "Cambiar Contraseña"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

