import { L } from '@/i18n/admin'
import type { CollectionConfig } from 'payload'

import { canAccessLeads, isAdmin } from '@/access/roles'
import { exportSubmissionsEndpoint } from '@/endpoints/exportSubmissions'

export const LEAD_TIERS = [
  { label: L('Hot', 'Hot'), value: 'hot' },
  { label: L('Warm', 'Warm'), value: 'warm' },
  { label: L('Cold', 'Cold'), value: 'cold' },
  { label: L('Survei (tanpa kontak)', 'Survey (no contact)'), value: 'survey' },
]

export const LEAD_STATUSES = [
  { label: L('Baru', 'New'), value: 'new' },
  { label: L('Dihubungi', 'Contacted'), value: 'contacted' },
  { label: L('Terkualifikasi', 'Qualified'), value: 'qualified' },
  { label: L('Ikut POC', 'In POC'), value: 'poc' },
  { label: L('Berlangganan', 'Subscribed'), value: 'customer' },
  { label: L('Tidak lanjut', 'Closed'), value: 'closed' },
]

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: L('Lead', 'Lead'), plural: L('Leads', 'Leads') },
  admin: {
    group: L('Leads', 'Leads'),
    useAsTitle: 'companyName',
    defaultColumns: ['createdAt', 'companyName', 'picName', 'tier', 'score', 'status'],
    listSearchableFields: ['companyName', 'picName', 'email', 'whatsapp', 'industry'],
    description: L(
      'Kiriman kuesioner dari website. Berisi data pribadi — akses terbatas untuk admin & sales.',
      'Questionnaire submissions from the website. Contains personal data — restricted to admin & sales.',
    ),
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
          label: L('Perusahaan', 'Company'),
          index: true,
          admin: { readOnly: true, width: '34%' },
        },
        {
          name: 'industry',
          type: 'text',
          label: L('Bidang usaha', 'Industry'),
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'picName',
          type: 'text',
          label: L('PIC', 'Contact'),
          admin: { readOnly: true, width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'text',
          label: L('Email', 'Email'),
          index: true,
          admin: { readOnly: true, width: '34%' },
        },
        {
          name: 'whatsapp',
          type: 'text',
          label: L('WhatsApp', 'WhatsApp'),
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'consent',
          type: 'checkbox',
          label: L('Bersedia dihubungi', 'Agreed to be contacted'),
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
      label: L('Data mentah & atribusi', 'Raw data & attribution'),
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'snapshot',
          type: 'json',
          label: L('Snapshot pertanyaan & jawaban', 'Question & answer snapshot'),
          admin: {
            readOnly: true,
            description: L(
              'Salinan label pertanyaan/jawaban saat formulir dikirim.',
              'Copy of question/answer labels at submission time.',
            ),
          },
        },
        {
          name: 'answers',
          type: 'json',
          label: L('Nilai jawaban', 'Answer values'),
          admin: { readOnly: true },
        },
        {
          name: 'attribution',
          type: 'group',
          label: L('Atribusi kunjungan', 'Visit attribution'),
          admin: { readOnly: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'utmSource',
                  type: 'text',
                  label: L('utm_source', 'utm_source'),
                  admin: { width: '33%' },
                },
                {
                  name: 'utmMedium',
                  type: 'text',
                  label: L('utm_medium', 'utm_medium'),
                  admin: { width: '33%' },
                },
                {
                  name: 'utmCampaign',
                  type: 'text',
                  label: L('utm_campaign', 'utm_campaign'),
                  admin: { width: '34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'referrer',
                  type: 'text',
                  label: L('Referrer', 'Referrer'),
                  admin: { width: '50%' },
                },
                {
                  name: 'landingPath',
                  type: 'text',
                  label: L('Halaman masuk', 'Landing page'),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'country',
                  type: 'text',
                  label: L('Negara', 'Country'),
                  admin: { width: '25%' },
                },
                { name: 'city', type: 'text', label: L('Kota', 'City'), admin: { width: '25%' } },
                {
                  name: 'device',
                  type: 'text',
                  label: L('Perangkat', 'Device'),
                  admin: { width: '25%' },
                },
                {
                  name: 'sessionId',
                  type: 'text',
                  label: L('Session ID', 'Session ID'),
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
      label: L('Tier', 'Tier'),
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
        {
          name: 'score',
          type: 'number',
          label: L('Skor', 'Score'),
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'maxScore',
          type: 'number',
          label: L('Skor maks', 'Max score'),
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: L('Status', 'Status'),
      options: LEAD_STATUSES,
      defaultValue: 'new',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        components: { Cell: '@/admin/components/StatusCell#StatusCell' },
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      label: L('Ditangani oleh', 'Assigned to'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'array',
      label: L('Catatan tindak lanjut', 'Follow-up notes'),
      labels: { singular: L('Catatan', 'Note'), plural: L('Catatan', 'Notes') },
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        { name: 'text', type: 'textarea', label: L('Catatan', 'Note'), required: true },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          label: L('Oleh', 'By'),
          admin: { readOnly: true },
        },
        {
          name: 'createdAt',
          type: 'date',
          label: L('Waktu', 'Time'),
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      type: 'collapsible',
      label: L('Info teknis', 'Technical info'),
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        {
          name: 'form',
          type: 'relationship',
          relationTo: 'forms',
          label: L('Formulir', 'Form'),
          admin: { readOnly: true },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'formVersion',
              type: 'number',
              label: L('Versi form', 'Form version'),
              admin: { readOnly: true, width: '50%' },
            },
            {
              name: 'locale',
              type: 'select',
              label: L('Bahasa', 'Language'),
              options: [
                { label: L('Indonesia', 'Indonesian'), value: 'id' },
                { label: L('English', 'English'), value: 'en' },
              ],
              admin: { readOnly: true, width: '50%' },
            },
          ],
        },
        {
          name: 'emailStatus',
          type: 'select',
          label: L('Email notifikasi', 'Notification email'),
          options: [
            { label: L('Terkirim', 'Sent'), value: 'sent' },
            { label: L('Gagal', 'Failed'), value: 'failed' },
            { label: L('Tidak dikirim', 'Not sent'), value: 'skipped' },
          ],
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
