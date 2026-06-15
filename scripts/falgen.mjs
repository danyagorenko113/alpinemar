// fal.ai image generator (text-to-image) via the queue REST API.
// Pattern mirrors screen-report/worker/src/capture/video-composite.ts:
//   POST https://queue.fal.run/<model>  ->  { request_id }
//   GET  https://queue.fal.run/<model>/requests/<id>  ->  { images:[{url}] } | { status }
// Auth: Authorization: Key $FAL_KEY   (read from env; never printed)
//
// Usage:
//   node scripts/falgen.mjs --out public/images/gen/hero.jpg --ratio 16:9 --prompt "..."
//   node scripts/falgen.mjs --batch scripts/shots.json
// shots.json: [{ "out": "...", "ratio": "16:9", "prompt": "..." , "model"?: "..." }]

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const KEY = process.env.FAL_KEY;
if (!KEY) {
  console.error('FAL_KEY not set in environment');
  process.exit(1);
}

const DEFAULT_MODEL = 'fal-ai/nano-banana-pro/text-to-image';
const POLL_DELAY = 4000;
const MAX_POLLS = 75;

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      a[k] = v;
    }
  }
  return a;
}

async function submit(model, body) {
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`submit ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  if (!data.request_id) throw new Error(`no request_id: ${JSON.stringify(data).slice(0, 200)}`);
  return data.request_id;
}

async function poll(model, id) {
  for (let i = 0; i < MAX_POLLS; i++) {
    const res = await fetch(`https://queue.fal.run/${model}/requests/${id}`, {
      headers: { Authorization: `Key ${KEY}` },
    });
    if (res.ok) {
      const data = await res.json();
      const url = data.images?.[0]?.url ?? data.image?.url;
      if (url) return url;
      if (data.status === 'FAILED' || data.error)
        throw new Error(`failed: ${JSON.stringify(data.error ?? data).slice(0, 250)}`);
    }
    await new Promise((r) => setTimeout(r, POLL_DELAY));
  }
  throw new Error(`timeout after ${(MAX_POLLS * POLL_DELAY) / 1000}s`);
}

async function gen({ out, prompt, ratio = '16:9', model = DEFAULT_MODEL }) {
  const t0 = Date.now();
  const id = await submit(model, {
    prompt,
    num_images: 1,
    aspect_ratio: ratio,
    output_format: 'jpeg',
  });
  const url = await poll(model, id);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);
  console.log(`✓ ${out}  (${ratio}, ${(buf.length / 1024) | 0}KB, ${((Date.now() - t0) / 1000) | 0}s)`);
}

const args = parseArgs(process.argv.slice(2));
if (args.batch) {
  const shots = JSON.parse(await readFile(args.batch, 'utf8'));
  for (const s of shots) {
    try { await gen(s); } catch (e) { console.error(`✗ ${s.out}: ${e.message}`); }
  }
} else if (args.prompt && args.out) {
  await gen({ out: args.out, prompt: args.prompt, ratio: args.ratio, model: args.model });
} else {
  console.error('need --prompt and --out, or --batch <file>');
  process.exit(1);
}
