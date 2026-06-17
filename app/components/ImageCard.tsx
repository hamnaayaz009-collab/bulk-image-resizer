'use client'
import React, { useState, useRef } from 'react'

export interface ImageFile {
  id: string
  file: File
  originalSizeKB: number
  status: 'idle' | 'processing' | 'done' | 'error'
  resultUrl?: string
  resultBlob?: Blob
  resultWidth?: number
  resultHeight?: number
  resultSizeKB?: number
  outputFilename?: string
  customName?: string
  previewUrl: string
  driveFileId?: string
  driveUploading?: boolean
  driveLink?: string
}

interface Props {
  image: ImageFile
  onRemove: (id: string) => void
  onRename: (id: string, newName: string) => void
  onExportToDrive?: (id: string) => void
}

function formatKB(kb: number) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
}

function getBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, '')
}

function getExt(filename: string) {
  const m = filename.match(/\.[^.]+$/)
  return m ? m[0] : ''
}

const DriveIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
)

export default function ImageCard({ image, onRemove, onRename, onExportToDrive }: Props) {
  const displayName = image.customName || image.file.name
  const ext = getExt(image.file.name)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(getBaseName(displayName))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(image.id, trimmed + ext)
    setEditing(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  const outputFilename = image.outputFilename
    ? (image.customName
        ? getBaseName(image.customName) + getExt(image.outputFilename)
        : image.outputFilename)
    : displayName

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.resultUrl || image.previewUrl} alt={displayName} className="w-full h-full object-contain" />
        <button onClick={() => onRemove(image.id)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs transition-colors">&times;</button>
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {image.status === 'done' && <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Done</div>}
        {image.driveFileId && <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Drive</div>}
      </div>
      <div className="p-3 flex-1 space-y-2">
        {/* Editable filename */}
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={onKeyDown}
              className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
              autoFocus
            />
            <span className="text-xs text-gray-400 shrink-0">{ext}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <p
              className="text-xs font-medium text-gray-800 truncate flex-1 cursor-pointer hover:text-blue-600"
              title={`${displayName} — click to rename`}
              onClick={startEdit}
            >
              {displayName}
            </p>
            <button
              onClick={startEdit}
              title="Rename"
              className="text-gray-400 hover:text-blue-500 shrink-0 text-xs"
            >
              ✏️
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Original: {formatKB(image.originalSizeKB)}</span>
          {image.resultSizeKB !== undefined && <span className="text-green-600 font-medium">&rarr; {formatKB(image.resultSizeKB)}</span>}
        </div>
        {image.resultWidth && <p className="text-xs text-gray-400">{image.resultWidth} &times; {image.resultHeight} px</p>}
        {image.status === 'done' && image.resultUrl && (
          <div className="space-y-1.5">
            <a href={image.resultUrl} download={outputFilename} className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs py-1.5 rounded-lg transition-colors">
              Download
            </a>
            {onExportToDrive && (
              image.driveLink ? (
                <a href={image.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 w-full text-center bg-green-50 hover:bg-green-100 text-green-700 font-medium text-xs py-1.5 rounded-lg transition-colors">
                  <DriveIcon /> View in Drive &#x2197;
                </a>
              ) : (
                <button onClick={() => onExportToDrive(image.id)} disabled={image.driveUploading} className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  <DriveIcon /> {image.driveUploading ? 'Saving...' : 'Save to Drive'}
                </button>
              )
            )}
          </div>
        )}
        {image.status === 'error' && <p className="text-xs text-red-500">Processing failed</p>}
      </div>
    </div>
  )
}
