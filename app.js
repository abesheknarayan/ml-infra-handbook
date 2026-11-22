import * as THREE from 'three';
import {
  DOMAINS,
  ERAS,
  ENTITY_TYPES,
  NODES as BASE_NODES,
  EDGES as BASE_EDGES,
  BLOG_INDEX
} from './data.js';
import { TOPIC_HUBS } from './brain-data.js';
import { CHAPTERS } from './chapters-data.js';
import { FACTORY_STATIONS, mountChapterSimulation } from './chapter-visuals.js';
import { createObsidianBrain } from './brain.js';

const STORAGE_KEY = 'ml-infra-galaxy-custom-v1';
const MIN_YEAR = 2006;
const MAX_YEAR = 2026;
const YEAR_SPAN = MAX_YEAR - MIN_YEAR;

// ==================== STATE ====================
const state = {
  nodes: [],
  edges: [],
  activeYear: 2026,       // continuous target year (2006..2026)
  displayYear: 2026,      // smoothly interpolated year for 3D helix
  activeDomain: 'all',    // 'all' or domain id
  selectedNodeId: null,
  hoveredNodeId: null,
  highlightNodeIds: null,
  isPlaying: false,
  playTimer: null,
  // Gentle clamped 3D camera parallax (never loses the helix!)
  tiltX: 0,
  tiltY: 0,
  targetTiltX: 0,
  targetTiltY: 0,
  isDraggingCanvas: false,
  dragLast: { x: 0, y: 0 },
  blogFilterCat: 'all',
  blogSearch: ''
};

const domainMap = new Map(DOMAINS.map((d, idx) => [d.id, { ...d, index: idx }]));

// ==================== THREE.JS SCENE SETUP ====================
const container = document.getElementById('webgl-container');
const labelsLayer = document.getElementById('labels-layer');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060919, 0.0052);

function getStageSize() {
  return {
    w: Math.max(320, container.clientWidth || window.innerWidth - 400),
    h: Math.max(240, container.clientHeight || window.innerHeight - 58)
  };
}

const initStage = getStageSize();
const camera = new THREE.PerspectiveCamera(40, initStage.w / initStage.h, 0.5, 600);
// Pulled back & shifted cleanly left so the 2026 helix end never touches the right sidebar
const BASE_CAM_POS = new THREE.Vector3(14, 14, 162);
const BASE_LOOK_AT = new THREE.Vector3(6, -2, 0);
camera.position.copy(BASE_CAM_POS);
camera.lookAt(BASE_LOOK_AT);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(initStage.w, initStage.h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xbfd7ff, 1.25));
const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
keyLight.position.set(40, 50, 80);
scene.add(keyLight);

// ==================== SUBTLE DEEP-NAVY STARFIELD ====================
function buildSubtleStars() {
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 360;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 220;
    pos[i * 3 + 2] = -40 - Math.random() * 220;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x93c5fd,
    size: 0.75,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
buildSubtleStars();

// ==================== HELICAL CYLINDER GEOMETRY ====================
// The entire helical cylinder sweeps from back-left (-X, -Z) into foreground-center (+X, +Z)
const helixRoot = new THREE.Group();
// Tilted gracefully just like Technology Histomap
helixRoot.position.set(-14, 0, -4);
helixRoot.rotation.y = 0.44;
helixRoot.rotation.z = -0.07;
helixRoot.rotation.x = 0.08;
scene.add(helixRoot);

const CYL_LEN = 104; // Cleanly fits inside the left stage with generous margin before sidebar
const BASE_R = 21;   // Cylinder radius at 2006
const END_R = 29;    // Gently flares wider toward 2026

function yearToX(yr) {
  const t = (yr - MIN_YEAR) / YEAR_SPAN;
  return -CYL_LEN * 0.52 + t * CYL_LEN;
}

function yearToRadius(yr) {
  const t = (yr - MIN_YEAR) / YEAR_SPAN;
  return BASE_R + t * (END_R - BASE_R);
}

// 1. Blue Mosaic Helical Cylinder (InstancedMesh of ~1,500 sleek blue tiles!)
const TILE_RINGS = 56;
const TILES_PER_RING = 28;
const TOTAL_TILES = TILE_RINGS * TILES_PER_RING;

const tileGeo = new THREE.PlaneGeometry(1.75, 2.35);
const tileMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.86
});
const tileMesh = new THREE.InstancedMesh(tileGeo, tileMat, TOTAL_TILES);
helixRoot.add(tileMesh);

const BLUE_PALETTE = [
  new THREE.Color('#0c1c3e'),
  new THREE.Color('#132d63'),
  new THREE.Color('#1d4ed8'),
  new THREE.Color('#2563eb'),
  new THREE.Color('#3b82f6'),
  new THREE.Color('#60a5fa'),
  new THREE.Color('#93c5fd'),
  new THREE.Color('#bae6fd')
];

// Precompute tile metadata for fast, crisp animation
const tileMeta = [];
for (let rIdx = 0; rIdx < TILE_RINGS; rIdx++) {
  const t = rIdx / (TILE_RINGS - 1);
  const yr = MIN_YEAR + t * YEAR_SPAN;
  for (let aIdx = 0; aIdx < TILES_PER_RING; aIdx++) {
    // Helical twist offset per ring
    const baseAngle = (aIdx / TILES_PER_RING) * Math.PI * 2 + t * Math.PI * 2.2;
    // Organic mosaic density: denser bands like Technology Histomap
    const hash = Math.abs(Math.sin(rIdx * 12.9898 + aIdx * 78.233) * 43758.5453) % 1;
    const visible = hash > 0.24;
    const colorIdx = Math.min(
      BLUE_PALETTE.length - 1,
      Math.floor(Math.pow(hash, 1.35) * BLUE_PALETTE.length)
    );
    const scaleW = 0.65 + (hash * 0.65);
    const scaleH = 0.55 + (((hash * 7) % 1) * 0.75);
    tileMeta.push({ t, yr, baseAngle, visible, colorIdx, scaleW, scaleH });
  }
}

// 2. Subtle Circumferential Wireframe Rings + Dashed Active Year Ring
const staticRingsGroup = new THREE.Group();
helixRoot.add(staticRingsGroup);

const KEY_YEARS = [2006, 2010, 2014, 2017, 2020, 2023, 2026];
const yearLabelEls = [];

KEY_YEARS.forEach((yr) => {
  const x = yearToX(yr);
  const rad = yearToRadius(yr) + 0.6;
  const pts = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    pts.push(new THREE.Vector3(x, Math.cos(a) * rad, Math.sin(a) * rad));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.16
  });
  staticRingsGroup.add(new THREE.Line(geo, mat));

  const lbl = document.createElement('div');
  lbl.className = 'helix-year-label';
  lbl.textContent = String(yr);
  labelsLayer.appendChild(lbl);
  yearLabelEls.push({ yr, x, rad, el: lbl });
});

// Active Year Dashed White/Ice Ring (moves smoothly with displayYear!)
const activeRingPts = [];
for (let i = 0; i <= 96; i++) {
  const a = (i / 96) * Math.PI * 2;
  activeRingPts.push(new THREE.Vector3(0, Math.cos(a), Math.sin(a)));
}
const activeRingGeo = new THREE.BufferGeometry().setFromPoints(activeRingPts);
const activeRingMat = new THREE.LineDashedMaterial({
  color: 0xe0f2fe,
  dashSize: 1.6,
  gapSize: 1.2,
  transparent: true,
  opacity: 0.85
});
const activeRingLine = new THREE.Line(activeRingGeo, activeRingMat);
activeRingLine.computeLineDistances();
helixRoot.add(activeRingLine);

