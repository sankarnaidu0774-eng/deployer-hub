/* ============================================================
   NEXUS CORE — demo command center
   All data is generated locally. No network calls are made.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = n => Number(n).toLocaleString('en-US');
  const pad2 = n => String(n).padStart(2, '0');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stamp = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };
  const clone = o => JSON.parse(JSON.stringify(o));

  const CLOUDS = {
    GCP:   { name: 'Google Cloud',    short: 'GCP',   dot: 'gcp',   color: '#38d9ff' },
    Azure: { name: 'Microsoft Azure', short: 'Azure', dot: 'azure', color: '#60a5fa' },
    AWS:   { name: 'Amazon Web Services', short: 'AWS', dot: 'aws', color: '#fbbf24' }
  };
  const REGIONS = {
    GCP:   ['asia-south1 · Mumbai', 'asia-south2 · Delhi', 'us-central1 · Iowa', 'australia-southeast1 · Sydney', 'europe-west1 · Belgium'],
    Azure: ['centralindia · Pune', 'southeastasia · Singapore', 'westeurope · Netherlands', 'eastus · Virginia'],
    AWS:   ['ap-south-1 · Mumbai', 'us-east-1 · N. Virginia', 'eu-central-1 · Frankfurt', 'ap-southeast-1 · Singapore']
  };
  const STATUS = {
    healthy:  { label: 'Healthy',   cls: 'ok' },
    shielded: { label: 'Shielded',  cls: 'cy' },
    degraded: { label: 'Degraded',  cls: 'warn' },
    building: { label: 'Building',  cls: 'blue' },
    migrating:{ label: 'Migrating', cls: 'vio' }
  };

  /* ---------- seed data ---------- */
  const SEED_APPS = [
    { id: 'app-01', name: 'NovaCommerce', ver: 'v2.4.1', cloud: 'GCP',   region: 'asia-south1',  status: 'healthy',   users: 12480, ping: 38,  uptime: '99.98%', hue: 188 },
    { id: 'app-02', name: 'PulseChat',    ver: 'v5.0.3', cloud: 'Azure', region: 'southeastasia', status: 'healthy',   users: 21430, ping: 51,  uptime: '99.95%', hue: 212 },
    { id: 'app-03', name: 'LedgerPay',    ver: 'v1.9.7', cloud: 'AWS',   region: 'ap-south-1',   status: 'shielded',  users: 9840,  ping: 44,  uptime: '99.99%', hue: 158 },
    { id: 'app-04', name: 'OrbitNotes',   ver: 'v3.2.0', cloud: 'GCP',   region: 'us-central1',  status: 'healthy',   users: 15220, ping: 72,  uptime: '99.92%', hue: 262 },
    { id: 'app-05', name: 'AeroFleet',    ver: 'v2.0.9', cloud: 'AWS',   region: 'eu-central-1', status: 'degraded',  users: 6120,  ping: 168, uptime: '99.41%', hue: 34 },
    { id: 'app-06', name: 'ZenFit',       ver: 'v4.1.2', cloud: 'AWS',   region: 'us-east-1',    status: 'healthy',   users: 18940, ping: 61,  uptime: '99.97%', hue: 286 },
    { id: 'app-07', name: 'KisanConnect', ver: 'v1.2.4', cloud: 'GCP',   region: 'asia-south1',  status: 'healthy',   users: 22410, ping: 29,  uptime: '99.99%', hue: 130 },
    { id: 'app-08', name: 'StreamBox',    ver: 'v0.9.1', cloud: 'Azure', region: 'westeurope',   status: 'healthy',   users: 7360,  ping: 58,  uptime: '99.90%', hue: 320 },
    { id: 'app-09', name: 'ShieldScan',   ver: 'v1.0.0', cloud: 'GCP',   region: 'australia-southeast1', status: 'building', users: 5810, ping: 66, uptime: '99.88%', hue: 200 },
    { id: 'app-10', name: 'Tutrly',       ver: 'v2.6.0', cloud: 'Azure', region: 'centralindia', status: 'healthy',   users: 9260,  ping: 47,  uptime: '99.96%', hue: 172 }
  ];

  const SEED_FINDINGS = [
    { id: 'f1', sev: 'high',   title: 'Null dereference in OTP step', detail: 'Crash cluster: 412 events on Android 12. Suggested guard on otpToken before render.', code: 'LoginScreen.jsx:84 · TypeError', app: 'LedgerPay', age: '2 min ago' },
    { id: 'f2', sev: 'high',   title: 'Listener leak in media player', detail: 'timeupdate listener never removed on unmount. Memory grows ~14 MB / session.', code: 'StreamPlayer.tsx:212 · leak', app: 'StreamBox', age: '14 min ago' },
    { id: 'f3', sev: 'medium', title: 'Layout thrash on home feed', detail: '41 forced reflows per scroll on low-end Android devices.', code: 'HomeFeed.tsx:49 · reflow', app: 'PulseChat', age: '38 min ago' },
    { id: 'f4', sev: 'medium', title: 'Missing input validation', detail: 'POST /api/v1/review accepts an unbounded body. Add schema + size cap.', code: 'routes/review.js:31 · validation', app: 'NovaCommerce', age: '1 h ago' },
    { id: 'f5', sev: 'low',    title: 'Low contrast text token', detail: 'Muted label contrast is 2.9:1 on the paywall sheet. WCAG AA needs 4.5:1.', code: 'tokens/color.css:18 · a11y', app: 'ZenFit', age: '3 h ago' }
  ];

  const SCAN_POOL = [
    { id: 'f6', sev: 'high',   title: 'Unbounded retry loop in sync', detail: 'Offline sync retries without backoff when the gateway returns 503.', code: 'sync/worker.ts:77 · retry', app: 'OrbitNotes', age: 'just now' },
    { id: 'f7', sev: 'medium', title: 'Cache key collision risk', detail: 'Keys are truncated to 12 chars; two lead IDs collide in the same shard.', code: 'cache/keys.ts:22 · collision', app: 'KisanConnect', age: 'just now' },
    { id: 'f8', sev: 'low',    title: 'Deprecated analytics call', detail: 'Legacy event API will be removed by the vendor next quarter.', code: 'analytics/init.ts:9 · deprecation', app: 'Tutrly', age: 'just now' }
  ];

  const SEED_THREATS = [
    { time: '12:04:31', event: 'Credential stuffing burst', src: '45.12.98.201', target: 'LedgerPay', action: 'WAF challenge', state: 'blocked' },
    { time: '11:47:02', event: 'SQL injection probe',       src: '91.203.7.44',  target: 'ShieldScan', action: 'Query sanitised', state: 'blocked' },
    { time: '10:22:18', event: 'Path traversal attempt',    src: '172.66.134.9', target: 'OrbitNotes', action: 'Blocked at edge', state: 'blocked' },
    { time: '09:05:44', event: 'API rate-limit abuse',      src: '203.0.113.77', target: 'PulseChat', action: 'Throttled', state: 'mitigated' }
  ];

  const REPORT = {
    downloads: 18420, reviews: 1286, rating: '4.4', crashFree: '99.2%', negative: 147,
    themes: [
      { name: 'OTP not delivered', count: 34, note: 'Login flow · LedgerPay' },
      { name: 'Crashes on low-end phones', count: 27, note: 'PulseChat · StreamBox' },
      { name: 'Updates reset my settings', count: 19, note: 'ZenFit · Tutrly' },
      { name: 'Ads feel intrusive', count: 16, note: 'NovaCommerce' },
      { name: 'Slow image loading', count: 14, note: 'Aurora feed' },
      { name: 'Everything else', count: 37, note: 'Mixed / one-off' }
    ],
    daily: [
      { day: 'Mon', v: 14200 }, { day: 'Tue', v: 15100 }, { day: 'Wed', v: 16400 },
      { day: 'Thu', v: 14800 }, { day: 'Fri', v: 17200 }, { day: 'Sat', v: 18400 }, { day: 'Sun', v: 17500 }
    ]
  };

  const state = {
    view: 'command',
    filter: 'all',
    cloud: 'GCP',
    seq: 11,
    deploying: false,
    attacking: false,
    logPaused: false,
    fixed: 1,
    threatsBlocked: 47,
    migrations: 1,
    openIncidents: 0,
    score: 94,
    flags: { autofix: true, migrate: true, waf: true, report: true, canary: false }
  };

  let APPS = clone(SEED_APPS);
  let FINDINGS = clone(SEED_FINDINGS);
  let SCAN_LEFT = clone(SCAN_POOL);
  let THREATS = clone(SEED_THREATS);

  /* ---------- DOM refs ---------- */
  const terminal = $('#terminal');
  const deployLog = $('#deployLog');
  const toasts = $('#toasts');
  const modalBackdrop = $('#modalBackdrop');
  const modalTitle = $('#modalTitle');
  const modalBody = $('#modalBody');
  const modalFoot = $('#modalFoot');
  let lastFocused = null;

  /* ============================================================
     NAVIGATION
     ============================================================ */
  const VIEW_META = {
    command:   { crumb: 'command center',   title: 'Global command center' },
    deploy:    { crumb: 'deployment hub',   title: 'Deployment hub' },
    debug:     { crumb: 'live debugger',    title: 'Live debugger' },
    shield:    { crumb: 'aegis shield',     title: 'Aegis shield' },
    analytics: { crumb: 'analytics',        title: 'Analytics & 24h reports' },
    settings:  { crumb: 'cloud registry',   title: 'Cloud registry' },
    gateway:   { crumb: 'AI gateway',      title: 'AI gateway & evaluations' }
  };

  function setView(name) {
    if (!VIEW_META[name] || state.view === name) {
      if (state.view === name) closeNotif();
      return;
    }
    state.view = name;
    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === `view-${name}`));
    $$('.nav-item').forEach(b => {
      const active = b.dataset.view === name;
      b.classList.toggle('is-active', active);
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const meta = VIEW_META[name];
    $('#pageTitle').textContent = meta.title;
    $('#crumbView').textContent = meta.crumb;
    document.title = `Nexus Core · ${meta.title}`;
    closeNotif();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'debug') { sizeCanvas(); drawChart(); }
  }

  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  $$('[data-goto]').forEach(btn => btn.addEventListener('click', () => { setView(btn.dataset.goto); }));

  document.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !modalBackdrop.hidden) {
      const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modalBackdrop)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.target.matches('input, select, textarea')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const map = { '1': 'command', '2': 'deploy', '3': 'debug', '4': 'shield', '5': 'analytics', '6': 'settings', '7': 'gateway' };
    if (map[e.key]) { e.preventDefault(); setView(map[e.key]); }
    if (e.key === 'Escape') { closeNotif(); closeModal(); closeSidebar(); }
  });

  function closeSidebar() { $('.sidebar').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
  $('#menuBtn').addEventListener('click', () => {
    const open = $('.sidebar').classList.toggle('open');
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  });

  /* ============================================================
     TOASTS + MODAL
     ============================================================ */
  const ICONS = { ok: '✓', err: '!', warn: '▲', info: 'i' };
  function toast(kind, title, msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-ic ${kind}">${ICONS[kind] || 'i'}</span><div><strong>${esc(title)}</strong>${msg ? `<p>${esc(msg)}</p>` : ''}</div>`;
    toasts.appendChild(el);
    while (toasts.children.length > 4) toasts.firstElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 240); }, 4400);
  }

  function openModal(title, bodyHTML, footHTML) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHTML;
    modalFoot.innerHTML = footHTML || '<button class="btn" data-close-modal>Close</button>';
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    $('#modalClose').focus();
  }
  function closeModal() {
    if (modalBackdrop.hidden) return;
    modalBackdrop.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  $('#modalClose').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
  modalBody.addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) closeModal(); });
  modalFoot.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) { if (e.target.closest('[data-close-modal]')) closeModal(); return; }
    const act = btn.dataset.action;
    if (act === 'download-report') { downloadReport(); }
    if (act === 'goto-deploy') { closeModal(); setView('deploy'); }
    if (act === 'app-redeploy') { closeModal(); toast('ok', 'Redeploy queued', 'Simulated — nothing was actually built.'); }
    if (act === 'app-logs') { closeModal(); setView('debug'); }
    if (act === 'app-attack') { closeModal(); setView('shield'); runIntrusion(); }
  });

  function infoModal() {
    openModal('How this demo works', `
      <p><strong>Nexus Core is a front-end demonstration.</strong> It is built to show what a multi-cloud AIOps console could look and feel like — not to operate real infrastructure.</p>
      <h4>What is real</h4>
      <ul>
        <li>The interface, layout, animations and keyboard navigation.</li>
        <li>The 24-hour report generator — it composes a CSV from the demo dataset in your browser.</li>
        <li>All interaction: deployment choreography, scanning, filtering, the load sliders.</li>
      </ul>
      <h4>What is simulated</h4>
      <ul>
        <li>Every metric: users, downloads, uptime, latency, threats, scores. All generated locally with random jitter.</li>
        <li>Deployments, auto-fixes, auto-migration and security events — they are scripted animations.</li>
        <li>Cloud providers, regions, credentials. No Google Cloud, Azure or AWS account is connected.</li>
      </ul>
      <h4>What it deliberately does not claim</h4>
      <p>No software can guarantee an app is “unhackable”, and moving a workload to another server does not remove an attacker who already has access. Real resilience needs layered controls: patching, MFA, least privilege, backups you have restored in a drill, and an incident-response plan. The migration sequence here is a visual metaphor, not a security control.</p>
      <p>If you connect this UI to real infrastructure later, never put long-lived cloud keys in the browser — use a backend with short-lived, scoped tokens.</p>
    `, '<button class="btn primary" data-close-modal>Got it</button>');
  }

  /* ============================================================
     NOTIFICATIONS + SIM STRIP
     ============================================================ */
  const notifPanel = $('#notifPanel');
  const bellBtn = $('#bellBtn');
  function closeNotif() { notifPanel.hidden = true; bellBtn.setAttribute('aria-expanded', 'false'); }
  bellBtn.addEventListener('click', e => {
    e.stopPropagation();
    const willOpen = notifPanel.hidden;
    notifPanel.hidden = !willOpen;
    bellBtn.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) { $('#bellBadge').style.display = 'none'; }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.bell-wrap')) closeNotif();
  });
  $$('.notif-item').forEach(b => b.addEventListener('click', () => { setView(b.dataset.target); closeNotif(); }));

  $('#simClose').addEventListener('click', () => { $('#simStrip').hidden = true; });
  $('#simMore').addEventListener('click', infoModal);
  $('#infoBtn').addEventListener('click', infoModal);

  /* ============================================================
     SPARKLINES
     ============================================================ */
  let sparkSeq = 0;
  function sparkSVG(values, color, opts = {}) {
    const w = 120, h = 32, padY = 3;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - padY - ((v - min) / span) * (h - padY * 2);
      return [x, y];
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    const id = `sg${++sparkSeq}`;
    const filled = opts.fill !== false;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      ${filled ? `<path d="${area}" fill="url(#${id})"/>` : ''}
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="1.9" fill="${color}"/>
    </svg>`;
  }

  function series(n, base, spread) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(base + Math.sin(i / 2.1) * spread * 0.55 + (Math.random() - 0.5) * spread);
    return out;
  }

  function renderSparks() {
    const tones = { apps: '#38d9ff', users: '#4ade80', downloads: '#60a5fa', threats: '#fb7185' };
    $$('[data-spark]').forEach(el => {
      const key = el.dataset.spark;
      el.innerHTML = sparkSVG(series(26, 50, 26), tones[key] || '#38d9ff');
    });
  }

  /* ============================================================
     WORLD MAP
     ============================================================ */
  const MAP_LAND = [
    [[15, 19], [25, 28]],
    [[14, 20], [24, 29], [36, 36], [46, 58]],
    [[12, 21], [24, 29], [35, 60]],
    [[6, 10], [12, 22], [25, 29], [33, 62]],
    [[5, 11], [12, 23], [26, 28], [30, 30], [34, 37], [38, 63]],
    [[5, 11], [12, 24], [34, 37], [38, 63]],
    [[8, 24], [31, 31], [33, 38], [39, 62]],
    [[8, 23], [31, 31], [32, 39], [39, 60]],
    [[8, 22], [32, 38], [39, 56], [56, 56]],
    [[8, 21], [31, 38], [39, 56], [56, 57]],
    [[9, 21], [31, 38], [40, 46], [46, 56], [57, 57]],
    [[11, 18], [31, 40], [41, 45], [45, 48], [48, 56], [57, 57]],
    [[12, 17], [31, 41], [41, 45], [45, 48], [49, 54], [55, 55]],
    [[13, 17], [31, 41], [45, 48], [49, 54]],
    [[15, 18], [31, 41], [45, 48], [49, 53], [54, 54]],
    [[16, 19], [21, 24], [32, 42], [45, 47], [50, 53], [54, 54]],
    [[20, 26], [32, 41], [51, 56], [57, 59]],
    [[20, 27], [33, 41], [51, 56], [57, 59]],
    [[20, 28], [33, 40], [52, 56], [57, 59]],
    [[20, 28], [33, 40], [53, 56], [58, 59]],
    [[21, 28], [33, 39], [40, 40], [54, 59]],
    [[21, 27], [33, 39], [40, 41], [53, 60]],
    [[21, 27], [34, 38], [52, 60]],
    [[22, 26], [35, 37], [52, 59]],
    [[22, 26], [35, 37], [53, 58], [62, 62]],
    [[22, 25], [62, 63]],
    [[22, 25], [63, 63]],
    [[22, 24]],
    [[23, 24]],
    []
  ];

  const MAP_NODES = [
    { city: 'ashburn',   p: 'AWS',   lon: -77.5, lat: 39.0,  dx: 0,  dy: 13, anchor: 'middle' },
    { city: 'são paulo', p: 'AWS',   lon: -46.6, lat: -23.5, dx: 0,  dy: 13, anchor: 'middle' },
    { city: 'dublin',    p: 'Azure', lon: -6.3,  lat: 53.3,  dx: -6, dy: -7, anchor: 'end' },
    { city: 'frankfurt', p: 'Azure', lon: 8.7,   lat: 50.1,  dx: 7,  dy: -5, anchor: 'start' },
    { city: 'mumbai',    p: 'GCP',   lon: 72.9,  lat: 19.1,  dx: 9,  dy: 3,  anchor: 'start' },
    { city: 'chennai',   p: 'GCP',   lon: 80.3,  lat: 13.1,  dx: 6,  dy: 14, anchor: 'start' },
    { city: 'singapore', p: 'Azure', lon: 103.8, lat: 1.35,  dx: 8,  dy: 10, anchor: 'start' },
    { city: 'tokyo',     p: 'GCP',   lon: 139.7, lat: 35.7,  dx: -6, dy: -6, anchor: 'end' },
    { city: 'sydney',    p: 'GCP',   lon: 151.2, lat: -33.9, dx: 0,  dy: 14, anchor: 'middle' }
  ];

  function buildMap() {
    const svg = $('#worldMap');
    const W = 528, H = 240, CELL = 8;

    const dots = [];
    MAP_LAND.forEach((ranges, row) => {
      ranges.forEach(([a, b]) => {
        for (let c = a; c <= b; c++) {
          dots.push(`<circle cx="${(c * CELL + CELL / 2).toFixed(1)}" cy="${(row * CELL + CELL / 2).toFixed(1)}" r="1.65"/>`);
        }
      });
    });

    const toXY = n => ({
      x: ((n.lon + 180) / 360) * (W - 16) + 8,
      y: ((84 - n.lat) / 144) * (H - 16) + 8
    });
    const pos = MAP_NODES.map(toXY);

    const arcs = [[0, 2], [2, 3], [3, 4], [4, 6], [6, 8], [8, 7], [1, 0], [4, 5]]
      .map(([i, j], k) => {
        const a = pos[i], b = pos[j];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const bend = len * 0.2 * (k % 2 ? 1 : -1);
        const cx = mx + nx * bend, cy = my + ny * bend;
        return `<path class="arc" d="M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}" style="animation-delay:${(k * 0.35).toFixed(2)}s"/>`;
      }).join('');

    const nodes = MAP_NODES.map((n, i) => {
      const { x, y } = pos[i];
      const color = CLOUDS[n.p].color;
      return `<g class="node" style="--c:${color}">
        <title>${n.city} · ${n.p} · simulated</title>
        <circle class="node-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" style="animation-delay:${(i * 0.42).toFixed(2)}s"/>
        <circle class="node-core" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent"/>
        <text class="node-label" x="${(x + n.dx).toFixed(1)}" y="${(y + n.dy).toFixed(1)}" text-anchor="${n.anchor}">${n.city}</text>
      </g>`;
    }).join('');

    svg.innerHTML = `<defs>
        <filter id="mapGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.1" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g class="map-land">${dots.join('')}</g>
      ${arcs}
      ${nodes}`;
  }

  /* ============================================================
     APPS
     ============================================================ */
  function appSpark(a) {
    const tone = a.status === 'degraded' ? '#fbbf24' : a.status === 'building' ? '#60a5fa' : a.status === 'migrating' ? '#a78bfa' : '#38d9ff';
    return sparkSVG(series(20, 45, 30), tone, { fill: false });
  }

  function appCardHTML(a) {
    const st = STATUS[a.status];
    const c = CLOUDS[a.cloud];
    const stDot = { healthy: '', shielded: 'cyan', degraded: 'amber', building: 'blue', migrating: 'violet' }[a.status];
    return `<article class="app-card ${a.status === 'migrating' ? 'migrating' : ''}" data-app="${a.id}">
      <div class="app-top">
        <div class="app-avatar" style="--hue:${a.hue}">${a.name[0]}</div>
        <div class="app-id"><strong>${esc(a.name)}</strong><span>App #${a.id.slice(-2)} · ${esc(a.ver)}</span></div>
        <span class="app-state ${st.cls}"><i class="dot ${stDot}"></i>${st.label}</span>
      </div>
      <div class="app-cloud"><i class="dot ${c.dot}"></i>${c.short} · ${esc(a.region)}</div>
      <div class="app-stats">
        <div><span>Live users</span><strong data-live="${a.id}">${fmt(a.users)}</strong></div>
        <div><span>Ping</span><strong>${a.ping} ms</strong></div>
        <div><span>Uptime</span><strong>${a.uptime}</strong></div>
      </div>
      <div class="app-spark">${appSpark(a)}</div>
      <div class="app-actions">
        <button class="btn xs ghost" data-app-open="${a.id}">Open</button>
        <button class="btn xs ghost" data-app-logs="${a.id}">Logs</button>
      </div>
    </article>`;
  }

  function renderApps() {
    const grid = $('#appsGrid');
    const list = APPS.filter(a => {
      if (state.filter === 'healthy') return a.status === 'healthy' || a.status === 'shielded';
      if (state.filter === 'attention') return a.status === 'degraded' || a.status === 'migrating' || a.status === 'building';
      return true;
    });
    grid.innerHTML = list.length
      ? list.map(appCardHTML).join('')
      : '<p class="empty-note">No apps in this state right now.</p>';
    $('#appCount').textContent = APPS.length;
  }

  $$('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
    state.filter = chip.dataset.filter;
    $$('[data-filter]').forEach(c => c.classList.toggle('is-active', c === chip));
    renderApps();
  }));

  $('#appsGrid').addEventListener('click', e => {
    const open = e.target.closest('[data-app-open]');
    const logs = e.target.closest('[data-app-logs]');
    if (open) openApp(open.dataset.appOpen);
    if (logs) { setView('debug'); toast('info', 'Opening runtime logs', 'Simulated stream for this app.'); }
  });

  function openApp(id) {
    const a = APPS.find(x => x.id === id);
    if (!a) return;
    const st = STATUS[a.status];
    const c = CLOUDS[a.cloud];
    openModal(a.name, `
      <div class="modal-kpis">
        <div class="modal-kpi"><span>Status</span><strong>${st.label}</strong></div>
        <div class="modal-kpi"><span>Provider</span><strong>${c.short}</strong></div>
        <div class="modal-kpi"><span>Region</span><strong>${esc(a.region)}</strong></div>
        <div class="modal-kpi"><span>Live users</span><strong>${fmt(a.users)}</strong></div>
        <div class="modal-kpi"><span>Ping</span><strong>${a.ping} ms</strong></div>
        <div class="modal-kpi"><span>Uptime</span><strong>${a.uptime}</strong></div>
      </div>
      <h4>Recent simulated events</h4>
      <ul>
        <li><code>${stamp()}</code> — health probe returned 200 · TLS 1.3</li>
        <li><code>${stamp()}</code> — build ${esc(a.ver)} served from ${esc(a.region)}</li>
        <li><code>${stamp()}</code> — 0 new errors in the last 30-minute scan</li>
      </ul>
      <p style="margin-bottom:0">This detail view is generated from demo data. Actions below only trigger toasts or navigate within the prototype.</p>
    `, `<button class="btn ghost" data-action="app-attack">Run security drill</button>
        <button class="btn ghost" data-action="app-logs">View logs</button>
        <button class="btn primary" data-action="app-redeploy">Redeploy</button>`);
  }

  /* ============================================================
     METRICS
     ============================================================ */
  function animateCounts() {
    $$('[data-count]').forEach(el => {
      const target = Number(el.dataset.count);
      const t0 = performance.now(), dur = 950;
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  const liveUsersEl = $('#liveUsers');
  setInterval(() => {
    let total = 0;
    APPS.forEach(a => {
      if (a.status !== 'building') {
        a.users = Math.max(60, Math.round(a.users * (1 + (Math.random() - 0.5) * 0.045)));
      }
      total += a.users;
      const el = document.querySelector(`[data-live="${a.id}"]`);
      if (el) el.textContent = fmt(a.users);
    });
    const jitter = Math.round(total * (1 + (Math.random() - 0.5) * 0.008));
    liveUsersEl.textContent = fmt(jitter);
  }, 2800);

  /* ============================================================
     TERMINAL
     ============================================================ */
  const LOG_POOL = [
    { k: 'info', t: 'heartbeat ok · ' + APPS.length + ' apps · 3 providers · 9 regions' },
    { k: 'ok',   t: 'auto-heal patched NovaCommerce/login.jsx in 380 ms (0 downtime)' },
    { k: 'ok',   t: 'TLS certificates re-verified across 9 regions' },
    { k: 'warn', t: 'AeroFleet p95 latency 412 ms in eu-central-1 — above baseline' },
    { k: 'info', t: 'review NLP pass: 1,286 reviews analysed · 147 negative clusters' },
    { k: 'dim',  t: 'syncing replica · GCP asia-south1 → Azure southeastasia · lag 0.8 s' },
    { k: 'err',  t: 'SQLi probe blocked · 45.12.98.201 · target LedgerPay' },
    { k: 'ok',   t: 'daily report compiled for 06:00 IST · 18,420 downloads' },
    { k: 'info', t: 'cache hit rate 71% on OrbitNotes — recommendation queued' },
    { k: 'dim',  t: 'container layers deduplicated · 148 MB → 96 MB' },
    { k: 'ok',   t: 'canary 5% → 25% on ZenFit · error budget unchanged' },
    { k: 'warn', t: '2 medium dependency CVEs open · patch window 24 h' }
  ];

  function pushLog(text, kind = 'info', isCommand = false) {
    const line = document.createElement('div');
    line.className = 'term-line ' + (isCommand ? 'cmd' : kind);
    line.innerHTML = `<time>${stamp()}</time><span class="t">${text}</span>`;
    terminal.appendChild(line);
    while (terminal.children.length > 80) terminal.removeChild(terminal.firstChild);
    terminal.scrollTop = terminal.scrollHeight;
  }

  pushLog('Nexus Core v0.9 · simulated event stream — nothing here is real telemetry', 'dim');
  setTimeout(() => pushLog('Jarvis online. ' + APPS.length + ' apps · 3 providers · 9 regions.', 'ok'), 500);
  setTimeout(() => pushLog('TLS rotation verified · 0 expired certificates · WAF in challenge mode.', 'info'), 1100);
  setTimeout(() => pushLog('type /help for demo commands', 'dim'), 1700);
  setTimeout(() => pushLog('replica sync · GCP asia-south1 → Azure southeastasia · lag 0.8 s', 'dim'), 2400);
  setTimeout(() => pushLog('AeroFleet p95 latency 412 ms in eu-central-1 — above baseline', 'warn'), 3100);
  setTimeout(() => pushLog('review NLP pass: 1,286 reviews analysed · 147 negative clusters', 'info'), 3800);

  setInterval(() => {
    if (state.logPaused) return;
    const e = pick(LOG_POOL);
    pushLog(e.t, e.k);
  }, 3200);

  let paused = false;
  $('#pauseLog').addEventListener('click', e => {
    paused = !paused;
    state.logPaused = paused;
    e.currentTarget.textContent = paused ? 'Resume' : 'Pause';
    pushLog(paused ? 'feed paused by operator (demo)' : 'feed resumed', 'dim');
  });
  $('#clearLog').addEventListener('click', () => { terminal.innerHTML = ''; pushLog('log cleared', 'dim'); });

  $('#termForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#termInput');
    const raw = input.value.trim();
    if (!raw) return;
    input.value = '';
    pushLog(esc(raw), 'cmd', true);
    handleCommand(raw.toLowerCase());
  });

  function handleCommand(cmd) {
    const [base] = cmd.split(/\s+/);
    switch (base) {
      case '/help':
        pushLog('commands: /status · /scan · /deploy · /migrate · /report · /clear', 'info');
        break;
      case '/status':
        pushLog(`all systems nominal (simulated) · ${APPS.length} apps live · ${state.threatsBlocked} threats blocked · posture ${state.score}/100`, 'ok');
        break;
      case '/scan':
        pushLog('deep scan requested — opening debugger', 'info');
        setView('debug');
        runScan();
        break;
      case '/deploy':
        pushLog('routing to deployment hub', 'info');
        setView('deploy');
        break;
      case '/migrate':
      case '/attack':
        pushLog('operator requested a security drill — starting simulated migration', 'warn');
        setView('shield');
        runIntrusion();
        break;
      case '/report':
        pushLog('compiling 24-hour report from demo data', 'info');
        previewReport();
        break;
      case '/clear':
        terminal.innerHTML = '';
        pushLog('log cleared', 'dim');
        break;
      default:
        pushLog('command not found in this demo — try /help', 'warn');
    }
  }

  /* ============================================================
     DEPLOYMENT HUB
     ============================================================ */
  const PIPE = [
    { name: 'Package source', meta: 'zip · 4.2 MB' },
    { name: 'Static analysis', meta: 'eslint · tsc' },
    { name: 'Automated tests', meta: '148 unit · 12 UI', gate: 'test' },
    { name: 'Container build', meta: 'node:20-alpine', gate: 'build' },
    { name: 'Security scan', meta: 'deps · secrets', gate: 'scan' },
    { name: 'Provision & deploy', meta: 'terraform · sim' },
    { name: 'Health check', meta: 'smoke · TLS' }
  ];

  function renderSteps() {
    $('#pipelineSteps').innerHTML = PIPE.map((s, i) => `
      <li class="step" data-step="${i}">
        <span class="step-ic"><span>${i + 1}</span></span>
        <span class="step-name">${s.name}</span>
        <span class="step-meta">${s.meta}</span>
      </li>`).join('');
  }

  function dlog(text, kind = 'dim') {
    const div = document.createElement('div');
    div.className = kind;
    div.textContent = text;
    deployLog.appendChild(div);
    deployLog.scrollTop = deployLog.scrollHeight;
    while (deployLog.children.length > 120) deployLog.removeChild(deployLog.firstChild);
  }

  function fillRegions(cloud) {
    const sel = $('#regionSelect');
    sel.innerHTML = REGIONS[cloud].map(r => `<option>${esc(r)}</option>`).join('');
  }

  function setCloud(cloud) {
    state.cloud = cloud;
    $$('.cloud-opt').forEach(l => l.classList.toggle('is-checked', $('input', l).value === cloud));
    $('#targetLabel').textContent = CLOUDS[cloud].name;
    fillRegions(cloud);
  }

  $$('.cloud-opt input').forEach(input => {
    input.addEventListener('change', () => setCloud(input.value));
  });

  const dropzone = $('#dropzone');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.hidden = true;
  document.body.appendChild(fileInput);
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) $('#dropHint').textContent = `attached (demo): ${fileInput.files[0].name}`;
  });
  ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    $('#dropHint').textContent = f ? `attached (demo): ${f.name}` : 'Files never leave your browser';
  });

  const deployBtn = $('#deployBtn');
  deployBtn.addEventListener('click', runDeploy);

  function setPipeStatus(text, cls) {
    const pill = $('#pipeStatus');
    pill.textContent = text;
    pill.className = 'pill ' + (cls || '');
  }

  async function runDeploy() {
    if (state.deploying) return;
    const name = ($('#depName').value || '').trim().replace(/\s+/g, '');
    if (!name) { toast('err', 'App name required', 'Give the demo build a name first.'); return; }

    state.deploying = true;
    deployBtn.disabled = true;
    renderSteps();
    deployLog.innerHTML = '';
    setPipeStatus('running', 'warn');
    const cloud = state.cloud;
    const region = ($('#regionSelect').value || '').split(' · ')[0];
    const gates = Object.fromEntries($$('[data-gate]').map(g => [g.dataset.gate, g.checked]));

    dlog(`$ nexus deploy --app ${name} --target ${CLOUD_NAMES_SHORT(cloud)}:${region}`, 'info');
    dlog('# simulation only — no build runs, nothing is uploaded', 'dim');
    await sleep(420);

    const steps = $$('.step');
    const logs = [
      ['collecting sources · archive 4.2 MB'],
      ['eslint 0 errors · tsc 0 errors · 1 hint'],
      ['148 unit tests passed · 12 UI flows green', 'warn'],
      ['docker build · node:20-alpine → 96 MB', 'info'],
      ['0 critical · 2 medium · 0 leaked secrets', 'warn'],
      [`terraform plan → ${CLOUD_NAMES_SHORT(cloud)} ${region}`, 'info'],
      ['GET /health 200 · TLS 1.3 · p95 210 ms', 'ok']
    ];

    for (let i = 0; i < PIPE.length; i++) {
      const step = steps[i];
      const gateOff = PIPE[i].gate && !gates[PIPE[i].gate];
      step.classList.add('active');
      dlog(`» ${PIPE[i].name.toLowerCase()}…`);
      await sleep(rnd(520, 900));
      step.classList.remove('active');

      if (gateOff) {
        step.classList.add('skipped');
        step.querySelector('.step-meta').textContent = 'skipped';
        dlog(`· ${PIPE[i].name} disabled for this run — skipped`, 'dim');
        continue;
      }

      step.classList.add('done');
      step.querySelector('.step-ic').innerHTML = '✓';
      step.querySelector('.step-meta').textContent = `${(rnd(4, 19) / 10).toFixed(1)}s`;
      const [line, kind] = logs[i];
      dlog(line, kind || 'dim');
    }

    const id = 'app-' + pad2(state.seq++);
    APPS.push({
      id, name, ver: 'v0.1.0', cloud, region,
      status: 'building', users: rnd(40, 180), ping: rnd(22, 70),
      uptime: '100.00%', hue: rnd(140, 320)
    });
    state.filter = 'all';
    $$('[data-filter]').forEach(c => c.classList.toggle('is-active', c.dataset.filter === 'all'));
    renderApps();
    renderHostTable();
    renderProviders();

    setPipeStatus('live', 'ok');
    deployBtn.disabled = false;
    state.deploying = false;
    dlog(`✔ ${name} matched to ${CLOUDS[cloud].name} · ${region} — simulated`, 'ok');
    pushLog(`deploy: ${esc(name)} ${PIPE.every((p, i) => !p.gate || gates[p.gate]) ? 'passed' : 'passed with skips'} · ${cloud} ${region}`, 'ok');
    toast('ok', 'Deployment complete', `${name} is “live” on ${CLOUDS[cloud].short} ${region}. Demo only.`);

    setTimeout(() => {
      const a = APPS.find(x => x.id === id);
      if (!a || a.status !== 'building') return;
      a.status = 'healthy';
      renderApps();
      renderHostTable();
      toast('info', 'Build finished', `${name} is healthy in the simulated fleet.`);
    }, 3600);
  }

  function CLOUD_NAMES_SHORT(c) { return c === 'GCP' ? 'gcp' : c === 'Azure' ? 'azure' : 'aws'; }

  function renderHostTable() {
    $('#hostBody').innerHTML = APPS.map(a => {
      const c = CLOUDS[a.cloud];
      const st = STATUS[a.status];
      return `<tr>
        <td><span class="cell-app"><span class="mini-av" style="--hue:${a.hue}">${a.name[0]}</span><strong>${esc(a.name)}</strong></span></td>
        <td><span class="cloud-tag"><i class="dot ${c.dot}"></i>${c.short}</span></td>
        <td class="mono">${esc(a.region)}</td>
        <td><span class="app-state ${st.cls}">${st.label}</span></td>
        <td class="mono">${a.uptime}</td>
        <td class="mono">${a.ping} ms</td>
        <td class="mono">${esc(a.ver)}</td>
        <td><button class="btn xs ghost" data-host-open="${a.id}">View</button></td>
      </tr>`;
    }).join('');
  }

  $('#hostBody').addEventListener('click', e => {
    const b = e.target.closest('[data-host-open]');
    if (b) openApp(b.dataset.hostOpen);
  });

  /* ============================================================
     DEBUGGER
     ============================================================ */
  function findingHTML(f) {
    return `<div class="finding" data-finding="${f.id}">
      <span class="finding-ic ${f.sev}">${f.sev[0].toUpperCase()}</span>
      <div class="finding-body">
        <div class="finding-title"><strong>${esc(f.title)}</strong><span class="pill tiny ${f.sev === 'high' ? 'rose' : f.sev === 'medium' ? 'amber' : ''}">${f.sev}</span></div>
        <p>${esc(f.detail)}</p>
        <code>${esc(f.code)} · ${esc(f.app)} · ${esc(f.age)}</code>
      </div>
      <div class="finding-actions">
        <button class="btn xs ghost" data-fix="${f.id}">Auto-fix</button>
      </div>
    </div>`;
  }

  function renderFindings() {
    $('#findingsList').innerHTML = FINDINGS.length
      ? FINDINGS.map(findingHTML).join('')
      : '<p class="empty-note">No open findings. The array is clean (for now).</p>';
    $('#openFindings').textContent = FINDINGS.length;
    $('#fixedFindings').textContent = state.fixed;
  }

  $('#findingsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-fix]');
    if (!btn) return;
    const id = btn.dataset.fix;
    const f = FINDINGS.find(x => x.id === id);
    const row = btn.closest('.finding');
    if (!f || !row) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    row.classList.add('fixing');
    setTimeout(() => {
      row.classList.add('fixed');
      setTimeout(() => {
        FINDINGS = FINDINGS.filter(x => x.id !== id);
        state.fixed += 1;
        renderFindings();
        pushLog(`auto-fix applied · ${f.title} · ${f.app} · 0 downtime (simulated)`, 'ok');
        toast('ok', 'Patch applied (simulated)', `${f.title} — ${f.app}. Nothing was actually changed.`);
      }, 240);
    }, 850);
  });

  $('#scanBtn').addEventListener('click', runScan);

  let scanning = false;
  function runScan() {
    if (scanning) return;
    scanning = true;
    const btn = $('#scanBtn');
    btn.disabled = true;
    btn.textContent = 'Scanning…';
    $('#lastScan').textContent = 'scanning…';
    setTimeout(() => {
      if (SCAN_LEFT.length) {
        const f = SCAN_LEFT.shift();
        FINDINGS.unshift(f);
        renderFindings();
        toast('warn', 'Scan complete', `1 new finding · ${SCAN_LEFT.length} more queued in the demo pool.`);
        pushLog(`deep scan: new finding · ${f.title} · ${f.app}`, 'warn');
      } else {
        toast('ok', 'Scan complete', 'No new findings — the demo pool is empty.');
        pushLog('deep scan complete · no new findings in demo pool', 'ok');
      }
      $('#lastScan').textContent = 'just now';
      btn.disabled = false;
      btn.textContent = 'Run scan';
      scanning = false;
    }, 1700);
  }

  /* ---------- stress simulator ---------- */
  const stressRange = $('#stressRange');
  function updateStress() {
    const v = Number(stressRange.value);
    const users = Math.round(1000 * Math.pow(10, (v / 100) * 3));
    const latency = Math.round(110 + 26 * Math.pow(users / 1000, 0.55));
    const errors = users > 150000 ? Math.min(2.6, ((users - 150000) / 850000) * 2.4) : 0;

    $('#stressUsers').textContent = fmt(users);
    $('#stressLatency').textContent = `${fmt(latency)} ms`;
    $('#stressErrors').textContent = `${errors.toFixed(2)}%`;
    $('#latencyMeter').style.width = `${clamp(latency / 1500 * 100, 2, 100)}%`;
    $('#errorMeter').style.width = `${clamp(errors / 3 * 100, 1, 100)}%`;

    const pill = $('#stressStatus');
    if (latency > 900 || errors > 1) {
      pill.textContent = 'critical'; pill.className = 'pill rose';
      $('#stressNote').textContent = 'Projected SLO breach — shed load or scale out before shipping.';
    } else if (latency > 450) {
      pill.textContent = 'warn'; pill.className = 'pill warn';
      $('#stressNote').textContent = 'Approaching the latency budget. Watch p95 under real traffic.';
    } else {
      pill.textContent = 'pass'; pill.className = 'pill ok';
      $('#stressNote').textContent = 'Well inside the demo latency budget. Not a real benchmark.';
    }
  }
  stressRange.addEventListener('input', updateStress);

  /* ---------- performance chart ---------- */
  const perfCanvas = $('#perfChart');
  const pctx = perfCanvas.getContext('2d');
  const chart = { w: 0, h: 0, cpu: series(38, 46, 18), mem: series(38, 58, 14) };

  function sizeCanvas() {
    const rect = perfCanvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    perfCanvas.width = Math.round(rect.width * dpr);
    perfCanvas.height = Math.round((rect.height || 150) * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    chart.w = rect.width;
    chart.h = rect.height || 150;
  }

  function smoothPath(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      if (i === 0) { ctx.moveTo(x, y); return; }
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      ctx.bezierCurveTo(cx, py, cx, y, x, y);
    });
  }

  function drawChart() {
    if (!chart.w) return;
    const { w, h } = chart;
    pctx.clearRect(0, 0, w, h);

    pctx.strokeStyle = 'rgba(120,180,255,.09)';
    pctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(w, y); pctx.stroke();
    }

    const plot = (data, color, fillA, fillB) => {
      const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - (clamp(v, 0, 100) / 100) * (h - 12) - 4 ]);
      const grad = pctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, fillA);
      grad.addColorStop(1, fillB);
      smoothPath(pctx, pts);
      pctx.lineTo(w, h); pctx.lineTo(0, h); pctx.closePath();
      pctx.fillStyle = grad; pctx.fill();
      smoothPath(pctx, pts);
      pctx.strokeStyle = color; pctx.lineWidth = 1.7; pctx.lineJoin = 'round'; pctx.stroke();
      const last = pts[pts.length - 1];
      pctx.beginPath(); pctx.arc(last[0] - 1, last[1], 2.4, 0, Math.PI * 2);
      pctx.fillStyle = color; pctx.fill();
    };

    plot(chart.mem, '#a78bfa', 'rgba(167,139,250,.18)', 'rgba(167,139,250,0)');
    plot(chart.cpu, '#38d9ff', 'rgba(56,217,255,.20)', 'rgba(56,217,255,0)');

    const cpu = chart.cpu[chart.cpu.length - 1];
    const mem = chart.mem[chart.mem.length - 1];
    $('#cpuNow').textContent = `${cpu.toFixed(0)}%`;
    $('#memNow').textContent = `${mem.toFixed(0)}%`;
  }

  setInterval(() => {
    const lastC = chart.cpu[chart.cpu.length - 1];
    const lastM = chart.mem[chart.mem.length - 1];
    chart.cpu.push(clamp(lastC + (Math.random() - 0.48) * 9, 18, 88));
    chart.mem.push(clamp(lastM + (Math.random() - 0.5) * 5, 30, 84));
    chart.cpu.shift(); chart.mem.shift();
    if (state.view === 'debug') drawChart();
  }, 1200);

  window.addEventListener('resize', () => {
    sizeCanvas();
    if (state.view === 'debug') drawChart();
  });

  /* ============================================================
     AEGIS SHIELD
     ============================================================ */
  const radar = $('#radar');
  const blips = $('#blips');
  function seedBlips() {
    blips.innerHTML = '';
    const colors = ['cyan', 'cyan', 'mint', 'mint', '', '', 'cyan', 'mint'];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 38 + 6;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const b = document.createElement('span');
      b.className = 'blip ' + colors[i];
      b.style.left = `${x}%`;
      b.style.top = `${y}%`;
      b.style.animationDelay = `${(Math.random() * 2.6).toFixed(2)}s`;
      b.style.animationDuration = `${(2 + Math.random() * 2).toFixed(2)}s`;
      blips.appendChild(b);
    }
  }

  function threatRow(t) {
    const statePill = t.state === 'blocked' ? 'ok' : t.state === 'mitigated' ? 'warn' : t.state === 'migrated' ? 'cyan' : 'rose';
    return `<tr>
      <td class="mono">${t.time}</td>
      <td>${esc(t.event)}</td>
      <td class="mono">${esc(t.src)}</td>
      <td>${esc(t.target)}</td>
      <td>${esc(t.action)}</td>
      <td><span class="pill tiny ${statePill}">${esc(t.state)}</span></td>
    </tr>`;
  }

  function renderThreats() {
    $('#threatBody').innerHTML = THREATS.map(threatRow).join('');
    $('#threatCount').textContent = `${THREATS.length} events`;
  }

  function setScore(v) {
    state.score = v;
    $('#scoreValue').textContent = v;
    const dash = (v / 100) * 314.0;
    $('#scoreArc').setAttribute('stroke-dasharray', `${dash.toFixed(1)} 314`);
  }

  function setMigStep(idx, cls) {
    const el = $(`.mig-step[data-mig="${idx}"]`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (cls) el.classList.add(cls);
  }

  const attackBtn = $('#attackBtn');
  attackBtn.addEventListener('click', runIntrusion);

  async function runIntrusion() {
    if (state.attacking) { toast('info', 'Drill already running', 'Give the simulated migration a moment.'); return; }
    const target = APPS.find(a => a.id === 'app-05') || APPS.find(a => a.status === 'degraded') || APPS[0];
    if (!target) return;

    state.attacking = true;
    attackBtn.disabled = true;
    state.openIncidents = 1;
    $('#openIncidents').textContent = '1';

    const migCard = $('#migrationCard');
    const migStatus = $('#migrationStatus');
    migStatus.textContent = 'executing';
    migStatus.className = 'pill rose';
    $('#migrationRoute').textContent = `${target.name} · ${target.cloud} ${target.region} → Azure westeurope`;
    $('#migNote').textContent = 'Choreographed demo: each step is a timed animation, not a real migration.';

    $$('.mig-step').forEach(s => s.classList.remove('active', 'done'));
    setMigStep(0, 'active');

    target.status = 'migrating';
    renderApps();
    renderHostTable();

    const threat = {
      time: stamp(), event: 'Anomaly: egress spike + auth replay', src: '185.220.101.7',
      target: target.name, action: 'Auto-migration initiated', state: 'containing'
    };
    THREATS.unshift(threat);
    renderThreats();

    pushLog(`ALERT: critical anomaly on ${target.name} · source 185.220.101.7`, 'err');
    pushLog('isolating affected node · rotating credentials (simulated)', 'warn');
    toast('warn', 'Intrusion drill started', `${target.name} is being moved off ${target.cloud} — this is a demo, not a real defence.`);

    const stepNotes = [
      'anomaly correlated across 3 signals · confidence 0.94',
      'node isolated · blast radius contained to one replica',
      'volume snapshot encrypted · keys rotated in memory',
      'traffic rerouted to a fresh node in Azure westeurope',
      'old host destroyed · forensic copy retained'
    ];

    for (let i = 0; i < 5; i++) {
      setMigStep(i, 'active');
      await sleep(760);
      setMigStep(i, 'done');
      pushLog(`migration step ${i + 1}/5 · ${stepNotes[i]}`, i === 4 ? 'ok' : 'info');
    }

    target.cloud = 'Azure';
    target.region = 'westeurope';
    target.status = 'shielded';
    target.ping = rnd(40, 64);
    renderApps();
    renderHostTable();
    renderProviders();

    threat.action = 'Migrated to Azure westeurope';
    threat.state = 'migrated';
    renderThreats();

    state.migrations += 1;
    $('#migrationCount').textContent = state.migrations;
    state.threatsBlocked += 1;
    const threatMetric = $('#threatMetric');
    if (threatMetric) { threatMetric.dataset.count = state.threatsBlocked; threatMetric.textContent = state.threatsBlocked; }

    state.openIncidents = 0;
    $('#openIncidents').textContent = '0';
    migStatus.textContent = 'complete';
    migStatus.className = 'pill ok';
    $('#migrationRoute').textContent = `${target.name} · now on Azure westeurope (simulated)`;
    $('#migNote').textContent = 'Demo complete. Real migrations need traffic draining, data integrity checks and rollback plans — never a reward for being attacked.';

    setScore(88);
    await sleep(900);
    setScore(96);

    const appCard = document.querySelector(`[data-app="${target.id}"]`);
    if (appCard) { appCard.classList.add('flash'); setTimeout(() => appCard.classList.remove('flash'), 1700); }

    pushLog(`${target.name} live on Azure westeurope · verified 0 errors (simulated)`, 'ok');
    toast('ok', 'Drill complete', `${target.name} “migrated” with zero downtime in the animation. No servers were harmed.`);

    state.attacking = false;
    attackBtn.disabled = false;
    setTimeout(() => { if (!state.attacking) { migStatus.textContent = 'standby'; migStatus.className = 'pill'; } }, 4000);
    migCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================================
     ANALYTICS + REPORT
     ============================================================ */
  const DAY_MAX = 20000;
  function renderDownloadBars() {
    $('#downloadBars').innerHTML = REPORT.daily.map(d => `
      <div class="bar" title="${d.day}: ${fmt(d.v)} downloads">
        <div class="bar-top"><div class="bar-fill" style="height:${(d.v / DAY_MAX * 100).toFixed(1)}%"></div></div>
        <em>${(d.v / 1000).toFixed(1)}k</em>
        <span>${d.day}</span>
      </div>`).join('');
  }

  function renderThemes() {
    const max = Math.max(...REPORT.themes.map(t => t.count));
    $('#themes').innerHTML = REPORT.themes.map(t => `
      <div class="theme">
        <strong>${esc(t.name)}</strong><span class="theme-count">${t.count}</span>
        <div class="theme-bar"><i style="width:${(t.count / max * 100).toFixed(1)}%"></i></div>
        <small>${esc(t.note)}</small>
      </div>`).join('');
  }

  function renderDigestBars() {
    const vals = [42, 58, 51, 66, 73, 61, 88];
    $('#digestBars').innerHTML = vals.map((v, i) => `<i style="height:${v}%;opacity:${0.55 + i * 0.06}"></i>`).join('');
  }

  function buildCSV() {
    const lines = [];
    lines.push('Nexus Core — 24-hour admin report (DEMO DATA)');
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push('Note,All values are simulated in-browser. No cloud account is connected.');
    lines.push('');
    lines.push('METRIC,VALUE');
    lines.push(`Downloads (24h),${REPORT.downloads}`);
    lines.push(`New reviews,${REPORT.reviews}`);
    lines.push(`Average rating,${REPORT.rating}`);
    lines.push(`Crash-free sessions,${REPORT.crashFree}`);
    lines.push(`Negative reviews,${REPORT.negative}`);
    lines.push('');
    lines.push('APPS');
    lines.push('App,Provider,Region,Status,Live users,Ping,Version');
    APPS.forEach(a => lines.push([a.name, CLOUDS[a.cloud].short, a.region, a.status, a.users, `${a.ping}ms`, a.ver].join(',')));
    lines.push('');
    lines.push('COMPLAINT THEMES');
    lines.push('Theme,Count');
    REPORT.themes.forEach(t => lines.push(`"${t.name}",${t.count}`));
    lines.push('');
    lines.push('SECURITY');
    lines.push(`Threats blocked (24h),${state.threatsBlocked}`);
    lines.push(`Auto-migrations,${state.migrations}`);
    lines.push(`Open incidents,${state.openIncidents}`);
    lines.push(`Posture score,${state.score}/100`);
    lines.push('');
    lines.push('REALITY CHECK');
    lines.push('This report exists to demonstrate an interface. It is not telemetry from any real application.');
    return lines.join('\n');
  }

  function downloadReport() {
    const csv = buildCSV();
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus-core-24h-demo-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('ok', 'CSV generated', 'If the download is blocked in this preview, copy the text from the preview window.');
    } catch (err) {
      toast('warn', 'Download blocked', 'The preview sandbox may block downloads — use the preview text instead.');
    }
    previewReport();
    pushLog('24h report exported · demo dataset · 10 apps', 'ok');
  }

  function previewReport() {
    const csv = buildCSV();
    const short = csv.split('\n').slice(0, 34).join('\n');
    openModal('24-hour report · preview', `
      <p>Compiled from the demo dataset in your browser. The full CSV includes every app, theme and security figure.</p>
      <div class="report-preview">${esc(short)}${csv.split('\n').length > 34 ? '\n…' : ''}</div>
      <p style="margin:10px 0 0"><strong>Reality check:</strong> these figures are synthetic. The export exists to show the reporting workflow, not to measure a real product.</p>
    `, `<button class="btn ghost" data-close-modal>Close</button>
        <button class="btn primary" data-action="download-report">Download CSV</button>`);
  }

  $('#previewReport').addEventListener('click', previewReport);
  $('#downloadReport').addEventListener('click', downloadReport);
  $('#downloadReportMini').addEventListener('click', downloadReport);

  /* ============================================================
     CLOUD REGISTRY
     ============================================================ */
  const PROVIDERS = [
    { key: 'GCP', regions: 3, apps: 0, spend: '$1,840', latency: '48 ms', status: 'connected' },
    { key: 'Azure', regions: 3, apps: 0, spend: '$1,260', latency: '57 ms', status: 'connected' },
    { key: 'AWS', regions: 3, apps: 0, spend: '$2,010', latency: '63 ms', status: 'connected' }
  ];

  function renderProviders() {
    PROVIDERS.forEach(p => { p.apps = APPS.filter(a => a.cloud === p.key).length; });
    $('#providers').innerHTML = PROVIDERS.map(p => {
      const c = CLOUDS[p.key];
      return `<article class="card panel provider-card">
        <div class="provider-top">
          <span class="provider-logo ${c.dot}">${p.key === 'GCP' ? 'GCP' : p.key === 'Azure' ? 'AZ' : 'AWS'}</span>
          <div><strong>${c.name}</strong><small>${p.regions} regions active</small></div>
          <span class="pill ok tiny">Connected</span>
        </div>
        <div class="provider-facts">
          <div><span>Apps</span><strong>${p.apps}</strong></div>
          <div><span>Spend / mo</span><strong>${p.spend}</strong></div>
          <div><span>Avg. ping</span><strong>${p.latency}</strong></div>
        </div>
        <button class="btn xs ghost" data-provider="${p.key}">Manage (demo)</button>
      </article>`;
    }).join('');
  }

  $('#providers').addEventListener('click', e => {
    const b = e.target.closest('[data-provider]');
    if (b) toast('info', `${CLOUDS[b.dataset.provider].name} settings`, 'Provider configuration is simulated in this prototype.');
  });

  $$('[data-flag]').forEach(input => {
    input.addEventListener('change', () => {
      const key = input.dataset.flag;
      state.flags[key] = input.checked;
      toast(input.checked ? 'ok' : 'warn', `Automation ${input.checked ? 'enabled' : 'disabled'}`, `${input.parentElement.textContent.trim()} — applies to the demo engine only.`);
    });
  });

  $('#resetDemo').addEventListener('click', resetDemo);

  function resetDemo() {
    APPS = clone(SEED_APPS);
    FINDINGS = clone(SEED_FINDINGS);
    SCAN_LEFT = clone(SCAN_POOL);
    THREATS = clone(SEED_THREATS);
    state.filter = 'all';
    state.attacking = false;
    state.deploying = false;
    state.fixed = 1;
    state.threatsBlocked = 47;
    state.migrations = 1;
    state.openIncidents = 0;
    state.seq = 11;
    setScore(94);
    $('#migrationCount').textContent = state.migrations;
    $('#openIncidents').textContent = '0';
    $('#migrationStatus').textContent = 'standby';
    $('#migrationStatus').className = 'pill';
    $('#migrationRoute').textContent = 'idle · no active move';
    $('#migNote').textContent = 'Moves are orchestrated manually in this demo. Real active-active failover must be built, tested and load-shed, not assumed.';
    $$('.mig-step').forEach(s => s.classList.remove('active', 'done'));
    const threatMetric = $('#threatMetric');
    if (threatMetric) { threatMetric.dataset.count = 47; threatMetric.textContent = '47'; }
    state.score = 94;
    attackBtn.disabled = false;
    renderApps(); renderHostTable(); renderFindings(); renderThreats(); renderProviders();
    seedBlips(); updateStress(); renderSteps();
    deployLog.innerHTML = '<span class="dim">awaiting deployment…</span>';
    setPipeStatus('idle');
    toast('ok', 'Demo reset', 'All simulated state is back to its starting point.');
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    renderSparks();
    buildMap();
    renderApps();
    renderHostTable();
    renderSteps();
    fillRegions(state.cloud);
    setCloud('GCP');
    renderFindings();
    renderThreats();
    renderDownloadBars();
    renderThemes();
    renderDigestBars();
    renderProviders();
    seedBlips();
    updateStress();
    animateCounts();
    setScore(94);
    sizeCanvas();
    drawChart();

    // subtle random radar activity
    setInterval(() => {
      if (state.view !== 'shield' || !blips.children.length) return;
      const b = pick(Array.from(blips.children));
      b.style.animationDelay = '0s';
    }, 3400);

    $$('.reco [data-reco]').forEach(btn => btn.addEventListener('click', () => {
      toast('ok', 'Recommendation staged', 'Added to the simulated change queue. Nothing will execute.');
      btn.textContent = 'Staged';
      btn.disabled = true;
    }));
  }

  init();
})();
