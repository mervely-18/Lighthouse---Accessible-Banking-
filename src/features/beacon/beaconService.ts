import { glossary } from '../../data/mockBankingData'
import type { Account, Transaction } from '../../types/banking'

export interface AiConversionClient {
  generate(prompt: string): Promise<string>
}

class MockClaudeClient implements AiConversionClient {
  async generate(prompt: string): Promise<string> {
    return mockNaturalLanguagePhrasing(prompt)
  }
}

export const mockClaudeClient: AiConversionClient = new MockClaudeClient()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function mockNaturalLanguagePhrasing(prompt: string): string {
  return `Here's what I found. ${prompt}`
}

export interface BeaconOptions {
  aiOnline: boolean
  client?: AiConversionClient
}

async function convert(staticPrompt: string, opts: BeaconOptions): Promise<string> {
  if (!opts.aiOnline) return staticPrompt
  try {
    const client = opts.client ?? mockClaudeClient
    return await client.generate(staticPrompt)
  } catch {
    return staticPrompt
  }
}

function staticBalanceTemplate(account: Account): string {
  return `Your ${account.nickname} balance is ${formatCurrency(account.balance)}, and ${formatCurrency(
    account.availableBalance,
  )} is available to spend.`
}

function staticTransactionsTemplate(transactions: Transaction[]): string {
  if (transactions.length === 0) return "You don't have any recent transactions on this account."
  const lines = transactions.map((t) => {
    const verb = t.direction === 'debit' ? 'You paid' : 'You received'
    return `${verb} ${formatCurrency(t.amount)} ${t.direction === 'debit' ? 'to' : 'from'} ${t.merchant} on ${t.date}.`
  })
  return `Here are your last ${transactions.length} transactions. ${lines.join(' ')}`
}

function staticGlossaryTemplate(term: string): string {
  const key = term.trim().toLowerCase()
  const definition = glossary[key]
  if (!definition) {
    return `I don't have a definition for "${term}" yet. Try asking about APR, overdraft, direct debit, standing order, or available balance.`
  }
  return definition
}

export const beaconService = {
  async describeBalance(account: Account, opts: BeaconOptions): Promise<string> {
    return convert(staticBalanceTemplate(account), opts)
  },
  async describeRecentTransactions(transactions: Transaction[], opts: BeaconOptions): Promise<string> {
    return convert(staticTransactionsTemplate(transactions), opts)
  },
  async clarifyTerm(term: string, opts: BeaconOptions): Promise<string> {
    return convert(staticGlossaryTemplate(term), opts)
  },
}
