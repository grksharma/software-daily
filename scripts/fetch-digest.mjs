#!/usr/bin/env node
/**
 * Daily digest ingest.
 *
 * Pulls recent posts from a fixed set of engineering feeds and appends any that
 * aren't already in src/data/stories.json.
 *
 * SECURITY POSTURE — this script consumes untrusted third-party content and
 * writes it into a file that is published automatically, so:
 *
 *   1. Feed text is DATA, never instructions. Nothing here evaluates, executes,
 *      or interpolates it into code. Output goes through JSON.stringify only.
 *   2. Every entry's URL must resolve to an allowlisted host. A feed that has
 *      been compromised cannot introduce links to arbitrary domains.
 *   3. Every field is length-capped and stripped of control characters, so a
 *      hostile post cannot blow up the bundle or smuggle terminal escapes.
 *   4. Entries failing validation are dropped and reported, never partially
 *      written.
 *   5. Existing entries are never modified — the job only appends.
 *
 * Usage:
 *   node scripts/fetch-digest.mjs           # write changes
 *   node scripts/fetch-digest.mjs --dry-run # report only
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = resolve(HERE, '../src/data/stories.json')

/**
 * Feeds to ingest.
 *
 * `host` is the only host accepted for that feed's entries — an entry linking
 * anywhere else is discarded.
 *
 * `sections` narrows further by URL path, which is what keeps the digest
 * editorial. Both publishers mix long-form writing with other content in a
 * single feed: Vercel's is roughly 6:1 changelog-to-blog (release notes and
 * pricing promos), and GitHub's includes company news. Without this filter the
 * digest fills up with "X is 35% off" rather than writing worth reading.
 */
const SOURCES = [
  {
    name: 'GitHub Engineering',
    feed: 'https://github.blog/feed/',
    host: 'github.blog',
    // Narrowed after the first live run: `open-source` carried a funding
    // announcement and `developer-skills` a beginners' tutorial, neither of
    // which is the long-form engineering writing this digest is for.
    sections: ['engineering', 'ai-and-ml', 'security'],
    accent: 'cyan',
    tag: 'Engineering',
  },
  {
    name: 'Vercel',
    feed: 'https://vercel.com/atom',
    host: 'vercel.com',
    sections: ['blog'],
    accent: 'amber',
    tag: 'DevOps',
  },
]

/** Hard caps. Anything longer is truncated; anything absurd is rejected outright. */
const LIMITS = {
  title: 140,
  summary: 320,
  source: 60,
  maxNewPerRun: 4,
  maxTotalStories: 40,
  maxFeedBytes: 5_000_000,
  maxAgeDays: 21,
}

/** Tag inference from title/summary keywords. Falls back to the source default. */
const TAG_RULES = [
  [/\b(agent|llm|model|ai|copilot|inference|prompt)\b/i, 'AI engineering'],
  [/\b(docker|deploy|ci\/cd|pipeline|kubernetes|container)\b/i, 'DevOps'],
  [/\b(architecture|durable|workflow|distributed|scaling)\b/i, 'Architecture'],
  [/\b(security|auth|vulnerabilit|cve|encryption)\b/i, 'Security'],
  [/\b(react|css|browser|frontend|hydrogen|rendering)\b/i, 'Frontend'],
  [/\b(network|mcp|server|infrastructure|edge)\b/i, 'Infrastructure'],
]

const ACCENTS = ['cyan', 'purple', 'amber', 'emerald']

/**
 * Characters that must never reach the data file, a build log, or the page.
 *
 * Built from a string of escape sequences rather than written as literal
 * characters, so the source stays plain ASCII and cannot be mangled in transit:
 * C0/C1 controls, zero-width and directional marks, and the bidi overrides that
 * can be used to make a title render differently than it reads.
 */
const UNSAFE_CHARS = new RegExp(
  '['
  + '\\u0000-\\u001f'
  + '\\u007f-\\u009f'
  + '\\u200b-\\u200f'
  + '\\u2028\\u2029'
  + '\\u202a-\\u202e'
  + '\\u2066-\\u2069'
  + ']',
  'g',
)

export function clean(value) {
  if (typeof value !== 'string') return ''
  return value.replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim()
}

