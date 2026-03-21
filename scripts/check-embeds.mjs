#!/usr/bin/env node
/**
 * Checks all youtube_id entries in songs.json for embed availability.
 * Uses YouTube's oEmbed endpoint (no API key required):
 *   200 = embeddable
 *   401 = embedding disabled by uploader
 *   404 = video not found / removed
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const songs = JSON.parse(
  readFileSync(join(__dir, "../src/data/songs.json"), "utf8")
);

async function checkEmbed(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url);
    return res.status;
  } catch {
    return "network error";
  }
}

const results = { ok: [], disabled: [], missing: [], error: [] };

console.log(`Checking ${songs.length} videos...\n`);

await Promise.all(
  songs.map(async (song) => {
    const status = await checkEmbed(song.youtube_id);
    const label = `${song.artist} — ${song.song} (${song.youtube_id})`;

    if (status === 200) {
      results.ok.push(label);
      process.stdout.write(".");
    } else if (status === 401) {
      results.disabled.push(label);
      process.stdout.write("✗");
    } else if (status === 404) {
      results.missing.push(label);
      process.stdout.write("?");
    } else {
      results.error.push(`${label} [${status}]`);
      process.stdout.write("!");
    }
  })
);

console.log("\n");

console.log(`✓ Embeddable (${results.ok.length}):`);
results.ok.forEach((s) => console.log(`  ${s}`));

if (results.disabled.length) {
  console.log(`\n✗ Embedding disabled (${results.disabled.length}):`);
  results.disabled.forEach((s) => console.log(`  ${s}`));
}

if (results.missing.length) {
  console.log(`\n? Video not found (${results.missing.length}):`);
  results.missing.forEach((s) => console.log(`  ${s}`));
}

if (results.error.length) {
  console.log(`\n! Network/other error (${results.error.length}):`);
  results.error.forEach((s) => console.log(`  ${s}`));
}

console.log(
  `\nSummary: ${results.ok.length} ok, ${results.disabled.length} disabled, ${results.missing.length} missing, ${results.error.length} errors`
);
