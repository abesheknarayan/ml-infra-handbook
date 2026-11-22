// 3Blue1Brown-inspired Interactive Canvas Animations & Factory Pipeline for Chapters
// Clean chalkboard-navy aesthetic, vector arrows, live data packets, and interactive challenges.

export const FACTORY_STATIONS = [
  { id: 'cluster',  label: '1. Cluster & Data',   chapters: ['ch-9', 'ch-10'] },
  { id: 'serving',  label: '2. Serving Engine',   chapters: ['ch-7', 'ch-8'] },
  { id: 'fabric',   label: '3. NVLink / Network', chapters: ['ch-6'] },
  { id: 'hbm',      label: '4. HBM Memory',       chapters: ['ch-1', 'ch-4', 'ch-5'] },
  { id: 'compute',  label: '5. SRAM & Cores',     chapters: ['ch-1', 'ch-2', 'ch-3'] }
];

const C = {
  bg: '#090e1a',
  panel: '#101829',
  border: 'rgba(255,255,255,0.1)',
  blue: '#58c4dd',     // 3B1B signature cyan-blue
  blueDim: 'rgba(88, 196, 221, 0.2)',
  amber: '#f4b942',    // 3B1B warm gold
  amberDim: 'rgba(244, 185, 66, 0.22)',
  mint: '#5cd6a0',     // 3B1B green
  mintDim: 'rgba(92, 214, 160, 0.2)',
  coral: '#f07178',    // 3B1B red/coral
  text: '#e5e7eb',
  muted: '#8b95a7'
};

function roundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBox(ctx, x, y, w, h, title, subtitle, accent = C.blue) {
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = accent;
  ctx.stroke();

  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillStyle = C.text;
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 20);

  if (subtitle) {
    ctx.font = '400 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = C.muted;
    ctx.fillText(subtitle, x + w / 2, y + 36);
  }
}

