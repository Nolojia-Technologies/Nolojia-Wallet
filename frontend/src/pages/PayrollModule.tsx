import { useState } from 'react'
import {
  Users,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Star,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Send,
  FileText,
  Shield,
  History,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Briefcase,
  Award,
  Ban,
  PlayCircle,
  PauseCircle,
  UserCheck,
  Zap,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Employee = {
  id: string
  name: string
  walletId: string
  phoneNumber: string
  email?: string
  role: string
  projectType: 'short-term' | 'long-term' | 'casual'
  payRate: number
  payFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per-project'
  totalEarned: number
  totalPaid: number
  pendingAmount: number
  advanceAmount?: number
  trustScore: number
  employerRating?: number
  status: 'active' | 'completed' | 'suspended'
  joinedDate: string
  endDate?: string
  lastPaid?: string
  autoPayEnabled: boolean
  nextPaymentDate?: string
  performanceRating: number
  completedProjects: number
  disputes: number
  projectId?: string
  idUploaded: boolean
  kraVerified: boolean
  workHistory: WorkHistoryItem[]
}

type WorkHistoryItem = {
  employer: string
  role: string
  duration: string
  rating: number
  disputes: number
}

type Project = {
  id: string
  name: string
  type: 'short-term' | 'long-term'
  status: 'active' | 'completed' | 'paused'
  budget: number
  spent: number
  employees: string[]
  startDate: string
  endDate?: string
  description: string
  typeOfWork: string
}

type Dispute = {
  id: string
  employeeId: string
  employeeName: string
  employerId?: string
  amount: number
  reason: string
  raisedBy: 'employer' | 'employee'
  status: 'open' | 'in-review' | 'resolved' | 'rejected'
  createdAt: string
  escrowAmount?: number
  evidence?: string[]
  resolution?: string
}

type PaymentRecord = {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  type: 'regular' | 'advance' | 'bonus' | 'bulk'
  status: 'completed' | 'pending' | 'failed'
  date: string
  projectId?: string
}

export default function PayrollModule() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showRaiseDispute, setShowRaiseDispute] = useState(false)
  const [showViewEvidence, setShowViewEvidence] = useState(false)
  const [showSubmitEvidence, setShowSubmitEvidence] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [counterEvidenceFiles, setCounterEvidenceFiles] = useState<File[]>([])
  const [counterEvidenceNotes, setCounterEvidenceNotes] = useState('')

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    walletId: '',
    phoneNumber: '',
    email: '',
    role: '',
    payRate: '',
    payFrequency: 'monthly' as const,
    startDate: '',
    endDate: '',
    projectId: '',
  })

  const [newProject, setNewProject] = useState({
    name: '',
    type: 'short-term' as const,
    budget: '',
    startDate: '',
    endDate: '',
    description: '',
    typeOfWork: '',
  })

  // Mock employer stats
  const employerStats = {
    totalBudget: 15000000,
    totalPaid: 12500000,
    pendingPayments: 145000,
    totalEmployees: 24,
    activeProjects: 5,
    monthlyPayroll: 850000,
    trustScore: 87,
    onTimePayments: 96,
    disputes: 1,
    completedProjects: 18,
  }

  // Mock employees data
  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Kamau',
      walletId: 'JK2024',
      phoneNumber: '+254712345678',
      email: 'john@example.com',
      role: 'Senior Developer',
      projectType: 'long-term',
      payRate: 150000,
      payFrequency: 'monthly',
      totalEarned: 1500000,
      totalPaid: 1400000,
      pendingAmount: 100000,
      trustScore: 92,
      employerRating: 4.8,
      status: 'active',
      joinedDate: '2023-06-15',
      lastPaid: '2024-01-31',
      autoPayEnabled: true,
      nextPaymentDate: '2024-02-29',
      performanceRating: 4.9,
      completedProjects: 12,
      disputes: 0,
      projectId: '1',
      idUploaded: true,
      kraVerified: true,
      workHistory: [
        {
          employer: 'ABC Corp',
          role: 'Developer',
          duration: '2 years',
          rating: 4.8,
          disputes: 0,
        },
      ],
    },
    {
      id: '2',
      name: 'Mary Wanjiku',
      walletId: 'MW2024',
      phoneNumber: '+254723456789',
      role: 'UI/UX Designer',
      projectType: 'short-term',
      payRate: 5000,
      payFrequency: 'daily',
      totalEarned: 285000,
      totalPaid: 285000,
      pendingAmount: 0,
      trustScore: 85,
      employerRating: 4.6,
      status: 'active',
      joinedDate: '2024-01-10',
      lastPaid: '2024-02-02',
      autoPayEnabled: false,
      performanceRating: 4.7,
      completedProjects: 3,
      disputes: 0,
      projectId: '2',
      idUploaded: true,
      kraVerified: false,
      workHistory: [],
    },
    {
      id: '3',
      name: 'Peter Omondi',
      walletId: 'PO2024',
      phoneNumber: '+254734567890',
      role: 'Casual Laborer',
      projectType: 'casual',
      payRate: 1500,
      payFrequency: 'daily',
      totalEarned: 45000,
      totalPaid: 30000,
      pendingAmount: 15000,
      trustScore: 72,
      employerRating: 4.0,
      status: 'active',
      joinedDate: '2024-02-01',
      lastPaid: '2024-02-01',
      autoPayEnabled: false,
      performanceRating: 4.0,
      completedProjects: 1,
      disputes: 1,
      projectId: '3',
      idUploaded: false,
      kraVerified: false,
      workHistory: [],
    },
  ]

  // Mock projects data
  const projects: Project[] = [
    {
      id: '1',
      name: 'Mobile App Development',
      type: 'long-term',
      status: 'active',
      budget: 2000000,
      spent: 850000,
      employees: ['1'],
      startDate: '2023-11-01',
      description: 'Complete mobile banking application',
      typeOfWork: 'Software Development',
    },
    {
      id: '2',
      name: 'Website Redesign',
      type: 'short-term',
      status: 'active',
      budget: 500000,
      spent: 285000,
      employees: ['2'],
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      description: 'Corporate website redesign project',
      typeOfWork: 'Web Design',
    },
    {
      id: '3',
      name: 'Office Renovation',
      type: 'short-term',
      status: 'active',
      budget: 300000,
      spent: 135000,
      employees: ['3'],
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      description: 'Office interior renovation',
      typeOfWork: 'Construction',
    },
  ]

  // Mock disputes data
  const disputes: Dispute[] = [
    {
      id: '1',
      employeeId: '3',
      employeeName: 'Peter Omondi',
      amount: 15000,
      reason: 'Payment delay for 10 days work',
      raisedBy: 'employee',
      status: 'open',
      createdAt: '2024-02-03',
      escrowAmount: 15000,
      evidence: ['timesheet.pdf', 'photos.jpg'],
    },
  ]

  // Mock payment records
  const paymentRecords: PaymentRecord[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'John Kamau',
      amount: 150000,
      type: 'regular',
      status: 'completed',
      date: '2024-01-31',
      projectId: '1',
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Mary Wanjiku',
      amount: 25000,
      type: 'advance',
      status: 'completed',
      date: '2024-02-01',
      projectId: '2',
    },
  ]

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTrustScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'long-term':
        return 'bg-blue-100 text-blue-700'
      case 'short-term':
        return 'bg-purple-100 text-purple-700'
      case 'casual':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700'
      case 'in-review':
        return 'bg-yellow-100 text-yellow-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.walletId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    )
  }

  const handleBulkPayment = () => {
    // Implementation for bulk payment
    alert(`Processing payment for ${selectedEmployees.length} employees`)
  }

  const handleAddEmployee = () => {
    // Implementation for adding employee
    console.log('Adding employee:', newEmployee)
    setShowAddEmployee(false)
  }

  const handleAddProject = () => {
    // Implementation for adding project
    console.log('Adding project:', newProject)
    setShowAddProject(false)
  }

  const handleViewEvidence = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setShowViewEvidence(true)
  }

  const handleSubmitCounterEvidence = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setShowSubmitEvidence(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setCounterEvidenceFiles((prev) => [...prev, ...filesArray])
    }
  }

  const handleRemoveFile = (index: number) => {
    setCounterEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitCounterEvidenceForm = () => {
    // Implementation for submitting counter-evidence
    console.log('Submitting counter-evidence:', {
      disputeId: selectedDispute?.id,
      files: counterEvidenceFiles,
      notes: counterEvidenceNotes,
    })
    // Reset form
    setCounterEvidenceFiles([])
    setCounterEvidenceNotes('')
    setShowSubmitEvidence(false)
    alert('Counter-evidence submitted successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Complete payroll system with trust scores and dispute resolution
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddProject(true)}>
            <Briefcase className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add Project</span>
            <span className="sm:hidden">Project</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddEmployee(true)}>
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Employee</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  KES {employerStats.totalBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {employerStats.totalPaid.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  KES {employerStats.pendingPayments.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">{employerStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employer Trust Score */}
      <Card className="bg-gradient-to-r from-kenya-red to-red-600 text-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-white text-xl md:text-2xl flex items-center flex-wrap">
                Employer Trust Score
                <Award className="h-5 w-5 md:h-6 md:w-6 ml-2" />
              </CardTitle>
              <CardDescription className="text-white/80 text-sm">
                Your reputation as an employer (0-100 scale)
              </CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-4xl md:text-5xl font-bold">{employerStats.trustScore}</div>
              <div className="text-sm text-white/80">{getTrustScoreLabel(employerStats.trustScore)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <div className="text-white/80 text-xs md:text-sm">On-time Payments</div>
              <div className="text-xl md:text-2xl font-bold">{employerStats.onTimePayments}%</div>
            </div>
            <div>
              <div className="text-white/80 text-xs md:text-sm">Completed Projects</div>
              <div className="text-xl md:text-2xl font-bold">{employerStats.completedProjects}</div>
            </div>
            <div>
              <div className="text-white/80 text-xs md:text-sm">Active Disputes</div>
              <div className="text-xl md:text-2xl font-bold">{employerStats.disputes}</div>
            </div>
            <div>
              <div className="text-white/80 text-xs md:text-sm">Employee Rating</div>
              <div className="text-xl md:text-2xl font-bold flex items-center">
                <Star className="h-4 w-4 md:h-5 md:w-5 mr-1 fill-yellow-400 text-yellow-400" />
                <span className="hidden sm:inline">4.7/5.0</span>
                <span className="sm:hidden">4.7</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-xs md:text-sm text-white/90">
              💡 Your trust score affects your ability to hire top talent. Keep it high by paying on
              time and resolving disputes fairly.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="text-xs md:text-sm px-2 py-2">
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="text-xs md:text-sm px-2 py-2">
            <span className="hidden sm:inline">Employees</span>
            <span className="sm:hidden">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs md:text-sm px-2 py-2">
            <span className="hidden sm:inline">Projects</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs md:text-sm px-2 py-2">
            <span className="hidden sm:inline">Payments</span>
            <span className="sm:hidden">Pay</span>
          </TabsTrigger>
          <TabsTrigger value="disputes" className="text-xs md:text-sm px-2 py-2 relative">
            <span className="hidden sm:inline">Disputes</span>
            <span className="sm:hidden">Issues</span>
            {disputes.filter((d) => d.status === 'open').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                {disputes.filter((d) => d.status === 'open').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">One-Click Pay All</h3>
                  <p className="text-sm text-muted-foreground">Pay all active employees</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Pay All ({employees.filter((e) => e.status === 'active').length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Auto-Scheduled</h3>
                  <p className="text-sm text-muted-foreground">Setup automatic payments</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Generate Report</h3>
                  <p className="text-sm text-muted-foreground">Download payroll reports</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Bulk Upload</h3>
                  <p className="text-sm text-muted-foreground">Upload CSV/Excel</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowBulkUpload(true)}
                  >
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Scheduled Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Auto-Scheduled Payments
              </CardTitle>
              <CardDescription>Employees with automatic payment enabled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees
                  .filter((emp) => emp.autoPayEnabled && emp.nextPaymentDate)
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border rounded-lg gap-3"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-kenya-red to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{emp.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {emp.role} • {emp.walletId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-sm md:text-base">KES {emp.payRate.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.nextPaymentDate &&
                              new Date(emp.nextPaymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Activity</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentRecords.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()} •{' '}
                        <Badge variant="outline" className="ml-1">
                          {payment.type}
                        </Badge>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {payment.amount.toLocaleString()}</p>
                      <Badge
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          {/* Search, Filter and Bulk Actions */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, wallet ID, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {selectedEmployees.length > 0 && (
              <Button onClick={handleBulkPayment}>
                <Send className="h-4 w-4 mr-2" />
                Pay Selected ({selectedEmployees.length})
              </Button>
            )}
          </div>

          {/* Employee Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Employee Header with Checkbox */}
                    <div className="flex items-start gap-2 md:gap-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                        className="mt-4 md:mt-6 h-4 w-4 flex-shrink-0"
                      />
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 md:h-16 md:w-16 flex-shrink-0 bg-gradient-to-br from-kenya-red to-red-600 rounded-full flex items-center justify-center text-white text-base md:text-xl font-bold">
                          {employee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-semibold truncate">{employee.name}</h3>
                          <p className="text-sm md:text-base text-muted-foreground truncate">{employee.role}</p>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">ID: {employee.walletId}</Badge>
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{employee.phoneNumber}</Badge>
                            <Badge className={`${getProjectTypeColor(employee.projectType)} text-xs`}>
                              {employee.projectType}
                            </Badge>
                            {employee.status === 'active' && (
                              <Badge variant="default" className="text-xs">
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {employee.status === 'suspended' && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                            {employee.status === 'completed' && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="h-4 w-4 mr-2" />
                            Work History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            View Documents
                          </DropdownMenuItem>
                          {employee.status === 'active' && (
                            <DropdownMenuItem>
                              <PauseCircle className="h-4 w-4 mr-2" />
                              Suspend Employee
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Trust Score & Verification */}
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Trust Score</span>
                          <Badge className={getTrustScoreColor(employee.trustScore)}>
                            {employee.trustScore}/100
                          </Badge>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="bg-kenya-red h-2 rounded-full"
                            style={{ width: `${employee.trustScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {employee.idUploaded && (
                          <Badge variant="outline" className="bg-green-50">
                            <UserCheck className="h-3 w-3 mr-1 text-green-600" />
                            ID Verified
                          </Badge>
                        )}
                        {employee.kraVerified && (
                          <Badge variant="outline" className="bg-blue-50">
                            <Shield className="h-3 w-3 mr-1 text-blue-600" />
                            KRA
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pay Agreement & Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Pay Rate</p>
                        <p className="font-semibold text-sm md:text-base">
                          KES {employee.payRate.toLocaleString()}
                          <span className="text-xs text-muted-foreground block sm:inline">
                            <span className="hidden sm:inline">/</span>{employee.payFrequency}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                        <p className="font-semibold text-sm md:text-base text-orange-600">
                          KES {employee.pendingAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Paid</p>
                        <p className="font-semibold text-sm md:text-base text-green-600">
                          KES {employee.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Performance</p>
                        <p className="font-semibold text-sm md:text-base flex items-center">
                          <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 text-yellow-500 fill-yellow-500" />
                          {employee.performanceRating}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Disputes</p>
                        <p
                          className={`font-semibold text-sm md:text-base ${employee.disputes > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {employee.disputes}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                      <Button size="sm" className="flex-1 sm:flex-initial">
                        <Send className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Pay Now</span>
                        <span className="sm:hidden">Pay</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                        <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden md:inline">Advance Payment (50%)</span>
                        <span className="md:hidden">Advance</span>
                      </Button>
                      <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      {employee.disputes > 0 && (
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-initial">
                          <AlertCircle className="h-4 w-4 mr-1 md:mr-2" />
                          Dispute
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto sm:ml-auto"
                        onClick={() =>
                          setExpandedEmployee(
                            expandedEmployee === employee.id ? null : employee.id
                          )
                        }
                      >
                        {expandedEmployee === employee.id ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Less Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            More Details
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Expanded Work History */}
                    {expandedEmployee === employee.id && (
                      <div className="pt-4 border-t space-y-3">
                        <h4 className="font-semibold">Work History Ledger</h4>
                        {employee.workHistory.length > 0 ? (
                          employee.workHistory.map((history, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{history.employer}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {history.role} • {history.duration}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                                    <span className="font-medium">{history.rating}/5.0</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {history.disputes} disputes
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No previous work history available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.typeOfWork} • {project.description}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        project.type === 'long-term'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }
                    >
                      {project.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">KES {project.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-semibold text-orange-600">
                        KES {project.spent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="font-semibold">{project.employees.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Budget Used</span>
                      <span className="font-medium">
                        {Math.round((project.spent / project.budget) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-kenya-red h-2 rounded-full"
                        style={{
                          width: `${Math.min((project.spent / project.budget) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      View Team ({project.employees.length})
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                    {project.status === 'active' && (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Close Project
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentRecords.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.employeeName}</p>
                        <Badge variant="outline">{payment.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()} •{' '}
                        {new Date(payment.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        KES {payment.amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Dispute Resolution Center</h3>
              <p className="text-sm text-muted-foreground">
                Manage disputes with escrow protection
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowRaiseDispute(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Raise Dispute
            </Button>
          </div>

          {disputes.length > 0 ? (
            disputes.map((dispute) => (
              <Card key={dispute.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-red-600" />
                        Dispute #{dispute.id}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Raised by {dispute.raisedBy === 'employee' ? dispute.employeeName : 'You'}{' '}
                        on {new Date(dispute.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getDisputeStatusColor(dispute.status)}>
                      {dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100">
                    <p className="font-medium mb-2">Dispute Reason:</p>
                    <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Disputed Amount</p>
                      <p className="font-semibold text-lg">
                        KES {dispute.amount.toLocaleString()}
                      </p>
                    </div>
                    {dispute.escrowAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground">Escrow Amount</p>
                        <p className="font-semibold text-lg text-orange-600">
                          KES {dispute.escrowAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {dispute.evidence && dispute.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Evidence Submitted:</p>
                      <div className="flex flex-wrap gap-2">
                        {dispute.evidence.map((file, idx) => (
                          <Badge key={idx} variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {dispute.status === 'open' && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900 dark:text-yellow-400">
                            Funds Held in Escrow
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            The disputed amount has been moved to escrow and frozen until
                            resolution. Please review the evidence and respond appropriately.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                    <Button className="flex-1 min-w-[140px]" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Approve & Release Funds</span>
                      <span className="md:hidden">Approve & Pay</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                      size="sm"
                      onClick={() => handleViewEvidence(dispute)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">View All Evidence</span>
                      <span className="md:hidden">View Evidence</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                      size="sm"
                      onClick={() => handleSubmitCounterEvidence(dispute)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Submit Counter-Evidence</span>
                      <span className="md:hidden">Submit Evidence</span>
                    </Button>
                    <Button variant="destructive" className="flex-1 min-w-[140px]" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Disputes</h3>
                <p className="text-muted-foreground">
                  All payments are proceeding smoothly with no disputes raised
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl">Add New Employee</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Fill in employee details and pay agreement</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => setShowAddEmployee(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletId">Wallet ID / User Code *</Label>
                  <Input
                    id="walletId"
                    value={newEmployee.walletId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, walletId: e.target.value })
                    }
                    placeholder="JD2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={newEmployee.phoneNumber}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })
                    }
                    placeholder="+254712345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Position *</Label>
                  <Input
                    id="role"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    placeholder="Software Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payRate">Pay Rate (KES) *</Label>
                  <Input
                    id="payRate"
                    type="number"
                    value={newEmployee.payRate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, payRate: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payFrequency">Pay Frequency *</Label>
                  <select
                    id="payFrequency"
                    className="w-full border rounded-md p-2"
                    value={newEmployee.payFrequency}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        payFrequency: e.target.value as any,
                      })
                    }
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="per-project">Per Project</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Assign to Project (Optional)</Label>
                  <select
                    id="projectId"
                    className="w-full border rounded-md p-2"
                    value={newEmployee.projectId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, projectId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newEmployee.startDate}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newEmployee.endDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Trust Verification (Optional)</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Upload ID Document
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Upload KRA PIN Certificate
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 sm:pt-4">
                <Button variant="outline" className="flex-1" size="sm" onClick={() => setShowAddEmployee(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" size="sm" onClick={handleAddEmployee}>
                  Add Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl">Create New Project</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Set up a new project and manage its workforce
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => setShowAddProject(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Website Development Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type *</Label>
                  <select
                    id="projectType"
                    className="w-full border rounded-md p-2"
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value as any })}
                  >
                    <option value="short-term">Short-term</option>
                    <option value="long-term">Long-term</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectBudget">Budget (KES) *</Label>
                  <Input
                    id="projectBudget"
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectStartDate">Start Date *</Label>
                  <Input
                    id="projectStartDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectEndDate">End Date (Optional)</Label>
                  <Input
                    id="projectEndDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="typeOfWork">Type of Work *</Label>
                  <Input
                    id="typeOfWork"
                    value={newProject.typeOfWork}
                    onChange={(e) => setNewProject({ ...newProject, typeOfWork: e.target.value })}
                    placeholder="Software Development, Construction, etc."
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="projectDescription">Description *</Label>
                  <textarea
                    id="projectDescription"
                    className="w-full border rounded-md p-2 min-h-[100px]"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                    placeholder="Brief description of the project..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => setShowAddProject(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" size="sm" onClick={handleAddProject}>
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Evidence Modal */}
      {showViewEvidence && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center text-lg sm:text-xl flex-wrap">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="break-words">All Evidence - Dispute #{selectedDispute.id}</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Review all submitted evidence for this dispute
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    setShowViewEvidence(false)
                    setSelectedDispute(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Dispute Summary */}
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Raised By</p>
                    <p className="font-medium">
                      {selectedDispute.raisedBy === 'employee'
                        ? selectedDispute.employeeName
                        : 'You (Employer)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Raised</p>
                    <p className="font-medium">
                      {new Date(selectedDispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">KES {selectedDispute.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getDisputeStatusColor(selectedDispute.status)}>
                      {selectedDispute.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="font-medium mt-1">{selectedDispute.reason}</p>
                </div>
              </div>

              {/* Employee Evidence */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600" />
                  Employee Evidence
                </h3>
                {selectedDispute.evidence && selectedDispute.evidence.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDispute.evidence.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{file}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded on {new Date(selectedDispute.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8 bg-muted rounded-lg">
                    No evidence submitted yet
                  </p>
                )}
              </div>

              {/* Employer Counter-Evidence (Mock) */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-orange-600" />
                  Your Counter-Evidence
                </h3>
                <div className="space-y-3">
                  {/* Mock counter-evidence */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">payment_confirmation.pdf</p>
                        <p className="text-sm text-muted-foreground">Uploaded yesterday</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Dispute Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dispute Raised</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedDispute.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Funds Moved to Escrow</p>
                      <p className="text-sm text-muted-foreground">
                        KES {selectedDispute.escrowAmount?.toLocaleString()} held
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    setShowViewEvidence(false)
                    setSelectedDispute(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    setShowViewEvidence(false)
                    handleSubmitCounterEvidence(selectedDispute)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Submit Counter-Evidence</span>
                  <span className="sm:hidden">Submit Evidence</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Counter-Evidence Modal */}
      {showSubmitEvidence && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    Submit Counter-Evidence
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Upload documents and provide details to support your case
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    setShowSubmitEvidence(false)
                    setSelectedDispute(null)
                    setCounterEvidenceFiles([])
                    setCounterEvidenceNotes('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Dispute Info */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Responding to Dispute</p>
                <p className="font-semibold text-lg">#{selectedDispute.id}</p>
                <p className="text-sm mt-1">{selectedDispute.reason}</p>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label>Upload Supporting Documents</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="evidence-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported: PDF, Images, Word documents
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('evidence-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                {/* Uploaded Files List */}
                {counterEvidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files ({counterEvidenceFiles.length})</p>
                    {counterEvidenceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="evidence-notes">Additional Notes / Explanation</Label>
                <textarea
                  id="evidence-notes"
                  className="w-full border rounded-md p-3 min-h-[120px]"
                  placeholder="Provide detailed explanation of your counter-evidence..."
                  value={counterEvidenceNotes}
                  onChange={(e) => setCounterEvidenceNotes(e.target.value)}
                />
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                      Important Information
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li>All evidence will be reviewed by the dispute resolution team</li>
                      <li>Make sure documents are clear and legible</li>
                      <li>Include payment confirmations, timesheets, or communication records</li>
                      <li>The employee will be able to view your counter-evidence</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    setShowSubmitEvidence(false)
                    setSelectedDispute(null)
                    setCounterEvidenceFiles([])
                    setCounterEvidenceNotes('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={handleSubmitCounterEvidenceForm}
                  disabled={counterEvidenceFiles.length === 0 && !counterEvidenceNotes.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Evidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl">Bulk Upload Employees</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Upload CSV or Excel file with employee data</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => setShowBulkUpload(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV and Excel (.xlsx) files
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2">Required Columns:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Full Name</li>
                  <li>• Wallet ID / User Code</li>
                  <li>• Phone Number (+254XXXXXXXXX)</li>
                  <li>• Role / Position</li>
                  <li>• Pay Rate (KES)</li>
                  <li>• Pay Frequency (hourly/daily/weekly/monthly/per-project)</li>
                  <li>• Start Date (YYYY-MM-DD)</li>
                  <li>• Email (Optional)</li>
                  <li>• End Date (Optional)</li>
                </ul>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
