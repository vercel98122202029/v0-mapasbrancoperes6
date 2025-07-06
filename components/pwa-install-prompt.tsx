"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone, Monitor, Apple } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Image from "next/image"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop")
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [swRegistered, setSwRegistered] = useState(false)

  useEffect(() => {
    // Detectar tipo de dispositivo
    const userAgent = navigator.userAgent.toLowerCase()
    if (/android/.test(userAgent)) {
      setDeviceType("android")
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios")
    } else {
      setDeviceType("desktop")
    }

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Registrar Service Worker
    registerServiceWorker()

    // Listener para o evento beforeinstallprompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      console.log("PWA: Install prompt available")

      // Mostrar prompt após 3 segundos se não foi mostrado recentemente
      const lastShown = localStorage.getItem("pwa-prompt-last-shown")
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000

      if (!lastShown || now - Number.parseInt(lastShown) > oneDay) {
        setTimeout(() => {
          setShowPrompt(true)
          setShowFloatingButton(true)
        }, 3000)
      } else {
        setShowFloatingButton(true)
      }
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      console.log("PWA: App installed successfully")
      setIsInstalled(true)
      setShowPrompt(false)
      setShowFloatingButton(false)
      toast.success("App instalado com sucesso! 🎉")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Para iOS, mostrar prompt após 5 segundos se não estiver instalado
    if (deviceType === "ios" && !isInstalled) {
      const lastShown = localStorage.getItem("pwa-prompt-last-shown")
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000

      if (!lastShown || now - Number.parseInt(lastShown) > oneDay) {
        setTimeout(() => {
          setShowPrompt(true)
          setShowFloatingButton(true)
        }, 5000)
      } else {
        setShowFloatingButton(true)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [deviceType, isInstalled])

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        console.log("Service Worker registrado com sucesso:", registration.scope)
        setSwRegistered(true)

        // Verificar atualizações
        registration.addEventListener("updatefound", () => {
          console.log("Nova versão do Service Worker encontrada")
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                toast.info("Nova versão disponível! Recarregue a página.", {
                  action: {
                    label: "Recarregar",
                    onClick: () => window.location.reload(),
                  },
                })
              }
            })
          }
        })
      } catch (error) {
        console.error("Erro ao registrar Service Worker:", error)
        setSwRegistered(false)
      }
    }
  }

  const handleInstallClick = async () => {
    if (deviceType === "ios") {
      // Para iOS, mostrar instruções
      setShowPrompt(true)
      return
    }

    if (!deferredPrompt) {
      toast.error("Instalação não disponível neste momento")
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("PWA: User accepted installation")
        toast.success("Instalação iniciada! 🚀")
      } else {
        console.log("PWA: User dismissed installation")
        toast.info("Instalação cancelada")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
      localStorage.setItem("pwa-prompt-last-shown", Date.now().toString())
    } catch (error) {
      console.error("Erro na instalação:", error)
      toast.error("Erro durante a instalação")
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-last-shown", Date.now().toString())
  }

  // Não mostrar se já está instalado
  if (isInstalled) {
    return null
  }

  const getDeviceIcon = () => {
    switch (deviceType) {
      case "android":
        return <Smartphone className="w-6 h-6 text-green-400" />
      case "ios":
        return <Apple className="w-6 h-6 text-slate-300" />
      default:
        return <Monitor className="w-6 h-6 text-blue-400" />
    }
  }

  const getInstallText = () => {
    switch (deviceType) {
      case "android":
        return "Instalar App"
      case "ios":
        return "Adicionar à Tela Inicial"
      default:
        return "Instalar Aplicativo"
    }
  }

  return (
    <>
      {/* Prompt Principal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-md w-full shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-1 shadow-lg">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                      <Image
                        src="/logo-branco-peres.png"
                        alt="Logo Mapas Branco Peres"
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-lg">Mapas Branco Peres</h3>
                    <p className="text-sm text-slate-400">Sistema Agrícola</p>
                    <div className="flex items-center gap-2 mt-1">
                      {swRegistered && (
                        <Badge variant="secondary" className="bg-green-900 text-green-300 text-xs">
                          ✓ Offline Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissPrompt}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getDeviceIcon()}
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {deviceType === "android" && "Android"}
                    {deviceType === "ios" && "iOS Safari"}
                    {deviceType === "desktop" && "Desktop"}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">
                    {deviceType === "ios" ? "Adicionar à Tela Inicial" : "Instalar como Aplicativo"}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">
                    {deviceType === "ios"
                      ? "Adicione à tela inicial para acesso rápido e experiência nativa sem navegador"
                      : "Instale o app para acesso rápido, notificações e funcionamento offline"}
                  </p>
                </div>

                {deviceType === "ios" && (
                  <div className="bg-slate-700 p-4 rounded-lg text-sm text-slate-300">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Apple className="w-4 h-4" />
                      Como instalar no iOS:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-xs">
                      <li>Toque no botão "Compartilhar" (□↗) na barra inferior do Safari</li>
                      <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                      <li>Toque em "Adicionar" no canto superior direito</li>
                      <li>O app aparecerá na sua tela inicial</li>
                    </ol>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallClick}
                    className="flex-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-red-600 hover:via-yellow-600 hover:to-green-600 text-white font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {getInstallText()}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={dismissPrompt}
                    className="border-slate-600 text-slate-400 hover:bg-slate-700 bg-transparent"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão Flutuante */}
      {showFloatingButton && !showPrompt && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowPrompt(true)}
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-red-600 hover:via-yellow-600 hover:to-green-600 text-white font-semibold shadow-lg rounded-full p-3 animate-pulse"
            title="Instalar App"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  )
}
