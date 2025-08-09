import { ipcMain } from 'electron'
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

  ipcMain.handle('uninstall-mcp-server', async (_, serverId: string) => {
    try {
      return await serverManager.uninstallServer(serverId)
    } catch (error) {
      console.error(`Failed to uninstall MCP server ${serverId}:`, error)
      return { success: false, message: 'Uninstallation failed' }
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
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('Failed to open config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('reveal-config-file', async (_, filePath: string) => {
    try {
      const { shell } = require('electron')
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      console.error('Failed to reveal config file:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}