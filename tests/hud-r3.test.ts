/**
 * hud-r3.test.ts — **R3'ÜN BEŞ KARARININ BEKÇİSİ** (D-128, G-45…G-49).
 *
 * NE KORUYOR: bu turun beş kararı da ÖLÇÜLDÜ, sonra kullanıcı seçti. Kararın kendisi
 * `decisions.md`de, sayısı `docs/hud-raporu-r3.md`de duruyor; burada duran şey KARARIN
 * KODDAKİ KARŞILIĞI. Beşi de tek satırlık bir CSS ile geri alınabilecek kararlar — yazılı
 * kuralın tek başına yetmediği, bu projede defalarca ölçülmüş bir yerdeyiz (S10 → D-107).
 *
 * NE DENETLER:
 *   A4 · ayarlar kaydırıcısının L'si AYIRAÇLA HİZALI ve dikey açıklığı kapalı. Ölçüm:
 *        çizgi kesik değildi (oran 1,000), KÖŞE açıktı — yatayda 4,00 px içeride, dikeyde
 *        4,00 px aşağıda. Dikey açıklığın kaynağı satır değil `.sheet-pad`in `gap: 4px`i.
 *   B2 · FPS katmanı, ayarlardaki anahtarı ve `showFps` alanı GERİ GELMEZ; eski kayıttaki
 *        alan sessizce düşer (kayıt sürümü artmadan).
 *   C1 · ödüller ayrı ELEMAN ve alt alta; aralarında "+" YALNIZ iki ödül varken çizilir.
 *   K3 · bonus satırı deltayı değil TOPLAMIN GEÇİŞİNİ yazar ("%3,2 → %3,6") ve ikonsuzdur.
 *   G  · üst şerit tek satır: çubuk madalyonun ardına gömülür (kapsül), madalyon üstte kalır.
 *   C  · madalyonda yıldız yok, disk kendi tokenında; seviye sayısının konturu mızrak yapmaz.
 *
 * DOĞRULANDI: 3 mutasyonla (kapsül kolona döndü · ödül satırı tek elemana indi · madalyona
 * yıldız geri geldi) — üçü de kırmızı yaktı.
 *
 * DEĞİŞTİRMEK İÇİN: bu kararlar KULLANICININDIR → `decisions.md` → buradaki liste.
 * Testi susturarak geçme; kırması AMAÇTIR.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ayarlariBirlestir, defaultSettings } from '../src/game/save';

const INDEX = 'src/index.css';
const HUD_CSS = 'src/components/ui/hud.css';
const HUD = 'src/components/ui/HUD.tsx';
const ICONS = 'src/components/ui/icons.tsx';

const oku = (p: string) => readFileSync(p, 'utf8');
const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** Bir CSS kuralının gövdesi (ilk eşleşme). Seçici birebir yazılır. */
function kural(css: string, secici: string): string {
  const i = css.indexOf(`\n${secici} {`);
  if (i < 0) return '';
  return css.slice(i + secici.length + 3, css.indexOf('}', i));
}
/** CSS uzunluğu → sayı. Birimsiz `0` da geçerli bir uzunluktur (`margin-left: 0`). */
const sayi = (govde: string, alan: string): number | null => {
  const m = govde.match(new RegExp(`${alan}:\\s*(-?[\\d.]+)(px)?\\s*;`));
  return m ? Number(m[1]) : null;
};

