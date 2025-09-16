import { useState } from 'react'
import { MessageCircle, Phone, Mail, FileText, AlertCircle, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Support() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('')

  const supportCategories = [
    { id: 'transaction', label: 'Transaction Issues', icon: AlertCircle },
    { id: 'account', label: 'Account Problems', icon: MessageCircle },
    { id: 'fraud', label: 'Report Fraud', icon: AlertCircle },
    { id: 'technical', label: 'Technical Support', icon: FileText },
    { id: 'general', label: 'General Inquiry', icon: MessageCircle }
  ]

  const faqs = [
    {
      question: 'How do I send money to another user?',
      answer: 'Go to Send Money, enter the recipient\'s phone number or user code, specify the amount, and confirm with your PIN.'
    },
    {
      question: 'What should I do if I suspect fraud?',
      answer: 'Report it immediately through the Support page. You can also use our public fraud check portal to verify users.'
    },
    {
      question: 'How do I verify my KYC information?',
      answer: 'Go to your Profile settings and click "Verify KYC". You\'ll need your National ID and optionally your KRA PIN.'
    },
    {
      question: 'Can I cancel a transaction?',
      answer: 'Completed transactions cannot be cancelled. However, you can dispute escrow transactions if there are issues.'
    },
    {
      question: 'How do digital receipts work?',
      answer: 'Every transaction generates a tamper-proof digital receipt with a QR code that can be verified by anyone, including law enforcement.'
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit support request
    console.log('Support request:', { category, subject, message })
    alert('Support request submitted successfully! We\'ll get back to you within 24 hours.')
    setSubject('')
    setMessage('')
    setCategory('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Center</h1>
        <p className="text-gray-600 mt-1">Get help with your Nolojia Wallet account</p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Call Us</h3>
            <p className="text-sm text-gray-600 mb-3">Available 24/7</p>
            <p className="font-medium">+254 700 123 456</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Email Us</h3>
            <p className="text-sm text-gray-600 mb-3">Response within 24 hours</p>
            <p className="font-medium">support@nolojia.com</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-3">Mon-Fri, 8AM-6PM</p>
            <Button size="sm">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
          <CardDescription>
            Describe your issue and we'll help you resolve it quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {supportCategories.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        category === cat.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{cat.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide detailed information about your issue, including any error messages and steps to reproduce the problem."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!category || !subject.trim() || !message.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="font-semibold mb-2">{faq.question}</h4>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Emergency Support</span>
          </CardTitle>
          <CardDescription className="text-red-700">
            For urgent security issues or suspected fraud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-700 space-y-2">
            <p>• <strong>24/7 Security Hotline:</strong> +254 700 999 000</p>
            <p>• <strong>Email:</strong> security@nolojia.com</p>
            <p>• If you suspect fraud, also report to local authorities</p>
            <p>• Immediately freeze your account if compromised</p>
          </div>
          <Button variant="outline" className="mt-3 border-red-300 text-red-700 hover:bg-red-100">
            Freeze My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}