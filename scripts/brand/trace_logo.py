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
  6. Halo stiker (garis abu tipis di tepi luar mark) dipertahankan di
     logo.svg karena di atas putih ia yang membatasi sisi putih pita; di
     varian gelap halo disembunyikan (fill "none").

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
# 5. Main
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

    # --- mark: siluet, halo, stiker ---
    nbm = (nb & mark_zone).astype(np.float64)
    # garis halo asli berupa kurva halus sejajar tepi karya: siluet dihaluskan
    F_nb = upscale(ndimage.gaussian_filter(nbm, 2.6), 0.2)
    d_halo = trace_field(F_nb, tol=0.6, lines_ok=False)
    # stiker putih = siluet ditipiskan selebar garis halo
    dist_in = ndimage.distance_transform_edt(F_nb > 0.5) / SCALE
    HALO_W = 1.3
    F_st = np.clip(dist_in - HALO_W + 0.5, 0, 1)
    d_sticker = trace_field(F_st, tol=0.6, lines_ok=False, scale=SCALE)
    # inti putih: siluet ditipiskan selebar halo + margin stiker. Di varian gelap
    # hanya lapisan ini yang terlihat, jadi tepi perisai/pita tidak berbingkai putih
    # namun sisi putih pita & peta tetap putih.
    CORE_IN = 3.6
    core_hi = dist_in > CORE_IN
    # Margin stiker di sekeliling perisai lebarnya tidak rata (sampai ~6 px di tepi
    # atas). Putih dekat tepi siluet hanya dipertahankan bila itu bagian pita: dekat
    # merah atau dekat bayangan abu sisi bawah pita.
    mn1 = img.min(axis=2)
    gray_under = ndimage.binary_opening((cls == W_) & nb & (mn1 < 244) & ((img.max(axis=2) - mn1) < 30), disk(2))
    ribbon_white = ndimage.binary_dilation((cls == RED) & mark_zone, disk(6)) | ndimage.binary_dilation(
        gray_under & mark_zone, disk(4)
    )
    near_edge = ndimage.distance_transform_edt(nb & mark_zone) < 8
    drop = ndimage.gaussian_filter((near_edge & ~ribbon_white).astype(np.float32), 1.5)
    drop_u = cv2.resize(drop, (W * SCALE, H * SCALE), interpolation=cv2.INTER_LINEAR) > 0.5
    core_hi &= ~drop_u
    core = ndimage.gaussian_filter(core_hi.astype(np.float32), 1.2 * SCALE)
    d_core = trace_field(core, tol=0.6, lines_ok=False, scale=SCALE)
    # warna halo: rata-rata cincin luar siluet di gambar asli
    # warna halo: "tinta" cincin luar siluet (jumlah kegelapan per panjang tepi)
    # dibagi lebar garis -> abu dengan kegelapan rata-rata yang sama
    nbz = nb & mark_zone
    edge = nbz & ~ndimage.binary_erosion(nbz, disk(1))
    ring = nbz & ~ndimage.binary_erosion(nbz, disk(3)) & (cls == W_)
    ink = (255 - img.min(axis=2))[ring].sum() / max(edge.sum(), 1)
    c_halo = hexc([255 - min(0.6 * ink / HALO_W, 120)] * 3)
    print(f"halo: tinta {ink:.1f}/px tepi -> {c_halo}")

    # --- region berwarna (komponen) + underlap ---
    shaded: list[Shaded] = []
    z = [("dark", DARK), ("light", LIGHT), ("red", RED)]
    covU = {k: upscale(cov[k] * mark_zone) for _, k in z}
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
    body.append(f'<path id="halo" fill="{c_halo}" d="{d_halo}"/>')
    body.append(f'<path id="sticker" fill="#fff" d="{d_sticker}"/>')
    body.append(f'<path id="core" fill="#fff" d="{d_core}"/>')
    if shade_lv:
        defs.append('<clipPath id="c-sticker"><use href="#sticker"/></clipPath>')
        body.append(
            '<g clip-path="url(#c-sticker)"><g filter="url(#soft)">'
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
