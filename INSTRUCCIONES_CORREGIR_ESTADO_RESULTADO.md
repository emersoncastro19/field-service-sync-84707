# Instrucciones: Corregir Error de estado_resultado

## Problema

El error `violates check constraint "ejecuciones_servicio_estado_resultado_check" (23514)` indica que el valor `'En Proceso'` no es válido para la columna `estado_resultado` en la tabla `ejecuciones_servicio`.

## Solución Rápida

### Opción 1: Ejecutar SQL para Corregir el Constraint (RECOMENDADO)

Ejecuta este SQL en Supabase para permitir valores comunes:

```sql
-- Eliminar constraint existente
ALTER TABLE ejecuciones_servicio
DROP CONSTRAINT IF EXISTS ejecuciones_servicio_estado_resultado_check;

-- Crear nuevo constraint que permite NULL y valores comunes
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

### Opción 2: Verificar Valores Válidos Primero

Antes de modificar el constraint, verifica qué valores acepta actualmente:

```sql
-- Ver el constraint actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ejecuciones_servicio'::regclass
AND contype = 'c'
AND conname LIKE '%estado_resultado%';

-- Ver valores existentes en la tabla
SELECT DISTINCT estado_resultado, COUNT(*) as cantidad
FROM ejecuciones_servicio
GROUP BY estado_resultado
ORDER BY estado_resultado;
```

## Cambios en el Código

El código ahora:
1. ✅ Intenta insertar sin `estado_resultado` (NULL)
2. ✅ Si falla, intenta con `estado_resultado = 'Pendiente'`
3. ✅ Muestra errores detallados en la consola
4. ✅ Proporciona instrucciones específicas si hay error de constraint

## Pasos a Seguir

1. **Ejecuta el SQL de la Opción 1** en Supabase para corregir el constraint
2. **Prueba "Iniciar Trabajo"** de nuevo en el sistema
3. **Revisa la consola** (F12) si hay algún error
4. **Verifica en Supabase** que la ejecución se haya creado:

```sql
SELECT * FROM ejecuciones_servicio 
ORDER BY fecha_inicio DESC 
LIMIT 5;
```

## Archivos de Referencia

- `SOLUCION_RAPIDA_ESTADO_RESULTADO.sql` - Script SQL para corregir el constraint
- `VERIFICAR_VALORES_ESTADO_RESULTADO.sql` - Script para verificar valores válidos
- `src/frontend/pages/tecnico/GestionarEjecucion.tsx` - Código corregido

## Nota Importante

Después de ejecutar el SQL, el sistema podrá:
- Crear ejecuciones con `estado_resultado = NULL` (al inicio)
- Crear ejecuciones con `estado_resultado = 'Pendiente'` (al inicio)
- Actualizar a `estado_resultado = 'Completado'` (al finalizar)

Esto es más flexible y permite que el estado se establezca correctamente en cada etapa del proceso.

