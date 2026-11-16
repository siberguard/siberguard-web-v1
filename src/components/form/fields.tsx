'use client'

import type { ReactNode } from 'react'

import {
  OTHER_VALUE,
  otherKey,
  type AnswerValue,
  type Answers,
  type PublicField,
} from '@/lib/forms/types'

export type FieldLabels = { optional: string; chooseUpTo: string; otherPlaceholder: string }

type FieldProps = {
  field: PublicField
  answers: Answers
  errors: Record<string, string>
  idPrefix: string
  labels: FieldLabels
  onChange: (name: string, value: AnswerValue | undefined) => void
}

export const fieldId = (prefix: string, name: string) => `${prefix}-${name}`

function Label({
  htmlFor,
  field,
  labels,
  as = 'label',
}: {
  htmlFor?: string
  field: PublicField
  labels: FieldLabels
  as?: 'label' | 'legend'
}) {
  const content = (
    <>
      {field.label}
      {!field.required && <span className="field__optional"> ({labels.optional})</span>}
    </>
  )
  return as === 'legend' ? (
    <legend className="field__label">{content}</legend>
  ) : (
    <label className="field__label" htmlFor={htmlFor}>
      {content}
    </label>
  )
}

function Help({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p className="field__help" id={id}>
      {text}
    </p>
  ) : null
}

function ErrorText({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p className="field__error" id={id}>
      {text}
    </p>
  ) : null
}

const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(' ') || undefined

/** Opsi pendek ditata dua kolom; pertanyaan dengan opsi panjang tetap satu kolom. */
const compactOptions = (field: PublicField) =>
  (field.options ?? []).length >= 3 && (field.options ?? []).every((o) => o.label.length <= 28)

function TextLike({ field, answers, errors, idPrefix, labels, onChange }: FieldProps) {
  const id = fieldId(idPrefix, field.name)
  const err = errors[field.name]
  const value = typeof answers[field.name] === 'string' ? (answers[field.name] as string) : ''
  const common = {
    id,
    name: field.name,
    value,
    placeholder: field.placeholder,
    'aria-invalid': err ? true : undefined,
    'aria-describedby': describedBy(field.helpText && `${id}-help`, err && `${id}-err`),
    'aria-required': field.required || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field.name, e.target.value),
  }
  let control: ReactNode
  if (field.type === 'textareaInput') control = <textarea {...common} rows={4} maxLength={2000} />
  else if (field.type === 'emailInput')
    control = (
      <input {...common} type="email" inputMode="email" autoComplete="email" maxLength={200} />
    )
  else if (field.type === 'phoneInput')
    control = <input {...common} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} />
  else
    control = (
      <input
        {...common}
        type="text"
        maxLength={200}
        autoComplete={field.name.includes('perusahaan') ? 'organization' : 'off'}
      />
    )

  return (
    <div className={`field${err ? ' has-error' : ''}`}>
      <Label htmlFor={id} field={field} labels={labels} />
      <Help id={`${id}-help`} text={field.helpText} />
      {control}
      <ErrorText id={`${id}-err`} text={err} />
    </div>
  )
}

function SelectField({ field, answers, errors, idPrefix, labels, onChange }: FieldProps) {
  const id = fieldId(idPrefix, field.name)
  const err = errors[field.name]
  return (
    <div className={`field${err ? ' has-error' : ''}`}>
      <Label htmlFor={id} field={field} labels={labels} />
      <Help id={`${id}-help`} text={field.helpText} />
      <select
        id={id}
        name={field.name}
        value={(answers[field.name] as string) ?? ''}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy(field.helpText && `${id}-help`, err && `${id}-err`)}
        onChange={(e) => onChange(field.name, e.target.value)}
      >
        <option value="">{field.placeholder ?? '—'}</option>
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText id={`${id}-err`} text={err} />
    </div>
  )
}