// ==================== 3D MILESTONE CARDS & LINEAGE ====================
const cardsGroup = new THREE.Group();
const edgesGroup = new THREE.Group();
helixRoot.add(edgesGroup, cardsGroup);

const cardObjects = new Map(); // id -> { group, cardMesh, pinMesh, labelEl, angleOffset, yr }
const edgeObjects = [];

function createCardTexture(node) {
  const dom = domainMap.get(node.domain) || DOMAINS[0];
  const w = 256;
  const h = 160;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Deep navy-slate card background with subtle blue sheen
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0f1b3d');
  bg.addColorStop(1, '#070d22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Top accent bar
  ctx.fillStyle = dom.color;
  ctx.fillRect(0, 0, w, 6);

  // Subtle geometric grid lines
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(w, 52);
  ctx.stroke();

  // Year & Domain tag
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(String(node.year), 16, 36);

  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(dom.short.toUpperCase(), w - 16, 35);
  ctx.textAlign = 'left';

  // Milestone Name (wrapped up to 2 lines)
  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillStyle = '#f8fafc';
  const words = node.name.split(' ');
  let line1 = '';
  let line2 = '';
  words.forEach((word) => {
    if ((line1 + ' ' + word).trim().length <= 18) line1 = (line1 + ' ' + word).trim();
    else line2 = (line2 + ' ' + word).trim();
  });
  ctx.fillText(line1, 16, 86);
  if (line2) ctx.fillText(line2.slice(0, 20), 16, 114);

  // Org footer
  ctx.font = '400 13px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText((node.org || '').slice(0, 28), 16, 142);

  // Crisp hairline border
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function loadCustomData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { customNodes: [], customEdges: [], attachedResources: {} };
  } catch {
    return { customNodes: [], customEdges: [], attachedResources: {} };
  }
}

function saveCustomData(custom) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function clearCards() {
  cardObjects.forEach((obj) => {
    cardsGroup.remove(obj.group);
    obj.labelEl.remove();
  });
  cardObjects.clear();
  edgeObjects.forEach((eo) => edgesGroup.remove(eo.line));
  edgeObjects.length = 0;
}

function initGraphData() {
  clearCards();

  const custom = loadCustomData();
  const clonedBase = BASE_NODES.map((n) => ({
    ...n,
    resources: [...(n.resources || []), ...(custom.attachedResources[n.id] || [])]
  }));
  const customNodes = (custom.customNodes || []).map((n) => ({
    ...n,
    xSearchUrl: `https://x.com/search?q=${encodeURIComponent(n.name + ' ML infra')}&f=top`
  }));

  state.nodes = [...clonedBase, ...customNodes];
  state.edges = [...BASE_EDGES, ...(custom.customEdges || [])];

  // Spread nodes cleanly around the front-facing arc of their year slice
  const byYear = new Map();
  state.nodes.forEach((n) => {
    if (!byYear.has(n.year)) byYear.set(n.year, []);
    byYear.get(n.year).push(n);
  });

  state.nodes.forEach((n) => {
    const groupList = byYear.get(n.year) || [n];
    const slot = groupList.indexOf(n);
    const count = groupList.length;
    // Fan milestones nicely across the front-facing semicircle (-0.85 to +0.85 rad)
    const spread = count > 1 ? ((slot / (count - 1)) - 0.5) * 1.45 : 0;
    const dom = domainMap.get(n.domain) || DOMAINS[0];
    const angle = spread + (dom.index - 2.5) * 0.08;

    const group = new THREE.Group();

    const cardTex = createCardTexture(n);
    const cardMat = new THREE.MeshBasicMaterial({
      map: cardTex,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide
    });
    const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.5), cardMat);
    cardMesh.userData.nodeId = n.id;
    group.add(cardMesh);

    // Bright pinpoint star on the helix edge
    const pinMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    pinMesh.position.set(0, 0, -0.4);
    group.add(pinMesh);

    const labelEl = document.createElement('div');
    labelEl.className = 'helix-dot-label';
    // Concise label (strip long parentheticals) so labels stay crisp and never clip
    labelEl.textContent = n.name.replace(/\s*\([^)]*\)/g, '').trim();
    labelEl.title = `${n.name} (${n.year})`;
    labelEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNode(n.id);
    });
    labelEl.addEventListener('mouseenter', () => {
      state.hoveredNodeId = n.id;
    });
    labelEl.addEventListener('mouseleave', () => {
      if (state.hoveredNodeId === n.id) state.hoveredNodeId = null;
    });
    labelsLayer.appendChild(labelEl);

    cardsGroup.add(group);
    cardObjects.set(n.id, { group, cardMesh, cardMat, pinMesh, labelEl, angle, node: n });
  });

  // Build thin curved lineage threads across the helix
  state.edges.forEach((e) => {
    const srcObj = cardObjects.get(e.source);
    const dstObj = cardObjects.get(e.target);
    if (!srcObj || !dstObj) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.14
    });
    const line = new THREE.Line(geo, mat);
    edgesGroup.add(line);
    edgeObjects.push({ source: e.source, target: e.target, srcObj, dstObj, geo, mat, line });
  });

  buildHistogram();
  renderDomainPills();
  renderEditorialPanel();
}

function isNodeMatchingDomain(n) {
  return state.activeDomain === 'all' || n.domain === state.activeDomain;
}

// ==================== HISTOGRAM SCRUBBER (BOTTOM BAR) ====================
const histBarsEl = document.getElementById('histogram-bars');
const histNeedleEl = document.getElementById('histogram-needle');
const histWrapEl = document.getElementById('histogram-wrap');
const giantYearEl = document.getElementById('giant-year');
const giantYearSubEl = document.getElementById('giant-year-sub');

function buildHistogram() {
  const counts = [];
  let maxCount = 1;
  for (let yr = MIN_YEAR; yr <= MAX_YEAR; yr++) {
    const c = state.nodes.filter((n) => n.year === yr && isNodeMatchingDomain(n)).length;
    counts.push({ yr, c });
    if (c > maxCount) maxCount = c;
  }

  histBarsEl.innerHTML = counts
    .map(({ yr, c }) => {
      const hPct = Math.max(10, Math.round((c / maxCount) * 100));
      return `<div class="hist-bar" data-yr="${yr}" style="height:${hPct}%" title="${yr}: ${c} milestone(s)"></div>`;
    })
    .join('');

  updateHistogramUI();
}

function updateHistogramUI() {
  const roundedYr = Math.round(state.activeYear);
  const pct = ((state.activeYear - MIN_YEAR) / YEAR_SPAN) * 100;
  histNeedleEl.style.left = `${Math.max(0, Math.min(100, pct))}%`;
  giantYearEl.textContent = String(roundedYr);

  const era = ERAS.find((e) => roundedYr >= e.range[0] && roundedYr <= e.range[1]) || ERAS[ERAS.length - 1];
  giantYearSubEl.textContent = `${era.name} · Scroll to travel`;

  histBarsEl.querySelectorAll('.hist-bar').forEach((bar) => {
    const y = Number(bar.dataset.yr);
    bar.classList.toggle('passed', y < roundedYr);
    bar.classList.toggle('current', y === roundedYr);
  });
}

