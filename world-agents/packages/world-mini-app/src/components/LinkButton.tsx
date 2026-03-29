import React from 'react'

interface LinkButtonProps {
  label: string
  url: string
}

const LinkButton: React.FC<LinkButtonProps> = ({ label, url }) => (
  <button
    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 10px',
      background: 'rgba(194,82,43,0.06)',
      border: '1px solid rgba(194,82,43,0.25)',
      borderRadius: 6,
      fontFamily: "'Source Code Pro', monospace",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.5px',
      color: '#C2522B',
      cursor: 'pointer',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}
  >
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 9L9 1M9 1H4M9 1V6" stroke="#C2522B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label}
  </button>
)

export interface LinkRowProps {
  links: { label: string; url: string }[]
}

export const LinkRow: React.FC<LinkRowProps> = ({ links }) => (
  <div style={{
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '10px 0 4px',
    WebkitOverflowScrolling: 'touch',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
  }}>
    {links.map(link => (
      <LinkButton key={link.label} label={link.label} url={link.url} />
    ))}
  </div>
)

export default LinkButton
