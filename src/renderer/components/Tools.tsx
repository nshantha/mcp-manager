import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  Search,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Code,
  Bot,
  Server,
  ExternalLink,
  Power,
  ChevronDown,
  ChevronRight,
  Monitor,
  Zap,
  Link,
} from 'lucide-react'
import { useAppState } from '../lib/serverState'

interface AITool {
  id: string
  name: string
  type: 'claude' | 'vscode' | 'cursor' | 'continue' | 'codegpt'
  icon: string
  description: string
  status: 'detected' | 'not_detected' | 'error'
  configPath?: string
  version?: string
  enabledServers: string[]
  availableServers: string[]
}

export function Tools() {
  const {
    servers: mcpServers,
    aiTools,
    toggleServerForTool,
    updateAITool,
    refreshAIToolsFromBackend,
  } = useAppState()
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Auto-refresh AI tools on component mount only
  useEffect(() => {
    refreshAIToolsFromBackend().catch(console.error)
  }, []) // Empty dependency array - only run on mount

  // Filter for only installed servers
  const installedServers = mcpServers.filter(server => server.installed)
  const detectedTools = aiTools.filter(tool => tool.status === 'detected')
  const undetectedTools = aiTools.filter(tool => tool.status !== 'detected')

  // Auto-enable installed servers for all detected tools
  useEffect(() => {
    if (installedServers.length > 0 && detectedTools.length > 0) {
      const installedServerIds = installedServers.map(server => server.id)

      for (const tool of detectedTools) {
        // Only update if the enabled servers don't match
        const currentEnabled = new Set(tool.enabledServers)
        const shouldBeEnabled = new Set(installedServerIds)

        if (
          currentEnabled.size !== shouldBeEnabled.size ||
          [...currentEnabled].some(id => !shouldBeEnabled.has(id))
        ) {
          updateAITool(tool.id, {
            enabledServers: installedServerIds,
          })
        }
      }
    }
  }, [installedServers.length, detectedTools.length, updateAITool]) // Now safe with memoized updateAITool

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'claude':
        return <Bot className="h-6 w-6 text-blue-600" />
      case 'vscode':
        return <Code className="h-6 w-6 text-blue-500" />
      case 'cursor':
        return <Code className="h-6 w-6 text-purple-500" />
      case 'continue':
        return <Code className="h-6 w-6 text-green-500" />
      case 'codegpt':
        return <Bot className="h-6 w-6 text-orange-500" />
      default:
        return <Monitor className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'not_detected':
        return 'text-gray-500 bg-gray-50 border-gray-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'not_detected':
        return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const toggleToolExpanded = (toolId: string) => {
    const newExpanded = new Set(expandedTools)
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId)
    } else {
      newExpanded.add(toolId)
    }
    setExpandedTools(newExpanded)
  }

  const openConfigFile = async (tool: AITool) => {
    if (!tool.configPath) return

    try {
      // Call the main process to open the actual config file
      if (window.electronAPI?.openConfigFile) {
        await window.electronAPI.openConfigFile(tool.configPath)
      } else {
        // Fallback for development
        console.log(`Would open config file: ${tool.configPath}`)
        alert(`Opening config file: ${tool.configPath}`)
      }
    } catch (error) {
      console.error('Failed to open config file:', error)
      alert(`Failed to open config file: ${error}`)
    }
  }

  const writeConfigFile = async (tool: AITool) => {
    const enabledServers = mcpServers.filter(
      server => tool.enabledServers.includes(server.id) && server.installed
    )

    if (enabledServers.length === 0) {
      alert('No enabled servers to write to configuration.')
      return
    }

    try {
      // Call the main process to write the actual config
      if (window.electronAPI?.writeMCPConfig) {
        const config = generateMCPConfig(tool, enabledServers)
        await window.electronAPI.writeMCPConfig(tool.id, config)
        alert(`Successfully wrote MCP configuration for ${tool.name}`)
      } else {
        // Fallback for development
        const config = generateMCPConfig(tool, enabledServers)
        const configJson = JSON.stringify(config, null, 2)
        console.log(`Would write config for ${tool.name}:`, config)
        alert(`Config would be written to ${tool.configPath}:\n\n${configJson}`)
      }
    } catch (error) {
      console.error('Failed to write config:', error)
      alert(`Failed to write config: ${error}`)
    }
  }

  const generateMCPConfig = (tool: AITool, enabledServers: any[]) => {
    switch (tool.type) {
      case 'claude':
        return {
          mcpServers: Object.fromEntries(
            enabledServers.map(server => [
              server.id,
              {
                command: 'npx',
                args: ['-y', server.packageName],
                env: server.requiresAuth
                  ? {
                      GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
                    }
                  : {},
              },
            ])
          ),
        }
      case 'vscode':
      case 'cursor':
        return {
          'mcp.servers': Object.fromEntries(
            enabledServers.map(server => [
              server.id,
              {
                command: 'npx',
                args: ['-y', server.packageName],
                env: server.requiresAuth
                  ? {
                      GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
                    }
                  : {},
              },
            ])
          ),
        }
      default:
        return {
          mcpServers: enabledServers.map(server => ({
            name: server.name,
            command: 'npx',
            args: ['-y', server.packageName],
            env: server.requiresAuth
              ? {
                  GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
                }
              : {},
          })),
        }
    }
  }

  const refreshTools = async () => {
    setLoading(true)
    try {
      // Actually refresh AI tools from backend detection
      await refreshAIToolsFromBackend()
    } catch (error) {
      console.error('Failed to refresh AI tools:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI development tools and their MCP server integrations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshTools}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Scanning...' : 'Refresh'}
        </Button>
      </div>

      {/* Discovery Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Tool Discovery Status
                </h3>
                <p className="text-blue-700 text-sm">
                  {detectedTools.length} of {aiTools.length} AI tools detected
                  on your system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {detectedTools.length > 0 && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  {detectedTools.length} Ready
                </Badge>
              )}
              {undetectedTools.length > 0 && (
                <Badge variant="secondary">
                  {undetectedTools.length} Missing
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Tools */}
      {detectedTools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Detected Tools</h2>
            <Badge variant="outline">{detectedTools.length}</Badge>
          </div>

          <div className="grid gap-4">
            {detectedTools.map(tool => (
              <Card
                key={tool.id}
                className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/30"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-card rounded-lg border shadow-sm">
                        {getToolIcon(tool.type)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tool.name}
                          {tool.version && (
                            <Badge variant="outline" className="text-xs">
                              v{tool.version}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* MCP Server Status */}
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">MCP Integration</div>
                        <div className="text-sm text-muted-foreground">
                          {tool.enabledServers.length} of{' '}
                          {installedServers.length} servers enabled
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.enabledServers.length > 0 ? (
                        <Badge
                          variant="default"
                          className="bg-blue-100 text-blue-800"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Connected</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleToolExpanded(tool.id)}
                      >
                        {expandedTools.has(tool.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Server Management */}
                  {expandedTools.has(tool.id) && (
                    <div className="space-y-4 bg-card p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Server Configuration
                        </h4>
                        <div className="flex items-center gap-2">
                          {tool.configPath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfigFile(tool)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open Config
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => writeConfigFile(tool)}
                            disabled={tool.enabledServers.length === 0}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Write Config
                          </Button>
                        </div>
                      </div>

                      {/* Server Toggle List */}
                      <div className="space-y-2">
                        {installedServers.map(server => {
                          const isEnabled = tool.enabledServers.includes(
                            server.id
                          )

                          return (
                            <div
                              key={server.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">
                                    {server.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {server.company} • {server.packageName}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={isEnabled ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                  toggleServerForTool(tool.id, server.id)
                                }
                                className="min-w-[80px]"
                              >
                                <Power className="h-3 w-3 mr-1" />
                                {isEnabled ? 'ON' : 'OFF'}
                              </Button>
                            </div>
                          )
                        })}

                        {installedServers.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No MCP servers installed</p>
                            <p className="text-sm">
                              Install servers from the Marketplace first
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleToolExpanded(tool.id)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      {expandedTools.has(tool.id) ? 'Hide' : 'Configure'}{' '}
                      Servers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Undetected Tools */}
      {undetectedTools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Not Detected</h2>
            <Badge variant="secondary">{undetectedTools.length}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {undetectedTools.map(tool => (
              <Card
                key={tool.id}
                className="border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getToolIcon(tool.type)}
                    </div>
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Not installed or not found
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Tools State */}
      {aiTools.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No AI Tools Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't detect any AI development tools on your system.
            </p>
            <Button variant="outline" onClick={refreshTools}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Scan Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
