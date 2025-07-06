import { createClient } from "@supabase/supabase-js"
import { env, validateEnv } from "./env"

// Validar variáveis de ambiente
validateEnv()

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

export type Mapa = {
  id: string
  nome: string
  fazenda: string
  categoria_id: string
  arquivo_url: string
  anotacoes: any
  latitude: number | null
  longitude: number | null
  criado_em: string
}

export type Categoria = {
  id: string
  nome: string
  criado_em: string
}

// Função para testar conexão
export async function testarConexao() {
  try {
    const { data, error } = await supabase.from("categorias").select("count").single()
    if (error) throw error
    return { sucesso: true, mensagem: "Conexão com Supabase estabelecida" }
  } catch (error) {
    return { sucesso: false, mensagem: `Erro na conexão: ${error}` }
  }
}
