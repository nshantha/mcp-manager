import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { exec as execCb, execSync } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execCb)

// Import centralized config paths
const AI_TOOL_CONFIG_PATHS = {
  'claude-desktop': join(
    homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json'
  ),
  'claude-code': join(homedir(), '.claude', 'config.json'),
  vscode: join(
    homedir(),
    'Library',
    'Application Support',
    'Code',
    'User',
    'settings.json'
  ),
  cursor: join(
    homedir(),
    'Library',
    'Application Support',
    'Cursor',
    'User',
    'settings.json'
  ),
} as const

export interface MCPServer {
  id: string
  name: string
  company: 'github' | 'anthropic' | 'azure' | 'aiven'
  description: string
  packageName: string
  installed: boolean
  enabledTools: string[]
  requiresAuth: boolean
  version?: string
}

export class MCPServerManager {
  // Real MCP servers from official sources
  private readonly vettedServers: Omit<
    MCPServer,
    'installed' | 'enabledTools'
  >[] = [
    {
      id: 'github-mcp',
      name: 'GitHub MCP Server',
      company: 'github',
      description:
        'Access GitHub repositories, files, issues, and pull requests. Features automatic branch creation and comprehensive error handling.',
      packageName: '@modelcontextprotocol/server-github',
      requiresAuth: true,
    },
    {
      id: 'filesystem-mcp',
      name: 'File System MCP Server',
      company: 'anthropic',
      description:
        'Secure file operations with configurable access controls. Flexible directory access control system.',
      packageName: '@modelcontextprotocol/server-filesystem',
      requiresAuth: false,
    },
    {
      id: 'fetch-mcp',
      name: 'Fetch MCP Server',
      company: 'anthropic',
      description:
        'Web content fetching and conversion for efficient LLM usage. Convert web pages to markdown.',
      packageName: '@modelcontextprotocol/server-fetch',
      requiresAuth: false,
    },
    {
      id: 'git-mcp',
      name: 'Git MCP Server',
      company: 'anthropic',
      description:
        'Tools to read, search, and manipulate Git repositories. Access commit history and repository information.',
      packageName: '@modelcontextprotocol/server-git',
      requiresAuth: false,
    },
    {
      id: 'memory-mcp',
      name: 'Memory MCP Server',
      company: 'anthropic',
      description:
        'Knowledge graph-based persistent memory system for maintaining context across conversations.',
      packageName: '@modelcontextprotocol/server-memory',
      requiresAuth: false,
    },
    {
      id: 'time-mcp',
      name: 'Time MCP Server',
      company: 'anthropic',
      description:
        'Time and timezone conversion capabilities. Handle date/time operations and conversions.',
      packageName: '@modelcontextprotocol/server-time',
      requiresAuth: false,
    },
    {
      id: 'azure-mcp',
      name: 'Azure MCP Server',
      company: 'azure',
      description:
        'Access key Azure services and tools like Azure Storage, Cosmos DB, and the Azure CLI.',
      packageName: 'azure-mcp-server',
      requiresAuth: true,
    },
    {
      id: 'aiven-mcp',
      name: 'Aiven MCP Server',
      company: 'aiven',
      description:
        'Navigate Aiven projects and interact with PostgreSQL®, Apache Kafka®, ClickHouse® and OpenSearch® services.',
      packageName: '@aiven/mcp-aiven',
      requiresAuth: true,
    },
  ]

  async getVettedServers(): Promise<MCPServer[]> {
    const servers: MCPServer[] = []

    for (const serverConfig of this.vettedServers) {
      const server: MCPServer = {
        ...serverConfig,
        installed: await this.isServerInstalled(serverConfig.packageName),
        enabledTools: await this.getEnabledTools(serverConfig.id),
      }
      servers.push(server)
    }

    return servers
  }

