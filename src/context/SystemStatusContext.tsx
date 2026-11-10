import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface SystemStatusContextValue {
  aiOnline: boolean
  setAiOnline: (value: boolean) => void
  networkOnline: boolean
  setNetworkOnline: (value: boolean) => void
}

const SystemStatusContext = createContext<SystemStatusContextValue | undefined>(undefined)

export function SystemStatusProvider({ children }: { children: ReactNode }) {
  const [aiOnline, setAiOnline] = useState(true)
  const [networkOnline, setNetworkOnline] = useState(true)

  const value = useMemo(
    () => ({ aiOnline, setAiOnline, networkOnline, setNetworkOnline }),
    [aiOnline, networkOnline],
  )

  return <SystemStatusContext.Provider value={value}>{children}</SystemStatusContext.Provider>
}

export function useSystemStatus(): SystemStatusContextValue {
  const ctx = useContext(SystemStatusContext)
  if (!ctx) throw new Error('useSystemStatus must be used within a SystemStatusProvider')
  return ctx
}
