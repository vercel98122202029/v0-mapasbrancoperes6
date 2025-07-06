"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  Pencil,
  Square,
  Type,
  Eraser,
  Save,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, type Mapa } from "@/lib/supabase"
import { toast } from "sonner"

interface VisualizadorMapaProps {
  mapa: Mapa
  onFechar: () => void
}

export function VisualizadorMapa({ mapa, onFechar }: VisualizadorMapaProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [ferramentaAtiva, setFerramentaAtiva] = useState<string | null>(null)
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false)
  const [pdfCarregado, setPdfCarregado] = useState(false)
  const [erroPdf, setErroPdf] = useState(false)
  const [tentativasCarregamento, setTentativasCarregamento] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotacao, setRotacao] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfViewerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = isMobile ? 3 : 2
    ctx.strokeStyle = "#84cc16"
    ctx.globalAlpha = 0.8

    // Carregar anotações existentes se houver
    if (mapa.anotacoes && Object.keys(mapa.anotacoes).length > 0) {
      console.log("Carregando anotações:", mapa.anotacoes)
    }
  }, [mapa.anotacoes, isMobile])

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ferramentaAtiva || ferramentaAtiva !== "pencil") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    setIsDrawing(true)
    setLastPosition({ x, y })
  }

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ferramentaAtiva || ferramentaAtiva !== "pencil") return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(lastPosition.x, lastPosition.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastPosition({ x, y })
  }

  const pararDesenho = () => {
    setIsDrawing(false)
  }

  const limparCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const salvarAnotacoes = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setSalvandoAnotacoes(true)

    try {
      const imageData = canvas.toDataURL("image/png")

      const { error } = await supabase
        .from("maps")
        .update({
          anotacoes: {
            imageData,
            timestamp: new Date().toISOString(),
          },
        })
        .eq("id", mapa.id)

      if (error) throw error

      toast.success("Anotações salvas!")
    } catch (error) {
      toast.error("Erro ao salvar anotações")
    } finally {
      setSalvandoAnotacoes(false)
    }
  }

  const baixarMapa = () => {
    const link = document.createElement("a")
    link.href = mapa.arquivo_url
    link.download = mapa.nome
    link.target = "_blank"
    link.click()
  }

  const abrirPdfExterno = () => {
    window.open(mapa.arquivo_url, "_blank")
  }

  const carregarPdfInterno = () => {
    setErroPdf(false)
    setPdfCarregado(false)
    setTentativasCarregamento((prev) => prev + 1)

    const viewer = pdfViewerRef.current
    if (!viewer) return

    // Limpar conteúdo anterior
    viewer.innerHTML = ""

    // Criar iframe otimizado para PDF
    const iframe = document.createElement("iframe")

    // URLs otimizadas para visualização interna
    const pdfUrls = [
      // PDF.js viewer (funciona melhor internamente)
      `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(mapa.arquivo_url)}`,
      // Google Docs viewer
      `https://docs.google.com/viewer?url=${encodeURIComponent(mapa.arquivo_url)}&embedded=true`,
      // Direto com parâmetros otimizados
      `${mapa.arquivo_url}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width&view=FitH`,
      // Fallback simples
      mapa.arquivo_url,
    ]

    const urlIndex = tentativasCarregamento % pdfUrls.length
    iframe.src = pdfUrls[urlIndex]

    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "none"
    iframe.style.transform = `scale(${zoom}) rotate(${rotacao}deg)`
    iframe.style.transformOrigin = "center center"

    iframe.onload = () => {
      setPdfCarregado(true)
      setErroPdf(false)
      console.log(`PDF carregado com sucesso usando: ${pdfUrls[urlIndex]}`)
    }

    iframe.onerror = () => {
      setErroPdf(true)
      setPdfCarregado(false)
      console.log(`Erro ao carregar PDF com: ${pdfUrls[urlIndex]}`)
    }

    viewer.appendChild(iframe)
  }

  const ajustarZoom = (delta: number) => {
    const novoZoom = Math.max(0.5, Math.min(3, zoom + delta))
    setZoom(novoZoom)

    const iframe = pdfViewerRef.current?.querySelector("iframe")
    if (iframe) {
      iframe.style.transform = `scale(${novoZoom}) rotate(${rotacao}deg)`
    }
  }

  const rotacionarPdf = () => {
    const novaRotacao = (rotacao + 90) % 360
    setRotacao(novaRotacao)

    const iframe = pdfViewerRef.current?.querySelector("iframe")
    if (iframe) {
      iframe.style.transform = `scale(${zoom}) rotate(${novaRotacao}deg)`
    }
  }

  // Carregar PDF automaticamente
  useEffect(() => {
    carregarPdfInterno()
  }, [mapa.arquivo_url])

  const ferramentas = [
    { id: "pencil", icon: Pencil, label: "Desenho" },
    { id: "square", icon: Square, label: "Retângulo" },
    { id: "text", icon: Type, label: "Texto" },
    { id: "eraser", icon: Eraser, label: "Apagar" },
  ]

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900 ${fullscreen ? "" : isMobile ? "p-2" : "p-4"}`}>
      <Card
        className={`h-full bg-slate-800 border-slate-700 ${fullscreen ? "rounded-none" : "rounded-xl"} flex flex-col`}
      >
        {/* Header Compacto para Mobile */}
        <CardHeader className={`flex-row items-center justify-between space-y-0 ${isMobile ? "p-3 pb-2" : "p-6 pb-4"}`}>
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-lime-400 ${isMobile ? "text-lg" : "text-xl"} truncate`}>{mapa.nome}</CardTitle>
            <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"} truncate`}>Fazenda: {mapa.fazenda}</p>
          </div>

          <div className="flex items-center gap-1">
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreen(!fullscreen)}
                className="border-slate-600 text-slate-300"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onFechar}
              className="border-slate-600 text-slate-300 bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className={`flex-1 flex flex-col ${isMobile ? "p-2" : "p-4"} min-h-0`}>
          {/* Barra de Ferramentas Responsiva */}
          <div
            className={`flex items-center gap-1 mb-3 p-2 bg-slate-700 rounded-lg overflow-x-auto ${isMobile ? "text-xs" : ""}`}
          >
            {/* Ferramentas de Desenho */}
            <div className="flex gap-1 flex-shrink-0">
              {ferramentas.map((ferramenta) => (
                <Button
                  key={ferramenta.id}
                  variant={ferramentaAtiva === ferramenta.id ? "default" : "ghost"}
                  size={isMobile ? "sm" : "sm"}
                  onClick={() => setFerramentaAtiva(ferramentaAtiva === ferramenta.id ? null : ferramenta.id)}
                  className={`${
                    ferramentaAtiva === ferramenta.id
                      ? "bg-lime-600 text-slate-900"
                      : "text-slate-300 hover:bg-slate-600"
                  } ${isMobile ? "px-2" : ""}`}
                  title={ferramenta.label}
                >
                  <ferramenta.icon className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-600 mx-1" />

            {/* Controles de PDF */}
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => ajustarZoom(-0.2)}
                className="text-blue-400 hover:bg-blue-500/20 px-2"
                title="Diminuir Zoom"
              >
                <ZoomOut className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => ajustarZoom(0.2)}
                className="text-blue-400 hover:bg-blue-500/20 px-2"
                title="Aumentar Zoom"
              >
                <ZoomIn className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={rotacionarPdf}
                className="text-purple-400 hover:bg-purple-500/20 px-2"
                title="Rotacionar"
              >
                <RotateCw className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-600 mx-1" />

            {/* Ações */}
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={limparCanvas}
                className="text-red-400 hover:bg-red-500/20 px-2"
                title="Limpar"
              >
                <Eraser className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={carregarPdfInterno}
                className="text-orange-400 hover:bg-orange-500/20 px-2"
                title="Recarregar"
              >
                <RefreshCw className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={salvarAnotacoes}
                disabled={salvandoAnotacoes}
                className="text-lime-400 hover:bg-lime-500/20 px-2"
                title="Salvar"
              >
                <Save className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={baixarMapa}
                className="text-green-400 hover:bg-green-500/20 px-2"
                title="Download"
              >
                <Download className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={abrirPdfExterno}
                className="text-cyan-400 hover:bg-cyan-500/20 px-2"
                title="Abrir Externo"
              >
                <ExternalLink className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
              </Button>
            </div>
          </div>

          {/* Erro de PDF */}
          {erroPdf && (
            <Alert className="mb-3 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <div className={`${isMobile ? "text-sm" : ""}`}>
                  <p className="font-medium">Erro ao carregar PDF (Tentativa {tentativasCarregamento})</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={carregarPdfInterno} className="bg-transparent text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar Novamente
                    </Button>
                    <Button variant="outline" size="sm" onClick={abrirPdfExterno} className="bg-transparent text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Abrir Externo
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Área de Visualização */}
          <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden min-h-0">
            {/* PDF Viewer */}
            <div ref={pdfViewerRef} className="absolute inset-0 w-full h-full" />

            {/* Loading overlay */}
            {!pdfCarregado && !erroPdf && (
              <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className={`text-slate-300 ${isMobile ? "text-sm" : ""}`}>Carregando PDF...</p>
                  <p className={`text-slate-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                    Tentativa {tentativasCarregamento}
                  </p>
                </div>
              </div>
            )}

            {/* Canvas para Anotações */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-auto"
              width={isMobile ? 400 : 800}
              height={isMobile ? 600 : 600}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={pararDesenho}
              onMouseLeave={pararDesenho}
              onTouchStart={iniciarDesenho}
              onTouchMove={desenhar}
              onTouchEnd={pararDesenho}
              style={{
                pointerEvents: ferramentaAtiva ? "auto" : "none",
                touchAction: ferramentaAtiva ? "none" : "auto",
              }}
            />
          </div>

          {/* Informações do Mapa - Compactas para Mobile */}
          <div className={`mt-3 flex flex-wrap items-center gap-2 ${isMobile ? "text-xs" : "text-sm"} text-slate-400`}>
            {mapa.latitude && mapa.longitude && (
              <Badge
                variant="outline"
                className={`border-slate-600 text-slate-300 ${isMobile ? "text-xs px-2 py-1" : ""}`}
              >
                📍 {mapa.latitude.toFixed(4)}, {mapa.longitude.toFixed(4)}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`border-slate-600 text-slate-300 ${isMobile ? "text-xs px-2 py-1" : ""}`}
            >
              📅 {new Date(mapa.criado_em).toLocaleDateString("pt-BR")}
            </Badge>
            <Badge
              variant="outline"
              className={`border-slate-600 text-slate-300 ${isMobile ? "text-xs px-2 py-1" : ""}`}
            >
              🔍 {Math.round(zoom * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
