# Ortak çekirdek: macenta (#FF00FF) zemini saydam yapar, bağlı bileşenleri bulur, 9-slice payı önerir, sızıntı denetler.
# Kaynak: AI Dungeon tools/icons/{key_magenta,s18_cut,slice}.py — burada alfa DOĞRUSAL tahmin + renk çözme (despill) ile.
# kes.py ve izgara.py bunu içe aktarır (python -I betik klasörünü sys.path'e koymaz; onlar elle ekler).
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

SEKIZ = np.ones((3, 3), bool)  # 8-komşuluk
try:  # Windows konsolu cp1254: Türkçe/Δ çıktısı çökmesin
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except (AttributeError, ValueError):
    pass


def yukle(yol):
    with open(yol, 'rb') as f:
        im = Image.open(f)
        im.load()
    return np.array(im.convert('RGB')).astype(float)


def taban_sec(yol, verilen=None):
    """JPEG 8x8 blok gürültüsü zeminde soluk leke bırakır: JPEG girdide alfa tabanı yükselir (ölçüm: kit-notu.md)."""
    if verilen is not None:
        return verilen
    return 0.06 if os.path.splitext(yol)[1].lower() in ('.jpg', '.jpeg') else 0.04


def anahtarla(C, alt=0, ust=0, taban=0.04, tavan=0.97, koru=10, kenar=2):
    """Macenta zemin -> alfa. C: float RGB (H,W,3). Dönüş: float RGBA 0..255.
    Model: görülen = a*ön + (1-a)*M. 'Macentalık' m = min(R,B) - G; zeminde m = mM (~255), macenta içermeyen önde m <= 0.
    1) a0 = 1 - (m - alt) / (mM - ust - alt)   (alt/ust: pay; 0 en az yanlı — ölçüm kit-notu.md; taban/tavan kırpar)
    2) Yarı saydam pikselde ön rengi en yakın opak komşudan alınır, a = (mM - m) / (mM - m_ön) ile düzeltilir (yeşil/mavi kenar).
    3) Koruma: zemine (tam saydam bölgeye) yarı saydam zincirle bağlı OLMAYAN pikseller opak kalır; bağlı olsa da zeminden
       'koru' px içeride, DÜZ tonlu (7x7 alfa sapması < 0.015) ve gölge rengi taşımayan (G belirgin) pikseller opak sayılır
       (mor taş/pembe yüz gibi içerik; kenar yumuşatması ve parıltı eğimli olduğu için dokunulmaz).
    4) Renk çözme (despill): ön = (görülen - (1-a)*M) / a  -> kenardaki pembe hale ve gölgedeki macenta katkısı silinir."""
    r, g, b = C[..., 0], C[..., 1], C[..., 2]
    m = np.minimum(r, b) - g
    sert0 = m > 200
    M = np.median(C[sert0], axis=0) if sert0.sum() > 100 else np.array([255., 0., 255.])
    mM = max(min(M[0], M[2]) - M[1], 120.0)
    a = np.clip(1 - (m - alt) / (mM - ust - alt), 0, 1)
    a0 = a

    opak = a >= 0.999
    yari = (a > 0) & ~opak
    if opak.any() and yari.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~opak, return_indices=True)
        F0 = C[iy, ix]
        mF = np.minimum(np.minimum(F0[..., 0], F0[..., 2]) - F0[..., 1], mM * 0.5)
        a2 = np.clip((mM - ust - m) / (mM - ust - mF), 0, 1)
        a = np.where(yari, np.minimum(a2, 1.0), a)

    sert = a <= 0.0
    L, _ = ndimage.label(a < 0.999, structure=SEKIZ)
    bagli = np.unique(L[sert])
    a = np.where((a < 0.999) & ~np.isin(L, bagli[bagli > 0]), 1.0, a)
    if koru:  # zeminden 'koru' px içeride, gölge gibi olmayan (yeşili belirgin) yarı saydam = mor/pembe içerik -> opak
        uzak = ndimage.distance_transform_edt(a > 0) > koru
        golgemsi = g < 0.25 * np.minimum(r, b) + 12  # gölge = M'nin koyulaşmışı: G ~ 0
        ort = ndimage.uniform_filter(a0, 7)
        duz = np.sqrt(np.maximum(ndimage.uniform_filter(a0 * a0, 7) - ort * ort, 0)) < 0.015  # düz ton (kenar/parıltı değil)
        tohum = uzak & duz & ~golgemsi & (a < 1)
        if tohum.any():  # tohumdan, AA bandı (3 px) dışındaki gölgemsi olmayan yarı saydam komşulara yayıl (çizgi/vurgu kenarı)
            aday = (ndimage.distance_transform_edt(a > 0) > 3) & ~golgemsi & (a < 1)
            La, _ = ndimage.label(aday, structure=SEKIZ)
            ids = np.unique(La[tohum])
            a = np.where(np.isin(La, ids[ids > 0]) | tohum, 1.0, a)

    a = np.where(a < taban, 0.0, np.where(a > tavan, 1.0, a))  # JPEG/gürültü: çok soluk leke yok, gövde tam opak
    if kenar:
        a[:kenar] = 0; a[-kenar:] = 0; a[:, :kenar] = 0; a[:, -kenar:] = 0
    A = a[..., None]
    F = np.where(A > 0.004, (C - (1 - A) * M) / np.maximum(A, 0.004), 0)
    F = np.clip(F, 0, 255)
    return np.dstack([F, a * 255])


