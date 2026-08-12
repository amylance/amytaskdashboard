// Is the fix Amy is looking at the fix that was written?
//
// She was told to refresh, refreshed, and saw the same bug — because the push had landed
// and the deploy had not. "The build passed" and "it is in front of her" are different
// claims, and I kept making the second one while only checking the first.
//
// This makes it a command instead of a habit: it compares the bundle the live site serves
// against the one in dist/, and exits non-zero when they differ. Run it before telling her
// anything is live.
//
//   npm run verify:live
//
// Vercel builds take ~20s, so it polls rather than failing on the first miss.

import { readdirSync } from 'node:fs';

const SITE = process.env.HQ_URL ?? 'https://amy-task-dashboard.vercel.app/';
const TRIES = Number(process.env.HQ_TRIES ?? 10);
const WAIT_MS = 6000;

function localBundle() {
  const files = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
  if (files.length !== 1) {
    throw new Error(
      `Expected exactly one JS bundle in dist/assets, found ${files.length}. ` +
        `Run \`npm run build\` first.`,
    );
  }
  return files[0];
}

async function servedBundle() {
  const res = await fetch(SITE, { cache: 'no-store' });
  // A Claude Code sandbox reaches the internet through an agent proxy that refuses this
  // host, so the check has to be made a different way from there. Saying so here rather
  // than letting a 403 read as "the site is down".
  if (res.status === 403) {
    throw new Error(
      `${SITE} returned 403 — you are probably inside a sandboxed session whose proxy ` +
        `blocks this host. Fetch the site through the Vercel tooling instead and compare ` +
        `the bundle by hand. Do not skip the comparison.`,
    );
  }
  if (!res.ok) throw new Error(`${SITE} returned ${res.status}`);
  const html = await res.text();
  const match = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
  if (!match) throw new Error('No bundle reference found in the served HTML.');
  return match[1];
}

const want = localBundle();
let saw = null;

for (let attempt = 1; attempt <= TRIES; attempt++) {
  saw = await servedBundle();
  if (saw === want) {
    console.log(`live matches local — ${want}`);
    process.exit(0);
  }
  if (attempt < TRIES) {
    console.log(`attempt ${attempt}/${TRIES}: live is ${saw}, waiting for ${want}…`);
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
}

console.error(
  `\nNOT LIVE.\n  local build : ${want}\n  live site   : ${saw}\n\n` +
    `Do not tell Amy to refresh. The deploy has not landed.\n`,
);
process.exit(1);
