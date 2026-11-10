export type RiskLevel = 'low' | 'medium' | 'high'

export interface ScamSignal {
  reason: string
  weight: number
}

export interface ScamAnalysisResult {
  riskLevel: RiskLevel
  score: number
  signals: string[]
  summary: string
}

interface HeuristicRule {
  test: RegExp
  reason: string
  weight: number
}

const RULES: HeuristicRule[] = [
  {
    test: /\b(verify|confirm|update)\s+your\s+(account|details|card|identity)\b/i,
    reason: 'Asks you to "verify" or "update" your account details, a common phishing hook.',
    weight: 2,
  },
  {
    test: /\b(pin|password|one[- ]?time code|otp|cvv|full card number)\b/i,
    reason: 'Asks for your PIN, password, one-time code, or full card number — your bank will never ask for these.',
    weight: 4,
  },
  {
    test: /\b(urgent|immediately|act now|within \d+ hours?|suspend(ed)?|frozen|locked)\b/i,
    reason: 'Uses urgent, high-pressure language to rush you into acting without thinking.',
    weight: 2,
  },
  {
    test: /\bhttps?:\/\/(bit\.ly|tinyurl\.com|[\d.]+)\b/i,
    reason: 'Contains a shortened or numeric link that hides the real destination.',
    weight: 3,
  },
  {
    test: /\bclick (the )?link\b|\btap here\b/i,
    reason: 'Pressures you to click a link rather than log in through the official app or website.',
    weight: 1,
  },
  {
    test: /\bgift card|itunes|crypto|bitcoin|wire transfer\b/i,
    reason: 'Requests payment by gift card, cryptocurrency, or wire transfer — common scam payment methods.',
    weight: 3,
  },
  {
    test: /\bdear (customer|user|valued client)\b/i,
    reason: 'Uses a generic greeting instead of your name, suggesting a mass-sent message.',
    weight: 1,
  },
]

export function analyzeMessage(rawText: string): ScamAnalysisResult {
  const text = rawText.trim()
  if (!text) {
    return {
      riskLevel: 'low',
      score: 0,
      signals: [],
      summary: "I didn't receive any message text to check.",
    }
  }

  const matched = RULES.filter((rule) => rule.test.test(text))
  const score = matched.reduce((sum, rule) => sum + rule.weight, 0)
  const signals = matched.map((rule) => rule.reason)

  let riskLevel: RiskLevel = 'low'
  if (score >= 5) riskLevel = 'high'
  else if (score >= 2) riskLevel = 'medium'

  const summary = buildSummary(riskLevel, signals)

  return { riskLevel, score, signals, summary }
}

function buildSummary(riskLevel: RiskLevel, signals: string[]): string {
  if (riskLevel === 'low') {
    return "This message doesn't show the common signs of a banking scam, but if you're ever unsure, contact us directly using the number on your card."
  }
  const intro =
    riskLevel === 'high'
      ? 'This message has strong signs of being a scam. Please do not click any links, share any codes, or make any payment.'
      : 'This message has some signs of being a scam. Take care before acting on it.'
  const detail = signals.map((s, i) => `${i + 1}. ${s}`).join(' ')
  return `${intro} ${detail}`
}

export interface TransactionVerificationInput {
  payeeName: string
  payeeAccountLast4: string
  payeeSortCode: string
  amount: number
  fromAccountNickname: string
  payeeIsVerified: boolean
}

export function buildTransferVerificationText(input: TransactionVerificationInput): string {
  const amountText = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
    input.amount,
  )
  const warning = input.payeeIsVerified
    ? ''
    : ' This is a new payee we have not verified before. Please make sure you trust them before continuing.'
  return `Please confirm: send ${amountText} from your ${input.fromAccountNickname} to ${input.payeeName}, account ending ${input.payeeAccountLast4}, sort code ${input.payeeSortCode}.${warning} Say "confirm" to send, or "cancel" to stop.`
}
