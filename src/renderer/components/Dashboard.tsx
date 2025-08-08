import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Settings, ExternalLink, Loader2 } from 'lucide-react'
import type { AITool, MCPServer } from '../../shared/types'

export function Dashboard() {
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [toolsData, serversData] = await Promise.all([
        window.electronAPI?.detectAITools() || [],
        window.electronAPI?.getVettedServers() || []
      ])
      setAiTools(toolsData)
      setMcpServers(serversData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const installedServers = mcpServers.filter(server => server.installed)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Universal MCP Manager</h1>
        <p className="text-muted-foreground mt-2">
          Manage Model Context Protocol servers across your AI development tools
        </p>
      </div>

      {/* AI Tools Status */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Development Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiTools.map((tool) => (
            <ToolStatusCard key={tool.name} tool={tool} />
          ))}
        </div>
      </section>

      {/* MCP Servers Status */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Installed MCP Servers</h2>
        {installedServers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No MCP servers installed yet</p>
                <Button onClick={() => window.location.hash = '#/marketplace'}>
                  Browse Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installedServers.map((server) => (
              <ServerStatusCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ToolStatusCard({ tool }: { tool: AITool }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tool.displayName}</CardTitle>
          {tool.detected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <CardDescription>
          {tool.detected ? 'Detected and available' : 'Not found on system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tool.version && (
            <div className="flex items-center justify-between text-sm">
              <span>Version:</span>
              <Badge variant="secondary">{tool.version}</Badge>
            </div>
          )}
          {tool.executable && (
            <div className="flex items-center justify-between text-sm">
              <span>Executable:</span>
              <span className="text-muted-foreground font-mono text-xs">
                {tool.executable}
              </span>
            </div>
          )}
          {tool.configPath && (
            <div className="flex items-center justify-between text-sm">
              <span>Config:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => {
                  // Open config location
                  console.log('Open config at:', tool.configPath)
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ServerStatusCard({ server }: { server: MCPServer }) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{server.name}</CardTitle>
          <Badge className={getCompanyBadgeColor(server.company)}>
            {server.company}
          </Badge>
        </div>
        <CardDescription>{server.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Status:</span>
            <Badge variant="default" className="bg-green-600">
              Installed
            </Badge>
          </div>
          
          {server.enabledTools.length > 0 && (
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

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
            {server.requiresAuth && (
              <Badge variant="secondary" className="text-xs">
                Requires Auth
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}