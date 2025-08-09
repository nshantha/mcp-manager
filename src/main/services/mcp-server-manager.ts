import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

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

      console.log(`Installing MCP server: ${serverConfig.name}`)
      
      // Step 1: Install the actual npm package
      if (serverConfig.packageName.startsWith('@modelcontextprotocol/')) {
        try {
          console.log(`Installing package: ${serverConfig.packageName}`)
          execSync(`npm install -g ${serverConfig.packageName}`, { 
            stdio: 'pipe',
            timeout: 60000 // 1 minute timeout
          })
          console.log(`Package ${serverConfig.packageName} installed successfully`)
        } catch (npmError) {
          console.warn(`npm install failed, continuing with configuration: ${npmError}`)
          // Continue anyway - package might already be installed or available via npx
        }
      }

      // Step 2: Add to our installed servers list
      await this.addToInstalledList(serverId, config)

      // Step 3: Configure detected AI tools
      const configResults = await this.configureAITools(serverId)
      
      let message = `${serverConfig.name} installed successfully`
      if (configResults.length > 0) {
        message += `. Configured for: ${configResults.join(', ')}`
      }

      return { 
        success: true, 
        message 
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

      console.log(`Uninstalling MCP server: ${serverConfig.name}`)

      // Step 1: Remove from AI tool configurations
      const removedFrom = await this.removeFromAITools(serverId)

      // Step 2: Remove from our installed servers list
      await this.removeFromInstalledList(serverId)

      // Step 3: Optionally uninstall npm package (commented out to avoid breaking other tools)
      // execSync(`npm uninstall -g ${serverConfig.packageName}`)

      let message = `${serverConfig.name} uninstalled successfully`
      if (removedFrom.length > 0) {
        message += `. Removed from: ${removedFrom.join(', ')}`
      }

      return { 
        success: true, 
        message
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to uninstall server: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  private async removeFromAITools(serverId: string): Promise<string[]> {
    const removedFrom: string[] = []

    // Remove from Claude Code
    try {
      await this.removeFromClaudeCode(serverId)
      removedFrom.push('Claude Code')
    } catch (error) {
      console.warn(`Failed to remove from Claude Code: ${error}`)
    }

    // Remove from VS Code
    try {
      await this.removeFromVSCode(serverId)
      removedFrom.push('VS Code')
    } catch (error) {
      console.warn(`Failed to remove from VS Code: ${error}`)
    }

    // Remove from Cursor
    try {
      await this.removeFromCursor(serverId)
      removedFrom.push('Cursor')
    } catch (error) {
      console.warn(`Failed to remove from Cursor: ${error}`)
    }

    return removedFrom
  }

  private async removeFromClaudeCode(serverId: string) {
    const claudeConfigPath = join(homedir(), '.claude', 'config.json')
    
    if (!existsSync(claudeConfigPath)) return

    let config: any = {}
    try {
      config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse config, skip removal
    }

    if (config.mcpServers && config.mcpServers[serverId]) {
      delete config.mcpServers[serverId]
      writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
      console.log(`Removed ${serverId} from Claude Code`)
    }
  }

  private async removeFromVSCode(serverId: string) {
    const vscodeConfigPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
    
    if (!existsSync(vscodeConfigPath)) return

    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse settings, skip removal
    }

    if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
      delete settings['mcp.servers'][serverId]
      writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
      console.log(`Removed ${serverId} from VS Code`)
    }
  }

  private async removeFromCursor(serverId: string) {
    const cursorConfigPath = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json')
    
    if (!existsSync(cursorConfigPath)) return

    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse settings, skip removal
    }

    if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
      delete settings['mcp.servers'][serverId]
      writeFileSync(cursorConfigPath, JSON.stringify(settings, null, 2))
      console.log(`Removed ${serverId} from Cursor`)
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

  private async configureAITools(serverId: string): Promise<string[]> {
    const serverConfig = this.vettedServers.find(s => s.id === serverId)
    if (!serverConfig) return []

    const configuredTools: string[] = []

    // Try to configure Claude Code
    try {
      await this.configureClaudeCode(serverId, serverConfig)
      configuredTools.push('Claude Code')
    } catch (error) {
      console.warn(`Failed to configure Claude Code: ${error}`)
    }

    // Try to configure VS Code
    try {
      await this.configureVSCode(serverId, serverConfig)
      configuredTools.push('VS Code')
    } catch (error) {
      console.warn(`Failed to configure VS Code: ${error}`)
    }

    // Try to configure Cursor
    try {
      await this.configureCursor(serverId, serverConfig)
      configuredTools.push('Cursor')
    } catch (error) {
      console.warn(`Failed to configure Cursor: ${error}`)
    }

    return configuredTools
  }

  private async configureClaudeCode(serverId: string, serverConfig: any) {
    const claudeConfigDir = join(homedir(), '.claude')
    const claudeConfigPath = join(claudeConfigDir, 'config.json')

    // Create directory if it doesn't exist
    if (!existsSync(claudeConfigDir)) {
      mkdirSync(claudeConfigDir, { recursive: true })
    }

    // Read existing config or create new one
    let config: any = {}
    if (existsSync(claudeConfigPath)) {
      try {
        config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
      } catch (error) {
        console.warn('Failed to parse existing Claude config, creating new one')
        config = {}
      }
    }

    // Add MCP server configuration
    config.mcpServers = config.mcpServers || {}
    config.mcpServers[serverId] = {
      command: 'npx',
      args: [serverConfig.packageName]
    }

    // Add environment variables if server requires auth
    if (serverConfig.requiresAuth) {
      config.mcpServers[serverId].env = this.getDefaultEnvVars(serverId)
    }

    // Write config back
    writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
    console.log(`Configured Claude Code for ${serverConfig.name}`)
  }

  private async configureVSCode(serverId: string, serverConfig: any) {
    const vscodeConfigPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
    
    if (!existsSync(vscodeConfigPath)) {
      console.log('VS Code settings.json not found, skipping configuration')
      return
    }

    // Read existing settings
    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
    } catch (error) {
      console.warn('Failed to parse VS Code settings, creating new MCP section')
      settings = {}
    }

    // Add MCP server configuration
    settings['mcp.servers'] = settings['mcp.servers'] || {}
    settings['mcp.servers'][serverId] = {
      command: 'npx',
      args: [serverConfig.packageName]
    }

    if (serverConfig.requiresAuth) {
      settings['mcp.servers'][serverId].env = this.getDefaultEnvVars(serverId)
    }

    // Write settings back
    writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
    console.log(`Configured VS Code for ${serverConfig.name}`)
  }

  private async configureCursor(serverId: string, serverConfig: any) {
    const cursorConfigPath = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json')
    
    if (!existsSync(cursorConfigPath)) {
      console.log('Cursor settings.json not found, skipping configuration')
      return
    }

    // Read existing settings
    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
    } catch (error) {
      console.warn('Failed to parse Cursor settings, creating new MCP section')
      settings = {}
    }

    // Add MCP server configuration
    settings['mcp.servers'] = settings['mcp.servers'] || {}
    settings['mcp.servers'][serverId] = {
      command: 'npx',
      args: [serverConfig.packageName]
    }

    if (serverConfig.requiresAuth) {
      settings['mcp.servers'][serverId].env = this.getDefaultEnvVars(serverId)
    }

    // Write settings back
    writeFileSync(cursorConfigPath, JSON.stringify(settings, null, 2))
    console.log(`Configured Cursor for ${serverConfig.name}`)
  }

  private getDefaultEnvVars(serverId: string): Record<string, string> {
    const envVars: Record<string, string> = {}

    switch (serverId) {
      case 'github-mcp':
        envVars['GITHUB_PERSONAL_ACCESS_TOKEN'] = 'your_github_token_here'
        break
      case 'notion-mcp':
        envVars['NOTION_API_KEY'] = 'your_notion_key_here'
        break
      case 'slack-mcp':
        envVars['SLACK_BOT_TOKEN'] = 'your_slack_token_here'
        break
      case 'linear-mcp':
        envVars['LINEAR_API_KEY'] = 'your_linear_key_here'
        break
    }

    return envVars
  }

  private async hasValidAuthTokens(serverId: string, configuredTools: string[]): Promise<boolean> {
    const placeholderValues = [
      'your_github_token_here',
      'your_notion_key_here', 
      'your_slack_token_here',
      'your_linear_key_here',
      '',
      null,
      undefined
    ]

    // Check if any configured tool has valid (non-placeholder) tokens
    for (const tool of configuredTools) {
      try {
        let envVars: Record<string, string> = {}

        if (tool === 'Claude Code') {
          const claudeConfigPath = join(homedir(), '.claude', 'config.json')
          if (existsSync(claudeConfigPath)) {
            const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
            envVars = config.mcpServers?.[serverId]?.env || {}
          }
        } else if (tool === 'VS Code') {
          const vscodeConfigPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
          if (existsSync(vscodeConfigPath)) {
            const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
            envVars = settings['mcp.servers']?.[serverId]?.env || {}
          }
        } else if (tool === 'Cursor') {
          const cursorConfigPath = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json')
          if (existsSync(cursorConfigPath)) {
            const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
            envVars = settings['mcp.servers']?.[serverId]?.env || {}
          }
        }

        // Check if any environment variable has a real (non-placeholder) value
        for (const [key, value] of Object.entries(envVars)) {
          if (value && typeof value === 'string' && !placeholderValues.includes(value.toLowerCase())) {
            // Found at least one valid token
            return true
          }
        }
      } catch (error) {
        console.warn(`Failed to check auth tokens for ${tool}:`, error)
      }
    }

    return false
  }

  async getServerConfiguration(serverId: string): Promise<{
    server: MCPServer | null;
    status: {
      installed: boolean;
      configuredTools: string[];
      authRequired: boolean;
      authConfigured: boolean;
    }
  }> {
    try {
      const servers = await this.getVettedServers()
      const server = servers.find(s => s.id === serverId)
      
      if (!server) {
        return { server: null, status: { installed: false, configuredTools: [], authRequired: false, authConfigured: false } }
      }

      const configuredTools: string[] = []
      
      // Check which tools have this server configured
      try {
        const claudeConfigPath = join(homedir(), '.claude', 'config.json')
        if (existsSync(claudeConfigPath)) {
          const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
          if (config.mcpServers && config.mcpServers[serverId]) {
            configuredTools.push('Claude Code')
          }
        }
      } catch (error) {
        console.warn('Failed to check Claude Code config:', error)
      }

      try {
        const vscodeConfigPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
        if (existsSync(vscodeConfigPath)) {
          const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
          if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
            configuredTools.push('VS Code')
          }
        }
      } catch (error) {
        console.warn('Failed to check VS Code config:', error)
      }

      try {
        const cursorConfigPath = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json')
        if (existsSync(cursorConfigPath)) {
          const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
          if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
            configuredTools.push('Cursor')
          }
        }
      } catch (error) {
        console.warn('Failed to check Cursor config:', error)
      }

      // Check auth status - detect if real tokens are configured
      let authConfigured = !server.requiresAuth
      
      if (server.requiresAuth) {
        authConfigured = await this.hasValidAuthTokens(serverId, configuredTools)
      }

      return {
        server,
        status: {
          installed: server.installed,
          configuredTools,
          authRequired: server.requiresAuth,
          authConfigured
        }
      }
    } catch (error) {
      console.error('Failed to get server configuration:', error)
      return { server: null, status: { installed: false, configuredTools: [], authRequired: false, authConfigured: false } }
    }
  }

  async configureServerAuth(serverId: string, authConfig: Record<string, string>): Promise<{ success: boolean; message: string }> {
    try {
      const serverConfig = this.vettedServers.find(s => s.id === serverId)
      if (!serverConfig) {
        return { success: false, message: 'Server not found' }
      }

      // For now, we'll update the configurations with the auth environment variables
      // In a production app, you'd want to store these securely (keychain/credential manager)
      
      const configuredTools = []

      // Update Claude Code config with auth
      try {
        await this.updateClaudeCodeAuth(serverId, authConfig)
        configuredTools.push('Claude Code')
      } catch (error) {
        console.warn(`Failed to update Claude Code auth: ${error}`)
      }

      // Update VS Code config with auth
      try {
        await this.updateVSCodeAuth(serverId, authConfig)
        configuredTools.push('VS Code')
      } catch (error) {
        console.warn(`Failed to update VS Code auth: ${error}`)
      }

      // Update Cursor config with auth
      try {
        await this.updateCursorAuth(serverId, authConfig)
        configuredTools.push('Cursor')
      } catch (error) {
        console.warn(`Failed to update Cursor auth: ${error}`)
      }

      const message = configuredTools.length > 0 
        ? `Authentication configured for: ${configuredTools.join(', ')}`
        : 'Authentication updated (no tools currently configured)'

      return { success: true, message }
    } catch (error) {
      return { success: false, message: `Failed to configure authentication: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private async updateClaudeCodeAuth(serverId: string, authConfig: Record<string, string>) {
    const claudeConfigPath = join(homedir(), '.claude', 'config.json')
    if (!existsSync(claudeConfigPath)) return

    const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
    if (config.mcpServers && config.mcpServers[serverId]) {
      config.mcpServers[serverId].env = { ...config.mcpServers[serverId].env, ...authConfig }
      writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
    }
  }

  private async updateVSCodeAuth(serverId: string, authConfig: Record<string, string>) {
    const vscodeConfigPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json')
    if (!existsSync(vscodeConfigPath)) return

    const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
    if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
      settings['mcp.servers'][serverId].env = { ...settings['mcp.servers'][serverId].env, ...authConfig }
      writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
    }
  }

  private async updateCursorAuth(serverId: string, authConfig: Record<string, string>) {
    const cursorConfigPath = join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json')
    if (!existsSync(cursorConfigPath)) return

    const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
    if (settings['mcp.servers'] && settings['mcp.servers'][serverId]) {
      settings['mcp.servers'][serverId].env = { ...settings['mcp.servers'][serverId].env, ...authConfig }
      writeFileSync(cursorConfigPath, JSON.stringify(settings, null, 2))
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