import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { voiceEngine, type VoiceEngine } from './voiceEngine'
import { parseVoiceIntent, type VoiceIntent } from './commandRouter'

interface VoiceContextValue {
  isListening: boolean
  isSupported: boolean
  transcript: string
  lastError: string | null
  startListening: () => void
  stopListening: () => void

  submitTranscript: (text: string) => void
}

const VoiceContext = createContext<VoiceContextValue | undefined>(undefined)

export function VoiceProvider({
  children,
  onIntent,
  engine = voiceEngine,
}: {
  children: ReactNode
  onIntent: (intent: VoiceIntent) => void
  engine?: VoiceEngine
}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)
  const onIntentRef = useRef(onIntent)
  onIntentRef.current = onIntent

  const submitTranscript = useCallback((text: string) => {
    setTranscript(text)
    setLastError(null)
    const intent = parseVoiceIntent(text)
    onIntentRef.current(intent)
  }, [])

  const startListening = useCallback(() => {
    if (!engine.isSupported()) {
      setLastError('Voice input is not supported on this device. Use spacebar or tap to enter a command instead.')
      return
    }
    setLastError(null)
    setIsListening(true)
    engine.start({
      onResult: (text, isFinal) => {
        setTranscript(text)
        if (isFinal && text.trim()) {
          const intent = parseVoiceIntent(text)
          onIntentRef.current(intent)
        }
      },
      onError: (message) => {
        setLastError(message)
        setIsListening(false)
      },
      onEnd: () => setIsListening(false),
    })
  }, [engine])

  const stopListening = useCallback(() => {
    engine.stop()
    setIsListening(false)
  }, [engine])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (event.code === 'Space' && !isTypingField && !isListening) {
        event.preventDefault()
        startListening()
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (event.code === 'Space' && !isTypingField && isListening) {
        event.preventDefault()
        stopListening()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isListening, startListening, stopListening])

  const value = useMemo<VoiceContextValue>(
    () => ({
      isListening,
      isSupported: engine.isSupported(),
      transcript,
      lastError,
      startListening,
      stopListening,
      submitTranscript,
    }),
    [isListening, engine, transcript, lastError, startListening, stopListening, submitTranscript],
  )

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be used within a VoiceProvider')
  return ctx
}
