# ML Infra Atlas (2006 – 2026)

An interactive **3D Helical Histomap**, **3D Obsidian-style Beginner Knowledge Brain**, and **Live RSS / arXiv / GitHub Releases Indexer** mapping 20 years of Machine Learning Infrastructure—from CUDA (2006) and AlexNet to FlashAttention, vLLM, SGLang, DeepSeek DualPipe/DeepEP, Blackwell NVL72, and 2026 AI Factories.

## Highlights
- **3D Histomap:** Sweeping blue helical mosaic cylinder (`Three.js`), scroll-wheel time travel (`2006 ↔ 2026`), full 360° POV orbiting, bottom density histogram scrubber, and live right-hand editorial feed.
- **Obsidian Brain:** Force-directed knowledge graph with a **10-step Beginner Guided Path (`1 → 10`)**, plain-English mental models, key glossary terms, clickable `[[wikilinks]]`, and direct jumps to the 3D Histomap.
- **Blogs & Labs Directory (26 Sources):** Curated index of top ML infra engineers (Horace He, Simon Boehm, Lilian Weng, Tim Dettmers, Andrej Karpathy, Lei Mao, Aleksa Gordić, Sasha Rush, Kipply, Nathan Lambert, Chip Huyen, SemiAnalysis) and AI companies/labs (Google DeepMind, Anthropic, OpenAI, Meta/PyTorch, NVIDIA, Hugging Face, LMSYS, vLLM, Stanford HazyResearch, Together AI, Thinking Machines, Modal, DeepSeek, Databricks).
- **Live Indexer (Vercel Serverless + Local CLI):** Automatically crawls 18 official RSS/Atom feeds, GitHub Releases (`vLLM`, `SGLang`, `PyTorch`, `Triton`), and the arXiv ML Systems API, auto-classifying every entry into the Obsidian Brain topics.
- **Deep-Linking & X Sharing:** Share exact views or milestones (`?node=flashattention`, `?view=brain`, `?year=2022`) directly to X via the **Share 𝕏** button.

## Deploy to Vercel (Recommended)

### Option A: GitHub → Vercel (1-Click, No CLI Needed)
1. Push `/Users/abeshek/.gemini/antigravity/scratch/ml-infra-galaxy` to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and click **Deploy**.
3. Zero build config required—Vercel automatically serves the static frontend from the Edge CDN, deploys `/api/feed` and `/api/sync` as Node 20 serverless functions with 1-hour Edge caching, and enables the daily cron job in `vercel.json`.

### Option B: Vercel CLI
```bash
cd /Users/abeshek/.gemini/antigravity/scratch/ml-infra-galaxy
npx vercel --prod
```

## Run Locally
```bash
cd /Users/abeshek/.gemini/antigravity/scratch/ml-infra-galaxy
/usr/bin/ruby server.rb
```
Open `http://localhost:8765`. To run a live crawl locally:
```bash
/usr/bin/ruby indexer.rb
```
