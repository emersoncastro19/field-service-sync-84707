-- ========================================================
-- DATOS DE PRUEBA
-- ========================================================
-- Ejecutar DESPUÉS de crear tablas y políticas

BEGIN;

-- ========================================================
-- USUARIOS DE PRUEBA
-- ========================================================

INSERT INTO usuarios (username, contraseña, email, telefono, nombre_completo, tipo_usuario, estado) VALUES
('cliente1', '$2a$10$abcdefghijklmnopqrstuv', 'cliente1@test.com', '0424-1234567', 'Juan Pérez', 'Cliente', 'Activo'),
('cliente2', '$2a$10$abcdefghijklmnopqrstuv', 'cliente2@test.com', '0412-9876543', 'María González', 'Cliente', 'Activo'),
('agente1', '$2a$10$abcdefghijklmnopqrstuv', 'agente1@test.com', '0414-1111111', 'Carlos Rodríguez', 'Agente', 'Activo'),
('coordinador1', '$2a$10$abcdefghijklmnopqrstuv', 'coord1@test.com', '0424-2222222', 'Ana Martínez', 'Coordinador', 'Activo'),
('tecnico1', '$2a$10$abcdefghijklmnopqrstuv', 'tecnico1@test.com', '0412-3333333', 'Luis Fernández', 'Tecnico', 'Activo'),
('tecnico2', '$2a$10$abcdefghijklmnopqrstuv', 'tecnico2@test.com', '0414-4444444', 'Pedro Ramírez', 'Tecnico', 'Activo');

-- ========================================================
-- CLIENTES
-- ========================================================

INSERT INTO clientes (id_usuario, tipo_identificacion, identificacion, direccion_principal, direccion_servicio, referencias_ubicacion, tipo_cliente, estado_cuenta, plan_actual) VALUES
(1, 'Cedula', 'V-12345678', 'Av. Principal, Edificio Torre 1, Apto 5-B, Maracaibo', 'Av. Principal, Edificio Torre 1, Apto 5-B, Maracaibo', 'Frente al Centro Comercial, Torre color azul', 'Residencial', 'Activo', 'Plan Básico 10MB'),
(2, 'RIF', 'J-30123456-7', 'Calle 72 con Av. 3E, Local 5, Maracaibo', 'Calle 72 con Av. 3E, Local 5, Maracaibo', 'Al lado de Farmacia Santa Fe', 'Empresarial', 'Activo', 'Plan Empresarial 50MB');

-- ========================================================
-- AGENTES
-- ========================================================

INSERT INTO agentes_servicio (id_usuario) VALUES
(3);

-- ========================================================
-- COORDINADORES
-- ========================================================

INSERT INTO coordinadores_campo (id_usuario, zona_responsabilidad) VALUES
(4, 'Zona Norte - Maracaibo');

-- ========================================================
-- TECNICOS
-- ========================================================

INSERT INTO tecnicos (id_usuario, id_coordinador_supervisor, zona_cobertura, disponibilidad) VALUES
(5, 1, 'Zona Norte - Maracaibo', 'Activo'),
(6, 1, 'Zona Centro - Maracaibo', 'Activo');

-- ========================================================
-- ESPECIALIDADES DE TECNICOS
-- ========================================================

INSERT INTO especialidades_tecnicos (id_tecnico, especialidad) VALUES
(1, 'Instalación'),
(1, 'Reparación'),
(2, 'Reparación'),
(2, 'Cambio_Plan');

-- ========================================================
-- ORDENES DE SERVICIO DE EJEMPLO
-- ========================================================

-- Orden 1: Creada por cliente (sin agente)
INSERT INTO ordenes_servicio (
  numero_orden, 
  id_cliente, 
  id_agente_creador, 
  id_tecnico_asignado,
  id_coordinador_supervisor,
  tipo_servicio, 
  prioridad, 
  descripcion_solicitud, 
  direccion_servicio, 
  estado, 
  fecha_solicitud,
  fecha_asignacion
) VALUES (
  'ORD-20251026-0001',
  1,
  NULL,  -- Cliente creó la orden directamente
  1,     -- Técnico ya asignado
  1,     -- Coordinador supervisor
  'Instalación',
  'Alta',
  'Solicito instalación de servicio de internet. Edificio de 3 pisos, necesito instalación en el apartamento 5-B.',
  'Av. Principal, Edificio Torre 1, Apto 5-B, Maracaibo',
  'Asignada',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
);

