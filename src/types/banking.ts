export interface Account {
  id: string
  nickname: string
  type: 'current' | 'savings'
  sortCode: string
  accountNumberLast4: string
  balance: number
  availableBalance: number
  currency: 'GBP'
}

export interface Transaction {
  id: string
  accountId: string
  date: string
  description: string
  merchant: string
  amount: number
  direction: 'debit' | 'credit'
  category: string
}

export interface Payee {
  id: string
  name: string
  accountNumberLast4: string
  sortCode: string
  isVerified: boolean
  previouslyPaid: boolean
}

export interface TransferRequest {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
}

export interface TransferResult {
  status: 'success' | 'declined' | 'network_error'
  transactionId?: string
  reason?: string
}

export class BankingNetworkError extends Error {
  constructor(message = 'Unable to reach the bank right now.') {
    super(message)
    this.name = 'BankingNetworkError'
  }
}

export class UnauthorizedTransactionError extends Error {
  constructor(message = 'This transaction was not authorized.') {
    super(message)
    this.name = 'UnauthorizedTransactionError'
  }
}