function ChoiceField({ field, answers, errors, idPrefix, labels, onChange }: FieldProps) {
  const id = fieldId(idPrefix, field.name)
  const err = errors[field.name]
  const otherErr = errors[otherKey(field.name)]
  const multi = field.type === 'multiChoice'
  const selected: string[] = multi
    ? ((answers[field.name] as string[] | undefined) ?? [])
    : answers[field.name]
      ? [answers[field.name] as string]
      : []
  const max = multi ? field.maxSelections : undefined
  const atMax = Boolean(max && selected.length >= max)
  const options = [...(field.options ?? [])]
  if (multi && field.allowOther)
    options.push({ value: OTHER_VALUE, label: field.otherLabel || 'Lainnya' })

  const toggle = (value: string) => {
    if (!multi) return onChange(field.name, value)
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(field.name, next)
    if (value === OTHER_VALUE && !next.includes(OTHER_VALUE))
      onChange(otherKey(field.name), undefined)
  }

  const hint = max ? labels.chooseUpTo.replace('{max}', String(max)) : undefined

  return (
    <fieldset
      className={`field field--choice${err ? ' has-error' : ''}`}
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy((field.helpText || hint) && `${id}-help`, err && `${id}-err`)}
    >
      <Label field={field} labels={labels} as="legend" />
      {(field.helpText || hint) && (
        <p className="field__help" id={`${id}-help`}>
          {[field.helpText, hint].filter(Boolean).join(' · ')}
          {max ? (
            <span className="field__count">
              {' '}
              ({selected.length}/{max})
            </span>
          ) : null}
        </p>
      )}
      <div className={`options${compactOptions(field) ? ' options--grid' : ''}`}>
        {options.map((o) => {
          const checked = selected.includes(o.value)
          const disabled = multi && !checked && atMax
          return (
            <label
              key={o.value}
              className={`option${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={field.name}
                value={o.value}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(o.value)}
              />
              <span className="option__mark" aria-hidden="true" />
              <span className="option__label">{o.label}</span>
            </label>
          )
        })}
      </div>
      {multi && field.allowOther && selected.includes(OTHER_VALUE) && (
        <div className={`field field--other${otherErr ? ' has-error' : ''}`}>
          <label className="sr-only" htmlFor={`${id}-other`}>
            {field.otherLabel || 'Lainnya'}
          </label>
          <input
            id={`${id}-other`}
            type="text"
            maxLength={200}
            placeholder={labels.otherPlaceholder}
            value={(answers[otherKey(field.name)] as string) ?? ''}
            aria-invalid={otherErr ? true : undefined}
            aria-describedby={otherErr ? `${id}-other-err` : undefined}
            onChange={(e) => onChange(otherKey(field.name), e.target.value)}
          />
          <ErrorText id={`${id}-other-err`} text={otherErr} />
        </div>
      )}
      <ErrorText id={`${id}-err`} text={err} />
    </fieldset>
  )
}

function ConsentField({ field, answers, errors, idPrefix, onChange }: FieldProps) {
  const id = fieldId(idPrefix, field.name)
  const err = errors[field.name]
  return (
    <div className={`field field--consent${err ? ' has-error' : ''}`}>
      <label
        className={`option option--consent${answers[field.name] === true ? ' is-checked' : ''}`}
        htmlFor={id}
      >
        <input
          id={id}
          type="checkbox"
          name={field.name}
          checked={answers[field.name] === true}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
        <span className="option__mark option__mark--box" aria-hidden="true" />
        <span className="option__label">{field.label}</span>
      </label>
      <ErrorText id={`${id}-err`} text={err} />
    </div>
  )
}

export function FormField(props: FieldProps) {
  switch (props.field.type) {
    case 'singleChoice':
    case 'multiChoice':
      return <ChoiceField {...props} />
    case 'selectInput':
      return <SelectField {...props} />
    case 'consent':
      return <ConsentField {...props} />
    default:
      return <TextLike {...props} />
  }
}
