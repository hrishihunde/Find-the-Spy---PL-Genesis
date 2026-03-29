import { useEffect, useState } from 'react'
import { LinkRow } from '../components/LinkButton'
import { useWorldId } from '../hooks/useWorldId'
import { MiniKit } from '@worldcoin/minikit-js'
import type { Tab } from '../App'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

interface WorldIdScreenProps {
  navigate: (tab: Tab) => void
}

// ── World ID Orb ─────────────────────────────────────────────────────────────

const WorldIdOrb = () => (
  <svg width="190" height="190" viewBox="0 0 190 190" style={{ display: 'block', margin: '0 auto' }}>
    <g transform="translate(95, 95)">
      <circle r="72" fill="none" stroke="#C2522B" strokeWidth="0.8" opacity="0.15" strokeDasharray="6 4" />
      <circle r="55" fill="none" stroke="#C2522B" strokeWidth="1" opacity="0.25" />
      <circle r="38" fill="none" stroke="#C2522B" strokeWidth="1.5" opacity="0.4" />
      <circle r="22" fill="rgba(194,82,43,0.06)" stroke="#C2522B" strokeWidth="2" opacity="0.6" />
      <line x1="0" y1="-72" x2="0" y2="-56" stroke="#C2522B" strokeWidth="1" opacity="0.3" />
      <line x1="0" y1="56"  x2="0" y2="72"  stroke="#C2522B" strokeWidth="1" opacity="0.3" />
      <line x1="-72" y1="0" x2="-56" y2="0" stroke="#C2522B" strokeWidth="1" opacity="0.3" />
      <line x1="56"  y1="0" x2="72"  y2="0" stroke="#C2522B" strokeWidth="1" opacity="0.3" />
      <g style={{ '--r': '72px', transformOrigin: '0 0', animation: 'orbit 12s linear infinite' } as React.CSSProperties}>
        <circle r="2.5" fill="#C2522B" opacity="0.3" />
      </g>
      <g style={{ '--r': '55px', transformOrigin: '0 0', animation: 'orbit 6s linear infinite' } as React.CSSProperties}>
        <circle r="4" fill="#C2522B" opacity="0.55" />
      </g>
      <g style={{ '--r': '38px', transformOrigin: '0 0', animation: 'orbit 9s linear infinite reverse' } as React.CSSProperties}>
        <circle r="3" fill="#C2522B" opacity="0.38" />
      </g>
      <circle cx="22"  cy="0"  r="2" fill="#C2522B" opacity="0.35" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <circle cx="-22" cy="0"  r="2" fill="#C2522B" opacity="0.35" style={{ animation: 'pulse 1.5s ease-in-out 0.5s infinite' }} />
      <circle cx="0"   cy="22" r="2" fill="#C2522B" opacity="0.35" style={{ animation: 'pulse 1.5s ease-in-out 1s infinite' }} />
      <circle r="8" fill="#C2522B" opacity="0.85" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
    </g>
  </svg>
)

// ── Member tree ───────────────────────────────────────────────────────────────

