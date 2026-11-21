// Obsidian Brain — Beginner-Friendly ML Infra Topic Hubs & Concept Graph
// Each hub connects to milestones in data.js, blogs in BLOG_INDEX, and prerequisite/next topics.

export const TOPIC_HUBS = [
  {
    id: 'topic-gpus',
    step: 1,
    title: 'How GPUs & AI Silicon Work',
    short: '1. GPUs & Silicon',
    domain: 'compute',
    level: 'Beginner',
    summary:
      'Everything in ML infrastructure starts with one physical reality: moving data from memory (HBM) to compute cores (Tensor Cores) is usually slower than doing the math itself.',
    mentalModel:
      'Think of a GPU as a massive factory with thousands of tiny calculators (cores) fed by a tiny, ultra-fast workbench (SRAM) and a huge, slower warehouse (HBM). Modern ML infra is the art of keeping the calculators busy instead of waiting on the warehouse.',
    glossary: [
      { term: 'FLOPs vs. Memory Bandwidth', def: 'Compute speed (how fast you multiply) vs. how fast you can load weights/data from HBM.' },
      { term: 'Arithmetic Intensity', def: 'FLOPs performed per byte loaded. High = compute-bound (prefill/training); low = memory-bound (token decode).' },
      { term: 'HBM vs. SRAM', def: 'HBM is large (80–192GB) & slower (~3–8 TB/s). On-chip SRAM is tiny (~20–50MB) & blazingly fast (~20+ TB/s).' },
      { term: 'NVLink / InfiniBand', def: 'High-speed interconnects linking GPUs inside a node (NVLink) and across nodes (InfiniBand/RoCE).' }
    ],
    milestones: ['cuda', 'tpu-v1', 'transformer', 'a100', 'h100', 'blackwell', 'custom-silicon-wave', 'ai-factories-2026'],
    nextTopics: ['topic-kernels', 'topic-frameworks']
  },
  {
    id: 'topic-kernels',
    step: 2,
    title: 'GPU Programming & Kernels',
    short: '2. Kernels & CUDA',
    domain: 'kernels',
    level: 'Intermediate',
    summary:
      'A "kernel" is a small function that runs in parallel across thousands of GPU threads. Writing good kernels means tiling data into fast SRAM and fusing operations so you don’t waste HBM round-trips.',
    mentalModel:
      'If you run 5 separate PyTorch ops (add, multiply, norm, relu, scale), the GPU writes to the HBM warehouse 5 times. A fused kernel loads data once onto the SRAM workbench, does all 5 steps, and writes back once.',
    glossary: [
      { term: 'SIMT / Warp', def: '32 GPU threads executing the same instruction in lockstep (a warp in NVIDIA CUDA).' },
      { term: 'Kernel Fusion', def: 'Combining multiple sequential operations into one GPU kernel to avoid intermediate HBM reads/writes.' },
      { term: 'Tiling', def: 'Breaking giant matrices into small blocks that fit inside fast on-chip shared memory (SRAM).' },
      { term: 'Triton / CuTe / ThunderKittens', def: 'Higher-level tile-based DSLs that let engineers write fast kernels without raw assembly pain.' }
    ],
    milestones: ['cuda', 'cudnn', 'triton-lang', 'thunderkittens', 'flashmla-fp8'],
    nextTopics: ['topic-attention', 'topic-frameworks', 'topic-quantization']
  },
  {
    id: 'topic-frameworks',
    step: 3,
    title: 'Frameworks & Graph Compilers',
    short: '3. Frameworks & Compilers',
    domain: 'frameworks',
    level: 'Beginner',
    summary:
      'Frameworks give you automatic differentiation (backprop) in Python, while compilers (XLA, torch.compile) inspect your model graph and automatically fuse ops into fast GPU/TPU code.',
    mentalModel:
      'Eager mode (PyTorch) is like an interpreter—easy to debug line-by-line, but pays Python overhead. Compilers (XLA, TorchInductor) trace your code into a blueprint and compile fused machine code.',
    glossary: [
      { term: 'Autograd', def: 'Automatic differentiation engine that tracks tensor ops to compute gradients during backprop.' },
      { term: 'Eager vs. Graph Mode', def: 'Executing ops immediately in Python vs. capturing the whole computation graph to optimize ahead of time.' },
      { term: 'torch.compile (Dynamo + Inductor)', def: 'Captures Python bytecode graphs safely and compiles them into fused Triton GPU kernels.' },
      { term: 'XLA / GSPMD', def: 'Google’s whole-program linear algebra compiler powering JAX and TPUs with automatic sharding.' }
    ],
    milestones: ['theano', 'caffe', 'tensorflow', 'pytorch', 'xla', 'jax', 'pytorch2'],
    nextTopics: ['topic-distributed', 'topic-kernels']
  },
  {
    id: 'topic-attention',
    step: 4,
    title: 'Attention & The Memory Wall',
    short: '4. Attention & KV Cache',
    domain: 'kernels',
    level: 'Intermediate',
    summary:
      'Standard Transformer attention scales quadratically O(N²) in memory with sequence length. IO-aware algorithms like FlashAttention and latent compression (MLA) broke this wall.',
    mentalModel:
      'Instead of printing out a giant N×N spreadsheet of every token-to-token score in HBM, FlashAttention computes small tiles on-chip using "online softmax" and throws away the intermediate scores.',
    glossary: [
      { term: 'FlashAttention', def: 'IO-aware exact attention that tiles Q, K, V in SRAM and reduces memory from O(N²) to O(N).' },
      { term: 'KV Cache', def: 'Saved Key and Value tensors of previous tokens during generation so we don’t recompute the prompt every token.' },
      { term: 'MLA (Multi-Head Latent Attention)', def: 'DeepSeek’s low-rank KV compression that shrinks KV cache size by >90%.' },
      { term: 'Warp Specialization', def: 'Dedicating some warps to async memory loading (TMA) and others to matrix math (WGMMA) in FlashAttention-3.' }
    ],
    milestones: ['transformer', 'flashattention', 'flashattention3', 'ring-attention', 'flashmla-fp8'],
    nextTopics: ['topic-inference', 'topic-distributed']
  },
  {
    id: 'topic-quantization',
    step: 5,
    title: 'Low-Precision & Quantization',
    short: '5. Quantization (FP8/FP4)',
    domain: 'kernels',
    level: 'Beginner',
    summary:
      'Neural networks don’t need 32-bit precision. Shrinking numbers from FP32 → BF16 → FP8 → FP4 halves memory usage and doubles bandwidth & Tensor Core throughput.',
    mentalModel:
      'Weights are like ingredients you have to haul from the warehouse (HBM) for every token. Packing them into 4-bit or 8-bit boxes instead of 16-bit boxes lets you haul 2–4× more per trip.',
    glossary: [
      { term: 'BF16 (Brain Float 16)', def: '16-bit float with the same dynamic range as FP32—eliminated FP16 overflow headaches.' },
      { term: 'FP8 / NVFP4', def: '8-bit and micro-scaled 4-bit formats natively accelerated on Hopper (H100) and Blackwell (B200) Tensor Cores.' },
      { term: 'Outlier Channels', def: 'Tiny fraction (~0.1%) of activation channels with huge values that must be scaled carefully (AWQ, SmoothQuant).' },
      { term: 'QLoRA / GGUF', def: '4-bit quantization techniques enabling fine-tuning on single GPUs and local inference on laptops.' }
    ],
    milestones: ['mixed-precision', 'quantization-wave', 'llamacpp', 'flashmla-fp8', 'blackwell'],
    nextTopics: ['topic-inference', 'topic-gpus']
  },
  {
    id: 'topic-distributed',
    step: 6,
    title: 'Distributed Training & 5D Parallelism',
    short: '6. Distributed Training',
    domain: 'distributed',
    level: 'Intermediate',
    summary:
      'Frontier models don’t fit on 1 GPU—they train across 10,000+ GPUs using combinations of Data, Tensor, Pipeline, Context, and Expert Parallelism.',
    mentalModel:
      'Imagine cooking for 10,000 guests: Data Parallelism = 10 identical kitchens cooking different orders; Tensor Parallelism = 8 chefs chopping the same dish simultaneously; Pipeline Parallelism = an assembly line (prep → cook → plate).',
    glossary: [
      { term: 'AllReduce / NCCL', def: 'Collective communication that sums gradients across all GPUs directly over NVLink/InfiniBand.' },
      { term: 'ZeRO / FSDP', def: 'Shards optimizer states, gradients, and weights across GPUs instead of duplicating them.' },
      { term: 'Tensor Parallelism (TP)', def: 'Splits individual matrix multiplications across GPUs inside one fast NVLink node.' },
      { term: 'Pipeline (PP), Context (CP) & Expert (EP)', def: 'Splitting layers across nodes (PP), long sequences (CP), or Mixture-of-Experts routers (EP / DeepEP).' }
    ],
    milestones: ['alexnet-gpu', 'distbelief', 'nccl', 'horovod', 'megatron', 'deepspeed-zero', 'fsdp', 'ring-attention', 'deepseek-infra'],
    nextTopics: ['topic-orchestration', 'topic-rl']
  },
  {
    id: 'topic-inference',
    step: 7,
    title: 'LLM Inference & Serving Engines',
    short: '7. Inference & Serving',
    domain: 'inference',
    level: 'Beginner',
    summary:
      'Serving LLMs in production has two very different phases: Prefill (reading your prompt—compute-bound) and Decode (generating 1 token at a time—memory-bandwidth-bound).',
    mentalModel:
      'vLLM and SGLang are like operating systems for GPU memory: Continuous Batching keeps the GPU full every millisecond, PagedAttention eliminates memory fragmentation, and RadixAttention caches shared prompt prefixes.',
    glossary: [
      { term: 'TTFT vs. TPOT', def: 'Time To First Token (prefill latency) vs. Time Per Output Token (decode speed / tokens per sec).' },
      { term: 'Continuous Batching', def: 'Adding/removing requests at every single token iteration instead of waiting for the slowest request.' },
      { term: 'PagedAttention (vLLM)', def: 'Stores KV caches in non-contiguous memory pages like OS virtual memory, slashing waste.' },
      { term: 'RadixAttention (SGLang)', def: 'Caches shared prompt prefixes in a radix tree so multi-turn chats & agents reuse KV caches automatically.' }
    ],
    milestones: ['tensorrt', 'triton-server', 'orca', 'vllm', 'llamacpp', 'trt-llm', 'sglang'],
    nextTopics: ['topic-disagg', 'topic-rl']
  },
  {
    id: 'topic-disagg',
    step: 8,
    title: 'Disaggregated & Speculative Serving',
    short: '8. Disaggregated & MTP',
    domain: 'inference',
    level: 'Advanced',
    summary:
      'Modern AI factories split Prefill and Decode onto separate GPU pools and use Speculative Decoding / Multi-Token Prediction to generate 2–3× more tokens per memory read.',
    mentalModel:
      'Mixing long prompt reading (prefill) with fast typing (decode) on the same GPU causes traffic jams. Disaggregation gives prefill and decode separate lanes, while Speculative Decoding lets a fast drafter guess 4 tokens ahead and verify them in one shot.',
    glossary: [
      { term: 'P/D Disaggregation', def: 'Running prefill on compute-optimized GPUs and streaming KV caches over RDMA to decode-optimized GPUs.' },
      { term: 'Speculative Decoding (EAGLE-3)', def: 'A lightweight draft head proposes multiple future tokens; the main model verifies all of them in parallel—100% lossless.' },
      { term: 'MTP (Multi-Token Prediction)', def: 'Training models natively with extra heads to predict multiple tokens ahead.' }
    ],
    milestones: ['disaggregated-serving', 'speculative-mtp', 'ai-factories-2026'],
    nextTopics: ['topic-rl']
  },
  {
    id: 'topic-orchestration',
    step: 9,
    title: 'Cluster Orchestration & Data',
    short: '9. Clusters & Data',
    domain: 'orchestration',
    level: 'Beginner',
    summary:
      'Running thousands of GPUs reliably requires schedulers (Kubernetes, Slurm, Ray), high-throughput data streaming, and open model hubs.',
    mentalModel:
      'At 10,000+ GPUs, a hardware failure happens every few hours. Orchestration is the air-traffic controller that detects bad GPUs, restarts jobs from checkpoints, and keeps data flowing faster than GPUs can eat it.',
    glossary: [
      { term: 'Kubernetes vs. Slurm', def: 'K8s excels at elastic serving & multi-tenant cloud; Slurm excels at gang-scheduled HPC training.' },
      { term: 'Ray', def: 'Distributed Python actor/task fabric bridging data prep, training, serving, and RL rollouts.' },
      { term: 'Safetensors & Hub', def: 'Fast, memory-mappable, secure weight format standardized by Hugging Face.' }
    ],
    milestones: ['mapreduce', 'spark', 'kubernetes', 'ray', 'huggingface'],
    nextTopics: ['topic-rl']
  },
  {
    id: 'topic-rl',
    step: 10,
    title: 'Post-Training RL & Agent Infra',
    short: '10. RL & Agent Frontier',
    domain: 'orchestration',
    level: 'Advanced',
    summary:
      'Reasoning models (o1/R1) and coding agents unified training and inference into one loop: generate millions of rollouts, grade them in sandboxes, update weights, and repeat.',
    mentalModel:
      'Pretraining is reading textbooks. Post-training RL infra is a giant gymnasium where models run millions of live coding/math practice attempts in microVM sandboxes using vLLM/SGLang, then immediately train on what worked.',
    glossary: [
      { term: 'HybridEngine (verl)', def: 'Dynamically reshards weights between inference engines (vLLM/SGLang) and training engines (FSDP/Megatron) on the same GPUs.' },
      { term: 'GRPO / RLVR', def: 'Reinforcement Learning with Verifiable Rewards (unit tests, math verifiers) driving reasoning models.' },
      { term: 'Agent Sandboxes & Kernel Synthesis', def: 'Sub-second microVM fleets for coding agents, including AI systems that write and benchmark their own CUDA/Triton kernels.' }
    ],
    milestones: ['rl-posttraining-infra', 'agent-runtime-2026', 'deepseek-infra', 'ray'],
    nextTopics: []
  }
];
