// 3Blue1Brown-inspired Interactive Canvas Animations & Factory Pipeline for Chapters
// Mathematically centered layouts, clean vector arrows, live data packets, and interactive challenges.

export const FACTORY_STATIONS = [
  { id: 'cluster',  label: '1. Cluster & Data',   chapters: ['ch-0', 'ch-9', 'ch-10'] },
  { id: 'serving',  label: '2. Serving Engine',   chapters: ['ch-0', 'ch-7', 'ch-8'] },
  { id: 'fabric',   label: '3. NVLink / Network', chapters: ['ch-0', 'ch-6'] },
  { id: 'hbm',      label: '4. HBM Memory',       chapters: ['ch-0', 'ch-1', 'ch-4', 'ch-5'] },
  { id: 'compute',  label: '5. SRAM & Cores',     chapters: ['ch-0', 'ch-1', 'ch-2', 'ch-3'] }
];

const C = {
  bg: '#090e1a',
  panel: '#101829',
  border: 'rgba(255,255,255,0.1)',
  blue: '#58c4dd',
  blueDim: 'rgba(88, 196, 221, 0.2)',
  amber: '#f4b942',
  amberDim: 'rgba(244, 185, 66, 0.22)',
  mint: '#5cd6a0',
  mintDim: 'rgba(92, 214, 160, 0.2)',
  coral: '#f07178',
  text: '#e5e7eb',
  muted: '#8b95a7'
};

function roundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBox(ctx, x, y, w, h, title, subtitle, accent = C.blue) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = accent;
  ctx.stroke();

  ctx.font = '600 11.5px Inter, sans-serif';
  ctx.fillStyle = C.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + w / 2, y + 21);

  if (subtitle) {
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillStyle = C.muted;
    ctx.fillText(subtitle, x + w / 2, y + 36);
  }
}

function drawFooter(ctx, w, h, text, color = C.muted) {
  ctx.font = '500 11.5px "JetBrains Mono", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, w / 2, h - 16);
}