let isScrubbingHist = false;
function scrubHistogramFromEvent(e) {
  const rect = histWrapEl.getBoundingClientRect();
  const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  setActiveYear(MIN_YEAR + frac * YEAR_SPAN);
}

histWrapEl.addEventListener('pointerdown', (e) => {
  stopPlay();
  isScrubbingHist = true;
  histWrapEl.setPointerCapture(e.pointerId);
  scrubHistogramFromEvent(e);
});
histWrapEl.addEventListener('pointermove', (e) => {
  if (isScrubbingHist) scrubHistogramFromEvent(e);
});
histWrapEl.addEventListener('pointerup', () => {
  isScrubbingHist = false;
});

let lastRenderedYear = null;
function setActiveYear(yr, keepSelected = false) {
  state.activeYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, yr));
  if (!keepSelected && state.selectedNodeId) {
    const sel = state.nodes.find((n) => n.id === state.selectedNodeId);
    if (sel && Math.abs(sel.year - state.activeYear) > 2) {
      state.selectedNodeId = null;
    }
  }
  updateHistogramUI();
  const rounded = Math.round(state.activeYear);
  if (rounded !== lastRenderedYear && !state.selectedNodeId) {
    lastRenderedYear = rounded;
    renderEditorialPanel();
  }
}

// ==================== RIGHT EDITORIAL PANEL ("This year" / Deep Dive) ====================
const editorialHeadingEl = document.getElementById('editorial-heading');
const editorialBodyEl = document.getElementById('editorial-body');
const btnBackYear = document.getElementById('btn-back-year');

btnBackYear.addEventListener('click', () => {
  state.selectedNodeId = null;
  state.highlightNodeIds = null;
  renderEditorialPanel();
  syncUrlState();
});

function selectNode(nodeId) {
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  state.selectedNodeId = nodeId;
  state.highlightNodeIds = null;
  setActiveYear(node.year, true);
  renderEditorialPanel();
  syncUrlState();
}

function renderEditorialPanel() {
  if (state.selectedNodeId) {
    const node = state.nodes.find((n) => n.id === state.selectedNodeId);
    if (!node) return;
    const dom = domainMap.get(node.domain) || DOMAINS[0];
    const era = ERAS.find((e) => node.year >= e.range[0] && node.year <= e.range[1]) || ERAS[ERAS.length - 1];

    editorialHeadingEl.textContent = String(node.year);
    btnBackYear.classList.remove('hidden');

    const upstream = state.edges
      .filter((e) => e.target === node.id)
      .map((e) => state.nodes.find((n) => n.id === e.source))
      .filter(Boolean);
    const downstream = state.edges
      .filter((e) => e.source === node.id)
      .map((e) => state.nodes.find((n) => n.id === e.target))
      .filter(Boolean);
    const seenResUrls = new Set((node.resources || []).map((r) => r.url.replace(/\/+$/, '')));
    const relatedBlogs = BLOG_INDEX.filter((b) => {
      if (!b.relatedNodes.includes(node.id)) return false;
      const u = (b.featuredPost?.url || b.url).replace(/\/+$/, '');
      if (seenResUrls.has(u)) return false;
      seenResUrls.add(u);
      return true;
    });

    editorialBodyEl.innerHTML = `
      <div class="detail-meta">${dom.name} · ${node.org || 'Community'} · ${era.name}</div>
      <h3 class="detail-title">${node.name}</h3>
      <p class="detail-summary">${node.summary || node.tagline}</p>

      ${
        node.breakthrough
          ? `<div class="breakthrough-box">
              <div class="breakthrough-label">Architectural Breakthrough</div>
              <div class="breakthrough-text">${node.breakthrough}</div>
            </div>`
          : ''
      }

      <div class="section-label">X Articles, Papers &amp; Primary Sources</div>
      <div class="resource-list">
        <a class="resource-link" href="${node.xSearchUrl}" target="_blank" rel="noopener">
          <span>𝕏 Explore X Threads on ${node.name}</span>
          <span class="res-tag">X ↗</span>
        </a>
        ${(node.resources || [])
          .map(
            (r) => `
          <a class="resource-link" href="${r.url}" target="_blank" rel="noopener">
            <span>${r.title}</span>
            <span class="res-tag">${r.type} ↗</span>
          </a>`
          )
          .join('')}
      </div>

      ${
        relatedBlogs.length
          ? `<div class="section-label">Indexed ML Engineer &amp; Lab Blogs (${relatedBlogs.length})</div>
             <div class="resource-list">
               ${relatedBlogs
                 .map(
                   (b) => `
                 <a class="resource-link" href="${b.featuredPost?.url || b.url}" target="_blank" rel="noopener">
                   <span><strong>${b.name}</strong> — ${b.featuredPost?.title || b.org}</span>
                   <span class="res-tag">${b.category === 'engineer' ? 'Eng' : 'Lab'} ↗</span>
                 </a>`
                 )
                 .join('')}
             </div>`
          : ''
      }

      ${
        upstream.length
          ? `<div class="section-label">Built On</div>
             <div class="lineage-chips">
               ${upstream.map((u) => `<button class="lineage-btn" data-jump="${u.id}">← ${u.name} (${u.year})</button>`).join('')}
             </div>`
          : ''
      }

      ${
        downstream.length
          ? `<div class="section-label">Unlocked / Led To</div>
             <div class="lineage-chips">
               ${downstream.map((d) => `<button class="lineage-btn" data-jump="${d.id}">${d.name} (${d.year}) →</button>`).join('')}
             </div>`
          : ''
      }
    `;

    editorialBodyEl.querySelectorAll('[data-jump]').forEach((btn) => {
      btn.addEventListener('click', () => selectNode(btn.dataset.jump));
    });
    return;
  }

  // Editorial "This year" feed (shows milestones in active year + closest surrounding years)
  btnBackYear.classList.add('hidden');
  const yr = Math.round(state.activeYear);
  editorialHeadingEl.textContent = yr === MAX_YEAR ? 'This year' : `Around ${yr}`;

  const matching = state.nodes
    .filter(isNodeMatchingDomain)
    .map((n) => ({ n, dist: Math.abs(n.year - yr) }))
    .filter((x) => x.dist <= 2)
    .sort((a, b) => a.dist - b.dist || b.n.importance - a.n.importance)
    .slice(0, 6);

  if (!matching.length) {
    editorialBodyEl.innerHTML = `<p class="detail-summary">Scroll the wheel or drag the bottom histogram to explore ML infrastructure milestones from 2006 to 2026.</p>`;
    return;
  }

  editorialBodyEl.innerHTML = matching
    .map(({ n }) => {
      const dom = domainMap.get(n.domain);
      return `
        <article class="feed-item" data-open-node="${n.id}">
          <div class="feed-item-title">
            <span>${n.name}</span>
            <span class="feed-item-year">${n.year}</span>
          </div>
          <p class="feed-item-desc">${n.tagline}</p>
          <div class="feed-item-meta">${dom.short} · ${n.org || 'Community'} · Inspect papers &amp; X threads →</div>
        </article>`;
    })
    .join('');

  editorialBodyEl.querySelectorAll('[data-open-node]').forEach((el) => {
    el.addEventListener('click', () => selectNode(el.dataset.openNode));
  });
}

