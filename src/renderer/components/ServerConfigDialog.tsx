import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  CheckCircle,
  XCircle,
  Settings,
  Key,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import type { MCPServer } from '../../shared/types'

interface ServerConfigDialogProps {
  serverId: string | null
  isOpen: boolean
  onClose: () => void
}

interface ServerConfiguration {
  server: MCPServer | null
  status: {
    installed: boolean
    configuredTools: string[]
    authRequired: boolean
    authConfigured: boolean
  }
}

const AUTH_FIELD_MAP = {
  'github-mcp': [
    {
      key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      label: 'GitHub Personal Access Token',
      placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
    },
  ],
  'notion-mcp': [
    {
      key: 'NOTION_API_KEY',
      label: 'Notion API Key',
      placeholder: 'secret_xxxxxxxxxxxxxxxxxxxx',
    },
  ],
  'slack-mcp': [
    {
      key: 'SLACK_BOT_TOKEN',
      label: 'Slack Bot Token',
      placeholder: 'xoxb-xxxxxxxxxxxxxxxxxxxx',
    },
  ],
  'linear-mcp': [
    {
      key: 'LINEAR_API_KEY',
      label: 'Linear API Key',
      placeholder: 'lin_api_xxxxxxxxxxxxxxxxxxxx',
    },
  ],
}

export function ServerConfigDialog({
  serverId,
  isOpen,
  onClose,
}: ServerConfigDialogProps) {
  const [config, setConfig] = useState<ServerConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [configuring, setConfiguring] = useState(false)

  console.log('ServerConfigDialog rendered with:', { serverId, isOpen })

  useEffect(() => {
    if (serverId && isOpen) {
      loadConfiguration()
    } else {
      setConfig(null)
      setAuthValues({})
    }
  }, [serverId, isOpen])

  const loadConfiguration = async () => {
    if (!serverId) return

    try {
      setLoading(true)
      const configData =
        await window.electronAPI?.getServerConfiguration(serverId)
      setConfig(configData)
    } catch (error) {
      console.error('Failed to load server configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSubmit = async () => {
    if (!serverId || !config) return

    try {
      setConfiguring(true)
      const result = await window.electronAPI?.configureServerAuth(
        serverId,
        authValues
      )

      if (result?.success) {
        // Reload configuration to show updated status
        await loadConfiguration()
        alert(`Success: ${result.message}`)
      } else {
        alert(`Error: ${result?.message || 'Configuration failed'}`)
      }
    } catch (error) {
      console.error('Failed to configure authentication:', error)
      alert(`Error: ${error}`)
    } finally {
      setConfiguring(false)
    }
  }

  const getCompanyBadgeColor = (company: string) => {
    const colors = {
      github: 'bg-gray-900 text-white',
      notion: 'bg-black text-white',
      slack: 'bg-purple-600 text-white',
      linear: 'bg-blue-600 text-white',
      anthropic: 'bg-orange-600 text-white',
    }
    return colors[company as keyof typeof colors] || 'bg-gray-600 text-white'
  }

  const authFields = serverId
    ? AUTH_FIELD_MAP[serverId as keyof typeof AUTH_FIELD_MAP] || []
    : []

  if (!config?.server) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Server Configuration</DialogTitle>
            <DialogDescription>
              {loading ? 'Loading server configuration...' : 'Server not found'}
            </DialogDescription>
          </DialogHeader>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  const { server, status } = config

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {server.name}
          </DialogTitle>
          <DialogDescription>
            Manage authentication and tool configurations for this MCP server
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{server.name}</CardTitle>
                <Badge className={getCompanyBadgeColor(server.company)}>
                  {server.company}
                </Badge>
              </div>
              <CardDescription>{server.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Package</Label>
                  <p className="font-mono text-xs">{server.packageName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Installation Status
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    {status.installed ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Installed
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        Not Installed
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tool Configuration Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Tool Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status.configuredTools.length > 0 ? (
                <div>
                  <Label className="text-muted-foreground">
                    Configured in:
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {status.configuredTools.map(tool => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Not configured in any AI development tools yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authentication Configuration */}
          {status.authRequired && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Authentication Required
                </CardTitle>
                <CardDescription>
                  This server requires API credentials to function properly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!status.authConfigured && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Authentication not configured. The server may not work
                      correctly.
                    </span>
                  </div>
                )}

                {authFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type="password"
                      placeholder={field.placeholder}
                      value={authValues[field.key] || ''}
                      onChange={e =>
                        setAuthValues(prev => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleAuthSubmit}
                    disabled={
                      configuring ||
                      !Object.values(authValues).some(v => v.trim())
                    }
                  >
                    {configuring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Configuring...
                      </>
                    ) : (
                      'Save Authentication'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Open docs for getting API keys
                      const docsUrls = {
                        'github-mcp':
                          'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
                        'notion-mcp':
                          'https://developers.notion.com/docs/create-a-notion-integration',
                        'slack-mcp':
                          'https://api.slack.com/authentication/token-types#bot',
                        'linear-mcp':
                          'https://developers.linear.app/docs/graphql/working-with-the-graphql-api',
                      }
                      const url = docsUrls[serverId as keyof typeof docsUrls]
                      if (url) {
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
