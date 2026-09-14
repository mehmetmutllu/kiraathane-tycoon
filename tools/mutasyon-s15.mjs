// S15 bekçi testinin MUTASYON doğrulaması: her mutasyon testi KIRMALI.
// Dosyalar yedeklenir, mutasyon uygulanır, test koşar, dosya geri yazılır.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const A = 'src/config/actor.ts';
const K = 'src/components/three/KayActor.tsx';
const C = 'src/components/three/Customers.tsx';

const MUTASYONLAR = [
  ['klip hızı elle ayarlandı', A, 'Walking_A: 0.571,', 'Walking_A: 0.62,'],
  ['koşu klibinin hızı bozuldu', A, 'Running_A: 1.247,', 'Running_A: 1.1,'],
  ['kelepçe tavanı gevşetildi', A, 'export const TIMESCALE_TAVAN = 1.8;', 'export const TIMESCALE_TAVAN = 3.2;'],
  ['kelepçe tabanı kaldırıldı', A, 'export const TIMESCALE_TABAN = 0.6;', 'export const TIMESCALE_TABAN = 0;'],
  ['kafa ölçeği etkisizleştirildi', A, 'export const KAY_KAFA_OLCEK: number = 0.75;', 'export const KAY_KAFA_OLCEK: number = 1;'],
  ['ölçek kafayı TELAFİ ediyor', A, 'export const KAY_SCALE = ACTOR_HEIGHT / KAY_AUTHORED;', 'export const KAY_SCALE = ACTOR_HEIGHT / (KAY_AUTHORED * KAY_KAFA_OLCEK);'],
  ['sahibin kasketi geri geldi', A, '  owner: { kasket: false, onluk: true },', '  owner: { kasket: true, onluk: true },'],
  ['önlük düşürüldü', A, '  waiter: { kasket: false, onluk: true },', '  waiter: { kasket: false, onluk: false },'],
  ['müşteri bütçesi eski tavana döndü', A, 'export const NPC_SKIN_CAP = 48;', 'export const NPC_SKIN_CAP = 24;'],
  ['oturuş kaldırması kapsül numarasına döndü', A, 'export const KAY_OTURMA_KALDIRMA = 0.068;', 'export const KAY_OTURMA_KALDIRMA = -0.45;'],
  ['koşu klibi aday listesinden çıktı', K, "  yuru: ['Walking_A', 'Running_A'],", "  yuru: ['Walking_A'],"],
  ['head ölçek izi sökülmüyor', K, "klip.tracks = klip.tracks.filter((t) => t.name !== 'head.scale');", 'void klip;'],
  ['kafa kıyafetten SONRA küçültülüyor', K, '    kafaKucult(o);\n    kiyafetTak(o, kind);', '    kiyafetTak(o, kind);\n    kafaKucult(o);'],
  ['katsayı yalnız klip değişince yazılıyor', K,
    '    yeni.timeScale = secim ? secim.timeScale : 1;\n\n    if (hedefKlip === suAn.current) return;',
    '    if (hedefKlip === suAn.current) return;\n    yeni.timeScale = secim ? secim.timeScale : 1;'],
  ['müşteri havuzu her render kuruluyor', C, '  const havuz = useRef<', '  const havuzYok = 0; void havuzYok;\n  const havuz = { current: null } as unknown as ReturnType<typeof useRef<'],
  ['gömlek rengi müşteriden alınmıyor', C, 'y.govdeMat.color.set(npc.color);', 'y.govdeMat.color.set("#cccccc");'],
  ['baş da gövde materyaliyle boyanıyor', C, '          const mesh = new SkinnedMesh(geo, ana.material);', '          const mesh = new SkinnedMesh(geo, govdeMat);'],
  ['oturan müşteriye kapsül numarası uygulanıyor', C, 'y.kok.position.set(x, oturan ? KAY_OTURMA_KALDIRMA : 0, z);', 'y.kok.position.set(x, oturan ? SEATED_DROP : 0, z);'],
];

const yedek = new Map();
for (const d of [A, K, C]) yedek.set(d, readFileSync(d, 'utf8'));
const geriYaz = () => yedek.forEach((icerik, d) => writeFileSync(d, icerik, 'utf8'));

let kacan = 0;
try {
  for (const [ad, dosya, eski, yeni] of MUTASYONLAR) {
    const icerik = yedek.get(dosya);
    if (!icerik.includes(eski)) {
      console.log(`  ?? UYGULANAMADI  ${ad}  (hedef metin bulunamadı)`);
      kacan++;
      continue;
    }
    writeFileSync(dosya, icerik.replace(eski, yeni), 'utf8');
    let kirdi = false;
    try {
      execSync('npx vitest run tests/karakter-senkron.test.ts', { stdio: 'pipe' });
    } catch {
      kirdi = true;
    }
    geriYaz();
    console.log(`  ${kirdi ? 'YAKALANDI' : '>> KAÇTI  '}  ${ad}`);
    if (!kirdi) kacan++;
  }
} finally {
  geriYaz();
}
console.log(`\n${MUTASYONLAR.length} mutasyon · kaçan ${kacan}`);
process.exit(kacan ? 1 : 0);
