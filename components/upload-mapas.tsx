"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, FileText, AlertCircle, CheckCircle, Clock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase, type Categoria } from "@/lib/supabase"
import { toast } from "sonner"

interface UploadMapasProps {
  categorias: Categoria[]
  onUploadComplete: () => void
}

interface ArquivoUpload {
  file: File
  nome: string
  fazenda: string
  status: "pending" | "uploading" | "success" | "error"
  tentativas: number
  erro?: string
}

export function UploadMapas({ categorias, onUploadComplete }: UploadMapasProps) {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([])
  const [fazendaPadrao, setFazendaPadrao] = useState("")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progresso, setProgresso] = useState(0)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const novosArquivos: ArquivoUpload[] = files.map((file) => ({
        file,
        nome: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
        fazenda: fazendaPadrao,
        status: "pending",
        tentativas: 0,
      }))

      setArquivos((prev) => [...prev, ...novosArquivos])
      toast.success(`${files.length} arquivo(s) adicionado(s)`)
    },
    [fazendaPadrao],
  )

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index))
  }

  const atualizarArquivo = (index: number, updates: Partial<ArquivoUpload>) => {
    setArquivos((prev) => prev.map((arquivo, i) => (i === index ? { ...arquivo, ...updates } : arquivo)))
  }

  const sanitizarNome = (nome: string): string => {
    return nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "_") // Substitui espaços por underscore
      .toLowerCase()
  }

  const fazerUploadArquivo = async (arquivo: ArquivoUpload, index: number): Promise<boolean> => {
    const maxTentativas = 3
    const tentativa = arquivo.tentativas + 1

    atualizarArquivo(index, {
      status: "uploading",
      tentativas: tentativa,
      erro: undefined,
    })

    try {
      // Sanitizar nome do arquivo
      const nomeArquivo = sanitizarNome(arquivo.file.name)
      const timestamp = Date.now()
      const nomeUnico = `${timestamp}_${nomeArquivo}`

      console.log(`Tentativa ${tentativa}/${maxTentativas} - Upload: ${nomeUnico}`)

      // Upload do arquivo com timeout
      const uploadPromise = supabase.storage.from("mapas").upload(nomeUnico, arquivo.file, {
        cacheControl: "3600",
        upsert: false,
      })

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout no upload")), 30000))

      const { data: uploadData, error: uploadError } = (await Promise.race([uploadPromise, timeoutPromise])) as any

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage.from("mapas").getPublicUrl(nomeUnico)

      // Inserir no banco com timeout
      const dbPromise = supabase.from("maps").insert({
        nome: arquivo.nome,
        fazenda: arquivo.fazenda,
        arquivo_url: urlData.publicUrl,
        categoria_id: categoriaSelecionada || null,
      })

      const dbTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout no banco de dados")), 15000),
      )

      const { error: dbError } = (await Promise.race([dbPromise, dbTimeoutPromise])) as any

      if (dbError) throw dbError

      atualizarArquivo(index, { status: "success" })
      console.log(`✅ Sucesso: ${nomeUnico}`)
      return true
    } catch (error: any) {
      const mensagemErro = error.message || "Erro desconhecido"
      console.error(`❌ Erro tentativa ${tentativa}: ${mensagemErro}`)

      if (tentativa < maxTentativas) {
        // Aguardar antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, 2000))

        atualizarArquivo(index, { tentativas: tentativa })
        return fazerUploadArquivo(arquivo, index)
      } else {
        atualizarArquivo(index, {
          status: "error",
          erro: mensagemErro,
          tentativas: tentativa,
        })
        return false
      }
    }
  }

  const fazerUpload = async () => {
    if (arquivos.length === 0) {
      toast.error("Selecione pelo menos um arquivo")
      return
    }

    if (!categoriaSelecionada) {
      toast.error("Selecione uma categoria")
      return
    }

    setUploading(true)
    setProgresso(0)

    try {
      const totalArquivos = arquivos.length
      let sucessos = 0
      let falhas = 0

      // Determinar tamanho do lote baseado na quantidade
      const tamanheLote = totalArquivos > 100 ? 5 : totalArquivos > 50 ? 8 : 10
      const pausaEntreLotes = totalArquivos > 100 ? 2000 : 500

      console.log(`🚀 Iniciando upload de ${totalArquivos} arquivos em lotes de ${tamanheLote}`)

      // Processar em lotes
      for (let i = 0; i < totalArquivos; i += tamanheLote) {
        const lote = arquivos.slice(i, i + tamanheLote)
        const numeroLote = Math.floor(i / tamanheLote) + 1
        const totalLotes = Math.ceil(totalArquivos / tamanheLote)

        console.log(`📦 Processando lote ${numeroLote}/${totalLotes} (${lote.length} arquivos)`)

        // Processar lote em paralelo
        const promessasLote = lote.map((arquivo, indexRelativo) => {
          const indexAbsoluto = i + indexRelativo
          return fazerUploadArquivo(arquivo, indexAbsoluto)
        })

        const resultadosLote = await Promise.all(promessasLote)

        // Contar sucessos e falhas do lote
        resultadosLote.forEach((sucesso) => {
          if (sucesso) sucessos++
          else falhas++
        })

        // Atualizar progresso
        const progressoAtual = Math.round(((i + lote.length) / totalArquivos) * 100)
        setProgresso(progressoAtual)

        // Pausa entre lotes (exceto no último)
        if (i + tamanheLote < totalArquivos) {
          console.log(`⏳ Pausa de ${pausaEntreLotes}ms antes do próximo lote...`)
          await new Promise((resolve) => setTimeout(resolve, pausaEntreLotes))
        }
      }

      // Resultado final
      console.log(`🏁 Upload concluído: ${sucessos} sucessos, ${falhas} falhas`)

      if (sucessos > 0) {
        toast.success(`${sucessos} mapa(s) enviado(s) com sucesso!`)
        onUploadComplete()
      }

      if (falhas > 0) {
        toast.error(`${falhas} arquivo(s) falharam. Verifique os detalhes.`)
      }
    } catch (error) {
      console.error("Erro geral no upload:", error)
      toast.error("Erro inesperado durante o upload")
    } finally {
      setUploading(false)
      setProgresso(0)
    }
  }

  const tentarNovamente = async () => {
    const arquivosFalharam = arquivos.filter((a) => a.status === "error")

    if (arquivosFalharam.length === 0) {
      toast.info("Não há arquivos com falha para tentar novamente")
      return
    }

    // Reset status dos arquivos com falha
    arquivosFalharam.forEach((_, index) => {
      const indexOriginal = arquivos.findIndex((a) => a.status === "error")
      if (indexOriginal !== -1) {
        atualizarArquivo(indexOriginal, {
          status: "pending",
          tentativas: 0,
          erro: undefined,
        })
      }
    })

    toast.info(`Tentando novamente ${arquivosFalharam.length} arquivo(s)...`)
    await fazerUpload()
  }

  const limparLista = () => {
    setArquivos([])
    setProgresso(0)
  }

  const getStatusIcon = (status: ArquivoUpload["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-slate-400" />
      case "uploading":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: ArquivoUpload["status"]) => {
    switch (status) {
      case "pending":
        return "bg-slate-600"
      case "uploading":
        return "bg-blue-600"
      case "success":
        return "bg-green-600"
      case "error":
        return "bg-red-600"
    }
  }

  const arquivosPendentes = arquivos.filter((a) => a.status === "pending").length
  const arquivosProcessando = arquivos.filter((a) => a.status === "uploading").length
  const arquivosSucesso = arquivos.filter((a) => a.status === "success").length
  const arquivosErro = arquivos.filter((a) => a.status === "error").length

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload de Mapas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configurações Iniciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Fazenda Padrão</Label>
            <Input
              placeholder="Nome da fazenda..."
              value={fazendaPadrao}
              onChange={(e) => setFazendaPadrao(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>

          <div>
            <Label className="text-slate-300">Categoria</Label>
            <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seleção de Arquivos */}
        <div>
          <Label className="text-slate-300">Selecionar Arquivos PDF</Label>
          <div className="mt-2">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`
                flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                ${
                  uploading
                    ? "border-slate-600 bg-slate-700/50 cursor-not-allowed"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500"
                }
                transition-colors
              `}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-300">
                  {uploading ? "Upload em andamento..." : "Clique para selecionar arquivos PDF"}
                </p>
                <p className="text-sm text-slate-500">Múltiplos arquivos suportados</p>
              </div>
            </label>
          </div>
        </div>

        {/* Estatísticas */}
        {arquivos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{arquivosPendentes}</div>
              <div className="text-sm text-slate-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{arquivosProcessando}</div>
              <div className="text-sm text-slate-500">Processando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{arquivosSucesso}</div>
              <div className="text-sm text-slate-500">Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{arquivosErro}</div>
              <div className="text-sm text-slate-500">Falhas</div>
            </div>
          </div>
        )}

        {/* Barra de Progresso */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Progresso do Upload</span>
              <span className="text-slate-400">{progresso}%</span>
            </div>
            <Progress value={progresso} className="bg-slate-700" />
          </div>
        )}

        {/* Lista de Arquivos */}
        {arquivos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Arquivos Selecionados ({arquivos.length})</Label>
              <Button
                onClick={limparLista}
                size="sm"
                variant="outline"
                disabled={uploading}
                className="border-slate-600 text-slate-400 hover:bg-slate-700 bg-transparent"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {arquivos.map((arquivo, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(arquivo.status)} border-slate-600`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(arquivo.status)}
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">{arquivo.nome}</p>
                        <p className="text-sm text-slate-400">Fazenda: {arquivo.fazenda}</p>
                        {arquivo.status === "uploading" && arquivo.tentativas > 0 && (
                          <p className="text-xs text-blue-400">Tentativa {arquivo.tentativas}/3</p>
                        )}
                        {arquivo.erro && <p className="text-xs text-red-400 mt-1">Erro: {arquivo.erro}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          arquivo.status === "success"
                            ? "bg-green-600 text-white"
                            : arquivo.status === "error"
                              ? "bg-red-600 text-white"
                              : arquivo.status === "uploading"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-600 text-slate-300"
                        }`}
                      >
                        {arquivo.status === "pending" && "Aguardando"}
                        {arquivo.status === "uploading" && "Enviando"}
                        {arquivo.status === "success" && "Sucesso"}
                        {arquivo.status === "error" && "Falha"}
                      </Badge>

                      {!uploading && (
                        <Button
                          onClick={() => removerArquivo(index)}
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-400 hover:bg-slate-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            onClick={fazerUpload}
            disabled={uploading || arquivos.length === 0 || !categoriaSelecionada}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando {arquivosSucesso + arquivosErro}/{arquivos.length}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar {arquivos.length} Arquivo(s)
              </>
            )}
          </Button>

          {arquivosErro > 0 && !uploading && (
            <Button
              onClick={tentarNovamente}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente ({arquivosErro})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
