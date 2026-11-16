/**
 * Turunan aset brand dari master public/brand/logo.svg.
 *
 *   npx tsx scripts/brand/export.ts
 *
 * 1. Optimasi master dengan SVGO konservatif (presisi 2 desimal, tanpa
 *    konversi arc/kurva-ke-garis/quadratic, tanpa merge path, id dipertahankan),
 *    lalu verifikasi render sebelum vs sesudah identik (8x).
 * 2. Varian SVG diturunkan lewat operasi string dari master — data path
 *    dijamin identik:
 *      logo-inverse.svg  wordmark navy -> putih + lapisan putih di belakang perisai (latar gelap)
 *      logo-mark.svg     hanya grup #mark, viewBox dipotong ke perisai
 *      icon.svg          mark dalam viewBox persegi + padding, transparan
 * 3. Raster: favicon.ico (16/32/48), apple-touch-icon.png (180),
 *    logo@1x/@2x/@3x.png, logo-inverse@2x.png, og-default.png (1200x630).
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { optimize } from 'svgo'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const BRAND = path.join(ROOT, 'public/brand')
const MASTER = path.join(BRAND, 'logo.svg')
const RED = '#d01f2e'

function render(svg: string, width: number, background?: string) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: background ?? 'rgba(0,0,0,0)',
  })
    .render()
    .asPng()
}

async function raw(png: Buffer) {
  const { data } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return data
}

function optimizeMaster(svg: string) {
  return optimize(svg, {
    multipass: false,
    js2svg: { pretty: false },
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeEditorsNSData',
      'cleanupAttrs',
      { name: 'cleanupNumericValues', params: { floatPrecision: 3 } },
      { name: 'convertColors', params: { shorthex: true, names2hex: true, rgb2hex: true } },
      'removeUselessDefs',
      'removeEmptyAttrs',
      'removeEmptyContainers',
      {
        name: 'convertPathData',
        params: {
          floatPrecision: 2,
          transformPrecision: 5,
          applyTransforms: false,
          makeArcs: false as unknown as undefined,
          straightCurves: false,
          convertToQ: false,
          convertToZ: false,
          curveSmoothShorthands: false,
          removeUseless: false,
          smartArcRounding: false,
          lineShorthands: true,
          collapseRepeated: true,
          utilizeAbsolute: true,
        },
      },
    ],
  }).data
}

/** Ganti atribut fill pada <path id="..."> tertentu, path lain tak tersentuh. */
function recolor(svg: string, ids: string[], fill: string) {
  let out = svg
  for (const id of ids) {
    const re = new RegExp(`(<path[^>]*\\bid="${id}"[^>]*?)\\sfill="[^"]*"`)
    if (!re.test(out)) {
      // atribut bisa berada sebelum id
      const re2 = new RegExp(`<path([^>]*?)\\sfill="[^"]*"([^>]*\\bid="${id}")`)
      if (!re2.test(out)) throw new Error(`path #${id} tidak ditemukan`)
      out = out.replace(re2, `<path$1 fill="${fill}"$2`)
    } else {
      out = out.replace(re, `$1 fill="${fill}"`)
    }
  }
  return out
}

