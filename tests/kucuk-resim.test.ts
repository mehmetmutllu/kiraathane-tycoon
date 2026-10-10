/**
 * kucuk-resim.test.ts — KOZMETİK KÜÇÜK RESİMLERİNİN BEKÇİSİ (Sprint B · Faz 4).
 *
 * Mağaza pulları (Sprint C'de bağlanacak) `public/assets/thumbs/<tur>-<id>.webp` dosyalarını
 * okuyacak. Liste `economy.config.ts`ten türetilir (`tools/kucuk-resim-liste.ts`): yeni kozmetik
 * eklenip `npx tsx tools/kucuk-resim.mjs` çalıştırılmazsa, ya da kozmetik silinip resmi kalırsa
 * bu bekçi kırmızı olur. Boyut sınırı APK yükünü tutar.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { kucukResimListesi, KUCUK_KLASOR, TEK_SINIR, TOPLAM_SINIR } from '../tools/kucuk-resim-liste';

const KLASOR = path.resolve(__dirname, '..', KUCUK_KLASOR);
const liste = kucukResimListesi();
const diskte = existsSync(KLASOR) ? readdirSync(KLASOR) : [];

describe('kozmetik küçük resimleri (Sprint B · Faz 4)', () => {
  it('liste config\'in bütün kozmetiklerini kapsıyor (7 tür, boş değil, ad çakışması yok)', () => {
    expect(new Set(liste.map((k) => k.tur)).size).toBe(7);
    expect(liste.length).toBeGreaterThanOrEqual(38);
    expect(new Set(liste.map((k) => k.dosya)).size).toBe(liste.length);
  });

  it('her kozmetiğin webp dosyası var', () => {
    const eksik = liste.filter((k) => !diskte.includes(k.dosya)).map((k) => k.dosya);
    expect(eksik).toEqual([]);
  });

  it('klasörde fazlalık dosya yok', () => {
    const beklenen = new Set(liste.map((k) => k.dosya));
    expect(diskte.filter((f) => !beklenen.has(f))).toEqual([]);
  });

  it('dosyalar gerçek WebP (RIFF…WEBP başlığı)', () => {
    const bozuk = liste.filter((k) => {
      const p = path.join(KLASOR, k.dosya);
      if (!existsSync(p)) return false;
      const b = readFileSync(p);
      return b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP';
    });
    expect(bozuk.map((k) => k.dosya)).toEqual([]);
  });

  it(`tek dosya ≤ ${TEK_SINIR / 1024} KB, toplam ≤ ${TOPLAM_SINIR / 1024} KB`, () => {
    let toplam = 0;
    const iri: string[] = [];
    for (const f of diskte) {
      const n = statSync(path.join(KLASOR, f)).size;
      toplam += n;
      if (n > TEK_SINIR) iri.push(`${f} ${(n / 1024).toFixed(1)} KB`);
    }
    expect(iri).toEqual([]);
    expect(toplam).toBeLessThanOrEqual(TOPLAM_SINIR);
  });
});
