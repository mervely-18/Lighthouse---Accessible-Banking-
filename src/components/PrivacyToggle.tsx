import { useAccessibility } from '../context/AccessibilityContext'

export function PrivacyToggle() {
  const { privacyMode, togglePrivacyMode } = useAccessibility()

  return (
    <button
      type="button"
      className="privacy-toggle"
      role="switch"
      aria-checked={privacyMode}
      onClick={togglePrivacyMode}
    >
      Privacy Mode: {privacyMode ? 'On' : 'Off'}
    </button>
  )
}
