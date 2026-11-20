"""
Rekonstruksi logo SiberGuard dari JPEG asli (1600x578) menjadi SVG vektor.

Sumber: docs/reference/logo-siberguard.jpg (latar putih). Prinsipnya konversi,
BUKAN redesain: setiap bentuk berasal dari piksel asli dan setiap warna dari
sampel piksel. Wordmark tidak diganti font.

Metode
  1. Klasifikasi piksel (setelah median 3x3): MERAH, BIRU TUA, BIRU MUDA
     (pita dalam perisai), dan NETRAL (putih/abu). Serpihan tipis hasil
     anti-aliasing JPEG dibersihkan dengan opening + ambang luas.
  2. Latar: flood-fill putih dari tepi gambar dengan dinding tebal (garis
     "halo" stiker abu di sekeliling mark punya celah), lalu ditumbuhkan
     kembali secara geodesik. Area putih tertutup yang dikelilingi halo
     (bukan warna) = lubang latar (di dalam lengkung pita); area putih yang
     bersentuhan dengan warna = bagian karya (sisi putih pita, peta).
  3. Coverage sub-piksel per kelas dari unmixing dua warna referensi lokal
     di tepi; medan coverage diperbesar 4x dan kontur level 0,5 diambil
     (presisi sub-piksel). Lapisan bawah dilebarkan sedikit di bawah lapisan
     atas (underlap) agar tidak ada celah rambut antar warna.
  4. Kontur di-fit: sudut dideteksi dari sudut belok; ruas lurus jadi garis,
     sisanya Bezier kubik (Schneider).
  5. Gradasi & bevel 3D (perisai, pita): tiap komponen warna dipotong ke
     "isoband" luminans (medan luminans dihaluskan di dalam komponen),
     masing-masing diisi warna rata-rata piksel asli di pita itu, lalu
     di-clip ke bentuk komponen. Gaussian blur ringan menghaluskan anak
     tangga antar pita. Sisi putih pita yang ber-bayang abu diperlakukan
     sama (isoband gelap di atas dasar putih).
  6. Halo stiker (garis abu tipis putus-putus di tepi luar mark) adalah
     artefak potongan gambar: garisnya bergelombang dan berlubang. Siluet
     diambil dari garis itu (kontur kasar -> di-snap ke punggungan abu
     terdekat), lalu dirapikan RELATIF TERHADAP KARYA: jarak garis ke tepi
     perisai/pita terdekat dihaluskan di sepanjang kurva dan titik digeser
     ke jarak itu. Hasilnya seperti garis potong stiker: mulus, mengikuti
     bentuk karya. Di sambungan pita-perisai sudutnya dibangun ulang dari
     dua garis lurus (tepi putih pita & offset tepi perisai) yang dipotong
     di titik potongnya, jadi tidak ada punuk/taji (sharpen_joins).
     logo.svg memakai halo + stiker putih (di atas putih, halo yang
     membatasi sisi putih pita). Varian gelap menyembunyikan keduanya; yang
     tampil hanya lapisan "core": isi perisai (peta, pita putih melintang)
     dan sisi putih pita (sisi luar pita merah, sampai tepi siluet).
  7. Tepi pita yang melintang di depan perisai: di atas bingkai biru muda
     garis putih tepi pita bercampur biru muda sehingga batasnya bergerigi.
     Tepi pita diambil dari ruas yang berbatasan dengan biru tua, ruas di
     atas biru muda disambung kurva Hermite, dan garis tepi bingkai
     diteruskan lurus sampai tepi pita (smooth_band_edges).

Jalankan (Python 3.12 + numpy, scipy, pillow, scikit-image, opencv):
  uv venv -p 3.12 .venv-brand
  uv pip install -p .venv-brand/bin/python numpy scipy pillow scikit-image opencv-python-headless
  .venv-brand/bin/python scripts/brand/trace_logo.py
Lalu: pnpm brand:export && pnpm brand:compare
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "docs", "reference", "logo-siberguard.jpg")
OUT = os.path.join(ROOT, "public", "brand", "logo.svg")
# posisi viewBox di gambar sumber, dibaca scripts/brand/compare.ts
META = os.path.join(ROOT, "scripts", "brand", "logo-trace.json")
DEBUG_DIR = os.environ.get("TRACE_DEBUG_DIR")

SCALE = 4  # faktor upscale medan coverage
SPLIT_X = 488  # kolom kosong antara mark (kiri) dan wordmark (kanan)
MARGIN = 6  # margin viewBox di sekitar karya (px sumber)

# Fitting (satuan: piksel sumber)
STEP = 0.25
CORNER_ARM = 1.5
CORNER_DEG = 48.0
CORNER_SHIFT = 1.0
LINE_TOL = 0.5
LINE_MIN = 10.0
SAG_TOL = 0.25
CURVE_TOL = 0.3
SMOOTH_ALONG = 0.9
MIN_AREA = 2.0

# Isoband
BAND_STEP = {"dark": 6.0, "light": 6.0, "red": 4.5, "shade": 6.0}
LEVEL_TOL = 1.2  # galat Bezier kontur isoband (tidak perlu presisi: dihaluskan blur & di-clip)
BLUR = 2.6  # stdDeviation feGaussianBlur untuk tumpukan isoband

W_, DARK, LIGHT, RED = 0, 1, 2, 3


def disk(k):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1)).astype(bool)


def dbg(name, arr):
    if DEBUG_DIR:
        os.makedirs(DEBUG_DIR, exist_ok=True)
        Image.fromarray(arr).save(os.path.join(DEBUG_DIR, name))


# ---------------------------------------------------------------------------
# 1. Klasifikasi
# ---------------------------------------------------------------------------


def load():
    img = np.array(Image.open(SRC).convert("RGB"))
    # penghalus sangat ringan: median 3x3 menghapus pulau/lengan peta selebar 1-2 px
    med = cv2.GaussianBlur(img.astype(np.float64), (0, 0), 0.5)
    smooth = cv2.bilateralFilter(img, 7, 24, 3).astype(np.float64)
    return img.astype(np.float64), med, smooth


def luma(c):
    return c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114


def classify(med):
    r, g, b = med[..., 0], med[..., 1], med[..., 2]
    L = luma(med)
    mn = med.min(axis=2)
    red = (r - np.maximum(g, b)) > 60
    blue = ((b - r) > 10) & ~red
    light = blue & (L >= 165)
    dark = blue & ~light
    cls = np.full(r.shape, W_, np.int8)
    cls[dark] = DARK
    cls[red] = RED
    # biru muda: hanya badan pita (lebar beberapa px), bukan fringe anti-aliasing
    core = ndimage.binary_opening(light, np.ones((3, 3), bool))
    lab, n = ndimage.label(core)
    if n:
        sizes = ndimage.sum(core, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.nonzero(sizes >= 150)[0])
        light_ok = light & ndimage.binary_dilation(keep, disk(1))
    else:
        light_ok = np.zeros_like(light)
    cls[light_ok] = LIGHT
    # fringe biru muda yang dibuang -> putih (terang) atau biru tua
    rest = light & ~light_ok
    cls[rest & (mn >= 200)] = W_
    cls[rest & (mn < 200)] = DARK
    # serpihan kecil
    for k in (DARK, RED):
        m = cls == k
        lab, n = ndimage.label(m)
        if n:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            small = np.isin(lab, 1 + np.nonzero(sizes < 12)[0])
            cls[small] = W_
    return cls


def background(img):
    """Latar (terhubung ke tepi gambar) + lubang latar tertutup halo."""
    mn = img.min(axis=2)
    chroma = img.max(axis=2) - mn
    # ambang putih ketat: titik-titik halo yang samar (246-249) ikut jadi dinding
    white = mn >= 250
    D = 2
    wall = ndimage.binary_dilation(~white, disk(D))
    lab, n = ndimage.label(~wall)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]).tolist()) - {0}

    def regrow(m):
        for _ in range(D + 2):
            m = ndimage.binary_dilation(m, np.ones((3, 3), bool)) & white
        return m

    bg = regrow(np.isin(lab, list(border)))
    holes = np.zeros_like(bg)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(n + 1))
    colored = chroma > 60
    grayish = (chroma < 30) & (mn < 240)
    for i in range(1, n + 1):
        if i in border or sizes[i] < 60:
            continue
        m = regrow(lab == i)
        ring = ndimage.binary_dilation(m, disk(2)) & ~m
        # lubang latar dibatasi halo abu, bukan warna (peta & sisi putih pita
        # bersentuhan langsung dengan biru/merah)
        if colored[ring].mean() < 0.08 and grayish[ring].mean() > 0.35:
            holes |= m
    return bg | holes, holes


# ---------------------------------------------------------------------------
# 2. Coverage sub-piksel (unmixing dua warna)
# ---------------------------------------------------------------------------


def coverage(img, smooth, cls, region):
    """Coverage per kelas (DARK, LIGHT, RED) di dalam `region`.

    Piksel tepi = campuran linear dua kelas; referensi warna tiap kelas =
    piksel interior terdekat (gambar bilateral, bebas noise JPEG).
    """
    H, W = cls.shape
    classes = [W_, DARK, LIGHT, RED]
    ref = {}
    for k in classes:
        inner = ndimage.binary_erosion(cls == k, disk(1))
        if k != W_:
            inner &= region
        if not inner.any():
            inner = (cls == k) & region
        if not inner.any():
            continue
        _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
        ref[k] = smooth[iy, ix]
    cov = {k: (cls == k).astype(np.float64) for k in classes}
    # piksel tepi: jendela 5x5 berisi >1 kelas
    mixed = np.zeros((H, W), bool)
    for k in classes:
        m = cls == k
        mixed |= ndimage.binary_dilation(m, disk(2)) & ~m
    mixed &= region
    ys, xs = np.nonzero(mixed)
    for y, x in zip(ys, xs):
        y0, y1, x0, x1 = max(0, y - 2), min(H, y + 3), max(0, x - 2), min(W, x + 3)
        present = sorted(set(np.unique(cls[y0:y1, x0:x1]).tolist()) & set(ref))
        P = img[y, x]
        best = None
        for i in range(len(present)):
            for j in range(i + 1, len(present)):
                a, b = present[i], present[j]
                Ca, Cb = ref[a][y, x], ref[b][y, x]
                d = Ca - Cb
                dd = float(d @ d)
                if dd < 30.0**2:
                    continue
                t = float(np.clip((P - Cb) @ d / dd, 0.0, 1.0))
                res = float(np.linalg.norm(P - (t * Ca + (1 - t) * Cb)))
                if best is None or res < best[0]:
                    best = (res, a, b, t)
        if best is None:
            continue
        _, a, b, t = best
        for k in classes:
            cov[k][y, x] = 0.0
        cov[a][y, x] = t
        cov[b][y, x] = 1 - t
    # Fitur putih setipis 1-2 px di dalam biru tua (rantai pulau peta) tidak punya
    # piksel putih "murni" sehingga terklasifikasi biru tua; coverage putihnya
    # diperkirakan dari luminans relatif terhadap biru tua di sekitarnya.
    L = luma(img)
    base = ndimage.percentile_filter(L, 25, size=9)
    darkm = (cls == DARK) & ~mixed & region
    t_w = np.clip((L - base) / np.maximum(255.0 - base, 1.0), 0, 1)
    sel = darkm & (L - base > 30)
    cov[W_][sel] = t_w[sel]
    cov[DARK][sel] = 1 - t_w[sel]
    for k in classes:
        cov[k][~region] = 0.0
    return cov


def upscale(F, sigma=0.35):
    H, W = F.shape
    big = cv2.resize(F.astype(np.float32), (W * SCALE, H * SCALE), interpolation=cv2.INTER_CUBIC)
    if sigma > 0:
        big = ndimage.gaussian_filter(big, sigma * SCALE)
    return np.clip(big, 0, 1)


# ---------------------------------------------------------------------------
# 3. Kontur -> path
# ---------------------------------------------------------------------------


def contours(F, level=0.5, scale=SCALE, min_area=MIN_AREA):
    Fp = np.pad(F, 1, constant_values=0.0)
    out = []
    for c in measure.find_contours(Fp, level):
        pts = np.c_[c[:, 1] - 1, c[:, 0] - 1]
        pts = (pts + 0.5) / scale
        if np.linalg.norm(pts[0] - pts[-1]) < 1e-6:
            pts = pts[:-1]
        if len(pts) >= 6 and abs(poly_area(pts)) >= min_area:
            out.append(pts)
    return out


def poly_area(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * (np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def resample_closed(p, step=STEP):
    q = np.vstack([p, p[:1]])
    seg = np.linalg.norm(np.diff(q, axis=0), axis=1)
    s = np.r_[0, np.cumsum(seg)]
    n = max(8, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.c_[np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])]


def turning(p, k):
    v1 = p - np.roll(p, k, axis=0)
    v2 = np.roll(p, -k, axis=0) - p
    c = (v1 * v2).sum(1) / (np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1) + 1e-12)
    return np.degrees(np.arccos(np.clip(c, -1, 1)))


def find_corners(p, arm, deg):
    k = max(2, int(round(arm / STEP)))
    ang = turning(p, k)
    n = len(p)
    cand = np.nonzero(ang >= deg)[0]
    corners = []
    for i in cand:
        win = [(i + d) % n for d in range(-k, k + 1)]
        if ang[i] >= max(ang[j] for j in win) and not any(
            (i - c) % n <= k or (c - i) % n <= k for c in corners
        ):
            corners.append(int(i))
    return sorted(corners)


def smooth_open(seg, sigma_pts):
    if sigma_pts <= 0 or len(seg) < 5:
        return seg
    m = min(len(seg) - 1, int(3 * sigma_pts) + 1)
    head = 2 * seg[0] - seg[m:0:-1]
    tail = 2 * seg[-1] - seg[-2 : -m - 2 : -1]
    ext = np.vstack([head, seg, tail])
    sm = ndimage.gaussian_filter1d(ext, sigma_pts, axis=0, mode="nearest")[m : m + len(seg)]
    sm[0], sm[-1] = seg[0], seg[-1]
    return sm


# --- Schneider (Graphics Gems I) ---


def bez(ctrl, t):
    t = np.asarray(t)[:, None]
    mt = 1 - t
    return mt**3 * ctrl[0] + 3 * mt**2 * t * ctrl[1] + 3 * mt * t**2 * ctrl[2] + t**3 * ctrl[3]


def bez_d1(ctrl, t):
    t = np.asarray(t)[:, None]
    mt = 1 - t
    return 3 * (mt**2 * (ctrl[1] - ctrl[0]) + 2 * mt * t * (ctrl[2] - ctrl[1]) + t**2 * (ctrl[3] - ctrl[2]))


def bez_d2(ctrl, t):
    t = np.asarray(t)[:, None]
    return 6 * ((1 - t) * (ctrl[2] - 2 * ctrl[1] + ctrl[0]) + t * (ctrl[3] - 2 * ctrl[2] + ctrl[1]))


def chord_param(pts):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    return d / d[-1] if d[-1] > 0 else d


def gen_bezier(pts, u, t1, t2):
    p0, p3 = pts[0], pts[-1]
    A1 = t1[None, :] * (3 * (1 - u) ** 2 * u)[:, None]
    A2 = t2[None, :] * (3 * (1 - u) * u**2)[:, None]
    C = np.array([[(A1 * A1).sum(), (A1 * A2).sum()], [(A1 * A2).sum(), (A2 * A2).sum()]])
    b0 = (1 - u) ** 3 + 3 * (1 - u) ** 2 * u
    b1 = 3 * (1 - u) * u**2 + u**3
    tmp = pts - (p0[None, :] * b0[:, None] + p3[None, :] * b1[:, None])
    X = np.array([(A1 * tmp).sum(), (A2 * tmp).sum()])
    det = C[0, 0] * C[1, 1] - C[0, 1] * C[1, 0]
    seg_len = np.linalg.norm(p3 - p0)
    if abs(det) > 1e-12:
        al = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det
        ar = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    else:
        al = ar = seg_len / 3
    eps = 1e-6 * seg_len
    if al < eps or ar < eps:
        al = ar = seg_len / 3
    return np.array([p0, p0 + t1 * al, p3 + t2 * ar, p3])


def max_err(pts, ctrl, u):
    d = np.linalg.norm(bez(ctrl, u) - pts, axis=1)
    i = int(np.argmax(d))
    return d[i], i


def reparam(pts, ctrl, u):
    q, q1, q2 = bez(ctrl, u), bez_d1(ctrl, u), bez_d2(ctrl, u)
    num = ((q - pts) * q1).sum(1)
    den = (q1 * q1).sum(1) + ((q - pts) * q2).sum(1)
    with np.errstate(divide="ignore", invalid="ignore"):
        nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 1e-12 else v


def fit_cubic(pts, t1, t2, tol, depth=0):
    if len(pts) == 2 or depth > 12:
        dist = np.linalg.norm(pts[-1] - pts[0]) / 3
        return [np.array([pts[0], pts[0] + t1 * dist, pts[-1] + t2 * dist, pts[-1]])]
    u = chord_param(pts)
    ctrl = gen_bezier(pts, u, t1, t2)
    err, split = max_err(pts, ctrl, u)
    if err < tol:
        return [ctrl]
    if err < tol * 4:
        for _ in range(6):
            u = reparam(pts, ctrl, u)
            ctrl = gen_bezier(pts, u, t1, t2)
            err, split = max_err(pts, ctrl, u)
            if err < tol:
                return [ctrl]
    split = int(np.clip(split, 1, len(pts) - 2))
    tc = unit(pts[split - 1] - pts[split + 1])
    return fit_cubic(pts[: split + 1], t1, tc, tol, depth + 1) + fit_cubic(
        pts[split:], -tc, t2, tol, depth + 1
    )


def end_tangent(seg, forward=True):
    k = min(len(seg) - 1, max(2, int(round(0.8 / STEP))))
    return unit(seg[k] - seg[0]) if forward else unit(seg[-1 - k] - seg[-1])


def rdp(pts, tol):
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        d = pts[b] - pts[a]
        L = np.linalg.norm(d)
        seg = pts[a + 1 : b] - pts[a]
        dist = np.abs(seg[:, 0] * d[1] - seg[:, 1] * d[0]) / L if L > 1e-9 else np.linalg.norm(seg, axis=1)
        i = int(np.argmax(dist))
        if dist[i] > tol:
            m = a + 1 + i
            keep[m] = True
            stack += [(a, m), (m, b)]
    return list(np.nonzero(keep)[0])


def lsq_line(pts):
    c = pts.mean(axis=0)
    _, _, vt = np.linalg.svd(pts - c)
    u = vt[0]
    if (pts[-1] - pts[0]) @ u < 0:
        u = -u
    return c, u


def is_line(pts):
    if len(pts) < 3 or (len(pts) - 1) * STEP < LINE_MIN:
        return False
    c, u = lsq_line(pts)
    n = np.array([-u[1], u[0]])
    if float(np.abs((pts - c) @ n).max()) > LINE_TOL:
        return False
    t = (pts - c) @ u
    r = (pts - c) @ n
    coef, *_ = np.linalg.lstsq(np.c_[t * t, t, np.ones_like(t)], r, rcond=None)
    L = t.max() - t.min()
    return abs(coef[0]) * (L / 2) ** 2 <= SAG_TOL


def line_intersect(c1, u1, c2, u2):
    den = u1[0] * u2[1] - u1[1] * u2[0]
    if abs(den) < 1e-6:
        return None
    t = ((c2[0] - c1[0]) * u2[1] - (c2[1] - c1[1]) * u2[0]) / den
    return c1 + t * u1


def fit_segment(seg, tol, lines_ok=True, t_start=None, t_end=None):
    """Ruas antar sudut -> primitif ('L', p) / ('C', c1, c2, p)."""
    sm = smooth_open(seg, SMOOTH_ALONG / STEP)
    n = len(sm)
    if lines_ok:
        keep = rdp(sm, LINE_TOL)
        runs = []
        for a, b in zip(keep[:-1], keep[1:]):
            straight = is_line(sm[a : b + 1])
            if runs and runs[-1][2] and straight and is_line(sm[runs[-1][0] : b + 1]):
                runs[-1][1] = b
                continue
            if runs and not runs[-1][2] and not straight:
                runs[-1][1] = b
                continue
            runs.append([a, b, straight])
    else:
        runs = [[0, n - 1, False]]
    lines = {}
    for k, (a, b, st) in enumerate(runs):
        if not st:
            continue
        c, u = lsq_line(sm[a : b + 1])
        pa = seg[0] if a == 0 else c + ((sm[a] - c) @ u) * u
        pb = seg[-1] if b == n - 1 else c + ((sm[b] - c) @ u) * u
        lines[k] = (pa, pb, unit(pb - pa))
    for k in range(len(runs) - 1):
        if k in lines and (k + 1) in lines:
            pa1, pb1, u1 = lines[k]
            pa2, pb2, u2 = lines[k + 1]
            x = line_intersect(pa1, u1, pa2, u2)
            mid = x if (x is not None and np.linalg.norm(x - pb1) < 1.0) else (pb1 + pa2) / 2
            lines[k] = (pa1, mid, u1)
            lines[k + 1] = (mid, pb2, u2)
    prims = []
    cur = seg[0]
    for k, (a, b, st) in enumerate(runs):
        if st:
            prims.append(("L", lines[k][1]))
            cur = lines[k][1]
            continue
        end = lines[k + 1][0] if (k + 1) in lines else seg[-1]
        skip = int(round(0.6 / STEP))
        i0 = a + 1 + (skip if (k - 1) in lines else 0)
        i1 = b - (skip if (k + 1) in lines else 0)
        inner_pts = sm[i0:i1] if i1 - i0 >= 2 else sm[a + 1 : b]
        pts = np.vstack([cur, inner_pts, end]) if len(inner_pts) else np.vstack([cur, end])
        if k - 1 in lines:
            t1 = lines[k - 1][2]
        elif k == 0 and t_start is not None:
            t1 = t_start
        else:
            t1 = end_tangent(np.vstack([cur, sm[a + 1 : b + 1]]), True)
        if k + 1 in lines:
            t2 = -lines[k + 1][2]
        elif k == len(runs) - 1 and t_end is not None:
            t2 = t_end
        else:
            t2 = end_tangent(np.vstack([sm[a:b], end]), False)
        for c in fit_cubic(pts, t1, t2, tol):
            prims.append(("C", c[1], c[2], c[3]))
        cur = end
    return prims


def fit_contour(raw, tol=CURVE_TOL, lines_ok=True, corner_deg=CORNER_DEG):
    p = resample_closed(raw)
    corners = find_corners(p, CORNER_ARM, corner_deg)
    n = len(p)
    if not corners:
        k = max(2, int(round(CORNER_ARM / STEP)))
        i0 = int(np.argmax(turning(p, k)))
        p = np.roll(p, -i0, axis=0)
        t = unit(p[1] - p[-1])
        return p[0], fit_segment(np.vstack([p, p[:1]]), tol, lines_ok, t_start=t, t_end=-t)
    prims = []
    for i, c0 in enumerate(corners):
        c1 = corners[(i + 1) % len(corners)]
        idx = np.arange(c0, c0 + ((c1 - c0) % n or n) + 1) % n
        prims += fit_segment(p[idx], tol, lines_ok)
    return p[corners[0]], prims


OX = OY = 0.0  # titik asal viewBox (diisi di main)


def fmt(v):
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def path_d(start, prims):
    """Path relatif (lebih ringkas) — koordinat dibulatkan kumulatif agar tidak bergeser."""
    sx, sy = round(start[0] - OX, 1), round(start[1] - OY, 1)
    out = [f"M{fmt(sx)} {fmt(sy)}"]
    cx, cy = sx, sy
    for pr in prims:
        if pr[0] == "L":
            ex, ey = round(pr[1][0] - OX, 1), round(pr[1][1] - OY, 1)
            out.append(f"l{fmt(ex - cx)} {fmt(ey - cy)}")
        else:
            _, c1, c2, e = pr
            ex, ey = round(e[0] - OX, 1), round(e[1] - OY, 1)
            vals = [c1[0] - OX - cx, c1[1] - OY - cy, c2[0] - OX - cx, c2[1] - OY - cy, ex - cx, ey - cy]
            out.append("c" + " ".join(fmt(v) for v in vals))
        cx, cy = ex, ey
    return "".join(out).replace(" -", "-") + "z"


def trace_field(F, tol=CURVE_TOL, lines_ok=True, level=0.5, scale=SCALE, min_area=MIN_AREA):
    return "".join(path_d(*fit_contour(c, tol, lines_ok)) for c in contours(F, level, scale, min_area))


def hexc(c):
    c = np.clip(np.round(c), 0, 255).astype(int)
    return "#%02x%02x%02x" % tuple(c)


# ---------------------------------------------------------------------------
# 4. Isoband (gradasi & bevel)
# ---------------------------------------------------------------------------


@dataclass
class Shaded:
    rid: str
    d: str  # bentuk region (juga clip)
    base: str  # warna pita terbawah
    levels: list  # [(d, warna)] urut bawah -> atas


def norm_conv(val, w, sigma):
    num = ndimage.gaussian_filter(val * w, sigma)
    den = ndimage.gaussian_filter(w.astype(np.float64), sigma)
    return np.where(den > 1e-6, num / np.maximum(den, 1e-6), 0.0)


def isobands(smooth, mask, step, dark_up=False, sigma=2.0, min_pts=25, erode=3):
    """Pita-pita luminans di dalam `mask` (piksel sumber).

    dark_up=False: pita makin terang ditumpuk ke atas (superlevel set).
    dark_up=True : dasar terang, pita makin gelap ditumpuk (bayangan abu).
    Hasil: warna dasar + [(medan 1x untuk kontur, warna)].
    """
    L = luma(smooth)
    # interior jauh dari tepi: piksel campuran (pulau peta, tepi pita) tidak ikut;
    # juga piksel yang jauh lebih terang dari sekitarnya (sisa pulau kecil, kilap JPEG)
    inner = ndimage.binary_erosion(mask, disk(erode))
    loc = ndimage.median_filter(np.where(mask, L, np.nan_to_num(L)), size=9)
    inner &= L < loc + 18
    if inner.sum() < min_pts:
        inner = mask
    Ls = norm_conv(L, inner, sigma)
    # perluas ke luar mask (tetangga terdekat) agar kontur memotong tepi dengan rapi
    if dark_up:
        # bayangan di atas dasar putih: di luar area sampel dianggap putih
        Lx = np.where(inner, Ls, 252.0)
    else:
        _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
        Lx = Ls[iy, ix]
    vals = Ls[inner]
    lo, hi = np.percentile(vals, 1), np.percentile(vals, 99)
    n = int((hi - lo) // step)
    if n < 1:
        return hexc(np.median(smooth[inner], axis=0)), []
    edges = lo + (hi - lo) * (np.arange(1, n + 1) / (n + 1))
    if dark_up:
        edges = edges[::-1]
    allb = np.r_[-np.inf, edges, np.inf] if not dark_up else np.r_[np.inf, edges, -np.inf]
    cols = []
    for i in range(len(allb) - 1):
        a, b = allb[i], allb[i + 1]
        sel = inner & ((Ls >= min(a, b)) & (Ls < max(a, b)))
        cols.append(np.median(smooth[sel], axis=0) if sel.sum() >= 3 else None)
    # isi warna kosong dengan tetangga
    for i in range(len(cols)):
        if cols[i] is None:
            j = min((j for j in range(len(cols)) if cols[j] is not None), key=lambda j: abs(j - i))
            cols[i] = cols[j]
    zone = ndimage.binary_dilation(mask, disk(4))
    levels = []
    for i, e in enumerate(edges):
        sel = (Lx >= e) if not dark_up else (Lx <= e)
        F = (sel & zone).astype(np.float64)
        if F.sum() < 4:
            continue
        levels.append((F, hexc(cols[i + 1])))
    return hexc(cols[0]), levels


def level_paths(levels):
    out = []
    for F, col in levels:
        big = ndimage.gaussian_filter(
            cv2.resize(F.astype(np.float32), (F.shape[1] * 2, F.shape[0] * 2), interpolation=cv2.INTER_LINEAR),
            1.6,
        )
        d = "".join(path_d(*fit_contour(c, LEVEL_TOL, False, 70.0)) for c in contours(big, 0.5, 2, 3.0))
        if d:
            out.append((d, col))
    return out


# ---------------------------------------------------------------------------
# 5. Siluet stiker (garis halo) & lapisan putih
# ---------------------------------------------------------------------------

HALO_W = 1.3  # lebar garis halo (px sumber)
HALO_SIGMA = 8.0  # penghalusan jarak halo->karya di sepanjang kurva (px)


def sample(A, x, y, scale=1, order=1):
    """Nilai array `A` (resolusi `scale`x) di koordinat sumber (pusat piksel i = i+0.5)."""
    return ndimage.map_coordinates(A, [y * scale - 0.5, x * scale - 0.5], order=order, mode="nearest")


def wrap_gauss(a, sigma):
    pad = min(len(a), int(4 * sigma) + 1)
    return ndimage.gaussian_filter1d(np.r_[a[-pad:], a, a[:pad]], sigma, axis=0)[pad:-pad]


def open_gauss(a, sigma):
    """Gaussian 1D dengan ujung tetap (refleksi ganjil)."""
    if len(a) < 5 or sigma <= 0:
        return a
    m = min(len(a) - 1, int(3 * sigma) + 1)
    e = np.r_[2 * a[0] - a[m:0:-1], a, 2 * a[-1] - a[-2 : -m - 2 : -1]]
    r = ndimage.gaussian_filter1d(e, sigma, mode="nearest")[m : m + len(a)]
    r[0], r[-1] = a[0], a[-1]
    return r


def rough_silhouette(img, holes, zone):
    """Siluet kasar: semua konten tidak-putih; celah garis halo putus-putus ditutup.

    Lubang latar asli (di dalam lengkung pita) dipertahankan."""
    mn = img.min(axis=2)
    R = ndimage.binary_closing((mn < 246) & zone, disk(6))
    lab, n = ndimage.label(R)
    R = lab == 1 + int(np.argmax(ndimage.sum(R, lab, range(1, n + 1))))
    filled = ndimage.binary_fill_holes(R)
    hl, hn = ndimage.label(filled & ~R)
    keep = np.zeros_like(R)
    for i in range(1, hn + 1):
        h = hl == i
        if (h & holes).sum() > 30:
            keep |= h
    return filled & ~keep


def snap_to_halo(R0, img, cls):
    """Kontur siluet kasar digeser ke punggungan garis halo abu (puncak terluar)."""
    mn = img.min(axis=2)
    ch = img.max(axis=2) - mn
    far = ndimage.distance_transform_edt(cls == W_) > 1.5  # bukan tepi karya berwarna
    ridge = ndimage.gaussian_filter(np.clip(250.0 - mn, 0, None) * (ch < 40) * far, 0.7)
    Rf = ndimage.gaussian_filter(R0.astype(np.float64), 0.8)
    ts = np.arange(-6, 2.01, STEP)
    out = []
    for c in contours(Rf, 0.5, 1, 50.0):
        p = resample_closed(c)
        t = np.gradient(wrap_gauss(p, 6), axis=0)
        t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
        nrm = np.c_[t[:, 1], -t[:, 0]]
        if sample(Rf, *(p + 2 * nrm).T).mean() > 0.5:
            nrm = -nrm  # normal menunjuk ke luar siluet
        P = p[:, None, :] + ts[None, :, None] * nrm[:, None, :]
        v = sample(ridge, P[..., 0].ravel(), P[..., 1].ravel()).reshape(len(p), len(ts))
        peak = (v[:, 1:-1] >= v[:, :-2]) & (v[:, 1:-1] >= v[:, 2:]) & (v[:, 1:-1] > 12)
        j = np.where(peak, np.arange(1, len(ts) - 1)[None, :], -1).max(axis=1)
        has = j >= 0
        jj = np.maximum(j, 0)
        w = np.where(has, v[np.arange(len(p)), jj], 0.0)
        off = np.where(has, ts[jj], 0.0)
        # celah antar putus-putus diisi interpolasi berbobot
        o = wrap_gauss(off * w, 4.0 / STEP) / np.maximum(wrap_gauss(w, 4.0 / STEP), 1e-6)
        out.append(p + o[:, None] * nrm)
    return out


def art_labels(p, lab4, minrun=int(6 / STEP)):
    """Label tiap titik kurva: 1 bila karya terdekat pita merah, 0 bila perisai.

    Run pendek (< 6 px) dianggap noise dan diikutkan ke tetangganya."""
    n = len(p)
    lab = np.rint(sample(lab4, *p.T, scale=SCALE, order=0)).astype(int)
    for _ in range(3):
        ch = np.nonzero(lab != np.roll(lab, 1))[0]
        if len(ch) < 2:
            break
        for a, b in zip(ch, np.r_[ch[1:], ch[0] + n]):
            if b - a < minrun:
                lab[np.arange(a, b) % n] = lab[(a - 1) % n]
    return lab


def relax_to_art(curves, blue4, red4):
    """Haluskan jarak kurva halo ke karya terdekat, lalu geser titik ke jarak itu.

    Sambungan (titik di mana karya terdekat berganti perisai <-> pita) jadi
    titik tetap, sehingga sudut cekung di sambungan tidak membulat.
    Hasil: [(kurva, label per titik)]."""
    A4 = blue4 | red4
    d4, (iy, ix) = ndimage.distance_transform_edt(~A4, return_indices=True)
    d4 = d4 / SCALE
    lab4 = red4[iy, ix].astype(np.float32)
    del iy, ix
    gy, gx = np.gradient(ndimage.gaussian_filter(d4, 2.0))
    out = []
    for q in curves:
        p = resample_closed(q)
        n = len(p)
        d = sample(d4, *p.T, scale=SCALE)
        lab = art_labels(p, lab4)
        br = list(np.nonzero(lab != np.roll(lab, 1))[0])
        dm = ndimage.median_filter(d, size=int(2 / STEP) | 1, mode="wrap")
        s = HALO_SIGMA / STEP
        if not br:
            ds = wrap_gauss(dm, s)
        else:
            ds = np.empty(n)
            for a, b in zip(br, br[1:] + [br[0] + n]):
                idx = np.arange(a, b + 1) % n
                ds[idx[:-1]] = open_gauss(dm[idx], min(s, len(idx) / 5))[:-1]
        g = np.c_[sample(gx, *p.T, scale=SCALE), sample(gy, *p.T, scale=SCALE)]
        g /= np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-6)
        out.append(wrap_gauss(resample_closed(p + (ds - d)[:, None] * g), 1.0 / STEP))
    return [(q, art_labels(q, lab4)) for q in out]


# Sambungan pita-perisai (px sumber, diukur sepanjang kurva dari titik ganti label):
# bagian < NEAR dianggap tercemar pembulatan, NEAR..FAR jadi acuan garis lurus
# sekaligus zona transisi kembali ke kurva semula.
JOIN_R = (9.0, 25.0)  # sisi pita
JOIN_B = (12.0, 30.0)  # sisi perisai
JOIN_MAX_RES = 0.6  # simpangan maks. acuan dari garis lurus (px)
JOIN_MAX_DIST = 15.0  # sudut harus dekat titik ganti label (px)


def resample_labeled(p, lab, step=STEP):
    """resample_closed + label: tiap titik baru ikut label titik awal ruasnya."""
    q = np.vstack([p, p[:1]])
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(q, axis=0), axis=1))]
    n = max(8, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n, endpoint=False)
    i = np.clip(np.searchsorted(s, t, side="right") - 1, 0, len(p) - 1)
    return np.c_[np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])], lab[i]


def sharpen_joins(p, lab, blue4):
    """Sambungan pita-perisai pada siluet luar -> sudut cekung tajam.

    Titik ganti label (karya terdekat pita <-> perisai) bukan sudut sebenarnya:
    di sana jarak ke merah = jarak ke biru, beberapa px sebelum tepi putih pita
    bertemu tepi perisai, dan penghalusan jarak membuat punuk/taji kecil di
    antaranya. Sudut dibangun ulang dari geometri karya:
      - sisi pita: garis lurus yang di-fit dari kurva di zona acuan;
      - sisi perisai: garis lurus yang di-fit dari offset tepi perisai (jarak =
        median jarak halo ke perisai di zona acuan); tepi perisai di bawah pita
        tidak terlihat, jadi garisnya diperpanjang;
      - sudut = titik potong kedua garis. Di zona acuan kurva berpindah mulus
        dari garis ke kurva semula.
    Sambungan yang acuannya tidak lurus (ujung pita yang melengkung) dibiarkan.

    Hasil: (kurva, label, jalur). Label ikut sudut baru: sisi pita sampai sudut
    = 1 (pita, tidak disapu margin); sisi perisai di zona sambungan = 2 (tidak
    disapu sinar, karena tepi perisai bisa tertutup pita dan sinarnya kebablasan
    sampai merah). Sebagai gantinya `jalur` = poligon margin perisai di zona itu:
    antara garis halo dan tepi perisai (garis halo digeser sejauh offset), dibatasi
    tepi bawah pita. Di latar gelap sisi putih pita jadi lurus sampai tepi perisai
    dan tepi perisai lurus sampai tepi pita."""
    dB = ndimage.gaussian_filter(ndimage.distance_transform_edt(~blue4) / SCALE, 0.5 * SCALE)
    gy, gx = np.gradient(dB)

    def to_iso(q, level):
        for _ in range(4):
            g = np.c_[sample(gx, *q.T, scale=SCALE), sample(gy, *q.T, scale=SCALE)] * SCALE
            q = q - ((sample(dB, *q.T, scale=SCALE) - level) / np.maximum((g * g).sum(1), 0.25))[:, None] * g
        return q

    def fit(ref):
        c, u = lsq_line(ref)
        if (ref[0] - ref[-1]) @ u < 0:
            u = -u  # menuju sambungan (acuan diurutkan dari dekat ke jauh)
        return c, u, float(np.abs((ref - c) @ np.array([-u[1], u[0]])).max())

    def side(q, s, c, u, zone):
        """Titik satu sisi (dekat -> jauh): di garis, lalu transisi ke kurva semula."""
        w = np.clip((zone[1] - s) / (zone[1] - zone[0]), 0, 1)[:, None]
        return q + w * (c + ((q - c) @ u)[:, None] * u - q)

    br = np.nonzero(lab != np.roll(lab, 1))[0]
    strips = []
    if len(br) < 2:
        return p, lab, strips
    # mulai indeks di tengah celah dua sambungan -> zona sambungan tidak melewati indeks 0
    gaps = np.diff(np.r_[br, br[0] + len(p)])
    i = int(np.argmax(gaps))
    sh = int(br[i] + gaps[i] // 2) % len(p)
    p, lab = np.roll(p, -sh, axis=0), np.roll(lab, -sh)
    br = np.sort((br - sh) % len(p))
    kR = [int(v / STEP) for v in JOIN_R]
    kB = [int(v / STEP) for v in JOIN_B]
    for b in br[::-1]:  # dari belakang: indeks sambungan lain tetap berlaku
        n = len(p)
        r_after = lab[b] == 1
        run_after = int(np.argmax(lab[b:] != lab[b])) or n - b
        run_before = int(np.argmax(lab[b - 1 :: -1] != lab[b - 1])) or b
        runR, runB = (run_after, run_before) if r_after else (run_before, run_after)
        if runR < kR[1] or runB < kB[1] or min(b, n - b) < kR[1] + kB[1]:
            continue
        after, before = b + np.arange(n // 2), b - 1 - np.arange(n // 2)
        iR, iB = (after, before) if r_after else (before, after)
        iR, iB = iR[: kR[1]], iB[: kB[1]]
        sR, sB = (np.arange(kR[1]) + 0.5) * STEP, (np.arange(kB[1]) + 0.5) * STEP
        level = float(np.median(sample(dB, *p[iB[kB[0] :]].T, scale=SCALE)))
        cR, uR, resR = fit(p[iR[kR[0] :]])
        cB, uB, resB = fit(to_iso(p[iB[kB[0] :]], level))
        X = line_intersect(cR, uR, cB, uB)
        if max(resR, resB) > JOIN_MAX_RES or X is None or np.linalg.norm(X - p[b]) > JOIN_MAX_DIST:
            continue
        qR, qB = side(p[iR], sR, cR, uR, JOIN_R), side(p[iB], sB, cB, uB, JOIN_B)
        # tiap sisi berhenti di sudut
        qR = qR[(qR - cR) @ uR < (X - cR) @ uR - 0.5 * STEP]
        qB = qB[(qB - cB) @ uB < (X - cB) @ uB - 0.5 * STEP]
        seg = np.vstack([qB[::-1], X, qR])  # jauh di perisai -> sudut -> jauh di pita
        # label = label titik awal ruas: ruas sudut->pita berlabel pita
        lseg = np.r_[np.full(len(qB), 2), 1 if r_after else 2, np.ones(len(qR), int)]
        lo, hi = (b - kB[1], b + kR[1]) if r_after else (b - kR[1], b + kB[1])
        if not r_after:
            seg, lseg = seg[::-1], lseg[::-1]
        p = np.vstack([p[:lo], seg, p[hi:]])
        lab = np.r_[lab[:lo], lseg, lab[hi:]]
        # jalur margin perisai: garis halo (+2 px ke luar) .. tepi perisai, di bawah garis pita
        nB = np.array([-uB[1], uB[0]])
        q0 = X - 5 * uB
        if np.diff(sample(dB, *np.c_[q0, q0 + nB], scale=SCALE))[0] > 0:
            nB = -nB  # menuju perisai
        L = float(((X - qB) @ uB).max()) if len(qB) else JOIN_B[1]
        P1 = line_intersect(cR, uR, X - 2.0 * nB, uB)
        P2 = line_intersect(cR, uR, X + (level + 0.25) * nB, uB)
        if P1 is not None and P2 is not None:
            strips.append(np.array([P1, P2, P2 - L * uB, P1 - L * uB]))
        turn = np.degrees(np.arccos(np.clip(-uR @ uB, -1, 1)))
        print(f"sambungan {np.round(X - [OX, OY], 1)}: belok {turn:.0f}°, offset perisai {level:.2f} px")
    return (*resample_labeled(p, lab), strips)


BAND_FIX = 2.0  # zona tepi pita yang dikunci: < 2 px dari garis luar perisai (px sumber)
BAND_ZONE = 3.0  # lebar zona di sekitar tepi pita yang diubah (px sumber)
BAND_FRINGE = 1.25  # lebar fringe di sisi biru yang pembagian biru tua/mudanya diisi ulang


def hermite(p0, t0, p1, t1, n):
    s = np.linspace(0, 1, n)[:, None]
    return (
        (2 * s**3 - 3 * s**2 + 1) * p0
        + (s**3 - 2 * s**2 + s) * t0
        + (-2 * s**3 + 3 * s**2) * p1
        + (s**3 - s**2) * t1
    )


def smooth_band_edges(covU, hull, XW):
    """Tepi pita yang melintang di depan perisai dirapikan (in-place di covU).

    Di tempat pita melewati bingkai biru muda, garis putih tepi pita bercampur
    dengan biru muda (kontras rendah) sehingga batasnya bergerigi dan bingkai
    seolah "menonjol" ke dalam pita. Batas pita dengan biru tua andal.
      1. Pita = komponen tak-biru di dalam garis luar perisai yang menyentuh garis
         luar itu (pulau peta tidak termasuk).
      2. Kontur pita: ruas yang berbatasan dengan biru tua dihaluskan ringan; ruas
         yang berbatasan dengan biru muda (+1 px) diganti kurva Hermite di antara
         ruas biru tua di kedua sisinya (posisi & arah singgung bersambung).
      3. Pembagian biru tua/biru muda di fringe dekat tepi pita diisi ulang dari
         bagian yang jauh (inpainting Navier-Stokes meneruskan garis tepi bingkai),
         lalu tiap kelas = min(medan pita baru, proporsinya) -> sudut tajam.
    Tepi luar perisai (< BAND_FIX px dari garis luar) dan pulau peta tidak disentuh."""
    D, L = covU[DARK][:, :XW], covU[LIGHT][:, :XW]
    B = D + L
    inside = ndimage.distance_transform_edt(hull) / SCALE
    nonblue = (B < 0.5) & hull
    lab, _ = ndimage.label(nonblue)
    touch = np.unique(lab[(inside > 0) & (inside <= 1.0)])
    band = np.isin(lab, touch[touch > 0])
    if not band.any():
        return
    Fb = band.astype(np.float32)
    new = []
    n_fix = 0
    for c in contours(ndimage.gaussian_filter(Fb, 0.25 * SCALE), 0.5, SCALE, 50.0):
        p = resample_closed(c)
        n = len(p)
        t = np.gradient(wrap_gauss(p, 4), axis=0)
        t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
        nrm = np.c_[t[:, 1], -t[:, 0]]
        if sample(Fb, *(p + nrm).T, scale=SCALE).mean() > 0.5:
            nrm = -nrm  # keluar dari pita (ke biru)
        q = p + nrm
        # 0 = dikunci (dekat garis luar perisai), 1 = biru tua, 2 = biru muda
        cl = np.where(
            sample(inside, *p.T, scale=SCALE) < BAND_FIX,
            0,
            np.where(sample(L, *q.T, scale=SCALE) > sample(D, *q.T, scale=SCALE), 2, 1),
        )
        k = int(1.0 / STEP)
        lm = ndimage.binary_dilation(np.r_[cl[-k:] == 2, cl == 2, cl[:k] == 2], iterations=k)[k:-k]
        cl = np.where(lm & (cl != 0), 2, cl)
        ch = np.nonzero(cl != np.roll(cl, 1))[0]
        if not len(ch):
            new.append(p)
            continue
        p, cl = np.roll(p, -ch[0], axis=0), np.roll(cl, -ch[0])
        ch = np.nonzero(cl != np.roll(cl, 1))[0]
        runs = [(a, b, int(cl[a])) for a, b in zip(ch, list(ch[1:]) + [n])]
        out = p.copy()
        for a, b, kind in runs:
            if kind == 1 and b - a > 8:
                out[a:b] = smooth_open(p[a:b], 1.0 / STEP)
        kt = int(3.0 / STEP)
        for a, b, kind in runs:
            if kind != 2 or a < kt or b + kt > n:
                continue
            pa, pb = out[a - 1], out[b % n]
            ta, tb = unit(out[a - 1] - out[a - kt]), unit(out[b + kt - 1] - out[b])
            chord = np.linalg.norm(pb - pa)
            out[a:b] = hermite(pa, ta * chord, pb, tb * chord, b - a + 2)[1:-1]
            n_fix += 1
        new.append(out)
    band_new = raster_polys(new, band.shape) & hull
    edge = np.maximum(ndimage.distance_transform_edt(band), ndimage.distance_transform_edt(~band)) / SCALE
    isl = ndimage.binary_dilation(nonblue & ~band, disk(int(1.5 * SCALE)))
    zw = np.clip((inside - BAND_FIX) / 1.5, 0, 1)  # transisi bertahap dari tepi luar perisai
    zone = (zw > 0) & ((edge < BAND_ZONE) | band | band_new) & ~isl
    wD = np.where(B > 0.3, D / np.maximum(B, 1e-6), 0.5).astype(np.float32)
    # Fringe: garis batas biru tua/muda diteruskan lurus. phi = jarak bertanda ke
    # batas itu (> 0 di sisi biru tua), dihitung dari bagian andal; di fringe
    # phi diekstrapolasi linear dari titik andal terdekat (batas lurus -> tetap lurus).
    fill = zone & ((edge <= BAND_FRINGE) | band)
    _, (iy, ix) = ndimage.distance_transform_edt(fill, return_indices=True)
    P = (wD > 0.5)[iy, ix]
    phi = ndimage.gaussian_filter((ndimage.distance_transform_edt(P) - ndimage.distance_transform_edt(~P)) / SCALE, 1.0)
    gy, gx = np.gradient(phi)
    deep = ndimage.distance_transform_edt(~fill) / SCALE >= 0.75
    _, (jy, jx) = ndimage.distance_transform_edt(~deep, return_indices=True)
    fy, fx = np.nonzero(fill)
    sy, sx = jy[fy, fx], jx[fy, fx]
    ext = phi[sy, sx] + gx[sy, sx] * (fx - sx) + gy[sy, sx] * (fy - sy)
    wD[fy, fx] = 0.5 + 2.0 * ext
    wD = np.clip(wD, 0, 1)
    del iy, ix, jy, jx, P, phi, gy, gx
    Bn = 1.0 - ndimage.gaussian_filter(band_new.astype(np.float32), 0.35 * SCALE)
    zw = zw[zone]
    D[zone] = (1 - zw) * D[zone] + zw * np.minimum(Bn, wD)[zone]
    L[zone] = (1 - zw) * L[zone] + zw * np.minimum(Bn, 1 - wD)[zone]
    print(f"tepi pita: {n_fix} ruas di atas bingkai biru muda disambung ulang")


def raster_polys(polys, shape, scale=SCALE):
    """Isi poligon (terbesar = luar, sisanya lubang) pada grid `scale`x."""
    SH = 3
    m = np.zeros(shape, np.uint8)
    order = sorted(polys, key=lambda p: -abs(poly_area(p)))

    def pts(p):
        return [np.round((p * scale - 0.5) * (1 << SH)).astype(np.int32).reshape(-1, 1, 2)]

    cv2.fillPoly(m, pts(order[0]), 1, cv2.LINE_8, SH)
    for h in order[1:]:
        cv2.fillPoly(m, pts(h), 0, cv2.LINE_8, SH)
    return m.astype(bool)


# ---------------------------------------------------------------------------
# 6. Main
# ---------------------------------------------------------------------------


def main():
    global OX, OY
    img, med, smooth = load()
    H, W = img.shape[:2]
    X = np.arange(W)[None, :].repeat(H, 0)
    cls = classify(med)
    bg, holes = background(img)
    # haluskan siluet: tutup takik kecil yang masuk lewat celah garis halo,
    # tanpa menutup lubang latar yang sempit (bulan sabit di kanan atas)
    nb = (ndimage.binary_closing(~bg, disk(5)) | ~bg) & ~ndimage.binary_erosion(holes, disk(1))
    mark_zone = X < SPLIT_X
    cls[~nb] = W_

    if DEBUG_DIR:
        vis = np.full((H, W, 3), 255, np.uint8)
        vis[nb] = (230, 230, 230)
        vis[cls == DARK] = (0, 40, 140)
        vis[cls == LIGHT] = (120, 200, 255)
        vis[cls == RED] = (220, 0, 0)
        dbg("classes.png", vis)

    ys, xs = np.nonzero(nb & ((cls != W_) | mark_zone))
    x0, x1 = xs.min() - MARGIN, xs.max() + 1 + MARGIN
    y0, y1 = ys.min() - MARGIN, ys.max() + 1 + MARGIN
    OX, OY = float(x0), float(y0)
    VW, VH = x1 - x0, y1 - y0

    cov = coverage(img, smooth, cls, nb)
    print("coverage selesai")

    # --- wordmark ---
    word = ~mark_zone
    siber = upscale(cov[DARK] * word)
    redw = cov[RED] * word
    Y = np.arange(H)[:, None].repeat(W, 1)
    guard = upscale(redw * (Y < 320))
    underline = upscale(redw * (Y >= 320))
    d_siber = trace_field(siber)
    d_guard = trace_field(guard)
    d_under = trace_field(underline, tol=0.6, lines_ok=False)
    print("wordmark selesai")

    # warna wordmark: median interior
    def interior_col(m):
        return hexc(np.median(img[ndimage.binary_erosion(m, disk(2))], axis=0))

    c_siber = interior_col((cls == DARK) & word)
    c_guard = interior_col((cls == RED) & word & (Y < 320))
    c_under = interior_col((cls == RED) & word & (Y >= 320))

    # --- mark: siluet (garis halo), stiker, lapisan putih ---
    z = [("dark", DARK), ("light", LIGHT), ("red", RED)]
    covU = {k: upscale(cov[k] * mark_zone) for _, k in z}
    XW = SPLIT_X * SCALE  # grid 4x dipotong ke kolom mark (hemat memori)
    blue4 = (covU[DARK] + covU[LIGHT])[:, :XW] >= 0.5
    red4 = covU[RED][:, :XW] >= 0.5
    A4 = blue4 | red4
    halo = relax_to_art(snap_to_halo(rough_silhouette(img, holes, mark_zone), img, cls), blue4, red4)
    k = int(np.argmax([abs(poly_area(c)) for c, _ in halo]))  # siluet luar
    c, lb, strips = sharpen_joins(*halo[k], blue4)
    halo[k] = (c, lb)
    S_polys = [c for c, _ in halo]
    d_halo = "".join(path_d(*fit_contour(p, 0.4, False)) for p in S_polys)
    S4 = raster_polys(S_polys, blue4.shape)
    dist_in = ndimage.distance_transform_edt(S4) / SCALE
    # stiker putih = siluet ditipiskan selebar garis halo
    F_st = ndimage.gaussian_filter(np.clip(dist_in - HALO_W + 0.5, 0, 1), 1.0)
    d_sticker = trace_field(F_st, tol=0.5, lines_ok=False)

    # Lapisan putih "core" (juga tampil di latar gelap) = stiker dikurangi margin
    # stiker. Margin = area yang disapu dari ruas siluet ke arah dalam sampai
    # menyentuh karya:
    #  - ruas milik perisai: hanya bila sinarnya memang mengenai karya di sekitar
    #    jarak margin (di sambungan pita-perisai sinar mengarah ke sisi putih pita
    #    dan tidak disapu, jadi pita menempel rapat ke perisai);
    #  - ruas di sisi dalam orbit pita (menghadap perisai/lubang): selalu.
    # Ditambah putih di luar perisai yang berbatasan dengan ujung pita merah yang
    # tipis (< TIP_W): sisi putih pita berakhir sebelum ujung, tidak menggantung.
    # Label 2 (sisi perisai di zona sambungan yang sudah ditajamkan) tidak disapu
    # sinar; margin di sana = poligon `strips` dari sharpen_joins.
    TIP_W = 3.0
    _, (ry, rx) = ndimage.distance_transform_edt(~red4, return_indices=True)
    by, bx = np.nonzero(blue4)
    C = np.array([(bx.mean() + 0.5) / SCALE, (by.mean() + 0.5) / SCALE])  # pusat orbit ~ pusat perisai
    dA = ndimage.distance_transform_edt(~A4) / SCALE
    S4f = S4.astype(np.float32)
    margin = np.zeros_like(S4)
    hh, ww = S4.shape
    steps = np.arange(0, 10.01, 0.25)
    for c, lb in halo:
        t = np.gradient(wrap_gauss(c, 2.0 / STEP), axis=0)
        t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
        nrm = np.c_[t[:, 1], -t[:, 0]]
        if sample(S4f, *(c + 1.5 * nrm).T, scale=SCALE).mean() < 0.5:
            nrm = -nrm  # normal ke dalam siluet
        i4 = np.clip(np.floor(c * SCALE).astype(int), 0, [ww - 1, hh - 1])
        q = np.c_[(rx[i4[:, 1], i4[:, 0]] + 0.5) / SCALE, (ry[i4[:, 1], i4[:, 0]] + 0.5) / SCALE]
        inner = ((c - q) * (q - C)).sum(1) < 0
        d0 = sample(dA, *c.T, scale=SCALE)
        P = [np.clip(np.floor((c + d * nrm) * SCALE).astype(int), 0, [ww - 1, hh - 1]) for d in steps]
        hit = np.full(len(c), np.inf)
        for d, Pk in zip(steps, P):
            h = A4[Pk[:, 1], Pk[:, 0]] & np.isinf(hit)
            hit[h] = d
        ok = (lb == 1) & inner | (lb == 0) & (hit <= 1.5 * d0 + 1.0)
        for d, Pk in zip(steps, P):
            m = ok & (d < hit)
            margin[Pk[m, 1], Pk[m, 0]] = True
    margin = cv2.morphologyEx(margin.astype(np.uint8), cv2.MORPH_CLOSE, disk(3).astype(np.uint8)) > 0
    for poly in strips:  # margin perisai di zona sambungan
        m = np.zeros(S4.shape, np.uint8)
        cv2.fillPoly(m, [np.round((poly * SCALE - 0.5) * 8).astype(np.int32).reshape(-1, 1, 2)], 1, cv2.LINE_8, 3)
        margin |= m > 0
    # Garis luar perisai termasuk bagian yang tertutup pita: perisai hampir cembung,
    # jadi closing lebar (r 45 px) hanya mengisi takik tempat pita melintas di depan
    # tepi perisai (di kanan tertutup sampai ~60 px).
    blue1 = ((cls == DARK) | (cls == LIGHT)) & mark_zone
    hull1 = ndimage.binary_fill_holes(cv2.morphologyEx(blue1.astype(np.uint8), cv2.MORPH_CLOSE, disk(45).astype(np.uint8)) > 0)
    hull = upscale(hull1.astype(np.float64), 0)[:, :XW] > 0.5
    hull = ndimage.binary_fill_holes(blue4 | (ndimage.distance_transform_edt(hull) / SCALE > 1.0))
    red_w = 2 * cv2.dilate((ndimage.distance_transform_edt(red4) / SCALE).astype(np.float32), disk(int(2.5 * SCALE)).astype(np.uint8))
    out_shield = S4 & ~A4 & ~hull
    ys, xs = np.nonzero(out_shield)
    qx, qy = rx[ys, xs], ry[ys, xs]
    C4 = C * SCALE - 0.5
    # putih di sisi dalam pita (antara pita dan perisai) = margin / ujung lubang.
    # Piksel yang menempel ke merah (< 1 px) dilewati: arah ke titik merah terdekat
    # di sana sejajar tepi sehingga tandanya acak; margin yang dilebarkan 1 px di
    # bawah tetap menutupnya.
    far = np.hypot(xs - qx, ys - qy) >= SCALE
    margin[ys, xs] |= far & ((xs - qx) * (qx - C4[0]) + (ys - qy) * (qy - C4[1]) < 0)
    margin[ys, xs] |= red_w[qy, qx] < TIP_W
    del ry, rx, S4f, dA, red_w, out_shield, ys, xs, qx, qy, far
    margin = cv2.dilate(margin.astype(np.uint8), disk(SCALE).astype(np.uint8)) > 0
    core4 = ((dist_in > HALO_W) & ~margin).astype(np.uint8)
    # buang taji/lekuk < ~2 px di tepi (sisa sudut sambungan)
    core4 = cv2.morphologyEx(core4, cv2.MORPH_OPEN, disk(5).astype(np.uint8))
    core4 = cv2.morphologyEx(core4, cv2.MORPH_CLOSE, disk(4).astype(np.uint8)) > 0
    core4 &= dist_in > HALO_W  # closing tidak boleh menutupi garis halo
    lab, n = ndimage.label(core4)
    if n:
        sizes = ndimage.sum(core4, lab, range(1, n + 1))
        core4 = np.isin(lab, 1 + np.nonzero(sizes >= 16 * SCALE * SCALE)[0])
    # lubang sangat kecil (bintik) di dalam lapisan putih ditutup
    pores = ndimage.binary_fill_holes(core4) & ~core4
    lab, n = ndimage.label(pores)
    if n:
        sizes = ndimage.sum(pores, lab, range(1, n + 1))
        core4 |= np.isin(lab, 1 + np.nonzero(sizes < 9 * SCALE * SCALE)[0])
    d_core = trace_field(ndimage.gaussian_filter(core4.astype(np.float32), 0.6 * SCALE), tol=0.5, lines_ok=False)
    del dist_in, margin, lab, pores
    # warna halo: "tinta" cincin luar siluet (jumlah kegelapan per panjang tepi)
    # dibagi lebar garis -> abu dengan kegelapan rata-rata yang sama
    nbz = nb & mark_zone
    edge = nbz & ~ndimage.binary_erosion(nbz, disk(1))
    ring = nbz & ~ndimage.binary_erosion(nbz, disk(3)) & (cls == W_)
    ink = (255 - img.min(axis=2))[ring].sum() / max(edge.sum(), 1)
    c_halo = hexc([255 - min(0.6 * ink / HALO_W, 120)] * 3)
    print(f"halo: tinta {ink:.1f}/px tepi -> {c_halo}")

    smooth_band_edges(covU, hull, XW)
    del hull

    # --- region berwarna (komponen) + underlap ---
    shaded: list[Shaded] = []
    for zi, (name, k) in enumerate(z):
        later = sum((covU[k2] for _, k2 in z[zi + 1 :]), np.zeros_like(covU[k]))
        grown = ndimage.grey_dilation(covU[k], footprint=disk(int(1.2 * SCALE)))
        Fk = np.maximum(covU[k], np.minimum(grown, later))
        hard = (cls == k) & mark_zone
        lab, n = ndimage.label(hard)
        sizes = ndimage.sum(hard, lab, range(1, n + 1))
        labs = [i + 1 for i in range(n) if sizes[i] >= 30]
        if not labs:
            continue
        keep = np.isin(lab, labs)
        _, (iy, ix) = ndimage.distance_transform_edt(~keep, return_indices=True)
        nearest = lab[iy, ix]
        nearU = cv2.resize(nearest.astype(np.float32), (W * SCALE, H * SCALE), interpolation=cv2.INTER_NEAREST)
        for li in labs:
            Fc = Fk * (nearU == li)
            comp = lab == li
            region_d = trace_field(Fc, tol=0.35)
            if not region_d:
                continue
            base, lv = isobands(smooth, comp, BAND_STEP[name])
            shaded.append(Shaded(f"{name}{li}", region_d, base, level_paths(lv)))
        print(f"{name}: {len(labs)} komponen")

    # --- bayangan abu di sisi putih pita ---
    shade_mask = nb & mark_zone & (cls == W_)
    shade_mask &= ndimage.binary_erosion(nb & mark_zone, disk(1))
    mn = img.min(axis=2)
    chroma = img.max(axis=2) - mn
    shade_mask &= chroma < 30
    broad = ndimage.binary_opening(shade_mask & (mn < 244), disk(2))
    shade_lv = []
    if broad.sum() > 50:
        _, lv = isobands(smooth, shade_mask, BAND_STEP["shade"], dark_up=True, sigma=1.5, erode=1)
        near = ndimage.binary_dilation(broad, disk(4))
        shade_lv = level_paths([(((F > 0) & near).astype(np.float64), c) for F, c in lv])
    print("bayangan selesai")

    # --- SVG ---
    defs = [f'<filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="{BLUR}"/></filter>']
    body = []
    body.append(f'<path id="halo" fill="{c_halo}" fill-rule="evenodd" d="{d_halo}"/>')
    body.append(f'<path id="sticker" fill="#fff" d="{d_sticker}"/>')
    body.append(f'<path id="core" fill="#fff" d="{d_core}"/>')
    if shade_lv:
        defs.append('<clipPath id="c-core"><use href="#core"/></clipPath>')
        body.append(
            '<g clip-path="url(#c-core)"><g filter="url(#soft)">'
            + "".join(f'<path fill="{c}" d="{d}"/>' for d, c in shade_lv)
            + "</g></g>"
        )
    for s in shaded:
        defs.append(f'<path id="r-{s.rid}" d="{s.d}"/>')
        defs.append(f'<clipPath id="c-{s.rid}"><use href="#r-{s.rid}"/></clipPath>')
        body.append(f'<use href="#r-{s.rid}" fill="{s.base}"/>')
        if s.levels:
            body.append(
                f'<g clip-path="url(#c-{s.rid})"><g filter="url(#soft)">'
                + "".join(f'<path fill="{c}" d="{d}"/>' for d, c in s.levels)
                + "</g></g>"
            )
    word_svg = (
        '<g id="wordmark">'
        f'<path id="wordmark-siber" fill="{c_siber}" d="{d_siber}"/>'
        f'<path id="wordmark-guard" fill="{c_guard}" d="{d_guard}"/>'
        f'<path id="underline" fill="{c_under}" d="{d_under}"/>'
        "</g>"
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" width="{VW}" height="{VH}">'
        "<title>SiberGuard</title>"
        f"<defs>{''.join(defs)}</defs>"
        f'<g id="mark">{"".join(body)}</g>'
        f"{word_svg}</svg>"
    )
    with open(OUT, "w") as f:
        f.write(svg + "\n")
    print(f"logo.svg: viewBox 0 0 {VW} {VH} (asal {OX:.0f},{OY:.0f} di sumber), {len(svg)} byte")
    with open(META, "w") as f:
        json.dump(
            {
                "source": os.path.relpath(SRC, ROOT),
                "origin": [int(OX), int(OY)],
                "size": [int(VW), int(VH)],
                "markWidth": int(SPLIT_X - OX),
            },
            f,
            indent=2,
        )
        f.write("\n")
    if DEBUG_DIR:
        with open(os.path.join(DEBUG_DIR, "origin.txt"), "w") as f:
            f.write(f"{OX:.0f} {OY:.0f}\n")


if __name__ == "__main__":
    main()
