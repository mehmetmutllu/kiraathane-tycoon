/**
 * ekran-yonu-f6.test.ts — EKRAN YÖNÜ K0'IN ve DÖNDÜRME DÜZELTMESİNİN BEKÇİSİ (D-132).
 *
 * NEDEN VAR — iki ayrı sessiz çürüme riski var ve ikisi de bu projede daha önce gerçekleşti.
 *
 * ① YAZISIZ KURAL ÇÜRÜR. Ekran yönü kararı K0 (serbest) ama bugüne dek manifestte hiçbir beyan
 *    yoktu: davranış Android'in `unspecified` varsayılanına bağlıydı. Yazısız bir kararı hiçbir
 *    şey korumaz — biri "dikey kilitleyelim" diye `portrait` yazsa ne derleme kırılır ne test.
 *    D-131'in dersi tam buydu: ölü/yazısız kural hata vermez, sessizce hiçbir şey yapmaz.
 *
 * ② ÖLÇÜLEN KUSUR GERİ GELEBİLİR. `.char-card`ın `flex-shrink: 0` olması Karakter ekranını
 *    tablet portresinden yataya çevirince bozuyordu (ödül düğmelerinin üçü de gövde dışında).
 *    Kusur DURAN KAREDE GÖRÜNMÜYOR — yani ne göz ne duman testi yakalar. Onu ancak "shrink
 *    kilidi açık mı" diye bakan bir denetim koruyabilir.
 *
 * Ölçüm ve gerekçe: `docs/donme-raporu-f6.md` · ham çıktı `docs/olcum-donme-f6.txt` +
 * `docs/olcum-kol-donme-f6.txt` · araç `tools/olcum-donme-f6.mjs` + `tools/olcum-kol-donme-f6.mjs`.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(KOK, 'android/app/src/main/AndroidManifest.xml');
const HUD_CSS = path.join(KOK, 'src/components/ui/hud.css');

const oku = (p: string) => fs.readFileSync(p, 'utf8');

/** `<activity ...>` etiketinin niteliklerini ayıkla (yorumlar çıkarılmış hâlden). */
export function activityNitelikleri(xml: string): Record<string, string> {
  const yorumsuz = xml.replace(/<!--[\s\S]*?-->/g, '');
  const m = /<activity\b([\s\S]*?)>/.exec(yorumsuz);
  if (!m) return {};
  const nit: Record<string, string> = {};
  for (const a of m[1].matchAll(/([\w:]+)\s*=\s*"([^"]*)"/g)) nit[a[1]] = a[2];
  return nit;
}

/**
 * Bir CSS metninde verilen seçici için SON geçerli `flex-shrink` değerini bul.
 * `flex: a b c` kısaltması da shrink belirler (ikinci hane), o yüzden ikisi de taranır ve
 * dosyada en SONDA yazan kazanır (CSS sırası) — düzeltme kuralı taban kuralından sonra geliyor.
 */
export function flexShrink(css: string, secici: string): number | null {
  let sonuc: number | null = null;
  /* Yorumlar ÖNCE silinir. İlk yazımda silinmiyordu ve test kendi kusuruyla kırmızı verdi:
     kuralın önündeki açıklama bloğu "seçici" metnine karışıyor, `.char-card` tam eşleşmiyor ve
     düzeltme kuralı hiç görülmüyordu. (Aracın kusuru sonucu KARAMSAR gösterdi — bu sefer kırmızı
     verdiği için anlaşıldı; iyimser olsaydı sessizce yeşil kalırdı.) */
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bloklar = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const b of bloklar) {
    const secililer = b[1].split(',').map((s) => s.trim());
    if (!secililer.includes(secici)) continue;
    const govde = b[2];
    for (const d of govde.matchAll(/(?:^|;)\s*flex-shrink\s*:\s*([\d.]+)/g)) sonuc = Number(d[1]);
    for (const d of govde.matchAll(/(?:^|;)\s*flex\s*:\s*([\d.]+)\s+([\d.]+)\s/g)) sonuc = Number(d[2]);
  }
  return sonuc;
}

