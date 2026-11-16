import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'

import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

/** Cookie bahasa admin milik Payload (`<cookiePrefix>-lng`). */
const ADMIN_LANG_COOKIE = 'payload-lng'

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Admin berbahasa Indonesia secara default (bukan mengikuti bahasa browser).
    // Pilihan pengguna di sidebar/halaman akun disimpan di cookie yang sama dan dihormati.
    if (request.cookies.has(ADMIN_LANG_COOKIE)) return NextResponse.next()
    const headers = new Headers(request.headers)
    const cookie = headers.get('cookie')
    headers.set('cookie', cookie ? `${cookie}; ${ADMIN_LANG_COOKIE}=id` : `${ADMIN_LANG_COOKIE}=id`)
    const response = NextResponse.next({ request: { headers } })
    response.cookies.set(ADMIN_LANG_COOKIE, 'id', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }
  return intl(request)
}

export const config = {
  // Admin (bahasa default) + situs publik. Lewati API, preview, aset Next, dan file statis.
  matcher: ['/admin/:path*', '/((?!admin|api|next|_next|_vercel|brand|media|fonts|.*\\..*).*)'],
}
