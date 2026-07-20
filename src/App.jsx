import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flame,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import './App.css'

const stories = [
  { id: 1, source: 'GitHub Engineering', title: 'The cost of saying yes has changed', summary: 'AI lowers the cost of producing a first patch, but review and long-term ownership still determine whether a change is actually cheap.', tag: 'Engineering', time: '6 min read', accent: 'cyan', featured: true, published: 'Jul 17, 2026', url: 'https://github.blog/engineering/the-cost-of-saying-yes-has-changed/', details: ['Treat an agent-produced patch as a price check, not the finished product.', 'Reviewability and ownership—not initial implementation time—remain the real engineering cost.', 'Constrain small experiments to make scope discussions evidence-led.'] },
  { id: 2, source: 'GitHub Engineering', title: 'Better tools made Copilot code review worse', summary: 'GitHub describes reshaping agent workflows around pull-request evidence and shared Unix-style code exploration.', tag: 'AI engineering', time: '7 min read', accent: 'purple', published: 'Jul 10, 2026', url: 'https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/', details: ['Giving agents more tools can increase review cost if the evidence they produce is unclear.', 'Shared, inspectable exploration workflows make code-review results easier to validate.', 'Measure agent output by reviewer confidence, not only generation speed.'] },
  { id: 3, source: 'Vercel', title: 'Run any Dockerfile on Vercel', summary: 'Vercel now supports running any HTTP server from a Dockerfile, including Rails, Django, Spring Boot, and Go.', tag: 'DevOps', time: '5 min read', accent: 'amber', published: 'Jun 30, 2026', url: 'https://vercel.com/blog/dockerfile-on-vercel', details: ['Package an existing HTTP service in a Dockerfile instead of rewriting it for a new runtime.', 'This opens the platform to framework stacks that already have a container workflow.', 'Keep image size and startup behavior in mind when moving a service to serverless infrastructure.'] },
  { id: 4, source: 'OpenAI Developers', title: 'Making private MCP servers reachable without making them public', summary: 'A practical approach to preserving network boundaries while supporting MCP streaming and authentication.', tag: 'Infrastructure', time: '9 min read', accent: 'emerald', published: 'Jun 26, 2026', url: 'https://developers.openai.com/blog/connect-private-mcp-servers-to-openai-products', details: ['Private MCP access does not require exposing an internal service to the public internet.', 'Authentication and inspectable clients are central to safe remote connections.', 'Design agent integrations around explicit network and identity boundaries.'] },
  { id: 5, source: 'Vercel', title: 'Build realtime voice agents on AI Gateway', summary: 'An overview of connecting real-time voice applications to model providers through a unified gateway.', tag: 'AI engineering', time: '6 min read', accent: 'cyan', published: 'Jun 29, 2026', url: 'https://vercel.com/blog/realtime-voice-agents-on-ai-gateway', details: ['Voice systems need low-latency streaming across model and transport boundaries.', 'A gateway can centralize routing and provider configuration for real-time applications.', 'Start with observability for interruptions, latency, and tool-call failures.'] },
  { id: 6, source: 'Vercel', title: 'A new programming model for durable execution', summary: 'Vercel Workflows provides a way to build long-running, reliable, observable agents and backends in application code.', tag: 'Architecture', time: '9 min read', accent: 'purple', published: 'Apr 16, 2026', url: 'https://vercel.com/blog/a-new-programming-model-for-durable-execution', details: ['Durable workflows preserve progress through restarts, failures, and redeploys.', 'Long-running work benefits from explicit steps, state, and observability.', 'Keep request-response work separate from background orchestration.'] },
  { id: 7, source: 'Vercel', title: 'Vercel Services: Run full stack on Vercel', summary: 'A public beta for deploying multiple frontend and backend frameworks together in one project.', tag: 'Architecture', time: '5 min read', accent: 'emerald', published: 'Jun 30, 2026', url: 'https://vercel.com/blog/vercel-services-run-full-stack-on-vercel', details: ['Frontend and backend services can deploy and roll back atomically.', 'Internal service bindings avoid routing sensitive traffic over the public internet.', 'Shared previews make cross-service changes easier to validate before release.'] },
  { id: 8, source: 'Vercel', title: 'Vercel and Shopify are rebuilding Hydrogen', summary: 'Vercel and Shopify describe a new, open-source and runtime-agnostic direction for Hydrogen.', tag: 'Frontend', time: '8 min read', accent: 'amber', published: 'Jun 30, 2026', url: 'https://vercel.com/blog/vercel-and-shopify-are-rebuilding-hydrogen', details: ['The project aims to make commerce tooling more portable across runtimes.', 'Framework decisions can preserve an ecosystem while reducing hosting lock-in.', 'Open source remains the coordination layer for platform and community contributions.'] },
  { id: 9, source: 'OpenAI Developers', title: 'Mastering remote engineering work from your phone', summary: 'How Remote in the ChatGPT mobile app helps start, steer, review, and organize engineering work away from a desk.', tag: 'Developer tools', time: '6 min read', accent: 'cyan', published: 'Jun 23, 2026', url: 'https://developers.openai.com/blog/mastering-codex-remote-for-engineering', details: ['Remote engineering needs clear task boundaries and review checkpoints.', 'Mobile steering works best when agents leave concise, inspectable progress updates.', 'Use remote sessions to unblock work, then review material changes deliberately.'] },
  { id: 10, source: 'OpenAI Developers', title: 'Using skills to accelerate OSS maintenance', summary: 'How reusable skills and GitHub Actions can streamline maintenance in the OpenAI Agents SDK repositories.', tag: 'Developer tools', time: '7 min read', accent: 'purple', published: 'Mar 9, 2026', url: 'https://developers.openai.com/blog/skills-agents-sdk', details: ['Skills make repeated repository workflows easier to apply consistently.', 'Automated maintenance still benefits from project-specific context and guardrails.', 'GitHub Actions can turn validated workflows into repeatable operational work.'] },
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
  const [selectedStory, setSelectedStory] = useState(null)

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
          <p>Ten ideas worth your attention.</p>
        </div>
        <div className="filter-row">
          <div className="tag-filters">{tags.map((tag) => <button key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
        </div>
        <div className="story-grid">
          {visibleStories.map((story) => <article className={`story-card ${story.featured ? 'featured' : ''}`} key={story.id}>
            <div className="story-topline"><span className={`story-dot ${story.accent}`} />{story.source}<button aria-label={`Save ${story.title}`} className={saved.includes(story.id) ? 'is-saved' : ''} onClick={() => toggleSaved(story.id)}><Bookmark size={18} fill={saved.includes(story.id) ? 'currentColor' : 'none'} /></button></div>
            <h3><button onClick={() => setSelectedStory(story)}>{story.title}<ArrowUpRight size={14} /></button></h3><p>{story.summary}</p>
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
      {selectedStory && <div className="briefing-backdrop" role="presentation" onClick={() => setSelectedStory(null)}>
        <article className="briefing-modal" role="dialog" aria-modal="true" aria-labelledby="briefing-title" onClick={(event) => event.stopPropagation()}>
          <button className="close-briefing" onClick={() => setSelectedStory(null)} aria-label="Close briefing"><X size={19} /></button>
          <p className="eyebrow"><span className={`story-dot ${selectedStory.accent}`} /> {selectedStory.source} · {selectedStory.published}</p>
          <h2 id="briefing-title">{selectedStory.title}</h2>
          <p className="briefing-summary">{selectedStory.summary}</p>
          <h3>Why it matters</h3>
          <ul>{selectedStory.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          <a className="source-link" href={selectedStory.url} target="_blank" rel="noreferrer">Read the original source <ExternalLink size={16} /></a>
        </article>
      </div>}
      <footer className="site-footer"><span>© 2026 Software Daily</span><span>Built for curious developers.</span></footer>
    </main>
  )
}

export default App
