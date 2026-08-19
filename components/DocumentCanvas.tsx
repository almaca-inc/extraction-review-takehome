'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Page, Span } from '@/lib/api/schema'

export type Highlight = {
  /** Stable key so React can keep rects across renders. */
  key: string
  span: Span
  variant?: 'active' | 'muted'
}

export type DocumentCanvasHandle = {
  /**
   * Scroll the requested span into view.
   *
   * Returns `false` when the span points at a page this document does not have,
   * in which case nothing scrolls and nothing is highlighted. Surfacing that to
   * the user is your call — this component stays silent about it.
   */
  scrollToSpan: (span: Span) => boolean
}

type Props = {
  pages: Page[]
  /**
   * Rects to draw, in page-fraction coordinates. Drawn exactly as given: a box
   * that extends past the page edge will visibly overflow it.
   */
  highlights?: Highlight[]
  className?: string
}

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.25, 1.5, 2] as const
const DEFAULT_ZOOM_INDEX = 2

/**
 * Renders the source document and draws highlight rects over it.
 *
 * This is provided so you don't spend the exercise on document rendering. You
 * should not need to modify it — but you may if you want to.
 */
export const DocumentCanvas = forwardRef<DocumentCanvasHandle, Props>(function DocumentCanvas(
  { pages, highlights = [], className },
  ref,
) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef(new Map<number, HTMLDivElement>())
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const zoom = ZOOM_STEPS[zoomIndex] ?? 1

  useImperativeHandle(ref, () => ({
    scrollToSpan(span) {
      const pageEl = pageRefs.current.get(span.page)
      const scroller = scrollerRef.current
      if (!pageEl || !scroller) return false

      const spanTop = pageEl.offsetTop + span.y * pageEl.clientHeight
      const spanCenter = spanTop + (span.h * pageEl.clientHeight) / 2
      scroller.scrollTo({ top: spanCenter - scroller.clientHeight / 2, behavior: 'smooth' })
      return true
    },
  }))

  const byPage = new Map<number, Highlight[]>()
  for (const h of highlights) {
    const list = byPage.get(h.span.page)
    if (list) list.push(h)
    else byPage.set(h.span.page, [h])
  }

  return (
    <div
      className={cn('bg-muted flex h-full flex-col overflow-hidden rounded-lg border', className)}
    >
      <div className="bg-card flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <span className="text-muted-foreground text-xs font-medium">Source document</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            className="hover:bg-accent rounded p-1 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="text-muted-foreground w-12 text-center text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            className="hover:bg-accent rounded p-1 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex w-fit flex-col gap-4">
          {pages.map((page) => (
            <div key={page.page} className="flex flex-col gap-1">
              <div
                ref={(el) => {
                  if (el) pageRefs.current.set(page.page, el)
                  else pageRefs.current.delete(page.page)
                }}
                data-page={page.page}
                className="relative bg-white shadow-sm ring-1 ring-black/10"
                style={{ width: page.width * zoom, height: page.height * zoom }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.src}
                  alt={page.label}
                  width={page.width}
                  height={page.height}
                  className="pointer-events-none absolute inset-0 size-full select-none"
                  draggable={false}
                />
                {(byPage.get(page.page) ?? []).map((h) => (
                  <div
                    key={h.key}
                    data-highlight={h.key}
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute rounded-[2px] transition-colors',
                      h.variant === 'muted'
                        ? 'bg-amber-300/20 ring-1 ring-amber-500/30'
                        : 'bg-amber-300/45 ring-2 ring-amber-500/80',
                    )}
                    style={{
                      left: `${h.span.x * 100}%`,
                      top: `${h.span.y * 100}%`,
                      width: `${h.span.w * 100}%`,
                      height: `${h.span.h * 100}%`,
                    }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-center text-xs">
                Page {page.page} — {page.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
