export type OcorrenciaNivel = "baixa" | "media" | "grave";
export type OcorrenciaTipo =
  | "Indisciplina"
  | "Agressão"
  | "Bullying"
  | "Furto"
  | "Atraso recorrente"
  | "Uso indevido de celular"
  | "Desrespeito"
  | "Outros";

export type Aluno = {
  id: string;
  nome: string;
  turma: string;
  sala?: string;
  matricula: string;
  foto?: string; // data URL ou caminho
  dataNascimento?: string;
  responsavel?: string;
  telefoneResponsavel?: string;
  email?: string;
  observacoes?: string;
};

export type OcorrenciaMensagem = {
  id: string;
  texto: string;
  de: string; // nome do remetente
  data: string; // ISO
  lida?: boolean;
};

export type Ocorrencia = {
  id: string;
  alunoId: string;
  alunoNome: string;
  turma: string;
  tipo: OcorrenciaTipo | string;
  subtipo?: string;
  data: string; // ISO
  local: string;
  relato: string;
  nivel: OcorrenciaNivel;
  registradoPor: string;
  mensagens?: OcorrenciaMensagem[];
};

export const alunos: Aluno[] = [
  { id: "a1", nome: "Pedro Henrique Almeida", turma: "9º A", sala: "201", matricula: "2024-0312", dataNascimento: "2010-03-15", responsavel: "Carla Almeida", telefoneResponsavel: "(21) 98888-0001", email: "pedro.almeida@aluno.santoinacio-rio.com.br" },
  { id: "a2", nome: "Ana Beatriz Souza", turma: "8º B", sala: "108", matricula: "2024-0298", dataNascimento: "2011-07-22", responsavel: "Roberto Souza", telefoneResponsavel: "(21) 98888-0002", email: "ana.souza@aluno.santoinacio-rio.com.br" },
  { id: "a3", nome: "Lucas Martins Ribeiro", turma: "1º EM A", sala: "305", matricula: "2024-0145", dataNascimento: "2009-01-08", responsavel: "Patrícia Martins", telefoneResponsavel: "(21) 98888-0003", email: "lucas.ribeiro@aluno.santoinacio-rio.com.br" },
  { id: "a4", nome: "Mariana Costa Lima", turma: "7º C", sala: "104", matricula: "2024-0421", dataNascimento: "2012-11-30", responsavel: "Fernando Lima", telefoneResponsavel: "(21) 98888-0004", email: "mariana.lima@aluno.santoinacio-rio.com.br" },
  { id: "a5", nome: "Gabriel Oliveira Santos", turma: "9º B", sala: "203", matricula: "2024-0367", dataNascimento: "2010-05-18", responsavel: "Juliana Santos", telefoneResponsavel: "(21) 98888-0005", email: "gabriel.santos@aluno.santoinacio-rio.com.br" },
  { id: "a6", nome: "Julia Fernandes Rocha", turma: "2º EM B", sala: "402", matricula: "2024-0089", dataNascimento: "2008-09-12", responsavel: "Marcos Rocha", telefoneResponsavel: "(21) 98888-0006", email: "julia.rocha@aluno.santoinacio-rio.com.br" },
  { id: "a7", nome: "Rafael Mendes Cardoso", turma: "6º A", sala: "102", matricula: "2024-0512", dataNascimento: "2013-02-25", responsavel: "Beatriz Cardoso", telefoneResponsavel: "(21) 98888-0007", email: "rafael.cardoso@aluno.santoinacio-rio.com.br" },
  { id: "a8", nome: "Isabela Pereira Gomes", turma: "8º A", sala: "107", matricula: "2024-0276", dataNascimento: "2011-04-10", responsavel: "Luís Gomes", telefoneResponsavel: "(21) 98888-0008", email: "isabela.gomes@aluno.santoinacio-rio.com.br" },
];

