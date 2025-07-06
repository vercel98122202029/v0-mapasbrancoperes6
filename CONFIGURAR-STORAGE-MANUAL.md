# 🗂️ Configuração Manual do Storage

## Método 1: Via Interface do Supabase (RECOMENDADO)

### Passo 1: Acessar Storage
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `znzusxbdicybbvkrovnq`
3. No menu lateral, clique em **Storage**

### Passo 2: Criar Bucket
1. Clique em **"Create bucket"**
2. Preencha:
   - **Name**: `mapas`
   - **Public bucket**: ✅ **MARCAR ESTA OPÇÃO**
   - **File size limit**: 50 MB (ou maior se necessário)
3. Clique em **"Create bucket"**

### Passo 3: Configurar Políticas (se necessário)
1. Clique no bucket **"mapas"** criado
2. Vá na aba **"Policies"**
3. Se não houver políticas, clique em **"New policy"**
4. Selecione **"For full customization"**
5. Use esta configuração:

**Policy name**: `Allow public access`
**Allowed operation**: `SELECT, INSERT, DELETE`
**Target roles**: `public`
**USING expression**: `bucket_id = 'mapas'`
**WITH CHECK expression**: `bucket_id = 'mapas'`

## Método 2: Via SQL (se tiver permissões)

Execute no SQL Editor:

\`\`\`sql
-- Criar bucket público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mapas', 'mapas', true)
ON CONFLICT (id) DO UPDATE SET public = true;
\`\`\`

## ✅ Verificação

Após criar o bucket, volte ao sistema e clique em **"Verificar Agora"** na aba Estatísticas.
Você deve ver: ✅ Storage Bucket: Bucket 'mapas' configurado
\`\`\`

Vou atualizar o visualizador de mapas para melhor tratamento de erros de PDF:
