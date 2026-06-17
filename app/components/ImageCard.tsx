'use client'
import React from 'react'

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
  previewUrl: string
  driveFileId?: string
  driveUploading?: boolean
  driveLink?: string
}

interface Props {
  image: ImageFile
  onRemove: (id: string) => void
  onExportToDrive?: (id: string) => void
}

function formatKB(kb: number) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
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

export default function ImageCard({ image, onRemove, onExportToDrive }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.resultUrl || image.previewUrl} alt={image.file.name} className="w-full h-full object-contain" />
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
        <p className="text-xs font-medium text-gray-800 truncate" title={image.file.name}>{image.file.name}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Original: {formatKB(image.originalSizeKB)}</span>
          {image.resultSizeKB !== undefined && <span className="text-green-600 font-medium">&rarr; {formatKB(image.resultSizeKB)}</span>}
        </div>
        {image.resultWidth && <p className="text-xs text-gray-400">{image.resultWidth} &times; {image.resultHeight} px</p>}
        {image.status === 'done' && image.resultUrl && (
          <div className="space-y-1.5">
            <a href={image.resultUrl} download={image.outputFilename} className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs py-1.5 rounded-lg transition-colors">
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
