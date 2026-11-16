import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Locale } from '@/lib/cms/paths'
import type { Page } from '@/payload-types'

import {
  CtaBanner,
  Faq,
  FeatureGrid,
  LogoStrip,
  MediaSplit,
  Pricing,
  ProcessFlow,
} from './ContentBlocks'
import { HeroBlock } from './HeroBlock'
import { DeployAgent, FormSection, Services } from './InteractiveBlocks'
import { Section } from './Section'

type Block = NonNullable<Page['layout']>[number]

/** Merender section halaman sesuai urutan di CMS; section bertanda "sembunyikan" dilewati. */
export function RenderBlocks({
  blocks,
  locale,
  onHome,
  title,
}: {
  blocks: Block[]
  locale: Locale
  onHome: boolean
  title: string
}) {
  const visible = blocks.filter((b) => !b.hidden)
  // Halaman tanpa hero/form penuh tetap butuh <h1> (mis. halaman legal).
  const needsTitle = !visible.some(
    (b) => b.blockType === 'hero' || (b.blockType === 'formSection' && b.layout === 'full'),
  )

  return (
    <>
      {needsTitle && (
        <div className="page-title">
          <div className="container">
            <h1>{title}</h1>
          </div>
        </div>
      )}
      {visible.map((block) => {
        const key = block.id ?? block.blockType
        switch (block.blockType) {
          case 'hero':
            return <HeroBlock key={key} block={block} locale={locale} onHome={onHome} />
          case 'featureGrid':
            return <FeatureGrid key={key} block={block} />
          case 'processFlow':
            return <ProcessFlow key={key} block={block} />
          case 'services':
            return <Services key={key} block={block} locale={locale} />
          case 'deployAgent':
            return <DeployAgent key={key} block={block} locale={locale} />
          case 'pricing':
            return <Pricing key={key} block={block} onHome={onHome} />
          case 'faq':
            return <Faq key={key} block={block} />
          case 'formSection':
            return <FormSection key={key} block={block} locale={locale} />
          case 'mediaSplit':
            return <MediaSplit key={key} block={block} />
          case 'logoStrip':
            return <LogoStrip key={key} block={block} />
          case 'ctaBanner':
            return <CtaBanner key={key} block={block} onHome={onHome} />
          case 'richText':
            return (
              <Section key={key} anchorId={block.anchorId} background={block.background}>
                <div className="container prose">
                  <RichText data={block.content} />
                </div>
              </Section>
            )
          default:
            return null
        }
      })}
    </>
  )
}
