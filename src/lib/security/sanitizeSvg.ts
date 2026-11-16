import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

let purifier: ReturnType<typeof createDOMPurify> | null = null

function getPurifier() {
  if (!purifier) {
    const { window } = new JSDOM('')
    purifier = createDOMPurify(window as unknown as Window & typeof globalThis)
  }
  return purifier
}

/**
 * Membersihkan SVG yang diunggah: menghapus <script>, event handler (onload, …),
 * <foreignObject>, dan URL javascript:. SVG bisa membawa XSS bila dibuka langsung.
 */
export function sanitizeSvg(input: string): string {
  return getPurifier().sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'embed', 'object'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus'],
  })
}
