import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import which from 'which'

export interface AITool {
  name: 'claude-code' | 'vscode' | 'cursor'
  displayName: string
  detected: boolean
  configPath?: string
  version?: string
  executable?: string
}

export class AIToolDetector {
  private readonly toolConfigs = {
    'claude-code': {
      displayName: 'Claude Code',
      executable: ['claude'],
      configPaths: [
        join(homedir(), '.config', 'claude', 'claude.json'),
        join(homedir(), '.claude', 'config.json')
      ],
      appPaths: []
    },
    'vscode': {
      displayName: 'Visual Studio Code',
      executable: ['code'],
      configPaths: [
        join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json'), // macOS
        join(homedir(), '.config', 'Code', 'User', 'settings.json'), // Linux
        join(homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json') // Windows
      ],
      appPaths: [
        '/Applications/Visual Studio Code.app', // macOS
        '/usr/share/code', // Linux
        join(homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code') // Windows
      ]
    },
    'cursor': {
      displayName: 'Cursor',
      executable: ['cursor'],
      configPaths: [
        join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json'), // macOS
        join(homedir(), '.config', 'Cursor', 'User', 'settings.json'), // Linux
        join(homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json') // Windows
      ],
      appPaths: [
        '/Applications/Cursor.app', // macOS
        '/usr/share/cursor', // Linux
        join(homedir(), 'AppData', 'Local', 'Programs', 'Cursor') // Windows
      ]
    }
  }

  async detectAllTools(): Promise<AITool[]> {
    const tools: AITool[] = []

    for (const [toolName, config] of Object.entries(this.toolConfigs)) {
      const tool = await this.detectTool(toolName as AITool['name'])
      tools.push(tool)
    }

    return tools
  }

  async detectTool(toolName: AITool['name']): Promise<AITool> {
    const config = this.toolConfigs[toolName]
    const tool: AITool = {
      name: toolName,
      displayName: config.displayName,
      detected: false
    }

    try {
      // Check if executable exists in PATH
      const executable = await this.findExecutable(config.executable)
      if (executable) {
        tool.detected = true
        tool.executable = executable
        tool.version = await this.getVersion(executable, toolName)
      }

      // Check for application installations (even if executable not in PATH)
      if (!tool.detected) {
        const appPath = this.findAppPath(config.appPaths)
        if (appPath) {
          tool.detected = true
          tool.executable = appPath
        }
      }

      // Check for config files
      const configPath = this.findConfigPath(config.configPaths)
      if (configPath) {
        tool.configPath = configPath
        // If we found config but no executable, still mark as detected
        if (!tool.detected) {
          tool.detected = true
        }
      }

    } catch (error) {
      console.warn(`Error detecting ${toolName}:`, error)
    }

    return tool
  }

  private async findExecutable(executableNames: string[]): Promise<string | null> {
    for (const executableName of executableNames) {
      try {
        return await which(executableName)
      } catch {
        // Continue to next executable name
      }
    }
    return null
  }

  private findAppPath(appPaths: string[]): string | null {
    for (const path of appPaths) {
      if (existsSync(path)) {
        return path
      }
    }
    return null
  }

  private findConfigPath(configPaths: string[]): string | null {
    for (const path of configPaths) {
      if (existsSync(path)) {
        return path
      }
    }
    return null
  }

  private async getVersion(executable: string, toolName: AITool['name']): Promise<string | undefined> {
    try {
      let versionCommand: string

      switch (toolName) {
        case 'claude-code':
          versionCommand = `"${executable}" --version`
          break
        case 'vscode':
          versionCommand = `"${executable}" --version`
          break
        case 'cursor':
          versionCommand = `"${executable}" --version`
          break
        default:
          return undefined
      }

      const output = execSync(versionCommand, { 
        encoding: 'utf8', 
        timeout: 5000,
        stdio: 'pipe'
      })
      
      return output.trim().split('\n')[0]
    } catch {
      return undefined
    }
  }

  async getConfigPaths(): Promise<Record<string, string>> {
    const paths: Record<string, string> = {}
    
    for (const [toolName, config] of Object.entries(this.toolConfigs)) {
      const configPath = this.findConfigPath(config.configPaths)
      if (configPath) {
        paths[toolName] = configPath
      }
    }

    return paths
  }

  async checkConfigExists(toolId: string): Promise<boolean> {
    const config = this.toolConfigs[toolId as AITool['name']]
    if (!config) return false
    
    return this.findConfigPath(config.configPaths) !== null
  }
}