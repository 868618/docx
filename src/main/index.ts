import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import fs from 'fs'
import os from 'os'
import lodash from 'lodash'
import { XMLParser } from 'fast-xml-parser'

import { createReport } from 'docx-templates'

const homeDir = os.homedir()
const desktopDir = `${homeDir}/Desktop`

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = await createWindow()

  mainWindow.webContents.openDevTools()

  ipcMain.handle('showOpenDialogSync', (_event, args) =>
    dialog.showOpenDialogSync(mainWindow, {
      title: '选择目录',
      properties: ['openDirectory'],
      ...args
    })
  )

  ipcMain.handle('parseFile', (_event, file) => {
    const parser = new XMLParser()
    const XMLdata = fs.readFileSync(file, 'utf8')

    const items = XMLdata.split('\r\n\r\n')
      .map((item) => {
        try {
          return parser.parse(item)
        } catch (error) {
          return null
        }
      })
      .filter(Boolean)
      .map(({ question, name }) => {
        return {
          ...question,
          name: Array.isArray(name) ? lodash.union(name).toString() : name
        }
      })

    return items
  })

  ipcMain.handle('createDocx', async (_event, option: { data: Record<string, unknown> }) => {
    const template = path.join(__dirname, '../../resources/templates/t.docx')
    const { data } = option

    const buffer = await createReport({
      template: fs.readFileSync(template),
      data,
      cmdDelimiter: ['<<', '>>']
    })

    const formattedDateTime = new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      .replace(/\//g, '-')
      .replace(/\s/g, '_')

    const reportPath = path.join(desktopDir, `${data.title}_${formattedDateTime}.docx`)

    fs.writeFileSync(reportPath, buffer)

    return reportPath
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
