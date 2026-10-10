# SENTETİK sınama: macenta zeminde anti-aliased, gölgeli UI parça sayfası + 4×4 ikon ızgarası üretir (PNG + JPEG q80),
# kes.py / izgara.py'yi çalıştırır, sonucu gerçek katmanlarla (doğruluk) karşılaştırıp sayı tablosu basar.
# Kullanım:  python -I tools/ui-kit/ornek/sina.py        (çıktı: tools/ui-kit/ornek/cikti/{png,jpg}/{kit,ikon})
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BURA = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(BURA))
import anahtar as K  # noqa: E402
import izgara  # noqa: E402
import kes  # noqa: E402

SS = 4  # süper örnekleme (anti-aliasing)
MACENTA = (255, 0, 255, 255)


# ---------------------------------------------------------------- çizim yardımcıları (SS kat büyük çizilir, küçültülür)
def katman(w, h, ciz, golge=(0, 6, 8, 0.45), parilti=None):
    """w×h parça; ciz(d, s) SS ölçekli çizer. Dönüş: RGBA katman (gölge/parıltı için kenar payıyla) ve pay."""
    pay = 24
    W, H = (w + 2 * pay) * SS, (h + 2 * pay) * SS
    govde = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(govde)
    ciz(d, lambda v: v * SS, pay * SS)
    govde = govde.resize((w + 2 * pay, h + 2 * pay), Image.LANCZOS)
    alt = Image.new('RGBA', govde.size, (0, 0, 0, 0))
    if parilti:
        renk, yaricap = parilti
        a = govde.split()[3].filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(yaricap))
        p = Image.new('RGBA', govde.size, renk + (0,)); p.putalpha(a.point(lambda v: int(v * 0.9)))
        alt.alpha_composite(p)
    if golge:
        dx, dy, bl, op = golge
        a = govde.split()[3].filter(ImageFilter.GaussianBlur(bl))
        g = Image.new('RGBA', govde.size, (0, 0, 0, 0)); g.putalpha(a.point(lambda v: int(v * op)))
        alt.alpha_composite(g, (dx, dy))
    alt.alpha_composite(govde)
    return alt, pay


def saydam(fn):
    """Yarı saydam dolgu ImageDraw'da pikseli DEĞİŞTİRİR (delik açar); ayrı katmanda çizip üstüne bindirilir."""
    def sar(d, s, o, *a, **k):
        fill = k.get('fill', a[-1] if a and isinstance(a[-1], tuple) and len(a[-1]) == 4 else None)
        if fill is None or fill[3] == 255:
            return fn(d, s, o, *a, **k)
        ov = Image.new('RGBA', d._image.size, (0, 0, 0, 0))
        fn(ImageDraw.Draw(ov), s, o, *a, **k)
        d._image.alpha_composite(ov)
    return sar


@saydam
def rr(d, s, o, x0, y0, x1, y1, r, fill, outline=None, width=0):
    d.rounded_rectangle([o + s(x0), o + s(y0), o + s(x1), o + s(y1)], radius=s(r), fill=fill, outline=outline, width=s(width))


@saydam
def el(d, s, o, x0, y0, x1, y1, fill, outline=None, width=0):
    d.ellipse([o + s(x0), o + s(y0), o + s(x1), o + s(y1)], fill=fill, outline=outline, width=s(width))


@saydam
def poly(d, s, o, pts, fill, outline=None, width=0):
    d.polygon([(o + s(x), o + s(y)) for x, y in pts], fill=fill, outline=outline, width=s(width) if outline else 0)


def kilit(d, s, o, cx, cy, k, renk=(250, 236, 200, 255)):
    d.arc([o + s(cx - 9 * k), o + s(cy - 18 * k), o + s(cx + 9 * k), o + s(cy)], 180, 360, fill=renk, width=round(s(4 * k)))
    rr(d, s, o, cx - 13 * k, cy - 6 * k, cx + 13 * k, cy + 14 * k, 3 * k, renk)


# ---------------------------------------------------------------- UI parçaları (ad, w, h, çiz, ek)
KAHVE, KREM, ALTIN = (92, 58, 34, 255), (247, 232, 200, 255), (232, 178, 60, 255)


