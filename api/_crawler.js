// Parallel, zero-dependency RSS / Atom / GitHub Releases / arXiv crawler + Emerging Paradigm Detector
export const SOURCES = [
  // Frontier Labs & Institutes
  { id: 'deepmind',      name: 'Google DeepMind',       kind: 'lab',      url: 'https://deepmind.google/blog/rss.xml' },
  { id: 'meta-eng',      name: 'Engineering at Meta',   kind: 'lab',      url: 'https://engineering.fb.com/category/ml-applications/feed/' },
  { id: 'openai',        name: 'OpenAI News & Research',kind: 'lab',      url: 'https://openai.com/news/rss.xml' },
  { id: 'thinking-mach', name: 'Thinking Machines Lab', kind: 'lab',      url: 'https://thinkingmachines.ai/blog/index.xml' },
  { id: 'ai2',           name: 'Allen Institute (Ai2)', kind: 'lab',      url: 'https://blog.allenai.org/feed' },
  { id: 'epoch-ai',      name: 'Epoch AI Institute',    kind: 'lab',      url: 'https://epoch.ai/atom.xml' },

  // Core Infra Platforms & Clouds
  { id: 'pytorch',       name: 'PyTorch Blog',          kind: 'lab',      url: 'https://pytorch.org/feed.xml' },
  { id: 'huggingface',   name: 'Hugging Face Blog',     kind: 'lab',      url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'vllm',          name: 'vLLM Blog',             kind: 'lab',      url: 'https://blog.vllm.ai/feed.xml' },
  { id: 'lmsys',         name: 'LMSYS / SGLang Blog',   kind: 'lab',      url: 'https://lmsys.org/atom.xml' },
  { id: 'nvidia',        name: 'NVIDIA Tech Blog',      kind: 'lab',      url: 'https://developer.nvidia.com/blog/feed/' },
  { id: 'modal',         name: 'Modal Blog',            kind: 'lab',      url: 'https://modal.com/blog/feed.xml' },
  { id: 'coreweave',     name: 'CoreWeave Blog',        kind: 'lab',      url: 'https://www.coreweave.com/blog/rss.xml' },
  { id: 'semianalysis',  name: 'SemiAnalysis',          kind: 'lab',      url: 'https://www.semianalysis.com/feed' },

  // Top ML Infra Engineers
  { id: 'lilian-weng',   name: "Lilian Weng (Lil'Log)", kind: 'engineer', url: 'https://lilianweng.github.io/index.xml' },
  { id: 'horace-he',     name: 'Horace He',             kind: 'engineer', url: 'https://horace.io/feed.xml' },
  { id: 'tim-dettmers',  name: 'Tim Dettmers',          kind: 'engineer', url: 'https://timdettmers.com/feed/' },
  { id: 'interconnects', name: 'Nathan Lambert',        kind: 'engineer', url: 'https://www.interconnects.ai/feed' },
  { id: 'chip-huyen',    name: 'Chip Huyen',            kind: 'engineer', url: 'https://huyenchip.com/feed.xml' },
  { id: 'simon-boehm',   name: 'Simon Boehm',           kind: 'engineer', url: 'https://siboehm.com/feed.xml' },

  // GitHub Releases (High-signal ML infra releases)
  { id: 'gh-vllm',       name: 'vLLM Releases',         kind: 'release',  url: 'https://github.com/vllm-project/vllm/releases.atom' },
  { id: 'gh-sglang',     name: 'SGLang Releases',       kind: 'release',  url: 'https://github.com/sgl-project/sglang/releases.atom' },
  { id: 'gh-pytorch',    name: 'PyTorch Releases',      kind: 'release',  url: 'https://github.com/pytorch/pytorch/releases.atom' },
  { id: 'gh-triton',     name: 'Triton Releases',       kind: 'release',  url: 'https://github.com/triton-lang/triton/releases.atom' },

  // arXiv ML Systems / Frontier Infra Papers
  {
    id: 'arxiv-mlsys',
    name: 'arXiv ML Systems',
    kind: 'paper',
    url: 'https://export.arxiv.org/api/query?search_query=all:(FlashAttention+OR+vLLM+OR+SGLang+OR+%22KV+cache%22+OR+%22speculative+decoding%22+OR+%22distributed+training%22+OR+Triton+OR+Blackwell+OR+DiLoCo+OR+%22kernel+generation%22)&sortBy=submittedDate&sortOrder=descending&max_results=15'
  }
];

