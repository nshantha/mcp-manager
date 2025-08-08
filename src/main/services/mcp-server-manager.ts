import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export interface MCPServer {
  id: string
  name: string
  company: 'github' | 'notion' | 'slack' | 'linear' | 'anthropic'
  description: string
  packageName: string
  installed: boolean
  enabledTools: string[]
  requiresAuth: boolean
  version?: string
}

export class MCPServerManager {
  // Vetted company servers only (as per MVP requirements)
  private readonly vettedServers: Omit<MCPServer, 'installed' | 'enabledTools'>[] = [
    {
      id: 'github-mcp',
      name: 'GitHub MCP Server',
      company: 'github',
      description: 'Access GitHub repositories, issues, and pull requests',
      packageName: '@modelcontextprotocol/server-github',
      requiresAuth: true
    },
    {
      id: 'notion-mcp', 
      name: 'Notion MCP Server',
      company: 'notion',
      description: 'Access and manage Notion databases and pages',
      packageName: '@modelcontextprotocol/server-notion',
      requiresAuth: true
    },
    {
      id: 'slack-mcp',
      name: 'Slack MCP Server', 
      company: 'slack',
      description: 'Send messages and interact with Slack channels',
      packageName: '@modelcontextprotocol/server-slack',
      requiresAuth: true
    },
    {
      id: 'linear-mcp',
      name: 'Linear MCP Server',
      company: 'linear', 
      description: 'Manage Linear issues and projects',
      packageName: '@modelcontextprotocol/server-linear',
      requiresAuth: true
    },
    {
      id: 'filesystem-mcp',
      name: 'File System MCP Server',
      company: 'anthropic',
      description: 'Secure file system operations',
      packageName: '@modelcontextprotocol/server-filesystem',
      requiresAuth: false
    }
  ]

  async getVettedServers(): Promise<MCPServer[]> {
    const servers: MCPServer[] = []

    for (const serverConfig of this.vettedServers) {
      const server: MCPServer = {
        ...serverConfig,
        installed: await this.isServerInstalled(serverConfig.packageName),
        enabledTools: await this.getEnabledTools(serverConfig.id)
      }
      servers.push(server)
    }

    return servers
  }

  async installServer(serverId: string, config?: any): Promise<{ success: boolean; message: string }> {
    try {
      const serverConfig = this.vettedServers.find(s => s.id === serverId)
      if (!serverConfig) {
        return { success: false, message: 'Server not found in vetted list' }
      }

      // For MVP, we'll just mark as installed and add to config
      // In production, you'd actually install the npm package
      console.log(`Installing MCP server: ${serverConfig.name}`)
      
      // Add to installed servers list
      await this.addToInstalledList(serverId, config)

      return { 
        success: true, 
        message: `${serverConfig.name} installed successfully` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to install server: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  async uninstallServer(serverId: string): Promise<{ success: boolean; message: string }> {
    try {
      const serverConfig = this.vettedServers.find(s => s.id === serverId)
      if (!serverConfig) {
        return { success: false, message: 'Server not found' }
      }

      // Remove from installed servers list
      await this.removeFromInstalledList(serverId)

      return { 
        success: true, 
        message: `${serverConfig.name} uninstalled successfully` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to uninstall server: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  async enableServerForTool(serverId: string, toolName: string): Promise<boolean> {
    try {
      const installedServers = await this.getInstalledServers()
      const server = installedServers[serverId]
      
      if (!server) return false

      if (!server.enabledTools.includes(toolName)) {
        server.enabledTools.push(toolName)
        await this.saveInstalledServers(installedServers)
      }

      return true
    } catch {
      return false
    }
  }

  async disableServerForTool(serverId: string, toolName: string): Promise<boolean> {
    try {
      const installedServers = await this.getInstalledServers()
      const server = installedServers[serverId]
      
      if (!server) return false

      server.enabledTools = server.enabledTools.filter(tool => tool !== toolName)
      await this.saveInstalledServers(installedServers)

      return true
    } catch {
      return false
    }
  }

  private async isServerInstalled(packageName: string): Promise<boolean> {
    try {
      const installedServers = await this.getInstalledServers()
      return Object.values(installedServers).some(server => 
        server.packageName === packageName
      )
    } catch {
      return false
    }
  }

  private async getEnabledTools(serverId: string): Promise<string[]> {
    try {
      const installedServers = await this.getInstalledServers()
      return installedServers[serverId]?.enabledTools || []
    } catch {
      return []
    }
  }

  private async addToInstalledList(serverId: string, config?: any): Promise<void> {
    const serverConfig = this.vettedServers.find(s => s.id === serverId)
    if (!serverConfig) return

    const installedServers = await this.getInstalledServers()
    installedServers[serverId] = {
      ...serverConfig,
      installed: true,
      enabledTools: [],
      config: config || {}
    }

    await this.saveInstalledServers(installedServers)
  }

  private async removeFromInstalledList(serverId: string): Promise<void> {
    const installedServers = await this.getInstalledServers()
    delete installedServers[serverId]
    await this.saveInstalledServers(installedServers)
  }

  private async getInstalledServers(): Promise<Record<string, any>> {
    try {
      const configPath = this.getConfigPath()
      if (!existsSync(configPath)) {
        return {}
      }

      const content = readFileSync(configPath, 'utf8')
      const config = JSON.parse(content)
      return config.installedServers || {}
    } catch {
      return {}
    }
  }

  private async saveInstalledServers(installedServers: Record<string, any>): Promise<void> {
    try {
      const configPath = this.getConfigPath()
      let config = {}

      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8')
        config = JSON.parse(content)
      }

      const updatedConfig = {
        ...config,
        installedServers
      }

      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))
    } catch (error) {
      console.error('Failed to save installed servers:', error)
    }
  }

  private getConfigPath(): string {
    // Store config in user's home directory
    const configDir = join(homedir(), '.mcp-manager')
    
    // Ensure directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }
    
    return join(configDir, 'config.json')
  }
}