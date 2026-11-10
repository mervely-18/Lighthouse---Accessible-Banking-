import { useCallback, useState } from 'react'
import { bankingApi } from '../../services/bankingApi'
import { buildTransferVerificationText } from '../scamGuardian/scamAnalyzer'
import type { Payee, TransferResult } from '../../types/banking'
import { useAccessibility } from '../../context/AccessibilityContext'
import { useSystemStatus } from '../../context/SystemStatusContext'

export type TransferStatus =
  | 'idle'
  | 'payee_not_found'
  | 'awaiting_confirmation'
  | 'submitting'
  | 'success'
  | 'declined'
  | 'error'

interface PendingTransfer {
  payee: Payee
  amount: number
}

export function useTransferFlow(fromAccountId: string, fromAccountNickname: string) {
  const { announce } = useAccessibility()
  const { networkOnline } = useSystemStatus()
  const [status, setStatus] = useState<TransferStatus>('idle')
  const [pending, setPending] = useState<PendingTransfer | null>(null)
  const [result, setResult] = useState<TransferResult | null>(null)

  const startTransfer = useCallback(
    async (params: { amount?: number; payeeName?: string }) => {
      if (!params.amount || !params.payeeName) {
        announce({
          text: "I didn't catch the amount and who to pay. Please say something like, 'pay 20 pounds to Amara'.",
          priority: 'assertive',
        })
        setStatus('idle')
        return
      }

      const payee = await bankingApi.findPayeeByName(params.payeeName)
      if (!payee) {
        announce({
          text: `I couldn't find a payee matching "${params.payeeName}". Please try again with their full name.`,
          priority: 'assertive',
        })
        setStatus('payee_not_found')
        return
      }

      const verificationText = buildTransferVerificationText({
        payeeName: payee.name,
        payeeAccountLast4: payee.accountNumberLast4,
        payeeSortCode: payee.sortCode,
        amount: params.amount,
        fromAccountNickname,
        payeeIsVerified: payee.isVerified,
      })

      setPending({ payee, amount: params.amount })
      setStatus('awaiting_confirmation')
      announce({
        text: verificationText,
        maskedText: 'A payment is ready to review. Check your Braille display for the details, then say confirm or cancel.',
        sensitive: true,
        priority: 'assertive',
      })
    },
    [announce, fromAccountNickname],
  )

  const confirm = useCallback(async () => {
    if (status !== 'awaiting_confirmation' || !pending) return

    setStatus('submitting')
    try {
      const transferResult = await bankingApi.initiateTransfer(
        { fromAccountId, payeeId: pending.payee.id, amount: pending.amount },
        { simulateNetworkFailure: !networkOnline },
      )
      setResult(transferResult)

      if (transferResult.status === 'success') {
        setStatus('success')
        announce({
          text: `Payment sent. ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pending.amount)} was sent to ${pending.payee.name}.`,
          maskedText: 'Payment sent successfully.',
          sensitive: true,
          priority: 'assertive',
        })
      } else if (transferResult.status === 'network_error') {
        setStatus('error')
        announce({
          text: "I couldn't reach the bank to send this payment. Nothing was sent. Please try again shortly.",
          priority: 'assertive',
        })
      } else {
        setStatus('declined')
        announce({
          text: `This payment was declined. ${transferResult.reason ?? ''}`.trim(),
          priority: 'assertive',
        })
      }
    } catch {
      setStatus('error')
      announce({
        text: 'This transaction was not authorized and has not been sent. Please contact us if you believe this is an error.',
        priority: 'assertive',
      })
    }
  }, [status, pending, fromAccountId, networkOnline, announce])

  const cancel = useCallback(() => {
    setStatus('idle')
    setPending(null)
    announce({ text: 'Payment cancelled. Nothing was sent.', priority: 'polite' })
  }, [announce])

  const reset = useCallback(() => {
    setStatus('idle')
    setPending(null)
    setResult(null)
  }, [])

  return { status, pending, result, startTransfer, confirm, cancel, reset }
}
