/**
 * asset-olu-yuk.test.ts — ÖLÜ ASSET YÜKÜNÜN BEKÇİSİ (Faz F · F2, D-125).
 *
 * NE OLDU: F2 ölçümü, `public/assets/models/` altındaki 23,1 MB'ın **11,2 MB'ına (%48,5)
 * hiçbir kod yolunun ulaşamadığını** gösterdi — dört paket (`board-game-bits` 9,3 MB ·
 * `resource-bits` · `holiday-bits` · `forest-nature`) hiçbir kaynak dosyada geçmiyordu ve
 * her oyuncunun indirdiği APK'nın içinde gidiyordu.
 *
 * NEDEN YAPISAL BİR BEKÇİ, NEDEN LİSTE DEĞİL: silinen dört paketin adını buraya yazıp
 * "bunlar olmasın" demek, aynı kusurun BEŞİNCİSİNİ durdurmaz. Asıl kural şu — **diskteki her
 * paket, kodun ulaşabildiği bir paket olmalı.** Model yolları her bileşende elle yazılı klasör
 * sabitinden kurulur (`const KAY = '/assets/models/kaykit-furniture-bits/'`), ortak çözücü
 * yoktur; dolayısıyla "adı `src/`de geçiyor mu" sorusu erişilebilirliğin TAM karşılığıdır.
 *
 * Bu bekçi bu yüzden listeye değil İLİŞKİYE bakar: yarın yeni bir paket eklenip kodu
 * yazılmadan unutulursa, ya da bir paketin son kullanıcısı silinirse, test kırmızı olur.
 *
 * İKİNCİ İDDİA: silinen paketlere ait ARTIK REFERANS da kalmamalı. Paket silinip kodda adı
 * kalsaydı oyun 404 alır ve `Model.tsx` sessizce ilkel şekle düşerdi (fallback deseni,
 * D-013) — yani kusur EKRANDA değil, yalnız ağ sekmesinde görünürdü.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(__dirname, '..');
const MODEL_KOK = path.join(KOK, 'public', 'assets', 'models');

/** `src/` altındaki tüm TypeScript kaynağı tek metin olarak. */
function kaynakMetni(): string {
  const parcalar: string[] = [];
  const gez = (d: string) => {
    for (const g of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, g.name);
      if (g.isDirectory()) gez(p);
      else if (/\.(ts|tsx)$/.test(g.name)) parcalar.push(readFileSync(p, 'utf8'));
    }
  };
  gez(path.join(KOK, 'src'));
  return parcalar.join('\n');
}

/** Diskteki paket klasörleri. */
function diskPaketleri(): string[] {
  if (!existsSync(MODEL_KOK)) return [];
  return readdirSync(MODEL_KOK, { withFileTypes: true }).filter((g) => g.isDirectory()).map((g) => g.name);
}

function klasorBayti(d: string): number {
  let t = 0;
  for (const g of readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, g.name);
    t += g.isDirectory() ? klasorBayti(p) : statSync(p).size;
  }
  return t;
}

describe('ölü asset yükü (F2 · D-125)', () => {
  const metin = kaynakMetni();
  const paketler = diskPaketleri();

  it('diskte en az bir model paketi var (tarama gerçekten bir şeye bakıyor)', () => {
    // Bu denetim olmadan, `public/assets/models/` yanlışlıkla tamamen silinse aşağıdaki
    // "hepsi erişilebilir" iddiası BOŞ KÜME üzerinde doğru çıkar ve bekçi sessizce ölürdü.
    expect(paketler.length).toBeGreaterThan(0);
  });

  it('diskteki HER model paketine kodun ulaşabildiği bir yol var', () => {
    const ulasilamaz = paketler.filter((p) => !metin.includes(p));
    // Hata mesajı bedeli de söylesin: kaç MB'lık ölü yük eklendiğini görmeden düzeltmek zor.
    const ayrinti = ulasilamaz.map((p) => `${p} (${(klasorBayti(path.join(MODEL_KOK, p)) / 1048576).toFixed(1)} MB)`);
    expect(ayrinti).toEqual([]);
  });

  it('F2 turunda silinen dört paket ne diskte ne kodda duruyor', () => {
    const silinen = ['kaykit-board-game-bits', 'kaykit-resource-bits', 'kaykit-holiday-bits', 'kaykit-forest-nature'];
    for (const p of silinen) {
      expect(existsSync(path.join(MODEL_KOK, p)), `${p} diske geri gelmiş`).toBe(false);
      expect(metin.includes(p), `${p} kodda hâlâ anılıyor → 404 + sessiz fallback`).toBe(false);
    }
  });

  it('model yükü F2 tabanının altında kalıyor (ölçülen 11,9 MB)', () => {
    // Üst sınır ölçülen değerin biraz üstünde: yeni asset eklemek yasak değil, SESSİZCE
    // 23 MB'a geri dönmek yasak. Tavana yaklaşınca tur açılır, kaza olmaz.
    const toplam = paketler.reduce((a, p) => a + klasorBayti(path.join(MODEL_KOK, p)), 0);
    expect(toplam / 1048576).toBeLessThan(14);
  });
});
