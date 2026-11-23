import {
  LEVEL_LABELS,
  SOCRATIC_BRANCHES,
  SOCRATIC_SUBSKILLS,
  DIAGNOSTIC_QUESTIONS,
  INTEGRATIVE_CAPSTONE
} from './socratic-data.js';

const STORAGE_KEY = 'ml-infra-handbook-socratic-v1';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function makeBar(ratio, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function defaultState() {
  const levels = {};
  const checks = {};
  const seenProbes = {};
  SOCRATIC_SUBSKILLS.forEach((s) => {
    levels[s.id] = 0;
    checks[s.id] = 0; // independent checks toward next level (needs 2)
    seenProbes[s.id] = [];
  });
  return {
    mode: 'intro', // 'intro' | 'diagnostic' | 'drill' | 'assessment'
    targetLevel: 4, // 4 = independent, 5 = full mastery
    levels,
    checks,
    seenProbes,
    focusId: SOCRATIC_SUBSKILLS[0].id,
    difficultyOffset: 0, // -1 easier, 0 normal, +1 harder
    turnCount: 0,
    diagnosticIndex: 0,
    diagnosticAnswers: {}, // id -> { chosen, correct }
    diagnosticDone: false,
    notes: [], // misconceptions / review notes
    activeQuestion: null, // { subskillId, probeId, isSpacedReview, attempts, phase: 'main'|'da'|'revealed'|'passed', lastWrongChoice, daFailed }
    assessment: null, // { items: [...], index, results: [] }
    showStateBox: false
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      levels: { ...base.levels, ...(parsed.levels || {}) },
      checks: { ...base.checks, ...(parsed.checks || {}) },
      seenProbes: { ...base.seenProbes, ...(parsed.seenProbes || {}) }
    };
  } catch {
    return defaultState();
  }
}

