import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Progress } from '@/frontend/components/ui/progress';
import { Badge } from '@/frontend/components/ui/badge';
import { Alert, AlertDescription } from '@/frontend/components/ui/alert';
import { 
  calcularUsoRestante, 
  ejemploUsoActual, 
  FREE_PLAN_LIMITS,
  formatearGB,
  obtenerColorEstado,
  obtenerEstadoUso,
  type UsageCurrent
} from '@/shared/utils/supabaseUsage';
import { Database, Upload, HardDrive, Zap, Radio, AlertTriangle } from 'lucide-react';

/**
 * Componente para monitorear el uso de Supabase
 * Muestra cuánto uso queda del plan Free
 * 
 * NOTA: Los valores de uso deben actualizarse manualmente desde el dashboard de Supabase
 * o puedes implementar una API para obtenerlos automáticamente
 */
export default function SupabaseUsageMonitor() {
  // Usar los valores actuales (puedes actualizarlos manualmente en supabaseUsage.ts)
  const usoActual = ejemploUsoActual;
  
  // Calcular uso restante
  const usoRestante = calcularUsoRestante(usoActual);

  // Verificar si hay alguna métrica cerca del límite
  const metricasCriticas = [
    { nombre: 'Database Size', porcentaje: usoRestante.percentages.databaseSize, usado: usoActual.databaseSize, limite: FREE_PLAN_LIMITS.databaseSize },
    { nombre: 'Egress', porcentaje: usoRestante.percentages.egress, usado: usoActual.egress, limite: FREE_PLAN_LIMITS.egress },
    { nombre: 'Storage', porcentaje: usoRestante.percentages.storageSize, usado: usoActual.storageSize, limite: FREE_PLAN_LIMITS.storageSize },
  ].filter(m => obtenerEstadoUso(m.porcentaje) !== 'ok');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Uso de Supabase (Plan Free)
        </CardTitle>
        <CardDescription>
          Monitoreo del uso actual y disponible de recursos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Advertencia si hay métricas críticas */}
        {metricasCriticas.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atención:</strong> {metricasCriticas.length} métrica(s) cerca del límite.
              Considera actualizar tu plan si el uso continúa creciendo.
            </AlertDescription>
          </Alert>
        )}

        {/* Información sobre el plan y ciclo */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Plan:</strong> Free Plan | <strong>Ciclo:</strong> 20 Oct - 20 Nov 2025
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Los valores se actualizaron el 08 Nov 2025 desde el dashboard de Supabase.
                Para valores más recientes, visita el{' '}
                <a 
                  href="https://app.supabase.com/project/_/settings/usage" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Dashboard de Supabase
                </a>
                .
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t">
                <strong>Limitaciones del plan Free:</strong> Los proyectos gratuitos se pausan después de 1 semana de inactividad. 
                Límite de 2 proyectos activos.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Database Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Tamaño de Base de Datos</span>
            </div>
            <Badge variant={obtenerEstadoUso(usoRestante.percentages.databaseSize) === 'critico' ? 'destructive' : 'secondary'}>
              {formatearGB(usoRestante.databaseSize)} restantes
            </Badge>
          </div>
          <Progress value={usoRestante.percentages.databaseSize} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Usado: {formatearGB(usoActual.databaseSize)}</span>
            <span>Límite: {formatearGB(FREE_PLAN_LIMITS.databaseSize)}</span>
            <span className={obtenerColorEstado(usoRestante.percentages.databaseSize)}>
              {usoRestante.percentages.databaseSize}% disponible
            </span>
          </div>
        </div>

        {/* Egress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-600" />
              <span className="font-medium">Egress (Tráfico de Salida)</span>
            </div>
            <Badge variant={obtenerEstadoUso(usoRestante.percentages.egress) === 'critico' ? 'destructive' : 'secondary'}>
              {formatearGB(usoRestante.egress)} restantes
            </Badge>
          </div>
          <Progress value={usoRestante.percentages.egress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Usado: {formatearGB(usoActual.egress)}</span>
            <span>Límite: {formatearGB(FREE_PLAN_LIMITS.egress)}</span>
            <span className={obtenerColorEstado(usoRestante.percentages.egress)}>
              {usoRestante.percentages.egress}% disponible
            </span>
          </div>
        </div>

        {/* Storage Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Almacenamiento</span>
            </div>
            <Badge variant={obtenerEstadoUso(usoRestante.percentages.storageSize) === 'critico' ? 'destructive' : 'secondary'}>
              {formatearGB(usoRestante.storageSize)} restantes
            </Badge>
          </div>
          <Progress value={usoRestante.percentages.storageSize} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Usado: {formatearGB(usoActual.storageSize)}</span>
            <span>Límite: {formatearGB(FREE_PLAN_LIMITS.storageSize)}</span>
            <span className={obtenerColorEstado(usoRestante.percentages.storageSize)}>
              {usoRestante.percentages.storageSize}% disponible
            </span>
          </div>
        </div>

        {/* Edge Functions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Edge Functions</span>
            </div>
            <Badge variant={obtenerEstadoUso(usoRestante.percentages.edgeFunctions) === 'critico' ? 'destructive' : 'secondary'}>
              {usoRestante.edgeFunctions.toLocaleString()} restantes
            </Badge>
          </div>
          <Progress value={usoRestante.percentages.edgeFunctions} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Usado: {usoActual.edgeFunctions.toLocaleString()} invocations</span>
            <span>Límite: {FREE_PLAN_LIMITS.edgeFunctions.toLocaleString()}/mes</span>
            <span className={obtenerColorEstado(usoRestante.percentages.edgeFunctions)}>
              {usoRestante.percentages.edgeFunctions}% disponible
            </span>
          </div>
          <div className="text-xs text-muted-foreground pt-1">
            Distribución: 03 Nov (10), 05 Nov (7), 06 Nov (3)
          </div>
        </div>

        {/* API Requests - Ilimitado en plan Free */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-600" />
              <span className="font-medium">API Requests</span>
            </div>
            <Badge variant="secondary">
              Ilimitado
            </Badge>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              El plan Free incluye <strong>Unlimited API requests</strong>. No hay límite en el número de solicitudes.
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Plan Actual</p>
              <p className="font-semibold">Free Plan</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ciclo de Facturación</p>
              <p className="font-semibold">20 Oct - 20 Nov 2025</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground"><strong>Detalles del uso:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Database: 25.79 MB de 500 MB (94.84% disponible)</li>
                <li>Egress: 0.006 GB de 5 GB (99.88% disponible)</li>
                <li>Storage: 0 GB de 1 GB (100% disponible)</li>
                <li>Edge Functions: 20 de 500,000 (99.996% disponible)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón para actualizar */}
        <div className="pt-2">
          <a
            href="https://app.supabase.com/project/_/settings/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Ver uso actualizado en Supabase Dashboard →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

