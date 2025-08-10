/**
 * Centralized configuration paths for all AI tools
 * This ensures consistency across the entire application
 */

export const AI_TOOL_CONFIG_PATHS = {
  'claude-desktop':
    '~/Library/Application Support/Claude/claude_desktop_config.json',
  'claude-code': '~/.claude/config.json',
  vscode: '~/Library/Application Support/Code/User/settings.json',
  cursor: '~/Library/Application Support/Cursor/User/settings.json',
} as const

export const AI_TOOL_DISPLAY_NAMES = {
  'claude-desktop': 'Claude Desktop',
  'claude-code': 'Claude Code',
  vscode: 'VS Code',
  cursor: 'Cursor',
} as const

export const AI_TOOL_DESCRIPTIONS = {
  'claude-desktop': "Anthropic's Claude AI assistant desktop app",
  'claude-code': "Anthropic's Claude AI CLI tool for developers",
  vscode: "Microsoft's code editor with AI extensions",
  cursor: 'AI-first code editor',
} as const

export type AIToolId = keyof typeof AI_TOOL_CONFIG_PATHS
