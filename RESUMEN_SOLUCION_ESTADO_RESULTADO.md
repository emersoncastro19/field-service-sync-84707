# Resumen: Solución Error estado_resultado

## Problema

Error: `violates check constraint "ejecuciones_servicio_estado_resultado_check" (23514)`

El constraint CHECK de la columna `estado_resultado` en la tabla `ejecuciones_servicio` no acepta el valor `'En Proceso'` que el código intentaba usar.

## Solución

### 1. Código Corregido ✅

El código ahora:
- ✅ No usa `'En Proceso'` en `estado_resultado`
- ✅ Intenta insertar con `NULL` primero
- ✅ Si falla, intenta con `'Pendiente'`
- ✅ Muestra errores detallados en la consola

### 2. SQL para Ejecutar en Supabase

Ejecuta el archivo `EJECUTAR_ESTE_SQL.sql` completo en Supabase, o copia esto:

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

-- Verificar que se creó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_estado_resultado_check';
```

### 3. Verificar Resultado

Después de ejecutar el SQL, deberías ver:
- **1 fila** con el constraint creado
- `constraint_name`: `ejecuciones_servicio_estado_resultado_check`
- `constraint_definition`: `CHECK ((estado_resultado IS NULL) OR ...)`

## Prueba el Sistema

1. Ejecuta el SQL en Supabase
2. Verifica que el constraint se creó (deberías ver 1 fila en el resultado)
3. Ve a tu aplicación
4. Inicia sesión como técnico
5. Intenta "Iniciar Trabajo"
6. Revisa la consola (F12) - debería funcionar correctamente

## Valores Válidos para estado_resultado

Después de ejecutar el SQL, estos valores serán válidos:
- `NULL` (al iniciar trabajo)
- `'Pendiente'` (al iniciar trabajo)
- `'Completado'` (al finalizar trabajo)
- `'Completada'` (alternativa)
- `'Cancelado'` / `'Cancelada'` (si se cancela)

## Archivos Disponibles

- `EJECUTAR_ESTE_SQL.sql` - Script completo para ejecutar
- `CREAR_CONSTRAINT_ESTADO_RESULTADO.sql` - Script alternativo
- `INSTRUCCIONES_COMPLETAS_CONSTRAINT.md` - Instrucciones detalladas
- `RESUMEN_SOLUCION_ESTADO_RESULTADO.md` - Este archivo

## Nota Importante

Si después de ejecutar el SQL aún ves "No rows returned" en la verificación, significa que:
1. El constraint no se creó (verifica que no haya errores en el SQL)
2. O el nombre del constraint es diferente

En ese caso, ejecuta esto para ver TODOS los constraints:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;
```

Esto te mostrará todos los constraints CHECK de la tabla, y podrás ver si el nuevo constraint se creó correctamente.

