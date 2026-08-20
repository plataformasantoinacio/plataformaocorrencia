-- Script SQL para o Supabase - Plataforma de Ocorrências Santo Inácio

-- 1. Tabela de Alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    turma TEXT NOT NULL,
    sala TEXT,
    matricula TEXT UNIQUE NOT NULL,
    foto TEXT,
    data_nascimento DATE,
    responsavel TEXT,
    telefone_responsavel TEXT,
    email TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Ocorrências
CREATE TABLE IF NOT EXISTS public.ocorrencias (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    aluno_id TEXT REFERENCES public.alunos(id) ON DELETE CASCADE,
    aluno_nome TEXT NOT NULL,
    turma TEXT NOT NULL,
    tipo TEXT NOT NULL,
    subtipo TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    local TEXT NOT NULL,
    relato TEXT NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('baixa', 'media', 'grave')),
    registrado_por TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Mensagens/Comentários da Ocorrência
CREATE TABLE IF NOT EXISTS public.ocorrencia_mensagens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ocorrencia_id TEXT REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    de TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS) nas tabelas
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencia_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público/leitura e escrita (Ajuste conforme regras de Auth do projeto)
CREATE POLICY "Permitir leitura pública de alunos" ON public.alunos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção/atualização de alunos" ON public.alunos FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de ocorrencias" ON public.ocorrencias FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de ocorrencias" ON public.ocorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de ocorrencias" ON public.ocorrencias FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de ocorrencias" ON public.ocorrencias FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de mensagens" ON public.ocorrencia_mensagens FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de mensagens" ON public.ocorrencia_mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de mensagens" ON public.ocorrencia_mensagens FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de mensagens" ON public.ocorrencia_mensagens FOR DELETE USING (true);

-- Dados Iniciais (Seeds) de Alunos
INSERT INTO public.alunos (id, nome, turma, sala, matricula, data_nascimento, responsavel, telefone_responsavel, email) VALUES
('a1', 'Pedro Henrique Almeida', '9º A', '201', '2024-0312', '2010-03-15', 'Carla Almeida', '(21) 98888-0001', 'pedro.almeida@aluno.santoinacio-rio.com.br'),
('a2', 'Ana Beatriz Souza', '8º B', '108', '2024-0298', '2011-07-22', 'Roberto Souza', '(21) 98888-0002', 'ana.souza@aluno.santoinacio-rio.com.br'),
('a3', 'Lucas Martins Ribeiro', '1º EM A', '305', '2024-0145', '2009-01-08', 'Patrícia Martins', '(21) 98888-0003', 'lucas.ribeiro@aluno.santoinacio-rio.com.br'),
('a4', 'Mariana Costa Lima', '7º C', '104', '2024-0421', '2012-11-30', 'Fernando Lima', '(21) 98888-0004', 'mariana.lima@aluno.santoinacio-rio.com.br'),
('a5', 'Gabriel Oliveira Santos', '9º B', '203', '2024-0367', '2010-05-18', 'Juliana Santos', '(21) 98888-0005', 'gabriel.santos@aluno.santoinacio-rio.com.br'),
('a6', 'Julia Fernandes Rocha', '2º EM B', '402', '2024-0089', '2008-09-12', 'Marcos Rocha', '(21) 98888-0006', 'julia.rocha@aluno.santoinacio-rio.com.br'),
('a7', 'Rafael Mendes Cardoso', '6º A', '102', '2024-0512', '2013-02-25', 'Beatriz Cardoso', '(21) 98888-0007', 'rafael.cardoso@aluno.santoinacio-rio.com.br'),
('a8', 'Isabela Pereira Gomes', '8º A', '107', '2024-0276', '2011-04-10', 'Luís Gomes', '(21) 98888-0008', 'isabela.gomes@aluno.santoinacio-rio.com.br')
ON CONFLICT (id) DO NOTHING;

-- Dados Iniciais (Seeds) de Ocorrências
INSERT INTO public.ocorrencias (id, aluno_id, aluno_nome, turma, tipo, subtipo, data, local, relato, nivel, registrado_por) VALUES
('o1', 'a1', 'Pedro Henrique Almeida', '9º A', 'Uso indevido de celular', NULL, '2026-04-22T10:15:00Z', 'Sala de aula', 'Aluno utilizando celular durante a explicação do conteúdo, mesmo após advertência verbal.', 'baixa', 'Profª Marta Silveira'),
('o2', 'a3', 'Lucas Martins Ribeiro', '1º EM A', 'Agressão', 'Física', '2026-04-21T14:30:00Z', 'Pátio', 'Envolveu-se em briga com colega durante o intervalo. Necessitou intervenção da coordenação.', 'grave', 'Coord. Roberto Lima'),
('o3', 'a2', 'Ana Beatriz Souza', '8º B', 'Atraso recorrente', NULL, '2026-04-20T07:45:00Z', 'Portaria', 'Quinto atraso no mês. Já houve comunicação com responsáveis.', 'media', 'Profº André Castro')
ON CONFLICT (id) DO NOTHING;
