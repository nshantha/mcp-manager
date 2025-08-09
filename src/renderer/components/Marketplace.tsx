import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, Download, Loader2, Shield } from 'lucide-react'
import { ServerInstructionsDialog } from './ServerInstructionsDialog'
import type { MCPServer } from '../../shared/types'

export function Marketplace() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [uninstalling, setUninstalling] = useState<string | null>(null)
  const [progressByServer, setProgressByServer] = useState<Record<string, { value: number; label: string }>>({})
  const [configDialogServerId, setConfigDialogServerId] = useState<string | null>(null)
  const [configDialogServerName, setConfigDialogServerName] = useState<string>('')

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const serversData = await window.electronAPI?.getVettedServers() || []
      setServers(serversData)
    } catch (error) {
      console.error('Failed to load marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (serverId: string) => {
    try {
      setInstalling(serverId)
      setProgressByServer(prev => ({ ...prev, [serverId]: { value: 8, label: 'Checking…' } }))
      console.log('Installing server:', serverId)
      
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setProgressByServer(prev => ({ ...prev, [serverId]: { value: 45, label: 'Installing…' } }))
      const result = await window.electronAPI.installMCPServer(serverId, {})
      console.log('Install result:', result)
      
      if (result?.success) {
        // Kick off verification in background to avoid blocking UI
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 75, label: 'Verifying…' } }))
        window.electronAPI?.verifyServerInstallation?.(serverId).finally(() => {
          // No-op; we still refresh the list below
        })
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 100, label: 'Done' } }))
        // Refresh the server list to show updated installation status
        await loadServers()
        // Briefly keep the 100% bar visible, then clear
        setTimeout(() => setProgressByServer(prev => { const n = { ...prev }; delete n[serverId]; return n }), 700)
      } else {
        console.error('Installation failed:', result?.message)
        alert(`Installation failed: ${result?.message || 'Unknown error'}`)
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 100, label: 'Failed' } }))
        setTimeout(() => setProgressByServer(prev => { const n = { ...prev }; delete n[serverId]; return n }), 1200)
      }
    } catch (error) {
      console.error('Failed to install server:', error)
      alert(`Failed to install server: ${error}`)
    } finally {
      setInstalling(null)
    }
  }

  const handleUninstall = async (serverId: string) => {
    try {
      setUninstalling(serverId)
      setProgressByServer(prev => ({ ...prev, [serverId]: { value: 10, label: 'Removing…' } }))
      const result = await window.electronAPI?.uninstallMCPServer(serverId)
      
      if (result?.success) {
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 70, label: 'Cleaning…' } }))
        await loadServers()
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 100, label: 'Done' } }))
        setTimeout(() => setProgressByServer(prev => { const n = { ...prev }; delete n[serverId]; return n }), 700)
      } else {
        console.error('Uninstallation failed:', result?.message)
        setProgressByServer(prev => ({ ...prev, [serverId]: { value: 100, label: 'Failed' } }))
        setTimeout(() => setProgressByServer(prev => { const n = { ...prev }; delete n[serverId]; return n }), 1200)
      }
    } catch (error) {
      console.error('Failed to uninstall server:', error)
    } finally {
      setUninstalling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading marketplace...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Server Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Browse and install vetted MCP servers from trusted companies
        </p>
      </div>

      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600" />
        <div className="text-sm">
          <span className="font-medium text-blue-900">Security First:</span>
          <span className="text-blue-700 ml-1">
            All servers are vetted and from trusted companies only
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <ServerCard 
            key={server.id} 
            server={server} 
            onInstall={() => handleInstall(server.id)}
            onUninstall={() => handleUninstall(server.id)}
            onConfigure={() => {
              setConfigDialogServerId(server.id)
              setConfigDialogServerName(server.name)
            }}
            installing={installing === server.id}
            uninstalling={uninstalling === server.id}
            progress={progressByServer[server.id]}
          />
        ))}
      </div>

      <ServerInstructionsDialog
        serverId={configDialogServerId}
        serverName={configDialogServerName}
        isOpen={configDialogServerId !== null}
        onClose={() => setConfigDialogServerId(null)}
      />
    </div>
  )
}

interface ServerCardProps {
  server: MCPServer
  onInstall: () => void
  onUninstall: () => void
  onConfigure: () => void
  installing: boolean
  uninstalling: boolean
  progress?: { value: number; label: string }
}

function ServerCard({ server, onInstall, onUninstall, onConfigure, installing, uninstalling, progress }: ServerCardProps) {
  const getCompanyBadgeColor = (company: string) => {
    const colors = {
      github: 'bg-gray-900 text-white',
      notion: 'bg-black text-white', 
      slack: 'bg-purple-600 text-white',
      linear: 'bg-blue-600 text-white',
      anthropic: 'bg-orange-600 text-white'
    }
    return colors[company as keyof typeof colors] || 'bg-gray-600 text-white'
  }

  const getCompanyIcon = (company: string) => {
    // In a real app, you'd use proper company icons
    const icons = {
      github: '🐱',
      notion: '📝',
      slack: '💬',
      linear: '📐',
      anthropic: '🤖'
    }
    return icons[company as keyof typeof icons] || '🔧'
  }

  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      {/* Thin top progress bar on the card when active */}
      {(progress && (installing || uninstalling)) && (
        <div className="absolute top-0 left-0 h-0.5 bg-blue-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }} />
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getCompanyIcon(server.company)}</span>
              <Badge className={getCompanyBadgeColor(server.company)}>
                {server.company}
              </Badge>
            </div>
            <CardTitle className="text-lg">{server.name}</CardTitle>
            <CardDescription className="mt-1">
              {server.description}
            </CardDescription>
          </div>
          {server.installed && (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono">
            {server.packageName}
          </div>
          
          {server.requiresAuth && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Requires OAuth
              </Badge>
            </div>
          )}

          {server.installed && server.enabledTools.length > 0 && (
            <div>
              <span className="text-sm font-medium">Enabled in:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {server.enabledTools.map((tool) => (
                  <Badge key={tool} variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 mt-auto">
          {server.installed ? (
            <div className="space-y-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onUninstall}
                disabled={installing || uninstalling}
                className="w-full"
              >
                {(installing || uninstalling) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uninstalling ? 'Uninstalling…' : 'Working…'}
                  </>
                ) : (
                  'Uninstall'
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onConfigure}
              >
                Configure
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onInstall}
              disabled={installing}
              className="w-full"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Installing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>
          )}
          {(progress && (installing || uninstalling)) && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
                <div className="h-1 bg-blue-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{progress.label}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}