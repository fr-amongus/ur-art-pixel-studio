import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Download, Eraser, Trash2, Undo2, Redo2, MousePointer2 } from 'lucide-react'

const palette = [
  '#f7f3ff', '#17151e', '#b8b3c8', '#726b83', '#f04f7a', '#ff7b54',
  '#ffc857', '#d6e84f', '#58d68d', '#42c6d6', '#5c8df6', '#a66cff',
]
const brushSizes = [1, 2, 4, 8]

type Point = { x: number; y: number }

type Stroke = { points: Point[]; color: string; size: number; erase: boolean }

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Ur Art · Pixel Studio' },
      { name: 'description', content: 'A tactile pixel-art studio for quick sketches, notes, and tiny worlds.' },
    ],
  }),
  component: UrArtStudio,
})

function UrArtStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState('#17151e')
  const [size, setSize] = useState(4)
  const [erase, setErase] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [history, setHistory] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const [drawing, setDrawing] = useState(false)
  const [status, setStatus] = useState('Canvas ready')
  const [exportName, setExportName] = useState('ur-art')
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png')

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const redraw = (nextStrokes: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f7f3ff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    for (const stroke of nextStrokes) {
      if (!stroke.points.length) continue
      ctx.save()
      ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'square'
      ctx.lineJoin = 'miter'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y)
      ctx.stroke()
      ctx.restore()
    }
  }

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setHistory((current) => [...current, strokes])
    setRedoStack([])
    setDrawing(true)
    const nextStroke = { points: [getPoint(event)], color, size, erase }
    setStrokes((current) => {
      const next = [...current, nextStroke]
      redraw(next)
      return next
    })
  }

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    setStrokes((current) => {
      const updated = [...current]
      const active = updated[updated.length - 1]
      active.points = [...active.points, getPoint(event)]
      redraw(updated)
      return updated
    })
  }

  const finishDrawing = () => {
    if (!drawing) return
    setDrawing(false)
    setStatus(erase ? 'Erased a mark' : 'Added a mark')
  }

  const undo = () => {
    if (!history.length) return
    const previous = history[history.length - 1]
    setRedoStack((current) => [...current, strokes])
    setHistory((current) => current.slice(0, -1))
    setStrokes(previous)
    redraw(previous)
    setStatus('Undid last mark')
  }

  const redo = () => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setHistory((current) => [...current, strokes])
    setRedoStack((current) => current.slice(0, -1))
    setStrokes(next)
    redraw(next)
    setStatus('Redid last mark')
  }

  const clearCanvas = () => {
    if (!strokes.length) return
    setHistory((current) => [...current, strokes])
    setRedoStack([])
    setStrokes([])
    redraw([])
    setStatus('Canvas cleared')
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const safeName = exportName.trim().replace(/[^a-zA-Z0-9-_]/g, '-') || 'ur-art'
    const mimeType = `image/${exportFormat}`
    const link = document.createElement('a')
    link.download = `${safeName}.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`
    link.href = canvas.toDataURL(mimeType, 0.95)
    link.click()
    setStatus(`${link.download} downloaded`)
  }

  return (
    <main className="min-h-dvh bg-background text-foreground selection:bg-primary/30">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
              <span className="font-serif text-xl font-bold leading-none">u</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-tight">Ur Art</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">pixel studio / 01</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            <span>{status}</span>
          </div>
          <button onClick={download} className="group inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95">
            <Download className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline">Save image</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-6 lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:px-10 lg:py-8">
        <aside className="order-2 space-y-4 lg:order-1">
          <ToolPanel title="Tools" eyebrow="01 / mark">
            <button onClick={() => setErase(false)} className={`tool-button ${!erase ? 'tool-button-active' : ''}`}><MousePointer2 className="size-4" /><span>Draw</span><kbd>B</kbd></button>
            <button onClick={() => setErase(true)} className={`tool-button ${erase ? 'tool-button-active' : ''}`}><Eraser className="size-4" /><span>Eraser</span><kbd>E</kbd></button>
          </ToolPanel>
          <ToolPanel title="Pixel size" eyebrow="02 / resolution">
            <div className="grid grid-cols-4 gap-2">
              {brushSizes.map((brush) => (
                <button key={brush} onClick={() => setSize(brush)} aria-label={`${brush} pixel brush`} className={`grid aspect-square place-items-center rounded-lg border text-xs font-medium transition-all hover:border-primary/70 hover:bg-primary/10 active:scale-95 ${size === brush ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_18px_color-mix(in_oklch,var(--primary)_30%,transparent)]' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                  <span className="rounded-full bg-current" style={{ width: Math.max(4, brush * 2), height: Math.max(4, brush * 2) }} />
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>1px</span><span>pixel size: {size}px</span><span>8px</span></div>
          </ToolPanel>
          <ToolPanel title="Actions" eyebrow="03 / history">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={undo} disabled={!history.length} className="action-button"><Undo2 className="size-4" />Undo</button>
              <button onClick={redo} disabled={!redoStack.length} className="action-button"><Redo2 className="size-4" />Redo</button>
            </div>
            <button onClick={clearCanvas} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground active:scale-[.98]"><Trash2 className="size-4" />Clear all</button>
          </ToolPanel>
        </aside>

        <section className="order-1 min-w-0 lg:order-2">
          <div ref={boardRef} className="relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg sm:p-3">
            <div className="pointer-events-none absolute left-6 top-5 z-10 flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary" /> untitled canvas
            </div>
            <div className="canvas-frame aspect-square w-full overflow-hidden rounded-xl border border-border/80 bg-[#f7f3ff] sm:aspect-[1.2/1] lg:aspect-[1.15/1]">
              <canvas ref={canvasRef} width={1152} height={1000} className="size-full touch-none cursor-crosshair" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} />
            </div>
            <div className="flex items-center justify-between px-2 pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>1152 × 1000 px</span><span>pressure ready · {erase ? 'erase mode' : 'draw mode'}</span></div>
          </div>
        </section>

        <aside className="order-3 space-y-4">
          <ToolPanel title="Palette" eyebrow="04 / color">
            <div className="grid grid-cols-6 gap-2">
              {palette.map((swatch) => <button key={swatch} aria-label={`Choose ${swatch}`} onClick={() => { setColor(swatch); setErase(false) }} className={`palette-swatch ${color === swatch && !erase ? 'palette-swatch-active' : ''}`} style={{ backgroundColor: swatch }} />)}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2"><span className="size-7 rounded-md border border-border" style={{ backgroundColor: erase ? '#f7f3ff' : color }} /><div className="min-w-0"><p className="text-xs font-medium">{erase ? 'Eraser' : 'Active color'}</p><p className="font-mono text-[10px] uppercase text-muted-foreground">{erase ? 'transparent' : color}</p></div></div>
          </ToolPanel>
          <ToolPanel title="Export" eyebrow="05 / save">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground" htmlFor="export-name">File name</label>
            <input id="export-name" value={exportName} onChange={(event) => setExportName(event.target.value)} className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="my-drawing" />
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <select aria-label="Image format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as 'png' | 'jpeg' | 'webp')} className="min-w-0 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground outline-none transition focus:border-primary">
                <option value="png">PNG · transparent-ready</option>
                <option value="jpeg">JPG · lightweight</option>
                <option value="webp">WEBP · modern</option>
              </select>
              <button onClick={download} aria-label="Save drawing" className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 active:scale-95"><Download className="size-4" /></button>
            </div>
          </ToolPanel>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">small worlds, big mood</p><p className="mt-2 font-serif text-lg leading-snug text-foreground">Make something tiny that feels like yours.</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Draw with a mouse, finger, or stylus. Every mark stays intentionally pixel-sharp.</p></div>
          <div className="hidden items-center justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:flex"><span>ur-art / local</span><span>v1.0</span></div>
        </aside>
      </div>
    </main>
  )
}

function ToolPanel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-md"><div className="mb-3 flex items-end justify-between"><h2 className="font-serif text-base font-semibold">{title}</h2><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{eyebrow}</span></div>{children}</section>
}
