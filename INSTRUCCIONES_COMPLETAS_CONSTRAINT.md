# Instrucciones Completas: Crear Constraint estado_resultado

## Problema

El error `violates check constraint "ejecuciones_servicio_estado_resultado_check"` indica que el valor usado para `estado_resultado` no es válido según el constraint CHECK de la base de datos.

## Solución Paso a Paso

### Paso 1: Ejecutar el Script de Verificación

Ejecuta este SQL en Supabase para ver todos los constraints:

```sql
-- Ver TODOS los constraints CHECK de la tabla
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;
```

### Paso 2: Ejecutar el Script de Creación

Ejecuta el archivo `CREAR_CONSTRAINT_ESTADO_RESULTADO.sql` completo, o copia y pega esto:

```sql
-- Eliminar constraint existente (si existe)
DO $$ 
DECLARE
    constraint_name_var TEXT;
BEGIN
    FOR constraint_name_var IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'ejecuciones_servicio'::regclass 
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%estado_resultado%'
            OR conname LIKE '%estado_resultado%'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE ejecuciones_servicio DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name_var);
    END LOOP;
END $$;

-- Crear nuevo constraint permisivo
ALTER TABLE ejecuciones_servicio
ADD CONSTRAINT ejecuciones_servicio_estado_resultado_check
CHECK (
    estado_resultado IS NULL 
    OR estado_resultado = 'Pendiente'
    OR estado_resultado = 'Completado'
    OR estado_resultado = 'Completada'
    OR estado_resultado = 'Cancelado'
    OR estado_resultado = 'Cancelada'
);
```

### Paso 3: Verificar que se Creó

Ejecuta esto para verificar:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';
```

**Deberías ver un resultado con:**
- `constraint_name`: `ejecuciones_servicio_estado_resultado_check`
- `constraint_definition`: `CHECK ((estado_resultado IS NULL) OR (estado_resultado = 'Pendiente'::text) OR ...)`

### Paso 4: Probar el Sistema

1. Ve a tu aplicación
2. Inicia sesión como técnico
3. Intenta "Iniciar Trabajo" en una orden
4. Verifica que no haya errores
5. Revisa la consola del navegador (F12) para ver los logs

## Si Sigue Sin Funcionar

### Verificar la Estructura de la Tabla

```sql
-- Ver la estructura completa de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'ejecuciones_servicio'
ORDER BY ordinal_position;
```

### Verificar Políticas RLS

```sql
-- Ver políticas RLS para ejecuciones_servicio
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'ejecuciones_servicio';
```

Si no hay políticas, créalas con:

```sql
-- Crear políticas RLS permisivas
CREATE POLICY "Permitir insertar ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir ver ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir actualizar ejecuciones (desarrollo)"
ON ejecuciones_servicio
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

## Archivos Disponibles

- `CREAR_CONSTRAINT_ESTADO_RESULTADO.sql` - Script completo para crear el constraint
- `VERIFICAR_CONSTRAINT_ESTADO_RESULTADO.sql` - Script para verificar constraints
- `SOLUCION_DEFINITIVA_ESTADO_RESULTADO.sql` - Solución alternativa
- `INSTRUCCIONES_COMPLETAS_CONSTRAINT.md` - Este archivo

## Nota Importante

Después de ejecutar el script, el constraint permitirá:
- `estado_resultado = NULL` (al iniciar trabajo)
- `estado_resultado = 'Pendiente'` (al iniciar trabajo)
- `estado_resultado = 'Completado'` (al finalizar trabajo)

Esto debería resolver el error y permitir que el sistema funcione correctamente.

