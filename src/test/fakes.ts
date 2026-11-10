import type { TtsAdapter } from '../services/ttsAdapter'
import type { BrailleOutputAdapter } from '../services/brailleAdapter'
import type { VoiceEngine, VoiceEngineHandlers } from '../features/voice/voiceEngine'

export class FakeTtsAdapter implements TtsAdapter {
  spoken: string[] = []
  cancelled = 0

  isSupported(): boolean {
    return true
  }

  speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): void {
    this.spoken.push(text)
    opts.onEnd?.()
  }

  cancel(): void {
    this.cancelled += 1
  }

  get lastSpoken(): string | undefined {
    return this.spoken[this.spoken.length - 1]
  }
}

export class FakeBrailleAdapter implements BrailleOutputAdapter {
  private connected: boolean
  messages: string[] = []

  constructor(startConnected = true) {
    this.connected = startConnected
  }

  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<boolean> {
    this.connected = true
    return true
  }

  disconnect(): void {
    this.connected = false
  }

  send(text: string): void {
    if (!this.connected) return
    this.messages.push(text)
  }

  getLastMessage(): string | null {
    return this.messages[this.messages.length - 1] ?? null
  }
}

export class FakeVoiceEngine implements VoiceEngine {
  listening = false
  private handlers: VoiceEngineHandlers | null = null

  isSupported(): boolean {
    return true
  }

  start(handlers: VoiceEngineHandlers): void {
    this.listening = true
    this.handlers = handlers
  }

  stop(): void {
    this.listening = false
    this.handlers?.onEnd?.()
    this.handlers = null
  }

  emitResult(transcript: string, isFinal = true): void {
    this.handlers?.onResult(transcript, isFinal)
  }

  emitError(message: string): void {
    this.handlers?.onError(message)
  }
}
