// Controle de iniciativa e pontos de vida. Funções puras: recebem um estado
// e devolvem um novo, sem alterar o original (fácil de testar e de salvar).

export function estadoInicial() {
  return { combatentes: [], turno: 0, rodada: 1, proximoId: 1 };
}

export function ordenar(combatentes) {
  return [...combatentes].sort((a, b) => b.iniciativa - a.iniciativa || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function adicionar(estado, { nome, iniciativa, pv }) {
  const nomeLimpo = String(nome ?? '').trim();
  if (!nomeLimpo) throw new Error('Dê um nome ao combatente.');
  if (!Number.isFinite(iniciativa)) throw new Error('A iniciativa precisa ser um número.');
  if (!Number.isInteger(pv) || pv < 1) throw new Error('Os pontos de vida precisam ser um número maior que zero.');

  const emAndamento = estado.turno > 0 || estado.rodada > 1;
  const atual = estado.combatentes[estado.turno];
  const novo = { id: estado.proximoId, nome: nomeLimpo, iniciativa, pv, pvMax: pv };
  const combatentes = ordenar([...estado.combatentes, novo]);
  return {
    ...estado,
    combatentes,
    // Com o combate em andamento, a vez continua com quem já estava agindo,
    // mesmo que a ordem mude. Antes disso, começa pela maior iniciativa.
    turno: emAndamento && atual ? combatentes.findIndex((c) => c.id === atual.id) : 0,
    proximoId: estado.proximoId + 1,
  };
}

export function remover(estado, id) {
  const indice = estado.combatentes.findIndex((c) => c.id === id);
  if (indice === -1) return estado;
  const combatentes = estado.combatentes.filter((c) => c.id !== id);
  let turno = estado.turno;
  if (indice < turno) turno -= 1;
  if (turno >= combatentes.length) turno = 0;
  return { ...estado, combatentes, turno };
}

export function proximoTurno(estado) {
  if (estado.combatentes.length === 0) return estado;
  const fimDaRodada = estado.turno + 1 >= estado.combatentes.length;
  return {
    ...estado,
    turno: fimDaRodada ? 0 : estado.turno + 1,
    rodada: fimDaRodada ? estado.rodada + 1 : estado.rodada,
  };
}

// Valor positivo cura, negativo causa dano. PV fica sempre entre 0 e o máximo.
export function alterarPv(estado, id, valor) {
  return {
    ...estado,
    combatentes: estado.combatentes.map((c) =>
      c.id === id ? { ...c, pv: Math.min(c.pvMax, Math.max(0, c.pv + valor)) } : c,
    ),
  };
}

export function reiniciar(estado) {
  return {
    ...estado,
    turno: 0,
    rodada: 1,
    combatentes: estado.combatentes.map((c) => ({ ...c, pv: c.pvMax })),
  };
}
