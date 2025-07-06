"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Filter, MapPin, Eye, Trash2, ExternalLink, Globe, Navigation } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { supabase, type Mapa, type Categoria } from "@/lib/supabase"
import { toast } from "sonner"
import { formatarCoordenadas, gerarLinkGoogleMaps, gerarLinkGoogleEarth } from "@/lib/utils"
import { EditarCoordenadas } from "@/components/editar-coordenadas"
import { GerenciarCategorias } from "@/components/gerenciar-categorias"
import { EdicaoMassaCategorias } from "@/components/edicao-massa-categorias"

interface ListaMapasProps {
  categorias: Categoria[]
  onVisualizarMapa: (mapa: Mapa) => void
  refreshTrigger: number
  onCategoriasAtualizar: () => void
}

export function ListaMapas({ categorias, onVisualizarMapa, refreshTrigger, onCategoriasAtualizar }: ListaMapasProps) {
  const [mapas, setMapas] = useState<Mapa[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas")
  const [isMobile, setIsMobile] = useState(false)
  const [mapaExcluindo, setMapaExcluindo] = useState<Mapa | null>(null)

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Carregar mapas do banco
  const carregarMapas = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("maps").select("*").order("criado_em", { ascending: false })
      if (error) throw error
      setMapas(data || [])
    } catch (error) {
      console.error("Erro ao carregar mapas:", error)
      toast.error("Erro ao carregar mapas")
    } finally {
      setLoading(false)
    }
  }, [])

  // Recarregar quando refreshTrigger mudar
  useEffect(() => {
    carregarMapas()
  }, [carregarMapas, refreshTrigger])

  // Excluir mapa
  const excluirMapa = async () => {
    if (!mapaExcluindo) return

    try {
      // Excluir arquivo do storage
      const nomeArquivo = mapaExcluindo.arquivo_url?.split("/").pop()
      if (nomeArquivo) {
        await supabase.storage.from("mapas").remove([nomeArquivo])
      }

      // Excluir do banco
      const { error } = await supabase.from("maps").delete().eq("id", mapaExcluindo.id)
      if (error) throw error

      toast.success("Mapa excluído com sucesso!")
      setMapaExcluindo(null)
      carregarMapas()
    } catch (error) {
      console.error("Erro ao excluir mapa:", error)
      toast.error("Erro ao excluir mapa")
    }
  }

  // Abrir Google Maps
  const abrirGoogleMaps = (mapa: Mapa) => {
    if (!mapa.latitude || !mapa.longitude) {
      toast.error("Coordenadas não disponíveis")
      return
    }

    const url = gerarLinkGoogleMaps(mapa.latitude, mapa.longitude)
    window.open(url, "_blank", "noopener,noreferrer")
    toast.success("Abrindo no Google Maps...")
  }

  // Abrir Google Earth
  const abrirGoogleEarth = (mapa: Mapa) => {
    if (!mapa.latitude || !mapa.longitude) {
      toast.error("Coordenadas não disponíveis")
      return
    }

    const url = gerarLinkGoogleEarth(mapa.latitude, mapa.longitude)
    window.open(url, "_blank", "noopener,noreferrer")
    toast.success("Abrindo no Google Earth...")
  }

  // Filtrar mapas
  const mapasFiltrados = useMemo(() => {
    return mapas.filter((mapa) => {
      const matchBusca =
        mapa.nome.toLowerCase().includes(busca.toLowerCase()) ||
        mapa.fazenda.toLowerCase().includes(busca.toLowerCase())
      const matchCategoria = categoriaFiltro === "todas" || mapa.categoria_id === categoriaFiltro
      return matchBusca && matchCategoria
    })
  }, [mapas, busca, categoriaFiltro])

  const obterNomeCategoria = (categoriaId: string) => {
    return categorias.find((c) => c.id === categoriaId)?.nome || "Sem categoria"
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Carregando mapas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className={isMobile ? "p-4" : ""}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lime-400 ${isMobile ? "text-lg" : ""}`}>Mapas Cadastrados</CardTitle>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {mapasFiltrados.length} mapas
            </Badge>
          </div>

          {/* Botões de Ação - Stack em Mobile */}
          <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row justify-end"}`}>
            <GerenciarCategorias categorias={categorias} onUpdate={onCategoriasAtualizar} />
            {mapas.length > 0 && (
              <EdicaoMassaCategorias mapas={mapas} categorias={categorias} onUpdate={carregarMapas} />
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className={`flex gap-4 ${isMobile ? "flex-col" : "flex-row"}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou fazenda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>

          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className={`bg-slate-700 border-slate-600 text-slate-200 ${isMobile ? "w-full" : "w-48"}`}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className={isMobile ? "p-4" : ""}>
        {mapasFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className={`font-semibold text-slate-400 mb-2 ${isMobile ? "text-lg" : "text-xl"}`}>
              Nenhum mapa encontrado
            </h3>
            <p className="text-slate-500">
              {mapas.length === 0 ? "Faça o upload dos seus primeiros mapas" : "Tente ajustar os filtros de busca"}
            </p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"}`}>
            {mapasFiltrados.map((mapa) => {
              const temCoordenadas = mapa.latitude && mapa.longitude

              return (
                <Card key={mapa.id} className="bg-slate-700 border-slate-600 hover:border-slate-500 transition-colors">
                  <CardContent className={isMobile ? "p-4" : "p-4"}>
                    {/* Header do Mapa */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-slate-200 truncate ${isMobile ? "text-base" : "text-lg"}`}
                          title={mapa.nome}
                        >
                          {mapa.nome}
                        </h3>
                        <p className={`text-slate-400 ${isMobile ? "text-sm" : "text-sm"}`}>Fazenda: {mapa.fazenda}</p>
                        <Badge
                          variant="outline"
                          className={`mt-2 border-slate-500 text-slate-300 ${isMobile ? "text-xs" : "text-xs"}`}
                        >
                          {obterNomeCategoria(mapa.categoria_id)}
                        </Badge>
                      </div>
                    </div>

                    {/* Seção de Coordenadas */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-lime-400" />
                        <span className="text-sm font-medium text-slate-300">Coordenadas GPS</span>
                        {temCoordenadas && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                            Ativo
                          </Badge>
                        )}
                      </div>

                      {temCoordenadas ? (
                        <div className="space-y-3">
                          {/* Display das Coordenadas */}
                          <div className="p-3 bg-slate-600 rounded-lg border border-slate-500">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">Localização Precisa</span>
                              <MapPin className="w-3 h-3 text-lime-400" />
                            </div>
                            <p className="font-mono text-sm text-slate-200 break-all">
                              {formatarCoordenadas(mapa.latitude, mapa.longitude)}
                            </p>
                          </div>

                          {/* Botões de Navegação com Precisão */}
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() => abrirGoogleMaps(mapa)}
                              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                            >
                              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2">
                                <ExternalLink className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className={isMobile ? "text-xs" : "text-sm"}>Maps</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => abrirGoogleEarth(mapa)}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                            >
                              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2">
                                <Globe className="w-3 h-3 text-green-600" />
                              </div>
                              <span className={isMobile ? "text-xs" : "text-sm"}>Earth</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-600/50 rounded-lg border border-dashed border-slate-500">
                          <div className="text-center">
                            <MapPin className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                            <p className="text-xs text-slate-400 mb-2">Coordenadas não adicionadas</p>
                            <p className="text-xs text-slate-500">Clique em "Editar GPS" para adicionar</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ações Principais */}
                    <div className="space-y-3">
                      {/* Visualizar e Excluir */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onVisualizarMapa(mapa)}
                          className={`flex-1 bg-lime-600 hover:bg-lime-700 text-slate-900 ${isMobile ? "text-sm" : ""}`}
                        >
                          <Eye className={`mr-2 ${isMobile ? "w-4 h-4" : "w-4 h-4"}`} />
                          Visualizar
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMapaExcluindo(mapa)}
                              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className={isMobile ? "w-4 h-4" : "w-4 h-4"} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-slate-200">Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Tem certeza que deseja excluir o mapa "{mapaExcluindo?.nome}"? Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setMapaExcluindo(null)}
                                className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                              >
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={excluirMapa}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Editar GPS */}
                      <EditarCoordenadas mapa={mapa} onSalvar={carregarMapas} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