def p_panel(d, s, o):
    rr(d, s, o, 0, 0, 360, 240, 28, KREM, KAHVE, 8)
    rr(d, s, o, 24, 20, 336, 44, 10, (226, 205, 165, 255))


def p_modal(d, s, o):
    rr(d, s, o, 0, 0, 420, 300, 32, (30, 74, 80, 255), ALTIN, 10)
    rr(d, s, o, 18, 18, 402, 70, 18, (44, 104, 110, 255))


def p_kart(d, s, o):
    rr(d, s, o, 0, 0, 220, 280, 22, (255, 248, 232, 255), (120, 80, 46, 255), 6)
    poly(d, s, o, [(42, 16), (66, 40), (42, 64), (18, 40)], (150, 60, 200, 255), (70, 30, 100, 255), 3)  # mor taş: koruma sınaması


def p_kapat(d, s, o):
    el(d, s, o, 0, 0, 72, 72, (214, 62, 52, 255), (110, 24, 20, 255), 5)
    for a, b in (((22, 22), (50, 50)), ((50, 22), (22, 50))):
        d.line([o + s(a[0]), o + s(a[1]), o + s(b[0]), o + s(b[1])], fill=(255, 255, 255, 255), width=s(8))


def p_sekme(renk, cerceve):
    def f(d, s, o):
        rr(d, s, o, 0, 0, 180, 84, 20, renk, cerceve, 4)
        d.rectangle([o, o + s(64), o + s(180), o + s(90)], fill=(0, 0, 0, 0))  # alt düz: üst yuvarlak sekme
        d.rectangle([o + s(0), o + s(58), o + s(180), o + s(64)], fill=cerceve)
    return f


def p_altbar(renk, isik):
    def f(d, s, o):
        rr(d, s, o, 0, 0, 120, 110, 24, renk, KAHVE, 5)
        el(d, s, o, 34, 18, 86, 70, isik)
    return f


def p_dugme(ust, alt_renk, cerceve):
    def f(d, s, o):
        rr(d, s, o, 0, 0, 260, 84, 26, cerceve)
        for i in range(60):  # dikey geçiş
            t = i / 59
            c = tuple(int(ust[j] * (1 - t) + alt_renk[j] * t) for j in range(3)) + (255,)
            y = 6 + i * 72 / 60
            d.rounded_rectangle([o + s(6), o + s(y), o + s(254), o + s(min(78, y + 14))], radius=s(20), fill=c)
        rr(d, s, o, 18, 10, 242, 28, 9, (255, 255, 255, 70))
    return f


def p_hap(d, s, o):
    rr(d, s, o, 0, 0, 170, 56, 28, (60, 40, 26, 255), ALTIN, 4)
    el(d, s, o, 12, 10, 48, 46, ALTIN, (150, 100, 20, 255), 3)


def p_cubuk(dolu):
    def f(d, s, o):
        rr(d, s, o, 0, 0, 320, 40, 20, (50, 36, 28, 255), (24, 16, 10, 255), 4)
        if dolu:
            rr(d, s, o, 6, 6, 6 + 308 * dolu, 34, 14, (110, 200, 80, 255))
    return f


def p_rozet(d, s, o):
    el(d, s, o, 0, 0, 72, 72, (70, 74, 84, 255), (30, 32, 38, 255), 5)
    kilit(d, s, o, 36, 40, 1.0)


def p_nokta(d, s, o):
    el(d, s, o, 0, 0, 36, 36, (240, 50, 50, 255), (255, 255, 255, 255), 4)


