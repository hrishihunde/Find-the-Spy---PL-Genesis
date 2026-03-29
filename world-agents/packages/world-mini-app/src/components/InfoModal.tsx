interface InfoModalProps {
  onClose: () => void
}

const components = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#C2522B" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="5" stroke="#C2522B" strokeWidth="1" opacity="0.5" />
        <circle cx="10" cy="10" r="2.5" fill="#C2522B" opacity="0.7" />
      </svg>
    ),
    name: 'World ID',
    tagline: 'Proof of personhood',
    desc: 'Sybil-resistant biometric identity — one verified human, one nullifier hash, no duplicates.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#C2522B" strokeWidth="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="#C2522B" strokeWidth="1.5" />
        <rect x="7" y="11" width="6" height="6" rx="1.5" stroke="#C2522B" strokeWidth="1.5" />
        <line x1="6" y1="6" x2="11" y2="6" stroke="#C2522B" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="9" x2="10" y2="11" stroke="#C2522B" strokeWidth="1" opacity="0.5" />
        <line x1="14" y1="9" x2="14" y2="11" stroke="#C2522B" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
    name: 'ERC-8004',
    tagline: 'On-chain agent registry',
    desc: 'Every AI agent is an NFT token on Ethereum Sepolia, binding its actions to a human deployer.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="13" width="3" height="5" rx="1" fill="#C2522B" opacity="0.6" />
        <rect x="7" y="9" width="3" height="9" rx="1" fill="#C2522B" opacity="0.75" />
        <rect x="12" y="5" width="3" height="13" rx="1" fill="#C2522B" opacity="0.9" />
        <path d="M3 10 L8 7 L13 4" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    name: 'OASIS',
    tagline: 'Multi-agent simulation',
    desc: '20 GPT-4.1-mini agents simulate an Iran-Israel-USA crisis over 10 cycles, 147 posts, 312 actions.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#C2522B" strokeWidth="1.3" opacity="0.3" />
        <circle cx="10" cy="10" r="4.5" stroke="#C2522B" strokeWidth="1.3" opacity="0.5" />
        <circle cx="10" cy="10" r="2" stroke="#C2522B" strokeWidth="1.3" />
        <line x1="10" y1="3" x2="10" y2="5.5" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="10" y1="14.5" x2="10" y2="17" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="3" y1="10" x2="5.5" y2="10" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="14.5" y1="10" x2="17" y2="10" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    name: 'OpenClaw',
    tagline: 'Misinformation detection',
    desc: 'Claude Opus fact-checks every post against 11 ground truths, flags agents with 2+ fabrications.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L14 6 L14 10 C14 13.3 12.2 16.1 10 17.5 C7.8 16.1 6 13.3 6 10 L6 6 Z" stroke="#C2522B" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 10 L9.5 11.5 L12 8.5" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: 'IPFS / Lighthouse',
    tagline: 'Immutable evidence',
    desc: 'Detection reports, cycle data, and cleansed corpus are pinned to Filecoin via Lighthouse — permanent and verifiable.',
  },
]

export default function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: '#F5F0E8', display: 'flex', flexDirection: 'column',
      borderRadius: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 10px',
        borderBottom: '1px solid rgba(194,82,43,0.1)',
      }}>
        <div>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>
            System Components
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, color: '#1A1A1F' }}>
            How it Works
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(194,82,43,0.06)', border: '1px solid rgba(194,82,43,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="#C2522B" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Component rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {components.map((c, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: '14px 0',
            borderBottom: i < components.length - 1 ? '1px solid rgba(194,82,43,0.08)' : 'none',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(194,82,43,0.06)', border: '1px solid rgba(194,82,43,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, color: '#1A1A1F' }}>
                  {c.name}
                </span>
                <span style={{
                  fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#C2522B',
                  background: 'rgba(194,82,43,0.08)', border: '1px solid rgba(194,82,43,0.2)',
                  borderRadius: 4, padding: '1px 6px', fontWeight: 600, letterSpacing: '0.5px',
                }}>
                  {c.tagline}
                </span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#4A4640', lineHeight: 1.5 }}>
                {c.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Flow diagram */}
        <div style={{
          marginTop: 16, padding: '12px 14px',
          background: 'rgba(194,82,43,0.04)', border: '1px solid rgba(194,82,43,0.12)',
          borderRadius: 10,
        }}>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            End-to-end flow
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {['Human', 'World ID', 'ERC-8004', 'OASIS Sim', 'OpenClaw', 'IPFS'].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600,
                  color: '#C2522B', background: 'rgba(194,82,43,0.08)',
                  border: '1px solid rgba(194,82,43,0.2)', borderRadius: 4, padding: '2px 6px',
                }}>
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4H9M6 1L9 4L6 7" stroke="#C2522B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