// ==================== SCROLL WHEEL = TRAVEL THROUGH TIME! ====================
window.addEventListener(
  'wheel',
  (e) => {
    if (currentView !== 'histomap') return;
    // Allow normal scrolling inside right editorial panel, blogs drawer, or search dropdown
    if (
      e.target.closest('.editorial-body') ||
      e.target.closest('.blogs-list') ||
      e.target.closest('.search-results')
    ) {
      return;
    }
    e.preventDefault();
    stopPlay();
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    setActiveYear(state.activeYear + delta * 0.0085);
  },
  { passive: false }
);

// Full 360° free POV rotation drag on the helix canvas + raycast clicking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-99, -99);
let pointerDown = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  state.isDraggingCanvas = true;
  state.dragLast = { x: e.clientX, y: e.clientY };
  pointerDown = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', (e) => {
  if (currentView !== 'histomap') return;
  if (state.isDraggingCanvas) {
    const dx = e.clientX - state.dragLast.x;
    const dy = e.clientY - state.dragLast.y;
    state.dragLast = { x: e.clientX, y: e.clientY };
    // Full 360° yaw rotation + wide pitch so you can inspect the helix from any POV!
    state.targetTiltY += dx * 0.0075;
    state.targetTiltX = Math.max(-1.25, Math.min(1.25, state.targetTiltX + dy * 0.0065));
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const meshes = [];
  cardObjects.forEach((obj) => {
    if (obj.group.visible) meshes.push(obj.cardMesh);
  });
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length > 0) {
    state.hoveredNodeId = hits[0].object.userData.nodeId;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    state.hoveredNodeId = null;
    renderer.domElement.style.cursor = 'grab';
  }
});

window.addEventListener('pointerup', (e) => {
  if (!state.isDraggingCanvas) return;
  const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
  state.isDraggingCanvas = false;
  if (moved < 5 && state.hoveredNodeId) {
    selectNode(state.hoveredNodeId);
  }
});

// ==================== PLAY / AUTO-SCROLL ====================
const playBtn = document.getElementById('btn-play');
const playIcon = document.getElementById('play-icon');

function stopPlay() {
  state.isPlaying = false;
  playIcon.textContent = '▶';
  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
}

playBtn.addEventListener('click', () => {
  if (state.isPlaying) {
    stopPlay();
    return;
  }
  state.isPlaying = true;
  playIcon.textContent = '❚❚';
  if (state.activeYear >= MAX_YEAR - 0.1) setActiveYear(MIN_YEAR);
  state.playTimer = setInterval(() => {
    if (state.activeYear >= MAX_YEAR) {
      stopPlay();
      return;
    }
    setActiveYear(state.activeYear + 0.08);
  }, 45);
});

document.getElementById('giant-year-block').addEventListener('click', () => {
  state.selectedNodeId = null;
  state.targetTiltX = 0;
  state.targetTiltY = 0;
  setActiveYear(MAX_YEAR);
  renderEditorialPanel();
});

// ==================== DOMAIN FILTER PILLS ====================
function renderDomainPills() {
  const wrap = document.getElementById('domain-filters');
  wrap.innerHTML =
    `<button class="dom-pill ${state.activeDomain === 'all' ? 'active' : ''}" data-dom="all">All</button>` +
    DOMAINS.map(
      (d) =>
        `<button class="dom-pill ${state.activeDomain === d.id ? 'active' : ''}" data-dom="${d.id}">${d.short}</button>`
    ).join('');

  wrap.querySelectorAll('.dom-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeDomain = btn.dataset.dom;
      renderDomainPills();
      buildHistogram();
      renderEditorialPanel();
    });
  });
}

// ==================== GLOBAL SEARCH ====================
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResults.classList.add('hidden');
    return;
  }

  const matchedTopics = TOPIC_HUBS.filter(
    (h) =>
      h.title.toLowerCase().includes(q) ||
      h.short.toLowerCase().includes(q) ||
      h.summary.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedNodes = state.nodes
    .filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.org || '').toLowerCase().includes(q) ||
        (n.tagline || '').toLowerCase().includes(q) ||
        String(n.year).includes(q)
    )
    .slice(0, 7);

  const matchedBlogs = BLOG_INDEX.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.org.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
  ).slice(0, 4);

  if (!matchedTopics.length && !matchedNodes.length && !matchedBlogs.length) {
    searchResults.innerHTML = `<div class="search-item"><span class="search-meta">No matches found.</span></div>`;
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML =
    matchedTopics
      .map(
        (h) => `
        <div class="search-item" data-pick-topic="${h.id}">
          <span class="search-name">${h.title}</span>
          <span class="search-meta">Brain Topic</span>
        </div>`
      )
      .join('') +
    matchedNodes
      .map(
        (n) => `
        <div class="search-item" data-pick-node="${n.id}">
          <span class="search-name">${n.name}</span>
          <span class="search-meta">${n.year}</span>
        </div>`
      )
      .join('') +
    matchedBlogs
      .map(
        (b) => `
        <div class="search-item" data-pick-blog="${b.url}">
          <span class="search-name">${b.name} (${b.org})</span>
          <span class="search-meta">Blog ↗</span>
        </div>`
      )
      .join('');

  searchResults.querySelectorAll('[data-pick-topic]').forEach((el) => {
    el.addEventListener('click', () => {
      switchView('brain');
      brainInstance.focusNode(el.dataset.pickTopic);
      searchResults.classList.add('hidden');
      searchInput.blur();
    });
  });

  searchResults.querySelectorAll('[data-pick-node]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.pickNode;
      if (currentView === 'brain') {
        brainInstance.focusNode(id);
      } else {
        switchView('histomap');
        state.activeDomain = 'all';
        renderDomainPills();
        selectNode(id);
      }
      searchResults.classList.add('hidden');
      searchInput.blur();
    });
  });

  searchResults.querySelectorAll('[data-pick-blog]').forEach((el) => {
    el.addEventListener('click', () => {
      window.open(el.dataset.pickBlog, '_blank', 'noopener');
      searchResults.classList.add('hidden');
    });
  });

  searchResults.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) searchResults.classList.add('hidden');
});

// ==================== BLOGS & LABS DRAWER ====================
const blogsDrawer = document.getElementById('blogs-drawer');
const blogsList = document.getElementById('blogs-list');
const blogsSearch = document.getElementById('blogs-search');
document.getElementById('blogs-count-badge').textContent = String(BLOG_INDEX.length);

let blogsPage = 1;
const BLOGS_PER_PAGE = 8;

