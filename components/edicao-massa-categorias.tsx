"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, X, Loader2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { supabase, type Mapa, type Categoria } from "@/lib/supabase"
import { toast } from "sonner"

interface EdicaoMassaCategoriasProps {
  mapas: Mapa[]
  categorias: Categoria[]
  onUpdate: () => void
}

export function EdicaoMassaCategorias({ mapas, categorias, onUpdate }: EdicaoMassaCategoriasProps) {
  const [open, setOpen] = useState(false)
  const [fazendaFiltro, setFazendaFiltro] = useState("todas")
  const [novaCategoria, setNovaCategoria] = useState("")
  const [mapasSelecionados, setMapasSelecionados] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFazendaFiltro("todas")
      setNovaCategoria("")
      setMapasSelecionados(new Set())
    }
  }, [open])

  // Get unique farms
  const fazendas = useMemo(() => {
    const uniqueFarms = Array.from(new Set(mapas.map((m) => m.fazenda))).sort()
    return uniqueFarms
  }, [mapas])

  // Filter maps based on selected farm
  const mapasFiltrados = useMemo(() => {
    if (fazendaFiltro === "todas") return mapas
    return mapas.filter((m) => m.fazenda === fazendaFiltro)
  }, [mapas, fazendaFiltro])

  const toggleMapaSelecao = (mapaId: string) => {
    const newSelection = new Set(mapasSelecionados)
    if (newSelection.has(mapaId)) {
      newSelection.delete(mapaId)
    } else {
      newSelection.add(mapaId)
    }
    setMapasSelecionados(newSelection)
  }

  const selecionarTodos = () => {
    const todosIds = new Set(mapasFiltrados.map((m) => m.id))
    setMapasSelecionados(todosIds)
  }

  const limparSelecao = () => {
    setMapasSelecionados(new Set())
  }

  const atualizarCategorias = async () => {
    if (mapasSelecionados.size === 0) {
      toast.error("Selecione pelo menos um mapa")
      return
    }

    if (!novaCategoria) {
      toast.error("Selecione uma categoria")
      return
    }

    setSalvando(true)

    try {
      const { error } = await supabase
        .from("maps")
        .update({ categoria_id: novaCategoria })
        .in("id", Array.from(mapasSelecionados))

      if (error) throw error

      const categoria = categorias.find((c) => c.id === novaCategoria)
      toast.success(`${mapasSelecionados.size} mapas atualizados para categoria "${categoria?.nome}"`)

      setOpen(false)
      onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar categorias:", error)
      toast.error("Erro ao atualizar categorias")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-slate-900 bg-transparent"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edição em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Editar Categorias em Massa</DialogTitle>
          <p className="text-slate-400 text-sm">Selecione os mapas e a nova categoria</p>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Filtrar por Fazenda</Label>
              <Select value={fazendaFiltro} onValueChange={setFazendaFiltro}>
                <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="todas">Todas as fazendas</SelectItem>
                  {fazendas.map((fazenda) => (
                    <SelectItem key={fazenda} value={fazenda}>
                      {fazenda}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Nova Categoria</Label>
              <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-200">
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

          {/* Controles de Seleção */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={selecionarTodos}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Todos
              </Button>
              <Button
                onClick={limparSelecao}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Limpar
              </Button>
            </div>

            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {mapasSelecionados.size} de {mapasFiltrados.length} mapas selecionados
            </Badge>
          </div>

          {/* Lista de Mapas */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {mapasFiltrados.length === 0 ? (
              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-4 text-center">
                  <p className="text-slate-400">Nenhum mapa encontrado</p>
                </CardContent>
              </Card>
            ) : (
              mapasFiltrados.map((mapa) => {
                const categoria = categorias.find((c) => c.id === mapa.categoria_id)
                const isSelected = mapasSelecionados.has(mapa.id)

                return (
                  <Card
                    key={mapa.id}
                    className={`bg-slate-700 border-slate-600 cursor-pointer transition-colors ${
                      isSelected ? "ring-2 ring-orange-500 bg-slate-600" : "hover:bg-slate-650"
                    }`}
                    onClick={() => toggleMapaSelecao(mapa.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleMapaSelecao(mapa.id)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-200 truncate">{mapa.nome}</h4>
                          <p className="text-sm text-slate-400">Fazenda: {mapa.fazenda}</p>
                        </div>

                        {categoria && (
                          <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                            {categoria.nome}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <Button
              onClick={atualizarCategorias}
              disabled={salvando || mapasSelecionados.size === 0 || !novaCategoria}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando {mapasSelecionados.size} Mapas...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Atualizar {mapasSelecionados.size} Mapas
                </>
              )}
            </Button>

            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="border-slate-600 text-slate-400 hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
