import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/** Aktifkan mode draft untuk live preview admin. Hanya untuk user yang sudah login. */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return new Response('Unauthorized', { status: 401 })

  const path = new URL(request.url).searchParams.get('path') ?? '/'
  // Hanya path internal — cegah open redirect.
  if (!path.startsWith('/') || path.startsWith('//'))
    return new Response('Bad path', { status: 400 })

  ;(await draftMode()).enable()
  redirect(path)
}
