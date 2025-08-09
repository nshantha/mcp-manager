import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    App: typeof API
    electronAPI: typeof electronAPI
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
}

const electronAPI = {
  // AI Tool Detection
  detectAITools: () => ipcRenderer.invoke('detect-ai-tools'),
  detectSpecificTool: (toolName: string) => ipcRenderer.invoke('detect-specific-tool', toolName),
  getConfigPaths: () => ipcRenderer.invoke('get-config-paths'),
  checkConfigExists: (toolId: string) => ipcRenderer.invoke('check-config-exists', toolId),
  
  // MCP Server Management
  getVettedServers: () => ipcRenderer.invoke('get-vetted-servers'),
  installMCPServer: (serverId: string, config: any) => ipcRenderer.invoke('install-mcp-server', serverId, config),
  uninstallMCPServer: (serverId: string) => ipcRenderer.invoke('uninstall-mcp-server', serverId),
  enableServerForTool: (serverId: string, toolName: string) => ipcRenderer.invoke('enable-server-for-tool', serverId, toolName),
  disableServerForTool: (serverId: string, toolName: string) => ipcRenderer.invoke('disable-server-for-tool', serverId, toolName),
  getServerConfiguration: (serverId: string) => ipcRenderer.invoke('get-server-configuration', serverId),
  configureServerAuth: (serverId: string, authConfig: Record<string, string>) => ipcRenderer.invoke('configure-server-auth', serverId, authConfig),
  
  // Settings
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  updateAppSettings: (settings: any) => ipcRenderer.invoke('update-app-settings', settings),

  // File Operations
  openConfigFile: (filePath: string) => ipcRenderer.invoke('open-config-file', filePath),
  revealConfigFile: (filePath: string) => ipcRenderer.invoke('reveal-config-file', filePath)
}

contextBridge.exposeInMainWorld('App', API)
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
