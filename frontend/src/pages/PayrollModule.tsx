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
  userCode: string
  avatar?: string
  role: string
  projectType: 'short-term' | 'long-term' | 'casual'
  payRate: number
  payFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  totalEarned: number
  totalPaid: number
  pendingAmount: number
  trustScore: number
  status: 'active' | 'inactive' | 'suspended'
  joinedDate: string
  lastPaid?: string
  autoPayEnabled: boolean
  nextPaymentDate?: string
  performanceRating: number
  completedProjects: number
  disputes: number
}

type Project = {
  id: string
  name: string
  type: 'short-term' | 'long-term'
  status: 'active' | 'completed' | 'paused'
  budget: number
  spent: number
  employees: number
  startDate: string
  endDate?: string
  description: string
}

type Dispute = {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  reason: string
  status: 'open' | 'in-review' | 'resolved' | 'rejected'
  createdAt: string
  escrowAmount?: number
}

export default function PayrollModule() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

  // Mock employer stats
  const employerStats = {
    totalEmployees: 24,
    activeProjects: 5,
    monthlyPayroll: 850000,
    trustScore: 4.7,
    onTimePayments: 96,
    totalPaid: 12500000,
    pendingPayments: 145000,
  }

  // Mock employees data
  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Kamau',
      userCode: 'JK2024',
      role: 'Senior Developer',
      projectType: 'long-term',
      payRate: 150000,
      payFrequency: 'monthly',
      totalEarned: 1500000,
      totalPaid: 1400000,
      pendingAmount: 100000,
      trustScore: 4.8,
      status: 'active',
      joinedDate: '2023-06-15',
      lastPaid: '2024-01-31',
      autoPayEnabled: true,
      nextPaymentDate: '2024-02-29',
      performanceRating: 4.9,
      completedProjects: 12,
      disputes: 0,
    },
    {
      id: '2',
      name: 'Mary Wanjiku',
      userCode: 'MW2024',
      role: 'UI/UX Designer',
      projectType: 'short-term',
      payRate: 5000,
      payFrequency: 'daily',
      totalEarned: 285000,
      totalPaid: 285000,
      pendingAmount: 0,
      trustScore: 4.6,
      status: 'active',
      joinedDate: '2024-01-10',
      lastPaid: '2024-02-02',
      autoPayEnabled: false,
      performanceRating: 4.7,
      completedProjects: 3,
      disputes: 0,
    },
    {
      id: '3',
      name: 'Peter Omondi',
      userCode: 'PO2024',
      role: 'Casual Laborer',
      projectType: 'casual',
      payRate: 1500,
      payFrequency: 'daily',
      totalEarned: 45000,
      totalPaid: 30000,
      pendingAmount: 15000,
      trustScore: 4.2,
      status: 'active',
      joinedDate: '2024-02-01',
      lastPaid: '2024-02-01',
      autoPayEnabled: false,
      performanceRating: 4.0,
      completedProjects: 1,
      disputes: 1,
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
      employees: 8,
      startDate: '2023-11-01',
      description: 'Complete mobile banking application',
    },
    {
      id: '2',
      name: 'Website Redesign',
      type: 'short-term',
      status: 'active',
      budget: 500000,
      spent: 285000,
      employees: 4,
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      description: 'Corporate website redesign project',
    },
    {
      id: '3',
      name: 'Office Renovation',
      type: 'short-term',
      status: 'active',
      budget: 300000,
      spent: 135000,
      employees: 12,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      description: 'Office interior renovation',
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
      status: 'open',
      createdAt: '2024-02-03',
      escrowAmount: 15000,
    },
  ]

  const getTrustScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
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
      emp.userCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage employees, projects, and payments with trust-based system
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowAddProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
          <Button onClick={() => setShowAddEmployee(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employer Trust Score Card */}
      <Card className="bg-gradient-to-r from-kenya-red to-red-600 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-2xl flex items-center">
                Employer Trust Score
                <Star className="h-6 w-6 ml-2 fill-yellow-400 text-yellow-400" />
              </CardTitle>
              <CardDescription className="text-white/80">
                Based on payment history and employee ratings
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{employerStats.trustScore}</div>
              <div className="text-sm text-white/80">out of 5.0</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-white/80 text-sm">On-time Payments</div>
              <div className="text-2xl font-bold">{employerStats.onTimePayments}%</div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Total Paid</div>
              <div className="text-2xl font-bold">
                KES {(employerStats.totalPaid / 1000000).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Active Employees</div>
              <div className="text-2xl font-bold">{employerStats.totalEmployees}</div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Active Projects</div>
              <div className="text-2xl font-bold">{employerStats.activeProjects}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes
            {disputes.filter((d) => d.status === 'open').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {disputes.filter((d) => d.status === 'open').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                    <p className="text-2xl font-bold">
                      KES {employerStats.monthlyPayroll.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold">
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
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{employerStats.totalEmployees}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{employerStats.activeProjects}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Scheduled Payments
              </CardTitle>
              <CardDescription>Auto-scheduled payments for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees
                  .filter((emp) => emp.autoPayEnabled && emp.nextPaymentDate)
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-kenya-red to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {emp.role} • {emp.userCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">KES {emp.payRate.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {emp.nextPaymentDate &&
                            new Date(emp.nextPaymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        Auto-pay
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Send className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Bulk Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay multiple employees at once
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Start Bulk Pay
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Generate Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Download payroll reports
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Set Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure auto-payments
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, code, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Employee Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Employee Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gradient-to-br from-kenya-red to-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {employee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{employee.name}</h3>
                          <p className="text-muted-foreground">{employee.role}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{employee.userCode}</Badge>
                            <Badge className={getProjectTypeColor(employee.projectType)}>
                              {employee.projectType}
                            </Badge>
                            <Badge
                              variant={employee.status === 'active' ? 'default' : 'secondary'}
                            >
                              {employee.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
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
                            Payment History
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Employee Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pay Rate</p>
                        <p className="font-semibold">
                          KES {employee.payRate.toLocaleString()}
                          <span className="text-xs text-muted-foreground">
                            /{employee.payFrequency}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Amount</p>
                        <p className="font-semibold text-orange-600">
                          KES {employee.pendingAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trust Score</p>
                        <p className={`font-semibold flex items-center ${getTrustScoreColor(employee.trustScore)}`}>
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          {employee.trustScore}/5.0
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className="font-semibold flex items-center">
                          {employee.performanceRating}/5.0
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projects Done</p>
                        <p className="font-semibold">{employee.completedProjects}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Payment
                        </Button>
                        {employee.disputes > 0 && (
                          <Button variant="destructive" size="sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            View Dispute
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
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

                    {/* Expanded Details */}
                    {expandedEmployee === employee.id && (
                      <div className="pt-4 border-t space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Earned</p>
                            <p className="font-medium">
                              KES {employee.totalEarned.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Paid</p>
                            <p className="font-medium">
                              KES {employee.totalPaid.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Joined Date</p>
                            <p className="font-medium">
                              {new Date(employee.joinedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Paid</p>
                            <p className="font-medium">
                              {employee.lastPaid
                                ? new Date(employee.lastPaid).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={employee.autoPayEnabled}
                              className="h-4 w-4"
                              readOnly
                            />
                            <span className="text-sm font-medium">
                              Automatic payments enabled
                            </span>
                          </div>
                          {employee.nextPaymentDate && (
                            <span className="text-sm text-muted-foreground">
                              Next: {new Date(employee.nextPaymentDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
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
                        {project.description}
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
                      <p className="font-semibold">
                        KES {project.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-semibold text-orange-600">
                        KES {project.spent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="font-semibold">{project.employees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                      >
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

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Started: {new Date(project.startDate).toLocaleDateString()}
                    </span>
                    {project.endDate && (
                      <span className="text-muted-foreground">
                        Ends: {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Team
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
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
                        Raised by {dispute.employeeName} on{' '}
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getDisputeStatusColor(dispute.status)}>
                      {dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
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

                  {dispute.status === 'open' && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900">
                            Amount held in escrow
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            The disputed amount has been moved to escrow until resolution.
                            Please review and respond to the dispute.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Pay
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      View Evidence
                    </Button>
                    <Button variant="destructive" className="flex-1">
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
    </div>
  )
}
