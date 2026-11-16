"""
Rekonstruksi logo Merdeka dari PNG asli (402x138) menjadi SVG vektor.

Prinsip: konversi murni, BUKAN redesain. Geometri setiap elemen berasal dari
piksel asli, tidak ada bentuk yang digambar tangan:

  1. Setiap piksel diklasifikasi ke kelas warna (latar, biru/navy, merah, abu
     pita, kotak piksel).
  2. Piksel tepi (anti-aliasing "terpanggang" di warna, karena alpha asli
     biner) di-unmix menjadi cakupan (coverage) sub-piksel antar dua kelas.
  3. Peta coverage diperbesar 8x (bicubic); kontur level 0,5 diambil dengan
     marching squares (presisi sub-piksel).
  4. Kontur di-fit: sudut dideteksi dari sudut belok; ruas yang lurus dalam
     toleransi ketidakpastian low-res dijadikan garis lurus, sisanya kurva
     Bezier kubik (algoritma Schneider) dengan galat maksimum kecil. Ini
     menghilangkan "wobble" tangga dari PNG tanpa menggeser bentuk.
  5. Warna isi diambil dari sampel piksel asli: gradien linear hasil fitting,
     plus satu bentuk highlight (pita terang di bagian atas perisai) yang
     opasitasnya dihitung dari selisih terhadap gradien dasar.

Satu-satunya interpretasi: counter huruf (lubang di "e", "d", "a") di PNG asli
berisi putih opak sisa proses hapus-latar; di SVG dijadikan lubang transparan
agar logo benar di latar gelap. Di atas latar putih hasilnya identik.

Jalankan (Python 3.12 + numpy, scipy, pillow, scikit-image):
  uv venv -p 3.12 .venv-brand
  uv pip install -p .venv-brand/bin/python numpy scipy pillow scikit-image
  .venv-brand/bin/python scripts/brand/trace_logo.py
Lalu: npx tsx scripts/brand/export.ts && npx tsx scripts/brand/compare.ts
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from dataclasses import field as dc_field

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "docs", "reference", "logo-original.png")
OUT_DIR = os.path.join(ROOT, "public", "brand")
DEBUG_DIR = os.environ.get("TRACE_DEBUG_DIR")

W, H = 402, 138
SCALE = 8  # faktor upscale peta coverage
SPLIT_X = 122  # kolom kosong antara perisai (kiri) dan wordmark (kanan)

# Parameter fitting (satuan: piksel asli)
FIELD_SIGMA = float(os.environ.get("TRACE_SIGMA", "0.25"))  # penghalus ringan peta coverage
STEP = 0.08  # jarak resampling kontur
CORNER_ARM = 0.6  # panjang lengan pengukur sudut belok
CORNER_DEG = float(os.environ.get("TRACE_CORNER_DEG", "65"))  # sudut belok minimum untuk dianggap sudut tajam
CORNER_SHIFT = 0.5  # pergeseran maks titik sudut ke perpotongan garis LSQ
LINE_TOL = float(os.environ.get("TRACE_LINE_TOL", "0.55"))  # deviasi maks agar ruas = garis lurus
LINE_MIN = float(os.environ.get("TRACE_LINE_MIN", "3.0"))  # panjang minimum ruas garis lurus
SAG_TOL = float(os.environ.get("TRACE_SAG_TOL", "0.15"))  # lengkungan sistematis maks agar dianggap garis
CURVE_TOL = float(os.environ.get("TRACE_CURVE_TOL", "0.2"))  # galat maks Bezier
SMOOTH_ALONG = float(os.environ.get("TRACE_SMOOTH", "0.6"))  # Gaussian sepanjang kontur
MIN_AREA = 0.6  # buang pulau kontur lebih kecil dari ini (px^2): sisa fringe, bukan desain

BG, DARK, RED, GRAY, SQ = 0, 1, 2, 3, 4
CLASS_NAMES = {BG: "bg", DARK: "dark", RED: "red", GRAY: "gray", SQ: "sq"}
GRAY_ZONE = (36, 98, 70, 127)  # bagian putih pita merah-putih
SQ_ZONE = (84, 22, 114, 58)  # tiga kotak piksel
EYE_BOX = (64, 45, 84, 58)  # mata elang (pulau di dalam ruang negatif elang)
M_BOX = (120, 40, 192, 100)  # huruf "M" (2 komponen)

# ---------------------------------------------------------------------------
# Klasifikasi & unmixing
# ---------------------------------------------------------------------------


def load():
    rgba = np.array(Image.open(SRC).convert("RGBA")).astype(np.float64)
    assert rgba.shape[:2] == (H, W), rgba.shape
    alpha = rgba[:, :, 3] > 0  # alpha asli biner
    over_white = np.where(alpha[:, :, None], rgba[:, :, :3], 255.0)
    return over_white, alpha


def zone(z):
    x0, y0, x1, y1 = z
    m = np.zeros((H, W), bool)
    m[y0:y1, x0:x1] = True
    return m


def classify(img, alpha):
    r, b = img[:, :, 0], img[:, :, 2]
    mn, mx = img.min(axis=2), img.max(axis=2)
    cls = np.full((H, W), DARK, np.int8)
    cls[~alpha] = BG
    cls[alpha & (mn >= 244)] = BG  # termasuk counter huruf berisi putih opak
    cls[alpha & (r >= 140) & ((r - b) >= 80)] = RED
    gray = alpha & zone(GRAY_ZONE) & ((mx - mn) <= 24) & (mn >= 180) & (mn < 244)
    # hanya badan pita putih (komponen terbesar setelah opening), bukan rantai
    # fringe pucat 1 px di sepanjang tepi navy
    core = ndimage.binary_opening(gray, np.ones((3, 3), bool))
    lab, n = ndimage.label(core)
    if n:
        sizes = ndimage.sum(core, lab, range(1, n + 1))
        core = lab == (1 + int(np.argmax(sizes)))
        gray &= ndimage.binary_dilation(core, np.ones((3, 3), bool))
    cls[gray] = GRAY
    cls[alpha & zone(SQ_ZONE) & (b >= 200) & (r <= 150)] = SQ
    return cls


def unmix(img, alpha, cls):
    """Coverage sub-piksel per kelas dari unmixing dua kelas terdekat.

    Dilakukan di ruang sRGB (bukan linear-light): browser & resvg juga
    mengomposit di sRGB, sehingga ketebalan visual hasil render cocok dengan
    PNG asli seperti yang selama ini terlihat.
    """
    classes = [BG, DARK, RED, GRAY, SQ]
    ref, near = {}, {}
    chroma = img.max(axis=2) - img.min(axis=2)
    for k in classes:
        if k == BG:
            continue
        inner = ndimage.binary_erosion(cls == k, np.ones((3, 3), bool))
        if k != GRAY:
            # piksel fringe pucat di dalam takik sempit bukan warna "murni"
            inner &= chroma >= 50
        if not inner.any():
            inner = cls == k
        dist, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
        ref[k], near[k] = img[iy, ix], dist
    ref[BG] = np.full((H, W, 3), 255.0)

    cov = {k: np.zeros((H, W)) for k in classes}
    for y in range(H):
        for x in range(W):
            y0, y1, x0, x1 = max(0, y - 2), min(H, y + 3), max(0, x - 2), min(W, x + 3)
            present = set(np.unique(cls[y0:y1, x0:x1]).tolist())
            # latar selalu kandidat: di ujung takik yang lebih sempit dari 1 px
            # tidak ada piksel latar murni, tapi pikselnya tetap campuran dgn latar
            present = sorted(present | {BG})
            if len(present) == 1:
                cov[present[0]][y, x] = 1.0
                continue
            P = img[y, x]
            best = None
            for i in range(len(present)):
                for j in range(i + 1, len(present)):
                    a, b = present[i], present[j]
                    Ca = local_ref(img, cls, a, ref[a][y, x], near, y, x)
                    Cb = local_ref(img, cls, b, ref[b][y, x], near, y, x)
                    d = Ca - Cb
                    dd = float(d @ d)
                    if dd < 1e-6:
                        continue
                    t = float(np.clip((P - Cb) @ d / dd, 0.0, 1.0))
                    res = float(np.linalg.norm(P - (t * Ca + (1 - t) * Cb)))
                    if best is None or res < best[0]:
                        best = (res, a, b, t, dd)
            if best is None:
                cov[cls[y, x]][y, x] = 1.0
                continue
            _, a, b, t, dd = best
            pair = {a, b}
            if pair == {BG, GRAY} and cls[y, x] not in (BG, GRAY):
                # piksel fringe kelas lain (mis. navy pucat) di dekat pita putih:
                # unmix terhadap kelasnya sendiri, jangan dijadikan abu
                k = int(cls[y, x])
                Ck = local_ref(img, cls, k, ref[k][y, x], near, y, x)
                d = Ck - 255.0
                t = float(np.clip((P - 255.0) @ d / max(float(d @ d), 1e-6), 0.0, 1.0))
                cov[k][y, x] += t
                cov[BG][y, x] += 1 - t
                continue
            if pair == {BG, GRAY} or dd < 45.0**2:
                # abu pita vs latar putih terlalu mirip untuk di-unmix: pakai alpha asli
                k = GRAY if GRAY in pair else int(cls[y, x])
                other = (pair - {k}).pop() if len(pair) > 1 else BG
                on = 1.0 if (alpha[y, x] and cls[y, x] != BG) else 0.0
                cov[k][y, x] += on
                cov[other][y, x] += 1.0 - on
                continue
            cov[a][y, x] += t
            cov[b][y, x] += 1 - t
    return cov


def local_ref(img, cls, k, default, near, y, x):
    """Warna 'murni' kelas k di sekitar (y, x).

    Interior terdekat bila dekat. Untuk fitur tipis (mis. mata elang) cari
    piksel kelas k paling pekat di jendela 9x9 — hanya bila lebih pekat dari
    referensi interior, agar piksel fringe pucat terisolasi tidak menjadi
    referensinya sendiri.
    """
    if k == BG or near[k][y, x] <= 2.5:
        return default
    y0, y1, x0, x1 = max(0, y - 4), min(H, y + 5), max(0, x - 4), min(W, x + 5)
    win = img[y0:y1, x0:x1][cls[y0:y1, x0:x1] == k]
    if len(win) == 0:
        return default
    dist = np.linalg.norm(255.0 - win, axis=1)
    far = int(np.argmax(dist))
    return win[far] if dist[far] > np.linalg.norm(255.0 - default) else default


def field(cov2d, region=None):
    """Peta coverage 1x -> medan kontinu hi-res (bicubic + Gaussian ringan)."""
    c = cov2d.copy()
    if region is not None:
        c[~region] = 0.0
    big = np.array(Image.fromarray(c.astype(np.float32), mode="F").resize((W * SCALE, H * SCALE), Image.BICUBIC))
    if FIELD_SIGMA > 0:
        big = ndimage.gaussian_filter(big, FIELD_SIGMA * SCALE)
    return big


# ---------------------------------------------------------------------------
# Kontur -> path (garis lurus + Bezier kubik)
# ---------------------------------------------------------------------------


def contours(F):
    Fp = np.pad(F, 1, constant_values=0.0)
    out = []
    for c in measure.find_contours(Fp, 0.5):
        pts = np.c_[c[:, 1] - 1, c[:, 0] - 1]  # (x, y) hi-res, pusat piksel di integer
        pts = (pts + 0.5) / SCALE  # ruang piksel asli (tepi piksel di integer)
        if np.linalg.norm(pts[0] - pts[-1]) < 1e-6:
            pts = pts[:-1]
        if len(pts) >= 6 and abs(poly_area(pts)) >= MIN_AREA:
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


def find_corners(p):
    k = max(2, int(round(CORNER_ARM / STEP)))
    ang = turning(p, k)
    n = len(p)
    cand = np.nonzero(ang >= CORNER_DEG)[0]
    corners = []
    for i in cand:
        win = [(i + d) % n for d in range(-k, k + 1)]
        if ang[i] >= max(ang[j] for j in win) and not any((i - c) % n <= k or (c - i) % n <= k for c in corners):
            corners.append(int(i))
    return sorted(corners)


def smooth_open(seg, sigma_pts):
    """Gaussian sepanjang ruas terbuka; ujung dipaku (refleksi titik ganjil)."""
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
    return fit_cubic(pts[: split + 1], t1, tc, tol, depth + 1) + fit_cubic(pts[split:], -tc, t2, tol, depth + 1)


def end_tangent(seg, forward=True):
    k = min(len(seg) - 1, max(2, int(round(0.5 / STEP))))
    return unit(seg[k] - seg[0]) if forward else unit(seg[-1 - k] - seg[-1])


def rdp(pts, tol):
    """Ramer-Douglas-Peucker: indeks titik yang dipertahankan."""
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


def max_dev(pts, c, u):
    n = np.array([-u[1], u[0]])
    return float(np.abs((pts - c) @ n).max())


def sagitta(pts):
    """Lengkungan sistematis: |a|*(L/2)^2 dari fit parabola residu terhadap garis LSQ.

    Garis lurus yang ber-wobble punya residu acak (sagitta ~0); busur punya
    residu parabola (sagitta besar) walau deviasinya masih di bawah LINE_TOL.
    """
    c, u = lsq_line(pts)
    n = np.array([-u[1], u[0]])
    t = (pts - c) @ u
    r = (pts - c) @ n
    A = np.c_[t * t, t, np.ones_like(t)]
    coef, *_ = np.linalg.lstsq(A, r, rcond=None)
    L = t.max() - t.min()
    return abs(coef[0]) * (L / 2) ** 2, abs(coef[0])


def is_line(pts):
    """Garis lurus bila deviasi kecil DAN tidak melengkung sistematis.

    Sagitta tumbuh kuadratik terhadap panjang, jadi untuk ruas panjang juga
    diterima lengkungan yang sangat landai (jari-jari >= 300 px, sagitta
    <= 0,3 px) — itu noise anti-aliasing, bukan busur desain. Busur desain
    (pita R~50 px, elang & mangkuk huruf R<30 px) tetap kurva.
    """
    if len(pts) < 3 or (len(pts) - 1) * STEP < LINE_MIN:
        return False
    c, u = lsq_line(pts)
    if max_dev(pts, c, u) > LINE_TOL:
        return False
    sag, a = sagitta(pts)
    radius = 1 / (2 * a) if a > 1e-9 else np.inf
    return sag <= SAG_TOL or (radius >= 300 and sag <= 0.3)


def line_intersect(c1, u1, c2, u2):
    den = u1[0] * u2[1] - u1[1] * u2[0]
    if abs(den) < 1e-6:
        return None
    t = ((c2[0] - c1[0]) * u2[1] - (c2[1] - c1[1]) * u2[0]) / den
    return c1 + t * u1


def fit_segment(seg, t_start=None, t_end=None, meta=False):
    """Ruas antar sudut -> primitif ('L', p) / ('C', c1, c2, p).

    Run lurus (dideteksi RDP, panjang >= LINE_MIN, deviasi <= LINE_TOL)
    di-fit garis kuadrat-terkecil — merata-ratakan wobble tangga. Bagian
    lengkung di-fit Bezier dengan tangen menyambung (G1) ke garis tetangga.
    """
    sm = smooth_open(seg, SMOOTH_ALONG / STEP)
    n = len(sm)
    keep = rdp(sm, LINE_TOL)
    runs = []
    for a, b in zip(keep[:-1], keep[1:]):
        straight = is_line(sm[a : b + 1])
        if runs and runs[-1][2] and straight:
            a0 = runs[-1][0]
            if is_line(sm[a0 : b + 1]):
                runs[-1][1] = b
                continue
        if runs and not runs[-1][2] and not straight:
            runs[-1][1] = b
            continue
        runs.append([a, b, straight])

    # geometri garis: titik awal/akhir = proyeksi ke garis LSQ (ujung ruas dipaku)
    lines = {}
    for k, (a, b, st) in enumerate(runs):
        if not st:
            continue
        c, u = lsq_line(sm[a : b + 1])
        if a == 0 and b == n - 1:
            lines[k] = (seg[0], seg[-1], unit(seg[-1] - seg[0]))
            continue
        if a == 0:
            c = seg[0]
        if b == n - 1:
            c = seg[-1] if a != 0 else c
        pa = seg[0] if a == 0 else c + ((sm[a] - c) @ u) * u
        pb = seg[-1] if b == n - 1 else c + ((sm[b] - c) @ u) * u
        lines[k] = (pa, pb, unit(pb - pa))
    # dua garis bersebelahan: bertemu di titik potongnya (sudut tegas)
    for k in range(len(runs) - 1):
        if k in lines and (k + 1) in lines:
            pa1, pb1, u1 = lines[k]
            pa2, pb2, u2 = lines[k + 1]
            x = line_intersect(pa1, u1, pa2, u2)
            if x is not None and np.linalg.norm(x - pb1) < 1.0:
                lines[k] = (pa1, x, u1)
                lines[k + 1] = (x, pb2, u2)
            else:
                mid = (pb1 + pa2) / 2
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
        # di sambungan dengan garis, titik ujung garis sudah diproyeksikan ke
        # garis LSQ; lewati sampel kontur ~0,6 px terdekat agar kurva bisa
        # menyambung mulus tanpa "kait" kecil
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
        for c in fit_cubic(pts, t1, t2, CURVE_TOL):
            prims.append(("C", c[1], c[2], c[3]))
        cur = end
    if not meta:
        return prims
    # garis LSQ (tak dipaku) dari run pertama/terakhir, untuk penajaman sudut
    first = lsq_line(sm[runs[0][0] : runs[0][1] + 1]) if runs[0][2] else None
    last = lsq_line(sm[runs[-1][0] : runs[-1][1] + 1]) if runs[-1][2] else None
    return prims, first, last


def fit_contour(raw):
    p = resample_closed(raw)
    corners = find_corners(p)
    n = len(p)
    if not corners:
        # kontur tanpa sudut tajam (mis. lubang huruf): mulai di titik paling
        # lengkung, satu tangen bersama di titik awal/akhir agar mulus (G1)
        k = max(2, int(round(CORNER_ARM / STEP)))
        i0 = int(np.argmax(turning(p, k)))
        p = np.roll(p, -i0, axis=0)
        t = unit(p[1] - p[-1])
        seg = np.vstack([p, p[:1]])
        return p[0], fit_segment(seg, t_start=t, t_end=-t)
    segs = []
    for i, c0 in enumerate(corners):
        c1 = corners[(i + 1) % len(corners)]
        idx = np.arange(c0, c0 + ((c1 - c0) % n or n) + 1) % n
        segs.append(list(fit_segment(p[idx], meta=True)))
    # Sudut garis-garis: titik sudut dipindah ke perpotongan kedua garis LSQ
    # (sudut tegas yang tumpul karena anti-aliasing), maks 0,5 px.
    start = p[corners[0]]
    for j in range(len(segs)):
        prev, cur = segs[j - 1], segs[j]
        if prev[2] is None or cur[1] is None or prev[0][-1][0] != "L":
            continue
        X = line_intersect(prev[2][0], prev[2][1], cur[1][0], cur[1][1])
        if X is None or np.linalg.norm(X - p[corners[j]]) > CORNER_SHIFT:
            continue
        prev[0][-1] = ("L", X)
        if j == 0:
            start = X
    prims = [pr for sg in segs for pr in sg[0]]
    return start, prims


def fit_polygon(raw, n_expected=4, max_shift=1.0):
    """Mode poligon (kotak piksel): tiap tepi antar-sudut = garis LSQ dari 70%
    bagian tengahnya (ujung yang tumpul oleh anti-aliasing diabaikan); titik
    sudut = perpotongan tepi bersebelahan, maks max_shift px dari kontur."""
    p = resample_closed(raw)
    corners = find_corners(p)
    if len(corners) != n_expected:
        return None
    n = len(p)
    lines = []
    for i, c0 in enumerate(corners):
        c1 = corners[(i + 1) % len(corners)]
        idx = np.arange(c0, c0 + ((c1 - c0) % n or n) + 1) % n
        m = len(idx)
        mid = p[idx[int(m * 0.15) : int(m * 0.85) + 1]]
        lines.append(lsq_line(mid))
    verts = []
    for i in range(len(lines)):
        X = line_intersect(lines[i - 1][0], lines[i - 1][1], lines[i][0], lines[i][1])
        if X is None or np.linalg.norm(X - p[corners[i]]) > max_shift:
            return None
        verts.append(X)
    return verts[0], [("L", v) for v in verts[1:]] + [("L", verts[0])]


def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def path_d(start, prims):
    out = [f"M{fmt(start[0])} {fmt(start[1])}"]
    for pr in prims:
        if pr[0] == "L":
            out.append(f"L{fmt(pr[1][0])} {fmt(pr[1][1])}")
        else:
            _, c1, c2, e = pr
            out.append(f"C{fmt(c1[0])} {fmt(c1[1])} {fmt(c2[0])} {fmt(c2[1])} {fmt(e[0])} {fmt(e[1])}")
    return "".join(out) + "Z"


def point_in_poly(pt, poly):
    x, y = pt
    xs, ys = poly[:, 0], poly[:, 1]
    xj, yj = np.roll(xs, 1), np.roll(ys, 1)
    cond = ((ys > y) != (yj > y)) & (x < (xj - xs) * (y - ys) / (yj - ys + 1e-12) + xs)
    return bool(cond.sum() % 2)


@dataclass
class Component:
    d: str
    bbox: tuple
    area: float


def trace(F, corner_arm=None, corner_deg=None, corner_shift=None, polygon=False):
    """Medan hi-res -> komponen (kontur luar + lubangnya) sebagai path.

    corner_arm/corner_deg opsional per lapisan (mis. kotak piksel: sudut
    90 derajat yang tumpul oleh anti-aliasing perlu lengan ukur lebih panjang).
    """
    global CORNER_ARM, CORNER_DEG, CORNER_SHIFT
    saved = (CORNER_ARM, CORNER_DEG, CORNER_SHIFT)
    if corner_arm is not None:
        CORNER_ARM = corner_arm
    if corner_deg is not None:
        CORNER_DEG = corner_deg
    if corner_shift is not None:
        CORNER_SHIFT = corner_shift
    try:
        return _trace(F, polygon)
    finally:
        CORNER_ARM, CORNER_DEG, CORNER_SHIFT = saved


def _trace(F, polygon=False):
    cs = contours(F)
    depth = [sum(point_in_poly(c[0], o) for j, o in enumerate(cs) if j != i) for i, c in enumerate(cs)]
    outers = [i for i in range(len(cs)) if depth[i] % 2 == 0]
    comps = []
    for i in outers:
        # lubang < 1,5 px^2 = artefak titik-temu tiga warna; lubang desain
        # terkecil (counter huruf) > 10 px^2
        holes = [
            j
            for j in range(len(cs))
            if depth[j] == depth[i] + 1 and point_in_poly(cs[j][0], cs[i]) and abs(poly_area(cs[j])) >= 1.5
        ]
        fitted = fit_polygon(cs[i]) if polygon and not holes else None
        if polygon and fitted is None:
            raise RuntimeError(f"mode poligon gagal untuk kontur di {cs[i].min(axis=0)}")
        d = path_d(*fitted) if fitted else "".join(path_d(*fit_contour(cs[k])) for k in [i] + holes)
        xs, ys = cs[i][:, 0], cs[i][:, 1]
        comps.append(Component(d, (xs.min(), ys.min(), xs.max(), ys.max()), abs(poly_area(cs[i]))))
    return comps


# ---------------------------------------------------------------------------
# Warna dari piksel asli
# ---------------------------------------------------------------------------


@dataclass
class Grad:
    x1: float
    y1: float
    x2: float
    y2: float
    stops: list = dc_field(default_factory=list)  # (offset, rgb, opacity)
    units: str = "userSpaceOnUse"


def hexc(c):
    c = np.clip(np.round(c), 0, 255).astype(int)
    return "#%02x%02x%02x" % tuple(c)


LUMA = np.array([0.2126, 0.7152, 0.0722])


def fit_gradient(px, py, cols, nstops=6, weights=None):
    """Gradien linear multi-stop: arah dari regresi luminans, stop = median per bin."""
    L = cols @ LUMA
    A = np.c_[np.ones_like(px), px, py]
    w = np.ones_like(px) if weights is None else weights
    coef, *_ = np.linalg.lstsq(A * w[:, None], L * w, rcond=None)
    g = coef[1:]
    if np.linalg.norm(g) < 0.15:
        return hexc(np.median(cols, axis=0)), (lambda X, Y: np.tile(np.median(cols, axis=0), (len(X), 1)))
    dv = g / np.linalg.norm(g)
    cx, cy = px.mean(), py.mean()
    s = (px - cx) * dv[0] + (py - cy) * dv[1]
    s0, s1 = np.percentile(s, 0.5), np.percentile(s, 99.5)
    edges = np.linspace(s0, s1, nstops + 1)
    stops = []
    for i in range(nstops):
        sel = (s >= edges[i]) & (s <= edges[i + 1])
        if weights is not None:
            sel &= weights > 0.5
        if sel.sum() < 3:
            continue
        stops.append([((edges[i] + edges[i + 1]) / 2 - s0) / (s1 - s0), np.median(cols[sel], axis=0), 1.0])
    stops[0][0], stops[-1][0] = 0.0, 1.0
    so = np.array([st[0] for st in stops])
    sc = np.array([st[1] for st in stops])

    def predict(X, Y):
        o = np.clip(((X - cx) * dv[0] + (Y - cy) * dv[1] - s0) / (s1 - s0), 0, 1)
        return np.stack([np.interp(o, so, sc[:, ch]) for ch in range(3)], axis=1)

    gr = Grad(cx + s0 * dv[0], cy + s0 * dv[1], cx + s1 * dv[0], cy + s1 * dv[1], [tuple(s) for s in stops])
    return gr, predict


def grad_xml(gid, g):
    if isinstance(g, str):
        return ""
    st = "".join(
        f'<stop offset="{o:.3f}" stop-color="{hexc(c)}"' + (f' stop-opacity="{a:.3f}"' if a < 0.999 else "") + "/>"
        for o, c, a in g.stops
    )
    return (
        f'<linearGradient id="{gid}" gradientUnits="{g.units}" x1="{fmt(g.x1)}" y1="{fmt(g.y1)}" '
        f'x2="{fmt(g.x2)}" y2="{fmt(g.y2)}">{st}</linearGradient>'
    )


def fill_of(gid, g):
    return g if isinstance(g, str) else f"url(#{gid})"


def interior(m, it=1):
    return ndimage.binary_erosion(m, np.ones((3, 3), bool), iterations=it)


def inside(bb, box):
    return bb[0] >= box[0] and bb[1] >= box[1] and bb[2] <= box[2] and bb[3] <= box[3]


def coords(mask):
    ys, xs = np.nonzero(mask)
    return xs + 0.5, ys + 0.5, ys, xs


# ---------------------------------------------------------------------------


def main():
    img, alpha = load()
    cls = classify(img, alpha)
    cov = unmix(img, alpha, cls)
    left = np.zeros((H, W), bool)
    left[:, :SPLIT_X] = True
    right = ~left
    solid = 1.0 - cov[BG]
    report = {}

    # --- warna dasar perisai (robust: tolak piksel highlight lewat iterasi) ---
    eye_zone = zone((EYE_BOX[0], EYE_BOX[1], EYE_BOX[2], EYE_BOX[3]))
    shield_m = interior((cls == DARK) & left) & ~eye_zone
    px, py, yy, xx = coords(shield_m)
    cols = img[yy, xx]
    w = np.ones(len(px))
    for _ in range(4):
        g_shield, pred = fit_gradient(px, py, cols, nstops=7, weights=w)
        resid = (cols - pred(px, py)) @ LUMA
        w = (resid < 6.0).astype(float)
    base_rms = float(np.sqrt((((cols - pred(px, py)) ** 2).sum(1))[w > 0.5].mean()))
    report["shield_base_rms_tanpa_highlight"] = round(base_rms, 2)

    # --- highlight: warna terang + opasitas dari unmixing terhadap gradien dasar ---
    # Pita terang = "bingkai dalam" perisai: tepi atas & kiri tegas, terpotong
    # elang di bawah, memudar ke kanan. Dibatasi >= 2 px dari tepi luar perisai
    # (fringe putih tepi bukan highlight) dan bukan di sekitar kotak piksel.
    allx, ally = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
    B = pred(allx.ravel(), ally.ravel()).reshape(H, W, 3)
    from skimage.morphology import convex_hull_image

    hull = convex_hull_image((cls != BG) & left)
    rim = ndimage.distance_transform_edt(hull) < 3.0  # tepi luar perisai (bukan tepi elang)
    inner = (cls == DARK) & left & ~eye_zone & ~rim
    near_sq = ndimage.binary_dilation(cls == SQ, np.ones((3, 3), bool), iterations=2)
    lift = ((img - B) @ LUMA) * inner
    seed = inner & ~near_sq & (lift > 8)
    lab, n = ndimage.label(seed)
    sizes = ndimage.sum(seed, lab, range(1, n + 1))
    seed = lab == (1 + int(np.argmax(sizes)))
    # kotak piksel digambar di atas highlight, jadi area di bawahnya boleh ikut
    region = ndimage.binary_dilation(seed, np.ones((3, 3), bool), iterations=2) & (inner | near_sq)
    # warna "bersih" (tanpa fringe putih): piksel tepi DARK diganti warna
    # interior DARK terdekat, agar tepi elang tidak terbaca sebagai highlight
    dark_inner = ndimage.binary_erosion(cls == DARK, np.ones((3, 3), bool))
    _, (iy, ix) = ndimage.distance_transform_edt(~dark_inner, return_indices=True)
    clean = np.where(((cls == DARK) & (cov[DARK] < 0.98))[:, :, None], img[iy, ix], img)
    Hc = np.percentile(clean[seed], 97, axis=0)  # warna highlight paling terang
    d = Hc[None, None, :] - B
    a_map = np.clip(((clean - B) * d).sum(2) / np.maximum((d * d).sum(2), 1e-6), 0, 1) * region
    # opasitas: gradien linear sepanjang arah pudar (regresi), stop = median per bin
    hpx, hpy, hyy, hxx = coords(seed)
    av = a_map[hyy, hxx]
    coef, *_ = np.linalg.lstsq(np.c_[np.ones_like(hpx), hpx, hpy], av, rcond=None)
    dv = unit(-coef[1:])  # dari terang ke redup
    cx, cy = hpx.mean(), hpy.mean()
    s = (hpx - cx) * dv[0] + (hpy - cy) * dv[1]
    s0, s1 = np.percentile(s, 0.5), np.percentile(s, 99.5)
    nb = 7
    edges = np.linspace(s0, s1, nb + 1)
    so, sa = [], []
    for i in range(nb):
        sel = (s >= edges[i]) & (s <= edges[i + 1])
        if sel.sum() >= 3:
            so.append(((edges[i] + edges[i + 1]) / 2 - s0) / (s1 - s0))
            sa.append(float(np.median(av[sel])))
    so[0] = 0.0
    sa = list(np.maximum.accumulate(np.array(sa)[::-1])[::-1])  # monoton memudar
    # pudar sampai 0 tepat di ujung jauh region -> batas bentuk di sisi pudar tak terlihat
    rpx, rpy, _, _ = coords(region)
    s_end = float(((rpx - cx) * dv[0] + (rpy - cy) * dv[1]).max())
    so = [o * (s1 - s0) / (s_end - s0) for o in so] + [1.0]
    sa = sa + [0.0]
    s1 = s_end
    g_hl = Grad(cx + s0 * dv[0], cy + s0 * dv[1], cx + s1 * dv[0], cy + s1 * dv[1], [(o, Hc, a) for o, a in zip(so, sa)])
    # bentuk: coverage = opasitas aktual / opasitas model -> tepi tegas tepat di 50%
    S_all = np.clip(((allx - cx) * dv[0] + (ally - cy) * dv[1] - s0) / (s1 - s0), 0, 1)
    a_exp = np.interp(S_all, so, sa)
    hl_cov = np.where(a_exp > 0.04, np.clip(a_map / np.maximum(a_exp, 1e-3), 0, 1), (a_map > 0.02).astype(float))
    hl_cov *= region
    report["highlight_warna"] = hexc(Hc)
    report["highlight_opasitas"] = [round(a, 2) for a in sa]

    # --- medan coverage hi-res ---
    # Lapisan bertumpuk (bawah -> atas): navy, kotak piksel, pita merah, pita
    # putih. Lapisan bawah hanya diperluas 0,5 px ke BAWAH lapisan di atasnya
    # (batas internal, mencegah celah/seam), tidak di tepi luar — sehingga
    # tidak ada garis tepi navy tipis di sekeliling pita/kotak.
    F_sil = field(solid, left)
    F_word = field(solid, right)
    F_dark = np.minimum(field(cov[DARK], left), F_sil)
    F_red = np.minimum(field(cov[RED], left), F_sil)
    F_gray = np.minimum(field(cov[GRAY], left), F_sil)
    F_sq = np.minimum(field(cov[SQ], left), F_sil)
    F_hl = np.minimum(field(hl_cov, left), F_sil)
    F_wdark = np.minimum(field(cov[DARK], right), F_word)
    F_mred = np.minimum(field(cov[RED], right), F_word)

    def extend(F_layer, bound):
        """Perluas lapisan 0,6 px, hanya ke area siluet yang belum ditutup
        lapisan di bawahnya. Menutup takik di pertemuan tiga warna (merah +
        navy + latar: masing-masing < 0,5 tapi jumlahnya > 0,5) dan mencegah
        celah, tanpa menimpa lapisan bawah dan tanpa garis tepi di tepi luar
        (kecuali <= 0,6 px di dekat titik pertemuan)."""
        r = int(round(0.6 * SCALE))
        yy, xx = np.mgrid[-r : r + 1, -r : r + 1]
        grown = ndimage.grey_dilation(F_layer, footprint=(xx * xx + yy * yy) <= r * r)
        return np.maximum(F_layer, np.minimum(grown, bound))

    F_base = extend(F_dark, F_sil)
    F_sq = extend(F_sq, np.minimum(F_sil, 1 - F_dark))
    F_red = extend(F_red, np.minimum.reduce([F_sil, 1 - F_dark, 1 - F_sq]))
    F_wbase = extend(F_wdark, F_word)

    shield_c = trace(F_base)
    eye = [c for c in shield_c if inside(c.bbox, EYE_BOX)]
    shield = [c for c in shield_c if not inside(c.bbox, EYE_BOX)]
    word = trace(F_wbase)
    m_letter = [c for c in word if inside(c.bbox, M_BOX)]
    erdeka = sorted([c for c in word if not inside(c.bbox, M_BOX)], key=lambda c: c.bbox[0])
    red_c, gray_c, sq_c, hl_c, mred_c = trace(F_red), trace(F_gray), trace(F_sq, corner_arm=1.0, corner_deg=30, polygon=True), trace(F_hl), trace(F_mred)
    hl_c = [max(hl_c, key=lambda c: c.area)]  # satu pita highlight; serpihan kecil = noise
    report["komponen"] = {
        "perisai": len(shield),
        "mata": len(eye),
        "highlight": len(hl_c),
        "kotak_piksel": len(sq_c),
        "pita_merah": len(red_c),
        "pita_putih": len(gray_c),
        "M": len(m_letter),
        "M_merah": len(mred_c),
        "erdeka": len(erdeka),
    }
    assert len(eye) == 1 and len(m_letter) == 2 and len(erdeka) == 6 and len(sq_c) == 3, report["komponen"]

    # --- warna elemen lain ---
    def grad_for(mask, nstops):
        px, py, yy, xx = coords(mask)
        g, pr = fit_gradient(px, py, img[yy, xx], nstops=nstops)
        rms = float(np.sqrt(((img[yy, xx] - pr(px, py)) ** 2).sum(1).mean()))
        return g, rms

    eye_px = (cls == DARK) & eye_zone & (cov[DARK] > 0.9)
    g_eye = hexc(np.median(img[eye_px], axis=0))
    g_red, report["rms_pita_merah"] = grad_for(interior((cls == RED) & left), 6)
    g_gray, report["rms_pita_putih"] = grad_for(interior((cls == GRAY) & left), 5)
    word_px = interior((cls == DARK) & right, 2)
    g_word = hexc(np.median(img[word_px], axis=0))
    g_mred, report["rms_M_merah"] = grad_for(interior((cls == RED) & right), 4)

    # kotak piksel: satu gradien objectBoundingBox untuk ketiganya
    sq_lab, nsq = ndimage.label(interior(cls == SQ))
    U, V, C = [], [], []
    for i in range(1, nsq + 1):
        yy, xx = np.nonzero(sq_lab == i)
        if len(yy) < 10:
            continue
        x0, x1, y0, y1 = xx.min() - 1, xx.max() + 2, yy.min() - 1, yy.max() + 2
        U.append((xx + 0.5 - x0) / (x1 - x0))
        V.append((yy + 0.5 - y0) / (y1 - y0))
        C.append(img[yy, xx])
    g_sq, _ = fit_gradient(np.concatenate(U), np.concatenate(V), np.concatenate(C), nstops=4)
    if not isinstance(g_sq, str):
        g_sq.units = "objectBoundingBox"

    defs = "".join(
        grad_xml(i, g)
        for i, g in [
            ("g-shield", g_shield),
            ("g-shine", g_hl),
            ("g-red", g_red),
            ("g-white", g_gray),
            ("g-pixel", g_sq),
            ("g-m-red", g_mred),
        ]
    )

    def path(pid, comps, fill):
        idattr = f' id="{pid}"' if pid else ""
        return f'<path{idattr} fill="{fill}" fill-rule="evenodd" d="{"".join(c.d for c in comps)}"/>'

    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 402 138" width="402" height="138">',
        "<title>Merdeka</title>",
        f"<defs>{defs}</defs>",
        '<g id="mark">',
        path("shield", shield, fill_of("g-shield", g_shield)),
        path("shield-shine", hl_c, "url(#g-shine)"),
        path("eye", eye, g_eye),
        '<g id="pixels">' + "".join(path(None, [c], fill_of("g-pixel", g_sq)) for c in sorted(sq_c, key=lambda c: c.bbox[1])) + "</g>",
        path("ribbon-red", red_c, fill_of("g-red", g_red)),
        path("ribbon-white", gray_c, fill_of("g-white", g_gray)),
        "</g>",
        '<g id="wordmark">',
        path("wordmark-m", m_letter, g_word),
        path("wordmark-m-red", mred_c, fill_of("g-m-red", g_mred)),
        path("wordmark-erdeka", erdeka, g_word),
        "</g>",
        "</svg>",
    ]
    out = os.environ.get("TRACE_OUT") or os.path.join(OUT_DIR, "logo.svg")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        f.write("\n".join(parts) + "\n")
    report["warna"] = {
        k: (g if isinstance(g, str) else [hexc(st[1]) for st in g.stops])
        for k, g in [
            ("perisai", g_shield),
            ("mata", g_eye),
            ("pita_merah", g_red),
            ("pita_putih", g_gray),
            ("kotak_piksel", g_sq),
            ("wordmark", g_word),
            ("M_merah", g_mred),
        ]
    }
    print(json.dumps(report, indent=1))
    print("ditulis", out, os.path.getsize(out), "byte")


if __name__ == "__main__":
    main()