def p_kare(tur):
    def f(d, s, o):
        cer = {'bos': (140, 110, 80, 255), 'secili': (255, 214, 70, 255), 'kilitli': (90, 90, 96, 255),
               'uygulanan': (80, 180, 90, 255)}[tur]
        ic = (64, 64, 70, 255) if tur == 'kilitli' else (250, 240, 220, 255)
        rr(d, s, o, 0, 0, 150, 150, 22, ic, cer, 8 if tur == 'secili' else 6)
        if tur == 'kilitli':
            el(d, s, o, 156, -22, 196, 18, (40, 40, 46, 255))  # köşeden 6 px KOPUK kilit rozeti: birleştirme sınaması
            kilit(d, s, o, 176, 0, 0.7)
        if tur == 'uygulanan':
            el(d, s, o, 112, 112, 162, 162, (60, 160, 70, 255), (255, 255, 255, 255), 4)
            d.line([o + s(124), o + s(138), o + s(134), o + s(148), o + s(152), o + s(124)], fill=(255, 255, 255, 255),
                   width=s(6), joint='curve')
    return f


SATIRLAR = [
    [('panel', 360, 240, p_panel, {}), ('modal', 420, 300, p_modal, {}), ('kart', 220, 280, p_kart, {}),
     ('kapat', 72, 72, p_kapat, {'dokuz': False})],
    [('sekme-secili', 180, 64, p_sekme((240, 150, 50, 255), KAHVE), {}),
     ('sekme-secisiz', 180, 64, p_sekme((150, 116, 86, 255), KAHVE), {}),
     ('altbar-secili', 120, 110, p_altbar((240, 150, 50, 255), (255, 240, 200, 255)), {}),
     ('altbar-secisiz', 120, 110, p_altbar((120, 92, 70, 255), (200, 180, 150, 255)), {}),
     ('fiyat-hapi', 170, 56, p_hap, {}), ('kilit-rozeti', 72, 72, p_rozet, {'dokuz': False}),
     ('bildirim-noktasi', 36, 36, p_nokta, {'dokuz': False})],
    [('dugme-birincil', 260, 84, p_dugme((120, 214, 90), (50, 150, 50), (30, 90, 30, 255)), {}),
     ('dugme-ikincil', 260, 84, p_dugme((110, 180, 240), (40, 110, 200), (20, 60, 120, 255)), {}),
     ('dugme-devredisi', 260, 84, p_dugme((170, 170, 170), (120, 120, 120), (80, 80, 80, 255)), {}),
     ('cubuk-bos', 320, 40, p_cubuk(0), {})],
    [('cubuk-dolu', 320, 40, p_cubuk(0.6), {}), ('kare-bos', 150, 150, p_kare('bos'), {}),
     ('kare-secili', 150, 150, p_kare('secili'), {'parilti': ((255, 220, 90), 7)}),
     ('kare-kilitli', 150, 150, p_kare('kilitli'), {}), ('kare-uygulanan', 150, 150, p_kare('uygulanan'), {})],
]


def ui_sayfa():
    W, H = 1536, 1024
    sayfa = Image.new('RGBA', (W, H), MACENTA)
    dogru, harita = [], []
    y = 50
    for satir in SATIRLAR:
        x, h_max = 50, 0
        for ad, w, h, ciz, ek in satir:
            parilti = ek.get('parilti')
            kat, pay = katman(w + 50, h, ciz) if ad == 'kare-kilitli' else katman(w, h, ciz, parilti=parilti)
            sayfa.alpha_composite(kat, (x - pay, y - pay))
            tam = Image.new('RGBA', (W, H), (0, 0, 0, 0)); tam.alpha_composite(kat, (x - pay, y - pay))
            dogru.append((ad, np.array(tam).astype(float)))
            harita.append({'ad': ad, **({'dokuz': False} if ek.get('dokuz') is False else {})})
            x += (w + 50 if ad == 'kare-kilitli' else w) + 56
            h_max = max(h_max, h)
        y += h_max + 64
    rng = np.random.default_rng(7)
    d = ImageDraw.Draw(sayfa)
    for _ in range(12):  # gürültü lekeleri
        cx, cy = int(rng.integers(20, W - 20)), int(rng.integers(H - 70, H - 20))
        r = int(rng.integers(1, 4))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(40, 30, 30, 255))
    return sayfa, dogru, {'olcek': 0.5, 'parcalar': harita}


