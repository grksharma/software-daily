# Software Daily

A focused, responsive daily briefing for software developers. It surfaces a small set of curated stories, lets readers filter and search them, and keeps a lightweight in-browser reading list.

## Run locally

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Layout

```
index.html              Document shell, SEO and Open Graph metadata
src/main.jsx            Entry point; loads fonts then global styles
src/App.jsx             Page composition and the two dialogs
src/data/stories.js     Story content; topics and tags derive from it
src/hooks/              useLocalStorage (persistence), useDialog (a11y)
src/App.css             Layout and component styles
src/index.css           Tailwind layers and base typography
```

## Adding a story

Append to the `stories` array in `src/data/stories.js`. The filter pills, the
topic ranking, and their counts are all derived from the `tag` field, so they
stay in sync automatically — reuse an existing tag rather than inventing a
near-duplicate. `featured: true` adds the "Editor's pick" treatment; `details`
supplies the "Why it matters" bullets in the briefing modal.

## Fonts

Outfit (headings), Inter (body), and Fira Code (mono) are self-hosted via
`@fontsource-variable/*` and imported in `src/main.jsx`. The matching family
names — `Outfit Variable`, `Inter Variable`, `Fira Code Variable` — are what
`tailwind.config.js` references, so keep the two in sync when changing a face.

## Daily updates

The digest updates itself from public engineering feeds. Two jobs run daily and
both publish straight to `main`:

| Job | When | What it does |
| --- | --- | --- |
| `.github/workflows/daily-digest.yml` | 06:17 UTC | Runs `npm run digest`, verifies the build, commits. Runs in the cloud, so it works whether or not your machine is on. |
| Local scheduled task `software-daily-digest` | 12:23 local | Reads each newly ingested article and writes the real summary and "Why it matters" bullets, then commits. Only runs while the app is open. |

The split is deliberate: the Action does the mechanical, deterministic part
(fetch, validate, dedupe) with no API key. The local pass does the part that
needs judgment. A story ingested by the Action shows a feed-derived summary and
no bullets until the editorial pass reaches it — the briefing modal renders
without the "Why it matters" section rather than showing an empty heading.

```bash
npm run digest:dry   # see what would be added, change nothing
npm run digest       # fetch and write
npm test             # ingest guardrails
```

### Sources

Configured in `SOURCES` at the top of `scripts/fetch-digest.mjs`. The set is a
curated slice of the [engineering-blogs](https://github.com/kilimchoi/engineering-blogs)
list — currently GitHub, Vercel, Netflix, Cloudflare, Dropbox, Lyft, Slack,
Spotify, and Mozilla Hacks. That list has 400+ feeds, so candidates were verified
live, current, and genuinely engineering-focused before being added; dead feeds,
business/marketing blogs (Stripe's general feed), and patch-note feeds (Discord)
were left out.

Each source declares a `host`; entries linking anywhere else are dropped. Every
source lives on its own domain, which keeps that check strong — feeds on a shared
host (`medium.com/…`) were excluded for that reason. `sections` is optional: when
present it narrows a mixed feed by the first path segment (Vercel's feed is ~6:1
changelog-to-blog, so `sections: ['blog']` keeps out release notes and promos);
when absent, the blog lives at its host root and any top-level slug is accepted
(`netflixtechblog.com/<slug>`).

### Guardrails

The job ingests untrusted third-party content and publishes it without review,
so `scripts/fetch-digest.test.mjs` asserts that it cannot be abused. Content is
data, never instructions. Entry URLs must resolve to an allowlisted host over
https — lookalike domains (`github.blog.attacker.net`) and `javascript:`/`data:`
schemes are rejected. Markup is stripped rather than
escaped, control characters and bidi overrides are removed, fields are
length-capped, and output goes through `JSON.stringify` so nothing can break out
of the data file. A run that fails the tests, lint, or build commits nothing.

## Notes

- The reading list and subscribe state persist to `localStorage` under the
  `software-daily:*` keys. There is no backend: subscribing stores the address
  in the browser only, and the dialog says so.
- `index.html` has a TODO for the canonical URL, `og:url`, and `og:image`. All
  three need the real production origin (an `og:image` must be an absolute URL),
  so they are deliberately left unset. The share-card artwork is ready at
  `public/og-image.svg`; export it to `public/og-image.png` (1200x630) before
  wiring `og:image`, since most scrapers reject SVG.
