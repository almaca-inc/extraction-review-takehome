import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { stream } from 'hono/streaming'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, '..', '..', 'fixtures')

const read = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'))

type Field = {
  id: string
  label: string
  group: string
  type: 'text' | 'date' | 'enum'
  options?: string[]
  value: string
  confidence: number | null
  span: { page: number; x: number; y: number; w: number; h: number }
  status?: 'pending' | 'accepted' | 'rejected'
}

type Extraction = {
  documentId: string
  caseRef: string
  extractedAt: string
  model: string
  revision: number
  pages: { page: number; src: string; width: number; height: number; label: string }[]
  fields: Field[]
}

const pristine = (): Extraction => ({
  ...read('extraction.json'),
  revision: 1,
  fields: read('extraction.json').fields.map((f: Field) => ({ ...f, status: 'pending' })),
})

let state: Extraction = pristine()
/** Tracks which fields have already been flaked, so a retry always succeeds. */
let flaked = new Set<string>()

const LATENCY = Number(process.env.MOCK_LATENCY_MS ?? 220)
const FLAKE_RATE = Number(process.env.MOCK_FLAKE_RATE ?? 0.12)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jitter = (base: number) => base + Math.floor(Math.random() * base)

const app = new Hono()
app.use('*', cors())

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/reset', (c) => {
  state = pristine()
  flaked = new Set()
  return c.json({ ok: true })
})

app.get('/api/extraction', async (c) => {
  await sleep(jitter(LATENCY))
  return c.json(state)
})

/** Update one field's value and/or review status. */
app.patch('/api/fields/:id', async (c) => {
  const id = c.req.param('id')
  const field = state.fields.find((f) => f.id === id)
  if (!field) return c.json({ error: 'unknown_field', fieldId: id }, 404)

  await sleep(jitter(LATENCY))

  // Real APIs fail. The first write to any given field may 503; a retry of the
  // same field always succeeds.
  if (!flaked.has(id) && Math.random() < FLAKE_RATE) {
    flaked.add(id)
    return c.json({ error: 'upstream_unavailable', retryable: true }, 503)
  }

  const body = await c.req.json<{ value?: string; status?: Field['status'] }>()
  if (body.value !== undefined) field.value = body.value
  if (body.status !== undefined) field.status = body.status
  state.revision += 1

  return c.json({ field, revision: state.revision })
})

/**
 * Re-run extraction. Emits NDJSON — one JSON object per line, flushed as it is
 * produced. Terminates with a `{"type":"done"}` message.
 */
app.post('/api/reextract', (c) => {
  const messages: { fieldId: string; value: string; confidence: number; delayMs: number }[] =
    read('reextract.json').messages

  c.header('Content-Type', 'application/x-ndjson; charset=utf-8')
  c.header('Cache-Control', 'no-store')
  c.header('X-Accel-Buffering', 'no')

  return stream(c, async (s) => {
    let aborted = false
    s.onAbort(() => {
      aborted = true
    })

    await s.write(
      JSON.stringify({ type: 'start', total: messages.length, at: new Date().toISOString() }) +
        '\n',
    )

    for (const m of messages) {
      await sleep(m.delayMs)
      if (aborted) return
      const field = state.fields.find((f) => f.id === m.fieldId)
      if (field) {
        field.value = m.value
        field.confidence = m.confidence
        state.revision += 1
      }
      await s.write(
        JSON.stringify({
          type: 'field',
          fieldId: m.fieldId,
          value: m.value,
          confidence: m.confidence,
          revision: state.revision,
        }) + '\n',
      )
    }

    if (!aborted) await s.write(JSON.stringify({ type: 'done', revision: state.revision }) + '\n')
  })
})

/** Commit the review. Rejects a stale revision with 409. */
app.post('/api/save', async (c) => {
  await sleep(jitter(LATENCY * 2))
  const body = await c.req.json<{ revision?: number }>()
  if (typeof body.revision === 'number' && body.revision !== state.revision) {
    return c.json(
      { error: 'stale_revision', expected: state.revision, received: body.revision },
      409,
    )
  }
  return c.json({ ok: true, savedAt: new Date().toISOString(), revision: state.revision })
})

const port = Number(process.env.MOCK_PORT ?? 4000)
serve({ fetch: app.fetch, port })
console.log(`mock api  →  http://localhost:${port}`)
