import React, { useState } from 'react'
import { Layout } from './Layout'
import { Dashboard } from './Dashboard'
import { Marketplace } from './Marketplace'
import { Settings } from './Settings'
import { ThemeProvider } from './ThemeProvider'

type ViewType = 'dashboard' | 'marketplace' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'marketplace':
        return <Marketplace />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <ThemeProvider>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderCurrentView()}
      </Layout>
    </ThemeProvider>
  )
}