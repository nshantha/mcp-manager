import { Route } from 'react-router-dom'

import { Router } from 'lib/electron-router-dom'

import { App } from './components/App'

export function AppRoutes() {
  return <Router main={<Route path="/" element={<App />} />} />
}
