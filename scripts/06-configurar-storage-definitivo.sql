-- SCRIPT DEFINITIVO PARA STORAGE
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o bucket existe
SELECT id, name, public, created_at FROM storage.buckets WHERE id = 'mapas';

-- 2. Se não aparecer resultado, criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('mapas', 'mapas', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 3. Remover TODAS as políticas existentes no storage
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 4. Criar políticas simples e funcionais
CREATE POLICY "mapas_select" ON storage.objects FOR SELECT USING (bucket_id = 'mapas');
CREATE POLICY "mapas_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mapas');
CREATE POLICY "mapas_delete" ON storage.objects FOR DELETE USING (bucket_id = 'mapas');

-- 5. Verificar se as políticas foram criadas
SELECT policyname, cmd, qual FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE 'mapas_%';

-- 6. Testar se o bucket está acessível
SELECT 
  b.id,
  b.name,
  b.public,
  b.file_size_limit,
  COUNT(o.name) as total_files
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
WHERE b.id = 'mapas'
GROUP BY b.id, b.name, b.public, b.file_size_limit;
