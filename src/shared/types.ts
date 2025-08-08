import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export type ViewType = 'main' | 'dashboard' | 'marketplace' | 'settings'

export interface AITool {
  name: 'claude-code' | 'vscode' | 'cursor'
  displayName: string
  detected: boolean
  configPath?: string
  version?: string
  executable?: string
}

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
