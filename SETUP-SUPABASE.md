# 🚀 Guia de Configuração do Supabase

## Passo 1: Acessar o Painel do Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `znzusxbdicybbvkrovnq`

## Passo 2: Executar Scripts SQL

### 2.1 - Criar Tabelas (SQL Editor)

1. No painel lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Cole o código abaixo e clique em **Run**:

\`\`\`sql
-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de mapas
CREATE TABLE IF NOT EXISTS maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  fazenda TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  arquivo_url TEXT NOT NULL,
  anotacoes JSON DEFAULT '{}',
  latitude FLOAT,
  longitude FLOAT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias (nome) VALUES 
  ('Plantio'),
  ('Colheita'),
  ('Irrigação'),
  ('Fertilização'),
  ('Monitoramento'),
  ('Outros')
ON CONFLICT DO NOTHING;
\`\`\`

### 2.2 - Configurar Storage (Nova Query)

1. Crie uma **New Query** no SQL Editor
2. Cole o código abaixo e clique em **Run**:

\`\`\`sql
-- Criar bucket para mapas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mapas', 'mapas', true)
ON CONFLICT DO NOTHING;

-- Política para permitir upload público
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'mapas');

-- Política para permitir leitura pública
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'mapas');

-- Política para permitir delete público
CREATE POLICY "Allow public delete" ON storage.objects
FOR DELETE USING (bucket_id = 'mapas');
\`\`\`

### 2.3 - Testar Configuração (Nova Query)

1. Crie uma **New Query** no SQL Editor
2. Cole o código abaixo e clique em **Run**:

\`\`\`sql
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
\`\`\`

## Passo 3: Configurar RLS (Row Level Security)

### 3.1 - Desabilitar RLS para Uso Público

1. No painel lateral, clique em **Authentication** > **Policies**
2. Para cada tabela (categorias, maps), clique em **Disable RLS**
3. Ou execute no SQL Editor:

\`\`\`sql
-- Desabilitar RLS para uso público
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE maps DISABLE ROW LEVEL SECURITY;
\`\`\`

## Passo 4: Verificar Storage

1. No painel lateral, clique em **Storage**
2. Verifique se o bucket **mapas** foi criado
3. Se não existir, clique em **Create bucket**:
   - Name: `mapas`
   - Public bucket: ✅ **Enabled**

## ✅ Verificação Final

Após executar todos os scripts, você deve ver:

- ✅ 2 tabelas criadas: `categorias` e `maps`
- ✅ 6 categorias padrão inseridas
- ✅ 1 bucket de storage: `mapas` (público)
- ✅ 3 políticas de storage configuradas

## 🚨 Problemas Comuns

### Erro: "relation does not exist"
- Execute primeiro o script de criação de tabelas

### Erro: "bucket already exists"
- Normal, significa que o bucket já foi criado

### Erro: "policy already exists"
- Normal, significa que as políticas já foram criadas

## 📞 Suporte

Se encontrar problemas:
1. Verifique se está no projeto correto
2. Confirme se tem permissões de administrador
3. Tente executar os scripts um por vez
\`\`\`

Agora vou criar um componente para verificar a configuração diretamente no sistema:
