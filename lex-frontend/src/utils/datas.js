// Datas de calendário (fase R3, DEC-165).
//
// O vencimento chega do back como meia-noite UTC ("2026-11-11T00:00:00.000Z").
// Lido com `new Date()` no fuso do navegador, ele vira 21 h do dia ANTERIOR em
// Brasília: a parcela de daqui a 2 dias saía "Vence amanhã", e a de hoje,
// "Venceu ontem". Aqui a conta é feita com DATAS DE CALENDÁRIO: os dez
// primeiros caracteres do vencimento contra o dia de hoje no relógio de quem
// olha. Funções puras, testadas em tests/datas.test.js.

// "AAAA-MM-DD" a partir do valor do back (data pura ou instante ISO). `null`
// quando não há data válida.
export const dataDeCalendario = (valor) => {
  if (typeof valor !== "string") return null;
  const data = valor.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null;
};

// A data de hoje no relógio do navegador, como "AAAA-MM-DD".
export const hojeLocal = (agora = new Date()) =>
  `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;

// "AAAA-MM-DD" daqui a `dias` dias, no relógio do navegador.
export const diaLocalDaquiA = (dias, agora = new Date()) =>
  hojeLocal(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dias));

const utc = (data) => Date.UTC(+data.slice(0, 4), +data.slice(5, 7) - 1, +data.slice(8, 10));

// Quantos dias de hoje até o vencimento (negativo quando já passou). `null`
// sem data válida.
export const diasAteOVencimento = (dataVencimento, agora = new Date()) => {
  const vencimento = dataDeCalendario(dataVencimento);
  if (!vencimento) return null;
  return Math.round((utc(vencimento) - utc(hojeLocal(agora))) / 86400000);
};

// O prazo em palavras, com os textos da Home da Raniele.
export const prazoDaParcela = (dataVencimento, agora = new Date()) => {
  const diferenca = diasAteOVencimento(dataVencimento, agora);
  if (diferenca === null) return "";
  if (diferenca < -1) return `Venceu há ${Math.abs(diferenca)} dias`;
  if (diferenca === -1) return "Venceu ontem";
  if (diferenca === 0) return "Vence hoje";
  if (diferenca === 1) return "Vence amanhã";
  return `Vence em ${diferenca} dias`;
};

// A parcela vence até `dias` dias a partir de hoje (inclusive; as vencidas
// também contam).
export const venceAte = (dataVencimento, dias, agora = new Date()) => {
  const diferenca = diasAteOVencimento(dataVencimento, agora);
  return diferenca !== null && diferenca <= dias;
};
