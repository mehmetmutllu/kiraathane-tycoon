# İkon ızgarası kesimi: macenta zeminli N×M (varsayılan 4×4) ikon sayfasını hücrelere böler, her ikonu saydam kare .webp yapar.
# Kullanım:  python -I tools/ui-kit/izgara.py <sayfa.png> [--harita ikon-harita.json] [--izgara 4x4] [--boyut 256]
#                 [--doluluk 0.88] [--cikti public/assets/ui/ikon] [--kalite 90] [--kayipsiz] [--sizinti-esik 0.01]
# Bileşenler sayfa genelinde bulunur, AĞIRLIK MERKEZİNİN düştüğü hücreye atanır (ikon hücre çizgisine taşsa da bölünmez).
import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anahtar as K  # noqa: E402
from kes import KOK, onizleme_yolu  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(description='Macenta ikon ızgarası -> kare saydam .webp ikonlar')
    ap.add_argument('sayfa')
    ap.add_argument('--harita', help='{"izgara": "4x4", "adlar": [...16 ad...]}; "-" = hücreyi atla')
    ap.add_argument('--izgara', help='SUTUNxSATIR, ör. 4x4 (harita da verebilir)')
    ap.add_argument('--boyut', type=int, default=256)
    ap.add_argument('--doluluk', type=float, default=0.88, help='ikonun kare tuvalde kapladığı en büyük oran')
    ap.add_argument('--cikti', default=os.path.join(KOK, 'public', 'assets', 'ui', 'ikon'))
    ap.add_argument('--onizleme')
    ap.add_argument('--kalite', type=int, default=90)
    ap.add_argument('--kayipsiz', action='store_true')
    ap.add_argument('--min-oran', type=float, default=0.03, help='hücredeki en büyük bileşenin bu oranından küçük leke atılır')
    ap.add_argument('--taban', type=float, help='bundan soluk alfa 0 olur (varsayılan PNG 0.04, JPEG 0.10: blok gürültüsü)')
    ap.add_argument('--koru', type=int, default=10, help='zeminden bu kadar px içerideki macentamsı içerik opak kalır (0=kapalı)')
    ap.add_argument('--sizinti-esik', type=float, default=0.01)
    o = ap.parse_args(argv)

    harita = K.json_oku(o.harita) if o.harita else {}
    sut, sat = map(int, (o.izgara or harita.get('izgara', '4x4')).lower().split('x'))
    adlar = list(harita.get('adlar', []))
    if adlar and len(adlar) != sut * sat:
        print(f'UYARI: harita {len(adlar)} ad, ızgara {sut * sat} hücre')
    adlar += [f'ikon-{i + 1:02d}' for i in range(len(adlar), sut * sat)]

    A = K.anahtarla(K.yukle(o.sayfa), taban=K.taban_sec(o.sayfa, o.taban), koru=o.koru)
    H, W = A.shape[:2]
    mask = A[..., 3] > 10
    L, n = ndimage.label(ndimage.binary_dilation(mask, structure=K.SEKIZ, iterations=2), structure=K.SEKIZ)
    L = L * mask
    w = A[..., 3] / 255
    agirlik = ndimage.sum(w, L, index=np.arange(1, n + 1))
    merkez = ndimage.center_of_mass(w, L, index=np.arange(1, n + 1))
    hucre = {}
    for i in range(n):
        if agirlik[i] <= 0:
            continue
        cy, cx = merkez[i]
        h = min(int(cy // (H / sat)), sat - 1) * sut + min(int(cx // (W / sut)), sut - 1)
        hucre.setdefault(h, []).append((i + 1, agirlik[i]))

    kayit, ogeler, gurultu, uyarilar = [], [], 0, 0
    for h in range(sut * sat):
        ad = adlar[h]
        if ad == '-':
            continue
        uyari = []
        bl = hucre.get(h, [])
        enb = max((a for _, a in bl), default=0)
        tut = [i for i, a in bl if a >= o.min_oran * enb]
        gurultu += len(bl) - len(tut)
        if not tut:
            uyari.append('boş hücre')
            print(f'UYARI {ad}: boş hücre')
            uyarilar += 1
            continue
        m = np.isin(L, tut)
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        sub = A[y0:y1, x0:x1].copy()
        sub[~m[y0:y1, x0:x1]] = 0
        im = K.goruntu(sub)
        k = o.boyut * o.doluluk / max(im.size)
        if k > 1.6:
            uyari.append(f'kaynak küçük ({im.width}x{im.height}), {k:.1f}x büyütüldü')
        im2 = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        kare = Image.new('RGBA', (o.boyut, o.boyut), (0, 0, 0, 0))
        kare.alpha_composite(im2, ((o.boyut - im2.width) // 2, (o.boyut - im2.height) // 2))
        oran, nk = K.sizinti(K.webp_kaydet(kare, os.path.join(o.cikti, ad + '.webp'), o.kalite, o.kayipsiz))
        if oran > o.sizinti_esik:
            uyari.append(f'kenarda macenta sızıntısı %{oran * 100:.2f}')
        for u in uyari:
            uyarilar += 1
            print(f'UYARI {ad}: {u}')
        kayit.append({'ad': ad, 'dosya': ad + '.webp', 'hucre': [h % sut, h // sut], 'boyut': [o.boyut, o.boyut],
                      'kaynak_kutu': [int(x0), int(y0), int(x1), int(y1)], 'sizinti_orani': round(oran, 5),
                      'kenar_px': nk, 'uyari': uyari})
        ogeler.append((ad, kare, None, uyari))
    K.json_yaz(os.path.join(o.cikti, 'MANIFEST.json'), {
        'kaynak': os.path.basename(o.sayfa), 'uretici': 'tools/ui-kit/izgara.py', 'izgara': f'{sut}x{sat}',
        'boyut': o.boyut, 'ikon_sayisi': len(kayit), 'gurultu_atilan': gurultu, 'ikonlar': kayit,
    })
    K.onizleme(ogeler, onizleme_yolu(o.onizleme, o.cikti, 'ikon'), sutun=sut)
    print(f'{os.path.basename(o.sayfa)}: {len(kayit)}/{sut * sat} ikon -> {o.cikti} ({gurultu} leke atıldı, {uyarilar} uyarı)')
    return kayit, gurultu


if __name__ == '__main__':
    main()
