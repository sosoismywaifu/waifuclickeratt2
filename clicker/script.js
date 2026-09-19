'use strict';

/* =========================================================
   Waifu Clicker — lógica do jogo
   Estrutura:
   1. Dados (waifus, conversas, melhorias, anéis, conquistas)
   2. Imagens
   3. Estado, cálculos e salvamento
   4. Efeitos (corações, números, pulso)
   5. Interface (palco e painel)
   6. Conversas (mini-game)
   7. Reencarnação (prestígio)
   8. Loop do jogo e início
   ========================================================= */

const SAVE_KEY = 'kokoroClicker.v1'; // mantém o progresso de quem já jogou
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel) => document.querySelector(sel);

/* =========================================================
   1. DADOS
   ========================================================= */

// Waifus do jogo. Para adicionar outra:
//  1) coloque a imagem na pasta images/
//  2) copie um bloco abaixo e ajuste id, nome, img, cores, falas e conversas
// "unlock"  = corações acumulados necessários para desbloquear.
// "pos"     = parte da imagem visível quando ela é cortada (object-position).
// "talks"   = conversas do mini-game. Cada opção tem: t (texto), r (resposta
//             dela) e good: true na resposta certa. "reward" define o prêmio
//             da resposta certa: 'affection' (afeto) ou 'hearts' (corações).
const WAIFUS = [
  {
    id: 'miku', name: 'Miku', trait: 'Tímida e fã de história',
    unlock: 0, accent: '#6f8dff', img: 'images/miku.png', pos: '50% 30%',
    hello: '...Oi. Você veio mesmo.',
    lines: ['E-eu não sou boa nisso, mas gosto.', 'Sabia que os samurais também descansavam?', 'Não me olhe assim... continue.', 'Seus toques são calmos. Eu gosto.'],
    talks: [
      { q: 'Miku tira os fones e pergunta baixinho: "Você sabe quem foi Takeda Shingen?"', reward: 'affection', choices: [
        { t: 'Um grande senhor da guerra do período Sengoku.', good: true, r: '...Você sabe mesmo? Eu gostei de conversar com você.' },
        { t: 'Um chef de ramen famoso?', r: '...Não. Esquece, por favor.' },
        { t: 'Nunca ouvi falar.', r: 'Tudo bem... talvez eu conte um dia.' },
      ] },
      { q: 'Miku fica em silêncio, olhando para os próprios pés.', reward: 'hearts', choices: [
        { t: 'Fico ao lado dela, sem pressionar.', good: true, r: 'Obrigada por só ficar aqui. É confortável.' },
        { t: 'Falo sem parar para preencher o silêncio.', r: 'Ah... é muita coisa ao mesmo tempo...' },
        { t: 'Pergunto por que ela está tão quieta.', r: '...Eu só estou pensando. Desculpa.' },
      ] },
      { q: 'Ela pergunta, corando: "Você não se incomoda por eu ser tímida?"', reward: 'affection', choices: [
        { t: 'Gosto justamente do seu jeito.', good: true, r: '...Você sempre diz coisas assim. Meu rosto está quente.' },
        { t: 'Um pouco, mas eu me acostumo.', r: '...Entendi. Vou tentar melhorar.' },
        { t: 'Você devia falar mais alto!', r: 'D-desculpa! Eu vou tentar...' },
      ] },
    ],
  },
  {
    id: 'nino', name: 'Nino', trait: 'Orgulhosa e ótima na cozinha',
    unlock: 2500, accent: '#ff7fb2', img: 'images/nino.png', pos: '50% 15%',
    hello: 'Não é como se eu estivesse esperando!',
    lines: ['Pare de me olhar desse jeito!', 'Fiz doces, mas não são para você!', 'Tá bom, só mais um.', 'Você é teimoso... até que combina.'],
    talks: [
      { q: 'Nino coloca um prato na sua frente: "Não é para você, tá?! Só sobrou!"', reward: 'hearts', choices: [
        { t: 'Está uma delícia! Posso repetir?', good: true, r: 'H-hmph! Claro que está, fui eu que fiz!' },
        { t: 'Está meio salgado...', r: 'Como é que é?! Devolve isso!' },
        { t: 'Estou sem fome.', r: '...Tá. Eu como então.' },
      ] },
      { q: 'Nino cruza os braços: "Por que você fica aqui o dia todo?"', reward: 'affection', choices: [
        { t: 'Porque gosto de estar com você.', good: true, r: 'Q-quê?! Não diga isso do nada!' },
        { t: 'Não tenho nada melhor para fazer.', r: 'Ah, então tá bom. Que ótimo.' },
        { t: 'Sei lá.', r: 'Sei lá?! Que resposta é essa?!' },
      ] },
      { q: 'Nino tenta esconder o sorriso depois de um elogio.', reward: 'hearts', choices: [
        { t: 'Finjo que não vi e continuo sorrindo.', good: true, r: '...Você é bem esperto, sabia?' },
        { t: 'Digo: "Você ficou feliz, hein!"', r: 'N-não fiquei! Para de me encarar!' },
        { t: 'Rio da cara dela.', r: 'Do que você está rindo?!' },
      ] },
    ],
  },
  {
    id: 'ichika', name: 'Ichika', trait: 'Madura e provocadora',
    unlock: 40000, accent: '#ffd75e', img: 'images/ichika.png', pos: '50% 20%',
    hello: 'Ora, ora, olha quem chegou.',
    lines: ['Você fica fofo quando cora.', 'Hoje eu atuo só para você.', 'Não precisa ter pressa.', 'Cuidado, ou eu me acostumo.'],
    talks: [
      { q: 'Ichika sussurra: "Você acha que eu sou boa atriz?"', reward: 'affection', choices: [
        { t: 'Você é ótima, mas gosto mais da Ichika de verdade.', good: true, r: 'Ora... isso foi bem tocante. Ponto para você.' },
        { t: 'Mais ou menos.', r: 'Ai, essa doeu. Vou fingir que não ouvi.' },
        { t: 'Nunca vi você atuar.', r: 'Então deixe eu te mostrar um dia.' },
      ] },
      { q: 'Ela sorri de lado: "Está corando?"', reward: 'hearts', choices: [
        { t: 'Um pouco. Você sabe o efeito que causa.', good: true, r: 'Hehe... honestidade combina com você.' },
        { t: 'Não estou nada!', r: 'Claro, claro. Seu rosto diz outra coisa.' },
        { t: 'Fujo da conversa.', r: 'Fugindo? Que fofo.' },
      ] },
      { q: 'Ichika pergunta baixinho: "Se eu ficar cansada, você cuida de mim?"', reward: 'affection', choices: [
        { t: 'Sempre. Ninguém precisa ser forte o tempo todo.', good: true, r: '...Obrigada. Eu precisava ouvir isso.' },
        { t: 'Você nunca fica cansada.', r: '...É, talvez eu só finja bem demais.' },
        { t: 'Depende do dia.', r: 'Hmm. Sincero, pelo menos.' },
      ] },
    ],
  },
  {
    id: 'yotsuba', name: 'Yotsuba', trait: 'Animada e sempre disposta a ajudar',
    unlock: 600000, accent: '#5fe08f', img: 'images/yotsuba.png', pos: '50% 20%',
    hello: 'Bom dia! Vamos com tudo hoje!',
    lines: ['Pode contar comigo!', 'Ei, vamos correr depois?', 'Hoje é dia de fazer o bem!', 'Se der errado, tentamos de novo!'],
    talks: [
      { q: 'Yotsuba chega correndo: "Vamos treinar amanhã cedo?"', reward: 'hearts', choices: [
        { t: 'Bora! Eu acompanho você!', good: true, r: 'Isso! Vai ser incrível!' },
        { t: 'Só depois das dez.', r: 'Ah... tá. Mas eu vou te acordar!' },
        { t: 'Prefiro dormir.', r: 'Ok! Mas quando acordar, vem correr comigo!' },
      ] },
      { q: 'Ela está ajudando três pessoas ao mesmo tempo e parece cansada.', reward: 'affection', choices: [
        { t: 'Pego uma das caixas e ajudo.', good: true, r: 'Você é demais! Obrigada!' },
        { t: 'Passo direto.', r: 'Ah... tudo bem, eu me viro!' },
        { t: 'Digo que ela deveria recusar pedidos.', r: 'Mas eu gosto de ajudar...' },
      ] },
      { q: 'Yotsuba pergunta: "Se eu perder a competição, você ainda vai torcer por mim?"', reward: 'hearts', choices: [
        { t: 'Sempre. Ganhando ou perdendo.', good: true, r: 'Então eu não tenho medo de nada!' },
        { t: 'Só se você ganhar.', r: '...Hm. Então eu vou ter que ganhar!' },
        { t: 'Talvez.', r: 'Talvez?! Eu vou te convencer!' },
      ] },
    ],
  },
  {
    id: 'itsuki', name: 'Itsuki', trait: 'Dedicada e de bom apetite',
    unlock: 10000000, accent: '#ff6b5b', img: 'images/itsuki.png', pos: '50% 20%',
    hello: 'Podemos comer algo depois?',
    lines: ['Estudar dá fome, sabia?', 'Só mais um pouquinho, prometo.', 'Você me ajuda no dever depois?', 'Isso foi... agradável.'],
    talks: [
      { q: 'Itsuki abre o caderno: "Vamos estudar? Só uma hora, prometo."', reward: 'affection', choices: [
        { t: 'Vamos! Depois eu pago um lanche.', good: true, r: 'Combinado! Você sabe mesmo me motivar!' },
        { t: 'Estudar é chato.', r: 'Chato?! É a base de tudo!' },
        { t: 'Prefiro jogar.', r: 'Só depois da lição de hoje!' },
      ] },
      { q: 'O estômago dela ronca no meio da lição.', reward: 'hearts', choices: [
        { t: 'Finjo que não ouvi e ofereço um lanche.', good: true, r: 'Você é gentil demais... aceito!' },
        { t: 'Digo: "Ouvi isso!"', r: 'N-não ouviu nada!' },
        { t: 'Digo: "Você só pensa em comida."', r: 'Não é só isso... só um pouquinho.' },
      ] },
      { q: 'Ela pergunta, séria: "Você acha que eu como demais?"', reward: 'affection', choices: [
        { t: 'Acho que você aproveita a vida.', good: true, r: '...Que resposta boa. Obrigada.' },
        { t: 'Um pouquinho, sim.', r: 'U-um pouquinho?!' },
        { t: 'Nunca reparei.', r: 'Hmm... é uma resposta segura, pelo menos.' },
      ] },
    ],
  },
];

