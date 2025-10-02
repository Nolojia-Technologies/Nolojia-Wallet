import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface ChamaContribution {
  id: string
  chamaId: string
  memberId: string
  memberName: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'late'
}

export interface ChamaMember {
  id: string
  name: string
  email: string
  phone: string
  trustScore: number
  joinDate: string
  totalContributions: number
  nextPayoutTurn?: number
}

export interface Chama {
  id: string
  name: string
  purpose: string
  contributionAmount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  maxMembers: number
  members: ChamaMember[]
  totalSavings: number
  nextContributionDate: string
  createdBy: string
  createdAt: string
  currentPayoutTurn: number
  status: 'active' | 'completed' | 'paused'
}

export interface LoanRequest {
  id: string
  borrowerId: string
  borrowerName: string
  amount: number
  purpose: string
  repaymentPeriod: number // in days
  repaymentDate: string
  interestRate: number
  status: 'pending' | 'funded' | 'repaid' | 'defaulted'
  trustScore: number
  lenderId?: string
  lenderName?: string
  requestDate: string
}

export interface LenderOffering {
  id: string
  lenderId: string
  lenderName: string
  amount: number
  minAmount?: number // for flexible lending
  maxAmount?: number // for flexible lending
  lendingType?: 'fixed' | 'flexible'
  interestRate: number
  duration: number // in days
  penalties: {
    lateFeePercentage: number
    gracePeriodDays: number
  }
  additionalTerms: string
  status: 'available' | 'lent' | 'completed' | 'cancelled'
  createdAt: string
  isEditable: boolean // false once money is lent
  borrowerId?: string // set when loan is taken
  borrowerName?: string
  loanStartDate?: string
  repaymentDate?: string
}

export interface Loan {
  id: string
  requestId?: string // for borrower-initiated loans
  offeringId?: string // for lender-initiated loans
  borrowerId: string
  borrowerName: string
  lenderId: string
  lenderName: string
  amount: number
  interestRate: number
  repaymentAmount: number
  repaymentDate: string
  status: 'active' | 'repaid' | 'defaulted' | 'late'
  disbursedDate: string
  purpose: string
  penalties?: {
    lateFeePercentage: number
    gracePeriodDays: number
  }
  additionalTerms?: string
}

interface CommunityFinanceStore {
  // Chama state
  chamas: Chama[]
  contributions: ChamaContribution[]

  // P2P Lending state
  loanRequests: LoanRequest[]
  lenderOfferings: LenderOffering[]
  loans: Loan[]

  // Actions
  createChama: (chama: Omit<Chama, 'id' | 'createdAt' | 'totalSavings' | 'currentPayoutTurn'>) => void
  joinChama: (chamaId: string, member: Omit<ChamaMember, 'id' | 'joinDate' | 'totalContributions'>) => void
  makeContribution: (chamaId: string, memberId: string, amount: number) => void

  createLoanRequest: (request: Omit<LoanRequest, 'id' | 'requestDate' | 'status'>) => void
  fundLoan: (requestId: string, lenderId: string, lenderName: string) => void
  repayLoan: (loanId: string) => void

  // Lender offerings
  createLenderOffering: (offering: Omit<LenderOffering, 'id' | 'createdAt' | 'isEditable' | 'status'>) => void
  updateLenderOffering: (offeringId: string, updates: Partial<LenderOffering>) => void
  deleteLenderOffering: (offeringId: string) => void
  takeLenderOffering: (offeringId: string, borrowerId: string, borrowerName: string, purpose: string, customAmount?: number) => void

  // Wallet integration
  getWalletBalance: (userId: string) => number
  validateAndCleanupOfferings: (userId: string) => void

  getUserChamas: (userId: string) => Chama[]
  getUserLoans: (userId: string) => { borrowed: Loan[], lent: Loan[] }
  getUserLenderOfferings: (userId: string) => LenderOffering[]
}

