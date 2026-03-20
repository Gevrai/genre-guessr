# Song Entry Rules

Guidelines for adding new entries to `src/data/songs.json`.

## Required Fields

| Field | Type | Description |
|---|---|---|
| `artist` | string | Artist or band name |
| `song` | string | Track title |
| `album` | string \| null | Album name, or `null` for standalone singles |
| `release_year` | number | Year the track was released |
| `locale` | string | Country of origin (e.g. `"UK"`, `"Nigeria"`, `"Japan"`) |
| `hint` | string | One sentence of biographical/sonic context — no genre names |
| `answer` | string | The single correct genre label |
| `options` | string[] | Exactly 4 options including the answer |
| `explanation` | string | Educational breakdown of why the answer is correct |
| `tags` | string[] | 2–5 lowercase genre/style keywords |
| `youtube_id` | string | YouTube video ID (the part after `?v=`) |

## Strict Rules

### Answer must be a single genre
- **Never use `/` to combine two genres** (e.g. ~~`"Jazz rap / conscious hip-hop"`~~)
- Pick the most precise, established label for the track
- If a secondary label is relevant, mention it in the `explanation` field
- Good: `"Jazz rap"` — Bad: `"Jazz rap / conscious hip-hop"`

### Options must be plausible distractors
- All 4 options should look reasonable to a non-expert
- Distractors should be genres the track could plausibly be confused with, not random genres
- No option should contain `/` — each option is one genre label
- The correct answer must appear exactly once in the options array

### Options must be visually consistent
- Avoid making the correct answer visually distinctive (e.g. longer, has parentheses, uses dashes)
- If the answer uses a parenthetical like `"IDM"` or `"Qawwali"`, keep distractors similarly concise
- All options should use similar capitalisation and formatting

### Hint must not reveal the answer
- Do not name the genre in the hint
- Focus on: geography, era, instruments, sonic textures, cultural context, artist biography
- Good: `"Belfast duo, widely considered a modern peak of a specific British electronic tradition"`
- Bad: `"Acid house track with TB-303 from Belfast duo Bicep"`

### Explanation must be educational
- Start with the correct genre and why this track fits it
- Address each distractor and explain why it's wrong
- Mention any secondary genre labels the track is also known by
- Keep it factual and positive — these explanations are shown to players after answering
- Make it fun and informative, not dry or pedantic. Every genre is good!

### Genre specificity
- Prefer the most specific accurate label over a broad umbrella term
- E.g. `"Blackgaze"` over `"Metal"`, `"Mbalax"` over `"African pop"`
- But don't invent micro-genres — use established terms that a curious listener could look up

### Diversity targets
- Aim for broad coverage across: geography, decade (1950s–2020s), and genre family
- Avoid duplicating artists already in the file
- Avoid two consecutive entries from the same country or broad genre family

## Example Entry

```json
{
  "artist": "Bicep",
  "song": "Glue",
  "album": "Bicep",
  "release_year": 2017,
  "locale": "UK",
  "hint": "Belfast duo, widely considered a modern peak of a specific British electronic tradition",
  "answer": "Acid house",
  "options": ["Deep house", "Acid house", "UK garage", "Electro"],
  "explanation": "Acid house — Glue is built around that signature Roland TB-303 bassline squelch that defines acid house. Deep house is warmer and more chord-based. UK garage has a shuffled 2-step rhythm. Bicep are deep lovers of the original late-80s acid house era and this track is a direct tribute to it.",
  "tags": ["electronic", "house", "acid house", "dance"],
  "youtube_id": "A7ZxRs45tTg"
}
```

## Validating Embeds

Run the embed checker before committing new songs:

```bash
node scripts/check-embeds.mjs
```

This checks every `youtube_id` against YouTube's oEmbed endpoint (no API key needed) and reports which are embeddable, which have embedding disabled, and which are 404 (removed/region-blocked). All entries should show `✓ Embeddable` before merging.

## Common Mistakes to Avoid

- Slash-combined answers: `"Neo-flamenco / flamenco-pop"` → use `"Neo-flamenco"` and mention flamenco-pop in the explanation
- Hint gives away genre: `"Brazilian samba-soul artist"` → remove genre words from the hint
- Distractors too easy: including `"Country"` as a distractor for a jazz track — pick genres that are genuinely adjacent
- Answer looks unique among options: if 3 options are one word and the answer is a hyphenated compound, rewrite one of the distractors to match the format
- YouTube ID includes full URL: use only the ID string, not `https://youtube.com/watch?v=...`