// Melhorias que aumentam o valor de cada toque
const CLICK_UPGRADES = [
  { id: 'cafune', icon: '🫳', name: 'Cafuné', desc: '+1 coração por toque em cada nível', base: 25, growth: 1.35 },
  { id: 'toque', icon: '✨', name: 'Toque encantado', desc: 'Cada toque rende também 1% da renda por segundo, por nível', base: 3000, growth: 2.2 },
];

// Atividades que rendem corações sozinhas (por segundo)
const GENERATORS = [
  { id: 'carta',     icon: '💌', name: 'Carta de amor',     desc: 'Ela lê e sorri sozinha.',          base: 20,      cps: 1 },
  { id: 'cafe',      icon: '☕', name: 'Encontro no café',  desc: 'Dois cafés, uma conversa longa.',  base: 120,     cps: 5 },
  { id: 'festival',  icon: '🎆', name: 'Festival de verão', desc: 'Yukata, fogos e takoyaki.',        base: 1000,    cps: 25 },
  { id: 'show',      icon: '🎤', name: 'Show ao vivo',      desc: 'Você na primeira fila.',           base: 9000,    cps: 120 },
  { id: 'japao',     icon: '⛩️', name: 'Viagem ao Japão',   desc: 'Kyoto na época das cerejeiras.',   base: 80000,   cps: 600 },
  { id: 'casamento', icon: '💒', name: 'Casamento',         desc: 'Buquê, votos e confete.',          base: 750000,  cps: 3000 },
  { id: 'isekai',    icon: '🌌', name: 'Mundo paralelo',    desc: 'Vocês viram heróis lendários.',    base: 7000000, cps: 15000 },
];

