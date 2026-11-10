import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { FakeBrailleAdapter, FakeTtsAdapter, FakeVoiceEngine } from './fakes'
import { parseVoiceIntent } from '../features/voice/commandRouter'

function renderApp() {
  const tts = new FakeTtsAdapter()
  const braille = new FakeBrailleAdapter()
  const engine = new FakeVoiceEngine()
  const utils = render(<App tts={tts} braille={braille} engine={engine} />)
  return { tts, braille, engine, ...utils }
}

describe('1. Voice input/output flow', () => {
  it('routes spoken transcripts to the right intents (STT command routing)', () => {
    expect(parseVoiceIntent("what's my balance")).toEqual({ type: 'CHECK_BALANCE' })
    expect(parseVoiceIntent('show me my recent transactions')).toEqual({
      type: 'RECENT_TRANSACTIONS',
    })
    expect(parseVoiceIntent('pay 20 pounds to Amara')).toEqual({
      type: 'START_TRANSFER',
      amount: 20,
      payeeName: 'amara',
    })
    expect(parseVoiceIntent('confirm')).toEqual({ type: 'CONFIRM' })
    expect(parseVoiceIntent('cancel')).toEqual({ type: 'CANCEL' })
    expect(parseVoiceIntent('gibberish flurble')).toEqual({
      type: 'UNKNOWN',
      raw: 'gibberish flurble',
    })
  })

  it('avoids intent-capture traps in dictated content', () => {
    expect(parseVoiceIntent('blorp zzz nonsense').type).toBe('UNKNOWN')

    const scamDictation =
      'check this message urgent verify your account details and confirm your pin at http://bit.ly/x'
    const intent = parseVoiceIntent(scamDictation)
    expect(intent.type).toBe('OPEN_SCAM_GUARDIAN')
    if (intent.type === 'OPEN_SCAM_GUARDIAN') {
      expect(intent.dictatedText).toContain('confirm your pin')
    }

    expect(parseVoiceIntent('what does available balance mean')).toEqual({
      type: 'CLARIFY_TERM',
      term: 'available balance',
    })
  })

  it('updates app state from a final STT result and speaks the exact accessible balance text', async () => {
    const { tts, engine } = renderApp()
    await screen.findByTestId('account-balance')

    const talkButton = screen.getByRole('button', { name: /hold to talk/i })
    fireEvent.mouseDown(talkButton)
    expect(engine.listening).toBe(true)

    act(() => {
      engine.emitResult("what's my balance", true)
    })

    const expectedText =
      "Here's what I found. Your Everyday Current Account balance is £1,284.53, and £1,184.53 is available to spend."

    await waitFor(() => {
      expect(tts.lastSpoken).toBe(expectedText)
    })
    expect(screen.getByTestId('beacon-message')).toHaveTextContent(expectedText)
  })

  it('announces a spoken error prompt for unrecognized input without crashing', async () => {
    const { tts } = renderApp()
    await screen.findByTestId('account-balance')

    const typedInput = screen.getByLabelText(/type a command instead/i)
    fireEvent.change(typedInput, { target: { value: 'blorp zzz nonsense' } })
    fireEvent.submit(typedInput.closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(tts.lastSpoken).toBe(
        'Sorry, I didn\'t understand that. Say "help" to hear what you can say.',
      )
    })
    expect(screen.getByTestId('account-balance')).toBeInTheDocument()
  })

  it('supports the noisy-environment fallback: spacebar press-and-hold starts and stops listening', async () => {
    const { engine } = renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.keyDown(window, { code: 'Space' })
    expect(engine.listening).toBe(true)

    fireEvent.keyUp(window, { code: 'Space' })
    await waitFor(() => {
      expect(engine.listening).toBe(false)
    })
  })

  it('recovers gracefully when the STT engine reports an error', async () => {
    const { engine } = renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.keyDown(window, { code: 'Space' })
    act(() => {
      engine.emitError('no-speech')
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('no-speech')
    expect(screen.getByRole('button', { name: /hold to talk/i })).toBeInTheDocument()
  })
})
