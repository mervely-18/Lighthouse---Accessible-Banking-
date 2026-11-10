import { useEffect, useState } from 'react'
import { analyzeMessage, type ScamAnalysisResult } from '../features/scamGuardian/scamAnalyzer'
import { useAccessibility } from '../context/AccessibilityContext'

export function ScamGuardianScreen({ initialText }: { initialText?: string }) {
  const { announce } = useAccessibility()
  const [text, setText] = useState(initialText ?? '')
  const [result, setResult] = useState<ScamAnalysisResult | null>(null)

  const runAnalysis = (messageText: string) => {
    if (!messageText.trim()) {
      announce({
        text: 'Please paste or dictate the suspicious message first.',
        priority: 'assertive',
      })
      return
    }
    const analysis = analyzeMessage(messageText)
    setResult(analysis)
    announce({
      text: analysis.summary,
      priority: analysis.riskLevel === 'high' ? 'assertive' : 'polite',
    })
  }

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setText(initialText)
      runAnalysis(initialText)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText])

  return (
    <section aria-labelledby="scam-guardian-heading">
      <h1 id="scam-guardian-heading">Scam Guardian</h1>
      <p>Paste or dictate a suspicious text, email, or call transcript claiming to be from your bank.</p>
      <label htmlFor="scam-message">Suspicious message</label>
      <textarea
        id="scam-message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      />
      <button type="button" onClick={() => runAnalysis(text)}>
        Check this message
      </button>

      {result && (
        <div
          data-testid="scam-result"
          role={result.riskLevel === 'high' ? 'alert' : 'status'}
          aria-live={result.riskLevel === 'high' ? 'assertive' : 'polite'}
          className={`scam-result scam-result--${result.riskLevel}`}
        >
          <p data-testid="scam-risk-level">
            Risk level: <strong>{result.riskLevel}</strong>
          </p>
          <p>{result.summary}</p>
        </div>
      )}
    </section>
  )
}
