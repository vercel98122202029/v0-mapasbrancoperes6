# 🗂️ Como Criar o Bucket de Storage Manualmente

## ⚠️ IMPORTANTE: Use este método se os scripts SQL não funcionaram

### Passo 1: Acessar o Storage
1. Acesse: https://supabase.com/dashboard/project/znzusxbdicybbvkrovnq/storage/buckets
2. Faça login se necessário

### Passo 2: Criar o Bucket
1. Clique no botão **"Create bucket"** (verde, no canto superior direito)
2. Preencha o formulário:
   - **Name**: `mapas` (exatamente assim, sem espaços)
   - **Public bucket**: ✅ **MARCAR ESTA OPÇÃO** (muito importante!)
   - **File size limit**: 50 MB (ou maior se necessário)
   - **Allowed MIME types**: deixe em branco (aceita todos)
3. Clique em **"Create bucket"**

### Passo 3: Verificar se Funcionou
1. Volte ao sistema de mapas
2. Vá na aba **"Estatísticas"**
3. Clique em **"Verificar Agora"**
4. O Storage Bucket deve aparecer como ✅

### Passo 4: Testar Upload
1. Vá na aba **"Upload"**
2. Faça upload de um PDF de teste
3. Se funcionar, o mapa aparecerá na lista

## 🔧 Se Ainda Não Funcionar

### Verificar Políticas do Bucket
1. No Storage, clique no bucket **"mapas"**
2. Vá na aba **"Policies"**
3. Se não houver políticas, clique em **"New policy"**
4. Selecione **"For full customization"**
5. Configure:
   - **Policy name**: `Allow public access`
   - **Allowed operation**: Marque todas (SELECT, INSERT, UPDATE, DELETE)
   - **Target roles**: `public`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`

### Verificar se o Bucket é Público
1. No Storage, na lista de buckets
2. O bucket **"mapas"** deve ter um ícone de 🌐 (público)
3. Se não tiver, clique nos 3 pontinhos → **"Edit bucket"** → Marque **"Public bucket"**

## 📞 Suporte
Se ainda não funcionar, o problema pode ser:
- Permissões da conta Supabase
- Configuração do projeto
- Limite de storage atingido

Neste caso, verifique:
1. Se você é owner/admin do projeto
2. Se o projeto não está pausado
3. Se há espaço disponível no storage
\`\`\`

Vou atualizar o verificador para incluir o novo script:
