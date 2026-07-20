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
  { id: 1, source: 'GitHub Engineering', title: 'The cost of saying yes has changed', summary: 'AI lowers the cost of producing a first patch, but review and long-term ownership still determine whether a change is actually cheap.', tag: 'Engineering', time: '6 min read', accent: 'cyan', featured: true, published: 'Jul 17, 2026', url: 'https://github.blog/engineering/the-cost-of-saying-yes-has-changed/' },
  { id: 2, source: 'GitHub Engineering', title: 'Better tools made Copilot code review worse. Here’s how GitHub improved it.', summary: 'A look at reshaping agent workflows around pull-request evidence and shared Unix-style code exploration.', tag: 'AI engineering', time: '7 min read', accent: 'purple', published: 'Jul 10, 2026', url: 'https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/' },
  { id: 3, source: 'Vercel', title: 'Run any Dockerfile on Vercel', summary: 'Vercel now supports running any HTTP server straight from a Dockerfile, including Rails, Django, Spring Boot, and Go.', tag: 'DevOps', time: '5 min read', accent: 'amber', published: 'Jun 30, 2026', url: 'https://vercel.com/blog/dockerfile-on-vercel' },
  { id: 4, source: 'OpenAI Developers', title: 'Making private MCP servers reachable without making them public', summary: 'How private network boundaries can be preserved while supporting MCP streaming, authentication, and an inspectable client.', tag: 'Infrastructure', time: '9 min read', accent: 'emerald', published: 'Jun 26, 2026', url: 'https://developers.openai.com/blog/connect-private-mcp-servers-to-openai-products' },
  { id: 5, source: 'Vercel', title: 'Build realtime voice agents on AI Gateway', summary: 'An overview of connecting real-time voice applications to model providers through a unified gateway.', tag: 'AI engineering', time: '6 min read', accent: 'cyan', published: 'Jun 29, 2026', url: 'https://vercel.com/blog/realtime-voice-agents-on-ai-gateway' },
  { id: 6, source: 'Vercel', title: 'A new programming model for durable execution', summary: 'Vercel Workflows provides a way to build long-running, reliable, observable agents and backends in application code.', tag: 'Architecture', time: '9 min read', accent: 'purple', published: 'Apr 16, 2026', url: 'https://vercel.com/blog/a-new-programming-model-for-durable-execution' },
]

const topics = [
  ['AI engineering', 2],
  ['Engineering', 1],
  ['Architecture', 1],
  ['Infrastructure', 1],
]

function App() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('All stories')
  const [saved, setSaved] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  const tags = ['All stories', ...new Set(stories.map((story) => story.tag))]
  const visibleStories = useMemo(() => stories.filter((story) => {
    const matchesTag = activeTag === 'All stories' || story.tag === activeTag
    const searchText = `${story.title} ${story.summary} ${story.source} ${story.tag}`.toLowerCase()
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
          <div className="orbit-card pulse-card"><i /> daily briefing<br /><strong>{stories.length} stories selected</strong></div>
          <div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" />
        </div>
      </section>

      <section className="digest-section" id="digest">
        <div className="section-heading">
          <div><p className="eyebrow"><Flame size={15} /> Freshly researched</p><h2>Today&apos;s digest</h2></div>
          <p>Six ideas worth your attention.</p>
        </div>
        <div className="filter-row">
          <div className="tag-filters">{tags.map((tag) => <button key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
        </div>
        <div className="story-grid">
          {visibleStories.map((story) => <article className={`story-card ${story.featured ? 'featured' : ''}`} key={story.id}>
            <div className="story-topline"><span className={`story-dot ${story.accent}`} />{story.source}<button aria-label={`Save ${story.title}`} className={saved.includes(story.id) ? 'is-saved' : ''} onClick={() => toggleSaved(story.id)}><Bookmark size={18} fill={saved.includes(story.id) ? 'currentColor' : 'none'} /></button></div>
            <h3><a href={story.url} target="_blank" rel="noreferrer">{story.title}<ArrowUpRight size={14} /></a></h3><p>{story.summary}</p>
            <footer><span className="story-tag">{story.tag} · {story.published}</span><span><Clock3 size={14} /> {story.time}</span></footer>
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
