import storyData from './stories.json'

/**
 * Story data for the daily digest.
 *
 * The content itself lives in `stories.json` because the daily ingest job
 * (scripts/fetch-digest.mjs) writes to it. Keeping it as JSON means the job
 * serialises with JSON.stringify and can never inject executable code into the
 * bundle — which matters, since entries originate from third-party feeds.
 *
 * Editorial fields (`summary`, `details`, `featured`) are safe to hand-edit;
 * the job only appends new entries and never rewrites existing ones.
 */
export const stories = storyData

/**
 * Topics ranked by how many stories carry each tag.
 *
 * Derived from `stories` so the counts can never drift out of sync with the
 * digest — previously this was a hand-maintained list and had gone stale.
 */
export const topics = Object.entries(
  stories.reduce((counts, story) => {
    counts[story.tag] = (counts[story.tag] ?? 0) + 1
    return counts
  }, {}),
)
  .sort(([aTag, aCount], [bTag, bCount]) => bCount - aCount || aTag.localeCompare(bTag))
  .slice(0, 5)

/** Every tag present in the digest, prefixed with the "show everything" option. */
export const ALL_STORIES = 'All stories'
export const tags = [ALL_STORIES, ...new Set(stories.map((story) => story.tag))]
