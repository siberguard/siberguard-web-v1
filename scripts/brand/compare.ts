/**
 * Uji kesamaan logo SVG hasil rekonstruksi terhadap PNG asli.
 *
 *   npx tsx scripts/brand/compare.ts
 *
 * - Render public/brand/logo.svg (resvg) pada 402x138, komposit di atas putih,
 *   bandingkan dengan docs/reference/logo-original.png: SSIM + pixelmatch.
 * - Cek "selisih mengelompok": piksel beda yang seluruh 4-tetangganya juga
 *   beda (blob), bukan garis tipis anti-aliasing di tepi.
 * - Tulis gambar tinjauan ke docs/brand-review/ (berdampingan, overlay 50%,
 *   difference) pada 1x, 4x, 8x.
 * - Pastikan logo-inverse.svg & logo-mark.svg memakai data path yang identik.
 *
 * Keluar dengan kode != 0 bila SSIM < 0,97, ada selisih mengelompok, atau
 * path varian tidak identik.
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import sharp from 'sharp'
import { ssim } from 'ssim.js'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const ORIGINAL = path.join(ROOT, 'docs/reference/logo-original.png')
const BRAND = path.join(ROOT, 'public/brand')
const REVIEW = path.join(ROOT, 'docs/brand-review')
const W = 402
const H = 138
const SSIM_MIN = 0.97
const CLUSTER_MAX = 0 // piksel blob yang diizinkan
const DIFF_LEVEL = 48 // selisih (0-255, kanal maks) yang dianggap "beda"

type RGB = [number, number, number]
const WHITE: RGB = [255, 255, 255]
const NAVY: RGB = [0x07, 0x14, 0x2e]

type Kernel = 'nearest' | 'cubic' | 'mitchell' | 'lanczos2' | 'lanczos3'

async function rawRGBA(
  input: Buffer | string,
  width?: number,
  height?: number,
  kernel: Kernel = 'nearest',
) {
  let img = sharp(input).ensureAlpha()
  if (width && height) img = img.resize(width, height, { kernel, fit: 'fill' })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
    width: info.width,
    height: info.height,
  }
}

function renderSvg(svg: string, width: number) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng()
  return rawRGBA(png)
}

function over(src: Uint8ClampedArray, bg: RGB) {
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255
    out[i] = Math.round(src[i] * a + bg[0] * (1 - a))
    out[i + 1] = Math.round(src[i + 1] * a + bg[1] * (1 - a))
    out[i + 2] = Math.round(src[i + 2] * a + bg[2] * (1 - a))
    out[i + 3] = 255
  }
  return out
}

function clusterCount(a: Uint8ClampedArray, b: Uint8ClampedArray, w: number, h: number) {
  const diff = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    const d = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2]),
    )
    diff[p] = d >= DIFF_LEVEL ? 1 : 0
  }
  let blob = 0
  let any = 0
  const where: string[] = []
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (!diff[p]) continue
      any++
      if (diff[p - 1] && diff[p + 1] && diff[p - w] && diff[p + w]) {
        blob++
        if (where.length < 20) where.push(`${x},${y}`)
      }
    }
  return { any, blob, where }
}

function differenceImage(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  const out = new Uint8ClampedArray(a.length)
  for (let i = 0; i < a.length; i += 4) {
    out[i] = Math.abs(a[i] - b[i])
    out[i + 1] = Math.abs(a[i + 1] - b[i + 1])
    out[i + 2] = Math.abs(a[i + 2] - b[i + 2])
    out[i + 3] = 255
  }
  return out
}

function blend(a: Uint8ClampedArray, b: Uint8ClampedArray, t = 0.5) {
  const out = new Uint8ClampedArray(a.length)
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - t) + b[i] * t)
  return out
}

async function savePng(file: string, data: Uint8ClampedArray, width: number, height: number) {
  await sharp(Buffer.from(data.buffer, data.byteOffset, data.length), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(file)
}

async function sideBySide(
  file: string,
  left: Uint8ClampedArray,
  right: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const gap = Math.max(8, Math.round(width * 0.02))
  const bufL = await sharp(Buffer.from(left.buffer), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
  const bufR = await sharp(Buffer.from(right.buffer), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
  await sharp({ create: { width: width * 2 + gap, height, channels: 4, background: '#d0d4dc' } })
    .composite([
      { input: bufL, left: 0, top: 0 },
      { input: bufR, left: width + gap, top: 0 },
    ])
    .png()
    .toFile(file)
}

function pathSet(svg: string, scope?: string) {
  // Lapisan latar (bukan bagian bentuk logo) tidak ikut dibandingkan.
  let s = svg.replace(/<path id="mark-underlay"[^>]*\/>/g, '')
  if (scope) {
    const m = svg.match(new RegExp(`<g id="${scope}">([\\s\\S]*?)</g>\\s*(?=<g id=|</svg>)`))
    s = m ? m[1] : ''
  }
  return new Set([...s.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]))
}

function sameSet(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((x) => b.has(x))
}

async function main() {
  fs.mkdirSync(REVIEW, { recursive: true })
  const svg = fs.readFileSync(path.join(BRAND, 'logo.svg'), 'utf8')
  const orig = await rawRGBA(ORIGINAL)
  if (orig.width !== W || orig.height !== H)
    throw new Error(`ukuran asli ${orig.width}x${orig.height}`)
  const vec = await renderSvg(svg, W)

  const report: Record<string, unknown> = {}
  let fail = false

  for (const [name, bg] of [
    ['putih', WHITE],
    ['navy #07142e (informatif: PNG asli punya fringe putih & counter putih opak)', NAVY],
  ] as const) {
    const a = over(orig.data, bg)
    const b = over(vec.data, bg)
    const s = ssim({ data: a, width: W, height: H }, { data: b, width: W, height: H }).mssim
    const pm = pixelmatch(a, b, undefined, W, H, { threshold: 0.1 })
    const cl = clusterCount(a, b, W, H)
    report[`latar ${name}`] = {
      ssim: Number(s.toFixed(4)),
      pixelmatch_beda: pm,
      pixelmatch_persen: Number(((pm / (W * H)) * 100).toFixed(2)),
      beda_maks_ge48: cl.any,
      beda_mengelompok: cl.blob,
      ...(cl.where.length ? { contoh_lokasi_blob: cl.where } : {}),
    }
    if (bg === WHITE) {
      if (s < SSIM_MIN) fail = true
      if (cl.blob > CLUSTER_MAX) fail = true
    }
  }

  // Gambar tinjauan
  for (const k of [1, 4, 8]) {
    const w = W * k
    const h = H * k
    const oNearest = await rawRGBA(ORIGINAL, w, h, 'nearest')
    const oCubic = await rawRGBA(ORIGINAL, w, h, 'cubic')
    const v = await renderSvg(svg, w)
    const oN = over(oNearest.data, WHITE)
    const oC = over(oCubic.data, WHITE)
    const vv = over(v.data, WHITE)
    await sideBySide(path.join(REVIEW, `side-by-side-${k}x.png`), oN, vv, w, h)
    await savePng(path.join(REVIEW, `overlay-50-${k}x.png`), blend(oC, vv), w, h)
    await savePng(path.join(REVIEW, `difference-${k}x.png`), differenceImage(oC, vv), w, h)
  }
  // Pratinjau di atas latar gelap (asli punya fringe putih & counter putih opak)
  const darkO = over(orig.data, NAVY)
  const darkV = over(vec.data, NAVY)
  await sideBySide(path.join(REVIEW, 'dark-bg-side-by-side-1x.png'), darkO, darkV, W, H)

  // Identitas path varian
  const variants: Record<string, string> = {}
  const full = pathSet(svg)
  const markOnly = pathSet(svg, 'mark')
  for (const [file, expected] of [
    ['logo-inverse.svg', full],
    ['logo-mark.svg', markOnly],
  ] as const) {
    const p = path.join(BRAND, file)
    if (!fs.existsSync(p)) {
      variants[file] = 'BELUM ADA (jalankan export.ts)'
      fail = true
      continue
    }
    const got = pathSet(fs.readFileSync(p, 'utf8'))
    const ok = sameSet(got, expected)
    variants[file] = ok ? `identik (${got.size} path)` : `BERBEDA (${got.size} vs ${expected.size})`
    if (!ok) fail = true
  }
  report['path varian'] = variants
  report['ukuran logo.svg'] = `${fs.statSync(path.join(BRAND, 'logo.svg')).size} byte`
  report['gambar tinjauan'] = path.relative(ROOT, REVIEW)

  console.log(JSON.stringify(report, null, 2))
  console.log(fail ? '\nGAGAL' : '\nLULUS')
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
