// Interpretação e rolagem de expressões de dados no formato usado em RPG:
// "1d20+5", "2d20kh1" (vantagem), "4d6kh3", "3d8-2", "d%".

const LIMITES = { quantidade: 100, faces: 1000 };
const TERMO_DE_DADO = /^(\d*)d(\d+|%)(?:(kh|kl)(\d+))?$/;

export class ErroDeRolagem extends Error {}

export function analisar(expressao) {
  const texto = String(expressao).replace(/\s+/g, '').toLowerCase();
  if (!texto) throw new ErroDeRolagem('Digite uma rolagem, como 1d20+5.');

  const partes = texto.match(/[+-]?[^+-]+/g);
  if (!partes || partes.join('') !== texto) {
    throw new ErroDeRolagem(`Não entendi "${expressao}". Exemplo: 2d6+3.`);
  }

  return partes.map((parte) => {
    const sinal = parte.startsWith('-') ? -1 : 1;
    const corpo = parte.replace(/^[+-]/, '');

    if (/^\d+$/.test(corpo)) return { tipo: 'fixo', sinal, valor: Number(corpo) };

    const achado = corpo.match(TERMO_DE_DADO);
    if (!achado) throw new ErroDeRolagem(`Não entendi "${corpo}". Exemplo: 2d6+3.`);

    const quantidade = achado[1] === '' ? 1 : Number(achado[1]);
    const faces = achado[2] === '%' ? 100 : Number(achado[2]);
    const manter = achado[3] ? { modo: achado[3], n: Number(achado[4]) } : null;

    if (quantidade < 1 || quantidade > LIMITES.quantidade) {
      throw new ErroDeRolagem(`Role entre 1 e ${LIMITES.quantidade} dados por vez.`);
    }
    if (faces < 2 || faces > LIMITES.faces) {
      throw new ErroDeRolagem(`Um dado precisa ter entre 2 e ${LIMITES.faces} faces.`);
    }
    if (manter && (manter.n < 1 || manter.n > quantidade)) {
      throw new ErroDeRolagem(`Não dá para manter ${manter.n} de ${quantidade} dados.`);
    }

    return { tipo: 'dados', sinal, quantidade, faces, manter };
  });
}

// Devolve, para cada dado, se ele conta na soma (true) ou foi descartado.
export function escolherMantidos(resultados, manter) {
  if (!manter) return resultados.map(() => true);
  const ordem = resultados
    .map((valor, indice) => ({ valor, indice }))
    .sort((a, b) => (manter.modo === 'kh' ? b.valor - a.valor : a.valor - b.valor) || a.indice - b.indice);
  const escolhidos = new Set(ordem.slice(0, manter.n).map((d) => d.indice));
  return resultados.map((_, indice) => escolhidos.has(indice));
}

export function formatar(termos) {
  return termos
    .map((termo, i) => {
      const sinal = termo.sinal < 0 ? '-' : i === 0 ? '' : '+';
      if (termo.tipo === 'fixo') return `${sinal}${termo.valor}`;
      const manter = termo.manter ? `${termo.manter.modo}${termo.manter.n}` : '';
      return `${sinal}${termo.quantidade}d${termo.faces}${manter}`;
    })
    .join('');
}

// Menor, maior e média possíveis. A média só é exata sem "manter" (kh/kl).
export function estatisticas(expressao) {
  const termos = analisar(expressao);
  let minimo = 0;
  let maximo = 0;
  let media = 0;
  for (const termo of termos) {
    if (termo.tipo === 'fixo') {
      minimo += termo.sinal * termo.valor;
      maximo += termo.sinal * termo.valor;
      media += termo.sinal * termo.valor;
      continue;
    }
    const contados = termo.manter ? termo.manter.n : termo.quantidade;
    const [baixo, alto] = termo.sinal > 0 ? [contados, contados * termo.faces] : [-contados * termo.faces, -contados];
    minimo += baixo;
    maximo += alto;
    media = media === null || termo.manter ? null : media + (termo.sinal * contados * (termo.faces + 1)) / 2;
  }
  return { minimo, maximo, media };
}

export function rolar(expressao, aleatorio = Math.random) {
  const termos = analisar(expressao);
  let total = 0;

  const detalhes = termos.map((termo) => {
    if (termo.tipo === 'fixo') {
      total += termo.sinal * termo.valor;
      return { ...termo };
    }
    const resultados = Array.from({ length: termo.quantidade }, () => 1 + Math.floor(aleatorio() * termo.faces));
    const mantidos = escolherMantidos(resultados, termo.manter);
    const soma = resultados.reduce((acc, valor, i) => (mantidos[i] ? acc + valor : acc), 0);
    total += termo.sinal * soma;
    return { ...termo, resultados, mantidos, soma };
  });

  return { expressao: formatar(termos), total, termos: detalhes, critico: detectarCritico(detalhes) };
}

// Crítico só faz sentido numa rolagem de um único d20 que conta (ex.: 1d20+5 ou 2d20kh1).
function detectarCritico(termos) {
  const dados = termos.filter((t) => t.tipo === 'dados');
  if (dados.length !== 1 || dados[0].faces !== 20) return null;
  const contados = dados[0].resultados.filter((_, i) => dados[0].mantidos[i]);
  if (contados.length !== 1) return null;
  if (contados[0] === 20) return 'sucesso';
  if (contados[0] === 1) return 'falha';
  return null;
}
