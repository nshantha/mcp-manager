# Universal MCP Manager - Technical Design & Architecture

## Overview

Universal MCP Manager is an Electron desktop application that provides enterprise-grade management for Model Context Protocol (MCP) servers. The app uses a simple, secure architecture focused on the core value proposition: safe MCP server vetting and universal configuration across AI development tools.

## Core Value Proposition

**"Install trusted MCP servers once, use everywhere safely."**

- **Vetted Company Servers Only:** GitHub, Notion, Atlassian, Slack, Linear (no community servers)
- **Security-First Vetting:** Malicious code detection before marketplace inclusion
- **Universal Configuration:** One setup works across Claude Code, VS Code, Cursor
- **Enterprise Security:** OAuth + OS keychain for credential management

## Electron Process Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN PROCESS (Node.js)                      │
│  ├── App Lifecycle Management                                  │
│  ├── Window Management                                         │
│  ├── IPC Message Routing                                       │
│  ├── Backend Services                                          │
│  │   ├── AI Tool Detection Service                            │
│  │   ├── MCP Server Vetting Service                          │
│  │   ├── Configuration Management Service                     │
│  │   ├── OAuth & Security Service                            │
│  │   └── Health Monitoring Service                           │
│  ├── Database (SQLite)                                        │
│  ├── File System Operations                                   │
│  └── OS Integration (Keychain, Notifications)                 │
└─────────────────────────────────────────────────────────────────┘
                              │ IPC Communication
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RENDERER PROCESS (Chromium)                   │
│  ├── React Application                                         │
│  │   ├── Dashboard Component                                  │
│  │   ├── Marketplace Component                               │
│  │   ├── Configuration Component                             │
│  │   └── Settings Component                                  │
│  ├── State Management (Context/Redux)                         │
│  ├── IPC Client (communication with main process)             │
│  └── UI Libraries (Ant Design, React Router)                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure for Electron App

```
src/
├── main/                         # Main process (Node.js)
│   ├── main.ts                   # Electron main entry point
│   ├── window-manager.ts         # Window creation and management
│   ├── ipc-handlers.ts          # IPC message handlers
│   ├── menu.ts                  # Application menu
│   ├── auto-updater.ts          # App updates handling
│   ├── services/                # Backend services
│   │   ├── ai-tool-detector.ts
│   │   ├── mcp-vetting.ts
│   │   ├── config-manager.ts
│   │   ├── oauth-service.ts
│   │   ├── health-monitor.ts
│   │   └── notification-service.ts
│   ├── database/
│   │   ├── database.ts          # SQLite setup and migrations
│   │   ├── models/
│   │   └── migrations/
│   └── utils/
│       ├── file-operations.ts
│       ├── process-manager.ts
│       └── security-utils.ts
├── renderer/                    # Renderer process (React)
│   ├── index.html              # HTML entry point
│   ├── index.tsx               # React entry point
│   ├── App.tsx                 # Main App component
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ToolStatusCard.tsx
│   │   │   └── ServerHealthPanel.tsx
│   │   ├── Marketplace/
│   │   │   ├── Marketplace.tsx
│   │   │   ├── ServerCard.tsx
│   │   │   └── InstallationModal.tsx
│   │   ├── Configuration/
│   │   │   ├── Configuration.tsx
│   │   │   ├── ServerConfigForm.tsx
│   │   │   └── OAuthSetup.tsx
│   │   ├── Settings/
│   │   │   ├── Settings.tsx
│   │   │   ├── SecuritySettings.tsx
│   │   │   └── UpdateSettings.tsx
│   │   └── common/
│   │       ├── Layout.tsx
│   │       ├── Header.tsx
│   │       └── StatusIndicator.tsx
│   ├── hooks/
│   │   ├── useIPC.ts           # IPC communication hooks
│   │   ├── useToolDetection.ts
│   │   └── useServerStatus.ts
│   ├── services/
│   │   ├── ipc-client.ts       # IPC wrapper service
│   │   └── api-types.ts        # Type definitions for API
│   ├── context/
│   │   ├── AppContext.tsx
│   │   └── SettingsContext.tsx
│   └── styles/
│       ├── globals.css
│       └── components/
├── shared/                      # Shared between main and renderer
│   ├── types/
│   │   ├── ai-tools.ts
│   │   ├── mcp-servers.ts
│   │   ├── configurations.ts
│   │   └── ipc-messages.ts
│   ├── constants/
│   │   ├── app-constants.ts
│   │   └── api-endpoints.ts
│   └── utils/
│       ├── validation.ts
│       └── formatters.ts
├── assets/                      # Static assets
│   ├── icons/
│   │   ├── app-icon.icns       # macOS
│   │   ├── app-icon.ico        # Windows
│   │   └── app-icon.png        # Linux
│   ├── images/
│   └── sounds/
└── build/                      # Build configuration
    ├── webpack.main.config.js
    ├── webpack.renderer.config.js
    ├── electron-builder.yml
    └── notarization.js
```

## Main Process Implementation

