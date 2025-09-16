import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Users,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  UserPlus,
  Bell
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useCommunityFinanceStore, type Chama, type ChamaMember } from '@/store/communityFinanceStore'
import { formatCurrency } from '@/lib/utils'

interface ChamaSectionProps {
  currentUserId: string
}

interface CreateChamaForm {
  name: string
  purpose: string
  contributionAmount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  maxMembers: number
}

interface ChamaDetailsViewProps {
  chama: Chama
  currentUserId: string
  onBack: () => void
}

function ChamaDetailsView({ chama, currentUserId, onBack }: ChamaDetailsViewProps) {
  const { contributions, makeContribution } = useCommunityFinanceStore()
  const [activeTab, setActiveTab] = useState('overview')

  const chamaContributions = contributions.filter(c => c.chamaId === chama.id)
  const userMember = chama.members.find(m => m.id === currentUserId)

  const getContributionStatus = (memberId: string) => {
    const memberContributions = chamaContributions.filter(c => c.memberId === memberId)
    const lastContribution = memberContributions[memberContributions.length - 1]

    if (!lastContribution) return 'pending'

    const contributionDate = new Date(lastContribution.date)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24))

    if (chama.frequency === 'monthly' && daysDiff > 30) return 'late'
    if (chama.frequency === 'weekly' && daysDiff > 7) return 'late'
    if (chama.frequency === 'daily' && daysDiff > 1) return 'late'

    return lastContribution.status
  }

  const handleContribute = () => {
    if (userMember) {
      makeContribution(chama.id, currentUserId, chama.contributionAmount)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'late':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertTriangle className="w-3 h-3 mr-1" />Late</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>← Back to Chamas</Button>
        <div className="flex space-x-2">
          {userMember && (
            <Button onClick={handleContribute}>
              <DollarSign className="w-4 h-4 mr-2" />
              Contribute {formatCurrency(chama.contributionAmount)}
            </Button>
          )}
          <Button variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{chama.name}</CardTitle>
              <CardDescription>{chama.purpose}</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              {chama.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(chama.totalSavings)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold">{chama.members.length}/{chama.maxMembers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contribution</p>
              <p className="text-2xl font-bold">{formatCurrency(chama.contributionAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Frequency</p>
              <p className="text-2xl font-bold capitalize">{chama.frequency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Payout Schedule</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
              <CardDescription>Recent contribution activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chama.members.map((member) => {
                  const status = getContributionStatus(member.id)

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">
                            Total: {formatCurrency(member.totalContributions)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status === 'late' && (
                          <Bell className="w-4 h-4 text-red-500" />
                        )}
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Payout Schedule</CardTitle>
              <CardDescription>Rotational payout order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chama.members
                  .sort((a, b) => (a.nextPayoutTurn || 0) - (b.nextPayoutTurn || 0))
                  .map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">
                            Turn {member.nextPayoutTurn}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Next Beneficiary
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Chama member information and trust scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chama.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-sm text-gray-600">{member.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTrustScoreColor(member.trustScore)}`}>
                        Trust: {member.trustScore}/5.0
                      </p>
                      <p className="text-sm text-gray-600">
                        Joined {new Date(member.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ChamaSection({ currentUserId }: ChamaSectionProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'details'>('dashboard')
  const [selectedChama, setSelectedChama] = useState<Chama | null>(null)

  const { chamas, createChama } = useCommunityFinanceStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateChamaForm>()

  const userChamas = chamas.filter(chama =>
    chama.members.some(member => member.id === currentUserId) || chama.createdBy === currentUserId
  )

  const onSubmit = (data: CreateChamaForm) => {
    const mockUser: ChamaMember = {
      id: currentUserId,
      name: 'John Doe', // In real app, get from auth store
      email: 'john@example.com',
      phone: '+254712345678',
      trustScore: 4.8,
      joinDate: new Date().toISOString(),
      totalContributions: 0,
      nextPayoutTurn: 1
    }

    createChama({
      ...data,
      members: [mockUser],
      nextContributionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      createdBy: currentUserId,
      status: 'active'
    })

    reset()
    setActiveView('dashboard')
  }

  const getDaysUntilContribution = (date: string) => {
    const contributionDate = new Date(date)
    const today = new Date()
    const timeDiff = contributionDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  if (activeView === 'details' && selectedChama) {
    return (
      <ChamaDetailsView
        chama={selectedChama}
        currentUserId={currentUserId}
        onBack={() => setActiveView('dashboard')}
      />
    )
  }

  if (activeView === 'create') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Chama</CardTitle>
              <CardDescription>Start a new group savings initiative</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setActiveView('dashboard')}>
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chama Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Tech Professionals Chama"
                  {...register('name', { required: 'Chama name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributionAmount">Contribution Amount (KES) *</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  placeholder="5000"
                  {...register('contributionAmount', {
                    required: 'Contribution amount is required',
                    min: { value: 100, message: 'Minimum contribution is KES 100' }
                  })}
                />
                {errors.contributionAmount && (
                  <p className="text-sm text-red-600">{errors.contributionAmount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Input
                id="purpose"
                placeholder="e.g., Emergency fund, Investment, Business capital"
                {...register('purpose', { required: 'Purpose is required' })}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Contribution Frequency *</Label>
                <select
                  id="frequency"
                  {...register('frequency', { required: 'Frequency is required' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {errors.frequency && (
                  <p className="text-sm text-red-600">{errors.frequency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members *</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="12"
                  {...register('maxMembers', {
                    required: 'Maximum members is required',
                    min: { value: 2, message: 'Minimum 2 members required' },
                    max: { value: 50, message: 'Maximum 50 members allowed' }
                  })}
                />
                {errors.maxMembers && (
                  <p className="text-sm text-red-600">{errors.maxMembers.message}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-900 mb-2">Chama Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Regular contributions build trust and strengthen the group</li>
                <li>• Payouts are rotational - each member gets their turn</li>
                <li>• Missed contributions affect your trust score</li>
                <li>• All transactions are recorded for transparency</li>
              </ul>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Chama
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Chamas</h2>
        <Button onClick={() => setActiveView('create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Chama
        </Button>
      </div>

      {userChamas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">You haven't joined any Chamas yet</p>
            <p className="text-sm text-gray-500 mb-4">Create or join a Chama to start group savings</p>
            <Button onClick={() => setActiveView('create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Chama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userChamas.map((chama) => {
            const daysUntil = getDaysUntilContribution(chama.nextContributionDate)
            const progressPercentage = Math.min((chama.totalSavings / (chama.contributionAmount * chama.maxMembers * 12)) * 100, 100)

            return (
              <Card key={chama.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {chama.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {chama.members.length}/{chama.maxMembers} members
                    </span>
                  </div>
                  <CardTitle className="text-lg">{chama.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{chama.purpose}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Savings</span>
                      <span className="font-semibold">{formatCurrency(chama.totalSavings)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        Next: {daysUntil > 0 ? `${daysUntil} days` : 'Due now'}
                      </span>
                    </div>
                    <span className="font-medium text-green-600">
                      {formatCurrency(chama.contributionAmount)} / {chama.frequency}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedChama(chama)
                        setActiveView('details')
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Contribute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}