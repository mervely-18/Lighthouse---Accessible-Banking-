import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { brailleAdapter, type BrailleOutputAdapter } from '../services/brailleAdapter'
import { ttsAdapter, type TtsAdapter } from '../services/ttsAdapter'

export type LivePriority = 'polite' | 'assertive'

export interface Announcement {
  text: string

  maskedText?: string

  sensitive?: boolean
  priority?: LivePriority
}

interface AccessibilityContextValue {
  privacyMode: boolean
  togglePrivacyMode: () => void
  setPrivacyMode: (value: boolean) => void
  brailleConnected: boolean
  connectBraille: () => Promise<void>
  disconnectBraille: () => void
  announce: (announcement: Announcement) => void
  liveRegionText: string
  livePriority: LivePriority
  lastBrailleMessage: string | null
  audioSuppressed: boolean
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined)

const DEFAULT_MASKED_MESSAGE = 'Sensitive details are hidden. Check your connected Braille display.'

export function AccessibilityProvider({
  children,
  tts = ttsAdapter,
  braille = brailleAdapter,
}: {
  children: ReactNode
  tts?: TtsAdapter
  braille?: BrailleOutputAdapter
}) {
  const [privacyMode, setPrivacyModeState] = useState(false)
  const [brailleConnected, setBrailleConnected] = useState(braille.isConnected())
  const [liveRegionText, setLiveRegionText] = useState('')
  const [livePriority, setLivePriority] = useState<LivePriority>('polite')
  const [lastBrailleMessage, setLastBrailleMessage] = useState<string | null>(null)
  const [audioSuppressed, setAudioSuppressed] = useState(false)

  const togglePrivacyMode = useCallback(() => setPrivacyModeState((v) => !v), [])
  const setPrivacyMode = useCallback((value: boolean) => setPrivacyModeState(value), [])

  const connectBraille = useCallback(async () => {
    await braille.connect()
    setBrailleConnected(braille.isConnected())
  }, [braille])

  const disconnectBraille = useCallback(() => {
    braille.disconnect()
    setBrailleConnected(braille.isConnected())
  }, [braille])

  const announce = useCallback(
    ({ text, maskedText, sensitive = false, priority = 'polite' }: Announcement) => {
      braille.send(text)
      setLastBrailleMessage(braille.getLastMessage())

      const mustHide = sensitive && privacyMode
      const spokenAndDisplayedText = mustHide ? (maskedText ?? DEFAULT_MASKED_MESSAGE) : text

      setLiveRegionText(spokenAndDisplayedText)
      setLivePriority(priority)
      setAudioSuppressed(mustHide)

      if (!mustHide) {
        tts.speak(spokenAndDisplayedText)
      }
    },
    [braille, privacyMode, tts],
  )

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      privacyMode,
      togglePrivacyMode,
      setPrivacyMode,
      brailleConnected,
      connectBraille,
      disconnectBraille,
      announce,
      liveRegionText,
      livePriority,
      lastBrailleMessage,
      audioSuppressed,
    }),
    [
      privacyMode,
      togglePrivacyMode,
      setPrivacyMode,
      brailleConnected,
      connectBraille,
      disconnectBraille,
      announce,
      liveRegionText,
      livePriority,
      lastBrailleMessage,
      audioSuppressed,
    ],
  )

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div aria-live={livePriority} role="status" className="sr-only">
        {liveRegionText}
      </div>
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider')
  return ctx
}
