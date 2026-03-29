import { useState, useEffect } from 'react'
import { LinkRow } from '../components/LinkButton'

interface FalsePost {
  cycle: number
  content: string
  contradiction: string
}

interface DetectionReport {
  status: string
  timestamp: string
  ground_truth_count: number
  total_posts_checked: number
  flagged_agent: { handle: string; agent_id: number }
  false_posts: FalsePost[]
  threshold_met: number
  trace_chain: Record<string, string>
  ipfs_cid: string
  lighthouse_gateway: string
}

export default function DetectionScreen() {
  const [report, setReport] = useState<DetectionReport | null>(null)

  useEffect(() => {
    fetch('/data/detection_report.json')
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})
  }, [])

  if (!report) {
    return (
      <div className="flex-column" style={{ width: '100%' }}>
        <div className="screen-label">04 — Detection</div>
        <div className="screen-title">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex-column" style={{ width: '100%' }}>
      {/* Header */}
      <div className="screen-label">04 — Detection</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div className="screen-title" style={{ marginBottom: 0 }}>OpenClaw Analysis</div>
        <span style={{
          background: 'rgba(194,82,43,0.1)', color: '#C2522B',
          border: '1px solid rgba(194,82,43,0.3)',
          fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600,
          padding: '3px 8px', borderRadius: 4, letterSpacing: '0.5px', flexShrink: 0,
        }}>
          Claude Opus
        </span>
      </div>
      <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590', marginBottom: 16 }}>
        {report.total_posts_checked} posts analysed · {report.ground_truth_count} ground truths · 20 agents
      </div>

      {/* Agent grid 5×4 */}
      <div className="card-label" style={{ marginBottom: 8 }}>Agent Corroboration Scan</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14,
        background: '#FFFFFF', border: '1px solid rgba(194,82,43,0.1)', borderRadius: 10, padding: 10,
      }}>
        {Array.from({ length: 20 }, (_, i) => {
          const isSpy = i + 1 === report.flagged_agent.agent_id
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: isSpy ? 'rgba(231,76,60,0.08)' : 'rgba(39,174,96,0.08)',
                border: `2px solid ${isSpy ? '#E74C3C' : '#27AE60'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isSpy ? 'pulse 1.2s ease-in-out infinite' : 'none',
              }}>
                {isSpy ? (
                  <span style={{ fontSize: 14 }}>⚠</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5 6.5-7" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {isSpy && (
                <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 7, color: '#E74C3C', fontWeight: 700 }}>
                  #{report.flagged_agent.agent_id}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Flagged agent card */}
      <div style={{
        background: 'rgba(231,76,60,0.04)', border: '1.5px solid rgba(231,76,60,0.25)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>
              {report.flagged_agent.handle}
            </div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590', marginTop: 2 }}>
              Intelligence · Agent #{report.flagged_agent.agent_id}
            </div>
          </div>
          <span style={{
            background: 'rgba(231,76,60,0.1)', color: '#E74C3C',
            border: '1px solid rgba(231,76,60,0.3)',
            fontFamily: "'Source Code Pro', monospace", fontSize: 10, fontWeight: 700,
            padding: '4px 10px', borderRadius: 5, letterSpacing: '1px',
          }}>
            FLAGGED
          </span>
        </div>

        {/* Real FALSE posts from detection report */}
        <div className="card-label" style={{ marginBottom: 6 }}>FALSE Posts ({report.false_posts.length})</div>
        <div style={{ marginBottom: 10 }}>
          {report.false_posts.map((fp, i) => (
            <div key={i} style={{
              padding: '8px 0',
              borderBottom: i < report.false_posts.length - 1 ? '1px solid rgba(231,76,60,0.1)' : 'none',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ color: '#E74C3C', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✗</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', marginBottom: 3,
                  }}>
                    CYCLE {fp.cycle}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#4A4640', lineHeight: 1.4,
                    marginBottom: 4, overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  }}>
                    {fp.content}
                  </div>
                  <div style={{
                    fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#E74C3C',
                    background: 'rgba(231,76,60,0.06)', borderRadius: 4, padding: '3px 6px',
                    display: 'inline-block',
                  }}>
                    ⚡ {fp.contradiction}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence */}
        <div className="card-label">Detection Confidence</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="confidence-bar" style={{ flex: 1 }}>
            <div className="confidence-fill" />
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, color: '#E74C3C', flexShrink: 0 }}>
            {((report.threshold_met / (report.threshold_met + 1)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" stroke="#27AE60" strokeWidth="1.5" />
          <path d="M5 9l3 3 5-6" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: '#27AE60', fontWeight: 600 }}>
          19 / 20 AGENTS VERIFIED HONEST
        </span>
      </div>

      <LinkRow links={[
        { label: 'OpenClaw Skill', url: '/SKILL.md' },
        { label: 'Detection Report', url: report.lighthouse_gateway },
      ]} />
    </div>
  )
}
