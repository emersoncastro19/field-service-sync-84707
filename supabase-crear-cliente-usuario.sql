-- ========================================================
-- CREAR REGISTRO DE CLIENTE PARA USUARIO EXISTENTE
-- ========================================================
-- Ejecuta esto si registraste un usuario pero no se creó
-- el registro en la tabla 'clientes'

-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_EMAIL_AQUI' con el email del usuario que creaste
-- 2. Ajusta los datos (dirección, teléfono, etc.) si quieres
-- 3. Ejecuta en Supabase SQL Editor

BEGIN;

-- Crear el registro de cliente para el último usuario registrado
-- OPCIÓN 1: Si conoces el ID del usuario
-- INSERT INTO clientes (
--   id_usuario,
--   tipo_identificacion,
--   identificacion,
--   direccion_principal,
--   direccion_servicio,
--   referencias_ubicacion,
--   tipo_cliente,
--   estado_cuenta,
--   plan_actual
-- ) VALUES (
--   1,  -- ← REEMPLAZA CON EL id_usuario correcto
--   'Cedula',
--   'V-12345678',
--   'Mi dirección principal',
--   'Mi dirección principal',
--   'Referencias',
--   'Residencial',
--   'Activo',
--   'Plan Básico'
-- );

-- OPCIÓN 2: Crear cliente para el usuario con email específico (MÁS FÁCIL)
INSERT INTO clientes (
  id_usuario,
  tipo_identificacion,
  identificacion,
  direccion_principal,
  direccion_servicio,
  referencias_ubicacion,
  tipo_cliente,
  estado_cuenta,
  plan_actual
)
SELECT 
  u.id_usuario,
  'Cedula',
  'V-' || u.id_usuario,  -- Genera identificación automática
  'Dirección de prueba - Maracaibo',
  'Dirección de prueba - Maracaibo',
  'Sin referencias',
  'Residencial',
  'Activo',
  'Plan Básico'
FROM usuarios u
WHERE u.email = 'TU_EMAIL_AQUI'  -- ← REEMPLAZA CON TU EMAIL
AND u.tipo_usuario = 'Cliente'
AND NOT EXISTS (
  SELECT 1 FROM clientes c WHERE c.id_usuario = u.id_usuario
);

COMMIT;

-- ========================================================
-- VERIFICAR QUE SE CREÓ
-- ========================================================
-- Ejecuta esta consulta para verificar:

SELECT 
  u.id_usuario,
  u.email,
  u.nombre_completo,
  c.id_cliente,
  c.tipo_cliente,
  c.estado_cuenta
FROM usuarios u
LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
WHERE u.tipo_usuario = 'Cliente';

-- Si ves datos en las columnas id_cliente, tipo_cliente, etc.
-- ¡Todo está bien! Ya puedes crear órdenes.



