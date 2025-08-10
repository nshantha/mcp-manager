import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { AI_TOOL_CONFIG_PATHS } from '../../shared/config-paths'
import {
  CheckCircle,
  ExternalLink,
  FileText,
  Copy,
  Terminal,
  BookOpen,
  Save,
  Loader2,
} from 'lucide-react'

interface ServerInstructionsDialogProps {
  serverId: string | null
  serverName: string
  isOpen: boolean
  onClose: () => void
}

const INSTRUCTIONS = {
  'github-mcp': {
    title: 'GitHub MCP Server',
    description:
      'Access GitHub repositories, issues, and pull requests from your AI tools',
    setupInstructions: [
      'Get a GitHub Personal Access Token from https://github.com/settings/tokens',
      'Copy the token (it starts with ghp_)',
      'Add it to your environment or config files',
    ],
    usageExamples: {
      'Claude Code': [
        'Ask: "Show me the recent issues in my repository"',
        'Ask: "Create a new issue titled \'Bug fix\' in my repo"',
        'Ask: "List all pull requests in the main branch"',
      ],
      'VS Code': [
        'Use the MCP panel to browse repositories',
        'Right-click files to create issues',
        'View PR status directly in the editor',
      ],
      Cursor: [
        'Chat with GitHub data in your codebase',
        'Generate commit messages based on issues',
        'Auto-link code to GitHub issues',
      ],
    },
    configPaths: {
      'Claude Desktop': AI_TOOL_CONFIG_PATHS['claude-desktop'],
      'Claude Code': AI_TOOL_CONFIG_PATHS['claude-code'],
      'VS Code': AI_TOOL_CONFIG_PATHS.vscode,
      Cursor: AI_TOOL_CONFIG_PATHS.cursor,
    },
  },
  'filesystem-mcp': {
    title: 'File System MCP Server',
    description: 'Secure file system operations for your AI tools',
    setupInstructions: [
      'No authentication required',
      'Server provides safe file operations',
      'Automatically configured when installed',
    ],
    usageExamples: {
      'Claude Code': [
        'Ask: "Read the contents of my README.md file"',
        'Ask: "Create a new file called notes.txt"',
        'Ask: "List all Python files in this directory"',
      ],
      'VS Code': [
        'Use MCP commands to manage files',
        'Safe file operations through AI assistance',
        'Directory browsing with AI context',
      ],
      Cursor: [
        'AI-assisted file management',
        'Safe file operations in your workspace',
        'Context-aware file suggestions',
      ],
    },
    configPaths: {
      'Claude Desktop': AI_TOOL_CONFIG_PATHS['claude-desktop'],
      'Claude Code': AI_TOOL_CONFIG_PATHS['claude-code'],
      'VS Code': AI_TOOL_CONFIG_PATHS.vscode,
      Cursor: AI_TOOL_CONFIG_PATHS.cursor,
    },
  },
  'notion-mcp': {
    title: 'Notion MCP Server',
    description: 'Access and manage Notion databases and pages',
    setupInstructions: [
      'Create a Notion integration at https://www.notion.so/my-integrations',
      'Copy the integration token',
      'Share your databases with the integration',
    ],
    usageExamples: {
      'Claude Code': [
        'Ask: "Show me my Notion tasks for today"',
        'Ask: "Create a new page in my project database"',
        'Ask: "Update the status of task #123"',
      ],
      'VS Code': [
        'View Notion pages in the MCP panel',
        'Create documentation directly to Notion',
        'Sync project status with Notion',
      ],
      Cursor: [
        'Generate code documentation to Notion',
        'Track development progress in Notion',
        'Create technical specs from code',
      ],
    },
    configPaths: {
      'Claude Desktop': AI_TOOL_CONFIG_PATHS['claude-desktop'],
      'Claude Code': AI_TOOL_CONFIG_PATHS['claude-code'],
      'VS Code': AI_TOOL_CONFIG_PATHS.vscode,
      Cursor: AI_TOOL_CONFIG_PATHS.cursor,
    },
  },
  'browser-mcp': {
    title: 'Browser MCP (Playwright)',
    description: 'Automate Chromium via MCP for screenshots and web tasks',
    setupInstructions: [
      'No authentication required',
      'Installs Playwright browsers on first run if missing',
      'Use tools like browser.open, browser.screenshot',
    ],
    usageExamples: {
      Cursor: [
        'Open https://example.com and take a full-page screenshot',
        'Fill a form on a page and submit',
        'Scrape the title of the current page',
      ],
      'VS Code': [
        'Use MCP panel to issue browser.screenshot',
        'Navigate and capture element screenshots',
      ],
      'Claude Code': ['Open a page, click a selector, screenshot'],
    },
    configPaths: {
      'Claude Desktop': AI_TOOL_CONFIG_PATHS['claude-desktop'],
      'Claude Code': AI_TOOL_CONFIG_PATHS['claude-code'],
      'VS Code': AI_TOOL_CONFIG_PATHS.vscode,
      Cursor: AI_TOOL_CONFIG_PATHS.cursor,
    },
  },
}