  async installServer(
    serverId: string,
    config?: any
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const serverConfig = this.vettedServers.find(s => s.id === serverId)
      if (!serverConfig) {
        return { success: false, message: 'Server not found in vetted list' }
      }

      console.log(`Installing MCP server: ${serverConfig.name}`)

      const installationDetails = {
        packageInstalled: false,
        configurationApplied: false,
        configuredTools: [] as string[],
        errors: [] as string[],
      }

      // Step 1: Check if package is already installed
      const isAlreadyInstalled = await this.checkNpmPackageInstalled(
        serverConfig.packageName
      )
      if (isAlreadyInstalled) {
        console.log(`Package ${serverConfig.packageName} is already installed`)
        installationDetails.packageInstalled = true
      } else {
        // Step 2: Install the actual npm package
        try {
          console.log(`Installing package: ${serverConfig.packageName}`)
          const installResult = await this.installNpmPackage(
            serverConfig.packageName
          )
          if (installResult.success) {
            console.log(
              `Package ${serverConfig.packageName} installed successfully`
            )
            installationDetails.packageInstalled = true
          } else {
            installationDetails.errors.push(
              `npm install failed: ${installResult.error}`
            )
            // Continue with configuration anyway - package might be available via npx
          }
        } catch (npmError) {
          const errorMessage =
            npmError instanceof Error ? npmError.message : 'Unknown npm error'
          console.warn(`npm install failed: ${errorMessage}`)
          installationDetails.errors.push(`npm install failed: ${errorMessage}`)
          // Continue anyway - package might already be installed globally or available via npx
        }
      }

      // Step 3: Add to our installed servers list
      await this.addToInstalledList(serverId, config)
      installationDetails.configurationApplied = true

      // Step 4: Configure detected AI tools
      try {
        const configResults = await this.configureAITools(serverId)
        installationDetails.configuredTools = configResults
      } catch (configError) {
        const errorMessage =
          configError instanceof Error
            ? configError.message
            : 'Unknown config error'
        installationDetails.errors.push(`Configuration failed: ${errorMessage}`)
      }

      // Step 5: Verify installation
      const verificationResult = await this.verifyServerInstallation(serverId)

      let message = `${serverConfig.name} installation completed`
      if (installationDetails.configuredTools.length > 0) {
        message += `. Configured for: ${installationDetails.configuredTools.join(', ')}`
      }

      if (installationDetails.errors.length > 0) {
        message += `. Warnings: ${installationDetails.errors.length} issue(s) encountered`
      }

      return {
        success:
          installationDetails.packageInstalled ||
          installationDetails.configurationApplied,
        message,
        details: {
          ...installationDetails,
          verification: verificationResult,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to install server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      }
    }
  }

  async uninstallServer(
    serverId: string,
    options?: { removePackage?: boolean }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const serverConfig = this.vettedServers.find(s => s.id === serverId)
      if (!serverConfig) {
        return { success: false, message: 'Server not found' }
      }

      console.log(`Uninstalling MCP server: ${serverConfig.name}`)

      const uninstallDetails = {
        configurationRemoved: false,
        packageRemoved: false,
        removedFromTools: [] as string[],
        errors: [] as string[],
      }

      // Step 1: Remove from AI tool configurations
      try {
        const removedFrom = await this.removeFromAITools(serverId)
        uninstallDetails.removedFromTools = removedFrom
        uninstallDetails.configurationRemoved = true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        uninstallDetails.errors.push(
          `Failed to remove configurations: ${errorMessage}`
        )
      }

      // Step 2: Remove from our installed servers list
      try {
        await this.removeFromInstalledList(serverId)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        uninstallDetails.errors.push(
          `Failed to remove from installed list: ${errorMessage}`
        )
      }

      // Step 3: Optionally uninstall npm package
      if (options?.removePackage) {
        try {
          const uninstallResult = await this.uninstallNpmPackage(
            serverConfig.packageName
          )
          uninstallDetails.packageRemoved = uninstallResult.success
          if (!uninstallResult.success && uninstallResult.error) {
            uninstallDetails.errors.push(
              `Package removal failed: ${uninstallResult.error}`
            )
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          uninstallDetails.errors.push(`Package removal error: ${errorMessage}`)
        }
      }

      let message = `${serverConfig.name} uninstalled successfully`
      if (uninstallDetails.removedFromTools.length > 0) {
        message += `. Removed from: ${uninstallDetails.removedFromTools.join(', ')}`
      }

      if (options?.removePackage) {
        message += uninstallDetails.packageRemoved
          ? '. Package removed from system'
          : '. Package removal skipped or failed'
      }

      if (uninstallDetails.errors.length > 0) {
        message += `. Warnings: ${uninstallDetails.errors.length} issue(s) encountered`
      }

      return {
        success:
          uninstallDetails.configurationRemoved ||
          uninstallDetails.packageRemoved,
        message,
        details: uninstallDetails,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to uninstall server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      }
    }
  }

