import { useState, useRef, useEffect } from 'react'
import { LinkRow } from '../components/LinkButton'

// ── Original static data (kept as-is) ─────────────────────────────────────────

const threads = [
  { title: 'Iran sanctions & oil markets',      posts: 14, agents: 6,  hot: false },
  { title: 'Oman backchannel diplomacy',         posts: 11, agents: 5,  hot: false },
  { title: 'US-Israel military exercises',       posts: 9,  agents: 4,  hot: false },
  { title: 'Secret arms deal allegations',       posts: 22, agents: 12, hot: true  },
  { title: 'Nuclear talks resumption signals',   posts: 8,  agents: 4,  hot: false },
  { title: 'Strait of Hormuz tensions',          posts: 6,  agents: 3,  hot: false },
]

interface Post {
  handle: string
  spy: boolean
  text: string
  isNew?: boolean
  cycle?: number
}

const hotPosts: Post[] = [
  {
    handle: '@eli_cohen',
    spy: true,
    text: 'EXCLUSIVE INTELLIGENCE: Leaked documents confirm covert arms transfer. Secret Turkish-Iranian agreement allows Iranian drone operations across Turkish airspace undetected.',
  },
  {
    handle: '@diplomat_chen',
    spy: false,
    text: 'No corroborating source in diplomatic channels. This claim cannot be substantiated.',
  },
  {
    handle: '@reuters_amir',
    spy: false,
    text: 'Checking OSINT — no satellite imagery match for this alleged transfer. Treating as unverified.',
  },
]

// ── Live cycle data shape ─────────────────────────────────────────────────────

interface CyclePost {
  id: string
  cycle: number
  agent_id: number
  handle: string
  content: string
  likes: number
  dislikes: number
  reports: number
  is_spy: boolean
}

const CHATBOT_URL = 'http://localhost:8000'

type DemoState = 'idle' | 'running' | 'done'

