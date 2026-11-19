/**
 * Uji kesamaan logo SVG hasil rekonstruksi terhadap JPEG asli.
 *
 *   pnpm brand:compare
 *
 * - Render public/brand/logo.svg (resvg) pada ukuran viewBox, komposit di atas
 *   putih, bandingkan dengan potongan yang sama dari docs/reference/logo-siberguard.jpg
 *   (posisi dari scripts/brand/logo-trace.json): SSIM + pixelmatch, untuk seluruh
 *   logo, mark (perisai + pita), dan wordmark; juga pada skala tampilan (lebar 480).
 * - Cek "selisih mengelompok": piksel beda yang seluruh 4-tetangganya juga beda.
 * - Tulis gambar tinjauan ke docs/brand-review/ (berdampingan, overlay 50%,
 *   difference) pada 1x, 4x, 8x (4x/8x: potongan perisai & huruf), plus pratinjau
 *   logo-inverse.svg di atas latar gelap situs.
 * - Pastikan logo-inverse.svg & logo-mark.svg memakai data path yang identik.
 *
 * Gerbang lulus: SSIM skala tampilan >= 0,97, SSIM wordmark (ukuran asli) >= 0,97
 * tanpa selisih mengelompok, dan path varian identik. SSIM mark pada ukuran asli
 * hanya informatif: JPEG sumber punya tekstur grunge & tepi lunak yang sengaja
 * tidak ditiru (gradasi halus, tepi tajam).
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import sharp from 'sharp'
import { ssim } from 'ssim.js'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const META = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/brand/logo-trace.json'), 'utf8'),
) as {
  source: string
  origin: [number, number]
  size: [number, number]
  markWidth: number
}
const ORIGINAL = path.join(ROOT, META.source)
const BRAND = path.join(ROOT, 'public/brand')
const REVIEW = path.join(ROOT, 'docs/brand-review')
const [OX, OY] = META.origin
const [W, H] = META.size
const SSIM_MIN = 0.97
const DIFF_LEVEL = 64 // selisih (0-255, kanal maks) yang dianggap "beda"

type RGB = [number, number, number]
const WHITE: RGB = [255, 255, 255]
const DARK_BGS: Array<[string, RGB]> = [
  ['#070e1d', [0x07, 0x0e, 0x1d]],
  ['#0a1631', [0x0a, 0x16, 0x31]],
  ['#081329', [0x08, 0x13, 0x29]],
]

type Img = { data: Uint8ClampedArray; width: number; height: number }

async function load(
  input: Buffer | string,
  crop?: { left: number; top: number; width: number; height: number },
  resize?: [number, number],
) {
  let img = sharp(input).ensureAlpha()
  if (crop) img = img.extract(crop)
  if (resize) img = img.resize(resize[0], resize[1], { kernel: 'lanczos3', fit: 'fill' })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
    width: info.width,
    height: info.height,
  } as Img
}

function renderSvg(svg: string, width: number) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: 'rgba(0,0,0,0)' })
    .render()
    .asPng()
}

function over(img: Img, bg: RGB): Img {
  const src = img.data
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255
    out[i] = Math.round(src[i] * a + bg[0] * (1 - a))
    out[i + 1] = Math.round(src[i + 1] * a + bg[1] * (1 - a))
    out[i + 2] = Math.round(src[i + 2] * a + bg[2] * (1 - a))
    out[i + 3] = 255
  }
  return { ...img, data: out }
}

function sub(img: Img, x0: number, x1: number): Img {
  const w = x1 - x0
  const out = new Uint8ClampedArray(w * img.height * 4)
  for (let y = 0; y < img.height; y++)
    out.set(img.data.subarray((y * img.width + x0) * 4, (y * img.width + x1) * 4), y * w * 4)
  return { data: out, width: w, height: img.height }
}

function metrics(a: Img, b: Img) {
  const s = ssim(a, b).mssim
  const pm = pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 })
  const { width: w, height: h } = a
  const diff = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    diff[p] =
      Math.max(
        Math.abs(a.data[i] - b.data[i]),
        Math.abs(a.data[i + 1] - b.data[i + 1]),
        Math.abs(a.data[i + 2] - b.data[i + 2]),
      ) >= DIFF_LEVEL
        ? 1
        : 0
  }
  let blob = 0
  const where: string[] = []
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (diff[p] && diff[p - 1] && diff[p + 1] && diff[p - w] && diff[p + w]) {
        blob++
        if (where.length < 10) where.push(`${x},${y}`)
      }
    }
  return {
    ssim: Number(s.toFixed(4)),
    pixelmatch_persen: Number(((pm / (w * h)) * 100).toFixed(2)),
    beda_mengelompok: blob,
    ...(where.length ? { contoh_lokasi: where } : {}),
  }
}

function differenceImage(a: Img, b: Img): Img {
  const out = new Uint8ClampedArray(a.data.length)
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.abs(a.data[i] - b.data[i])
    out[i + 1] = Math.abs(a.data[i + 1] - b.data[i + 1])
    out[i + 2] = Math.abs(a.data[i + 2] - b.data[i + 2])
    out[i + 3] = 255
  }
  return { ...a, data: out }
}

function blend(a: Img, b: Img): Img {
  const out = new Uint8ClampedArray(a.data.length)
  for (let i = 0; i < out.length; i++) out[i] = Math.round((a.data[i] + b.data[i]) / 2)
  return { ...a, data: out }
}

const toPng = (img: Img) =>
  sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), {
    raw: { width: img.width, height: img.height, channels: 4 },
  }).png()

async function sideBySide(file: string, left: Img, right: Img, vertical = false) {
  const gap = 12
  const [l, r] = await Promise.all([toPng(left).toBuffer(), toPng(right).toBuffer()])
  const width = vertical ? left.width : left.width * 2 + gap
  const height = vertical ? left.height * 2 + gap : left.height
  await sharp({ create: { width, height, channels: 4, background: '#c9ced8' } })
    .composite([
      { input: l, left: 0, top: 0 },
      { input: r, left: vertical ? 0 : left.width + gap, top: vertical ? left.height + gap : 0 },
    ])
    .png()
    .toFile(file)
}

function pathSet(svg: string, scope?: string) {
  let s = svg
  if (scope) {
    const start = svg.indexOf(`<g id="${scope}"`)
    s = start >= 0 ? svg.slice(start) : ''
    // path region & clip mark berada di <defs>
    s += svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? ''
    if (scope === 'mark') s = s.replace(/<g id="wordmark"[\s\S]*?<\/g>/, '')
  }
  return new Set([...s.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]))
}

const sameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((x) => b.has(x))
const subset = (a: Set<string>, b: Set<string>) => [...a].every((x) => b.has(x))

async function main() {
  fs.mkdirSync(REVIEW, { recursive: true })
  for (const f of fs.readdirSync(REVIEW)) if (f.endsWith('.png')) fs.rmSync(path.join(REVIEW, f))
  const svg = fs.readFileSync(path.join(BRAND, 'logo.svg'), 'utf8')
  const crop = { left: OX, top: OY, width: W, height: H }
  const orig = over(await load(ORIGINAL, crop), WHITE)
  const vec = over(await load(renderSvg(svg, W)), WHITE)
  const MX = META.markWidth

  const report: Record<string, unknown> = {}
  let fail = false
  const full = metrics(orig, vec)
  const markM = metrics(sub(orig, 0, MX), sub(vec, 0, MX))
  const wordM = metrics(sub(orig, MX, W), sub(vec, MX, W))
  report['ukuran asli (1x, ' + `${W}x${H}` + ')'] = { logo: full, mark: markM, wordmark: wordM }
  if (wordM.ssim < SSIM_MIN || wordM.beda_mengelompok > 0) fail = true

  // skala tampilan (lebar 480 px, seperti header @2x)
  const dw = 480
  const dh = Math.round((H * dw) / W)
  const origS = over(await load(ORIGINAL, crop, [dw, dh]), WHITE)
  const vecS = over(await load(renderSvg(svg, dw), undefined, [dw, dh]), WHITE)
  const disp = metrics(origS, vecS)
  report[`skala tampilan (${dw}x${dh})`] = disp
  if (disp.ssim < SSIM_MIN) fail = true

  // gambar tinjauan
  await sideBySide(path.join(REVIEW, 'side-by-side-1x.png'), orig, vec, true)
  await toPng(blend(orig, vec)).toFile(path.join(REVIEW, 'overlay-50-1x.png'))
  await toPng(differenceImage(orig, vec)).toFile(path.join(REVIEW, 'difference-1x.png'))
  for (const [k, name, x0, y0, w, h] of [
    [4, 'mark', 0, 0, MX, H],
    [8, 'mark-detail', Math.round(MX * 0.2), Math.round(H * 0.45), 110, 70],
    [4, 'wordmark', MX, 40, 330, 170],
    [8, 'wordmark-detail', MX + 20, 50, 110, 70],
  ] as Array<[number, string, number, number, number, number]>) {
    const c = { left: OX + x0, top: OY + y0, width: w, height: h }
    const o = over(await load(ORIGINAL, c, [w * k, h * k]), WHITE)
    const big = await load(renderSvg(svg, W * k))
    const v = over(
      await load(await toPng(big).toBuffer(), {
        left: x0 * k,
        top: y0 * k,
        width: w * k,
        height: h * k,
      }),
      WHITE,
    )
    await sideBySide(path.join(REVIEW, `side-by-side-${name}-${k}x.png`), o, v)
    await toPng(blend(o, v)).toFile(path.join(REVIEW, `overlay-50-${name}-${k}x.png`))
    await toPng(differenceImage(o, v)).toFile(path.join(REVIEW, `difference-${name}-${k}x.png`))
  }

  // pratinjau varian gelap (asli berlatar putih, jadi hanya pratinjau visual)
  const inverse = fs.readFileSync(path.join(BRAND, 'logo-inverse.svg'), 'utf8')
  const inv = await load(renderSvg(inverse, 720))
  const tiles = await Promise.all(DARK_BGS.map(([, rgb]) => toPng(over(inv, rgb)).toBuffer()))
  const pad = 24
  await sharp({
    create: {
      width: inv.width + pad * 2,
      height: (inv.height + pad * 2) * 3,
      channels: 4,
      background: '#000',
    },
  })
    .composite(
      DARK_BGS.map(([hex], i) => ({
        input: {
          create: {
            width: inv.width + pad * 2,
            height: inv.height + pad * 2,
            channels: 4 as const,
            background: hex,
          },
        },
        top: i * (inv.height + pad * 2),
        left: 0,
      })).concat(
        tiles.map((t, i) => ({
          input: t,
          top: i * (inv.height + pad * 2) + pad,
          left: pad,
        })) as never,
      ),
    )
    .png()
    .toFile(path.join(REVIEW, 'dark-bg-inverse.png'))

  // identitas path varian
  const variants: Record<string, string> = {}
  const all = pathSet(svg)
  const markOnly = pathSet(svg, 'mark')
  for (const [file, expected, exact] of [
    ['logo-inverse.svg', all, true],
    ['logo-mark.svg', markOnly, true],
    ['icon.svg', markOnly, true],
  ] as const) {
    const p = path.join(BRAND, file)
    if (!fs.existsSync(p)) {
      variants[file] = 'BELUM ADA (jalankan pnpm brand:export)'
      fail = true
      continue
    }
    const got = pathSet(fs.readFileSync(p, 'utf8'))
    const ok = exact ? sameSet(got, expected) : subset(got, expected)
    variants[file] = ok ? `identik (${got.size} path)` : `BERBEDA (${got.size} vs ${expected.size})`
    if (!ok) fail = true
  }
  report['path varian'] = variants
  report['ukuran file'] = Object.fromEntries(
    ['logo.svg', 'logo-inverse.svg', 'logo-mark.svg', 'icon.svg'].map((f) => [
      f,
      `${fs.statSync(path.join(BRAND, f)).size} byte`,
    ]),
  )
  report['gambar tinjauan'] = path.relative(ROOT, REVIEW)

  console.log(JSON.stringify(report, null, 2))
  console.log(fail ? '\nGAGAL' : '\nLULUS')
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
