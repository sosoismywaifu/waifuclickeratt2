'use strict';

/* =========================================================
   Kokoro Clicker — lógica do jogo
   ========================================================= */

const SAVE_KEY = 'kokoroClicker.v1';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel) => document.querySelector(sel);

/* =========================================================
   1. DADOS
   ========================================================= */

// CAMINHOS ATUALIZADOS PARA A PASTA "images/"
const WAIFUS = [
  {
    id: 'miku', name: 'Miku', trait: 'Tímida e fã de história',
    unlock: 0, accent: '#6f8dff', img: 'images/miku.png', pos: '50% 30%',
    hello: '...Oi. Você veio mesmo.',
    lines: ['E-eu não sou boa nisso, mas gosto.', 'Sabia que os samurais também descansavam?', 'Não me olhe assim... continue.', 'Seus toques são calmos. Eu gosto.'],
  },
  {
    id: 'nino', name: 'Nino', trait: 'Orgulhosa e ótima na cozinha',
    unlock: 2500, accent: '#ff7fb2', img: 'images/nino.png', pos: '50% 15%',
    hello: 'Não é como se eu estivesse esperando!',
    lines: ['Pare de me olhar desse jeito!', 'Fiz doces, mas não são para você!', 'Tá bom, só mais um.', 'Você é teimoso... até que combina.'],
  },
  {
    id: 'ichika', name: 'Ichika', trait: 'Madura e provocadora',
    unlock: 40000, accent: '#ffd75e', img: 'images/ichika.png', pos: '50% 20%',
    hello: 'Ora, ora, olha quem chegou.',
    lines: ['Você fica fofo quando cora.', 'Hoje eu atuo só para você.', 'Não precisa ter pressa.', 'Cuidado, ou eu me acostumo.'],
  },
  {
    id: 'yotsuba', name: 'Yotsuba', trait: 'Animada e sempre disposta a ajudar',
    unlock: 600000, accent: '#5fe08f', img: 'images/yotsuba.png', pos: '50% 20%',
    hello: 'Bom dia! Vamos com tudo hoje!',
    lines: ['Pode contar comigo!', 'Ei, vamos correr depois?', 'Hoje é dia de fazer o bem!', 'Se der errado, tentamos de novo!'],
  },
  {
    id: 'itsuki', name: 'Itsuki', trait: 'Dedicada e de bom apetite',
    unlock: 10000000, accent: '#ff6b5b', img: 'images/itsuki.png', pos: '50% 20%',
    hello: 'Podemos comer algo depois?',
    lines: ['Estudar dá fome, sabia?', 'Só mais um pouquinho, prometo.', 'Você me ajuda no dever depois?', 'Isso foi... agradável.'],
  },
];

// Melhorias que aumentam o valor de cada toque
const CLICK_UPGRADES = [
  { id: 'cafune', icon: '🫳', name: 'Cafuné', desc: '+1 coração por toque em cada nível', base: 25, growth: 1.35 },
  { id: 'toque', icon: '✨', name: 'Toque encantado', desc: 'Cada toque rende também 1% da renda por segundo, por nível', base: 3000, growth: 2.2 },
];

// Atividades que rendem corações sozinhas (por segundo)
const GENERATORS = [
  { id: 'carta',     icon: '💌', name: 'Carta de amor',    desc: 'Ela lê e sorri sozinha.',          base: 20,      cps: 1 },
  { id: 'cafe',      icon: '☕', name: 'Encontro no café',  desc: 'Dois cafés, uma conversa longa.',  base: 120,     cps: 5 },
  { id: 'festival',  icon: '🎆', name: 'Festival de verão', desc: 'Yukata, fogos e takoyaki.',        base: 1000,    cps: 25 },
  { id: 'show',      icon: '🎤', name: 'Show ao vivo',     desc: 'Você na primeira fila.',           base: 9000,    cps: 120 },
  { id: 'japao',     icon: '⛩️', name: 'Viagem ao Japão',   desc: 'Kyoto na época das cerejeiras.',   base: 80000,   cps: 600 },
  { id: 'casamento', icon: '💒', name: 'Casamento',         desc: 'Buquê, votos e confete.',          base: 750000,  cps: 3000 },
  { id: 'isekai',    icon: '🌌', name: 'Mundo paralelo',    desc: 'Vocês viram heróis lendários.',    base: 7000000, cps: 15000 },
];

const ITEMS = [
  ...CLICK_UPGRADES.map((u) => ({ ...u, kind: 'click' })),
  ...GENERATORS.map((g) => ({ ...g, kind: 'gen', growth: 1.15 })),
];