### Main Entry Point

```typescript
// src/main/main.ts
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { WindowManager } from './window-manager';
import { DatabaseManager } from './database/database';
import { setupIpcHandlers } from './ipc-handlers';
import { createApplicationMenu } from './menu';
import { AutoUpdater } from './auto-updater';
import { SecurityService } from './services/security-service';

class UniversalMCPApp {
  private windowManager: WindowManager;
  private databaseManager: DatabaseManager;
  private autoUpdater: AutoUpdater;
  private securityService: SecurityService;

  constructor() {
    this.windowManager = new WindowManager();
    this.databaseManager = new DatabaseManager();
    this.autoUpdater = new AutoUpdater();
    this.securityService = new SecurityService();
  }

  async initialize(): Promise<void> {
    // Initialize database
    await this.databaseManager.initialize();
    
    // Setup security
    await this.securityService.initialize();
    
    // Setup IPC handlers
    setupIpcHandlers();
    
    // Create application menu
    const menu = createApplicationMenu();
    Menu.setApplicationMenu(menu);
    
    // Create main window
    await this.windowManager.createMainWindow();
    
    // Setup auto-updater (production only)
    if (app.isPackaged) {
      this.autoUpdater.setup();
    }
  }

  setupEventHandlers(): void {
    app.whenReady().then(() => this.initialize());
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.windowManager.createMainWindow();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });
  }
}

const mcpApp = new UniversalMCPApp();
mcpApp.setupEventHandlers();
```

### Window Manager

```typescript
// src/main/window-manager.ts
import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.mainWindow = new BrowserWindow({
      width: Math.min(1200, width * 0.8),
      height: Math.min(800, height * 0.8),
      minWidth: 900,
      minHeight: 600,
      show: false, // Show after ready-to-show
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        nodeIntegration: false, // Security: disable node integration
        contextIsolation: true, // Security: enable context isolation
        enableRemoteModule: false, // Security: disable remote module
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      icon: this.getAppIcon()
    });

    // Load the React app
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Focus window on first launch
      if (process.platform === 'darwin') {
        this.mainWindow?.moveTop();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private getAppIcon(): string {
    switch (process.platform) {
      case 'darwin':
        return path.join(__dirname, '../assets/icons/app-icon.icns');
      case 'win32':
        return path.join(__dirname, '../assets/icons/app-icon.ico');
      default:
        return path.join(__dirname, '../assets/icons/app-icon.png');
    }
  }
}
```

### IPC Communication Setup

```typescript
// src/main/ipc-handlers.ts
import { ipcMain } from 'electron';
import { AIToolDetectionService } from './services/ai-tool-detector';
import { MCPVettingService } from './services/mcp-vetting';
import { ConfigurationManager } from './services/config-manager';
import { OAuthService } from './services/oauth-service';

export function setupIpcHandlers(): void {
  const toolDetector = new AIToolDetectionService();
  const vettingService = new MCPVettingService();
  const configManager = new ConfigurationManager();
  const oauthService = new OAuthService();

  // AI Tool Detection
  ipcMain.handle('detect-ai-tools', async () => {
    return await toolDetector.detectAllTools();
  });

  ipcMain.handle('detect-specific-tool', async (_, toolName: string) => {
    return await toolDetector.detectTool(toolName);
  });

  // MCP Server Management
  ipcMain.handle('get-vetted-servers', async () => {
    return await vettingService.getVettedServers();
  });

  ipcMain.handle('install-mcp-server', async (_, serverId: string, config: any) => {
    return await configManager.installServer(serverId, config);
  });

  ipcMain.handle('uninstall-mcp-server', async (_, serverId: string) => {
    return await configManager.uninstallServer(serverId);
  });

  // Configuration Management
  ipcMain.handle('sync-configurations', async (_, servers: any[]) => {
    return await configManager.syncAllTools(servers);
  });

  ipcMain.handle('backup-configurations', async () => {
    return await configManager.createBackup();
  });

  ipcMain.handle('restore-configuration', async (_, backupId: string) => {
    return await configManager.restoreBackup(backupId);
  });

  // OAuth Authentication
  ipcMain.handle('start-oauth-flow', async (_, provider: string, scopes: string[]) => {
    return await oauthService.startAuthFlow(provider, scopes);
  });

  ipcMain.handle('get-stored-credentials', async (_, provider: string) => {
    return await oauthService.getStoredCredentials(provider);
  });

  // Settings
  ipcMain.handle('get-app-settings', async () => {
    return await configManager.getAppSettings();
  });

  ipcMain.handle('update-app-settings', async (_, settings: any) => {
    return await configManager.updateAppSettings(settings);
  });
}
```

