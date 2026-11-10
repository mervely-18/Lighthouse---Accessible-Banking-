import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import App from '../App'
import { FakeBrailleAdapter, FakeTtsAdapter, FakeVoiceEngine } from './fakes'

function renderApp() {
  const tts = new FakeTtsAdapter()
  const braille = new FakeBrailleAdapter()
  const engine = new FakeVoiceEngine()
  const utils = render(<App tts={tts} braille={braille} engine={engine} />)
  return { tts, braille, engine, ...utils }
}

describe('5. Accessibility compliance (WCAG 2.1 / EN 301 549)', () => {
  it('exposes a polite live region for announcements by default', async () => {
    renderApp()
    await screen.findByTestId('account-balance')

    const statusRegion = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(statusRegion).toBeDefined()
  })

  it('escalates the live region to assertive for urgent announcements', async () => {
    const { engine } = renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult("what's my balance", true)
    })

    await waitFor(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]')
      expect(assertiveRegion).not.toBeNull()
      expect(assertiveRegion?.textContent).toContain('£1,284.53')
    })
  })

  it('marks high-risk scam results as role="alert" so screen readers interrupt', async () => {
    renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.click(screen.getByRole('button', { name: /scam guardian/i }))
    fireEvent.change(screen.getByLabelText(/suspicious message/i), {
      target: {
        value:
          'URGENT: verify your account details and confirm your PIN at http://bit.ly/x now or your account will be suspended',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /check this message/i }))

    const result = await screen.findByTestId('scam-result')
    expect(result).toHaveAttribute('role', 'alert')
    expect(result).toHaveAttribute('aria-live', 'assertive')
  })

  it('exposes the Privacy Mode control as a switch with correct checked state', async () => {
    renderApp()
    const toggle = screen.getByRole('switch', { name: /privacy mode/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('labels the talk button and reflects listening state via aria-pressed', async () => {
    const { engine } = renderApp()
    await screen.findByTestId('account-balance')

    const talkButton = screen.getByRole('button', { name: /hold to talk|press and hold/i })
    expect(talkButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.mouseDown(talkButton)
    expect(engine.listening).toBe(true)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /listening/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })

  it('has no axe violations on the Beacon dashboard', async () => {
    const { container } = renderApp()
    await screen.findByTestId('account-balance')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations on the Scam Guardian screen', async () => {
    const { container } = renderApp()
    await screen.findByTestId('account-balance')
    fireEvent.click(screen.getByRole('button', { name: /scam guardian/i }))
    await screen.findByLabelText(/suspicious message/i)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations on the transfer screen, including mid-confirmation', async () => {
    const { container, engine } = renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult('pay 20 pounds to Amara', true)
    })
    await screen.findByRole('heading', { name: /send a payment/i })

    expect(await axe(container)).toHaveNoViolations()
  })
})
