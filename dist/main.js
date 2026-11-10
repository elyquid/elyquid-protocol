import { register, isStated, handleFromUrl, caGate, caValue } from './register.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* ---------- icons ---------- */
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const GH_PATH = 'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z';
const svg = (path, vb) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
const COPY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------- social (always top-right, icon only, both at every breakpoint) ---------- */
function renderSocial() {
  const wrap = $('#social');
  const make = (rec, label, path, vb) => {
    const live = isStated(rec) && rec.url;
    const el = document.createElement(live ? 'a' : 'span');
    el.className = 'social' + (live ? '' : ' is-inert');
    el.innerHTML = svg(path, vb);
    if (live) {
      el.href = rec.url; el.target = '_blank'; el.rel = 'noopener noreferrer';
      el.setAttribute('aria-label', `${label} ${handleFromUrl(rec.url)}`.trim());
    } else {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('aria-label', `${label} (not available yet)`);
    }
    return el;
  };
  wrap.append(make(register.x, 'X', X_PATH, '0 0 24 24'), make(register.github, 'GitHub', GH_PATH, '0 0 16 16'));
}

/* ---------- clipboard ---------- */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.append(t); t.select();
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch { return false; }
}

/* ---------- contract slot ---------- */
function renderCA() {
  const slot = $('#ca-slot');
  const gate = caGate();
  if (gate === 'live') {
    const addr = caValue();
    slot.innerHTML = `<span class="ca__addr"></span><span class="ca__hint">${COPY_SVG}<span>Copy</span></span>`;
    $('.ca__addr', slot).textContent = addr;
    slot.setAttribute('aria-label', `Copy contract address ${addr}`);
    let t;
    slot.addEventListener('click', async () => {
      const ok = await copyText(addr);
      const hint = $('.ca__hint', slot);
      slot.classList.toggle('is-copied', ok);
      hint.innerHTML = (ok ? CHECK_SVG : COPY_SVG) + `<span>${ok ? 'Copied' : 'Press Ctrl+C'}</span>`;
      clearTimeout(t);
      t = setTimeout(() => { slot.classList.remove('is-copied'); hint.innerHTML = `${COPY_SVG}<span>Copy</span>`; }, 1800);
    });
  } else {
    slot.classList.add('is-inert');
    slot.setAttribute('aria-disabled', 'true');
    slot.tabIndex = -1;
    slot.innerHTML = `<span class="ca__addr">${gate === 'invalid' ? 'Address held back until it checks out' : 'Address pending. It appears here first.'}</span><span class="ca__hint"><span>Soon</span></span>`;
    slot.addEventListener('click', (e) => e.preventDefault());
  }
}

/* ---------- formatting ---------- */
const num = (v) => { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? n : null; };
function fmtUsd(n) {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}
function fmtPrice(n) {
  if (n == null) return '—';
  if (n >= 100) return '$' + n.toFixed(2);
  if (n >= 1) return '$' + n.toFixed(4);
  if (n === 0) return '$0';
  const digits = Math.min(10, Math.max(4, -Math.floor(Math.log10(n)) + 3));
  return '$' + n.toFixed(digits);
}
const fmtPct = (n) => (n == null ? '—' : (n >= 0 ? '▲ ' : '▼ ') + Math.abs(n).toFixed(2) + '%');
const fmtInt = (n) => (n == null ? '—' : String(Math.round(n)));

/* ---------- count-up with flash on change ---------- */
function setVal(el, to, fmt, { flash = true, tone = false } = {}) {
  if (to == null) {
    cancelAnimationFrame(el._raf);
    el.textContent = '—'; el._val = null;
    if (tone) el.classList.remove('up', 'dn');
    return;
  }
  const from = el._val == null ? 0 : el._val;
  const first = el._val == null;
  el._val = to;
  if (tone) { el.classList.toggle('up', to >= 0); el.classList.toggle('dn', to < 0); }
  if (!first && flash && from !== to) {
    el.classList.remove('flash-up', 'flash-dn'); void el.offsetWidth;
    el.classList.add(to > from ? 'flash-up' : 'flash-dn');
  }
  cancelAnimationFrame(el._raf);
  if (reduced() || document.hidden || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = first ? 900 : 600;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step); else el.textContent = fmt(to);
  };
  el._raf = requestAnimationFrame(step);
  clearTimeout(el._fin);
  el._fin = setTimeout(() => { cancelAnimationFrame(el._raf); el.textContent = fmt(el._val); }, dur + 120);
}

