/**
 * BEKÇİ — F3 reklam altyapısı (D-144 · `docs/reklam-raporu-f3.md`).
 * Geçişli C1′: soğuma 3 dk KURAR, panel kapanışı PATLATIR, ödülden sonra ASLA · banner YOK ·
 * SDK'da kısıt yok (D-151) · SDK sabit sürüm · "2× al" düğmesi "Al"dan ayrı yol.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  gecisliUygun,
  reklamBaslat,
  panelKapandi,
  odulAlindi,
  odulluIzle,
  reklamDurumu,
  reklamSaatiKaydir,
  sogumaSifirla,
  sahteArkaUc,
  type ReklamArkaUcu,
} from '../src/game/ads';
import { adsConfig } from '../src/config/ads.config';

const oku = (p: string) => readFileSync(p, 'utf8');
const SOGUMA_MS = adsConfig.gecisli.sogumaSn * 1000;

describe('geçişli kuralı (saf)', () => {
  const taban = { simdi: 0, oturumBasi: 0, sonGecisli: null, panelOdul: false, reklamAcik: false, sogumaSn: 180 };
  it('açılışta reklam yok, soğuma dolunca var', () => {
    expect(gecisliUygun({ ...taban, simdi: 179_999 })).toBe(false);
    expect(gecisliUygun({ ...taban, simdi: 180_000 })).toBe(true);
  });
  it('son geçişliden itibaren yeniden 3 dk', () => {
    expect(gecisliUygun({ ...taban, simdi: 300_000, sonGecisli: 200_000 })).toBe(false);
    expect(gecisliUygun({ ...taban, simdi: 380_000, sonGecisli: 200_000 })).toBe(true);
  });
  it('ödül alınan panelin kapanışı ve ekrandaki reklam patlatmaz', () => {
    expect(gecisliUygun({ ...taban, simdi: 1e9, panelOdul: true })).toBe(false);
    expect(gecisliUygun({ ...taban, simdi: 1e9, reklamAcik: true })).toBe(false);
  });
  it('soğuma 3 dk (D-144 C1′)', () => {
    expect(adsConfig.gecisli.sogumaSn).toBe(180);
  });
});

describe('reklam katmanı akışı (sahte arka uç)', () => {
  let sayac: { gecisli: number; odullu: number };
  const sayanArkaUc = (): ReklamArkaUcu => {
    const s = sahteArkaUc();
    return {
      ...s,
      gecisliGoster: async () => { sayac.gecisli++; return true; },
      odulluGoster: async () => { sayac.odullu++; return true; },
    };
  };
  beforeEach(async () => {
    sayac = { gecisli: 0, odullu: 0 };
    await reklamBaslat(sayanArkaUc());
  });

  it('açılıştan hemen sonra panel kapanışı reklam göstermez', async () => {
    expect(await panelKapandi()).toBe(false);
    expect(sayac.gecisli).toBe(0);
  });

  it('soğuma dolunca kapanış gösterir, hemen ardından göstermez', async () => {
    reklamSaatiKaydir(SOGUMA_MS);
    expect(await panelKapandi()).toBe(true);
    expect(await panelKapandi()).toBe(false);
    expect(sayac.gecisli).toBe(1);
    expect(reklamDurumu().gecisli).toBe(1);
  });

  it('panelde ödül alındıysa o kapanış reklamsız; bayrak sonraki kapanışa taşınmaz', async () => {
    reklamSaatiKaydir(SOGUMA_MS);
    odulAlindi();
    expect(await panelKapandi()).toBe(false);
    expect(await panelKapandi()).toBe(true);
  });

  it('oyun sıfırlanınca soğuma baştan kurulur', async () => {
    reklamSaatiKaydir(SOGUMA_MS);
    sogumaSifirla();
    expect(await panelKapandi()).toBe(false);
  });

  it('ödüllü video hak edilirse true döner ve sayılır', async () => {
    expect(reklamDurumu().odulluHazir).toBe(true);
    expect(await odulluIzle()).toBe(true);
    expect(sayac.odullu).toBe(1);
  });

  it('SDK kurulamazsa oyun reklamsız sürer (hata fırlatmaz)', async () => {
    await reklamBaslat({ ...sahteArkaUc(), kur: async () => { throw new Error('ağ yok'); } });
    reklamSaatiKaydir(SOGUMA_MS);
    expect(await panelKapandi()).toBe(false);
    expect(await odulluIzle()).toBe(false);
    expect(reklamDurumu().kuruldu).toBe(false);
  });

  it('ödüllü video yarıda kalırsa ödül yok', async () => {
    await reklamBaslat({ ...sahteArkaUc(), odulluGoster: async () => false });
    expect(await odulluIzle()).toBe(false);
  });
});

describe('yapılandırma bekçileri', () => {
  it('SDK kısıt bayrağı almıyor — içerik AdMob panelinden (D-151)', () => {
    const kod = oku('src/game/ads.ts') + oku('src/config/ads.config.ts');
    for (const bayrak of ['tagForChildDirectedTreatment:', 'tagForUnderAgeOfConsent:', 'maxAdContentRating:', 'npa:'])
      expect(kod, bayrak).not.toContain(bayrak);
    // Rıza formu kısıt değil yasal ön koşul: kalmalı.
    expect(oku('src/game/ads.ts')).toContain('requestConsentInfo');
  });

  it('eklenti A1, tam sürüm sabit', () => {
    const pkg = JSON.parse(oku('package.json'));
    expect(pkg.dependencies['@capacitor-community/admob']).toBe('8.1.0');
  });

  it('Google SDK sürümleri sabit (dinamik "+" yok)', () => {
    const g = oku('android/variables.gradle');
    expect(g).toMatch(/playServicesAdsVersion = '\d+\.\d+\.\d+'/);
    expect(g).toMatch(/userMessagingPlatformVersion = '\d+\.\d+\.\d+'/);
  });

  it('manifest: uygulama kimliği var, reklam izinleri çıkarılmıyor (D-151)', () => {
    const m = oku('android/app/src/main/AndroidManifest.xml');
    expect(m).toContain('com.google.android.gms.ads.APPLICATION_ID');
    expect(m).not.toContain('tools:node="remove"');
    // Birleştirici bozuk XML'de derlemeyi durdurur; eklemede bir kez çift kapanış kaçtı.
    expect(m.match(/<application\s/g)?.length).toBe(1);
    expect(m.match(/<\/application>/g)?.length).toBe(1);
  });

  it('banner hiçbir yerde çağrılmıyor (kalıcı karar)', () => {
    const dosyalar: string[] = [];
    const gez = (d: string) => {
      for (const a of readdirSync(d)) {
        const p = join(d, a);
        if (statSync(p).isDirectory()) gez(p);
        else if (/\.(ts|tsx)$/.test(a)) dosyalar.push(p);
      }
    };
    gez('src');
    for (const f of dosyalar) expect(oku(f), f).not.toMatch(/showBanner|BannerAdSize|BannerAdPosition/);
  });

  it('"İzle, 2× al" düğmesi "Al"ın işlevini çağırmaz', () => {
    const hud = oku('src/components/ui/HUD.tsx');
    const i = hud.indexOf('data-testid={`${testid}-izle`}');
    const dugme = hud.slice(hud.lastIndexOf('<button', i), hud.indexOf('</button>', i));
    expect(dugme).toContain('onClick={izle}');
    expect(dugme).not.toContain('onClaim');
    // `izle` ödülü yalnız video sonuna dek izlenince verir (F3b · D-150).
    expect(hud).toMatch(/if \(await odulluIzle\(\)\) onIzle\(\);/);
  });

  it('panel kapanışı ve panel-içi ödüller reklam katmanına bağlı', () => {
    const hud = oku('src/components/ui/HUD.tsx');
    expect(hud).toMatch(/sheet == null\) void panelKapandi\(\)/);
    expect(hud.match(/odulAlindi\(\)/g)?.length).toBe(3); // günlük Al · günlük İzle · hedef Al
  });

  it('reklam ekrandayken görünürlük değişimi çevrimdışı sayılmaz', () => {
    expect(oku('src/App.tsx')).toMatch(/if \(reklamEkranda\(\)\) return;/);
  });
});
