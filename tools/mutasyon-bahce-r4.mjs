/**
 * mutasyon-bahce-r4.mjs — R4 BEKÇİSİNİ MUTASYONLA DOĞRULAR (D-129).
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Bu turda korunan şey bir görünüm değil bir KAPSAM sözleşmesi:
 *   *"alan olarak açmadığım her yer öyle olsun, açtıklarım zaten oynanabilir olacak."*
 * Yani üç ayrı cinsten kusur var ve üçü ayrı mutasyon kümesi ister:
 *   ① KAPSAM — çim açık alana taşarsa, kilitli alanı boş bırakırsa, ya da `areasOpen`la
 *     küçülmezse karar sessizce kaybolur. En sinsi hâli "yarım uygulama": dış kuşak çizilir,
 *     kilitli ALAN unutulur — ekranda çoğu kadraj düzelir, bir tanesi düzelmez.
 *   ② GEOMETRİ — çim parçaları örtüşürse z-fighting olur; tümleyen eksikse çıplak ahşap kalır.
 *   ③ YERLEŞİM — bitki binanın içinde/dibinde, görünmez uzaklıkta ya da müşteri koridorunda
 *     olamaz; çit sokağa taşamaz.
 * Ayrıca R4'ün yolda bulduğu sokak dikişi (kaldırım 19,90 ↔ asfalt 20,00) kendi mutasyonuyla
 * korunuyor — bir kez kapanan dikişin sessizce geri açılmaması gerek.
 *
 * Kullanım: node tools/mutasyon-bahce-r4.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const LOOK = 'src/components/three/bahceLook.ts';
const STREET = 'src/components/three/streetLook.ts';

const MUTASYONLAR = [
  // --- ① KAPSAM: açılmamış her yer, açılan hiçbir yer ----------------------------------------
  {
    ad: 'M1 bahçe yalnız DIŞ kuşak — kilitli ALANLAR yine çıplak ahşap',
    dosya: LOOK,
    bul: 'export const cimAlanlari = (areasOpen: number): Rect[] => dikdortgenFarki(ARSA, binaAyakIzi(areasOpen));',
    koy: 'export const cimAlanlari = (): Rect[] => dikdortgenFarki(ARSA, [{ minX: -ZEMIN_YARI, maxX: ZEMIN_YARI, minZ: -ZEMIN_YARI, maxZ: ZEMIN_YARI }]);',
    kusur: 'kullanıcının kararının YARISI uygulanır: dış kuşak yeşil, kilitli alan hâlâ ahşap',
  },
  {
    ad: 'M2 çim AÇIK alanın da üstüne taşıyor (ayak izi boş dönüyor)',
    dosya: LOOK,
    bul: '  const out = LAYOUT.areaBounds.slice(0, areasOpen).map((r) => genislet(r, DUVAR_PAY));',
    koy: '  const out: Rect[] = [];',
    kusur: 'oynanan zemin yeşile boyanır — "açtıklarım zaten oynanabilir olacak" ihlali',
  },
  {
    ad: 'M3 bahçe areasOpen ile KÜÇÜLMÜYOR (hep 1 alan varsayılıyor)',
    dosya: LOOK,
    bul: '  const out = LAYOUT.areaBounds.slice(0, areasOpen).map((r) => genislet(r, DUVAR_PAY));',
    koy: '  const out = LAYOUT.areaBounds.slice(0, 1).map((r) => genislet(r, DUVAR_PAY));',
    kusur: 'alan satın almak ekranda hiçbir şey değiştirmez; yeni salon çimin altında kalır',
  },
  {
    ad: 'M4 ARKA BANT unutuluyor — bant çizilince altında çim kalır',
    dosya: LOOK,
    bul: '  if (areasOpen >= 3) {',
    koy: '  if (false) {',
    kusur: 'bant kütlesinin içinden yeşil sızar (kilitli dönemde doğru, açık dönemde yanlış)',
  },
  {
    ad: 'M5 BANT ERKEN sayılıyor — kilitli dönemde arka yarı çıplak kalır',
    dosya: LOOK,
    bul: '  if (areasOpen >= 3) {',
    koy: '  if (areasOpen >= 1) {',
    kusur: 'bant HİÇ çizilmezken (areasOpen < 3) yeri bahçeden düşer — çıplak ahşap geri gelir',
  },
  {
    ad: 'M6 duvar payı sıfır — çim duvarın altına girer',
    dosya: LOOK,
    bul: 'const DUVAR_PAY = WALL_M + WALL_T_WAINSCOT / 2;',
    koy: 'const DUVAR_PAY = 0;',
    kusur: 'çim alanın tam kenarında biter, bütün duvar gövdesi çimin üstünde durur',
  },
  {
    ad: 'M6b duvar payı ELLE yazılıyor (0,60 — lambrinin 0,61 degil)',
    dosya: LOOK,
    bul: 'const DUVAR_PAY = WALL_M + WALL_T_WAINSCOT / 2;',
    koy: 'const DUVAR_PAY = 0.6;',
    kusur: 'lambri 0,01 br çimin üstüne biner — örnekleyerek bakan bekçinin göremediği kayma',
  },

  // --- ② GEOMETRİ: tümleyen tam mı, parçalar örtüşüyor mu? ------------------------------------
  {
    ad: 'M7 dikdörtgen farkı satır birleştirmeyi kaybediyor (parçalar üst üste)',
    dosya: LOOK,
    bul: '      if (acik) acik.maxX = X[i + 1];\n      else acik = { minX: X[i], maxX: X[i + 1], minZ: Z[j], maxZ: Z[j + 1] };',
    koy: '      out.push({ minX: X[i], maxX: p.maxX, minZ: Z[j], maxZ: Z[j + 1] });',
    kusur: 'her hücre sağ kenara kadar uzatılır — çim parçaları örtüşür, z-fighting',
  },
  {
    ad: 'M8 kapalı hücre denetimi ters çevriliyor',
    dosya: LOOK,
    bul: '      if (cikar.some((c) => noktaIcinde(c, cx, cz))) {',
    koy: '      if (!cikar.some((c) => noktaIcinde(c, cx, cz))) {',
    kusur: 'bahçe ile bina yer değiştirir — en sinsi hâli, sayılar yine "makul" görünür',
  },
  {
    ad: 'M9 kesim koordinatları toplanmıyor (yalnız arsanın kendi kenarları)',
    dosya: LOOK,
    bul: '    for (const v of [c.minX, c.maxX]) if (v > p.minX && v < p.maxX) xs.add(v);',
    koy: '',
    kusur: 'x ekseninde hiç kesilmez — çim binanın üstünden geçer ya da hiç çizilmez',
  },

  // --- ③ YERLEŞİM: bitki ve çit ---------------------------------------------------------------
  {
    ad: 'M10 bitki bina payı kalkıyor — ağaç duvarın dibinden çıkıyor',
    dosya: LOOK,
    bul: '  const yasak = ayak.map((r) => genislet(r, BAHCE.binaPayi));',
    koy: '  const yasak = ayak;',
    kusur: 'ağaç gövdesi duvara yapışır, tepesi salonun içine sarkar',
  },
  {
    ad: 'M11 bitki menzili kaldırılıyor — süs görünmeyen uzaklığa dağılıyor',
    dosya: LOOK,
    bul: '  bitkiMenzil: 14,',
    koy: '  bitkiMenzil: 30,',
    kusur: 'S6 dersinin tekrarı: çizilen ama ekrana hiç girmeyen nesneye bütçe harcanır',
  },
  {
    ad: 'M12 ayak izinin ON kenari kirpiliyor — cim kapinin onune siziyor',
    dosya: LOOK,
    bul: '  const out = LAYOUT.areaBounds.slice(0, areasOpen).map((r) => genislet(r, DUVAR_PAY));',
    koy: '  const out = LAYOUT.areaBounds.slice(0, areasOpen).map((r) => ({ ...genislet(r, DUVAR_PAY), maxZ: r.maxZ - 6 }));',
    kusur: 'musteri kapidan cime basarak girer; salonun on seridi yesile doner',
  },
  {
    ad: 'M13 bandin on kenari geri cekiliyor — bina ICINDE ince yesil serit kalir',
    dosya: LOOK,
    bul: '      maxZ: BAND.front + DUVAR_PAY,',
    koy: '      maxZ: BAND.front - 2,',
    kusur: 'bantla 3. alan arasinda cim seridi; orta noktaya bakan bekci goremez',
  },
  {
    ad: 'M14 yerleşim KARARSIZ oluyor (her çağrıda başka bahçe)',
    dosya: LOOK,
    bul: 'export function bahceNoise(a: number, b: number): number {\n  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;\n  return h - Math.floor(h);\n}',
    koy: 'export function bahceNoise(a: number, b: number): number {\n  void a;\n  void b;\n  return Math.random();\n}',
    kusur: 'ağaçlar her yüklemede yer değiştirir; kayıt açılınca bahçe başka bir bahçe olur',
  },
  {
    ad: 'M15 çim TEK RENK oluyor — şikâyetin kendisi yeşile boyanır',
    dosya: LOOK,
    bul: 'export const cimTonu = (r: Rect): number => 0.93 + bahceNoise(r.minX * 0.37, r.minZ * 0.53) * 0.14;',
    koy: 'export const cimTonu = (): number => 1;',
    kusur: 'bu turun kendi bulgusu (sapma 1,39 = bitmemiş yüzey) yeni yüzeyde tekrarlanır',
  },
  {
    ad: 'M16 çit ön uca, sokağın üstüne taşıyor',
    dosya: LOOK,
    bul: 'export const CIT_ON = STREET_Z0 - BAHCE.citDirek / 2;',
    koy: 'export const CIT_ON = STREET_Z0 + 2;',
    kusur: 'son direk kaldırımın üstünde durur — bahçeye ait parça bahçenin dışına çıkar',
  },
  {
    ad: 'M17 çit arsanın EN dışına kaçıyor (arkasında çim kalmaz demek değil, görünmez demek)',
    dosya: LOOK,
    bul: '  citPay: 6,',
    koy: '  citPay: 30,',
    kusur: 'çit `disPay` ile aynı hatta gelir; arkasında çim kalmaz, kenar yine kesik okunur',
  },
  {
    ad: 'M18 çim sokağa taşıyor',
    dosya: LOOK,
    bul: '  maxZ: STREET_Z0,\n};',
    koy: '  maxZ: STREET_Z0 + 6,\n};',
    kusur: 'yeşil kaldırımın ve asfaltın altından taşar; sokak dili bozulur',
  },

  // --- ④ R4'ÜN YOLDA KAPATTIĞI SOKAK DİKİŞİ --------------------------------------------------
  {
    ad: 'M19 kaldırım-asfalt dikişi geri açılıyor',
    dosya: STREET,
    bul: 'export const ASFALT = { x: 6, z: STREET_Z0 + 5.5, w: 56, d: (STREET_Z0 + 5.5 - KALDIRIM_ARKA) * 2 } as const;',
    koy: 'export const ASFALT = { x: 6, z: STREET_Z0 + 5.5, w: 56, d: 6 } as const;',
    kusur: '0,10 br\'lik çizgiden arka plan görünür — R4 ölçümünün §E\'de yakaladığı kusur',
  },
  {
    ad: 'M20 dikiş "yaklaşık" kapatılıyor (0,05 br kalır)',
    dosya: STREET,
    bul: 'export const KALDIRIM_ARKA = KALDIRIM.z + KALDIRIM.d / 2;',
    koy: 'export const KALDIRIM_ARKA = KALDIRIM.z + KALDIRIM.d / 2 - 0.05;',
    kusur: 'gözle kapalı görünür ama çizgi durur; bekçi eşiğe değil SIFIRA bakmalı',
  },

  // --- ⑤ KATMAN ------------------------------------------------------------------------------
  {
    ad: 'M21 çim zemin işaretinin ÜSTÜNE çıkıyor',
    dosya: LOOK,
    bul: '  cimY: 0.012,',
    koy: '  cimY: 0.05,',
    kusur: 'pad ve yükseltme işaretleri çimin altında kalır — mekânsal tycoon UX\'i kırılır',
  },
  {
    ad: 'M22 çim taban ahşabın ALTINA düşüyor',
    dosya: LOOK,
    bul: '  cimY: 0.012,',
    koy: '  cimY: 0.002,',
    kusur: 'kilitli alanda ahşap çimin üstünde kalır (dış kuşakta fark edilmez — yarım kusur)',
  },
];

const yedek = new Map();
const ded = (p) => {
  if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8'));
  return yedek.get(p);
};
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => {
  for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8');
};

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/bahce-r4.test.ts', 'tests/street-look.test.ts'], {
      cwd: KOK,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('MUTASYON — R4 BAHÇE BEKÇİSİ (tests/bahce-r4.test.ts + tests/street-look.test.ts)');
console.log(`${MUTASYONLAR.length} mutasyon · her biri kusuru kaynağa geri koyar\n`);

let kacan = 0;
let uygulanamayan = 0;
for (const m of MUTASYONLAR) {
  const asil = ded(m.dosya);
  const metin = lf(asil);
  if (!metin.includes(m.bul)) {
    console.log(`?? ${m.ad}\n   DESEN BULUNAMADI (${m.dosya}) — mutasyon uygulanmadı`);
    uygulanamayan++;
    continue;
  }
  writeFileSync(y(m.dosya), metin.replace(m.bul, m.koy), 'utf8');
  const tuttu = testKirmiziMi();
  geri();
  console.log(`${tuttu ? '✓' : '✗ KAÇTI'}  ${m.ad}`);
  console.log(`   kusur: ${m.kusur}`);
  if (!tuttu) kacan++;
}

geri();
console.log('');
if (uygulanamayan) console.log(`?? ${uygulanamayan} mutasyon uygulanamadı — desenler kaynakla uyuşmuyor.`);
if (kacan) {
  console.log(`✗ ${kacan} MUTASYON KAÇTI — bekçi bu kusurları tutmuyor, delik kapatılmalı.`);
  process.exit(1);
}
console.log(`✓ ${MUTASYONLAR.length} mutasyonun hepsi yakalandı — bekçi tutuyor.`);
