import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  Server,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  Play,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { useCachedData } from '../lib/cache'
import { runWhenIdle } from '../lib/idle'
import { useAppState } from '../lib/serverState'
import { ServerConfigDialog } from './ServerConfigDialog'
import { AI_TOOL_CONFIG_PATHS } from '../../shared/config-paths'

export function Servers() {
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'working' | 'partial' | 'failed'
  >('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [configDialogServerId, setConfigDialogServerId] = useState<
    string | null
  >(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const {
    servers,
    installServer,
    uninstallServer,
    updateServerStatus,
    simulateInstalledServers,
    refreshServersFromBackend,
  } = useAppState()

  const { data: cachedServers, refresh: refreshServers } = useCachedData<any[]>(
    'mcpServers',
    [],
    5 * 60 * 1000 // 5 minutes
  )

  useEffect(() => {
    // Background refresh only - no automatic demo data loading
    runWhenIdle(() => {
      refreshServers()
    })
  }, [refreshServers])

  const filteredServers = servers.filter(server => {
    // Only show INSTALLED servers in the Servers page
    if (!server.installed) return false

    // Then apply additional filters
    if (filterStatus !== 'all' && server.status !== filterStatus) return false
    if (filterCompany !== 'all' && server.company !== filterCompany)
      return false
    return true
  })

  const companies = Array.from(
    new Set(servers.filter(s => s.installed).map(s => s.company))
  )

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const verified = new Date(timestamp)
    const diffMs = now.getTime() - verified.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return verified.toLocaleDateString()
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

  const handleBulkAction = async (action: 'verify' | 'uninstall') => {
    if (selectedServers.size === 0) return

    const selectedArray = Array.from(selectedServers)

    if (action === 'verify') {
      // Verify all selected servers
      for (const serverId of selectedArray) {
        try {
          await window.electronAPI?.verifyServerInstallation(serverId)
        } catch (error) {
          console.error(`Failed to verify ${serverId}:`, error)
        }
      }
      refreshServers()
    } else if (action === 'uninstall') {
      // Uninstall all selected servers
      if (
        confirm(
          `Are you sure you want to uninstall ${selectedArray.length} server(s)?`
        )
      ) {
        for (const serverId of selectedArray) {
          try {
            await window.electronAPI?.uninstallMCPServer(serverId, {
              removePackage: true,
            })
          } catch (error) {
            console.error(`Failed to uninstall ${serverId}:`, error)
          }
        }
        refreshServers()
        setSelectedServers(new Set())
      }
    }
  }

  const toggleServerSelection = (serverId: string) => {
    const newSelected = new Set(selectedServers)
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId)
    } else {
      newSelected.add(serverId)
    }
    setSelectedServers(newSelected)
  }

  const selectAll = () => {
    if (selectedServers.size === filteredServers.length) {
      setSelectedServers(new Set())
    } else {
      setSelectedServers(new Set(filteredServers.map(s => s.id)))
    }
  }

  const openConfigFiles = async () => {
    try {
      // Open Claude Desktop config first (most common)
      const claudeDesktopPath = AI_TOOL_CONFIG_PATHS['claude-desktop']
      if (window.electronAPI?.openConfigFile) {
        await window.electronAPI.openConfigFile(claudeDesktopPath)
      } else {
        console.log(`Would open config file: ${claudeDesktopPath}`)
        alert(`Opening config file: ${claudeDesktopPath}`)
      }
    } catch (error) {
      console.error('Failed to open config file:', error)
      alert(`Failed to open config file: ${error}`)
    }
  }

  // No loading state needed since we're using centralized state

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Installed Servers
          </h1>
          <p className="text-muted-foreground">
            Manage your installed MCP servers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshServersFromBackend()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => simulateInstalledServers()}
          >
            <Server className="h-4 w-4 mr-2" />
            Load Demo Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = '#/marketplace'
            }}
          >
            <Server className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-2 py-1 text-sm border rounded-md bg-background"
              >
                <option value="all">All</option>
                <option value="working">Working</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Company:</span>
              <select
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
                className="px-2 py-1 text-sm border rounded-md bg-background"
              >
                <option value="all">All</option>
                {companies.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedServers.size > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedServers.size} server(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('verify')}
              >
                <Play className="h-4 w-4 mr-2" />
                Verify All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('uninstall')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Servers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Installed Servers ({filteredServers.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedServers.size === filteredServers.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No servers installed yet.</p>
              <p className="text-sm mt-1">
                Install MCP servers from the Marketplace to get started.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    window.location.href = '#/marketplace'
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Browse Marketplace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateInstalledServers()}
                >
                  Load Demo Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredServers.map(server => (
                <div
                  key={server.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    selectedServers.has(server.id)
                      ? 'bg-secondary border-secondary'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServers.has(server.id)}
                    onChange={() => toggleServerSelection(server.id)}
                    className="rounded border-border"
                  />

                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(server.status || 'failed')}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {server.name}
                        </h3>
                        {getStatusBadge(server.status || 'failed')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {server.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{server.company}</span>
                        {server.version && <span>v{server.version}</span>}
                        {server.lastVerified && (
                          <span>
                            Verified {formatTimestamp(server.lastVerified)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openConfigFiles}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfigDialogServerId(server.id)
                        setShowConfigDialog(true)
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Auth Setup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Test the server connection
                          if (window.electronAPI?.verifyServerInstallation) {
                            // Show testing state
                            const originalStatus = server.status
                            // Temporarily update status to show testing
                            updateServerStatus(
                              server.id,
                              'partial',
                              new Date().toISOString()
                            )

                            const result =
                              await window.electronAPI.verifyServerInstallation(
                                server.id
                              )

                            if (result?.overallStatus === 'working') {
                              // Server is working
                              updateServerStatus(
                                server.id,
                                'working',
                                new Date().toISOString()
                              )
                              alert(`${server.name} is working properly!`)
                            } else if (result?.overallStatus === 'partial') {
                              // Server is partially working
                              updateServerStatus(
                                server.id,
                                'partial',
                                new Date().toISOString()
                              )
                              alert(
                                `${server.name} is partially working. Package: ${result.packageAvailable ? 'Yes' : 'No'}, Config: ${result.configurationValid ? 'Yes' : 'No'}`
                              )
                            } else {
                              // Server failed
                              updateServerStatus(
                                server.id,
                                'failed',
                                new Date().toISOString()
                              )
                              alert(
                                `${server.name} test failed. Package: ${result.packageAvailable ? 'Yes' : 'No'}, Config: ${result.configurationValid ? 'Yes' : 'No'}`
                              )
                            }
                          } else {
                            alert('Server testing not available')
                          }
                        } catch (error) {
                          console.error('Failed to test server:', error)
                          updateServerStatus(
                            server.id,
                            'failed',
                            new Date().toISOString()
                          )
                          alert(`Failed to test ${server.name}: ${error}`)
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to uninstall ${server.name}?`
                          )
                        ) {
                          try {
                            const result = await uninstallServer(server.id, {
                              removePackage: true,
                            })
                            if (result.success) {
                              alert(`${server.name} uninstalled successfully`)
                            } else {
                              alert(
                                `Failed to uninstall ${server.name}: ${result.message}`
                              )
                            }
                          } catch (error) {
                            alert(
                              `Failed to uninstall ${server.name}: ${error}`
                            )
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Uninstall
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server Configuration Dialog */}
      <ServerConfigDialog
        serverId={configDialogServerId}
        isOpen={showConfigDialog}
        onClose={() => {
          setShowConfigDialog(false)
          setConfigDialogServerId(null)
        }}
      />
    </div>
  )
}