function renderBlogsList() {
  const q = state.blogSearch.toLowerCase();
  const filtered = BLOG_INDEX.filter((b) => {
    if (state.blogFilterCat !== 'all' && b.category !== state.blogFilterCat) return false;
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.org.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / BLOGS_PER_PAGE));
  blogsPage = Math.max(1, Math.min(blogsPage, totalPages));
  const slice = filtered.slice((blogsPage - 1) * BLOGS_PER_PAGE, blogsPage * BLOGS_PER_PAGE);

  blogsList.innerHTML =
    slice
      .map(
        (b) => `
      <article class="blog-card">
        <div class="blog-card-top">
          <div>
            <div class="blog-name">${b.name}</div>
            <div class="blog-org">${b.org}</div>
          </div>
          <span class="chip">${b.category === 'engineer' ? 'Engineer' : 'Lab'}</span>
        </div>
        <p class="blog-desc">${b.description}</p>
        <div class="blog-actions">
          <a class="mini-link" href="${b.url}" target="_blank" rel="noopener">Blog ↗</a>
          ${b.featuredPost ? `<a class="mini-link" href="${b.featuredPost.url}" target="_blank" rel="noopener">Featured ↗</a>` : ''}
          ${b.xUrl ? `<a class="mini-link" href="${b.xUrl}" target="_blank" rel="noopener">𝕏 ↗</a>` : ''}
          <button class="mini-link" data-jump-blog="${b.relatedNodes[0] || ''}">Jump to Helix →</button>
        </div>
      </article>`
      )
      .join('') +
    (totalPages > 1
      ? `<div class="pagination-bar">
           <button class="page-btn" id="blogs-prev" ${blogsPage <= 1 ? 'disabled' : ''}>← Prev</button>
           <span class="page-info">Page ${blogsPage} / ${totalPages} (${filtered.length})</span>
           <button class="page-btn" id="blogs-next" ${blogsPage >= totalPages ? 'disabled' : ''}>Next →</button>
         </div>`
      : '');

  blogsList.querySelector('#blogs-prev')?.addEventListener('click', () => {
    blogsPage--;
    renderBlogsList();
    blogsList.scrollTop = 0;
  });
  blogsList.querySelector('#blogs-next')?.addEventListener('click', () => {
    blogsPage++;
    renderBlogsList();
    blogsList.scrollTop = 0;
  });

  blogsList.querySelectorAll('[data-jump-blog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.jumpBlog) {
        switchView('histomap');
        state.activeDomain = 'all';
        renderDomainPills();
        selectNode(btn.dataset.jumpBlog);
        blogsDrawer.classList.add('hidden');
      }
    });
  });
}

document.getElementById('btn-blogs').addEventListener('click', () => {
  blogsDrawer.classList.toggle('hidden');
  if (!blogsDrawer.classList.contains('hidden')) renderBlogsList();
});
document.getElementById('btn-close-blogs').addEventListener('click', () => blogsDrawer.classList.add('hidden'));
blogsSearch.addEventListener('input', (e) => {
  state.blogSearch = e.target.value.trim();
  blogsPage = 1;
  renderBlogsList();
});
document.querySelectorAll('#blogs-drawer .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#blogs-drawer .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.blogFilterCat = btn.dataset.cat;
    blogsPage = 1;
    renderBlogsList();
  });
});

// ==================== ADD X ARTICLE / CUSTOM MILESTONE MODAL ====================
const addModal = document.getElementById('add-modal');
const formAttach = document.getElementById('form-attach');
const formNewStar = document.getElementById('form-newstar');

function populateModalSelects() {
  const sorted = [...state.nodes].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  const opts = sorted.map((n) => `<option value="${n.id}">${n.year} — ${n.name}</option>`).join('');
  document.getElementById('attach-node-select').innerHTML = opts;
  document.getElementById('new-parent').innerHTML = `<option value="">(None)</option>` + opts;
  document.getElementById('new-domain').innerHTML = DOMAINS.map(
    (d) => `<option value="${d.id}">${d.name}</option>`
  ).join('');
}

document.getElementById('btn-add-modal').addEventListener('click', () => {
  populateModalSelects();
  addModal.classList.remove('hidden');
});
document.getElementById('btn-close-modal').addEventListener('click', () => addModal.classList.add('hidden'));
document.querySelectorAll('[data-modal-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-modal-tab]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.modalTab;
    formAttach.classList.toggle('hidden', tab !== 'attach');
    formNewStar.classList.toggle('hidden', tab !== 'newstar');
  });
});

formAttach.addEventListener('submit', (e) => {
  e.preventDefault();
  const nodeId = document.getElementById('attach-node-select').value;
  const title = document.getElementById('attach-title').value.trim();
  const url = document.getElementById('attach-url').value.trim();
  const type = document.getElementById('attach-type').value;
  const custom = loadCustomData();
  if (!custom.attachedResources[nodeId]) custom.attachedResources[nodeId] = [];
  custom.attachedResources[nodeId].push({ title, url, type });
  saveCustomData(custom);
  initGraphData();
  addModal.classList.add('hidden');
  formAttach.reset();
  switchView('histomap');
  selectNode(nodeId);
});

formNewStar.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('new-name').value.trim();
  const year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number(document.getElementById('new-year').value)));
  const domain = document.getElementById('new-domain').value;
  const type = document.getElementById('new-type').value;
  const org = document.getElementById('new-org').value.trim() || 'Community';
  const tagline = document.getElementById('new-tagline').value.trim();
  const url = document.getElementById('new-url').value.trim();
  const parentId = document.getElementById('new-parent').value;

  const id = `custom-${Date.now()}`;
  const custom = loadCustomData();
  custom.customNodes.push({
    id,
    name,
    year,
    domain,
    type,
    importance: 4,
    org,
    tagline,
    summary: tagline,
    xQuery: `${name} ML infra`,
    resources: url ? [{ title: 'Primary Link', type: url.includes('x.com') ? 'x' : 'blog', url }] : []
  });
  if (parentId) custom.customEdges.push({ source: parentId, target: id, label: 'inspired' });
  saveCustomData(custom);

  initGraphData();
  addModal.classList.add('hidden');
  formNewStar.reset();
  switchView('histomap');
  selectNode(id);
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(loadCustomData(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ml-infra-atlas-custom.json';
  a.click();
});

// ==================== KEYBOARD & RESIZE ====================
window.addEventListener('keydown', (e) => {
  const inInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT';
  if (e.key === '/' && !inInput) {
    e.preventDefault();
    searchInput.focus();
  } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && !inInput) {
    e.preventDefault();
    stopPlay();
    setActiveYear(Math.round(state.activeYear) + 1);
  } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && !inInput) {
    e.preventDefault();
    stopPlay();
    setActiveYear(Math.round(state.activeYear) - 1);
  } else if (e.key === 'Escape') {
    state.selectedNodeId = null;
    blogsDrawer.classList.add('hidden');
    addModal.classList.add('hidden');
    searchResults.classList.add('hidden');
    renderEditorialPanel();
  }
});

