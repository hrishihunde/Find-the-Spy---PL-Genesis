import { useState, useEffect } from 'react'
import { LinkRow } from '../components/LinkButton'

interface DetectionReport {
  flagged_agent: { handle: string; agent_id: number }
  false_posts: { cycle: number; content: string; contradiction: string }[]
  threshold_met: number
  trace_chain: Record<string, string>
  ipfs_cid: string
  lighthouse_gateway: string
  total_posts_checked: number
}

interface CleanseStats {
  totalBefore: number
  totalAfter: number
  removedPosts: number
  removedAgent: string
}

const evidenceLinks = [
  { label: 'IPFS Evidence', url: 'https://gateway.lighthouse.storage/ipfs/QmSGrZWYuVdrqcYGxokSaMVG8kUFkKQ4sAeistZDJpiiRd' },
  { label: 'ERC-8004 Registry', url: 'https://sepolia.etherscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e' },
  { label: '@eli_cohen Contract', url: 'https://sepolia.etherscan.io/address/0xDA4ea461551c88d9c8c993f0765bee8e892Bdeb7' },
]

export default function TraceScreen() {
  const [report, setReport] = useState<DetectionReport | null>(null)
  const [cleanseStats, setCleanseStats] = useState<CleanseStats | null>(null)

  useEffect(() => {
    // Load detection report
    fetch('/data/detection_report.json')
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})

    // Compute cleanse stats from cycle data
    async function loadCleanseStats() {
      let totalBefore = 0
      let spyPosts = 0
      const spyHandle = '@eli_cohen'

      for (let c = 1; c <= 10; c++) {
        try {
          const res = await fetch(`/data/cycle_${String(c).padStart(2, '0')}.json`)
          const posts: any[] = await res.json()
          totalBefore += posts.length
          spyPosts += posts.filter((p: any) => p.is_spy).length
        } catch { /* cycle file not found */ }
      }

      setCleanseStats({
        totalBefore,
        totalAfter: totalBefore - spyPosts,
        removedPosts: spyPosts,
        removedAgent: spyHandle,
      })
    }
    loadCleanseStats()
  }, [])

  if (!report) {
    return (
      <div className="flex-column" style={{ width: '100%' }}>
        <div className="screen-label">05 — Accountability Trace</div>
        <div className="screen-title">Loading…</div>
      </div>
    )
  }

  // Parse trace chain from report 
  const chain = [
    { step: 1, label: 'Flagged Agent', value: report.trace_chain.step_1, red: true },
    { step: 2, label: 'ERC-8004 Token', value: report.trace_chain.step_2, red: false },
    { step: 3, label: 'Deployer Wallet', value: report.trace_chain.step_3, red: false },
    { step: 4, label: 'World ID Nullifier', value: report.trace_chain.step_4, red: false },
    { step: 5, label: 'Verified Human', value: report.trace_chain.step_5, red: true },
  ]

  return (
    <div className="flex-column" style={{ width: '100%' }}>
      <div className="screen-label">05 — Accountability Trace</div>
      <div className="screen-title">Following the Chain</div>
      <div className="screen-topic">Agent → Token → Wallet → Human</div>

      {/* Trace chain */}
      <div style={{ marginBottom: 16 }}>
        {chain.map((item, i) => (
          <div key={i}>
            {/* Node */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: item.red ? (item.step === 5 ? 'rgba(231,76,60,0.06)' : 'rgba(231,76,60,0.04)') : '#FFFFFF',
              border: `1px solid ${item.red ? 'rgba(231,76,60,0.2)' : 'rgba(194,82,43,0.12)'}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: item.red ? 'rgba(231,76,60,0.1)' : 'rgba(194,82,43,0.08)',
                border: `1.5px solid ${item.red ? '#E74C3C' : '#C2522B'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Space Mono', monospace", fontWeight: 700,
                fontSize: 11, color: item.red ? '#E74C3C' : '#C2522B',
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Source Code Pro', monospace", fontSize: 10, fontWeight: 600,
                  color: '#9B9590', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Source Code Pro', monospace", fontSize: 11,
                  color: item.red ? '#E74C3C' : '#1A1A1F', fontWeight: item.red ? 700 : 400,
                  wordBreak: 'break-all',
                }}>
                  {item.value}
                </div>
              </div>
              {item.step === 5 && (
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 10,
                  color: '#E74C3C', border: '2px solid #E74C3C', padding: '2px 6px',
                  borderRadius: 4, transform: 'rotate(-3deg)', display: 'inline-block',
                  flexShrink: 0,
                }}>
                  GUILTY
                </span>
              )}
            </div>
            {/* Connector arrow */}
            {i < chain.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{ width: 1, height: 8, background: 'rgba(194,82,43,0.3)' }} />
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="#C2522B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reveal banner */}
      <div style={{
        background: 'rgba(231,76,60,0.06)', border: '1.5px solid rgba(231,76,60,0.2)',
        borderRadius: 10, padding: '12px 14px', marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13,
          color: '#E74C3C', letterSpacing: '1px', marginBottom: 4,
        }}>
          THE REAL SPY IS THE HUMAN
        </div>
        <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: '#9B9590' }}>
          Member 4 deployed {report.flagged_agent.handle} with fabricated knowledge
        </div>
      </div>

      {/* Knowledge Cleansing — Phase 4 */}
      <div className="card-label" style={{ marginBottom: 8 }}>Phase 4 — Knowledge Cleansing</div>
      {cleanseStats ? (
        <div style={{
          background: 'rgba(39,174,96,0.04)', border: '1.5px solid rgba(39,174,96,0.2)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {/* Before */}
            <div style={{
              flex: 1, padding: '8px 10px', borderRadius: 8, textAlign: 'center',
              background: 'rgba(231,76,60,0.04)', border: '1px solid rgba(231,76,60,0.15)',
            }}>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', marginBottom: 3, letterSpacing: '0.5px' }}>BEFORE</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18, color: '#E74C3C' }}>{cleanseStats.totalBefore}</div>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590' }}>posts (20 agents)</div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                <path d="M2 6h16M14 2l4 4-4 4" stroke="#27AE60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* After */}
            <div style={{
              flex: 1, padding: '8px 10px', borderRadius: 8, textAlign: 'center',
              background: 'rgba(39,174,96,0.04)', border: '1px solid rgba(39,174,96,0.15)',
            }}>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', marginBottom: 3, letterSpacing: '0.5px' }}>AFTER</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18, color: '#27AE60' }}>{cleanseStats.totalAfter}</div>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590' }}>posts (19 agents)</div>
            </div>
          </div>
          {/* Removed summary */}
          {[
            ['Removed agent', cleanseStats.removedAgent],
            ['Spy posts removed', String(cleanseStats.removedPosts)],
            ['Cleansed corpus', '✓ VERIFIED'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590' }}>{k}</span>
              <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: v === '✓ VERIFIED' ? '#27AE60' : '#E74C3C', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590', marginBottom: 14 }}>Loading cleanse stats…</div>
      )}

      {/* Evidence cards */}
      <div className="card-label" style={{ marginBottom: 8 }}>On-Chain Evidence</div>
      {evidenceLinks.map((card, i) => (
        <button
          key={i}
          onClick={() => window.open(card.url, '_blank', 'noopener,noreferrer')}
          style={{
            width: '100%', textAlign: 'left', marginBottom: 8,
            background: 'rgba(194,82,43,0.03)', border: '1px solid rgba(194,82,43,0.12)',
            borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#C2522B', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: '#1A1A1F' }}>
              {card.url.includes('0x') ? card.url.split('/').pop()!.substring(0, 12) + '…' : card.url.split('/').pop()!.substring(0, 12) + '…'}
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 11L11 1M11 1H5M11 1V7" stroke="#C2522B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}

      <LinkRow links={[
        { label: 'IPFS Evidence', url: report.lighthouse_gateway },
        { label: 'ERC-8004 Registry', url: 'https://sepolia.etherscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e' },
      ]} />
    </div>
  )
}
