import { z } from 'zod'

export const spanSchema = z.object({
  /** 1-indexed. May reference a page that does not exist — see DocumentCanvas. */
  page: z.number().int(),
  /** All four are fractions of the page, 0–1, origin top-left. */
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
})

export const reviewStatusSchema = z.enum(['pending', 'accepted', 'rejected'])

export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  group: z.string(),
  type: z.enum(['text', 'date', 'enum']),
  options: z.array(z.string()).optional(),
  value: z.string(),
  /** null when the extractor reported no confidence for this field. */
  confidence: z.number().nullable(),
  span: spanSchema,
  status: reviewStatusSchema.default('pending'),
})

export const pageSchema = z.object({
  page: z.number().int(),
  src: z.string(),
  width: z.number(),
  height: z.number(),
  label: z.string(),
})

export const extractionSchema = z.object({
  documentId: z.string(),
  caseRef: z.string(),
  extractedAt: z.string(),
  model: z.string(),
  /** Increments on every server-side mutation. Send it back on save. */
  revision: z.number(),
  pages: z.array(pageSchema),
  fields: z.array(fieldSchema),
})

export const reextractMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start'), total: z.number(), at: z.string() }),
  z.object({
    type: z.literal('field'),
    fieldId: z.string(),
    value: z.string(),
    confidence: z.number(),
    revision: z.number(),
  }),
  z.object({ type: z.literal('done'), revision: z.number() }),
])

export type Span = z.infer<typeof spanSchema>
export type ReviewStatus = z.infer<typeof reviewStatusSchema>
export type Field = z.infer<typeof fieldSchema>
export type Page = z.infer<typeof pageSchema>
export type Extraction = z.infer<typeof extractionSchema>
export type ReextractMessage = z.infer<typeof reextractMessageSchema>
