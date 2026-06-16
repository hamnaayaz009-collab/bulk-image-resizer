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
}

interface Props {
  image: ImageFile
  onRemove: (id: string) => void
}

function formatKB(kb: number) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
}

export default function ImageCard({ image, onRemove }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.resultUrl || image.previewUrl}
          alt={image.file.name}
          className="w-full h-full object-contain"
        />
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs transition-colors"
        >
          &times;
        </button>
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {image.status === 'done' && (
          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Done</div>
        )}
      </div>
      <div className="p-3 flex-1 space-y-2">
        <p className="text-xs font-medium text-gray-800 truncate" title={image.file.name}>{image.file.name}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Original: {formatKB(image.originalSizeKB)}</span>
          {image.resultSizeKB !== undefined && (
            <span className="text-green-600 font-medium">&rarr; {formatKB(image.resultSizeKB)}</span>
          )}
        </div>
        {image.resultWidth && (
          <p className="text-xs text-gray-400">{image.resultWidth} &times; {image.resultHeight} px</p>
        )}
        {image.status === 'done' && image.resultUrl && (
          <a
            href={image.resultUrl}
            download={image.outputFilename}
            className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs py-2 rounded-lg transition-colors"
          >
            Download
          </a>
        )}
        {image.status === 'error' && (
          <p className="text-xs text-red-500">Processing failed</p>
        )}
      </div>
    </div>
  )
}
