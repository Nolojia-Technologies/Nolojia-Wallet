import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Shield, Eye, Globe, Download, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuthStore } from '@/store/authStore'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    transactions: true,
    security: true,
    marketing: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    transactionHistory: false,
    balanceVisible: true,
    activityStatus: true,
  })

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
  })

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('nolojia-notifications')
    const savedPrivacy = localStorage.getItem('nolojia-privacy')
    const savedPreferences = localStorage.getItem('nolojia-preferences')

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy))
    }
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)
    localStorage.setItem('nolojia-notifications', JSON.stringify(newNotifications))
    toast.success('Notification settings updated')
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value }
    setPrivacy(newPrivacy)
    localStorage.setItem('nolojia-privacy', JSON.stringify(newPrivacy))
    toast.success('Privacy settings updated')
  }

  const handlePreferenceChange = (key: string, value: string) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    localStorage.setItem('nolojia-preferences', JSON.stringify(newPreferences))
    toast.success('Preferences updated')
  }

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark') {
      setTheme(value)
      toast.success(`Theme changed to ${value} mode`)
    }
  }

  const handleExportData = () => {
    // Create a comprehensive data export
    const exportData = {
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date().toISOString()
      } : null,
      settings: {
        notifications,
        privacy,
        preferences,
        theme
      },
      exportedAt: new Date().toISOString()
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `nolojia-wallet-data-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast.success('Data export downloaded successfully!')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data, including wallet balance, transaction history, and personal information. Type "DELETE" to confirm.')) {
        // In a real app, this would call an API endpoint
        toast.error('For security reasons, account deletion must be done through customer support. Please contact support@nolojia.com')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about account activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transaction Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified for all transactions
                    </p>
                  </div>
                  <Switch
                    checked={notifications.transactions}
                    onCheckedChange={(checked) => handleNotificationChange('transactions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important security notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.security}
                    onCheckedChange={(checked) => handleNotificationChange('security', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">
                      Promotional emails and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>
                Control what information is visible to others.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to find your profile
                    </p>
                  </div>
                  <Switch
                    checked={privacy.profileVisible}
                    onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transaction History Privacy</Label>
                    <p className="text-sm text-muted-foreground">
                      Hide transaction details from others
                    </p>
                  </div>
                  <Switch
                    checked={privacy.transactionHistory}
                    onCheckedChange={(checked) => handlePrivacyChange('transactionHistory', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Balance Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Show balance by default
                    </p>
                  </div>
                  <Switch
                    checked={privacy.balanceVisible}
                    onCheckedChange={(checked) => handlePrivacyChange('balanceVisible', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activity Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you're active
                    </p>
                  </div>
                  <Switch
                    checked={privacy.activityStatus}
                    onCheckedChange={(checked) => handlePrivacyChange('activityStatus', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>General Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize your experience with language, currency, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={preferences.currency} onValueChange={(value) => handlePreferenceChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">East Africa Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Data & Privacy</span>
              </CardTitle>
              <CardDescription>
                Manage your data and privacy preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Export Your Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of your data
                    </p>
                  </div>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-red-600">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button onClick={handleDeleteAccount} variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">
                        This action cannot be undone. Please contact support if you wish to delete your account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}