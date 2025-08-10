import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  Server,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Settings,
  Activity,
  Wrench,
  ArrowRight,
  RefreshCw,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { useAppState } from '../lib/serverState'
import type { MCPServer } from '../lib/serverState'

interface AITool {
  id: string
  name: string
  type: string
  status: 'detected' | 'not_detected' | 'error'
}

interface QuickStats {
  totalServers: number
  workingServers: number
  partialServers: number
  failedServers: number
  detectedTools: number
  lastVerified: string
}

interface DashboardProps {
  onViewChange: (
    view:
      | 'dashboard'
      | 'servers'
      | 'marketplace'
      | 'tools'
      | 'activity'
      | 'settings'
  ) => void
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalServers: 0,
    workingServers: 0,
    partialServers: 0,
    failedServers: 0,
    detectedTools: 0,
    lastVerified: 'Never',
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isHealthCheckRunning, setIsHealthCheckRunning] = useState(false)
  const {
    servers,
    aiTools,
    simulateInstalledServers,
    runHealthCheckOnAll,
    refreshServersFromBackend,
  } = useAppState()

  // Navigation functions with feedback
  const navigateToMarketplace = () => {
    try {
      onViewChange('marketplace')
      console.log('Navigating to Marketplace...')
    } catch (error) {
      console.error('Navigation failed:', error)
      alert('Navigation failed. Please try again.')
    }
  }

  const navigateToServers = () => {
    try {
      onViewChange('servers')
      console.log('Navigating to Servers...')
    } catch (error) {
      console.error('Navigation failed:', error)
      alert('Navigation failed. Please try again.')
    }
  }

  const navigateToTools = () => {
    try {
      onViewChange('tools')
      console.log('Navigating to Tools...')
    } catch (error) {
      console.error('Navigation failed:', error)
      alert('Navigation failed. Please try again.')
    }
  }

  const navigateToActivity = () => {
    try {
      onViewChange('activity')
      console.log('Navigating to Activity...')
    } catch (error) {
      console.error('Navigation failed:', error)
      alert('Navigation failed. Please try again.')
    }
  }

  // Health check functionality
  const runHealthCheck = async () => {
    if (isHealthCheckRunning) return

    setIsHealthCheckRunning(true)
    console.log('Running health check...')

    try {
      // Run actual health check on all installed servers
      await runHealthCheckOnAll()

      // Show success message
      const installedCount = servers.filter(s => s.installed).length
      if (installedCount > 0) {
        alert(
          `Health check completed! Verified ${installedCount} installed server(s).`
        )
      } else {
        alert('Health check completed! No servers are currently installed.')
      }
      console.log('Health check completed successfully')
    } catch (error) {
      console.error('Health check failed:', error)
      alert('Health check failed. Please try again.')
    } finally {
      setIsHealthCheckRunning(false)
    }
  }

  // Refresh functionality with feedback
  const handleRefresh = async () => {
    try {
      console.log('Refreshing data...')
      // Refresh from backend
      await refreshServersFromBackend()
      alert('Data refreshed successfully!')
      console.log('Data refresh completed')
    } catch (error) {
      console.error('Refresh failed:', error)
      alert('Refresh failed. Please try again.')
    }
  }

  useEffect(() => {
    // Load initial data
    const loadSampleData = () => {
      // Set sample recent activity
      setRecentActivity([
        {
          id: '1',
          message: 'GitHub MCP Server status changed to working',
          time: '2 minutes ago',
        },
        {
          id: '2',
          message: 'New AI tool detected: Claude',
          time: '5 minutes ago',
        },
        {
          id: '3',
          message: 'File System MCP Server status verified',
          time: '10 minutes ago',
        },
      ])

      setLoading(false)
    }

    // Load initial data
    loadSampleData()

    // Set up 5-minute refresh interval
    const refreshInterval = setInterval(loadSampleData, 5 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

  // Update stats when servers change
  useEffect(() => {
    if (servers.length > 0) {
      // Only count installed servers for stats
      const installedServers = servers.filter(s => s.installed)
      updateQuickStats(aiTools, installedServers)
    }
  }, [servers, aiTools])

  const updateQuickStats = (tools: AITool[], servers: MCPServer[]) => {
    const working = servers.filter(s => s.status === 'working').length
    const partial = servers.filter(s => s.status === 'partial').length
    const failed = servers.filter(s => s.status === 'failed').length
    const detected = tools.filter(t => t.status === 'detected').length

    const lastVerified =
      servers.length > 0
        ? servers.reduce((latest, server) => {
            if (!server.lastVerified) return latest
            const serverTime = new Date(server.lastVerified).getTime()
            return serverTime > latest ? serverTime : latest
          }, 0)
        : 0

    setQuickStats({
      totalServers: servers.length,
      workingServers: working,
      partialServers: partial,
      failedServers: failed,
      detectedTools: detected,
      lastVerified: lastVerified > 0 ? formatTimeAgo(lastVerified) : 'Never',
    })
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Working
          </Badge>
        )
      case 'partial':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Partial
          </Badge>
        )
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={`stats-skeleton-${Date.now()}-${i}`}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={`content-skeleton-${Date.now()}-${i}`}
                className="h-64 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to MCP Manager
          </h1>
          <p className="text-lg text-muted-foreground">
            Your central hub for managing Model Context Protocol servers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => simulateInstalledServers()}
          >
            <Server className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Servers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {quickStats.totalServers}
                </p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Working
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {quickStats.workingServers}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  AI Tools
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {quickStats.detectedTools}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Verified
                </p>
                <p className="text-sm font-medium text-foreground">
                  {quickStats.lastVerified}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-muted/50"
              onClick={navigateToMarketplace}
            >
              <Plus className="h-6 w-6 text-blue-500" />
              <span className="font-medium">Install New Server</span>
              <span className="text-xs text-muted-foreground">
                Browse marketplace
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-muted/50"
              onClick={navigateToServers}
            >
              <Server className="h-6 w-6 text-green-500" />
              <span className="font-medium">Manage Servers</span>
              <span className="text-xs text-muted-foreground">
                View all installed
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-muted/50"
              onClick={navigateToTools}
            >
              <Wrench className="h-6 w-6 text-purple-500" />
              <span className="font-medium">Configure Tools</span>
              <span className="text-xs text-muted-foreground">
                AI tool settings
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Server Status</CardTitle>
              <Button variant="ghost" size="sm" onClick={navigateToServers}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {servers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No servers installed yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={navigateToMarketplace}
                >
                  Install Your First Server
                </Button>
              </div>
            ) : (
              servers
                .filter(server => server.installed)
                .slice(0, 3)
                .map(server => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(server.status || 'failed')}
                      <div>
                        <h4 className="font-medium text-foreground">
                          {server.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {server.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(server.status || 'failed')}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={navigateToActivity}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={`activity-${activity.id || index}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {quickStats.failedServers === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
              <div>
                <h3 className="font-medium text-foreground">
                  {quickStats.failedServers === 0
                    ? 'All systems operational'
                    : 'Some issues detected'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {quickStats.failedServers === 0
                    ? `${quickStats.workingServers} servers working properly`
                    : `${quickStats.failedServers} server(s) need attention`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              disabled={isHealthCheckRunning}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {isHealthCheckRunning ? 'Running...' : 'Run Health Check'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
