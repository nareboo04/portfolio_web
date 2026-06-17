import sanitizeHtml from 'sanitize-html'

// Strict: plain text only — strips all tags
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim()
}

// Rich: allow a safe subset (for project descriptions)
export function sanitizeRich(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
    },
  }).trim()
}

// URL: only allow http/https urls
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

// JSON tags array: validate each entry is a plain string
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .filter((t) => typeof t === 'string')
    .map((t) => sanitizeText(t as string))
    .filter(Boolean)
    .slice(0, 20)
}
