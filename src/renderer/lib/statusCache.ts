type VerificationStatus = {
  packageAvailable: boolean
  configurationValid: boolean
  serverResponds: boolean
  overallStatus: 'working' | 'partial' | 'failed'
}

type CacheEntry = {
  data: VerificationStatus
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}

export function getServerVerification(serverId: string, maxAgeMs: number = 5 * 60 * 1000): VerificationStatus | null {
  const entry = cache[serverId]
  if (!entry) return null
  if (Date.now() - entry.timestamp > maxAgeMs) return null
  return entry.data
}

export function setServerVerification(serverId: string, data: VerificationStatus): void {
  cache[serverId] = { data, timestamp: Date.now() }
}

export function clearServerVerification(serverId: string): void {
  delete cache[serverId]
}

export function clearAllVerifications(): void {
  for (const k of Object.keys(cache)) delete cache[k]
}