# ---------------------------------------------------------------- ikon ızgarası
def ikon_ciz(i):
    """16 farklı basit ikon (dış çizgi + vurgu); 5 numarada kopuk kıvılcım, 9 numarada hücre çizgisine taşma."""
    R = [(240, 190, 60), (230, 70, 70), (80, 190, 230), (90, 190, 90), (200, 120, 50), (250, 220, 90), (150, 90, 210),
         (60, 160, 160), (240, 140, 60), (120, 120, 130), (230, 100, 160), (70, 120, 220), (180, 60, 60), (100, 200, 140),
         (220, 200, 160), (60, 60, 70)][i]
    c, ko = R + (255,), tuple(int(v * 0.45) for v in R) + (255,)

    def f(d, s, o):
        if i % 4 == 0:
            el(d, s, o, 10, 10, 170, 170, c, ko, 8); el(d, s, o, 50, 40, 90, 80, (255, 255, 255, 140))
        elif i % 4 == 1:
            pts = [(90 + 80 * math.cos(math.pi / 2 + k * math.pi / 5) * (1 if k % 2 == 0 else 0.45),
                    95 - 80 * math.sin(math.pi / 2 + k * math.pi / 5) * (1 if k % 2 == 0 else 0.45)) for k in range(10)]
            poly(d, s, o, pts, c, ko, 6)
        elif i % 4 == 2:
            poly(d, s, o, [(90, 5), (175, 90), (90, 175), (5, 90)], c, ko, 7)
            poly(d, s, o, [(90, 30), (120, 60), (90, 90), (60, 60)], (255, 255, 255, 120))
        else:
            rr(d, s, o, 15, 25, 165, 165, 30, c, ko, 8); rr(d, s, o, 55, 5, 125, 45, 12, ko)
        if i == 5:
            poly(d, s, o, [(175, 0), (185, 15), (200, 18), (186, 28), (190, 44), (175, 34), (160, 44), (164, 28), (150, 18),
                           (165, 15)], (255, 250, 200, 255))  # kopuk kıvılcım (ayrı bileşen)
    return f


def ikon_sayfa():
    W = H = 1024
    sayfa = Image.new('RGBA', (W, H), MACENTA)
    dogru = []
    for i in range(16):
        c, r = i % 4, i // 4
        kat, pay = katman(210, 180, ikon_ciz(i))
        x, y = c * 256 + 38, r * 256 + 38
        if i == 9:
            x += 52  # sağdaki hücre çizgisine taşar (merkez yine kendi hücresinde)
        sayfa.alpha_composite(kat, (x - pay, y - pay))
        tam = Image.new('RGBA', (W, H), (0, 0, 0, 0)); tam.alpha_composite(kat, (x - pay, y - pay))
        dogru.append((f'ikon-{i:02d}', np.array(tam).astype(float)))
    d = ImageDraw.Draw(sayfa)
    for cx, cy in ((128, 240), (500, 8), (760, 500), (1000, 1000)):
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(30, 30, 30, 255))
    adlar = ['para', 'yildiz', 'elmas', 'kutu', 'kalp', 'kivilcim', 'mor-tas', 'paket', 'gunes', 'tasan', 'pembe',
             'mavi', 'kirmizi', 'yesil', 'krem', 'koyu']
    return sayfa, dogru, {'izgara': '4x4', 'adlar': adlar}


# ---------------------------------------------------------------- karşılaştırma
def kaydet(sayfa, yol, jpeg):
    rgb = sayfa.convert('RGB')
    with open(yol, 'wb') as f:
        rgb.save(f, 'JPEG', quality=80) if jpeg else rgb.save(f, 'PNG')


