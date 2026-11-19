/**
 * Turunan aset brand dari master public/brand/logo.svg (hasil trace_logo.py).
 *
 *   pnpm brand:export
 *
 * 1. Varian SVG diturunkan lewat operasi string dari master, sehingga data
 *    path dijamin identik (hanya warna isi yang berubah):
 *      logo-inverse.svg  latar gelap: "Siber" putih, halo & margin stiker disembunyikan
 *      logo-mark.svg     hanya grup #mark (perisai + pita), viewBox dipotong
 *      icon.svg          mark dalam viewBox persegi, tanpa halo & margin stiker (favicon)
 * 2. Raster: favicon.ico (16/32/48), apple-touch-icon.png (180),
 *    logo@1x/@2x/@3x.png, logo-inverse@2x.png, og-default.png (1200x630).
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const BRAND = path.join(ROOT, 'public/brand')
const MASTER = path.join(BRAND, 'logo.svg')
const TAGLINE = path.join(ROOT, 'scripts/brand/og-tagline.json')
/** Lebar logo@1x.png (px); @2x/@3x kelipatannya. */
const BASE_W = 480

function render(svg: string, width: number, background?: string) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: background ?? 'rgba(0,0,0,0)',
  })
    .render()
    .asPng()
}

/** Ganti atribut fill pada elemen ber-id tertentu; elemen lain tak tersentuh. */
function recolor(svg: string, id: string, fill: string) {
  const re = new RegExp(`(<path\\b[^>]*\\bid="${id}"[^>]*?)\\sfill="[^"]*"`)
  if (re.test(svg)) return svg.replace(re, `$1 fill="${fill}"`)
  const re2 = new RegExp(`<path\\b([^>]*?)\\sfill="[^"]*"([^>]*\\bid="${id}")`)
  if (!re2.test(svg)) throw new Error(`path #${id} tidak ditemukan`)
  return svg.replace(re2, `<path$1 fill="${fill}"$2`)
}

function extractGroup(svg: string, id: string) {
  const start = svg.indexOf(`<g id="${id}"`)
  if (start < 0) throw new Error(`grup #${id} tidak ditemukan`)
  let depth = 0
  const re = /<g\b[^>]*>|<\/g>/g
  re.lastIndex = start
  let m: RegExpExecArray | null
  while ((m = re.exec(svg))) {
    depth += m[0] === '</g>' ? -1 : 1
    if (depth === 0) return svg.slice(start, m.index + 4)
  }
  throw new Error(`grup #${id} tidak tertutup`)
}

function viewBoxOf(svg: string) {
  const m = svg.match(/viewBox="([\d.\s-]+)"/)
  if (!m) throw new Error('viewBox tidak ada')
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number)
  return { x, y, w, h }
}

function defsOf(svg: string) {
  return svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
}

function titleOf(svg: string) {
  return svg.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>SiberGuard</title>'
}

/** Hanya definisi (clip, filter, path region) yang dipakai potongan svg ini. */
function pruneDefs(defs: string, body: string) {
  const used = new Set<string>()
  const scan = (s: string) => {
    for (const m of s.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)) {
      const id = m[1] ?? m[2]
      if (used.has(id)) continue
      used.add(id)
      const el = defs.match(new RegExp(`<(\\w+)\\b[^>]*\\bid="${id}"[\\s\\S]*?(?:/>|</\\1>)`))
      if (el) scan(el[0])
    }
  }
  scan(body)
  const inner = defs.replace(/^<defs>|<\/defs>$/g, '')
  const kept = inner.replace(
    /<(clipPath|filter|linearGradient)\b[^>]*\bid="([^"]+)"[\s\S]*?<\/\1>|<path\b[^>]*\bid="([^"]+)"[^>]*\/>/g,
    (el, _tag, id1, id2) => (used.has(id1 ?? id2) ? el : ''),
  )
  return `<defs>${kept}</defs>`
}

/** Bbox piksel dari render (alpha > 8), dalam satuan viewBox. */
async function alphaBBox(svg: string, scale = 2) {
  const vb = viewBoxOf(svg)
  const png = render(svg, Math.round(vb.w * scale))
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
  const k = info.width / vb.w
  return { minX: minX / k, minY: minY / k, maxX: (maxX + 1) / k, maxY: (maxY + 1) / k }
}