const ITEMS = [
  ...CLICK_UPGRADES.map((u) => ({ ...u, kind: 'click' })),
  ...GENERATORS.map((g) => ({ ...g, kind: 'gen', growth: 1.15 })),
];

// Bênçãos permanentes, compradas com Anéis de Compromisso.
// Sobrevivem à reencarnação. "max" limita o nível (opcional).
const RING_UPGRADES = [
  { id: 'eterno', icon: '💞', name: 'Amor eterno', desc: '+25% em todos os ganhos, por nível',
    base: 1, growth: 1.6, effect: (lv) => `Atual: +${25 * lv}% em tudo` },
  { id: 'divino', icon: '🤲', name: 'Toque divino', desc: '+50% de corações por toque, por nível',
    base: 2, growth: 1.7, effect: (lv) => `Atual: +${50 * lv}% por toque` },
  { id: 'renda', icon: '🌸', name: 'Devoção constante', desc: '+50% da renda por segundo, por nível',
    base: 2, growth: 1.7, effect: (lv) => `Atual: +${50 * lv}% de renda` },
  { id: 'afeto', icon: '💗', name: 'Laço profundo', desc: '+25% de afeto ganho por toque, por nível',
    base: 2, growth: 1.7, effect: (lv) => `Atual: +${25 * lv}% de afeto` },
  { id: 'dote', icon: '🎁', name: 'Dote inicial', desc: 'Comece cada vida com +5.000 corações, por nível',
    base: 1, growth: 1.8, effect: (lv) => `Você começa com ${fmt(5000 * lv)} corações` },
  { id: 'sorte', icon: '🍀', name: 'Sorte de sakura', desc: 'Corações raros aparecem 10% mais rápido, por nível (máx. 7)',
    base: 3, growth: 1.8, max: 7, effect: (lv) => `Aparecem ${10 * lv}% mais rápido` },
];

// Cada conquista soma +2% em tudo
const ACHIEVEMENTS = [
  { id: 'primeiro', name: 'Primeiro toque',        desc: 'Faça carinho uma vez.',                    test: (s) => s.clicks >= 1 },
  { id: 'c100',     name: 'Dedo carinhoso',        desc: 'Dê 100 toques.',                           test: (s) => s.clicks >= 100 },
  { id: 'c1000',    name: 'Mão macia',             desc: 'Dê 1.000 toques.',                         test: (s) => s.clicks >= 1000 },
  { id: 'c10000',   name: 'Devoto',                desc: 'Dê 10.000 toques.',                        test: (s) => s.clicks >= 10000 },
  { id: 'h1k',      name: 'Coração acelerado',     desc: 'Acumule 1.000 corações.',                  test: (s) => s.total >= 1e3 },
  { id: 'h1m',      name: 'Apaixonado',            desc: 'Acumule 1 milhão de corações.',            test: (s) => s.total >= 1e6 },
  { id: 'h1b',      name: 'Amor eterno',           desc: 'Acumule 1 bilhão de corações.',            test: (s) => s.total >= 1e9 },
  { id: 'g10',      name: 'Rotina a dois',         desc: 'Tenha 10 de uma mesma atividade.',         test: (s) => GENERATORS.some((g) => (s.owned[g.id] || 0) >= 10) },
  { id: 'gall',     name: 'Agenda cheia',          desc: 'Tenha ao menos 1 de cada atividade.',      test: (s) => GENERATORS.every((g) => (s.owned[g.id] || 0) >= 1) },
  { id: 'gold1',    name: 'Sorte de principiante', desc: 'Pegue um coração raro.',                   test: (s) => s.golden >= 1 },
  { id: 'gold10',   name: 'Olho de águia',         desc: 'Pegue 10 corações raros.',                 test: (s) => s.golden >= 10 },
  { id: 'col3',     name: 'Trio inseparável',      desc: 'Desbloqueie 3 waifus.',                    test: (s) => s.unlocked.length >= 3 },
  { id: 'colall',   name: 'Coleção completa',      desc: 'Desbloqueie todas as waifus.',             test: (s) => s.unlocked.length >= WAIFUS.length },
  { id: 'lv10',     name: 'Afeto profundo',        desc: 'Leve uma waifu ao nível 10.',              test: (s) => WAIFUS.some((w) => levelFromXp(s.xp[w.id] || 0) >= 10) },
  { id: 'talk1',    name: 'Bom ouvinte',           desc: 'Acerte uma resposta numa conversa.',       test: (s) => s.talks >= 1 },
  { id: 'talk10',   name: 'Coração lido',          desc: 'Acerte 10 respostas em conversas.',        test: (s) => s.talks >= 10 },
  { id: 'rein1',    name: 'Nova vida',             desc: 'Reencarne pela primeira vez.',             test: (s) => s.reincarnations >= 1 },
  { id: 'rein5',    name: 'Ciclo sem fim',         desc: 'Reencarne 5 vezes.',                       test: (s) => s.reincarnations >= 5 },
];

const TALK_COOLDOWN = 60 * 1000; // tempo entre conversas
const RING_DIVISOR = 2e6;        // corações na vida para o 1º anel (cresce com a raiz quadrada)
const MAX_FX = 120;              // limite de partículas na tela

/* =========================================================
   2. IMAGENS
   ========================================================= */

// Se a imagem não carregar, o quadro mostra o caminho esperado
function artHTML(w) {
  return `<img src="${w.img}" alt="" draggable="false" data-path="${w.img}"
    style="object-position:${w.pos}" onerror="imgFailed(this)">`;
}

let warnedAboutImages = false;
function imgFailed(img) {
  const box = img.parentElement;
  const msg = `Imagem não encontrada: ${img.dataset.path}`;
  box.classList.add('no-img');
  box.dataset.msg = msg;
  img.remove();
  if (!warnedAboutImages) {
    warnedAboutImages = true;
    console.error(msg);
    toast('As imagens não carregaram. Veja a mensagem no quadro da waifu.');
  }
}

