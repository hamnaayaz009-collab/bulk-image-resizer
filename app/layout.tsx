import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bulk Image Resizer',
  description: 'Resize and compress multiple images at once, free and client-side',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
