"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase, testarConexao } from "@/lib/supabase"
import { env } from "@/lib/env"

interface StatusItem {
  nome: string
  status: "loading" | "success" | "error" | "warning"
  mensagem: string
}

export function StatusSistema() {
  const [status, setStatus] = useState<StatusItem[]>([
    { nome: "Conexão Supabase", status: "loading", mensagem: "Testando..." },
    { nome: "Tabelas do Banco", status: "loading", mensagem: "Verificando..." },
    { nome: "Storage Bucket", status: "loading", mensagem: "Verificando..." },
    { nome: "Categorias Padrão", status: "loading", mensagem: "Verificando..." },
  ])

  const verificarStatus = async () => {
    const novosStatus: StatusItem[] = []

    // 1. Testar conexão
    try {
      const conexao = await testarConexao()
      novosStatus.push({
        nome: "Conexão Supabase",
        status: conexao.sucesso ? "success" : "error",
        mensagem: conexao.mensagem,
      })
    } catch (error) {
      novosStatus.push({
        nome: "Conexão Supabase",
        status: "error",
        mensagem: "Erro na conexão",
      })
    }

    // 2. Verificar tabelas
    try {
      const { data: categorias, error: errorCategorias } = await supabase.from("categorias").select("count").single()

      const { data: mapas, error: errorMapas } = await supabase.from("maps").select("count").single()

      if (errorCategorias || errorMapas) {
        novosStatus.push({
          nome: "Tabelas do Banco",
          status: "error",
          mensagem: "Tabelas não encontradas. Execute os scripts SQL.",
        })
      } else {
        novosStatus.push({
          nome: "Tabelas do Banco",
          status: "success",
          mensagem: "Tabelas criadas com sucesso",
        })
      }
    } catch (error) {
      novosStatus.push({
        nome: "Tabelas do Banco",
        status: "error",
        mensagem: "Erro ao verificar tabelas",
      })
    }

    // 3. Verificar storage bucket
    try {
      const { data, error } = await supabase.storage.listBuckets()

      if (error) throw error

      const bucketMapas = data?.find((bucket) => bucket.id === env.STORAGE_BUCKET)

      if (bucketMapas) {
        novosStatus.push({
          nome: "Storage Bucket",
          status: "success",
          mensagem: `Bucket '${env.STORAGE_BUCKET}' configurado`,
        })
      } else {
        novosStatus.push({
          nome: "Storage Bucket",
          status: "error",
          mensagem: `Bucket '${env.STORAGE_BUCKET}' não encontrado`,
        })
      }
    } catch (error) {
      novosStatus.push({
        nome: "Storage Bucket",
        status: "error",
        mensagem: "Erro ao verificar storage",
      })
    }

    // 4. Verificar categorias padrão
    try {
      const { data, error } = await supabase.from("categorias").select("*")

      if (error) throw error

      if (data && data.length > 0) {
        novosStatus.push({
          nome: "Categorias Padrão",
          status: "success",
          mensagem: `${data.length} categorias encontradas`,
        })
      } else {
        novosStatus.push({
          nome: "Categorias Padrão",
          status: "warning",
          mensagem: "Nenhuma categoria encontrada",
        })
      }
    } catch (error) {
      novosStatus.push({
        nome: "Categorias Padrão",
        status: "error",
        mensagem: "Erro ao verificar categorias",
      })
    }

    setStatus(novosStatus)
  }

  useEffect(() => {
    verificarStatus()
  }, [])

  const getStatusIcon = (status: StatusItem["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: StatusItem["status"]) => {
    switch (status) {
      case "loading":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  const todosOk = status.every((item) => item.status === "success")
  const temErros = status.some((item) => item.status === "error")

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lime-400">Status do Sistema</span>
          <Badge
            variant="outline"
            className={
              todosOk
                ? "border-green-500 text-green-400"
                : temErros
                  ? "border-red-500 text-red-400"
                  : "border-yellow-500 text-yellow-400"
            }
          >
            {todosOk ? "Tudo OK" : temErros ? "Com Erros" : "Verificando"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <span className="font-medium text-slate-200">{item.nome}</span>
            </div>
            <Badge variant="outline" className={getStatusColor(item.status)}>
              {item.mensagem}
            </Badge>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-600">
          <Button
            onClick={verificarStatus}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
          >
            Verificar Novamente
          </Button>
        </div>

        {/* Informações de configuração */}
        <div className="pt-4 border-t border-slate-600 space-y-2">
          <h4 className="font-semibold text-slate-300">Configuração Atual:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Supabase URL:</span>
              <span className="text-slate-300 font-mono text-xs">
                {env.SUPABASE_URL.replace("https://", "").substring(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Bucket:</span>
              <span className="text-slate-300">{env.STORAGE_BUCKET}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">App Name:</span>
              <span className="text-slate-300">{env.APP_NAME}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Empresa:</span>
              <span className="text-slate-300">{env.EMPRESA}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