/* ---------- state ---------- */
const state = {
  market: { rows: [], good: false, failing: false },
  own: { mode: caGate() === 'live' ? 'loading' : 'placeholder', data: null },
  sort: 'vol',
};

/* ---------- logos ---------- */
function letterTile(symbol) {
  return (symbol || '?').trim().charAt(0).toUpperCase() || '?';
}
function setLogo(tileEl, url, symbol, brand = false) {
  tileEl.classList.toggle('is-brand', brand);
  tileEl.textContent = '';
  const bad = !url || /missing/i.test(url);
  if (bad) { tileEl.textContent = letterTile(symbol); return; }
  const img = new Image();
  img.alt = ''; img.decoding = 'async'; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
  img.onerror = () => { tileEl.classList.remove('is-brand'); tileEl.textContent = letterTile(symbol); };
  img.src = url;
  tileEl.append(img);
}

/* ---------- board ---------- */
const boardRows = $('#board-rows');
const rowEls = new Map();

function createRow(key) {
  const el = document.createElement('div');
  el.className = 'brow'; el.setAttribute('role', 'listitem'); el.dataset.key = key;
  el.innerHTML = `
    <span class="rank"></span>
    <div class="tok"><span class="tok__logo"></span><div class="tok__txt"><b></b><span></span></div></div>
    <span class="v v-price" data-f="price"></span>
    <span class="v v-chg" data-f="chg"></span>
    <span class="v v-vol" data-f="vol"></span>
    <span class="v v-liq" data-f="liq"></span>
    <span class="cp-wrap"><button class="cp" type="button" aria-label="Copy token address">${COPY_SVG}</button></span>
    <span class="dots" hidden aria-label="No data yet">· · · · ·</span>`;
  const cp = $('.cp', el);
  cp.addEventListener('click', async () => {
    if (!el._addr) return;
    const ok = await copyText(el._addr);
    cp.innerHTML = ok ? CHECK_SVG : COPY_SVG; cp.classList.toggle('is-ok', ok);
    clearTimeout(cp._t); cp._t = setTimeout(() => { cp.innerHTML = COPY_SVG; cp.classList.remove('is-ok'); }, 1400);
  });
  rowEls.set(key, el);
  return el;
}

function skeletonCells(el) {
  $('.tok__logo', el).className = 'tok__logo skel skel--c';
  $('.tok__logo', el).textContent = '';
  $('.tok__txt', el).innerHTML = '<b class="skel" style="width:90px"></b><span class="skel" style="width:56px;margin-top:6px"></span>';
  $$('.v', el).forEach((v) => { v.innerHTML = '<i class="skel skel--r"></i>'; v._val = null; });
  $('.cp-wrap', el).style.visibility = 'hidden';
  el._addr = '';
}
function ensureReal(el) {
  if (!$('.tok__txt b', el) || $('.tok__txt b', el).classList.contains('skel')) {
    $('.tok__logo', el).className = 'tok__logo';
    $('.tok__txt', el).innerHTML = '<b></b><span></span>';
    $$('.v', el).forEach((v) => { v.textContent = ''; });
  }
  $('.cp-wrap', el).style.visibility = '';
}

function fillRow(el, rank, d) {
  ensureReal(el);
  $('.rank', el).textContent = rank;
  $('.tok__txt b', el).textContent = d.symbol || '—';
  $('.tok__txt span', el).textContent = d.name || '';
  if (el._logoKey !== (d.logo || '') + d.symbol) { setLogo($('.tok__logo', el), d.logo, d.symbol, d.brand); el._logoKey = (d.logo || '') + d.symbol; }
  setVal($('.v-price', el), d.price, fmtPrice);
  setVal($('.v-chg', el), d.chg, fmtPct, { tone: true });
  setVal($('.v-vol', el), d.vol, fmtUsd);
  setVal($('.v-liq', el), d.liq, fmtUsd);
  el._addr = d.addr || '';
  const cp = $('.cp', el); cp.disabled = !el._addr; cp.style.opacity = el._addr ? '' : '0.3';
}
function dashRow(el, rank, label) {
  ensureReal(el);
  $('.rank', el).textContent = rank;
  $('.tok__txt b', el).textContent = label;
  $('.tok__txt span', el).textContent = 'No data';
  setLogo($('.tok__logo', el), null, label.charAt(0));
  $$('.v', el).forEach((v) => { v.textContent = '—'; v._val = null; v.classList.remove('up', 'dn'); });
  el._addr = ''; $('.cp', el).disabled = true; $('.cp', el).style.opacity = '0.3';
}

