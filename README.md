# 🎲 Mesa de RPG

[![Testes](https://github.com/Borniotti/rpg-mesa/actions/workflows/testes.yml/badge.svg)](https://github.com/Borniotti/rpg-mesa/actions/workflows/testes.yml)

**[Abrir o site →](https://borniotti.github.io/rpg-mesa/)** · [English below](#english)

Rolador de dados e controle de iniciativa para quem joga RPG de mesa. Funciona direto no navegador, no computador ou no celular, sem instalar nada e sem criar conta.

## O que ele faz

- **Entende a notação de dados do RPG:** `1d20+5`, `3d8-2`, `d%`, e até combinações como `1d8+1d6+3`.
- **Vantagem e desvantagem:** `2d20kh1` fica com o maior dado e `2d20kl1` com o menor. `4d6kh3` é o jeito clássico de rolar atributos.
- **Mostra antes de rolar** o menor e o maior resultado possível e a média.
- **Avisa crítico e falha crítica** quando sai 20 ou 1 num d20.
- **Controle de iniciativa:** ordena os combatentes, marca de quem é a vez, conta as rodadas e acompanha os pontos de vida com uma barra colorida.
- **Guarda tudo no navegador:** se a página fechar, o combate e o histórico continuam lá.
- Tema claro e escuro automático, acessível pelo teclado e por leitores de tela.

## Como foi feito

| Parte                  | Arquivo                                                                          | O que tem de interessante                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Interpretador de dados | [`src/dados.js`](src/dados.js)                                                   | Lê o texto digitado, valida e explica o erro em português claro. Recebe o sorteio como parâmetro, o que permite testar com "dados viciados". |
| Regras do combate      | [`src/iniciativa.js`](src/iniciativa.js)                                         | Funções puras: recebem o estado e devolvem um novo, sem alterar o anterior. Isso evita bugs e facilita salvar.                               |
| Interface              | [`src/app.js`](src/app.js), [`index.html`](index.html), [`style.css`](style.css) | HTML, CSS e JavaScript puro, sem bibliotecas nem etapa de build.                                                                             |
| Testes                 | [`tests/`](tests)                                                                | 16 testes automáticos com o executor de testes do próprio Node, rodando no GitHub a cada mudança.                                            |

Um caso que os testes pegaram durante o desenvolvimento: quem entrava no combate com iniciativa alta durante a montagem da mesa não recebia a primeira vez. A regra de "não roubar a vez de quem está agindo" agora só vale depois que o combate começa.

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo só para os testes; o site em si não precisa de nada.

```bash
git clone https://github.com/Borniotti/rpg-mesa.git
cd rpg-mesa
npm test                      # roda os testes
python -m http.server 8000    # abre o site em http://localhost:8000
```

> Este projeto foi feito com a ajuda de IA (Claude), com revisão e decisões minhas.

---

## English

**[Open the app →](https://borniotti.github.io/rpg-mesa/)**

A dice roller and initiative tracker for tabletop RPG players. It runs in the browser on desktop or mobile, with nothing to install and no account needed. The interface is in Brazilian Portuguese.

**Features**

- Parses standard dice notation: `1d20+5`, `3d8-2`, `d%`, `1d8+1d6+3`.
- Keep highest/lowest: `2d20kh1` (advantage), `2d20kl1` (disadvantage), `4d6kh3`.
- Shows the minimum, maximum and average before you roll.
- Flags natural 20s and natural 1s on a single d20.
- Initiative tracker with turn order, round counter and hit point bars.
- State is saved in `localStorage`, so a closed tab doesn't lose the fight.
- Automatic light/dark theme, keyboard and screen reader friendly.

**Under the hood**

- `src/dados.js`: dice expression parser with clear validation errors. The random source is injected, so tests can use loaded dice.
- `src/iniciativa.js`: pure, immutable state functions for combat.
- Vanilla HTML/CSS/JS, no framework and no build step.
- 16 unit tests with Node's built-in test runner, run by GitHub Actions on every push.

```bash
npm test                      # run the tests
python -m http.server 8000    # serve the site at http://localhost:8000
```

> Built with AI assistance (Claude), reviewed and directed by me.

License: [MIT](LICENSE)
