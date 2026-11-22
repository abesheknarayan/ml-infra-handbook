// ML Infra Galaxy — Curated Dataset (2006 – 2026)
// Domains form the 6 spiral arms; Year determines radial distance from the galactic core.

export const DOMAINS = [
  {
    id: 'compute',
    name: 'Compute & Silicon',
    short: 'Silicon',
    color: '#e6c88a',
    glow: 'rgba(230, 200, 138, 0.22)',
    armAngle: 0,
    description: 'GPUs, TPUs, interconnects, and custom AI accelerators powering the compute curve.'
  },
  {
    id: 'frameworks',
    name: 'Frameworks & Compilers',
    short: 'Frameworks',
    color: '#7dd3fc',
    glow: 'rgba(125, 211, 252, 0.22)',
    armAngle: (Math.PI * 2) / 6,
    description: 'Autodiff engines, graph compilers, and GPU programming DSLs.'
  },
  {
    id: 'distributed',
    name: 'Distributed Training',
    short: 'Distributed',
    color: '#cbd5e1',
    glow: 'rgba(203, 213, 225, 0.2)',
    armAngle: ((Math.PI * 2) / 6) * 2,
    description: '3D parallelism, collectives, ZeRO/FSDP, and cluster-scale training topologies.'
  },
  {
    id: 'kernels',
    name: 'Kernels & Attention',
    short: 'Kernels',
    color: '#93c5fd',
    glow: 'rgba(147, 197, 253, 0.22)',
    armAngle: ((Math.PI * 2) / 6) * 3,
    description: 'IO-aware kernels, FlashAttention, low-precision numerics, and memory-hierarchy mastery.'
  },
  {
    id: 'inference',
    name: 'Inference & Serving',
    short: 'Inference',
    color: '#bae6fd',
    glow: 'rgba(186, 230, 253, 0.2)',
    armAngle: ((Math.PI * 2) / 6) * 4,
    description: 'KV-cache engines, continuous batching, speculative decoding, and disaggregated serving.'
  },
  {
    id: 'orchestration',
    name: 'Data, Clusters & RL Infra',
    short: 'Orchestration',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.2)',
    armAngle: ((Math.PI * 2) / 6) * 5,
    description: 'Cluster schedulers, data pipelines, model hubs, and post-training RL/agent infrastructure.'
  }
];

export const ERAS = [
  { id: 'spark', name: 'I. The Spark', range: [2006, 2012], subtitle: 'GPGPU & Early Distributed ML' },
  { id: 'frameworks', name: 'II. Framework Wars', range: [2013, 2016], subtitle: 'Autodiff, Containers & First ASICs' },
  { id: 'scale', name: 'III. The Scale-Out Big Bang', range: [2017, 2020], subtitle: 'Transformers & Multi-Node Parallelism' },
  { id: 'llm', name: 'IV. LLM Systems Revolution', range: [2021, 2023], subtitle: 'IO-Aware Kernels & KV-Cache Engines' },
  { id: 'frontier', name: 'V. The AI Factory Frontier', range: [2024, 2026], subtitle: 'Disaggregated Serving, MoE & RL Infra' }
];

export const ENTITY_TYPES = {
  breakthrough: { label: 'Breakthrough', symbol: '✦' },
  framework: { label: 'Framework', symbol: '●' },
  tool: { label: 'Tool / Engine', symbol: '◆' },
  hardware: { label: 'Hardware', symbol: '⬡' },
  company: { label: 'Company / Lab', symbol: '◎' }
};

