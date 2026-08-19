'use client'

import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { DocumentCanvas, type DocumentCanvasHandle } from '@/components/DocumentCanvas'
import { getExtraction } from '@/lib/api/client'

/**
 * ---------------------------------------------------------------------------
 * START HERE
 * ---------------------------------------------------------------------------
 * This page exists to prove the wiring works: it loads the extraction from the
 * mock API and renders the source document. Everything else is yours to build.
 *
 * Read README.md for what the paralegal needs to accomplish, and API.md for the
 * endpoints available to you. Delete as much of this file as you like.
 */
export default function Page() {
  const canvasRef = useRef<DocumentCanvasHandle>(null)

  const { data, isPending, error } = useQuery({
    queryKey: ['extraction'],
    queryFn: ({ signal }) => getExtraction(signal),
  })

  if (isPending) return <main className="text-muted-foreground p-8 text-sm">Loading…</main>
  if (error) return <main className="text-destructive p-8 text-sm">{String(error)}</main>

  return (
    <main className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 p-4">
      <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-lg border">
        <header className="border-b px-4 py-3">
          <h1 className="text-sm font-semibold">
            {data.caseRef} — {data.fields.length} extracted fields
          </h1>
          <p className="text-muted-foreground text-xs">
            Extracted by {data.model} · revision {data.revision}
          </p>
        </header>

        <ul className="flex-1 divide-y overflow-auto">
          {data.fields.map((field) => (
            <li key={field.id}>
              <button
                type="button"
                onClick={() => canvasRef.current?.scrollToSpan(field.span)}
                className="hover:bg-accent w-full px-4 py-2 text-left"
              >
                <div className="text-muted-foreground text-xs">{field.label}</div>
                <div className="text-sm">{field.value || <em>empty</em>}</div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <DocumentCanvas ref={canvasRef} pages={data.pages} />
    </main>
  )
}
