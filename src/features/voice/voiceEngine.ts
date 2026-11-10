export interface VoiceEngineHandlers {
  onResult: (transcript: string, isFinal: boolean) => void
  onError: (message: string) => void
  onEnd?: () => void
}

export interface VoiceEngine {
  isSupported(): boolean
  start(handlers: VoiceEngineHandlers): void
  stop(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
}

class WebSpeechVoiceEngine implements VoiceEngine {
  private recognition: SpeechRecognitionLike | null = null

  isSupported(): boolean {
    return Boolean(getSpeechRecognitionCtor())
  }

  start(handlers: VoiceEngineHandlers): void {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      handlers.onError('Voice input is not supported on this device.')
      return
    }

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onresult = (event: any) => {
      const resultIndex = event.resultIndex ?? event.results.length - 1
      const result = event.results[resultIndex]
      const transcript = result[0].transcript
      handlers.onResult(transcript, result.isFinal)
    }

    recognition.onerror = (event: any) => {
      handlers.onError(event?.error ?? 'Unrecognized voice input. Please try again.')
    }

    recognition.onend = () => handlers.onEnd?.()

    this.recognition = recognition
    recognition.start()
  }

  stop(): void {
    this.recognition?.stop()
    this.recognition = null
  }
}

export const voiceEngine: VoiceEngine = new WebSpeechVoiceEngine()