// Mock data
const initialChamas: Chama[] = [
  {
    id: '1',
    name: 'Tech Professionals Chama',
    purpose: 'Emergency fund and investment',
    contributionAmount: 5000,
    frequency: 'monthly',
    maxMembers: 12,
    members: [
      {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        trustScore: 4.8,
        joinDate: '2024-01-01',
        totalContributions: 25000,
        nextPayoutTurn: 1
      },
      {
        id: 'u2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+254712345679',
        trustScore: 4.5,
        joinDate: '2024-01-01',
        totalContributions: 25000,
        nextPayoutTurn: 2
      },
      {
        id: 'u3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+254712345680',
        trustScore: 4.7,
        joinDate: '2024-01-15',
        totalContributions: 20000,
        nextPayoutTurn: 3
      }
    ],
    totalSavings: 70000,
    nextContributionDate: '2024-02-01',
    createdBy: 'u1',
    createdAt: '2024-01-01',
    currentPayoutTurn: 1,
    status: 'active'
  },
  {
    id: '2',
    name: 'Small Business Support',
    purpose: 'Business startup capital',
    contributionAmount: 2000,
    frequency: 'weekly',
    maxMembers: 8,
    members: [
      {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        trustScore: 4.8,
        joinDate: '2024-01-10',
        totalContributions: 8000,
        nextPayoutTurn: 1
      }
    ],
    totalSavings: 8000,
    nextContributionDate: '2024-01-22',
    createdBy: 'u1',
    createdAt: '2024-01-10',
    currentPayoutTurn: 1,
    status: 'active'
  }
]

const initialContributions: ChamaContribution[] = [
  {
    id: 'c1',
    chamaId: '1',
    memberId: 'u1',
    memberName: 'John Doe',
    amount: 5000,
    date: '2024-01-01',
    status: 'paid'
  },
  {
    id: 'c2',
    chamaId: '1',
    memberId: 'u2',
    memberName: 'Jane Smith',
    amount: 5000,
    date: '2024-01-01',
    status: 'paid'
  },
  {
    id: 'c3',
    chamaId: '1',
    memberId: 'u3',
    memberName: 'Mike Johnson',
    amount: 5000,
    date: '2024-02-01',
    status: 'pending'
  }
]

const initialLoanRequests: LoanRequest[] = [
  {
    id: 'lr1',
    borrowerId: 'u4',
    borrowerName: 'Sarah Wilson',
    amount: 15000,
    purpose: 'Medical emergency',
    repaymentPeriod: 30,
    repaymentDate: '2024-02-20',
    interestRate: 10,
    status: 'pending',
    trustScore: 4.2,
    requestDate: '2024-01-20'
  },
  {
    id: 'lr2',
    borrowerId: 'u5',
    borrowerName: 'David Brown',
    amount: 25000,
    purpose: 'Business inventory',
    repaymentPeriod: 60,
    repaymentDate: '2024-03-21',
    interestRate: 12,
    status: 'pending',
    trustScore: 3.8,
    requestDate: '2024-01-21'
  }
]

const initialLenderOfferings: LenderOffering[] = [
  {
    id: 'lo1',
    lenderId: 'u2',
    lenderName: 'Jane Smith',
    amount: 50000,
    lendingType: 'fixed',
    interestRate: 12,
    duration: 45,
    penalties: {
      lateFeePercentage: 5,
      gracePeriodDays: 3
    },
    additionalTerms: 'Repayment should be in weekly installments. Borrower must provide contact details.',
    status: 'available',
    createdAt: '2024-01-18',
    isEditable: true
  },
  {
    id: 'lo2',
    lenderId: 'u3',
    lenderName: 'Mike Johnson',
    amount: 25000,
    lendingType: 'fixed',
    interestRate: 15,
    duration: 30,
    penalties: {
      lateFeePercentage: 8,
      gracePeriodDays: 2
    },
    additionalTerms: 'Quick approval for borrowers with trust score above 4.0. Business purposes preferred.',
    status: 'available',
    createdAt: '2024-01-19',
    isEditable: true
  },
  {
    id: 'lo3',
    lenderId: 'u4',
    lenderName: 'Sarah Wilson',
    amount: 0, // Not used for flexible lending
    minAmount: 5000,
    maxAmount: 75000,
    lendingType: 'flexible',
    interestRate: 10,
    duration: 60,
    penalties: {
      lateFeePercentage: 3,
      gracePeriodDays: 5
    },
    additionalTerms: 'Flexible lending option. Borrower can choose amount between min and max. Good for various needs.',
    status: 'available',
    createdAt: '2024-01-20',
    isEditable: true
  }
]

