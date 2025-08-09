import type { AITool, MCPServer } from '../../shared/types'

type DashboardCache = {
  aiTools: AITool[]
  mcpServers: MCPServer[]
  timestamp: number
}

let dashboardCache: DashboardCache | null = null

export function getDashboardCache(maxAgeMs: number = 30_000): DashboardCache | null {
  if (!dashboardCache) return null
  const isFresh = Date.now() - dashboardCache.timestamp <= maxAgeMs
  return isFresh ? dashboardCache : dashboardCache // return stale too; caller decides
}

export function setDashboardCache(aiTools: AITool[], mcpServers: MCPServer[]) {
  dashboardCache = { aiTools, mcpServers, timestamp: Date.now() }
}

export function clearDashboardCache() {
  dashboardCache = null
}


