/**
 * KARE BÖLÜŞÜMÜ ÖLÇÜM DİKİŞİ (T4 · G-80) — **DEV, opt-in, kapalıyken bedelsiz.**
 *
 * ## Neden var
 * T4'ün ilk turu karenin TOPLAM maliyetini ölçtü (55,1 ms geç oyunda) ve kolların hepsi
 * ÇİZİM tarafına yazıldı (instancing, gölge, dpr). Sonra bölüşüm ölçüldü ve çizimin karenin
 * yarısı bile olmadığı görüldü: **`tick()` tek başına %36,8**, içinde `npcSystem` **%27,3**.
 * Yani bir tur boyunca herkes yanlış yarıya bakmıştı. Ders: *toplamı ölçmek kolun yerini
 * göstermez.* Bu dosya bölüşümü tekrar ölçülebilir kılar — düzeltmenin işe yarayıp yaramadığı
 * izlenimle değil aynı sayıyla doğrulansın.
 *
 * ## Neden opt-in
 * Kapalıyken maliyeti tek bir boolean okumasıdır; sayaç, closure ve `performance.now()` ancak
 * ölçüm aracı açtığında devreye girer. Üretim paketine hiç girmez (`import.meta.env.DEV`).
 *
 * Kullanım (ölçüm aracı):  `window.__olcum.ac()` → koş → `window.__olcum.oku()` → `.kapat()`
 */

export interface OlcumKaydi {
  /** Çağrı sayısı. */
  n: number;
  /** Toplam süre (ms). */
  ms: number;
}

const kayitlar = new Map<string, OlcumKaydi>();
let acik = false;

/** Ölçüm açık mı — sıcak yolda okunan tek şey budur. */
export const olcumAcik = (): boolean => acik;

/** Bir işi ada yazarak koştur. YALNIZ ölçüm açıkken çağrılmalı (çağıran dalı kendisi korur). */
export function olcKoş(ad: string, f: () => void): void {
  const t = performance.now();
  f();
  const k = kayitlar.get(ad);
  if (k) {
    k.n += 1;
    k.ms += performance.now() - t;
  } else {
    kayitlar.set(ad, { n: 1, ms: performance.now() - t });
  }
}

/** Sıcak yolda kendi zamanını tutan çağıranlar için (bkz. `findNavPath`). */
export function olcEkle(ad: string, ms: number): void {
  const k = kayitlar.get(ad);
  if (k) {
    k.n += 1;
    k.ms += ms;
  } else {
    kayitlar.set(ad, { n: 1, ms });
  }
}

export const olcumAc = (): void => {
  kayitlar.clear();
  acik = true;
};
export const olcumKapat = (): void => {
  acik = false;
};
export const olcumOku = (): Record<string, OlcumKaydi> => Object.fromEntries(kayitlar);
