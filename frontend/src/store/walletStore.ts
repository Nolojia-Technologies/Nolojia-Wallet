import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TopUpTransaction {
  id: string
  method: string
  amount: number
  fee: number
  totalAmount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  paymentDetails?: any
  createdAt: string
  completedAt?: string
}

interface WalletStore {
  balance: number
  isBalanceVisible: boolean
  transactions: TopUpTransaction[]
  isLoading: boolean

  // Actions
  setBalance: (balance: number) => void
  updateBalance: (amount: number) => void
  toggleBalanceVisibility: () => void
  addTopUpTransaction: (transaction: TopUpTransaction) => void
  updateTopUpTransaction: (id: string, updates: Partial<TopUpTransaction>) => void
  setTransactions: (transactions: TopUpTransaction[]) => void
  setLoading: (loading: boolean) => void
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 50000, // Mock initial balance
      isBalanceVisible: true,
      transactions: [],
      isLoading: false,

      setBalance: (balance: number) => {
        set({ balance })
      },

      updateBalance: (amount: number) => {
        const currentBalance = get().balance
        set({ balance: currentBalance + amount })
      },

      toggleBalanceVisibility: () => {
        const isVisible = get().isBalanceVisible
        set({ isBalanceVisible: !isVisible })
        localStorage.setItem('balanceVisible', JSON.stringify(!isVisible))
      },

      addTopUpTransaction: (transaction: TopUpTransaction) => {
        const transactions = get().transactions
        set({ transactions: [transaction, ...transactions] })
      },

      updateTopUpTransaction: (id: string, updates: Partial<TopUpTransaction>) => {
        const transactions = get().transactions
        const updatedTransactions = transactions.map(tx =>
          tx.id === id ? { ...tx, ...updates } : tx
        )
        set({ transactions: updatedTransactions })

        // If transaction is completed, update balance
        if (updates.status === 'COMPLETED') {
          const transaction = transactions.find(tx => tx.id === id)
          if (transaction) {
            get().updateBalance(transaction.amount)
          }
        }
      },

      setTransactions: (transactions: TopUpTransaction[]) => {
        set({ transactions })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'nolojia-wallet',
      partialize: (state) => ({
        balance: state.balance,
        isBalanceVisible: state.isBalanceVisible,
        transactions: state.transactions,
      }),
    }
  )
)