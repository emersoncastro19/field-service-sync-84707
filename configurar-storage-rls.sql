-- Script para configurar las políticas RLS del bucket de Storage
-- Este script debe ejecutarse en Supabase SQL Editor

-- IMPORTANTE: Las políticas de Storage se configuran desde el Dashboard de Supabase
-- Ve a: Storage → Buckets → documentacion-servicios → Policies

-- Sin embargo, también puedes usar estas funciones SQL si tienes permisos de administrador:

-- 1. Verificar que el bucket existe
SELECT name, id, public 
FROM storage.buckets 
WHERE name = 'documentacion-servicios';

-- 2. Si el bucket no existe, créalo (ejecuta esto si el paso 1 no devolvió resultados)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documentacion-servicios', 'documentacion-servicios', true)
-- ON CONFLICT (id) DO NOTHING;

-- 3. Verificar políticas existentes del bucket
-- NOTA: Las políticas de Storage en Supabase se gestionan desde el Dashboard
-- Ve a: Storage → Buckets → documentacion-servicios → Policies
-- Este query solo verifica si el bucket existe y es público

SELECT 
    name,
    id,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'documentacion-servicios';

-- 4. Hacer el bucket público (solución más simple para desarrollo)
-- Esto permite que cualquier usuario autenticado suba y lea archivos
UPDATE storage.buckets 
SET public = true 
WHERE name = 'documentacion-servicios';

-- 5. Verificar que se actualizó correctamente
SELECT 
    name,
    public,
    CASE 
        WHEN public THEN '✅ Bucket es público - No se requieren políticas RLS'
        ELSE '❌ Bucket es privado - Se requieren políticas RLS'
    END AS estado
FROM storage.buckets
WHERE name = 'documentacion-servicios';

-- NOTA: Si las políticas no funcionan, puedes deshabilitar RLS temporalmente para desarrollo:
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE name = 'documentacion-servicios';