def bilesenler(A, birlestir=6, esik=10, min_alan=400):
    """Alfa > esik maskesini 'birlestir' px genişletip etiketler (aynı parçanın kopuk süsleri birleşir).
    Dönüş: (parçalar, gürültü sayısı); parça = (y0,y1,x0,x1, etiket maskesi dilimi). min_alan: alfa toplamı (opak px eşdeğeri)."""
    mask = A[..., 3] > esik
    gen = ndimage.binary_dilation(mask, structure=SEKIZ, iterations=birlestir) if birlestir else mask
    L, n = ndimage.label(gen, structure=SEKIZ)
    L = L * mask
    agirlik = ndimage.sum(A[..., 3] / 255, L, index=np.arange(1, n + 1))
    parcalar, gurultu = [], 0
    for i, s in enumerate(ndimage.find_objects(L), 1):
        if s is None:
            continue
        if agirlik[i - 1] < min_alan:
            gurultu += 1
            continue
        parcalar.append((s[0].start, s[0].stop, s[1].start, s[1].stop, i))
    return parcalar, gurultu, L


def satir_sirala(parcalar):
    """Okuma sırası: dikeyde örtüşen parçalar aynı satır, satır içinde soldan sağa."""
    kalan = sorted(parcalar, key=lambda p: p[0])
    satirlar = []
    for p in kalan:
        h = p[1] - p[0]
        for st in satirlar:
            y0, y1 = st['y']
            ort = min(y1, p[1]) - max(y0, p[0])
            if ort > 0.5 * min(h, y1 - y0):
                st['p'].append(p); st['y'] = (min(y0, p[0]), max(y1, p[1]))
                break
        else:
            satirlar.append({'y': (p[0], p[1]), 'p': [p]})
    satirlar.sort(key=lambda s: s['y'][0])
    return [p for st in satirlar for p in sorted(st['p'], key=lambda q: q[2])]


def kirp(A, L, p, pay=2):
    """Parçayı sıkı kırp (başka etiketlerin pikselleri silinir) + 'pay' px saydam kenar."""
    y0, y1, x0, x1, i = p
    sub = A[y0:y1, x0:x1].copy()
    sub[L[y0:y1, x0:x1] != i] = 0
    out = np.zeros((y1 - y0 + 2 * pay, x1 - x0 + 2 * pay, 4))
    out[pay:pay + y1 - y0, pay:pay + x1 - x0] = sub
    return out


def goruntu(sub):
    s = sub.copy()
    s[s[..., 3] < 3] = 0  # tam saydamın rengi sıfır: sıkıştırma + kenar süzgeci temiz
    return Image.fromarray(np.clip(s, 0, 255).round().astype(np.uint8), 'RGBA')


def webp_kaydet(im, yol, kalite=90, kayipsiz=False):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, 'wb') as f:
        if kayipsiz:
            im.save(f, 'WEBP', lossless=True, quality=100, method=6)
        else:
            im.save(f, 'WEBP', quality=kalite, alpha_quality=100, method=4)
    with open(yol, 'rb') as f:  # denetim diskteki (sıkıştırılmış) dosyada yapılsın: WebP renk alt-örneklemesi de hale yapabilir
        geri = Image.open(f)
        geri.load()
    return geri.convert('RGBA')