function preloadImages() {
  for (const w of WAIFUS) {
    const img = new Image();
    img.src = w.img;
  }
}

/* =========================================================
   3. ESTADO, CÁLCULOS E SALVAMENTO
   ========================================================= */

const freshState = () => ({
  hearts: 0,          // corações para gastar
  total: 0,           // corações ganhos em todas as vidas
  run: 0,             // corações ganhos nesta vida (define os anéis)
  clicks: 0,
  golden: 0,          // corações raros pegos
  owned: {},          // atividades: { id: quantidade }
  clickLevels: {},    // melhorias de toque: { id: nível }
  active: 'miku',
  unlocked: ['miku'],
  xp: {},             // afeto por waifu
  achievements: [],
  buyAmount: '1',     // '1' | '10' | 'max'
  rings: 0,           // anéis para gastar
  ringUpgrades: {},   // bênçãos: { id: nível }
  reincarnations: 0,
  talks: 0,           // respostas certas em conversas
  talkReadyAt: 0,     // quando a próxima conversa fica disponível
  effects: null,      // null = segue o sistema; true/false = escolha do jogador
  savedAt: Date.now(),
});

function loadState() {
  const state = freshState();
  let saved = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (err) {
    console.warn('Não foi possível ler o save:', err);
  }
  if (saved) {
    Object.assign(state, saved);
    // Saves antigos não tinham "run": conta tudo como a vida atual
    if (typeof saved.run !== 'number') state.run = state.total;
  }

  // Um save antigo pode citar waifus que não existem mais: limpa isso
  const ids = WAIFUS.map((w) => w.id);
  state.unlocked = state.unlocked.filter((id) => ids.includes(id));
  if (!state.unlocked.includes(ids[0])) state.unlocked.unshift(ids[0]);
  if (!state.unlocked.includes(state.active)) state.active = ids[0];
  return state;
}

let S = loadState();
let resetting = false;

function saveState() {
  if (resetting) return;
  try {
    S.savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (err) {
    console.warn('Não foi possível salvar:', err);
  }
}

// Todo ganho de corações passa por aqui
function addHearts(n) {
  S.hearts += n;
  S.total += n;
  S.run += n;
}

// Afeto: nível 1 com 0, nível 2 com 8, nível 3 com 32...
const xpForLevel = (l) => 8 * (l - 1) ** 2;
const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 8)) + 1;
const levelOf = (id) => levelFromXp(S.xp[id] || 0);

const getWaifu = (id) => WAIFUS.find((w) => w.id === id);
const ownedOf = (item) => (item.kind === 'click' ? S.clickLevels[item.id] : S.owned[item.id]) || 0;
const ringLevel = (id) => S.ringUpgrades[id] || 0;

// +10% por waifu extra, +2% por conquista e +25% por nível de Amor eterno
function multiplier() {
  return (1 + 0.1 * (S.unlocked.length - 1))
    * (1 + 0.02 * S.achievements.length)
    * (1 + 0.25 * ringLevel('eterno'));
}
const cpsBoost = () => 1 + 0.5 * ringLevel('renda');

const baseCps = () => GENERATORS.reduce((sum, g) => sum + (S.owned[g.id] || 0) * g.cps, 0);
const cps = () => baseCps() * multiplier() * cpsBoost();

function perClick() {
  const flat = 1 + (S.clickLevels.cafune || 0);
  const percent = (S.clickLevels.toque || 0) * 0.01 * baseCps();
  return (flat + percent)
    * multiplier()
    * (1 + 0.5 * ringLevel('divino'))
    * (1 + 0.05 * (levelOf(S.active) - 1));
}

// Custo de comprar "n" unidades a partir de "owned"
function costOf(item, owned, n) {
  const g = item.growth;
  return Math.ceil(item.base * Math.pow(g, owned) * (Math.pow(g, n) - 1) / (g - 1));
}

function maxAffordable(item, owned) {
  let n = 0;
  while (n < 500 && costOf(item, owned, n + 1) <= S.hearts) n++;
  return n;
}

function buyCount(item) {
  if (S.buyAmount === 'max') return Math.max(1, maxAffordable(item, ownedOf(item)));
  return Number(S.buyAmount);
}

// Formata números grandes em português: 1,25 mi, 3,4 bi...
const BIG_UNITS = [[1e18, ' qui'], [1e15, ' qua'], [1e12, ' tri'], [1e9, ' bi'], [1e6, ' mi']];
function fmt(n) {
  if (n < 1e6) {
    return n < 10 && !Number.isInteger(n)
      ? n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
      : Math.floor(n).toLocaleString('pt-BR');
  }
  for (const [value, suffix] of BIG_UNITS) {
    if (n >= value) return (n / value).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + suffix;
  }
  return n.toExponential(2).replace('.', ',');
}

/* =========================================================
   4. EFEITOS
   ========================================================= */

const els = {
  hearts: $('#hearts'),
  cps: $('#cps'),
  perClick: $('#per-click'),
  stage: $('#stage'),
  art: $('#waifu-art'),
  btn: $('#waifu-btn'),
  name: $('#waifu-name'),
  level: $('#waifu-level'),
  bubble: $('#bubble'),
  affectionText: $('#affection-text'),
  affectionFill: $('#affection-fill'),
  collection: $('#collection'),
  collectionSummary: $('#collection-summary'),
  achievements: $('#achievements'),
  achievementsSummary: $('#achievements-summary'),
  fx: $('#fx'),
  fxBtn: $('#fx-btn'),
  toasts: $('#toasts'),
  // conversas
  talkBtn: $('#talk-btn'),
  talkLabel: $('#talk-label'),
  talk: $('#talk'),
  talkArt: $('#talk-art'),
  talkName: $('#talk-name'),
  talkQuestion: $('#talk-question'),
  talkChoices: $('#talk-choices'),
  talkResult: $('#talk-result'),
  talkReply: $('#talk-reply'),
  talkReward: $('#talk-reward'),
  talkClose: $('#talk-close'),
  talkCancel: $('#talk-cancel'),
  // anéis
  ringsOwned: $('#rings-owned'),
  reincCount: $('#reinc-count'),
  reincBtn: $('#reinc-btn'),
  reincTitle: $('#reinc-title'),
  reincSub: $('#reinc-sub'),
  listRings: $('#list-rings'),
  ringsDot: $('#rings-dot'),
};

