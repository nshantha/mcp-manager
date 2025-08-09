import ReactDom from 'react-dom/client'
import React from 'react'

import { AppRoutes } from './routes'

import './globals.css'

ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
