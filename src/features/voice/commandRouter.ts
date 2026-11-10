export type VoiceIntent =
  | { type: 'CHECK_BALANCE' }
  | { type: 'RECENT_TRANSACTIONS' }
  | { type: 'CLARIFY_TERM'; term: string }
  | { type: 'OPEN_SCAM_GUARDIAN'; dictatedText?: string }
  | { type: 'START_TRANSFER'; payeeName?: string; amount?: number }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' }
  | { type: 'TOGGLE_PRIVACY' }
  | { type: 'GO_HOME' }
  | { type: 'HELP' }
  | { type: 'UNKNOWN'; raw: string }

const CONFIRM_PATTERN = /\b(yes|confirm|confirmed|correct|send it)\b/
const CANCEL_PATTERN = /\b(no|cancel|stop|don't send it)\b/

export function parseVoiceIntent(rawTranscript: string): VoiceIntent {
  const text = rawTranscript.trim().toLowerCase()
  if (!text) return { type: 'UNKNOWN', raw: rawTranscript }

  if (
    text.includes('scam') ||
    text.includes('phishing') ||
    text.includes('suspicious message') ||
    /\bcheck this (message|text|email|call)\b/.test(text)
  ) {
    const afterCheck = text
      .replace(/^.*?check this (message|text|email|call)[:,]?\s*/, '')
      .replace(/^.*?(scam|phishing|suspicious message)s?[:,]?\s*/, '')
      .trim()
    return { type: 'OPEN_SCAM_GUARDIAN', dictatedText: afterCheck || undefined }
  }

  if (CONFIRM_PATTERN.test(text)) return { type: 'CONFIRM' }
  if (CANCEL_PATTERN.test(text)) return { type: 'CANCEL' }

  const clarifyMatch =
    text.match(/what does\s+(?:an?\s+)?(.+?)\s+mean[?.]?$/) ??
    text.match(/^(?:clarify|explain)\s+(?:an?\s+)?(.+?)[?.]?$/)
  if (clarifyMatch && clarifyMatch[1]) {
    return { type: 'CLARIFY_TERM', term: clarifyMatch[1].trim() }
  }

  if (text.includes('balance')) return { type: 'CHECK_BALANCE' }

  if (text.includes('transaction') || text.includes('spending') || text.includes('recent payments')) {
    return { type: 'RECENT_TRANSACTIONS' }
  }

  const transferMatch = text.match(
    /(?:send|pay|transfer)\s+(?:£|gbp)?\s?([\d.]+)\s*(?:pounds?|gbp)?\s*(?:to\s+(.+))?/,
  )
  if (transferMatch) {
    const amount = Number.parseFloat(transferMatch[1])
    const payeeName = transferMatch[2]?.trim()
    return { type: 'START_TRANSFER', amount: Number.isNaN(amount) ? undefined : amount, payeeName }
  }

  if (text.includes('privacy')) return { type: 'TOGGLE_PRIVACY' }
  if (text.includes('home') || text.includes('start over') || text.includes('main menu')) {
    return { type: 'GO_HOME' }
  }
  if (text.includes('help') || text.includes('what can i say')) return { type: 'HELP' }

  return { type: 'UNKNOWN', raw: rawTranscript }
}
