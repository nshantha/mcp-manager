import type React from 'react'
import { Button } from './ui/button'
import {
  Home,
  Server,
  Settings as SettingsIcon,
  Activity,
  CheckCircle,
  Store,
  Wrench,
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  currentView:
    | 'dashboard'
    | 'servers'
    | 'marketplace'
    | 'tools'
    | 'activity'
    | 'settings'
  onViewChange: (
    view:
      | 'dashboard'
      | 'servers'
      | 'marketplace'
      | 'tools'
      | 'activity'
      | 'settings'
  ) => void
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const activeClasses = 'bg-secondary text-foreground hover:bg-secondary'
  const inactiveClasses =
    'text-muted-foreground hover:bg-muted hover:text-foreground'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                MCP Manager
              </h2>
              <p className="text-xs text-muted-foreground">
                Universal Server Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Manage Section */}
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Manage
          </h3>
          <nav className="space-y-1">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'dashboard' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('dashboard')}
            >
              <Home className="mr-3 h-4 w-4" />
              Home
            </Button>

            <Button
              variant={currentView === 'servers' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'servers' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('servers')}
            >
              <Server className="mr-3 h-4 w-4" />
              Servers
            </Button>

            <Button
              variant={currentView === 'marketplace' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'marketplace' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('marketplace')}
            >
              <Store className="mr-3 h-4 w-4" />
              Marketplace
            </Button>

            <Button
              variant={currentView === 'tools' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'tools' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('tools')}
            >
              <Wrench className="mr-3 h-4 w-4" />
              Tools
            </Button>
          </nav>
        </div>

        {/* Navigation - Observe Section */}
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Observe
          </h3>
          <nav className="space-y-1">
            <Button
              variant={currentView === 'activity' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'activity' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('activity')}
            >
              <Activity className="mr-3 h-4 w-4" />
              Activity
            </Button>
          </nav>
        </div>

        {/* Navigation - Settings Section */}
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Configure
          </h3>
          <nav className="space-y-1">
            <Button
              variant={currentView === 'settings' ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 ${currentView === 'settings' ? activeClasses : inactiveClasses}`}
              onClick={() => onViewChange('settings')}
            >
              <SettingsIcon className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Security Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-500 font-medium">Active</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Version 1.0.0
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Status Bar */}
        <div className="h-8 bg-muted/50 border-b border-border px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">All systems normal</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">3 servers</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Last verified 6m ago</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">Healthy</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-background">{children}</div>
      </div>
    </div>
  )
}