export function ServerInstructionsDialog({
  serverId,
  serverName,
  isOpen,
  onClose,
}: ServerInstructionsDialogProps) {
  const [activeTab, setActiveTab] = useState<
    'setup' | 'usage' | 'tokens' | 'config'
  >('setup')
  // Keep hooks before any early returns to avoid hook order mismatch
  const [copied, setCopied] = useState<string | null>(null)

  if (!serverId || !isOpen) return null

  const instructions = INSTRUCTIONS[serverId as keyof typeof INSTRUCTIONS]
  if (!instructions) return null

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 1200)
    } catch {}
  }

  const openConfigFile = async (tool: string) => {
    const paths = instructions.configPaths
    const path = paths[tool as keyof typeof paths]

    try {
      const result = await window.electronAPI?.openConfigFile(path)
      if (!result?.success) {
        alert(
          `Could not open config file:\n${path}\n\nYou may need to create it first.`
        )
      }
    } catch (error) {
      alert(`Error opening config file:\n${path}\n\n${error}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {instructions.title} - Setup & Usage Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to configure and use this MCP server in your AI
            development tools
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'setup'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('setup')}
          >
            Setup Instructions
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('usage')}
          >
            Usage Examples
          </button>
          {instructions &&
            INSTRUCTIONS[
              serverId as keyof typeof INSTRUCTIONS
            ]?.setupInstructions?.some(
              s => s.includes('token') || s.includes('API')
            ) && (
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'tokens'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('tokens')}
              >
                API Tokens
              </button>
            )}
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('config')}
          >
            Config Files
          </button>
        </div>

        <div className="mt-6">
          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    How to Set Up {instructions.title}
                  </CardTitle>
                  <CardDescription>{instructions.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {instructions.setupInstructions.map(
                      (instruction, index) => (
                        <li
                          key={`setup-${serverId}-${instruction.substring(0, 20)}-${index}`}
                          className="flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm">{instruction}</span>
                        </li>
                      )
                    )}
                  </ol>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Good news!</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This server is already installed and configured in your AI
                  tools. You can start using it right away!
                </p>
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-4">
              {Object.entries(instructions.usageExamples).map(
                ([tool, examples]) => (
                  <Card key={tool}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Using with {tool}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {examples.map((example, index) => (
                          <div
                            key={`example-${tool}-${example.substring(0, 20)}-${index}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <code className="text-sm text-gray-800">
                              {example}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(example)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Configuration Files</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  The MCP server is configured in these files. You can edit them
                  directly if needed.
                </p>
              </div>

              {Object.entries(instructions.configPaths).map(([tool, path]) => (
                <Card key={tool}>
                  <CardHeader>
                    <CardTitle className="text-base">{tool}</CardTitle>
                    <CardDescription>
                      Configuration file location
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfigRow
                      tool={tool}
                      path={path}
                      onCopy={copyToClipboard}
                      copied={copied === path}
                      onOpen={() => openConfigFile(tool)}
                    />
                  </CardContent>
                </Card>
              ))}

              <UnifiedEditor configPaths={instructions.configPaths} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfigRow({
  tool,
  path,
  onCopy,
  copied,
  onOpen,
}: {
  tool: string
  path: string
  onCopy: (t: string) => void
  copied: boolean
  onOpen: () => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
      <div className="overflow-x-auto max-w-full">
        <code className="text-sm font-mono text-foreground/90 whitespace-pre">
          {path}
        </code>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(path)}
          className={
            copied ? 'border-green-300 text-green-700 bg-green-50' : ''
          }
        >
          <Copy className="h-3 w-3 mr-1" />
          {copied ? 'Copied' : 'Copy Path'}
        </Button>
        <Button size="sm" variant="outline" onClick={onOpen}>
          <ExternalLink className="h-3 w-3 mr-1" />
          Open
        </Button>
      </div>
    </div>
  )
}

function UnifiedEditor({
  configPaths,
}: { configPaths: Record<string, string> }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const primaryPath = Object.values(configPaths)[0]

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        const res = await window.electronAPI?.readConfigFile(primaryPath)
        setContent(res?.content ?? '')
      } catch (e) {
        setContent('')
      } finally {
        setLoading(false)
      }
    })()
  }, [primaryPath])

  const saveAll = async () => {
    try {
      setSaving(true)
      setStatus('idle')
      const paths = Object.values(configPaths)
      const res = await window.electronAPI?.writeConfigFiles(paths, content)
      if (res?.success) {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 1500)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Unified Editor</CardTitle>
        <CardDescription>
          Edit once and apply to all tool config files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-48 font-mono text-sm border border-border rounded-md p-3 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste or edit configuration JSON here"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {loading
                ? 'Loading...'
                : status === 'saved'
                  ? 'Saved to all config files'
                  : status === 'error'
                    ? 'Save failed'
                    : 'Edit and save to apply everywhere'}
            </div>
            <Button onClick={saveAll} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save to All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