window.addEventListener('resize', () => {
  const { w, h } = getStageSize();
  camera.aspect = w / h;
  camera.position.z = w < 640 ? 198 : w < 900 ? 178 : 162;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ==================== 60FPS ANIMATION LOOP ====================
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const projVec = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Smoothly interpolate displayYear & gentle parallax tilt
  state.displayYear += (state.activeYear - state.displayYear) * 0.1;
  state.tiltX += (state.targetTiltX - state.tiltX) * 0.08;
  state.tiltY += (state.targetTiltY - state.tiltY) * 0.08;

  const { w: stageW, h: stageH } = getStageSize();

  // Slide the helical tunnel smoothly with generous margin away from the right sidebar
  const activeX = yearToX(state.displayYear);
  helixRoot.position.x = -18 - (activeX - 10) * 0.45;
  helixRoot.rotation.y = 0.42 + state.tiltY;
  helixRoot.rotation.x = 0.08 + state.tiltX;

  // Helical rotation driven smoothly by scrolling through time + ultra-gentle cosmic breath
  const scrollSpin = (state.displayYear - MIN_YEAR) * 0.22 + elapsed * 0.03;

  // 1. Update Blue Mosaic Helical Tiles
  for (let i = 0; i < TOTAL_TILES; i++) {
    const m = tileMeta[i];
    if (!m.visible) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      tileMesh.setMatrixAt(i, dummy.matrix);
      continue;
    }

    const x = yearToX(m.yr);
    const rad = yearToRadius(m.yr);
    const theta = m.baseAngle + scrollSpin;

    dummy.position.set(x, Math.cos(theta) * rad, Math.sin(theta) * rad);
    // Orient tile tangent to the cylinder surface
    dummy.lookAt(x, 0, 0);

    const distFromActive = Math.abs(m.yr - state.displayYear);
    const proximity = Math.max(0.18, 1 - distFromActive / 13);
    const futureFade = m.yr > state.displayYear + 1.2 ? 0.25 : 1;

    dummy.scale.set(m.scaleW * (0.75 + proximity * 0.35), m.scaleH * (0.75 + proximity * 0.35), 1);
    dummy.updateMatrix();
    tileMesh.setMatrixAt(i, dummy.matrix);

    tmpColor.copy(BLUE_PALETTE[m.colorIdx]);
    const brightness = (0.35 + proximity * 0.85) * futureFade;
    tmpColor.multiplyScalar(brightness);
    tileMesh.setColorAt(i, tmpColor);
  }
  tileMesh.instanceMatrix.needsUpdate = true;
  if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;

  // 2. Position Active Year Dashed Ring
  const activeR = yearToRadius(state.displayYear) + 2.2;
  activeRingLine.position.set(activeX, 0, 0);
  activeRingLine.scale.set(1, activeR, activeR);
  activeRingLine.rotation.x = elapsed * 0.08;

  // 3. Position 3D Milestone Cards on the Front-Facing Helical Arc + De-Collided Labels
  const focusId = state.hoveredNodeId || state.selectedNodeId;
  const labelCandidates = [];

  cardObjects.forEach((obj) => {
    const n = obj.node;
    const matchDom = isNodeMatchingDomain(n);
    const dist = Math.abs(n.year - state.displayYear);
    const isSelected = state.selectedNodeId === n.id;
    const isHovered = state.hoveredNodeId === n.id;

    obj.group.visible = matchDom;
    obj.labelEl.style.display = 'none';
    if (!matchDom) return;

    const x = yearToX(n.year);
    const rad = yearToRadius(n.year) + 3.2;
    const theta = obj.angle + (n.year - state.displayYear) * 0.22;
    obj.group.position.set(x, Math.sin(theta) * rad, Math.cos(theta) * rad);

    obj.group.quaternion.copy(helixRoot.quaternion).invert().multiply(camera.quaternion);

    const proximity = Math.max(0.28, 1 - dist / 11);
    const scale = isSelected || isHovered ? 1.48 : 0.42 + proximity * 0.92;
    obj.group.scale.setScalar(scale);
    obj.cardMat.opacity = isSelected || isHovered ? 1 : Math.max(0.18, proximity * 0.95);

    // Collect only the tight active-year candidates for non-overlapping labels
    if (isSelected || isHovered || dist <= 1.1) {
      obj.group.getWorldPosition(projVec);
      projVec.project(camera);
      if (projVec.z < 1 && projVec.z > -1) {
        const sx = (projVec.x * 0.5 + 0.5) * stageW;
        const sy = (-projVec.y * 0.5 + 0.5) * stageH;
        labelCandidates.push({ obj, dist, isSelected, isHovered, sx, sy });
      }
    }
  });

  // Pick at most 6 closest labels (always keeping hovered/selected), then resolve vertical collisions!
  labelCandidates.sort((a, b) => {
    const ap = a.isSelected || a.isHovered ? -10 : a.dist;
    const bp = b.isSelected || b.isHovered ? -10 : b.dist;
    return ap - bp;
  });
  const chosenLabels = labelCandidates.slice(0, 6).sort((a, b) => a.sy - b.sy);

  const minGap = 25;
  const minY = 58;
  const maxY = Math.max(minY + 40, stageH - 118);
  let lastY = minY - minGap;

  chosenLabels.forEach((item) => {
    let y = Math.max(minY, Math.min(maxY, item.sy));
    if (y < lastY + minGap) y = lastY + minGap;
    lastY = y;
    if (y > maxY) return; // never overflow into bottom histogram

    const labelX = Math.max(12, Math.min(stageW - 224, item.sx + 24));
    item.obj.labelEl.style.display = 'inline-flex';
    item.obj.labelEl.style.left = `${labelX}px`;
    item.obj.labelEl.style.top = `${y}px`;
    item.obj.labelEl.style.opacity =
      item.isSelected || item.isHovered ? '1' : String(Math.max(0.55, 1 - item.dist * 0.35));
    item.obj.labelEl.classList.toggle('active', item.isSelected || item.isHovered);
  });

  // 4. Update Curved Lineage Threads
  edgeObjects.forEach((eo) => {
    const vis = eo.srcObj.group.visible && eo.dstObj.group.visible;
    eo.line.visible = vis;
    if (!vis) return;

    const a = eo.srcObj.group.position;
    const b = eo.dstObj.group.position;
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.z += 5;

    const posAttr = eo.geo.attributes.position;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const omt = 1 - t;
      const px = omt * omt * a.x + 2 * omt * t * mid.x + t * t * b.x;
      const py = omt * omt * a.y + 2 * omt * t * mid.y + t * t * b.y;
      const pz = omt * omt * a.z + 2 * omt * t * mid.z + t * t * b.z;
      posAttr.setXYZ(i, px, py, pz);
    }
    posAttr.needsUpdate = true;

    const isHi = focusId && (eo.source === focusId || eo.target === focusId);
    eo.mat.opacity = focusId ? (isHi ? 0.85 : 0.03) : 0.1;
  });

  // 5. Project Key Year Labels along the top of the Helix Cylinder (inside left stage)
  yearLabelEls.forEach((yl) => {
    projVec.set(yl.x, yl.rad + 4.5, 0);
    helixRoot.localToWorld(projVec);
    projVec.project(camera);
    if (projVec.z < 1 && projVec.z > -1) {
      const sx = (projVec.x * 0.5 + 0.5) * stageW;
      const sy = (-projVec.y * 0.5 + 0.5) * stageH;
      const isCur = Math.abs(yl.yr - state.displayYear) < 1.2;
      yl.el.style.display = 'block';
      yl.el.style.left = `${sx}px`;
      yl.el.style.top = `${sy}px`;
      yl.el.classList.toggle('current', isCur);
    } else {
      yl.el.style.display = 'none';
    }
  });

  renderer.render(scene, camera);
}

// ==================== VIEW SWITCHING (HISTOMAP / OBSIDIAN BRAIN / LIVE INDEXER) ====================
let currentView = 'histomap';

const viewEls = {
  histomap: document.getElementById('view-histomap'),
  brain: document.getElementById('view-brain'),
  chapters: document.getElementById('view-chapters'),
  indexer: document.getElementById('view-indexer')
};

const brainInstance = createObsidianBrain({
  container: document.getElementById('brain-webgl'),
  labelsEl: document.getElementById('brain-labels'),
  notePanelEl: document.getElementById('brain-note-body'),
  onJumpToHistomap(nodeId) {
    switchView('histomap');
    selectNode(nodeId);
  }
});

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.main-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.view === viewName);
  });
  Object.entries(viewEls).forEach(([k, el]) => {
    el.classList.toggle('hidden', k !== viewName);
  });

  // Only show Histomap domain filter pills when in 3D Histomap view
  document.getElementById('domain-filters')?.classList.toggle('hidden', viewName !== 'histomap');

  if (viewName === 'brain') {
    brainInstance.start();
  } else {
    brainInstance.stop();
  }
  if (viewName === 'chapters') {
    renderChaptersView();
  } else if (stopChapterSim) {
    stopChapterSim();
    stopChapterSim = null;
  }
  if (viewName === 'indexer') {
    loadIndexedFeed();
  }
  syncUrlState();
}

