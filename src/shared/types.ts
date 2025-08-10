import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: string
  query?: Record<string, string>
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export type ViewType = 'main' | 'dashboard' | 'marketplace' | 'settings'

export interface AITool {
  id: string
  name: string
  type: string
  status: 'detected' | 'not_detected' | 'error'
}

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
