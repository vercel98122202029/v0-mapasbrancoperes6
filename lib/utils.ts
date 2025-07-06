import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extrairNomeFazenda(nomeArquivo: string): string {
  // Remove extensão e caracteres especiais
  const nome = nomeArquivo.replace(/\.[^/.]+$/, "")

  // Extrai o nome da fazenda (assume que está no início do nome)
  const partes = nome.split(/[-_\s]+/)
  return partes[0] || nome
}

export function gerarLinkGoogleMaps(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function gerarLinkGoogleEarth(lat: number, lng: number): string {
  return `https://earth.google.com/web/@${lat},${lng},1000a,1000d,35y,0h,0t,0r`
}

export function formatarCoordenadas(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
