import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Settings, ExternalLink, Loader2, Store, Key, AlertTriangle } from 'lucide-react'
import { ServerInstructionsDialog } from './ServerInstructionsDialog'
import { TokenManagementDialog } from './TokenManagementDialog'
import type { AITool, MCPServer } from '../../shared/types'
import { getDashboardCache, setDashboardCache } from '../lib/cache'
import { getServerVerification, setServerVerification } from '../lib/statusCache'
import { runWhenIdle } from '../lib/idle'

export function Dashboard() {
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [configDialogServerId, setConfigDialogServerId] = useState<string | null>(null)
  const [configDialogServerName, setConfigDialogServerName] = useState<string>('')
  const [tokenDialogServerId, setTokenDialogServerId] = useState<string | null>(null)
  const [tokenDialogServerName, setTokenDialogServerName] = useState<string>('')

  useEffect(() => {
    const cached = getDashboardCache()
    if (cached) {
      setAiTools(cached.aiTools)
      setMcpServers(cached.mcpServers)
      setLoading(false)
      // Refresh in idle time to avoid scroll hitch
      runWhenIdle(() => { void loadData(true) })
    } else {
      void loadData()
    }
  }, [])

  const loadData = async (background = false) => {
    try {
      if (!background) setLoading(true)
      
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }

      console.log('Loading dashboard data...')
      
      // Stagger heavy calls to minimize main-thread bursts
      const toolsPromise = window.electronAPI.detectAITools()
      const serversPromise = window.electronAPI.getVettedServers()
      const [toolsData, serversData] = await Promise.all([toolsPromise, serversPromise])
      
      console.log('Tools detected:', toolsData)
      console.log('Servers loaded:', serversData)
      
      setAiTools(toolsData)
      setMcpServers(serversData)
      setDashboardCache(toolsData, serversData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      if (!background) setLoading(false)
    }
  }

  const installedServers = mcpServers.filter(server => server.installed)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="bg-card rounded-xl border p-6">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded mt-3 animate-pulse" />
        </div>

        <section className="bg-card rounded-xl border p-6">
          <div className="h-5 w-56 bg-muted rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-3" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-xl border p-6">
          <div className="h-5 w-64 bg-muted rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-5 animate-pulse">
                <div className="h-4 w-60 bg-muted rounded mb-2" />
                <div className="h-3 w-80 bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded mt-4" />
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="bg-card rounded-xl border p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your MCP server installations and AI development tools
        </p>
      </div>

      {/* AI Tools Status */}
      <section className="bg-card rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">AI Development Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {aiTools.map((tool) => (
            <ToolStatusCard key={tool.name} tool={tool} />
          ))}
        </div>
      </section>

      {/* MCP Servers Status */}
      <section className="bg-card rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Installed MCP Servers</h2>
        {installedServers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No MCP servers installed</h3>
            <p className="text-muted-foreground mb-4">Get started by installing MCP servers from the marketplace</p>
            <Button 
              onClick={() => window.location.hash = '#/marketplace'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {installedServers.map((server) => (
              <ServerStatusCard 
                key={server.id} 
                server={server} 
                onConfigure={() => {
                  console.log('Setting config dialog for server:', server.id)
                  setConfigDialogServerId(server.id)
                  setConfigDialogServerName(server.name)
                }}
                onManageToken={() => {
                  setTokenDialogServerId(server.id)
                  setTokenDialogServerName(server.name)
                }}
              />
            ))}
          </div>
        )}
      </section>

      <ServerInstructionsDialog
        serverId={configDialogServerId}
        serverName={configDialogServerName}
        isOpen={configDialogServerId !== null}
        onClose={() => setConfigDialogServerId(null)}
      />

      <TokenManagementDialog
        serverId={tokenDialogServerId}
        serverName={tokenDialogServerName}
        isOpen={tokenDialogServerId !== null}
        onClose={() => setTokenDialogServerId(null)}
        onTokenSaved={() => {
          // Refresh data when token is saved
          loadData()
        }}
      />
    </div>
  )
}

