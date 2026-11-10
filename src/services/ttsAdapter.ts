export interface TtsAdapter {
  isSupported(): boolean
  speak(text: string, opts?: { rate?: number; onEnd?: () => void }): void
  cancel(): void
}

class WebSpeechTtsAdapter implements TtsAdapter {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): void {
    if (!this.isSupported()) {
      opts.onEnd?.()
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = opts.rate ?? 1
    if (opts.onEnd) utterance.onend = opts.onEnd
    window.speechSynthesis.speak(utterance)
  }

  cancel(): void {
    if (this.isSupported()) window.speechSynthesis.cancel()
  }
}

export const ttsAdapter: TtsAdapter = new WebSpeechTtsAdapter()
