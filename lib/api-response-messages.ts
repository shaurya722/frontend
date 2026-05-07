/**
 * Toast-oriented extraction from backend JSON bodies.
 *
 * Order: message ?? detail ?? error ?? first(errors[].error | messages)
 *        ?? non_field_errors ?? first serializer field error ?? fallback
 *
 * Optional `hint` is appended when present (reports / adjacent allocation hints).
 */

const ROOT_SKIP = new Set([
  'hint',
  'code',
  'success',
  'imported',
  'updated',
  'errors',
  'error_count',
  'total_rows',
  'counts',
  'results',
  'summary',
  'next',
  'previous',
  'count',
  'data',
  'task_id',
  'program',
  'allocated',
  'new_reallocation',
  'total_allocated',
  'total_errors',
  'requested_count',
  'deleted_count',
  'deleted_ids',
  'not_found_ids',
  'updated_sites',
  'total_requested',
  'community_id',
  'percentage',
  'meta',
])

function trimStr(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

/** Parse backend errors[].error when it is a JSON-stringified array of messages */
function normalizeRowErrorString(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String).join(', ')
    return String(parsed)
  } catch {
    return raw
  }
}

function firstErrorsArrayMessage(errors: unknown[]): string | null {
  for (const item of errors) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>

    if (typeof row.error === 'string') {
      return normalizeRowErrorString(row.error)
    }
    if (Array.isArray(row.messages) && row.messages.length > 0) {
      return row.messages.map(String).join('; ')
    }
    if (typeof row.field === 'string' && typeof row.error === 'string') {
      return `${row.field}: ${normalizeRowErrorString(row.error)}`
    }
  }
  const summarized = errors
    .slice(0, 8)
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const row = item as Record<string, unknown>
      if (typeof row.error === 'string') return normalizeRowErrorString(row.error)
      return ''
    })
    .filter(Boolean)
  return summarized.length ? summarized.join('; ') : null
}

function extractNestedErrorsObject(errorsObj: Record<string, unknown>): string | null {
  if (typeof errorsObj.detail === 'string') return errorsObj.detail.trim()
  const field = firstSerializerFieldErrors(errorsObj, new Set(['detail']))
  return field
}

/** First DRF-style field map: { email: ["..."], population: ["..."] } */
function firstSerializerFieldErrors(
  obj: Record<string, unknown>,
  extraSkip = new Set<string>(),
): string | null {
  const skip = new Set([...ROOT_SKIP, ...extraSkip, 'non_field_errors'])
  for (const [key, val] of Object.entries(obj)) {
    if (skip.has(key)) continue
    if (Array.isArray(val) && val.length > 0) {
      const parts = val.map((x) => String(x)).filter(Boolean)
      if (parts.length) return `${key}: ${parts.join(', ')}`
    }
    if (typeof val === 'string' && val.trim()) return `${key}: ${val.trim()}`
  }
  return null
}

export interface ExtractApiMessageOptions {
  fallback?: string
  httpStatus?: number
}

/**
 * Extract a human-readable error string from a parsed JSON error body.
 */
export function extractApiErrorMessage(
  data: unknown,
  options?: ExtractApiMessageOptions,
): string {
  const fallback =
    options?.fallback ??
    (options?.httpStatus != null ? `HTTP ${options.httpStatus} error` : 'An error occurred')

  if (data == null) return fallback

  if (typeof data === 'string') {
    const t = data.trim()
    return t.length ? t : fallback
  }

  if (typeof data !== 'object') return fallback

  const d = data as Record<string, unknown>

  const msg =
    trimStr(d.message) ??
    trimStr(d.detail) ??
    trimStr(d.error)

  let base: string | null = msg

  if (!base && Array.isArray(d.errors) && d.errors.length > 0) {
    base = firstErrorsArrayMessage(d.errors as unknown[])
  }

  if (!base && d.errors && typeof d.errors === 'object' && !Array.isArray(d.errors)) {
    base = extractNestedErrorsObject(d.errors as Record<string, unknown>)
  }

  if (!base && Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
    base = (d.non_field_errors as unknown[]).map(String).join(', ')
  }

  if (!base) {
    base = firstSerializerFieldErrors(d)
  }

  if (!base) return fallback

  const hint = trimStr(d.hint)
  if (hint) return `${base} · ${hint}`
  return base
}

/**
 * Success payloads often use `{ "message": "..." }`.
 */
export function extractApiSuccessMessage(data: unknown, fallback?: string): string | undefined {
  if (data == null) return fallback

  if (typeof data === 'object' && data !== null) {
    const m = trimStr((data as Record<string, unknown>).message)
    if (m) return m
  }

  return fallback
}

/**
 * Normalize any thrown API error for toasts — handles axios interceptor rejects
 * `{ message, status, data }`, raw `AxiosError`, or `Error`.
 */
export function getApiErrorDescription(err: unknown, fallback = 'An error occurred'): string {
  if (err == null) return fallback

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>

    const nestedData = e.data
    if (nestedData != null) {
      const fromData = extractApiErrorMessage(nestedData, { fallback: '' })
      if (fromData && fromData !== '') return fromData
    }

    const response = e.response as { data?: unknown } | undefined
    if (response?.data != null) {
      const fromResp = extractApiErrorMessage(response.data, { fallback: '' })
      if (fromResp && fromResp !== '') return fromResp
    }

    if (typeof e.message === 'string' && e.message.trim()) {
      return e.message.trim()
    }
  }

  if (err instanceof Error && err.message.trim()) return err.message.trim()

  return fallback
}
