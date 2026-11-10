import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { FakeBrailleAdapter, FakeTtsAdapter, FakeVoiceEngine } from './fakes'

function renderApp() {
  const tts = new FakeTtsAdapter()
  const braille = new FakeBrailleAdapter()
  const engine = new FakeVoiceEngine()
  const utils = render(<App tts={tts} braille={braille} engine={engine} />)
  return { tts, braille, engine, ...utils }
}

async function enablePrivacyMode() {
  const toggle = screen.getByRole('switch', { name: /privacy mode/i })
  fireEvent.click(toggle)
  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
}

describe('4. Privacy Mode', () => {
  it('masks the on-screen balance when enabled', async () => {
    renderApp()
    await screen.findByTestId('account-balance')

    expect(screen.getByTestId('account-balance')).toHaveTextContent('£1284.53')

    await enablePrivacyMode()

    expect(screen.getByTestId('account-balance')).not.toHaveTextContent('£1284.53')
    expect(screen.getByTestId('account-balance')).toHaveTextContent('hidden')
  })

  it('suppresses spoken audio for sensitive balance announcements and routes the full text to Braille', async () => {
    const { tts, braille, engine } = renderApp()
    await screen.findByTestId('account-balance')

    await enablePrivacyMode()

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult("what's my balance", true)
    })

    await waitFor(() => {
      expect(braille.getLastMessage()).toContain('£1,284.53')
    })
    expect(tts.spoken.every((s) => !s.includes('£1,284.53'))).toBe(true)

    expect(tts.spoken.every((s) => !s.includes('1284') && !s.includes('1,284'))).toBe(true)

    expect(screen.getByTestId('beacon-message')).not.toHaveTextContent('£1,284.53')
    expect(screen.getByTestId('beacon-message')).toHaveTextContent('Braille display')
  })

  it('still speaks non-sensitive announcements normally while Privacy Mode is on', async () => {
    const { tts, engine } = renderApp()
    await screen.findByTestId('account-balance')

    await enablePrivacyMode()

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult('what does overdraft mean', true)
    })

    await waitFor(() => {
      expect(tts.lastSpoken).toContain('spend more money than you have')
    })
  })

  it('speaks sensitive content normally again once Privacy Mode is switched off', async () => {
    const { tts, engine } = renderApp()
    await screen.findByTestId('account-balance')

    const toggle = screen.getByRole('switch', { name: /privacy mode/i })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult("what's my balance", true)
    })

    await waitFor(() => {
      expect(tts.lastSpoken).toContain('£1,284.53')
    })
  })

  it('can be toggled hands-free by voice', async () => {
    const { tts, engine } = renderApp()
    await screen.findByTestId('account-balance')

    fireEvent.keyDown(window, { code: 'Space' })
    await act(async () => {
      engine.emitResult('turn on privacy mode', true)
    })

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /privacy mode/i })).toHaveAttribute(
        'aria-checked',
        'true',
      )
    })
    expect(tts.lastSpoken).toBe('Privacy mode on.')
  })
})
