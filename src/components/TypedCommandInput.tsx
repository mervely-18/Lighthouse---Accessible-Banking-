import { useState, type FormEvent } from 'react'
import { useVoice } from '../features/voice/VoiceProvider'

export function TypedCommandInput() {
  const { submitTranscript } = useVoice()
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    submitTranscript(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="typed-command-input">
      <label htmlFor="typed-command">Type a command instead</label>
      <input
        id="typed-command"
        name="typed-command"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. what's my balance?"
      />
      <button type="submit">Send</button>
    </form>
  )
}
