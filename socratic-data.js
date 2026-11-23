// Structured Socratic ML Infra Learning Path modeled on janestreet/agent_skills/socratic-tutor
// Two-level skill tree (2 branches -> 8 concrete subskills), 5-question diagnostic placement,
// graduated Socratic probes (predict / find-the-flaw / apply / devil's advocate), and capstone.

export const LEVEL_LABELS = [
  'unaware',
  'heard of it',
  'can follow along',
  'can do with help',
  'can do independently',
  'can teach / edge cases'
];

export const SOCRATIC_BRANCHES = [
  {
    id: 'branch-single-gpu',
    title: 'Branch 1 · Single-GPU Foundations',
    subtitle: 'Start here. Multi-GPU systems and serving engines are just single-GPU memory & compute physics multiplied by N.'
  },
  {
    id: 'branch-multi-gpu',
    title: 'Branch 2 · Multi-GPU & Production Systems',
    subtitle: 'Scale across NVLink, InfiniBand, serving fleets, and asynchronous RL post-training loops.'
  }
];

export const SOCRATIC_SUBSKILLS = [
  {
    id: 'gpu-roofline',
    short: 'GPU Architecture & Roofline',
    branchId: 'branch-single-gpu',
    chapterId: 'ch-1',
    brainTopicId: 'topic-gpus',
    summary: 'HBM bandwidth vs Tensor Core FLOPs, arithmetic intensity, and why prefill and decode hit opposite walls.',
    probes: [
      {
        id: 'gpu-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'An H100 delivers ~989 TFLOPS (BF16) and ~3.35 TB/s HBM3 bandwidth (~295 FLOPs/byte ridge point). You run 1-token autoregressive decode at batch size 1 (BF16 weights). You magically double the Tensor Core FLOPs while keeping HBM bandwidth identical. What happens to tokens/sec?',
        options: [
          'Nearly doubles, because matrix multiplication is the main operation in a Transformer.',
          'Stays almost unchanged (~0% speedup), because decode at B=1 has arithmetic intensity ~1 FLOP/byte and is HBM bandwidth-bound.',
          'Improves by ~50% because attention scales quadratically while MLPs stay flat.',
          'Gets slower due to higher warp divergence on the wider Tensor Cores.'
        ],
        correct: 1,
        narrowing: 'Not quite. Count the work per weight loaded at B=1: you read 2 bytes (one BF16 weight) from HBM and perform 2 FLOPs (1 multiply + 1 add). What is FLOPs / bytes, and how does it compare to 295?',
        secondHint: 'If your Tensor Cores already spend >99% of every step idle waiting on weights to arrive from HBM, what does making the Tensor Cores twice as fast change?',
        explanation: 'At batch size 1, each 2-byte BF16 weight is used for just 2 FLOPs (~1 FLOP/byte vs the H100 ridge point of ~295 FLOPs/byte). Decode is completely HBM bandwidth-bound, so doubling compute FLOPs yields essentially zero speedup.',
        devilsAdvocate: 'Hold on — if decode is HBM-bound, why does increasing batch size from 1 to 128 raise total throughput nearly linearly without increasing latency linearly?',
        daOptions: [
          'Because the same model weights read once from HBM are reused across all 128 tokens, pushing arithmetic intensity up toward the ridge point.',
          'Because CUDA automatically switches from HBM to PCIe memory at batch sizes above 64.',
          'Because Tensor Cores only activate when batch size is a multiple of 64.'
        ],
        daCorrect: 0
      },
      {
        id: 'gpu-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'A colleague claims: "My kernel only gets 18% of H100 peak TFLOPS during RMSNorm + SwiGLU. That proves my kernel is poorly written and leaving 82% performance on the table." What is wrong with this claim?',
        options: [
          'RMSNorm uses FP64 internally, so you should compare against FP64 peak TFLOPS.',
          'Elementwise/reduction ops have tiny arithmetic intensity (~1–4 FLOPs/byte); 18% of peak FLOPs is actually impossible — you must measure achieved HBM bandwidth (TB/s), not FLOPs.',
          'RMSNorm only runs on CPU threads, not GPU SMs.',
          'Nothing is wrong — any well-written GPU kernel should hit at least 70% of peak TFLOPS.'
        ],
        correct: 1,
        narrowing: 'Pause and check the roofline. Can an operation that reads an activation vector once and does ~5 FLOPs per element *ever* reach 70% of 989 TFLOPS on 3.35 TB/s HBM?',
        secondHint: 'Multiply 3.35 TB/s by 2–4 FLOPs/byte: the hardware ceiling for that kernel is ~7–13 TFLOPS (~1% of peak), regardless of how cleanly it is coded. What metric actually tells you if it is optimal?',
        explanation: 'For memory-bound kernels like LayerNorm, RMSNorm, softmax, and SwiGLU, the roofline ceiling is HBM bandwidth (TB/s), not peak TFLOPS. Judging a memory-bound kernel by % peak FLOPs is a classic profiling mistake.',
        devilsAdvocate: 'Wait: if RMSNorm is strictly memory-bound, how can fusing RMSNorm + residual add + quantization cut its runtime by ~2–3x?',
        daOptions: [
          'Fusion eliminates intermediate HBM round-trips — you read the tensor once into registers/SRAM instead of writing and re-reading it from HBM three times.',
          'Fusion increases the GPU clock frequency during the fused kernel.',
          'Fusion reduces the number of floating-point operations inside RMSNorm by 3x.'
        ],
        daCorrect: 0
      },
      {
        id: 'gpu-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'You have an H100 (3.35 TB/s HBM) serving a dense 70B model in BF16 (140 GB weights across 2 GPUs = 6.7 TB/s aggregate HBM bandwidth, ignoring comms). What is the hard physical upper bound on single-request (B=1) decode speed?',
        options: [
          '~48 tokens/sec (6.7 TB/s ÷ 140 GB per token, minus KV & interconnect overhead).',
          '~700 tokens/sec, because each GPU has ~1000 TFLOPS and 70B needs 140 GFLOPs per token.',
          '~140 tokens/sec, one token per gigabyte of weights.',
          '~5 tokens/sec because PCIe Gen5 caps transfers at 64 GB/s.'
        ],
        correct: 0,
        narrowing: 'Ignore FLOPs for a moment. To generate 1 token at B=1, how many bytes of model weights must stream from HBM across the 2 GPUs, and how fast can 2×3.35 TB/s move them?',
        secondHint: 'Time per token >= 140 GB / 6700 GB/s ≈ 20.9 ms. Take the reciprocal (1000 ms / 20.9 ms).',
        explanation: 'Generating 1 token requires streaming all 140 GB of weights from HBM. At 6.7 TB/s aggregate HBM bandwidth, the absolute minimum time per token is 140 / 6700 ≈ 20.9 ms (~48 tok/s) before NVLink AllReduce or KV-cache reads.',
        devilsAdvocate: 'What happens to that 48 tok/s ceiling if the user sends a 100k-token prompt (so KV cache is now ~32 GB) at B=1?',
        daOptions: [
          'It drops further (~39 tok/s max), because every decode step must also stream all 32 GB of KV cache from HBM alongside the 140 GB of weights.',
          'It stays at 48 tok/s because KV cache lives permanently inside on-chip SRAM.',
          'It speeds up because attention becomes compute-bound.'
        ],
        daCorrect: 0
      },
      {
        id: 'gpu-4',
        tier: 4,
        kind: 'Edge case',
        question: 'Why does changing a GEMM inner dimension K from 4096 to 4097 often drop throughput sharply on modern GPUs, even though total FLOPs only increased by 0.02%?',
        options: [
          '4097 is prime, so CUDA cannot allocate an array of length 4097.',
          'Unaligned dimensions break 128-byte vectorized global memory loads, Tensor Core MMA tile shapes (multiples of 8/16), and cause wave quantization / tail-block stalls.',
          'PyTorch falls back to CPU execution whenever a dimension is odd.',
          'SRAM bank conflicts only happen on odd matrix dimensions.'
        ],
        correct: 1,
        narrowing: 'Think about how Tensor Core instructions (e.g., wgmma / mma) and HBM cache lines fetch data. What alignment do 16-byte/128-byte vectorized loads and MMA tiles expect?',
        secondHint: 'A single extra element forces misaligned memory transactions and extra boundary-predicated tile waves that occupy SMs without doing useful work.',
        explanation: 'Tensor Cores operate on fixed tile shapes (multiples of 8, 16, or 32) and HBM transactions coalesce into 128-byte cache lines. Off-by-one dimensions break vectorized loads, trigger slow boundary-checked kernels, and cause tail-wave SM underutilization.',
        devilsAdvocate: 'Are you sure? What if M (number of tokens) is 4097 instead of K — is the penalty identical?',
        daOptions: [
          'Similar wave-quantization tail penalty on output tiles (one extra threadblock wave running mostly idle), though inner-K alignment hurts vectorized inner-loop loads even more severely.',
          'Zero penalty because M never affects GPU threadblock grids.',
          'PyTorch silently truncates M to 4096.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'kernels-tiling',
    short: 'CUDA / Triton & SRAM Tiling',
    branchId: 'branch-single-gpu',
    chapterId: 'ch-2',
    brainTopicId: 'topic-kernels',
    summary: 'Warps, memory coalescing, shared-memory tiling, kernel fusion, and FlashAttention online softmax.',
    probes: [
      {
        id: 'kern-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'In standard (unfused) attention for sequence length N=16,384, you compute S = QK^T, write S to HBM, read S to run softmax -> P, write P to HBM, then read P to compute PV. FlashAttention instead recomputes S and P in the backward pass without ever storing N×N in HBM. Why is FlashAttention faster despite doing *more* FLOPs?',
        options: [
          'It approximates softmax using a Taylor series that skips exponentials.',
          'HBM reads/writes of the O(N^2) attention matrix dominate runtime; tiling in fast on-chip SRAM cuts HBM traffic from O(N^2) to O(N), vastly outweighing the extra FLOPs.',
          'It moves softmax onto the CPU while the GPU computes matmuls.',
          'It drops half the attention heads during backward pass.'
        ],
        correct: 1,
        narrowing: 'Compare the cost of 1 HBM byte transfer vs 1 Tensor Core FLOP on an H100 (~300 FLOPs per byte). Which resource was bottlenecking standard attention?',
        secondHint: 'Writing and reading a 16k×16k matrix per head per layer moves gigabytes through HBM. Keeping tiles in ~20 TB/s on-chip SRAM avoids that HBM traffic completely.',
        explanation: 'Standard attention is bottlenecked by O(N²) HBM memory traffic from materializing the attention matrix. FlashAttention tiles Q, K, V into fast on-chip SRAM using online softmax rescaling, trading cheap extra FLOPs in backward for massive HBM savings.',
        devilsAdvocate: 'Wait — softmax normally needs the max and sum across the *entire* row before dividing. How can FlashAttention compute exact softmax block-by-block without seeing the whole row first?',
        daOptions: [
          'It tracks a running row max (m_i) and running denominator (l_i), rescaling the previously accumulated output tile whenever a new K/V block has a larger max.',
          'It assumes attention scores are normally distributed and uses a fixed constant max.',
          'It runs two full HBM passes over K and V first to precompute row sums.'
        ],
        daCorrect: 0
      },
      {
        id: 'kern-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'A junior engineer writes a CUDA kernel where 32 threads in a warp read column 0 of a row-major matrix of width 4096: `val = A[threadIdx.x * 4096]`. They argue: "Each thread only reads 4 bytes, so 32 threads only fetch 128 bytes — one cache line!" What is the flaw?',
        options: [
          'Row-major matrices are stored in registers, not HBM.',
          'The 32 threads access addresses 16 KB apart, so the memory controller must issue 32 separate cache-line transactions instead of 1 coalesced 128-byte transaction — wasting ~97% of memory bandwidth.',
          'A warp has 64 threads on NVIDIA GPUs, not 32.',
          'Nothing is wrong — GPU L1 caches automatically compact strided reads into 1 transaction.'
        ],
        correct: 1,
        narrowing: 'Sketch the memory addresses of thread 0 (`0`), thread 1 (`4096 * 4 = 16,384`), thread 2 (`32,768`)... Do those bytes sit in the same 128-byte cache line?',
        secondHint: 'HBM serves memory in 32-byte/128-byte sectors. If every thread in a warp hits a different 128-byte line, how many cache lines get fetched just to use 4 bytes from each?',
        explanation: 'Coalesced access requires consecutive threads in a warp to access consecutive memory addresses. Striding by 4096 forces 32 separate cache-line fetches per warp instruction, throwing away ~31/32 of memory bandwidth.',
        devilsAdvocate: 'If you must read a matrix column-wise (like a transpose), how do GPU kernels keep both reads and writes coalesced?',
        daOptions: [
          'Stage a 32×32 tile into on-chip shared memory (coalesced read from HBM, transposed read from SRAM with +1 padding to avoid bank conflicts, coalesced write back to HBM).',
          'Use atomicAdd for every element.',
          'Run with 1 thread per block so warps do not collide.'
        ],
        daCorrect: 0
      },
      {
        id: 'kern-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'In a Triton kernel, you increase `BLOCK_M` and `BLOCK_N` to maximize data reuse in SRAM, and performance suddenly *drops* by 40% even though arithmetic intensity went up. What is the most likely cause?',
        options: [
          'Triton disables Tensor Cores when block sizes exceed 64.',
          'Register spilling to local memory (HBM) or excessive shared-memory usage cutting active warps/blocks per SM (low occupancy), leaving memory latency unhidden.',
          'Larger blocks reduce floating-point precision.',
          'The Python GIL slows down the GPU kernel loop.'
        ],
        correct: 1,
        narrowing: 'Each SM has a fixed register file (e.g., 64K 32-bit registers) and fixed shared memory (~228 KB on H100). What happens when one threadblock asks for too much of either?',
        secondHint: 'If a kernel needs more registers per thread than available, the compiler spills them to slow local memory (HBM), or only 1 block can fit per SM so latency cannot be hidden.',
        explanation: 'Larger tiles improve reuse only up to the SM resource cliff. Beyond that point, register spills into HBM or plummeting occupancy starve the warp scheduler of ready warps needed to hide memory latency.',
        devilsAdvocate: 'Wait — does maximum (100%) occupancy always give the fastest GEMM kernel?',
        daOptions: [
          'No — many peak GEMM/FlashAttention kernels run happily at 25–50% occupancy because larger tiles and double-buffering give higher data reuse and enough ILP/TMA pipelining to hide latency.',
          'Yes — 100% occupancy is always strictly optimal on every GPU.',
          'Occupancy only matters on AMD GPUs, not NVIDIA.'
        ],
        daCorrect: 0
      },
      {
        id: 'kern-4',
        tier: 4,
        kind: 'Edge case',
        question: 'Why can running the exact same LLM prompt twice in a batched inference server produce slightly different logits or tokens even at `temperature = 0`?',
        options: [
          'NVIDIA Tensor Cores inject deliberate hardware randomness to prevent overfitting.',
          'Floating-point addition is non-associative: varying batch size or split-K parallel reduction order changes the summation order across threadblocks, flipping low-order bits near argmax ties.',
          'CUDA caches stale KV vectors across unrelated user requests.',
          'BF16 rounds randomly on every clock cycle.'
        ],
        correct: 1,
        narrowing: 'Is `(a + b) + c == a + (b + c)` guaranteed in IEEE 754 floating point? What changes inside a GEMM or attention reduction when your request is batched with 3 requests vs 27 requests?',
        secondHint: 'Different batch sizes pick different tile/split-K reduction trees, changing the order partial sums are accumulated.',
        explanation: 'Floating-point addition is non-associative. When batch size or kernel tile decomposition changes, the order of partial reductions changes, causing tiny ULP differences that can flip greedy argmax tokens and cascade autoregressively (the motivation behind batch-invariant kernels).',
        devilsAdvocate: 'How do batch-invariant kernels eliminate this nondeterminism without disabling parallelism?',
        daOptions: [
          'By fixing a deterministic reduction tree / fixed tile split per token independent of batch size, rather than letting reduction order depend on batch dimensions or atomic completion order.',
          'By converting all weights to 64-bit integers.',
          'By executing batch size 1 sequentially in a Python for-loop.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'frameworks-autograd',
    short: 'PyTorch, Autograd & Compilers',
    branchId: 'branch-single-gpu',
    chapterId: 'ch-3',
    brainTopicId: 'topic-frameworks',
    summary: 'Training VRAM math (weights, grads, Adam states, activations), activation checkpointing, and torch.compile/Inductor.',
    probes: [
      {
        id: 'fw-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'You train a 7B-parameter Transformer in BF16 mixed precision using standard AdamW (FP32 master weights + FP32 momentum & variance). Before counting activations at all, roughly how much GPU memory do model states alone require?',
        options: [
          '~14 GB (7B × 2 bytes for BF16 weights).',
          '~28 GB (BF16 weights + BF16 gradients).',
          '~112 GB (16 bytes/param: 2B BF16 weights + 2B BF16 grads + 4B FP32 master + 4B m + 4B v).',
          '~7 GB because PyTorch compresses zero weights automatically.'
        ],
        correct: 2,
        narrowing: 'List every tensor that must persist across steps in mixed-precision AdamW: BF16 weights (2B), BF16 grads (2B), FP32 master weights (4B), plus how many FP32 states does AdamW maintain per parameter?',
        secondHint: 'AdamW keeps two FP32 moments (m and v: 8B) plus FP32 master weights (4B) plus BF16 weights/grads (4B) = 16 bytes × 7B parameters.',
        explanation: 'Mixed-precision AdamW takes ~16 bytes per parameter (BF16 params 2B + BF16 grads 2B + FP32 master copy 4B + FP32 m 4B + FP32 v 4B). For 7B params that is ~112 GB before activations — which is why a single 80 GB GPU OOMs without sharding or 8-bit optimizers.',
        devilsAdvocate: 'Wait — why bother keeping an FP32 master copy of the weights at all if forward and backward already run in BF16?',
        daOptions: [
          'Small weight updates (lr × grad, e.g. 1e-4 × 1e-3 = 1e-7) vanish completely into BF16 rounding (7 mantissa bits) unless accumulated into an FP32 master copy.',
          'CUDA forbids updating BF16 tensors in-place.',
          'Because AdamW cannot compute square roots in BF16.'
        ],
        daCorrect: 0
      },
      {
        id: 'fw-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'Someone says: "Activation checkpointing (gradient checkpointing) cuts activation VRAM sharply, and since it only recomputes during the backward pass, total training step time drops by ~25% too." Spot the flaw.',
        options: [
          'Activation checkpointing only works for CNNs, not Transformers.',
          'Recomputing saved-out forward activations during backward adds roughly 1 extra forward pass (~33% more FLOPs), so step time *increases* unless memory savings let you raise batch size to boost MFU.',
          'Activation checkpointing increases VRAM usage.',
          'Nothing is wrong — skipping HBM writes makes it strictly faster.'
        ],
        correct: 1,
        narrowing: 'When you throw away intermediate layer activations in the forward pass, where do they come from when the backward pass needs them to compute gradients?',
        secondHint: 'A standard training step is ~1x forward + ~2x backward = 3x FLOPs. Re-running forward during backward adds +1x forward -> 4x FLOPs (~33% compute overhead).',
        explanation: 'Activation checkpointing trades compute for memory: discarding activations saves huge VRAM, but recomputing them in backward adds up to ~33% extra FLOPs. Selective checkpointing (recomputing only cheap/memory-heavy ops like attention or norms) gets most of the memory win at a fraction of the compute cost.',
        devilsAdvocate: 'When can enabling activation checkpointing actually *increase* overall tokens/sec throughput despite the extra FLOPs?',
        daOptions: [
          'When the freed VRAM lets you double micro-batch size or avoid offloading/extra pipeline stages, lifting GPU utilization (MFU) by more than the recompute cost.',
          'Whenever sequence length is shorter than 128 tokens.',
          'Because autograd skips gradient calculation on checkpointed layers.'
        ],
        daCorrect: 0
      },
      {
        id: 'fw-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'You wrap a PyTorch model with `torch.compile(model)` and see almost zero speedup — and compiling takes forever. Checking logs shows dozens of "graph breaks" per forward pass. What is happening?',
        options: [
          'TorchDynamo hits unsupported Python side effects or data-dependent control flow (like `.item()` or `if tensor.sum() > 0:`), splitting the model into tiny subgraphs that cannot be fused by Inductor.',
          'torch.compile only accelerates inference, never training.',
          'The GPU ran out of Tensor Cores.',
          'Inductor requires rewriting the model in C++ first.'
        ],
        correct: 0,
        narrowing: 'What does TorchDynamo need in order to hand a big chain of ops to TorchInductor for Triton kernel fusion? What happens if your Python code calls `.item()` in the middle of a layer?',
        secondHint: 'Calling `.item()` forces a CPU-GPU sync and exits the traced FX graph, chopping one fusable graph into separate eager fragments.',
        explanation: 'Graph breaks happen when TorchDynamo encounters untraceable Python constructs, CPU syncs (`.item()`, `print(tensor)`), or data-dependent branches. Each break stops Inductor from fusing across the boundary and re-introduces Python/kernel-launch overhead.',
        devilsAdvocate: 'Even with ZERO graph breaks, why might `torch.compile` give a huge 2.5x speedup on a small model at B=1, yet only ~10–15% on a giant 70B dense training run?',
        daOptions: [
          'Giant dense runs are already dominated by cuBLAS GEMMs and FlashAttention (already optimal hand-tuned kernels), whereas small B=1 runs suffer heavily from Python dispatch and unfused elementwise HBM traffic.',
          'Because TorchInductor disables itself on models over 10B parameters.',
          'Because 70B models do not use elementwise ops.'
        ],
        daCorrect: 0
      },
      {
        id: 'fw-4',
        tier: 4,
        kind: 'Edge case',
        question: 'During small-batch inference, your profiler shows each GPU kernel takes 12 µs, yet there are 25 µs empty gaps between kernels on the GPU timeline. Adding faster GPUs does not help. What is the bottleneck and the standard fix?',
        options: [
          'HBM thermal throttling — fix by lowering clock speed.',
          'CPU launch overhead (Python/CUDA dispatch cannot enqueue kernels fast enough to keep the GPU fed) — fix by capturing the whole decode step in a CUDA Graph (`torch.cuda.CUDAGraph`).',
          'InfiniBand congestion — fix by enabling FP8.',
          'Garbage collection in VRAM — fix by calling `torch.cuda.empty_cache()` every step.'
        ],
        correct: 1,
        narrowing: 'Look at those numbers: GPU work = 12 µs, gap between kernels = 25 µs. Who is responsible for telling the GPU which kernel to launch next?',
        secondHint: 'If the CPU takes ~25 µs in Python/PyTorch dispatcher per op, the GPU finishes in 12 µs and sits idle waiting for the next launch. How do you replay 100 kernel launches in 1 single CPU call?',
        explanation: 'When kernels are tiny (common in small-batch decode), CPU Python/CUDA launch overhead exceeds GPU execution time ("CPU-bound GPU"). CUDA Graphs record the entire sequence of kernel launches once and replay it with a single ~3–5 µs host call.',
        devilsAdvocate: 'What is the main catch with CUDA Graphs in dynamic LLM serving (varying batch sizes & sequence lengths)?',
        daOptions: [
          'CUDA Graphs require fixed tensor shapes and static memory addresses, so servers like vLLM/SGLang capture a discrete bucket of graph sizes (e.g., B=1,2,4,8,16...) and pad live batches to the nearest bucket.',
          'CUDA Graphs cannot run on Tensor Cores.',
          'CUDA Graphs double the size of model weights in VRAM.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'precision-quant',
    short: 'Mixed Precision & Quantization',
    branchId: 'branch-single-gpu',
    chapterId: 'ch-5',
    brainTopicId: 'topic-quantization',
    summary: 'BF16 vs FP16 dynamic range, FP8/FP4 block scaling, outlier channels, and KV-cache compression.',
    probes: [
      {
        id: 'quant-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'Why did frontier LLM pretraining overwhelmingly switch from FP16 to BF16, even though BF16 has *fewer* precision (mantissa) bits than FP16 (7 vs 10)?',
        options: [
          'BF16 uses 8 bits per number instead of 16.',
          'BF16 keeps FP32’s full 8-bit exponent (range up to ~3.4e38 vs FP16’s 65,504), preventing gradient overflow/underflow and eliminating brittle dynamic loss scaling.',
          'FP16 cannot represent negative numbers.',
          'BF16 runs twice as fast in HBM bandwidth as FP16.'
        ],
        correct: 1,
        narrowing: 'Compare the bit layout: FP16 is 1 sign / 5 exponent / 10 mantissa (max ~65,504). BF16 is 1 sign / 8 exponent / 7 mantissa. What fails first in deep neural network gradients: fine decimal precision or dynamic range?',
        secondHint: 'Deep Transformer gradients span huge orders of magnitude; overflowing 65,504 creates NaNs immediately unless you babysit loss scaling.',
        explanation: 'Neural networks tolerate slightly lower mantissa precision far better than exponent overflow/underflow. BF16 preserves FP32’s 8-bit exponent (~3.4e38 max), making large-scale training vastly more stable without loss-scaling gymnastics.',
        devilsAdvocate: 'Hold on — if exponent range is so important, why does FP8 training use *two* different formats (E4M3 for forward/weights, E5M2 for gradients)?',
        daOptions: [
          'Forward weights/activations need slightly more mantissa precision (E4M3), while backward gradients span a much wider dynamic range and need the extra exponent bit (E5M2).',
          'Because NVIDIA GPUs only have E4M3 on odd SMs and E5M2 on even SMs.',
          'Because E5M2 is a 16-bit format.'
        ],
        daCorrect: 0
      },
      {
        id: 'quant-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'An engineer applies naive per-tensor INT8 quantization to a 70B LLM’s activations and weights, and perplexity collapses. They conclude: "70B LLMs simply cannot be represented in 8 bits." What did they miss?',
        options: [
          'Large LLMs develop a tiny fraction (<0.1%) of systematic massive outlier channels in activations; a single per-tensor scale stretches the quantization grid to fit the outlier, crushing the other 99.9% of values to zero.',
          'INT8 only works on models smaller than 1B parameters.',
          'Weights cannot be negative in INT8.',
          'They forgot to quantize the tokenizer vocabulary.'
        ],
        correct: 0,
        narrowing: 'Suppose 99.9% of an activation tensor sits in `[-1, 1]`, while 2 channels sit at `60.0`. If you pick ONE scale factor for the entire tensor to map `[-60, 60]` onto `[-127, 127]`, how many integer levels remain for `[-1, 1]`?',
        secondHint: 'Only ~2 integer buckets (`-2, -1, 0, 1, 2`) survive for 99.9% of the tensor! How do SmoothQuant, AWQ, or fine-grained block scaling (MXFP4/FP8 tile scaling) solve this?',
        explanation: 'Emergent activation outliers ruin coarse per-tensor quantization by blowing up the scale factor. Fine-grained group/block scaling (e.g., DeepSeek-V3 1×128 tile FP8, MXFP4/NVFP4 16- or 32-element microscaling) or outlier smoothing (SmoothQuant/AWQ) preserves accuracy even down to 4 bits.',
        devilsAdvocate: 'In W4A16 (4-bit weights, 16-bit activations), why does dequantizing weights on the fly inside the kernel speed up decode at batch size 1, yet sometimes *slow down* prefill at batch size 64?',
        daOptions: [
          'Decode at B=1 is HBM bandwidth-bound (4x smaller weights = ~3-4x faster HBM load), while large-batch prefill is compute-bound where extra integer-to-BF16 dequant instructions overhead slows Tensor Cores (W8A8/FP8/FP4 native Tensor Cores are needed for compute-bound speedups).',
          'Because W4A16 disables KV caching during prefill.',
          'Because 4-bit weights cannot be multiplied by BF16 activations on GPUs.'
        ],
        daCorrect: 0
      },
      {
        id: 'quant-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'You want to train a frontier MoE model natively in FP8 (like DeepSeek-V3) without accuracy degradation. Which scaling granularity prevents outlier spikes from wrecking FP8 matmuls?',
        options: [
          'One global FP8 scale factor shared across the whole model.',
          'Fine-grained tile/block scaling (e.g., 1×128 activation tiles and 128×128 weight blocks) with FP32 accumulation inside Tensor Cores.',
          'Quantizing only the embedding table to FP8 and keeping all linear layers in FP32.',
          'Clipping every activation strictly to [-1, 1].'
        ],
        correct: 1,
        narrowing: 'Think about what happens when a single MoE token has an outlier activation in one channel: how small must the scaling block be so that outlier does not corrupt unrelated tokens or weight blocks?',
        secondHint: 'Fine-grained per-tile scaling (1×128 activations, 128×128 weights) isolates outliers locally, while periodic FP32 promotion prevents low-precision accumulation drift.',
        explanation: 'Block-wise FP8 scaling (pioneered at scale in DeepSeek-V3 and built directly into Blackwell NVFP4/MXFP4 hardware) confines outliers to small blocks (16–128 elements) and accumulates partial dot products in high-precision FP32.',
        devilsAdvocate: 'Wait — if you accumulate every GEMM dot product in FP32, doesn’t that make FP8 Tensor Cores just as slow as FP32?',
        daOptions: [
          'No — the multiplier array runs at native FP8/FP4 throughput (2x–4x BF16 TFLOPS) and inputs transfer at 8-bit/4-bit bandwidth; FP32 accumulation happens cheaply inside on-chip registers.',
          'Yes — FP32 accumulation cuts throughput down to FP32 speed.',
          'FP8 Tensor Cores never accumulate in FP32.'
        ],
        daCorrect: 0
      },
      {
        id: 'quant-4',
        tier: 4,
        kind: 'Edge case',
        question: 'At 128k context length, your BF16 KV cache explodes VRAM. You quantize KV cache to FP8, cutting KV VRAM in half — yet accuracy drops noticeably on needle-in-a-haystack retrieval. Why are *Keys* typically much more sensitive to quantization than *Values*, and how do engines mitigate it?',
        options: [
          'Keys contain sharp channel-wise RoPE/positional outliers that directly steer softmax attention weights (exponentially amplified); per-channel Key scaling or keeping sink/recent tokens in BF16 preserves retrieval.',
          'Values are never multiplied during attention.',
          'Keys are stored in INT1 while Values are stored in FP32.',
          'RoPE only applies to Values.'
        ],
        correct: 0,
        narrowing: 'Trace where Keys vs Values enter the attention equation `softmax(Q K^T / sqrt(d)) V`. Which one passes through an exponential (`softmax`) where small errors get amplified into completely wrong token selection?',
        secondHint: 'Key errors distort the `Q K^T` dot products before softmax, shifting probability mass away from the needle token. Keys also show strong per-channel outliers across sequence positions.',
        explanation: 'Key errors sit *before* the exponential softmax and exhibit strong channel-wise outliers, so coarse Key quantization can redirect attention away from critical context tokens. Per-channel Key quantization (or keeping attention sinks / high-precision scales) fixes it.',
        devilsAdvocate: 'How does Multi-Head Latent Attention (MLA) tackle the same KV-cache wall orthogonally to quantization?',
        daOptions: [
          'MLA projects K and V into a single low-rank compressed latent vector (c_KV) before caching — shrinking KV cache by ~90%+ at the architectural level, and can still be combined with FP8.',
          'MLA discards all KV vectors older than 4,096 tokens.',
          'MLA moves the KV cache to NVMe SSDs.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'distributed-parallel',
    short: 'Distributed Training & Collectives',
    branchId: 'branch-multi-gpu',
    chapterId: 'ch-6',
    brainTopicId: 'topic-distributed',
    summary: 'DDP, FSDP/ZeRO, Tensor Parallelism, Pipeline bubbles, Context Parallelism, and MoE All-to-All across NVLink vs InfiniBand.',
    probes: [
      {
        id: 'dist-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'You have 4 nodes × 8 H100 GPUs (900 GB/s NVLink inside each node; 400 GB/s InfiniBand across nodes). You want 8-way Tensor Parallelism (TP=8) and 4-way Data/FSDP Parallelism (DP=4). How must you map TP and DP onto the topology?',
        options: [
          'TP=8 across nodes over InfiniBand, DP=4 inside each node over NVLink.',
          'TP=8 inside each 8-GPU node over NVLink, and DP/FSDP=4 across nodes over InfiniBand.',
          'It does not matter — NCCL makes InfiniBand and NVLink identical latency.',
          'Put both TP and DP on PCIe to save NVLink for checkpointing.'
        ],
        correct: 1,
        narrowing: 'Compare how often each parallelism type communicates on the critical path: TP requires blocking AllReduce/ReduceScatter *twice per Transformer layer* (every few milliseconds), whereas DP/FSDP can overlap gradient sync with backward compute.',
        secondHint: 'Which collective is latency-sensitive and sits right on the blocking critical path of every single layer? That one MUST get the fastest link (NVLink).',
        explanation: 'Tensor Parallelism puts synchronous AllReduce/AllGather collectives directly on the critical path of every layer (twice per layer in forward & backward), so it belongs strictly inside fast intra-node NVLink. Data/FSDP syncs once per layer/step and overlaps well over slower inter-node InfiniBand.',
        devilsAdvocate: 'Wait — what changes on an NVIDIA GB200 NVL72 rack compared to an 8-GPU H100 node?',
        daOptions: [
          'NVLink extends across all 72 GPUs as one coherent high-bandwidth domain, enabling much wider Expert Parallelism (Wide-EP) and larger TP/CP groups without dropping onto slower InfiniBand.',
          'NVL72 removes HBM and uses InfiniBand for all matrix multiplies.',
          'NVL72 eliminates the need for collective communications entirely.'
        ],
        daCorrect: 0
      },
      {
        id: 'dist-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'A team switches from DDP to FSDP (ZeRO-3) across 64 GPUs and claims: "Great, FSDP shards parameters, gradients, and optimizer states across all 64 GPUs, so it communicates *less* network traffic than DDP!" Is that true?',
        options: [
          'Yes — sharding divides network traffic by 64x.',
          'No — FSDP (ZeRO-3) communicates ~1.5x MORE total bytes than DDP (an extra AllGather of weights in forward AND backward, plus ReduceScatter of grads), trading extra overlapped comms for massive VRAM savings.',
          'FSDP uses zero network communication.',
          'DDP only communicates during evaluation, not training.'
        ],
        correct: 1,
        narrowing: 'Count the collectives per parameter: DDP does 1 AllReduce of gradients (= 2× param bytes). In ZeRO-3/FSDP, each GPU only owns 1/N of the weights — so what must it fetch right before computing forward AND right before computing backward?',
        secondHint: 'ZeRO-3 does AllGather(weights) in forward (1×) + AllGather(weights) in backward (1×) + ReduceScatter(grads) (1×) = 3× param bytes vs DDP’s 2× param bytes!',
        explanation: 'FSDP/ZeRO-3 communicates 1.5× *more* volume than DDP (3× parameter size vs 2×). The reason it scales so well is that prefetching AllGather and overlapping ReduceScatter hides that traffic behind compute while slashing per-GPU model-state memory by N×.',
        devilsAdvocate: 'Why does DeepSeek-V3 / TorchTitan often use HSDP (Hybrid Sharded Data Parallel) on giant clusters instead of pure global ZeRO-3 across 2,048 GPUs?',
        daOptions: [
          'Pure ZeRO-3 across thousands of GPUs creates tiny, latency-bound AllGather chunks and cross-rack contention; HSDP shards within a smaller fast group (e.g., 1–8 nodes) and replicates across groups.',
          'Because ZeRO-3 crashes when N > 128.',
          'Because HSDP skips optimizer updates on half the nodes.'
        ],
        daCorrect: 0
      },
      {
        id: 'dist-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'In a naive 4-stage Pipeline Parallel setup with 4 micro-batches, GPUs sit idle in large "pipeline bubbles" at the start and end of every step. How do 1F1B (One-Forward-One-Backward) and interleaved / DualPipe schedules reduce bubble overhead and memory?',
        options: [
          '1F1B starts backward passes as soon as a micro-batch finishes forward (capping in-flight activations to P instead of M), and interleaving/bidirectional scheduling overlaps forward & backward across virtual stages to shrink the bubble fraction.',
          'They drop the last micro-batch whenever a GPU is busy.',
          'They eliminate backward passes on early pipeline stages.',
          'They merge all 4 GPUs into 1 giant single GPU.'
        ],
        correct: 0,
        narrowing: 'In naive GPipe, stage 0 runs ALL M micro-batches forward before ANY backward starts — how many micro-batches of activations must stage 0 hold in VRAM? What happens if stage 0 alternates 1 forward, 1 backward?',
        secondHint: '1F1B releases activations immediately after each micro-batch’s backward pass, and virtual stages (interleaving) or bidirectional DualPipe fill the remaining idle bubble slots.',
        explanation: '1F1B bounds peak activation memory to O(P) instead of O(M) by releasing activations early. Interleaved schedules and bidirectional DualPipe (used in DeepSeek-V3) further slash bubble time and overlap MoE All-to-All communication directly with computation.',
        devilsAdvocate: 'What happens to a 1F1B pipeline if one MoE expert receives 3x more tokens than other experts on stage 2?',
        daOptions: [
          'Stage 2 stalls every downstream and upstream stage synchronously, turning load imbalance into a cluster-wide pipeline bubble.',
          'Nothing — pipeline stages run completely asynchronously.',
          'PyTorch automatically migrates the expert to stage 0 mid-step.'
        ],
        daCorrect: 0
      },
      {
        id: 'dist-4',
        tier: 4,
        kind: 'Edge case',
        question: 'When scaling a massive Mixture-of-Experts (MoE) model with Expert Parallelism (EP=64), why does communication shift from AllReduce to All-to-All, and why can naive PyTorch/NCCL All-to-All stall Tensor Cores?',
        options: [
          'Every token routes dynamically to specific top-k experts living on different GPUs (requiring All-to-All token dispatch + combine); standard NCCL kernels reserve SMs and synchronize coarsely, whereas kernels like DeepEP use low-latency RDMA/NVLink + DualPipe overlap to keep Tensor Cores fed.',
          'All-to-All sends model weights instead of tokens.',
          'MoE models cannot use NCCL.',
          'AllReduce is strictly forbidden in FP8.'
        ],
        correct: 0,
        narrowing: 'Unlike dense TP where every GPU gets the same activations, in EP each GPU holds *different* experts. How do tokens get from the GPU that holds them to the GPU that owns their routed expert — and back?',
        secondHint: 'Every GPU must send a personalized subset of tokens to every other GPU (dispatch All-to-All) and receive processed outputs back (combine All-to-All), often under dynamic load skew.',
        explanation: 'Expert Parallelism requires two All-to-All collectives per MoE layer (dispatch + combine). Without careful SM budgeting and async overlap (like DeepEP + DualPipe), communication steals SMs from GEMMs and introduces heavy tail latency.',
        devilsAdvocate: 'In a Ring/Context-Parallel long-context training run (say 128k tokens split across 8 GPUs) with causal masking, why does naive sequential chunking (GPU 0 gets tokens 0..16k, GPU 7 gets 112k..128k) waste nearly half the cluster?',
        daOptions: [
          'Causal masking makes attention lower-triangular: GPU 0 attends to almost nothing while GPU 7 computes ~8x more attention FLOPs. Zig-zag / striped chunking balances causal compute equally across all GPUs.',
          'Because GPU 0 runs out of vocabulary embeddings.',
          'Because Ring Attention only works on non-causal encoders.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'inference-serving',
    short: 'Inference & KV-Cache Serving',
    branchId: 'branch-multi-gpu',
    chapterId: 'ch-7',
    brainTopicId: 'topic-inference',
    summary: 'Continuous batching, PagedAttention fragmentation, RadixAttention prefix sharing, and TTFT vs TPOT SLAs.',
    probes: [
      {
        id: 'inf-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'In static batching, 8 user prompts enter together: 7 finish in 40 tokens, while 1 generates 1,000 tokens. What happens to the 7 finished slots, and how does continuous (iteration-level) batching fix it?',
        options: [
          'The 7 finished slots sit wasted for 960 decode steps; continuous batching evicts finished requests at the end of every single token iteration and slots in queued requests immediately.',
          'Static batching truncates the 1,000-token request at 40 tokens.',
          'Static batching automatically halves the learning rate.',
          'Continuous batching removes the need for KV cache.'
        ],
        correct: 0,
        narrowing: 'In request-level (static) batching, the GPU only returns outputs and grabs a new batch once the *longest* sequence emits `<EOS>`. What are the other 7 lanes doing during steps 41..1000?',
        secondHint: 'Decoupling scheduling from the request level down to the single-token iteration level lets new prompts enter the batch the millisecond an earlier sequence finishes.',
        explanation: 'Static batching wastes huge GPU capacity waiting on the longest sequence in a batch. Iteration-level continuous batching (Orca, vLLM, SGLang) adds and retires requests every decode step, multiplying serving throughput.',
        devilsAdvocate: 'Wait — if you pack 256 concurrent requests into continuous batching, why does *throughput* (total tok/s) soar while per-user *TPOT* (inter-token latency) eventually degrades?',
        daOptions: [
          'Every extra concurrent request adds more KV cache to stream from HBM and more attention compute per step; past the roofline ridge point, decode turns compute-bound and step latency rises linearly with batch size.',
          'Because continuous batching disables Tensor Cores above batch size 32.',
          'Because HTTP connections timeout above 100 requests.'
        ],
        daCorrect: 0
      },
      {
        id: 'inf-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'Before vLLM’s PagedAttention, an inference server pre-allocated a contiguous KV-cache tensor of size `max_seq_len = 8192` for every incoming request. An engineer says: "We have 60 GB free VRAM and average response length is only 400 tokens, so we can easily fit 10x more concurrent requests!" Why did their server OOM instead?',
        options: [
          'Contiguous pre-allocation reserves the full 8,192-token worst-case slab per request up front, losing 60–80% of KV VRAM to internal and external fragmentation.',
          'KV cache is stored in FP64 on legacy servers.',
          'Attention heads duplicate the entire model weights per request.',
          'Nothing is wrong — contiguous allocation never wastes VRAM.'
        ],
        correct: 0,
        narrowing: 'When a request arrives, does the server know in advance whether it will stop at 400 tokens or 8,000 tokens? If it must allocate one contiguous buffer, how big does it have to reserve?',
        secondHint: 'Just like OS virtual memory solves RAM fragmentation with fixed-size pages, PagedAttention allocates tiny non-contiguous KV blocks (e.g., 16 tokens) on demand.',
        explanation: 'Contiguous KV allocation wastes 60–80% of VRAM on reserved-but-unused future tokens and fragmented gaps. PagedAttention partitions KV cache into fixed-size blocks via a block table, slashing waste to <4% and enabling copy-on-write sharing.',
        devilsAdvocate: 'What is the tiny runtime cost PagedAttention pays compared to a contiguous KV buffer?',
        daOptions: [
          'An extra block-table indirection lookup inside the attention kernel (and non-contiguous block loads), which is tiny compared to the massive batch-size gain from eliminating fragmentation.',
          'It doubles the number of FLOPs in every MLP layer.',
          'It forces all KV blocks onto CPU RAM.'
        ],
        daCorrect: 0
      },
      {
        id: 'inf-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'You serve an agentic coding product where 500 concurrent requests share the same 12,000-token system prompt + repo summary, plus multi-turn conversation history. Your GPU spends 85% of its time recomputing prefill. Which serving technique cuts TTFT by ~5–10x immediately?',
        options: [
          'Disable continuous batching.',
          'Automatic prefix caching (RadixAttention / KV-block hashing), indexing cached KV blocks in a radix tree so shared prefixes are computed once and reused with zero recompute.',
          'Switch from BF16 to FP32.',
          'Increase temperature from 0.2 to 1.0.'
        ],
        correct: 1,
        narrowing: 'Because causal attention for token `i` depends ONLY on tokens `0..i`, are the KV tensors for that 12,000-token prefix identical across all 500 requests?',
        secondHint: 'If you keep those KV blocks resident in VRAM indexed by token prefix (like SGLang’s RadixAttention LRU radix tree), a cache hit skips 12,000 tokens of prefill entirely.',
        explanation: 'Causal attention makes prefix KV states completely reusable across requests with matching leading tokens. RadixAttention (SGLang) and APC (vLLM) maintain a prefix tree / block hash map with LRU eviction, collapsing redundant prefill compute and TTFT.',
        devilsAdvocate: 'Suppose your load balancer routes multi-turn requests randomly (round-robin) across 16 replicas. What happens to your RadixAttention cache hit rate?',
        daOptions: [
          'It collapses by ~16x (most turns land on cold replicas), which is why production stacks use prefix-aware / KV-cache-aware routing to steer requests to the replica already holding their warm prefix.',
          'Nothing — GPUs automatically share VRAM over Ethernet.',
          'Hit rate improves because load is evenly spread.'
        ],
        daCorrect: 0
      },
      {
        id: 'inf-4',
        tier: 4,
        kind: 'Edge case',
        question: 'During a traffic spike, your vLLM server’s KV-cache blocks hit 100% utilization while 120 decode requests are still mid-generation. What must the scheduler do to avoid crashing with CUDA OOM, and what latency artifact do users see?',
        options: [
          'Silently corrupt old KV blocks and continue generating.',
          'Preempt/evict lower-priority running sequences (either swapping their KV blocks to CPU RAM or dropping & recomputing them later), causing sudden multi-second TPOT stall spikes for evicted users.',
          'Automatically quantize the model to 1-bit mid-step.',
          'Double the GPU’s HBM capacity using NVLink.'
        ],
        correct: 1,
        narrowing: 'Every active decode sequence needs 1 new token slot per step, and 0 free KV blocks remain. You cannot shrink existing sequences — what are the only two ways to free KV blocks right now?',
        secondHint: 'Either offload a victim sequence’s KV blocks over PCIe to host RAM (swap) or discard them and re-prefill later (recomputation) once memory frees up.',
        explanation: 'When KV memory saturates, serving engines trigger preemption (swap to CPU or drop-and-recompute). Monitoring preemption rate and KV cache utilization is critical in production, because preemption causes severe tail-latency cliffs.',
        devilsAdvocate: 'Between "swap to CPU over PCIe" and "drop & recompute later", when is recomputation actually *faster* than swapping?',
        daOptions: [
          'When PCIe bandwidth is saturated or prompts are short/compute is plentiful (e.g. chunked prefill), recomputing a few hundred tokens on Tensor Cores can beat a slow PCIe round-trip.',
          'Recomputation is always slower in every case.',
          'Swapping is impossible because GPUs cannot write to CPU RAM.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'disagg-speculative',
    short: 'Disaggregated & Speculative',
    branchId: 'branch-multi-gpu',
    chapterId: 'ch-8',
    brainTopicId: 'topic-disagg',
    summary: 'Prefill/Decode disaggregation, KV transfer over RDMA, chunked prefill, and lossless speculative decoding / MTP.',
    probes: [
      {
        id: 'dis-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'A single GPU pool runs both prefill and decode in the same engine. 64 users are smoothly streaming decode at 25 ms/token. Suddenly a user submits a 32,000-token document prompt. Without chunked prefill or disaggregation, what happens to the 64 decoding users?',
        options: [
          'Nothing — decode runs on a separate hardware unit from prefill.',
          'All 64 decoding users freeze for hundreds of milliseconds (a giant ITL/TPOT jitter spike) while the GPU is monopolized by the compute-heavy 32k prefill.',
          'The 32k prefill is dropped automatically.',
          'Decode speeds up because batch size increased to 65.'
        ],
        correct: 1,
        narrowing: 'Prefill on 32,000 tokens is hugely compute-bound (~500–1500 ms on one step). If that step runs synchronously inside the same iteration loop as the 64 decode tokens, when do the 64 users get their next token?',
        secondHint: 'Prefill and decode have opposite hardware profiles (compute-bound vs memory-bound) and interfere violently when colocated.',
        explanation: 'Colocating long prefills with active decodes causes severe inter-token latency (ITL) stalls ("prefill-decode interference"). Chunked prefill mitigates it by slicing prefills into small chunks, while full Prefill-Decode Disaggregation separates them onto dedicated GPU pools.',
        devilsAdvocate: 'Wait — if you split Prefill GPUs and Decode GPUs onto separate machines, what brand-new bottleneck do you just create?',
        daOptions: [
          'Transferring the newly computed KV cache (hundreds of MB to GBs for long prompts) from Prefill GPU HBM to Decode GPU HBM over RDMA/NVLink fast enough not to hurt TTFT.',
          'Decode GPUs lose access to the model weights.',
          'You can no longer use continuous batching on Decode GPUs.'
        ],
        daCorrect: 0
      },
      {
        id: 'dis-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'Someone argues: "Speculative decoding uses a tiny 1B draft model to propose 5 tokens for a 70B target model, so the output quality is slightly degraded — it’s basically a lossy approximation trick." What is the flaw in this claim?',
        options: [
          'Speculative decoding only works for greedy decoding (temperature=0).',
          'Standard speculative decoding is mathematically LOSSLESS: the 70B target verifies all 5 draft tokens in one parallel forward pass and uses rejection sampling so the output distribution is provably identical to running the 70B model alone.',
          'The 1B draft model is never actually executed.',
          'Nothing is wrong — draft models always reduce output quality.'
        ],
        correct: 1,
        narrowing: 'Remember the verification step: the 70B target model computes exact probabilities for all K draft tokens in parallel, and accepts/rejects each token using `min(1, p_target / p_draft)` plus residual resampling. What distribution does that sample from?',
        secondHint: 'Rejection sampling guarantees the exact target distribution `p_target(x)` — zero quality loss! Why is verifying 5 tokens almost as fast as generating 1?',
        explanation: 'Speculative decoding exploits the fact that decode is HBM bandwidth-bound: reading the 70B weights once lets the GPU verify K=5 draft tokens in nearly the same time as 1 token, while rejection sampling preserves the exact target output distribution.',
        devilsAdvocate: 'If speculative decoding is lossless and speeds up low-batch decode by 2–3x, why do production servers often turn it *OFF* at very high batch sizes (e.g., B=128+)?',
        daOptions: [
          'At high batch sizes, decode is already compute-bound (past the roofline ridge point), so verifying K extra draft tokens per request burns real Tensor Core FLOPs and can actually make latency *worse*.',
          'Because rejection sampling becomes lossy above batch size 32.',
          'Because draft models cannot be batched.'
        ],
        daCorrect: 0
      },
      {
        id: 'dis-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'In a disaggregated serving architecture (like Mooncake or NVIDIA Dynamo), why do operators choose *different* parallelism configs for the Prefill pool vs the Decode pool?',
        options: [
          'Prefill optimizes TTFT with lower TP / higher DP (or CP for long context) to maximize compute efficiency, whereas Decode optimizes TPOT & huge batch throughput with wider TP/EP (e.g., Wide-EP across NVL72) to aggregate HBM bandwidth and KV capacity.',
          'Decode pools cannot use Tensor Parallelism.',
          'Prefill pools run on CPUs while Decode runs on GPUs.',
          'They must always use identical parallelism configs.'
        ],
        correct: 0,
        narrowing: 'Prefill wants high FLOPs efficiency (low comm overhead) for TTFT. Decode wants maximum aggregate HBM bandwidth + KV-cache capacity for TPOT and large batching. Would you run the same TP/EP ratio on both?',
        secondHint: 'Separating the two pools lets you right-size the prefill-to-decode GPU ratio (e.g., 1P:3D or 2P:1D depending on prompt-to-output length) and tune parallelism independently for each phase.',
        explanation: 'Disaggregation lets Prefill and Decode scale and parallelize independently: you can tune the P:D ratio to match live prompt/output workloads and optimize Prefill for compute/TTFT while optimizing Decode for aggregate HBM bandwidth/Wide-EP/TPOT.',
        devilsAdvocate: 'How does Mooncake avoid recomputing prefills when a long prefix already exists in the cluster, even if it was evicted from Prefill GPU VRAM?',
        daOptions: [
          'It treats pooled CPU DRAM and NVMe SSDs across cluster nodes as a distributed KVCache-centric storage tier transferred over RDMA, turning cache hits into network reads instead of expensive prefill recompute.',
          'It stores prompts in browser localStorage.',
          'It re-trains a LoRA adapter per user.'
        ],
        daCorrect: 0
      },
      {
        id: 'dis-4',
        tier: 4,
        kind: 'Edge case',
        question: 'Compare a standalone draft model (e.g., 1B drafting for 70B) vs Multi-Token Prediction (MTP) / EAGLE-3 heads trained directly on top of the target model’s hidden states. Why are MTP and EAGLE-3 winning in modern frontier serving?',
        options: [
          'They require a separate tokenizer.',
          'Because they reuse the target model’s rich internal hidden states directly with a tiny lightweight head — avoiding separate KV-cache management, vocabulary mismatches, and achieving higher acceptance rates at lower draft latency.',
          'Because they skip target verification completely.',
          'Because standalone draft models cannot run on NVIDIA GPUs.'
        ],
        correct: 1,
        narrowing: 'Think about the pain of deploying a standalone 1B draft model alongside a 671B MoE target: separate weights, separate KV cache, lower alignment with target logits, and extra scheduling complexity. What does an MTP/EAGLE head already have access to?',
        secondHint: 'An MTP/EAGLE head sees the exact last-layer hidden representation of the target model itself, making next-token drafting dramatically more aligned and lightweight.',
        explanation: 'MTP (DeepSeek-V3) and EAGLE-3 draft directly from the target model’s own hidden states via tiny lightweight heads, eliminating draft-target vocabulary/distribution drift and simplifying KV management while pushing higher acceptance lengths.',
        devilsAdvocate: 'When verifying a *tree* of speculative candidates (tree attention in Medusa/EAGLE) instead of a single linear chain, what changes in the attention mask?',
        daOptions: [
          'You pass a custom tree-structured causal mask so sibling draft branches do not attend to each other while still sharing their common ancestor KV prefix in a single parallel forward pass.',
          'You disable causal masking completely.',
          'You run one separate forward pass per leaf node.'
        ],
        daCorrect: 0
      }
    ]
  },
  {
    id: 'clusters-rl-infra',
    short: 'Clusters & RLVR Post-Training',
    branchId: 'branch-multi-gpu',
    chapterId: 'ch-10',
    brainTopicId: 'topic-rl',
    summary: 'Large-cluster reliability, async checkpointing, and RLVR rollout-verifier-trainer orchestration.',
    probes: [
      {
        id: 'rl-1',
        tier: 1,
        kind: 'Predict outcome',
        question: 'You run a synchronous 16,384-GPU pretraining job where every step requires a global AllReduce barrier. One single GPU has a thermal/PCIe glitch that makes it 2x slower (a straggler), or fails outright every ~3 hours. What happens to the other 16,383 GPUs?',
        options: [
          'They keep training at full speed and ignore the slow GPU.',
          'All 16,383 healthy GPUs stall at the collective barrier at the speed of the single slowest GPU — and a single unhandled failure halts the entire job until checkpoint restart.',
          'PyTorch automatically reduces the model size by 1/16,384.',
          'Only GPUs on the same rack are affected.'
        ],
        correct: 1,
        narrowing: 'In synchronous data/pipeline/tensor parallelism, step `t+1` cannot start until every rank finishes the global gradient sync of step `t`. What is the runtime of `max(t_1, t_2, ..., t_16384)`?',
        secondHint: 'At 16k GPUs, hardware failures happen multiple times per day (MTBF drops linearly with N). That is why automated health checks, hot spares, and async in-memory checkpointing are core ML infra.',
        explanation: 'In synchronous training, 1 straggler bottlenecks the entire cluster and mean time between failures scales as ~1/N. Frontier clusters rely on continuous telemetry, automated node draining/hot-spare swap, and asynchronous non-blocking checkpointing to keep goodput >95%.',
        devilsAdvocate: 'What is "Silent Data Corruption" (SDC) on a GPU cluster, and why is it far scarier than a GPU crashing with an XID error?',
        daOptions: [
          'A flaky GPU computes slightly wrong floating-point numbers without crashing — silently poisoning gradients/weights across the whole run until loss spikes days later.',
          'SDC happens when disk space fills up.',
          'SDC only affects network cables, never GPU ALUs.'
        ],
        daCorrect: 0
      },
      {
        id: 'rl-2',
        tier: 2,
        kind: 'Find the flaw',
        question: 'A team builds an RLVR (GRPO) post-training loop for coding/math reasoning. They use standard PyTorch training code to generate rollouts (up to 16k tokens per sample) before updating weights, and wonder why 85% of wall-clock time is wasted. A teammate says: "Just add more training GPUs for the backward pass!" What is the flaw?',
        options: [
          'GRPO does not have a backward pass.',
          'In reasoning RL, autoregressive rollout generation + long-tail trajectory stragglers dominate wall-clock time (70–90%), not gradient updates. You need high-throughput inference engines (vLLM/SGLang), fast weight sync, and async/pipelined rollouts.',
          'RLVR only runs on CPUs.',
          'Nothing is wrong — backward pass is always the slowest part of RL.'
        ],
        correct: 1,
        narrowing: 'Think about the ratio of tokens generated during 16k-token chain-of-thought rollouts (memory-bound decode, batch of 8–16 rollouts per prompt) vs 1 forward/backward policy update (compute-bound prefill-like pass). Where is the GPU actually spending time?',
        secondHint: 'Even worse: in synchronous RL, if 1 trajectory out of 512 generates 16,000 tokens while the rest finish at 2,000, the entire training cluster sits idle waiting on that 1 rollout!',
        explanation: 'Reasoning RL (GRPO/RLVR) flips the bottleneck from training compute to autoregressive inference rollouts and long-tail sequence stragglers. Modern RL frameworks (verl, OpenRLHF, async actor-learner pipelines) pair vLLM/SGLang rollout engines with fast NCCL weight updates and asynchronous off-policy streaming.',
        devilsAdvocate: 'If you go fully asynchronous (streaming rollouts continuously while the trainer updates weights in the background), what subtle ML/systems bug do you now have to control?',
        daOptions: [
          'Policy staleness (off-policy drift): trajectories generated by weights from N steps ago diverge from the current policy, requiring bounded staleness and importance-sampling / clipping corrections.',
          'Async rollouts double the parameter count of the model.',
          'You can no longer run unit tests as rewards.'
        ],
        daCorrect: 0
      },
      {
        id: 'rl-3',
        tier: 3,
        kind: 'Apply to a new case',
        question: 'Your coding-agent RL pipeline needs to execute 20,000 untrusted model-generated Python/Bash solutions per minute to compute verifiable rewards. Why can you NOT simply run `subprocess.run()` on the GPU training nodes?',
        options: [
          'Python subprocesses do not work on Linux.',
          'Model-generated code can fork-bomb, exhaust CPU/RAM, read credentials/weights, or corrupt the GPU host; you need isolated fleets of fast ephemeral microVM/container sandboxes (Firecracker/gVisor/Modal) decoupled from GPU workers.',
          'Verifiers must run inside CUDA kernels.',
          'Subprocesses disable NCCL automatically.'
        ],
        correct: 1,
        narrowing: 'Imagine an RL policy exploring random bash commands (`rm -rf`, `while True: fork()`, network calls) on the same host running your $300k H100 node. What happens to security, determinism, and host CPU headroom?',
        secondHint: 'Ephemeral microVMs/sandboxes give millisecond cold-starts, strict CPU/memory/network quotas, and zero blast radius to the GPU fleet.',
        explanation: 'Agentic RL turns code execution into a first-class distributed systems tier: fleets of ephemeral, strictly sandboxed microVMs (e.g., Firecracker/gVisor/Modal-style pools) isolate untrusted rollouts, enforce deterministic timeouts, and keep GPU nodes dedicated to tensor compute.',
        devilsAdvocate: 'Wait — in a colocated RL engine (like verl HybridEngine) where the *same* GPUs alternate between SGLang rollout and FSDP training, how do you avoid paying a slow disk save/load every single RL step?',
        daOptions: [
          'Reshard and broadcast updated weights directly in GPU HBM / over NVLink & RDMA (all-in-memory weight transfer) while offloading optimizer states/KV cache cleanly between phases.',
          'Keep the model weights frozen forever.',
          'Write checkpoints to S3 every step and re-download them.'
        ],
        daCorrect: 0
      },
      {
        id: 'rl-4',
        tier: 4,
        kind: 'Edge case',
        question: 'You notice that during RLVR training, the exact same trajectory gets slightly different log-probabilities from the vLLM/SGLang rollout engine (FP8/BF16 inference kernels) vs the FSDP/Megatron trainer (BF16 training kernels). Why does this tiny numerical mismatch matter in RL?',
        options: [
          'It never matters — RL is immune to floating-point noise.',
          'Importance-sampling ratios `exp(log_p_train - log_p_rollout)` amplify small numerical discrepancies across long 16k-token sequences, destabilizing policy gradients and causing entropy collapse unless logprobs are reconciled or matched carefully.',
          'Because vLLM uses a different alphabet than PyTorch.',
          'It only matters for image models.'
        ],
        correct: 1,
        narrowing: 'Look at the PPO/GRPO ratio `r_t = exp(log p_new - log p_old)` summed or multiplied across thousands of reasoning tokens. What happens when `p_rollout` (from FP8/inference kernels) disagrees systematically with `p_train` (from training kernels)?',
        secondHint: 'Even a 1% per-token logprob divergence looks like false off-policy drift to the RL objective, triggering aggressive clipping or unstable gradient explosions.',
        explanation: 'Train-inference numerical mismatch (different quantization, attention kernels, or reduction orders between rollout and trainer) injects bias into RL importance ratios over long horizons. Recomputing reference logprobs under aligned kernels or enforcing deterministic/batch-invariant kernels is a major frontier RL infra challenge.',
        devilsAdvocate: 'If you recompute `log_p_old` inside the trainer to eliminate kernel mismatch, are you truly removing the discrepancy between the behavior policy that sampled the tokens and the trainer?',
        daOptions: [
          'No — the tokens were still sampled from the inference engine’s true distribution, so trainer-recomputed logprobs only hide the mismatch; keeping inference/train numerics aligned or tracking true rollout logprobs for importance correction is still necessary.',
          'Yes — recomputing always makes the two distributions identical.',
          'RL algorithms do not use log-probabilities.'
        ],
        daCorrect: 0
      }
    ]
  }
];

export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'diag-1',
    difficulty: 'Easy',
    label: 'Diagnostic 1 / 5 · Single-GPU Physics',
    testsSubskills: ['gpu-roofline'],
    question: 'You deploy a 70B BF16 model for single-user (batch size = 1) chat on H100 GPUs. You upgrade to a hypothetical GPU with 2× the Tensor Core TFLOPS, but the exact same HBM bandwidth. What happens to your tokens/sec?',
    options: [
      'Roughly 2× faster, since Transformers are mostly matrix multiplications.',
      'Almost no change (~0% faster), because B=1 decode streams weights from HBM at ~1 FLOP/byte and is strictly HBM bandwidth-bound.',
      '~1.5× faster because attention speeds up while embeddings stay flat.',
      'I am not sure yet.'
    ],
    correct: 1
  },
  {
    id: 'diag-2',
    difficulty: 'Easy–Med',
    label: 'Diagnostic 2 / 5 · Memory & Autograd',
    testsSubskills: ['frameworks-autograd', 'precision-quant'],
    question: 'You want to train a 7B model in BF16 mixed precision using standard AdamW (with FP32 master weights & moments). Excluding activations, roughly how much VRAM do weights + gradients + optimizer states consume?',
    options: [
      '~14 GB (7B × 2 bytes).',
      '~28 GB (weights + gradients).',
      '~112 GB (~16 bytes/param: BF16 weights/grads + FP32 master/m/v).',
      'I am not sure yet.'
    ],
    correct: 2
  },
  {
    id: 'diag-3',
    difficulty: 'Medium',
    label: 'Diagnostic 3 / 5 · Kernels & SRAM',
    testsSubskills: ['kernels-tiling'],
    question: 'FlashAttention deliberately recomputes attention scores during the backward pass instead of saving the N×N matrix from the forward pass. Why does doing *extra* FLOPs make it significantly faster?',
    options: [
      'It drops most attention weights to zero via sparse approximation.',
      'It eliminates O(N²) HBM reads/writes by tiling inside fast on-chip SRAM; HBM traffic was the real bottleneck, not FLOPs.',
      'It offloads softmax to the host CPU.',
      'I am not sure yet.'
    ],
    correct: 1
  },
  {
    id: 'diag-4',
    difficulty: 'Med–Hard',
    label: 'Diagnostic 4 / 5 · Distributed Topology',
    testsSubskills: ['distributed-parallel'],
    question: 'On 4 nodes × 8 GPUs (fast NVLink inside each node, slower InfiniBand across nodes), you combine TP=8 and FSDP/DP=4. Which placement is right, and how does FSDP (ZeRO-3) compare to DDP in total bytes communicated?',
    options: [
      'TP=8 inside each node (NVLink), FSDP=4 across nodes (IB); FSDP actually communicates ~1.5× MORE bytes than DDP (overlapped) in exchange for sharding VRAM.',
      'TP=8 across nodes (IB), FSDP=4 inside each node (NVLink); FSDP communicates 4× less bytes than DDP.',
      'Either placement performs the same because NCCL abstracts away NVLink vs IB.',
      'I am not sure yet.'
    ],
    correct: 0
  },
  {
    id: 'diag-5',
    difficulty: 'Hard',
    label: 'Diagnostic 5 / 5 · Production Serving & RL Infra',
    testsSubskills: ['inference-serving', 'disagg-speculative', 'clusters-rl-infra'],
    question: 'In a live serving cluster colocating prefill & decode (or a synchronous reasoning RL rollout step), a single 32k-token prompt/trajectory enters alongside 64 short decode streams. What happens, and what is the architectural fix?',
    options: [
      'The 64 decode streams stall on inter-token latency (or idle at the RL barrier) due to the long compute-bound prefill / straggler rollout; fix with chunked prefill or prefill-decode disaggregation (and async rollouts in RL).',
      'The 64 decode streams speed up because larger batches have better Tensor Core utilization.',
      'Nothing happens because PagedAttention isolates compute as well as memory.',
      'I am not sure yet.'
    ],
    correct: 0
  }
];

export const INTEGRATIVE_CAPSTONE = {
  id: 'capstone-1',
  kind: 'Integrative Systems Problem',
  question: 'End-to-end design check: You must serve a 70B MoE reasoning model with 64k context, tight TTFT (<400 ms) AND tight TPOT (<25 ms), and reuse the same GPU fleet overnight for async GRPO coding RL. Which combination of design choices is physically sound?',
  options: [
    'Colocate long prefills with decode using static batching + FP16 contiguous KV cache; run `subprocess.run()` directly on the GPU nodes for RL code rewards.',
    'Disaggregate Prefill & Decode pools with prefix-aware RadixAttention routing + FP8/block-scaled weights & KV cache + PagedAttention; overnight, pair SGLang/vLLM rollout engines with FSDP trainers via in-memory weight sync and isolated microVM sandboxes for verifiers.',
    'Use TP=64 across InfiniBand for both Prefill and Decode, disable prefix caching, and always force speculative decoding at batch size 256.',
    'Keep everything in FP32 with activation checkpointing enabled during inference.'
  ],
  correct: 1,
  explanation: 'Every layer connects: FP8/block-scaling & PagedAttention relieve the HBM wall, prefix-aware RadixAttention + P/D disaggregation protect TTFT & TPOT simultaneously, and overnight RL separates fast inference rollouts, in-memory weight sync, and sandboxed microVM verifiers.'
};
