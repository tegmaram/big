/* Plinko After Dark — a self-contained arcade collection game. */
(() => {
  'use strict';

  const SAVE_KEY = 'plinko-after-dark-v1';
  const W = 1000, H = 660;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const nf = new Intl.NumberFormat('en-US');

  const rarityInfo = {
    common:   { label: 'Common', hue: 38,  mult: 1.00, color: '#d7af60' },
    uncommon: { label: 'Uncommon', hue: 120, mult: 1.09, color: '#9bd174' },
    rare:     { label: 'Rare', hue: 202, mult: 1.20, color: '#72c9ed' },
    epic:     { label: 'Epic', hue: 277, mult: 1.36, color: '#cd92ef' },
    legendary:{ label: 'Legendary', hue: 22, mult: 1.62, color: '#ff9b5f' },
    relic:    { label: 'Relic', hue: 49, mult: 2.04, color: '#f6df77' }
  };
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'relic'];
  const familyNames = ['Brasswork', 'Citrine', 'Ember', 'Moss', 'Moonstone', 'Clockwork', 'Velvet', 'Comet', 'Honey', 'Obsidian'];
  const firstNames = ['Lucky', 'Merry', 'Small', 'Clever', 'Dapper', 'Sunny', 'Quiet', 'Brisk', 'Twinkle', 'Jolly', 'Gilded', 'Marble', 'Velvet', 'Honey', 'Silver', 'Fizzy', 'Orbiting', 'Pocket', 'Nimble', 'Amber', 'Secret', 'Polished', 'Grand', 'Tiny', 'Bouncy'];
  const nouns = ['Brass', 'Pebble', 'Lantern', 'Clover', 'Comet', 'Cog', 'Pearl', 'Thimble', 'Acorn', 'Spark', 'Marble', 'Moth', 'Riddle', 'Ticket', 'Button', 'Beacon', 'Cricket', 'Aurora', 'Candle', 'Whistle'];
  const specials = ['Warm glow', 'Peg whisper', 'Lucky bounce', 'Tiny thunder', 'Soft landing', 'Golden dust', 'Pocket magnet', 'Clever spin', 'Moon shimmer', 'Bonus hum'];

  const boards = [
    { id:'brass', name:'The Brass Starter', subtitle:'THE GENTLE FIRST DROP', rows:9, accent:35, level:1, difficulty:'Easy', perk:'Warm & steady', description:'A handsome first table with forgiving center pockets.', material:'Brass filings', base:1, type:'starter' },
    { id:'cinder', name:'Cinder Alley', subtitle:'THE EMBER-LIT RUN', rows:11, accent:18, level:2, difficulty:'Easy', perk:'Combo glow', description:'Each quick drop warms the alley and nudges its rewards upward.', material:'Cinder chips', base:1.13, type:'ember' },
    { id:'ivory', name:'Ivory Steps', subtitle:'A QUIET, CRISP CLIMB', rows:12, accent:48, level:3, difficulty:'Medium', perk:'Steady returns', description:'Elegant geometry with bright, dependable middle lanes.', material:'Ivory fragments', base:1.25, type:'steady' },
    { id:'sidewinder', name:'The Sidewinder', subtitle:'THE CURVE HAS A SECRET', rows:13, accent:150, level:4, difficulty:'Medium', perk:'Side rail rush', description:'Curved rails nudge adventurous balls back into play.', material:'Verdant springs', base:1.40, type:'rail' },
    { id:'clockwork', name:'Clockwork Hall', subtitle:'THE HALL OF MOVING THINGS', rows:14, accent:205, level:6, difficulty:'Hard', perk:'Timed pegs', description:'A blue-lit machine where the pegs wake up periodically.', material:'Clockwork teeth', base:1.58, type:'clock' },
    { id:'honeycomb', name:'The Honeycomb', subtitle:'SWEET CHAOS BELOW', rows:15, accent:49, level:8, difficulty:'Hard', perk:'Honey pockets', description:'Hexagonal rhythms and golden pockets full of surprises.', material:'Honey crystal', base:1.78, type:'honey' },
    { id:'observatory', name:'The Observatory', subtitle:'DROP INTO THE NIGHT', rows:16, accent:267, level:11, difficulty:'Expert', perk:'Starlight surge', description:'A cosmic table where the far edges hold strange possibilities.', material:'Star glass', base:2.05, type:'cosmic' },
    { id:'infinite', name:'The Infinite Atrium', subtitle:'THE HOUSE NEVER ENDS', rows:17, accent:330, level:15, difficulty:'Master', perk:'Living layout', description:'The living final table changes its feel with every session.', material:'Infinity dust', base:2.42, type:'infinite' }
  ];

  const researchColumns = [
    { title:'Physics Lab', icon:'⌁', description:'Make every bounce a little smarter.', nodes:[
      { id:'physics', name:'Soft Geometry', desc:'+3% all credit rewards per level.', max:5, cost:3 },
      { id:'momentum', name:'Elastic Memory', desc:'+1 extra board mastery per level.', max:4, cost:4 }
    ]},
    { title:'Fortune Bureau', icon:'✧', description:'Invite the nice kinds of chance.', nodes:[
      { id:'fortune', name:'Golden Minute', desc:'+2% chance to find Prism Shards.', max:5, cost:3 },
      { id:'discovery', name:'Open Ledger', desc:'Find new balls more often.', max:4, cost:4 }
    ]},
    { title:'Atrium Engineering', icon:'⚙', description:'Gentle automation for long evenings.', nodes:[
      { id:'auto', name:'Steady Hand', desc:'The precision gate recalibrates 0.08s faster per level.', max:4, cost:3 },
      { id:'archive', name:'Museum Light', desc:'+2% XP earned per level.', max:5, cost:3 }
    ]}
  ];

  function buildBallDefinitions() {
    const defs = [];
    for (let id = 0; id < 500; id++) {
      const family = Math.floor(id / 50);
      const tier = id % 50;
      let rarity;
      if (tier < 25) rarity = 'common';
      else if (tier < 38) rarity = 'uncommon';
      else if (tier < 45) rarity = 'rare';
      else if (tier < 48) rarity = 'epic';
      else if (tier === 48) rarity = 'legendary';
      else rarity = 'relic';
      const ri = rarityInfo[rarity];
      const hue = (ri.hue + family * 19 + (tier % 5) * 7) % 360;
      const hue2 = (hue + 38 + (id % 4) * 16) % 360;
      const name = id === 0 ? 'Lucky Brass' : `${firstNames[(id * 7 + family) % firstNames.length]} ${nouns[(id * 11 + tier) % nouns.length]}`;
      defs.push({
        id, family, familyName: familyNames[family], rarity, hue, hue2, name,
        baseMult: +(ri.mult + (tier % 5) * .012).toFixed(3),
        luck: 1 + (id * 3) % 7 + rarityOrder.indexOf(rarity) * 2,
        special: specials[(id + family * 3) % specials.length],
        description: `${familyNames[family]} series · ${specials[(id + family * 3) % specials.length].toLowerCase()} tucked into its polished little core.`
      });
    }
    return defs;
  }
  const ballDefs = buildBallDefinitions();

  const initialState = () => ({
    credits: 580, shards: 12, xp: 35, level: 1, selectedBoard: 'brass', selectedBall: 0,
    balls: [0,1,2,3,4,5,6,7].map(id => ({ id, level: 1, xp: 0 })),
    boardMastery: { brass: 0 }, boardPerks: { brass: { polish:0, lantern:0, rail:0 } },
    research: { physics:0, momentum:0, fortune:0, discovery:0, auto:0, archive:0 },
    drops: 0, topDrop: 0, contractProgress: 0, contractDone: false, tutorialSeen:false,
    auto: false, sound:true, lastDiscoveryAt: 0, feed: [], highSlots: {}, savedAt: Date.now()
  });

  let state = loadState();
  let currentView = 'play';
  let collectionFilter = 'all';
  let collectionQuery = '';
  let mergeSelection = [];
  let audioCtx;

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return initialState();
      const saved = JSON.parse(raw);
      const fresh = initialState();
      const restored = { ...fresh, ...saved,
        research: { ...fresh.research, ...(saved.research || {}) },
        boardMastery: { ...fresh.boardMastery, ...(saved.boardMastery || {}) },
        boardPerks: { ...fresh.boardPerks, ...(saved.boardPerks || {}) },
      };
      restored.balls = Array.isArray(saved.balls) && saved.balls.length ? saved.balls : fresh.balls;
      restored.feed = Array.isArray(saved.feed) ? saved.feed.slice(0, 4) : [];
      // Precision edition deliberately turns off legacy auto-drop saves.
      restored.auto = false;
      return restored;
    } catch (_) { return initialState(); }
  }
  function saveGame(silent = false) {
    state.savedAt = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      // Cookies are intentionally only a small continuity marker; saves are too rich for a 4KB cookie.
      document.cookie = `plinko_atrium_saved=1; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
      if (!silent) notice('Atrium saved', 'Your evening is safely tucked away.');
    } catch (_) { if (!silent) notice('Save notice', 'This browser declined storage.'); }
  }

  function ballOwned(id) { return state.balls.find(b => b.id === id); }
  function getSelectedBall() { return ballOwned(state.selectedBall) || state.balls[0]; }
  function board() { return boards.find(b => b.id === state.selectedBoard) || boards[0]; }
  function isBoardUnlocked(b) { return state.level >= b.level; }
  function nextXpGoal() { return 120 + state.level * 65; }
  function getPerks(id = state.selectedBoard) { return { polish:0, lantern:0, rail:0, ...(state.boardPerks[id] || {}) }; }
  function boardMastery(id = state.selectedBoard) { return state.boardMastery[id] || 0; }

  function setText(selector, text) { const el = $(selector); if (el) el.textContent = text; }
  function setWidth(selector, pct) { const el = $(selector); if (el) el.style.width = `${clamp(pct,0,100)}%`; }
  function orbHTML(def, extra = '') { return `<div class="ball-orb ${extra}" style="--hue:${def.hue};--hue2:${def.hue2}"><span></span></div>`; }

  function updateTopUI() {
    setText('#credits', nf.format(Math.floor(state.credits)));
    setText('#shards', nf.format(state.shards));
    setText('#researchShards', nf.format(state.shards));
    setText('#playerLevel', state.level);
    setText('#ballBadge', `${state.balls.length} / 500`);
    setText('#boardsBadge', `${boards.filter(isBoardUnlocked).length} / ${boards.length}`);
    setText('#openBoards', `${boards.filter(isBoardUnlocked).length} / ${boards.length}`);
    setText('#collectionTotal', state.balls.length);
    setWidth('#collectionMeter', state.balls.length / 500 * 100);
    setText('#topDrop', state.topDrop ? `+${nf.format(state.topDrop)}` : '—');
    setText('#xpText', `${Math.floor(state.xp)} / ${nextXpGoal()} XP`);
    setWidth('#levelMeter', state.xp / nextXpGoal() * 100);
    const locked = boards.find(b => !isBoardUnlocked(b));
    const nextUnlock = $('#nextUnlock');
    if (nextUnlock) nextUnlock.innerHTML = locked
      ? `${locked.name} <small>at level ${locked.level}</small>`
      : 'The whole Atrium is open <small>master every table</small>';
  }

  function updatePlayUI() {
    const b = board(), owned = getSelectedBall(), def = ballDefs[owned.id], perks = getPerks();
    setText('#boardName', b.name); setText('#boardSubtitle', b.subtitle);
    $('#boardBadge').style.setProperty('--accent', b.accent);
    $('#boardBadge').innerHTML = `<span class="badge-icon">✦</span><div><strong>${b.perk}</strong><small>${b.rows} rows · ${b.difficulty.toLowerCase()} table</small></div>`;
    setText('#masteryText', `${boardMastery()} / 100`); setWidth('#masteryMeter', boardMastery());
    setText('#boardPerkText', boardMastery() < 25 ? `Mastery ${25 - boardMastery()} away: unlock your first table polish.` : 'This table is settling beautifully into its groove.');
    setText('#polishLevel', `LV ${perks.polish}`); setText('#lanternLevel', `LV ${perks.lantern}`); setText('#railLevel', `LV ${perks.rail}`);
    setText('#loadedBallName', def.name); setText('#loadedRarity', rarityInfo[def.rarity].label.toUpperCase()); setText('#loadedLevel', `LV ${owned.level}`);
    setText('#loadedDescription', def.description);
    $('#loadedBallOrb').style.setProperty('--hue', def.hue); $('#loadedBallOrb').style.setProperty('--hue2', def.hue2);
    setText('#ballMult', `×${ballMultiplier(owned).toFixed(2)}`); setText('#ballLuck', `+${ballLuck(owned)}%`); setText('#ballPower', def.special);
    const cost = ballUpgradeCost(owned); setText('#upgradeBallCost', owned.level >= 15 ? 'Max level' : `${nf.format(cost)} credits`); $('#upgradeBallBtn').disabled = owned.level >= 15;
    const cp = state.contractProgress, target = 12;
    setText('#contractTitle', state.contractDone ? 'A tidy little contract' : 'Warm up the atrium');
    setText('#contractText', state.contractDone ? 'Claimed: come back tomorrow for another small delight.' : 'Complete 12 drops to earn 4 Prism Shards.');
    setText('#contractProgress', state.contractDone ? 'complete' : `${cp} / ${target}`); setWidth('#contractMeter', state.contractDone ? 100 : cp / target * 100);
    const busy = ballsInMotion.length > 0;
    const cooling = performance.now() < dropReadyAt;
    setText('#queueCount', busy ? 'table in motion' : cooling ? 'recalibrating gate' : 'precision gate ready');
    const dropButton = $('#dropBtn');
    if (dropButton) dropButton.disabled = busy || cooling;
    setText('#dropActionLabel', busy ? 'BALL IN MOTION' : cooling ? 'RECALIBRATING' : 'PRECISION RELEASE');
    setText('#dropActionState', busy ? 'Watch the path' : cooling ? 'Hold steady' : 'Time the gold');
    $('#canvasOverlay').classList.toggle('hidden', state.drops > 0 || busy);
    renderFeed(); updateTopUI();
  }

  function renderFeed() {
    const feed = $('#dropFeed'); if (!feed) return;
    if (!state.feed.length) { feed.innerHTML = '<span class="feed-label">TABLE FEED</span><span class="feed-empty">Your best drops will appear here.</span>'; return; }
    feed.innerHTML = `<span class="feed-label">TABLE FEED</span>${state.feed.map(x => `<span style="color:${x.bonus ? '#ffe086' : '#c7b594'}">${x.text}</span>`).join('<span style="color:#695d49"> · </span>')}`;
  }

  function ballMultiplier(owned) { return ballDefs[owned.id].baseMult * (1 + (owned.level - 1) * .055); }
  function ballLuck(owned) { return ballDefs[owned.id].luck + (owned.level - 1) + (state.research.fortune || 0) * 2; }
  function ballUpgradeCost(owned) { return Math.ceil((54 + owned.level * 31) * (1 + rarityOrder.indexOf(ballDefs[owned.id].rarity) * .38)); }

  function renderBoards() {
    const root = $('#boardGrid');
    root.innerHTML = boards.map(b => {
      const open = isBoardUnlocked(b), selected = b.id === state.selectedBoard;
      return `<button class="board-card ${open ? '' : 'locked'} ${selected ? 'selected' : ''}" data-board-id="${b.id}" style="--accent:${b.accent}">
        <div class="board-art"><span class="board-art-title">${open ? b.subtitle : `OPENS AT LEVEL ${b.level}`}</span><div class="board-pegs"></div>${open ? '' : '<div class="board-lock">⌾</div>'}</div>
        <div class="board-card-content"><div class="board-card-title"><h3>${b.name}</h3><span>${selected ? 'LOADED' : open ? 'OPEN' : 'SEALED'}</span></div><p>${b.description}</p><div class="board-card-meta"><span>${b.rows} ROWS</span><span>${b.perk.toUpperCase()}</span></div></div>
      </button>`;
    }).join('');
    $$('.board-card', root).forEach(card => card.addEventListener('click', () => {
      const b = boards.find(x => x.id === card.dataset.boardId);
      if (!isBoardUnlocked(b)) return notice('The door is still locked', `Reach Atrium level ${b.level} to open ${b.name}.`);
      state.selectedBoard = b.id; state.boardMastery[b.id] ??= 0; state.boardPerks[b.id] ??= {polish:0,lantern:0,rail:0};
      updatePlayUI(); drawScene(); renderBoards(); saveGame(true); switchView('play');
      notice('New table loaded', `${b.name} is ready for a good drop.`);
    }));
  }

  function ballMatchesFilter(def) {
    if (collectionFilter === 'all') return true;
    if (collectionFilter === 'epic') return ['epic','legendary','relic'].includes(def.rarity);
    return def.rarity === collectionFilter;
  }
  function renderCollection() {
    const query = collectionQuery.trim().toLowerCase();
    const defs = ballDefs.filter(def => ballMatchesFilter(def) && (!query || def.name.toLowerCase().includes(query) || def.familyName.toLowerCase().includes(query)));
    $('#ballGrid').innerHTML = defs.map(def => {
      const own = ballOwned(def.id), selected = own && state.selectedBall === def.id;
      return `<button class="ball-card ${own ? 'owned' : 'locked'} ${selected ? 'selected' : ''}" data-ball-id="${def.id}" style="--hue:${def.hue}">
        <div class="card-orb-area">${orbHTML(def)}<span class="rarity-pill">${rarityInfo[def.rarity].label}</span></div>
        <h3>${def.name}</h3><p>${def.familyName} series</p>${own ? `<span class="card-level">LV ${own.level}</span>` : '<span class="lock-symbol">⌾</span>'}
      </button>`;
    }).join('');
    $$('.ball-card.owned', $('#ballGrid')).forEach(card => card.addEventListener('click', () => {
      state.selectedBall = Number(card.dataset.ballId); updatePlayUI(); renderCollection(); saveGame(true); switchView('play');
      notice('Ball loaded', `${ballDefs[state.selectedBall].name} is waiting above the board.`);
    }));
  }

  function renderResearch() {
    $('#researchGrid').innerHTML = researchColumns.map(col => `<section class="research-column"><div class="research-column-head"><div class="research-icon">${col.icon}</div><div><h3>${col.title}</h3><p>${col.description}</p></div></div>${col.nodes.map(node => {
      const lvl = state.research[node.id] || 0, maxed = lvl >= node.max, cost = node.cost + lvl * 2;
      return `<article class="research-node"><div class="node-top"><strong>${node.name}</strong><b>LV ${lvl}/${node.max}</b></div><p>${node.desc}</p><button data-research="${node.id}" ${maxed || state.shards < cost ? 'disabled' : ''}>${maxed ? 'Fully researched' : `Study · ${cost} ◈`}</button><div class="meter"><span style="width:${lvl / node.max * 100}%"></span></div></article>`;
    }).join('')}</section>`).join('');
    $$('[data-research]', $('#researchGrid')).forEach(btn => btn.addEventListener('click', () => buyResearch(btn.dataset.research)));
  }
  function buyResearch(id) {
    let node; researchColumns.forEach(c => c.nodes.forEach(n => { if (n.id === id) node = n; }));
    const lvl = state.research[id] || 0, cost = node.cost + lvl * 2;
    if (lvl >= node.max || state.shards < cost) return;
    state.shards -= cost; state.research[id]++; renderResearch(); updatePlayUI(); saveGame(true); beep(630,.05);
    notice('Research complete', `${node.name} is now level ${state.research[id]}.`);
  }

  function renderWorkshop() {
    const root = $('#mergeSlots');
    root.innerHTML = [0,1,2].map(i => {
      const id = mergeSelection[i], def = id !== undefined ? ballDefs[id] : null;
      return `<div class="merge-slot">${def ? `${orbHTML(def)}<button data-remove-merge="${id}" aria-label="Remove ball">×</button>` : '<span>Choose a ball</span>'}</div>`;
    }).join('');
    $$('[data-remove-merge]', root).forEach(btn => btn.addEventListener('click', () => { mergeSelection = mergeSelection.filter(id => id !== Number(btn.dataset.removeMerge)); renderWorkshop(); }));
    const selectedDefs = mergeSelection.map(id => ballDefs[id]);
    const matching = selectedDefs.length === 3 && new Set(selectedDefs.map(x => x.rarity)).size === 1;
    const rare = selectedDefs[0]?.rarity || 'common'; const nextRare = rarityOrder[Math.min(rarityOrder.indexOf(rare) + 1, rarityOrder.length - 1)];
    setText('#mergeStatus', matching ? `Ready: 3 ${rarityInfo[rare].label}s` : `Choose 3 matching balls (${mergeSelection.length}/3)`);
    setText('#mergeResult', matching ? `${rarityInfo[nextRare].label} ball incoming` : 'Pick three matching balls');
    setText('#mergeResultText', matching ? `${rarityInfo[rare].label} + ${rarityInfo[rare].label} + ${rarityInfo[rare].label} = ${rarityInfo[nextRare].label}` : 'You can only merge owned balls of the same rarity.');
    $('#mergeBtn').disabled = !matching;
    const inv = $('#mergeInventory');
    inv.innerHTML = state.balls.map(own => { const d = ballDefs[own.id], selected = mergeSelection.includes(own.id); return `<button class="merge-mini ${selected ? 'selected' : ''}" data-merge-id="${d.id}">${orbHTML(d)}<strong>${d.name}</strong><span>${rarityInfo[d.rarity].label} · Lv ${own.level}</span></button>`; }).join('');
    $$('[data-merge-id]', inv).forEach(btn => btn.addEventListener('click', () => toggleMerge(Number(btn.dataset.mergeId))));
  }
  function toggleMerge(id) {
    const current = mergeSelection.indexOf(id);
    if (current >= 0) mergeSelection.splice(current,1);
    else if (mergeSelection.length < 3) mergeSelection.push(id);
    else return notice('The press is full', 'Remove one of the three balls before choosing another.');
    renderWorkshop();
  }
  function mergeBalls() {
    const defs = mergeSelection.map(id => ballDefs[id]);
    if (defs.length !== 3 || new Set(defs.map(d=>d.rarity)).size !== 1) return;
    const rIndex = rarityOrder.indexOf(defs[0].rarity);
    const targetRarity = rarityOrder[Math.min(rIndex + 1, rarityOrder.length - 1)];
    const candidates = ballDefs.filter(d => d.rarity === targetRarity && !ballOwned(d.id));
    if (!candidates.length) { state.shards += 3; notice('The vault glitters', 'That rarity is complete—your merge became 3 Prism Shards.'); }
    else {
      const newDef = candidates[(state.drops * 7 + state.balls.length * 3) % candidates.length];
      state.balls = state.balls.filter(x => !mergeSelection.includes(x.id));
      state.balls.push({ id:newDef.id, level:1, xp:0 }); state.selectedBall = newDef.id;
      notice('A new ball emerges!', `${newDef.name} joined your vault.`); beep(880,.14);
    }
    mergeSelection = []; renderWorkshop(); renderCollection(); updatePlayUI(); saveGame(true);
  }

  function switchView(view) {
    currentView = view;
    $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    $$('.view').forEach(section => section.classList.toggle('active-view', section.id === `${view}View`));
    if (view === 'boards') renderBoards();
    if (view === 'collection') renderCollection();
    if (view === 'research') renderResearch();
    if (view === 'workshop') renderWorkshop();
    if (view === 'play') { resizeCanvas(); drawScene(); updatePlayUI(); }
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function spendCredits(cost, action) { if (state.credits < cost) { notice('A few more drops', `You need ${nf.format(cost - state.credits)} more Arcade Credits.`); return false; } state.credits -= cost; action(); return true; }
  function upgradeBall() {
    const owned = getSelectedBall(); if (owned.level >= 15) return;
    const cost = ballUpgradeCost(owned);
    if (!spendCredits(cost, () => { owned.level++; owned.xp += 4; })) return;
    updatePlayUI(); renderCollection(); saveGame(true); beep(580,.06); notice('Ball improved', `${ballDefs[owned.id].name} is now level ${owned.level}.`);
  }
  function upgradePerk(key) {
    const perks = getPerks(), b = board(), lvl = perks[key];
    const requiredMastery = key === 'polish' ? 0 : key === 'lantern' ? 12 : 30;
    if (boardMastery() < requiredMastery) return notice('Keep playing this board', `${key === 'lantern' ? 'Amber Lantern unlocks at 12 mastery.' : 'Side Rails unlock at 30 mastery.'}`);
    if (lvl >= 5) return notice('Perk perfected', 'This little table feature cannot be improved further.');
    const cost = 95 + lvl * 80 + boards.indexOf(b) * 35;
    if (!spendCredits(cost, () => { state.boardPerks[b.id] ??= {polish:0,lantern:0,rail:0}; state.boardPerks[b.id][key]++; })) return;
    updatePlayUI(); saveGame(true); beep(520,.055); notice('Table tuned', `${key === 'polish' ? 'The pins got a fresh polish.' : key === 'lantern' ? 'An amber lantern has been lit.' : 'The side rails were carefully adjusted.'}`);
  }

  // --- Canvas: the animation is visual, while rewards are settled only at the end. ---
  const canvas = $('#plinkoCanvas'); const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pegs = [], bins = [], ballsInMotion = [], sparkles = [], lastFrame = performance.now();
  let dropReadyAt = 0, lastBlockedNotice = 0;
  const launchGate = { position: .5, precision: 0, locked: false };
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    buildBoardGeometry(); drawScene();
  }
  function buildBoardGeometry() {
    const b = board(); pegs = [];
    const rows = b.rows, spread = Math.min(45, 740 / rows), y0 = 104, gapY = Math.min(31, 430 / Math.max(1, rows - 1));
    for (let row=0; row<rows; row++) {
      const count = row + 1;
      for (let col=0; col<count; col++) {
        let x = W / 2 + (col - row / 2) * spread;
        let y = y0 + row * gapY;
        if (b.type === 'sidewinder') x += Math.sin(row * .55) * 13;
        if (b.type === 'honey' && row % 2) x += 10;
        if (b.type === 'clock') x += Math.sin(performance.now() / 1100 + row) * 4;
        pegs.push({x,y,r:7,row,col});
      }
    }
    const lowY = y0 + (rows-1) * gapY + 35;
    let count = rows + 2; if (count % 2 === 0) count += 1; // An exact central jackpot pocket.
    const span = Math.min(840, rows * spread + 96), start = W / 2 - span / 2, center = Math.floor(count / 2);
    const payoutForDistance = d => d === 0 ? 25 : d === 1 ? 4.2 : d === 2 ? 1.9 : d === 3 ? 1.05 : d === 4 ? .55 : .2;
    bins = Array.from({length:count}, (_, i) => {
      const distance = Math.abs(i - center), mult = payoutForDistance(distance);
      return { x:start + i*(span/count), w:span/count, y:lowY, mult, distance, jackpot:i===center };
    });
  }
  function boardBounds(y) {
    const bottom = pegs.length ? pegs[pegs.length - 1].y : 500;
    const progress = clamp((y - 83) / Math.max(1, bottom - 83), 0, 1);
    const finalHalf = bins.length ? (bins[bins.length-1].x + bins[bins.length-1].w / 2 - W / 2) + 34 : 390;
    const half = 30 + progress * finalHalf;
    return { left:W / 2 - half, right:W / 2 + half };
  }
  function updateLaunchGate(now) {
    launchGate.position = (Math.sin(now / 610) + 1) / 2;
    launchGate.precision = 1 - Math.abs(launchGate.position - .5) * 2;
    const needle = $('#aimNeedle'); if (needle) needle.style.left = `${launchGate.position * 100}%`;
    const status = $('#precisionStatus');
    if (status && !ballsInMotion.length) status.textContent = launchGate.precision >= .956 ? 'JACKPOT WINDOW — DROP NOW' : launchGate.precision >= .86 ? 'GOOD ALIGNMENT' : 'TIME THE GOLD WINDOW';
  }
  function drawScene() {
    if (!ctx || !canvas.width) return;
    const b = board(), accent = `hsl(${b.accent} 82% 61%)`;
    ctx.clearRect(0,0,W,H);
    // velvet backdrop and ornate rim
    const bg = ctx.createRadialGradient(500,170,40,500,300,660); bg.addColorStop(0,`hsla(${b.accent},70%,24%,.34)`); bg.addColorStop(.6,'rgba(21,17,12,.05)'); bg.addColorStop(1,'rgba(4,4,3,.18)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(246,207,128,.18)';ctx.lineWidth=2;ctx.strokeRect(20,18,W-40,H-38);
    ctx.strokeStyle='rgba(246,207,128,.05)';ctx.lineWidth=1;ctx.strokeRect(28,26,W-56,H-54);
    // warm central rays
    ctx.save();ctx.translate(500,55);ctx.strokeStyle=`hsla(${b.accent},80%,67%,.055)`;ctx.lineWidth=1; for(let a=-1.06;a<=1.06;a+=.12){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.sin(a)*700,570);ctx.stroke();}ctx.restore();
    // hopper
    ctx.fillStyle='rgba(32,24,15,.8)';ctx.strokeStyle=`hsla(${b.accent},70%,62%,.44)`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(462,37);ctx.lineTo(538,37);ctx.lineTo(518,73);ctx.lineTo(482,73);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(500,63,7,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();
    // pegs
    for (const p of pegs) {
      ctx.beginPath();ctx.arc(p.x+2,p.y+3,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.32)';ctx.fill();
      const grad=ctx.createRadialGradient(p.x-2,p.y-3,1,p.x,p.y,p.r+2);grad.addColorStop(0,'#fff0b3');grad.addColorStop(.28,accent);grad.addColorStop(1,`hsl(${b.accent} 55% 24%)`);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      if (p.row % 3 === 0) {ctx.beginPath();ctx.arc(p.x,p.y,p.r+5,0,Math.PI*2);ctx.strokeStyle=`hsla(${b.accent},90%,65%,.12)`;ctx.stroke();}
    }
    // Outer gutters are intentional: falling past the board earns nothing.
    if (bins.length) {
      const leftGutter = bins[0].x, rightGutter = bins[bins.length-1].x + bins[bins.length-1].w;
      ctx.fillStyle='rgba(72,22,18,.22)';ctx.fillRect(34,bins[0].y,leftGutter-36,57);ctx.fillRect(rightGutter,bins[0].y,W-rightGutter-34,57);
      ctx.fillStyle='rgba(231,139,105,.48)';ctx.font='9px ui-monospace, monospace';ctx.textAlign='center';ctx.fillText('OUT · 0',Math.max(75,leftGutter/2),bins[0].y+33);ctx.fillText('0 · OUT',Math.min(925,(rightGutter+W)/2),bins[0].y+33);
    }
    // Rewards climb toward a deliberately narrow centre jackpot.
    for(const bin of bins) {
      const hot = bin.jackpot, mid = bin.distance === 1;
      const shade = hot ? `hsla(${b.accent},94%,66%,.42)` : mid ? `hsla(${b.accent},82%,58%,.18)` : bin.mult <= .2 ? 'rgba(123,56,31,.17)' : 'rgba(255,255,255,.035)';
      ctx.fillStyle=shade;ctx.fillRect(bin.x+2,bin.y,bin.w-4,57);
      ctx.strokeStyle=hot ? '#ffe49a' : mid ? `hsla(${b.accent},85%,67%,.62)` : 'rgba(231,195,125,.18)';ctx.lineWidth=hot ? 2 : 1;ctx.strokeRect(bin.x+2,bin.y,bin.w-4,57);
      ctx.fillStyle=hot ? '#fff2bd' : mid ? '#f4c762' : '#c4af88';ctx.font=`${hot ? 8 : bin.w < 36 ? 9 : 11}px ui-monospace, monospace`;ctx.textAlign='center';
      ctx.fillText(hot ? 'JACKPOT' : `×${bin.mult}`,bin.x+bin.w/2,bin.y+(hot ? 22 : 32));
      if(hot){ctx.font='10px ui-monospace, monospace';ctx.fillText('×25',bin.x+bin.w/2,bin.y+40);}
    }
    // apparatus labels
    ctx.textAlign='left';ctx.fillStyle='rgba(226,193,125,.42)';ctx.font='10px ui-monospace, monospace';ctx.fillText(b.name.toUpperCase(),43,51);ctx.textAlign='right';ctx.fillText(`${b.rows} PEG ROWS · CENTRAL JACKPOT`,957,51);
    // balls and sparks
    drawBalls();
  }
  function drawBalls() {
    for (const s of sparkles) { ctx.globalAlpha=s.life;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.size*s.life,0,Math.PI*2);ctx.fill(); }ctx.globalAlpha=1;
    for (const ball of ballsInMotion) {
      const d=ballDefs[ball.ballId];
      ctx.save();ctx.translate(ball.x,ball.y);
      if (ball.trail.length>1) {ctx.beginPath();ctx.moveTo(0,0); for(const t of ball.trail.slice(-8).reverse()){ctx.lineTo(t.x-ball.x,t.y-ball.y);}ctx.strokeStyle=`hsla(${d.hue},90%,65%,.28)`;ctx.lineWidth=4;ctx.lineCap='round';ctx.stroke();}
      const grad=ctx.createRadialGradient(-4,-5,1,0,0,14);grad.addColorStop(0,'#fff9d8');grad.addColorStop(.14,`hsl(${d.hue2} 90% 72%)`);grad.addColorStop(.48,`hsl(${d.hue} 77% 48%)`);grad.addColorStop(1,'#1a0805');ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=`hsla(${d.hue2},95%,75%,.65)`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  function spawnBall() {
    const now = performance.now();
    if (ballsInMotion.length || now < dropReadyAt) {
      if (now - lastBlockedNotice > 1200) {
        lastBlockedNotice = now;
        notice(ballsInMotion.length ? 'Table in motion' : 'Gate recalibrating', ballsInMotion.length ? 'Read the bounce before taking another shot.' : 'The launcher needs one quiet moment.');
      }
      return;
    }
    const own = getSelectedBall();
    const aimOffset = (launchGate.position - .5) * 2;
    const precision = 1 - Math.abs(aimOffset);
    const b = { ballId:own.id, x:500 + aimOffset * 18, y:54, vx:aimOffset * 3.05, vy:0, r:12, age:0, trail:[], alive:true, lastHit:-1, hitCooldown:0, precision, aimOffset };
    ballsInMotion.push(b); $('#canvasOverlay').classList.add('hidden');
    const status = $('#precisionStatus'); if (status) status.textContent = precision >= .956 ? 'JACKPOT LOCKED' : precision >= .86 ? 'LINE SET — STAY CALM' : 'THE BOARD WILL PUNISH RUSHING';
    beep(precision >= .956 ? 760 : 410,.04); updatePlayUI();
  }
  function updatePhysics(dt) {
    const b = board();
    for (const ball of ballsInMotion) {
      ball.age += dt; ball.hitCooldown -= dt; ball.vy += .115 * dt; ball.vx *= Math.pow(.996, dt); ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      ball.trail.push({x:ball.x,y:ball.y}); if(ball.trail.length>12) ball.trail.shift();
      const limits = boardBounds(ball.y);
      if (ball.y > 105 && (ball.x < limits.left || ball.x > limits.right)) {
        const perks = getPerks();
        if (perks.rail && Math.random() < perks.rail * .09) {
          ball.x = clamp(ball.x, limits.left + ball.r, limits.right - ball.r); ball.vx *= -.55;
          addSpark(ball.x,ball.y,'#f4c45e',9);
        } else { settleBall(ball, true); continue; }
      }
      for(let i=0;i<pegs.length;i++) { const p=pegs[i], dx=ball.x-p.x,dy=ball.y-p.y,dist=Math.hypot(dx,dy),min=ball.r+p.r;
        if(dist<min && dist>.01 && (ball.lastHit!==i || ball.hitCooldown<=0)) { const nx=dx/dist,ny=dy/dist;ball.x=p.x+nx*(min+.5);ball.y=p.y+ny*(min+.5);const dot=ball.vx*nx+ball.vy*ny;ball.vx=(ball.vx-2*dot*nx)*.57+(Math.random()-.5)*.8;ball.vy=(ball.vy-2*dot*ny)*.57; if(ball.vy<.25)ball.vy=.3;ball.lastHit=i;ball.hitCooldown=5; addSpark(p.x,p.y,`hsl(${ballDefs[ball.ballId].hue} 88% 70%)`,2); }
      }
      if (b.type === 'sidewinder') ball.vx += Math.sin(ball.y*.028)*.015*dt;
      if (b.type === 'clock') ball.vx += Math.sin(performance.now()/430 + ball.y*.04)*.025*dt;
      if (ball.y > H-72) settleBall(ball);
    }
    const countBefore = ballsInMotion.length;
    ballsInMotion = ballsInMotion.filter(x => x.alive);
    if (countBefore !== ballsInMotion.length) updatePlayUI();
    for(const s of sparkles){s.life-=.04*dt;s.y-=.15*dt;} sparkles=sparkles.filter(s=>s.life>0);
  }
  function addSpark(x,y,color,count=3){for(let i=0;i<count;i++)sparkles.push({x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*8,size:2+Math.random()*2,color,life:.8});}
  function settleBall(ball, fellOff = false) {
    ball.alive=false; dropReadyAt = performance.now() + Math.max(300, 620 - (state.research.auto || 0) * 80);
    const b=board(), own=ballOwned(ball.ballId), d=ballDefs[ball.ballId];
    const bin = bins.reduce((best,cur) => Math.abs(cur.x+cur.w/2-ball.x)<Math.abs(best.x+best.w/2-ball.x)?cur:best,bins[0]);
    const perks=getPerks(), researchBonus=1+(state.research.physics||0)*.03, boardBonus=1+perks.polish*.02;
    const jackpotOdds = .18 + Math.min(.12, (ballLuck(own) + perks.lantern) / 190);
    const jackpot = !fellOff && bin.jackpot && ball.precision >= .956 && Math.random() < jackpotOdds;
    let multiplier = fellOff ? 0 : jackpot ? bin.mult : bin.jackpot ? .35 : bin.mult;
    let label = fellOff ? 'FELL OUT · ×0' : jackpot ? 'CENTRAL JACKPOT · ×25' : bin.jackpot ? 'JACKPOT GATE MISSED · ×0.35' : `×${multiplier} pocket`;
    let reward=Math.round((13+b.rows*1.4)*multiplier*ballMultiplier(own)*b.base*researchBonus*boardBonus);
    const lucky = reward > 0 && !jackpot && Math.random() < (ballLuck(own)+perks.lantern)/100;
    if(lucky) { reward=Math.round(reward*1.38); label='FORTUNE FLARE'; }
    state.credits += reward;state.drops++;state.topDrop=Math.max(state.topDrop,reward);state.boardMastery[b.id]=(state.boardMastery[b.id]||0)+1+(state.research.momentum||0);
    state.contractProgress=Math.min(12,state.contractProgress+1);
    if(state.contractProgress >=12 && !state.contractDone){state.contractDone=true;state.shards+=4;notice('Contract complete', 'The Atrium sent you 4 Prism Shards.');}
    const xpGain=(1+Math.floor(reward/16))*(1+(state.research.archive||0)*.02); addXp(xpGain);
    state.feed.unshift({text:`${d.name}: ${reward ? '+'+nf.format(reward) : '0'}`,bonus:lucky || jackpot});state.feed=state.feed.slice(0,4);
    addSpark(ball.x,H-75,jackpot?'#fff0a5':lucky?'#ffe26e':fellOff?'#d8684e':`hsl(${d.hue} 85% 65%)`,jackpot?28:lucky?15:7);showWin(reward,label);maybeDiscover();beep(jackpot?980:lucky?760:reward?570:170,jackpot?.16:.065);
    if(currentView==='collection')renderCollection(); if(currentView==='workshop')renderWorkshop();
    setTimeout(updatePlayUI, Math.max(330, 650 - (state.research.auto || 0) * 80));
    if(state.drops%5===0) saveGame(true);
  }
  function addXp(amount) { state.xp+=amount;let leveled=false;while(state.xp>=nextXpGoal()){state.xp-=nextXpGoal();state.level++;leveled=true;}if(leveled){notice('Atrium level up!', `Level ${state.level} unlocked a little more of the house.`);renderBoards();beep(920,.15);}}
  function maybeDiscover() {
    const interval=Math.max(4,Math.round(7 + state.balls.length*.23 - (state.research.discovery||0)*1.2));
    if(state.drops-state.lastDiscoveryAt < interval || state.balls.length>=500) return;
    let candidates=ballDefs.filter(d=>!ballOwned(d.id)); if(!candidates.length)return;
    const maxIndex=Math.min(499, Math.max(25,state.balls.length+35));candidates=candidates.filter(d=>d.id<=maxIndex);const d=candidates[(state.drops*13+state.balls.length*5)%candidates.length]||candidates[0];
    state.balls.push({id:d.id,level:1,xp:0});state.lastDiscoveryAt=state.drops;notice('Vault discovery!', `${d.name} rolled out of a hidden drawer.`);addSpark(500,95,`hsl(${d.hue} 90% 70%)`,20);renderCollection();
  }
  function showWin(reward,label) { const el=$('#winToast');el.innerHTML=`<strong>+${nf.format(reward)}</strong><span>${label}</span>`;el.classList.add('show');clearTimeout(showWin.timer);showWin.timer=setTimeout(()=>el.classList.remove('show'),900); }
  function loop(now) { const dt=Math.min(2.1,(now-lastFrame)/16.666||1);lastFrame=now; updateLaunchGate(now); updatePhysics(dt);drawScene();requestAnimationFrame(loop); }

  function beep(freq=520,duration=.04) { if(!state.sound) return;try {audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch(_){} }
  function notice(title,text) {const el=document.createElement('div');el.className='notice';el.innerHTML=`<strong>${title}</strong>${text}`;$('#toastStack').append(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(20px)';setTimeout(()=>el.remove(),250)},3400);}

  function toggleModal(show) { $('#modalBackdrop').classList.toggle('open',show);$('#tutorialModal').classList.toggle('open',show); }
  function resetDailyIfNeeded(){const day=new Date().toDateString();try{const stored=localStorage.getItem('plinko-day');if(stored!==day){state.contractProgress=0;state.contractDone=false;localStorage.setItem('plinko-day',day)}}catch(_){} }

  function bindEvents() {
    $$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
    $$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
    $('#dropBtn').addEventListener('click',()=>spawnBall());
    $('#upgradeBallBtn').addEventListener('click',upgradeBall);
    $('#polishPerk').addEventListener('click',()=>upgradePerk('polish'));$('#lanternPerk').addEventListener('click',()=>upgradePerk('lantern'));$('#railPerk').addEventListener('click',()=>upgradePerk('rail'));
    $('#mergeBtn').addEventListener('click',mergeBalls);
    $('#ballSearch').addEventListener('input',e=>{collectionQuery=e.target.value;renderCollection();});
    $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{collectionFilter=btn.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x===btn));renderCollection();}));
    $('#tutorialBtn').addEventListener('click',()=>toggleModal(true));$('#startTutorialBtn').addEventListener('click',()=>{state.tutorialSeen=true;toggleModal(false);saveGame(true);spawnBall();});$$('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>toggleModal(false)));$('#modalBackdrop').addEventListener('click',()=>toggleModal(false));
    $('#saveBtn').addEventListener('click',()=>saveGame());$('#soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('#soundBtn').textContent=state.sound?'♫':'♩';saveGame(true);});
    window.addEventListener('resize',resizeCanvas);window.addEventListener('beforeunload',()=>saveGame(true));
    window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();spawnBall();}});
  }

  function init() {
    resetDailyIfNeeded();bindEvents();updateTopUI();updatePlayUI();renderBoards();renderCollection();renderResearch();renderWorkshop();
    requestAnimationFrame(()=>{resizeCanvas();requestAnimationFrame(loop);});
    if(!state.tutorialSeen) setTimeout(()=>toggleModal(true),450);
    setInterval(()=>saveGame(true),25000);
  }
  init();
})();
