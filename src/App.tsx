import { useCallback, useState } from 'react'
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext'
import { SystemStatusProvider } from './context/SystemStatusContext'
import { VoiceProvider } from './features/voice/VoiceProvider'
import type { VoiceEngine } from './features/voice/voiceEngine'
import type { TtsAdapter } from './services/ttsAdapter'
import type { BrailleOutputAdapter } from './services/brailleAdapter'
import type { VoiceIntent } from './features/voice/commandRouter'
import { useTransferFlow } from './features/transfer/useTransferFlow'
import type { BeaconRequest } from './app/beaconRequest'
import { DashboardScreen } from './screens/DashboardScreen'
import { ScamGuardianScreen } from './screens/ScamGuardianScreen'
import { TransferScreen } from './screens/TransferScreen'
import { VoiceControlBar } from './components/VoiceControlBar'
import { TypedCommandInput } from './components/TypedCommandInput'
import { PrivacyToggle } from './components/PrivacyToggle'
import { DemoControls } from './components/DemoControls'
import './index.css'

type Screen = 'dashboard' | 'scamGuardian' | 'transfer'

const PRIMARY_ACCOUNT_ID = 'acc-current-001'
const PRIMARY_ACCOUNT_NICKNAME = 'Everyday Current Account'

const HELP_TEXT =
  'You can say: "what\'s my balance", "recent transactions", "what does overdraft mean", ' +
  '"check this message for scams", "pay 20 pounds to Amara", "confirm", "cancel", ' +
  '"privacy mode", or "go home".'

function AppShell({ engine }: { engine?: VoiceEngine }) {
  const { announce, privacyMode, setPrivacyMode } = useAccessibility()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [beaconRequest, setBeaconRequest] = useState<BeaconRequest | null>(null)
  const [scamDictation, setScamDictation] = useState<string | undefined>(undefined)
  const flow = useTransferFlow(PRIMARY_ACCOUNT_ID, PRIMARY_ACCOUNT_NICKNAME)

  const handleIntent = useCallback(
    (intent: VoiceIntent) => {
      switch (intent.type) {
        case 'CHECK_BALANCE':
          setScreen('dashboard')
          setBeaconRequest({ type: 'balance', nonce: Date.now() })
          break
        case 'RECENT_TRANSACTIONS':
          setScreen('dashboard')
          setBeaconRequest({ type: 'transactions', nonce: Date.now() })
          break
        case 'CLARIFY_TERM':
          setScreen('dashboard')
          setBeaconRequest({ type: 'clarify', term: intent.term, nonce: Date.now() })
          break
        case 'OPEN_SCAM_GUARDIAN':
          setScreen('scamGuardian')
          setScamDictation(intent.dictatedText)
          break
        case 'START_TRANSFER':
          setScreen('transfer')
          flow.startTransfer({ amount: intent.amount, payeeName: intent.payeeName })
          break
        case 'CONFIRM':
          if (screen === 'transfer') flow.confirm()
          break
        case 'CANCEL':
          if (screen === 'transfer') flow.cancel()
          break
        case 'TOGGLE_PRIVACY': {
          const next = !privacyMode
          setPrivacyMode(next)
          announce({ text: `Privacy mode ${next ? 'on' : 'off'}.`, priority: 'polite' })
          break
        }
        case 'GO_HOME':
          setScreen('dashboard')
          break
        case 'HELP':
          announce({ text: HELP_TEXT, priority: 'polite' })
          break
        case 'UNKNOWN':
          announce({
            text: "Sorry, I didn't understand that. Say \"help\" to hear what you can say.",
            priority: 'assertive',
          })
          break
      }
    },
    [screen, flow, privacyMode, setPrivacyMode, announce],
  )

  return (
    <VoiceProvider onIntent={handleIntent} engine={engine}>
      <div className="app-shell">
        <header className="app-header">
          <h1>Lighthouse</h1>
          <PrivacyToggle />
        </header>

        <nav aria-label="Screens" className="screen-nav">
          <button
            type="button"
            aria-current={screen === 'dashboard' ? 'page' : undefined}
            onClick={() => setScreen('dashboard')}
          >
            Beacon
          </button>
          <button
            type="button"
            aria-current={screen === 'scamGuardian' ? 'page' : undefined}
            onClick={() => setScreen('scamGuardian')}
          >
            Scam Guardian
          </button>
          <button
            type="button"
            aria-current={screen === 'transfer' ? 'page' : undefined}
            onClick={() => setScreen('transfer')}
          >
            Send Payment
          </button>
        </nav>

        <VoiceControlBar />
        <TypedCommandInput />

        <main>
          {screen === 'dashboard' && (
            <DashboardScreen accountId={PRIMARY_ACCOUNT_ID} beaconRequest={beaconRequest} />
          )}
          {screen === 'scamGuardian' && <ScamGuardianScreen initialText={scamDictation} />}
          {screen === 'transfer' && <TransferScreen flow={flow} />}
        </main>

        <DemoControls />
      </div>
    </VoiceProvider>
  )
}

export interface AppProps {
  tts?: TtsAdapter
  braille?: BrailleOutputAdapter
  engine?: VoiceEngine
}

export default function App({ tts, braille, engine }: AppProps = {}) {
  return (
    <AccessibilityProvider tts={tts} braille={braille}>
      <SystemStatusProvider>
        <AppShell engine={engine} />
      </SystemStatusProvider>
    </AccessibilityProvider>
  )
}
