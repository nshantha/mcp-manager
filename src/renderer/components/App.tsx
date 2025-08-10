import { useState, useEffect } from 'react'
import { Layout } from './Layout'
import { Dashboard } from './Dashboard'
import { Marketplace } from './Marketplace'
import { Settings } from './Settings'
import { Servers } from './Servers'
import { Tools } from './Tools'
import { Activity } from './Activity'
import { ThemeProvider } from './ThemeProvider'
import { ErrorBoundary } from './ErrorBoundary'
import { useAppState } from '../lib/serverState'

type ViewType =
  | 'dashboard'
  | 'servers'
  | 'marketplace'
  | 'tools'
  | 'activity'
  | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const { startPeriodicHealthCheck, stopPeriodicHealthCheck } = useAppState()

  // Initialize periodic health monitoring
  useEffect(() => {
    // Start health check every 5 minutes
    startPeriodicHealthCheck(5)

    // Cleanup on unmount
    return () => {
      stopPeriodicHealthCheck()
    }
  }, [startPeriodicHealthCheck, stopPeriodicHealthCheck])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <Dashboard onViewChange={setCurrentView} />
          </ErrorBoundary>
        )
      case 'servers':
        return (
          <ErrorBoundary>
            <Servers />
          </ErrorBoundary>
        )
      case 'marketplace':
        return (
          <ErrorBoundary>
            <Marketplace />
          </ErrorBoundary>
        )
      case 'tools':
        return (
          <ErrorBoundary>
            <Tools />
          </ErrorBoundary>
        )
      case 'activity':
        return (
          <ErrorBoundary>
            <Activity />
          </ErrorBoundary>
        )
      case 'settings':
        return (
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary>
            <Dashboard onViewChange={setCurrentView} />
          </ErrorBoundary>
        )
    }
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Layout currentView={currentView} onViewChange={setCurrentView}>
          {renderCurrentView()}
        </Layout>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
