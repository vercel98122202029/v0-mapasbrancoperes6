// Configurações de ambiente para o sistema
export const env = {
  // Supabase - SUAS CREDENCIAIS
  SUPABASE_URL: "https://uwlywaxpvesgpnmoblns.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bHl3YXhwdmVzZ3BubW9ibG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDM5MDcsImV4cCI6MjA2NzMxOTkwN30.Z4k0tQYIlkx0-3ovgyAKOpmuHgnUSUy2gt2Iim37qas",

  // App
  STORAGE_BUCKET: "mapas",
  APP_NAME: "Mapas Branco Peres",
  EMPRESA: "Branco Peres",

  // URLs - Removido NODE_ENV para evitar erro no cliente
  BASE_URL: "https://mapas-branco-peres.vercel.app",
}

// Validação das variáveis de ambiente
export function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]

  const missing = required.filter((key) => !env[key as keyof typeof env])

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(", ")}`)
  }
}

// Função para detectar ambiente (apenas quando necessário)
export function isDevelopment() {
  return typeof window !== "undefined" && window.location.hostname === "localhost"
}

// Função para obter URL base dinamicamente
export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // No cliente, usar a URL atual
    return window.location.origin
  }
  // No servidor, usar a URL configurada
  return env.BASE_URL
}
