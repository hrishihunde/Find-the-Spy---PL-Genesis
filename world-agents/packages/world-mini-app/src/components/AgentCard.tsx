import React from 'react'

interface AgentCardProps {
  name: string
  role: string
  trustScore: number
  postCount: number
  deployer: string
  tokenId: number
  knowledgeBase: string
  tags: string[]
  recentActivity?: string
}

const StatCircle: React.FC<{ value: string | number; label: string; filled?: boolean }> = ({
  value,
  label,
  filled = false,
}) => {
  const r = 26
  const circumference = 2 * Math.PI * r
  const fraction = filled ? (Number(value) / 100) * 0.75 : 0
  const dashArray = `${fraction * circumference} ${circumference}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke="rgba(194,82,43,0.15)"
          strokeWidth="3"
        />
        {filled && (
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke="#C2522B"
            strokeWidth="3"
            strokeDasharray={dashArray}
            strokeDashoffset={circumference * 0.125}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        )}
        <text
          x="32" y="37"
          textAnchor="middle"
          fontFamily="'Space Mono', monospace"
          fontSize="14"
          fontWeight="700"
          fill="#1A1A1F"
        >
          {value}
        </text>
      </svg>
      <span style={{
        fontFamily: "'Source Code Pro', monospace",
        fontSize: '9px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#9B9590',
      }}>
        {label}
      </span>
    </div>
  )
}

const AgentCard: React.FC<AgentCardProps> = ({
  name,
  role,
  trustScore,
  postCount,
  deployer,
  tokenId,
  knowledgeBase,
  tags,
  recentActivity,
}) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(194,82,43,0.15)',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
    }}>
      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(194,82,43,0.06)',
            border: '2px solid #C2522B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="10" r="5" stroke="#C2522B" strokeWidth="1.5" />
              <path d="M6 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#C2522B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {/* Verified badge */}
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(39,174,96,0.15)',
            border: '1.5px solid #27AE60',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="#27AE60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 16,
            color: '#1A1A1F',
            letterSpacing: '0.5px',
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 11,
            color: '#9B9590',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            {role}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
        <StatCircle value={trustScore} label="Trust" filled />
        <StatCircle value={postCount} label="Posts" />
        <StatCircle value={deployer} label="Deployer" />
      </div>

      {/* Info boxes */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          background: 'rgba(194,82,43,0.04)',
          border: '1px solid rgba(194,82,43,0.15)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 8,
        }}>
          <div className="card-label">ERC-8004 Token</div>
          <div style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 12,
            color: '#1A1A1F',
          }}>
            Token #{tokenId} • bound via World ID • Ethereum Sepolia
          </div>
        </div>
        <div style={{
          background: 'rgba(194,82,43,0.04)',
          border: '1px solid rgba(194,82,43,0.15)',
          borderRadius: 8,
          padding: '8px 12px',
        }}>
          <div className="card-label">Knowledge Base</div>
          <div style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 12,
            color: '#1A1A1F',
          }}>
            {knowledgeBase}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {tags.map(tag => (
          <span
            key={tag}
            className={tag === 'VERIFIED' ? 'tag tag-verified' : 'tag tag-orange'}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Deployer chain */}
      <div style={{ marginBottom: recentActivity ? 14 : 0 }}>
        <div className="card-label" style={{ marginBottom: 8 }}>Deployer Chain</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {['HUMAN', 'WORLD ID', 'NULLIFIER', 'ERC-8004', 'AGENT'].map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(194,82,43,0.06)',
                  border: '1.5px solid #C2522B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, color: '#C2522B', fontWeight: 700 }}>{i + 1}</span>
                </div>
                <span style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 7,
                  color: '#9B9590',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  maxWidth: 36,
                  lineHeight: 1.2,
                }}>
                  {step}
                </span>
              </div>
              {i < 4 && (
                <div style={{ flex: 1, height: 1, background: 'rgba(194,82,43,0.3)', margin: '0 2px', marginBottom: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity && (
        <div style={{
          background: 'rgba(194,82,43,0.03)',
          border: '1px solid rgba(194,82,43,0.1)',
          borderRadius: 8,
          padding: '8px 12px',
        }}>
          <div className="card-label">Recent Activity</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontStyle: 'italic',
            color: '#6B6560',
            lineHeight: 1.5,
          }}>
            "{recentActivity}"
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentCard
