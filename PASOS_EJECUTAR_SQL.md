# Pasos para Ejecutar el SQL Correctamente

## Importante

El mensaje "Success. No rows returned" significa que el SELECT no encontró ningún constraint con ese nombre. **Esto es normal** si el constraint no existe aún.

## Pasos a Seguir

### Paso 1: Ejecutar el Bloque DO (Eliminar Constraints)

Ejecuta esta parte primero en Supabase SQL Editor:

```sql
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
        RAISE NOTICE 'Constraint eliminado: %', constraint_name_var;
    END LOOP;
END $$;
```

**Resultado esperado:** "Success" (puede o no mostrar mensajes, dependiendo de si había constraints)

### Paso 2: Crear el Nuevo Constraint (IMPORTANTE)

Ejecuta esta parte para **CREAR** el constraint:

```sql
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

**Resultado esperado:** "Success"

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

**Resultado esperado:** **1 fila** con:
- `constraint_name`: `ejecuciones_servicio_estado_resultado_check`
- `constraint_definition`: `CHECK ((estado_resultado IS NULL) OR ...)`

## Si el Paso 3 Muestra "No rows returned"

Significa que el constraint **no se creó**. Posibles causas:

1. **Error al ejecutar el Paso 2**: Verifica que no haya errores en la consola de Supabase
2. **Permisos insuficientes**: Asegúrate de tener permisos para modificar la tabla
3. **Nombre del constraint diferente**: Ejecuta esto para ver TODOS los constraints:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
ORDER BY conname;
```

## Solución Alternativa: Script Más Simple

Si el bloque DO no funciona, ejecuta esto directamente:

```sql
-- Eliminar constraint (si existe con este nombre exacto)
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- Crear nuevo constraint
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

-- Verificar
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname = 'ejecuciones_servicio_estado_resultado_check';
```

## Después de Ejecutar el SQL

1. ✅ Verifica que el Paso 3 muestre **1 fila** (el constraint creado)
2. ✅ Ve a tu aplicación
3. ✅ Intenta "Iniciar Trabajo" como técnico
4. ✅ Revisa la consola del navegador (F12) - debería funcionar

## Archivos Disponibles

- `EJECUTAR_COMPLETO.sql` - Script completo paso a paso
- `EJECUTAR_ESTE_SQL.sql` - Script alternativo
- `PASOS_EJECUTAR_SQL.md` - Este archivo


