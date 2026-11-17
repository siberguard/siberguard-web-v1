'use client'

import { useRowLabel } from '@payloadcms/ui'

import { ContentIcon } from '@/components/Icon'

/** Label baris item berikon (mis. daftar keunggulan): nomor, ikon terpilih, dan judul. */
export const IconRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ icon?: string | null; title?: string | null }>()
  const title = (data?.title ?? '').replace(/\s+/g, ' ').trim()

  return (
    <span className="smd-rowlabel">
      <span className="smd-rowlabel__num">{String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>
      {data?.icon ? (
        <span className="smd-rowlabel__icon" aria-hidden="true">
          <ContentIcon name={data.icon} />
        </span>
      ) : null}
      {title && <span className="smd-rowlabel__title">{title}</span>}
    </span>
  )
}