describe('ekran yönü K0 — manifestte YAZILI (D-132)', () => {
  it('yön beyanı var ve kilitli değil', () => {
    const nit = activityNitelikleri(oku(MANIFEST));
    expect(
      nit['android:screenOrientation'],
      'MainActivity ekran yönünü beyan etmeli — beyansız bırakmak K0 kararını yazısız bırakır',
    ).toBeDefined();
    // Kilitleyen her değer reddedilir: karar dört yöne de izin vermek.
    expect(
      ['portrait', 'landscape', 'reversePortrait', 'reverseLandscape', 'sensorPortrait', 'sensorLandscape', 'userPortrait', 'userLandscape', 'locked'],
      'K0 serbest: yön kilitlenemez',
    ).not.toContain(nit['android:screenOrientation']);
  });

  it('yön `fullUser` — cihazın döndürme kilidine saygı duyar', () => {
    const nit = activityNitelikleri(oku(MANIFEST));
    /* `fullSensor` de dört yöne izin verir AMA kullanıcının kendi döndürme kilidini EZER.
       Kullanıcının cümlesi "kullanıcı İSTERSE yataya dönebilir"di — yönü kullanıcı belirler. */
    expect(nit['android:screenOrientation']).toBe('fullUser');
  });

  it('döndürme Activity\'yi yeniden kurmuyor (oturum sıfırlanmasın)', () => {
    const cc = activityNitelikleri(oku(MANIFEST))['android:configChanges'] ?? '';
    /* Bunlar olmadan her döndürmede Activity yeniden kurulur, WebView baştan yüklenir ve
       oyun oturumu sıfırlanır. Ölçümde durumun korunmasının (wallet/tables/npc birebir)
       sebebi tam olarak bu iki değer. */
    expect(cc.split('|')).toContain('orientation');
    expect(cc.split('|')).toContain('screenSize');
  });
});

describe('döndürme kusuru — kartın shrink kilidi açık (D-132 §M)', () => {
  it('`.char-card` küçülebiliyor', () => {
    const s = flexShrink(oku(HUD_CSS), '.char-card');
    expect(s, '`.char-card` için flex-shrink bulunamadı — kural yeniden adlandırılmış olabilir').not.toBeNull();
    /* shrink 0 = kart portrede kurulan yüksekliği yatayda bırakmaz; ölçümde kartY 722 → 1202
       ve ödül düğmelerinin ÜÇÜ de gövde dışında kalıyordu (docs/olcum-kol-donme-f6.txt). */
    expect(s, 'shrink 0 döndürme kusurunu geri getirir (bkz. donme-raporu-f6.md §M)').toBeGreaterThan(0);
  });

  it('düzeltmenin gerekçesi kodda duruyor', () => {
    /* Sayısız bir "flex-shrink: 1" bir sonraki turda "gereksiz, silelim" diye silinir.
       Gerekçe kuralın yanında durmalı. */
    const css = oku(HUD_CSS);
    expect(css).toMatch(/D-132/);
    expect(css).toMatch(/kartY 722/);
  });
});

describe('yön hiçbir yerde koddan da kilitlenmiyor', () => {
  it('`screen.orientation.lock` çağrısı yok', () => {
    const parcalar: string[] = [];
    const gez = (d: string) => {
      for (const g of fs.readdirSync(d, { withFileTypes: true })) {
        const tam = path.join(d, g.name);
        if (g.isDirectory()) gez(tam);
        else if (/\.tsx?$/.test(g.name)) parcalar.push(fs.readFileSync(tam, 'utf8'));
      }
    };
    gez(path.join(KOK, 'src'));
    const hepsi = parcalar.join('\n');
    /* Manifest serbest bırakılıp yön JS'ten kilitlenirse karar yine çiğnenmiş olur —
       bekçinin tek bir kapıyı değil, her iki kapıyı da tutması gerekiyor. */
    expect(hepsi).not.toMatch(/orientation\s*\.\s*lock\s*\(/);
    expect(hepsi).not.toMatch(/lockOrientation/);
  });
});
