import {
  extractionSchema,
  fieldSchema,
  reextractMessageSchema,
  type Extraction,
  type Field,
  type ReextractMessage,
  type ReviewStatus,
} from './schema'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API ${status}`)
    this.name = 'ApiError'
  }

  /** True for failures where an immediate retry is a reasonable response. */
  get retryable() {
    return this.status >= 500 || this.status === 429
  }
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res
}

export async function getExtraction(signal?: AbortSignal): Promise<Extraction> {
  const res = await request('/api/extraction', { signal })
  return extractionSchema.parse(await res.json())
}

export async function patchField(
  id: string,
  patch: { value?: string; status?: ReviewStatus },
  signal?: AbortSignal,
): Promise<{ field: Field; revision: number }> {
  const res = await request(`/api/fields/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    signal,
  })
  const json = (await res.json()) as { field: unknown; revision: number }
  return { field: fieldSchema.parse(json.field), revision: json.revision }
}

export async function save(
  revision: number,
  signal?: AbortSignal,
): Promise<{ savedAt: string; revision: number }> {
  const res = await request('/api/save', {
    method: 'POST',
    body: JSON.stringify({ revision }),
    signal,
  })
  return (await res.json()) as { savedAt: string; revision: number }
}

/**
 * Re-run extraction. Yields each message as the server flushes it, over roughly
 * eight seconds.
 *
 * Line buffering and JSON parsing are handled here; everything else is yours.
 * Pass an AbortSignal if you want the user to be able to stop a run — without
 * one, the request continues until the server is finished.
 */
export async function* streamReextract(
  signal?: AbortSignal,
): AsyncGenerator<ReextractMessage, void, void> {
  const res = await request('/api/reextract', { method: 'POST', signal })
  if (!res.body) throw new Error('no response body')

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += value

      let newline: number
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        if (line) yield reextractMessageSchema.parse(JSON.parse(line))
      }
    }
    const tail = buffer.trim()
    if (tail) yield reextractMessageSchema.parse(JSON.parse(tail))
  } finally {
    await reader.cancel().catch(() => {})
  }
}
