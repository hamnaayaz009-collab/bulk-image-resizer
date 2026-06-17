// Google Drive Picker + Upload helper (client-side only)

declare global {
  interface Window {
    gapi: any
    google: any
    onGapiLoad: () => void
    onGisLoad: () => void
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'

let tokenClient: any = null
let accessToken: string | null = null
let gapiReady = false
let gisReady = false

export function getAccessToken() {
  return accessToken
}

export async function loadGoogleApis(clientId: string, apiKey: string): Promise<void> {
  await Promise.all([loadGapi(apiKey), loadGis(clientId)])
}

function loadGapi(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (gapiReady) return resolve()
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('client:picker', async () => {
        await window.gapi.client.init({})
        await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
        gapiReady = true
        resolve()
      })
    }
    document.head.appendChild(script)
  })
}

function loadGis(clientId: string): Promise<void> {
  return new Promise((resolve) => {
    if (gisReady) return resolve()
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: () => {},
      })
      gisReady = true
      resolve()
    }
    document.head.appendChild(script)
  })
}

export async function ensureToken(): Promise<string> {
  if (accessToken) return accessToken
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp: any) => {
      if (resp.error) return reject(resp.error)
      accessToken = resp.access_token
      resolve(accessToken!)
    }
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  isFolder?: boolean
}

export async function openDrivePicker(apiKey: string): Promise<DriveFile[]> {
  const token = await ensureToken()
  return new Promise((resolve) => {
    // All files view with folder navigation enabled
    const allFilesView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
    // Folder-only view as a second tab
    const folderView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes('application/vnd.google-apps.folder')

    const picker = new window.google.picker.PickerBuilder()
      .addView(allFilesView)
      .addView(folderView)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const files: DriveFile[] = data.docs.map((d: any) => ({
            id: d.id,
            name: d.name,
            mimeType: d.mimeType,
            size: d.sizeBytes,
            isFolder: d.mimeType === 'application/vnd.google-apps.folder',
          }))
          resolve(files)
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve([])
        }
      })
      .build()
    picker.setVisible(true)
  })
}

// List all image files inside a Drive folder (recursively)
export async function listFolderImages(folderId: string): Promise<DriveFile[]> {
  const token = await ensureToken()
  const IMAGE_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/bmp', 'image/tiff', 'image/svg+xml',
  ]
  const mimeQuery = IMAGE_MIME_TYPES.map(m => `mimeType='${m}'`).join(' or ')
  const query = `'${folderId}' in parents and (${mimeQuery}) and trashed=false`

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Folder listing failed: ${res.status}`)
  const json = await res.json()
  return (json.files || []) as DriveFile[]
}

export async function downloadDriveFile(fileId: string): Promise<Blob> {
  const token = await ensureToken()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)
  return res.blob()
}

export async function uploadToDrive(
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<string> {
  const token = await ensureToken()
  const metadata = { name: filename, mimeType }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  )
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
  const json = await res.json()
  return json.webViewLink as string
}
