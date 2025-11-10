# 🔍 Verificación de Notificaciones

## Problemas Identificados

1. **Las notificaciones no se están generando en Supabase**
2. **Las notificaciones no aparecen en el panel de notificaciones**

## Soluciones Implementadas

### 1. ✅ Panel del Técnico Actualizado
- Se actualizó `src/frontend/pages/Tecnico.tsx` para cargar órdenes reales desde la base de datos
- Ahora muestra las órdenes asignadas al técnico (estados: Asignada, En Proceso)
- Muestra información de citas programadas

### 2. ✅ Mejoras en la Inserción de Notificaciones
- Se mejoró el código en `src/frontend/pages/coordinador/AsignarOrdenes.tsx`
- Ahora intenta insertar todas las notificaciones de una vez (más eficiente)
- Si falla, intenta insertar una por una con mejor manejo de errores
- Se agregaron logs detallados para debugging

## Verificaciones Necesarias en Supabase

### 1. Verificar que la Tabla `notificaciones` Existe

Ejecuta esta query en el SQL Editor de Supabase:

```sql
SELECT * FROM notificaciones LIMIT 1;
```

Si no existe, crea la tabla con esta estructura:

```sql
CREATE TABLE notificaciones (
  id_notificacion SERIAL PRIMARY KEY,
  id_orden INTEGER REFERENCES ordenes_servicio(id_orden),
  id_destinatario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  tipo_notificacion VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  canal VARCHAR(50) DEFAULT 'Sistema_Interno',
  fecha_enviada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_notificaciones_destinatario ON notificaciones(id_destinatario);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(fecha_enviada DESC);
```

### 2. Verificar Políticas RLS (Row Level Security)

Las políticas RLS deben permitir:
- **INSERT**: Los usuarios autenticados pueden insertar notificaciones
- **SELECT**: Los usuarios solo pueden ver sus propias notificaciones
- **UPDATE**: Los usuarios solo pueden actualizar sus propias notificaciones (marcar como leídas)

Ejecuta estas políticas:

```sql
-- Habilitar RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política para INSERT: Permitir que cualquier usuario autenticado inserte notificaciones
CREATE POLICY "Usuarios pueden insertar notificaciones"
  ON notificaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para SELECT: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones
  FOR SELECT
  TO authenticated
  USING (id_destinatario = auth.uid()::text::integer OR 
         id_destinatario IN (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text::integer));

-- Política para UPDATE: Los usuarios solo pueden actualizar sus propias notificaciones
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON notificaciones
  FOR UPDATE
  TO authenticated
  USING (id_destinatario = auth.uid()::text::integer OR 
         id_destinatario IN (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text::integer))
  WITH CHECK (id_destinatario = auth.uid()::text::integer OR 
              id_destinatario IN (SELECT id_usuario FROM usuarios WHERE id_usuario = auth.uid()::text::integer));
```

**NOTA**: Ajusta las políticas según tu sistema de autenticación. Si usas `auth.uid()` directamente, las políticas serían:

```sql
-- Política para SELECT (si id_destinatario coincide con auth.uid())
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones
  FOR SELECT
  TO authenticated
  USING (
    id_destinatario IN (
      SELECT id_usuario FROM usuarios 
      WHERE id_usuario::text = auth.uid()::text
    )
  );
```

### 3. Verificar que los IDs de Usuario Existen

Asegúrate de que:
- Los clientes tengan `id_usuario` en la tabla `clientes`
- Los técnicos tengan `id_usuario` en la tabla `tecnicos`
- Estos `id_usuario` correspondan a usuarios reales en la tabla `usuarios`

Verifica con estas queries:

```sql
-- Verificar clientes sin id_usuario
SELECT id_cliente, id_usuario FROM clientes WHERE id_usuario IS NULL;

-- Verificar técnicos sin id_usuario
SELECT id_tecnico, id_usuario FROM tecnicos WHERE id_usuario IS NULL;

-- Verificar que los id_usuario existan en la tabla usuarios
SELECT c.id_cliente, c.id_usuario, u.id_usuario as usuario_existe
FROM clientes c
LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
WHERE c.id_usuario IS NOT NULL AND u.id_usuario IS NULL;
```

### 4. Probar la Inserción Manual

Ejecuta esta query para probar si puedes insertar una notificación:

```sql
-- Insertar una notificación de prueba
INSERT INTO notificaciones (
  id_destinatario,
  tipo_notificacion,
  mensaje,
  canal,
  leida
) VALUES (
  (SELECT id_usuario FROM usuarios LIMIT 1), -- Cambia por un ID de usuario real
  'Prueba',
  'Esta es una notificación de prueba',
  'Sistema_Interno',
  false
);

-- Verificar que se insertó
SELECT * FROM notificaciones ORDER BY fecha_enviada DESC LIMIT 5;
```

## Debugging

### 1. Ver Logs en la Consola del Navegador

Cuando asignas un técnico, revisa la consola del navegador (F12) y busca:
- `📤 Intentando insertar X notificaciones...`
- `✅ Notificación insertada exitosamente`
- `❌ Error insertando notificación`

### 2. Verificar en Supabase

Después de asignar un técnico:
1. Ve al SQL Editor de Supabase
2. Ejecuta: `SELECT * FROM notificaciones ORDER BY fecha_enviada DESC LIMIT 10;`
3. Verifica si se insertaron las notificaciones

### 3. Verificar Permisos

Si ves errores de permisos (código `PGRST116` o mensajes sobre permisos):
1. Verifica que las políticas RLS estén correctamente configuradas
2. Verifica que el usuario esté autenticado correctamente
3. Verifica que `auth.uid()` devuelva el ID correcto

## Flujo de Notificaciones

1. **Coordinador asigna técnico** → Se crean 2 notificaciones:
   - Una para el cliente: "Cita Programada"
   - Una para el técnico: "Asignación de Orden"

2. **Técnico completa trabajo** → Se crea 1 notificación:
   - Para el cliente: "Servicio Completado"

3. **Cliente confirma servicio** → Se crea 1 notificación:
   - Para el técnico: "Confirmación de Servicio"

4. **Cliente rechaza servicio** → Se crean 2 notificaciones:
   - Para el coordinador: "Servicio Rechazado"
   - Para el técnico: "Servicio Rechazado"

## Próximos Pasos

1. ✅ Verificar que la tabla `notificaciones` existe
2. ✅ Verificar y corregir las políticas RLS
3. ✅ Verificar que los `id_usuario` sean correctos
4. ✅ Probar la inserción manual de notificaciones
5. ✅ Asignar un técnico y verificar que se creen las notificaciones
6. ✅ Verificar que las notificaciones aparezcan en el panel

## Notas Importantes

- Las notificaciones se recargan automáticamente cada 30 segundos
- Las notificaciones se recargan cuando abres el panel de notificaciones
- El componente `NotificationBell` está en `src/frontend/components/NotificationBell.tsx`
- Las notificaciones se insertan desde `src/frontend/pages/coordinador/AsignarOrdenes.tsx`

