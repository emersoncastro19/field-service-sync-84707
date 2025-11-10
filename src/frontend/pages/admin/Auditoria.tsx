import { useState, useEffect } from "react";
import Layout from "@/frontend/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Badge } from "@/frontend/components/ui/badge";
import { Shield, Download, Search, Calendar } from "lucide-react";
import { supabase } from "@/backend/config/supabaseClient";
import { useToast } from "@/frontend/context/ToastContext";

interface LogAuditoria {
  id_log: number;
  accion: string;
  descripcion: string;
  timestamp: string;
  usuario: {
    nombre_completo: string;
    email: string;
  };
}

export default function Auditoria() {
  const { error } = useToast();
  
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    usuario: '',
    modulo: '',
    fecha: ''
  });

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    try {
      setCargando(true);

      // Cargar logs con información del usuario
      const { data: logsData, error: logsError } = await supabase
        .from('logs_auditoria')
        .select(`
          id_log,
          accion,
          descripcion,
          timestamp,
          usuarios!inner (
            nombre_completo,
            email
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Transformar datos
      const logsFormateados = logsData.map((log: any) => ({
        id_log: log.id_log,
        accion: log.accion,
        descripcion: log.descripcion,
        timestamp: log.timestamp,
        usuario: log.usuarios
      }));

      setLogs(logsFormateados);

    } catch (err: any) {
      console.error('Error cargando logs:', err);
      error('Error', 'No se pudieron cargar los logs de auditoría');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    const eventosHoy = logs.filter(log => 
      log.timestamp.startsWith(hoy)
    ).length;
    
    const accesosExitosos = logs.filter(log => 
      log.accion.includes('LOGIN') && log.accion.includes('exitosa')
    ).length;
    
    const intentosFallidos = logs.filter(log => 
      log.accion.includes('FALLIDO') || log.accion.includes('ERROR')
    ).length;
    
    const cambiosSistema = logs.filter(log => 
      log.accion.includes('CREAR') || log.accion.includes('ACTUALIZAR') || log.accion.includes('ELIMINAR')
    ).length;

    return {
      eventosHoy,
      accesosExitosos,
      intentosFallidos,
      cambiosSistema
    };
  };

  const handleFiltrar = () => {
    // Aquí se implementaría el filtrado avanzado si se requiere
    cargarLogs();
  };

  const exportarLogs = () => {
    // Crear CSV
    const headers = ['Fecha/Hora', 'Usuario', 'Acción', 'Descripción'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('es-VE'),
      log.usuario.nombre_completo,
      log.accion,
      log.descripcion
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = cargarEstadisticas();

  if (cargando) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando auditoría...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditoría del Sistema</h1>
            <p className="text-muted-foreground mt-2">
              Logs y reportes de actividad del sistema ({logs.length} registros)
            </p>
          </div>
          <Button onClick={exportarLogs}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        {/* Cards de Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Eventos Hoy</p>
              <p className="text-2xl font-bold">{stats.eventosHoy}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Search className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Accesos Exitosos</p>
              <p className="text-2xl font-bold">{stats.accesosExitosos}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Shield className="h-8 w-8 mb-2 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Intentos Fallidos</p>
              <p className="text-2xl font-bold">{stats.intentosFallidos}</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <Calendar className="h-8 w-8 mb-2 text-secondary" />
              <p className="text-sm font-medium text-muted-foreground">Cambios Sistema</p>
              <p className="text-2xl font-bold">{stats.cambiosSistema}</p>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
            <CardDescription>Filtra los logs de auditoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Input
                  placeholder="Buscar usuario..."
                  value={filtros.usuario}
                  onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Select value={filtros.modulo} onValueChange={(value) => setFiltros({...filtros, modulo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Autenticación">Autenticación</SelectItem>
                    <SelectItem value="Usuarios">Usuarios</SelectItem>
                    <SelectItem value="Órdenes">Órdenes</SelectItem>
                    <SelectItem value="Configuración">Configuración</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filtros.fecha}
                  onChange={(e) => setFiltros({...filtros, fecha: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleFiltrar}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Registro de Actividad
            </CardTitle>
            <CardDescription>Logs recientes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Fecha/Hora</th>
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Acción</th>
                    <th className="text-left py-3 px-4 font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id_log} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(log.timestamp).toLocaleString('es-VE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className="font-medium">{log.usuario.nombre_completo}</p>
                          <p className="text-xs text-muted-foreground">{log.usuario.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline">{log.accion}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {log.descripcion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {logs.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay logs de auditoría aún</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
