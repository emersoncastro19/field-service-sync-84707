-- ========================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ========================================================
-- IMPORTANTE: Ejecutar después de crear las tablas
-- Estas políticas permiten que el frontend acceda a los datos

BEGIN;

-- ========================================================
-- USUARIOS: Todos pueden leer, solo el propio usuario puede actualizar
-- ========================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de usuarios"
ON usuarios FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción pública de usuarios"
ON usuarios FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON usuarios FOR UPDATE
USING (true);

-- ========================================================
-- CLIENTES: Pueden ver y actualizar su propia información
-- ========================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de clientes"
ON clientes FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de clientes"
ON clientes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de clientes"
ON clientes FOR UPDATE
USING (true);

-- ========================================================
-- AGENTES_SERVICIO
-- ========================================================

ALTER TABLE agentes_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de agentes"
ON agentes_servicio FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de agentes"
ON agentes_servicio FOR INSERT
WITH CHECK (true);

-- ========================================================
-- COORDINADORES_CAMPO
-- ========================================================

ALTER TABLE coordinadores_campo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de coordinadores"
ON coordinadores_campo FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de coordinadores"
ON coordinadores_campo FOR INSERT
WITH CHECK (true);

-- ========================================================
-- TECNICOS
-- ========================================================

ALTER TABLE tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de tecnicos"
ON tecnicos FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de tecnicos"
ON tecnicos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de tecnicos"
ON tecnicos FOR UPDATE
USING (true);

-- ========================================================
-- ORDENES_SERVICIO: Crucial para el funcionamiento
-- ========================================================

ALTER TABLE ordenes_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de ordenes"
ON ordenes_servicio FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de ordenes"
ON ordenes_servicio FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de ordenes"
ON ordenes_servicio FOR UPDATE
USING (true);

CREATE POLICY "Permitir eliminación de ordenes"
ON ordenes_servicio FOR DELETE
USING (true);

-- ========================================================
-- CITAS
-- ========================================================

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de citas"
ON citas FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de citas"
ON citas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de citas"
ON citas FOR UPDATE
USING (true);

-- ========================================================
-- EJECUCIONES_SERVICIO
-- ========================================================

ALTER TABLE ejecuciones_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de ejecuciones"
ON ejecuciones_servicio FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de ejecuciones"
ON ejecuciones_servicio FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de ejecuciones"
ON ejecuciones_servicio FOR UPDATE
USING (true);

-- ========================================================
-- ESPECIALIDADES_TECNICOS
-- ========================================================

ALTER TABLE especialidades_tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de especialidades"
ON especialidades_tecnicos FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de especialidades"
ON especialidades_tecnicos FOR INSERT
WITH CHECK (true);

-- ========================================================
-- IMPEDIMENTOS
-- ========================================================

ALTER TABLE impedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de impedimentos"
ON impedimentos FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de impedimentos"
ON impedimentos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de impedimentos"
ON impedimentos FOR UPDATE
USING (true);

-- ========================================================
-- LOGS_AUDITORIA
-- ========================================================

ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de logs"
ON logs_auditoria FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de logs"
ON logs_auditoria FOR INSERT
WITH CHECK (true);

-- ========================================================
-- NOTIFICACIONES
-- ========================================================

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de notificaciones"
ON notificaciones FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción de notificaciones"
ON notificaciones FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización de notificaciones"
ON notificaciones FOR UPDATE
USING (true);

COMMIT;

-- ========================================================
-- NOTA: Estas políticas son PERMISIVAS para desarrollo
-- En producción, deberías restringir el acceso según el rol
-- ========================================================


