"use client"

import { useState, useEffect } from "react"
import { Plus, Map, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogoAnimado } from "@/components/logo-animado"
import { UploadMapas } from "@/components/upload-mapas"
import { ListaMapas } from "@/components/lista-mapas"
import { VisualizadorMapa } from "@/components/visualizador-mapa"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { supabase, type Categoria, type Mapa } from "@/lib/supabase"
import { toast } from "sonner"
import { VerificadorConfiguracao } from "@/components/verificador-configuracao"

export default function HomePage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [mapaAtivo, setMapaAtivo] = useState<Mapa | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [abaSelecionada, setAbaSelecionada] = useState("mapas")

  useEffect(() => {
    carregarCategorias()
    registrarServiceWorker()
  }, [])

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase.from("categorias").select("*").order("nome")

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      toast.error("Erro ao carregar categorias")
    }
  }

  const registrarServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registrado:", registration)
      } catch (error) {
        console.log("Erro ao registrar Service Worker:", error)
      }
    }
  }

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
    setAbaSelecionada("mapas")
  }

  const handleVisualizarMapa = (mapa: Mapa) => {
    setMapaAtivo(mapa)
  }

  const handleFecharVisualizador = () => {
    setMapaAtivo(null)
    setRefreshTrigger((prev) => prev + 1) // Refresh para mostrar anotações atualizadas
  }

  const handleCategoriasAtualizar = () => {
    carregarCategorias()
    setRefreshTrigger((prev) => prev + 1) // Refresh mapas também
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <LogoAnimado />

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbaSelecionada("upload")}
                className="border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Upload
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="mapas" className="data-[state=active]:bg-lime-600 data-[state=active]:text-slate-900">
              <Map className="w-4 h-4 mr-2" />
              Mapas
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="estatisticas"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-slate-900"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mapas" className="space-y-6">
            <ListaMapas
              categorias={categorias}
              onVisualizarMapa={handleVisualizarMapa}
              refreshTrigger={refreshTrigger}
              onCategoriasAtualizar={handleCategoriasAtualizar}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UploadMapas categorias={categorias} onUploadComplete={handleUploadComplete} />
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-6">
            <VerificadorConfiguracao />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Estatísticas básicas */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-lime-400 mb-2">Total de Mapas</h3>
                <p className="text-3xl font-bold text-slate-200">-</p>
                <p className="text-sm text-slate-400">Carregando...</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">Fazendas</h3>
                <p className="text-3xl font-bold text-slate-200">-</p>
                <p className="text-sm text-slate-400">Carregando...</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Categorias</h3>
                <p className="text-3xl font-bold text-slate-200">{categorias.length}</p>
                <p className="text-sm text-slate-400">Ativas</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Com Anotações</h3>
                <p className="text-3xl font-bold text-slate-200">-</p>
                <p className="text-sm text-slate-400">Carregando...</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Visualizador de Mapa */}
      {mapaAtivo && <VisualizadorMapa mapa={mapaAtivo} onFechar={handleFecharVisualizador} />}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