// Conquistas
const ACHIEVEMENTS = [
  { id: 'primeiro', name: 'Primeiro toque',       desc: 'Faça carinho uma vez.',                    test: (s) => s.clicks >= 1 },
  { id: 'c100',     name: 'Dedo carinhoso',       desc: 'Dê 100 toques.',                           test: (s) => s.clicks >= 100 },
  { id: 'c1000',    name: 'Mão macia',            desc: 'Dê 1.000 toques.',                         test: (s) => s.clicks >= 1000 },
  { id: 'c10000',   name: 'Devoto',               desc: 'Dê 10.000 toques.',                        test: (s) => s.clicks >= 10000 },
  { id: 'h1k',      name: 'Coração acelerado',    desc: 'Acumule 1.000 corações.',                  test: (s) => s.total >= 1e3 },
  { id: 'h1m',      name: 'Apaixonado',           desc: 'Acumule 1 milhão de corações.',            test: (s) => s.total >= 1e6 },
  { id: 'h1b',      name: 'Amor eterno',          desc: 'Acumule 1 bilhão de corações.',            test: (s) => s.total >= 1e9 },
  { id: 'g10',      name: 'Rotina a dois',        desc: 'Tenha 10 de uma mesma atividade.',         test: (s) => GENERATORS.some((g) => (s.owned[g.id] || 0) >= 10) },
  { id: 'gall',     name: 'Agenda cheia',         desc: 'Tenha ao menos 1 de cada atividade.',      test: (s) => GENERATORS.every((g) => (s.owned[g.id] || 0) >= 1) },
  { id: 'gold1',    name: 'Sorte de principiante', desc: 'Pegue um coração raro.',                  test: (s) => s.golden >= 1 },
  { id: 'gold10',   name: 'Olho de águia',        desc: 'Pegue 10 corações raros.',                 test: (s) => s.golden >= 10 },
  { id: 'col3',     name: 'Trio inseparável',     desc: 'Desbloqueie 3 waifus.',                    test: (s) => s.unlocked.length >= 3 },
  { id: 'colall',   name: 'Coleção completa',     desc: 'Desbloqueie todas as waifus.',             test: (s) => s.unlocked.length >= WAIFUS.length },
  { id: 'lv10',     name: 'Afeto profundo',       desc: 'Leve uma waifu ao nível 10.',              test: (s) => WAIFUS.some((w) => levelFromXp(s.xp[w.id] || 0) >= 10) },
];

/* =========================================================
   2. IMAGENS
   ========================================================= */

let EMBEDDED = window.WAIFU_IMAGES || {};
let imagesProblem = '';
const imgSrc = (w) => EMBEDDED[w.id] || w.img;

function artHTML(w) {
  return `<img src="${imgSrc(w)}" alt="" draggable="false" data-path="${w.img}"
    style="object-position:${w.pos}" onerror="imgFailed(this)">`;
}

let warnedAboutImages = false;
function imgFailed(img) {
  const box = img.parentElement;
  const msg = `Imagem não encontrada: ${img.dataset.path}` + (imagesProblem ? `. ${imagesProblem}` : '');
  box.classList.add('no-img');
  box.dataset.msg = msg;
  img.remove();
  if (!warnedAboutImages) {
    warnedAboutImages = true;
    console.error(msg);
    toast('As imagens não carregaram. Veja a mensagem no quadro da waifu.');
  }
}

function refreshArt() {
  preloadImages();
  renderStage();
  renderCollection();
}

function preloadImages() {
  for (const w of WAIFUS) {
    const img = new Image();
    img.src = imgSrc(w);
  }
}

/* =========================================================
   3. ESTADO, CÁLCULOS E SALVAMENTO
   ========================================================= */

const freshState = () => ({
  hearts: 0,
  total: 0,
  clicks: 0,
  golden: 0,
  owned: {},
  clickLevels: {},
  active: 'miku',
  unlocked: ['miku'],
  xp: {},
  achievements: [],
  buyAmount: '1',
  savedAt: Date.now(),
});

function loadState() {
  let state = freshState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (err) {
    console.warn('Não foi possível ler o save:', err);
  }

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

const xpForLevel = (l) => 8 * (l - 1) ** 2;
const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 8)) + 1;
const levelOf = (id) => levelFromXp(S.xp[id] || 0);

const getWaifu = (id) => WAIFUS.find((w) => w.id === id);
const ownedOf = (item) => (item.kind === 'click' ? S.clickLevels[item.id] : S.owned[item.id]) || 0;

function multiplier() {
  return (1 + 0.1 * (S.unlocked.length - 1)) * (1 + 0.02 * S.achievements.length);
}

const baseCps = () => GENERATORS.reduce((sum, g) => sum + (S.owned[g.id] || 0) * g.cps, 0);
const cps = () => baseCps() * multiplier();

function perClick() {
  const flat = 1 + (S.clickLevels.cafune || 0);
  const percent = (S.clickLevels.toque || 0) * 0.01 * baseCps();
  return (flat + percent) * multiplier() * (1 + 0.05 * (levelOf(S.active) - 1));
}

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
   4. INTERFACE
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
  toasts: $('#toasts'),
};

let stageImg = null;
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

function flashArt() {
  if (!stageImg || reduceMotion.matches) return;
  stageImg.animate(
    [{ filter: 'brightness(1.3) saturate(1.2)' }, { filter: 'brightness(1) saturate(1)' }],
    { duration: 180, easing: 'ease-out' }
  );
}

