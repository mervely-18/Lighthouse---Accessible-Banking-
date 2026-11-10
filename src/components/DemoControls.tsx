import { useAccessibility } from '../context/AccessibilityContext'
import { useSystemStatus } from '../context/SystemStatusContext'

export function DemoControls() {
  const { aiOnline, setAiOnline, networkOnline, setNetworkOnline } = useSystemStatus()
  const { brailleConnected, connectBraille, disconnectBraille, lastBrailleMessage } = useAccessibility()

  return (
    <section className="demo-controls" aria-label="Demo and testing controls">
      <h2>Simulate conditions</h2>
      <label>
        <input type="checkbox" checked={aiOnline} onChange={(e) => setAiOnline(e.target.checked)} />
        Beacon AI online
      </label>
      <label>
        <input
          type="checkbox"
          checked={networkOnline}
          onChange={(e) => setNetworkOnline(e.target.checked)}
        />
        Network connected
      </label>
      <label>
        <input
          type="checkbox"
          checked={brailleConnected}
          onChange={(e) => (e.target.checked ? connectBraille() : disconnectBraille())}
        />
        Braille display connected
      </label>
      {brailleConnected && (
        <p className="demo-controls__braille">
          <strong>Braille output:</strong> {lastBrailleMessage ?? '(nothing sent yet)'}
        </p>
      )}
    </section>
  )
}
