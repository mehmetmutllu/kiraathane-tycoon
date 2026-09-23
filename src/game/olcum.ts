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

/**
 * DEV kapısı BURADA, tek yerde — ve node-güvenli.
 *
 * T4'te dikiş `import.meta.env.DEV && olcumAcik()` olarak çağıranlara yazılmıştı. Vite bunu
 * derlemede sabite çevirir, ama **node `import.meta.env`i hiç tanımaz**: `tsx` ile koşan her
 * araç `Cannot read properties of undefined (reading 'DEV')` ile ölüyordu (`npm run sim`,
 * `olcum-kuyruk`, `olcum-bardak`, `olcum-nav-oyuncu` — yani T3 denge turunun bütün takımı).
 * Vitest vite altında koştuğu için testler bunu göremedi; bekçisi `tests/olcum-dikis.test.ts`.
 *
 * Kapı aç/kapat tarafına alındı: sıcak yol hâlâ TEK boolean okur, üretimde `acik` hiç true olamaz.
 *
 * NODE DA AÇABİLİR (T9a): sistem bölüşümü şimdiye kadar yalnız tarayıcıda ölçülebiliyordu; `tsx`
 * araçlarında `import.meta.env` yok, `olcumAc` sessizce hiçbir şey yapmıyordu. Üretim paketi
 * tarayıcıda koşar ve orada `process` tanımlı değildir → kapı yine kapalı kalır.
 */
const NODE = typeof (globalThis as { process?: { versions?: { node?: string } } }).process?.versions?.node === 'string';
const DEV = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true || NODE;

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
  if (!DEV) return;
  kayitlar.clear();
  acik = true;
};
export const olcumKapat = (): void => {
  acik = false;
};
export const olcumOku = (): Record<string, OlcumKaydi> => Object.fromEntries(kayitlar);
