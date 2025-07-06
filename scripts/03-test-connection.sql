-- Script para testar se as tabelas foram criadas corretamente
-- Execute este script no SQL Editor do Supabase

-- Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categorias', 'maps');

-- Verificar se as categorias padrão foram inseridas
SELECT * FROM categorias ORDER BY nome;

-- Verificar se o bucket de storage existe
SELECT * FROM storage.buckets WHERE id = 'mapas';

-- Verificar políticas de storage
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
