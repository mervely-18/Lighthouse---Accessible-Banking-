import { useVoice } from '../features/voice/VoiceProvider'

export function VoiceControlBar() {
  const { isListening, isSupported, transcript, lastError, startListening, stopListening } = useVoice()

  return (
    <div className="voice-control-bar">
      <button
        type="button"
        className={`talk-button ${isListening ? 'talk-button--active' : ''}`}
        aria-pressed={isListening}
        aria-label={isListening ? 'Listening — release to stop' : 'Press and hold to talk, or hold spacebar'}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
      >
        {isListening ? 'Listening…' : 'Hold to talk'}
      </button>
      <p className="voice-control-bar__hint">
        {isSupported
          ? 'Hold this button or the spacebar and speak. Release when done.'
          : 'Voice input is unavailable — use the text field below to type a command.'}
      </p>
      {transcript && (
        <p className="voice-control-bar__transcript" aria-hidden="true">
          Heard: “{transcript}”
        </p>
      )}
      {lastError && (
        <p className="voice-control-bar__error" role="alert">
          {lastError}
        </p>
      )}
    </div>
  )
}
