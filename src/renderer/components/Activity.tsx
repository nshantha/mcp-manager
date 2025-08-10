import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  Trash2,
  Settings,
} from 'lucide-react'
import { useServerState } from '../lib/serverState'

export function Activity() {
  const [activities, setActivities] = useState<any[]>([])
  const [filterType, setFilterType] = useState<
    'all' | 'install' | 'uninstall' | 'verify' | 'configure'
  >('all')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'failed' | 'in_progress'
  >('all')
  const [loading, setLoading] = useState(true)
  const { servers } = useServerState()

  // Mock data for demonstration with dynamic progress
  useEffect(() => {
    const loadMockActivities = () => {
      const now = Date.now()
      const mockActivities: any[] = [
        {
          id: '1',
          type: 'install',
          serverId: 'github-mcp',
          serverName: 'GitHub MCP Server',
          status: 'completed',
          message: 'Successfully installed GitHub MCP Server',
          timestamp: new Date(now - 5 * 60 * 1000), // 5 minutes ago
          duration: 45,
          details: { packageInstalled: true, configApplied: true },
        },
        {
          id: '2',
          type: 'verify',
          serverId: 'filesystem-mcp',
          serverName: 'File System MCP Server',
          status: 'completed',
          message: 'Server verification completed successfully',
          timestamp: new Date(now - 2 * 60 * 1000), // 2 minutes ago
          duration: 30,
          details: {
            packageAvailable: true,
            configurationValid: true,
            serverResponds: true,
          },
        },
        {
          id: '3',
          type: 'configure',
          serverId: 'notion-mcp',
          serverName: 'Notion MCP Server',
          status: 'completed',
          message: 'Authentication tokens configured successfully',
          timestamp: new Date(now - 10 * 60 * 1000), // 10 minutes ago
          duration: 25,
          details: { authRequired: true, tokenValid: true },
        },
        {
          id: '4',
          type: 'uninstall',
          serverId: 'browser-mcp',
          serverName: 'Browser MCP (Playwright)',
          status: 'completed',
          message: 'Server uninstalled successfully',
          timestamp: new Date(now - 1 * 60 * 1000), // 1 minute ago
          duration: 15,
          details: { packageRemoved: true, configCleaned: true },
        },
        {
          id: '5',
          type: 'install',
          serverId: 'github-mcp',
          serverName: 'GitHub MCP Server',
          status: 'completed',
          message: 'GitHub MCP Server installed and configured',
          timestamp: new Date(now - 15 * 60 * 1000), // 15 minutes ago
          duration: 60,
          details: { packageInstalled: true, apiKeyConfigured: true },
        },
      ]

      setActivities(mockActivities)
    }

    // Add some dynamic running activities
    const addRunningActivity = () => {
      const now = Date.now()
      const newActivity: any = {
        id: `running-${Date.now()}`,
        type: 'install',
        serverId: `server-${Math.floor(Math.random() * 1000)}`,
        serverName: `New MCP Server ${Math.floor(Math.random() * 1000)}`,
        status: 'in_progress',
        progress: 0,
        message: 'Installing new MCP server...',
        timestamp: new Date(now),
        details: { packageInstalling: true },
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]) // Keep max 10 activities

      // Simulate progress
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20 + 10 // Random progress increment
        if (progress >= 100) {
          progress = 100
          clearInterval(progressInterval)

          // Complete the activity
          setActivities(prev =>
            prev.map(activity =>
              activity.id === newActivity.id
                ? {
                    ...activity,
                    status: 'completed',
                    progress: 100,
                    message: 'Installation completed successfully',
                  }
                : activity
            )
          )
        } else {
          setActivities(prev =>
            prev.map(activity =>
              activity.id === newActivity.id
                ? { ...activity, progress: Math.round(progress) }
                : activity
            )
          )
        }
      }, 2000) // Update every 2 seconds
    }

    // Load initial mock data
    loadMockActivities()

    // Add a new running activity every 30 seconds
    const runningActivityInterval = setInterval(addRunningActivity, 30 * 1000)

    // Refresh mock data every 5 minutes to simulate real activity
    const refreshInterval = setInterval(loadMockActivities, 5 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(runningActivityInterval)
    }
  }, [])

  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.type !== filterType) return false
    if (filterStatus !== 'all' && activity.status !== filterStatus) return false
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'install':
        return <Download className="h-4 w-4 text-blue-500" />
      case 'uninstall':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'verify':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'configure':
        return <Settings className="h-4 w-4 text-purple-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        )
      case 'running':
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
          >
            Running
          </Badge>
        )
      case 'completed':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Completed
          </Badge>
        )
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      install: 'bg-blue-100 text-blue-800',
      uninstall: 'bg-red-100 text-red-800',
      verify: 'bg-green-100 text-green-800',
      configure: 'bg-purple-100 text-purple-800',
      error: 'bg-red-100 text-red-800',
    }

    return (
      <Badge
        variant="outline"
        className={`${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }

  const retryActivity = (activityId: string) => {
    // This would retry the failed activity
    console.log('Retrying activity:', activityId)
  }

  const cancelActivity = (activityId: string) => {
    // This would cancel the running activity
    console.log('Canceling activity:', activityId)
  }

  const exportLogs = () => {
    const logData = {
      exportDate: new Date().toISOString(),
      activities: activities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      })),
    }

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mcp-activity-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyActivityDetails = (activity: any) => {
    const details = {
      type: activity.type,
      server: activity.serverName,
      status: activity.status,
      message: activity.message,
      timestamp: activity.timestamp.toISOString(),
      duration: activity.duration,
      error: activity.error,
      details: activity.details,
    }

    navigator.clipboard.writeText(JSON.stringify(details, null, 2))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="text-muted-foreground">
            Monitor background tasks and system activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button
            variant={loading ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoading(!loading)}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-2 py-1 text-sm border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="install">Install</option>
                <option value="uninstall">Uninstall</option>
                <option value="verify">Verify</option>
                <option value="configure">Configure</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-2 py-1 text-sm border rounded-md bg-background"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(activity.type)}
                        {getStatusIcon(activity.status)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">
                            {activity.serverName}
                          </h3>
                          {getTypeBadge(activity.type)}
                          {getStatusBadge(activity.status)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatTimestamp(activity.timestamp)}</span>
                          {activity.duration && (
                            <>
                              <span>•</span>
                              <span>
                                Duration: {formatDuration(activity.duration)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Progress Bar for Running Activities */}
                        {activity.status === 'running' &&
                          activity.progress !== undefined && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{activity.progress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${activity.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                        {/* Error Details */}
                        {activity.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700 text-sm">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">Error:</span>
                              <span>{activity.error}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {activity.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryActivity(activity.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}

                      {activity.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelActivity(activity.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyActivityDetails(activity)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
