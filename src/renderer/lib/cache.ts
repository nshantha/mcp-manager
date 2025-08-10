import type { AITool, MCPServer } from '../../shared/types'
import { useState, useEffect, useCallback } from 'react'

type DashboardCache = {
  aiTools: AITool[]
  mcpServers: MCPServer[]
  timestamp: number
}

let dashboardCache: DashboardCache | null = null

export function getDashboardCache(maxAgeMs = 30_000): DashboardCache | null {
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

export function useCachedData<T>(
  key: string,
  initialData: T,
  maxAgeMs: number = 5 * 60 * 1000
): { data: T; refresh: () => void } {
  const [data, setData] = useState<T>(initialData)

  const refresh = useCallback(async () => {
    try {
      // For now, return the initial data
      // In a real implementation, this would fetch fresh data
      setData(initialData)
    } catch (error) {
      console.error(`Failed to refresh ${key}:`, error)
    }
  }, [key, initialData])

  useEffect(() => {
    // Set initial data
    setData(initialData)
  }, [initialData])

  return { data, refresh }
}
