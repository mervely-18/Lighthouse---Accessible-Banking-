import type { Account, Payee, Transaction } from '../types/banking'

export const mockAccounts: Account[] = [
  {
    id: 'acc-current-001',
    nickname: 'Everyday Current Account',
    type: 'current',
    sortCode: '20-30-40',
    accountNumberLast4: '4821',
    balance: 1284.53,
    availableBalance: 1184.53,
    currency: 'GBP',
  },
  {
    id: 'acc-savings-001',
    nickname: 'Rainy Day Savings',
    type: 'savings',
    sortCode: '20-30-40',
    accountNumberLast4: '9012',
    balance: 5620.0,
    availableBalance: 5620.0,
    currency: 'GBP',
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-1001',
    accountId: 'acc-current-001',
    date: '2026-08-05',
    description: 'Card payment',
    merchant: 'Greenway Grocers',
    amount: 34.21,
    direction: 'debit',
    category: 'groceries',
  },
  {
    id: 'txn-1002',
    accountId: 'acc-current-001',
    date: '2026-08-04',
    description: 'Direct debit',
    merchant: 'CityPower Energy',
    amount: 78.5,
    direction: 'debit',
    category: 'utilities',
  },
  {
    id: 'txn-1003',
    accountId: 'acc-current-001',
    date: '2026-08-03',
    description: 'Faster payment received',
    merchant: 'J. Alabi',
    amount: 150.0,
    direction: 'credit',
    category: 'transfer',
  },
  {
    id: 'txn-1004',
    accountId: 'acc-current-001',
    date: '2026-08-01',
    description: 'Card payment',
    merchant: 'Northline Transit',
    amount: 12.4,
    direction: 'debit',
    category: 'transport',
  },
]

export const mockPayees: Payee[] = [
  {
    id: 'payee-001',
    name: 'Amara Okafor',
    accountNumberLast4: '7734',
    sortCode: '40-11-22',
    isVerified: true,
    previouslyPaid: true,
  },
  {
    id: 'payee-002',
    name: 'CityPower Energy',
    accountNumberLast4: '5590',
    sortCode: '60-00-01',
    isVerified: true,
    previouslyPaid: true,
  },
  {
    id: 'payee-003',
    name: 'New Payee — Unicorn Investments Ltd',
    accountNumberLast4: '0001',
    sortCode: '99-99-99',
    isVerified: false,
    previouslyPaid: false,
  },
]

export const glossary: Record<string, string> = {
  apr: 'APR stands for Annual Percentage Rate. It is the yearly cost of borrowing money, including interest and fees, shown as a percentage.',
  overdraft:
    'An overdraft lets you spend more money than you have in your account, up to an agreed limit, and the bank may charge interest on the amount you use.',
  'direct debit':
    'A direct debit is an instruction that lets a company take payments from your account automatically, usually for regular bills.',
  'standing order':
    'A standing order is a regular, fixed payment you set up yourself to send money to the same person or company, for example rent.',
  'available balance':
    'Your available balance is the money you can actually spend right now, after any pending payments or holds are taken into account.',
}
