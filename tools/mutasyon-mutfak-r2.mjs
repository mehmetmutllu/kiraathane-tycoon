/**
 * mutasyon-mutfak-r2.mjs — R2 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Bu turda korunan şey iki ayrı cinsten:
 *   ① bir EKSEN SÖZLEŞMESİ — ölçü, çağıranın uyguladığı dönüşle aynı eksende teslim edilmeli.
 *     Kusur S3'ten R2'ye kadar yaşadı çünkü iki dönemden biri (arka bant, `rot = 0`) doğru
 *     çalışıyordu. Mutasyonların yarısı tam o "yarısı doğru" hâli geri koyar.
 *   ② bir YERLEŞİM KARARI — bulaşık tezgâha bitişik, ve ona bağlı ankrajlar onunla taşınır.
 *     "Yarım uygulama" (gövde taşındı, postası kaldı) burada en olası kusur, o yüzden kendi
 *     mutasyonları var.
 *   ③ bir OKUNABİLİRLİK KURALI — her basamakta en az bir renk DIŞI işaret.
 *
 * Satır sonları normalize edilir (`.gitattributes` S24'te eklendi ama araç tahmin yapmaz).
 *
 * Kullanım: node tools/mutasyon-mutfak-r2.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const LOOK = 'src/components/three/kitchenLook.ts';
const LAYOUT = 'src/game/layout.ts';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- ① EKSEN SÖZLEŞMESİ (G-35 · G-36) ------------------------------------------------------
  {
    ad: 'M1 R2 öncesi hâl: ölçü yine DÜNYA ekseninde',
    dosya: LOOK, bul: '  const takas = eksenTakasi(p.rot);', koy: '  const takas = false;',
    kusur: 'sol duvarda gövde kutusuna 90° dik çizilir — IoU 0,19, tezgâhın %19,4\'ünden yürünür',
  },
  {
    ad: 'M2 yarım düzeltme: yalnız yarı-boyutlar takas ediliyor, uzun eksen değil',
    dosya: LOOK, bul: '  x: takas ? -pos[2] : pos[0],', koy: '  x: pos[0],',
    kusur: 'gövde doğru yöne döner ama birleşme sırası dünya x\'ten kurulur; dx yanlış gövdeye gider',
  },
  {
    ad: 'M3 yarım düzeltme: yalnız uzun eksen çevriliyor, derinlik takas edilmiyor',
    dosya: LOOK, bul: '  hx: takas ? h[1] : h[0],', koy: '  hx: h[0],',
    kusur: 'tezgâh 1,00 br boyunda çizilir — kutusunun %68,7\'si yine görünmez duvar olur',
  },
  {
    ad: 'M4 işaret hatası: yerel +x, dünya +z sanılıyor',
    dosya: LOOK, bul: '  x: takas ? -pos[2] : pos[0],', koy: '  x: takas ? pos[2] : pos[0],',
    kusur: 'birleştirme ters yöne uzar; gövdeler birbirinden kaçar (en sinsi hâli, ölçü doğru görünür)',
  },
  {
    ad: 'M5 `eksenTakasi` hiçbir zaman "evet" demiyor',
    dosya: LOOK,
    bul: 'export const eksenTakasi = (rot: number): boolean => Math.abs(Math.sin(rot)) > 0.5;',
    koy: 'export const eksenTakasi = (rot: number): boolean => Math.abs(Math.sin(rot)) > 1.5;',
    kusur: 'kusurun kendisi tek satırdan geri gelir — sözleşme adı var, işlevi yok',
  },
  {
    ad: 'M6 `eksenTakasi` HER dönüşe "evet" diyor (aşırı düzeltme)',
    dosya: LOOK,
    bul: 'export const eksenTakasi = (rot: number): boolean => Math.abs(Math.sin(rot)) > 0.5;',
    koy: 'export const eksenTakasi = (rot: number): boolean => true;',
    kusur: 'bu kez ARKA BANT bozulur — tek dönemi denetleyen bir bekçinin kaçıracağı yön',
  },

  // --- ② YERLEŞİM: BİTİŞİKLİK VE ANKRAJLAR (G-37 · B2) ----------------------------------------
  {
    ad: 'M7 bulaşık eski yerine dönüyor',
    dosya: LAYOUT,
    bul: 'const SOL_DUVAR_BULASIK_Z = SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ + SOL_DUVAR_BULASIK_HZ;',
    koy: 'const SOL_DUVAR_BULASIK_Z = 10.6;',
    kusur: 'hat yine 3,20 br boşlukla iki ada olur — kullanıcının bitişiklik isteği geri alınır',
  },
  {
    ad: 'M8 bitişiklik "yaklaşık" oluyor (yarım br boşluk)',
    dosya: LAYOUT,
    bul: 'const SOL_DUVAR_BULASIK_Z = SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ + SOL_DUVAR_BULASIK_HZ;',
    koy: 'const SOL_DUVAR_BULASIK_Z = SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ + SOL_DUVAR_BULASIK_HZ + 0.5;',
    kusur: 'gözle bitişik görünür ama arada 0,50 br kalır; bekçi eşiğe değil SIFIRA bakmalı',
  },
  {
    ad: 'M9 bulaşık fazla yanaşıp tezgâhın içine giriyor',
    dosya: LAYOUT,
    bul: 'const SOL_DUVAR_BULASIK_Z = SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ + SOL_DUVAR_BULASIK_HZ;',
    koy: 'const SOL_DUVAR_BULASIK_Z = SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ;',
    kusur: 'iki kutu çakışır — hat kesintisiz görünür ama iki gövde iç içe girer',
  },
  {
    ad: 'M10 YARIM UYGULAMA: bulaşık taşındı, bulaşıkçının postası kaldı',
    dosya: LAYOUT, bul: 'dishwasherHome: [-14.4, 0, SOL_DUVAR_BULASIK_Z + 2.0],', koy: 'dishwasherHome: [-14.4, 0, 12.6],',
    kusur: 'bulaşıkçı boş zeminin önünde bekler — taşımanın en olası eksik hâli',
  },
  {
    ad: 'M11 YARIM UYGULAMA: pad eski yerinde kaldı',
    dosya: LAYOUT, bul: 'dishwasher: [-13.4, 0, SOL_DUVAR_BULASIK_Z] as Vec3,', koy: 'dishwasher: [-13.4, 0, 10.6] as Vec3,',
    kusur: 'bulaşıkçı pad\'i boş zemini işaretler — `feedback_spatial_tycoon_ux` ihlali',
  },
  {
    ad: 'M12 çaycının yolu bulaşığın ötesine taşıyor',
    dosya: LAYOUT,
    bul: '    b: [-15.1, 0, SOL_DUVAR_BULASIK_Z + SOL_DUVAR_BULASIK_HZ - 0.2],',
    koy: '    b: [-15.1, 0, 13.5],',
    kusur: 'çaycı hattın bittiği yerin ötesinde, boşlukta yürür',
  },

  // --- ③ SEVİYE OKUNABİLİRLİĞİ (G-38 · C2) ----------------------------------------------------
  {
    ad: 'M13 biçim işaretleri listesi boşaltılıyor',
    dosya: LOOK, bul: "  { ad: 'tepsi', acilir: 1, x: -1.35, z: 0.25, hx: 0.2, hz: 0.14 },", koy: '',
    kusur: 'L0→L1 yine yalnız renkten okunur — ilk yükseltmenin biçim işareti kaybolur',
  },
  {
    ad: 'M14 en pahalı basamağın işareti ulaşılamaz seviyeye kaçıyor',
    dosya: LOOK,
    bul: "  { ad: 'ikinciSemaver', acilir: 6, x: -1.35, z: -0.25, hx: 0.2, hz: 0.2 },",
    koy: "  { ad: 'ikinciSemaver', acilir: 9, x: -1.35, z: -0.25, hx: 0.2, hz: 0.2 },",
    kusur: 'L5→L6 ölçümdeki gibi 0 biçim sinyaline döner (9.000 ₺ ekranda iz bırakmaz)',
  },
  {
    ad: 'M15 işaret KİMLİK basamağına biniyor (aynı sinyal iki kez sayılır)',
    dosya: LOOK,
    bul: "  { ad: 'surahi', acilir: 3, x: 1.42, z: -0.18, hx: 0.14, hz: 0.14 },",
    koy: "  { ad: 'surahi', acilir: 4, x: 1.42, z: -0.18, hx: 0.14, hz: 0.14 },",
    kusur: 'L3 boş kalır, L4 iki kez sayılır — bekçi kendi kendini kandırır',
  },
  {
    ad: 'M16 işaret tablanın dışına taşıyor',
    dosya: LOOK,
    bul: "  { ad: 'bardakIstifi', acilir: 2, x: 1.12, z: 0.24, hx: 0.07, hz: 0.07 },",
    koy: "  { ad: 'bardakIstifi', acilir: 2, x: 1.85, z: 0.24, hx: 0.07, hz: 0.07 },",
    kusur: 'bardak istifi havada durur (tezgâhın kenarından taşar)',
  },
  {
    ad: 'M17 iki işaret üst üste biniyor',
    dosya: LOOK,
    bul: "  { ad: 'tepsi', acilir: 1, x: -1.35, z: 0.25, hx: 0.2, hz: 0.14 },",
    koy: "  { ad: 'tepsi', acilir: 1, x: 0.6, z: 0.05, hx: 0.2, hz: 0.14 },",
    kusur: 'tepsi semaverin içine girer — `feedback_visual_polish`in "taşma yok" kuralı',
  },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/mutfak-r2.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('MUTASYON — R2 BEKÇİSİ (tests/mutfak-r2.test.ts)');
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
