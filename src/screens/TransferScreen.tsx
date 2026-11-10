import type { useTransferFlow } from '../features/transfer/useTransferFlow'

export function TransferScreen({ flow }: { flow: ReturnType<typeof useTransferFlow> }) {
  const { status, pending, result } = flow

  return (
    <section aria-labelledby="transfer-heading">
      <h1 id="transfer-heading">Send a payment</h1>
      <p>Say something like "pay 20 pounds to Amara", then "confirm" or "cancel" when asked.</p>

      <div data-testid="transfer-status" aria-live="polite">
        {status === 'idle' && <p>No payment in progress.</p>}
        {status === 'payee_not_found' && <p role="alert">Payee not found. Please try again.</p>}
        {status === 'awaiting_confirmation' && pending && (
          <div role="alert">
            <p>Confirm sending £{pending.amount.toFixed(2)} to {pending.payee.name}?</p>
            <p>Say "confirm" to send, or "cancel" to stop.</p>
            <button type="button" onClick={flow.confirm}>
              Confirm
            </button>
            <button type="button" onClick={flow.cancel}>
              Cancel
            </button>
          </div>
        )}
        {status === 'submitting' && <p>Sending payment…</p>}
        {status === 'success' && (
          <p data-testid="transfer-success">
            Payment sent{result?.transactionId ? ` (reference ${result.transactionId})` : ''}.
          </p>
        )}
        {status === 'declined' && <p role="alert">Payment declined. {result?.reason}</p>}
        {status === 'error' && <p role="alert">We couldn't send this payment. Nothing was sent.</p>}
      </div>
    </section>
  )
}
