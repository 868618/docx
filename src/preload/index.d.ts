import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFile: <T>() => Promise<T>

      // createDocx: <T>(data: T) => Promise<string>
      createDocx: (data: Record<string, unknown>) => Promise<string>
    }
  }
}