export const tiposOcorrencia: OcorrenciaTipo[] = [
  "Indisciplina",
  "Agressão",
  "Bullying",
  "Furto",
  "Atraso recorrente",
  "Uso indevido de celular",
  "Desrespeito",
  "Outros",
];

export const locaisOcorrencia = [
  "Sala de aula",
  "Pátio",
  "Quadra esportiva",
  "Refeitório",
  "Corredor",
  "Biblioteca",
  "Capela",
  "Laboratório",
  "Outro",
];

export const ocorrencias: Ocorrencia[] = [
  {
    id: "o1",
    alunoId: "a1",
    alunoNome: "Pedro Henrique Almeida",
    turma: "9º A",
    tipo: "Uso indevido de celular",
    data: "2026-04-22T10:15:00",
    local: "Sala de aula",
    relato: "Aluno utilizando celular durante a explicação do conteúdo, mesmo após advertência verbal.",
    nivel: "baixa",
    registradoPor: "Profª Marta Silveira",
  },
  {
    id: "o2",
    alunoId: "a3",
    alunoNome: "Lucas Martins Ribeiro",
    turma: "1º EM A",
    tipo: "Agressão",
    subtipo: "Física",
    data: "2026-04-21T14:30:00",
    local: "Pátio",
    relato: "Envolveu-se em briga com colega durante o intervalo. Necessitou intervenção da coordenação.",
    nivel: "grave",
    registradoPor: "Coord. Roberto Lima",
  },
  {
    id: "o3",
    alunoId: "a2",
    alunoNome: "Ana Beatriz Souza",
    turma: "8º B",
    tipo: "Atraso recorrente",
    data: "2026-04-20T07:45:00",
    local: "Portaria",
    relato: "Quinto atraso no mês. Já houve comunicação com responsáveis.",
    nivel: "media",
    registradoPor: "Profº André Castro",
  },
  {
    id: "o4",
    alunoId: "a1",
    alunoNome: "Pedro Henrique Almeida",
    turma: "9º A",
    tipo: "Desrespeito",
    data: "2026-04-18T09:20:00",
    local: "Sala de aula",
    relato: "Respondeu de forma rude à professora ao ser questionado sobre tarefa não entregue.",
    nivel: "media",
    registradoPor: "Profª Marta Silveira",
  },
  {
    id: "o5",
    alunoId: "a5",
    alunoNome: "Gabriel Oliveira Santos",
    turma: "9º B",
    tipo: "Bullying",
    data: "2026-04-17T11:00:00",
    local: "Corredor",
    relato: "Apelidos depreciativos a colega. Coordenação convocou os pais.",
    nivel: "grave",
    registradoPor: "Coord. Roberto Lima",
  },
  {
    id: "o6",
    alunoId: "a4",
    alunoNome: "Mariana Costa Lima",
    turma: "7º C",
    tipo: "Indisciplina",
    data: "2026-04-15T13:50:00",
    local: "Biblioteca",
    relato: "Conversa excessiva e perturbação do silêncio do espaço.",
    nivel: "baixa",
    registradoPor: "Bibliotecária Ana Paula",
  },
  {
    id: "o7",
    alunoId: "a1",
    alunoNome: "Pedro Henrique Almeida",
    turma: "9º A",
    tipo: "Indisciplina",
    data: "2026-04-12T08:40:00",
    local: "Sala de aula",
    relato: "Saiu da sala sem autorização durante a aula.",
    nivel: "baixa",
    registradoPor: "Profº Felipe Moura",
  },
  {
    id: "o8",
    alunoId: "a6",
    alunoNome: "Julia Fernandes Rocha",
    turma: "2º EM B",
    tipo: "Uso indevido de celular",
    data: "2026-04-10T15:10:00",
    local: "Sala de aula",
    relato: "Filmando colegas durante a prova.",
    nivel: "media",
    registradoPor: "Profª Carla Nogueira",
  },
];

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const nivelLabel: Record<OcorrenciaNivel, string> = {
  baixa: "Baixa",
  media: "Média",
  grave: "Grave",
};