function drawArrow(ctx, x1, y1, x2, y2, color = 'rgba(255,255,255,0.22)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(ang - 0.45), y2 - 7 * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - 7 * Math.cos(ang + 0.45), y2 - 7 * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}

export function mountChapterSimulation({ chapterId, containerEl, onChallengeSolved }) {
  const configs = {
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
        const ai = Math.min(420, st.batch * 1.15); // arithmetic intensity
        const util = Math.min(98, Math.round((ai / 295) * 100));
        if (util >= 80 && !st.solved) {
          st.solved = true;
          markSolved();
        }
        const bound = util >= 80 ? 'Compute-bound (cores busy)' : 'Memory-bound (waiting on HBM)';

        // 3 main factory blocks
        const bw = 148;
        const bh = 132;
        const y = 52;
        const x1 = 28;
        const x2 = w / 2 - bw / 2;
        const x3 = w - bw - 28;

        drawBox(ctx, x1, y, bw, bh, 'HBM3 Memory', '80 GB · 3.35 TB/s', C.amber);
        drawBox(ctx, x2, y, bw, bh, 'On-Chip SRAM', '~50 MB · 20+ TB/s', C.blue);
        drawBox(ctx, x3, y, bw, bh, 'Tensor Cores', '989 TFLOPS (BF16)', util >= 80 ? C.mint : C.coral);

        // Weight grid inside HBM
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            roundRect(ctx, x1 + 18 + c * 23, y + 52 + r * 22, 18, 16, 3);
            ctx.fillStyle = C.amberDim;
            ctx.fill();
            ctx.strokeStyle = C.amber;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Fast SRAM tile buffer
        for (let i = 0; i < 4; i++) {
          const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i));
          roundRect(ctx, x2 + 22 + i * 27, y + 66, 22, 42, 4);
          ctx.fillStyle = `rgba(88, 196, 221, ${0.18 + pulse * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.stroke();
        }

        // Tensor Core 4x4 systolic pulse grid
        const activeCores = Math.max(1, Math.round((util / 100) * 16));
        for (let i = 0; i < 16; i++) {
          const r = Math.floor(i / 4);
          const c = i % 4;
          const lit = i < activeCores;
          const glow = lit ? 0.55 + 0.45 * Math.sin(t * 6 + i * 0.6) : 0.1;
          roundRect(ctx, x3 + 28 + c * 24, y + 48 + r * 19, 19, 14, 3);
          ctx.fillStyle = lit ? `rgba(92, 214, 160, ${glow})` : 'rgba(255,255,255,0.06)';
          ctx.fill();
        }

        // Animated data packets along HBM -> SRAM bus (narrower/slower)
        drawArrow(ctx, x1 + bw + 6, y + bh / 2, x2 - 6, y + bh / 2, 'rgba(244,185,66,0.45)');
        for (let i = 0; i < 4; i++) {
          const p = (t * 0.45 + i * 0.25) % 1;
          const px = x1 + bw + 10 + p * (x2 - x1 - bw - 20);
          roundRect(ctx, px - 6, y + bh / 2 - 5, 12, 10, 3);
          ctx.fillStyle = C.amber;
          ctx.fill();
        }

        // Animated data packets along SRAM -> Tensor Cores (blazing fast!)
        drawArrow(ctx, x2 + bw + 6, y + bh / 2, x3 - 6, y + bh / 2, 'rgba(88,196,221,0.55)');
        const sramPackets = Math.min(8, 2 + Math.floor(util / 15));
        for (let i = 0; i < sramPackets; i++) {
          const p = (t * 1.4 + i / sramPackets) % 1;
          const px = x2 + bw + 10 + p * (x3 - x2 - bw - 20);
          ctx.beginPath();
          ctx.arc(px, y + bh / 2 + Math.sin(i * 2) * 10, 3.8, 0, Math.PI * 2);
          ctx.fillStyle = C.blue;
          ctx.fill();
        }

        // Live metrics footer
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillStyle = util >= 80 ? C.mint : C.amber;
        ctx.textAlign = 'left';
        ctx.fillText(`Tensor Core Utilization: ${util}%  ·  ${bound}`, 28, h - 18);
        ctx.textAlign = 'right';
        ctx.fillStyle = C.muted;
        ctx.fillText(`Arithmetic Intensity: ${Math.round(ai)} FLOPs/byte`, w - 28, h - 18);
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

        // Top: HBM Bar, Bottom: On-Chip SRAM/Registers
        drawBox(ctx, 28, 22, w - 56, 48, 'HBM Global Memory (Slow · 3.35 TB/s)', '', C.amber);
        drawBox(
          ctx,
          28,
          142,
          w - 56,
          62,
          fused ? 'Fused Triton Kernel in On-Chip SRAM (Multiply → Add → ReLU)' : '3 Separate GPU Kernels (Read/Write HBM Every Step)',
          '',
          fused ? C.mint : C.blue
        );

        const ops = ['1. Mul (x·a)', '2. Add (+b)', '3. ReLU'];
        const segW = (w - 110) / 3;

        ops.forEach((label, i) => {
          const cx = 65 + i * segW + segW / 2;
          roundRect(ctx, cx - 54, 170, 108, 24, 5);
          ctx.fillStyle = fused ? C.mintDim : C.blueDim;
          ctx.fill();
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText(label, cx, 186);

          if (!fused) {
            // Down (read HBM) and Up (write HBM) arrows for EVERY op
            drawArrow(ctx, cx - 16, 72, cx - 16, 138, 'rgba(244,185,66,0.55)');
            drawArrow(ctx, cx + 16, 138, cx + 16, 72, 'rgba(240,113,120,0.55)');
            const p = (t * 0.9 + i * 0.33) % 1;
            ctx.fillStyle = C.amber;
            ctx.beginPath();
            ctx.arc(cx - 16, 76 + p * 58, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.coral;
            ctx.beginPath();
            ctx.arc(cx + 16, 134 - p * 58, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (i < 2) {
            // Stay in SRAM! Horizontal arrows between ops
            drawArrow(ctx, cx + 56, 182, cx + segW - 56, 182, C.mint);
          }
        });

        if (fused) {
          // Single read at start, single write at end
          const startX = 95;
          const endX = w - 95;
          drawArrow(ctx, startX, 72, startX, 138, C.mint);
          drawArrow(ctx, endX, 138, endX, 72, C.mint);
          const p = (t * 1.1) % 1;
          ctx.fillStyle = C.mint;
          ctx.beginPath();
          ctx.arc(startX, 76 + p * 58, 4.5, 0, Math.PI * 2);
          ctx.arc(endX, 134 - p * 58, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = fused ? C.mint : C.coral;
        ctx.fillText(fused ? 'HBM Traffic: 1 Read + 1 Write (3.0× faster)' : 'HBM Traffic: 3 Reads + 3 Writes (Memory-bound)', 28, h - 14);
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

        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText('CPU (Python Dispatch)', 28, 44);
        ctx.fillText('GPU Execution Timeline', 28, 126);

        // Timelines
        roundRect(ctx, 28, 52, w - 56, 38, 6);
        ctx.fillStyle = C.panel;
        ctx.fill();
        roundRect(ctx, 28, 134, w - 56, 46, 6);
        ctx.fill();

        const sweep = ((t * 140) % (w - 80)) + 40;

        if (!compiled) {
          for (let i = 0; i < 6; i++) {
            const x = 38 + i * ((w - 86) / 6);
            roundRect(ctx, x, 60, 56, 22, 4);
            ctx.fillStyle = C.amberDim;
            ctx.fill();
            ctx.strokeStyle = C.amber;
            ctx.stroke();

            // Delayed small GPU kernel with idle gap
            roundRect(ctx, x + 28, 144, 34, 26, 4);
            ctx.fillStyle = C.blueDim;
            ctx.fill();
            ctx.strokeStyle = C.blue;
            ctx.stroke();

            drawArrow(ctx, x + 28, 84, x + 36, 142, 'rgba(244,185,66,0.35)');
          }
        } else {
          // Single tiny dispatch -> massive fused GPU execution block
          roundRect(ctx, 38, 60, 74, 22, 4);
          ctx.fillStyle = C.mintDim;
          ctx.fill();
          ctx.strokeStyle = C.mint;
          ctx.stroke();
          drawArrow(ctx, 75, 84, 95, 142, C.mint);

          roundRect(ctx, 44, 144, w - 128, 26, 5);
          ctx.fillStyle = 'rgba(92, 214, 160, 0.28)';
          ctx.fill();
          ctx.strokeStyle = C.mint;
          ctx.stroke();
          ctx.font = '500 11.5px Inter, sans-serif';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText('Fused Compiled Graph (Zero Idle Bubbles)', w / 2 - 20, 161);
        }

        // Playhead sweep
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sweep, 48);
        ctx.lineTo(sweep, 188);
        ctx.stroke();

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = compiled ? C.mint : C.amber;
        ctx.fillText(compiled ? 'GPU Busy: 94% · Python overhead eliminated' : 'GPU Busy: 41% · Idle gaps waiting on Python CPU dispatch', 28, h - 16);
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

        drawBox(ctx, 28, 30, 170, 155, 'HBM Memory', flash ? 'Only Q, K, V, O stored' : 'Giant N×N Matrix in HBM!', flash ? C.mint : C.coral);
        drawBox(ctx, w - 210, 30, 182, 155, 'On-Chip SRAM', flash ? 'Online Softmax Tile' : 'Underutilized', C.blue);

        // Matrix inside HBM
        const gridN = 6;
        const cell = 14;
        const gx = 72;
        const gy = 84;
        const activeTile = Math.floor(t * 2.5) % (gridN * gridN);
        const tr = Math.floor(activeTile / gridN);
        const tc = activeTile % gridN;

        for (let r = 0; r < gridN; r++) {
          for (let c = 0; c < gridN; c++) {
            roundRect(ctx, gx + c * (cell + 2), gy + r * (cell + 2), cell, cell, 2);
            if (!flash) {
              ctx.fillStyle = 'rgba(240, 113, 120, 0.45)';
              ctx.fill();
            } else {
              ctx.fillStyle = r === tr && c === tc ? C.blue : 'rgba(255,255,255,0.05)';
              ctx.fill();
            }
          }
        }

        // Animated SRAM tile computation
        drawArrow(ctx, 206, 108, w - 218, 108, flash ? C.mint : C.coral);
        if (flash) {
          const tx = w - 165;
          const ty = 90;
          roundRect(ctx, tx, ty, 92, 68, 6);
          ctx.fillStyle = C.blueDim;
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.stroke();
          ctx.font = '500 11px "JetBrains Mono", monospace';
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText(`Tile [${tr},${tc}]`, tx + 46, ty + 28);
          ctx.fillStyle = C.mint;
          ctx.fillText('softmax_online()', tx + 46, ty + 48);
        } else {
          drawArrow(ctx, w - 218, 130, 206, 130, C.coral);
        }

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = flash ? C.mint : C.coral;
        ctx.fillText(flash ? 'Peak Attention Memory: O(N) · 3.5× faster wall-clock' : 'Peak Attention Memory: O(N²) · OOM at long context', 28, h - 14);
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

        // Highway pipe
        roundRect(ctx, 28, 56, w - 56, 98, 10);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.strokeStyle = st.bits <= 8 ? C.mint : C.blue;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Moving packed weight blocks
        const lanes = Math.min(4, Math.max(1, Math.log2(mult) + 1));
        const blockW = Math.max(12, 48 / Math.sqrt(mult));
        const laneH = 74 / lanes;

        for (let l = 0; l < lanes; l++) {
          const count = Math.ceil(mult * 2.5);
          for (let i = 0; i < count; i++) {
            const p = (t * 0.42 + i / count + l * 0.11) % 1;
            const px = 42 + p * (w - 110);
            const py = 68 + l * laneH;
            roundRect(ctx, px, py, blockW, Math.max(10, laneH - 6), 3);
            ctx.fillStyle = st.bits === 4 ? C.mint : st.bits === 8 ? C.blue : C.amber;
            ctx.globalAlpha = 0.82;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        const gb70b = ((70 * st.bits) / 8).toFixed(0);
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = st.bits <= 8 ? C.mint : C.text;
        ctx.fillText(`Effective Throughput: ${mult}× weights/sec  ·  70B Model Size: ${gb70b} GB`, 28, h - 18);
      }
    },

    'ch-6': {
      title: 'Distributed Training: 4-GPU NVLink Ring AllReduce',
      challenge: 'Toggle Overlap Comms with Compute to hide NVLink latency and boost MFU.',
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
        const cy = 104;
        const rx = 135;
        const ry = 56;
        const gpus = [
          { x: cx - rx, y: cy, label: 'GPU 0' },
          { x: cx, y: cy - ry, label: 'GPU 1' },
          { x: cx + rx, y: cy, label: 'GPU 2' },
          { x: cx, y: cy + ry, label: 'GPU 3' }
        ];

        // Ring ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = st.overlap ? 'rgba(92,214,160,0.45)' : 'rgba(244,185,66,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Moving gradient packets around ring
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

        // GPU nodes
        gpus.forEach((g, idx) => {
          const busy = st.overlap || Math.sin(t * 2 + idx) > 0;
          drawBox(ctx, g.x - 42, g.y - 22, 84, 44, g.label, busy ? 'Computing' : 'Waiting', busy ? C.blue : C.coral);
        });

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = st.overlap ? C.mint : C.amber;
        ctx.fillText(st.overlap ? 'MFU: 52% · NVLink AllReduce overlapped with backward pass' : 'MFU: 28% · GPUs stall waiting for gradient sync', 28, h - 14);
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
        const barW = w - 120;
        const phase = (t * 0.35) % 1;

        lanes.forEach((ln, i) => {
          const y = 32 + i * 38;
          ctx.font = '500 11px Inter, sans-serif';
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'left';
          ctx.fillText(`Slot ${i + 1}`, 28, y + 17);

          roundRect(ctx, 84, y, barW, 24, 5);
          ctx.fillStyle = C.panel;
          ctx.fill();

          const w1 = barW * ln.len;
          roundRect(ctx, 84, y + 2, w1, 20, 4);
          ctx.fillStyle = ln.color;
          ctx.globalAlpha = 0.72;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (st.cont && ln.nextLen > 0.15) {
            roundRect(ctx, 84 + w1 + 6, y + 2, barW * ln.nextLen - 6, 20, 4);
            ctx.fillStyle = C.mint;
            ctx.globalAlpha = 0.75;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else if (!st.cont && ln.len < 0.8) {
            ctx.font = '400 10.5px "JetBrains Mono", monospace';
            ctx.fillStyle = C.coral;
            ctx.fillText('idle bubble...', 84 + w1 + 12, y + 16);
          }
        });

        // Token iteration cursor
        const cx = 84 + phase * barW;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, 26);
        ctx.lineTo(cx, 182);
        ctx.stroke();

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = st.cont ? C.mint : C.coral;
        ctx.fillText(st.cont ? 'Throughput: 3.1× higher · New requests slot in immediately' : 'Throughput: 1.0× · Short sequences wait for the longest one', 28, h - 14);
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
        drawBox(ctx, 28, 44, 175, 118, 'Prefill GPU Pool', 'Compute-bound prompt', C.amber);
        drawBox(ctx, w - 215, 44, 187, 118, 'Decode GPU Pool', fast ? 'Verifying 4 tokens/pass' : '1 token/pass', fast ? C.mint : C.blue);

        // KV Cache transfer over RDMA
        drawArrow(ctx, 210, 102, w - 222, 102, C.blue);
        ctx.font = '500 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = C.blue;
        ctx.textAlign = 'center';
        ctx.fillText('KV Cache over RDMA', w / 2, 88);

        for (let i = 0; i < 3; i++) {
          const p = (t * 0.65 + i * 0.33) % 1;
          const px = 216 + p * (w - 446);
          roundRect(ctx, px - 8, 96, 16, 12, 3);
          ctx.fillStyle = C.blue;
          ctx.fill();
        }

        // Token stream inside Decode box
        const tokens = fast ? 4 : 1;
        for (let i = 0; i < tokens; i++) {
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 0.4));
          roundRect(ctx, w - 196 + i * 38, 104, 30, 34, 5);
          ctx.fillStyle = fast ? `rgba(92,214,160,${pulse})` : `rgba(88,196,221,${pulse})`;
          ctx.fill();
        }

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = fast ? C.mint : C.text;
        ctx.fillText(fast ? 'Decode Speed: 2.8× faster (lossless parallel verify)' : 'Decode Speed: 1.0× (memory-bandwidth bound)', 28, h - 14);
      }
    },

    'ch-9': {
      title: 'Cluster Reliability: GPU Fault Injection & Async Checkpoint Recovery',
      challenge: 'Click "Inject GPU Fault" to watch the scheduler isolate and recover the cluster.',
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
        const rows = 2;
        const cw = (w - 96) / cols;

        for (let i = 0; i < 16; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = 34 + c * (cw + 4);
          const y = 38 + r * 66;
          const isFault = i === st.faultIdx;
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.5);

          roundRect(ctx, x, y, cw - 6, 52, 6);
          ctx.fillStyle = isFault ? 'rgba(240, 113, 120, 0.25)' : 'rgba(92, 214, 160, 0.14)';
          ctx.fill();
          ctx.strokeStyle = isFault ? C.coral : `rgba(92, 214, 160, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          ctx.font = '500 10.5px "JetBrains Mono", monospace';
          ctx.fillStyle = isFault ? C.coral : C.text;
          ctx.textAlign = 'center';
          ctx.fillText(`GPU ${i}`, x + (cw - 6) / 2, y + 22);
          ctx.font = '400 9.5px Inter, sans-serif';
          ctx.fillStyle = isFault ? C.coral : C.mint;
          ctx.fillText(isFault ? 'XID Error' : 'Healthy', x + (cw - 6) / 2, y + 38);
        }

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = st.faultIdx >= 0 ? C.coral : C.mint;
        ctx.fillText(
          st.faultIdx >= 0
            ? `Fault on GPU ${st.faultIdx} — Click Auto-Recover to swap spare & resume from async checkpoint`
            : 'Cluster Goodput: 97.4% · Async NVMe checkpointing active',
          28,
          h - 14
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
        const bw = 152;
        const bh = 74;
        const y = 62;
        const x1 = 26;
        const x2 = w / 2 - bw / 2;
        const x3 = w - bw - 26;

        drawBox(ctx, x1, y, bw, bh, 'Rollout Engine', 'vLLM / SGLang', C.blue);
        drawBox(ctx, x2, y, bw, bh, 'MicroVM Verifiers', 'Tests & Rewards', C.amber);
        drawBox(ctx, x3, y, bw, bh, 'Policy Trainer', 'FSDP / GRPO', C.mint);

        drawArrow(ctx, x1 + bw + 6, y + bh / 2, x2 - 6, y + bh / 2, C.blue);
        drawArrow(ctx, x2 + bw + 6, y + bh / 2, x3 - 6, y + bh / 2, C.amber);

        // Return arc (Hot weight sync back to inference)
        ctx.beginPath();
        ctx.moveTo(x3 + bw / 2, y + bh + 4);
        ctx.quadraticCurveTo(w / 2, y + bh + 46, x1 + bw / 2, y + bh + 4);
        ctx.strokeStyle = st.async ? C.mint : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Flowing packets
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

        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = st.async ? C.mint : C.amber;
        ctx.fillText(
          st.async
            ? 'Async HybridEngine: Rollouts, verification & weight resharding fully pipelined'
            : 'Synchronous: GPUs idle waiting for longest reasoning trace to finish',
          28,
          h - 14
        );
      }
    }
  };

  const cfg = configs[chapterId] || configs['ch-1'];
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
    const w = canvas.clientWidth || 660;
    const h = 236;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle 3B1B-style coordinate grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    cfg.draw(ctx, w, h, (now - startTime) * 0.001, st, markSolved);
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  };
}
