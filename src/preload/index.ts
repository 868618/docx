import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  async selectFile() {
    const [file] = await ipcRenderer.invoke('showOpenDialogSync', { properties: ['openFile'] })

    const res = await ipcRenderer.invoke('parseFile', file)

    return res
  },

  async createDocx(data: unknown[]) {
    // const [file] = await ipcRenderer.invoke('showOpenDialogSync', {
    //   properties: ['openFile'],
    //   filters: [{ name: 'docx', extensions: ['docx'] }]
    // })

    // return file
    return await ipcRenderer.invoke('createDocx', { data })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
