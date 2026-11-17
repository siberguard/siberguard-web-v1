'use client'

import { getTranslation } from '@payloadcms/translations'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  fieldBaseClass,
  ReactSelect,
  type ReactSelectOption,
  useField,
  useTranslation,
} from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import { type CSSProperties, useCallback, useMemo } from 'react'
import { components, type OptionProps, type SingleValueProps } from 'react-select'

import { ContentIcon } from '@/components/Icon'

type IconOption = { label: string; value: string }

/** Pilihan ikon: kotak ikon + nama di menu berbentuk grid. */
function IconTile(props: OptionProps<IconOption, false>) {
  const { data } = props
  return (
    <components.Option {...props} className="smd-iconselect__option">
      <span className="smd-iconselect__glyph" aria-hidden="true">
        <ContentIcon name={data.value} />
      </span>
      <span className="smd-iconselect__name">{data.label}</span>
    </components.Option>
  )
}

/** Nilai terpilih: pratinjau ikon di samping namanya. */
function IconValue(props: SingleValueProps<IconOption, false>) {
  const { data } = props
  return (
    <components.SingleValue
      {...props}
      className="react-select--single-value smd-iconselect__value"
    >
      <span className="smd-iconselect__preview" aria-hidden="true">
        <ContentIcon name={data.value} />
      </span>
      <span className="smd-iconselect__value-label">{data.label}</span>
    </components.SingleValue>
  )
}

const selectComponents = { Option: IconTile, SingleValue: IconValue }

/**
 * Pengganti dropdown teks untuk field ikon: editor melihat bentuk ikon saat memilih.
 * Tetap memakai select Payload (pencarian, keyboard, validasi), hanya tampilannya diganti.
 */
export const IconSelectField: SelectFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
  validate,
}) => {
  const { i18n } = useTranslation()
  const { label, localized, required, options: rawOptions = [], admin } = field
  const en = i18n.language === 'en'

  const options = useMemo<IconOption[]>(
    () =>
      rawOptions.map((o) =>
        typeof o === 'string'
          ? { label: o, value: o }
          : { label: getTranslation(o.label, i18n) as string, value: o.value },
      ),
    [rawOptions, i18n],
  )

  const memoizedValidate = useCallback(
    (value: unknown, validationOptions: Record<string, unknown>) =>
      typeof validate === 'function'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate(value as any, { ...validationOptions, hasMany: false, options, required } as any)
        : true,
    [validate, options, required],
  )

  const { path, value, setValue, showError, disabled } = useField<string | null>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const selected = options.find((o) => o.value === value) ?? null
  const isReadOnly = Boolean(readOnly || disabled)

  return (
    <div
      className={[fieldBaseClass, 'select', 'smd-iconselect', showError && 'error', isReadOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      // Sama dengan mergeFieldStyles Payload (tidak diekspor): lebar kolom dalam row.
      style={
        {
          ...admin?.style,
          ...(admin?.width ? { '--field-width': admin.width } : { flex: '1 1 auto' }),
        } as CSSProperties
      }
    >
      <FieldLabel label={label} localized={localized} path={path} required={required} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} showError={showError} />
        <ReactSelect
          components={selectComponents}
          // Diteruskan ke react-select: cukup tinggi agar seluruh grid ikon (4×4) terlihat.
          {...({ maxMenuHeight: 400 } as object)}
          disabled={isReadOnly}
          isClearable={!required}
          noOptionsMessage={() => (en ? 'No matching icon' : 'Ikon tidak ditemukan')}
          onChange={(option) => {
            if (isReadOnly) return
            const next = option && !Array.isArray(option) ? (option as ReactSelectOption).value : null
            setValue((next as string | null) ?? null)
          }}
          options={options}
          placeholder={en ? 'Choose an icon…' : 'Pilih ikon…'}
          showError={showError}
          // null (bukan undefined) agar select tetap terkontrol setelah nilai dihapus.
          value={selected as unknown as ReactSelectOption}
        />
      </div>
      <FieldDescription description={admin?.description} path={path} />
    </div>
  )
}
