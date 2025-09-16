import { useState } from 'react'
import { Users, Upload, FileText, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PayrollModule() {
  const [file, setFile] = useState<File | null>(null)
  const [batchName, setBatchName] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  // Mock payroll batches
  const payrollBatches = [
    {
      id: '1',
      batchName: 'January 2024 Salaries',
      totalEmployees: 25,
      totalAmount: 2500000,
      processedEmployees: 25,
      status: 'COMPLETED',
      createdAt: '2024-01-31T10:00:00Z'
    },
    {
      id: '2', 
      batchName: 'December 2023 Bonus',
      totalEmployees: 25,
      totalAmount: 500000,
      processedEmployees: 20,
      status: 'PROCESSING',
      createdAt: '2023-12-20T14:30:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'PROCESSING': return 'text-blue-600 bg-blue-100'
      case 'FAILED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-gray-600 mt-1">Process employee salaries with automatic deductions</p>
      </div>

      {/* Upload Payroll Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Payroll</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file with employee salary information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">Batch Name</Label>
            <Input
              id="batchName"
              placeholder="e.g., January 2024 Salaries"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payrollFile">Payroll CSV File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="payrollFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-green-600 mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('payrollFile')?.click()}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Click to upload CSV file or drag and drop</p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('payrollFile')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
            <div className="text-gray-700 space-y-1">
              <p>• Columns: Name, National ID, Phone, Email, Gross Salary</p>
              <p>• Phone numbers in format: +254XXXXXXXXX</p>
              <p>• National IDs must be 8 digits</p>
              <p>• System will auto-calculate PAYE, NHIF, NSSF deductions</p>
            </div>
          </div>

          <Button 
            className="w-full" 
            disabled={!file || !batchName.trim()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </CardContent>
      </Card>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Payroll History</span>
          </CardTitle>
          <CardDescription>
            View and manage your payroll batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollBatches.length > 0 ? (
            <div className="space-y-4">
              {payrollBatches.map((batch) => (
                <div key={batch.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{batch.batchName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Employees</p>
                      <p className="font-medium">{batch.totalEmployees}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-medium">KES {batch.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Processed</p>
                      <p className="font-medium">{batch.processedEmployees}/{batch.totalEmployees}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {batch.status === 'PROCESSING' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round((batch.processedEmployees / batch.totalEmployees) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(batch.processedEmployees / batch.totalEmployees) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {batch.status === 'COMPLETED' && (
                      <Button variant="outline" size="sm">
                        Download Report
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payroll batches yet</p>
              <p className="text-sm">Upload your first CSV file to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Features</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic PAYE calculation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>NHIF & NSSF deductions</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Loan repayment deductions</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Bulk SMS notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Digital payslips</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Compliance reporting</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}