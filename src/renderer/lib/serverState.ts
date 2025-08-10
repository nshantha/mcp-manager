import { useState, useEffect, useCallback } from 'react'
import {
  AI_TOOL_CONFIG_PATHS,
  AI_TOOL_DISPLAY_NAMES,
  AI_TOOL_DESCRIPTIONS,
  type AIToolId,
} from '../../shared/config-paths'

export interface MCPServer {
  id: string
  name: string
  company: string
  description: string
  packageName: string
  installed: boolean
  enabledTools: string[]
  requiresAuth: boolean
  version?: string
  status?: 'working' | 'partial' | 'failed'
  lastVerified?: string
}

export interface AITool {
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

// Centralized state for the entire application
class AppStateManager {
  private static instance: AppStateManager
  private servers: MCPServer[] = []
  private aiTools: AITool[] = []
  private listeners: Set<() => void> = new Set()
  private initialized = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  private lastAIToolRefresh = 0

  private constructor() {
    this.initializeFallbackAITools()
    this.loadServersFromBackend()
    this.loadAIToolsFromBackend()

    // Auto-simulate installed servers in development for demo purposes
    if (process.env.NODE_ENV === 'development') {
      // Delay to ensure AI tools are loaded first
      setTimeout(() => {
        this.simulateInstalledServers()
      }, 1000)
    }
  }

  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager()
    }
    return AppStateManager.instance
  }

  private async loadServersFromBackend() {
    try {
      if (window.electronAPI?.getVettedServers) {
        const backendServers = await window.electronAPI.getVettedServers()
        this.servers = backendServers.map((server: any) => ({
          ...server,
          status: server.installed ? server.status || 'working' : 'failed',
          lastVerified: server.lastVerified || undefined,
        }))
        this.initialized = true
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load servers from backend:', error)
      this.initializeFallbackServers()
    }
  }

  private initializeFallbackServers() {
    // Real MCP servers as fallback for when backend is not available
    this.servers = [
      {
        id: 'github-mcp',
        name: 'GitHub MCP Server',
        description:
          'Access GitHub repositories, files, issues, and pull requests. Features automatic branch creation and comprehensive error handling.',
        company: 'github',
        packageName: '@modelcontextprotocol/server-github',
        requiresAuth: true,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'filesystem-mcp',
        name: 'File System MCP Server',
        description:
          'Secure file operations with configurable access controls. Flexible directory access control system.',
        company: 'anthropic',
        packageName: '@modelcontextprotocol/server-filesystem',
        requiresAuth: false,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'fetch-mcp',
        name: 'Fetch MCP Server',
        description:
          'Web content fetching and conversion for efficient LLM usage. Convert web pages to markdown.',
        company: 'anthropic',
        packageName: '@modelcontextprotocol/server-fetch',
        requiresAuth: false,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'git-mcp',
        name: 'Git MCP Server',
        description:
          'Tools to read, search, and manipulate Git repositories. Access commit history and repository information.',
        company: 'anthropic',
        packageName: '@modelcontextprotocol/server-git',
        requiresAuth: false,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'memory-mcp',
        name: 'Memory MCP Server',
        description:
          'Knowledge graph-based persistent memory system for maintaining context across conversations.',
        company: 'anthropic',
        packageName: '@modelcontextprotocol/server-memory',
        requiresAuth: false,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'time-mcp',
        name: 'Time MCP Server',
        description:
          'Time and timezone conversion capabilities. Handle date/time operations and conversions.',
        company: 'anthropic',
        packageName: '@modelcontextprotocol/server-time',
        requiresAuth: false,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'azure-mcp',
        name: 'Azure MCP Server',
        description:
          'Access key Azure services and tools like Azure Storage, Cosmos DB, and the Azure CLI.',
        company: 'azure',
        packageName: 'azure-mcp-server',
        requiresAuth: true,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
      {
        id: 'aiven-mcp',
        name: 'Aiven MCP Server',
        description:
          'Navigate Aiven projects and interact with PostgreSQL®, Apache Kafka®, ClickHouse® and OpenSearch® services.',
        company: 'aiven',
        packageName: '@aiven/mcp-aiven',
        requiresAuth: true,
        installed: false,
        enabledTools: [],
        status: 'failed',
        lastVerified: undefined,
      },
    ]
    this.initialized = true
    this.notifyListeners()
  }

  private async loadAIToolsFromBackend() {
    try {
      if (window.electronAPI?.detectAITools) {
        const detectedTools = await window.electronAPI.detectAITools()
        this.aiTools = detectedTools.map((tool: any) => ({
          id: tool.name, // Backend returns 'name' not 'id'
          name:
            AI_TOOL_DISPLAY_NAMES[tool.name as AIToolId] || tool.displayName,
          type: tool.name.includes('claude')
            ? 'claude'
            : tool.name.includes('vscode')
              ? 'vscode'
              : 'cursor',
          icon: this.getToolIcon(tool.name),
          description: this.getToolDescription(tool.name),
          status: tool.detected ? 'detected' : 'not_detected',
          configPath:
            AI_TOOL_CONFIG_PATHS[tool.name as AIToolId] || tool.configPath,
          version: tool.version,
          enabledServers: [],
          availableServers: [],
        }))
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load AI tools from backend:', error)
      // Fallback is already initialized
    }
  }

  private getToolIcon(toolId: string): string {
    switch (toolId as AIToolId) {
      case 'claude-desktop':
        return '🤖'
      case 'claude-code':
        return '⌨️'
      case 'vscode':
        return '💻'
      case 'cursor':
        return '🎯'
      default:
        return '🔧'
    }
  }

  private getToolDescription(toolId: string): string {
    return AI_TOOL_DESCRIPTIONS[toolId as AIToolId] || 'AI development tool'
  }

  private getDefaultConfigPath(toolId: string): string {
    return AI_TOOL_CONFIG_PATHS[toolId as AIToolId] || ''
  }

  private initializeFallbackAITools() {
    this.aiTools = Object.keys(AI_TOOL_CONFIG_PATHS).map(toolId => ({
      id: toolId,
      name: AI_TOOL_DISPLAY_NAMES[toolId as AIToolId],
      type: toolId.includes('claude')
        ? 'claude'
        : toolId.includes('vscode')
          ? 'vscode'
          : 'cursor',
      icon: this.getToolIcon(toolId),
      description: this.getToolDescription(toolId),
      status: 'not_detected' as const, // Will be updated by detection
      configPath: this.getDefaultConfigPath(toolId),
      version: '1.0.0',
      enabledServers: [],
      availableServers: [],
    }))
  }

  // Server management methods
  getServers(): MCPServer[] {
    return [...this.servers]
  }

  getServer(id: string): MCPServer | undefined {
    return this.servers.find(server => server.id === id)
  }

  updateServer(id: string, updates: Partial<MCPServer>) {
    const index = this.servers.findIndex(server => server.id === id)
    if (index !== -1) {
      this.servers[index] = { ...this.servers[index], ...updates }
      this.notifyListeners()
    }
  }

  async installServer(
    id: string,
    config?: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (window.electronAPI?.installMCPServer) {
        const result = await window.electronAPI.installMCPServer(
          id,
          config || {}
        )
        if (result?.success) {
          // Update local state
          const server = this.servers.find(s => s.id === id)
          if (server) {
            server.installed = true
            server.status = 'working'
            server.lastVerified = new Date().toISOString()

            // Auto-enable for all tools when installed
            for (const tool of this.aiTools) {
              if (!tool.enabledServers.includes(id)) {
                tool.enabledServers.push(id)
              }
            }

            this.notifyListeners()
          }
        }
        return result || { success: false, message: 'Installation failed' }
      }
      return { success: false, message: 'Backend not available' }
    } catch (error) {
      console.error('Failed to install server:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async uninstallServer(
    id: string,
    options?: { removePackage?: boolean }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (window.electronAPI?.uninstallMCPServer) {
        const result = await window.electronAPI.uninstallMCPServer(id, options)
        if (result?.success) {
          // Update local state
          const server = this.servers.find(s => s.id === id)
          if (server) {
            server.installed = false
            server.status = 'failed'
            server.lastVerified = undefined

            // Auto-disable from all tools when uninstalled
            for (const tool of this.aiTools) {
              tool.enabledServers = tool.enabledServers.filter(
                serverId => serverId !== id
              )
            }

            this.notifyListeners()
          }
        }
        return result || { success: false, message: 'Uninstallation failed' }
      }
      return { success: false, message: 'Backend not available' }
    } catch (error) {
      console.error('Failed to uninstall server:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  updateServerStatus(
    id: string,
    status: 'working' | 'partial' | 'failed',
    lastVerified?: string
  ) {
    const server = this.servers.find(s => s.id === id)
    if (server) {
      server.status = status
      if (lastVerified) {
        server.lastVerified = lastVerified
      }
      this.notifyListeners()
    }
  }

  // AI Tools management methods
  getAITools(): AITool[] {
    return [...this.aiTools]
  }

  getAITool(id: string): AITool | undefined {
    return this.aiTools.find(tool => tool.id === id)
  }

  updateAITool(id: string, updates: Partial<AITool>) {
    const index = this.aiTools.findIndex(tool => tool.id === id)
    if (index !== -1) {
      this.aiTools[index] = { ...this.aiTools[index], ...updates }
      this.notifyListeners()
    }
  }

  toggleServerForTool(toolId: string, serverId: string) {
    const tool = this.aiTools.find(t => t.id === toolId)
    if (tool) {
      const isEnabled = tool.enabledServers.includes(serverId)
      if (isEnabled) {
        tool.enabledServers = tool.enabledServers.filter(id => id !== serverId)
      } else {
        tool.enabledServers.push(serverId)
      }
      this.notifyListeners()
    }
  }

  toggleServerGlobally(serverId: string) {
    const isEnabled = this.aiTools.every(tool =>
      tool.enabledServers.includes(serverId)
    )

    for (const tool of this.aiTools) {
      if (isEnabled) {
        // Disable for all tools
        tool.enabledServers = tool.enabledServers.filter(id => id !== serverId)
      } else {
        // Enable for all tools
        if (!tool.enabledServers.includes(serverId)) {
          tool.enabledServers.push(serverId)
        }
      }
    }

    this.notifyListeners()
  }

  // Subscription system for real-time updates
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  // Backend integration methods
  async refreshServersFromBackend() {
    await this.loadServersFromBackend()
  }

  async refreshAIToolsFromBackend() {
    await this.loadAIToolsFromBackend()
  }

  async verifyServerInstallation(serverId: string): Promise<any> {
    try {
      if (window.electronAPI?.verifyServerInstallation) {
        const result =
          await window.electronAPI.verifyServerInstallation(serverId)

        // Update local status based on verification
        const server = this.servers.find(s => s.id === serverId)
        if (server && result) {
          server.status = result.overallStatus
          server.lastVerified = new Date().toISOString()
          this.notifyListeners()
        }

        return result
      }
      return null
    } catch (error) {
      console.error('Failed to verify server:', error)
      return null
    }
  }

  async runHealthCheckOnAll(): Promise<void> {
    const installedServers = this.servers.filter(s => s.installed)

    for (const server of installedServers) {
      try {
        await this.verifyServerInstallation(server.id)
      } catch (error) {
        console.error(`Health check failed for ${server.id}:`, error)
      }
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  startPeriodicHealthCheck(intervalMinutes = 5) {
    this.stopPeriodicHealthCheck() // Clear any existing interval

    this.healthCheckInterval = setInterval(
      async () => {
        const installedServers = this.servers.filter(s => s.installed)
        if (installedServers.length > 0) {
          console.log('Running periodic health check...')
          await this.runHealthCheckOnAll()
        }

        // Also refresh AI tool detection every 15 minutes
        const now = Date.now()
        const lastRefresh = this.lastAIToolRefresh || 0
        const fifteenMinutes = 15 * 60 * 1000

        if (now - lastRefresh >= fifteenMinutes) {
          console.log('Refreshing AI tool detection...')
          await this.refreshAIToolsFromBackend()
          this.lastAIToolRefresh = now
        }
      },
      intervalMinutes * 60 * 1000
    )

    console.log(
      `Started periodic health checks every ${intervalMinutes} minutes`
    )
  }

  stopPeriodicHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      console.log('Stopped periodic health checks')
    }
  }

  // Demo data for development
  simulateInstalledServers() {
    // Simulate some real servers as installed for demo purposes
    const demoInstalled = ['github-mcp', 'filesystem-mcp', 'fetch-mcp']
    for (const id of demoInstalled) {
      const server = this.servers.find(s => s.id === id)
      if (server) {
        server.installed = true
        server.status = 'working'
        server.lastVerified = new Date().toISOString()

        // Auto-enable for all tools
        for (const tool of this.aiTools) {
          if (!tool.enabledServers.includes(id)) {
            tool.enabledServers.push(id)
          }
        }
      }
    }
    this.notifyListeners()
  }
}

// Export the enhanced state manager
export const appStateManager = AppStateManager.getInstance()

// React hook for components to access the centralized state
export function useAppState() {
  const [state, setState] = useState({
    servers: appStateManager.getServers(),
    aiTools: appStateManager.getAITools(),
  })

  useEffect(() => {
    const unsubscribe = appStateManager.subscribe(() => {
      setState({
        servers: appStateManager.getServers(),
        aiTools: appStateManager.getAITools(),
      })
    })

    return unsubscribe
  }, [])

  // Memoize functions to prevent re-renders
  const refreshAIToolsFromBackend = useCallback(() => {
    return appStateManager.refreshAIToolsFromBackend()
  }, [])

  const updateAITool = useCallback((id: string, updates: any) => {
    return appStateManager.updateAITool(id, updates)
  }, [])

  const toggleServerForTool = useCallback(
    (toolId: string, serverId: string) => {
      return appStateManager.toggleServerForTool(toolId, serverId)
    },
    []
  )

  return {
    ...state,
    // Server methods
    installServer: appStateManager.installServer.bind(appStateManager),
    uninstallServer: appStateManager.uninstallServer.bind(appStateManager),
    updateServerStatus:
      appStateManager.updateServerStatus.bind(appStateManager),
    updateServer: appStateManager.updateServer.bind(appStateManager),

    // AI Tool methods (memoized to prevent re-renders)
    updateAITool,
    toggleServerForTool,
    toggleServerGlobally:
      appStateManager.toggleServerGlobally.bind(appStateManager),

    // Backend integration methods (memoized to prevent re-renders)
    refreshServersFromBackend:
      appStateManager.refreshServersFromBackend.bind(appStateManager),
    refreshAIToolsFromBackend,
    verifyServerInstallation:
      appStateManager.verifyServerInstallation.bind(appStateManager),
    runHealthCheckOnAll:
      appStateManager.runHealthCheckOnAll.bind(appStateManager),
    isInitialized: appStateManager.isInitialized.bind(appStateManager),
    startPeriodicHealthCheck:
      appStateManager.startPeriodicHealthCheck.bind(appStateManager),
    stopPeriodicHealthCheck:
      appStateManager.stopPeriodicHealthCheck.bind(appStateManager),

    // Utility methods
    simulateInstalledServers:
      appStateManager.simulateInstalledServers.bind(appStateManager),
  }
}

// Legacy hook for backward compatibility
export function useServerState() {
  const appState = useAppState()
  return {
    servers: appState.servers,
    installServer: appState.installServer,
    uninstallServer: appState.uninstallServer,
    updateServerStatus: appState.updateServerStatus,
    updateServer: appState.updateServer,
  }
}
