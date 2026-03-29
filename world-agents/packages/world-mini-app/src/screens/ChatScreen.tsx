import { useState, useRef, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentEntry {
  agentId: number
  handle: string
  displayName: string
  category: string
  affiliation: string | null
  bio: string
  isSpy: boolean
  onChain: { erc8004TokenId: number }
}

interface AgentChip {
  handle: string
  displayName: string
}

interface Source {
  label: string
  url: string
}

interface ResponseData {
  agents: AgentChip[]
  text: string
  sources: Source[]
}

type Message =
  | { type: 'system'; text: string }
  | { type: 'user'; text: string }
  | { type: 'agent'; data: ResponseData }

// ── Config ────────────────────────────────────────────────────────────────────

const CHATBOT_URL = 'http://localhost:8000'

// Whitepaper §9.3 — Predefined question bubbles (5-10)
const PREDEFINED_QUESTIONS = [
  'What are the verified facts about the Iranian drone strike?',
  'How did the international community respond to the escalation?',
  'What are the economic implications of the conflict?',
  'What humanitarian concerns have been reported?',
  'What is the current military posture of the involved parties?',
  'Which agents disagree with each other?',
  'What fabricated claims were detected?',
  'What role did Oman play in backchannel diplomacy?',
]

// ── Static response map (fallback when backend is down) ─────────────────────

const agentChips: Record<string, AgentChip> = {
  '@reuters_amir':  { handle: '@reuters_amir',  displayName: 'Amir Tehrani' },
  '@diplomat_chen': { handle: '@diplomat_chen', displayName: 'Chen Wei (diplomat)' },
  '@def_analyst_sarah': { handle: '@def_analyst_sarah', displayName: 'Sarah Kovacs' },
  '@econ_raj':      { handle: '@econ_raj',      displayName: 'Raj Mehta' },
  '@humanitarian_anna': { handle: '@humanitarian_anna', displayName: 'Anna Lindgren' },
}

function fallbackResponse(input: string): ResponseData {
  const q = input.toLowerCase()

  if (q.includes('drone') || q.includes('strike') || q.includes('verified fact') || q.includes('iran')) {
    return {
      agents: [agentChips['@reuters_amir'], agentChips['@def_analyst_sarah']],
      text: 'Iran launched a coordinated strike: 32 Shahed-136 drones and 14 ballistic missiles targeted Israeli military positions. IDF interception rate was approximately 89% via Iron Dome and Arrow systems. USS Eisenhower remained on station throughout. Oman facilitated backchannel communications between parties — no direct talks.',
      sources: [
        { label: 'IDF Briefing', url: 'https://gateway.lighthouse.storage/ipfs/QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w' },
      ],
    }
  }

  if (q.includes('international') || q.includes('community') || q.includes('respond') || q.includes('diplomacy') || q.includes('oman')) {
    return {
      agents: [agentChips['@diplomat_chen']],
      text: 'UN Security Council convened an emergency session. Oman facilitated backchannel communications between parties. The African Union called for restraint and multilateral dialogue. Japan expressed concern over energy supply chain security. No ceasefire has been announced — diplomatic channels remain active.',
      sources: [
        { label: 'Diplomatic Corpus', url: 'https://gateway.lighthouse.storage/ipfs/QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w' },
      ],
    }
  }

  if (q.includes('economic') || q.includes('oil') || q.includes('market') || q.includes('brent')) {
    return {
      agents: [agentChips['@econ_raj']],
      text: 'Brent crude opened up 4.2% at $94.80. Strait of Hormuz risk premium has been building since the strike. OPEC+ held an emergency call — no supply adjustment announced. Markets pricing in a 15% probability of Hormuz disruption within 30 days.',
      sources: [
        { label: 'Verified Corpus', url: 'https://gateway.lighthouse.storage/ipfs/QmYpNUh6HPYthzXjJLJUqB2zrvCaCvzGTZ4toC4pdi8JxS' },
      ],
    }
  }

  if (q.includes('humanitarian') || q.includes('casualt') || q.includes('civilian')) {
    return {
      agents: [agentChips['@humanitarian_anna']],
      text: 'ICRC has 3 field teams on standby in the Eastern Mediterranean. Official casualty count: 3 killed, 47 injured — all from a single secondary impact in a non-residential zone. UNHCR monitoring displacement patterns. No evidence of mass civilian casualty events.',
      sources: [
        { label: 'ICRC Field Report', url: 'https://gateway.lighthouse.storage/ipfs/QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w' },
      ],
    }
  }

  if (q.includes('military') || q.includes('posture') || q.includes('idf') || q.includes('missile')) {
    return {
      agents: [agentChips['@def_analyst_sarah']],
      text: 'IDF confirmed 32 Shahed-136 drones and 14 Emad ballistic missiles. Iron Dome handled the drone wave; Arrow-3 intercepted 8 ballistic threats. One missile reached a secondary target — 3 killed, 47 injured. USS Eisenhower carrier strike group remains on station. B-1Bs repositioned to Qatar.',
      sources: [
        { label: 'IDF Technical Brief', url: 'https://gateway.lighthouse.storage/ipfs/QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w' },
      ],
    }
  }

  if (q.includes('disagree') || q.includes('conflict') || q.includes('outlier')) {
    return {
      agents: [agentChips['@reuters_amir']],
      text: '@eli_cohen is the sole outlier — claiming 147 drones and a secret Turkish-Iranian agreement. All 19 other agents cite IDF-confirmed figures of 32 drones and 14 missiles. Zero cross-agent corroboration for @eli_cohen\'s claims. OpenClaw flagged 6 fabricated posts.',
      sources: [
        { label: 'Detection Report', url: 'https://gateway.lighthouse.storage/ipfs/QmSGrZWYuVdrqcYGxokSaMVG8kUFkKQ4sAeistZDJpiiRd' },
      ],
    }
  }

  if (q.includes('fabricat') || q.includes('detect') || q.includes('false') || q.includes('fake')) {
    return {
      agents: [agentChips['@reuters_amir']],
      text: '@eli_cohen fabricated 6 posts: claiming 147 drones (actual: 32), a secret Turkish-Iranian arms agreement (no evidence), and the 147-drone claim repeated across multiple cycles. OpenClaw detection confidence: 85.7%. Agent traced to Member 4 via ERC-8004 → World ID chain.',
      sources: [
        { label: 'Detection Report', url: 'https://gateway.lighthouse.storage/ipfs/QmSGrZWYuVdrqcYGxokSaMVG8kUFkKQ4sAeistZDJpiiRd' },
        { label: 'Cleansed Corpus', url: 'https://gateway.lighthouse.storage/ipfs/QmYpNUh6HPYthzXjJLJUqB2zrvCaCvzGTZ4toC4pdi8JxS' },
      ],
    }
  }

  // Fallback
  return {
    agents: [agentChips['@diplomat_chen']],
    text: 'Based on the verified corpus of 134 posts across 10 simulation cycles, all 19 verified agents agree on IDF-confirmed figures and Oman-mediated backchannel status. The spy agent @eli_cohen has been removed and the corpus cleansed.',
    sources: [
      { label: 'Verified Corpus', url: 'https://gateway.lighthouse.storage/ipfs/QmYpNUh6HPYthzXjJLJUqB2zrvCaCvzGTZ4toC4pdi8JxS' },
    ],
  }
}

// ── Agent Profile Mini-Modal ──────────────────────────────────────────────────

function AgentProfileModal({ handle, agents, onClose }: { handle: string; agents: AgentEntry[]; onClose: () => void }) {
  const agent = agents.find(a => a.handle === handle)
  if (!agent) return null

  const categoryColor: Record<string, string> = {
    journalist: '#2980B9', military: '#8E44AD', diplomat: '#16A085',
    economist: '#D35400', civilian: '#7F8C8D', academic: '#1A5276',
    humanitarian: '#27AE60', intelligence: '#E74C3C',
  }
  const color = categoryColor[agent.category] ?? '#9B9590'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,31,0.55)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '340px', maxWidth: 'calc(100vw - 40px)', zIndex: 301,
        background: '#F5F0E8', borderRadius: 16,
        padding: '20px 20px 24px', maxHeight: '70vh', overflowY: 'auto',
        boxShadow: '0 8px 48px rgba(0,0,0,0.28)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: agent.isSpy ? '#E74C3C' : '#1A1A1F' }}>
                {agent.handle}
              </span>
              {agent.isSpy && (
                <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 700, color: '#E74C3C', border: '1.5px solid #E74C3C', padding: '1px 6px', borderRadius: 3 }}>SPY</span>
              )}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4A4640', marginBottom: 4 }}>{agent.displayName}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>{agent.category}</span>
              {agent.affiliation && (
                <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', background: 'rgba(155,149,144,0.1)', border: '1px solid rgba(155,149,144,0.2)', borderRadius: 4, padding: '2px 7px' }}>{agent.affiliation}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="#9B9590" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#4A4640', lineHeight: 1.6, marginBottom: 14 }}>{agent.bio}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(194,82,43,0.04)', border: '1px solid rgba(194,82,43,0.12)', borderRadius: 8 }}>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', letterSpacing: '0.5px', marginBottom: 3 }}>ERC-8004 TOKEN</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, color: '#C2522B' }}>#{agent.onChain.erc8004TokenId}</div>
          </div>
          <div style={{ flex: 1, padding: '8px 10px', background: agent.isSpy ? 'rgba(231,76,60,0.04)' : 'rgba(39,174,96,0.04)', border: `1px solid ${agent.isSpy ? 'rgba(231,76,60,0.15)' : 'rgba(39,174,96,0.15)'}`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', letterSpacing: '0.5px', marginBottom: 3 }}>STATUS</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, color: agent.isSpy ? '#E74C3C' : '#27AE60' }}>
              {agent.isSpy ? 'REMOVED' : 'VERIFIED'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Chat Screen ───────────────────────────────────────────────────────────────

const initialMessages: Message[] = [
  { type: 'system', text: '19 verified agents online · @eli_cohen removed · Corpus cleansed' },
]

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [agentData, setAgentData] = useState<AgentEntry[]>([])
  const [profileHandle, setProfileHandle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/data/agents.json')
      .then(r => r.json())
      .then(setAgentData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q) return
    setLoading(true)

    const userMsg: Message = { type: 'user', text: q }
    setMessages(prev => [...prev, userMsg])

    // Try FastAPI backend first
    let responseData: ResponseData | null = null
    try {
      const res = await fetch(`${CHATBOT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      if (res.ok) {
        const data = await res.json()
        responseData = {
          agents: [agentChips['@reuters_amir']], // FastAPI returns plain text, wrap it
          text: data.answer,
          sources: [{ label: 'Cleansed Corpus (RAG)', url: 'https://gateway.lighthouse.storage/ipfs/QmYpNUh6HPYthzXjJLJUqB2zrvCaCvzGTZ4toC4pdi8JxS' }],
        }
      }
    } catch {
      // Backend not running — use fallback
    }

    if (!responseData) {
      responseData = fallbackResponse(q)
    }

    const agentMsg: Message = { type: 'agent', data: responseData }
    setMessages(prev => [...prev, agentMsg])
    setLoading(false)
  }

  // Questions user hasn't asked yet
  const askedQuestions = new Set(messages.filter(m => m.type === 'user').map(m => (m as any).text))
  const availableQuestions = PREDEFINED_QUESTIONS.filter(q => !askedQuestions.has(q))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, paddingBottom: 8 }}>
        <div className="screen-label">06 — Verified Chat</div>
        <div className="screen-title" style={{ marginBottom: 6 }}>Ask the Agents</div>
        <div style={{
          background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)',
          borderRadius: 8, padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#27AE60" strokeWidth="1.2" />
            <path d="M3.5 6l2 2 3.5-3.5" stroke="#27AE60" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#27AE60', fontWeight: 600, letterSpacing: '0.5px' }}>
            SPY REMOVED — 19 VERIFIED AGENTS RESPONDING
          </span>
        </div>
      </div>

      {/* Bubble feed */}
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 2, marginBottom: 8 }}>
        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={i} style={{
                textAlign: 'center', margin: '8px 0',
                fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590',
                background: 'rgba(194,82,43,0.04)', border: '1px solid rgba(194,82,43,0.1)',
                borderRadius: 6, padding: '5px 10px',
              }}>
                {msg.text}
              </div>
            )
          }
          if (msg.type === 'user') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px',
                  background: '#C2522B', color: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.4,
                }}>
                  {msg.text}
                </div>
              </div>
            )
          }
          if (msg.type === 'agent') {
            const { data } = msg
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{
                  padding: '10px 12px', background: '#FFFFFF',
                  border: '1px solid rgba(194,82,43,0.15)',
                  borderRadius: '4px 16px 16px 16px',
                }}>
                  {data.agents.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                      {data.agents.map(a => (
                        <button
                          key={a.handle}
                          onClick={() => setProfileHandle(a.handle)}
                          style={{
                            fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 700,
                            color: '#27AE60', background: 'rgba(39,174,96,0.08)',
                            border: '1px solid rgba(39,174,96,0.25)', borderRadius: 4,
                            padding: '2px 7px', cursor: 'pointer',
                          }}
                        >
                          {a.handle} ↗
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1A1A1F', lineHeight: 1.5, marginBottom: 8 }}>
                    {data.text}
                  </div>
                  <div style={{ borderTop: '1px solid rgba(194,82,43,0.08)', paddingTop: 8 }}>
                    <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', marginRight: 6 }}>SOURCES:</span>
                    {data.sources.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}
                        style={{
                          fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600,
                          color: '#C2522B', background: 'rgba(194,82,43,0.06)',
                          border: '1px solid rgba(194,82,43,0.2)', borderRadius: 4,
                          padding: '2px 7px', cursor: 'pointer', marginRight: 4,
                        }}
                      >
                        {s.label} ↗
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          }
          return null
        })}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', marginBottom: 10 }}>
            <div style={{
              padding: '10px 16px', background: '#FFFFFF',
              border: '1px solid rgba(194,82,43,0.15)',
              borderRadius: '4px 16px 16px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(194,82,43,0.2)',
                borderTop: '2px solid #C2522B', display: 'inline-block',
                animation: 'radarSweep 0.8s linear infinite',
              }} />
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590' }}>
                Querying verified corpus…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Predefined question bubbles — no free text */}
      {availableQuestions.length > 0 && (
        <div style={{ flexShrink: 0, paddingTop: 6, borderTop: '1px solid rgba(194,82,43,0.1)' }}>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', marginBottom: 6, letterSpacing: '0.5px' }}>
            SELECT A QUESTION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
            {availableQuestions.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'rgba(194,82,43,0.04)',
                  border: '1px solid rgba(194,82,43,0.12)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#4A4640',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All questions asked */}
      {availableQuestions.length === 0 && messages.length > 1 && (
        <div style={{
          textAlign: 'center', padding: '12px', marginTop: 8,
          background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)',
          borderRadius: 8,
        }}>
          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#27AE60', fontWeight: 600 }}>
            ✓ ALL QUESTIONS ANSWERED — VERIFIED KNOWLEDGE COMPLETE
          </span>
        </div>
      )}

      {/* Agent profile modal */}
      {profileHandle && agentData.length > 0 && (
        <AgentProfileModal
          handle={profileHandle}
          agents={agentData}
          onClose={() => setProfileHandle(null)}
        />
      )}
    </div>
  )
}
