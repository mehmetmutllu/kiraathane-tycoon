/**
 * T7 BANKET ADAYLARI — dev sorgu dizesinden okunan GEÇİCİ kol seçici (G-83/G-84 ölçüm turu).
 *
 * Varyant kapısı (D-084): kollar koda değil varyanta yazılır; kareyi çeken araç
 * (`tools/shot-banket-t7.mjs`) her kolu kendi yüklemesinde açar. Karar sonrası bu dosya silinir
 * ve yalnız seçilen kol kalır. Montaj-zamanı yapılandırma olduğu için `devPerf` deseni.
 *
 *   ?banket=B2&gorunus=R2     büyüme kolu · görünüş kolu
 *   B0 taban (tam boy) · B1 sütunla uzar · B2 segment · B3 tadilat iskeleti · B4 segment + içten dışa
 *   R0 taban (hep bordo, tam donanım) · R1 madde · R2 madde+renk · R3 madde+kilim
 *
 * ÜRETİMDE ÖLÜ: `import.meta.env.DEV` değilse hep taban döner.
 */
export type Buyume = 'B0' | 'B1' | 'B2' | 'B3' | 'B4';
export type Gorunus = 'R0' | 'R1' | 'R2' | 'R3';

export interface BanketAday {
  buyume: Buyume;
  gorunus: Gorunus;
}

const TABAN: BanketAday = { buyume: 'B0', gorunus: 'R0' };
let onbellek: BanketAday | undefined;

export function banketAday(): BanketAday {
  if (onbellek) return onbellek;
  onbellek = TABAN;
  if (!import.meta.env?.DEV || typeof window === 'undefined') return onbellek;
  const q = new URLSearchParams(window.location.search);
  const b = q.get('banket');
  const r = q.get('gorunus');
  onbellek = {
    buyume: (['B0', 'B1', 'B2', 'B3', 'B4'] as const).find((k) => k === b) ?? 'B0',
    gorunus: (['R0', 'R1', 'R2', 'R3'] as const).find((k) => k === r) ?? 'R0',
  };
  return onbellek;
}

/** B4: şerit İÇ sütundan (kapı eksenine yakın) dışa doğru dolar. */
export const banketIctenDisa = (): boolean => banketAday().buyume === 'B4';