function updateAffection() {
  const id = S.active;
  const xp = S.xp[id] || 0;
  const lv = levelFromXp(xp);
  const start = xpForLevel(lv);
  const need = xpForLevel(lv + 1) - start;
  const cur = xp - start;
  els.level.textContent = `Nível ${lv}`;
  els.affectionText.textContent = `${fmt(cur)} / ${fmt(need)}`;
  els.affectionFill.style.width = `${Math.min(100, (cur / need) * 100)}%`;
}

function spawnFloat(text, x, y, cls = '') {
  if (reduceMotion.matches || els.fx.childElementCount > 80) return;
  const el = document.createElement('span');
  el.className = `float ${cls}`.trim();
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--drift', `${Math.random() * 40 - 20}px`);
  el.addEventListener('animationend', () => el.remove());
  els.fx.append(el);
}

function spawnPetals(x, y, count = 3) {
  if (reduceMotion.matches || els.fx.childElementCount > 80) return;
  const symbols = ['🌸', '♥', '🌸'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'petal';
    el.textContent = symbols[i % symbols.length];
    if (el.textContent === '♥') el.style.color = 'var(--accent)';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
    el.style.setProperty('--dy', `${-30 - Math.random() * 90}px`);
    el.style.setProperty('--rot', `${Math.random() * 360 - 180}deg`);
    el.addEventListener('animationend', () => el.remove());
    els.fx.append(el);
  }
}

function onWaifuClick(e) {
  const gain = perClick();
  S.hearts += gain;
  S.total += gain;
  S.clicks += 1;
  S.xp[S.active] = (S.xp[S.active] || 0) + 1;

  const rect = els.btn.getBoundingClientRect();
  const x = e.clientX || rect.left + rect.width / 2;
  const y = e.clientY || rect.top + rect.height / 2;

  spawnFloat('+' + fmt(gain), x, y);
  spawnPetals(x, y);
  flashArt();

  if (!reduceMotion.matches) {
    els.btn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.965, 1.025)' }, { transform: 'scale(1)' }],
      { duration: 140, easing: 'ease-out' }
    );
  }

  if (!els.bubble.classList.contains('show') || Math.random() < 0.12) {
    const lines = getWaifu(S.active).lines;
    say(lines[Math.floor(Math.random() * lines.length)]);
  }

  const lv = levelOf(S.active);
  if (lv !== lastLevel) {
    lastLevel = lv;
    toast(`${getWaifu(S.active).name} chegou ao nível ${lv}! Seus toques rendem mais.`);
    renderCollection();
  }

  updateAffection();
  updateUI();
}

const itemUIs = [];

function buildItems() {
  const targets = { click: $('#list-click'), gen: $('#list-gen') };
  for (const item of ITEMS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item';
    btn.innerHTML = `
      <span class="item-icon" aria-hidden="true">${item.icon}</span>
      <span class="item-body">
        <span class="item-name">${item.name}</span>
        <span class="item-desc">${item.desc}</span>
        <span class="item-gain"></span>
      </span>
      <span class="item-buy">
        <span class="item-cost"><span aria-hidden="true">♥</span> <b></b></span>
        <span class="item-count"></span>
      </span>`;
    btn.addEventListener('click', () => buy(item));
    targets[item.kind].append(btn);
    itemUIs.push({
      item, btn,
      cost: btn.querySelector('.item-cost b'),
      count: btn.querySelector('.item-count'),
      gain: btn.querySelector('.item-gain'),
    });
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

function scheduleGolden() {
  setTimeout(spawnGolden, 45000 + Math.random() * 60000);
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
    S.hearts += gain;
    S.total += gain;
    S.golden += 1;
    spawnFloat('+' + fmt(gain), e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 'gold');
    toast(`Coração raro! +${fmt(gain)} corações`, 'gold');
    btn.remove();
    scheduleGolden();
    updateUI();
  });
}

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
      ui.gain.textContent = `Rende ${fmt(ui.item.cps * multiplier())} por segundo cada`;
    }
  }
}

/* =========================================================
   5. LOOP DO JOGO, SALVAMENTO E INÍCIO
   ========================================================= */

let lastTick = Date.now();
let titleTick = 0;

function tick() {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 600);
  lastTick = now;

  const gain = cps() * dt;
  S.hearts += gain;
  S.total += gain;

  checkUnlocks();
  checkAchievements();
  updateUI();

  if (++titleTick % 10 === 0) {
    document.title = `${fmt(Math.floor(S.hearts))} ♥ Kokoro Clicker`;
  }
}

function init() {
  const away = Math.min((Date.now() - S.savedAt) / 1000, 8 * 3600);
  if (away > 60 && cps() > 0) {
    const gain = cps() * away * 0.5;
    S.hearts += gain;
    S.total += gain;
    toast(`Enquanto você esteve fora, ela juntou ${fmt(gain)} corações.`);
  }

  preloadImages();
  buildItems();
  setupBuyAmount();
  setupTabs();
  renderStage(true);
  updateAffection();
  renderCollection();
  renderAchievements();
  updateUI();

  els.btn.addEventListener('click', onWaifuClick);

  $('#save-btn').addEventListener('click', () => { saveState(); toast('Jogo salvo!'); });
  $('#reset-btn').addEventListener('click', () => {
    if (confirm('Recomeçar do zero? Todo o progresso será apagado.')) {
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