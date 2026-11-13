// Liga a interface às funções de dados.js e iniciativa.js.
import { ErroDeRolagem, estatisticas, rolar } from './dados.js';
import * as iniciativa from './iniciativa.js';

const $ = (seletor) => document.querySelector(seletor);
const LIMITE_HISTORICO = 20;

function carregar(chave, padrao) {
  try {
    const salvo = localStorage.getItem(chave);
    return salvo ? JSON.parse(salvo) : padrao;
  } catch {
    return padrao;
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): a página funciona igual.
  }
}

/* ---------- Dados ---------- */

let historico = carregar('rpg-mesa:historico', []);

function descreverTermos(rolagem) {
  return rolagem.termos
    .map((termo, i) => {
      const sinal = termo.sinal < 0 ? '−' : i === 0 ? '' : '+';
      if (termo.tipo === 'fixo') return `${sinal} ${termo.valor}`;
      const dados = termo.resultados.map((v, j) => (termo.mantidos[j] ? `${v}` : `<s>${v}</s>`)).join(', ');
      return `${sinal} [${dados}]`;
    })
    .join(' ');
}

function mostrarResultado(rolagem) {
  const critico = rolagem.critico === 'sucesso' ? 'Crítico!' : rolagem.critico === 'falha' ? 'Falha crítica' : '';
  $('#resultado').innerHTML = `
    <p class="resultado-expressao">${rolagem.expressao}</p>
    <p class="resultado-total ${rolagem.critico ?? ''}">${rolagem.total}</p>
    <p class="resultado-detalhe">${descreverTermos(rolagem)}</p>
    ${critico ? `<p class="resultado-critico ${rolagem.critico}">${critico}</p>` : ''}`;
  $('#resultado').classList.remove('animar');
  void $('#resultado').offsetWidth; // reinicia a animação
  $('#resultado').classList.add('animar');
}

function mostrarHistorico() {
  $('#historico').innerHTML = historico
    .map((r) => `<li><span>${r.expressao}</span><strong class="${r.critico ?? ''}">${r.total}</strong></li>`)
    .join('');
  $('#limpar-historico').hidden = historico.length === 0;
}

function mostrarEstatisticas(expressao) {
  try {
    const { minimo, maximo, media } = estatisticas(expressao);
    const textoMedia = media === null ? '' : ` · média ${Number.isInteger(media) ? media : media.toFixed(1)}`;
    $('#estatisticas').textContent = `De ${minimo} a ${maximo}${textoMedia}`;
    $('#estatisticas').classList.remove('erro');
  } catch (erro) {
    $('#estatisticas').textContent = erro instanceof ErroDeRolagem ? erro.message : '';
    $('#estatisticas').classList.add('erro');
  }
}

function fazerRolagem(expressao) {
  try {
    const rolagem = rolar(expressao);
    mostrarResultado(rolagem);
    historico = [{ expressao: rolagem.expressao, total: rolagem.total, critico: rolagem.critico }, ...historico].slice(
      0,
      LIMITE_HISTORICO,
    );
    salvar('rpg-mesa:historico', historico);
    mostrarHistorico();
  } catch (erro) {
    if (!(erro instanceof ErroDeRolagem)) throw erro;
    mostrarEstatisticas(expressao);
  }
}

$('#form-rolagem').addEventListener('submit', (evento) => {
  evento.preventDefault();
  fazerRolagem($('#expressao').value);
});

$('#expressao').addEventListener('input', (evento) => mostrarEstatisticas(evento.target.value));

for (const botao of document.querySelectorAll('[data-rolar]')) {
  botao.addEventListener('click', () => {
    $('#expressao').value = botao.dataset.rolar;
    mostrarEstatisticas(botao.dataset.rolar);
    fazerRolagem(botao.dataset.rolar);
  });
}

$('#limpar-historico').addEventListener('click', () => {
  historico = [];
  salvar('rpg-mesa:historico', historico);
  mostrarHistorico();
});

/* ---------- Iniciativa ---------- */

let estado = carregar('rpg-mesa:iniciativa', iniciativa.estadoInicial());

function atualizar(novoEstado) {
  estado = novoEstado;
  salvar('rpg-mesa:iniciativa', estado);
  mostrarCombate();
}

function mostrarCombate() {
  const lista = $('#combatentes');
  const modelo = $('#modelo-combatente');
  lista.replaceChildren(
    ...estado.combatentes.map((c, indice) => {
      const item = modelo.content.firstElementChild.cloneNode(true);
      const porcentagem = Math.round((c.pv / c.pvMax) * 100);
      item.dataset.id = c.id;
      item.classList.toggle('vez', indice === estado.turno);
      item.classList.toggle('caido', c.pv === 0);
      item.querySelector('.combatente-iniciativa').textContent = c.iniciativa;
      item.querySelector('.combatente-nome').textContent = c.nome;
      item.querySelector('.combatente-pv').textContent = c.pv === 0 ? 'Caído' : `${c.pv} / ${c.pvMax} PV`;
      const barra = item.querySelector('.barra-pv');
      barra.setAttribute('aria-valuemax', c.pvMax);
      barra.setAttribute('aria-valuenow', c.pv);
      barra.setAttribute('aria-label', `Pontos de vida de ${c.nome}`);
      barra.firstElementChild.style.width = `${porcentagem}%`;
      barra.dataset.nivel = porcentagem > 50 ? 'alto' : porcentagem > 20 ? 'medio' : 'baixo';
      return item;
    }),
  );
  const vazio = estado.combatentes.length === 0;
  $('#sem-combatentes').hidden = !vazio;
  $('#proximo-turno').disabled = vazio;
  $('#rodada').textContent = `Rodada ${estado.rodada}`;
}

$('#form-combatente').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const form = evento.target;
  try {
    atualizar(
      iniciativa.adicionar(estado, {
        nome: form.nome.value,
        iniciativa: Number(form.iniciativa.value),
        pv: Number(form.pv.value),
      }),
    );
    form.reset();
    form.nome.focus();
    $('#erro-combatente').textContent = '';
  } catch (erro) {
    $('#erro-combatente').textContent = erro.message;
  }
});

$('#combatentes').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const id = Number(evento.target.closest('.combatente').dataset.id);
  const valor = Number(evento.target.querySelector('input').value);
  if (!valor) return;
  const sinal = evento.submitter?.dataset.acao === 'cura' ? 1 : -1;
  atualizar(iniciativa.alterarPv(estado, id, sinal * valor));
});

$('#combatentes').addEventListener('click', (evento) => {
  if (evento.target.dataset.acao !== 'remover') return;
  const id = Number(evento.target.closest('.combatente').dataset.id);
  atualizar(iniciativa.remover(estado, id));
});

$('#proximo-turno').addEventListener('click', () => atualizar(iniciativa.proximoTurno(estado)));
$('#reiniciar').addEventListener('click', () => atualizar(iniciativa.reiniciar(estado)));

mostrarEstatisticas($('#expressao').value);
mostrarHistorico();
mostrarCombate();
