#!/usr/bin/env node
/**
 * 18.4 Uploads a folder of rug media: images → Cloudflare Images, videos → Cloudflare Stream.
 * Usage: npm run upload-media -- ./media/rug-TR-0042/
 * Env: CF_ACCOUNT_ID, CF_API_TOKEN (Images:Edit + Stream:Edit). Prints a JSON snippet to paste into products.json.
 * File naming: <kind>-<n>.jpg for images (front, back, corner, fringe, macro, room, scale, lifestyle) and <kind>.mp4 for videos (flip, walkthrough, workshop).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const dir = process.argv[2];
const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
if (!dir || !CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error(
    'Usage: CF_ACCOUNT_ID=… CF_API_TOKEN=… npm run upload-media -- ./media/rug-TR-0042/',
  );
  process.exit(1);
}
const rugId = basename(dir.replace(/\/$/, '')).match(/TR-\d{4}/)?.[0] ?? 'TR-XXXX';
const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
const images = [];
const videos = [];
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const kind = basename(f, ext).replace(/-\d+$/, '');
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
    const fd = new FormData();
    fd.append('file', new Blob([readFileSync(join(dir, f))]), f);
    fd.append('id', `${rugId.toLowerCase()}-${basename(f, ext)}`);
    fd.append('metadata', JSON.stringify({ rugId, kind }));
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      { method: 'POST', headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: fd },
    );
    const j = await r.json();
    if (!j.success) {
      console.error(`✖ ${f}:`, j.errors);
      continue;
    }
    images.push({
      id: j.result.id,
      alt: `[EDIT] ${rugId} ${kind}`,
      kind: kind.replace(/\d+$/, ''),
    });
    console.log(`✔ image ${f} → ${j.result.id}`);
  } else if (['.mp4', '.mov', '.webm'].includes(ext)) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      body: (() => {
        const fd = new FormData();
        fd.append('file', new Blob([readFileSync(join(dir, f))]), f);
        return fd;
      })(),
    });
    const j = await r.json();
    if (!j.success) {
      console.error(`✖ ${f}:`, j.errors);
      continue;
    }
    videos.push({
      streamId: j.result.uid,
      kind,
      poster: '',
      caption: `[EDIT] ${kind} video for ${rugId}`,
      transcript: '[EDIT] transcript',
      uploadDate: new Date().toISOString().slice(0, 10),
    });
    console.log(`✔ video ${f} → ${j.result.uid}`);
  }
}
console.log('\nPaste into products.json:\n');
console.log(JSON.stringify({ images, videos }, null, 2));