function extractGroup(svg: string, id: string) {
  const start = svg.indexOf(`<g id="${id}"`)
  if (start < 0) throw new Error(`grup #${id} tidak ditemukan`)
  // cari </g> penutup yang seimbang
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

/** Bbox konservatif (titik akhir + titik kontrol) dari semua path absolut/relatif. */
function bboxOfGroup(group: string) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const m of group.matchAll(/\sd="([^"]+)"/g)) {
    const toks = m[1].match(/[MmLlHhVvCcSsQqTtZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? []
    let x = 0,
      y = 0,
      sx = 0,
      sy = 0,
      cmd = 'M'
    let i = 0
    const num = () => parseFloat(toks[i++])
    const add = (px: number, py: number) => {
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    }
    while (i < toks.length) {
      if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++]
      const rel = cmd === cmd.toLowerCase()
      switch (cmd.toUpperCase()) {
        case 'M':
        case 'L': {
          const nx = num() + (rel ? x : 0)
          const ny = num() + (rel ? y : 0)
          x = nx
          y = ny
          if (cmd.toUpperCase() === 'M') {
            sx = x
            sy = y
            cmd = rel ? 'l' : 'L'
          }
          add(x, y)
          break
        }
        case 'H':
          x = num() + (rel ? x : 0)
          add(x, y)
          break
        case 'V':
          y = num() + (rel ? y : 0)
          add(x, y)
          break
        case 'C': {
          const pts = [num(), num(), num(), num(), num(), num()]
          for (let k = 0; k < 6; k += 2) add(pts[k] + (rel ? x : 0), pts[k + 1] + (rel ? y : 0))
          x = pts[4] + (rel ? x : 0)
          y = pts[5] + (rel ? y : 0)
          break
        }
        case 'Z':
          x = sx
          y = sy
          break
        default:
          throw new Error(`perintah path tak terduga: ${cmd}`)
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

function svgRoot(viewBox: string, w: number, h: number, inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${inner}</svg>`
}

function defsOf(svg: string) {
  return svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
}

function titleOf(svg: string) {
  return svg.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Merdeka</title>'
}

/** Hanya gradien yang dipakai di potongan svg ini. */
function pruneDefs(defs: string, body: string) {
  const used = new Set([...body.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]))
  return defs.replace(/<linearGradient\b[\s\S]*?<\/linearGradient>/g, (g) => {
    const id = g.match(/\bid="([^"]+)"/)?.[1]
    return id && used.has(id) ? g : ''
  })
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
    e.writeUInt8(0, 2) // palet
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4) // planes
    e.writeUInt16LE(32, 6) // bpp
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(e)
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

/**
 * Lapisan putih di belakang mark untuk latar gelap. Di PNG asli, elang & celah perisai
 * adalah ruang kosong (transparan) yang di atas putih terbaca putih. Lapisan ini
 * meniru tampilan "di atas putih" tanpa mengubah satu pun path logo:
 * siluet = convex hull dari render mark 8x, dirapatkan 0.6 unit ke dalam.
 */
async function markUnderlay(svg: string) {
  const S = 8
  const markOnlySvg = svg.replace(extractGroup(svg, 'wordmark'), '')
  const png = render(markOnlySvg, 402 * S)
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pts: [number, number][] = []
  for (let y = 0; y < info.height; y++) {
    let minX = -1
    let maxX = -1
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        if (minX < 0) minX = x
        maxX = x
      }
    }
    if (minX >= 0) pts.push([minX, y], [maxX + 1, y], [minX, y + 1], [maxX + 1, y + 1])
  }
  // Andrew monotone chain
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: [number, number][]) => {
    const h: [number, number][] = []
    for (const p of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
      h.push(p)
    }
    h.pop()
    return h
  }
  const hull = [...half(pts), ...half([...pts].reverse())]
  const cx = hull.reduce((a, p) => a + p[0], 0) / hull.length
  const cy = hull.reduce((a, p) => a + p[1], 0) / hull.length
  const inset = 0.6 * S
  const r2 = (v: number) => Math.round(v * 100) / 100
  const d = hull
    .map(([x, y], i) => {
      const len = Math.hypot(x - cx, y - cy) || 1
      const nx = (x - ((x - cx) / len) * inset) / S
      const ny = (y - ((y - cy) / len) * inset) / S
      return `${i === 0 ? 'M' : 'L'}${r2(nx)} ${r2(ny)}`
    })
    .join('')
  return `<path id="mark-underlay" fill="#fff" d="${d}Z"/>`
}

const withUnderlay = (svg: string, underlay: string) =>
  svg.replace(/(<g id="mark"[^>]*>)/, `$1${underlay}`)

async function main() {
  // 1) optimasi master + verifikasi bentuk tak berubah
  const before = fs.readFileSync(MASTER, 'utf8')
  const optimized = optimizeMaster(before)
  const [a, b] = await Promise.all([raw(render(before, 402 * 8)), raw(render(optimized, 402 * 8))])
  let bad = 0
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2]),
      Math.abs(a[i + 3] - b[i + 3]),
    )
    if (d > 32) bad++
  }
  const badPct = (bad / (a.length / 4)) * 100
  if (badPct > 0.01) throw new Error(`optimasi SVGO mengubah render (${badPct.toFixed(4)}% piksel)`)
  fs.writeFileSync(MASTER, optimized + '\n')
  const svg = optimized
  console.log(
    `logo.svg            ${before.length} -> ${optimized.length} byte (render 8x: ${badPct.toFixed(4)}% piksel beda >32)`,
  )

  // 2) varian SVG
  const underlay = await markUnderlay(svg)
  const inverse = withUnderlay(recolor(svg, ['wordmark-m', 'wordmark-erdeka'], '#fff'), underlay)
  fs.writeFileSync(path.join(BRAND, 'logo-inverse.svg'), inverse + '\n')

  const mark = extractGroup(svg, 'mark')
  const bb = bboxOfGroup(mark)
  const pad = 0.5
  const mx = Math.floor((bb.minX - pad) * 2) / 2
  const my = Math.floor((bb.minY - pad) * 2) / 2
  const mw = Math.ceil((bb.maxX + pad) * 2) / 2 - mx
  const mh = Math.ceil((bb.maxY + pad) * 2) / 2 - my
  if (mx + mw > 124) throw new Error(`crop mark menyentuh wordmark (x maks ${mx + mw})`)
  const markDefs = pruneDefs(defsOf(svg), mark)
  const markSvg = svgRoot(
    `${mx} ${my} ${mw} ${mh}`,
    Math.round(mw),
    Math.round(mh),
    titleOf(svg) + markDefs + mark,
  )
  fs.writeFileSync(path.join(BRAND, 'logo-mark.svg'), markSvg + '\n')

  const side = Math.max(mw, mh) * 1.08
  const ix = mx - (side - mw) / 2
  const iy = my - (side - mh) / 2
  const r = (v: number) => Math.round(v * 100) / 100
  // Ikon tab/aplikasi bisa tampil di latar gelap → ikut memakai lapisan putih.
  const iconSvg = svgRoot(
    `${r(ix)} ${r(iy)} ${r(side)} ${r(side)}`,
    512,
    512,
    titleOf(svg) + markDefs + withUnderlay(mark, underlay),
  )
  fs.writeFileSync(path.join(BRAND, 'icon.svg'), iconSvg + '\n')

  // 3) raster
  const ico = icoFromPngs(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await sharp(render(iconSvg, size)).png().toBuffer(),
      })),
    ),
  )
  fs.writeFileSync(path.join(BRAND, 'favicon.ico'), ico)

  // apple-touch-icon: mark di atas putih, padding ~14%
  const inner = Math.round(180 * 0.72)
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
    .png()
    .toFile(path.join(BRAND, 'apple-touch-icon.png'))

  for (const k of [1, 2, 3]) {
    fs.writeFileSync(path.join(BRAND, `logo@${k}x.png`), render(svg, 402 * k))
  }
  fs.writeFileSync(path.join(BRAND, 'logo-inverse@2x.png'), render(inverse, 402 * 2))

  // OG default 1200x630
  const ogLogo = render(svg, 600)
  const ogMeta = await sharp(ogLogo).metadata()
  const bar = await sharp({ create: { width: 1200, height: 8, channels: 4, background: RED } })
    .png()
    .toBuffer()
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#ffffff' } })
    .composite([
      {
        input: ogLogo,
        left: Math.round((1200 - ogMeta.width!) / 2),
        top: Math.round((630 - 8 - ogMeta.height!) / 2),
      },
      { input: bar, left: 0, top: 622 },
    ])
    .png()
    .toFile(path.join(BRAND, 'og-default.png'))

  for (const f of fs.readdirSync(BRAND).sort()) {
    console.log(`${f.padEnd(20)}${fs.statSync(path.join(BRAND, f)).size} byte`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
