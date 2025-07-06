-- SCRIPT ALTERNATIVO PARA CONFIGURAR STORAGE
-- Use este script se o anterior deu erro de permissões

-- 1. Criar bucket público (método simples)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mapas', 'mapas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Se o bucket já existe, apenas garantir que é público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'mapas';

-- 3. Verificar se o bucket foi criado
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'mapas';
