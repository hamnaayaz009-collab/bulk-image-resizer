'use client'
import React from 'react'

interface Props {
  onClick: () => void
  loading?: boolean
  label: string
  icon: string
  variant?: 'primary' | 'outline'
}

export default function DriveButton({ onClick, loading, label, icon, variant = 'primary' }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        variant === 'primary'
          ? 'bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50'
          : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <img src={icon} alt="" className="w-5 h-5" />
      {loading ? 'Loading...' : label}
    </button>
  )
}
