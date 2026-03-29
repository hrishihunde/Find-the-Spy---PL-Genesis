import React from 'react'

interface StatusBadgeProps {
  variant: 'verified' | 'flagged' | 'pending'
  label?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label }) => {
  const defaults = {
    verified: 'VERIFIED',
    flagged: 'FLAGGED',
    pending: 'PENDING',
  }

  const styles: Record<string, React.CSSProperties> = {
    verified: {
      background: 'rgba(39,174,96,0.1)',
      color: '#27AE60',
      border: '1px solid rgba(39,174,96,0.3)',
    },
    flagged: {
      background: 'rgba(231,76,60,0.08)',
      color: '#E74C3C',
      border: '1px solid rgba(231,76,60,0.3)',
    },
    pending: {
      background: 'rgba(194,82,43,0.08)',
      color: '#C2522B',
      border: '1px solid rgba(194,82,43,0.25)',
    },
  }

  return (
    <span
      style={{
        ...styles[variant],
        fontFamily: "'Source Code Pro', monospace",
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '1px',
        padding: '3px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
    >
      {label ?? defaults[variant]}
    </span>
  )
}

export default StatusBadge
