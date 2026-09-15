/**
 * mutasyon-tetik-s24.mjs — S24 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Her mutasyon kaynakta S24'ün kapattığı kusurlardan birini GERİ GETİRİR:
 * tetiği daireye döndürmek · çerçeveyi ikinci bir yerde yeniden hesaplamak · etiketi ikiye
 * bölmek · kabarmayı tetikten ayırmak. Bekçi o mutasyonda kırmızı yanmıyorsa o kolun bekçisi
 * yoktur ve araç "KAÇTI" diye basar.
 *
 * S23 NOTU — artık geçerli değil ama duruyor: o turda `.gitattributes` yoktu ve `core.autocrlf`
 * kaynakları CRLF'e çevirince çok satırlı kalıplar sessizce bulunamıyordu (bir koşuda dört
 * mutasyon birden böyle düştü ve araç YALANCI 12/12 verdi). `.gitattributes` S24'te eklendi;
 * yine de normalizasyon savunma olarak korunuyor — araç satır-sonu tahmini yapmaz.
 *
 * Kullanım: node tools/mutasyon-tetik-s24.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const FRAME = 'src/game/markerFrame.ts';
const TICK = 'src/game/tick.ts';
const MARKER = 'src/components/three/GroundMarker.tsx';
const SCENE = 'src/components/three/Scene.tsx';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- Tetik yine daire olursa ("yanında" kusuru geri gelir)
  { ad: 'M1 pad tetiği daireye dönüyor', dosya: TICK,
    bul: 'inFrame(player[0], player[2], pp, padCercevesi(pad.label))',
    koy: 'dist2D(player, pp) < 1.3',
    kusur: 'pad yine çerçevenin dışından tetikler (%50,4 dışarı)' },
  { ad: 'M2 masa tetiği daireye dönüyor', dosya: TICK,
    bul: 'inFrame(player[0], player[2], LAYOUT.tables[i].upgradeSpot, masaCercevesi(tableLevels[i] ?? 0))',
    koy: 'dist2D(player, LAYOUT.tables[i].upgradeSpot) < 1.0',
    kusur: 'masa noktası yine daireyle tetiklenir' },
  { ad: 'M3 servis tetiği daireye dönüyor', dosya: TICK,
    bul: 'inFrame(player[0], player[2], c.place.upgradeSpot, servisCercevesi())',
    koy: 'dist2D(player, c.place.upgradeSpot) < 1.3',
    kusur: 'ocak noktası yine daireyle tetiklenir' },
  { ad: 'M4 lavabo tetiği daireye dönüyor', dosya: TICK,
    bul: 'inFrame(player[0], player[2], LAVABO.spot, lavaboCercevesi())',
    koy: 'dist2D(player, LAVABO.spot) < 1.3',
    kusur: 'lavabo noktası yine daireyle tetiklenir' },

  // --- Çerçeve GENİŞLER / DARALIR: tetik ile çizim ayrışır
  { ad: 'M5 çerçeve yazının enini görmezden geliyor', dosya: FRAME,
    bul: 'hw: Math.max(radius * 1.05, (okBlok + yaziGen) / 2 + KENAR_PAYI * radius),',
    koy: 'hw: radius * 1.05,',
    kusur: 'uzun etiketli işaretlerde çizilen kutu tetikten geniş kalır' },
  { ad: 'M6 yarı-yükseklik yarıçaptan koparılıyor', dosya: FRAME,
    bul: '    hh: radius,', koy: '    hh: radius * 1.35,',
    kusur: 'tetik dikeyde çizilen çerçeveyi taşar (eski kabarma dairesi kadar)' },
  { ad: 'M7 tetiğe sessiz pay ekleniyor', dosya: FRAME,
    bul: 'export function inFrame(px: number, pz: number, spot: Vec3, c: Cerceve, pay = 0): boolean {',
    koy: 'export function inFrame(px: number, pz: number, spot: Vec3, c: Cerceve, pay = 0.35): boolean {',
    kusur: '"çerçeve içinde" sözü bozulur, tetik yine dışarı taşar' },
  { ad: 'M8 inFrame iki ekseni de hw ile ölçüyor', dosya: FRAME,
    bul: 'return Math.abs(px - spot[0]) <= c.hw + pay && Math.abs(pz - spot[2]) <= c.hh + pay;',
    koy: 'return Math.abs(px - spot[0]) <= c.hw + pay && Math.abs(pz - spot[2]) <= c.hw + pay;',
    kusur: 'dikdörtgen kareye dönüşür; dikeyde çerçevenin dışı tetikler' },
  { ad: 'M9 kenar dışarıda sayılıyor', dosya: FRAME,
    bul: 'return Math.abs(px - spot[0]) <= c.hw + pay && Math.abs(pz - spot[2]) <= c.hh + pay;',
    koy: 'return Math.abs(px - spot[0]) < c.hw + pay && Math.abs(pz - spot[2]) < c.hh + pay;',
    kusur: 'tam kenarda duran oyuncu tetikleyemez' },

  // --- İKİ AYRI DOĞRU geri geliyor (turun asıl kusuru)
  { ad: 'M10 kabarma yine kendi dairesini kuruyor', dosya: MARKER,
    bul: 'const uzerinde = inFrame(pl[0], pl[2], pos, { hw, hh }, UZERINDE_PAYI);',
    koy: 'const uzerinde = (pl[0] - pos[0]) ** 2 + (pl[2] - pos[2]) ** 2 <= (hw * 1.35) ** 2;',
    kusur: 'üçüncü geometri geri gelir (%34,3 dışarıda)' },
  { ad: 'M11 çizim çerçeveyi kendi hesaplıyor', dosya: MARKER,
    bul: 'const { hw, hh } = markerFrame(label, r, arrow);',
    koy: 'const hw = Math.max(r * 1.05, (okBlok + label.length * 0.58 * punto) / 2 + KENAR_PAYI * r) * 1.1;\n  const hh = r;',
    kusur: 'çizilen kutu tetikten ayrılır — S24 öncesine dönüş' },
  { ad: 'M12 masa etiketi ikiye bölünüyor', dosya: SCENE,
    bul: 'label={masaEtiketi(lvl)}', koy: 'label={`SV ${lvl + 1}`}',
    kusur: 'çizilen yazı ile tetiğin okuduğu yazı ayrı kaynaktan gelir' },
  { ad: 'M13 servis etiketi düz metne dönüyor', dosya: SCENE,
    bul: 'label={ETIKET_SERVIS}', koy: 'label="YÜKSELT"',
    kusur: 'etiket değişince tetik sessizce eski genişlikte kalır' },
  { ad: 'M14 masa işaretinin yarıçapı elle yazılıyor', dosya: SCENE,
    bul: 'radius={MASA_ISARET_R}', koy: 'radius={0.6}',
    kusur: 'yarıçap iki yerde ayrı durur, biri değişince çerçeve ayrışır' },
  { ad: 'M15 masa etiketi seviyeyi taşımıyor', dosya: FRAME,
    bul: 'export const masaEtiketi = (seviye: number): string => `SV ${seviye + 1}`;',
    koy: 'export const masaEtiketi = (): string => `SV`;',
    kusur: 'G-18 geri alınır; seviye mekânsal noktadan okunamaz' },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/tetik-s24.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('S24 bekçisi — mutasyon doğrulaması\n');
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