function sortRows(rows) {
  const k = state.sort;
  const by = { vol: (r) => r.vol ?? -1, liq: (r) => r.liq ?? -1, chg: (r) => (r.chg == null ? -1 : Math.abs(r.chg)) };
  return [...rows].sort((a, b) => by[k](b) - by[k](a));
}

function renderOwn(el) {
  const brand = '/brand/logo-96.png'.replace(/^\//, './');
  el.classList.add('brow--own');
  const dots = $('.dots', el);
  const place = state.own.mode === 'placeholder';
  el.classList.toggle('is-placeholder', place);
  dots.hidden = !place;
  $$('.v, .cp-wrap', el).forEach((n) => { n.style.display = place ? 'none' : ''; });
  if (place) {
    ensureReal(el);
    $('.rank', el).textContent = '1';
    $('.tok__txt b', el).textContent = register.site.name;
    $('.tok__txt span', el).textContent = 'Awaiting launch';
    if (el._logoKey !== 'brand') { setLogo($('.tok__logo', el), brand, 'E', true); el._logoKey = 'brand'; }
    $('.cp', el).disabled = true; el._addr = '';
    return;
  }
  if (state.own.mode === 'loading') { skeletonCells(el); $('.rank', el).textContent = '1'; el._logoKey = null; return; }
  if (state.own.mode === 'data' && state.own.data) {
    const d = state.own.data;
    fillRow(el, '1', { ...d, logo: brand, brand: true, addr: caValue() });
    el._logoKey = el._logoKey || 'brand';
    return;
  }
  dashRow(el, '1', register.site.name);
  $('.tok__txt span', el).textContent = state.own.mode === 'nopair' ? 'No trading pair yet' : 'Feed unreachable';
}

function renderBoard() {
  const wanted = [];
  // row 1 (own token), always pinned first
  let own = rowEls.get('own') || createRow('own');
  renderOwn(own);
  wanted.push(['own', own]);

  const m = state.market;
  const ca = caGate() === 'live' ? caValue().toLowerCase() : null;
  if (m.rows.length) {
    const list = sortRows(m.rows.filter((r) => !ca || (r.addr || '').toLowerCase() !== ca)).slice(0, 9);
    list.forEach((r, i) => {
      const key = 'm:' + r.id;
      let el = rowEls.get(key);
      const fresh = !el;
      if (fresh) { el = createRow(key); el.style.setProperty('--i', i); el.classList.add('fade-in'); }
      fillRow(el, i + 2, r);
      wanted.push([key, el]);
    });
  } else if (m.failing) {
    for (let i = 0; i < 9; i++) { const key = 'e:' + i; const el = rowEls.get(key) || createRow(key); dashRow(el, i + 2, 'Unavailable'); wanted.push([key, el]); }
  } else {
    for (let i = 0; i < 9; i++) {
      const key = 's:' + i; let el = rowEls.get(key);
      if (!el) { el = createRow(key); skeletonCells(el); $('.rank', el).textContent = i + 2; }
      wanted.push([key, el]);
    }
  }
  const keep = new Set(wanted.map((w) => w[0]));
  for (const [k, el] of rowEls) if (!keep.has(k)) { el.remove(); rowEls.delete(k); }
  wanted.forEach(([, el]) => boardRows.appendChild(el));
}

/* ---------- ticker ---------- */
const tickerEl = $('#ticker');
let tickerSig = '';
function renderTicker() {
  const rows = [...state.market.rows].sort((a, b) => (b.vol ?? -1) - (a.vol ?? -1)).slice(0, 10);
  if (!rows.length) {
    if (tickerEl.dataset.mode === 'skel') return;
    tickerEl.dataset.mode = 'skel'; tickerSig = '';
    const one = Array.from({ length: 10 }, () => '<span class="tk tk--skel"><span class="skel"></span><span class="skel"></span></span>').join('');
    tickerEl.innerHTML = one + one;
    return;
  }
  tickerEl.dataset.mode = 'live';
  const sig = rows.map((r) => r.id).join('|');
  const html = rows.map((r) => `<span class="tk"><b>${esc(r.symbol)}</b><span class="px" data-px>${fmtPrice(r.price)}</span><span class="${(r.chg ?? 0) >= 0 ? 'up' : 'dn'}" data-ch>${fmtPct(r.chg)}</span></span>`).join('');
  if (sig === tickerSig) {
    $$('.tk', tickerEl).forEach((tk, i) => {
      const r = rows[i % rows.length];
      $('[data-px]', tk).textContent = fmtPrice(r.price);
      const ch = $('[data-ch]', tk); ch.textContent = fmtPct(r.chg); ch.className = (r.chg ?? 0) >= 0 ? 'up' : 'dn';
    });
    return;
  }
  tickerSig = sig;
  tickerEl.innerHTML = html + html;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- stats ---------- */
function renderStats() {
  const rows = state.market.rows.slice(0, 10);
  const has = rows.length > 0;
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  setVal($('[data-stat="count"]'), has ? rows.length : null, fmtInt);
  setVal($('[data-stat="vol"]'), has ? sum('vol') : null, fmtUsd);
  setVal($('[data-stat="liq"]'), has ? sum('liq') : null, fmtUsd);
}
function renderChainTile() {
  const c = register.chain;
  if (!isStated(c)) return;
  setVal($('#stat-chain'), c.chainId, fmtInt, { flash: false });
  $('#stat-gas').textContent = `Gas in ${c.currency}`;
  $('#f-chain').textContent = `Chain ${c.chainId} · ${c.currency} gas`;
  const ex = $('#f-explorer'); ex.href = c.explorer; ex.target = '_blank'; ex.rel = 'noopener noreferrer';
}

/* ---------- status pill / message ---------- */
function setPill(kind) {
  const pill = $('.pill');
  pill.classList.toggle('is-live', kind === 'live');
  pill.classList.toggle('is-err', kind === 'err');
  $('#pill-text').textContent = kind === 'live' ? 'Market feed live' : kind === 'err' ? 'Feed unreachable, retrying' : 'Connecting to the feed';
}
function setStatus(msg, err = false) {
  const s = $('#board-status'); s.textContent = msg; s.classList.toggle('is-err', err);
}

/* ---------- data ---------- */
async function getJSON(url) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(to); }
}

