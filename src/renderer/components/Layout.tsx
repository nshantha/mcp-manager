import React from 'react'
import { Button } from './ui/button'
import { Home, Store, Settings } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  currentView: 'dashboard' | 'marketplace' | 'settings'
  onViewChange: (view: 'dashboard' | 'marketplace' | 'settings') => void
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const activeClasses = 'bg-secondary text-foreground hover:bg-secondary'
  const inactiveClasses = 'text-muted-foreground hover:bg-muted hover:text-foreground'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">MCP Manager</h2>
              <p className="text-xs text-muted-foreground">Universal Server Management</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${currentView === 'dashboard' ? activeClasses : inactiveClasses}`}
            onClick={() => onViewChange('dashboard')}
          >
            <Home className="mr-3 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'marketplace' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${currentView === 'marketplace' ? activeClasses : inactiveClasses}`}
            onClick={() => onViewChange('marketplace')}
          >
            <Store className="mr-3 h-4 w-4" />
            Marketplace
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${currentView === 'settings' ? activeClasses : inactiveClasses}`}
            onClick={() => onViewChange('settings')}
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Security Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-500 font-medium">Active</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Version 1.0.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  )
}