export function createSocraticTutor({ containerEl, onOpenChapter, onOpenBrainTopic, onStateChange }) {
  let st = loadState();
  let stateFeedback = '';

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch {}
    if (typeof onStateChange === 'function') onStateChange();
  }

  function getSubskill(id) {
    return SOCRATIC_SUBSKILLS.find((s) => s.id === id) || SOCRATIC_SUBSKILLS[0];
  }

  function getOverallRatio() {
    const sum = SOCRATIC_SUBSKILLS.reduce((acc, s) => acc + (st.levels[s.id] || 0), 0);
    return sum / (SOCRATIC_SUBSKILLS.length * 5);
  }

  function allAtTarget() {
    return SOCRATIC_SUBSKILLS.every((s) => (st.levels[s.id] || 0) >= st.targetLevel);
  }

  function pickRecommendedFocus() {
    const firstBelow = SOCRATIC_SUBSKILLS.find((s) => (st.levels[s.id] || 0) < st.targetLevel);
    return firstBelow ? firstBelow.id : SOCRATIC_SUBSKILLS[0].id;
  }

  function renderAsciiMap() {
    const ASCII_LABELS = {
      'gpu-roofline': 'GPU & Roofline',
      'kernels-tiling': 'Kernels & Tiling',
      'frameworks-autograd': 'PyTorch & Compilers',
      'precision-quant': 'Precision & Quant',
      'distributed-parallel': 'Distributed Parallel',
      'inference-serving': 'Inference & KV Cache',
      'disagg-speculative': 'Disagg & Speculative',
      'clusters-rl-infra': 'Clusters & RLVR'
    };
    const overall = getOverallRatio();
    const pct = Math.round(overall * 100);
    const header = `ML Infra Skill Map       overall: ${makeBar(overall, 10)} ${String(pct).padStart(3)}%`;
    const rule = '--------------------------------------------------';
    const rows = SOCRATIC_SUBSKILLS.map((s, idx) => {
      const lvl = st.levels[s.id] || 0;
      const bar = makeBar(lvl / 5, 10);
      const label = ASCII_LABELS[s.id] || s.short;
      const name = `${idx + 1}. ${label}`.slice(0, 23).padEnd(24, ' ');
      let tag = '';
      if (s.id === st.focusId) tag = ' <- focus';
      else if (lvl >= 5) tag = ' ★';
      else if (lvl >= 4) tag = ' *';
      return `${name}[${bar}] ${lvl}/5${tag}`;
    });
    return [header, rule, ...rows, rule].join('\n');
  }

  function buildSaveStateText() {
    const mapLines = SOCRATIC_SUBSKILLS.map((s) => `  - ${s.id}: ${st.levels[s.id] || 0}/5 (${LEVEL_LABELS[st.levels[s.id] || 0]})`).join('\n');
    const noteLines = st.notes.length
      ? st.notes.slice(-6).map((n) => `  - ${n}`).join('\n')
      : '  - None recorded yet';
    return [
      'resume from:',
      `topic: ML Infrastructure (target: ${st.targetLevel}/5)`,
      `current_focus: ${st.focusId}`,
      'skill_map:',
      mapLines,
      'notes:',
      noteLines
    ].join('\n');
  }

  function parseResumeState(text) {
    const lines = String(text || '').split(/\r?\n/);
    let updated = 0;
    const nextLevels = { ...st.levels };
    let nextFocus = st.focusId;
    let nextTarget = st.targetLevel;
    const nextNotes = [];
    let inNotes = false;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (/^notes:/i.test(line)) {
        inNotes = true;
        continue;
      }
      if (/^skill_map:/i.test(line)) {
        inNotes = false;
        continue;
      }
      const targetMatch = line.match(/target:\s*([45])\s*\/5/i);
      if (targetMatch) nextTarget = Number(targetMatch[1]);

      const focusMatch = line.match(/^current_focus:\s*([a-z0-9-]+)/i);
      if (focusMatch && SOCRATIC_SUBSKILLS.some((s) => s.id === focusMatch[1])) {
        nextFocus = focusMatch[1];
      }

      if (inNotes && line.startsWith('-')) {
        const clean = line.replace(/^-\s*/, '').trim();
        if (clean && !/^none recorded/i.test(clean)) nextNotes.push(clean.slice(0, 140));
        continue;
      }

      const skillMatch = line.match(/^-?\s*([a-z0-9-]+)\s*:\s*([0-5])\s*\/5/i);
      if (skillMatch && Object.prototype.hasOwnProperty.call(nextLevels, skillMatch[1])) {
        nextLevels[skillMatch[1]] = Number(skillMatch[2]);
        updated++;
      }
    }

    if (updated === 0) return false;
    st.levels = nextLevels;
    st.focusId = nextFocus;
    st.targetLevel = nextTarget;
    if (nextNotes.length) st.notes = nextNotes.slice(-8);
    st.diagnosticDone = true;
    st.mode = 'drill';
    st.activeQuestion = null;
    st.showStateBox = false;
    ensureActiveQuestion();
    save();
    return true;
  }

  function pickProbeFor(subskillId, isSpacedReview = false) {
    const sub = getSubskill(subskillId);
    const lvl = st.levels[subskillId] || 0;
    const desiredTier = Math.max(1, Math.min(4, Math.min(lvl + 1, 4) + st.difficultyOffset));
    const seen = new Set(st.seenProbes[subskillId] || []);

    // Prefer unseen probes near desiredTier
    const candidates = [...sub.probes].sort((a, b) => {
      const aSeen = seen.has(a.id) ? 1 : 0;
      const bSeen = seen.has(b.id) ? 1 : 0;
      if (aSeen !== bSeen) return aSeen - bSeen;
      return Math.abs(a.tier - desiredTier) - Math.abs(b.tier - desiredTier);
    });

    const chosen = candidates[0];
    return {
      subskillId,
      probeId: chosen.id,
      isSpacedReview,
      attempts: 0,
      phase: 'main',
      lastWrongChoice: null,
      daFailed: false,
      feedback: ''
    };
  }

  function ensureActiveQuestion(forceNew = false) {
    if (st.activeQuestion && !forceNew) return;
    st.turnCount = (st.turnCount || 0) + 1;

    // Interleave spaced review every 3 turns without warning if any other subskill is >= 2
    const reviewCandidates = SOCRATIC_SUBSKILLS.filter(
      (s) => s.id !== st.focusId && (st.levels[s.id] || 0) >= 2
    );
    const shouldSpacedReview = st.turnCount % 3 === 0 && reviewCandidates.length > 0;

    if (shouldSpacedReview) {
      const pick = reviewCandidates[st.turnCount % reviewCandidates.length];
      st.activeQuestion = pickProbeFor(pick.id, true);
    } else {
      st.activeQuestion = pickProbeFor(st.focusId, false);
    }
  }

  function completeDiagnostic() {
    // Score diagnostic -> place levels 0..3 conservatively (levels 4-5 must be earned in drill!)
    const score = (id) => (st.diagnosticAnswers[id]?.correct ? 1 : 0);
    const d1 = score('diag-1');
    const d2 = score('diag-2');
    const d3 = score('diag-3');
    const d4 = score('diag-4');
    const d5 = score('diag-5');

    st.levels['gpu-roofline'] = d1 ? 2 : 0;
    st.levels['frameworks-autograd'] = d2 ? 2 : (d1 ? 1 : 0);
    st.levels['precision-quant'] = d2 ? 2 : 0;
    st.levels['kernels-tiling'] = d3 ? 2 : (d1 ? 1 : 0);
    st.levels['distributed-parallel'] = d4 ? 2 : (d2 ? 1 : 0);
    st.levels['inference-serving'] = d5 ? 2 : (d1 ? 1 : 0);
    st.levels['disagg-speculative'] = d5 ? 2 : 0;
    st.levels['clusters-rl-infra'] = d5 && d4 ? 2 : (d5 ? 1 : 0);

    st.notes = [];
    if (!d1) st.notes.push('Diagnostic: review roofline math (HBM bandwidth vs FLOPs in B=1 decode).');
    if (!d2) st.notes.push('Diagnostic: review BF16+AdamW training VRAM breakdown (16 bytes/param).');
    if (!d3) st.notes.push('Diagnostic: review FlashAttention SRAM tiling vs HBM O(N^2) traffic.');
    if (!d4) st.notes.push('Diagnostic: review NVLink vs IB placement and FSDP vs DDP traffic.');
    if (!d5) st.notes.push('Diagnostic: review prefill-decode interference & async RL rollouts.');

    st.diagnosticDone = true;
    st.focusId = pickRecommendedFocus();
    st.mode = 'drill';
    st.activeQuestion = null;
    ensureActiveQuestion(true);
    save();
  }

  function startFinalAssessment() {
    const items = SOCRATIC_SUBSKILLS.map((sub) => {
      const highestProbe = sub.probes[sub.probes.length - 1];
      return {
        kind: 'subskill',
        subskillId: sub.id,
        label: sub.short,
        question: highestProbe.question,
        options: highestProbe.options,
        correct: highestProbe.correct,
        explanation: highestProbe.explanation
      };
    });
    items.push({
      kind: 'capstone',
      subskillId: null,
      label: INTEGRATIVE_CAPSTONE.kind,
      question: INTEGRATIVE_CAPSTONE.question,
      options: INTEGRATIVE_CAPSTONE.options,
      correct: INTEGRATIVE_CAPSTONE.correct,
      explanation: INTEGRATIVE_CAPSTONE.explanation
    });
    st.assessment = { items, index: 0, results: [] };
    st.mode = 'assessment';
    save();
  }

  function recordSubskillPass(subskillId, probeId, wasSpacedReview) {
    const seen = new Set(st.seenProbes[subskillId] || []);
    seen.add(probeId);
    st.seenProbes[subskillId] = [...seen];

    const curLvl = st.levels[subskillId] || 0;
    if (curLvl >= 5) return { leveledUp: false, newLevel: 5 };

    st.checks[subskillId] = (st.checks[subskillId] || 0) + 1;
    // Strict rule: 2 independent checks to earn a level (or 1 if spaced review confirming an existing check)
    const needed = curLvl === 0 ? 1 : 2;
    if (st.checks[subskillId] >= needed) {
      st.levels[subskillId] = Math.min(5, curLvl + 1);
      st.checks[subskillId] = 0;
      if (!wasSpacedReview && st.levels[subskillId] >= st.targetLevel) {
        st.focusId = pickRecommendedFocus();
      }
      return { leveledUp: true, newLevel: st.levels[subskillId] };
    }
    return { leveledUp: false, newLevel: curLvl };
  }

  function getActiveProbeObj() {
    if (!st.activeQuestion) return null;
    const sub = getSubskill(st.activeQuestion.subskillId);
    return sub.probes.find((p) => p.id === st.activeQuestion.probeId) || sub.probes[0];
  }

  function handleMainOption(choiceIdx) {
    const aq = st.activeQuestion;
    const probe = getActiveProbeObj();
    if (!aq || !probe || aq.phase !== 'main') return;

    if (choiceIdx === probe.correct) {
      // Challenge with Devil's Advocate if level >= 2 or tier >= 3, so correct answers are defended under pressure
      const lvl = st.levels[aq.subskillId] || 0;
      if (probe.devilsAdvocate && (lvl >= 2 || probe.tier >= 2 || aq.isSpacedReview)) {
        aq.phase = 'da';
        aq.feedback = "Right answer — now defend it under pressure.";
      } else {
        const res = recordSubskillPass(aq.subskillId, probe.id, aq.isSpacedReview);
        aq.phase = 'passed';
        aq.feedback = res.leveledUp
          ? `Confirmed. Level raised to ${res.newLevel}/5 (${LEVEL_LABELS[res.newLevel]}).`
          : `Correct (${st.checks[aq.subskillId]}/2 independent checks toward Level ${Math.min(5, (st.levels[aq.subskillId] || 0) + 1)}).`;
      }
    } else {
      aq.attempts += 1;
      aq.lastWrongChoice = choiceIdx;
      const sub = getSubskill(aq.subskillId);

      if (aq.isSpacedReview && aq.attempts === 1) {
        // Strict spaced review rule: fail lowers level by 1 and revisits
        const prev = st.levels[aq.subskillId] || 0;
        if (prev > 0) {
          st.levels[aq.subskillId] = prev - 1;
          st.checks[aq.subskillId] = 0;
          st.focusId = aq.subskillId;
        }
        st.notes = [...st.notes.slice(-7), `Spaced review miss on ${sub.short} — dropped to ${st.levels[aq.subskillId]}/5 to revisit.`];
      }

      if (aq.attempts === 1) {
        aq.feedback = probe.narrowing;
      } else if (aq.attempts === 2) {
        aq.feedback = probe.secondHint;
      } else {
        aq.phase = 'revealed';
        aq.feedback = probe.explanation;
        st.notes = [...st.notes.slice(-7), `Revisit ${sub.short}: ${probe.kind.toLowerCase()} probe needed explanation.`];
      }
    }
    save();
    render();
  }

  function handleDevilsAdvocate(daIdx) {
    const aq = st.activeQuestion;
    const probe = getActiveProbeObj();
    if (!aq || !probe || aq.phase !== 'da') return;

    if (daIdx === probe.daCorrect) {
      const res = recordSubskillPass(aq.subskillId, probe.id, aq.isSpacedReview);
      aq.phase = 'passed';
      aq.feedback = res.leveledUp
        ? `Defended cleanly. Level raised to ${res.newLevel}/5 (${LEVEL_LABELS[res.newLevel]}).`
        : `Defended cleanly (${st.checks[aq.subskillId]}/2 checks toward Level ${Math.min(5, (st.levels[aq.subskillId] || 0) + 1)}).`;
    } else {
      aq.daFailed = true;
      aq.phase = 'revealed';
      aq.feedback = `Not quite on the follow-up. ${probe.explanation} Re-testing this subskill from another angle next.`;
      const sub = getSubskill(aq.subskillId);
      st.notes = [...st.notes.slice(-7), `Edge-case gap in ${sub.short} during devil's advocate probe.`];
    }
    save();
    render();
  }

  function renderIntro() {
    return `
      <div class="tutor-shell">
        <div class="tutor-hero">
          <div class="tutor-kicker">Modeled on Jane Street's Socratic Tutor · 2 Branches · 8 Subskills</div>
          <h1 class="tutor-title">ML Infra Socratic Learning Path</h1>
          <p class="tutor-intro">
            Instead of passive reading, this tutor diagnoses where you actually stand and teaches one question at a time — asking you to predict hardware behavior, spot flaws in plausible claims, defend answers under pressure, and retain concepts through unannounced spaced review.
          </p>
          <div class="tutor-cta-row">
            <button id="btn-start-diagnostic" class="nav-link primary">Start 5-Question Diagnostic →</button>
            <button id="btn-skip-to-map" class="nav-link">Open Skill Map directly</button>
            <button id="btn-toggle-resume" class="nav-link">Resume saved state</button>
          </div>
        </div>

        ${st.showStateBox ? renderStateBox() : ''}

        <div class="tutor-branches">
          ${SOCRATIC_BRANCHES.map((br) => {
            const subs = SOCRATIC_SUBSKILLS.filter((s) => s.branchId === br.id);
            return `
              <div class="tutor-branch-card">
                <div class="tutor-branch-head">
                  <h3>${escapeHtml(br.title)}</h3>
                  <p>${escapeHtml(br.subtitle)}</p>
                </div>
                <div class="tutor-sub-list">
                  ${subs
                    .map((s) => {
                      const num = SOCRATIC_SUBSKILLS.findIndex((x) => x.id === s.id) + 1;
                      return `
                        <div class="tutor-sub-row">
                          <div class="tutor-sub-num">${num}</div>
                          <div class="tutor-sub-info">
                            <strong>${escapeHtml(s.short)}</strong>
                            <span>${escapeHtml(s.summary)}</span>
                          </div>
                          <button class="lineage-btn" data-open-chapter="${s.chapterId}">Read ${s.chapterId.replace('ch-', 'Ch ')} →</button>
                        </div>`;
                    })
                    .join('')}
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderDiagnostic() {
    const q = DIAGNOSTIC_QUESTIONS[st.diagnosticIndex];
    if (!q) {
      completeDiagnostic();
      return renderDrill();
    }
    const pct = Math.round((st.diagnosticIndex / DIAGNOSTIC_QUESTIONS.length) * 100);
    return `
      <div class="tutor-shell tutor-narrow">
        <div class="tutor-diag-top">
          <span class="tutor-kicker">${escapeHtml(q.label)} · ${escapeHtml(q.difficulty)}</span>
          <button id="btn-diag-cancel" class="back-btn">Exit diagnostic</button>
        </div>
        <div class="tutor-progress-bar"><div class="tutor-progress-fill" style="width:${pct}%"></div></div>
        <p class="tutor-note-inline">No lecturing during diagnostic — answer based on what you know right now so your starting skill map is accurate.</p>

        <div class="tutor-q-card">
          <h2 class="tutor-q-text">${escapeHtml(q.question)}</h2>
          <div class="tutor-options">
            ${q.options
              .map(
                (opt, i) => `
              <button class="tutor-opt-btn" data-diag-opt="${i}">
                <span class="tutor-opt-key">${String.fromCharCode(65 + i)}</span>
                <span>${escapeHtml(opt)}</span>
              </button>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderStateBox() {
    const stateText = buildSaveStateText();
    return `
      <div class="tutor-state-box">
        <div class="tutor-state-head">
          <strong>Save / Resume State (compatible with janestreet/agent_skills/socratic-tutor)</strong>
          <button id="btn-close-state" class="back-btn">Close</button>
        </div>
        <p class="tutor-note-inline">Copy this block to continue your session in any AI coding agent with Jane Street's <code>socratic-tutor</code> skill — or paste a saved state block below to restore your levels here.</p>
        <textarea id="tutor-state-textarea" class="tutor-textarea" rows="11">${escapeHtml(stateText)}</textarea>
        <div class="tutor-state-actions">
          <button id="btn-copy-state" class="nav-link primary">Copy state block</button>
          <button id="btn-apply-state" class="nav-link">Load pasted state</button>
          ${stateFeedback ? `<span class="tutor-inline-status">${escapeHtml(stateFeedback)}</span>` : ''}
        </div>
      </div>
    `;
  }

  function renderDrill() {
    ensureActiveQuestion();
    const aq = st.activeQuestion;
    const probe = getActiveProbeObj();
    const activeSub = getSubskill(aq.subskillId);
    const curLvl = st.levels[aq.subskillId] || 0;
    const focusSub = getSubskill(st.focusId);

    const diffLabel = st.difficultyOffset < 0 ? 'Easier' : st.difficultyOffset > 0 ? 'Harder' : 'Standard';

    return `
      <div class="tutor-shell">
        <div class="tutor-grid">
          <!-- Left: Live ASCII Skill Map + Subskill Navigator -->
          <aside class="tutor-sidebar">
            <div class="tutor-map-card">
              <div class="tutor-map-top">
                <span class="tutor-kicker">Skill Map (Levels 0–5)</span>
                <div class="tutor-target-toggle">
                  <button class="mini-pov-btn ${st.targetLevel === 4 ? 'active-chip' : ''}" data-target-lvl="4">Goal 4/5</button>
                  <button class="mini-pov-btn ${st.targetLevel === 5 ? 'active-chip' : ''}" data-target-lvl="5">Goal 5/5</button>
                </div>
              </div>
              <pre class="tutor-ascii">${escapeHtml(renderAsciiMap())}</pre>
              <div class="tutor-legend">0 unaware · 1 heard · 2 follow · 3 w/ help · 4 independent · 5 teach/edge cases</div>
            </div>

            <div class="tutor-sub-picker">
              <div class="section-label" style="margin-top:0;">Choose focus (click to override)</div>
              ${SOCRATIC_SUBSKILLS.map((s, idx) => {
                const lvl = st.levels[s.id] || 0;
                const isFocus = s.id === st.focusId;
                return `
                  <div class="tutor-pick-row ${isFocus ? 'active' : ''}">
                    <button class="tutor-pick-main" data-pick-focus="${s.id}">
                      <span class="tutor-pick-num">${idx + 1}</span>
                      <span class="tutor-pick-name">${escapeHtml(s.short)}</span>
                      <span class="tutor-pick-lvl">${lvl}/5</span>
                    </button>
                    <button class="tutor-pick-link" data-open-chapter="${s.chapterId}" title="Open matching chapter">${s.chapterId.replace('ch-', 'Ch ')}</button>
                  </div>`;
              }).join('')}
            </div>

            <div class="tutor-side-actions">
              <button id="btn-retake-diag" class="nav-link">Retake diagnostic</button>
              <button id="btn-toggle-state" class="nav-link">Save / Resume state</button>
              <button id="btn-final-assess" class="nav-link ${allAtTarget() ? 'primary' : ''}">
                ${allAtTarget() ? 'Run Final Assessment →' : 'Final Assessment'}
              </button>
            </div>
          </aside>

          <!-- Right: One-Question-At-A-Time Socratic Loop -->
          <div class="tutor-main">
            ${st.showStateBox ? renderStateBox() : ''}

            <div class="tutor-cmd-bar">
              <div class="tutor-cmd-meta">
                <span class="chip">${aq.isSpacedReview ? 'Spaced review' : escapeHtml(probe.kind)}</span>
                <span class="chip">${escapeHtml(activeSub.short)} · L${curLvl}/5</span>
                <span class="chip">Difficulty: ${diffLabel}</span>
              </div>
              <div class="tutor-cmd-btns">
                <button id="btn-cmd-easier" class="mini-pov-btn">Easier</button>
                <button id="btn-cmd-harder" class="mini-pov-btn">Harder</button>
                <button id="btn-cmd-tell" class="mini-pov-btn">Just tell me</button>
              </div>
            </div>

            <div class="tutor-q-card">
              ${
                aq.isSpacedReview
                  ? `<div class="tutor-review-banner">Unannounced spaced review — revisiting <strong>${escapeHtml(activeSub.short)}</strong> to verify retention. Missing drops its level by 1.</div>`
                  : ''
              }

              <h2 class="tutor-q-text">${escapeHtml(probe.question)}</h2>

              ${
                aq.phase === 'main'
                  ? `
                <div class="tutor-options">
                  ${probe.options
                    .map(
                      (opt, i) => `
                    <button class="tutor-opt-btn ${aq.lastWrongChoice === i ? 'wrong-pick' : ''}" data-main-opt="${i}">
                      <span class="tutor-opt-key">${String.fromCharCode(65 + i)}</span>
                      <span>${escapeHtml(opt)}</span>
                    </button>`
                    )
                    .join('')}
                </div>
                ${
                  aq.feedback
                    ? `<div class="tutor-probe-box warn">
                         <div class="tutor-probe-label">Socratic follow-up (attempt ${aq.attempts}/3)</div>
                         <p>${escapeHtml(aq.feedback)}</p>
                       </div>`
                    : ''
                }
              `
                  : aq.phase === 'da'
                    ? `
                <div class="tutor-probe-box challenge">
                  <div class="tutor-probe-label">Devil's advocate — defend your reasoning</div>
                  <p>${escapeHtml(probe.devilsAdvocate)}</p>
                </div>
                <div class="tutor-options">
                  ${probe.daOptions
                    .map(
                      (opt, i) => `
                    <button class="tutor-opt-btn" data-da-opt="${i}">
                      <span class="tutor-opt-key">${String.fromCharCode(65 + i)}</span>
                      <span>${escapeHtml(opt)}</span>
                    </button>`
                    )
                    .join('')}
                </div>
              `
                    : `
                <div class="tutor-probe-box ${aq.phase === 'passed' ? 'ok' : 'info'}">
                  <div class="tutor-probe-label">${aq.phase === 'passed' ? 'Check passed' : 'Direct explanation'}</div>
                  <p>${escapeHtml(aq.feedback)}</p>
                  ${aq.phase === 'passed' ? `<p class="tutor-exp-sub">${escapeHtml(probe.explanation)}</p>` : ''}
                </div>
                <div class="tutor-next-row">
                  <button id="btn-next-q" class="nav-link primary">Next question →</button>
                  <button class="nav-link" data-open-chapter="${activeSub.chapterId}">Study ${activeSub.chapterId.replace('ch-', 'Ch ')} →</button>
                  <button class="nav-link" data-open-brain="${activeSub.brainTopicId}">Open in Graph</button>
                </div>
              `
              }
            </div>

            <div class="tutor-path-footer">
              <div>
                <strong>Recommended next step:</strong> Focus on <strong>${escapeHtml(focusSub.short)}</strong> (currently ${st.levels[focusSub.id] || 0}/5 · goal ${st.targetLevel}/5).
              </div>
              <div class="lineage-chips" style="margin-top:8px;">
                <button class="lineage-btn" data-open-chapter="${focusSub.chapterId}">Open ${focusSub.chapterId.replace('ch-', 'Chapter ')} →</button>
                <button class="lineage-btn" data-open-brain="${focusSub.brainTopicId}">Explore in Knowledge Graph →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAssessment() {
    const as = st.assessment;
    if (!as) {
      st.mode = 'drill';
      return renderDrill();
    }

    if (as.index >= as.items.length) {
      const passedCount = as.results.filter((r) => r.correct).length;
      const total = as.items.length;
      const passedAll = passedCount >= total - 1 && as.results[total - 1]?.correct;
      const missed = as.results.filter((r) => !r.correct);

      return `
        <div class="tutor-shell tutor-narrow">
          <div class="tutor-q-card">
            <div class="tutor-kicker">Final Mixed Assessment · Complete</div>
            <h2 class="tutor-title" style="margin-top:6px;">Score: ${passedCount} / ${total}</h2>
            <p class="tutor-intro" style="margin-bottom:16px;">
              ${
                passedAll
                  ? 'Strong mastery across single-GPU physics, distributed collectives, serving engines, and RL post-training.'
                  : 'Not ready to close the course yet — review the weak areas below and re-enter the Socratic loop.'
              }
            </p>
            <pre class="tutor-ascii">${escapeHtml(renderAsciiMap())}</pre>
            ${
              missed.length
                ? `<div class="section-label">Weakest areas to revisit</div>
                   <div class="tutor-missed-list">
                     ${missed
                       .map(
                         (m) => `
                       <div class="tutor-missed-item">
                         <strong>${escapeHtml(m.label)}</strong>
                         <span>${escapeHtml(m.explanation)}</span>
                       </div>`
                       )
                       .join('')}
                   </div>`
                : ''
            }
            <div class="tutor-cta-row" style="margin-top:18px;">
              <button id="btn-back-drill" class="nav-link primary">Return to Socratic Loop →</button>
              <button id="btn-toggle-state" class="nav-link">Export Save State</button>
            </div>
          </div>
          ${st.showStateBox ? renderStateBox() : ''}
        </div>
      `;
    }

    const item = as.items[as.index];
    const pct = Math.round((as.index / as.items.length) * 100);
    return `
      <div class="tutor-shell tutor-narrow">
        <div class="tutor-diag-top">
          <span class="tutor-kicker">Final Assessment · ${as.index + 1} / ${as.items.length} · ${escapeHtml(item.label)}</span>
          <button id="btn-back-drill" class="back-btn">Exit assessment</button>
        </div>
        <div class="tutor-progress-bar"><div class="tutor-progress-fill" style="width:${pct}%"></div></div>
        <div class="tutor-q-card">
          <h2 class="tutor-q-text">${escapeHtml(item.question)}</h2>
          <div class="tutor-options">
            ${item.options
              .map(
                (opt, i) => `
              <button class="tutor-opt-btn" data-assess-opt="${i}">
                <span class="tutor-opt-key">${String.fromCharCode(65 + i)}</span>
                <span>${escapeHtml(opt)}</span>
              </button>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    containerEl.querySelector('#btn-start-diagnostic')?.addEventListener('click', () => {
      st.mode = 'diagnostic';
      st.diagnosticIndex = 0;
      st.diagnosticAnswers = {};
      st.showStateBox = false;
      save();
      render();
    });

    containerEl.querySelector('#btn-skip-to-map')?.addEventListener('click', () => {
      st.mode = 'drill';
      st.activeQuestion = null;
      ensureActiveQuestion(true);
      save();
      render();
    });

    containerEl.querySelector('#btn-toggle-resume')?.addEventListener('click', () => {
      st.showStateBox = !st.showStateBox;
      stateFeedback = '';
      render();
    });

    containerEl.querySelector('#btn-diag-cancel')?.addEventListener('click', () => {
      st.mode = st.diagnosticDone ? 'drill' : 'intro';
      save();
      render();
    });

    containerEl.querySelectorAll('[data-diag-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = DIAGNOSTIC_QUESTIONS[st.diagnosticIndex];
        const chosen = Number(btn.dataset.diagOpt);
        st.diagnosticAnswers[q.id] = { chosen, correct: chosen === q.correct };
        st.diagnosticIndex += 1;
        if (st.diagnosticIndex >= DIAGNOSTIC_QUESTIONS.length) {
          completeDiagnostic();
        } else {
          save();
        }
        render();
      });
    });

    containerEl.querySelectorAll('[data-main-opt]').forEach((btn) => {
      btn.addEventListener('click', () => handleMainOption(Number(btn.dataset.mainOpt)));
    });

    containerEl.querySelectorAll('[data-da-opt]').forEach((btn) => {
      btn.addEventListener('click', () => handleDevilsAdvocate(Number(btn.dataset.daOpt)));
    });

    containerEl.querySelector('#btn-next-q')?.addEventListener('click', () => {
      st.activeQuestion = null;
      ensureActiveQuestion(true);
      save();
      render();
    });

    containerEl.querySelectorAll('[data-pick-focus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        st.focusId = btn.dataset.pickFocus;
        st.activeQuestion = pickProbeFor(st.focusId, false);
        save();
        render();
      });
    });

    containerEl.querySelectorAll('[data-target-lvl]').forEach((btn) => {
      btn.addEventListener('click', () => {
        st.targetLevel = Number(btn.dataset.targetLvl);
        save();
        render();
      });
    });

    containerEl.querySelector('#btn-cmd-easier')?.addEventListener('click', () => {
      st.difficultyOffset = Math.max(-1, st.difficultyOffset - 1);
      st.activeQuestion = pickProbeFor(st.focusId, false);
      save();
      render();
    });

    containerEl.querySelector('#btn-cmd-harder')?.addEventListener('click', () => {
      st.difficultyOffset = Math.min(1, st.difficultyOffset + 1);
      st.activeQuestion = pickProbeFor(st.focusId, false);
      save();
      render();
    });

    containerEl.querySelector('#btn-cmd-tell')?.addEventListener('click', () => {
      const aq = st.activeQuestion;
      const probe = getActiveProbeObj();
      if (!aq || !probe) return;
      aq.phase = 'revealed';
      aq.feedback = probe.explanation;
      save();
      render();
    });

    containerEl.querySelector('#btn-retake-diag')?.addEventListener('click', () => {
      st.mode = 'diagnostic';
      st.diagnosticIndex = 0;
      st.diagnosticAnswers = {};
      save();
      render();
    });

    containerEl.querySelector('#btn-final-assess')?.addEventListener('click', () => {
      startFinalAssessment();
      render();
    });

    containerEl.querySelectorAll('[data-assess-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const as = st.assessment;
        const item = as.items[as.index];
        const chosen = Number(btn.dataset.assessOpt);
        const correct = chosen === item.correct;
        as.results.push({ label: item.label, correct, explanation: item.explanation, subskillId: item.subskillId });
        if (item.subskillId && !correct && (st.levels[item.subskillId] || 0) > 1) {
          st.levels[item.subskillId] -= 1;
          st.focusId = item.subskillId;
        }
        as.index += 1;
        save();
        render();
      });
    });

    containerEl.querySelector('#btn-back-drill')?.addEventListener('click', () => {
      st.mode = 'drill';
      st.activeQuestion = null;
      ensureActiveQuestion(true);
      save();
      render();
    });

    containerEl.querySelector('#btn-toggle-state')?.addEventListener('click', () => {
      st.showStateBox = !st.showStateBox;
      stateFeedback = '';
      render();
    });

    containerEl.querySelector('#btn-close-state')?.addEventListener('click', () => {
      st.showStateBox = false;
      render();
    });

    containerEl.querySelector('#btn-copy-state')?.addEventListener('click', async () => {
      const ta = containerEl.querySelector('#tutor-state-textarea');
      try {
        await navigator.clipboard.writeText(ta.value);
        stateFeedback = 'Copied to clipboard.';
      } catch {
        ta.select();
        stateFeedback = 'Selected — press Cmd+C / Ctrl+C to copy.';
      }
      render();
    });

    containerEl.querySelector('#btn-apply-state')?.addEventListener('click', () => {
      const ta = containerEl.querySelector('#tutor-state-textarea');
      const ok = parseResumeState(ta?.value || '');
      stateFeedback = ok ? 'State restored.' : 'Could not parse skill_map lines (expected `- gpu-roofline: 3/5`).';
      render();
    });

    containerEl.querySelectorAll('[data-open-chapter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof onOpenChapter === 'function') onOpenChapter(btn.dataset.openChapter);
      });
    });

    containerEl.querySelectorAll('[data-open-brain]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof onOpenBrainTopic === 'function') onOpenBrainTopic(btn.dataset.openBrain);
      });
    });
  }

  function render() {
    if (!containerEl) return;
    if (st.mode === 'diagnostic') containerEl.innerHTML = renderDiagnostic();
    else if (st.mode === 'drill') containerEl.innerHTML = renderDrill();
    else if (st.mode === 'assessment') containerEl.innerHTML = renderAssessment();
    else containerEl.innerHTML = renderIntro();
    bindEvents();
  }

  function focusSubskill(subskillId) {
    if (SOCRATIC_SUBSKILLS.some((s) => s.id === subskillId)) {
      st.focusId = subskillId;
    }
    st.mode = 'drill';
    st.showStateBox = false;
    st.activeQuestion = pickProbeFor(st.focusId, false);
    save();
    render();
  }

  function startDiagnostic() {
    st.mode = 'diagnostic';
    st.diagnosticIndex = 0;
    st.diagnosticAnswers = {};
    st.showStateBox = false;
    save();
    render();
  }

  function getProgressPct() {
    return Math.round(getOverallRatio() * 100);
  }

  return { render, focusSubskill, startDiagnostic, getProgressPct };
}