function ToolStatusCard({ tool }: { tool: AITool }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${tool.detected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <h3 className="font-medium text-foreground">{tool.displayName}</h3>
        </div>
        {tool.detected ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {tool.detected ? 'Detected and available' : 'Not found on system'}
      </p>
      
      <div className="space-y-2 text-sm">
        {tool.version && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="px-2 py-1 bg-muted rounded text-foreground text-xs">{tool.version}</span>
          </div>
        )}
        {tool.executable && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Path:</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-32" title={tool.executable}>
              {tool.executable}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ServerStatusCard({ server, onConfigure, onManageToken }: { 
  server: MCPServer; 
  onConfigure: () => void;
  onManageToken?: () => void;
}) {
  const getCompanyColor = (company: string) => {
    const colors = {
      github: 'bg-gray-900',
      notion: 'bg-black', 
      slack: 'bg-purple-600',
      linear: 'bg-blue-600',
      anthropic: 'bg-orange-600'
    }
    return colors[company as keyof typeof colors] || 'bg-gray-600'
  }

  return (
    <div className="border rounded-lg p-5 hover:shadow-sm transition-shadow bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 ${getCompanyColor(server.company)} rounded flex items-center justify-center text-white text-xs font-bold`}>
              {server.company.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-medium text-foreground">{server.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{server.description}</p>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
          <EnhancedInstallationStatus server={server} />
        </div>
        
        {server.requiresAuth && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Authentication:</span>
            <AuthenticationStatus server={server} />
          </div>
        )}
        
        {server.enabledTools.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground block mb-2">Configured in:</span>
            <div className="flex flex-wrap gap-1">
              {server.enabledTools.map((tool) => (
                <span key={tool} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('Configure button clicked for server:', server.id)
                onConfigure()
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
            {server.requiresAuth && onManageToken && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onManageToken}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Key className="h-3 w-3 mr-1" />
                Token
              </Button>
            )}
          </div>
          {server.requiresAuth && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
              Auth Required
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EnhancedInstallationStatus({ server }: { server: MCPServer }) {
  const [status, setStatus] = useState<{
    packageAvailable: boolean;
    configurationValid: boolean;
    serverResponds: boolean;
    overallStatus: 'working' | 'partial' | 'failed';
    loading: boolean;
  }>({ 
    packageAvailable: false,
    configurationValid: false,
    serverResponds: false,
    overallStatus: 'failed',
    loading: true 
  })

  useEffect(() => {
    verifyInstallation()
  }, [server.id])

  const verifyInstallation = async () => {
    try {
      // Use cached verification if fresh; otherwise refresh in background
      const cached = getServerVerification(server.id)
      if (cached) {
        setStatus({ ...cached, loading: false })
        return
      }
      setStatus(prev => ({ ...prev, loading: true }))
      window.electronAPI?.verifyServerInstallation(server.id)
        .then((verification: any) => {
          setServerVerification(server.id, verification)
          setStatus({ ...verification, loading: false })
        })
        .catch(() => setStatus({
          packageAvailable: false,
          configurationValid: false,
          serverResponds: false,
          overallStatus: 'failed',
          loading: false
        }))
    } catch (error) {
      console.error('Failed to verify installation:', error)
      setStatus({ 
        packageAvailable: false,
        configurationValid: false,
        serverResponds: false,
        overallStatus: 'failed',
        loading: false 
      })
    }
  }

  if (status.loading) {
    return <Loader2 className="h-3 w-3 animate-spin" />
  }

  const getStatusDisplay = () => {
    switch (status.overallStatus) {
      case 'working':
        return {
          text: 'Working',
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-3 w-3" />,
          tooltip: 'Package installed, configured, and responding'
        }
      case 'partial':
        return {
          text: 'Partial',
          className: 'bg-yellow-100 text-yellow-800',
          icon: <AlertTriangle className="h-3 w-3" />,
          tooltip: `Configured but ${!status.packageAvailable ? 'package not installed' : 'server not responding'}`
        }
      default:
        return {
          text: 'Failed',
          className: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-3 w-3" />,
          tooltip: 'Installation verification failed'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <span 
      className={`px-2 py-1 ${statusDisplay.className} rounded text-xs font-medium flex items-center gap-1 cursor-help`}
      title={statusDisplay.tooltip}
    >
      {statusDisplay.icon}
      {statusDisplay.text}
    </span>
  )
}

function AuthenticationStatus({ server }: { server: MCPServer }) {
  const [authStatus, setAuthStatus] = useState<{
    configured: boolean
    loading: boolean
  }>({ configured: false, loading: true })

  useEffect(() => {
    checkAuthStatus()
  }, [server.id])

  const checkAuthStatus = async () => {
    try {
      setAuthStatus({ configured: false, loading: true })
      const config = await window.electronAPI?.getServerConfiguration(server.id)
      setAuthStatus({ 
        configured: config?.status?.authConfigured || false, 
        loading: false 
      })
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setAuthStatus({ configured: false, loading: false })
    }
  }

  if (authStatus.loading) {
    return <Loader2 className="h-3 w-3 animate-spin" />
  }

  if (authStatus.configured) {
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Configured
      </span>
    )
  }

  return (
    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      Token Required
    </span>
  )
}