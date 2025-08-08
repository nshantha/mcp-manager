import React from 'react'
import { Button } from './ui/button'
import { Home, Store, Settings } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  currentView: 'dashboard' | 'marketplace' | 'settings'
  onViewChange: (view: 'dashboard' | 'marketplace' | 'settings') => void
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-muted/40 border-r border-border p-4">
        <div className="mb-8">
          <h2 className="text-lg font-semibold">MCP Manager</h2>
          <p className="text-xs text-muted-foreground">Universal MCP Server Management</p>
        </div>
        
        <nav className="space-y-2">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('dashboard')}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'marketplace' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('marketplace')}
          >
            <Store className="mr-2 h-4 w-4" />
            Marketplace
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between mb-1">
              <span>Security:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="text-center">
              <p>v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}