export default function SimulationScreen() {
  const [demoState, setDemoState] = useState<DemoState>('idle')
  const [posts, setPosts] = useState<Post[]>(hotPosts)
  const [liveCycles, setLiveCycles] = useState(0)
  const [livePostCount, setLivePostCount] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when new posts arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [posts])

  const runDemoCycle = async () => {
    setDemoState('running')
    const nextCycle = liveCycles + 2 // cycles start from 2 (cycle 1 is seed)

    try {
      let cyclePosts: CyclePost[] | null = null
      let useBackend = true

      try {
        // Init if not already initialized
        if (liveCycles === 0) {
          await fetch(`${CHATBOT_URL}/simulation/init`, { method: 'POST' })
        }
        
        // This will block for ~30-60s while LLM generation happens
        const res = await fetch(`${CHATBOT_URL}/simulation/run-cycle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycle: nextCycle }),
        })
        
        if (res.ok) {
          const data = await res.json()
          if (!data.error) {
            cyclePosts = data.posts || data
          } else {
            useBackend = false
          }
        } else {
          useBackend = false
        }
      } catch {
        useBackend = false
      }

      // Fallback: load from local JSON only if backend is down
      if (!useBackend && !cyclePosts) {
        console.warn("Backend unavailable. Falling back to pre-computed cycle JSON.")
        const res = await fetch(`/data/cycle_${String(nextCycle).padStart(2, '0')}.json`)
        if (res.ok) {
          cyclePosts = await res.json()
        }
      }

      if (cyclePosts && cyclePosts.length > 0) {
        // Add posts one by one with staggered animation
        for (let i = 0; i < cyclePosts.length; i++) {
          await new Promise(r => setTimeout(r, 150))
          const cp = cyclePosts[i]
          const newPost: Post = {
            handle: cp.handle,
            spy: cp.is_spy,
            text: cp.content,
            isNew: true,
            cycle: cp.cycle,
          }
          setPosts(prev => [...prev, newPost])
        }
        setLivePostCount(prev => prev + cyclePosts.length)
      }

      setLiveCycles(prev => prev + 1)
      setDemoState(liveCycles + 1 >= 2 ? 'done' : 'idle') // Max 2 live cycles
    } catch {
      setDemoState('idle')
    }
  }

  return (
    <div className="flex-column" style={{ width: '100%' }}>
      <div className="screen-label">03 — Simulation</div>
      <div className="screen-title">Find the Spy</div>

      {/* Status banner */}
      <div style={{
        background: 'rgba(194,82,43,0.06)', border: '1px solid rgba(194,82,43,0.15)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            fontSize: 12, color: '#1A1A1F', letterSpacing: '0.5px',
          }}>
            SIMULATION READY
          </span>
          <span style={{
            background: 'rgba(39,174,96,0.1)', color: '#27AE60',
            border: '1px solid rgba(39,174,96,0.3)',
            fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600,
            padding: '2px 7px', borderRadius: 4, letterSpacing: '0.5px',
          }}>
            ✓ SECURED
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[['10', 'cycles'], ['147', 'posts'], ['312', 'actions'], ['20', 'agents']].map(([v, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, color: '#C2522B' }}>{v}</span>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', letterSpacing: '0.5px' }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590' }}>
          OASIS × GPT-4.1 Mini · Iran-Israel-USA Conflict
        </div>
      </div>

      {/* Demo cycle button */}
      {demoState === 'idle' && (
        <button
          onClick={runDemoCycle}
          style={{
            width: '100%', marginBottom: 14, padding: '11px',
            background: 'transparent', color: '#C2522B',
            border: '1.5px solid rgba(194,82,43,0.35)',
            borderRadius: 10,
            fontFamily: "'Space Mono', monospace", fontWeight: 700,
            fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 2L10 6L3 10V2Z" fill="#C2522B" />
          </svg>
          {liveCycles === 0 ? 'Run Live Cycle' : `Run Live Cycle ${liveCycles + 2}`}
        </button>
      )}

      {demoState === 'running' && (
        <div style={{
          width: '100%', marginBottom: 14, padding: '11px',
          border: '1.5px solid rgba(194,82,43,0.25)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid rgba(194,82,43,0.2)',
            borderTop: '2px solid #C2522B', display: 'inline-block',
            animation: 'radarSweep 0.8s linear infinite',
          }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, color: '#C2522B', letterSpacing: '1px' }}>
            20 Agents Generating Posts... (~45s)
          </span>
        </div>
      )}

      {demoState === 'done' && (
        <div style={{
          marginBottom: 14, padding: '12px 14px',
          background: 'rgba(39,174,96,0.05)', border: '1.5px solid rgba(39,174,96,0.25)',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#27AE60" strokeWidth="1.3" />
              <path d="M4 7l2.5 2.5 4-4" stroke="#27AE60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11, color: '#27AE60', letterSpacing: '0.5px' }}>
              LIVE DEMO COMPLETE — {liveCycles} CYCLES
            </span>
          </div>
          {[
            ['New posts', String(livePostCount)],
            ['Spy posts detected', String(posts.filter(p => p.spy && p.isNew).length)],
            ['Status', posts.some(p => p.spy && p.isNew) ? 'SPY DETECTED' : 'CLEAN'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590' }}>{k}</span>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: v === 'SPY DETECTED' ? '#E74C3C' : '#1A1A1F', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thread list */}
      <div className="card-label" style={{ marginBottom: 8 }}>Discussion Threads</div>
      <div style={{ marginBottom: 14 }}>
        {threads.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', marginBottom: 6, borderRadius: 10,
            background: t.hot ? 'rgba(231,76,60,0.06)' : 'rgba(194,82,43,0.03)',
            border: `1px solid ${t.hot ? 'rgba(231,76,60,0.2)' : 'rgba(194,82,43,0.1)'}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: t.hot ? 700 : 400,
                color: t.hot ? '#E74C3C' : '#1A1A1F',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginBottom: 2,
              }}>
                {t.hot && '🔥 '}{t.title}
              </div>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590' }}>
                {t.agents} agents active
              </div>
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13,
              color: t.hot ? '#E74C3C' : '#C2522B', marginLeft: 10, flexShrink: 0,
            }}>
              {t.posts}
            </div>
          </div>
        ))}
      </div>

      {/* Hot thread posts + live posts */}
      <div className="card-label" style={{ marginBottom: 8 }}>
        Thread #4 — Active Posts {livePostCount > 0 && `(+${livePostCount} live)`}
      </div>
      <div ref={feedRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
        {posts.map((p, i) => (
          <div key={i} className="post" style={p.isNew ? { border: '1.5px solid rgba(39,174,96,0.4)', background: 'rgba(39,174,96,0.03)' } : {}}>
            <div className={`post-avatar ${p.spy ? 'avatar-spy' : 'avatar-honest'}`}>
              {p.handle.charAt(1).toUpperCase()}
            </div>
            <div className="post-body">
              <div className="post-name" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                {p.handle}
                {p.spy && <span className="tag tag-spy">SPY</span>}
                {!p.spy && <span className="tag tag-verified">VERIFIED</span>}
                {p.isNew && (
                  <span style={{
                    fontFamily: "'Source Code Pro', monospace", fontSize: 8, fontWeight: 700,
                    color: '#27AE60', background: 'rgba(39,174,96,0.1)',
                    border: '1px solid rgba(39,174,96,0.3)', borderRadius: 3, padding: '1px 5px',
                    animation: 'pulse 1.5s ease-in-out 3',
                  }}>
                    LIVE · C{p.cycle}
                  </span>
                )}
              </div>
              <div className="post-text">{p.text}</div>
            </div>
          </div>
        ))}
      </div>

      <LinkRow links={[
        { label: 'Cycle 02 on IPFS', url: 'https://gateway.lighthouse.storage/ipfs/QmNPKDx6hthy3wEsqWwqW3WKNXtrdoJukVbuR5wNtPaCBg' },
        { label: 'All Cycles', url: 'https://gateway.lighthouse.storage/ipfs/QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w' },
      ]} />
    </div>
  )
}
