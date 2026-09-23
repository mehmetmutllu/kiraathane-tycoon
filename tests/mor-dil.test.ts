/**
 * mor-dil.test.ts — **ARAYÜZ DİLİNİN BEKÇİSİ** (D-107 · D-108, S11a).
 *
 * NE KORUYOR: D-107 iki şeyi kilitledi — arayüzün TEK renk kaynağı (mor palet) ve ÖLÇEĞİ
 * (17 punto → 6 basamak · 27 gölge → 3 kademe · 9 yarıçap → 3 kademe). Kilidin değeri, bir
 * sonraki turda bir bileşenin *"bir kerecik"* kendi rengini/puntosunu yazmasıyla biter.
 *
 * NEDEN YAZILI KURAL YETMEZ — bu projede ölçülmüş bir ders: S10 ölçümü ekranda 17 punto,
 * 27 gölge, 9 yarıçap, 29 zemin rengi saydı. O arayüzün başında da "tek dil" diyen bir yorum
 * bloğu vardı (`hud.css` eski başlığı: *"görsel dil iki katmandan oluşur"*). Kural biliniyordu;
 * hiçbir şeyi ENGELLEMİYORDU. D-084'ün sıra kilidiyle aynı mantık: kuralı denetleyen şey koy.
 *
 * NE DENETLER (kaynak metin üstünden — ekran ölçümü ayrı araçta: `tools/shot-ui-s10.mjs`):
 *   1  · Token bloğunun DIŞINDA kromatik ham renk yok (gri/siyah/beyaz = ışık ve gölge, serbest).
 *   1b · Arayüz bileşenlerinde de yok — 3B malzeme ve FPS sayacı gerekçeli istisna.
 *   2  · Her `font-size` bir `--p1…--p6` basamağı.
 *   3  · Her `border-radius` `--r1…--r3` / `--rr` / `50%` / `0`.
 *   4  · Her `box-shadow` `--k1…--k3` (ya da `none`). Dördüncü kabartma açılmaz; DURUM
 *        (seçili/hazır/tamam) gölgeyle değil KENARLIK rengiyle anlatılır.
 *   5  · `button` font'u miras alır (B5: 13 öğe Arial'a düşüyordu, biri görev şeridiydi).
 *   6  · İkonun yerine oturtulmuş glif yok (B6: kilit, çarpı, sıfırla, tik, ok SVG'ye döndü).
 *   7  · İkonlar D-108 gramerinde: 24 ızgara + ham renk yok.
 *
 * KAPSAM DIŞI ve bilerek: `devSandbox.css` / `DevSandbox.tsx` (yalnız `npm run dev`, oyuncuya
 * gitmez) ve FPS sayacı (isteğe bağlı tanı aracı; monospace ve eşik renkleri doğrudur).
 *
 * DOĞRULANDI: 6 mutasyonla (ham renk · ham punto · dördüncü gölge · geri gelen emoji ·
 * ham yarıçap · ikona sızan renk) — altısı da kırmızı yaktı.
 *
 * DEĞİŞTİRMEK İÇİN: yeni bir basamak gerekiyorsa önce kullanıcı kararı → `decisions.md` →
 * buradaki liste. Testi susturarak geçme — kırması AMAÇTIR.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const INDEX = 'src/index.css';
const HUD = 'src/components/ui/hud.css';
const ICONS = 'src/components/ui/icons.tsx';

/** Oyuncunun gördüğü arayüz dosyaları (DevSandbox yok — o yalnız dev'de çizilir). */
const OYNANAN = [
  'src/components/ui/HUD.tsx',
  'src/components/ui/Sheet.tsx',
  'src/components/ui/CharacterPanel.tsx',
  'src/components/ui/SplashScreen.tsx',
  'src/components/ui/DioramaPreview.tsx',
  'src/components/ui/TableThemePreview.tsx',
];

const oku = (p: string) => readFileSync(p, 'utf8');

/** `:root { … }` blokları = token TANIMLARI; kural onların DIŞI için geçerli. */
const tokensuz = (css: string) => css.replace(/:root\s*\{[^}]*\}/g, '');

/** Yorumları atar: bir yorumda geçen ham renk kuralı ihlal etmez, ANLATIR. */
const yorumsuz = (kod: string) => kod.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

type Rgb = [number, number, number];

