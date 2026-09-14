/**
 * yeni-paketler.test.ts — S13'ün BEKÇİSİ (D-111).
 *
 * **Neyi koruyor:** "ücretsiz olduğu sürece her asseti çek" kararı indirmeyi serbest bırakır,
 * repoyu değil. S13'te kullanıcı **kol B**'yi seçti — repoya yalnız bir açık kaleme bakan
 * modeller girer — ve board-game-bits'i tek istisna olarak TAM aldı. Bu ayrım bir dosya
 * kopyalama işi olduğu için en kolay sessizce bozulan şey: bir sonraki tur "paketi bir daha
 * indireyim" deyip 553 modeli geri getirebilir ve kimse fark etmez.
 *
 * Bekçi bu yüzden **desen tablosunu** okuyor: `tools/olcum-yeni-paketler.mjs` içindeki GEREKEN
 * hem ölçümün hem bu testin kaynağı. Oradan bir desen silinirse o modelin repoda durması
 * kırmızı yanar; bir paket tamamen geri gelirse de öyle.
 *
 * Sayılar: `docs/yeni-paketler-raporu-s13.md` · ham `docs/olcum-yeni-paketler.json`.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
// @ts-expect-error — ölçüm aracı düz .mjs; tip yok, tablo var.
import { GEREKEN, TAM_ALINAN, REDDEDILEN, esles } from '../tools/olcum-yeni-paketler.mjs';

const KOK = 'public/assets/models';
const DESENLER = GEREKEN as Record<string, { gerekce: string; desen: string[] }>;
const modelAdlari = (paket: string) =>
  readdirSync(path.join(KOK, paket))
    .filter((f) => f.endsWith('.gltf'))
    .map((f) => f.replace(/\.gltf$/, ''));

/** S13'ten önce repoda duran üç paket — bu tur onlara hiç dokunmadı. */
const ESKI_PAKETLER = ['kaykit-restaurant-bits', 'kaykit-furniture-bits', 'kaykit-city-builder-bits'];
/** Kol B + board-game istisnası ile giren paketler. */
const YENI_PAKETLER = Object.keys(DESENLER).filter((p) => !(REDDEDILEN as string[]).includes(p));

describe('S13/A — kol B: repoya yalnız bir işe bakan model girdi', () => {
  it('reddedilen paket repoda YOK (block-bits: voxel küpü, mekân hacmi için parça değil)', () => {
    expect(REDDEDILEN).toContain('kaykit-block-bits');
    for (const p of REDDEDILEN as string[]) expect(existsSync(path.join(KOK, p))).toBe(false);
  });

  it('kabul edilen her paket klasörü var ve atlasını taşıyor', () => {
    for (const p of [...ESKI_PAKETLER, ...YENI_PAKETLER]) {
      expect(existsSync(path.join(KOK, p)), p).toBe(true);
      const atlas = readdirSync(path.join(KOK, p)).filter((f) => f.endsWith('_texture.png'));
      expect(atlas.length, `${p} atlası`).toBe(1);
    }
  });

  it('budanan paketlerde desen DIŞI model kalmadı — paketi tam geri getirmek kırmızı yakar', () => {
    for (const p of YENI_PAKETLER) {
      if ((TAM_ALINAN as string[]).includes(p)) continue;
      const kacak = modelAdlari(p).filter((m) => !esles(m, DESENLER[p].desen));
      expect(kacak, `${p} içinde desen dışı model`).toEqual([]);
    }
  });

  it('board-game-bits TAM alındı — istisna yazılı, sessizce budanamaz', () => {
    expect(TAM_ALINAN).toEqual(['kaykit-board-game-bits']);
    // Kat 2 gerekçesi: okey/tavla masası açılırken hangi taş/jeton/zar lazım olacağı belli değil.
    // 162 modelin hepsi duruyor; budanmış olsaydı 39'a düşerdi (raporun §B6 tablosu).
    expect(modelAdlari('kaykit-board-game-bits').length).toBe(162);
  });

  it('her .gltf kendi .bin dosyasıyla birlikte duruyor (yarım kopyalanan paket ölür)', () => {
    for (const p of YENI_PAKETLER) {
      for (const m of modelAdlari(p)) {
        expect(existsSync(path.join(KOK, p, `${m}.bin`)), `${p}/${m}.bin`).toBe(true);
      }
    }
  });

  it('models/ ağırlığı ölçülen kolun içinde kalıyor (kol A 27,2 MB idi ve ELENDİ)', () => {
    const toplam = readdirSync(KOK)
      // `_` ile başlayan klasörler ÖLÇÜM ARTIĞI (aday indirmeleri), `.gitignore`'da ve repoda
      // değiller — ama diskte duruyorlarsa bu bekçiyi şişiriyorlar. S14'te birebir bu oldu:
      // 63 MB'lık aday klasörü yüzünden tavan aşıldı ve kırmızı yanan şey repo değildi.
      .filter((d) => !d.startsWith('_'))
      .filter((d) => statSync(path.join(KOK, d)).isDirectory())
      .reduce(
        (s, p) => s + readdirSync(path.join(KOK, p)).reduce((t, f) => t + statSync(path.join(KOK, p, f)).size, 0),
        0,
      );
    const mb = toplam / 1024 / 1024;
    // Ölçülen: S13 sonunda 17,2 MB (kol B 8,4 + board-game'in tamamı). S14/D-112 buna
    // **bilerek** 5,9 MB ekledi (6 karakter gövdesi + 4 klip dosyası) → 23,1 MB. Taban 5,9'un
    // altına düşerse eski paketlerden biri silinmiş demektir; tavanı aşarsa elenen kol A ya da
    // alınmayan dövüş klipleri geri sızmış demektir. Tavan = 23,1 + bir gövdelik pay.
    expect(mb).toBeGreaterThan(5.9);
    expect(mb).toBeLessThan(24);
  });
});

describe('S13/B — açık kalemi kapatan model gerçekten repoda', () => {
  it('itme barsız kapı prototype-bits içinde ve tek başına gelmedi (kasa + süslü varyant)', () => {
    const p = 'kaykit-prototype-bits';
    expect(existsSync(path.join(KOK, p, 'Door_A.gltf'))).toBe(true);
    // Desen üç kapıyı alıyor: A (kullanılan), A_Decorated ve B (ileride bakılacak varyantlar).
    expect(modelAdlari(p).sort()).toEqual(['Door_A', 'Door_A_Decorated', 'Door_B']);
  });

  it('paketten yalnız kapı ailesi alındı — 72 modelin 69u girmedi', () => {
    expect(modelAdlari('kaykit-prototype-bits').length).toBe(3);
  });
});
