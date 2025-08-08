# Universal MCP Manager - MVP Plan

## Core Value Proposition
**"Install trusted MCP servers once, use everywhere safely."**

## MVP Scope (Phase 1)

### 🎯 Primary Goals
1. **AI Tool Detection** - Detect Claude Code, VS Code, Cursor installations
2. **Basic MCP Server Management** - Install/uninstall vetted company servers
3. **Simple Configuration Sync** - Basic config file management across detected tools
4. **Security Foundation** - Secure IPC, OAuth setup, credential storage

### ✅ MVP Features

#### 1. Dashboard (Main Screen)
- **Tool Status Cards**: Show detected AI tools (Claude Code, VS Code, Cursor)
- **Server Health Panel**: Display installed MCP servers and their status
- **Quick Actions**: Install/uninstall popular servers

#### 2. Marketplace (Vetted Servers Only)
- **Curated Server List**: GitHub, Notion, Slack, Linear servers only
- **Server Cards**: Name, description, installation status
- **One-Click Install**: Install server with default config

#### 3. Basic Configuration
- **Server List**: Show installed servers
- **Toggle Enable/Disable**: Turn servers on/off per tool
- **Basic OAuth Setup**: For servers requiring authentication

#### 4. Minimal Settings
- **App Preferences**: Theme, notifications
- **Security Settings**: Basic OAuth token management

### 🏗️ Technical MVP Implementation

#### Backend Services (Main Process)
```
src/main/services/
├── ai-tool-detector.ts     # Detect installed AI tools
├── mcp-server-manager.ts   # Install/uninstall MCP servers  
├── config-sync.ts          # Sync configs across tools
└── oauth-basic.ts          # Basic OAuth flow
```

#### Frontend Components (Renderer)
```
src/renderer/components/
├── Dashboard/
│   ├── Dashboard.tsx           # Main dashboard
│   ├── ToolStatusCard.tsx      # AI tool status
│   └── ServerHealthPanel.tsx   # MCP server status
├── Marketplace/
│   ├── Marketplace.tsx         # Server marketplace
│   └── ServerCard.tsx          # Individual server card
└── Settings/
    └── Settings.tsx            # Basic app settings
```

#### Data Models
```typescript
interface AITool {
  name: 'claude-code' | 'vscode' | 'cursor';
  detected: boolean;
  configPath: string;
  version?: string;
}

interface MCPServer {
  id: string;
  name: string;
  company: 'github' | 'notion' | 'slack' | 'linear';
  description: string;
  installed: boolean;
  enabledTools: AITool['name'][];
  requiresAuth: boolean;
}
```

### 🚫 MVP Exclusions (Future Phases)
- **Community Servers** - Only vetted company servers
- **Advanced Security Scanning** - Basic vetting only
- **Custom Server Configuration** - Default configs only
- **Backup/Restore** - Manual config management only
- **Health Monitoring** - Basic status checks only
- **Auto-Updates** - Manual updates only

### 📋 MVP Implementation Steps

#### Phase 1.1: Core Infrastructure
1. Set up secure Electron app with React + TypeScript
2. Implement IPC communication between main/renderer
3. Create basic window management and security setup

#### Phase 1.2: AI Tool Detection
1. Implement file system scanning for Claude Code, VS Code, Cursor
2. Parse configuration files to understand current MCP setup
3. Display detected tools in dashboard

#### Phase 1.3: MCP Server Management
1. Create hardcoded list of vetted servers (GitHub, Notion, Slack, Linear)
2. Implement basic install/uninstall functionality
3. Basic configuration file writing

#### Phase 1.4: Basic UI
1. Dashboard with tool status and server health
2. Marketplace with server cards
3. Basic settings page

#### Phase 1.5: Configuration Sync
1. Write MCP server configs to detected AI tools
2. Basic enable/disable per tool
3. Simple OAuth token storage (OS keychain)

### 🎯 Success Metrics
- [ ] Detects at least one AI tool (Claude Code/VS Code/Cursor)
- [ ] Successfully installs one MCP server (e.g., GitHub server)
- [ ] Server appears and works in detected AI tool
- [ ] Can enable/disable server per tool
- [ ] Basic OAuth flow works for one provider

### 🔄 Future Phases
- **Phase 2**: Advanced security scanning, custom configurations
- **Phase 3**: Community server marketplace with vetting
- **Phase 4**: Health monitoring, backup/restore, auto-updates
- **Phase 5**: Enterprise features, team management

## Development Timeline
- **Week 1**: Core infrastructure and tool detection
- **Week 2**: MCP server management and basic UI
- **Week 3**: Configuration sync and OAuth setup
- **Week 4**: Testing, polish, and MVP release

This MVP focuses on the core value proposition while keeping scope manageable and building a solid foundation for future features.