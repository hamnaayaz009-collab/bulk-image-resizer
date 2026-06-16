'use client'
import React, { useState, useCallback, useRef } from 'react'
import OptionsPanel, { Options } from './components/OptionsPanel'
import ImageCard, { ImageFile } from './components/ImageCard'
import { resizeImage, getOutputFilename } from './utils/imageProcessor'

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

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS)
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
            ? {
                ...i,
                status: 'done',
                resultUrl: result.url,
                resultBlob: result.blob,
                resultWidth: result.width,
                resultHeight: result.height,
                resultSizeKB: result.sizeKB,
                outputFilename,
              }
            : i
        ))
      } catch {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error' } : i))
      }
    }
    setProcessing(false)
  }, [images, options])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">&#9889;</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bulk Image Resizer</h1>
            <p className="text-xs text-gray-500">Resize &amp; compress multiple images &mdash; 100% client-side, free</p>
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
            dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <div className="text-4xl mb-3">&#128444;&#65039;</div>
          <p className="text-lg font-semibold text-gray-700">Drop images here or click to upload</p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP, GIF &mdash; multiple files supported</p>
        </div>

        {images.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Options */}
            <div className="lg:w-80 flex-shrink-0">
              <OptionsPanel
                options={options}
                onChange={setOptions}
                onProcess={processAll}
                processing={processing}
                hasImages={images.length > 0}
              />
            </div>

            {/* Image Grid */}
            <div className="flex-1 space-y-4">
              {doneCount > 0 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-green-700 font-medium">{doneCount} image{doneCount > 1 ? 's' : ''} ready</p>
                  <button
                    onClick={downloadAll}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    &#128230; Download All as ZIP
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map(img => (
                  <ImageCard key={img.id} image={img} onRemove={onRemove} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        All processing happens in your browser. No images are uploaded to any server.
      </footer>
    </div>
  )
}