const TOPIC_RULES = [
  ['topic-gpus', /\b(gpu|tpu|cuda|h100|b200|gb200|blackwell|rubin|hbm|sram|nvlink|silicon|asic|hopper|tensor core|photonics|optics)\b/i],
  ['topic-kernels', /\b(kernel|triton|cutlass|cute|ptx|gemm|matmul|thunderkittens|tilelang|cudnn|flashinfer|batch-invariant|deterministic)\b/i],
  ['topic-frameworks', /\b(pytorch|jax|xla|torch\.compile|inductor|dynamo|compiler|autograd|tensorflow|torchtitan)\b/i],
  ['topic-attention', /\b(attention|flashattention|flashmla|mla|kv cache|long context|ring attention|context parallel|linear attention|mamba|ssm)\b/i],
  ['topic-quantization', /\b(fp8|fp4|nvfp4|mxfp4|int4|int8|1\.58-bit|ternary|quantiz|awq|qlora|gguf|bf16|mixed precision)\b/i],
  ['topic-distributed', /\b(distributed|fsdp|zero|deepspeed|megatron|nccl|allreduce|parallelism|moe|deepep|dualpipe|sharding|diloco|decentralized)\b/i],
  ['topic-inference', /\b(vllm|sglang|tensorrt|serving|inference|pagedattention|radixattention|batching|ttft|tpot|diffusion llm)\b/i],
  ['topic-disagg', /\b(disaggregat|prefill|decode|mooncake|dynamo|speculative|eagle|mtp|multi-token)\b/i],
  ['topic-orchestration', /\b(kubernetes|slurm|ray|cluster|scheduler|safetensors|checkpoint|dataset|streaming|coreweave|modal|3fs)\b/i],
  ['topic-rl', /\b(rlhf|grpo|rlvr|verl|openrlhf|post-training|rollout|reasoning|agent|sandbox|test-time|verifier|alphaevolve|kernelbench)\b/i]
];

// Tracks newly emerging paradigms across crawled labs & arXiv so Chapter 11 stays automatically alive
const PARADIGM_RULES = [
  {
    id: 'paradigm-kernel-ai',
    name: 'Autonomous Kernel Synthesis & Discovery',
    description: 'RL-guided and evolutionary agents (AlphaEvolve, KernelBench) automatically writing, verifying, and optimizing CUDA, Triton, and PTX kernels.',
    regex: /\b(kernelbench|alphaevolve|kernel generation|kernel synthesis|ai writing cuda|batch-invariant|deterministic kernel|tilelang|cutedsl)\b/i
  },
  {
    id: 'paradigm-decentralized',
    name: 'Low-Communication & Decentralized Training (DiLoCo)',
    description: 'Training frontier models across geographically distributed clusters over standard internet links by synchronizing gradients infrequently.',
    regex: /\b(diloco|decentralized training|geo-distributed|prime intellect|federated llm|low-communication)\b/i
  },
  {
    id: 'paradigm-rl-factories',
    name: 'Async RLVR & Sandboxed Agent Compute',
    description: 'Merging high-throughput serving engines with fleets of ephemeral microVM sandboxes for verifiable-reward reinforcement learning.',
    regex: /\b(rlvr|grpo|verl|openrlhf|hybridengine|agent sandbox|microvm|rollout engine|post-training infra|test-time compute)\b/i
  },
  {
    id: 'paradigm-disagg-moe',
    name: 'Wide-EP MoE & Disaggregated Serving Fabrics',
    description: 'Splitting prefill and decode across specialized GPU pools while routing fine-grained Mixture-of-Experts across rack-scale NVLink/RDMA domains.',
    regex: /\b(disaggregat|mooncake|deepep|dualpipe|wide-ep|expert parallel|nvl72|dynamo|pd split|prefill-decode)\b/i
  },
  {
    id: 'paradigm-sub4bit',
    name: 'Sub-Byte & Hardware Microscaling (NVFP4 / MXFP4 / 1.58-bit)',
    description: 'Block-scaled 4-bit floating point and ternary weight representations designed directly into Blackwell/Rubin-class Tensor Cores.',
    regex: /\b(nvfp4|mxfp4|fp4|1\.58-bit|bitnet|ternary|microscaling|sub-byte)\b/i
  },
  {
    id: 'paradigm-non-ar',
    name: 'Beyond Standard Attention (MLA, Linear/Hybrid SSMs & Diffusion LLMs)',
    description: 'New architectures co-designed for hardware efficiency: Multi-Head Latent Attention, Mamba/hybrid state-space layers, and parallel diffusion decoding.',
    regex: /\b(flashmla|latent attention|mamba|state space|linear attention|diffusion llm|parallel decoding|multi-token prediction|eagle-3)\b/i
  }
];