describe('R3 — HUD çerçeveleri (D-128)', () => {
  it('A4 · kaydırıcının L\'si ayıraçla hizalı; panelin 4 px\'lik dikey payı geri alınmış', () => {
    const govde = kural(yorumsuz(oku(INDEX)), '.setting-slider');
    expect(govde, '.setting-slider kuralı yok').not.toBe('');
    // Yatay hiza: sol çizgi ayıraçla AYNI x'ten başlar (girinti pay'dan değil ped'den gelir).
    expect(sayi(govde, 'margin-left'), 'sol çizgi yine içeride başlıyor').toBe(0);
    // Dikey hiza: `.sheet-pad`in gap'i negatif payla geri alınır, yoksa köşe 4 px açık kalır.
    const ust = sayi(govde, 'margin-top');
    expect(ust, 'üst köşe açıklığı kapatılmamış').not.toBeNull();
    expect(ust!).toBeLessThanOrEqual(-4);
    const pad = kural(yorumsuz(oku(HUD_CSS)), '.sheet-pad');
    expect(pad, 'negatif payın ne kadar olacağını belirleyen gap kaybolmuş').toContain('gap: 4px');
    // L KALDI — kapalı çerçeve (A2) bilerek elendi: satır bir üstteki anahtarın ÇOCUĞU.
    expect(govde).toContain('border-left:');
    expect(govde).toContain('border-bottom:');
    expect(govde, 'satır karta dönmüş (A2) — hiyerarşi işareti kayboldu').not.toMatch(/\n\s*border:/);
  });

  it('B2 · FPS katmanı, anahtarı ve ayar alanı geri gelmedi', () => {
    const kod = yorumsuz(oku(HUD));
    for (const iz of ['FpsOverlay', 'fps-overlay', 'set-showfps', 'showFps']) {
      expect(kod, `FPS teşhis katmanı geri gelmiş: ${iz}`).not.toContain(iz);
    }
    expect(Object.keys(defaultSettings()), 'showFps ayarı geri gelmiş').not.toContain('showFps');
  });

  it('B2 · eski kayıttaki showFps sessizce düşer, diğer ayarlar korunur', () => {
    const eski = { sound: false, music: true, notifications: false, showFps: true, soundVolume: 0.4 };
    const birlesik = ayarlariBirlestir(eski) as Record<string, unknown>;
    expect('showFps' in birlesik, 'kaldırılan alan kayıttan sızıyor').toBe(false);
    expect(birlesik.sound).toBe(false);
    expect(birlesik.soundVolume).toBe(0.4);
    expect(birlesik.golge).toBe('oto');
  });

  it('C1 · ödüller AYRI eleman, alt alta ve "+" yalnız ikinci ödülden itibaren', () => {
    const kod = yorumsuz(oku(HUD));
    // Ödül artık bir LİSTE: eskiden üçü de aynı metin akışındaydı (svg + metin + svg + metin).
    expect(kod).toMatch(/satirlar\.push\(\{/);
    expect(kod, '"+" ayıracı koşulsuz çiziliyor — tek ödüllü ekranda sarkar').toContain('i > 0 ?');
    const sat = kural(yorumsuz(oku(HUD_CSS)), '.reward-amount');
    expect(sat, 'ödül satırları yan yana döndü').toContain('flex-direction: column');
  });

  it('K3 · bonus satırı TOPLAMIN geçişini yazar, ikon taşımaz', () => {
    const kod = yorumsuz(oku(HUD));
    const blok = kod.slice(kod.indexOf("key: 'bonus'"), kod.indexOf("key: 'elmas'"));
    expect(blok, 'bonus satırı bulunamadı').not.toBe('');
    // GEÇİŞİN İKİ UCU DA denetlenir. İlk sürüm yalnız SAĞ ucu tutuyordu ve mutasyon M6 tam
    // oradan kaçtı: sol uç deltaya ("+%0,4") çevrilince satır "+%0,4 → %3,6" oluyordu, yani
    // ekran hem artışı hem toplamı aynı anda vaat ediyordu ve bekçi bunu görmüyordu.
    expect(blok, 'geçişin SOL ucu (önceki toplam) kaybolmuş').toContain('oranYuzde(bonusBefore)');
    expect(blok, 'geçişin SAĞ ucu (yeni toplam) kaybolmuş').toContain('oranYuzde(bonusBefore + bonus)');
    expect(blok, 'bonus satırında artış biçimleyicisi (+%…) var — satır TOPLAM yazar').not.toMatch(
      /[^n]yuzde\(/,
    );
    expect(blok, 'ödül satırındaki ikon geri gelmiş').not.toContain('CoinIcon');
    // Geçiş sayısının başında "+" olmaz: "+%3,2 → +%3,6" iki kez artış vaat eder.
    expect(yorumsuz(oku(HUD))).toMatch(/const oranYuzde[\s\S]{0,160}?`%\$\{/);
    // ÖNCEKİ toplam gerçekten paneldeki koleksiyon bonusundan geliyor (uydurulmuş sayı değil).
    expect(kod).toContain('bonusBefore={bonus}');
    expect(kod).toMatch(/const bonus = collectionBonus\(goalsClaimed\)/);
  });

  it('G · üst şerit TEK SATIR: çubuk madalyonun ardına gömülü, madalyon üstte', () => {
    const css = yorumsuz(oku(HUD_CSS));
    expect(kural(css, '.rep'), 'rozet yine alt alta dizilmiş (madalyon + altında çubuk)').toContain(
      'flex-direction: row',
    );
    const bar = kural(css, '.rep .rep-bar');
    const gomme = sayi(bar, 'margin-left');
    expect(gomme, 'çubuk madalyona gömülmüyor — kapsül dağıldı').not.toBeNull();
    expect(gomme!).toBeLessThan(0);
    // Madalyon çubuğun ÜSTÜNDE olmazsa gömme çizim sırasına kalır ve ters döner.
    expect(kural(css, '.rep-medal')).toMatch(/z-index:\s*2/);
    // Kahraman satırının geniş çubuğu bu kuraldan ETKİLENMEZ (kapsam `.rep` ile sınırlı).
    expect(css, 'kapsül kuralı .rep dışına sızdı').not.toMatch(/\n\.rep-bar \{[^}]*margin-left/);
  });

  it('C · madalyonda yıldız yok, disk kendi tokenında, sayı mızrak yapmıyor', () => {
    const ikon = yorumsuz(oku(ICONS));
    const blok = ikon.slice(ikon.indexOf('export function ReputationIcon'));
    const govde = blok.slice(0, blok.indexOf('\n}'));
    expect(govde, 'madalyona yıldız geri gelmiş (sayının konturu onu yine yer)').not.toContain('<path');
    expect(govde, 'disk paletten okunmuyor').toContain('var(--madalyon)');
    expect(oku(INDEX), '--madalyon token\'ı yok').toContain('--madalyon:');
    // Kontur 3 px: Lilita One'ın sivri "4"ünde 5 px miter ucu ekrana mızrak olarak çıkıyordu.
    for (const [secici, ad] of [['.rep-num', 'üst şerit'], ['.rep-hero-medal i', 'kahraman satırı']]) {
      const kal = Number(
        kural(yorumsuz(oku(HUD_CSS)), secici).match(/-webkit-text-stroke:\s*([\d.]+)px/)?.[1] ?? 99,
      );
      expect(kal, `${ad} konturu yine mızrak yapacak kalınlıkta`).toBeLessThanOrEqual(3);
    }
  });
});
