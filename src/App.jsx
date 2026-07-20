import { useCallback, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flame,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { ALL_STORIES, stories, tags, topics } from './data/stories.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useDialog } from './hooks/useDialog.js'
import './App.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function BriefingDialog({ story, onClose }) {
  const dialogRef = useDialog(Boolean(story), onClose)
  if (!story) return null

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <article
        className="briefing-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-briefing" onClick={onClose} aria-label="Close briefing"><X size={19} /></button>
        <p className="eyebrow"><span className={`story-dot ${story.accent}`} /> {story.source} · {story.published}</p>
        <h2 id="briefing-title">{story.title}</h2>
        <p className="briefing-summary">{story.summary}</p>
        {/*
          Freshly ingested stories arrive without editorial bullets — the daily
          job appends them and the follow-up pass writes these. Render the
          section only once it has content rather than an empty heading.
        */}
        {story.details?.length > 0 && (
          <>
            <h3>Why it matters</h3>
            <ul>{story.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          </>
        )}
        <a className="source-link" href={story.url} target="_blank" rel="noreferrer">
          Read the original source <ExternalLink size={16} />
        </a>
      </article>
    </div>
  )
}

function SubscribeDialog({ open, onClose, onSubscribe, subscriber }) {
  const dialogRef = useDialog(open, onClose, '#subscribe-email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    onSubscribe(trimmed)
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="subscribe-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-briefing" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>

        {subscriber ? (
          <div className="subscribe-done">
            <span className="subscribe-check" aria-hidden="true"><Check size={22} /></span>
            <h2 id="subscribe-title">You&apos;re on the list</h2>
            <p>We&apos;ll send the digest to <strong>{subscriber}</strong> each weekday morning.</p>
            <button className="primary-button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="eyebrow"><Sparkles size={15} /> Daily digest</p>
            <h2 id="subscribe-title">One calm email each morning</h2>
            <p className="briefing-summary">
              The day&apos;s most worthwhile software writing, summarised so you can skim it in two minutes.
            </p>
            <form className="subscribe-form" onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="subscribe-email">Email address</label>
              <input
                id="subscribe-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError('') }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'subscribe-error' : undefined}
              />
              {error && <p className="field-error" id="subscribe-error" role="alert">{error}</p>}
              <button className="primary-button" type="submit">Subscribe</button>
              <p className="field-note">
                Saved in this browser only — no address ever leaves your device.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState(ALL_STORIES)
  const [saved, setSaved] = useLocalStorage('software-daily:saved', [])
  const [subscriber, setSubscriber] = useLocalStorage('software-daily:subscriber', '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  const visibleStories = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return stories.filter((story) => {
      const matchesTag = activeTag === ALL_STORIES || story.tag === activeTag
      const haystack = `${story.title} ${story.summary} ${story.source} ${story.tag}`.toLowerCase()
      return matchesTag && haystack.includes(needle)
    })
  }, [activeTag, query])

  // Preserve the order stories were saved in rather than the digest order.
  const savedStories = useMemo(
    () => saved.map((id) => stories.find((story) => story.id === id)).filter(Boolean),
    [saved],
  )

  const toggleSaved = (id) => {
    setSaved((current) => current.includes(id)
      ? current.filter((storyId) => storyId !== id)
      : [...current, id])
  }

  const closeBriefing = useCallback(() => setSelectedStory(null), [])
  const closeSubscribe = useCallback(() => setSubscribeOpen(false), [])

  const showTopic = (topic) => {
    setActiveTag(topic)
    setQuery('')
    document.getElementById('digest')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <a className="skip-link" href="#digest">Skip to today&apos;s digest</a>

      <nav className="site-nav" aria-label="Primary">
        <a className="brand" href="#top" aria-label="Software Daily home">
          <span className="brand-mark" aria-hidden="true">S/</span>
          <span>software<span>daily</span></span>
        </a>
        <div className="nav-links">
          <a href="#digest">Today&apos;s digest</a>
          <a href="#topics">Topics</a>
          <a href="#saved">Saved <span className="saved-count">{saved.length}</span></a>
        </div>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label={subscriber ? 'Digest subscription settings' : 'Subscribe to the daily digest'}
            onClick={() => setSubscribeOpen(true)}
          >
            <Bell size={18} />
            {subscriber && <span className="bell-dot" aria-hidden="true" />}
          </button>
          <button
            className="menu-button"
            aria-label="Navigation"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button className="subscribe-button" onClick={() => setSubscribeOpen(true)}>
            {subscriber ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <a href="#digest" onClick={() => setMenuOpen(false)}>Today&apos;s digest</a>
          <a href="#topics" onClick={() => setMenuOpen(false)}>Topics</a>
          <a href="#saved" onClick={() => setMenuOpen(false)}>Saved stories</a>
        </div>
      )}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} /> Your daily signal</p>
            <h1>Keep up without<br /><em>keeping up.</em></h1>
            <p className="hero-description">The sharpest software writing, thoughtfully curated into one calm daily read.</p>
            <a className="primary-button" href="#digest">Explore today&apos;s digest <ArrowUpRight size={17} /></a>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className="orbit-card code-card">const <span>signal</span> = clarity;</div>
            <div className="orbit-card pulse-card"><i /> daily briefing<br /><strong>{stories.length} stories selected</strong></div>
            <div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" />
          </div>
        </section>

        <section className="digest-section" id="digest" aria-labelledby="digest-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Flame size={15} /> Freshly researched</p>
              <h2 id="digest-title">Today&apos;s digest</h2>
            </div>
            <p>{stories.length} ideas worth your attention.</p>
          </div>

          <div className="filter-row">
            <div className="tag-filters" role="group" aria-label="Filter stories by topic">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={activeTag === tag ? 'active' : ''}
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <label className="search-box" htmlFor="story-search">
              <Search size={16} aria-hidden="true" />
              <span className="visually-hidden">Search stories</span>
              <input
                id="story-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories"
              />
            </label>
          </div>

          <p className="visually-hidden" role="status">
            {visibleStories.length} {visibleStories.length === 1 ? 'story' : 'stories'} shown
          </p>

          <div className="story-grid">
            {visibleStories.map((story) => {
              const isSaved = saved.includes(story.id)
              return (
                <article className={`story-card ${story.featured ? 'featured' : ''}`} key={story.id}>
                  <div className="story-topline">
                    <span className={`story-dot ${story.accent}`} aria-hidden="true" />
                    {story.source}
                    <button
                      aria-label={isSaved ? `Remove ${story.title} from your reading list` : `Save ${story.title} to your reading list`}
                      aria-pressed={isSaved}
                      className={isSaved ? 'is-saved' : ''}
                      onClick={() => toggleSaved(story.id)}
                    >
                      <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <h3>
                    <button onClick={() => setSelectedStory(story)}>
                      {story.title}<ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  </h3>
                  <p>{story.summary}</p>
                  <footer>
                    <span className="story-tag">{story.tag} · {story.published}</span>
                    <span><Clock3 size={14} aria-hidden="true" /> {story.time}</span>
                  </footer>
                </article>
              )
            })}
          </div>

          {visibleStories.length === 0 && (
            <p className="empty-state">
              No stories match that search yet.
              <button className="link-button" onClick={() => { setQuery(''); setActiveTag(ALL_STORIES) }}>
                Clear filters
              </button>
            </p>
          )}
        </section>

        <section className="topics-section" id="topics" aria-labelledby="topics-title">
          <div>
            <p className="eyebrow">The conversation</p>
            <h2 id="topics-title">What developers<br />are reading</h2>
          </div>
          <div className="topic-list">
            {topics.map(([topic, count], index) => (
              <button key={topic} onClick={() => showTopic(topic)}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <strong>{topic}</strong>
                <small>{count} {count === 1 ? 'story' : 'stories'}</small>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="saved-section" id="saved" aria-labelledby="saved-title">
          <div className="saved-heading">
            <Bookmark size={19} aria-hidden="true" />
            <h2 id="saved-title">
              {savedStories.length
                ? `${savedStories.length} saved ${savedStories.length === 1 ? 'story' : 'stories'}`
                : 'Your reading list is empty'}
            </h2>
          </div>

          {savedStories.length === 0 ? (
            <p className="saved-empty">Save an article with the bookmark icon to come back to it later.</p>
          ) : (
            <ul className="saved-list">
              {savedStories.map((story) => (
                <li key={story.id}>
                  <button className="saved-open" onClick={() => setSelectedStory(story)}>
                    <span className={`story-dot ${story.accent}`} aria-hidden="true" />
                    <span className="saved-title">{story.title}</span>
                    <small>{story.source} · {story.time}</small>
                  </button>
                  <button
                    className="saved-remove"
                    aria-label={`Remove ${story.title} from your reading list`}
                    onClick={() => toggleSaved(story.id)}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BriefingDialog story={selectedStory} onClose={closeBriefing} />
      <SubscribeDialog
        open={subscribeOpen}
        onClose={closeSubscribe}
        onSubscribe={setSubscriber}
        subscriber={subscriber}
      />

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Software Daily</span>
        <span>Built for curious developers.</span>
      </footer>
    </>
  )
}

export default App