### Preload Script (Security Bridge)

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // AI Tool Detection
  detectAITools: () => ipcRenderer.invoke('detect-ai-tools'),
  detectSpecificTool: (toolName: string) => ipcRenderer.invoke('detect-specific-tool', toolName),
  
  // MCP Server Management
  getVettedServers: () => ipcRenderer.invoke('get-vetted-servers'),
  installMCPServer: (serverId: string, config: any) => 
    ipcRenderer.invoke('install-mcp-server', serverId, config),
  uninstallMCPServer: (serverId: string) => 
    ipcRenderer.invoke('uninstall-mcp-server', serverId),
  
  // Configuration Management
  syncConfigurations: (servers: any[]) => 
    ipcRenderer.invoke('sync-configurations', servers),
  backupConfigurations: () => ipcRenderer.invoke('backup-configurations'),
  restoreConfiguration: (backupId: string) => 
    ipcRenderer.invoke('restore-configuration', backupId),
  
  // OAuth Authentication
  startOAuthFlow: (provider: string, scopes: string[]) => 
    ipcRenderer.invoke('start-oauth-flow', provider, scopes),
  getStoredCredentials: (provider: string) => 
    ipcRenderer.invoke('get-stored-credentials', provider),
  
  // Settings
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  updateAppSettings: (settings: any) => ipcRenderer.invoke('update-app-settings', settings),
  
  // Event listeners for real-time updates
  onToolStatusChange: (callback: (data: any) => void) => {
    ipcRenderer.on('tool-status-changed', (_, data) => callback(data));
  },
  
  onServerHealthUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('server-health-updated', (_, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      detectAITools: () => Promise<any>;
      detectSpecificTool: (toolName: string) => Promise<any>;
      getVettedServers: () => Promise<any>;
      installMCPServer: (serverId: string, config: any) => Promise<any>;
      uninstallMCPServer: (serverId: string) => Promise<any>;
      syncConfigurations: (servers: any[]) => Promise<any>;
      backupConfigurations: () => Promise<any>;
      restoreConfiguration: (backupId: string) => Promise<any>;
      startOAuthFlow: (provider: string, scopes: string[]) => Promise<any>;
      getStoredCredentials: (provider: string) => Promise<any>;
      getAppSettings: () => Promise<any>;
      updateAppSettings: (settings: any) => Promise<any>;
      onToolStatusChange: (callback: (data: any) => void) => void;
      onServerHealthUpdate: (callback: (data: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
```

## Renderer Process Implementation

### React App Entry Point

```typescript
// src/renderer/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AppContextProvider } from './context/AppContext';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Marketplace } from './components/Marketplace/Marketplace';
import { Configuration } from './components/Configuration/Configuration';
import { Settings } from './components/Settings/Settings';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AppContextProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </AppContextProvider>
    </ConfigProvider>
  );
};

export default App;
```

### IPC Communication Hook

```typescript
// src/renderer/hooks/useIPC.ts
import { useCallback, useEffect, useState } from 'react';

export function useIPC() {
  const [isConnected, setIsConnected] = useState(true);

  // Check if electron API is available
  useEffect(() => {
    setIsConnected(!!window.electronAPI);
  }, []);

  const invoke = useCallback(async (channel: string, ...args: any[]) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    return await (window.electronAPI as any)[channel](...args);
  }, []);

  return {
    isConnected,
    invoke,
    detectAITools: () => window.electronAPI?.detectAITools(),
    getVettedServers: () => window.electronAPI?.getVettedServers(),
    installMCPServer: (serverId: string, config: any) => 
      window.electronAPI?.installMCPServer(serverId, config),
    // ... other methods
  };
}
```

## Build Configuration

### Electron Builder Configuration

```yaml
# build/electron-builder.yml
appId: com.universalmcp.manager
productName: Universal MCP Manager
directories:
  buildResources: build/resources
  output: dist
files:
  - "!**/.vscode/*"
  - "!src/*"
  - "!electron.vite.config.{js,ts,mjs,cjs}"
  - "!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}"
  - "!{.env,.env.*,.npmrc,pnpm-lock.yaml}"
asarUnpack:
  - resources/**
mac:
  category: public.app-category.developer-tools
  icon: build/icons/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
win:
  icon: build/icons/icon.ico
  target:
    - target: nsis
      arch:
        - x64
linux:
  icon: build/icons/icon.png
  target:
    - target: AppImage
      arch:
        - x64
    - target: deb
      arch:
        - x64
```

### Package.json Scripts

```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "build:win": "tsc && vite build && electron-builder --win",
    "build:mac": "tsc && vite build && electron-builder --mac",
    "build:linux": "tsc && vite build && electron-builder --linux",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:pack": "electron-builder --dir",
    "electron:dist": "electron-builder",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "vite": "^5.0.0",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  }
}
```

This Electron architecture provides:

1. **Secure IPC Communication** - Preload script with context isolation
2. **Native Desktop Experience** - Platform-specific menus, icons, and behaviors  
3. **Auto-Updates** - Built-in update mechanism
4. **Cross-Platform Build** - Windows, macOS, and Linux distributables
5. **Development Tools** - Hot reload and dev tools integration
6. **Security Best Practices** - Disabled node integration, web security enabled

The app will feel native on each platform while maintaining the security and functionality needed for enterprise MCP server management.