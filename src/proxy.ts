import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Lewati admin Payload, API, preview, aset Next, dan file statis (yang mengandung titik).
  matcher: ['/((?!admin|api|next|_next|_vercel|brand|media|.*\\..*).*)'],
}
