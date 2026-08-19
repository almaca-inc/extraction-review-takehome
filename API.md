# Mock API reference

Base URL `http://localhost:4000`, started for you by `npm run dev`. It holds all
state in memory — restart it, or `POST /api/reset`, to get back to a clean
extraction.

It deliberately injects latency (~220–440ms) and occasional failures. Both are
tunable in `.env` if you want to test against worse conditions:

```bash
MOCK_LATENCY_MS=1500 MOCK_FLAKE_RATE=0.5 npm run dev
```

---

### `GET /api/extraction`

The document and every extracted field.

```jsonc
{
  "documentId": "doc_8f2a1c",
  "caseRef": "ALM-2025-0417",
  "extractedAt": "2026-08-14T17:22:09.000Z",
  "model": "extractor-v3",
  "revision": 1,
  "pages": [
    {
      "page": 1,
      "src": "/pages/page-1.svg",
      "width": 850,
      "height": 1100,
      "label": "Passport — data page",
    },
  ],
  "fields": [
    {
      "id": "passport.surname",
      "label": "Surname",
      "group": "Beneficiary identity",
      "type": "text", // "text" | "date" | "enum"
      "options": ["F", "M", "X"], // present only when type is "enum"
      "value": "Marwah",
      "confidence": 0.99, // 0–1, or null if the extractor reported none
      "span": { "page": 1, "x": 0.067, "y": 0.187, "w": 0.077, "h": 0.021 },
      "status": "pending", // "pending" | "accepted" | "rejected"
    },
  ],
}
```

**Spans** are fractions of the page, origin top-left, so they survive zoom.
`DocumentCanvas` draws them exactly as given and does not validate them.

**`revision`** increments on every server-side mutation. Send the one you last
saw to `POST /api/save`.

### `PATCH /api/fields/:id`

Body: `{ "value"?: string, "status"?: "pending" | "accepted" | "rejected" }`
→ `200 { "field": Field, "revision": number }`

May return `503 { "error": "upstream_unavailable", "retryable": true }`. Any
given field flakes at most once; retrying the same field always succeeds.

### `POST /api/reextract`

Re-runs extraction. Responds with **NDJSON** — one JSON object per line,
flushed as produced, over roughly eight seconds. Server-side field values are
updated as each message is emitted.

```
{"type":"start","total":12,"at":"..."}
{"type":"field","fieldId":"passport.place_of_birth","value":"Pune, Maharashtra","confidence":0.86,"revision":2}
...
{"type":"done","revision":13}
```

`streamReextract()` in `lib/api/client.ts` handles the line buffering and gives
you an async iterable of parsed messages. It takes an optional `AbortSignal`.

### `POST /api/save`

Body: `{ "revision": number }`
→ `200 { "ok": true, "savedAt": string, "revision": number }`
→ `409 { "error": "stale_revision", "expected": number, "received": number }`

### `POST /api/reset`

Restores the pristine fixture. Useful from tests.
