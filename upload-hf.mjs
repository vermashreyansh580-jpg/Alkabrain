import { uploadFiles } from '@huggingface/hub';
import { readdirSync, statSync, openAsBlob } from 'node:fs';
import path from 'node:path';

const accessToken = process.env.HF_TOKEN;
if (!accessToken) { console.error('No HF_TOKEN'); process.exit(1); }

const ROOT = '/tmp/Alkabrain';

const ignoreDirs = new Set(['.git', 'node_modules', '.local', 'dist', 'build', '.cache', '.pnpm-store', '.replit-artifact']);

function walk(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (ignoreDirs.has(name)) continue;
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, rel));
    else if (st.isFile()) out.push({ full, rel, size: st.size });
  }
  return out;
}

const all = walk(ROOT);
const totalBytes = all.reduce((s, f) => s + f.size, 0);
console.log(`Found ${all.length} files, ${(totalBytes/1024/1024).toFixed(2)} MB`);

const files = await Promise.all(all.map(async f => ({
  path: f.rel,
  content: await openAsBlob(f.full),
})));

console.log('Uploading...');
const start = Date.now();
const res = await uploadFiles({
  repo: { type: 'space', name: 'shrey77777/Alkabrain' },
  accessToken,
  files,
  commitTitle: 'Upload ALKABRAIN AI companion',
  commitDescription: 'Warm Claude.ai-style AI companion routing to 20+ open-source HF models, with Replit Auth, Postgres, Razorpay billing, chat history, and strict help bot.',
});
console.log('DONE in', ((Date.now() - start)/1000).toFixed(1), 's');
console.log('commit:', res?.commit?.oid ?? res);