-- Orden 2: En proceso
INSERT INTO ordenes_servicio (
  numero_orden, 
  id_cliente, 
  id_agente_creador, 
  id_tecnico_asignado,
  id_coordinador_supervisor,
  tipo_servicio, 
  prioridad, 
  descripcion_solicitud, 
  direccion_servicio, 
  estado, 
  fecha_solicitud,
  fecha_asignacion,
  fecha_limite
) VALUES (
  'ORD-20251026-0002',
  1,
  1,  -- Creada por agente
  1,
  1,
  'Reparación',
  'Crítica',
  'Internet completamente caído. No hay señal desde ayer. Urgente, trabajo desde casa.',
  'Av. Principal, Edificio Torre 1, Apto 5-B, Maracaibo',
  'En Proceso',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '12 hours',
  NOW() + INTERVAL '1 day'
);

-- Orden 3: Completada
INSERT INTO ordenes_servicio (
  numero_orden, 
  id_cliente, 
  id_agente_creador, 
  id_tecnico_asignado,
  id_coordinador_supervisor,
  tipo_servicio, 
  prioridad, 
  descripcion_solicitud, 
  direccion_servicio, 
  estado, 
  fecha_solicitud,
  fecha_asignacion,
  fecha_completada
) VALUES (
  'ORD-20251020-0001',
  2,
  1,
  2,
  1,
  'Cambio_Plan',
  'Media',
  'Solicito upgrade del plan actual de 20MB a 50MB para la oficina.',
  'Calle 72 con Av. 3E, Local 5, Maracaibo',
  'Completada',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days'
);

-- ========================================================
-- CITAS
-- ========================================================

INSERT INTO citas (id_orden, fecha_programada, fecha_confirmada, estado_cita) VALUES
(1, NOW() + INTERVAL '1 day', NOW(), 'Confirmada'),
(2, NOW() + INTERVAL '4 hours', NOW() - INTERVAL '2 hours', 'Confirmada');

-- ========================================================
-- EJECUCIONES
-- ========================================================

-- Ejecución de la orden completada
INSERT INTO ejecuciones_servicio (
  id_orden, 
  id_tecnico, 
  fecha_inicio, 
  fecha_fin, 
  trabajo_realizado, 
  estado_resultado,
  confirmacion_cliente
) VALUES (
  3,
  2,
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days' + INTERVAL '2 hours',
  'Se realizó cambio de plan exitosamente. Se configuró el nuevo router y se verificó velocidad de conexión. Cliente satisfecho.',
  'Completado',
  'Confirmada'
);

-- Ejecución en proceso
INSERT INTO ejecuciones_servicio (
  id_orden, 
  id_tecnico, 
  fecha_inicio, 
  trabajo_realizado, 
  estado_resultado,
  confirmacion_cliente
) VALUES (
  2,
  1,
  NOW() - INTERVAL '1 hour',
  'Revisando conexión. Detectado problema en cable de fibra óptica. Realizando reparación.',
  'Observaciones',
  'Pendiente'
);

-- ========================================================
-- LOGS DE AUDITORÍA
-- ========================================================

INSERT INTO logs_auditoria (id_usuario, id_orden, accion, descripcion, timestamp) VALUES
(1, 1, 'CREAR_ORDEN', 'Cliente creó orden ORD-20251026-0001 - Tipo: Instalación', NOW() - INTERVAL '2 days'),
(4, 1, 'ASIGNAR_TECNICO', 'Coordinador asignó técnico Luis Fernández a orden ORD-20251026-0001', NOW() - INTERVAL '1 day'),
(3, 2, 'CREAR_ORDEN', 'Agente creó orden ORD-20251026-0002 - Tipo: Reparación', NOW() - INTERVAL '1 day'),
(5, 2, 'INICIAR_TRABAJO', 'Técnico inició trabajo en orden ORD-20251026-0002', NOW() - INTERVAL '1 hour');

COMMIT;

-- ========================================================
-- VERIFICACIÓN: Ejecuta estas consultas para verificar
-- ========================================================

-- Ver usuarios creados
-- SELECT * FROM usuarios;

-- Ver órdenes creadas
-- SELECT o.numero_orden, o.tipo_servicio, o.estado, o.prioridad, u.nombre_completo as cliente
-- FROM ordenes_servicio o
-- JOIN clientes c ON o.id_cliente = c.id_cliente
-- JOIN usuarios u ON c.id_usuario = u.id_usuario;

-- Ver técnicos y sus especialidades
-- SELECT u.nombre_completo, t.zona_cobertura, e.especialidad
-- FROM tecnicos t
-- JOIN usuarios u ON t.id_usuario = u.id_usuario
-- LEFT JOIN especialidades_tecnicos e ON t.id_tecnico = e.id_tecnico;



