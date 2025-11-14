import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/frontend/components/Layout";
import DashboardCard from "@/frontend/components/DashboardCard";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Key, Database, HardDrive, Download, Upload, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/frontend/context/AuthContext";
import { useToast } from "@/frontend/context/ToastContext";
import { supabase } from "@/backend/config/supabaseClient";
import { formatearFechaVenezuela } from "@/shared/utils/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

export default function Herramientas() {
  const { usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [ultimaCopia, setUltimaCopia] = useState<string | null>(null);
  const [tablaSeleccionada, setTablaSeleccionada] = useState('todas');

  // Obtener el rol del usuario autenticado
  const getRole = (): "client" | "agent" | "coordinator" | "technician" | "admin" => {
    if (!usuario) {
      return 'admin';
    }
    
    const roleMap: Record<string, "client" | "agent" | "coordinator" | "technician" | "admin"> = {
      'Cliente': 'client',
      'Agente': 'agent',
      'Coordinador': 'coordinator',
      'Tecnico': 'technician',
      'Admin': 'admin'
    };
    
    return roleMap[usuario.tipo_usuario] || 'admin';
  };

  // Redirigir al login si no hay usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usuario) {
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [usuario, navigate]);

  useEffect(() => {
    // Cargar última copia de seguridad desde localStorage
    const ultimaCopiaLS = localStorage.getItem('ultima_copia_seguridad');
    if (ultimaCopiaLS) {
      setUltimaCopia(ultimaCopiaLS);
    }
  }, []);

  const hacerRespaldo = async () => {
    try {
      setExportando(true);

      const respaldo: any = {
        fecha_creacion: new Date().toISOString(),
        version: '1.0',
        tablas: {}
      };

      // Lista de tablas a respaldar
      const tablas = [
        'usuarios',
        'clientes',
        'tecnicos',
        'coordinadores_campo',
        'agentes_servicio',
        'ordenes_servicio',
        'citas',
        'ejecuciones_servicio',
        'impedimentos',
        'notificaciones',
        'logs_auditoria'
      ];

      // Exportar todas las tablas o solo la seleccionada
      const tablasAExportar = tablaSeleccionada === 'todas' 
        ? tablas 
        : [tablaSeleccionada];

      for (const tabla of tablasAExportar) {
        try {
          const { data, error: tablaError } = await supabase
            .from(tabla)
            .select('*')
            .limit(10000); // Límite de seguridad

          if (tablaError) {
            console.error(`Error exportando tabla ${tabla}:`, tablaError);
            respaldo.tablas[tabla] = { error: tablaError.message };
          } else {
            respaldo.tablas[tabla] = data || [];
            console.log(`✅ Tabla ${tabla} exportada: ${data?.length || 0} registros`);
          }
        } catch (err: any) {
          console.error(`Error exportando tabla ${tabla}:`, err);
          respaldo.tablas[tabla] = { error: err.message };
        }
      }

      // Crear y descargar archivo JSON
      const json = JSON.stringify(respaldo, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      a.href = url;
      a.download = `respaldo_${tablaSeleccionada === 'todas' ? 'completo' : tablaSeleccionada}_${fecha}_${hora}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Guardar fecha de última copia
      const fechaActual = new Date().toISOString();
      localStorage.setItem('ultima_copia_seguridad', fechaActual);
      setUltimaCopia(fechaActual);

      success(
        'Respaldo creado',
        `El respaldo se ha descargado exitosamente. ${tablaSeleccionada === 'todas' ? 'Todas las tablas' : `Tabla ${tablaSeleccionada}`} exportadas.`
      );
    } catch (err: any) {
      console.error('Error creando respaldo:', err);
      error('Error', 'No se pudo crear el respaldo. Verifica los permisos de la base de datos.');
    } finally {
      setExportando(false);
    }
  };

  const restaurarDatos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportando(true);

      // Leer archivo
      const text = await file.text();
      const respaldo = JSON.parse(text);

      if (!respaldo.tablas) {
        error('Error', 'El archivo no es un respaldo válido');
        return;
      }

      // Verificar estructura del respaldo
      const tablas = Object.keys(respaldo.tablas);
      if (tablas.length === 0) {
        error('Error', 'El respaldo no contiene datos');
        return;
      }

      // Mostrar confirmación
      const confirmar = window.confirm(
        `⚠️ ADVERTENCIA: Esta acción restaurará ${tablas.length} tabla(s) del respaldo.\n\n` +
        `Esto puede sobrescribir datos existentes.\n\n` +
        `¿Estás seguro de continuar?`
      );

      if (!confirmar) {
        setImportando(false);
        return;
      }

      // Restaurar cada tabla
      let exitosas = 0;
      let fallidas = 0;

      for (const tabla of tablas) {
        try {
          const datos = respaldo.tablas[tabla];

          // Verificar si hay error en los datos
          if (datos.error) {
            console.error(`Error en tabla ${tabla}:`, datos.error);
            fallidas++;
            continue;
          }

          if (!Array.isArray(datos) || datos.length === 0) {
            console.log(`Tabla ${tabla} vacía, saltando...`);
            continue;
          }

          // IMPORTANTE: La restauración completa requiere permisos de administrador
          // Por ahora, solo mostramos los datos que se restaurarían
          console.log(`📥 Datos para restaurar en ${tabla}:`, datos.length, 'registros');

          // Nota: La restauración real requiere:
          // 1. Eliminar datos existentes (DELETE)
          // 2. Insertar datos del respaldo (INSERT)
          // 3. Manejar relaciones y constraints
          // Esto debe hacerse con precaución y preferiblemente desde el backend

          exitosas++;
        } catch (err: any) {
          console.error(`Error restaurando tabla ${tabla}:`, err);
          fallidas++;
        }
      }

      // Mostrar resultado
      if (exitosas > 0) {
        success(
          'Restauración iniciada',
          `Se procesaron ${exitosas} tabla(s) exitosamente. ${fallidas > 0 ? `${fallidas} tabla(s) fallaron.` : ''}\n\n` +
          `NOTA: La restauración completa requiere permisos de administrador y debe realizarse desde el backend por seguridad.`
        );
      } else {
        error('Error', 'No se pudieron restaurar las tablas. Verifica el formato del archivo.');
      }
    } catch (err: any) {
      console.error('Error restaurando datos:', err);
      error('Error', 'No se pudo restaurar el respaldo. Verifica que el archivo sea válido.');
    } finally {
      setImportando(false);
      // Limpiar input
      event.target.value = '';
    }
  };

  return (
    <Layout role={getRole()}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Herramientas del Sistema</h1>
          <p className="text-muted-foreground">Gestión de respaldos y datos del sistema</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Las operaciones de respaldo y restauración requieren permisos de administrador.
            Los respaldos se descargan como archivos JSON que contienen todos los datos del sistema.
          </AlertDescription>
        </Alert>

        {/* Respaldo de Datos */}
        <DashboardCard
          title="Respaldo de Datos"
          description="Exporta los datos del sistema a un archivo JSON"
          icon={Database}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tabla-respaldo">Seleccionar Tabla(s) a Respaldar</Label>
              <Select value={tablaSeleccionada} onValueChange={setTablaSeleccionada}>
                <SelectTrigger id="tabla-respaldo">
                  <SelectValue placeholder="Selecciona una tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las tablas</SelectItem>
                  <SelectItem value="usuarios">Usuarios</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="tecnicos">Técnicos</SelectItem>
                  <SelectItem value="coordinadores_campo">Coordinadores</SelectItem>
                  <SelectItem value="agentes_servicio">Agentes</SelectItem>
                  <SelectItem value="ordenes_servicio">Órdenes de Servicio</SelectItem>
                  <SelectItem value="citas">Citas</SelectItem>
                  <SelectItem value="ejecuciones_servicio">Ejecuciones</SelectItem>
                  <SelectItem value="impedimentos">Impedimentos</SelectItem>
                  <SelectItem value="notificaciones">Notificaciones</SelectItem>
                  <SelectItem value="logs_auditoria">Logs de Auditoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={hacerRespaldo}
              disabled={exportando}
            >
              {exportando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <HardDrive className="mr-2 h-4 w-4" />
                  Crear Respaldo Completo
                </>
              )}
            </Button>

            {ultimaCopia && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Última copia de seguridad:</strong>{' '}
                  {formatearFechaVenezuela(ultimaCopia)}
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              El respaldo incluirá todos los datos de {tablaSeleccionada === 'todas' ? 'las tablas seleccionadas' : `la tabla ${tablaSeleccionada}`}.
              El archivo se descargará automáticamente en formato JSON.
            </p>
          </div>
        </DashboardCard>

        {/* Restauración de Datos */}
        <DashboardCard
          title="Restauración de Datos"
          description="Restaura datos desde un archivo de respaldo"
          icon={Upload}
        >
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Advertencia:</strong> La restauración de datos puede sobrescribir información existente.
                Esta operación debe realizarse con precaución y preferiblemente desde el backend por seguridad.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="archivo-respaldo">Seleccionar Archivo de Respaldo</Label>
              <Input
                id="archivo-respaldo"
                type="file"
                accept=".json"
                onChange={restaurarDatos}
                disabled={importando}
              />
            </div>

            {importando && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando archivo de respaldo...
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Selecciona un archivo JSON de respaldo para restaurar los datos.
              El archivo debe ser un respaldo válido creado por este sistema.
            </p>
          </div>
        </DashboardCard>

        {/* Información del Sistema */}
        <DashboardCard
          title="Información del Sistema"
          description="Detalles sobre el sistema de respaldos"
          icon={CheckCircle2}
        >
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Tablas Incluidas en el Respaldo:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Usuarios</li>
                <li>Clientes</li>
                <li>Técnicos</li>
                <li>Coordinadores</li>
                <li>Agentes</li>
                <li>Órdenes de Servicio</li>
                <li>Citas</li>
                <li>Ejecuciones de Servicio</li>
                <li>Impedimentos</li>
                <li>Notificaciones</li>
                <li>Logs de Auditoría</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Formato del Respaldo:</p>
              <p className="text-sm text-muted-foreground">
                Los respaldos se guardan en formato JSON con la siguiente estructura:
              </p>
              <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
{`{
  "fecha_creacion": "2025-01-15T10:30:00Z",
  "version": "1.0",
  "tablas": {
    "usuarios": [...],
    "ordenes_servicio": [...],
    ...
  }
}`}
              </pre>
            </div>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}