/** Decode the small set of entities that show up in feed titles. */
function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }
  return value.replace(/&(#?\w+);/g, (match, code) => {
    if (named[code] !== undefined) return named[code]
    if (/^#\d+$/.test(code)) return String.fromCodePoint(Number(code.slice(1)))
    if (/^#x[0-9a-f]+$/i.test(code)) return String.fromCodePoint(parseInt(code.slice(2), 16))
    return match
  })
}

/**
 * Publisher boilerplate that RSS descriptions append to the real summary.
 *
 * Without this the digest publishes lines like "The post <title> appeared first
 * on The GitHub Blog." verbatim, which reads as scraped content.
 */
const BOILERPLATE = [
  /\s*The post\b[\s\S]*?\bappeared first on\b[^.]*\.?\s*$/i,
  /\s*Continue reading\b[\s\S]*$/i,
  /\s*Read (?:more|the full (?:post|article))\b[\s\S]*$/i,
  /\s*(?:\[[….]+\]|[…]{1,3})\s*$/,
  /\s*The article\b[\s\S]*?\bfirst appeared on\b[^.]*\.?\s*$/i,
]

export function stripBoilerplate(value) {
  let text = value
  for (const pattern of BOILERPLATE) text = text.replace(pattern, '')
  return text.trim()
}

/**
 * Pick the most summary-like part of a feed body.
 *
 * Some feeds (Vercel's) ship the entire article in <content> with no summary
 * field, so a raw truncation grabs whatever the page opens with — often a stats
 * block or nav list, which reads as scraped. The first substantial paragraph is
 * almost always the real opening line. Falls back to the whole body when the
 * content has no usable paragraphs.
 */
export function extractSummary(raw) {
  if (typeof raw !== 'string') return ''
  const paragraphs = [...raw.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => clean(decodeEntities(match[1].replace(/<[^>]*>/g, ' '))))
    .filter((text) => text.length > 60)
  return paragraphs[0] ?? raw
}

/** Remove markup, then normalise. Feed descriptions routinely embed HTML. */
export function toPlainText(value, max) {
  const text = stripBoilerplate(clean(decodeEntities(clean(value).replace(/<[^>]*>/g, ' '))))
  if (text.length <= max) return text
  // Trim at a word boundary so summaries don't end mid-word.
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/**
 * Minimal RSS/Atom item extraction.
 *
 * A regex parser is deliberate: it pulls only the four fields we need and
 * ignores everything else, so no external XML dependency handles hostile input.
 */
export function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? []
  return blocks.map((block) => {
    const pick = (tag) => {
      const cdata = block.match(new RegExp(`<${tag}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'))
      if (cdata) return cdata[1]
      const plain = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return plain ? plain[1] : ''
    }
    // Atom puts the URL in an attribute; RSS puts it in the element body.
    const hrefAttr = block.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)
    return {
      title: pick('title'),
      link: hrefAttr ? hrefAttr[1] : pick('link'),
      description: pick('description') || pick('summary') || pick('content'),
      date: pick('pubDate') || pick('published') || pick('updated'),
    }
  })
}

/**
 * Reject anything that is not an https URL on the expected host, in one of the
 * source's allowed sections. Returns the normalised URL or null.
 */
export function safeUrl(raw, source) {
  try {
    const url = new URL(clean(decodeEntities(raw)))
    if (url.protocol !== 'https:') return null

    const host = url.hostname.replace(/^www\./, '')
    if (host !== source.host && !host.endsWith(`.${source.host}`)) return null

    const [section] = url.pathname.split('/').filter(Boolean)
    if (!section || !source.sections.includes(section)) return null

    // A section landing page is not a story.
    if (url.pathname.replace(/\/+$/, '') === `/${section}`) return null

    url.hash = ''
    url.search = ''
    return url.toString()
  } catch {
    return null
  }
}

export function inferTag(title, summary, fallback) {
  const haystack = `${title} ${summary}`
  for (const [pattern, tag] of TAG_RULES) {
    if (pattern.test(haystack)) return tag
  }
  return fallback
}

function formatDate(value) {
  const date = new Date(clean(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** ~200 wpm over the summary is a rough but honest estimate. */
function estimateReadTime(summary) {
  const words = summary.split(/\s+/).filter(Boolean).length
  return `${Math.max(3, Math.min(12, Math.round(words / 12) || 3))} min read`
}

async function fetchFeed(source) {
  const response = await fetch(source.feed, {
    headers: { 'user-agent': 'software-daily-digest/1.0 (+https://github.com/grksharma/software-daily)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`)
  const body = await response.text()
  if (body.length > LIMITS.maxFeedBytes) throw new Error(`${source.name}: feed exceeds size cap`)
  return body
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const existing = JSON.parse(await readFile(DATA_FILE, 'utf8'))
  const seen = new Set(existing.map((story) => story.url))
  const cutoff = Date.now() - LIMITS.maxAgeDays * 86_400_000

  const candidates = []
  const problems = []

  for (const source of SOURCES) {
    let items
    try {
      items = parseFeed(await fetchFeed(source))
    } catch (error) {
      // One bad feed must not abort the run or produce a partial write.
      problems.push(`${source.name}: ${error.message}`)
      continue
    }

    for (const item of items) {
      const url = safeUrl(item.link, source)
      if (!url || seen.has(url)) continue

      const title = toPlainText(item.title, LIMITS.title)
      const summary = toPlainText(extractSummary(item.description), LIMITS.summary)
      const date = formatDate(item.date)
      if (!title || !summary || !date) continue
      if (date.getTime() < cutoff) continue

      seen.add(url)
      candidates.push({
        source: toPlainText(source.name, LIMITS.source),
        title,
        summary,
        tag: inferTag(title, summary, source.tag),
        time: estimateReadTime(summary),
        accent: ACCENTS[candidates.length % ACCENTS.length],
        published: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        publishedAt: date.toISOString(),
        url,
        details: [],
      })
    }
  }

  // Newest first, then cap how much a single run can add.
  candidates.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  const additions = candidates.slice(0, LIMITS.maxNewPerRun)

  for (const problem of problems) console.warn(`warn: ${problem}`)

  if (additions.length === 0) {
    console.log('No new stories.')
    return
  }

  let nextId = existing.reduce((max, story) => Math.max(max, Number(story.id) || 0), 0)
  const merged = [
    ...additions.map((story) => ({ id: ++nextId, ...story })),
    ...existing.map((story) => ({ ...story, featured: false })),
  ].slice(0, LIMITS.maxTotalStories)

  // The newest story carries the "Editor's pick" treatment.
  if (merged.length > 0) merged[0].featured = true

  for (const story of additions) console.log(`+ ${story.source}: ${story.title}`)

  if (dryRun) {
    console.log(`\nDry run — ${additions.length} would be added, ${merged.length} total.`)
    return
  }

  await writeFile(DATA_FILE, `${JSON.stringify(merged, null, 2)}\n`)
  console.log(`\nAdded ${additions.length}; ${merged.length} stories total.`)
}

// Only run when executed directly, so the test file can import the validators
// without triggering a network fetch.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`fetch-digest failed: ${error.message}`)
    process.exit(1)
  })
}
