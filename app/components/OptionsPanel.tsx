'use client'
import React from 'react'

export interface Options {
  widthVal: number
  heightVal: number
  unit: 'percent' | 'pixels'
  lockAspect: boolean
  dpi: number
  format: 'jpg' | 'png' | 'webp'
  quality: number
  background: 'white' | 'black'
  targetKB: number | null
}

interface Props {
  options: Options
  onChange: (opts: Options) => void
  onProcess: () => void
  processing: boolean
  hasImages: boolean
}

export default function OptionsPanel({ options, onChange, onProcess, processing, hasImages }: Props) {
  const set = (patch: Partial<Options>) => onChange({ ...options, ...patch })
  const KB_SIZES = [50, 100, 150, 200, 250, 300]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Resize Options</h2>

      {/* Width / Height / Lock / Unit */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="w-16 text-sm font-medium text-gray-700">Width</label>
          <input
            type="number"
            min={1}
            value={options.widthVal}
            onChange={e => set({ widthVal: Number(e.target.value) })}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-sm font-medium text-gray-700">Height</label>
          <input
            type="number"
            min={1}
            value={options.heightVal}
            onChange={e => set({ heightVal: Number(e.target.value) })}
            disabled={options.lockAspect && options.unit === 'pixels'}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            onClick={() => set({ lockAspect: !options.lockAspect })}
            title={options.lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
              options.lockAspect
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400'
            }`}
          >
            {options.lockAspect ? '🔒' : '🔓'}
          </button>
          <select
            value={options.unit}
            onChange={e => set({ unit: e.target.value as 'percent' | 'pixels' })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percent">Percent</option>
            <option value="pixels">Pixels</option>
          </select>
        </div>
      </div>

      {/* Resolution */}
      <div className="flex items-center gap-3">
        <label className="w-24 text-sm font-medium text-gray-700">Resolution</label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <input
            type="number"
            min={1}
            value={options.dpi}
            onChange={e => set({ dpi: Number(e.target.value) })}
            className="w-20 px-3 py-2 text-sm focus:outline-none"
          />
          <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-300 py-2">DPI</span>
        </div>
      </div>

      {/* Format / Quality / Background */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Format</label>
          <select
            value={options.format}
            onChange={e => set({ format: e.target.value as 'jpg' | 'png' | 'webp' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Quality</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <input
              type="number"
              min={1}
              max={100}
              value={options.quality}
              onChange={e => set({ quality: Math.min(100, Math.max(1, Number(e.target.value))) })}
              disabled={options.targetKB !== null || options.format === 'png'}
              className="w-full px-3 py-2 text-sm focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
            <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-300 py-2">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Background</label>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => set({ background: 'white' })}
              className={`w-8 h-8 rounded-full border-2 bg-white transition-all ${
                options.background === 'white' ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'
              }`}
            />
            <button
              onClick={() => set({ background: 'black' })}
              className={`w-8 h-8 rounded-full border-2 bg-black transition-all ${
                options.background === 'black' ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Target KB */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Target Size</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => set({ targetKB: null })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              options.targetKB === null
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >
            Manual
          </button>
          {KB_SIZES.map(kb => (
            <button
              key={kb}
              onClick={() => set({ targetKB: kb })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                options.targetKB === kb
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              {kb} KB
            </button>
          ))}
        </div>
        {options.targetKB !== null && (
          <p className="text-xs text-blue-600">Quality will be auto-adjusted to reach &le;{options.targetKB} KB</p>
        )}
      </div>

      {/* Process button */}
      <button
        onClick={onProcess}
        disabled={!hasImages || processing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {processing ? 'Processing...' : 'Resize All Images'}
      </button>
    </div>
  )
}
