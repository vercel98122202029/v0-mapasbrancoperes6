-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de mapas
CREATE TABLE IF NOT EXISTS maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  fazenda TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  arquivo_url TEXT NOT NULL,
  anotacoes JSON DEFAULT '{}',
  latitude FLOAT,
  longitude FLOAT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias (nome) VALUES 
  ('Plantio'),
  ('Colheita'),
  ('Irrigação'),
  ('Fertilização'),
  ('Monitoramento'),
  ('Outros')
ON CONFLICT DO NOTHING;
