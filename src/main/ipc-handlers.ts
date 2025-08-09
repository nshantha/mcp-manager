import { ipcMain } from 'electron'
import { homedir } from 'os'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { AIToolDetector } from './services/ai-tool-detector'
import { MCPServerManager } from './services/mcp-server-manager'

export function setupIpcHandlers(): void {
  const toolDetector = new AIToolDetector()
  const serverManager = new MCPServerManager()

  // AI Tool Detection
  ipcMain.handle('detect-ai-tools', async () => {
    try {
      return await toolDetector.detectAllTools()
    } catch (error) {
      console.error('Failed to detect AI tools:', error)
      return []
    }
  })

  ipcMain.handle('detect-specific-tool', async (_, toolName: string) => {
    try {
      return await toolDetector.detectTool(toolName as any)
    } catch (error) {
      console.error(`Failed to detect tool ${toolName}:`, error)
      return null
    }
  })

  ipcMain.handle('get-config-paths', async () => {
    try {
      return await toolDetector.getConfigPaths()
    } catch (error) {
      console.error('Failed to get config paths:', error)
      return {}
    }
  })

  ipcMain.handle('check-config-exists', async (_, toolId: string) => {
    try {
      return await toolDetector.checkConfigExists(toolId)
    } catch (error) {
      console.error(`Failed to check config exists for ${toolId}:`, error)
      return false
    }
  })

  // MCP Server Management
  ipcMain.handle('get-vetted-servers', async () => {
    try {
      return await serverManager.getVettedServers()
    } catch (error) {
      console.error('Failed to get vetted servers:', error)
      return []
    }
  })

  ipcMain.handle('install-mcp-server', async (_, serverId: string, config: any) => {
    try {
      return await serverManager.installServer(serverId, config)
    } catch (error) {
      console.error(`Failed to install MCP server ${serverId}:`, error)
      return { success: false, message: 'Installation failed' }
    }
  })

  ipcMain.handle('uninstall-mcp-server', async (_, serverId: string, options?: { removePackage?: boolean }) => {
    try {
      return await serverManager.uninstallServer(serverId, options)
    } catch (error) {
      console.error(`Failed to uninstall MCP server ${serverId}:`, error)
      return { success: false, message: 'Uninstallation failed' }
    }
  })

  ipcMain.handle('verify-server-installation', async (_, serverId: string) => {
    try {
      return await (serverManager as any).verifyServerInstallation(serverId)
    } catch (error) {
      console.error(`Failed to verify server installation for ${serverId}:`, error)
      return {
        packageAvailable: false,
        configurationValid: false,
        serverResponds: false,
        overallStatus: 'failed'
      }
    }
  })

  ipcMain.handle('check-package-installed', async (_, packageName: string) => {
    try {
      return await (serverManager as any).checkNpmPackageInstalled(packageName)
    } catch (error) {
      console.error(`Failed to check package installation for ${packageName}:`, error)
      return false
    }
  })

  ipcMain.handle('enable-server-for-tool', async (_, serverId: string, toolName: string) => {
    try {
      return await serverManager.enableServerForTool(serverId, toolName)
    } catch (error) {
      console.error(`Failed to enable server ${serverId} for tool ${toolName}:`, error)
      return false
    }
  })

  ipcMain.handle('disable-server-for-tool', async (_, serverId: string, toolName: string) => {
    try {
      return await serverManager.disableServerForTool(serverId, toolName)
    } catch (error) {
      console.error(`Failed to disable server ${serverId} for tool ${toolName}:`, error)
      return false
    }
  })

  ipcMain.handle('get-server-configuration', async (_, serverId: string) => {
    try {
      return await serverManager.getServerConfiguration(serverId)
    } catch (error) {
      console.error(`Failed to get server configuration for ${serverId}:`, error)
      return { server: null, status: { installed: false, configuredTools: [], authRequired: false, authConfigured: false } }
    }
  })

  ipcMain.handle('configure-server-auth', async (_, serverId: string, authConfig: Record<string, string>) => {
    try {
      return await serverManager.configureServerAuth(serverId, authConfig)
    } catch (error) {
      console.error(`Failed to configure server auth for ${serverId}:`, error)
      return { success: false, message: 'Authentication configuration failed' }
    }
  })

  // Settings Management
  ipcMain.handle('get-app-settings', async () => {
    return {
      theme: 'light',
      autoUpdate: true,
      notifications: true
    }
  })

  ipcMain.handle('update-app-settings', async (_, settings: any) => {
    console.log('Updating app settings:', settings)
    return { success: true }
  })

  ipcMain.handle('open-config-file', async (_, filePath: string) => {
    try {
      const { shell } = require('electron')
      // Expand ~ and ensure file exists
      const expandedPath = filePath.startsWith('~')
        ? join(homedir(), filePath.replace(/^~\/?/, ''))
        : filePath
      const dir = dirname(expandedPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      if (!existsSync(expandedPath)) {
        writeFileSync(expandedPath, '{}', 'utf8')
      }
      await shell.openPath(expandedPath)
      return { success: true }
    } catch (error) {
      console.error('Failed to open config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('reveal-config-file', async (_, filePath: string) => {
    try {
      const { shell } = require('electron')
      const expandedPath = filePath.startsWith('~')
        ? join(homedir(), filePath.replace(/^~\/?/, ''))
        : filePath
      shell.showItemInFolder(expandedPath)
      return { success: true }
    } catch (error) {
      console.error('Failed to reveal config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Read config file contents (as text)
  ipcMain.handle('read-config-file', async (_, filePath: string) => {
    try {
      const expandedPath = filePath.startsWith('~')
        ? join(homedir(), filePath.replace(/^~\/?/, ''))
        : filePath
      if (!existsSync(expandedPath)) {
        return { success: true, content: '', path: expandedPath }
      }
      const content = readFileSync(expandedPath, 'utf8')
      return { success: true, content, path: expandedPath }
    } catch (error) {
      console.error('Failed to read config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Write config file contents (raw text)
  ipcMain.handle('write-config-file', async (_, filePath: string, content: string) => {
    try {
      const expandedPath = filePath.startsWith('~')
        ? join(homedir(), filePath.replace(/^~\/?/, ''))
        : filePath
      const dir = dirname(expandedPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(expandedPath, content ?? '', 'utf8')
      return { success: true, path: expandedPath }
    } catch (error) {
      console.error('Failed to write config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Write the same content to multiple config files
  ipcMain.handle('write-config-files', async (_, filePaths: string[], content: string) => {
    try {
      const results: { path: string; success: boolean; message?: string }[] = []
      for (const filePath of filePaths) {
        const expandedPath = filePath.startsWith('~')
          ? join(homedir(), filePath.replace(/^~\/?/, ''))
          : filePath
        try {
          const dir = dirname(expandedPath)
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
          }
          writeFileSync(expandedPath, content ?? '', 'utf8')
          results.push({ path: expandedPath, success: true })
        } catch (err) {
          results.push({ path: expandedPath, success: false, message: err instanceof Error ? err.message : 'Unknown error' })
        }
      }
      return { success: true, results }
    } catch (error) {
      console.error('Failed to write multiple config files:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}