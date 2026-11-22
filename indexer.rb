#!/usr/bin/env ruby
# ML Infra Histomap — Live RSS / Atom / arXiv / GitHub Releases Indexer
# Zero external dependencies (uses macOS built-in Ruby stdlib).
# Run manually:   /usr/bin/ruby indexer.rb
# Or via cron:    0 */6 * * * ruby /path/to/ml-infra-handbook/indexer.rb

require 'net/http'
require 'uri'
require 'rexml/document'
require 'json'
require 'time'

ROOT = File.expand_path(__dir__)
OUT_PATH = File.join(ROOT, 'indexed_feed.json')

SOURCES = [
  # Official Lab & Framework Blogs
  { id: 'pytorch',      name: 'PyTorch Blog',          kind: 'lab',      url: 'https://pytorch.org/feed.xml' },
  { id: 'huggingface',  name: 'Hugging Face Blog',     kind: 'lab',      url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'vllm',         name: 'vLLM Blog',             kind: 'lab',      url: 'https://blog.vllm.ai/feed.xml' },
  { id: 'lmsys',        name: 'LMSYS / SGLang Blog',   kind: 'lab',      url: 'https://lmsys.org/atom.xml' },
  { id: 'nvidia',       name: 'NVIDIA Tech Blog',      kind: 'lab',      url: 'https://developer.nvidia.com/blog/feed/' },
  { id: 'modal',        name: 'Modal Blog',            kind: 'lab',      url: 'https://modal.com/blog/feed.xml' },

  # Top ML Infra Engineers
  { id: 'lilian-weng',  name: "Lilian Weng (Lil'Log)", kind: 'engineer', url: 'https://lilianweng.github.io/index.xml' },
  { id: 'horace-he',    name: 'Horace He',             kind: 'engineer', url: 'https://horace.io/feed.xml' },
  { id: 'tim-dettmers', name: 'Tim Dettmers',          kind: 'engineer', url: 'https://timdettmers.com/feed/' },
  { id: 'interconnects',name: 'Nathan Lambert',        kind: 'engineer', url: 'https://www.interconnects.ai/feed' },
  { id: 'chip-huyen',   name: 'Chip Huyen',            kind: 'engineer', url: 'https://huyenchip.com/feed.xml' },
  { id: 'simon-boehm',  name: 'Simon Boehm',           kind: 'engineer', url: 'https://siboehm.com/feed.xml' },
  { id: 'semianalysis', name: 'SemiAnalysis',          kind: 'lab',      url: 'https://www.semianalysis.com/feed' },

  # GitHub Releases (High-signal ML infra releases)
  { id: 'gh-vllm',      name: 'vLLM Releases',         kind: 'release',  url: 'https://github.com/vllm-project/vllm/releases.atom' },
  { id: 'gh-sglang',    name: 'SGLang Releases',       kind: 'release',  url: 'https://github.com/sgl-project/sglang/releases.atom' },
  { id: 'gh-pytorch',   name: 'PyTorch Releases',      kind: 'release',  url: 'https://github.com/pytorch/pytorch/releases.atom' },
  { id: 'gh-triton',    name: 'Triton Releases',       kind: 'release',  url: 'https://github.com/triton-lang/triton/releases.atom' },

  # arXiv ML Systems / Distributed / GPU Kernels API
  {
    id: 'arxiv-mlsys',
    name: 'arXiv ML Systems',
    kind: 'paper',
    url: 'https://export.arxiv.org/api/query?search_query=all:(FlashAttention+OR+vLLM+OR+SGLang+OR+%22KV+cache%22+OR+%22speculative+decoding%22+OR+%22distributed+training%22+OR+Triton+OR+Blackwell)&sortBy=submittedDate&sortOrder=descending&max_results=15'
  }
].freeze

TOPIC_RULES = {
  'topic-gpus'          => /\b(gpu|tpu|cuda|h100|b200|gb200|blackwell|rubin|hbm|sram|nvlink|silicon|asic|hopper|tensor core)\b/i,
  'topic-kernels'       => /\b(kernel|triton|cutlass|cute|ptx|gemm|matmul|thunderkittens|tilelang|cudnn|flashinfer)\b/i,
  'topic-frameworks'    => /\b(pytorch|jax|xla|torch\.compile|inductor|dynamo|compiler|autograd|tensorflow)\b/i,
  'topic-attention'     => /\b(attention|flashattention|flashmla|mla|kv cache|long context|ring attention|context parallel)\b/i,
  'topic-quantization'  => /\b(fp8|fp4|nvfp4|int4|int8|quantiz|awq|qlora|gguf|bf16|mixed precision)\b/i,
  'topic-distributed'   => /\b(distributed|fsdp|zero|deepspeed|megatron|nccl|allreduce|parallelism|moe|deepep|dualpipe|sharding)\b/i,
  'topic-inference'     => /\b(vllm|sglang|tensorrt|serving|inference|pagedattention|radixattention|batching|ttft|tpot)\b/i,
  'topic-disagg'        => /\b(disaggregat|prefill|decode|mooncake|dynamo|speculative|eagle|mtp|multi-token)\b/i,
  'topic-orchestration' => /\b(kubernetes|slurm|ray|cluster|scheduler|safetensors|checkpoint|dataset|streaming)\b/i,
  'topic-rl'            => /\b(rlhf|grpo|rlvr|verl|openrlhf|post-training|rollout|reasoning|agent|sandbox)\b/i
}.freeze

