/**
 * mutasyon-erisim-h1.mjs — H1 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Her mutasyon kaynakta H1'in kapattığı kusurlardan birini GERİ GETİRİR:
 * tetiği kabın/tezgâhın MERKEZİNE döndürmek · payı kısıp ölü bölgeyi geri açmak · payı şişirip
 * komşu masaya sızdırmak · gardiyanı tetikten koparmak · pan kapısını kaldırmak · kamerayı
 * sahneden koparmak. Bekçi o mutasyonda kırmızı yanmıyorsa o kolun bekçisi yoktur ve araç
 * "KAÇTI" diye basar.
 *
 * Satır sonları normalize edilir (`.gitattributes` S24'te eklendi ama araç tahmin yapmaz).
 *
 * Kullanım: node tools/mutasyon-erisim-h1.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const TICK = 'src/game/tick.ts';
const LAYOUT = 'src/game/layout.ts';
const CONFIG = 'src/config/economy.config.ts';
const CAMVIEW = 'src/game/cameraView.ts';
const SCENE = 'src/components/three/Scene.tsx';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- M3: kirli kap tetiği yine KABIN noktasından ------------------------------------------
  { ad: 'M1 kap tetiği kabın noktasına dönüyor', dosya: TICK,
    bul: 'atTableBody(player[0], player[2], d.tableIndex, C.cups.collectReach)',
    koy: 'dist2D(player, d.pos) < 1.4',
    kusur: 'masanın hangi yanından toplanacağını yine Math.random() seçer (%42,2)' },
  { ad: 'M2 kap tetiği masa MERKEZİNE daire oluyor', dosya: TICK,
    bul: 'atTableBody(player[0], player[2], d.tableIndex, C.cups.collectReach)',
    koy: 'dist2D(player, LAYOUT.tables[d.tableIndex].table) < 1.4',
    kusur: 'gövdeden pay yerine merkeze daire — büyük masada köşeler yine ölür' },
  { ad: 'M3 masa payı gövde yarıçapının altına düşüyor', dosya: CONFIG,
    bul: '    collectReach: 0.7,', koy: '    collectReach: 0.4,',
    kusur: 'oyuncu masaya değse bile tetik ateşlemez (standoff 0,47)' },
  { ad: 'M4 masa payı komşuya sızacak kadar şişiyor', dosya: CONFIG,
    bul: '    collectReach: 0.7,', koy: '    collectReach: 2.4,',
    kusur: 'bir masanın başında komşu masanın kabı da toplanır' },
  { ad: 'M5 masa footprint\'i tipe bakmıyor', dosya: LAYOUT,
    bul: `export const tableHalfFor = (i: number): readonly [number, number] =>
  LAYOUT.tables[i].kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;`,
    koy: 'export const tableHalfFor = (): readonly [number, number] => LAYOUT.deuceHalf;',
    kusur: 'dörtlü masa ikili sanılır; tetik çizilen gövdeden ayrışır' },

  // --- O3: ürün alma tetiği yine tezgâhın MERKEZİNDEN ---------------------------------------
  { ad: 'M6 alma tetiği tezgâhın merkezine dönüyor', dosya: TICK,
    bul: `    tray + trayFood + carriedDirty + carriedDirtyFood < trayCap &&
    atServiceBody(player[0], player[2], c.place, C.serving.pickupReach)`,
    koy: `    tray + trayFood + carriedDirty + carriedDirtyFood < trayCap &&
    dist2D(player, c.place.station) < 1.6`,
    kusur: 'tezgâhın uçları yine ölür (0,72 br ölü ön yüz)' },
  { ad: 'M7 GARDİYAN tetikten koparılıyor', dosya: TICK,
    bul: 'const inPickupRange = atServiceBody(player[0], player[2], c.place, C.serving.pickupReach);',
    koy: 'const inPickupRange = dist2D(player, c.place.station) < 1.6;',
    kusur: 'alma ile gardiyan ayrışır: tepsinin dolduğu ama dolumun da aktığı bant açılır' },
  { ad: 'M8 ocak payı gövde yarıçapının altına düşüyor', dosya: CONFIG,
    bul: '    pickupReach: 0.7,', koy: '    pickupReach: 0.4,',
    kusur: 'tezgâha değen oyuncu bile ürün alamaz' },
  { ad: 'M9 ocak payı yükseltme noktasını yutuyor', dosya: CONFIG,
    bul: '    pickupReach: 0.7,', koy: '    pickupReach: 3.0,',
    kusur: 'gardiyan yükseltme noktasını öldürür (servis hiç yükseltilemez)' },
  { ad: 'M10 kutu mesafesi tek eksene düşüyor', dosya: LAYOUT,
    bul: `  const dx = Math.max(0, Math.abs(x - c[0]) - h[0]);
  const dz = Math.max(0, Math.abs(z - c[2]) - h[1]);
  return Math.hypot(dx, dz);`,
    koy: `  const dx = Math.max(0, Math.abs(x - c[0]) - h[0]);
  return dx;`,
    kusur: 'kutu bir şerit sanılır; dik eksende sınırsız menzil doğar' },
  { ad: 'M11 kutu mesafesi merkeze mesafeye dönüyor', dosya: LAYOUT,
    bul: `  const dx = Math.max(0, Math.abs(x - c[0]) - h[0]);
  const dz = Math.max(0, Math.abs(z - c[2]) - h[1]);
  return Math.hypot(dx, dz);`,
    koy: '  return Math.hypot(x - c[0], z - c[2]);',
    kusur: 'gövde payı yine merkez dairesi olur — H1 öncesine dönüş' },

  // --- K2: pan kapısı ------------------------------------------------------------------------
  { ad: 'M12 pan kapısı kaldırılıyor', dosya: TICK,
    bul: 'if (hedefEkranda(pos[0], pos[2])) return;',
    koy: 'if (false) return;',
    kusur: 'ekranda duran hedefe yine pan atılır (6/6 gürültü geri gelir)' },
  { ad: 'M13 pan kapısı TERSİNE dönüyor', dosya: TICK,
    bul: 'if (hedefEkranda(pos[0], pos[2])) return;',
    koy: 'if (!hedefEkranda(pos[0], pos[2])) return;',
    kusur: 'yalnız GÖRÜNEN hedefe pan atılır — yönlendirme tam ters çalışır' },
  { ad: 'M14 kamera yokken hedef "ekranda" sayılıyor', dosya: CAMVIEW,
    bul: '  if (!cameraView.hazir) return false;',
    koy: '  if (!cameraView.hazir) return true;',
    kusur: 'kamera kurulmadan tüm panlar sessizce yutulur' },
  { ad: 'M15 görüş testi derinliği yok sayıyor', dosya: CAMVIEW,
    bul: '  return nz > -1 && nz < 1 && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;',
    koy: '  return Math.abs(nx) <= 1 && Math.abs(ny) <= 1;',
    kusur: 'kameranın ARKASINDAKİ hedef de "ekranda" sayılır' },
  { ad: 'M16 sahne görüş matrisini yazmayı bırakıyor', dosya: SCENE,
    bul: '    cameraViewYaz(camera.projectionMatrix.elements, camera.matrixWorldInverse.elements);',
    koy: '    void camera;',
    kusur: 'kapı hep "görünmüyor" der; pan kısıtı sessizce ölür' },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/erisim-h1.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('H1 bekçisi — mutasyon doğrulaması\n');
let tutan = 0;
const kacan = [];
try {
  for (const m of MUTASYONLAR) {
    const asil = ded(m.dosya);
    const duz = lf(asil);
    if (!duz.includes(m.bul)) {
      kacan.push(`${m.ad} — KALIP BULUNAMADI (${m.dosya})`);
      console.log(`  ?  ${m.ad} — kalıp bulunamadı`);
      continue;
    }
    writeFileSync(y(m.dosya), duz.replace(m.bul, m.koy), 'utf8');
    const kirmizi = testKirmiziMi();
    writeFileSync(y(m.dosya), asil, 'utf8');
    if (kirmizi) { tutan++; console.log(`  ✓  ${m.ad}`); }
    else { kacan.push(`${m.ad} — ${m.kusur}`); console.log(`  ✗  KAÇTI: ${m.ad}`); }
  }
} finally {
  geri();
}

console.log(`\n${tutan}/${MUTASYONLAR.length} mutasyon kırmızı yandı.`);
if (kacan.length) {
  console.log('KAÇANLAR (bekçisiz kollar):');
  for (const k of kacan) console.log('  ! ' + k);
  process.exit(1);
}
