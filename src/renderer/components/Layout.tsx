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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">MCP Manager</h2>
              <p className="text-xs text-gray-500">Universal Server Management</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${
              currentView === 'dashboard' 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('dashboard')}
          >
            <Home className="mr-3 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'marketplace' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${
              currentView === 'marketplace' 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('marketplace')}
          >
            <Store className="mr-3 h-4 w-4" />
            Marketplace
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            className={`w-full justify-start h-11 ${
              currentView === 'settings' 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('settings')}
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Security Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Version 1.0.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  )
}