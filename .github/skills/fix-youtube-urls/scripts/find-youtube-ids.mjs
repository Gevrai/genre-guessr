#!/usr/bin/env node
/**
 * YouTube ID finder/fixer for songs.json
 *
 * Usage:
 *   node scripts/find-youtube-ids.mjs                  # auto-fix all broken embeds in songs.json
 *   node scripts/find-youtube-ids.mjs "Artist - Song"  # look up one or more songs by name
 *   node scripts/find-youtube-ids.mjs --query "..."    # run a raw YouTube search query
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SONGS_PATH = join(__dir, "../src/data/songs.json");

// ── YouTube helpers ────────────────────────────────────────────────────────────

async function searchYouTube(query) {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        query,
        context: { client: { clientName: "WEB", clientVersion: "2.20231101.00.00" } },
      }),
    });
    const text = await res.text();
    const match = text.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function checkEmbed(id) {
  if (!id) return 0;
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  );
  return res.status;
}

async function findAndValidate(query, label) {
  const id = await searchYouTube(query);
  const status = await checkEmbed(id);
  const ok = status === 200 ? "✓" : status === 401 ? "✗ embed disabled" : `✗ ${status}`;
  return { id, status, ok, label };
}

// ── Mode: auto-fix songs.json ──────────────────────────────────────────────────

async function autoFix() {
  const songs = JSON.parse(readFileSync(SONGS_PATH, "utf8"));

  // 1. Find broken IDs concurrently
  console.log(`Checking ${songs.length} videos for broken embeds…\n`);
  const statuses = await Promise.all(
    songs.map(async (song) => {
      const status = await checkEmbed(song.youtube_id);
      process.stdout.write(status !== 200 ? "✗" : ".");
      return { song, status };
    })
  );
  console.log(`\n`);

  const broken = statuses.filter(({ status }) => status !== 200).map(({ song }) => song);

  if (broken.length === 0) {
    console.log("All embeds are working. Nothing to fix.");
    return;
  }

  console.log(`Found ${broken.length} broken embed(s). Searching for replacements…\n`);

  // 2. Search for replacements concurrently
  const fixes = {};
  await Promise.all(
    broken.map(async (song) => {
      const query = `${song.artist} ${song.song} official`;
      const { id, ok } = await findAndValidate(query, `${song.artist} — ${song.song}`);
      console.log(`${ok}  ${song.artist} — ${song.song}: ${id ?? "NOT FOUND"}`);
      if (id) fixes[song.youtube_id] = id;
    })
  );

  // 3. Apply fixes
  const fixCount = Object.keys(fixes).length;
  if (fixCount === 0) {
    console.log("\nNo replacements found.");
    return;
  }

  let json = readFileSync(SONGS_PATH, "utf8");
  for (const [old, next] of Object.entries(fixes)) {
    json = json.replaceAll(old, next);
  }
  writeFileSync(SONGS_PATH, json);
  console.log(`\nUpdated ${fixCount}/${broken.length} video ID(s) in songs.json.`);
}

// ── Mode: look up specific songs by "Artist - Song" ───────────────────────────

async function lookupSongs(args) {
  await Promise.all(
    args.map(async (arg) => {
      // Accept "Artist - Song" or "Artist — Song"
      const query = `${arg} official`;
      const { id, ok } = await findAndValidate(query, arg);
      console.log(`${ok}  ${arg}: ${id ?? "NOT FOUND"}`);
      if (id) console.log(`     https://www.youtube.com/watch?v=${id}`);
    })
  );
}

// ── Mode: raw query ────────────────────────────────────────────────────────────

async function rawQuery(query) {
  const { id, ok } = await findAndValidate(query, query);
  console.log(`${ok}  ${query}: ${id ?? "NOT FOUND"}`);
  if (id) console.log(`     https://www.youtube.com/watch?v=${id}`);
}

// ── Entry point ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0) {
  await autoFix();
} else if (args[0] === "--query" || args[0] === "-q") {
  const query = args.slice(1).join(" ");
  if (!query) { console.error("Provide a query after --query"); process.exit(1); }
  await rawQuery(query);
} else {
  await lookupSongs(args);
}
