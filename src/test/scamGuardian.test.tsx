import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  analyzeMessage,
  buildTransferVerificationText,
} from '../features/scamGuardian/scamAnalyzer'
import App from '../App'
import { FakeBrailleAdapter, FakeTtsAdapter, FakeVoiceEngine } from './fakes'

const PHISHING_MESSAGE =
  'URGENT: Your account has been suspended. Verify your account details and confirm your PIN ' +
  'within 24 hours at http://bit.ly/bank-verify or your funds will be frozen. Dear customer, act now.'

const LEGIT_MESSAGE =
  'Hi Gemma, your card ending 4821 was used for £34.21 at Greenway Grocers on 5 August. ' +
  'If this was you, no action is needed.'

function renderApp() {
  const tts = new FakeTtsAdapter()
  const braille = new FakeBrailleAdapter()
  const engine = new FakeVoiceEngine()
  const utils = render(<App tts={tts} braille={braille} engine={engine} />)
  return { tts, braille, engine, ...utils }
}

describe('3. Scam Guardian', () => {
  describe('fraud analysis engine', () => {
    it('flags a classic phishing payload as high risk with named signals', () => {
      const result = analyzeMessage(PHISHING_MESSAGE)
      expect(result.riskLevel).toBe('high')
      expect(result.signals.length).toBeGreaterThanOrEqual(3)
      expect(result.summary).toContain('strong signs of being a scam')
      expect(result.summary).toContain('do not click any links')
    })

    it('does not raise a false alarm for a legitimate bank notification', () => {
      const result = analyzeMessage(LEGIT_MESSAGE)
      expect(result.riskLevel).toBe('low')
      expect(result.summary).toContain("doesn't show the common signs")
    })

    it('handles empty input gracefully', () => {
      const result = analyzeMessage('   ')
      expect(result.riskLevel).toBe('low')
      expect(result.summary).toBe("I didn't receive any message text to check.")
    })
  })

  describe('Scam Guardian screen', () => {
    it('analyzes a pasted message and speaks the risk warning aloud', async () => {
      const { tts } = renderApp()
      await screen.findByTestId('account-balance')

      fireEvent.click(screen.getByRole('button', { name: /scam guardian/i }))
      fireEvent.change(screen.getByLabelText(/suspicious message/i), {
        target: { value: PHISHING_MESSAGE },
      })
      fireEvent.click(screen.getByRole('button', { name: /check this message/i }))

      expect(await screen.findByTestId('scam-risk-level')).toHaveTextContent(/high/i)
      await waitFor(() => {
        expect(tts.lastSpoken).toContain('strong signs of being a scam')
      })
    })

    it('reports low risk for a legitimate message', async () => {
      renderApp()
      await screen.findByTestId('account-balance')

      fireEvent.click(screen.getByRole('button', { name: /scam guardian/i }))
      fireEvent.change(screen.getByLabelText(/suspicious message/i), {
        target: { value: LEGIT_MESSAGE },
      })
      fireEvent.click(screen.getByRole('button', { name: /check this message/i }))

      expect(await screen.findByTestId('scam-risk-level')).toHaveTextContent(/low/i)
    })
  })

  describe('transaction verification intercept', () => {
    it('builds the spoken confirmation strictly from verified payment details', () => {
      const text = buildTransferVerificationText({
        payeeName: 'Amara Okafor',
        payeeAccountLast4: '7734',
        payeeSortCode: '40-11-22',
        amount: 20,
        fromAccountNickname: 'Everyday Current Account',
        payeeIsVerified: true,
      })
      expect(text).toBe(
        'Please confirm: send £20.00 from your Everyday Current Account to Amara Okafor, ' +
          'account ending 7734, sort code 40-11-22. Say "confirm" to send, or "cancel" to stop.',
      )
    })

    it('adds an explicit warning for unverified payees', () => {
      const text = buildTransferVerificationText({
        payeeName: 'New Payee — Unicorn Investments Ltd',
        payeeAccountLast4: '0001',
        payeeSortCode: '99-99-99',
        amount: 500,
        fromAccountNickname: 'Everyday Current Account',
        payeeIsVerified: false,
      })
      expect(text).toContain('new payee we have not verified before')
    })

    it('intercepts an outgoing voice transfer, reads verified details aloud, and only sends after "confirm"', async () => {
      const { tts, engine } = renderApp()
      await screen.findByTestId('account-balance')

      fireEvent.keyDown(window, { code: 'Space' })
      await act(async () => {
        engine.emitResult('pay 20 pounds to Amara', true)
      })

      await waitFor(() => {
        expect(tts.spoken.some((s) => s.startsWith('Please confirm: send £20.00'))).toBe(true)
      })
      expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument()

      await act(async () => {
        engine.emitResult('confirm', true)
      })

      expect(await screen.findByTestId('transfer-success')).toBeInTheDocument()
      await waitFor(() => {
        expect(tts.spoken.some((s) => s.startsWith('Payment sent.'))).toBe(true)
      })
    })

    it('cancelling by voice stops the transfer and announces that nothing was sent', async () => {
      const { tts, engine } = renderApp()
      await screen.findByTestId('account-balance')

      fireEvent.keyDown(window, { code: 'Space' })
      await act(async () => {
        engine.emitResult('pay 20 pounds to Amara', true)
      })
      await waitFor(() => {
        expect(tts.spoken.some((s) => s.startsWith('Please confirm'))).toBe(true)
      })

      await act(async () => {
        engine.emitResult('cancel', true)
      })

      await waitFor(() => {
        expect(tts.lastSpoken).toBe('Payment cancelled. Nothing was sent.')
      })
      expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument()
    })
  })
})
