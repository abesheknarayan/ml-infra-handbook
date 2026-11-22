// ML Infra Atlas — Chapter-Wise Study Guide
// Written in plain English with concrete mental models, real numbers, and hands-on practice.

export const CHAPTERS = [
  {
    id: 'ch-0',
    number: 0,
    part: 'Part 0 · Big Picture',
    title: 'The ML Infra Factory: End-to-End Overview',
    readTime: '6 min read',
    level: 'Start here',
    intro:
      'Before zooming into GPUs, kernels, or serving engines, step back and look at the entire machine. Whether you are training a trillion-parameter model or streaming a single ChatGPT reply, every workload travels through the same five-station factory.',
    sections: [
      {
        heading: 'The Five Stations in Order',
        body:
          '1) Cluster & Data (Ch. 9–10): Schedulers like Kubernetes, Slurm, and Ray allocate thousands of GPUs, stream training data, checkpoint progress, and run RL rollout sandboxes. 2) Serving Engine (Ch. 7–8): Systems like vLLM and SGLang accept user prompts, batch requests dynamically, and manage KV cache memory. 3) Network Fabric (Ch. 6): NVLink (inside a server) and InfiniBand/Ethernet (across servers) move gradients and KV caches between GPUs. 4) HBM Memory Vault (Ch. 1, 4–5): High-Bandwidth Memory holds the model weights and KV cache on each chip. 5) SRAM & Tensor Cores (Ch. 1–3): The actual matrix-multiply engines that turn weights and tokens into predictions.'
      },
      {
        heading: 'Why Chapter 1 Starts at the GPU',
        body:
          'Once you see the whole factory, one question naturally follows: why is everything above the chip so complicated? Because of the physics at Stations 4 and 5. A modern GPU does math far faster than it can read weights from HBM, and a single chip is too small to hold frontier models. Every tool you will learn—Triton, torch.compile, FlashAttention, quantization, FSDP, vLLM, and disaggregated serving—exists to work around those exact hardware limits. Understanding the GPU first makes every other chapter click immediately.'
      }
    ],
    practice: [
      'Toggle the factory animation above between Inference Mode and Training Mode and trace where each workload spends most of its time.',
      'Click any of the 5 stations in the Factory Strip at the top to preview how each chapter maps to a specific part of the stack.',
      'When you are ready, click "Next: Ch 1" to zoom straight into Station 4 & 5 (HBM → SRAM → Tensor Cores).'
    ],
    readings: [
      { title: 'How to Scale Your Model (Overview) — Google DeepMind', url: 'https://jax-ml.github.io/scaling-book/' },
      { title: 'The Ultra-Scale Playbook — Hugging Face', url: 'https://huggingface.co/spaces/nanotron/ultrascale-playbook' }
    ],
    relatedMilestones: ['cuda', 'pytorch', 'flashattention', 'vllm', 'deepseek-infra'],
    brainTopicId: 'topic-gpus'
  },
  {
    id: 'ch-1',
    number: 1,
    part: 'Part I · Hardware & Execution',
    title: 'How GPUs Actually Work',
    readTime: '8 min read',
    level: 'Start here',
    intro:
      'Most people treat a GPU like a faster CPU. That single misconception makes almost every ML performance problem mysterious. A CPU is built to finish one complicated task quickly; a GPU is built to run thousands of simple math operations at the exact same time—and its biggest bottleneck is almost always moving data, not doing math.',
    sections: [
      {
        heading: 'Compute vs. Memory Bandwidth (The Roofline Model)',
        body:
          'An NVIDIA H100 can perform roughly 989 TFLOPS of BF16 matrix math, while its main memory (HBM3) moves data at 3.35 TB/s. Divide those two numbers: 989 / 3.35 ≈ 295 FLOPs per byte. That ratio—called the ridge point—tells you everything. If your operation does fewer than ~295 math operations per byte it loads from HBM, the Tensor Cores sit idle waiting for memory. That is why LLM decoding (batch size 1) uses less than 2% of a GPU’s compute.'
      },
      {
        heading: 'The Memory Hierarchy: HBM vs. On-Chip SRAM',
        body:
          'Inside the chip, each Streaming Multiprocessor (SM) has a tiny scratchpad of SRAM (shared memory & registers)—only tens of megabytes across the whole GPU, but over 20 TB/s of bandwidth. HBM is 80–192 GB but much slower. Almost every famous ML infra breakthrough of the last five years (FlashAttention, kernel fusion, quantization) is really just a clever way to avoid trips to HBM.'
      }
    ],
    practice: [
      'Read Modal’s GPU Glossary entries on SMs, Warps, HBM, and Shared Memory.',
      'Benchmark `torch.matmul` on a GPU across batch sizes 1, 8, 64, and 512 and measure achieved TFLOPS vs. theoretical peak.',
      'Calculate the ridge point (FLOPs / Memory Bandwidth) for an A100, H100, and B200 on paper.'
    ],
    readings: [
      { title: 'Making Deep Learning Go Brrrr From First Principles — Horace He', url: 'https://horace.io/brrr_intro.html' },
      { title: 'The GPU Glossary — Modal', url: 'https://modal.com/gpu-glossary' },
      { title: 'How to Scale Your Model (Ch. 1: Roofline) — Google DeepMind', url: 'https://jax-ml.github.io/scaling-book/' }
    ],
    relatedMilestones: ['cuda', 'a100', 'h100', 'blackwell'],
    brainTopicId: 'topic-gpus'
  },
  {
    id: 'ch-2',
    number: 2,
    part: 'Part I · Hardware & Execution',
    title: 'Writing Fast Kernels: CUDA, Fusion & Triton',
    readTime: '10 min read',
    level: 'Core skill',
    intro:
      'A kernel is simply a function that runs in parallel across thousands of GPU threads. You rarely need to write raw CUDA assembly from scratch, but understanding how kernels tile memory and fuse operations is what separates someone who uses PyTorch from an ML infra engineer.',
    sections: [
      {
        heading: 'Why Kernel Fusion Matters',
        body:
          'Suppose you compute `y = torch.relu(x * a + b)` in eager PyTorch. Without fusion, the GPU launches three separate kernels: read x and a from HBM, write temp1 to HBM; read temp1 and b, write temp2; read temp2, write y. Fusing them into a single kernel loads x, a, b once into registers, performs all three operations, and writes y once—often a 3× speedup with zero change to the math.'
      },
      {
        heading: 'From Raw CUDA to Tile Programming (Triton & CuTe)',
        body:
          'Raw CUDA gives you thread-level control (warps of 32 threads, coalesced loads, avoiding shared memory bank conflicts). OpenAI Triton raised the abstraction one level: you write Python code over 2D blocks/tiles of data, and the compiler handles coalescing and shared-memory scheduling. Newer tools like CuTe and ThunderKittens expose Hopper/Blackwell hardware features (TMA, WGMMA) through clean tile abstractions.'
      }
    ],
    practice: [
      'Solve the first 8 puzzles in Sasha Rush’s GPU-Puzzles repository.',
      'Follow Simon Boehm’s CUDA Matmul walkthrough and trace how shared-memory tiling cuts global memory reads.',
      'Write a fused RMSNorm or Softmax kernel in OpenAI Triton and benchmark it against eager PyTorch.'
    ],
    readings: [
      { title: 'How to Optimize a CUDA Matmul Kernel — Simon Boehm', url: 'https://siboehm.com/articles/22/CUDA-MMM' },
      { title: 'GPU Puzzles — Sasha Rush', url: 'https://github.com/srush/GPU-Puzzles' },
      { title: 'ThunderKittens Paper — Stanford HazyResearch', url: 'https://arxiv.org/abs/2410.20399' }
    ],
    relatedMilestones: ['cuda', 'cudnn', 'triton-lang', 'thunderkittens'],
    brainTopicId: 'topic-kernels'
  },
  {
    id: 'ch-3',
    number: 3,
    part: 'Part I · Hardware & Execution',
    title: 'Frameworks & Compilers: PyTorch, torch.compile & JAX',
    readTime: '8 min read',
    level: 'Core skill',
    intro:
      'Deep learning frameworks do two jobs: they track math operations so automatic differentiation can compute gradients, and they dispatch those operations to hardware accelerators. The entire history of frameworks is a tug-of-war between Python ergonomics and whole-graph compiler speed.',
    sections: [
      {
        heading: 'Eager Execution vs. Graph Compilation',
        body:
          'Early frameworks like Theano and TensorFlow 1 forced you to define a static graph before running anything—fast, but painful to debug. PyTorch won research by executing eagerly line by line like NumPy. The catch: Python dispatch overhead and no automatic cross-op kernel fusion.'
      },
      {
        heading: 'How Modern Compilers Solve Both',
        body:
          'PyTorch 2.0 introduced TorchDynamo (which inspects CPython bytecode to capture graphs automatically without rewriting your model) paired with TorchInductor (which lowers those graphs into fused Triton kernels). On the other side, JAX embraces pure functional transformations (`jit`, `grad`, `vmap`, `shard_map`) compiled end-to-end by XLA—making multi-chip TPU and GPU sharding remarkably clean.'
      }
    ],
    practice: [
      'Wrap a small Transformer block in `torch.compile` and run with `TORCH_LOGS="output_code"` to inspect the generated Triton kernels.',
      'Profile a training step with `torch.profiler` and identify CPU dispatch overhead vs. GPU kernel execution time.'
    ],
    readings: [
      { title: 'PyTorch 2.0 Release & Compiler Architecture', url: 'https://pytorch.org/blog/pytorch-2.0-release/' },
      { title: 'JAX Documentation & Functional Transformations', url: 'https://github.com/jax-ml/jax' }
    ],
    relatedMilestones: ['theano', 'tensorflow', 'pytorch', 'xla', 'jax', 'pytorch2'],
    brainTopicId: 'topic-frameworks'
  },
  {
    id: 'ch-4',
    number: 4,
    part: 'Part II · Scaling Models & Memory',
    title: 'Attention, KV Cache & Breaking the Memory Wall',
    readTime: '9 min read',
    level: 'Core skill',
    intro:
      'Self-attention is what makes Transformers powerful, and it is also what breaks GPU memory. Understanding how FlashAttention and KV cache compression work is mandatory for both training and serving long-context models.',
    sections: [
      {
        heading: 'How FlashAttention Works',
        body:
          'Naive attention computes `S = Q @ K^T` (an N×N matrix), writes it to HBM, reads it back for softmax, writes P to HBM, and reads it again to multiply by V. At 32k context length, that N×N matrix explodes memory. FlashAttention loads small tiles of Q, K, and V into fast SRAM, computes exact softmax incrementally using a running max and denominator ("online softmax"), and never writes the N×N matrix to HBM.'
      },
      {
        heading: 'KV Cache & Multi-Head Latent Attention (MLA)',
        body:
          'During text generation, models cache the Key and Value vectors of every previous token so they don’t recompute the entire conversation on every new word. For large models at long context, the KV cache quickly becomes larger than the model weights themselves. Grouped-Query Attention (GQA) and DeepSeek’s Multi-Head Latent Attention (MLA) compress those cached vectors so you can serve far more concurrent users per GPU.'
      }
    ],
    practice: [
      'Compute the exact KV cache memory in GB for a 70B model (80 layers, 8 KV heads, head_dim 128, BF16) at sequence length 32,768 and batch size 16.',
      'Implement online softmax in 15 lines of Python/PyTorch and verify it matches `torch.softmax`.'
    ],
    readings: [
      { title: 'FlashAttention Paper — Tri Dao et al.', url: 'https://arxiv.org/abs/2205.14135' },
      { title: 'FlashAttention-3 Deep Dive — Together AI', url: 'https://www.together.ai/blog/flashattention-3' },
      { title: 'DeepSeek-V3 Technical Report (MLA Architecture)', url: 'https://arxiv.org/abs/2412.19437' }
    ],
    relatedMilestones: ['transformer', 'flashattention', 'flashattention3', 'flashmla-fp8'],
    brainTopicId: 'topic-attention'
  },
  {
    id: 'ch-5',
    number: 5,
    part: 'Part II · Scaling Models & Memory',
    title: 'Low-Precision Numerics & Quantization',
    readTime: '7 min read',
    level: 'Core skill',
    intro:
      'Every time we halve the bit-width of model weights—from FP32 to BF16 to FP8 to FP4—we cut memory usage in half, double effective memory bandwidth, and unlock 2× faster Tensor Cores. The engineering challenge is doing it without degrading model quality.',
    sections: [
      {
        heading: 'Training Precision: FP32 → BF16 → FP8',
        body:
          'BF16 kept FP32’s 8-bit exponent range while trimming mantissa bits, which eliminated the gradient overflow/underflow bugs of FP16. Modern Hopper and Blackwell clusters train in block-scaled FP8 (using fine-grained per-tile scaling factors, as popularized in DeepSeek-V3) while keeping master weights and optimizer states in higher precision.'
      },
      {
        heading: 'Inference Quantization: Outliers, AWQ & FP4',
        body:
          'Quantizing weights to 4 bits works surprisingly well once you account for "activation outliers"—a tiny fraction (~0.1%) of channels with huge magnitudes. Methods like AWQ, SmoothQuant, QLoRA (NF4), and hardware-native NVFP4 preserve those salient channels so 4-bit models stay nearly indistinguishable from 16-bit.'
      }
    ],
    practice: [
      'Estimate how many H100 80GB GPUs are needed to hold a 70B model’s weights in FP16 (140GB), FP8 (70GB), and INT4 (35GB).',
      'Run a quantized GGUF model locally with `llama.cpp` and compare tokens/sec between Q8_0 and Q4_K_M.'
    ],
    readings: [
      { title: 'QLoRA Paper — Tim Dettmers et al.', url: 'https://arxiv.org/abs/2305.14314' },
      { title: 'AWQ: Activation-Aware Weight Quantization', url: 'https://arxiv.org/abs/2306.00978' }
    ],
    relatedMilestones: ['mixed-precision', 'quantization-wave', 'llamacpp', 'blackwell'],
    brainTopicId: 'topic-quantization'
  },
  {
    id: 'ch-6',
    number: 6,
    part: 'Part II · Scaling Models & Memory',
    title: 'Distributed Training & 5D Parallelism',
    readTime: '11 min read',
    level: 'Intermediate',
    intro:
      'Training a frontier model requires coordinating thousands of GPUs as if they were one machine. Doing that efficiently means overlapping GPU communication (NCCL collectives over NVLink and InfiniBand) with compute so GPUs never sit idle waiting on the network.',
    sections: [
      {
        heading: 'The Five Dimensions of Parallelism',
        body:
          '1) Data Parallelism (DP) + ZeRO/FSDP: split batches across GPUs and shard optimizer states, gradients, and weights to remove memory duplication. 2) Tensor Parallelism (TP): split individual matrix multiplications across GPUs inside a single fast NVLink node. 3) Pipeline Parallelism (PP): place different transformer layers on different nodes and stream microbatches (1F1B / DualPipe). 4) Context Parallelism (CP): shard long sequences across GPUs (Ring Attention). 5) Expert Parallelism (EP): place Mixture-of-Experts weights on different GPUs and route tokens via fast All-to-All kernels (DeepEP).'
      },
      {
        heading: 'The Metric That Matters: MFU',
        body:
          'Model FLOPs Utilization (MFU) measures actual useful training FLOPs divided by the cluster’s theoretical peak FLOPs. Well-tuned dense runs hit 45–55% MFU; dropping to 20% usually means a communication stall, data-loader bottleneck, or pipeline bubble.'
      }
    ],
    practice: [
      'Read Hugging Face’s Ultra-Scale Playbook chapter on memory math (weights + gradients + Adam optimizer = 16 bytes/param in mixed precision).',
      'Run a 2-GPU or multi-process PyTorch FSDP script and inspect NCCL AllGather / ReduceScatter overlap in a Chrome trace.'
    ],
    readings: [
      { title: 'The Ultra-Scale Playbook — Hugging Face', url: 'https://huggingface.co/spaces/nanotron/ultrascale-playbook' },
      { title: 'How to Train Really Large Models on Many GPUs — Lilian Weng', url: 'https://lilianweng.github.io/posts/2021-09-25-train-large/' },
      { title: 'DeepEP: High-Throughput MoE Communication Kernels', url: 'https://github.com/deepseek-ai/DeepEP' }
    ],
    relatedMilestones: ['nccl', 'megatron', 'deepspeed-zero', 'fsdp', 'ring-attention', 'deepseek-infra'],
    brainTopicId: 'topic-distributed'
  },
  {
    id: 'ch-7',
    number: 7,
    part: 'Part III · Production Inference & Systems',
    title: 'LLM Serving Internals: vLLM, SGLang & Batching',
    readTime: '10 min read',
    level: 'Core skill',
    intro:
      'Inference is where most AI companies spend their actual money. Unlike training, serving has strict latency budgets: users care about how fast the first word appears (TTFT) and how smoothly words stream out (TPOT / inter-token latency).',
    sections: [
      {
        heading: 'Prefill vs. Decode',
        body:
          'When a user sends a 4,000-token prompt, the GPU processes all 4,000 tokens in parallel (Prefill)—this is compute-bound and saturates Tensor Cores. Then the model generates the answer one token at a time (Decode)—each step reads the entire model weights and KV cache from HBM just to produce one token per user. Batching many users together amortizes that weight read across the whole batch.'
      },
      {
        heading: 'Continuous Batching, PagedAttention & RadixAttention',
        body:
          'Three systems ideas transformed open-source serving: Continuous Batching (Orca) swaps finished requests out at every single token step; PagedAttention (vLLM) splits KV caches into fixed-size virtual memory pages so fragmentation drops from ~70% to <4%; and RadixAttention (SGLang) organizes cached prefixes in a radix tree so multi-turn chats and agent trees automatically skip recomputing shared prompts.'
      }
    ],
    practice: [
      'Read Kipply’s "Transformer Inference Arithmetic" and compute max batch size before decode becomes compute-bound.',
      'Read Aleksa Gordić’s deep dive on vLLM internals and trace how the scheduler, KV block manager, and worker loop interact.'
    ],
    readings: [
      { title: 'Transformer Inference Arithmetic — Kipply', url: 'https://kipp.ly/transformer-inference-arithmetic/' },
      { title: 'Inside vLLM: Anatomy of a High-Throughput LLM Serving System — Aleksa Gordić', url: 'https://www.aleksagordic.com/blog/vllm' },
      { title: 'SGLang Paper (RadixAttention) — LMSYS', url: 'https://arxiv.org/abs/2312.07104' }
    ],
    relatedMilestones: ['orca', 'vllm', 'sglang', 'trt-llm'],
    brainTopicId: 'topic-inference'
  },
  {
    id: 'ch-8',
    number: 8,
    part: 'Part III · Production Inference & Systems',
    title: 'Disaggregated Serving & Speculative Decoding',
    readTime: '8 min read',
    level: 'Advanced',
    intro:
      'At high scale, mixing compute-heavy prefill and latency-sensitive decode on the same GPU causes unpredictable tail latency. And reasoning models generating 10,000+ thinking tokens make decode speed the primary user-experience bottleneck.',
    sections: [
      {
        heading: 'Prefill / Decode Disaggregation',
        body:
          'Systems like DistServe, Moonshot’s Mooncake, and NVIDIA Dynamo run Prefill on one pool of GPUs and Decode on another, streaming the computed KV cache over RDMA or NVLink between them. Each pool can independently choose its ideal parallelism, batch size, and even hardware type.'
      },
      {
        heading: 'Speculative Decoding & Multi-Token Prediction (MTP)',
        body:
          'Because decode is memory-bandwidth bound, checking 4–5 candidate tokens in one forward pass costs almost the exact same time as generating 1 token. Speculative decoding (EAGLE-3) and native Multi-Token Prediction heads draft several tokens ahead and verify them in parallel—giving 2–3× faster generation with mathematically identical output distributions.'
      }
    ],
    practice: [
      'Sketch the network bandwidth needed to transfer a 32k-token KV cache from a prefill node to a decode node within 50ms.',
      'Compare standard decoding vs. EAGLE/MTP speculative decoding in SGLang or vLLM benchmarks.'
    ],
    readings: [
      { title: 'DistServe: Disaggregating Prefill and Decoding (OSDI 2024)', url: 'https://arxiv.org/abs/2401.09670' },
      { title: 'Mooncake: KVCache-Centric Disaggregated Architecture', url: 'https://arxiv.org/abs/2407.00079' },
      { title: 'EAGLE-3 Speculative Decoding Paper', url: 'https://arxiv.org/abs/2503.01840' }
    ],
    relatedMilestones: ['disaggregated-serving', 'speculative-mtp', 'ai-factories-2026'],
    brainTopicId: 'topic-disagg'
  },
  {
    id: 'ch-9',
    number: 9,
    part: 'Part III · Production Inference & Systems',
    title: 'Clusters, Schedulers & Data Pipelines',
    readTime: '7 min read',
    level: 'Core skill',
    intro:
      'At 1,000+ GPUs, hardware failures aren’t rare incidents—they are a daily steady state. Reliable ML infrastructure is as much about fault tolerance, fast checkpointing, and data throughput as it is about CUDA.',
    sections: [
      {
        heading: 'Slurm, Kubernetes & Ray',
        body:
          'Traditional large pretraining runs often use Slurm for topology-aware gang scheduling (all 2,048 GPUs start together on the same InfiniBand switches). Production serving and multi-tenant platforms lean on Kubernetes for autoscaling and isolation. Ray sits on top as a Python-native distributed actor fabric, increasingly used for data processing and RL post-training.'
      },
      {
        heading: 'Checkpointing & Data Feeding',
        body:
          'If a single GPU drops an XID error in a 4,096-GPU job, the whole run pauses. Async in-memory/NVMe checkpointing (writing weights in seconds instead of minutes) and deterministic streaming datasets keep "goodput" (productive training time) above 95%.'
      }
    ],
    practice: [
      'Read Meta’s Llama 3 cluster reliability notes on silent data corruption (SDC), GPU failure rates, and automated health checks.',
      'Explore how `safetensors` memory-maps weights to cut cold-start model loading times.'
    ],
    readings: [
      { title: 'Scaling Kubernetes to 7,500+ Nodes — OpenAI', url: 'https://openai.com/index/scaling-kubernetes-to-7500-nodes/' },
      { title: 'Ray: A Distributed Framework for Emerging AI Applications', url: 'https://www.usenix.org/conference/osdi18/presentation/moritz' }
    ],
    relatedMilestones: ['kubernetes', 'spark', 'ray', 'huggingface'],
    brainTopicId: 'topic-orchestration'
  },
  {
    id: 'ch-10',
    number: 10,
    part: 'Part IV · The Frontier',
    title: 'RL Post-Training & Agent Infrastructure',
    readTime: '8 min read',
    level: 'Frontier',
    intro:
      'The newest shift in ML systems is that training and inference have merged. Reasoning models and coding agents run massive reinforcement learning loops: generate millions of long rollouts using vLLM/SGLang, grade them inside sandboxed environments, sync the updated weights back to FSDP/Megatron, and repeat.',
    sections: [
      {
        heading: 'How RL Post-Training Systems Work (verl & HybridEngine)',
        body:
          'Unlike pretraining where every sequence has a fixed length, RL rollouts have wildly uneven lengths (some reasoning traces finish in 500 tokens, others take 30,000). Frameworks like verl (HybridFlow) and OpenRLHF coordinate async rollout engines, fast weight-resharding between inference and training layouts, and high-throughput reward verification.'
      },
      {
        heading: 'Agent Sandboxes & Closed-Loop Kernel Synthesis',
        body:
          'Running verifiable rewards at scale requires fleets of sub-second ephemeral microVM sandboxes that can execute generated code, run unit tests, and return deterministic reward signals without bottlenecking the GPU cluster. At the very edge of the stack, these same RL verification loops are now being applied back to ML infrastructure itself—benchmarking and synthesizing custom CUDA, Triton, and CuTe kernels automatically.'
      }
    ],
    practice: [
      'Trace the memory and network cost of resharding a 70B policy model from FSDP training layout to vLLM Tensor-Parallel inference layout.',
      'Explore how verl’s HybridEngine overlaps asynchronous rollout generation with gradient updates.'
    ],
    readings: [
      { title: 'HybridFlow / verl Paper (EuroSys 2025)', url: 'https://arxiv.org/abs/2409.19256' },
      { title: 'KernelBench — Automated GPU Kernel Evaluation', url: 'https://arxiv.org/abs/2502.10517' },
      { title: 'Interconnects — RLHF & Post-Training Systems', url: 'https://www.interconnects.ai/' }
    ],
    relatedMilestones: ['rl-posttraining-infra', 'agent-runtime-2026', 'deepseek-infra'],
    brainTopicId: 'topic-rl'
  },
  {
    id: 'ch-11',
    number: 11,
    part: 'Part IV · The Frontier',
    title: 'Emerging Paradigms (Living Chapter)',
    readTime: 'Auto-updated every 2h',
    level: 'Living feed',
    isLivingChapter: true,
    intro:
      'ML infrastructure moves fast enough that static textbooks go stale in months. This chapter automatically tracks newly emerging paradigms across Google DeepMind, Meta, PyTorch, Thinking Machines Lab, Allen Institute (Ai2), Modal, CoreWeave, NVIDIA, vLLM, LMSYS, and arXiv every 2 hours.',
    sections: [
      {
        heading: 'How New Paradigms Enter This Handbook',
        body:
          'Every two hours, the crawler scans 25 frontier lab blogs, open-source release streams, and arXiv ML systems papers. Incoming breakthroughs are tagged into existing chapters (so Chapters 1–10 continuously pick up new developments) and grouped below whenever new paradigms gain momentum—such as autonomous kernel synthesis, batch-invariant determinism, low-communication DiLoCo training, wide-EP MoE fabrics, sub-4-bit microscaling, and non-autoregressive serving.'
      }
    ],
    practice: [
      'Scan the active paradigm clusters below to see which labs are publishing on each frontier topic right now.',
      'Click any linked post or paper to inspect primary engineering details directly from the source lab.'
    ],
    readings: [
      { title: 'Google DeepMind Blog', url: 'https://deepmind.google/discover/blog/' },
      { title: 'Thinking Machines Lab (Connectionism)', url: 'https://thinkingmachines.ai/blog/' },
      { title: 'Engineering at Meta (AI Infra)', url: 'https://engineering.fb.com/category/ml-applications/' },
      { title: 'Modal Engineering & GPU Glossary', url: 'https://modal.com/blog' },
      { title: 'CoreWeave Engineering Blog', url: 'https://www.coreweave.com/blog' }
    ],
    relatedMilestones: ['ai-factories-2026', 'agent-runtime-2026', 'deepseek-infra', 'blackwell'],
    brainTopicId: 'topic-rl'
  }
];
