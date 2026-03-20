Find and fix broken YouTube embed IDs in songs.json.

Arguments: $ARGUMENTS

## Behaviour based on arguments

**No arguments** — scan all entries in `src/data/songs.json`, detect broken embeds, find working replacements via YouTube search, and apply them automatically:
```
node scripts/find-youtube-ids.mjs
```

**One or more `"Artist - Song"` strings** — look up YouTube IDs for those specific songs without touching songs.json (useful when adding new entries):
```
node scripts/find-youtube-ids.mjs "Burial - Archangel" "Arca - Nonbinary"
```

**`--query <search terms>`** — run a raw YouTube search and return the top embeddable result (useful when the artist/song name is ambiguous):
```
node scripts/find-youtube-ids.mjs --query "fela kuti zombie live 1977"
```

## Instructions

Parse $ARGUMENTS to determine the mode:
- Empty → run auto-fix (no args)
- Looks like `"Artist - Song"` entries → pass each as a separate quoted argument
- Starts with `--query` or `-q` → pass through as-is

Run the appropriate command with the Bash tool, show the output to the user, and if songs.json was modified confirm how many IDs were updated.
