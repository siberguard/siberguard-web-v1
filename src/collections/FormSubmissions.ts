import type { CollectionConfig } from 'payload'

import { canAccessLeads, isAdmin } from '@/access/roles'
import { exportSubmissionsEndpoint } from '@/endpoints/exportSubmissions'

export const LEAD_TIERS = [
  { label: 'Hot', value: 'hot' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cold', value: 'cold' },
  { label: 'Survei (tanpa kontak)', value: 'survey' },
]

export const LEAD_STATUSES = [
  { label: 'Baru', value: 'new' },
  { label: 'Dihubungi', value: 'contacted' },
  { label: 'Terkualifikasi', value: 'qualified' },
  { label: 'Ikut POC', value: 'poc' },
  { label: 'Berlangganan', value: 'customer' },
  { label: 'Tidak lanjut', value: 'closed' },
]

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Lead', plural: 'Leads' },
  admin: {
    group: 'Leads',
    useAsTitle: 'companyName',
    defaultColumns: ['createdAt', 'companyName', 'picName', 'tier', 'score', 'status'],
    listSearchableFields: ['companyName', 'picName', 'email', 'whatsapp', 'industry'],
    description:
      'Kiriman kuesioner dari website. Berisi data pribadi — akses terbatas untuk admin & sales.',
  },
  access: {
    // Kiriman hanya dibuat oleh endpoint /api/forms/:id/submit (Local API).
    create: () => false,
    read: canAccessLeads,
    update: canAccessLeads,
    delete: isAdmin,
  },
  endpoints: [exportSubmissionsEndpoint],
  hooks: {
    beforeChange: [
      ({ data, req, originalDoc }) => {
        // Isi penulis & waktu catatan baru secara otomatis.
        // Update parsial tanpa `notes` (mis. hanya emailStatus) tidak boleh menyentuh catatan.
        if (!Array.isArray(data.notes)) return data
        const before = new Set(((originalDoc?.notes as { id?: string }[]) ?? []).map((n) => n.id))
        data.notes = ((data.notes as Record<string, unknown>[]) ?? []).map((note) =>
          note.id && before.has(note.id as string)
            ? note
            : {
                ...note,
                author: note.author ?? req.user?.id,
                createdAt: note.createdAt ?? new Date().toISOString(),
              },
        )
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'companyName',
          type: 'text',
          label: 'Perusahaan',
          index: true,
          admin: { readOnly: true, width: '34%' },
        },
        {
          name: 'industry',
          type: 'text',
          label: 'Bidang usaha',
          admin: { readOnly: true, width: '33%' },
        },
        { name: 'picName', type: 'text', label: 'PIC', admin: { readOnly: true, width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          index: true,
          admin: { readOnly: true, width: '34%' },
        },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp',
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'consent',
          type: 'checkbox',
          label: 'Bersedia dihubungi',
          admin: { readOnly: true, width: '33%' },
        },
      ],
    },
    {
      name: 'answersView',
      type: 'ui',
      admin: { components: { Field: '@/admin/components/SubmissionAnswers#SubmissionAnswers' } },
    },
    {
      type: 'collapsible',
      label: 'Data mentah & atribusi',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'snapshot',
          type: 'json',
          label: 'Snapshot pertanyaan & jawaban',
          admin: {
            readOnly: true,
            description: 'Salinan label pertanyaan/jawaban saat formulir dikirim.',
          },
        },
        { name: 'answers', type: 'json', label: 'Nilai jawaban', admin: { readOnly: true } },
        {
          name: 'attribution',
          type: 'group',
          label: 'Atribusi kunjungan',
          admin: { readOnly: true },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'utmSource', type: 'text', label: 'utm_source', admin: { width: '33%' } },
                { name: 'utmMedium', type: 'text', label: 'utm_medium', admin: { width: '33%' } },
                {
                  name: 'utmCampaign',
                  type: 'text',
                  label: 'utm_campaign',
                  admin: { width: '34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'referrer', type: 'text', label: 'Referrer', admin: { width: '50%' } },
                {
                  name: 'landingPath',
                  type: 'text',
                  label: 'Halaman masuk',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'country', type: 'text', label: 'Negara', admin: { width: '25%' } },
                { name: 'city', type: 'text', label: 'Kota', admin: { width: '25%' } },
                { name: 'device', type: 'text', label: 'Perangkat', admin: { width: '25%' } },
                {
                  name: 'sessionId',
                  type: 'text',
                  label: 'Session ID',
                  index: true,
                  admin: { width: '25%' },
                },
              ],
            },
          ],
        },
      ],
    },
    // --- Sidebar: penilaian & pipeline ---
    {
      name: 'tier',
      type: 'select',
      label: 'Tier',
      options: LEAD_TIERS,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: { Cell: '@/admin/components/TierCell#TierCell' },
      },
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'score', type: 'number', label: 'Skor', admin: { readOnly: true, width: '50%' } },
        {
          name: 'maxScore',
          type: 'number',
          label: 'Skor maks',
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: LEAD_STATUSES,
      defaultValue: 'new',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      label: 'Ditangani oleh',
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'array',
      label: 'Catatan tindak lanjut',
      labels: { singular: 'Catatan', plural: 'Catatan' },
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        { name: 'text', type: 'textarea', label: 'Catatan', required: true },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          label: 'Oleh',
          admin: { readOnly: true },
        },
        {
          name: 'createdAt',
          type: 'date',
          label: 'Waktu',
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Info teknis',
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        {
          name: 'form',
          type: 'relationship',
          relationTo: 'forms',
          label: 'Formulir',
          admin: { readOnly: true },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'formVersion',
              type: 'number',
              label: 'Versi form',
              admin: { readOnly: true, width: '50%' },
            },
            {
              name: 'locale',
              type: 'select',
              label: 'Bahasa',
              options: [
                { label: 'Indonesia', value: 'id' },
                { label: 'English', value: 'en' },
              ],
              admin: { readOnly: true, width: '50%' },
            },
          ],
        },
        {
          name: 'emailStatus',
          type: 'select',
          label: 'Email notifikasi',
          options: [
            { label: 'Terkirim', value: 'sent' },
            { label: 'Gagal', value: 'failed' },
            { label: 'Tidak dikirim', value: 'skipped' },
          ],
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
