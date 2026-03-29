import { useState } from 'react'
import TabBar from './components/TabBar'
import InfoModal from './components/InfoModal'
import WorldIdScreen from './screens/WorldIdScreen'
import AgentScreen from './screens/AgentScreen'
import SimulationScreen from './screens/SimulationScreen'
import DetectionScreen from './screens/DetectionScreen'
import TraceScreen from './screens/TraceScreen'
import ChatScreen from './screens/ChatScreen'

export type Tab = 'worldid' | 'agent' | 'simulation' | 'detection' | 'trace' | 'chat'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('worldid')
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      {/* Top bar with info button */}
      <div style={{
        height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 14px', flexShrink: 0,
        borderBottom: '1px solid rgba(194,82,43,0.08)',
      }}>
        <div style={{ flex: 1, fontFamily: "'Source Code Pro', monospace", fontSize: 9, color: '#9B9590', letterSpacing: '1px' }}>
          FIND THE SPY
        </div>
        <button
          onClick={() => setShowInfo(true)}
          title="How it works"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(194,82,43,0.06)', border: '1.5px solid rgba(194,82,43,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Space Mono', monospace",
            fontWeight: 700, fontSize: 13, color: '#C2522B',
          }}
        >
          i
        </button>
      </div>

      <div className="screen-container">
        {activeTab === 'worldid'    && <WorldIdScreen navigate={setActiveTab} />}
        {activeTab === 'agent'      && <AgentScreen />}
        {activeTab === 'simulation' && <SimulationScreen />}
        {activeTab === 'detection'  && <DetectionScreen />}
        {activeTab === 'trace'      && <TraceScreen />}
        {activeTab === 'chat'       && <ChatScreen />}
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  )
}