function makePoller(task, onFail, onOk) {
  let timer = null, fails = 0, busy = false;
  const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(run, ms); };
  async function run() {
    if (document.hidden || busy) return;
    busy = true;
    try { await task(); fails = 0; onOk?.(); schedule(60000); }
    catch (e) { fails++; onFail(e, fails); schedule(Math.min(60000, 2000 * 2 ** (fails - 1))); }
    finally { busy = false; }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else run(); });
  run();
}

async function pullMarket() {
  const json = await getJSON(register.market.trending + '?include=base_token&page=1');
  const toks = new Map((json.included || []).filter((i) => i.type === 'token').map((i) => [i.id, i.attributes || {}]));
  const rows = (json.data || []).map((p) => {
    const a = p.attributes || {};
    const tid = p.relationships?.base_token?.data?.id || '';
    const t = toks.get(tid) || {};
    const nm = String(a.name || '').split(' / ')[0];
    return {
      id: p.id, pool: a.address,
      addr: t.address || tid.split('_')[1] || a.address || '',
      symbol: t.symbol || nm, name: t.name || a.name || '',
      logo: t.image_url || '',
      price: num(a.base_token_price_usd), chg: num(a.price_change_percentage?.h24),
      vol: num(a.volume_usd?.h24), liq: num(a.reserve_in_usd),
    };
  }).filter((r) => r.symbol);
  if (!rows.length) throw new Error('empty');
  state.market.rows = rows.sort((a, b) => (b.vol ?? -1) - (a.vol ?? -1)).slice(0, 10);
  state.market.good = true; state.market.failing = false;
  setPill('live'); setStatus('');
  renderBoard(); renderTicker(); renderStats();
}
function marketFail() {
  state.market.failing = true;
  setPill('err');
  if (state.market.good) { setStatus('Showing the last good snapshot while the feed recovers.', true); }
  else { setStatus('The market feed could not be reached. Retrying with a growing pause.', true); renderBoard(); renderStats(); }
}

async function pullOwn() {
  const ca = caValue();
  const json = await getJSON(register.market.tokenLookup + ca);
  const pairs = (json.pairs || []).filter(Boolean).sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
  const p = pairs[0];
  if (!p) { state.own = { mode: 'nopair', data: null }; renderBoard(); return; }
  const base = (p.baseToken?.address || '').toLowerCase() === ca.toLowerCase() ? p.baseToken : (p.quoteToken || p.baseToken || {});
  state.own = {
    mode: 'data',
    data: { symbol: base.symbol || register.site.name, name: base.name || register.site.name, price: num(p.priceUsd), chg: num(p.priceChange?.h24), vol: num(p.volume?.h24), liq: num(p.liquidity?.usd) },
  };
  renderBoard();
}
function ownFail() { if (state.own.mode !== 'data') { state.own = { mode: 'error', data: null }; renderBoard(); } }