function xSearchUrl(query) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&f=top`;
}

export const NODES = [
  // ===================== ERA I: 2006 – 2012 =====================
  {
    id: 'cuda',
    name: 'NVIDIA CUDA',
    year: 2006,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'NVIDIA',
    tagline: 'Unlocked general-purpose parallel computing on GPUs.',
    summary:
      'Before CUDA, using GPUs for non-graphics math required hacking pixel shaders. CUDA exposed a C-like SIMT programming model (threads, warps, blocks, shared memory) that became the bedrock moat of modern deep learning.',
    breakthrough: 'SIMT execution model + explicit shared memory hierarchy on commodity GPUs.',
    xQuery: '(CUDA OR "GPU programming") (history OR architecture OR thread) -crypto',
    resources: [
      { title: 'CUDA Programming Guide', type: 'docs', url: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/' },
      { title: 'GPU MODE Community on X', type: 'x', url: 'https://x.com/cuda_mode' },
      { title: 'NVIDIA Official X', type: 'x', url: 'https://x.com/nvidia' }
    ]
  },
  {
    id: 'mapreduce',
    name: 'MapReduce & Hadoop',
    year: 2006,
    domain: 'orchestration',
    type: 'breakthrough',
    importance: 3,
    org: 'Google / Apache',
    tagline: 'Proved commodity clusters could process petabyte-scale ML datasets.',
    summary:
      'Google’s MapReduce paper (2004) and Apache Hadoop (2006) established fault-tolerant distributed data processing, shaping early large-scale feature engineering and dataset preparation pipelines.',
    breakthrough: 'Data-local distributed compute with automatic fault tolerance over commodity machines.',
    xQuery: 'MapReduce Hadoop "distributed systems" ML history',
    resources: [
      { title: 'MapReduce Paper (Dean & Ghemawat)', type: 'paper', url: 'https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/' }
    ]
  },
  {
    id: 'theano',
    name: 'Theano',
    year: 2007,
    domain: 'frameworks',
    type: 'framework',
    importance: 4,
    org: 'MILA (UdeM)',
    tagline: 'The ancestor of modern symbolic autodiff & GPU-compiled tensor graphs.',
    summary:
      'Created by Yoshua Bengio’s lab at MILA, Theano pioneered defining mathematical expressions as computation graphs, computing symbolic gradients automatically, and compiling them to C/CUDA.',
    breakthrough: 'Symbolic automatic differentiation compiled to native GPU kernels.',
    xQuery: 'Theano PyTorch TensorFlow autodiff history',
    resources: [
      { title: 'Theano: A CPU and GPU Math Compiler in Python (2010)', type: 'paper', url: 'https://proceedings.scipy.org/articles/Majora-92bf1922-003' }
    ]
  },
  {
    id: 'alexnet-gpu',
    name: 'AlexNet Multi-GPU',
    year: 2012,
    domain: 'distributed',
    type: 'breakthrough',
    importance: 5,
    org: 'University of Toronto',
    tagline: 'Two GTX 580s in a bedroom sparked the deep learning Big Bang.',
    summary:
      'Alex Krizhevsky wrote custom CUDA kernels (`cuda-convnet`) and manually split the network across two 3GB GPUs via early model parallelism, crushing ImageNet and proving GPU-accelerated deep nets worked.',
    breakthrough: 'Custom CUDA convolution kernels + 2-GPU model parallelism.',
    xQuery: 'AlexNet "GTX 580" OR "cuda-convnet" GPU history',
    resources: [
      { title: 'ImageNet Classification with Deep CNNs (NeurIPS 2012)', type: 'paper', url: 'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html' }
    ]
  },
  {
    id: 'distbelief',
    name: 'DistBelief & Parameter Server',
    year: 2012,
    domain: 'distributed',
    type: 'breakthrough',
    importance: 4,
    org: 'Google Brain',
    tagline: 'First industrial distributed deep learning system across thousands of CPUs.',
    summary:
      'Google Brain’s DistBelief introduced asynchronous SGD (Downpour SGD) and the Parameter Server architecture, scaling neural net training across 16,000 CPU cores before GPU clusters took over.',
    breakthrough: 'Centralized sharded Parameter Servers decoupling gradient computation from weight storage.',
    xQuery: 'DistBelief "Parameter Server" "Jeff Dean" distributed training',
    resources: [
      { title: 'Large Scale Distributed Deep Networks (NeurIPS 2012)', type: 'paper', url: 'https://research.google/pubs/large-scale-distributed-deep-networks/' }
    ]
  },

  // ===================== ERA II: 2013 – 2016 =====================
  {
    id: 'caffe',
    name: 'Caffe',
    year: 2013,
    domain: 'frameworks',
    type: 'framework',
    importance: 3,
    org: 'UC Berkeley (BAIR)',
    tagline: 'Fast C++ vision framework that standardized pre-trained model zoos.',
    summary:
      'Created by Yangqing Jia, Caffe separated declarative network definitions (Protobuf) from high-speed C++/CUDA execution, making vision training and production deployment accessible across industry.',
    breakthrough: 'Declarative layer configs + Model Zoo distribution pattern.',
    xQuery: 'Caffe Yangqing Jia deep learning framework history',
    resources: [
      { title: 'Caffe Paper (arXiv)', type: 'paper', url: 'https://arxiv.org/abs/1408.5093' }
    ]
  },
  {
    id: 'cudnn',
    name: 'NVIDIA cuDNN',
    year: 2014,
    domain: 'kernels',
    type: 'tool',
    importance: 5,
    org: 'NVIDIA',
    tagline: 'Hand-tuned GPU primitives that made every DL framework instantly fast.',
    summary:
      'Instead of every lab writing raw CUDA convolutions like AlexNet, cuDNN provided hyper-optimized primitives for convs, pooling, normalization, and RNNs—cementing NVIDIA’s software moat.',
    breakthrough: 'Library-level GPU kernel abstraction (Winograd, FFT, implicit GEMM convs).',
    xQuery: 'cuDNN NVIDIA moat kernels deep learning',
    resources: [
      { title: 'cuDNN: Efficient Primitives for Deep Learning', type: 'paper', url: 'https://arxiv.org/abs/1410.0759' }
    ]
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    year: 2014,
    domain: 'orchestration',
    type: 'tool',
    importance: 4,
    org: 'Google / CNCF',
    tagline: 'Open-source Borg that became the universal control plane for ML workloads.',
    summary:
      'Inspired by Google’s Borg, Kubernetes standardized container orchestration, GPU device plugins, autoscaling, and multi-tenant scheduling—forming the cloud substrate for modern ML platforms.',
    breakthrough: 'Declarative container orchestration extensible to GPU scheduling & operators.',
    xQuery: 'Kubernetes GPU scheduling Slurm ML infra',
    resources: [
      { title: 'Borg, Omega, and Kubernetes (ACM Queue)', type: 'paper', url: 'https://research.google/pubs/borg-omega-and-kubernetes/' }
    ]
  },
  {
    id: 'spark',
    name: 'Apache Spark',
    year: 2014,
    domain: 'orchestration',
    type: 'tool',
    importance: 3,
    org: 'UC Berkeley AMPLab / Databricks',
    tagline: 'In-memory distributed data engine that replaced MapReduce for ML pipelines.',
    summary:
      'Spark brought resilient distributed datasets (RDDs) and DataFrames in-memory, accelerating ETL, feature engineering, and large-scale dataset curation by orders of magnitude.',
    breakthrough: 'In-memory DAG execution engine for petabyte-scale data processing.',
    xQuery: 'Apache Spark Databricks ML data pipelines Ray',
    resources: [
      { title: 'Resilient Distributed Datasets (NSDI 2012)', type: 'paper', url: 'https://www.usenix.org/conference/nsdi12/technical-sessions/presentation/zaharia' }
    ]
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    year: 2015,
    domain: 'frameworks',
    type: 'framework',
    importance: 5,
    org: 'Google Brain',
    tagline: 'Industrialized deep learning with static graphs, TensorBoard & mobile serving.',
    summary:
      'Replacing DistBelief, TensorFlow unified research and production with dataflow graphs, distributed execution, TensorFlow Serving, and XLA—dominating the first wave of enterprise AI.',
    breakthrough: 'Portable dataflow graph IR spanning CPUs, GPUs, TPUs, and mobile devices.',
    xQuery: 'TensorFlow PyTorch history "static graph" "eager mode"',
    resources: [
      { title: 'TensorFlow: Large-Scale Machine Learning (OSDI 2016)', type: 'paper', url: 'https://www.usenix.org/conference/osdi16/technical-sessions/presentation/abadi' }
    ]
  },
  {
    id: 'tpu-v1',
    name: 'Google TPU v1',
    year: 2016,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'Google',
    tagline: 'First production AI ASIC—proving systolic arrays crush matrix math.',
    summary:
      'Built in 15 months when Google realized voice search would double its datacenter footprint, TPU v1 introduced an 8-bit 256×256 systolic array matrix unit, launching the era of custom AI silicon.',
    breakthrough: 'Systolic array MXU + deterministic software-managed on-chip SRAM.',
    xQuery: 'Google TPU "systolic array" XLA architecture',
    resources: [
      { title: 'In-Datacenter Performance Analysis of a TPU (ISCA 2017)', type: 'paper', url: 'https://arxiv.org/abs/1704.04760' }
    ]
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    year: 2016,
    domain: 'frameworks',
    type: 'framework',
    importance: 5,
    org: 'Meta AI (FAIR)',
    tagline: 'Define-by-run eager execution won the hearts of researchers—then the world.',
    summary:
      'Born from Torch7 and inspired by Chainer, PyTorch embraced Pythonic eager execution so debugging felt like NumPy. It rapidly became the lingua franca of AI research and later production.',
    breakthrough: 'Tape-based dynamic autograd with zero-friction Python UX.',
    xQuery: 'PyTorch history eager mode Soumith Chintala',
    resources: [
      { title: 'PyTorch: An Imperative Style, High-Performance DL Library', type: 'paper', url: 'https://arxiv.org/abs/1912.01703' },
      { title: 'PyTorch on X', type: 'x', url: 'https://x.com/PyTorch' }
    ]
  },
  {
    id: 'nccl',
    name: 'NVIDIA NCCL & Ring AllReduce',
    year: 2016,
    domain: 'distributed',
    type: 'tool',
    importance: 5,
    org: 'NVIDIA / Baidu SVAIL',
    tagline: 'Replaced Parameter Servers with bandwidth-optimal GPU-to-GPU collectives.',
    summary:
      'Baidu’s Ring-AllReduce and NVIDIA’s NCCL (with NVLink + InfiniBand GPUDirect RDMA) eliminated the parameter server bottleneck, enabling synchronous multi-node GPU training at high utilization.',
    breakthrough: 'Topology-aware Ring/Tree AllReduce directly over NVLink & RDMA fabrics.',
    xQuery: 'NCCL Ring AllReduce NVLink InfiniBand distributed training',
    resources: [
      { title: 'NVIDIA NCCL GitHub', type: 'repo', url: 'https://github.com/NVIDIA/nccl' }
    ]
  },
  {
    id: 'tensorrt',
    name: 'NVIDIA TensorRT',
    year: 2016,
    domain: 'inference',
    type: 'tool',
    importance: 4,
    org: 'NVIDIA',
    tagline: 'Graph optimizer & INT8/FP16 inference runtime for low-latency GPU serving.',
    summary:
      'TensorRT introduced aggressive layer fusion, kernel auto-tuning, and INT8 post-training calibration, establishing the blueprint for specialized inference compilers distinct from training frameworks.',
    breakthrough: 'Ahead-of-time graph fusion + hardware-specific kernel profiling for inference.',
    xQuery: 'TensorRT inference optimization kernel fusion INT8',
    resources: [
      { title: 'TensorRT Documentation', type: 'docs', url: 'https://developer.nvidia.com/tensorrt' }
    ]
  },

  // ===================== ERA III: 2017 – 2020 =====================
  {
    id: 'transformer',
    name: 'The Transformer & Volta Tensor Cores',
    year: 2017,
    domain: 'compute',
    type: 'breakthrough',
    importance: 5,
    org: 'Google / NVIDIA',
    tagline: 'Hardware-software convergence: attention + matrix cores ignited scaling.',
    summary:
      'In the same year, "Attention Is All You Need" replaced sequential RNNs with massively parallel matmuls, while NVIDIA’s Volta V100 introduced dedicated Tensor Cores for mixed-precision FP16 matrix multiply-accumulate.',
    breakthrough: 'Parallel self-attention perfectly matched to hardware Tensor Core MMA units.',
    xQuery: 'Transformer "Tensor Cores" Volta V100 hardware lottery',
    resources: [
      { title: 'Attention Is All You Need (2017)', type: 'paper', url: 'https://arxiv.org/abs/1706.03762' },
      { title: 'The Hardware Lottery (Sara Hooker)', type: 'paper', url: 'https://arxiv.org/abs/2009.06489' }
    ]
  },
  {
    id: 'xla',
    name: 'XLA (Accelerated Linear Algebra)',
    year: 2017,
    domain: 'frameworks',
    type: 'tool',
    importance: 4,
    org: 'Google',
    tagline: 'Whole-program HLO compiler that powers TPUs, JAX, and OpenXLA.',
    summary:
      'XLA compiles computation graphs into fused machine code via HLO (High Level Optimizer), eliminating intermediate memory round-trips and enabling automatic SPMD sharding (GSPMD) across thousands of chips.',
    breakthrough: 'Whole-graph fusion + GSPMD compiler-driven distributed partitioning.',
    xQuery: 'XLA compiler GSPMD JAX TPU HLO',
    resources: [
      { title: 'OpenXLA GitHub', type: 'repo', url: 'https://github.com/openxla/xla' }
    ]
  },
  {
    id: 'horovod',
    name: 'Horovod',
    year: 2017,
    domain: 'distributed',
    type: 'tool',
    importance: 3,
    org: 'Uber',
    tagline: 'Made Ring-AllReduce distributed training a 5-line drop-in for teams.',
    summary:
      'Uber’s Horovod wrapped MPI and NCCL Ring-AllReduce into a clean API for TensorFlow and PyTorch, democratizing multi-node data-parallel training across the industry.',
    breakthrough: 'Tensor Fusion + framework-agnostic Ring-AllReduce wrapper.',
    xQuery: 'Horovod Ring AllReduce Uber distributed ML history',
    resources: [
      { title: 'Horovod: Fast and Easy Distributed Deep Learning', type: 'paper', url: 'https://arxiv.org/abs/1802.05799' }
    ]
  },
  {
    id: 'mixed-precision',
    name: 'Mixed Precision Training (FP16 + Loss Scaling)',
    year: 2017,
    domain: 'kernels',
    type: 'breakthrough',
    importance: 4,
    org: 'Baidu / NVIDIA',
    tagline: 'Halved memory & doubled throughput without losing convergence.',
    summary:
      'By keeping FP32 master weights while running forward/backward passes in FP16 with dynamic loss scaling, mixed precision unlocked Volta Tensor Cores and set the stage for BF16, FP8, and FP4.',
    breakthrough: 'FP32 master copy + dynamic loss scaling to avoid FP16 gradient underflow.',
    xQuery: '"mixed precision" FP16 BF16 FP8 training numerics',
    resources: [
      { title: 'Mixed Precision Training (ICLR 2018)', type: 'paper', url: 'https://arxiv.org/abs/1710.03740' }
    ]
  },
  {
    id: 'ray',
    name: 'Ray',
    year: 2017,
    domain: 'orchestration',
    type: 'framework',
    importance: 5,
    org: 'UC Berkeley RISELab / Anyscale',
    tagline: 'Unified distributed Python compute fabric for RL, data, training & serving.',
    summary:
      'Born for reinforcement learning workloads that didn’t fit MapReduce or Spark, Ray introduced distributed actors and tasks with a shared-memory object store—later powering OpenAI training clusters and modern RLHF/verl.',
    breakthrough: 'Fine-grained distributed tasks + stateful actors with Plasma zero-copy object store.',
    xQuery: 'Ray Anyscale distributed ML RLHF infrastructure',
    resources: [
      { title: 'Ray: A Distributed Framework for Emerging AI Applications (OSDI 2018)', type: 'paper', url: 'https://www.usenix.org/conference/osdi18/presentation/moritz' },
      { title: 'Ray GitHub', type: 'repo', url: 'https://github.com/ray-project/ray' }
    ]
  },
  {
    id: 'jax',
    name: 'JAX',
    year: 2018,
    domain: 'frameworks',
    type: 'framework',
    importance: 5,
    org: 'Google',
    tagline: 'Composable function transformations (grad, jit, vmap, pmap) over XLA.',
    summary:
      'Built by Autograd and XLA veterans, JAX treated differentiation, vectorization, JIT compilation, and multi-device sharding as pure functional transformations—becoming the backbone of DeepMind, Gemini, and xAI research.',
    breakthrough: 'Pure functional transformations (`jit`, `vmap`, `grad`, `shard_map`) targeting XLA.',
    xQuery: 'JAX XLA PyTorch "shard_map" TPU GPU',
    resources: [
      { title: 'JAX GitHub', type: 'repo', url: 'https://github.com/jax-ml/jax' },
      { title: 'How to Scale Your Model (Google DeepMind Book)', type: 'blog', url: 'https://jax-ml.github.io/scaling-book/' }
    ]
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Transformers & Hub',
    year: 2018,
    domain: 'orchestration',
    type: 'company',
    importance: 5,
    org: 'Hugging Face',
    tagline: 'The GitHub of open weights, tokenizers, and standardized model interfaces.',
    summary:
      'What began as `pytorch-pretrained-bert` evolved into the central registry for open-source models, datasets, safetensors, and fine-tuning tooling—compressing model adoption from months to minutes.',
    breakthrough: 'Standardized model/tokenizer API + Safetensors + global open-weight Hub.',
    xQuery: 'HuggingFace safetensors transformers open source ML infra',
    resources: [
      { title: 'Hugging Face Transformers GitHub', type: 'repo', url: 'https://github.com/huggingface/transformers' },
      { title: 'Ultra-Scale Playbook (HF)', type: 'blog', url: 'https://huggingface.co/spaces/nanotron/ultrascale-playbook' }
    ]
  },
  {
    id: 'triton-server',
    name: 'Triton Inference Server',
    year: 2018,
    domain: 'inference',
    type: 'tool',
    importance: 3,
    org: 'NVIDIA',
    tagline: 'Production multi-framework model serving with dynamic batching.',
    summary:
      'Originally TensorRT Inference Server, Triton standardized serving PyTorch, TensorRT, ONNX, and ensemble pipelines concurrently on GPUs with dynamic batching and MIG support.',
    breakthrough: 'Framework-agnostic concurrent GPU model execution + dynamic batching.',
    xQuery: '"Triton Inference Server" serving GPU batching',
    resources: [
      { title: 'Triton Inference Server GitHub', type: 'repo', url: 'https://github.com/triton-inference-server/server' }
    ]
  },
  {
    id: 'megatron',
    name: 'Megatron-LM (Tensor & Pipeline Parallelism)',
    year: 2019,
    domain: 'distributed',
    type: 'framework',
    importance: 5,
    org: 'NVIDIA',
    tagline: 'Defined intra-layer Tensor Parallelism & 3D parallelism for giant LLMs.',
    summary:
      'When models outgrew a single GPU’s memory, Megatron-LM split Transformer MLP and Attention weight matrices across GPUs within a node (TP) and stacked pipeline schedules (1F1B, interleaved PP) across nodes.',
    breakthrough: 'Column/row-parallel linear layers minimizing AllReduce syncs + interleaved 1F1B pipelining.',
    xQuery: 'Megatron-LM "tensor parallelism" "3D parallelism" MFU',
    resources: [
      { title: 'Megatron-LM Paper (2019)', type: 'paper', url: 'https://arxiv.org/abs/1909.08053' },
      { title: 'Megatron-LM GitHub', type: 'repo', url: 'https://github.com/NVIDIA/Megatron-LM' }
    ]
  },
  {
    id: 'deepspeed-zero',
    name: 'DeepSpeed & ZeRO',
    year: 2020,
    domain: 'distributed',
    type: 'breakthrough',
    importance: 5,
    org: 'Microsoft',
    tagline: 'Eliminated memory redundancy in data parallelism (Stages 1, 2, 3).',
    summary:
      'Standard data parallelism duplicated optimizer states, gradients, and weights on every GPU. ZeRO sharded them across data-parallel ranks and gathered weights on-the-fly, unlocking trillion-parameter training.',
    breakthrough: 'Zero Redundancy Optimizer (ZeRO-1/2/3) + ZeRO-Offload to CPU/NVMe.',
    xQuery: 'DeepSpeed ZeRO FSDP sharding distributed training',
    resources: [
      { title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', type: 'paper', url: 'https://arxiv.org/abs/1910.02054' },
      { title: 'DeepSpeed GitHub', type: 'repo', url: 'https://github.com/deepspeedai/DeepSpeed' }
    ]
  },
  {
    id: 'a100',
    name: 'NVIDIA A100 (Ampere)',
    year: 2020,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'NVIDIA',
    tagline: '80GB HBM2e, BF16, and TF32—the workhorse that trained GPT-3.5 & early LLMs.',
    summary:
      'The A100 brought native BF16 (ending FP16 loss-scaling headaches), 2 TB/s HBM2e bandwidth, Multi-Instance GPU (MIG), and 600 GB/s NVLink, powering the first generative AI boom.',
    breakthrough: 'Native BF16 Tensor Cores + 80GB HBM2e + 3rd-gen NVLink.',
    xQuery: 'A100 H100 BF16 HBM bandwidth GPU architecture',
    resources: [
      { title: 'NVIDIA A100 Architecture Whitepaper', type: 'docs', url: 'https://images.nvidia.com/aem-dam/en-zz/Solutions/data-center/nvidia-ampere-architecture-whitepaper.pdf' }
    ]
  },

  // ===================== ERA IV: 2021 – 2023 =====================
  {
    id: 'triton-lang',
    name: 'OpenAI Triton',
    year: 2021,
    domain: 'frameworks',
    type: 'tool',
    importance: 5,
    org: 'OpenAI / Philippe Tillet',
    tagline: 'Python-based tile programming that democratized custom GPU kernels.',
    summary:
      'Writing peak-performance CUDA requires manually managing warps, shared memory bank conflicts, and coalescing. Triton lets engineers write block/tile-level Python kernels while the compiler handles shared memory and scheduling.',
    breakthrough: 'Block-level SPMD programming model + MLIR compiler backend for GPUs.',
    xQuery: 'OpenAI Triton kernels CUDA "torch.compile" GPU MODE',
    resources: [
      { title: 'Triton: An Intermediate Language and Compiler (MAPL 2019)', type: 'paper', url: 'https://www.eecs.harvard.edu/~htk/publication/2019-mapl-tillet-kung-cox.pdf' },
      { title: 'Triton GitHub', type: 'repo', url: 'https://github.com/triton-lang/triton' }
    ]
  },
  {
    id: 'fsdp',
    name: 'PyTorch FSDP',
    year: 2021,
    domain: 'distributed',
    type: 'framework',
    importance: 4,
    org: 'Meta AI',
    tagline: 'Native ZeRO-3 sharding built straight into PyTorch (evolving to FSDP2/DTensor).',
    summary:
      'Inspired by ZeRO and FairScale, FSDP brought sharded data parallelism natively into PyTorch with composable per-parameter sharding (FSDP2/DTensor) that interoperates cleanly with `torch.compile` and Tensor Parallelism.',
    breakthrough: 'Native PyTorch sharded data parallelism + composable DTensor abstraction.',
    xQuery: 'PyTorch FSDP FSDP2 DTensor distributed training',
    resources: [
      { title: 'PyTorch FSDP Paper (VLDB 2023)', type: 'paper', url: 'https://arxiv.org/abs/2304.11277' }
    ]
  },
  {
    id: 'flashattention',
    name: 'FlashAttention',
    year: 2022,
    domain: 'kernels',
    type: 'breakthrough',
    importance: 5,
    org: 'Stanford (Tri Dao et al.)',
    tagline: 'IO-aware exact attention that broke the quadratic HBM memory wall.',
    summary:
      'Standard attention materialized the giant N×N attention matrix in slow HBM. FlashAttention tiled Q, K, V into fast on-chip SRAM and used online softmax rescaling to compute exact attention 2–4× faster with O(N) memory.',
    breakthrough: 'SRAM tiling + online softmax + backward recomputation (IO-awareness).',
    xQuery: 'FlashAttention "Tri Dao" SRAM tiling online softmax',
    resources: [
      { title: 'FlashAttention: Fast and Memory-Efficient Exact Attention', type: 'paper', url: 'https://arxiv.org/abs/2205.14135' },
      { title: 'Tri Dao on X', type: 'x', url: 'https://x.com/tri_dao' }
    ]
  },
  {
    id: 'orca',
    name: 'Orca (Continuous Batching)',
    year: 2022,
    domain: 'inference',
    type: 'breakthrough',
    importance: 5,
    org: 'Seoul National Univ. / FriendliAI',
    tagline: 'Iteration-level scheduling eliminated the idle bubble in LLM serving.',
    summary:
      'Static request-level batching forced short LLM responses to wait for the longest sequence in a batch. Orca introduced iteration-level (continuous) batching—inserting new requests as soon as any sequence finishes a token.',
    breakthrough: 'Iteration-level scheduling + selective batching for autoregressive decoding.',
    xQuery: 'Orca "continuous batching" "iteration-level" LLM serving',
    resources: [
      { title: 'Orca: A Distributed Serving System for Transformer-Based Generative Models (OSDI 2022)', type: 'paper', url: 'https://www.usenix.org/conference/osdi22/presentation/yu' }
    ]
  },
  {
    id: 'h100',
    name: 'NVIDIA H100 (Hopper)',
    year: 2022,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'NVIDIA',
    tagline: 'FP8 Transformer Engine, TMA, and 3.35 TB/s HBM3 defined the frontier LLM era.',
    summary:
      'The H100 introduced native FP8 Tensor Cores, Tensor Memory Accelerator (TMA) for async global-to-shared copies, WGMMA warp-group instructions, and 900 GB/s NVLink—becoming the currency of frontier AI clusters.',
    breakthrough: 'FP8 Transformer Engine + async TMA + thread-block clusters.',
    xQuery: 'H100 Hopper TMA WGMMA FP8 SemiAnalysis',
    resources: [
      { title: 'NVIDIA H100 Architecture Whitepaper', type: 'docs', url: 'https://resources.nvidia.com/en-us-tensor-core' },
      { title: 'SemiAnalysis on X', type: 'x', url: 'https://x.com/SemiAnalysis_' }
    ]
  },
  {
    id: 'pytorch2',
    name: 'PyTorch 2.0 (torch.compile & Inductor)',
    year: 2023,
    domain: 'frameworks',
    type: 'breakthrough',
    importance: 5,
    org: 'Meta AI (Horace He, Jason Ansel et al.)',
    tagline: 'Solved the eager-vs-graph tradeoff with Python bytecode capture + Triton.',
    summary:
      'TorchDynamo intercepts CPython bytecode frames to safely extract graphs without rewriting user code, and TorchInductor lowers them directly into fused Triton GPU kernels—delivering compiler speed with eager ergonomics.',
    breakthrough: 'TorchDynamo bytecode frame capture + TorchInductor Triton codegen.',
    xQuery: '"torch.compile" TorchDynamo TorchInductor "Horace He"',
    resources: [
      { title: 'PyTorch 2.0 Release & Compiler Architecture', type: 'blog', url: 'https://pytorch.org/blog/pytorch-2.0-release/' },
      { title: 'Horace He on X', type: 'x', url: 'https://x.com/cHHillee' },
      { title: 'Making Deep Learning Go Brrrr From First Principles', type: 'blog', url: 'https://horace.io/brrr_intro.html' }
    ]
  },
  {
    id: 'vllm',
    name: 'vLLM & PagedAttention',
    year: 2023,
    domain: 'inference',
    type: 'tool',
    importance: 5,
    org: 'UC Berkeley Sky Computing Lab',
    tagline: 'Virtual memory paging for KV caches—10×’d open-source LLM serving.',
    summary:
      'KV cache fragmentation wasted 60–80% of GPU memory during serving. Borrowing OS virtual memory concepts, vLLM’s PagedAttention stores KV caches in non-contiguous fixed-size blocks, enabling massive batch sizes and prefix sharing.',
    breakthrough: 'OS-style paged KV cache management + copy-on-write beam/prefix sharing.',
    xQuery: 'vLLM PagedAttention "Woosuk Kwon" LLM inference',
    resources: [
      { title: 'Efficient Memory Management for LLM Serving with PagedAttention (SOSP 2023)', type: 'paper', url: 'https://arxiv.org/abs/2309.06180' },
      { title: 'vLLM on X', type: 'x', url: 'https://x.com/vllm_project' },
      { title: 'vLLM GitHub', type: 'repo', url: 'https://github.com/vllm-project/vllm' }
    ]
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp & Edge Quantization',
    year: 2023,
    domain: 'inference',
    type: 'tool',
    importance: 4,
    org: 'Georgi Gerganov',
    tagline: 'Zero-dependency C/C++ inference that brought LLMs to laptops & phones.',
    summary:
      'Georgi Gerganov’s llama.cpp and GGUF format proved 4-bit quantized LLMs could run blazingly fast on Apple Silicon unified memory and CPUs—igniting the local AI and edge inference ecosystem.',
    breakthrough: 'GGUF quantization formats + bare-metal Metal/AVX/CUDA local inference.',
    xQuery: '"llama.cpp" GGUF "Georgi Gerganov" local LLM quantization',
    resources: [
      { title: 'llama.cpp GitHub', type: 'repo', url: 'https://github.com/ggml-org/llama.cpp' }
    ]
  },
  {
    id: 'quantization-wave',
    name: 'LLM Quantization (bitsandbytes / AWQ / FP8)',
    year: 2023,
    domain: 'kernels',
    type: 'breakthrough',
    importance: 4,
    org: 'Tim Dettmers / MIT Han Lab / Community',
    tagline: 'Squeezed 16-bit weights into 4-bit & 8-bit without breaking intelligence.',
    summary:
      'Discovering that only ~0.1% of activation channels hold massive outliers enabled LLM.int8(), QLoRA (NF4), GPTQ, and Activation-Aware Weight Quantization (AWQ)—slashing memory bandwidth bottlenecks for both fine-tuning and inference.',
    breakthrough: 'Outlier-aware quantization (NF4, AWQ, SmoothQuant) + fused dequant-GEMM kernels.',
    xQuery: 'AWQ QLoRA FP8 FP4 quantization "Tim Dettmers" kernels',
    resources: [
      { title: 'QLoRA: Efficient Finetuning of Quantized LLMs', type: 'paper', url: 'https://arxiv.org/abs/2305.14314' },
      { title: 'AWQ: Activation-aware Weight Quantization (MLSys 2024)', type: 'paper', url: 'https://arxiv.org/abs/2306.00978' },
      { title: 'Tim Dettmers on X', type: 'x', url: 'https://x.com/Tim_Dettmers' }
    ]
  },
  {
    id: 'trt-llm',
    name: 'TensorRT-LLM',
    year: 2023,
    domain: 'inference',
    type: 'tool',
    importance: 4,
    org: 'NVIDIA',
    tagline: 'Peak-silicon-utilization LLM serving engine with FP8/FP4 & inflight batching.',
    summary:
      'NVIDIA’s dedicated LLM serving stack combines hand-tuned CUTLASS/cuBLASLt kernels, inflight batching, multi-GPU tensor parallelism, and speculative decoding to extract maximum throughput from Hopper & Blackwell.',
    breakthrough: 'Hardware-co-designed FP8/FP4 LLM kernels + inflight batching + Eagle/MTP decoding.',
    xQuery: '"TensorRT-LLM" vLLM SGLang benchmark Blackwell H100',
    resources: [
      { title: 'TensorRT-LLM GitHub', type: 'repo', url: 'https://github.com/NVIDIA/TensorRT-LLM' }
    ]
  },
  {
    id: 'ring-attention',
    name: 'Ring Attention & Context Parallelism',
    year: 2023,
    domain: 'distributed',
    type: 'breakthrough',
    importance: 4,
    org: 'UC Berkeley (Hao Liu et al.)',
    tagline: 'Unlocked million-token context windows by overlapping KV ring comms with attention.',
    summary:
      'Long sequences blow past single-GPU memory even with FlashAttention. Ring Attention shards the sequence across GPUs and passes K/V blocks in a ring while computing local attention—giving birth to Context Parallelism (CP).',
    breakthrough: 'Overlapping blockwise attention with ring P2P communication for near-infinite context.',
    xQuery: '"Ring Attention" "Context Parallelism" long context training',
    resources: [
      { title: 'Ring Attention with Blockwise Transformers (ICLR 2024)', type: 'paper', url: 'https://arxiv.org/abs/2310.01889' }
    ]
  },

  // ===================== ERA V: 2024 – 2026 =====================
  {
    id: 'sglang',
    name: 'SGLang & RadixAttention',
    year: 2024,
    domain: 'inference',
    type: 'tool',
    importance: 5,
    org: 'LMSYS Org (Lianmin Zheng et al.)',
    tagline: 'Prefix-tree KV caching & zero-overhead scheduling for agents & reasoning.',
    summary:
      'SGLang introduced RadixAttention—storing KV caches in an LRU radix tree so multi-turn chats, few-shot prompts, and agent trees automatically reuse shared prefixes—plus compressed FSMs for ultra-fast structured JSON output.',
    breakthrough: 'Radix-tree automatic KV reuse + zero-overhead CPU scheduler + jump-forward constrained decoding.',
    xQuery: 'SGLang RadixAttention LMSYS vLLM inference',
    resources: [
      { title: 'SGLang: Efficient Execution of Structured LM Programs (NeurIPS 2024)', type: 'paper', url: 'https://arxiv.org/abs/2312.07104' },
      { title: 'LMSYS Org on X', type: 'x', url: 'https://x.com/lmsysorg' },
      { title: 'SGLang GitHub', type: 'repo', url: 'https://github.com/sgl-project/sglang' }
    ]
  },
  {
    id: 'flashattention3',
    name: 'FlashAttention-3 & Hopper Asynchrony',
    year: 2024,
    domain: 'kernels',
    type: 'breakthrough',
    importance: 5,
    org: 'Together AI / Princeton / Tri Dao',
    tagline: 'Exploited Hopper TMA, warp specialization & FP8 incoherent processing.',
    summary:
      'FlashAttention-2 left ~65% of H100 FLOPs on the table. FlashAttention-3 redesigned attention around Hopper’s asynchronous producer-consumer warp specialization (TMA + WGMMA) and blockwise FP8, hitting 75%+ H100 utilization.',
    breakthrough: 'Producer-consumer warp specialization + ping-pong GEMM/softmax overlap + FP8 Hadamard scaling.',
    xQuery: 'FlashAttention-3 Hopper "warp specialization" TMA FP8',
    resources: [
      { title: 'FlashAttention-3 Paper (NeurIPS 2024)', type: 'paper', url: 'https://arxiv.org/abs/2407.08608' },
      { title: 'Together AI FA3 Deep Dive', type: 'blog', url: 'https://www.together.ai/blog/flashattention-3' }
    ]
  },
  {
    id: 'blackwell',
    name: 'NVIDIA Blackwell (GB200 NVL72)',
    year: 2024,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'NVIDIA',
    tagline: 'Rack-scale 72-GPU NVLink domain + FP4 turned racks into single super-GPUs.',
    summary:
      'Instead of 8-GPU NVLink islands, GB200 NVL72 links 72 Blackwell GPUs into one coherent 130 TB/s NVLink domain with native FP4 Tensor Cores and liquid cooling—redefining MoE expert parallelism and reasoning inference economics.',
    breakthrough: '72-GPU rack-scale NVLink5 fabric + dual-reticle die + native NVFP4.',
    xQuery: 'GB200 NVL72 Blackwell NVFP4 SemiAnalysis inference',
    resources: [
      { title: 'NVIDIA Blackwell Technical Overview', type: 'docs', url: 'https://www.nvidia.com/en-us/data-center/technologies/blackwell-architecture/' },
      { title: 'SemiAnalysis on X', type: 'x', url: 'https://x.com/SemiAnalysis_' }
    ]
  },
  {
    id: 'disaggregated-serving',
    name: 'Disaggregated Prefill / Decode (DistServe & Mooncake)',
    year: 2024,
    domain: 'inference',
    type: 'breakthrough',
    importance: 5,
    org: 'PKU / Moonshot AI / NVIDIA Dynamo',
    tagline: 'Split compute-bound prefill from memory-bound decode across separate GPU pools.',
    summary:
      'Mixing prompt prefill and token decode on the same GPU creates severe TTFT/TPOT interference. DistServe, Mooncake (KVCache-centric architecture), and NVIDIA Dynamo decoupled them—streaming KV caches over RDMA/NVLink.',
    breakthrough: 'P/D disaggregation + distributed KV cache pool over RDMA.',
    xQuery: '"disaggregated" prefill decode Mooncake DistServe "NVIDIA Dynamo"',
    resources: [
      { title: 'DistServe: Disaggregating Prefill and Decoding (OSDI 2024)', type: 'paper', url: 'https://arxiv.org/abs/2401.09670' },
      { title: 'Mooncake: A KVCache-centric Disaggregated Architecture (FAST 2025)', type: 'paper', url: 'https://arxiv.org/abs/2407.00079' }
    ]
  },
  {
    id: 'thunderkittens',
    name: 'ThunderKittens, CuTe & TileLang',
    year: 2024,
    domain: 'frameworks',
    type: 'tool',
    importance: 4,
    org: 'Stanford HazyResearch / NVIDIA / Microsoft',
    tagline: 'New wave of tile-centric DSLs bridging CUDA’s speed with Triton’s ergonomics.',
    summary:
      'As GPUs added TMA, WGMMA, and tensor memory (Blackwell TMEM), writing raw CUDA became brutal. ThunderKittens (16×16 tile C++ primitives), CUTLASS CuTe/CuTeDSL, and TileLang emerged to make peak-speed kernel authoring tractable.',
    breakthrough: 'Hardware-aligned warp-level tile abstractions (16×16 tiles, layout algebra).',
    xQuery: 'ThunderKittens OR CuTeDSL OR TileLang GPU kernels',
    resources: [
      { title: 'ThunderKittens: Simple, Fast, and Adorable AI Kernels', type: 'paper', url: 'https://arxiv.org/abs/2410.20399' },
      { title: 'ThunderKittens GitHub', type: 'repo', url: 'https://github.com/HazyResearch/ThunderKittens' }
    ]
  },
  {
    id: 'custom-silicon-wave',
    name: 'Inference Silicon Wave (Groq, Cerebras, Trainium2/3, TPU v6)',
    year: 2024,
    domain: 'compute',
    type: 'hardware',
    importance: 4,
    org: 'Groq / Cerebras / AWS / Google',
    tagline: 'SRAM-first & hyperscaler ASICs challenged GPU dominance in token/sec economics.',
    summary:
      'Memory bandwidth—not FLOPs—bottlenecks autoregressive decode. Wafer-scale SRAM (Cerebras), deterministic LPUs (Groq), Google Trillium/Ironwood TPUs, and AWS Trainium proved custom silicon can deliver 1,000+ tok/s and lower TCO.',
    breakthrough: 'On-chip SRAM elimination of HBM bottlenecks + compiler-scheduled deterministic execution.',
    xQuery: 'Cerebras Groq Trainium TPU Ironwood inference silicon',
    resources: [
      { title: 'Google Cloud TPU Architecture', type: 'docs', url: 'https://cloud.google.com/tpu/docs/system-architecture-tpu-vm' }
    ]
  },
  {
    id: 'deepseek-infra',
    name: 'DeepSeek-V3 / R1 Infra (DualPipe, DeepEP, FlashMLA)',
    year: 2025,
    domain: 'distributed',
    type: 'breakthrough',
    importance: 5,
    org: 'DeepSeek AI',
    tagline: 'Open-Source Week shocked the world with bare-metal MoE & FP8 co-design.',
    summary:
      'DeepSeek co-designed model architecture (MLA + fine-grained MoE) with systems: DualPipe overlapped all-to-all dispatch with compute, DeepEP used custom PTX/IBGDA kernels for sub-microsecond MoE routing, and FlashMLA compressed KV caches.',
    breakthrough: 'Bidirectional DualPipe + IBGDA DeepEP MoE kernels + fine-grained blockwise FP8 + MLA.',
    xQuery: 'DeepSeek DualPipe DeepEP FlashMLA "Open Source Week" PTX',
    resources: [
      { title: 'DeepSeek-V3 Technical Report', type: 'paper', url: 'https://arxiv.org/abs/2412.19437' },
      { title: 'DeepEP GitHub', type: 'repo', url: 'https://github.com/deepseek-ai/DeepEP' },
      { title: 'DeepSeek on X', type: 'x', url: 'https://x.com/deepseek_ai' }
    ]
  },
  {
    id: 'flashmla-fp8',
    name: 'FlashMLA & Sub-Byte FP8/NVFP4 Kernels',
    year: 2025,
    domain: 'kernels',
    type: 'tool',
    importance: 4,
    org: 'DeepSeek / NVIDIA / FlashInfer',
    tagline: 'Low-rank KV compression + block-scaled FP8/FP4 pushed memory walls further.',
    summary:
      'Multi-head Latent Attention (MLA) shrank KV cache footprints by >90%, while FlashInfer and DeepGEMM standardized JIT-compiled block-scaled FP8 and microscaling FP4 (MXFP4/NVFP4) kernels across Hopper and Blackwell.',
    breakthrough: 'Compressed latent KV attention kernels + fine-grained block-scaled FP8/FP4 GEMMs.',
    xQuery: 'FlashMLA DeepGEMM FlashInfer FP8 NVFP4 kernels',
    resources: [
      { title: 'FlashMLA GitHub', type: 'repo', url: 'https://github.com/deepseek-ai/FlashMLA' },
      { title: 'FlashInfer GitHub', type: 'repo', url: 'https://github.com/flashinfer-ai/flashinfer' }
    ]
  },
  {
    id: 'rl-posttraining-infra',
    name: 'RL & Reasoning Post-Training Infra (verl / OpenRLHF / Agent Sandboxes)',
    year: 2025,
    domain: 'orchestration',
    type: 'breakthrough',
    importance: 5,
    org: 'ByteDance Seed / OpenRLHF / Frontier Labs',
    tagline: 'Training flipped from static pretraining to live rollout + verifier RL loops.',
    summary:
      'Reasoning models (o1/R1-style GRPO) turned training into a hybrid inference+training loop: generating millions of long chain-of-thought rollouts with vLLM/SGLang, running sandboxed code/tool verifiers, and hot-syncing weights back to Megatron/FSDP.',
    breakthrough: 'HybridEngine weight-resharding between inference & training + massive async RL rollout sandboxes.',
    xQuery: 'verl OR OpenRLHF OR "RL infra" GRPO rollout vLLM SGLang',
    resources: [
      { title: 'HybridFlow / verl Paper (EuroSys 2025)', type: 'paper', url: 'https://arxiv.org/abs/2409.19256' },
      { title: 'verl GitHub', type: 'repo', url: 'https://github.com/volcengine/verl' }
    ]
  },
  {
    id: 'speculative-mtp',
    name: 'Multi-Token Prediction & Speculative Decoding (EAGLE-3)',
    year: 2025,
    domain: 'inference',
    type: 'breakthrough',
    importance: 4,
    org: 'DeepSeek / SafeAI / LMSYS',
    tagline: 'Broke the 1-token-per-forward-pass ceiling for reasoning models.',
    summary:
      'As reasoning traces stretched to tens of thousands of tokens, draft-verify speculative decoding (EAGLE-2/3) and native Multi-Token Prediction (MTP) heads turned memory-bound decode into parallel verification, delivering 2–3.5× lossless speedups.',
    breakthrough: 'Tree-structured feature-level drafting (EAGLE) + native MTP draft heads.',
    xQuery: '"speculative decoding" EAGLE-3 MTP "multi-token prediction" inference',
    resources: [
      { title: 'EAGLE-3 Paper (arXiv 2025)', type: 'paper', url: 'https://arxiv.org/abs/2503.01840' }
    ]
  },
  {
    id: 'ai-factories-2026',
    name: 'AI Factories, Rubin & Co-Packaged Optics',
    year: 2026,
    domain: 'compute',
    type: 'hardware',
    importance: 5,
    org: 'NVIDIA / Hyperscalers',
    tagline: 'Gigawatt-scale clusters, HBM4, silicon photonics & agent-scale inference grids.',
    summary:
      'By 2026, ML infra shifted from single clusters to gigawatt "AI Factories": HBM4 memory stacks, Rubin-era architectures, co-packaged optical interconnects, wide-EP disaggregated inference fleets, and automated kernel/cluster co-optimization.',
    breakthrough: 'Rack-to-datacenter optical scale-up + HBM4 + autonomous kernel/cluster compilers.',
    xQuery: 'Rubin HBM4 "AI factory" "co-packaged optics" 2026 ML infra',
    resources: [
      { title: 'SemiAnalysis Infrastructure Deep Dives', type: 'x', url: 'https://x.com/SemiAnalysis_' },
      { title: 'NVIDIA GTC / Architecture Updates', type: 'x', url: 'https://x.com/nvidia' }
    ]
  },
  {
    id: 'agent-runtime-2026',
    name: 'Autonomous Agent & Kernel-Synthesis Infra',
    year: 2026,
    domain: 'orchestration',
    type: 'breakthrough',
    importance: 4,
    org: 'Frontier Labs / Open Source',
    tagline: 'AI systems now write, benchmark, and optimize their own GPU kernels & sandboxes.',
    summary:
      'The newest frontier closes the loop: massive fleets of ephemeral microVM sandboxes power parallel coding/computer-use agents, while RL-trained kernel agents automatically synthesize and verify CUDA/Triton/CuTe kernels.',
    breakthrough: 'Sub-second microVM agent fleets + RL-verified automated GPU kernel generation.',
    xQuery: '"kernel generation" OR "AI writing CUDA" OR "agent sandbox" infra 2026',
    resources: [
      { title: 'KernelBench (Stanford Scaling Intelligence)', type: 'paper', url: 'https://arxiv.org/abs/2502.10517' },
      { title: 'GPU MODE on X', type: 'x', url: 'https://x.com/cuda_mode' }
    ]
  }
];

export const EDGES = [
  // Compute & Silicon lineage
  { source: 'cuda', target: 'alexnet-gpu', label: 'enabled' },
  { source: 'cuda', target: 'cudnn', label: 'foundation for' },
  { source: 'cuda', target: 'theano', label: 'targeted' },
  { source: 'cuda', target: 'transformer', label: 'evolved into Tensor Cores' },
  { source: 'tpu-v1', target: 'xla', label: 'co-designed with' },
  { source: 'tpu-v1', target: 'custom-silicon-wave', label: 'pioneered ASIC wave' },
  { source: 'transformer', target: 'a100', label: 'drove BF16 & HBM2e' },
  { source: 'a100', target: 'h100', label: 'scaled to FP8 & TMA' },
  { source: 'h100', target: 'blackwell', label: 'scaled to NVL72 & FP4' },
  { source: 'blackwell', target: 'ai-factories-2026', label: 'evolved into' },
  { source: 'custom-silicon-wave', target: 'ai-factories-2026', label: 'reshaped TCO' },

  // Frameworks & Compilers lineage
  { source: 'theano', target: 'tensorflow', label: 'inspired static graphs' },
  { source: 'theano', target: 'pytorch', label: 'inspired autograd' },
  { source: 'caffe', target: 'pytorch', label: 'merged Caffe2' },
  { source: 'cudnn', target: 'caffe', label: 'accelerated' },
  { source: 'cudnn', target: 'tensorflow', label: 'accelerated' },
  { source: 'cudnn', target: 'pytorch', label: 'accelerated' },
  { source: 'tensorflow', target: 'xla', label: 'spawned compiler' },
  { source: 'xla', target: 'jax', label: 'powers' },
  { source: 'pytorch', target: 'pytorch2', label: 'evolved into' },
  { source: 'triton-lang', target: 'pytorch2', label: 'Inductor backend' },
  { source: 'triton-lang', target: 'thunderkittens', label: 'inspired tile DSLs' },
  { source: 'cuda', target: 'triton-lang', label: 'abstracted' },
  { source: 'h100', target: 'thunderkittens', label: 'TMA/WGMMA target' },
  { source: 'thunderkittens', target: 'agent-runtime-2026', label: 'kernel synthesis target' },

  // Distributed Training lineage
  { source: 'distbelief', target: 'tensorflow', label: 'evolved into' },
  { source: 'distbelief', target: 'nccl', label: 'replaced PS with collectives' },
  { source: 'alexnet-gpu', target: 'megatron', label: 'pioneered model parallelism' },
  { source: 'nccl', target: 'horovod', label: 'powered' },
  { source: 'nccl', target: 'megatron', label: 'enabled TP/PP' },
  { source: 'nccl', target: 'deepspeed-zero', label: 'enabled ZeRO' },
  { source: 'deepspeed-zero', target: 'fsdp', label: 'inspired native PyTorch' },
  { source: 'pytorch', target: 'fsdp', label: 'built into' },
  { source: 'megatron', target: 'deepseek-infra', label: 'evolved to DualPipe/EP' },
  { source: 'flashattention', target: 'ring-attention', label: 'scaled to multi-GPU' },
  { source: 'ring-attention', target: 'deepseek-infra', label: 'context parallelism' },
  { source: 'h100', target: 'deepseek-infra', label: 'PTX/FP8 co-design' },

  // Kernels & Attention lineage
  { source: 'transformer', target: 'mixed-precision', label: 'unlocked FP16 training' },
  { source: 'mixed-precision', target: 'quantization-wave', label: 'pushed to INT4/FP8' },
  { source: 'cudnn', target: 'flashattention', label: 'surpassed via IO-awareness' },
  { source: 'flashattention', target: 'flashattention3', label: 'Hopper async redesign' },
  { source: 'h100', target: 'flashattention3', label: 'TMA + WGMMA' },
  { source: 'flashattention3', target: 'flashmla-fp8', label: 'inspired MLA kernels' },
  { source: 'deepseek-infra', target: 'flashmla-fp8', label: 'released' },
  { source: 'quantization-wave', target: 'flashmla-fp8', label: 'block-scaled FP8/FP4' },

  // Inference & Serving lineage
  { source: 'tensorrt', target: 'triton-server', label: 'served via' },
  { source: 'tensorrt', target: 'trt-llm', label: 'specialized for LLMs' },
  { source: 'orca', target: 'vllm', label: 'continuous batching' },
  { source: 'flashattention', target: 'vllm', label: 'fast attention kernel' },
  { source: 'vllm', target: 'sglang', label: 'inspired RadixAttention' },
  { source: 'vllm', target: 'disaggregated-serving', label: 'P/D disaggregation' },
  { source: 'sglang', target: 'disaggregated-serving', label: 'KV-aware routing' },
  { source: 'quantization-wave', target: 'llamacpp', label: '4-bit edge inference' },
  { source: 'blackwell', target: 'trt-llm', label: 'NVFP4 serving' },
  { source: 'sglang', target: 'speculative-mtp', label: 'EAGLE-3 / MTP decoding' },
  { source: 'deepseek-infra', target: 'speculative-mtp', label: 'native MTP heads' },

  // Orchestration, Data & RL lineage
  { source: 'mapreduce', target: 'spark', label: 'replaced by in-memory' },
  { source: 'spark', target: 'ray', label: 'inspired distributed Python' },
  { source: 'kubernetes', target: 'ray', label: 'KubeRay substrate' },
  { source: 'pytorch', target: 'huggingface', label: 'standardized open weights' },
  { source: 'ray', target: 'rl-posttraining-infra', label: 'orchestrates rollouts' },
  { source: 'vllm', target: 'rl-posttraining-infra', label: 'rollout engine' },
  { source: 'sglang', target: 'rl-posttraining-infra', label: 'rollout engine' },
  { source: 'fsdp', target: 'rl-posttraining-infra', label: 'policy training backend' },
  { source: 'rl-posttraining-infra', target: 'agent-runtime-2026', label: 'evolved into agent fleets' }
];

// Attach computed X search links to every node
NODES.forEach((n) => {
  n.xSearchUrl = xSearchUrl(n.xQuery);
});

// Top ML Infra Engineers & AI Research Lab Blogs Directory
export const BLOG_INDEX = [
  // ---- Individual ML Infra Engineers & Researchers ----
  {
    id: 'blog-horace-he',
    name: 'Horace He',
    org: 'Thinking Machines / ex-Meta PyTorch',
    category: 'engineer',
    domains: ['frameworks', 'kernels'],
    relatedNodes: ['pytorch2', 'triton-lang', 'h100'],
    url: 'https://horace.io/',
    xUrl: 'https://x.com/cHHillee',
    featuredPost: {
      title: 'Making Deep Learning Go Brrrr From First Principles',
      url: 'https://horace.io/brrr_intro.html'
    },
    description: 'Essential first-principles mental models for GPU compute, memory bandwidth, overhead, and PyTorch compilers.'
  },
  {
    id: 'blog-simon-boehm',
    name: 'Simon Boehm',
    org: 'Anthropic',
    category: 'engineer',
    domains: ['kernels', 'compute'],
    relatedNodes: ['cuda', 'cudnn', 'flashattention'],
    url: 'https://siboehm.com/',
    featuredPost: {
      title: 'How to Optimize a CUDA Matmul Kernel for cuBLAS-like Performance',
      url: 'https://siboehm.com/articles/22/CUDA-MMM'
    },
    description: 'Step-by-step worklog taking a naive CUDA GEMM kernel all the way to near-cuBLAS speed via coalescing, SMEM tiling, and warptiling.'
  },
  {
    id: 'blog-lilian-weng',
    name: "Lilian Weng (Lil'Log)",
    org: 'Thinking Machines / ex-OpenAI',
    category: 'engineer',
    domains: ['distributed', 'inference', 'orchestration'],
    relatedNodes: ['megatron', 'deepspeed-zero', 'rl-posttraining-infra'],
    url: 'https://lilianweng.github.io/',
    xUrl: 'https://x.com/lilianweng',
    featuredPost: {
      title: 'How to Train Really Large Models on Many GPUs?',
      url: 'https://lilianweng.github.io/posts/2021-09-25-train-large/'
    },
    description: 'Gold-standard technical syntheses of distributed training parallelism, inference optimization, RL, and agents.'
  },
  {
    id: 'blog-tim-dettmers',
    name: 'Tim Dettmers',
    org: 'CMU / Ai2',
    category: 'engineer',
    domains: ['compute', 'kernels'],
    relatedNodes: ['quantization-wave', 'a100', 'h100'],
    url: 'https://timdettmers.com/',
    xUrl: 'https://x.com/Tim_Dettmers',
    featuredPost: {
      title: 'Which GPU(s) to Get for Deep Learning',
      url: 'https://timdettmers.com/2023/01/30/which-gpu-for-deep-learning/'
    },
    description: 'Deep dives on GPU hardware selection, 8-bit/4-bit quantization (bitsandbytes, QLoRA), and low-precision numerics.'
  },
  {
    id: 'blog-karpathy',
    name: 'Andrej Karpathy',
    org: 'Eureka Labs / ex-OpenAI & Tesla',
    category: 'engineer',
    domains: ['frameworks', 'kernels', 'distributed'],
    relatedNodes: ['pytorch', 'transformer', 'cuda'],
    url: 'https://karpathy.github.io/',
    xUrl: 'https://x.com/karpathy',
    featuredPost: {
      title: 'A Recipe for Training Neural Networks',
      url: 'https://karpathy.github.io/2019/04/25/recipe/'
    },
    description: 'First-principles systems intuition—from `llm.c` bare-metal CUDA training to practical debugging of large runs.'
  },
  {
    id: 'blog-lei-mao',
    name: 'Lei Mao',
    org: 'NVIDIA',
    category: 'engineer',
    domains: ['kernels', 'compute', 'inference'],
    relatedNodes: ['cuda', 'tensorrt', 'h100'],
    url: 'https://leimao.github.io/',
    featuredPost: {
      title: 'CUDA & Tensor Core Systems LogBook',
      url: 'https://leimao.github.io/tags/CUDA/'
    },
    description: 'Encyclopedic engineering articles on CUDA PTX, WMMA/WGMMA Tensor Cores, NCCL, quantization, and TensorRT.'
  },
  {
    id: 'blog-aleksa-gordic',
    name: 'Aleksa Gordić',
    org: 'ex-Google DeepMind / Runa',
    category: 'engineer',
    domains: ['inference', 'kernels', 'distributed'],
    relatedNodes: ['vllm', 'flashattention', 'deepseek-infra'],
    url: 'https://www.aleksagordic.com/',
    xUrl: 'https://x.com/gordic_aleksa',
    featuredPost: {
      title: 'Inside vLLM: Anatomy of a High-Throughput LLM Inference System',
      url: 'https://www.aleksagordic.com/blog/vllm'
    },
    description: 'Detailed architectural teardowns of vLLM, FlashAttention, and modern ML systems internals.'
  },
  {
    id: 'blog-sasha-rush',
    name: 'Sasha Rush',
    org: 'Cornell Tech / Hugging Face',
    category: 'engineer',
    domains: ['kernels', 'frameworks'],
    relatedNodes: ['triton-lang', 'cuda', 'pytorch'],
    url: 'https://srush.github.io/',
    xUrl: 'https://x.com/SashaRush',
    featuredPost: {
      title: 'GPU Puzzles & Triton Puzzles',
      url: 'https://github.com/srush/GPU-Puzzles'
    },
    description: 'Interactive, hands-on puzzles and essays for mastering GPU thread indexing, shared memory, and Triton.'
  },
  {
    id: 'blog-kipply',
    name: 'Kipply',
    org: 'Independent ML Systems',
    category: 'engineer',
    domains: ['inference', 'compute'],
    relatedNodes: ['orca', 'vllm', 'disaggregated-serving'],
    url: 'https://kipp.ly/',
    featuredPost: {
      title: 'Transformer Inference Arithmetic',
      url: 'https://kipp.ly/transformer-inference-arithmetic/'
    },
    description: 'The canonical math guide to FLOPs, KV cache memory, arithmetic intensity, and prefill vs. decode bottlenecks.'
  },
  {
    id: 'blog-nathan-lambert',
    name: 'Nathan Lambert (Interconnects)',
    org: 'Ai2 / ex-Hugging Face',
    category: 'engineer',
    domains: ['orchestration', 'distributed'],
    relatedNodes: ['rl-posttraining-infra', 'deepseek-infra', 'huggingface'],
    url: 'https://www.interconnects.ai/',
    xUrl: 'https://x.com/natolambert',
    featuredPost: {
      title: 'Interconnects — RLHF, Post-Training & Reasoning Infra',
      url: 'https://www.interconnects.ai/'
    },
    description: 'Deep tracking of post-training pipelines, GRPO/RLVR infrastructure, open weights, and frontier lab tooling.'
  },
  {
    id: 'blog-chip-huyen',
    name: 'Chip Huyen',
    org: 'Stanford / Claypot AI',
    category: 'engineer',
    domains: ['orchestration', 'inference'],
    relatedNodes: ['kubernetes', 'ray', 'vllm'],
    url: 'https://huyenchip.com/blog/',
    xUrl: 'https://x.com/chipro',
    featuredPost: {
      title: 'ML Systems Design & AI Engineering Essays',
      url: 'https://huyenchip.com/blog/'
    },
    description: 'Production ML platform architecture, real-time streaming pipelines, evaluation, and AI infrastructure trade-offs.'
  },
  {
    id: 'blog-semianalysis',
    name: 'SemiAnalysis (Dylan Patel et al.)',
    org: 'SemiAnalysis',
    category: 'lab',
    domains: ['compute', 'distributed', 'inference'],
    relatedNodes: ['h100', 'blackwell', 'ai-factories-2026', 'custom-silicon-wave'],
    url: 'https://www.semianalysis.com/',
    xUrl: 'https://x.com/SemiAnalysis_',
    featuredPost: {
      title: 'InferenceMAX, GB200 NVL72 & AI Cluster Deep Dives',
      url: 'https://www.semianalysis.com/'
    },
    description: 'Industry-leading silicon, networking (NVLink/InfiniBand/Ethernet), power, and inference TCO analysis.'
  },

  // ---- Top AI Companies & Research Lab Blogs ----
  {
    id: 'lab-deepmind-jax',
    name: 'Google DeepMind — How to Scale Your Model',
    org: 'Google DeepMind',
    category: 'lab',
    domains: ['compute', 'distributed', 'frameworks'],
    relatedNodes: ['tpu-v1', 'jax', 'xla', 'megatron'],
    url: 'https://jax-ml.github.io/scaling-book/',
    featuredPost: {
      title: 'How to Scale Your Model: A Systems View of LLMs on TPUs',
      url: 'https://jax-ml.github.io/scaling-book/'
    },
    description: 'A complete open-access textbook by DeepMind engineers covering roofline math, TPUs, sharding, and LLM inference.'
  },
  {
    id: 'lab-anthropic',
    name: 'Anthropic Engineering & Research',
    org: 'Anthropic',
    category: 'lab',
    domains: ['orchestration', 'inference', 'distributed'],
    relatedNodes: ['agent-runtime-2026', 'rl-posttraining-infra', 'custom-silicon-wave'],
    url: 'https://www.anthropic.com/engineering',
    xUrl: 'https://x.com/AnthropicAI',
    featuredPost: {
      title: 'Anthropic Engineering Blog',
      url: 'https://www.anthropic.com/engineering'
    },
    description: 'Production lessons on building reliable agent harnesses, multi-cloud accelerator infra, and long-context systems.'
  },
  {
    id: 'lab-openai',
    name: 'OpenAI Engineering & Research',
    org: 'OpenAI',
    category: 'lab',
    domains: ['frameworks', 'distributed', 'compute'],
    relatedNodes: ['triton-lang', 'kubernetes', 'ray', 'rl-posttraining-infra'],
    url: 'https://openai.com/research/',
    xUrl: 'https://x.com/OpenAI',
    featuredPost: {
      title: 'Scaling Kubernetes to 7,500+ Nodes & Triton Kernel Compiler',
      url: 'https://openai.com/index/scaling-kubernetes-to-7500-nodes/'
    },
    description: 'Systems engineering milestones on massive GPU clusters, Triton, and reasoning-scale RL compute.'
  },
  {
    id: 'lab-meta-pytorch',
    name: 'Meta AI & PyTorch Engineering Blog',
    org: 'Meta AI',
    category: 'lab',
    domains: ['frameworks', 'distributed', 'kernels'],
    relatedNodes: ['pytorch', 'pytorch2', 'fsdp'],
    url: 'https://pytorch.org/blog/',
    xUrl: 'https://x.com/PyTorch',
    featuredPost: {
      title: 'PyTorch Official Engineering Blog (FSDP2, FlexAttention, TorchTitan)',
      url: 'https://pytorch.org/blog/'
    },
    description: 'Deep dives on Llama 24K-GPU cluster reliability, TorchTitan, FlexAttention, FP8 training, and `torch.compile`.'
  },
  {
    id: 'lab-nvidia',
    name: 'NVIDIA Technical Blog',
    org: 'NVIDIA',
    category: 'lab',
    domains: ['compute', 'kernels', 'inference'],
    relatedNodes: ['cuda', 'cudnn', 'h100', 'blackwell', 'trt-llm'],
    url: 'https://developer.nvidia.com/blog/',
    xUrl: 'https://x.com/nvidia',
    featuredPost: {
      title: 'NVIDIA Developer Technical Blog (CUTLASS, Blackwell, Dynamo)',
      url: 'https://developer.nvidia.com/blog/'
    },
    description: 'Primary architectural breakdowns of Hopper, Blackwell, NVFP4, CUTLASS CuTe, NCCL, and NVIDIA Dynamo.'
  },
  {
    id: 'lab-huggingface',
    name: 'Hugging Face — Ultra-Scale Playbook & Blog',
    org: 'Hugging Face',
    category: 'lab',
    domains: ['distributed', 'orchestration', 'frameworks'],
    relatedNodes: ['huggingface', 'megatron', 'deepspeed-zero', 'fsdp'],
    url: 'https://huggingface.co/blog',
    xUrl: 'https://x.com/huggingface',
    featuredPost: {
      title: 'The Ultra-Scale Playbook: Training LLMs on GPU Clusters',
      url: 'https://huggingface.co/spaces/nanotron/ultrascale-playbook'
    },
    description: 'Hands-on visual book and engineering posts covering 5D parallelism (DP, TP, PP, CP, EP), kernels, and open datasets.'
  },
  {
    id: 'lab-lmsys',
    name: 'LMSYS Org Blog (SGLang)',
    org: 'LMSYS Org',
    category: 'lab',
    domains: ['inference', 'kernels', 'orchestration'],
    relatedNodes: ['sglang', 'disaggregated-serving', 'speculative-mtp'],
    url: 'https://lmsys.org/blog/',
    xUrl: 'https://x.com/lmsysorg',
    featuredPost: {
      title: 'SGLang Deep Dives: RadixAttention, DeepSeek-V3 & PD Disaggregation',
      url: 'https://lmsys.org/blog/'
    },
    description: 'Frontier inference engineering: wide-EP MoE serving, speculative decoding, RL rollout engines, and zero-overhead schedulers.'
  },
  {
    id: 'lab-vllm',
    name: 'vLLM Engineering Blog',
    org: 'vLLM / UC Berkeley Sky Lab',
    category: 'lab',
    domains: ['inference', 'kernels'],
    relatedNodes: ['vllm', 'disaggregated-serving', 'rl-posttraining-infra'],
    url: 'https://blog.vllm.ai/',
    xUrl: 'https://x.com/vllm_project',
    featuredPost: {
      title: 'vLLM V1 Architecture & High-Throughput Serving',
      url: 'https://blog.vllm.ai/'
    },
    description: 'Core architecture updates on PagedAttention, chunked prefill, V1 engine multiprocessing, and disaggregated KV caches.'
  },
  {
    id: 'lab-hazy',
    name: 'Stanford HazyResearch Blog',
    org: 'Stanford University',
    category: 'lab',
    domains: ['kernels', 'frameworks'],
    relatedNodes: ['flashattention', 'flashattention3', 'thunderkittens'],
    url: 'https://hazyresearch.stanford.edu/blog',
    featuredPost: {
      title: 'ThunderKittens & IO-Aware Hardware-Software Co-Design',
      url: 'https://hazyresearch.stanford.edu/blog'
    },
    description: 'Chris Ré’s lab blog detailing FlashAttention, ThunderKittens, Mamba/state-space kernels, and hardware-aware ML.'
  },
  {
    id: 'lab-together',
    name: 'Together AI Research & Systems Blog',
    org: 'Together AI',
    category: 'lab',
    domains: ['kernels', 'inference', 'distributed'],
    relatedNodes: ['flashattention3', 'speculative-mtp', 'deepseek-infra'],
    url: 'https://www.together.ai/blog',
    featuredPost: {
      title: 'FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-Precision',
      url: 'https://www.together.ai/blog/flashattention-3'
    },
    description: 'Kernel engineering, FP8/FP4 quantization, speculative decoding, and large-scale cluster training insights.'
  },
  {
    id: 'lab-thinking-machines',
    name: 'Thinking Machines Lab (Connectionism)',
    org: 'Thinking Machines Lab',
    category: 'lab',
    domains: ['kernels', 'inference', 'orchestration'],
    relatedNodes: ['pytorch2', 'rl-posttraining-infra', 'flashattention3'],
    url: 'https://thinkingmachines.ai/blog/',
    featuredPost: {
      title: 'Connectionism — Systems, Determinism & Post-Training Research',
      url: 'https://thinkingmachines.ai/blog/'
    },
    description: 'Deep technical posts on batch-invariant GPU kernels, LLM inference determinism, LoRA without regret, and RL systems.'
  },
  {
    id: 'lab-modal',
    name: 'Modal Engineering & GPU Glossary',
    org: 'Modal',
    category: 'lab',
    domains: ['compute', 'inference', 'orchestration'],
    relatedNodes: ['h100', 'blackwell', 'cuda', 'vllm'],
    url: 'https://modal.com/blog',
    featuredPost: {
      title: 'The GPU Glossary — Interactive Reference to GPU Architecture & CUDA',
      url: 'https://modal.com/gpu-glossary'
    },
    description: 'Crystal-clear interactive GPU architecture reference plus serverless container cold-start and inference engineering.'
  },
  {
    id: 'lab-deepseek',
    name: 'DeepSeek Open-Source Week & Tech Reports',
    org: 'DeepSeek AI',
    category: 'lab',
    domains: ['distributed', 'kernels', 'inference'],
    relatedNodes: ['deepseek-infra', 'flashmla-fp8', 'speculative-mtp'],
    url: 'https://github.com/deepseek-ai',
    xUrl: 'https://x.com/deepseek_ai',
    featuredPost: {
      title: 'DeepSeek-V3/R1 Systems: DualPipe, DeepEP, DeepGEMM & 3FS',
      url: 'https://github.com/deepseek-ai/open-infra-index'
    },
    description: 'Bare-metal MoE communication, PTX-level optimization, FP8 GEMMs, and high-throughput distributed filesystems.'
  },
  {
    id: 'lab-databricks',
    name: 'Databricks / MosaicML Engineering',
    org: 'Databricks',
    category: 'lab',
    domains: ['orchestration', 'distributed'],
    relatedNodes: ['spark', 'fsdp', 'ray'],
    url: 'https://www.databricks.com/blog/category/engineering',
    featuredPost: {
      title: 'LLM Foundry, StreamingDataset & MosaicML Systems Engineering',
      url: 'https://www.databricks.com/blog/category/engineering'
    },
    description: 'Production data streaming, fault-tolerant cluster training, and enterprise compound AI systems.'
  },
  {
    id: 'lab-deepmind-blog',
    name: 'Google DeepMind Blog',
    org: 'Google DeepMind',
    category: 'lab',
    domains: ['compute', 'distributed', 'orchestration'],
    relatedNodes: ['tpu-v1', 'jax', 'transformer', 'rl-posttraining-infra'],
    url: 'https://deepmind.google/discover/blog/',
    xUrl: 'https://x.com/GoogleDeepMind',
    featuredPost: {
      title: 'Google DeepMind Research & Systems Announcements',
      url: 'https://deepmind.google/discover/blog/'
    },
    description: 'Frontier breakthroughs across Gemini scaling, TPU co-design, AlphaEvolve/kernel discovery, and reasoning systems.'
  },
  {
    id: 'lab-meta-eng',
    name: 'Engineering at Meta (AI Infra)',
    org: 'Meta',
    category: 'lab',
    domains: ['distributed', 'orchestration', 'compute'],
    relatedNodes: ['pytorch', 'pytorch2', 'fsdp', 'h100'],
    url: 'https://engineering.fb.com/category/ml-applications/',
    featuredPost: {
      title: 'Building Meta’s 24K+ GPU Clusters, RoCE Networking & Grand Teton',
      url: 'https://engineering.fb.com/category/ml-applications/'
    },
    description: 'Production cluster engineering: 24K+ GPU RoCE/InfiniBand fabrics, hardware reliability, and Llama training systems.'
  },
  {
    id: 'lab-ai2',
    name: 'Allen Institute for AI (Ai2)',
    org: 'Allen Institute for AI',
    category: 'lab',
    domains: ['distributed', 'orchestration'],
    relatedNodes: ['rl-posttraining-infra', 'fsdp', 'huggingface'],
    url: 'https://allenai.org/blog',
    xUrl: 'https://x.com/allen_ai',
    featuredPost: {
      title: 'OLMo & Tulu Open Pretraining and Post-Training Recipes',
      url: 'https://allenai.org/blog'
    },
    description: 'Fully open pretraining code, data curation pipelines, RLVR post-training recipes, and transparent ablation logs.'
  },
  {
    id: 'lab-coreweave',
    name: 'CoreWeave Engineering Blog',
    org: 'CoreWeave',
    category: 'lab',
    domains: ['compute', 'orchestration', 'distributed'],
    relatedNodes: ['h100', 'blackwell', 'kubernetes', 'ai-factories-2026'],
    url: 'https://www.coreweave.com/blog',
    xUrl: 'https://x.com/CoreWeave',
    featuredPost: {
      title: 'Bare-Metal Kubernetes, InfiniBand & GB200 NVL72 Cluster Engineering',
      url: 'https://www.coreweave.com/blog'
    },
    description: 'AI cloud infrastructure deep dives on bare-metal GPU fleets, Slurm-on-Kubernetes, liquid cooling, and MLPerf benchmarks.'
  },
  {
    id: 'lab-fireworks',
    name: 'Fireworks AI Engineering',
    org: 'Fireworks AI',
    category: 'lab',
    domains: ['inference', 'kernels'],
    relatedNodes: ['vllm', 'sglang', 'quantization-wave', 'speculative-mtp'],
    url: 'https://fireworks.ai/blog',
    featuredPost: {
      title: 'FireAttention, FP8/FP4 Serving & High-Throughput Inference Systems',
      url: 'https://fireworks.ai/blog'
    },
    description: 'Low-latency inference optimization, custom attention kernels, speculative decoding, and MoE serving.'
  },
  {
    id: 'lab-prime-intellect',
    name: 'Prime Intellect Research',
    org: 'Prime Intellect',
    category: 'lab',
    domains: ['distributed', 'orchestration'],
    relatedNodes: ['rl-posttraining-infra', 'deepseek-infra', 'ring-attention'],
    url: 'https://www.primeintellect.ai/blog',
    featuredPost: {
      title: 'INTELLECT & Decentralized Low-Communication Training (DiLoCo)',
      url: 'https://www.primeintellect.ai/blog'
    },
    description: 'Geo-distributed training over standard internet links (DiLoCo), async RL environments, and open decentralized compute.'
  },
  {
    id: 'lab-epoch',
    name: 'Epoch AI (Research Institute)',
    org: 'Epoch AI',
    category: 'lab',
    domains: ['compute', 'distributed'],
    relatedNodes: ['a100', 'h100', 'blackwell', 'ai-factories-2026'],
    url: 'https://epoch.ai/blog',
    xUrl: 'https://x.com/EpochAIResearch',
    featuredPost: {
      title: 'Compute Trends, Hardware Scaling & Frontier AI Cluster Economics',
      url: 'https://epoch.ai/blog'
    },
    description: 'Quantitative research institute tracking training compute growth, datacenter power, chip supply, and algorithmic efficiency.'
  },
  {
    id: 'lab-anyscale',
    name: 'Anyscale / Ray Engineering Blog',
    org: 'Anyscale',
    category: 'lab',
    domains: ['orchestration', 'inference', 'distributed'],
    relatedNodes: ['ray', 'rl-posttraining-infra', 'vllm'],
    url: 'https://www.anyscale.com/blog',
    featuredPost: {
      title: 'Scaling Ray Data, Ray Train & Distributed RL Workloads',
      url: 'https://www.anyscale.com/blog'
    },
    description: 'Practical distributed Python patterns for multimodal data pipelines, fault-tolerant training, and Ray Serve.'
  }
];

