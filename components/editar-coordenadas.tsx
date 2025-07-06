"use client"

import { useState } from "react"
import { MapPin, Save, X, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, type Mapa } from "@/lib/supabase"
import { toast } from "sonner"

interface EditarCoordenadasProps {
  mapa: Mapa
  onSalvar: () => void
}

export function EditarCoordenadas({ mapa, onSalvar }: EditarCoordenadasProps) {
  const [open, setOpen] = useState(false)
  const [latitude, setLatitude] = useState(mapa.latitude?.toString() || "")
  const [longitude, setLongitude] = useState(mapa.longitude?.toString() || "")
  const [salvando, setSalvando] = useState(false)
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false)

  const salvarCoordenadas = async () => {
    setSalvando(true)

    try {
      const lat = latitude ? Number.parseFloat(latitude) : null
      const lng = longitude ? Number.parseFloat(longitude) : null

      if ((latitude && isNaN(lat!)) || (longitude && isNaN(lng!))) {
        toast.error("Coordenadas inválidas")
        return
      }

      if (lat && (lat < -90 || lat > 90)) {
        toast.error("Latitude deve estar entre -90 e 90")
        return
      }

      if (lng && (lng < -180 || lng > 180)) {
        toast.error("Longitude deve estar entre -180 e 180")
        return
      }

      const { error } = await supabase
        .from("maps")
        .update({
          latitude: lat,
          longitude: lng,
        })
        .eq("id", mapa.id)

      if (error) throw error

      toast.success("Coordenadas atualizadas com sucesso!")
      setOpen(false)
      onSalvar()
    } catch (error) {
      console.error("Erro ao salvar coordenadas:", error)
      toast.error("Erro ao salvar coordenadas")
    } finally {
      setSalvando(false)
    }
  }

  const obterLocalizacaoAtual = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador")
      return
    }

    setObtendoLocalizacao(true)
    toast.info("Obtendo localização atual...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setObtendoLocalizacao(false)
        toast.success("Localização obtida com sucesso!")
      },
      (error) => {
        setObtendoLocalizacao(false)
        console.error("Erro ao obter localização:", error)

        let mensagem = "Erro ao obter localização atual"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensagem = "Permissão de localização negada"
            break
          case error.POSITION_UNAVAILABLE:
            mensagem = "Localização indisponível"
            break
          case error.TIMEOUT:
            mensagem = "Tempo limite excedido"
            break
        }

        toast.error(mensagem)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const removerCoordenadas = async () => {
    setSalvando(true)

    try {
      const { error } = await supabase
        .from("maps")
        .update({
          latitude: null,
          longitude: null,
        })
        .eq("id", mapa.id)

      if (error) throw error

      toast.success("Coordenadas removidas com sucesso!")
      setOpen(false)
      onSalvar()
    } catch (error) {
      console.error("Erro ao remover coordenadas:", error)
      toast.error("Erro ao remover coordenadas")
    } finally {
      setSalvando(false)
    }
  }

  const temCoordenadas = mapa.latitude && mapa.longitude

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={`w-full border-slate-500 text-slate-300 hover:bg-slate-600 bg-transparent ${
            !temCoordenadas ? "border-yellow-500 text-yellow-400 hover:bg-yellow-500/20" : ""
          }`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {temCoordenadas ? "Editar GPS" : "Adicionar GPS"}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lime-400 flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            {temCoordenadas ? "Editar" : "Adicionar"} Coordenadas GPS
          </DialogTitle>
          <p className="text-sm text-slate-400">{mapa.nome}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coordenadas Atuais */}
          {temCoordenadas && (
            <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
              <h4 className="font-medium text-slate-200 mb-2">Coordenadas Atuais</h4>
              <div className="text-sm text-slate-300 font-mono space-y-1">
                <div>Latitude: {mapa.latitude}</div>
                <div>Longitude: {mapa.longitude}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 font-medium">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-15.123456"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-200 mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300 font-medium">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-47.123456"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-200 mt-1"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={obterLocalizacaoAtual}
              disabled={obtendoLocalizacao}
              className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/20 bg-transparent"
            >
              {obtendoLocalizacao ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Obtendo localização...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Usar Localização Atual
                </>
              )}
            </Button>
          </div>

          <Alert className="bg-slate-700 border-slate-600">
            <MapPin className="h-4 w-4 text-lime-400" />
            <AlertDescription className="text-slate-300 text-sm">
              <div className="space-y-2">
                <p className="font-medium">💡 Dicas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use coordenadas no formato decimal (ex: -15.123456, -47.123456)</li>
                  <li>• Obtenha coordenadas no Google Maps clicando com botão direito</li>
                  <li>• Latitude: -90 a 90 | Longitude: -180 a 180</li>
                  <li>• Use o botão "Localização Atual" para GPS automático</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={salvarCoordenadas}
              disabled={salvando || (!latitude && !longitude)}
              className="flex-1 bg-lime-600 hover:bg-lime-700 text-slate-900"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>

            {temCoordenadas && (
              <Button
                onClick={removerCoordenadas}
                disabled={salvando}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/20 bg-transparent"
              >
                Remover
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
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
