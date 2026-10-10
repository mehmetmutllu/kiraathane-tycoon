# Parça sayfası kesimi: macenta (#FF00FF) zeminli UI parça sayfasından her parçayı ayrı saydam .webp yapar + MANIFEST.json.
# Kullanım:  python -I tools/ui-kit/kes.py <sayfa.png> [--harita harita.json] [--cikti public/assets/ui/kit]
#                 [--kalite 90] [--kayipsiz] [--birlestir 6] [--min-alan 400] [--olcek 0.5] [--sizinti-esik 0.01]
# Sıra: dikeyde örtüşen parçalar bir satır; satırlar yukarıdan aşağı, satır içi soldan sağa. Harita biçimi: README.md.
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anahtar as K  # noqa: E402

KOK = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def harita_coz(harita, parcalar):
    """Harita girdileri -> her parça için {ad, dokuz, pay, not}. 'kutu' verilen girdi merkezi o kutuda olan parçayı alır;
    kalanlar sırayla eşlenir. '-' adı = parçayı atla."""
    girdiler = []
    for g in (harita or {}).get('parcalar', []):
        girdiler.append({'ad': g} if isinstance(g, str) else dict(g))
    atanan = [None] * len(parcalar)
    for g in [g for g in girdiler if 'kutu' in g]:
        x0, y0, x1, y1 = g['kutu']
        for j, p in enumerate(parcalar):
            cy, cx = (p[0] + p[1]) / 2, (p[2] + p[3]) / 2
            if atanan[j] is None and x0 <= cx <= x1 and y0 <= cy <= y1:
                atanan[j] = g
                break
        else:
            print(f'UYARI: "{g["ad"]}" kutusunda parça yok {g["kutu"]}')
    sirali = iter([g for g in girdiler if 'kutu' not in g])
    for j in range(len(parcalar)):
        if atanan[j] is None:
            atanan[j] = next(sirali, None)
    fazla = sum(1 for _ in sirali)
    if harita and (fazla or any(a is None for a in atanan)):
        print(f'UYARI: harita {len(girdiler)} ad, sayfada {len(parcalar)} parça '
              f'({fazla} ad boşta, {sum(a is None for a in atanan)} parça adsız)')
    return [a or {'ad': f'parca-{j + 1:02d}'} for j, a in enumerate(atanan)]


def onizleme_yolu(verilen, cikti, ad):
    """Önizleme oyunla paketlenmesin: çıktı public/ altındaysa tools/ui-kit/onizleme/ altına yazılır."""
    if verilen:
        return verilen
    if os.path.abspath(cikti).startswith(os.path.join(KOK, 'public')):
        return os.path.join(KOK, 'tools', 'ui-kit', 'onizleme', ad + '.png')
    return os.path.join(cikti, '_onizleme.png')


def main(argv=None):
    ap = argparse.ArgumentParser(description='Macenta parça sayfası -> saydam .webp parçalar + MANIFEST.json')
    ap.add_argument('sayfa')
    ap.add_argument('--harita')
    ap.add_argument('--cikti', default=os.path.join(KOK, 'public', 'assets', 'ui', 'kit'))
    ap.add_argument('--url-onek', default='/assets/ui/kit/', help='MANIFEST CSS satırındaki url öneki')
    ap.add_argument('--kalite', type=int, default=90)
    ap.add_argument('--kayipsiz', action='store_true')
    ap.add_argument('--birlestir', type=int, default=6, help='aynı parçanın kopuk süslerini birleştirme yarıçapı (px)')
    ap.add_argument('--min-alan', type=float, default=400, help='bundan küçük leke gürültü sayılır (opak px eşdeğeri)')
    ap.add_argument('--olcek', type=float, default=None, help='kaynak px -> CSS px (CSS satırı için; harita da verebilir)')
    ap.add_argument('--taban', type=float, help='bundan soluk alfa 0 olur (varsayılan PNG 0.04, JPEG 0.10: blok gürültüsü)')
    ap.add_argument('--koru', type=int, default=10, help='zeminden bu kadar px içerideki macentamsı içerik opak kalır (0=kapalı)')
    ap.add_argument('--sizinti-esik', type=float, default=0.01)
    ap.add_argument('--onizleme', help='önizleme PNG yolu (varsayılan: çıktı public/ altındaysa tools/ui-kit/onizleme/kit.png)')
    ap.add_argument('--min-kenar', type=int, default=12, help='bundan dar/kısa parça uyarı alır (px)')
    o = ap.parse_args(argv)

    harita = K.json_oku(o.harita) if o.harita else None
    olcek = o.olcek or (harita or {}).get('olcek', 0.5)
    A = K.anahtarla(K.yukle(o.sayfa), taban=K.taban_sec(o.sayfa, o.taban), koru=o.koru)
    parcalar, gurultu, L = K.bilesenler(A, birlestir=o.birlestir, min_alan=o.min_alan)
    parcalar = K.satir_sirala(parcalar)
    adlar = harita_coz(harita, parcalar)
    print(f'{os.path.basename(o.sayfa)}: {len(parcalar)} parça, {gurultu} gürültü lekesi atıldı')

    kayit, ogeler, uyarilar = [], [], 0
    for p, g in zip(parcalar, adlar):
        if g['ad'] == '-':
            continue
        im = K.goruntu(K.kirp(A, L, p))
        pay_oto, yaricap = K.dokuz_dilim(im)
        dokuz = g.get('dokuz', True)
        pay = g.get('pay') or (pay_oto if dokuz else None)
        dosya = g['ad'] + '.webp'
        oran, nk = K.sizinti(K.webp_kaydet(im, os.path.join(o.cikti, dosya), o.kalite, o.kayipsiz))
        uyari = []
        if oran > o.sizinti_esik:
            uyari.append(f'kenarda macenta sızıntısı %{oran * 100:.2f}')
        if min(im.size) < o.min_kenar:
            uyari.append(f'çok küçük ({im.width}x{im.height})')
        if dokuz and pay is None:
            uyari.append('9-slice merkezi yok (dokuz:false önerilir)')
        satir = {
            'ad': g['ad'], 'dosya': dosya, 'boyut': [im.width, im.height],
            'kaynak_kutu': [int(p[2]), int(p[0]), int(p[3]), int(p[1])],
            'dokuz_dilim': {'pay': pay, 'oto_pay': pay_oto, 'elle': bool(g.get('pay')),
                            'kose_yaricap': yaricap, 'sira': 'sol, ust, sag, alt (kaynak px)'} if dokuz else None,
            'css': K.css_satiri(o.url_onek + dosya, pay, g.get('olcek', olcek)) if pay else None,
            'sizinti_orani': round(oran, 5), 'kenar_px': nk,
            'uyari': uyari, 'not': g.get('not', ''),
        }
        kayit.append(satir)
        ogeler.append((g['ad'], im, pay, uyari))
        for u in uyari:
            uyarilar += 1
            print(f'UYARI {g["ad"]}: {u}')
    K.json_yaz(os.path.join(o.cikti, 'MANIFEST.json'), {
        'kaynak': os.path.basename(o.sayfa), 'uretici': 'tools/ui-kit/kes.py', 'olcek': olcek,
        'parca_sayisi': len(kayit), 'gurultu_atilan': gurultu, 'parcalar': kayit,
    })
    K.onizleme(ogeler, onizleme_yolu(o.onizleme, o.cikti, 'kit'))
    print(f'{len(kayit)} parça -> {o.cikti} ({uyarilar} uyarı)')
    return kayit, gurultu


if __name__ == '__main__':
    main()