// Efeitos seguem a preferência do sistema ("reduzir movimento"),
// a menos que o jogador escolha no botão do topo.
const effectsOn = () => (S.effects === null ? !reduceMotion.matches : !!S.effects);

function applyMotion() {
  const on = effectsOn();
  document.documentElement.dataset.motion = on ? 'on' : 'off';
  els.fxBtn.textContent = `Efeitos: ${on ? 'ligados' : 'desligados'}`;
  els.fxBtn.setAttribute('aria-pressed', String(on));
}

// Número que sobe e some aos poucos
function spawnFloat(text, x, y, cls = '') {
  if (!effectsOn() || els.fx.childElementCount > MAX_FX) return;
  const el = document.createElement('span');
  el.className = `float ${cls}`.trim();
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--drift', `${Math.random() * 40 - 20}px`);
  el.addEventListener('animationend', () => el.remove());
  els.fx.append(el);
}

// Corações pequenos que sobem balançando e vão sumindo
const HEART_COLORS = ['var(--accent)', '#ff7fb2', '#ffffff', '#ffd166'];
function spawnHearts(x, y, count = 5) {
  if (!effectsOn()) return;
  count = Math.min(count, MAX_FX - els.fx.childElementCount);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'heart';
    el.textContent = '♥';
    el.style.left = `${x + (Math.random() * 40 - 20)}px`;
    el.style.top = `${y + (Math.random() * 20 - 10)}px`;
    el.style.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    el.style.fontSize = `${14 + Math.random() * 14}px`;
    el.style.setProperty('--sway', `${(Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 22)}px`);
    el.style.setProperty('--dx', `${Math.random() * 60 - 30}px`);
    el.style.setProperty('--rise', `${110 + Math.random() * 90}px`);
    el.style.setProperty('--rot', `${Math.random() * 50 - 25}deg`);
    el.style.animationDuration = `${1 + Math.random() * 0.7}s`;
    el.style.animationDelay = `${i * 0.05}s`;
    el.addEventListener('animationend', () => el.remove());
    els.fx.append(el);
  }
}

// Algumas pétalas para dar variedade
function spawnPetals(x, y, count = 2) {
  if (!effectsOn() || els.fx.childElementCount > MAX_FX) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'petal';
    el.textContent = '🌸';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
    el.style.setProperty('--dy', `${-30 - Math.random() * 90}px`);
    el.style.setProperty('--rot', `${Math.random() * 360 - 180}deg`);
    el.addEventListener('animationend', () => el.remove());
    els.fx.append(el);
  }
}

// Pulso do card: encolhe um pouco, volta e solta um anel na cor da waifu
function pulseCard() {
  if (!effectsOn()) return;
  els.btn.classList.remove('tap');
  void els.btn.offsetWidth; // reinicia a animação
  els.btn.classList.add('tap');
}

// Brilho rápido na imagem
let stageImg = null;
function flashArt() {
  if (!stageImg || !effectsOn()) return;
  stageImg.animate(
    [{ filter: 'brightness(1.3) saturate(1.2)' }, { filter: 'brightness(1) saturate(1)' }],
    { duration: 180, easing: 'ease-out' }
  );
}

/* =========================================================
   5. INTERFACE
   ========================================================= */

let lastLevel = levelOf(S.active);

