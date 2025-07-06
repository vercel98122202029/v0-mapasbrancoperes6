"use client"

import { useState } from "react"
import { CheckCircle, XCircle, AlertTriangle, Play, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function VerificadorConfiguracao() {
  const [verificando, setVerificando] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])

  const scripts = {
    tabelas: `-- Criar tabela de categorias
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
ON CONFLICT DO NOTHING;`,

    storage: `-- CONFIGURAR STORAGE DEFINITIVAMENTE
-- Verificar se bucket existe
SELECT id, name, public FROM storage.buckets WHERE id = 'mapas';

-- Criar/atualizar bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('mapas', 'mapas', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Criar políticas específicas
CREATE POLICY "mapas_select" ON storage.objects FOR SELECT USING (bucket_id = 'mapas');
CREATE POLICY "mapas_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mapas');
CREATE POLICY "mapas_delete" ON storage.objects FOR DELETE USING (bucket_id = 'mapas');`,

    permissoes: `-- CORRIGIR PERMISSÕES DAS TABELAS
-- Desabilitar RLS
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps DISABLE ROW LEVEL SECURITY;

-- Remover políticas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categorias;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.categorias;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maps;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.maps;

-- Conceder permissões
GRANT ALL ON public.categorias TO anon;
GRANT ALL ON public.maps TO anon;

-- Testar
INSERT INTO public.categorias (nome) VALUES ('TESTE') ON CONFLICT DO NOTHING;
DELETE FROM public.categorias WHERE nome = 'TESTE';`,

    teste: `-- TESTE COMPLETO
-- 1. Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('categorias', 'maps');

-- 2. Verificar categorias
SELECT COUNT(*) as total_categorias FROM categorias;

-- 3. Verificar bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'mapas';

-- 4. Verificar políticas do storage
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE 'mapas_%';

-- 5. Teste de inserção
INSERT INTO categorias (nome) VALUES ('TESTE_FINAL') ON CONFLICT DO NOTHING;
DELETE FROM categorias WHERE nome = 'TESTE_FINAL';`,
  }

  const verificarConfiguracao = async () => {
    setVerificando(true)
    const novosResultados = []

    try {
      // 1. Verificar tabelas
      try {
        const { data, error } = await supabase.from("categorias").select("count").single()
        if (error && error.code === "42P01") {
          novosResultados.push({
            teste: "Tabelas do Banco",
            status: "error",
            mensagem: "Tabelas não encontradas. Execute o Script 1.",
          })
        } else if (error) {
          throw error
        } else {
          novosResultados.push({
            teste: "Tabelas do Banco",
            status: "success",
            mensagem: "Tabelas encontradas",
          })
        }
      } catch (error: any) {
        novosResultados.push({
          teste: "Conexão",
          status: "error",
          mensagem: `Erro: ${error.message}`,
        })
      }

      // 2. Verificar categorias
      try {
        const { data, error } = await supabase.from("categorias").select("*")
        if (error) throw error

        if (data && data.length >= 6) {
          novosResultados.push({
            teste: "Categorias Padrão",
            status: "success",
            mensagem: `${data.length} categorias encontradas`,
          })
        } else {
          novosResultados.push({
            teste: "Categorias Padrão",
            status: "warning",
            mensagem: `Apenas ${data?.length || 0} categorias. Execute o Script 1.`,
          })
        }
      } catch (error: any) {
        novosResultados.push({
          teste: "Categorias Padrão",
          status: "error",
          mensagem: `Erro: ${error.message}`,
        })
      }

      // 3. Verificar storage - método mais específico
      try {
        // Primeiro tenta listar buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

        if (bucketsError) {
          novosResultados.push({
            teste: "Conectividade Storage",
            status: "error",
            mensagem: `Erro de conexão: ${bucketsError.message}`,
          })
        } else {
          const bucketMapas = buckets?.find((bucket) => bucket.id === "mapas")
          if (bucketMapas) {
            novosResultados.push({
              teste: "Storage Bucket",
              status: "success",
              mensagem: `Bucket encontrado (público: ${bucketMapas.public ? "Sim" : "Não"})`,
            })
          } else {
            novosResultados.push({
              teste: "Storage Bucket",
              status: "error",
              mensagem: "Bucket 'mapas' não encontrado na lista",
            })
          }
        }

        // Testar acesso específico ao bucket mapas
        try {
          const { data: files, error: filesError } = await supabase.storage.from("mapas").list()
          if (filesError) {
            novosResultados.push({
              teste: "Acesso ao Bucket",
              status: "error",
              mensagem: `Não consegue acessar bucket: ${filesError.message}`,
            })
          } else {
            novosResultados.push({
              teste: "Acesso ao Bucket",
              status: "success",
              mensagem: `Acesso OK (${files?.length || 0} arquivos)`,
            })
          }
        } catch (error: any) {
          novosResultados.push({
            teste: "Acesso ao Bucket",
            status: "error",
            mensagem: `Erro de acesso: ${error.message}`,
          })
        }
      } catch (error: any) {
        novosResultados.push({
          teste: "Storage Geral",
          status: "error",
          mensagem: `Erro geral: ${error.message}`,
        })
      }

      // 4. Testar inserção específica
      try {
        const testCategoria = `Teste-${Date.now()}`
        const { data, error } = await supabase.from("categorias").insert({ nome: testCategoria }).select().single()

        if (error) {
          if (
            error.message.includes("row-level security") ||
            error.message.includes("policy") ||
            error.message.includes("permission")
          ) {
            novosResultados.push({
              teste: "Teste de Inserção",
              status: "error",
              mensagem: "Bloqueado por RLS/Permissões. Execute Scripts 2 e 3.",
            })
          } else {
            throw error
          }
        } else {
          // Limpar teste
          await supabase.from("categorias").delete().eq("id", data.id)
          novosResultados.push({
            teste: "Teste de Inserção",
            status: "success",
            mensagem: "Inserção funcionando",
          })
        }
      } catch (error: any) {
        novosResultados.push({
          teste: "Teste de Inserção",
          status: "error",
          mensagem: `Erro: ${error.message}`,
        })
      }

      // 5. Testar upload completo
      try {
        const testFile = new File(["test content"], "test.txt", { type: "text/plain" })
        const fileName = `test-${Date.now()}.txt`

        const { data, error } = await supabase.storage.from("mapas").upload(fileName, testFile)

        if (error) {
          novosResultados.push({
            teste: "Teste de Upload",
            status: "error",
            mensagem: `Upload falhou: ${error.message}`,
          })
        } else {
          // Limpar arquivo de teste
          await supabase.storage.from("mapas").remove([data.path])
          novosResultados.push({
            teste: "Teste de Upload",
            status: "success",
            mensagem: "Upload funcionando",
          })
        }
      } catch (error: any) {
        novosResultados.push({
          teste: "Teste de Upload",
          status: "error",
          mensagem: `Erro no upload: ${error.message}`,
        })
      }
    } catch (error) {
      novosResultados.push({
        teste: "Verificação Geral",
        status: "error",
        mensagem: "Erro geral na verificação",
      })
    }

    setResultados(novosResultados)
    setVerificando(false)
  }

  const copiarScript = (script: string) => {
    navigator.clipboard.writeText(script)
    toast.success("Script copiado para a área de transferência!")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default:
        return null
    }
  }

  const temErroStorage = resultados.some(
    (r) => (r.teste === "Storage Bucket" || r.teste === "Acesso ao Bucket") && r.status === "error",
  )
  const temErroPermissao = resultados.some((r) => r.teste === "Teste de Inserção" && r.status === "error")
  const temErroUpload = resultados.some((r) => r.teste === "Teste de Upload" && r.status === "error")

  return (
    <div className="space-y-6">
      {/* Verificação de Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lime-400">Diagnóstico Completo</span>
            <Button
              onClick={verificarConfiguracao}
              disabled={verificando}
              className="bg-lime-600 hover:bg-lime-700 text-slate-900"
            >
              {verificando ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {verificando ? "Verificando..." : "Verificar Tudo"}
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {resultados.length > 0 && (
            <div className="space-y-3">
              {resultados.map((resultado, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(resultado.status)}
                    <span className="font-medium text-slate-200">{resultado.teste}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      resultado.status === "success"
                        ? "border-green-500 text-green-400"
                        : resultado.status === "error"
                          ? "border-red-500 text-red-400"
                          : "border-yellow-500 text-yellow-400"
                    }
                  >
                    {resultado.mensagem}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {resultados.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>Clique em "Verificar Tudo" para fazer diagnóstico completo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas específicos */}
      {temErroStorage && (
        <Alert className="bg-orange-500/10 border-orange-500/30">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-300">
            <div className="space-y-2">
              <p>
                <strong>Problema com Storage:</strong> Execute o Script 2 para configurar o bucket corretamente.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {temErroPermissao && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <p>
              <strong>Problema com Permissões:</strong> Execute o Script 3 para corrigir RLS e permissões das tabelas.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {temErroUpload && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <p>
              <strong>Upload Bloqueado:</strong> Execute os Scripts 2 e 3 na ordem para resolver completamente.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Scripts SQL */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-orange-400">Scripts de Correção</CardTitle>
          <p className="text-sm text-slate-400">Execute na ordem se houver problemas nos testes acima</p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="tabelas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              <TabsTrigger value="tabelas">1. Tabelas</TabsTrigger>
              <TabsTrigger value="storage">2. Storage</TabsTrigger>
              <TabsTrigger value="permissoes">3. Permissões</TabsTrigger>
              <TabsTrigger value="teste">4. Teste Final</TabsTrigger>
            </TabsList>

            {Object.entries(scripts).map(([key, script]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200">
                    Script {key === "tabelas" ? "1" : key === "storage" ? "2" : key === "permissoes" ? "3" : "4"} -{" "}
                    {key === "tabelas"
                      ? "Criar Tabelas"
                      : key === "storage"
                        ? "Configurar Storage"
                        : key === "permissoes"
                          ? "Corrigir Permissões"
                          : "Teste Final"}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarScript(script)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>

                <Textarea
                  value={script}
                  readOnly
                  className="font-mono text-sm bg-slate-900 border-slate-600 text-slate-300 min-h-[200px]"
                />

                {key === "storage" && (
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertTriangle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      <strong>Este script resolve:</strong> Bucket não encontrado, políticas conflitantes, problemas de
                      acesso
                    </AlertDescription>
                  </Alert>
                )}

                {key === "permissoes" && (
                  <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      <strong>Este script resolve:</strong> "new row violates row-level security policy" e erros de
                      permissão
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