const initialLoans: Loan[] = [
  {
    id: 'l1',
    requestId: 'lr3',
    borrowerId: 'u6',
    borrowerName: 'Alice Green',
    lenderId: 'u1',
    lenderName: 'John Doe',
    amount: 10000,
    interestRate: 8,
    repaymentAmount: 10800,
    repaymentDate: '2024-02-15',
    status: 'active',
    disbursedDate: '2024-01-15',
    purpose: 'School fees'
  }
]

export const useCommunityFinanceStore = create<CommunityFinanceStore>()(
  persist(
    (set, get) => ({
      chamas: initialChamas,
      contributions: initialContributions,
      loanRequests: initialLoanRequests,
      lenderOfferings: initialLenderOfferings,
      loans: initialLoans,

      createChama: (chamaData) => {
        const newChama: Chama = {
          ...chamaData,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          totalSavings: 0,
          currentPayoutTurn: 1
        }
        set((state) => ({
          chamas: [...state.chamas, newChama]
        }))
      },

      joinChama: (chamaId, memberData) => {
        const newMember: ChamaMember = {
          ...memberData,
          id: Math.random().toString(36).substring(7),
          joinDate: new Date().toISOString(),
          totalContributions: 0,
          nextPayoutTurn: 0
        }

        set((state) => ({
          chamas: state.chamas.map(chama =>
            chama.id === chamaId
              ? {
                  ...chama,
                  members: [...chama.members, newMember]
                }
              : chama
          )
        }))
      },

      makeContribution: (chamaId, memberId, amount) => {
        const contribution: ChamaContribution = {
          id: Math.random().toString(36).substring(7),
          chamaId,
          memberId,
          memberName: '',
          amount,
          date: new Date().toISOString(),
          status: 'paid'
        }

        // Find member name
        const chama = get().chamas.find(c => c.id === chamaId)
        const member = chama?.members.find(m => m.id === memberId)
        if (member) {
          contribution.memberName = member.name
        }

        set((state) => ({
          contributions: [...state.contributions, contribution],
          chamas: state.chamas.map(chama =>
            chama.id === chamaId
              ? {
                  ...chama,
                  totalSavings: chama.totalSavings + amount,
                  members: chama.members.map(member =>
                    member.id === memberId
                      ? { ...member, totalContributions: member.totalContributions + amount }
                      : member
                  )
                }
              : chama
          )
        }))
      },

      createLoanRequest: (requestData) => {
        const newRequest: LoanRequest = {
          ...requestData,
          id: Math.random().toString(36).substring(7),
          requestDate: new Date().toISOString(),
          status: 'pending'
        }

        set((state) => ({
          loanRequests: [...state.loanRequests, newRequest]
        }))
      },

      fundLoan: (requestId, lenderId, lenderName) => {
        const request = get().loanRequests.find(r => r.id === requestId)
        if (!request) return

        const repaymentAmount = request.amount * (1 + request.interestRate / 100)

        const newLoan: Loan = {
          id: Math.random().toString(36).substring(7),
          requestId,
          borrowerId: request.borrowerId,
          borrowerName: request.borrowerName,
          lenderId,
          lenderName,
          amount: request.amount,
          interestRate: request.interestRate,
          repaymentAmount,
          repaymentDate: request.repaymentDate,
          status: 'active',
          disbursedDate: new Date().toISOString(),
          purpose: request.purpose
        }

        set((state) => ({
          loans: [...state.loans, newLoan],
          loanRequests: state.loanRequests.map(req =>
            req.id === requestId
              ? { ...req, status: 'funded', lenderId, lenderName }
              : req
          )
        }))
      },

      repayLoan: (loanId) => {
        set((state) => ({
          loans: state.loans.map(loan =>
            loan.id === loanId
              ? { ...loan, status: 'repaid' }
              : loan
          )
        }))
      },

      // Lender offering methods
      createLenderOffering: (offeringData) => {
        const newOffering: LenderOffering = {
          ...offeringData,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          isEditable: true,
          status: 'available'
        }

        set((state) => ({
          lenderOfferings: [...state.lenderOfferings, newOffering]
        }))
      },

      updateLenderOffering: (offeringId, updates) => {
        set((state) => ({
          lenderOfferings: state.lenderOfferings.map(offering =>
            offering.id === offeringId && offering.isEditable
              ? { ...offering, ...updates }
              : offering
          )
        }))
      },

      deleteLenderOffering: (offeringId) => {
        set((state) => ({
          lenderOfferings: state.lenderOfferings.filter(offering => offering.id !== offeringId)
        }))
      },

      takeLenderOffering: (offeringId, borrowerId, borrowerName, purpose, customAmount?) => {
        const offering = get().lenderOfferings.find(o => o.id === offeringId)
        if (!offering) return

        // For flexible offerings, use custom amount; for fixed, use offering amount
        const loanAmount = customAmount && offering.lendingType === 'flexible' ? customAmount : offering.amount

        const repaymentDate = new Date()
        repaymentDate.setDate(repaymentDate.getDate() + offering.duration)
        const repaymentAmount = loanAmount * (1 + offering.interestRate / 100)

        const newLoan: Loan = {
          id: Math.random().toString(36).substring(7),
          offeringId,
          borrowerId,
          borrowerName,
          lenderId: offering.lenderId,
          lenderName: offering.lenderName,
          amount: loanAmount,
          interestRate: offering.interestRate,
          repaymentAmount,
          repaymentDate: repaymentDate.toISOString(),
          status: 'active',
          disbursedDate: new Date().toISOString(),
          purpose,
          penalties: offering.penalties,
          additionalTerms: offering.additionalTerms
        }

        set((state) => ({
          loans: [...state.loans, newLoan],
          lenderOfferings: state.lenderOfferings.map(offer =>
            offer.id === offeringId
              ? {
                  ...offer,
                  status: 'lent',
                  isEditable: false,
                  borrowerId,
                  borrowerName,
                  loanStartDate: new Date().toISOString(),
                  repaymentDate: repaymentDate.toISOString()
                }
              : offer
          )
        }))
      },

      // Wallet integration methods
      getWalletBalance: (userId) => {
        // Mock wallet balance - in real app, get from auth store or API
        const mockBalances: Record<string, number> = {
          'u1': 50000,
          'u2': 75000,
          'u3': 40000
        }
        return mockBalances[userId] || 25000
      },

      validateAndCleanupOfferings: (userId) => {
        const balance = get().getWalletBalance(userId)
        const userOfferings = get().lenderOfferings.filter(o => o.lenderId === userId && o.status === 'available')

        // Remove offerings that exceed wallet balance
        const offeringsToRemove = userOfferings.filter(offering => offering.amount > balance)

        if (offeringsToRemove.length > 0) {
          set((state) => ({
            lenderOfferings: state.lenderOfferings.filter(offering =>
              !offeringsToRemove.some(remove => remove.id === offering.id)
            )
          }))
        }
      },

      getUserChamas: (userId) => {
        return get().chamas.filter(chama =>
          chama.members.some(member => member.id === userId) || chama.createdBy === userId
        )
      },

      getUserLoans: (userId) => {
        const loans = get().loans
        return {
          borrowed: loans.filter(loan => loan.borrowerId === userId),
          lent: loans.filter(loan => loan.lenderId === userId)
        }
      },

      getUserLenderOfferings: (userId) => {
        return get().lenderOfferings.filter(offering => offering.lenderId === userId)
      }
    }),
    {
      name: 'community-finance-storage'
    }
  )
)