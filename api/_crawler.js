// Parallel, zero-dependency RSS / Atom / GitHub Releases / arXiv crawler for Vercel Serverless
export const SOURCES = [
  { id: 'pytorch',       name: 'PyTorch Blog',          kind: 'lab',      url: 'https://pytorch.org/feed.xml' },
  { id: 'huggingface',   name: 'Hugging Face Blog',     kind: 'lab',      url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'vllm',          name: 'vLLM Blog',             kind: 'lab',      url: 'https://blog.vllm.ai/feed.xml' },
  { id: 'lmsys',         name: 'LMSYS / SGLang Blog',   kind: 'lab',      url: 'https://lmsys.org/atom.xml' },
  { id: 'nvidia',        name: 'NVIDIA Tech Blog',      kind: 'lab',      url: 'https://developer.nvidia.com/blog/feed/' },
  { id: 'modal',         name: 'Modal Blog',            kind: 'lab',      url: 'https://modal.com/blog/feed.xml' },
  { id: 'lilian-weng',   name: "Lilian Weng (Lil'Log)", kind: 'engineer', url: 'https://lilianweng.github.io/index.xml' },
  { id: 'horace-he',     name: 'Horace He',             kind: 'engineer', url: 'https://horace.io/feed.xml' },
  { id: 'tim-dettmers',  name: 'Tim Dettmers',          kind: 'engineer', url: 'https://timdettmers.com/feed/' },
  { id: 'interconnects', name: 'Nathan Lambert',        kind: 'engineer', url: 'https://www.interconnects.ai/feed' },
  { id: 'chip-huyen',    name: 'Chip Huyen',            kind: 'engineer', url: 'https://huyenchip.com/feed.xml' },
  { id: 'simon-boehm',   name: 'Simon Boehm',           kind: 'engineer', url: 'https://siboehm.com/feed.xml' },
  { id: 'semianalysis',  name: 'SemiAnalysis',          kind: 'lab',      url: 'https://www.semianalysis.com/feed' },
  { id: 'gh-vllm',       name: 'vLLM Releases',         kind: 'release',  url: 'https://github.com/vllm-project/vllm/releases.atom' },
  { id: 'gh-sglang',     name: 'SGLang Releases',       kind: 'release',  url: 'https://github.com/sgl-project/sglang/releases.atom' },
  { id: 'gh-pytorch',    name: 'PyTorch Releases',      kind: 'release',  url: 'https://github.com/pytorch/pytorch/releases.atom' },
  { id: 'gh-triton',     name: 'Triton Releases',       kind: 'release',  url: 'https://github.com/triton-lang/triton/releases.atom' },
  {
    id: 'arxiv-mlsys',
    name: 'arXiv ML Systems',
    kind: 'paper',
    url: 'https://export.arxiv.org/api/query?search_query=all:(FlashAttention+OR+vLLM+OR+SGLang+OR+%22KV+cache%22+OR+%22speculative+decoding%22+OR+%22distributed+training%22+OR+Triton+OR+Blackwell)&sortBy=submittedDate&sortOrder=descending&max_results=12'
  }
];

const TOPIC_RULES = [
  ['topic-gpus', /\b(gpu|tpu|cuda|h100|b200|gb200|blackwell|rubin|hbm|sram|nvlink|silicon|asic|hopper|tensor core)\b/i],
  ['topic-kernels', /\b(kernel|triton|cutlass|cute|ptx|gemm|matmul|thunderkittens|tilelang|cudnn|flashinfer)\b/i],
  ['topic-frameworks', /\b(pytorch|jax|xla|torch\.compile|inductor|dynamo|compiler|autograd|tensorflow)\b/i],
  ['topic-attention', /\b(attention|flashattention|flashmla|mla|kv cache|long context|ring attention|context parallel)\b/i],
  ['topic-quantization', /\b(fp8|fp4|nvfp4|int4|int8|quantiz|awq|qlora|gguf|bf16|mixed precision)\b/i],
  ['topic-distributed', /\b(distributed|fsdp|zero|deepspeed|megatron|nccl|allreduce|parallelism|moe|deepep|dualpipe|sharding)\b/i],
  ['topic-inference', /\b(vllm|sglang|tensorrt|serving|inference|pagedattention|radixattention|batching|ttft|tpot)\b/i],
  ['topic-disagg', /\b(disaggregat|prefill|decode|mooncake|dynamo|speculative|eagle|mtp|multi-token)\b/i],
  ['topic-orchestration', /\b(kubernetes|slurm|ray|cluster|scheduler|safetensors|checkpoint|dataset|streaming)\b/i],
  ['topic-rl', /\b(rlhf|grpo|rlvr|verl|openrlhf|post-training|rollout|reasoning|agent|sandbox)\b/i]
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
          headers: { 'User-Agent': 'MLInfraHistomapIndexer/1.0' }
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
    items: sorted.slice(0, 120)
  };
}