const MemberTree = () => (
  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
    {[
      { id: 'M1', count: '×7', spy: false },
      { id: 'M2', count: '×6', spy: false },
      { id: 'M3', count: '×6', spy: false },
      { id: 'M4', count: '×1', spy: true },
    ].map(m => (
      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: m.spy ? 'rgba(231,76,60,0.08)' : 'rgba(194,82,43,0.06)',
          border: `1.5px solid ${m.spy ? '#E74C3C' : '#C2522B'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {m.spy ? (
              <>
                <circle cx="11" cy="8" r="4" stroke="#E74C3C" strokeWidth="1.3" />
                <line x1="8" y1="5" x2="14" y2="11" stroke="#E74C3C" strokeWidth="1.3" />
                <line x1="14" y1="5" x2="8" y2="11" stroke="#E74C3C" strokeWidth="1.3" />
              </>
            ) : (
              <>
                <circle cx="11" cy="8" r="3.5" stroke="#C2522B" strokeWidth="1.3" />
                <path d="M5 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#C2522B" strokeWidth="1.3" strokeLinecap="round" />
              </>
            )}
          </svg>
        </div>
        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, fontWeight: 600, color: m.spy ? '#E74C3C' : '#C2522B' }}>{m.id}</span>
        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: m.spy ? '#E74C3C' : '#9B9590', animation: 'float 3s ease-in-out infinite' }}>{m.count}</span>
        {m.spy && <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 8, fontWeight: 600, color: '#E74C3C', letterSpacing: '0.5px' }}>SPY</span>}
      </div>
    ))}
  </div>
)

// ── Screen ────────────────────────────────────────────────────────────────────

type Mode = 'idle' | 'live-pending' | 'sim-pending'

export default function WorldIdScreen({ navigate }: WorldIdScreenProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [nullifierHash, setNullifierHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agentCreated, setAgentCreated] = useState(false)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const { verify } = useWorldId()

  useEffect(() => {
    const checkInstalled = () => {
      if (MiniKit.isInstalled()) {
        setIsInstalled(true);
      }
    };
    const timeout = setTimeout(checkInstalled, 500);
    return () => clearTimeout(timeout);
  }, []);

  const handleLive = async () => {
    if (!isInstalled) {
      setError("Please open this app inside the World App to verify.");
      return;
    }
    setError(null)
    setMode('live-pending')
    const result = await verify()
    setMode('idle')
    if (result.success) {
      setNullifierHash(result.nullifierHash || '0x7f...d41e')
    } else {
      setError(result.error || 'Verification failed or was cancelled.')
    }
  }

  const handleSimulate = async () => {
    setError(null)
    setMode('sim-pending')
    const result = await verify(true)
    setMode('idle')
    if (result.success) {
      setNullifierHash(result.nullifierHash || '0x7f...d41e')
    } else {
      setError(result.error || 'Verification failed')
    }
  }

  const handleInitAgent = async () => {
    if (!nullifierHash) return;
    try {
      const kp = nacl.sign.keyPair();
      const agentPubKey = bs58.encode(kp.publicKey);
      const newAgentId = `did:oasis:${agentPubKey}`;
      setAgentCreated(true);
      setAgentId(newAgentId);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize agent keys');
    }
  }

  const verifying = mode !== 'idle'

  return (
    <div className="flex-column" style={{ width: '100%' }}>
      {error && (
        <div className="glass-card animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ color: '#ef4444', margin: 0, textAlign: 'center' }}>{error}</p>
        </div>
      )}
      <div className="screen-label">01 — Identity Layer</div>
      <div className="screen-title">Verify to Deploy</div>
      <div className="screen-topic">Iran-Israel-USA Conflict</div>

      {!nullifierHash ? (
        <>
          <div style={{ margin: '4px 0 10px' }}>
            <WorldIdOrb />
          </div>

          {/* Nullifier hash */}
          <div style={{
            background: 'rgba(194,82,43,0.06)', border: '1px solid rgba(194,82,43,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          }}>
            <div className="card-label">Nullifier Hash</div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 13, color: '#C2522B', letterSpacing: '1px' }}>
              0x7f2a...d41e
            </div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#9B9590', marginTop: 3 }}>
              ERC-8004 REGISTRY — Ethereum Sepolia
            </div>
          </div>

          {/* Member tree */}
          <div style={{
            background: 'rgba(194,82,43,0.03)', border: '1px solid rgba(194,82,43,0.1)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            <div className="card-label" style={{ marginBottom: 10 }}>4 Humans → 20 Agents</div>
            <MemberTree />
          </div>

          {/* Link buttons */}
          <LinkRow links={[
            { label: 'World ID', url: 'https://worldcoin.org' },
            { label: 'ERC-8004 Registry', url: 'https://sepolia.etherscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e' },
          ]} />

          {/* Primary CTA — Live World ID */}
          <button
            onClick={handleLive}
            disabled={verifying || !isInstalled}
            style={{
              width: '100%', marginTop: 12, padding: '14px',
              background: mode === 'live-pending' ? 'rgba(194,82,43,0.6)' : '#C2522B',
              color: '#FFFFFF', border: 'none', borderRadius: 12,
              fontFamily: "'Space Mono', monospace", fontWeight: 700,
              fontSize: 14, letterSpacing: '1.5px', textTransform: 'uppercase',
              cursor: verifying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {mode === 'live-pending' ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #FFFFFF', display: 'inline-block',
                  animation: 'radarSweep 0.8s linear infinite',
                }} />
                Scanning…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="1" opacity="0.7" />
                  <circle cx="8" cy="8" r="1.8" fill="white" opacity="0.9" />
                </svg>
                Verify with World ID
              </>
            )}
          </button>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', textAlign: 'center', marginTop: 5 }}>
            Opens World App · Orb-verified
          </div>

          {/* Secondary — Simulate */}
          <button
            onClick={handleSimulate}
            disabled={verifying}
            style={{
              width: '100%', marginTop: 10, padding: '12px',
              background: 'transparent',
              color: mode === 'sim-pending' ? '#C2522B' : '#9B9590',
              border: `1.5px solid ${mode === 'sim-pending' ? 'rgba(194,82,43,0.5)' : 'rgba(155,149,144,0.3)'}`,
              borderRadius: 12,
              fontFamily: "'Space Mono', monospace", fontWeight: 700,
              fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase',
              cursor: verifying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {mode === 'sim-pending' ? (
              <>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(194,82,43,0.3)',
                  borderTop: '2px solid #C2522B', display: 'inline-block',
                  animation: 'radarSweep 0.8s linear infinite',
                }} />
                Simulating…
              </>
            ) : (
              'Simulate for demo'
            )}
          </button>
        </>
      ) : (
        <div className="animate-fade-in flex-column gap-4" style={{ marginTop: 10 }}>
          <div style={{
            background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.3)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          }}>
            <div className="card-label" style={{ color: '#27AE60', marginBottom: 4 }}>Verified Human</div>
            <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: '#27AE60', letterSpacing: '0.5px', wordBreak: 'break-all' }}>
              {nullifierHash.length > 20 ? `${nullifierHash.substring(0, 16)}...` : nullifierHash}
            </div>
          </div>

          <button
            onClick={handleInitAgent}
            disabled={agentCreated}
            style={{
              width: '100%', padding: '14px',
              background: agentCreated ? 'rgba(39,174,96,0.1)' : '#C2522B',
              color: agentCreated ? '#27AE60' : '#FFFFFF', 
              border: agentCreated ? '1px solid rgba(39,174,96,0.3)' : 'none', 
              borderRadius: 12,
              fontFamily: "'Space Mono', monospace", fontWeight: 700,
              fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase',
              cursor: agentCreated ? 'default' : 'pointer',
            }}
          >
            {agentCreated ? 'Delegation Active' : 'Initialize Agent'}
          </button>

          {agentCreated && agentId && (
            <div className="animate-fade-in" style={{ marginTop: 16 }}>
              <div style={{
                background: 'rgba(194,82,43,0.06)', border: '1px solid rgba(194,82,43,0.2)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              }}>
                <div className="card-label">Agent ID (DID:OASIS)</div>
                <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: '#C2522B', wordBreak: 'break-all', marginTop: 4 }}>
                  {agentId}
                </div>
              </div>
              
              <button
                onClick={() => navigate('agent')}
                style={{
                  width: '100%', padding: '12px', background: 'transparent', color: '#1A1A1F',
                  border: '1px solid rgba(26,26,31,0.2)', borderRadius: 12,
                  fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                View Agent Profile →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