function hexRgb(h: string): Rgb {
  const s = h.length === 4 ? h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h.slice(1, 7);
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

/** Doygunluk (HSL s). 0,08 eşiği `tools/olcum-ui.ts`tekiyle AYNI — iki araç aynı şeyi "renk" saysın. */
function doygunluk([r, g, b]: Rgb): number {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  if (d === 0) return 0;
  const l = (mx + mn) / 2;
  return l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
}

/** KROMATİK ham renkler. Gri/siyah/beyaz sayılmaz: onlar palet değil, ışık ve gölgedir. */
function kromatikRenkler(metin: string): string[] {
  const bulunan: string[] = [];
  for (const m of metin.matchAll(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g)) {
    if (doygunluk(hexRgb(m[0])) > 0.08) bulunan.push(m[0]);
  }
  for (const m of metin.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
    if (doygunluk([Number(m[1]), Number(m[2]), Number(m[3])]) > 0.08) bulunan.push(m[0] + ')');
  }
  return bulunan;
}

/** `özellik: değer` çiftleri (çok satırlı değer dahil). */
function bildirimler(css: string, ozellik: string): string[] {
  const re = new RegExp(`(?<![\\w-])${ozellik}\\s*:\\s*([^;{}]+)`, 'g');
  return [...css.matchAll(re)].map((m) => m[1].replace(/\s+/g, ' ').trim());
}

describe('mor dil — D-107 palet ve ölçek kilidi', () => {
  const stiller = [INDEX, HUD];

  it('1 · token bloğunun dışında kromatik ham renk yok', () => {
    for (const p of stiller) {
      expect(kromatikRenkler(tokensuz(yorumsuz(oku(p)))), `${p} — renk token'dan okunmalı`).toEqual([]);
    }
  });

  it('1b · arayüz bileşenlerinde de ham renk yok (3B malzeme ve FPS sayacı hariç)', () => {
    // İKİ İSTİSNA, ikisi de gerekçeli:
    //  · meshStandardMaterial / WALL_THEMES / floorSwatch → bunlar DÜNYANIN rengi. D-107 dünyayı
    //    bilerek dışarıda bıraktı (KayKit'in paleti; S3'te modelleri kıraathane tonuna boyayan
    //    varyant denendi ve kullanıcı reddetti — D-099).
    //  · FPS sayacı → isteğe bağlı tanı aracı; yeşil/sarı/kırmızı bir ÖLÇÜ eşiğidir, palet değil.
    const ISTISNA = /material|WALL_THEMES|floorSwatch|snap\.fps|e6edf3/i;
    for (const p of OYNANAN) {
      const govde = yorumsuz(oku(p))
        .split(/\r?\n/)
        .filter((l) => !ISTISNA.test(l))
        .join(' ');
      expect(kromatikRenkler(govde), `${p} — arayüz rengi token'dan okunmalı`).toEqual([]);
    }
  });

  it('2 · her font-size bir --p1…--p6 basamağı', () => {
    const izin = /^var\(--p[1-6]\)$|^inherit$/;
    for (const p of stiller) {
      const kacak = bildirimler(yorumsuz(oku(p)), 'font-size').filter((v) => !izin.test(v));
      expect(kacak, `${p} — punto basamağı dışında değer`).toEqual([]);
    }
  });

  it('3 · her border-radius --r1…--r3 / --rr / 50% / 0', () => {
    // `var(--r3) var(--r3) 0 0` gibi köşe-başı yazımlar geçerli: her PARÇA basamak olmalı.
    const parca = /^var\(--r[123]\)$|^var\(--rr\)$|^50%$|^0$/;
    for (const p of stiller) {
      const kacak = bildirimler(yorumsuz(oku(p)), 'border-radius').filter(
        (v) => !v.split(' ').every((x) => parca.test(x)),
      );
      expect(kacak, `${p} — yarıçap basamağı dışında değer`).toEqual([]);
    }
  });

  it('4 · her box-shadow --k1…--k3 (ya da düz eşleri / none) — dördüncü kabartma yok', () => {
    // `--k3duz`, YENİ bir kabartma basamağı değil: `--k3`ün üst iç parlaması olmayan eşi
    // (aşağıdaki 4c bunu sayıyla kanıtlıyor). Kullanıcı 2026-09-16'da görev bandındaki gri
    // şeridi kaldırttı; basamak sayısı değişmedi, o basamağın parlamasız hâli eklendi.
    const izin = /^var\(--k[123]\)$|^var\(--k3duz\)$|^none$/;
    for (const p of stiller) {
      const kacak = bildirimler(yorumsuz(oku(p)), 'box-shadow').filter((v) => !izin.test(v));
      expect(kacak, `${p} — durum gölgeyle değil KENARLIKLA anlatılır`).toEqual([]);
    }
  });

  it('4b · ölçek tam olarak 6 punto · 3 yarıçap · 3 gölge tanımlar', () => {
    const kok = oku(INDEX);
    const say = (re: RegExp) => [...kok.matchAll(re)].length;
    expect(say(/--p[1-6]:\s*\d/g)).toBe(6);
    expect(say(/--r[123]:\s*\d/g)).toBe(3);
    expect(say(/--k[123]:\s/g)).toBe(3);
  });

  it('4c · düz gölge YENİ basamak değil: --k3 eksi üst parlama', () => {
    // Bu, 4'ün izin listesini bir bahane olmaktan çıkarır. `--k3duz` serbestçe yazılabilseydi
    // "dördüncü kabartma yok" kuralı bir istisnayla delinmiş olurdu; burada onun `--k3`ten
    // TÜREDİĞİ sayıyla sınanıyor — sapan bir değer bu testi kırar.
    const kok = oku(INDEX);
    const al = (ad: string) => (kok.match(new RegExp(`--${ad}:s*([^;]+);`)) ?? [])[1]?.trim() ?? '';
    const k3 = al('k3');
    const duz = al('k3duz');
    expect(k3, '--k3 tanımlı olmalı').not.toBe('');
    expect(duz, '--k3duz tanımlı olmalı').not.toBe('');
    // Katmanlar ÜST DÜZEY virgülle ayrılır; `rgba(255, 255, 255, 0.5)`in içindeki virgüller
    // sayılmaz (düz `split(',')` ilk denemede tam buna düştü).
    const katmanlar = (v: string): string[] => {
      const out: string[] = [];
      let derinlik = 0;
      let tampon = '';
      for (const ch of v) {
        if (ch === '(') derinlik++;
        else if (ch === ')') derinlik--;
        if (ch === ',' && derinlik === 0) { out.push(tampon.trim()); tampon = ''; continue; }
        tampon += ch;
      }
      if (tampon.trim()) out.push(tampon.trim());
      return out;
    };
    const tum = katmanlar(k3);
    expect(tum.some((x) => x.startsWith('inset')), '--k3 üst parlama taşımalı').toBe(true);
    const insetsiz = tum.filter((x) => !x.startsWith('inset')).join(', ');
    expect(duz, '--k3duz, --k3ün inset katmanı çıkarılmış hâli olmalı').toBe(insetsiz);
  });

  it('5 · form öğeleri font mirası alır (B5: 13 öğe Arial)', () => {
    expect(oku(INDEX)).toMatch(/button,\s*input,\s*select,\s*textarea\s*\{\s*font:\s*inherit/);
  });
});

describe('ikonlar — D-108 grameri', () => {
  it('6 · ikonun yerine oturtulmuş glif yok (B6)', () => {
    // NEDEN LİSTE, NEDEN UNICODE SINIFI DEĞİL: ekran ölçümü (§S) "harf/rakam/noktalama dışı her
    // görünür karakter" der ve o ölçü doğrudur — ama saydığı 17 glifin hepsi KUSUR değil.
    // Çarpma işareti ("2× al") ve lira simgesi ("400 ₺ kazan") gerçek METİNDİR, bir simgenin
    // yerine geçmiyor; SVG'ye çevirmek cümleyi bozar. Bekçi B6'nın adını koyduğu şeyi kovalar:
    // ikonun yerine oturtulmuş glif. Kalan ikisi rapora "bilerek kalan" diye yazılır, sessizce değil.
    const YASAK = [
      '\u{1F512}', // kilit
      '✕', '✖', // çarpı
      '↺', '↻', // sıfırla
      '✓', '✔', // tik
      '→', '←', // ok
      '▶', '◀', // oynat
      '★', '☆', '⭐', // yıldız
      '\u{1F48E}', '\u{1F3C6}', '\u{1F381}', '⚡', '\u{1F514}', '⚙', // elmas/kupa/hediye/şimşek/zil/çark
      '•', // madde işareti
    ];
    for (const p of OYNANAN) {
      const kod = yorumsuz(oku(p)); // anlatıda ok işareti serbest
      expect(YASAK.filter((g) => kod.includes(g)), `${p} — bu glifler SVG ikona döndü (B6)`).toEqual([]);
    }
  });

  it('7 · ikonlar 24 ızgarada ve ham renk taşımıyor', () => {
    const kod = yorumsuz(oku(ICONS));
    // Tek kabuk: `Ic` her ikonu 0 0 24 24'te çizer. 48'lik kutu YALNIZ görev fotoğrafına ait —
    // o bir simge değil KÜÇÜK RESİM, ve içindeki çizim yine 24 ızgaradan gelir (scale ile).
    const kutular = [...kod.matchAll(/viewBox="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(kutular)).toEqual(new Set(['0 0 24 24', '0 0 48 48']));
    expect(kutular.filter((v) => v === '0 0 48 48').length, 'yalnız QuestPhoto 48 kutulu').toBe(1);
    expect(kromatikRenkler(kod), "ikon rengi token'dan okunmalı").toEqual([]);
  });
});
