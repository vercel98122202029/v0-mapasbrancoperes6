-- SCRIPT PARA RESOLVER PROBLEMAS DE RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS nas tabelas principais
ALTER TABLE IF EXISTS categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maps DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes das tabelas
DROP POLICY IF EXISTS "Enable read access for all users" ON categorias;
DROP POLICY IF EXISTS "Enable insert for all users" ON categorias;
DROP POLICY IF EXISTS "Enable update for all users" ON categorias;
DROP POLICY IF EXISTS "Enable delete for all users" ON categorias;

DROP POLICY IF EXISTS "Enable read access for all users" ON maps;
DROP POLICY IF EXISTS "Enable insert for all users" ON maps;
DROP POLICY IF EXISTS "Enable update for all users" ON maps;
DROP POLICY IF EXISTS "Enable delete for all users" ON maps;

-- 3. Verificar se as tabelas estão sem RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categorias', 'maps');

-- 4. Testar inserção simples
INSERT INTO categorias (nome) VALUES ('Teste RLS') 
ON CONFLICT DO NOTHING;

-- 5. Remover teste
DELETE FROM categorias WHERE nome = 'Teste RLS';
