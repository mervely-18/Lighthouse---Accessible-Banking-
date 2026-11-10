import { useEffect, useRef, useState } from 'react'
import { bankingApi } from '../services/bankingApi'
import { beaconService } from '../features/beacon/beaconService'
import { useAccessibility } from '../context/AccessibilityContext'
import { useSystemStatus } from '../context/SystemStatusContext'
import type { Account, Transaction } from '../types/banking'
import type { BeaconRequest } from '../app/beaconRequest'

export function DashboardScreen({
  accountId,
  beaconRequest,
}: {
  accountId: string
  beaconRequest: BeaconRequest | null
}) {
  const { announce, privacyMode } = useAccessibility()
  const { aiOnline, networkOnline } = useSystemStatus()
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [beaconMessage, setBeaconMessage] = useState<string>(
    "Say \"what's my balance\", \"recent transactions\", or \"what does overdraft mean\".",
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const handledRequestId = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const acc = await bankingApi.getAccount(accountId, { simulateNetworkFailure: !networkOnline })
        const txns = await bankingApi.getRecentTransactions(accountId, 5, {
          simulateNetworkFailure: !networkOnline,
        })
        if (cancelled) return
        setAccount(acc)
        setTransactions(txns)
        setLoadError(null)
      } catch {
        if (cancelled) return
        setLoadError("We couldn't reach the bank to load your account. Please try again shortly.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [accountId, networkOnline])

  useEffect(() => {
    if (!beaconRequest || !account) return
    if (handledRequestId.current === beaconRequest.nonce) return
    handledRequestId.current = beaconRequest.nonce

    async function respond() {
      if (!account) return
      if (beaconRequest!.type === 'balance') {
        const text = await beaconService.describeBalance(account, { aiOnline })
        const maskedText = 'Your balance is ready. Check your Braille display to view it privately.'
        setBeaconMessage(privacyMode ? maskedText : text)
        announce({ text, maskedText, sensitive: true, priority: 'assertive' })
      } else if (beaconRequest!.type === 'transactions') {
        const text = await beaconService.describeRecentTransactions(transactions, { aiOnline })
        const maskedText =
          'Your recent transactions are ready. Check your Braille display to view them privately.'
        setBeaconMessage(privacyMode ? maskedText : text)
        announce({ text, maskedText, sensitive: true, priority: 'assertive' })
      } else if (beaconRequest!.type === 'clarify') {
        const text = await beaconService.clarifyTerm(beaconRequest!.term, { aiOnline })
        setBeaconMessage(text)
        announce({ text, priority: 'polite' })
      }
    }
    respond()
  }, [beaconRequest, account, transactions, aiOnline, announce, privacyMode])

  if (loadError) {
    return (
      <div role="alert">
        <p>{loadError}</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading">Beacon</h1>
      {account && (
        <div className="account-summary">
          <p>
            {account.nickname} · ending {account.accountNumberLast4}
            {privacyMode && <span className="privacy-badge"> · Privacy Mode on</span>}
          </p>
          <p data-testid="account-balance">
            Balance:{' '}
            {privacyMode
              ? '•••• (hidden — check your Braille display)'
              : `£${account.balance.toFixed(2)}`}
          </p>
        </div>
      )}
      <div className="beacon-message" data-testid="beacon-message">
        {beaconMessage}
      </div>
      {transactions.length > 0 && (
        <ul aria-label="Recent transactions" className="transaction-list" data-testid="transaction-list">
          {transactions.map((t) => (
            <li key={t.id}>
              {t.date} — {t.merchant} —{' '}
              {privacyMode ? '••••' : `${t.direction === 'debit' ? '-' : '+'}£${t.amount.toFixed(2)}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
