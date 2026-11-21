import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TOPIC_HUBS } from './brain-data.js';
import { DOMAINS, NODES, EDGES, BLOG_INDEX } from './data.js';

function createGlowSpriteTex() {
  const size = 96;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.28, 'rgba(125,211,252,0.42)');
  g.addColorStop(0.65, 'rgba(56,189,248,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function createObsidianBrain({ container, labelsEl, notePanelEl, onJumpToHistomap }) {
  let active = false;
  let rafId = null;

  const domainMap = new Map(DOMAINS.map((d) => [d.id, d]));
  const glowTex = createGlowSpriteTex();

  const brainState = {
    nodes: [],
    edges: [],
    nodeMap: new Map(),
    showMilestones: true,
    showBlogs: false,
    guidedPath: true,
    spread: 1.15,
    selectedId: 'topic-gpus',
    hoveredId: null,
    dragNode: null,
    camFly: null
  };

  // ==================== THREE.JS 3D SCENE ====================
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050816, 0.0022);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 1400);
  camera.position.set(0, 42, 168);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.screenSpacePanning = true;
  controls.minDistance = 24;
  controls.maxDistance = 460;
  controls.addEventListener('start', () => {
    brainState.camFly = null;
  });

  scene.add(new THREE.AmbientLight(0x94a3b8, 1.1));
  const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
  keyLight.position.set(60, 90, 80);
  scene.add(keyLight);

  // Subtle 3D background stars
  const starPos = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) {
    const r = 180 + Math.random() * 480;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    starPos[i * 3 + 2] = r * Math.cos(ph);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const bgStars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0x93c5fd, size: 1.0, transparent: true, opacity: 0.35, depthWrite: false })
  );
  scene.add(bgStars);

  const graphGroup = new THREE.Group();
  const nodesGroup = new THREE.Group();
  const edgesGroup = new THREE.Group();
  graphGroup.add(edgesGroup, nodesGroup);
  scene.add(graphGroup);

  const meshById = new Map();
  let edgeMeshes = [];

  function clearScene() {
    meshById.forEach((m) => {
      nodesGroup.remove(m.group);
      m.labelEl.remove();
    });
    meshById.clear();
    edgeMeshes.forEach((em) => edgesGroup.remove(em.line));
    edgeMeshes = [];
  }

  function createNodeVisual(n) {
    const dom = domainMap.get(n.domain);
    const color = new THREE.Color(
      n.kind === 'topic' ? '#e6c88a' : n.kind === 'blog' ? '#93c5fd' : dom?.color || '#cbd5e1'
    );

    const group = new THREE.Group();
    const r = n.kind === 'topic' ? 4.2 : n.kind === 'blog' ? 1.75 : 2.1 + (n.data.importance || 3) * 0.22;

    const geo =
      n.kind === 'topic'
        ? new THREE.IcosahedronGeometry(r, 1)
        : n.kind === 'blog'
          ? new THREE.OctahedronGeometry(r, 0)
          : new THREE.SphereGeometry(r, 16, 16);

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: n.kind === 'topic' ? 0.95 : 0.65,
      roughness: 0.3,
      metalness: 0.25
    });
    const core = new THREE.Mesh(geo, mat);
    group.add(core);

    let ring = null;
    if (n.kind === 'topic') {
      ring = new THREE.Mesh(
        new THREE.TorusGeometry(r * 1.65, 0.14, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
      );
      ring.rotation.x = Math.PI * 0.4;
      group.add(ring);
    }

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color,
        transparent: true,
        opacity: n.kind === 'topic' ? 0.72 : 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const baseGlow = r * (n.kind === 'topic' ? 4.4 : 3.2);
    glow.scale.set(baseGlow, baseGlow, 1);
    group.add(glow);

    // Forgiving invisible hit sphere for easy 3D clicking & dragging
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(r * 2.1, 10, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.userData.brainId = n.id;
    group.add(hitMesh);

    const labelEl = document.createElement('div');
    labelEl.className = `brain-3d-label ${n.kind === 'topic' ? 'topic' : ''}`;
    labelEl.textContent = n.label;
    labelEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectBrainNode(n.id, true);
    });
    labelEl.addEventListener('mouseenter', () => {
      brainState.hoveredId = n.id;
    });
    labelEl.addEventListener('mouseleave', () => {
      if (brainState.hoveredId === n.id) brainState.hoveredId = null;
    });
    labelsEl.appendChild(labelEl);

    group.position.set(n.x, n.y, n.z);
    nodesGroup.add(group);
    return { group, core, mat, ring, glow, hitMesh, labelEl, baseGlow };
  }

  function buildGraph() {
    clearScene();

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // 1. Place the 10 Beginner Topic Hubs along a gentle 3D ascending helix/spiral
    TOPIC_HUBS.forEach((hub, i) => {
      const t = i / (TOPIC_HUBS.length - 1);
      const ang = t * Math.PI * 2.2;
      const rad = 46;
      const n = {
        id: hub.id,
        kind: 'topic',
        step: hub.step,
        label: hub.short,
        fullTitle: hub.title,
        domain: hub.domain,
        level: hub.level,
        data: hub,
        x: Math.cos(ang) * rad,
        y: (t - 0.5) * 62,
        z: Math.sin(ang) * rad,
        vx: 0,
        vy: 0,
        vz: 0
      };
      nodes.push(n);
      nodeMap.set(n.id, n);
    });

    TOPIC_HUBS.forEach((hub) => {
      (hub.nextTopics || []).forEach((targetId) => {
        if (nodeMap.has(targetId)) edges.push({ source: hub.id, target: targetId, kind: 'path' });
      });
    });

    // 2. Milestones in 3D orbits around their Topic Hubs
    if (brainState.showMilestones) {
      NODES.forEach((m) => {
        const parentHubs = TOPIC_HUBS.filter((h) => h.milestones.includes(m.id));
        const anchor = parentHubs[0] ? nodeMap.get(parentHubs[0].id) : { x: 0, y: 0, z: 0 };
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dist = 20 + Math.random() * 22;
        const n = {
          id: m.id,
          kind: 'milestone',
          label: m.name,
          year: m.year,
          domain: m.domain,
          data: m,
          x: anchor.x + Math.sin(phi) * Math.cos(theta) * dist,
          y: anchor.y + Math.cos(phi) * dist,
          z: anchor.z + Math.sin(phi) * Math.sin(theta) * dist,
          vx: 0,
          vy: 0,
          vz: 0
        };
        nodes.push(n);
        nodeMap.set(n.id, n);
        parentHubs.forEach((h) => edges.push({ source: h.id, target: m.id, kind: 'topic-link' }));
      });

      EDGES.forEach((e) => {
        if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
          edges.push({ source: e.source, target: e.target, kind: 'lineage' });
        }
      });
    }

    // 3. Optional Blogs in 3D space
    if (brainState.showBlogs) {
      BLOG_INDEX.forEach((b) => {
        const anchor =
          (b.relatedNodes[0] && nodeMap.get(b.relatedNodes[0])) ||
          nodeMap.get(TOPIC_HUBS.find((h) => b.domains.includes(h.domain))?.id || 'topic-gpus');
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dist = 18 + Math.random() * 18;
        const n = {
          id: b.id,
          kind: 'blog',
          label: b.name,
          domain: b.domains[0] || 'frameworks',
          data: b,
          x: (anchor?.x || 0) + Math.sin(phi) * Math.cos(theta) * dist,
          y: (anchor?.y || 0) + Math.cos(phi) * dist,
          z: (anchor?.z || 0) + Math.sin(phi) * Math.sin(theta) * dist,
          vx: 0,
          vy: 0,
          vz: 0
        };
        nodes.push(n);
        nodeMap.set(n.id, n);
        b.relatedNodes.slice(0, 2).forEach((rn) => {
          if (nodeMap.has(rn)) edges.push({ source: b.id, target: rn, kind: 'blog-link' });
        });
      });
    }

    brainState.nodes = nodes;
    brainState.edges = edges;
    brainState.nodeMap = nodeMap;

    // Warm-start 3D force physics
    for (let i = 0; i < 85; i++) stepPhysics3D(0.75);

    nodes.forEach((n) => {
      meshById.set(n.id, createNodeVisual(n));
    });

    edges.forEach((e) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({
        color: e.kind === 'path' ? 0xe6c88a : 0x7dd3fc,
        transparent: true,
        opacity: e.kind === 'path' ? 0.55 : 0.16,
        depthWrite: false
      });
      const line = new THREE.Line(geo, mat);
      edgesGroup.add(line);
      edgeMeshes.push({ edge: e, geo, mat, line });
    });

    if (!nodeMap.has(brainState.selectedId)) brainState.selectedId = 'topic-gpus';
    renderNotePanel();
  }

  // ==================== 3D FORCE-DIRECTED PHYSICS ====================
  function stepPhysics3D(alpha = 0.25) {
    const nodes = brainState.nodes;
    const nodeMap = brainState.nodeMap;
    const sp = brainState.spread;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const d2 = dx * dx + dy * dy + dz * dz + 12;
        const baseRep = a.kind === 'topic' && b.kind === 'topic' ? 1450 : 320;
        const rep = (baseRep * sp * sp) / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * rep * alpha;
        const fy = (dy / d) * rep * alpha;
        const fz = (dz / d) * rep * alpha;
        if (a !== brainState.dragNode) {
          a.vx -= fx;
          a.vy -= fy;
          a.vz -= fz;
        }
        if (b !== brainState.dragNode) {
          b.vx += fx;
          b.vy += fy;
          b.vz += fz;
        }
      }
    }

    brainState.edges.forEach((e) => {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const targetDist = (e.kind === 'path' ? 44 : e.kind === 'topic-link' ? 28 : 38) * sp;
      const k = e.kind === 'path' ? 0.032 : e.kind === 'topic-link' ? 0.025 : 0.008;
      const force = (d - targetDist) * k * alpha;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      const fz = (dz / d) * force;
      if (a !== brainState.dragNode) {
        a.vx += fx;
        a.vy += fy;
        a.vz += fz;
      }
      if (b !== brainState.dragNode) {
        b.vx -= fx;
        b.vy -= fy;
        b.vz -= fz;
      }
    });

    nodes.forEach((n) => {
      if (n === brainState.dragNode) return;
      n.vx -= n.x * 0.0028 * alpha;
      n.vy -= n.y * 0.0028 * alpha;
      n.vz -= n.z * 0.0028 * alpha;
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.vz *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;
    });
  }

  // ==================== 3D RAYCASTING + GRAB & ELONGATE ====================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const dragIntersect = new THREE.Vector3();
  let downPos = { x: 0, y: 0 };

  function updatePointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function raycastNodes() {
    raycaster.setFromCamera(pointer, camera);
    const targets = [];
    meshById.forEach((m) => targets.push(m.hitMesh));
    const hits = raycaster.intersectObjects(targets, false);
    return hits.length ? hits[0].object.userData.brainId : null;
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (!active) return;
    downPos = { x: e.clientX, y: e.clientY };
    updatePointer(e);
    const hitId = raycastNodes();
    if (hitId) {
      const node = brainState.nodeMap.get(hitId);
      if (node) {
        brainState.dragNode = node;
        controls.enabled = false;
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(node.x, node.y, node.z));
      }
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!active) return;
    updatePointer(e);
    if (brainState.dragNode) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
        brainState.dragNode.x = dragIntersect.x;
        brainState.dragNode.y = dragIntersect.y;
        brainState.dragNode.z = dragIntersect.z;
        brainState.dragNode.vx = 0;
        brainState.dragNode.vy = 0;
        brainState.dragNode.vz = 0;
      }
      renderer.domElement.style.cursor = 'grabbing';
      return;
    }
    const hitId = raycastNodes();
    brainState.hoveredId = hitId;
    renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
  });

  window.addEventListener('pointerup', (e) => {
    if (!active) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (brainState.dragNode) {
      const id = brainState.dragNode.id;
      brainState.dragNode = null;
      controls.enabled = true;
      if (moved < 6) selectBrainNode(id, true);
    }
  });

  function flyToNode(node) {
    const target = new THREE.Vector3(node.x, node.y, node.z);
    const offset = new THREE.Vector3(16, 14, 58);
    brainState.camFly = {
      startPos: camera.position.clone(),
      endPos: target.clone().add(offset),
      startLook: controls.target.clone(),
      endLook: target,
      t: 0
    };
  }

  function selectBrainNode(id, fly = false) {
    const node = brainState.nodeMap.get(id);
    if (!node) return;
    brainState.selectedId = id;
    if (fly) flyToNode(node);
    renderNotePanel();
  }

  function getNeighbors(id) {
    const set = new Set([id]);
    brainState.edges.forEach((e) => {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    });
    return set;
  }

  // ==================== OBSIDIAN NOTE INSPECTOR ====================
  function renderNotePanel() {
    const node = brainState.nodeMap.get(brainState.selectedId);
    if (!node) return;

    if (node.kind === 'topic') {
      const hub = node.data;
      const seenMilestoneIds = new Set();
      const connectedMilestones = NODES.filter((m) => {
        if (!hub.milestones.includes(m.id) || seenMilestoneIds.has(m.id)) return false;
        seenMilestoneIds.add(m.id);
        return true;
      });

      const seenBlogUrls = new Set();
      const connectedBlogs = BLOG_INDEX.filter((b) => {
        const match = b.relatedNodes.some((rn) => hub.milestones.includes(rn));
        const key = (b.featuredPost?.url || b.url).replace(/\/+$/, '');
        if (!match || seenBlogUrls.has(key)) return false;
        seenBlogUrls.add(key);
        return true;
      }).slice(0, 6);

      const nextSet = new Set(hub.nextTopics || []);
      const nextHubs = TOPIC_HUBS.filter((h) => h.id !== hub.id && nextSet.has(h.id));
      const prevHubs = TOPIC_HUBS.filter(
        (h) => h.id !== hub.id && !nextSet.has(h.id) && (h.nextTopics || []).includes(hub.id)
      );

      notePanelEl.innerHTML = `
        <div class="brain-note-kicker">STEP ${hub.step} OF 10 · ${hub.level.toUpperCase()} GUIDE</div>
        <h2 class="detail-title">${hub.title}</h2>
        <p class="detail-summary">${hub.summary}</p>

        <div class="breakthrough-box">
          <div class="breakthrough-label">Beginner Mental Model</div>
          <div class="breakthrough-text">${hub.mentalModel}</div>
        </div>

        <div class="section-label">Key Concepts to Know</div>
        <div class="glossary-list">
          ${hub.glossary
            .map(
              (g) => `
            <div class="glossary-item">
              <strong>${g.term}</strong>
              <span>${g.def}</span>
            </div>`
            )
            .join('')}
        </div>

        <div class="section-label">[[Connected Milestones]] (${connectedMilestones.length})</div>
        <div class="lineage-chips">
          ${connectedMilestones
            .map((m) => `<button class="lineage-btn" data-brain-jump="${m.id}">[[${m.name}]]</button>`)
            .join('')}
        </div>

        ${
          connectedBlogs.length
            ? `<div class="section-label">Best Beginner &amp; Deep-Dive Readings</div>
               <div class="resource-list">
                 ${connectedBlogs
                   .map(
                     (b) => `
                   <a class="resource-link" href="${b.featuredPost?.url || b.url}" target="_blank" rel="noopener">
                     <span><strong>${b.name}</strong> — ${b.featuredPost?.title || b.org}</span>
                     <span class="res-tag">Read ↗</span>
                   </a>`
                   )
                   .join('')}
               </div>`
            : ''
        }

        <div class="section-label">Learning Path Navigation</div>
        <div class="lineage-chips">
          ${prevHubs.map((h) => `<button class="lineage-btn" data-brain-jump="${h.id}">← [[${h.short}]]</button>`).join('')}
          ${nextHubs.map((h) => `<button class="lineage-btn" data-brain-jump="${h.id}">[[${h.short}]] →</button>`).join('')}
        </div>
      `;
    } else if (node.kind === 'milestone') {
      const m = node.data;
      const parentHubs = TOPIC_HUBS.filter((h) => h.milestones.includes(m.id));
      const seenUrls = new Set(
        (m.resources || []).map((r) => r.url.replace(/\/+$/, ''))
      );
      const relatedBlogs = BLOG_INDEX.filter((b) => {
        if (!b.relatedNodes.includes(m.id)) return false;
        const u = (b.featuredPost?.url || b.url).replace(/\/+$/, '');
        if (seenUrls.has(u)) return false;
        seenUrls.add(u);
        return true;
      });

      notePanelEl.innerHTML = `
        <div class="brain-note-kicker">MILESTONE · ${m.year} · ${m.org || ''}</div>
        <h2 class="detail-title">${m.name}</h2>
        <p class="detail-summary">${m.summary || m.tagline}</p>

        ${
          m.breakthrough
            ? `<div class="breakthrough-box">
                <div class="breakthrough-label">Core Idea</div>
                <div class="breakthrough-text">${m.breakthrough}</div>
              </div>`
            : ''
        }

        <div style="margin-bottom:14px;">
          <button class="nav-link primary" id="btn-brain-to-helix">View ${m.year} in 3D Histomap →</button>
        </div>

        <div class="section-label">[[Parent Topic Hubs]]</div>
        <div class="lineage-chips">
          ${parentHubs.map((h) => `<button class="lineage-btn" data-brain-jump="${h.id}">[[${h.short}]]</button>`).join('')}
        </div>

        <div class="section-label">Sources, X Threads &amp; Blogs</div>
        <div class="resource-list">
          <a class="resource-link" href="${m.xSearchUrl}" target="_blank" rel="noopener">
            <span>𝕏 Search X Threads on ${m.name}</span>
            <span class="res-tag">X ↗</span>
          </a>
          ${(m.resources || [])
            .map(
              (r) => `
            <a class="resource-link" href="${r.url}" target="_blank" rel="noopener">
              <span>${r.title}</span>
              <span class="res-tag">${r.type} ↗</span>
            </a>`
            )
            .join('')}
          ${relatedBlogs
            .map(
              (b) => `
            <a class="resource-link" href="${b.featuredPost?.url || b.url}" target="_blank" rel="noopener">
              <span><strong>${b.name}</strong> — ${b.featuredPost?.title || b.org}</span>
              <span class="res-tag">Blog ↗</span>
            </a>`
            )
            .join('')}
        </div>
      `;

      notePanelEl.querySelector('#btn-brain-to-helix')?.addEventListener('click', () => {
        onJumpToHistomap(m.id);
      });
    } else if (node.kind === 'blog') {
      const b = node.data;
      notePanelEl.innerHTML = `
        <div class="brain-note-kicker">${b.category === 'engineer' ? 'ML ENGINEER BLOG' : 'RESEARCH LAB BLOG'} · ${b.org}</div>
        <h2 class="detail-title">${b.name}</h2>
        <p class="detail-summary">${b.description}</p>
        <div class="resource-list">
          <a class="resource-link" href="${b.url}" target="_blank" rel="noopener"><span>Blog Home</span><span class="res-tag">Open ↗</span></a>
          ${b.featuredPost ? `<a class="resource-link" href="${b.featuredPost.url}" target="_blank" rel="noopener"><span>${b.featuredPost.title}</span><span class="res-tag">Featured ↗</span></a>` : ''}
          ${b.xUrl ? `<a class="resource-link" href="${b.xUrl}" target="_blank" rel="noopener"><span>𝕏 Profile</span><span class="res-tag">X ↗</span></a>` : ''}
        </div>
        <div class="section-label">[[Connected Milestones]]</div>
        <div class="lineage-chips">
          ${b.relatedNodes
            .map((id) => NODES.find((x) => x.id === id))
            .filter(Boolean)
            .map((m) => `<button class="lineage-btn" data-brain-jump="${m.id}">[[${m.name}]]</button>`)
            .join('')}
        </div>
      `;
    }

    notePanelEl.querySelectorAll('[data-brain-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.brainJump;
        if (!brainState.nodeMap.has(id)) {
          brainState.showMilestones = true;
          buildGraph();
        }
        selectBrainNode(id, true);
      });
    });
  }

  // ==================== RESIZE & RENDER LOOP ====================
  function resize() {
    const w = Math.max(320, container.clientWidth || window.innerWidth - 400);
    const h = Math.max(240, container.clientHeight || window.innerHeight - 58);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', () => {
    if (active) resize();
  });

  const projVec = new THREE.Vector3();
  const clock = new THREE.Clock();

  function render() {
    if (!active) return;
    rafId = requestAnimationFrame(render);
    const dt = Math.min(clock.getDelta(), 0.05);

    stepPhysics3D(brainState.dragNode ? 0.35 : 0.18);

    const w = container.clientWidth || window.innerWidth - 400;
    const h = container.clientHeight || window.innerHeight - 58;
    const focusId = brainState.hoveredId || brainState.selectedId;
    const neighbors = focusId ? getNeighbors(focusId) : null;

    // Update 3D Node Meshes & Projected Labels
    brainState.nodes.forEach((n) => {
      const m = meshById.get(n.id);
      if (!m) return;
      m.group.position.set(n.x, n.y, n.z);
      if (m.ring) m.ring.rotation.z += dt * 0.45;
      m.core.rotation.y += dt * 0.35;

      const isSel = brainState.selectedId === n.id;
      const isHov = brainState.hoveredId === n.id;
      const isNbr = neighbors ? neighbors.has(n.id) : true;
      const dimmed = neighbors && !isNbr;

      const s = isSel || isHov ? 1.38 : 1;
      m.core.scale.setScalar(s);
      m.mat.emissiveIntensity = dimmed ? 0.16 : isSel || isHov ? 2.1 : n.kind === 'topic' ? 1.05 : 0.7;
      m.glow.material.opacity = dimmed ? 0.08 : isSel || isHov ? 0.95 : n.kind === 'topic' ? 0.72 : 0.4;

      projVec.set(n.x, n.y, n.z);
      const camDist = camera.position.distanceTo(projVec);
      projVec.project(camera);

      const inFront = projVec.z < 1 && projVec.z > -1;
      const showLabel =
        inFront &&
        (n.kind === 'topic' || isSel || isHov || (focusId && isNbr) || camDist < 105);

      if (showLabel && !dimmed) {
        const sx = (projVec.x * 0.5 + 0.5) * w;
        const sy = (-projVec.y * 0.5 + 0.5) * h;
        m.labelEl.style.display = 'block';
        m.labelEl.style.left = `${sx}px`;
        m.labelEl.style.top = `${sy - 12}px`;
        m.labelEl.style.opacity = isSel || isHov || n.kind === 'topic' ? '1' : '0.82';
        m.labelEl.classList.toggle('focused', isSel || isHov);
      } else {
        m.labelEl.style.display = 'none';
      }
    });

    // Update 3D Edges
    edgeMeshes.forEach(({ edge, geo, mat }) => {
      const a = brainState.nodeMap.get(edge.source);
      const b = brainState.nodeMap.get(edge.target);
      if (!a || !b) return;
      const pos = geo.attributes.position;
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;

      const isFocus = focusId && (edge.source === focusId || edge.target === focusId);
      const isPath = edge.kind === 'path' && brainState.guidedPath;
      mat.opacity = isFocus ? 0.88 : isPath ? 0.5 : focusId ? 0.04 : 0.14;
    });

    // Smooth camera fly-to
    if (brainState.camFly) {
      brainState.camFly.t += dt * 1.65;
      const ease = 1 - Math.pow(1 - Math.min(brainState.camFly.t, 1), 3);
      camera.position.lerpVectors(brainState.camFly.startPos, brainState.camFly.endPos, ease);
      controls.target.lerpVectors(brainState.camFly.startLook, brainState.camFly.endLook, ease);
      if (brainState.camFly.t >= 1) brainState.camFly = null;
    }

    bgStars.rotation.y += dt * 0.01;
    controls.update();
    renderer.render(scene, camera);
  }

  buildGraph();

  return {
    start() {
      active = true;
      resize();
      renderNotePanel();
      if (!rafId) rafId = requestAnimationFrame(render);
    },
    stop() {
      active = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    setOptions({ showMilestones, showBlogs, guidedPath, spread }) {
      let rebuild = false;
      if (typeof showMilestones === 'boolean' && showMilestones !== brainState.showMilestones) {
        brainState.showMilestones = showMilestones;
        rebuild = true;
      }
      if (typeof showBlogs === 'boolean' && showBlogs !== brainState.showBlogs) {
        brainState.showBlogs = showBlogs;
        rebuild = true;
      }
      if (typeof guidedPath === 'boolean') brainState.guidedPath = guidedPath;
      if (typeof spread === 'number') brainState.spread = spread;
      if (rebuild) buildGraph();
    },
    focusNode(id) {
      if (!brainState.nodeMap.has(id)) {
        brainState.showMilestones = true;
        buildGraph();
      }
      selectBrainNode(id, true);
    },
    resetCamera() {
      brainState.camFly = {
        startPos: camera.position.clone(),
        endPos: new THREE.Vector3(0, 42, 168 * Math.min(1.4, brainState.spread)),
        startLook: controls.target.clone(),
        endLook: new THREE.Vector3(0, 0, 0),
        t: 0
      };
    }
  };
}
