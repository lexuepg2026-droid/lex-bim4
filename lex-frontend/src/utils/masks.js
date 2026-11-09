// Máscaras para digitação ao vivo.
// Regra de ouro: o estado do input guarda o valor MASCARADO (o que o usuário vê);
// o payload enviado à API leva SÓ DÍGITOS, via unmask. O backend normaliza e valida
// dígitos verificadores — enviar máscara gera 400.

export const unmask = (value) => (value == null ? '' : String(value).replace(/\D/g, ''));

export const maskCPF = (value) => {
  const d = unmask(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskCNPJ = (value) => {
  const d = unmask(value).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const maskCEP = (value) => {
  const d = unmask(value).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

export const maskPhone = (value) => {
  const d = unmask(value).slice(0, 11);
  if (d.length <= 10) {
    // (00) 0000-0000
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // (00) 00000-0000
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

const CASAS_DECIMAIS = 2;

const agruparMilhar = (inteiro) => inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const maskMoney = (value) => {
  if (value == null) return '';

  const bruto = String(value).replace(/[^\d,]/g, '');

  const primeira = bruto.indexOf(',');
  const inteiroBruto = primeira === -1 ? bruto : bruto.slice(0, primeira);
  const decimalBruto = primeira === -1 ? null : bruto.slice(primeira + 1).replace(/,/g, '');

  const inteiro = inteiroBruto.replace(/^0+(?=\d)/, '');

  if (decimalBruto === null) return agruparMilhar(inteiro);
  return `${agruparMilhar(inteiro || '0')},${decimalBruto.slice(0, CASAS_DECIMAIS)}`;
};

export const parseMoney = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const texto = String(value).trim();
  if (texto === '') return null;

  const negativo = /^-/.test(texto);
  const corpo = texto.replace(/[^\d.,]/g, '');
  if (corpo === '') return null;

  let normalizado;
  if (corpo.includes(',')) {
    normalizado = corpo.replace(/\./g, '').replace(',', '.');
  } else {
    const partes = corpo.split('.');
    const ultima = partes[partes.length - 1];
    normalizado = partes.length === 2 && ultima.length <= CASAS_DECIMAIS && ultima.length > 0
      ? corpo
      : partes.join('');
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return null;
  return negativo ? -numero : numero;
};

export const formatMoneyInput = (value) => {
  const numero = typeof value === 'number' ? value : parseMoney(value);
  if (numero == null) return '';
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: CASAS_DECIMAIS,
    maximumFractionDigits: CASAS_DECIMAIS,
  });
};