def olc(sayfa_yol, dogru):
    """Sayfa ölçeğinde: her doğru parçanın kutusunda alfa ve ön-çarpımlı renk hatası (0..255)."""
    taban = K.taban_sec(sayfa_yol)
    A = K.anahtarla(K.yukle(sayfa_yol), taban=taban)
    T = np.zeros_like(A)
    for _, t in dogru:
        a = t[..., 3:4] / 255
        T[..., :3] = T[..., :3] * (1 - a) + t[..., :3] * a
        T[..., 3] = 255 - (255 - T[..., 3]) * (1 - a[..., 0])
    sonuc = []
    for ad, t in dogru:
        ys, xs = np.where(t[..., 3] > max(10, taban * 255))  # kutu: betiğin kestiği eşikle aynı (soluk gölge kuyruğu hariç)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        a_k, a_d = A[y0:y1, x0:x1, 3], T[y0:y1, x0:x1, 3]
        kenar = (a_d > 3) & (a_d < 252)
        pre_k = A[y0:y1, x0:x1, :3] * a_k[..., None] / 255
        pre_d = T[y0:y1, x0:x1, :3] * a_d[..., None] / 255
        sonuc.append({'ad': ad, 'kutu': (x0, y0, x1, y1), 'alfa_ort': np.abs(a_k - a_d).mean(),
                      'alfa_kenar': np.abs(a_k - a_d)[kenar].mean() if kenar.any() else 0,
                      'renk_kenar': np.abs(pre_k - pre_d).mean(-1)[kenar].mean() if kenar.any() else 0})
    return sonuc


def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - ix * iy
    return ix * iy / u


def rapor(baslik, kayit, gurultu, dogru_olc, beklenen):
    print(f'\n=== {baslik}: {len(kayit)}/{beklenen} parça, {gurultu} leke atıldı ===')
    print(f'{"ad":18s} {"IoU":>5s} {"alfaΔort":>8s} {"alfaΔkenar":>10s} {"renkΔkenar":>10s} {"sızıntı%":>8s}  9-slice')
    ad_k = {k['ad']: k for k in kayit}
    kotu = 0
    for d in dogru_olc:
        k = ad_k.get(d['ad'])
        if not k:
            print(f'{d["ad"]:18s} EKSİK'); kotu += 1; continue
        io = iou(k['kaynak_kutu'], d['kutu'])
        pay = (k.get('dokuz_dilim') or {}).get('pay')
        print(f'{d["ad"]:18s} {io:5.3f} {d["alfa_ort"]:8.2f} {d["alfa_kenar"]:10.2f} {d["renk_kenar"]:10.2f} '
              f'{k["sizinti_orani"] * 100:8.3f}  {pay if pay else "—"}')
        kotu += io < 0.90 or k['sizinti_orani'] > 0.01 or d['alfa_kenar'] > 16
    print(f'en kötü sızıntı: %{max(k["sizinti_orani"] for k in kayit) * 100:.3f} · IoU<0.90 ya da sızıntı>%1 ya da alfaΔkenar>16: {kotu}')
    return kotu


def main():
    cikti = os.path.join(BURA, 'cikti')
    ui, ui_dogru, ui_harita = ui_sayfa()
    ik, ik_dogru, ik_harita = ikon_sayfa()
    K.json_yaz(os.path.join(BURA, 'harita.json'), ui_harita)
    K.json_yaz(os.path.join(BURA, 'ikon-harita.json'), ik_harita)
    toplam = 0
    for tur, jpeg in (('png', False), ('jpg', True)):
        uy = os.path.join(BURA, f'ui-sayfa.{tur}'); iy = os.path.join(BURA, f'ikon-sayfa.{tur}')
        kaydet(ui, uy, jpeg); kaydet(ik, iy, jpeg)
        kayit, g = kes.main([uy, '--harita', os.path.join(BURA, 'harita.json'), '--cikti', os.path.join(cikti, tur, 'kit')])
        toplam += rapor(f'UI {tur}', kayit, g, olc(uy, ui_dogru), len(ui_dogru))
        kayit, g = izgara.main([iy, '--harita', os.path.join(BURA, 'ikon-harita.json'), '--cikti', os.path.join(cikti, tur, 'ikon')])
        ad_map = dict(zip([f'ikon-{i:02d}' for i in range(16)], ik_harita['adlar']))
        o = olc(iy, ik_dogru)
        for d in o:
            d['ad'] = ad_map[d['ad']]
        toplam += rapor(f'İKON {tur}', kayit, g, o, 16)
    print(f'\nSONUÇ: {"GEÇTİ" if toplam == 0 else f"{toplam} sorun"}')


if __name__ == '__main__':
    main()
