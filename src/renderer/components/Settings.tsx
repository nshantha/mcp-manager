import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Settings as SettingsIcon, Shield, Bell, Palette } from 'lucide-react'

interface AppSettings {
  theme: 'light' | 'dark'
  autoUpdate: boolean
  notifications: boolean
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    autoUpdate: true,
    notifications: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsData = await window.electronAPI?.getAppSettings()
      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    try {
      await window.electronAPI?.updateAppSettings(newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      // Revert on error
      setSettings(settings)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-lg">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your MCP Manager preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Theme</span>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('theme', 'light')}
                >
                  Light
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('theme', 'dark')}
                >
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Control when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Enable Notifications</span>
                <p className="text-sm text-muted-foreground">
                  Get notified about server updates and issues
                </p>
              </div>
              <Button
                variant={settings.notifications ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('notifications', !settings.notifications)}
              >
                {settings.notifications ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage security and update preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Auto-Update</span>
                <p className="text-sm text-muted-foreground">
                  Automatically install security updates
                </p>
              </div>
              <Button
                variant={settings.autoUpdate ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('autoUpdate', !settings.autoUpdate)}
              >
                {settings.autoUpdate ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">Security Status</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Vetted Servers Only:</span>
                  <Badge variant="default" className="bg-green-600">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Secure IPC:</span>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Context Isolation:</span>
                  <Badge variant="default" className="bg-green-600">Enabled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>About</CardTitle>
            </div>
            <CardDescription>
              Application information and version details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Version:</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Built with:</span>
                <div className="flex gap-1">
                  <Badge variant="secondary">Electron</Badge>
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t text-xs text-muted-foreground">
              <p>Universal MCP Manager - Enterprise-grade management for Model Context Protocol servers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}