document.querySelectorAll('.main-tab').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('btn-reset-pov')?.addEventListener('click', () => {
  state.targetTiltX = 0;
  state.targetTiltY = 0;
});

// Obsidian Brain Controls
document.getElementById('chk-guided')?.addEventListener('change', (e) => {
  brainInstance.setOptions({ guidedPath: e.target.checked });
});
document.getElementById('chk-milestones')?.addEventListener('change', (e) => {
  brainInstance.setOptions({ showMilestones: e.target.checked });
});
document.getElementById('chk-blogs')?.addEventListener('change', (e) => {
  brainInstance.setOptions({ showBlogs: e.target.checked });
});
document.getElementById('brain-spread')?.addEventListener('input', (e) => {
  brainInstance.setOptions({ spread: Number(e.target.value) });
});
document.getElementById('btn-brain-reset')?.addEventListener('click', () => {
  brainInstance.resetCamera();
});

// ==================== CHAPTER-WISE STUDY GUIDE + 3B1B FACTORY SIMULATIONS ====================
const CHAPTER_STORAGE_KEY = 'ml-infra-atlas-chapters-done-v1';
let activeChapterId = CHAPTERS[0].id;
let stopChapterSim = null;

function loadCompletedChapters() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHAPTER_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveCompletedChapters(set) {
  localStorage.setItem(CHAPTER_STORAGE_KEY, JSON.stringify([...set]));
}

function renderChaptersView() {
  const tocEl = document.getElementById('chapters-toc-list');
  const readerEl = document.getElementById('chapters-reader');
  const progEl = document.getElementById('chapters-progress');
  if (!tocEl || !readerEl) return;

  const doneSet = loadCompletedChapters();
  progEl.textContent = `${doneSet.size} / ${CHAPTERS.length} completed`;

  // Group chapters by Part
  let lastPart = '';
  tocEl.innerHTML = CHAPTERS.map((ch) => {
    const partHeader = ch.part !== lastPart ? `<div class="toc-part-label">${ch.part}</div>` : '';
    lastPart = ch.part;
    const isDone = doneSet.has(ch.id);
    const isActive = ch.id === activeChapterId;
    return `${partHeader}
      <button class="toc-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" data-ch="${ch.id}">
        <span class="toc-num">${isDone ? '✓' : ch.number}</span>
        <span>${ch.title}</span>
      </button>`;
  }).join('');

  tocEl.querySelectorAll('[data-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChapterId = btn.dataset.ch;
      renderChaptersView();
      readerEl.scrollTop = 0;
    });
  });

  const idx = CHAPTERS.findIndex((c) => c.id === activeChapterId);
  const ch = CHAPTERS[idx] || CHAPTERS[0];
  const prevCh = idx > 0 ? CHAPTERS[idx - 1] : null;
  const nextCh = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
  const isDone = doneSet.has(ch.id);

  const relMilestones = (ch.relatedMilestones || [])
    .map((id) => state.nodes.find((n) => n.id === id))
    .filter(Boolean);

  const factoryHtml = FACTORY_STATIONS.map((st, sIdx) => {
    const isFocus = st.chapters.includes(ch.id);
    const nonZeroChapters = st.chapters.filter((cid) => cid !== 'ch-0');
    const isMastered = nonZeroChapters.some((cid) => doneSet.has(cid));
    const targetCh = nonZeroChapters[0] || 'ch-0';
    const arrow = sIdx < FACTORY_STATIONS.length - 1 ? '<span class="factory-arrow">→</span>' : '';
    return `<button class="factory-node ${isFocus ? 'focus' : ''} ${isMastered ? 'mastered' : ''}" data-factory-ch="${targetCh}">${st.label}</button>${arrow}`;
  }).join('');

  readerEl.innerHTML = `
    <article class="chapter-article">
      <div class="factory-strip" title="ML Infra Factory — highlighted stations are the focus of this chapter">
        ${factoryHtml}
      </div>

      <div class="chapter-meta">
        <span>Chapter ${ch.number}</span>
        <span>·</span>
        <span>${ch.part}</span>
        <span>·</span>
        <span>${ch.readTime}</span>
      </div>
      <h1 class="chapter-title">${ch.title}</h1>
      <p class="chapter-intro">${ch.intro}</p>

      <div id="chapter-sim-mount"></div>

      ${ch.sections
        .map(
          (s) => `
        <section class="chapter-section">
          <h3>${s.heading}</h3>
          <p>${s.body}</p>
        </section>`
        )
        .join('')}

      <div class="practice-box">
        <h4>Hands-on experiments</h4>
        <ul class="practice-list">
          ${ch.practice.map((p) => `<li>${p}</li>`).join('')}
        </ul>
      </div>

      <div class="section-label">Primary readings</div>
      <div class="resource-list">
        ${ch.readings
          .map(
            (r) => `
          <a class="resource-link" href="${r.url}" target="_blank" rel="noopener">
            <span>${r.title}</span>
            <span class="res-tag">Read ↗</span>
          </a>`
          )
          .join('')}
      </div>

      <div class="section-label">Explore interactively</div>
      <div class="lineage-chips">
        <button class="lineage-btn" id="btn-ch-brain">Open in Knowledge Graph →</button>
        ${relMilestones
          .map((m) => `<button class="lineage-btn" data-ch-milestone="${m.id}">${m.name} (${m.year})</button>`)
          .join('')}
      </div>

      <div class="chapter-footer">
        <label class="complete-toggle">
          <input type="checkbox" id="chk-ch-done" ${isDone ? 'checked' : ''} />
          <span>Mark chapter as completed</span>
        </label>
        <div class="chapter-nav-btns">
          ${prevCh ? `<button class="nav-link" id="btn-ch-prev">← Ch ${prevCh.number}</button>` : ''}
          ${nextCh ? `<button class="nav-link primary" id="btn-ch-next">Next: Ch ${nextCh.number} →</button>` : ''}
        </div>
      </div>
    </article>
  `;

  if (stopChapterSim) {
    stopChapterSim();
    stopChapterSim = null;
  }
  const simMount = readerEl.querySelector('#chapter-sim-mount');
  if (simMount) {
    stopChapterSim = mountChapterSimulation({
      chapterId: ch.id,
      containerEl: simMount,
      onChallengeSolved(solvedChId) {
        const nextSet = loadCompletedChapters();
        if (!nextSet.has(solvedChId)) {
          nextSet.add(solvedChId);
          saveCompletedChapters(nextSet);
          progEl.textContent = `${nextSet.size} / ${CHAPTERS.length} completed`;
          tocEl.querySelector(`[data-ch="${solvedChId}"]`)?.classList.add('done');
          const numEl = tocEl.querySelector(`[data-ch="${solvedChId}"] .toc-num`);
          if (numEl) numEl.textContent = '✓';
          const chk = readerEl.querySelector('#chk-ch-done');
          if (chk) chk.checked = true;
        }
      }
    });
  }

  readerEl.querySelectorAll('[data-factory-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChapterId = btn.dataset.factoryCh;
      renderChaptersView();
      readerEl.scrollTop = 0;
    });
  });

  readerEl.querySelector('#chk-ch-done')?.addEventListener('change', (e) => {
    const nextSet = loadCompletedChapters();
    if (e.target.checked) nextSet.add(ch.id);
    else nextSet.delete(ch.id);
    saveCompletedChapters(nextSet);
    renderChaptersView();
  });

  readerEl.querySelector('#btn-ch-brain')?.addEventListener('click', () => {
    switchView('brain');
    if (ch.brainTopicId) brainInstance.focusNode(ch.brainTopicId);
  });

  readerEl.querySelectorAll('[data-ch-milestone]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView('histomap');
      selectNode(btn.dataset.chMilestone);
    });
  });

  readerEl.querySelector('#btn-ch-prev')?.addEventListener('click', () => {
    activeChapterId = prevCh.id;
    renderChaptersView();
    readerEl.scrollTop = 0;
  });

  readerEl.querySelector('#btn-ch-next')?.addEventListener('click', () => {
    activeChapterId = nextCh.id;
    renderChaptersView();
    readerEl.scrollTop = 0;
  });
}