function drawArrow(ctx, x1, y1, x2, y2, color = 'rgba(255,255,255,0.25)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6.5 * Math.cos(ang - 0.45), y2 - 6.5 * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - 6.5 * Math.cos(ang + 0.45), y2 - 6.5 * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}

export function mountChapterSimulation({ chapterId, containerEl, onChallengeSolved }) {
  const configs = {
    'ch-0': {
      title: 'The ML Infra Factory: End-to-End Request & Training Flow',
      challenge: 'Switch between Inference and Training mode to compare how the 5 stations work together.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-fmode="inference">Inference (Serving a Prompt)</button>
          <button class="sim-btn" data-fmode="training">Training (Updating Weights)</button>
        </div>`,
      state: { mode: 'inference', seenTraining: false, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-fmode]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-fmode]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.mode = b.dataset.fmode;
            if (st.mode === 'training') st.seenTraining = true;
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const isTrain = st.mode === 'training';
        if (st.seenTraining && !st.solved) {
          st.solved = true;
          markSolved();
        }

        const stations = [
          { title: isTrain ? 'Cluster' : 'Prompt', sub: isTrain ? 'K8s / Slurm' : 'API Input', color: C.blue },
          { title: isTrain ? 'Data Loader' : 'Serving', sub: isTrain ? 'Batches' : 'vLLM / SGLang', color: C.blue },
          { title: 'Fabric', sub: 'NVLink / IB', color: C.amber },
          { title: 'HBM Vault', sub: isTrain ? 'Weights+Grad' : 'Weights+KV', color: C.amber },
          { title: 'SRAM & Cores', sub: 'Matmuls', color: C.mint }
        ];

        const gap = 16;
        const pad = 26;
        const bw = (w - pad * 2 - gap * 4) / 5;
        const bh = 84;
        const y = 44;

        stations.forEach((s, i) => {
          const x = pad + i * (bw + gap);
          drawBox(ctx, x, y, bw, bh, s.title, s.sub, s.color);

          const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * 3.2 - i * 0.6));
          roundRect(ctx, x + 12, y + 52, bw - 24, 16, 4);
          ctx.fillStyle = `rgba(88, 196, 221, ${0.12 + pulse * 0.28})`;
          ctx.fill();

          if (i < stations.length - 1) {
            drawArrow(ctx, x + bw + 3, y + bh / 2, x + bw + gap - 3, y + bh / 2, 'rgba(255,255,255,0.32)');
          }
        });

        // Forward packet traveling left -> right
        const p = (t * 0.32) % 1;
        const totalSpan = w - pad * 2 - bw;
        const fx = pad + bw / 2 + p * totalSpan;
        ctx.beginPath();
        ctx.arc(fx, y + bh / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = isTrain ? C.amber : C.blue;
        ctx.fill();

        // Centered return arc
        const x0 = w - pad - bw / 2;
        const y0 = y + bh + 8;
        const xc = w / 2;
        const yc = y + bh + 60;
        const x2 = pad + bw / 2;
        const y2 = y + bh + 8;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(xc, yc, x2, y2);
        ctx.strokeStyle = isTrain ? 'rgba(244, 185, 66, 0.48)' : 'rgba(92, 214, 160, 0.48)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        const rp = (t * 0.38 + 0.5) % 1;
        const omt = 1 - rp;
        const rx = omt * omt * x0 + 2 * omt * rp * xc + rp * rp * x2;
        const ry = omt * omt * y0 + 2 * omt * rp * yc + rp * rp * y2;
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isTrain ? C.amber : C.mint;
        ctx.fill();

        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.fillStyle = isTrain ? C.amber : C.mint;
        ctx.textAlign = 'center';
        ctx.fillText(
          isTrain ? 'Backward Pass: AllReduce Gradients → Update Weights in HBM' : 'Stream Generated Output Tokens Back to User',
          w / 2,
          y + bh + 52
        );

        drawFooter(
          ctx,
          w,
          h,
          isTrain
            ? 'Training focus: MFU, HBM capacity & NVLink/IB gradient sync'
            : 'Inference focus: TTFT (prefill compute) & TPOT (HBM bandwidth)',
          C.muted
        );
      }
    },

    'ch-1': {
      title: 'HBM → SRAM → Tensor Cores (Roofline Simulator)',
      challenge: 'Increase Batch Size until Tensor Core utilization passes 80% (compute-bound).',
      controlsHtml: `
        <label class="sim-ctrl">
          <span>Batch size: <strong id="sim-val-batch">1</strong></span>
          <input type="range" id="sim-batch" min="1" max="512" value="1" step="1" />
        </label>`,
      state: { batch: 1, solved: false },
      bind(el, st) {
        el.querySelector('#sim-batch')?.addEventListener('input', (e) => {
          st.batch = Number(e.target.value);
          el.querySelector('#sim-val-batch').textContent = String(st.batch);
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const ai = Math.min(420, st.batch * 1.15);
        const util = Math.min(98, Math.round((ai / 295) * 100));
        if (util >= 80 && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const bound = util >= 80 ? 'Compute-bound' : 'Memory-bound (waiting on HBM)';

        const bw = Math.min(160, (w - 130) / 3);
        const bh = 138;
        const y = 46;
        const x1 = 30;
        const x2 = w / 2 - bw / 2;
        const x3 = w - bw - 30;

        drawBox(ctx, x1, y, bw, bh, 'HBM3 Memory', '80 GB · 3.35 TB/s', C.amber);
        drawBox(ctx, x2, y, bw, bh, 'On-Chip SRAM', '~50 MB · 20+ TB/s', C.blue);
        drawBox(ctx, x3, y, bw, bh, 'Tensor Cores', '989 TFLOPS (BF16)', util >= 80 ? C.mint : C.coral);

        // Centered 5x3 weight grid inside HBM
        const hw = 5 * 20 + 4 * 4;
        const hStartX = x1 + (bw - hw) / 2;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            roundRect(ctx, hStartX + c * 24, y + 54 + r * 22, 18, 16, 3);
            ctx.fillStyle = C.amberDim;
            ctx.fill();
            ctx.strokeStyle = C.amber;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Centered 4 SRAM tiles
        const sw = 4 * 22 + 3 * 6;
        const sStartX = x2 + (bw - sw) / 2;
        for (let i = 0; i < 4; i++) {
          const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i));
          roundRect(ctx, sStartX + i * 28, y + 66, 22, 44, 4);
          ctx.fillStyle = `rgba(88, 196, 221, ${0.18 + pulse * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.stroke();
        }

        // Centered 4x4 Tensor Core grid
        const tw = 4 * 20 + 3 * 5;
        const tStartX = x3 + (bw - tw) / 2;
        const activeCores = Math.max(1, Math.round((util / 100) * 16));
        for (let i = 0; i < 16; i++) {
          const r = Math.floor(i / 4);
          const c = i % 4;
          const lit = i < activeCores;
          const glow = lit ? 0.55 + 0.45 * Math.sin(t * 6 + i * 0.6) : 0.1;
          roundRect(ctx, tStartX + c * 25, y + 50 + r * 19, 19, 14, 3);
          ctx.fillStyle = lit ? `rgba(92, 214, 160, ${glow})` : 'rgba(255,255,255,0.06)';
          ctx.fill();
        }

        // HBM -> SRAM packets
        drawArrow(ctx, x1 + bw + 6, y + bh / 2, x2 - 6, y + bh / 2, 'rgba(244,185,66,0.45)');
        for (let i = 0; i < 4; i++) {
          const p = (t * 0.45 + i * 0.25) % 1;
          const px = x1 + bw + 10 + p * (x2 - x1 - bw - 20);
          roundRect(ctx, px - 5, y + bh / 2 - 4.5, 10, 9, 2.5);
          ctx.fillStyle = C.amber;
          ctx.fill();
        }

        // SRAM -> Cores packets
        drawArrow(ctx, x2 + bw + 6, y + bh / 2, x3 - 6, y + bh / 2, 'rgba(88,196,221,0.55)');
        const sramPackets = Math.min(8, 2 + Math.floor(util / 15));
        for (let i = 0; i < sramPackets; i++) {
          const p = (t * 1.4 + i / sramPackets) % 1;
          const px = x2 + bw + 10 + p * (x3 - x2 - bw - 20);
          ctx.beginPath();
          ctx.arc(px, y + bh / 2 + Math.sin(i * 2) * 8, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = C.blue;
          ctx.fill();
        }

        drawFooter(
          ctx,
          w,
          h,
          `Tensor Core Utilization: ${util}% · ${bound} · ${Math.round(ai)} FLOPs/byte`,
          util >= 80 ? C.mint : C.amber
        );
      }
    },

    'ch-2': {
      title: 'Kernel Fusion: Unfused PyTorch Ops vs. Fused Triton Kernel',
      challenge: 'Switch to Fused Triton Kernel to cut HBM memory round-trips by 3×.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-mode="unfused">Unfused (3 kernels)</button>
          <button class="sim-btn" data-mode="fused">Fused Triton (1 kernel)</button>
        </div>`,
      state: { mode: 'unfused', solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-mode]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-mode]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.mode = b.dataset.mode;
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const fused = st.mode === 'fused';
        if (fused && !st.solved) {
          st.solved = true;
          markSolved();
        }

        const pad = 32;
        drawBox(ctx, pad, 24, w - pad * 2, 46, 'HBM Global Memory (Slow · 3.35 TB/s)', '', C.amber);
        drawBox(
          ctx,
          pad,
          144,
          w - pad * 2,
          68,
          fused ? 'Fused Triton Kernel in On-Chip SRAM' : '3 Separate GPU Kernels (Read/Write HBM Every Step)',
          '',
          fused ? C.mint : C.blue
        );

        const ops = ['1. Mul (x·a)', '2. Add (+b)', '3. ReLU'];
        const innerW = w - pad * 2 - 40;
        const segW = innerW / 3;

        ops.forEach((label, i) => {
          const cx = pad + 20 + i * segW + segW / 2;
          roundRect(ctx, cx - 54, 174, 108, 26, 5);
          ctx.fillStyle = fused ? C.mintDim : C.blueDim;
          ctx.fill();
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText(label, cx, 191);

          if (!fused) {
            drawArrow(ctx, cx - 16, 72, cx - 16, 140, 'rgba(244,185,66,0.55)');
            drawArrow(ctx, cx + 16, 140, cx + 16, 72, 'rgba(240,113,120,0.55)');
            const p = (t * 0.9 + i * 0.33) % 1;
            ctx.fillStyle = C.amber;
            ctx.beginPath();
            ctx.arc(cx - 16, 76 + p * 60, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.coral;
            ctx.beginPath();
            ctx.arc(cx + 16, 136 - p * 60, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (i < 2) {
            drawArrow(ctx, cx + 56, 187, cx + segW - 56, 187, C.mint);
          }
        });

        if (fused) {
          const startX = pad + 20 + segW / 2;
          const endX = pad + 20 + 2 * segW + segW / 2;
          drawArrow(ctx, startX, 72, startX, 140, C.mint);
          drawArrow(ctx, endX, 140, endX, 72, C.mint);
          const p = (t * 1.1) % 1;
          ctx.fillStyle = C.mint;
          ctx.beginPath();
          ctx.arc(startX, 76 + p * 60, 4.5, 0, Math.PI * 2);
          ctx.arc(endX, 136 - p * 60, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        drawFooter(
          ctx,
          w,
          h,
          fused ? 'HBM Traffic: 1 Read + 1 Write (3.0× faster)' : 'HBM Traffic: 3 Reads + 3 Writes (Memory-bound)',
          fused ? C.mint : C.coral
        );
      }
    },

    'ch-3': {
      title: 'CPU Dispatch Overhead: Eager Mode vs. torch.compile / XLA',
      challenge: 'Enable Graph Compilation to remove GPU idle gaps between kernels.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-comp="eager">PyTorch Eager</button>
          <button class="sim-btn" data-comp="compiled">torch.compile / XLA</button>
        </div>`,
      state: { comp: 'eager', solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-comp]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-comp]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.comp = b.dataset.comp;
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const compiled = st.comp === 'compiled';
        if (compiled && !st.solved) {
          st.solved = true;
          markSolved();
        }

        const pad = 32;
        const trackW = w - pad * 2;

        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText('CPU (Python Dispatch)', pad, 42);
        ctx.fillText('GPU Execution Timeline', pad, 130);

        roundRect(ctx, pad, 50, trackW, 40, 6);
        ctx.fillStyle = C.panel;
        ctx.fill();
        roundRect(ctx, pad, 138, trackW, 48, 6);
        ctx.fill();

        const sweep = pad + 10 + ((t * 140) % (trackW - 20));

        if (!compiled) {
          const seg = (trackW - 24) / 6;
          for (let i = 0; i < 6; i++) {
            const x = pad + 12 + i * seg;
            const bw = Math.min(56, seg * 0.62);
            roundRect(ctx, x, 59, bw, 22, 4);
            ctx.fillStyle = C.amberDim;
            ctx.fill();
            ctx.strokeStyle = C.amber;
            ctx.stroke();

            const gx = x + seg * 0.28;
            roundRect(ctx, gx, 149, Math.min(38, seg * 0.44), 26, 4);
            ctx.fillStyle = C.blueDim;
            ctx.fill();
            ctx.strokeStyle = C.blue;
            ctx.stroke();

            drawArrow(ctx, x + bw / 2, 83, gx + 14, 146, 'rgba(244,185,66,0.35)');
          }
        } else {
          roundRect(ctx, pad + 12, 59, 80, 22, 4);
          ctx.fillStyle = C.mintDim;
          ctx.fill();
          ctx.strokeStyle = C.mint;
          ctx.stroke();
          drawArrow(ctx, pad + 52, 83, pad + 72, 146, C.mint);

          roundRect(ctx, pad + 12, 149, trackW - 24, 26, 5);
          ctx.fillStyle = 'rgba(92, 214, 160, 0.25)';
          ctx.fill();
          ctx.strokeStyle = C.mint;
          ctx.stroke();
          ctx.font = '500 11.5px Inter, sans-serif';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText('Fused Compiled Graph (Zero Idle Bubbles)', w / 2, 166);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sweep, 46);
        ctx.lineTo(sweep, 192);
        ctx.stroke();

        drawFooter(
          ctx,
          w,
          h,
          compiled ? 'GPU Busy: 94% · Python dispatch overhead eliminated' : 'GPU Busy: 41% · Idle gaps waiting on Python CPU dispatch',
          compiled ? C.mint : C.amber
        );
      }
    },

    'ch-4': {
      title: 'Attention Memory Wall: Naive O(N²) vs. FlashAttention SRAM Tiling',
      challenge: 'Enable FlashAttention to keep the N×N attention scores out of HBM.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-attn="naive">Naive Attention O(N²)</button>
          <button class="sim-btn" data-attn="flash">FlashAttention O(N)</button>
        </div>`,
      state: { attn: 'naive', solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-attn]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-attn]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.attn = b.dataset.attn;
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const flash = st.attn === 'flash';
        if (flash && !st.solved) {
          st.solved = true;
          markSolved();
        }

        const bw = Math.min(200, (w - 130) / 2);
        const bh = 162;
        const y = 34;
        const x1 = 36;
        const x2 = w - 36 - bw;

        drawBox(ctx, x1, y, bw, bh, 'HBM Memory', flash ? 'Only Q, K, V, O stored' : 'Giant N×N Matrix in HBM', flash ? C.mint : C.coral);
        drawBox(ctx, x2, y, bw, bh, 'On-Chip SRAM', flash ? 'Online Softmax Tile' : 'Underutilized', C.blue);

        // Centered 6x6 matrix inside left HBM box
        const gridN = 6;
        const cell = 13;
        const step = 15;
        const gridW = gridN * step - 2;
        const gx = x1 + (bw - gridW) / 2;
        const gy = y + 58;
        const activeTile = Math.floor(t * 2.5) % (gridN * gridN);
        const tr = Math.floor(activeTile / gridN);
        const tc = activeTile % gridN;

        for (let r = 0; r < gridN; r++) {
          for (let c = 0; c < gridN; c++) {
            roundRect(ctx, gx + c * step, gy + r * step, cell, cell, 2);
            if (!flash) {
              ctx.fillStyle = 'rgba(240, 113, 120, 0.45)';
              ctx.fill();
            } else {
              ctx.fillStyle = r === tr && c === tc ? C.blue : 'rgba(255,255,255,0.06)';
              ctx.fill();
            }
          }
        }

        drawArrow(ctx, x1 + bw + 8, y + bh / 2 - 8, x2 - 8, y + bh / 2 - 8, flash ? C.mint : C.coral);
        if (flash) {
          const tw = 112;
          const th = 72;
          const tx = x2 + (bw - tw) / 2;
          const ty = y + 66;
          roundRect(ctx, tx, ty, tw, th, 6);
          ctx.fillStyle = C.blueDim;
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.stroke();
          ctx.font = '500 11px "JetBrains Mono", monospace';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText(`Tile [${tr},${tc}]`, tx + tw / 2, ty + 30);
          ctx.fillStyle = C.mint;
          ctx.fillText('online_softmax()', tx + tw / 2, ty + 50);
        } else {
          drawArrow(ctx, x2 - 8, y + bh / 2 + 12, x1 + bw + 8, y + bh / 2 + 12, C.coral);
        }

        drawFooter(
          ctx,
          w,
          h,
          flash ? 'Peak Attention Memory: O(N) · 3.5× faster wall-clock' : 'Peak Attention Memory: O(N²) · OOM at long context',
          flash ? C.mint : C.coral
        );
      }
    },

    'ch-5': {
      title: 'Quantization: Packing More Weights Through the Same HBM Bus',
      challenge: 'Drop precision to FP8 or FP4 to multiply weight throughput across HBM.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-prec="32">FP32 (4B)</button>
          <button class="sim-btn" data-prec="16">BF16 (2B)</button>
          <button class="sim-btn" data-prec="8">FP8 (1B)</button>
          <button class="sim-btn" data-prec="4">NVFP4 (0.5B)</button>
        </div>`,
      state: { bits: 32, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-prec]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-prec]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.bits = Number(b.dataset.prec);
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const mult = 32 / st.bits;
        if (st.bits <= 8 && !st.solved) {
          st.solved = true;
          markSolved();
        }

        const pad = 32;
        const pipeW = w - pad * 2;
        const pipeY = 64;
        const pipeH = 104;

        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'center';
        ctx.fillText('Fixed HBM Memory Bus (3.35 TB/s)', w / 2, 48);

        roundRect(ctx, pad, pipeY, pipeW, pipeH, 10);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.strokeStyle = st.bits <= 8 ? C.mint : C.blue;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Clip blocks cleanly inside the pipe
        ctx.save();
        roundRect(ctx, pad + 4, pipeY + 4, pipeW - 8, pipeH - 8, 7);
        ctx.clip();

        const lanes = Math.min(4, Math.max(1, Math.log2(mult) + 1));
        const blockW = Math.max(14, 52 / Math.sqrt(mult));
        const laneH = (pipeH - 20) / lanes;

        for (let l = 0; l < lanes; l++) {
          const count = Math.ceil(mult * 2.5);
          for (let i = 0; i < count; i++) {
            const p = (t * 0.4 + i / count + l * 0.11) % 1;
            const px = pad - blockW + p * (pipeW + blockW);
            const py = pipeY + 11 + l * laneH;
            roundRect(ctx, px, py, blockW, Math.max(10, laneH - 6), 3);
            ctx.fillStyle = st.bits === 4 ? C.mint : st.bits === 8 ? C.blue : C.amber;
            ctx.globalAlpha = 0.82;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        ctx.restore();

        const gb70b = ((70 * st.bits) / 8).toFixed(0);
        drawFooter(
          ctx,
          w,
          h,
          `Throughput: ${mult}× weights/sec · 70B Model Footprint: ${gb70b} GB`,
          st.bits <= 8 ? C.mint : C.text
        );
      }
    },

    'ch-6': {
      title: 'Distributed Training: 4-GPU NVLink Ring AllReduce',
      challenge: 'Toggle Overlapped Ring to hide NVLink latency and boost MFU.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-ov="off">Sequential (Stalls)</button>
          <button class="sim-btn" data-ov="on">Overlapped Ring (FSDP / DualPipe)</button>
        </div>`,
      state: { overlap: false, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-ov]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-ov]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.overlap = b.dataset.ov === 'on';
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        if (st.overlap && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const cx = w / 2;
        const cy = 114;
        const rx = Math.min(150, w * 0.26);
        const ry = 60;
        const gpus = [
          { x: cx - rx, y: cy, label: 'GPU 0' },
          { x: cx, y: cy - ry, label: 'GPU 1' },
          { x: cx + rx, y: cy, label: 'GPU 2' },
          { x: cx, y: cy + ry, label: 'GPU 3' }
        ];

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = st.overlap ? 'rgba(92,214,160,0.45)' : 'rgba(244,185,66,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const speed = st.overlap ? 0.9 : 0.4;
        for (let i = 0; i < 8; i++) {
          const ang = t * speed * Math.PI + (i / 8) * Math.PI * 2;
          const px = cx + Math.cos(ang) * rx;
          const py = cy + Math.sin(ang) * ry;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = st.overlap ? C.mint : C.amber;
          ctx.fill();
        }

        gpus.forEach((g, idx) => {
          const busy = st.overlap || Math.sin(t * 2 + idx) > 0;
          drawBox(ctx, g.x - 44, g.y - 22, 88, 44, g.label, busy ? 'Computing' : 'Waiting', busy ? C.blue : C.coral);
        });

        drawFooter(
          ctx,
          w,
          h,
          st.overlap ? 'MFU: 52% · NVLink AllReduce overlapped with backward pass' : 'MFU: 28% · GPUs stall waiting for gradient sync',
          st.overlap ? C.mint : C.amber
        );
      }
    },

    'ch-7': {
      title: 'Serving Engine: Static Batching vs. Continuous Batching + PagedAttention',
      challenge: 'Enable Continuous Batching to eliminate idle GPU bubbles.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-srv="static">Static Batching</button>
          <button class="sim-btn" data-srv="cont">Continuous Batching (vLLM / SGLang)</button>
        </div>`,
      state: { cont: false, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-srv]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-srv]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.cont = b.dataset.srv === 'cont';
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        if (st.cont && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const lanes = [
          { len: 0.42, nextLen: 0.52, color: C.blue },
          { len: 0.88, nextLen: 0.1, color: C.mint },
          { len: 0.3, nextLen: 0.64, color: C.amber },
          { len: 0.58, nextLen: 0.36, color: C.blue }
        ];
        const leftX = 82;
        const barW = w - leftX - 32;
        const phase = (t * 0.35) % 1;

        lanes.forEach((ln, i) => {
          const y = 34 + i * 42;
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'left';
          ctx.fillText(`Slot ${i + 1}`, 30, y + 17);

          roundRect(ctx, leftX, y, barW, 26, 5);
          ctx.fillStyle = C.panel;
          ctx.fill();

          const w1 = barW * ln.len;
          roundRect(ctx, leftX, y + 2, w1, 22, 4);
          ctx.fillStyle = ln.color;
          ctx.globalAlpha = 0.72;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (st.cont && ln.nextLen > 0.15) {
            roundRect(ctx, leftX + w1 + 6, y + 2, barW * ln.nextLen - 6, 22, 4);
            ctx.fillStyle = C.mint;
            ctx.globalAlpha = 0.75;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else if (!st.cont && ln.len < 0.8) {
            ctx.font = '400 10.5px "JetBrains Mono", monospace';
            ctx.fillStyle = C.coral;
            ctx.fillText('idle bubble...', leftX + w1 + 12, y + 17);
          }
        });

        const cx = leftX + phase * barW;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, 28);
        ctx.lineTo(cx, 196);
        ctx.stroke();

        drawFooter(
          ctx,
          w,
          h,
          st.cont ? 'Throughput: 3.1× higher · New requests slot in immediately' : 'Throughput: 1.0× · Short sequences wait for the longest one',
          st.cont ? C.mint : C.coral
        );
      }
    },

    'ch-8': {
      title: 'Disaggregated Prefill / Decode + Speculative Decoding',
      challenge: 'Enable Speculative Drafting (4 tokens/step) to accelerate the Decode pool.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-spec="1">Standard (1 tok/step)</button>
          <button class="sim-btn" data-spec="4">Speculative / MTP (4 tok/step)</button>
        </div>`,
      state: { spec: 1, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-spec]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-spec]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.spec = Number(b.dataset.spec);
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        const fast = st.spec === 4;
        if (fast && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const bw = Math.min(192, (w - 150) / 2);
        const bh = 128;
        const y = 48;
        const x1 = 36;
        const x2 = w - 36 - bw;

        drawBox(ctx, x1, y, bw, bh, 'Prefill GPU Pool', 'Compute-bound prompt', C.amber);
        drawBox(ctx, x2, y, bw, bh, 'Decode GPU Pool', fast ? 'Verifying 4 tok/pass' : '1 token/pass', fast ? C.mint : C.blue);

        drawArrow(ctx, x1 + bw + 8, y + bh / 2, x2 - 8, y + bh / 2, C.blue);
        ctx.font = '500 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = C.blue;
        ctx.textAlign = 'center';
        ctx.fillText('KV Cache (RDMA)', w / 2, y + bh / 2 - 14);

        for (let i = 0; i < 3; i++) {
          const p = (t * 0.65 + i * 0.33) % 1;
          const px = x1 + bw + 14 + p * (x2 - x1 - bw - 28);
          roundRect(ctx, px - 7, y + bh / 2 - 5, 14, 10, 3);
          ctx.fillStyle = C.blue;
          ctx.fill();
        }

        // Centered token tiles inside Decode box
        const tokens = fast ? 4 : 1;
        const tw = 28;
        const gap = 8;
        const totalW = tokens * tw + (tokens - 1) * gap;
        const startX = x2 + (bw - totalW) / 2;
        for (let i = 0; i < tokens; i++) {
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 0.4));
          roundRect(ctx, startX + i * (tw + gap), y + 66, tw, 36, 5);
          ctx.fillStyle = fast ? `rgba(92,214,160,${pulse})` : `rgba(88,196,221,${pulse})`;
          ctx.fill();
        }

        drawFooter(
          ctx,
          w,
          h,
          fast ? 'Decode Speed: 2.8× faster (lossless parallel verification)' : 'Decode Speed: 1.0× (memory-bandwidth bound)',
          fast ? C.mint : C.text
        );
      }
    },

    'ch-9': {
      title: 'Cluster Reliability: GPU Fault Injection & Async Checkpoint Recovery',
      challenge: 'Click "Inject GPU Fault", then "Auto-Recover" to test fault tolerance.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn" id="sim-fault">Inject GPU Fault</button>
          <button class="sim-btn" id="sim-recover">Auto-Recover</button>
        </div>`,
      state: { faultIdx: -1, recovered: false, solved: false },
      bind(el, st) {
        el.querySelector('#sim-fault')?.addEventListener('click', () => {
          st.faultIdx = Math.floor(Math.random() * 16);
          st.recovered = false;
        });
        el.querySelector('#sim-recover')?.addEventListener('click', () => {
          if (st.faultIdx >= 0) {
            st.faultIdx = -1;
            st.recovered = true;
          }
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        if (st.recovered && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const cols = 8;
        const gap = 8;
        const cw = Math.min(72, (w - 64 - gap * (cols - 1)) / cols);
        const gridW = cols * cw + (cols - 1) * gap;
        const startX = (w - gridW) / 2;

        for (let i = 0; i < 16; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = startX + c * (cw + gap);
          const y = 44 + r * 72;
          const isFault = i === st.faultIdx;
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.5);

          roundRect(ctx, x, y, cw, 56, 6);
          ctx.fillStyle = isFault ? 'rgba(240, 113, 120, 0.25)' : 'rgba(92, 214, 160, 0.14)';
          ctx.fill();
          ctx.strokeStyle = isFault ? C.coral : `rgba(92, 214, 160, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          ctx.font = '500 10.5px "JetBrains Mono", monospace';
          ctx.fillStyle = isFault ? C.coral : C.text;
          ctx.textAlign = 'center';
          ctx.fillText(`GPU ${i}`, x + cw / 2, y + 24);
          ctx.font = '400 9.5px Inter, sans-serif';
          ctx.fillStyle = isFault ? C.coral : C.mint;
          ctx.fillText(isFault ? 'XID Error' : 'Healthy', x + cw / 2, y + 41);
        }

        drawFooter(
          ctx,
          w,
          h,
          st.faultIdx >= 0
            ? `Fault on GPU ${st.faultIdx} — Click Auto-Recover to resume from checkpoint`
            : 'Cluster Goodput: 97.4% · Async NVMe checkpointing active',
          st.faultIdx >= 0 ? C.coral : C.mint
        );
      }
    },

    'ch-10': {
      title: 'The RL Post-Training Factory: Rollouts → Sandboxes → Policy Update',
      challenge: 'Toggle Async HybridEngine to overlap rollout generation with policy training.',
      controlsHtml: `
        <div class="sim-btn-group">
          <button class="sim-btn active" data-rl="sync">Synchronous Loop</button>
          <button class="sim-btn" data-rl="async">Async HybridEngine (verl)</button>
        </div>`,
      state: { async: false, solved: false },
      bind(el, st) {
        el.querySelectorAll('[data-rl]').forEach((b) => {
          b.addEventListener('click', () => {
            el.querySelectorAll('[data-rl]').forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            st.async = b.dataset.rl === 'async';
          });
        });
      },
      draw(ctx, w, h, t, st, markSolved) {
        if (st.async && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const bw = Math.min(160, (w - 130) / 3);
        const bh = 78;
        const y = 52;
        const x1 = 30;
        const x2 = w / 2 - bw / 2;
        const x3 = w - bw - 30;

        drawBox(ctx, x1, y, bw, bh, 'Rollout Engine', 'vLLM / SGLang', C.blue);
        drawBox(ctx, x2, y, bw, bh, 'MicroVM Verifiers', 'Tests & Rewards', C.amber);
        drawBox(ctx, x3, y, bw, bh, 'Policy Trainer', 'FSDP / GRPO', C.mint);

        drawArrow(ctx, x1 + bw + 6, y + bh / 2, x2 - 6, y + bh / 2, C.blue);
        drawArrow(ctx, x2 + bw + 6, y + bh / 2, x3 - 6, y + bh / 2, C.amber);

        // Return arc (Hot weight sync)
        ctx.beginPath();
        ctx.moveTo(x3 + bw / 2, y + bh + 6);
        ctx.quadraticCurveTo(w / 2, y + bh + 54, x1 + bw / 2, y + bh + 6);
        ctx.strokeStyle = st.async ? C.mint : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.font = '500 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = st.async ? C.mint : C.muted;
        ctx.textAlign = 'center';
        ctx.fillText('Hot Weight Sync (HybridEngine)', w / 2, y + bh + 44);

        const spd = st.async ? 0.95 : 0.42;
        const p1 = (t * spd) % 1;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(x1 + bw + 8 + p1 * (x2 - x1 - bw - 16), y + bh / 2, 4.5, 0, Math.PI * 2);
        ctx.fill();

        const p2 = (t * spd + 0.35) % 1;
        ctx.fillStyle = C.amber;
        ctx.beginPath();
        ctx.arc(x2 + bw + 8 + p2 * (x3 - x2 - bw - 16), y + bh / 2, 4.5, 0, Math.PI * 2);
        ctx.fill();

        drawFooter(
          ctx,
          w,
          h,
          st.async
            ? 'Async HybridEngine: Rollouts, verification & weight sync fully pipelined'
            : 'Synchronous: GPUs idle waiting for the longest reasoning trace',
          st.async ? C.mint : C.amber
        );
      }
    }
  };

  const cfg = configs[chapterId] || configs['ch-0'];
  containerEl.innerHTML = `
    <div class="sim-card">
      <div class="sim-top">
        <span class="sim-title">${cfg.title}</span>
        <span class="sim-badge" id="sim-badge">Interactive</span>
      </div>
      <canvas class="sim-canvas" id="sim-canvas"></canvas>
      <div class="sim-footer">
        <div class="sim-controls">${cfg.controlsHtml}</div>
        <div class="sim-challenge" id="sim-challenge">${cfg.challenge}</div>
      </div>
    </div>
  `;

  const canvas = containerEl.querySelector('#sim-canvas');
  const ctx = canvas.getContext('2d');
  const badgeEl = containerEl.querySelector('#sim-badge');
  const challengeEl = containerEl.querySelector('#sim-challenge');

  const st = { ...cfg.state };
  cfg.bind(containerEl, st);

  function markSolved() {
    badgeEl.textContent = 'Completed';
    badgeEl.classList.add('solved');
    challengeEl.classList.add('solved');
    onChallengeSolved?.(chapterId);
  }

  let rafId = null;
  let running = true;
  const startTime = performance.now();

  function frame(now) {
    if (!running) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const clientW = canvas.clientWidth || 680;
    // Use a 640px logical coordinate system on narrow mobile screens so diagrams scale like crisp vectors with zero text overlap
    const logicalW = Math.max(640, clientW);
    const logicalH = 256;
    const scale = clientW / logicalW;
    const displayH = Math.round(logicalH * scale);

    if (canvas.width !== Math.round(clientW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
      canvas.width = Math.round(clientW * dpr);
      canvas.height = Math.round(displayH * dpr);
      canvas.style.height = `${displayH}px`;
    }

    ctx.save();
    ctx.scale(dpr * scale, dpr * scale);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // Subtle 3B1B-style coordinate grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < logicalW; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalH);
      ctx.stroke();
    }
    for (let y = 0; y < logicalH; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalW, y);
      ctx.stroke();
    }

    cfg.draw(ctx, logicalW, logicalH, (now - startTime) * 0.001, st, markSolved);
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  };
}