  private async removeFromAITools(serverId: string): Promise<string[]> {
    const removedFrom: string[] = []

    // Remove from Claude Desktop
    try {
      await this.removeFromClaudeDesktop(serverId)
      removedFrom.push('Claude Desktop')
    } catch (error) {
      console.warn(`Failed to remove from Claude Desktop: ${error}`)
    }

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

  private async removeFromClaudeDesktop(serverId: string) {
    const claudeConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    )

    if (!existsSync(claudeConfigPath)) return

    let config: any = {}
    try {
      config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse config, skip removal
    }

    if (config.mcpServers?.[serverId]) {
      delete config.mcpServers[serverId]
      writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
      console.log(`Removed ${serverId} from Claude Desktop`)
    }
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

    if (config.mcpServers?.[serverId]) {
      delete config.mcpServers[serverId]
      writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
      console.log(`Removed ${serverId} from Claude Code`)
    }
  }

  private async removeFromVSCode(serverId: string) {
    const vscodeConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Code',
      'User',
      'settings.json'
    )

    if (!existsSync(vscodeConfigPath)) return

    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse settings, skip removal
    }

    if (settings['mcp.servers']?.[serverId]) {
      delete settings['mcp.servers'][serverId]
      writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
      console.log(`Removed ${serverId} from VS Code`)
    }
  }

  private async removeFromCursor(serverId: string) {
    const cursorConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Cursor',
      'User',
      'settings.json'
    )

    if (!existsSync(cursorConfigPath)) return

    let settings: any = {}
    try {
      settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
    } catch (error) {
      return // Can't parse settings, skip removal
    }

    if (settings['mcp.servers']?.[serverId]) {
      delete settings['mcp.servers'][serverId]
      writeFileSync(cursorConfigPath, JSON.stringify(settings, null, 2))
      console.log(`Removed ${serverId} from Cursor`)
    }
  }

  async enableServerForTool(
    serverId: string,
    toolName: string
  ): Promise<boolean> {
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

  async disableServerForTool(
    serverId: string,
    toolName: string
  ): Promise<boolean> {
    try {
      const installedServers = await this.getInstalledServers()
      const server = installedServers[serverId]

      if (!server) return false

      server.enabledTools = server.enabledTools.filter(
        (tool: string) => tool !== toolName
      )
      await this.saveInstalledServers(installedServers)

      return true
    } catch {
      return false
    }
  }

  private async isServerInstalled(packageName: string): Promise<boolean> {
    try {
      const installedServers = await this.getInstalledServers()
      return Object.values(installedServers).some(
        server => server.packageName === packageName
      )
    } catch {
      return false
    }
  }

  private async checkNpmPackageInstalled(
    packageName: string
  ): Promise<boolean> {
    try {
      // Check if package is installed globally (non-blocking)
      const { stdout } = await exec(`npm list -g ${packageName} --depth=0`, {
        maxBuffer: 10 * 1024 * 1024,
      })
      return stdout.includes(packageName)
    } catch {
      // Package not installed globally, check if available via npx
      try {
        await exec(`npx --yes ${packageName} --help`, {
          maxBuffer: 10 * 1024 * 1024,
        })
        return true
      } catch {
        return false
      }
    }
  }

  private async installNpmPackage(
    packageName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Installing npm package: ${packageName}`)
      await exec(`npm install -g ${packageName}`, {
        maxBuffer: 50 * 1024 * 1024,
      })

      // Verify installation
      const isInstalled = await this.checkNpmPackageInstalled(packageName)
      if (isInstalled) {
        return { success: true }
      }
      return {
        success: false,
        error: 'Package installation verification failed',
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown installation error'
      console.error(`Failed to install ${packageName}:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  private async uninstallNpmPackage(
    packageName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Uninstalling npm package: ${packageName}`)

      // Check if package is actually installed first
      const isInstalled = await this.checkNpmPackageInstalled(packageName)
      if (!isInstalled) {
        return { success: true } // Already not installed
      }

      execSync(`npm uninstall -g ${packageName}`, {
        stdio: 'pipe',
        timeout: 60000, // 1 minute timeout
        encoding: 'utf8',
      })

      // Verify uninstallation
      const stillInstalled = await this.checkNpmPackageInstalled(packageName)
      if (!stillInstalled) {
        console.log(`Package ${packageName} uninstalled successfully`)
        return { success: true }
      }
      return {
        success: false,
        error: 'Package uninstallation verification failed',
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown uninstallation error'
      console.error(`Failed to uninstall ${packageName}:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  public async verifyServerInstallation(serverId: string): Promise<{
    packageAvailable: boolean
    configurationValid: boolean
    serverResponds: boolean
    overallStatus: 'working' | 'partial' | 'failed'
  }> {
    const serverConfig = this.vettedServers.find(s => s.id === serverId)
    if (!serverConfig) {
      return {
        packageAvailable: false,
        configurationValid: false,
        serverResponds: false,
        overallStatus: 'failed',
      }
    }

    const verification: {
      packageAvailable: boolean
      configurationValid: boolean
      serverResponds: boolean
      overallStatus: 'working' | 'partial' | 'failed'
    } = {
      packageAvailable: false,
      configurationValid: false,
      serverResponds: false,
      overallStatus: 'failed',
    }

    // Check 1: Package availability
    verification.packageAvailable = await this.checkNpmPackageInstalled(
      serverConfig.packageName
    )

    // Check 2: Configuration validity
    try {
      const installedServers = await this.getInstalledServers()
      verification.configurationValid = !!installedServers[serverId]
    } catch {
      verification.configurationValid = false
    }

    // Check 3: Server responsiveness (basic test)
    if (verification.packageAvailable) {
      try {
        // Test if server can be invoked (basic health check)
        const testCommand = `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx ${serverConfig.packageName}`
        await exec(testCommand, { maxBuffer: 10 * 1024 * 1024 })
        verification.serverResponds = true
      } catch {
        // Server might require authentication or specific setup
        verification.serverResponds = false
      }
    }

    // Determine overall status
    if (verification.packageAvailable && verification.configurationValid) {
      verification.overallStatus = verification.serverResponds
        ? 'working'
        : 'partial'
    } else if (verification.configurationValid) {
      verification.overallStatus = 'partial'
    } else {
      verification.overallStatus = 'failed'
    }

    return verification
  }

  private async getEnabledTools(serverId: string): Promise<string[]> {
    try {
      const installedServers = await this.getInstalledServers()
      return installedServers[serverId]?.enabledTools || []
    } catch {
      return []
    }
  }

  private async addToInstalledList(
    serverId: string,
    config?: any
  ): Promise<void> {
    const serverConfig = this.vettedServers.find(s => s.id === serverId)
    if (!serverConfig) return

    const installedServers = await this.getInstalledServers()
    installedServers[serverId] = {
      ...serverConfig,
      installed: true,
      enabledTools: [],
      config: config || {},
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

  private async saveInstalledServers(
    installedServers: Record<string, any>
  ): Promise<void> {
    try {
      const configPath = this.getConfigPath()
      let config = {}

      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8')
        config = JSON.parse(content)
      }

      const updatedConfig = {
        ...config,
        installedServers,
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

    // Try to configure Claude Desktop
    try {
      await this.configureClaudeDesktop(serverId, serverConfig)
      configuredTools.push('Claude Desktop')
    } catch (error) {
      console.warn(`Failed to configure Claude Desktop: ${error}`)
    }

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

  private async configureClaudeDesktop(serverId: string, serverConfig: any) {
    const claudeConfigDir = join(
      homedir(),
      'Library',
      'Application Support',
      'Claude'
    )
    const claudeConfigPath = join(claudeConfigDir, 'claude_desktop_config.json')

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
        console.warn(
          'Failed to parse existing Claude Desktop config, creating new one'
        )
        config = {}
      }
    }

    // Add MCP server configuration
    config.mcpServers = config.mcpServers || {}
    config.mcpServers[serverId] = {
      command: 'npx',
      args: [serverConfig.packageName],
    }

    // Add environment variables if server requires auth
    if (serverConfig.requiresAuth) {
      config.mcpServers[serverId].env = this.getDefaultEnvVars(serverId)
    }

    // Write config back
    writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
    console.log(`Configured Claude Desktop for ${serverConfig.name}`)
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
        console.warn(
          'Failed to parse existing Claude Code config, creating new one'
        )
        config = {}
      }
    }

    // Add MCP server configuration (Claude Code format)
    config.mcpServers = config.mcpServers || {}
    config.mcpServers[serverId] = {
      command: 'npx',
      args: [serverConfig.packageName],
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
    const vscodeConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Code',
      'User',
      'settings.json'
    )

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
      args: [serverConfig.packageName],
    }

    if (serverConfig.requiresAuth) {
      settings['mcp.servers'][serverId].env = this.getDefaultEnvVars(serverId)
    }

    // Write settings back
    writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
    console.log(`Configured VS Code for ${serverConfig.name}`)
  }

  private async configureCursor(serverId: string, serverConfig: any) {
    const cursorConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Cursor',
      'User',
      'settings.json'
    )

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
      args: [serverConfig.packageName],
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
        envVars.GITHUB_PERSONAL_ACCESS_TOKEN = 'your_github_token_here'
        break
      case 'notion-mcp':
        envVars.NOTION_API_KEY = 'your_notion_key_here'
        break
      case 'slack-mcp':
        envVars.SLACK_BOT_TOKEN = 'your_slack_token_here'
        break
      case 'linear-mcp':
        envVars.LINEAR_API_KEY = 'your_linear_key_here'
        break
    }

    return envVars
  }

  private async hasValidAuthTokens(
    serverId: string,
    configuredTools: string[]
  ): Promise<boolean> {
    const placeholderValues = [
      'your_github_token_here',
      'your_notion_key_here',
      'your_slack_token_here',
      'your_linear_key_here',
      '',
      null,
      undefined,
    ]

    // Check if any configured tool has valid (non-placeholder) tokens
    for (const tool of configuredTools) {
      try {
        let envVars: Record<string, string> = {}

        if (tool === 'Claude Code') {
          const claudeConfigPath = join(
            homedir(),
            'Library',
            'Application Support',
            'Claude',
            'claude_desktop_config.json'
          )
          if (existsSync(claudeConfigPath)) {
            const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
            envVars = config.mcpServers?.[serverId]?.env || {}
          }
        } else if (tool === 'VS Code') {
          const vscodeConfigPath = join(
            homedir(),
            'Library',
            'Application Support',
            'Code',
            'User',
            'settings.json'
          )
          if (existsSync(vscodeConfigPath)) {
            const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
            envVars = settings['mcp.servers']?.[serverId]?.env || {}
          }
        } else if (tool === 'Cursor') {
          const cursorConfigPath = join(
            homedir(),
            'Library',
            'Application Support',
            'Cursor',
            'User',
            'settings.json'
          )
          if (existsSync(cursorConfigPath)) {
            const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
            envVars = settings['mcp.servers']?.[serverId]?.env || {}
          }
        }

        // Check if any environment variable has a real (non-placeholder) value
        for (const [key, value] of Object.entries(envVars)) {
          if (
            value &&
            typeof value === 'string' &&
            !placeholderValues.includes(value.toLowerCase())
          ) {
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
    server: MCPServer | null
    status: {
      installed: boolean
      configuredTools: string[]
      authRequired: boolean
      authConfigured: boolean
    }
  }> {
    try {
      const servers = await this.getVettedServers()
      const server = servers.find(s => s.id === serverId)

      if (!server) {
        return {
          server: null,
          status: {
            installed: false,
            configuredTools: [],
            authRequired: false,
            authConfigured: false,
          },
        }
      }

      const configuredTools: string[] = []

      // Check which tools have this server configured
      try {
        const claudeConfigPath = join(
          homedir(),
          'Library',
          'Application Support',
          'Claude',
          'claude_desktop_config.json'
        )
        if (existsSync(claudeConfigPath)) {
          const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
          if (config.mcpServers?.[serverId]) {
            configuredTools.push('Claude Code')
          }
        }
      } catch (error) {
        console.warn('Failed to check Claude Code config:', error)
      }

      try {
        const vscodeConfigPath = join(
          homedir(),
          'Library',
          'Application Support',
          'Code',
          'User',
          'settings.json'
        )
        if (existsSync(vscodeConfigPath)) {
          const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
          if (settings['mcp.servers']?.[serverId]) {
            configuredTools.push('VS Code')
          }
        }
      } catch (error) {
        console.warn('Failed to check VS Code config:', error)
      }

      try {
        const cursorConfigPath = join(
          homedir(),
          'Library',
          'Application Support',
          'Cursor',
          'User',
          'settings.json'
        )
        if (existsSync(cursorConfigPath)) {
          const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
          if (settings['mcp.servers']?.[serverId]) {
            configuredTools.push('Cursor')
          }
        }
      } catch (error) {
        console.warn('Failed to check Cursor config:', error)
      }

      // Check auth status - detect if real tokens are configured
      let authConfigured = !server.requiresAuth

      if (server.requiresAuth) {
        authConfigured = await this.hasValidAuthTokens(
          serverId,
          configuredTools
        )
      }

      return {
        server,
        status: {
          installed: server.installed,
          configuredTools,
          authRequired: server.requiresAuth,
          authConfigured,
        },
      }
    } catch (error) {
      console.error('Failed to get server configuration:', error)
      return {
        server: null,
        status: {
          installed: false,
          configuredTools: [],
          authRequired: false,
          authConfigured: false,
        },
      }
    }
  }

  async configureServerAuth(
    serverId: string,
    authConfig: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
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

      const message =
        configuredTools.length > 0
          ? `Authentication configured for: ${configuredTools.join(', ')}`
          : 'Authentication updated (no tools currently configured)'

      return { success: true, message }
    } catch (error) {
      return {
        success: false,
        message: `Failed to configure authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private async updateClaudeCodeAuth(
    serverId: string,
    authConfig: Record<string, string>
  ) {
    const claudeConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    )
    if (!existsSync(claudeConfigPath)) return

    const config = JSON.parse(readFileSync(claudeConfigPath, 'utf8'))
    if (config.mcpServers?.[serverId]) {
      config.mcpServers[serverId].env = {
        ...config.mcpServers[serverId].env,
        ...authConfig,
      }
      writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2))
    }
  }

  private async updateVSCodeAuth(
    serverId: string,
    authConfig: Record<string, string>
  ) {
    const vscodeConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Code',
      'User',
      'settings.json'
    )
    if (!existsSync(vscodeConfigPath)) return

    const settings = JSON.parse(readFileSync(vscodeConfigPath, 'utf8'))
    if (settings['mcp.servers']?.[serverId]) {
      settings['mcp.servers'][serverId].env = {
        ...settings['mcp.servers'][serverId].env,
        ...authConfig,
      }
      writeFileSync(vscodeConfigPath, JSON.stringify(settings, null, 2))
    }
  }

  private async updateCursorAuth(
    serverId: string,
    authConfig: Record<string, string>
  ) {
    const cursorConfigPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Cursor',
      'User',
      'settings.json'
    )
    if (!existsSync(cursorConfigPath)) return

    const settings = JSON.parse(readFileSync(cursorConfigPath, 'utf8'))
    if (settings['mcp.servers']?.[serverId]) {
      settings['mcp.servers'][serverId].env = {
        ...settings['mcp.servers'][serverId].env,
        ...authConfig,
      }
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

  async writeMCPConfigForTool(
    toolId: string,
    config: any
  ): Promise<{ success: boolean; message: string; configPath?: string }> {
    try {
      const toolConfigPaths: Record<string, string> = {
        ...AI_TOOL_CONFIG_PATHS,
        claude: AI_TOOL_CONFIG_PATHS['claude-desktop'], // Default to Claude Desktop for backward compatibility
      }

      const configPath = toolConfigPaths[toolId]
      if (!configPath) {
        return { success: false, message: `Unknown tool: ${toolId}` }
      }

      // Ensure directory exists
      const configDir = dirname(configPath)
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      // Read existing config or create new one
      let existingConfig = {}
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, 'utf8')
          existingConfig = content.trim() ? JSON.parse(content) : {}
        } catch (parseError) {
          console.warn(
            `Failed to parse existing config at ${configPath}, creating new one`
          )
          existingConfig = {}
        }
      }

      // Merge the new MCP config
      const mergedConfig = { ...existingConfig, ...config }

      // Write the updated config
      writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2))

      return {
        success: true,
        message: `Successfully wrote MCP configuration for ${toolId}`,
        configPath,
      }
    } catch (error) {
      console.error(`Failed to write MCP config for ${toolId}:`, error)
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}
