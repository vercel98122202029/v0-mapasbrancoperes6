"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Save, X, Loader2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase, type Categoria } from "@/lib/supabase"
import { toast } from "sonner"

interface GerenciarCategoriasProps {
  categorias: Categoria[]
  onUpdate: () => void
}

export function GerenciarCategorias({ categorias, onUpdate }: GerenciarCategoriasProps) {
  const [open, setOpen] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState("")
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEditando, setNomeEditando] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [contadorMapas, setContadorMapas] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      carregarContadorMapas()
    }
  }, [open, categorias])

  const carregarContadorMapas = async () => {
    try {
      const { data, error } = await supabase.from("maps").select("categoria_id")

      if (error) throw error

      const contador: Record<string, number> = {}
      data.forEach((mapa) => {
        if (mapa.categoria_id) {
          contador[mapa.categoria_id] = (contador[mapa.categoria_id] || 0) + 1
        }
      })

      setContadorMapas(contador)
    } catch (error) {
      console.error("Erro ao carregar contador:", error)
    }
  }

  const adicionarCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }

    // Verificar se já existe
    if (categorias.some((c) => c.nome.toLowerCase() === novaCategoria.toLowerCase())) {
      toast.error("Já existe uma categoria com este nome")
      return
    }

    setSalvando(true)

    try {
      const { error } = await supabase.from("categorias").insert({ nome: novaCategoria.trim() })

      if (error) throw error

      toast.success("Categoria adicionada com sucesso!")
      setNovaCategoria("")
      onUpdate()
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error)
      toast.error("Erro ao adicionar categoria")
    } finally {
      setSalvando(false)
    }
  }

  const iniciarEdicao = (categoria: Categoria) => {
    setEditandoId(categoria.id)
    setNomeEditando(categoria.nome)
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setNomeEditando("")
  }

  const salvarEdicao = async () => {
    if (!nomeEditando.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }

    // Verificar se já existe (exceto a atual)
    if (categorias.some((c) => c.id !== editandoId && c.nome.toLowerCase() === nomeEditando.toLowerCase())) {
      toast.error("Já existe uma categoria com este nome")
      return
    }

    setSalvando(true)

    try {
      const { error } = await supabase.from("categorias").update({ nome: nomeEditando.trim() }).eq("id", editandoId)

      if (error) throw error

      toast.success("Categoria atualizada com sucesso!")
      setEditandoId(null)
      setNomeEditando("")
      onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria")
    } finally {
      setSalvando(false)
    }
  }

  const excluirCategoria = async (categoria: Categoria) => {
    const numMapas = contadorMapas[categoria.id] || 0

    if (numMapas > 0) {
      toast.error(`Não é possível excluir. Esta categoria possui ${numMapas} mapa(s) associado(s)`)
      return
    }

    setExcluindo(categoria.id)

    try {
      const { error } = await supabase.from("categorias").delete().eq("id", categoria.id)

      if (error) throw error

      toast.success("Categoria excluída com sucesso!")
      onUpdate()
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast.error("Erro ao excluir categoria")
    } finally {
      setExcluindo(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editandoId) {
        salvarEdicao()
      } else {
        adicionarCategoria()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-slate-900 bg-transparent"
        >
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lime-400">Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar Nova Categoria */}
          <div className="space-y-2">
            <Label className="text-slate-300">Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria..."
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-600 border-slate-500 text-slate-200"
                disabled={salvando}
              />
              <Button
                onClick={adicionarCategoria}
                disabled={salvando || !novaCategoria.trim()}
                className="bg-lime-600 hover:bg-lime-700"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Lista de Categorias */}
          <div className="space-y-2">
            <Label className="text-slate-300">Categorias Existentes ({categorias.length})</Label>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {categorias.length === 0 ? (
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400">Nenhuma categoria cadastrada</p>
                  </CardContent>
                </Card>
              ) : (
                categorias.map((categoria) => {
                  const numMapas = contadorMapas[categoria.id] || 0
                  const isEditando = editandoId === categoria.id

                  return (
                    <Card key={categoria.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {isEditando ? (
                              <Input
                                value={nomeEditando}
                                onChange={(e) => setNomeEditando(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="bg-slate-600 border-slate-500 text-slate-200"
                                disabled={salvando}
                                autoFocus
                              />
                            ) : (
                              <>
                                <span className="font-medium text-slate-200">{categoria.nome}</span>
                                <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                                  {numMapas} {numMapas === 1 ? "mapa" : "mapas"}
                                </Badge>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditando ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={salvarEdicao}
                                  disabled={salvando}
                                  className="bg-lime-600 hover:bg-lime-700"
                                >
                                  {salvando ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelarEdicao}
                                  disabled={salvando}
                                  className="border-slate-500 text-slate-400 hover:bg-slate-600 bg-transparent"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => iniciarEdicao(categoria)}
                                  className="border-slate-500 text-slate-400 hover:bg-slate-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
                                      disabled={excluindo === categoria.id}
                                    >
                                      {excluindo === categoria.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-slate-800 border-slate-700">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-slate-200">Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-400">
                                        {numMapas > 0 ? (
                                          <>
                                            Não é possível excluir a categoria "{categoria.nome}" pois ela possui{" "}
                                            <strong>{numMapas} mapa(s)</strong> associado(s).
                                            <br />
                                            <br />
                                            Mova os mapas para outra categoria antes de excluir.
                                          </>
                                        ) : (
                                          <>
                                            Tem certeza que deseja excluir a categoria "{categoria.nome}"?
                                            <br />
                                            Esta ação não pode ser desfeita.
                                          </>
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
                                        Cancelar
                                      </AlertDialogCancel>
                                      {numMapas === 0 && (
                                        <AlertDialogAction
                                          onClick={() => excluirCategoria(categoria)}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      )}
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
