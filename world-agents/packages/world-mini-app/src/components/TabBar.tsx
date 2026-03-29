import React from 'react'
import type { Tab } from '../App'

interface TabBarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
  {
    id: 'worldid',
    label: 'ID',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="9" />
        <circle cx="11" cy="11" r="4" />
        <circle cx="11" cy="11" r="1" fill="currentColor" stroke="none" />
        <line x1="11" y1="2" x2="11" y2="5" />
        <line x1="11" y1="17" x2="11" y2="20" />
        <line x1="2" y1="11" x2="5" y2="11" />
        <line x1="17" y1="11" x2="20" y2="11" />
      </svg>
    ),
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="16" height="18" rx="3" />
        <circle cx="11" cy="9" r="3" />
        <path d="M7 18c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      </svg>
    ),
  },
  {
    id: 'simulation',
    label: 'Sim',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="8" height="8" rx="1.5" />
        <rect x="12" y="2" width="8" height="8" rx="1.5" />
        <rect x="2" y="12" width="8" height="8" rx="1.5" />
        <rect x="12" y="12" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'detection',
    label: 'Detect',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7" />
        <line x1="15.5" y1="15.5" x2="20" y2="20" strokeWidth="2" />
        <line x1="10" y1="7" x2="10" y2="13" />
        <line x1="7" y1="10" x2="13" y2="10" />
      </svg>
    ),
  },
  {
    id: 'trace',
    label: 'Trace',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="4" cy="11" r="2.5" />
        <circle cx="11" cy="11" r="2.5" />
        <circle cx="18" cy="11" r="2.5" />
        <line x1="6.5" y1="11" x2="8.5" y2="11" />
        <line x1="13.5" y1="11" x2="15.5" y2="11" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
        <line x1="7" y1="9" x2="15" y2="9" />
        <line x1="7" y1="13" x2="11" y2="13" />
      </svg>
    ),
  },
]

const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => (
  <div className="bottom-tab-bar">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
        aria-label={tab.label}
      >
        <span className="tab-icon">{tab.icon}</span>
        <span className="tab-label">{tab.label}</span>
        <span className="tab-indicator" />
      </button>
    ))}
  </div>
)

export default TabBar
