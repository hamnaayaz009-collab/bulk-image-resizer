export interface ResizeOptions {
  widthVal: number
  heightVal: number
  unit: 'percent' | 'pixels'
  lockAspect: boolean
  format: 'jpg' | 'png' | 'webp'
  quality: number
  background: 'white' | 'black'
  targetKB: number | null
}

export interface ProcessResult {
  blob: Blob
  url: string
  width: number
  height: number
  sizeKB: number
}

function getMime(format: string) {
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  return 'image/jpeg'
}

function getExt(format: string) {
  if (format === 'png') return 'png'
  if (format === 'webp') return 'webp'
  return 'jpg'
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      mime,
      quality / 100
    )
  })
}

function drawToCanvas(img: HTMLImageElement, w: number, h: number, bg: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg === 'black' ? '#000000' : '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

export async function resizeImage(file: File, opts: ResizeOptions): Promise<ProcessResult> {
  const img = await loadImage(file)
  const origW = img.naturalWidth
  const origH = img.naturalHeight

  let newW: number
  let newH: number

  if (opts.unit === 'percent') {
    newW = Math.round(origW * (opts.widthVal / 100))
    newH = Math.round(origH * (opts.heightVal / 100))
  } else {
    newW = opts.widthVal
    if (opts.lockAspect) {
      newH = Math.round((origH / origW) * newW)
    } else {
      newH = opts.heightVal
    }
  }

  newW = Math.max(1, newW)
  newH = Math.max(1, newH)

  const mime = getMime(opts.format)
  const canvas = drawToCanvas(img, newW, newH, opts.background)

  let blob: Blob
  let sizeKB: number

  if (opts.targetKB !== null && opts.format !== 'png') {
    // binary search quality
    let lo = 1, hi = 95, bestBlob: Blob | null = null
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const b = await canvasToBlob(canvas, mime, mid)
      const kb = b.size / 1024
      if (kb <= opts.targetKB) {
        bestBlob = b
        lo = mid + 1  // try higher quality still within target
      } else {
        hi = mid - 1
      }
    }
    if (!bestBlob) {
      // even quality=1 exceeds target, use quality=1
      bestBlob = await canvasToBlob(canvas, mime, 1)
    }
    blob = bestBlob
    sizeKB = blob.size / 1024
  } else {
    blob = await canvasToBlob(canvas, mime, opts.targetKB !== null ? 80 : opts.quality)
    sizeKB = blob.size / 1024
  }

  URL.revokeObjectURL(img.src)
  const url = URL.createObjectURL(blob)
  return { blob, url, width: newW, height: newH, sizeKB }
}

export function getOutputFilename(originalName: string, format: string): string {
  const base = originalName.replace(/\.[^.]+$/, '')
  return `${base}_resized.${getExt(format)}`
}
