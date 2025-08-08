import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupIpcHandlers } from './ipc-handlers'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  
  // Setup IPC handlers for MCP Manager functionality
  setupIpcHandlers()
  
  await makeAppSetup(MainWindow)
})
