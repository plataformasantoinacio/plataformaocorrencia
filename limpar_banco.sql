-- Limpar todos os dados (ordem importa por causa das foreign keys)
TRUNCATE TABLE public.ocorrencia_mensagens RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ocorrencias RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.alunos RESTART IDENTITY CASCADE;