def fetch_url(url_str, limit = 5)
  raise 'Too many redirects' if limit <= 0
  uri = URI.parse(url_str)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https')
  http.open_timeout = 8
  http.read_timeout = 10
  req = Net::HTTP::Get.new(uri.request_uri, { 'User-Agent' => 'MLInfraHistomapIndexer/1.0' })
  res = http.request(req)
  case res
  when Net::HTTPSuccess
    res.body
  when Net::HTTPRedirection
    loc = res['location']
    loc = URI.join(url_str, loc).to_s unless loc.start_with?('http')
    fetch_url(loc, limit - 1)
  else
    raise "HTTP #{res.code}"
  end
end

def strip_html(str)
  return '' unless str
  str.gsub(/<[^>]+>/, ' ').gsub(/\s+/, ' ').strip[0, 260]
end

def classify_topics(text)
  tags = TOPIC_RULES.select { |_topic, regex| text.match?(regex) }.keys
  tags.empty? ? ['topic-frameworks'] : tags.first(3)
end

def parse_feed(xml_str, source)
  doc = REXML::Document.new(xml_str)
  items = []

  # RSS 2.0 <item>
  doc.elements.each('//item') do |el|
    title = el.elements['title']&.text&.strip
    link  = el.elements['link']&.text&.strip
    pub   = el.elements['pubDate']&.text || el.elements['dc:date']&.text
    desc  = el.elements['description']&.text
    next unless title && link
    items << {
      title: strip_html(title),
      url: link,
      publishedAt: (Time.parse(pub).iso8601 rescue Time.now.iso8601),
      summary: strip_html(desc),
      sourceId: source[:id],
      sourceName: source[:name],
      kind: source[:kind],
      topics: classify_topics("#{title} #{desc}")
    }
  end

  # Atom <entry> (GitHub Releases, arXiv, LMSYS, etc.)
  if items.empty?
    doc.elements.each('//entry') do |el|
      title = el.elements['title']&.text&.strip
      link_el = el.elements["link[@rel='alternate']"] || el.elements['link']
      link = link_el&.attributes&.[]('href') || link_el&.text&.strip
      pub = el.elements['published']&.text || el.elements['updated']&.text
      desc = el.elements['summary']&.text || el.elements['content']&.text
      next unless title && link
      items << {
        title: strip_html(title),
        url: link,
        publishedAt: (Time.parse(pub).iso8601 rescue Time.now.iso8601),
        summary: strip_html(desc),
        sourceId: source[:id],
        sourceName: source[:name],
        kind: source[:kind],
        topics: classify_topics("#{title} #{desc}")
      }
    end
  end

  items.first(8)
end

def run_crawl
  all_items = []
  source_status = []

  SOURCES.each do |src|
    begin
      body = fetch_url(src[:url])
      parsed = parse_feed(body, src)
      all_items.concat(parsed)
      source_status << { id: src[:id], name: src[:name], kind: src[:kind], url: src[:url], status: 'ok', count: parsed.length }
      warn "[OK] #{src[:name]} (#{parsed.length} items)"
    rescue => e
      source_status << { id: src[:id], name: src[:name], kind: src[:kind], url: src[:url], status: 'error', error: e.message, count: 0 }
      warn "[ERR] #{src[:name]}: #{e.message}"
    end
  end

  # Deduplicate by URL and sort newest first
  dedup = {}
  all_items.each { |it| dedup[it[:url]] ||= it }
  sorted = dedup.values.sort_by { |it| it[:publishedAt] }.reverse

  payload = {
    lastSyncedAt: Time.now.iso8601,
    totalItems: sorted.length,
    sources: source_status,
    items: sorted.first(120)
  }

  File.write(OUT_PATH, JSON.pretty_generate(payload))
  puts "Indexed #{payload[:totalItems]} items -> #{OUT_PATH}"
end

run_crawl if __FILE__ == $0
