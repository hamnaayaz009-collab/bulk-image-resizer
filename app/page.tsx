'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import OptionsPanel, { Options } from './components/OptionsPanel'
import ImageCard, { ImageFile } from './components/ImageCard'
import { resizeImage, getOutputFilename } from './utils/imageProcessor'
import {
  loadGoogleApis,
  openDrivePicker,
  downloadDriveFile,
  uploadToDrive,
  listFolderImages,
} from './utils/driveHelper'

const DEFAULT_OPTIONS: Options = {
  widthVal: 70,
  heightVal: 70,
  unit: 'percent',
  lockAspect: true,
  dpi: 72,
  format: 'jpg',
  quality: 90,
  background: 'white',
  targetKB: null,
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''

function generateId() {
  return Math.random().toString(36).slice(2)
}

function getMimeType(format: string) {
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS)
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveReady, setDriveReady] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) return
    loadGoogleApis(GOOGLE_CLIENT_ID, GOOGLE_API_KEY)
      .then(() => setDriveReady(true))
      .catch(console.error)
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newImages: ImageFile[] = arr.map(file => ({
      id: generateId(),
      file,
      originalSizeKB: file.size / 1024,
      status: 'idle',
      previewUrl: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...newImages])
  }, [])

  const pickFromDrive = useCallback(async () => {
    if (!driveReady) return
    setDriveLoading(true)
    try {
      const picked = await openDrivePicker(GOOGLE_API_KEY)
      if (!picked.length) return

      // Expand folders into their image files
      const IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff']
      const allFiles: typeof picked = []
      for (const f of picked) {
        if (f.isFolder) {
          try {
            const folderFiles = await listFolderImages(f.id)
            allFiles.push(...folderFiles)
          } catch (e) {
            console.error('Failed to list folder', f.name, e)
          }
        } else if (IMAGE_TYPES.includes(f.mimeType)) {
          allFiles.push(f)
        }
      }

      const newImages: ImageFile[] = []
      for (const f of allFiles) {
        try {
          const blob = await downloadDriveFile(f.id)
          const file = new File([blob], f.name, { type: f.mimeType })
          newImages.push({
            id: generateId(),
            file,
            originalSizeKB: blob.size / 1024,
            status: 'idle',
            previewUrl: URL.createObjectURL(blob),
            driveFileId: f.id,
          })
        } catch (e) {
          console.error('Failed to download', f.name, e)
        }
      }
      setImages(prev => [...prev, ...newImages])
    } finally {
      setDriveLoading(false)
    }
  }, [driveReady])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const onRemove = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }, [])

  const processAll = useCallback(async () => {
    setProcessing(true)
    const resizeOpts = {
      widthVal: options.widthVal,
      heightVal: options.heightVal,
      unit: options.unit,
      lockAspect: options.lockAspect,
      format: options.format,
      quality: options.quality,
      background: options.background,
      targetKB: options.targetKB,
    }
    for (const img of images) {
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i))
      try {
        const result = await resizeImage(img.file, resizeOpts)
        const outputFilename = getOutputFilename(img.file.name, options.format)
        setImages(prev => prev.map(i =>
          i.id === img.id
            ? { ...i, status: 'done', resultUrl: result.url, resultBlob: result.blob, resultWidth: result.width, resultHeight: result.height, resultSizeKB: result.sizeKB, outputFilename }
            : i
        ))
      } catch {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error' } : i))
      }
    }
    setProcessing(false)
  }, [images, options])

  const exportOneToDrive = useCallback(async (id: string) => {
    const img = images.find(i => i.id === id)
    if (!img?.resultBlob || !img.outputFilename) return
    setImages(prev => prev.map(i => i.id === id ? { ...i, driveUploading: true } : i))
    try {
      const link = await uploadToDrive(img.resultBlob, img.outputFilename, getMimeType(options.format))
      setImages(prev => prev.map(i => i.id === id ? { ...i, driveUploading: false, driveLink: link } : i))
    } catch (e) {
      setImages(prev => prev.map(i => i.id === id ? { ...i, driveUploading: false } : i))
      alert('Drive upload failed. Check console.')
      console.error(e)
    }
  }, [images, options.format])

  const exportAllToDrive = useCallback(async () => {
    setExportingAll(true)
    const done = images.filter(i => i.status === 'done' && i.resultBlob)
    for (const img of done) {
      await exportOneToDrive(img.id)
    }
    setExportingAll(false)
  }, [images, exportOneToDrive])

  const downloadAll = useCallback(async () => {
    const done = images.filter(i => i.status === 'done' && i.resultBlob)
    if (!done.length) return
    const JSZip = (await import('jszip')).default
    const { saveAs } = await import('file-saver')
    const zip = new JSZip()
    const folder = zip.folder('resized-images')!
    for (const img of done) {
      folder.file(img.outputFilename || img.file.name, img.resultBlob!)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'resized-images.zip')
  }, [images])

  const doneCount = images.filter(i => i.status === 'done').length
  const driveConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">&#9889;</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bulk Image Resizer</h1>
            <p className="text-xs text-gray-500">Resize &amp; compress multiple images &mdash; supports Google Drive</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Upload Zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
          <div className="text-4xl mb-3">&#128444;&#65039;</div>
          <p className="text-lg font-semibold text-gray-700">Drop images here or click to upload</p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP &mdash; multiple files supported</p>
        </div>

        {/* Drive Picker */}
        {driveConfigured ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">or</span>
            <button
              onClick={pickFromDrive}
              disabled={!driveReady || driveLoading}
              className="flex items-center gap-2 bg-white border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              {driveLoading ? 'Loading from Drive...' : 'Pick from Google Drive'}
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <strong>Google Drive not configured.</strong> Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> and <code>NEXT_PUBLIC_GOOGLE_API_KEY</code> to your Vercel environment variables to enable Drive integration.
          </div>
        )}

        {images.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80 flex-shrink-0">
              <OptionsPanel options={options} onChange={setOptions} onProcess={processAll} processing={processing} hasImages={images.length > 0} />
            </div>
            <div className="flex-1 space-y-4">
              {doneCount > 0 && (
                <div className="flex flex-wrap items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-green-700 font-medium flex-1">{doneCount} image{doneCount > 1 ? 's' : ''} ready</p>
                  <button onClick={downloadAll} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    &#128230; Download ZIP
                  </button>
                  {driveConfigured && (
                    <button onClick={exportAllToDrive} disabled={exportingAll} className="flex items-center gap-2 bg-white border-2 border-blue-400 text-blue-700 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                      <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                      {exportingAll ? 'Saving to Drive...' : 'Save All to Drive'}
                    </button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map(img => (
                  <ImageCard key={img.id} image={img} onRemove={onRemove} onExportToDrive={driveConfigured ? exportOneToDrive : undefined} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        All processing happens in your browser. Images saved to Drive go directly from browser &rarr; Google.
      </footer>
    </div>
  )
}
