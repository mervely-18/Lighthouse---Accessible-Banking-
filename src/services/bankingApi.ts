import { mockAccounts, mockPayees, mockTransactions } from '../data/mockBankingData'
import {
  BankingNetworkError,
  UnauthorizedTransactionError,
  type Account,
  type Payee,
  type Transaction,
  type TransferRequest,
  type TransferResult,
} from '../types/banking'

export interface BankingApiOptions {
  simulateNetworkFailure?: boolean
  simulateUnauthorized?: boolean
  latencyMs?: number
}

async function wait(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

class BankingApiService {
  async getAccounts(opts: BankingApiOptions = {}): Promise<Account[]> {
    await wait(opts.latencyMs ?? 0)
    if (opts.simulateNetworkFailure) throw new BankingNetworkError()
    return mockAccounts
  }

  async getAccount(accountId: string, opts: BankingApiOptions = {}): Promise<Account> {
    const accounts = await this.getAccounts(opts)
    const account = accounts.find((a) => a.id === accountId)
    if (!account) throw new Error(`Unknown account: ${accountId}`)
    return account
  }

  async getRecentTransactions(
    accountId: string,
    limit = 5,
    opts: BankingApiOptions = {},
  ): Promise<Transaction[]> {
    await wait(opts.latencyMs ?? 0)
    if (opts.simulateNetworkFailure) throw new BankingNetworkError()
    return mockTransactions
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit)
  }

  async getPayees(opts: BankingApiOptions = {}): Promise<Payee[]> {
    await wait(opts.latencyMs ?? 0)
    if (opts.simulateNetworkFailure) throw new BankingNetworkError()
    return mockPayees
  }

  async findPayeeByName(name: string, opts: BankingApiOptions = {}): Promise<Payee | undefined> {
    const payees = await this.getPayees(opts)
    const normalized = name.trim().toLowerCase()
    return payees.find((p) => p.name.toLowerCase().includes(normalized))
  }

  async initiateTransfer(
    request: TransferRequest,
    opts: BankingApiOptions = {},
  ): Promise<TransferResult> {
    await wait(opts.latencyMs ?? 0)

    if (opts.simulateNetworkFailure) {
      return { status: 'network_error', reason: 'Unable to reach the bank right now.' }
    }
    if (opts.simulateUnauthorized) {
      throw new UnauthorizedTransactionError()
    }

    const account = mockAccounts.find((a) => a.id === request.fromAccountId)
    const payee = mockPayees.find((p) => p.id === request.payeeId)

    if (!account || !payee) {
      return { status: 'declined', reason: 'Account or payee could not be verified.' }
    }
    if (request.amount <= 0) {
      return { status: 'declined', reason: 'Transfer amount must be greater than zero.' }
    }
    if (request.amount > account.availableBalance) {
      return { status: 'declined', reason: 'Insufficient available balance.' }
    }

    return {
      status: 'success',
      transactionId: `txn-${Date.now()}`,
    }
  }
}

export const bankingApi = new BankingApiService()
