import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Flame,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import './App.css'

const stories = [
  {
    id: 1,
    source: 'The Pragmatic Engineer',
    title: 'Why the best engineering teams keep their architecture boring',
    summary: 'Good systems are not the ones with the most impressive diagrams. They are the ones that let teams change direction without fear.',
    tag: 'Engineering',
    time: '6 min read',
    accent: 'cyan',
    featured: true,
  },
  {
    id: 2,
    source: 'Martin Fowler',
    title: 'The quiet return of the modular monolith',
    summary: 'Teams are rethinking when a distributed system is truly worth its operational cost.',
    tag: 'Architecture',
    time: '4 min read',
    accent: 'purple',
  },
  {
    id: 3,
    source: 'Stripe Press',
    title: 'Designing APIs that are a pleasure to integrate',
    summary: 'A few small choices can make an interface easier to discover, recover from, and trust.',
    tag: 'Product',
    time: '8 min read',
    accent: 'amber',
  },
  {
    id: 4,
    source: 'Cloudflare Blog',
    title: 'What changed in the browser platform this month',
    summary: 'A practical guide to the platform updates worth knowing before your next release.',
    tag: 'Frontend',
    time: '5 min read',
    accent: 'emerald',
  },
]

const topics = [
  ['AI engineering', 42],
  ['TypeScript', 31],
  ['System design', 26],
  ['Developer tools', 18],
]

function App() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('All stories')
  const [saved, setSaved] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  const tags = ['All stories', ...new Set(stories.map((story) => story.tag))]
  const visibleStories = useMemo(() => stories.filter((story) => {
    const matchesTag = activeTag === 'All stories' || story.tag === activeTag
    const searchText = `${story.title} ${story.summary} ${story.source}`.toLowerCase()
    return matchesTag && searchText.includes(query.toLowerCase())
  }), [activeTag, query])

  const toggleSaved = (id) => {
    setSaved((current) => current.includes(id)
      ? current.filter((storyId) => storyId !== id)
      : [...current, id])
  }

  return (
    <main className="min-h-screen bg-brand-dark text-slate-100">
      <nav className="site-nav">
        <a className="brand" href="#top" aria-label="Software Daily home">
          <span className="brand-mark">S/</span>
          <span>software<span>daily</span></span>
        </a>
        <div className="nav-links">
          <a href="#digest">Today&apos;s digest</a>
          <a href="#topics">Topics</a>
          <a href="#saved">Saved <span className="saved-count">{saved.length}</span></a>
        </div>
        <div className="nav-actions">
          <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
          <button className="menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button className="subscribe-button">Subscribe</button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#digest" onClick={() => setMenuOpen(false)}>Today&apos;s digest</a>
          <a href="#topics" onClick={() => setMenuOpen(false)}>Topics</a>
          <a href="#saved" onClick={() => setMenuOpen(false)}>Saved stories</a>
        </div>
      )}

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> Your daily signal</p>
          <h1>Keep up without<br /><em>keeping up.</em></h1>
          <p className="hero-description">The sharpest software writing, thoughtfully curated into one calm daily read.</p>
          <a className="primary-button" href="#digest">Explore today&apos;s digest <ArrowUpRight size={17} /></a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
          <div className="orbit-card code-card">const <span>signal</span> = clarity;</div>
          <div className="orbit-card pulse-card"><i /> daily briefing<br /><strong>4 stories selected</strong></div>
          <div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" />
        </div>
      </section>

      <section className="digest-section" id="digest">
        <div className="section-heading">
          <div><p className="eyebrow"><Flame size={15} /> Monday, July 20</p><h2>Today&apos;s digest</h2></div>
          <p>Four ideas worth your attention.</p>
        </div>
        <div className="filter-row">
          <div className="tag-filters">{tags.map((tag) => <button key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
        </div>
        <div className="story-grid">
          {visibleStories.map((story) => <article className={`story-card ${story.featured ? 'featured' : ''}`} key={story.id}>
            <div className="story-topline"><span className={`story-dot ${story.accent}`} />{story.source}<button aria-label={`Save ${story.title}`} className={saved.includes(story.id) ? 'is-saved' : ''} onClick={() => toggleSaved(story.id)}><Bookmark size={18} fill={saved.includes(story.id) ? 'currentColor' : 'none'} /></button></div>
            <h3>{story.title}</h3><p>{story.summary}</p>
            <footer><span className="story-tag">{story.tag}</span><span><Clock3 size={14} /> {story.time}</span></footer>
          </article>)}
        </div>
        {visibleStories.length === 0 && <p className="empty-state">No stories match that search yet.</p>}
      </section>

      <section className="topics-section" id="topics">
        <div><p className="eyebrow">The conversation</p><h2>What developers<br />are reading</h2></div>
        <div className="topic-list">{topics.map(([topic, count], index) => <button key={topic} onClick={() => { setActiveTag('All stories'); setQuery(topic) }}><span>0{index + 1}</span><strong>{topic}</strong><small>{count} stories</small><ChevronRight size={18} /></button>)}</div>
      </section>

      <section className="saved-section" id="saved">
        <Bookmark size={19} /><span><strong>{saved.length ? `${saved.length} saved ${saved.length === 1 ? 'story' : 'stories'}` : 'Your reading list is empty'}</strong><br />Save an article to come back to it later.</span>
      </section>
      <footer className="site-footer"><span>© 2026 Software Daily</span><span>Built for curious developers.</span></footer>
    </main>
  )
}

export default App