def png_kaydet(im, yol):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with open(yol, 'wb') as f:
        im.save(f, 'PNG')


def json_yaz(yol, veri):
    with open(yol, 'wb') as f:
        f.write((json.dumps(veri, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def json_oku(yol):
    with open(yol, 'rb') as f:
        return json.loads(f.read().decode('utf-8-sig'))


# ---------------------------------------------------------------- denetim
def sizinti(im):
    """Kenar bölgesinde (yarı saydam + saydamlığa 2 px komşu opak) macentaya yakın piksel oranı.
    Macentaya yakın: min(R,B) - G > 60 ve R,B > 120 (pembe/mor hale)."""
    a = np.array(im).astype(float)
    al = a[..., 3]
    seffaf = al < 5
    kenar = ((al >= 5) & (al < 250)) | ((al >= 250) & ndimage.binary_dilation(seffaf, structure=SEKIZ, iterations=2))
    n = int(kenar.sum())
    if n == 0:
        return 0.0, 0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pembe = (np.minimum(r, b) - g > 60) & (r > 120) & (b > 120)
    return float((pembe & kenar).sum() / n), n


# ---------------------------------------------------------------- 9-slice
def dilim_payi(im, t=22):
    """s18_cut.slices: komşu sütun/satır farkı (7 px kayan ortalama, alfa ön-çarpımlı) art arda iki kez t'yi aşınca kenar başlar."""
    a = np.array(im).astype(float)
    a[..., :3] *= a[..., 3:4] / 255
    H, W = a.shape[:2]

    def fark(u, v):
        return ndimage.uniform_filter1d(np.abs(u - v).mean(-1), 7).max()

    def kos(n, al):
        d = [fark(al(i), al(i + 1)) for i in range(n - 1)]
        buyuk = lambda i: 0 <= i < n - 1 and d[i] >= t
        lo = n // 2
        while lo > 0 and not (buyuk(lo - 1) and buyuk(lo - 2)):
            lo -= 1
        hi = n // 2
        while hi < n - 1 and not (buyuk(hi) and buyuk(hi + 1)):
            hi += 1
        return lo, n - 1 - hi

    l, r = kos(W, lambda x: a[:, x])
    u, b = kos(H, lambda y: a[y, :])
    return l, u, r, b


def kose_yaricap(im, esik=128):
    """Köşe yarıçapı alfa profilinden: gövde (alfa>esik) kenarının düz kısma ulaşana dek kaç satır/sütun eğildiği.
    Dönüş: {sol_ust, sag_ust, sol_alt, sag_alt} px + gövde kutusu (x0,y0,x1,y1)."""
    m = np.array(im)[..., 3] > esik
    ys, xs = np.where(m)
    if len(xs) == 0:
        return None, None
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = m[y0:y1, x0:x1]
    H, W = m.shape

    def egri(profil):
        # profil[i]: i. satırdaki boşluk (gövde kenarından içeri ilk dolu piksele uzaklık); düze inene kadar kaç satır
        p = np.asarray(profil, float)
        if len(p) == 0:
            return 0
        taban = np.median(p[len(p) // 3: 2 * len(p) // 3 + 1]) if len(p) > 3 else p.min()
        k = 0
        while k < len(p) and p[k] > taban + 0.5:
            k += 1
        return k

    def ilk(row):
        nz = np.flatnonzero(row)
        return nz[0] if len(nz) else len(row)

    sol = [ilk(m[y]) for y in range(H)]
    sag = [ilk(m[y][::-1]) for y in range(H)]
    ust = [ilk(m[:, x]) for x in range(W)]
    alt = [ilk(m[:, x][::-1]) for x in range(W)]
    yar = H // 2; yaw = W // 2
    r = {
        'sol_ust': max(egri(sol[:yar]), egri(ust[:yaw])),
        'sag_ust': max(egri(sag[:yar]), egri(ust[::-1][:yaw])),
        'sol_alt': max(egri(sol[::-1][:yar]), egri(alt[:yaw])),
        'sag_alt': max(egri(sag[::-1][:yar]), egri(alt[::-1][:yaw])),
    }
    return r, (int(x0), int(y0), int(x1), int(y1))


def dokuz_dilim(im):
    """Önerilen 9-slice payı (sol, üst, sağ, alt): renk profili ile köşe yarıçapının büyüğü, +2 güvenlik, yarıyı aşmaz.
    Gerilebilir merkez kalmıyorsa None (rozet/nokta gibi parçalar)."""
    W, H = im.size
    l, u, r, b = dilim_payi(im)
    yr, kutu = kose_yaricap(im)
    if yr:
        x0, y0, x1, y1 = kutu
        l = max(l, x0 + max(yr['sol_ust'], yr['sol_alt']))
        r = max(r, W - x1 + max(yr['sag_ust'], yr['sag_alt']))
        u = max(u, y0 + max(yr['sol_ust'], yr['sag_ust']))
        b = max(b, H - y1 + max(yr['sol_alt'], yr['sag_alt']))
    sinir = lambda v, n: int(min(v + 2, n // 2 - 1))
    pay = [sinir(l, W), sinir(u, H), sinir(r, W), sinir(b, H)]
    gerilebilir = W - pay[0] - pay[2] >= 4 and H - pay[1] - pay[3] >= 4
    return (pay if gerilebilir else None), yr


def css_satiri(yol_url, pay, olcek):
    """CSS border-image örneği. pay = (sol, üst, sağ, alt) kaynak px; olcek = kaynak px -> CSS px (ör. 0.5)."""
    l, u, r, b = pay
    w = lambda v: f'{round(v * olcek)}px'
    return (f"border-style: solid; border-width: {w(u)} {w(r)} {w(b)} {w(l)}; "
            f"border-image: url('{yol_url}') {u} {r} {b} {l} fill / {w(u)} {w(r)} {w(b)} {w(l)} stretch;")


# ---------------------------------------------------------------- önizleme
def onizleme(ogeler, yol, hucre=200, sutun=6):
    """ogeler: (ad, im, pay|None, uyarı) — koyu/açık damalı zemin, kırmızı çizgi = 9-slice payı, uyarı sarı."""
    satir = max(1, (len(ogeler) + sutun - 1) // sutun)
    sayfa = Image.new('RGBA', (sutun * hucre, satir * hucre), (15, 20, 24, 255))
    d = ImageDraw.Draw(sayfa)
    try:
        font = ImageFont.truetype('arial.ttf', 12)
    except OSError:
        font = ImageFont.load_default()
    for i, (ad, im, pay, uyari) in enumerate(ogeler):
        rr, c = divmod(i, sutun)
        x0, y0 = c * hucre, rr * hucre
        for yy in range(y0 + 4, y0 + hucre - 36, 10):  # dama: yarısı koyu yarısı açık
            for xx in range(x0 + 4, x0 + hucre - 4, 10):
                acik = xx >= x0 + hucre // 2
                ton = (200, 200, 200) if acik else (40, 44, 48)
                if ((xx - x0) // 10 + (yy - y0) // 10) % 2:
                    ton = tuple(v + 18 for v in ton)
                d.rectangle([xx, yy, min(xx + 9, x0 + hucre - 5), min(yy + 9, y0 + hucre - 37)], fill=ton + (255,))
        k = min((hucre - 16) / im.width, (hucre - 48) / im.height, 2.0)
        th = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        px, py = x0 + (hucre - th.width) // 2, y0 + 6 + (hucre - 48 - th.height) // 2
        sayfa.alpha_composite(th, (px, py))
        if pay:
            l, u, r, b = pay
            for xx in (px + l * k, px + th.width - r * k):
                d.line([(xx, py), (xx, py + th.height)], fill=(255, 60, 60, 220))
            for yy in (py + u * k, py + th.height - b * k):
                d.line([(px, yy), (px + th.width, yy)], fill=(255, 60, 60, 220))
        d.text((x0 + 6, y0 + hucre - 32), ad, fill=(255, 210, 80, 255) if uyari else (247, 238, 220, 255), font=font)
        alt = f'{im.width}x{im.height}' + (f'  {"/".join(map(str, pay))}' if pay else '')
        d.text((x0 + 6, y0 + hucre - 17), alt, fill=(169, 176, 183, 255), font=font)
    png_kaydet(sayfa, yol)
