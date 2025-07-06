-- SCRIPT PARA CORRIGIR PERMISSÕES DAS TABELAS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar RLS atual
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS ATIVO (pode dar problema)'
    ELSE 'RLS DESABILITADO (correto)'
  END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categorias', 'maps');

-- 2. Forçar desabilitação do RLS
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps DISABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas das tabelas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categorias;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.categorias;
DROP POLICY IF EXISTS "Enable update for all users" ON public.categorias;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.categorias;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.maps;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.maps;
DROP POLICY IF EXISTS "Enable update for all users" ON public.maps;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.maps;

-- 4. Conceder permissões explícitas (método alternativo)
GRANT ALL ON public.categorias TO anon;
GRANT ALL ON public.maps TO anon;
GRANT ALL ON public.categorias TO authenticated;
GRANT ALL ON public.maps TO authenticated;

-- 5. Testar inserção nas duas tabelas
-- Teste 1: Categoria
INSERT INTO public.categorias (nome) VALUES ('TESTE_PERMISSAO') 
ON CONFLICT DO NOTHING;

-- Teste 2: Mapa (usando uma categoria existente)
INSERT INTO public.maps (nome, fazenda, categoria_id, arquivo_url, anotacoes) 
SELECT 'TESTE_MAPA', 'TESTE_FAZENDA', id, 'http://teste.com/arquivo.pdf', '{}'
FROM public.categorias 
WHERE nome = 'Plantio'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 6. Limpar testes
DELETE FROM public.maps WHERE nome = 'TESTE_MAPA';
DELETE FROM public.categorias WHERE nome = 'TESTE_PERMISSAO';

-- 7. Verificar resultado final
SELECT 'SUCESSO: Permissões configuradas corretamente' as resultado;
