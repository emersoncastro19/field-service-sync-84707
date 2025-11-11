# Resumen: Asignación Automática de Coordinador a Técnicos

## 🎯 Objetivo

Asignar automáticamente un coordinador a cada técnico cuando se crea, basándose en la zona de cobertura del técnico y la zona de responsabilidad del coordinador.

## ✅ Cambios Implementados

### 1. **Creación de Técnicos (Admin)**

Cuando se crea un técnico desde el módulo de Administración:

1. Se selecciona la zona de cobertura del técnico
2. El sistema busca automáticamente el coordinador que tiene la misma zona de responsabilidad
3. Se asigna el `id_coordinador_supervisor` al técnico
4. Si no hay coordinador con esa zona, el campo queda en `NULL`

**Archivo modificado**: `src/frontend/pages/admin/Usuarios.tsx`

### 2. **Edición de Técnicos (Admin)**

Cuando se edita un técnico y se cambia su zona:

1. El sistema busca el coordinador que tiene la nueva zona
2. Actualiza automáticamente el `id_coordinador_supervisor`
3. Si no hay coordinador con esa zona, el campo se establece en `NULL`

**Archivo modificado**: `src/frontend/pages/admin/Usuarios.tsx`

### 3. **Gestión de Técnicos (Coordinador)**

El coordinador ahora ve solo los técnicos que tienen asignado su `id_coordinador` en el campo `id_coordinador_supervisor`:

- **Antes**: Filtraba por zona (todos los técnicos de la zona)
- **Ahora**: Filtra por `id_coordinador_supervisor` (solo técnicos asignados directamente)

**Archivo modificado**: `src/frontend/pages/coordinador/Tecnicos.tsx`

### 4. **Asignar Órdenes (Coordinador)**

El coordinador solo puede asignar órdenes a técnicos que tienen su `id_coordinador` en `id_coordinador_supervisor`:

- **Antes**: Filtraba por zona
- **Ahora**: Filtra por `id_coordinador_supervisor`

**Archivo modificado**: `src/frontend/pages/coordinador/AsignarOrdenes.tsx`

---

## 📋 Estructura de la Base de Datos

### Tabla `tecnicos`:
```sql
- id_tecnico (PK)
- id_usuario (FK -> usuarios)
- id_coordinador_supervisor (FK -> coordinadores_campo) ✅ SE USA
- zona_cobertura (VARCHAR)
- disponibilidad (VARCHAR)
```

### Tabla `coordinadores_campo`:
```sql
- id_coordinador (PK)
- id_usuario (FK -> usuarios)
- zona_responsabilidad (VARCHAR)
```

### Relación:
- Un técnico tiene UN coordinador asignado (`id_coordinador_supervisor`)
- Un coordinador puede tener MÚLTIPLES técnicos asignados
- La asignación se hace automáticamente cuando la zona del técnico coincide con la zona del coordinador

---

## 🛠️ Script SQL para Técnicos Existentes

Si ya tienes técnicos creados sin coordinador asignado, ejecuta el script `ASIGNAR_COORDINADOR_A_TECNICO.sql`:

```sql
-- Este script asigna automáticamente coordinadores a técnicos existentes
-- basándose en la zona de cobertura del técnico y la zona de responsabilidad del coordinador

UPDATE tecnicos t
SET id_coordinador_supervisor = (
    SELECT c.id_coordinador
    FROM coordinadores_campo c
    WHERE c.zona_responsabilidad = t.zona_cobertura
    LIMIT 1
)
WHERE t.id_coordinador_supervisor IS NULL
    AND t.zona_cobertura IS NOT NULL
    AND t.zona_cobertura != 'Por asignar'
    AND EXISTS (
        SELECT 1
        FROM coordinadores_campo c
        WHERE c.zona_responsabilidad = t.zona_cobertura
    );
```

---

## ✅ Verificación

### Ver técnicos con su coordinador asignado:

```sql
SELECT 
    t.id_tecnico,
    u.nombre_completo as tecnico_nombre,
    t.zona_cobertura,
    t.id_coordinador_supervisor,
    c.zona_responsabilidad,
    u2.nombre_completo as coordinador_nombre
FROM tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
LEFT JOIN coordinadores_campo c ON t.id_coordinador_supervisor = c.id_coordinador
LEFT JOIN usuarios u2 ON c.id_usuario = u2.id_usuario
ORDER BY t.id_tecnico;
```

### Ver técnicos sin coordinador asignado:

```sql
SELECT 
    t.id_tecnico,
    u.nombre_completo as tecnico_nombre,
    t.zona_cobertura,
    t.id_coordinador_supervisor
FROM tecnicos t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
WHERE t.id_coordinador_supervisor IS NULL;
```

---

## 🎯 Flujo de Trabajo

### Crear un Técnico:

1. **Admin** crea un técnico y selecciona la zona (ej: "Zona Norte")
2. **Sistema** busca automáticamente el coordinador con zona "Zona Norte"
3. **Sistema** asigna el `id_coordinador` al campo `id_coordinador_supervisor` del técnico
4. **Resultado**: El técnico queda asignado al coordinador de esa zona

### Coordinador Ve Sus Técnicos:

1. **Coordinador** inicia sesión
2. **Sistema** obtiene su `id_coordinador`
3. **Sistema** busca todos los técnicos donde `id_coordinador_supervisor = id_coordinador`
4. **Resultado**: El coordinador ve solo sus técnicos asignados

### Coordinador Asigna Orden:

1. **Coordinador** selecciona una orden para asignar
2. **Sistema** muestra solo los técnicos donde `id_coordinador_supervisor = id_coordinador`
3. **Coordinador** selecciona un técnico de su lista
4. **Sistema** asigna la orden al técnico
5. **Sistema** guarda el `id_coordinador_supervisor` en la orden (en `ordenes_servicio.id_coordinador_supervisor`)

---

## 📝 Notas Importantes

1. **Asignación Automática**: Los técnicos se asignan automáticamente al coordinador de su zona cuando se crean.

2. **Técnicos Sin Coordinador**: Si no hay coordinador con la misma zona, el técnico queda sin coordinador asignado (`id_coordinador_supervisor = NULL`). En este caso, el coordinador no verá ese técnico.

3. **Múltiples Coordinadores en la Misma Zona**: Si hay múltiples coordinadores con la misma zona, se asigna el primero que se encuentre. Es recomendable que cada zona tenga un solo coordinador.

4. **Cambio de Zona**: Si un técnico cambia de zona, se le asigna automáticamente el coordinador de la nueva zona.

5. **Técnicos Existentes**: Los técnicos que ya fueron creados sin coordinador necesitan ejecutar el script SQL para asignarlos.

---

## ✅ Resultado Final

- ✅ Los técnicos nuevos se asignan automáticamente al coordinador de su zona
- ✅ El coordinador ve solo sus técnicos asignados (no todos los de la zona)
- ✅ El coordinador solo puede asignar órdenes a sus técnicos
- ✅ La relación técnico-coordinador está claramente definida en la base de datos
- ✅ Se puede rastrear qué coordinador asignó cada orden