// ==================== LIVE INDEXER TAB ====================
let indexerData = null;
let indexerTopicFilter = 'all';
let indexerPage = 1;
const INDEXER_PER_PAGE = 10;

async function loadIndexedFeed() {
  try {
    const res = await fetch('/api/feed');
    indexerData = await res.json();
    indexerPage = 1;
    renderIndexerView();
  } catch (err) {
    document.getElementById('indexer-status').textContent = `Failed to load feed: ${err.message}`;
  }
}

function renderIndexerView() {
  if (!indexerData) return;
  const statusEl = document.getElementById('indexer-status');
  const syncText = indexerData.lastSyncedAt
    ? `Last synced: ${new Date(indexerData.lastSyncedAt).toLocaleString()} · ${indexerData.items?.length || 0} indexed items`
    : `Starter index loaded (${indexerData.items?.length || 0} items). Click "Run Live Crawl" or run indexer.rb in your terminal to pull live RSS/arXiv/GitHub updates.`;
  statusEl.textContent = syncText;

  // Topic filter pills
  const filterWrap = document.getElementById('indexer-topic-filters');
  filterWrap.innerHTML =
    `<button class="dom-pill ${indexerTopicFilter === 'all' ? 'active' : ''}" data-itopic="all">All Topics</button>` +
    TOPIC_HUBS.map(
      (h) =>
        `<button class="dom-pill ${indexerTopicFilter === h.id ? 'active' : ''}" data-itopic="${h.id}">${h.short}</button>`
    ).join('');

  filterWrap.querySelectorAll('[data-itopic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      indexerTopicFilter = btn.dataset.itopic;
      indexerPage = 1;
      renderIndexerView();
    });
  });

  // Render paginated feed items
  const feedEl = document.getElementById('indexer-feed');
  const items = (indexerData.items || []).filter(
    (it) => indexerTopicFilter === 'all' || (it.topics || []).includes(indexerTopicFilter)
  );
  const totalPages = Math.max(1, Math.ceil(items.length / INDEXER_PER_PAGE));
  indexerPage = Math.max(1, Math.min(indexerPage, totalPages));
  const slice = items.slice((indexerPage - 1) * INDEXER_PER_PAGE, indexerPage * INDEXER_PER_PAGE);

  feedEl.innerHTML = slice.length
    ? slice
        .map((it) => {
          const dateStr = it.publishedAt ? it.publishedAt.slice(0, 10) : '';
          const topicChips = (it.topics || [])
            .map((tid) => {
              const hub = TOPIC_HUBS.find((h) => h.id === tid);
              return `<button class="lineage-btn" data-open-brain-topic="${tid}">${hub ? hub.short : tid}</button>`;
            })
            .join('');
          return `
            <article class="indexed-card">
              <div class="indexed-card-top">
                <a class="indexed-title" href="${it.url}" target="_blank" rel="noopener">${it.title} ↗</a>
                <span class="indexed-meta">${it.sourceName} · ${dateStr}</span>
              </div>
              <p class="indexed-summary">${it.summary || ''}</p>
              <div class="indexed-tags">${topicChips}</div>
            </article>`;
        })
        .join('') +
      (totalPages > 1
        ? `<div class="pagination-bar">
             <button class="page-btn" id="idx-prev" ${indexerPage <= 1 ? 'disabled' : ''}>← Prev</button>
             <span class="page-info">Page ${indexerPage} / ${totalPages} (${items.length} items)</span>
             <button class="page-btn" id="idx-next" ${indexerPage >= totalPages ? 'disabled' : ''}>Next →</button>
           </div>`
        : '')
    : `<p class="detail-summary">No indexed items match this topic yet.</p>`;

  feedEl.querySelector('#idx-prev')?.addEventListener('click', () => {
    indexerPage--;
    renderIndexerView();
  });
  feedEl.querySelector('#idx-next')?.addEventListener('click', () => {
    indexerPage++;
    renderIndexerView();
  });

  feedEl.querySelectorAll('[data-open-brain-topic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView('brain');
      brainInstance.focusNode(btn.dataset.openBrainTopic);
    });
  });

  // Render monitored sources list
  const sourcesEl = document.getElementById('indexer-sources');
  sourcesEl.innerHTML = (indexerData.sources || [])
    .map(
      (s) => `
      <div class="source-row">
        <span>${s.name}</span>
        <span class="source-status ${s.status === 'error' ? 'err' : ''}">
          ${s.status === 'ok' ? `${s.count} items` : s.status === 'error' ? 'offline' : s.kind}
        </span>
      </div>`
    )
    .join('');
}

document.getElementById('btn-sync-now')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync-now');
  btn.textContent = 'Refreshing...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/sync', { method: 'POST' });
    const data = await res.json();
    if (data.feed) {
      indexerData = data.feed;
      renderIndexerView();
    }
  } catch (err) {
    document.getElementById('indexer-status').textContent = `Crawl error: ${err.message}`;
  } finally {
    btn.textContent = 'Refresh feed';
    btn.disabled = false;
  }
});

function syncUrlState() {
  const params = new URLSearchParams();
  if (currentView !== 'histomap') params.set('view', currentView);
  if (state.selectedNodeId) params.set('node', state.selectedNodeId);
  else if (Math.round(state.activeYear) !== MAX_YEAR) params.set('year', String(Math.round(state.activeYear)));
  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', nextUrl);
}

document.getElementById('btn-share-x')?.addEventListener('click', () => {
  syncUrlState();
  const shareUrl = window.location.href;
  const selNode = state.selectedNodeId ? state.nodes.find((n) => n.id === state.selectedNodeId) : null;
  const text = selNode
    ? `Exploring ${selNode.name} (${selNode.year}) on ML Infra Atlas — interactive 3D Histomap & 3D Knowledge Brain (2006–2026):`
    : currentView === 'brain'
      ? `Check out the 3D Obsidian Knowledge Brain on ML Infra Atlas (10-step beginner roadmap from CUDA to vLLM, DeepSeek & RL infra):`
      : `Built ML Infra Atlas — an interactive 3D Helical Histomap (2006–2026) + 3D Knowledge Brain + live RSS/arXiv indexer for Machine Learning Infrastructure:`;
  window.open(
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    '_blank',
    'noopener'
  );
});

function applyInitialUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const node = params.get('node');
  const year = params.get('year');

  if (node && state.nodes.some((n) => n.id === node)) {
    selectNode(node);
  } else if (year && !isNaN(Number(year))) {
    setActiveYear(Number(year));
  }
  if (view && viewEls[view]) {
    switchView(view);
  }
}

// ==================== BOOT ====================
initGraphData();
applyInitialUrlParams();
animate();
