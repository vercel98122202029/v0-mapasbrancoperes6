-- Criar bucket para mapas (execute no SQL Editor do Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mapas', 'mapas', true)
ON CONFLICT DO NOTHING;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Criar políticas para permitir acesso público
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'mapas');

CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'mapas');

CREATE POLICY "Allow public delete" ON storage.objects
FOR DELETE USING (bucket_id = 'mapas');

-- Habilitar RLS no storage.objects se não estiver habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