function decodeEntities(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

function extractAtomLink(block) {
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alt) return alt[1];
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (any) return any[1];
  return extractTag(block, 'link');
}

function classifyTopics(text) {
  const tags = [];
  for (const [id, rx] of TOPIC_RULES) {
    if (rx.test(text)) tags.push(id);
  }
  return tags.length ? tags.slice(0, 3) : ['topic-frameworks'];
}

function detectEmergingParadigms(items) {
  return PARADIGM_RULES.map((rule) => {
    const matched = items
      .filter((it) => rule.regex.test(`${it.title} ${it.summary}`))
      .slice(0, 5)
      .map((it) => ({
        title: it.title,
        url: it.url,
        sourceName: it.sourceName,
        publishedAt: it.publishedAt
      }));
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      signalCount: matched.length,
      items: matched
    };
  }).sort((a, b) => b.signalCount - a.signalCount);
}

function parseXmlFeed(xml, source) {
  const items = [];
  const rssMatches = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];

  if (rssMatches.length) {
    for (const m of rssMatches.slice(0, 7)) {
      const block = m[1];
      const title = extractTag(block, 'title');
      const url = extractTag(block, 'link');
      const pubRaw = extractTag(block, 'pubDate') || extractTag(block, 'dc:date');
      const summary = extractTag(block, 'description').slice(0, 240);
      if (!title || !url) continue;
      const dt = new Date(pubRaw);
      items.push({
        title,
        url,
        publishedAt: isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString(),
        summary,
        sourceId: source.id,
        sourceName: source.name,
        kind: source.kind,
        topics: classifyTopics(`${title} ${summary}`)
      });
    }
    return items;
  }

  const atomMatches = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)];
  for (const m of atomMatches.slice(0, 7)) {
    const block = m[1];
    const title = extractTag(block, 'title');
    const url = extractAtomLink(block);
    const pubRaw = extractTag(block, 'published') || extractTag(block, 'updated');
    const summary = (extractTag(block, 'summary') || extractTag(block, 'content')).slice(0, 240);
    if (!title || !url) continue;
    const dt = new Date(pubRaw);
    items.push({
      title,
      url,
      publishedAt: isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString(),
      summary,
      sourceId: source.id,
      sourceName: source.name,
      kind: source.kind,
      topics: classifyTopics(`${title} ${summary}`)
    });
  }
  return items;
}

export async function crawlAllSources() {
  const settled = await Promise.allSettled(
    SOURCES.map(async (src) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      try {
        const res = await fetch(src.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'MLInfraHandbookIndexer/1.0' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const parsed = parseXmlFeed(xml, src);
        return { src, parsed };
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const allItems = [];
  const sourceStatus = [];

  settled.forEach((result, i) => {
    const src = SOURCES[i];
    if (result.status === 'fulfilled') {
      allItems.push(...result.value.parsed);
      sourceStatus.push({
        id: src.id,
        name: src.name,
        kind: src.kind,
        url: src.url,
        status: 'ok',
        count: result.value.parsed.length
      });
    } else {
      sourceStatus.push({
        id: src.id,
        name: src.name,
        kind: src.kind,
        url: src.url,
        status: 'error',
        error: result.reason?.message || 'timeout',
        count: 0
      });
    }
  });

  const dedup = new Map();
  for (const item of allItems) {
    if (!dedup.has(item.url)) dedup.set(item.url, item);
  }
  const sorted = [...dedup.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return {
    lastSyncedAt: new Date().toISOString(),
    totalItems: sorted.length,
    sources: sourceStatus,
    emergingParadigms: detectEmergingParadigms(sorted),
    items: sorted.slice(0, 150)
  };
}
