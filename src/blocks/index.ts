import type { Block } from 'payload'

import { DeployAgent } from './DeployAgent'
import { Faq } from './Faq'
import { FeatureGrid } from './FeatureGrid'
import { FormSection } from './FormSection'
import { Hero } from './Hero'
import { CtaBanner, LogoStrip, MediaSplit, RichText } from './Misc'
import { Pricing } from './Pricing'
import { ProcessFlow } from './ProcessFlow'
import { ServiceLevel, Challenges, Coverage } from './ServiceInfo'
import { Services } from './Services'

const rawBlocks = [
  Hero,
  Challenges,
  FeatureGrid,
  ProcessFlow,
  Coverage,
  Services,
  DeployAgent,
  Pricing,
  ServiceLevel,
  Faq,

  FormSection,
  MediaSplit,
  LogoStrip,
  CtaBanner,
  RichText,
]

/** Semua section memakai label baris yang menampilkan judul & anchor (bukan "Tanpa Judul"). */
export const withRowLabel = (block: Block): Block => ({
  ...block,
  admin: {
    ...block.admin,
    components: {
      ...block.admin?.components,
      Label: '@/admin/components/BlockRowLabel#BlockRowLabel',
    },
  },
})

export const pageBlocks = rawBlocks.map(withRowLabel)