function svgRoot(viewBox: string, w: number, h: number, inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${inner}</svg>`
}

function icoFromPngs(pngs: Array<{ size: number; data: Buffer }>) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // tipe: ikon
  header.writeUInt16LE(pngs.length, 4)
  const entries: Buffer[] = []
  let offset = 6 + 16 * pngs.length
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(e)
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

const r2 = (v: number) => Math.round(v * 100) / 100

async function main() {
  const svg = fs.readFileSync(MASTER, 'utf8').trim()
  const vb = viewBoxOf(svg)

  // 1) varian SVG — path identik, hanya fill berubah
  // halo abu + margin putih stiker hanya cocok di latar terang
  const noHalo = (s: string) => recolor(recolor(s, 'halo', 'none'), 'sticker', 'none')
  const inverse = recolor(noHalo(svg), 'wordmark-siber', '#fff')
  fs.writeFileSync(path.join(BRAND, 'logo-inverse.svg'), inverse + '\n')

  const mark = extractGroup(svg, 'mark')
  const markDefs = pruneDefs(defsOf(svg), mark)
  const markProbe = svgRoot(`0 0 ${vb.w} ${vb.h}`, vb.w, vb.h, markDefs + mark)
  const bb = await alphaBBox(markProbe)
  const pad = 2
  const mx = Math.floor(bb.minX - pad)
  const my = Math.floor(bb.minY - pad)
  const mw = Math.ceil(bb.maxX + pad) - mx
  const mh = Math.ceil(bb.maxY + pad) - my
  const markSvg = svgRoot(`${mx} ${my} ${mw} ${mh}`, mw, mh, titleOf(svg) + markDefs + mark)
  fs.writeFileSync(path.join(BRAND, 'logo-mark.svg'), markSvg + '\n')

  // Ikon: persegi; tanpa halo & margin stiker karena tab browser bisa gelap.
  const side = Math.max(mw, mh) * 1.02
  const ix = mx - (side - mw) / 2
  const iy = my - (side - mh) / 2
  const iconSvg = svgRoot(
    `${r2(ix)} ${r2(iy)} ${r2(side)} ${r2(side)}`,
    512,
    512,
    titleOf(svg) + markDefs + noHalo(mark),
  )
  fs.writeFileSync(path.join(BRAND, 'icon.svg'), iconSvg + '\n')

  // 2) raster
  const ico = icoFromPngs(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await sharp(render(iconSvg, size)).png().toBuffer(),
      })),
    ),
  )
  fs.writeFileSync(path.join(BRAND, 'favicon.ico'), ico)

  // apple-touch-icon: mark di atas putih, padding ~12%
  const inner = Math.round(180 * 0.76)
  const markPng = render(markSvg, inner)
  const markMeta = await sharp(markPng).metadata()
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#ffffff' } })
    .composite([
      {
        input: markPng,
        left: Math.round((180 - markMeta.width!) / 2),
        top: Math.round((180 - markMeta.height!) / 2),
      },
    ])
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(path.join(BRAND, 'apple-touch-icon.png'))

  for (const k of [1, 2, 3]) {
    fs.writeFileSync(path.join(BRAND, `logo@${k}x.png`), render(svg, BASE_W * k))
  }
  fs.writeFileSync(path.join(BRAND, 'logo-inverse@2x.png'), render(inverse, BASE_W * 2))

  // OG default 1200x630: logo + tagline (glyph Plus Jakarta Sans sebagai path)
  const ogW = 1200
  const ogH = 630
  const logoW = 860
  const logoH = (logoW * vb.h) / vb.w
  const tag = JSON.parse(fs.readFileSync(TAGLINE, 'utf8')) as {
    advance: number
    unitsPerEm: number
    d: string
  }
  const tagSize = 40
  const tagScale = tagSize / tag.unitsPerEm
  const tagW = tag.advance * tagScale
  const gap = 46
  const blockH = logoH + gap + tagSize
  const top = (ogH - blockH) / 2
  const tagY = top + logoH + gap + tagSize * 0.78
  const logoInner = svg
    .replace(/^<svg\b[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
  const siberFill = svg.match(/id="wordmark-siber" fill="([^"]+)"/)?.[1] ?? '#062661'
  const ogSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ogW} ${ogH}" width="${ogW}" height="${ogH}">` +
    `<rect width="${ogW}" height="${ogH}" fill="#f6f8fc"/>` +
    `<svg x="${r2((ogW - logoW) / 2)}" y="${r2(top)}" width="${logoW}" height="${r2(logoH)}" viewBox="0 0 ${vb.w} ${vb.h}">${logoInner}</svg>` +
    `<path fill="${siberFill}" transform="translate(${r2((ogW - tagW) / 2)} ${r2(tagY)}) scale(${tagScale})" d="${tag.d}"/>` +
    `<rect y="${ogH - 8}" width="${ogW}" height="8" fill="#1d5fe0"/>` +
    `</svg>`
  await sharp(render(ogSvg, ogW, '#f6f8fc'))
    .flatten({ background: '#f6f8fc' })
    .png()
    .toFile(path.join(BRAND, 'og-default.png'))

  console.log(`logo.svg viewBox 0 0 ${vb.w} ${vb.h}; mark ${mx} ${my} ${mw} ${mh}`)
  for (const f of fs.readdirSync(BRAND).sort()) {
    console.log(`${f.padEnd(22)}${fs.statSync(path.join(BRAND, f)).size} byte`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