function toast(message, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`.trim();
  el.textContent = message;
  els.toasts.append(el);
  while (els.toasts.children.length > 4) els.toasts.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 3800);
  setTimeout(() => el.remove(), 4200);
}

let bubbleTimer = null;
function say(text) {
  els.bubble.textContent = text;
  els.bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => els.bubble.classList.remove('show'), 2400);
}

function renderStage(greet = false) {
  const w = getWaifu(S.active);
  els.art.classList.remove('no-img');
  delete els.art.dataset.msg;
  els.art.innerHTML = artHTML(w);
  stageImg = els.art.firstElementChild;
  els.name.textContent = w.name;
  els.stage.style.setProperty('--accent', w.accent);
  document.documentElement.style.setProperty('--accent', w.accent);
  lastLevel = levelOf(w.id);
  if (greet) say(w.hello);
}

function updateAffection() {
  const xp = S.xp[S.active] || 0;
  const lv = levelFromXp(xp);
  const start = xpForLevel(lv);
  const need = xpForLevel(lv + 1) - start;
  const cur = xp - start;
  els.level.textContent = `Nível ${lv}`;
  els.affectionText.textContent = `${fmt(cur)} / ${fmt(need)}`;
  els.affectionFill.style.width = `${Math.min(100, (cur / need) * 100)}%`;
}

// Soma afeto à waifu do palco e avisa se ela subiu de nível
function addXp(n) {
  S.xp[S.active] = (S.xp[S.active] || 0) + n;
  const lv = levelOf(S.active);
  if (lv !== lastLevel) {
    lastLevel = lv;
    toast(`${getWaifu(S.active).name} chegou ao nível ${lv}! Seus toques rendem mais.`);
    renderCollection();
  }
  updateAffection();
}

/* ---------- Toque na waifu ---------- */

function onWaifuClick(e) {
  const gain = perClick();
  addHearts(gain);
  S.clicks += 1;
  addXp(1 + 0.25 * ringLevel('afeto'));

  const rect = els.btn.getBoundingClientRect();
  const x = e.clientX || rect.left + rect.width / 2;
  const y = e.clientY || rect.top + rect.height / 2;

  spawnFloat('+' + fmt(gain), x, y);
  spawnHearts(x, y, 5);
  spawnPetals(x, y, 1);
  pulseCard();
  flashArt();

  // Fala de vez em quando
  if (!els.bubble.classList.contains('show') || Math.random() < 0.12) {
    const lines = getWaifu(S.active).lines;
    say(lines[Math.floor(Math.random() * lines.length)]);
  }

  updateUI();
}

/* ---------- Melhorias e bênçãos (botões da lista) ---------- */

function makeItemButton(symbol) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'item';
  btn.innerHTML = `
    <span class="item-icon" aria-hidden="true"></span>
    <span class="item-body">
      <span class="item-name"></span>
      <span class="item-desc"></span>
      <span class="item-gain"></span>
    </span>
    <span class="item-buy">
      <span class="item-cost"><span aria-hidden="true">${symbol}</span> <b></b></span>
      <span class="item-count"></span>
    </span>`;
  return btn;
}

function fillItemButton(btn, item) {
  btn.querySelector('.item-icon').textContent = item.icon;
  btn.querySelector('.item-name').textContent = item.name;
  btn.querySelector('.item-desc').textContent = item.desc;
  return {
    btn,
    cost: btn.querySelector('.item-cost b'),
    count: btn.querySelector('.item-count'),
    gain: btn.querySelector('.item-gain'),
  };
}

const itemUIs = [];

function buildItems() {
  const targets = { click: $('#list-click'), gen: $('#list-gen') };
  for (const item of ITEMS) {
    const btn = makeItemButton('♥');
    btn.addEventListener('click', () => buy(item));
    targets[item.kind].append(btn);
    itemUIs.push({ item, ...fillItemButton(btn, item) });
  }
}

function buy(item) {
  const owned = ownedOf(item);
  const n = buyCount(item);
  const cost = costOf(item, owned, n);
  if (S.hearts < cost) return;
  S.hearts -= cost;
  if (item.kind === 'click') S.clickLevels[item.id] = owned + n;
  else S.owned[item.id] = owned + n;
  updateUI();
}

function setupBuyAmount() {
  const group = $('#buy-amount');
  const buttons = [...group.querySelectorAll('button')];
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.amount === S.buyAmount)));
  buttons.forEach((b) => b.addEventListener('click', () => { S.buyAmount = b.dataset.amount; sync(); updateUI(); }));
  sync();
}

/* ---------- Coleção ---------- */

function renderCollection() {
  els.collectionSummary.textContent =
    `Cada waifu desbloqueada soma 10% em tudo. Bônus atual: +${(S.unlocked.length - 1) * 10}%. ` +
    'Toque em uma waifu para colocá-la no palco.';
  els.collection.innerHTML = '';

  for (const w of WAIFUS) {
    const unlocked = S.unlocked.includes(w.id);
    const isActive = S.active === w.id;
    const card = document.createElement(unlocked ? 'button' : 'div');
    card.className = ['card', unlocked ? '' : 'locked', isActive ? 'active' : ''].join(' ').trim();

    const note = unlocked
      ? `Nível ${levelOf(w.id)}. ${w.trait}.`
      : `Desbloqueia ao acumular ${fmt(w.unlock)} corações.`;

    card.innerHTML = `
      <div class="card-art">${artHTML(w)}</div>
      <div class="card-name">${unlocked ? w.name : '???'}</div>
      ${isActive ? '<span class="card-tag">No palco</span>' : ''}
      <div class="card-note">${note}</div>`;

    if (unlocked) {
      card.type = 'button';
      card.setAttribute('aria-pressed', String(isActive));
      card.addEventListener('click', () => selectWaifu(w.id));
    }
    els.collection.append(card);
  }
}

function selectWaifu(id) {
  if (S.active === id) return;
  S.active = id;
  renderStage(true);
  updateAffection();
  renderCollection();
  updateUI();
}

function checkUnlocks() {
  for (const w of WAIFUS) {
    if (!S.unlocked.includes(w.id) && S.total >= w.unlock) {
      S.unlocked.push(w.id);
      toast(`${w.name} entrou na sua coleção! +10% em tudo.`, 'gold');
      renderCollection();
    }
  }
}

/* ---------- Conquistas ---------- */

function renderAchievements() {
  const done = S.achievements.length;
  els.achievementsSummary.textContent =
    `${done} de ${ACHIEVEMENTS.length} conquistas. Cada uma soma 2% em tudo (atual: +${done * 2}%).`;
  els.achievements.innerHTML = ACHIEVEMENTS.map((a) => {
    const ok = S.achievements.includes(a.id);
    return `<li class="ach ${ok ? 'done' : ''}">
      <span class="ach-mark" aria-hidden="true">${ok ? '★' : '☆'}</span>
      <div><strong>${a.name}</strong><span>${a.desc}</span></div>
    </li>`;
  }).join('');
}

function checkAchievements() {
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    if (!S.achievements.includes(a.id) && a.test(S)) {
      S.achievements.push(a.id);
      toast(`Conquista: ${a.name}`, 'gold');
      changed = true;
    }
  }
  if (changed) renderAchievements();
}

/* ---------- Abas ---------- */

function setupTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const activate = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      activate(next);
      next.focus();
    });
  });
}

/* ---------- Coração raro ---------- */

function scheduleGolden() {
  // Cada nível de Sorte de sakura encurta o intervalo em 10% (mínimo 30%)
  const factor = Math.max(0.3, 1 - 0.1 * ringLevel('sorte'));
  setTimeout(spawnGolden, (45000 + Math.random() * 60000) * factor);
}

function spawnGolden() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'golden';
  btn.textContent = '💛';
  btn.setAttribute('aria-label', 'Coração raro: toque para ganhar corações');
  btn.style.left = `${8 + Math.random() * 78}%`;
  btn.style.top = `${14 + Math.random() * 60}%`;
  els.stage.append(btn);

  const expire = setTimeout(() => { btn.remove(); scheduleGolden(); }, 12000);

  btn.addEventListener('click', (e) => {
    clearTimeout(expire);
    const gain = Math.max(perClick() * 40, cps() * 60);
    addHearts(gain);
    S.golden += 1;
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    spawnFloat('+' + fmt(gain), x, y, 'gold');
    spawnHearts(x, y, 10);
    toast(`Coração raro! +${fmt(gain)} corações`, 'gold');
    btn.remove();
    scheduleGolden();
    updateUI();
  });
}

/* =========================================================
   6. CONVERSAS (MINI-GAME)
   ========================================================= */

let currentTalk = null;
const lastTalk = {};     // waifu -> última conversa (para não repetir seguido)
let talkWasReady = true;

const talkSecondsLeft = () => Math.max(0, Math.ceil((S.talkReadyAt - Date.now()) / 1000));

function updateTalkButton() {
  const left = talkSecondsLeft();
  const ready = left === 0;
  if (ready && !talkWasReady) say('Podemos conversar?');
  talkWasReady = ready;
  els.talkBtn.classList.toggle('ready', ready);
  els.talkBtn.setAttribute('aria-disabled', String(!ready));
  const label = ready ? 'Conversar' : `Conversar em ${left}s`;
  if (els.talkLabel.textContent !== label) els.talkLabel.textContent = label;
}

function openTalk() {
  const left = talkSecondsLeft();
  if (left > 0) {
    toast(`Ela precisa de um tempinho. Volte em ${left}s.`);
    return;
  }
  if (els.talk.open) return;

  const w = getWaifu(S.active);
  let idx;
  do { idx = Math.floor(Math.random() * w.talks.length); }
  while (w.talks.length > 1 && idx === lastTalk[w.id]);
  lastTalk[w.id] = idx;

  const d = w.talks[idx];
  currentTalk = { w, d, answered: false };

  els.talkArt.classList.remove('no-img');
  els.talkArt.innerHTML = artHTML(w);
  els.talkName.textContent = w.name;
  els.talkQuestion.textContent = d.q;
  els.talkResult.hidden = true;
  els.talkCancel.hidden = false;
  els.talkChoices.hidden = false;
  els.talkChoices.innerHTML = '';

  // Embaralha para a resposta certa não ficar sempre no mesmo lugar
  const shuffled = [...d.choices].sort(() => Math.random() - 0.5);
  for (const choice of shuffled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.textContent = choice.t;
    b.addEventListener('click', () => answerTalk(choice, b));
    els.talkChoices.append(b);
  }

  if (typeof els.talk.showModal === 'function') els.talk.showModal();
  else els.talk.setAttribute('open', '');
  els.talkChoices.firstElementChild.focus();
}

// Prêmio de afeto: 60% do que falta para o próximo nível
function affectionBonus() {
  const lv = levelOf(S.active);
  return Math.ceil((xpForLevel(lv + 1) - xpForLevel(lv)) * 0.6);
}

function answerTalk(choice, button) {
  if (!currentTalk || currentTalk.answered) return;
  currentTalk.answered = true;
  const { w, d } = currentTalk;

  S.talkReadyAt = Date.now() + TALK_COOLDOWN;
  [...els.talkChoices.children].forEach((b) => { b.disabled = true; });
  button.classList.add(choice.good ? 'right' : 'wrong');

  let reward;
  if (choice.good) {
    S.talks += 1;
    if (d.reward === 'affection') {
      const gain = affectionBonus();
      addXp(gain);
      reward = `Afeto +${fmt(gain)}`;
    } else {
      const gain = Math.max(perClick() * 50, cps() * 90);
      addHearts(gain);
      reward = `+${fmt(gain)} corações`;
    }
  }

  els.talkReply.textContent = `${w.name}: “${choice.r}”`;
  els.talkReward.textContent = reward || 'Sem bônus desta vez. Tente acertar na próxima conversa.';
  els.talkReward.classList.toggle('none', !reward);
  els.talkResult.hidden = false;
  els.talkCancel.hidden = true;
  els.talkClose.focus();

  if (choice.good) {
    const r = els.talkArt.getBoundingClientRect();
    spawnHearts(r.left + r.width / 2, r.top + r.height / 2, 8);
  }
  updateUI();
}

function setupTalk() {
  els.talkBtn.addEventListener('click', openTalk);
  els.talkClose.addEventListener('click', () => els.talk.close());
  els.talkCancel.addEventListener('click', () => els.talk.close());
  els.talk.addEventListener('close', () => { currentTalk = null; updateUI(); });
  talkWasReady = talkSecondsLeft() === 0;
}

/* =========================================================
   7. REENCARNAÇÃO (PRESTÍGIO)
   ========================================================= */

const pendingRings = () => Math.floor(Math.sqrt(S.run / RING_DIVISOR));
const nextRingAt = () => RING_DIVISOR * (pendingRings() + 1) ** 2;
const ringCost = (u) => Math.ceil(u.base * Math.pow(u.growth, ringLevel(u.id)));

const ringUIs = [];

function buildRings() {
  for (const item of RING_UPGRADES) {
    const btn = makeItemButton('💍');
    btn.classList.add('ring-item');
    btn.addEventListener('click', () => buyRingUpgrade(item));
    els.listRings.append(btn);
    ringUIs.push({ item, ...fillItemButton(btn, item) });
  }
  els.reincBtn.addEventListener('click', reincarnate);
}

function buyRingUpgrade(item) {
  const lv = ringLevel(item.id);
  if (item.max && lv >= item.max) return;
  const cost = ringCost(item);
  if (S.rings < cost) {
    toast('Você precisa de mais anéis. Reencarne para ganhar.');
    return;
  }
  S.rings -= cost;
  S.ringUpgrades[item.id] = lv + 1;
  toast(`${item.name}: nível ${lv + 1}`, 'gold');
  updateUI();
}

function reincarnate() {
  const gain = pendingRings();
  if (gain < 1) {
    toast(`Junte ${fmt(RING_DIVISOR)} corações nesta vida para ganhar o primeiro anel.`);
    return;
  }
  const ok = confirm(
    `Reencarnar agora?\n\n` +
    `Você ganha ${gain} ${gain === 1 ? 'anel' : 'anéis'} de compromisso e volta ao começo: ` +
    `corações, melhorias de toque e atividades são reiniciados.\n\n` +
    `Você mantém waifus, afeto, conquistas e bênçãos.`
  );
  if (!ok) return;

  S.rings += gain;
  S.reincarnations += 1;
  S.hearts = 5000 * ringLevel('dote');
  S.run = 0;
  S.owned = {};
  S.clickLevels = {};
  saveState();

  toast(`Nova vida! +${gain} ${gain === 1 ? 'anel' : 'anéis'} de compromisso.`, 'gold');
  const r = els.btn.getBoundingClientRect();
  spawnHearts(r.left + r.width / 2, r.top + r.height / 2, 24);
  say('Vamos começar de novo, juntos.');
  updateUI();
}

function updateRingsUI() {
  const gain = pendingRings();
  const run = Math.floor(S.run);
  els.ringsOwned.textContent = fmt(S.rings);
  els.reincCount.textContent = fmt(S.reincarnations);
  els.reincBtn.classList.toggle('cant', gain < 1);
  els.reincBtn.setAttribute('aria-disabled', String(gain < 1));
  els.reincTitle.textContent = gain < 1
    ? 'Ainda não dá para reencarnar'
    : `Reencarnar por ${fmt(gain)} ${gain === 1 ? 'anel' : 'anéis'}`;
  els.reincSub.textContent = gain < 1
    ? `Junte ${fmt(RING_DIVISOR)} corações nesta vida (você tem ${fmt(run)}).`
    : `Nesta vida: ${fmt(run)} corações. Próximo anel com ${fmt(nextRingAt())}.`;
  els.ringsDot.hidden = gain < 1;

  for (const ui of ringUIs) {
    const lv = ringLevel(ui.item.id);
    const maxed = !!ui.item.max && lv >= ui.item.max;
    const cost = ringCost(ui.item);
    const canBuy = !maxed && S.rings >= cost;
    ui.cost.textContent = maxed ? 'Máx' : fmt(cost);
    ui.btn.classList.toggle('cant', !canBuy);
    ui.btn.setAttribute('aria-disabled', String(!canBuy));
    ui.count.textContent = `Nível ${lv}`;
    ui.gain.textContent = lv > 0 ? ui.item.effect(lv) : '';
  }
}

/* =========================================================
   8. ATUALIZAÇÃO DA TELA, LOOP E INÍCIO
   ========================================================= */

function updateUI() {
  els.hearts.textContent = fmt(Math.floor(S.hearts));
  els.cps.textContent = fmt(cps());
  els.perClick.textContent = '+' + fmt(perClick());

  for (const ui of itemUIs) {
    const owned = ownedOf(ui.item);
    const n = buyCount(ui.item);
    const cost = costOf(ui.item, owned, n);
    const canBuy = S.hearts >= cost;
    ui.cost.textContent = fmt(cost) + (n > 1 ? ` (×${n})` : '');
    ui.btn.classList.toggle('cant', !canBuy);
    ui.btn.setAttribute('aria-disabled', String(!canBuy));
    ui.count.textContent = ui.item.kind === 'click' ? `Nível ${owned}` : `Você tem ${owned}`;
    if (ui.item.kind === 'gen') {
      ui.gain.textContent = `Rende ${fmt(ui.item.cps * multiplier() * cpsBoost())} por segundo cada`;
    }
  }

  updateRingsUI();
  updateTalkButton();
}

let lastTick = Date.now();
let titleTick = 0;

function tick() {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 600);
  lastTick = now;

  addHearts(cps() * dt);

  checkUnlocks();
  checkAchievements();
  updateUI();

  if (++titleTick % 10 === 0) {
    document.title = `${fmt(Math.floor(S.hearts))} ♥ Waifu Clicker`;
  }
}

function init() {
  // Progresso enquanto a página esteve fechada (50% da renda, até 8 horas)
  const away = Math.min((Date.now() - S.savedAt) / 1000, 8 * 3600);
  if (away > 60 && cps() > 0) {
    const gain = cps() * away * 0.5;
    addHearts(gain);
    toast(`Enquanto você esteve fora, ela juntou ${fmt(gain)} corações.`);
  }

  preloadImages();
  buildItems();
  buildRings();
  setupBuyAmount();
  setupTabs();
  setupTalk();
  renderStage(true);
  updateAffection();
  renderCollection();
  renderAchievements();
  applyMotion();
  updateUI();

  els.btn.addEventListener('click', onWaifuClick);
  els.btn.addEventListener('animationend', (e) => {
    if (e.target === els.btn) els.btn.classList.remove('tap');
  });

  els.fxBtn.addEventListener('click', () => {
    S.effects = !effectsOn();
    applyMotion();
  });
  reduceMotion.addEventListener('change', applyMotion);

  $('#save-btn').addEventListener('click', () => { saveState(); toast('Jogo salvo!'); });
  $('#reset-btn').addEventListener('click', () => {
    if (confirm('Recomeçar do zero? TODO o progresso será apagado, inclusive anéis e bênçãos.')) {
      resetting = true;
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  });

  setInterval(tick, 100);
  setInterval(saveState, 10000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
  window.addEventListener('beforeunload', saveState);

  scheduleGolden();
}

init();

// Sistema de som de bolhas (Pop / Bubble) via Web Audio API
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Desbloqueia o áudio na primeira interação na tela para respeitar as políticas do navegador
window.addEventListener('pointerdown', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

function playBubbleSound() {
  initAudio();

  // Respeita a opção de efeitos ligados/desligados no HUD
  const fxBtn = document.getElementById('fx-btn');
  if (fxBtn && fxBtn.getAttribute('aria-pressed') === 'false') return;

  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // Geradores de tom e volume
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Onda senoidal limpa para simular o estouro de uma bolha de ar
  osc.type = 'sine';

  // Pequena variação aleatória de frequência para cada clique soar levemente diferente e natural
  const baseFreq = 400 + Math.random() * 120; // Frequência inicial (300Hz a 420Hz)
  const targetFreq = baseFreq + 350 + Math.random() * 100; // Subida rápida para o efeito "POP"

  // Curva de pitch (frequência sobe rapidamente criando o som de sucção/estouro de ar)
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.04);

  // Envelope de volume (ataque e decaimento ultrarrápidos para simular a bolha estourando)
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Conecta e toca
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// Conecta o som de bolha ao toque na Waifu
document.addEventListener('DOMContentLoaded', () => {
  const waifuBtn = document.getElementById('waifu-btn');
  if (waifuBtn) {
    waifuBtn.addEventListener('pointerdown', playBubbleSound);
  }
});
