import { describe, expect, it } from 'vitest'
import { beaconService, type AiConversionClient } from '../features/beacon/beaconService'
import { mockAccounts, mockTransactions } from '../data/mockBankingData'
import { bankingApi } from '../services/bankingApi'
import { BankingNetworkError } from '../types/banking'

const account = mockAccounts[0]

describe('2. Beacon engine', () => {
  it('converts verified balance data into natural language when AI is online', async () => {
    const text = await beaconService.describeBalance(account, { aiOnline: true })
    expect(text).toBe(
      "Here's what I found. Your Everyday Current Account balance is £1,284.53, and £1,184.53 is available to spend.",
    )
  })

  it('falls back to the static template built from verified data when AI is offline', async () => {
    const text = await beaconService.describeBalance(account, { aiOnline: false })
    expect(text).toBe(
      'Your Everyday Current Account balance is £1,284.53, and £1,184.53 is available to spend.',
    )
  })

  it('falls back to the static template when the AI client throws mid-request', async () => {
    const failingClient: AiConversionClient = {
      generate: async () => {
        throw new Error('AI unavailable')
      },
    }
    const text = await beaconService.describeBalance(account, {
      aiOnline: true,
      client: failingClient,
    })
    expect(text).toBe(
      'Your Everyday Current Account balance is £1,284.53, and £1,184.53 is available to spend.',
    )
  })

  it('narrates recent transactions strictly from the verified transaction list', async () => {
    const transactions = mockTransactions.filter((t) => t.accountId === account.id).slice(0, 2)
    const text = await beaconService.describeRecentTransactions(transactions, { aiOnline: false })
    expect(text).toContain('You paid £34.21 to Greenway Grocers on 2026-08-05.')
    expect(text).toContain('You paid £78.50 to CityPower Energy on 2026-08-04.')

    expect(text).not.toMatch(/Unicorn|refund|£999/)
  })

  it('clarifies known financial terminology and admits when a term is unknown', async () => {
    const known = await beaconService.clarifyTerm('overdraft', { aiOnline: false })
    expect(known).toContain('spend more money than you have')

    const unknown = await beaconService.clarifyTerm('quantitative easing', { aiOnline: false })
    expect(unknown).toContain("I don't have a definition")
  })

  it('surfaces a network failure from the banking API instead of inventing data', async () => {
    await expect(
      bankingApi.getAccount(account.id, { simulateNetworkFailure: true }),
    ).rejects.toBeInstanceOf(BankingNetworkError)
  })
})