/* ---------- tabs ---------- */
function wireBoardTabs() {
  $$('#board-tabs .tab').forEach((b) => b.addEventListener('click', () => {
    state.sort = b.dataset.sort;
    $$('#board-tabs .tab').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
    renderBoard();
    $$('.brow', boardRows).forEach((r, i) => { r.style.setProperty('--i', i); r.classList.remove('fade-in'); void r.offsetWidth; r.classList.add('fade-in'); });
  }));
}
const PHASES = [
  { h: 'Foundation', p: 'The brand, the site and the live board come first. The contract address is announced here and on X before anywhere else.', l: ['Public site and live market board', 'Verified contract address slot', 'Open channel on X'] },
  { h: 'Community', p: 'Circles of holders shape what comes next. Feedback loops stay open and visible to everyone.', l: ['Holder circles and ambassador roles', 'Quests tied to on-chain activity', 'Transparent progress notes'] },
  { h: 'Reach', p: 'As the Elysium network matures, ELYQUID plugs into the venues and tools that traders already use.', l: ['Venue and tooling integrations', 'Richer analytics on the board', 'Partnerships throughout the network'] },
];
function wireRoadmap() {
  const panel = $('#phase');
  const show = (i) => {
    const ph = PHASES[i];
    panel.innerHTML = `<h3>${ph.h}</h3><p>${ph.p}</p><ul>${ph.l.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    panel.classList.remove('fade-in'); void panel.offsetWidth; panel.classList.add('fade-in');
  };
  $$('#road-tabs .tab').forEach((b) => b.addEventListener('click', () => {
    $$('#road-tabs .tab').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
    show(+b.dataset.phase);
  }));
  show(0);
}

/* ---------- footer + close ---------- */
function renderLinks() {
  const fs = $('#f-social');
  if (isStated(register.x) && register.x.url) {
    const a = document.createElement('a');
    a.href = register.x.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = handleFromUrl(register.x.url);
    fs.append(a);
    const c = $('#close-x'); c.href = register.x.url; c.target = '_blank'; c.rel = 'noopener noreferrer'; c.textContent = 'Follow ' + handleFromUrl(register.x.url);
  }
  const gh = document.createElement('div');
  gh.className = 'muted'; gh.style.padding = '6px 0'; gh.textContent = isStated(register.github) ? '' : 'Code repository: soon';
  if (!isStated(register.github)) fs.parentElement.append(gh);
}

/* ---------- motion: progress, nav, reveal, parallax, spotlight ---------- */
function wireMotion() {
  const nav = $('#nav'), bar = $('#progress'), hero = $('#hero');
  const layers = $$('[data-depth]');
  let px = 0, py = 0, ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    nav.classList.toggle('is-solid', y > 8);
    if (!reduced() && y < hero.offsetTop + hero.offsetHeight + 200) {
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth);
        l.style.transform = `translate3d(${(px * d * 120).toFixed(1)}px, ${(y * d * 1.6 + py * d * 80).toFixed(1)}px, 0)`;
      });
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; req(); });
  frame();

  const items = $$('.reveal');
  if (reduced() || !('IntersectionObserver' in window)) items.forEach((n) => n.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((n) => io.observe(n));
  }

  let raf = 0, last = null;
  document.addEventListener('pointermove', (e) => {
    const t = e.target.closest?.('.spot, .brow');
    if (!t) return;
    last = { t, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0; const r = last.t.getBoundingClientRect();
      last.t.style.setProperty('--mx', (last.x - r.left) + 'px'); last.t.style.setProperty('--my', (last.y - r.top) + 'px');
    });
  }, { passive: true });
}

/* ---------- boot ---------- */
renderSocial();
renderCA();
renderChainTile();
renderLinks();
wireBoardTabs();
wireRoadmap();
wireMotion();
renderBoard();
renderTicker();
setPill('wait');

// Market follows the market-source record only; the contract address has no effect on it.
if (isStated(register.market)) makePoller(pullMarket, marketFail);
// Own-token row follows the contract-address gate only.
if (caGate() === 'live') makePoller(pullOwn, ownFail);
