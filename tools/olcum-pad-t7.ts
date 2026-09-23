/**
 * olcum-pad-t7.ts — T7 ÖLÇÜM (G-82): `zone3` pad'i nereye taşınmalı?
 *
 * NE SORUYOR. Kullanıcı: *"Salon 3 açma padi ile salon 2 masa 3ün padi hafif üst üste geliyo"*.
 * S24 bu çifti bilerek istisna listesine almıştı (`tests/tetik-s24.test.ts` KABUL_EDILEN): pad
 * çerçevesi masa 6'nın yükseltme çerçevesine giriyor. Tetik artık ÇİZİLEN ÇERÇEVEDİR (D-121), o
 * yüzden çakışma daireyle değil çerçeveyle ölçülür — testin 9. denetimiyle AYNI hesap.
 *
 * HER ADAY İÇİN DÖRT SAYI:
 *   cakisma  aynı anda sahnede olabilen çerçevelerle örtüşen çift sayısı (0 olmalı)
 *   bosluk   en yakın komşu çerçeveye kalan boşluk (br; negatif = örtüşme)
 *   durak    çerçevenin içinde oyuncunun durabildiği ızgara noktası oranı (katılar: 2 salon açık)
 *   esik     pad merkezinin salon sınırına (z = 0) uzaklığı — pad açacağı alanın EŞİĞİNDE durur
 *   kapi     kapı ekseni (x = 0, 2. salondan beri müşteri buradan yürür) uzaklığı
 *
 * Çalıştır:  npx tsx tools/olcum-pad-t7.ts > docs/olcum-pad-t7.txt
 * (Saf geometri; koşu kipi yok — sonuç deterministik, kısa = tam.)
 */
import { economyConfig } from '../src/config/economy.config';
import { LAVABO, LAYOUT, activeSolids, hitsSolid, servicePlace } from '../src/game/layout';
import {
  lavaboCercevesi,
  masaCercevesi,
  padCercevesi,
  servisCercevesi,
  type Cerceve,
} from '../src/game/markerFrame';
import type { Vec3 } from '../src/game/types';

interface Isaret { ad: string; pos: Vec3; c: Cerceve; grup: string }

/** tetik-s24 testinin `tumIsaretler`i — aynı küme, aynı "en geniş etiket" varsayımı. */
function isaretler(zone3: Vec3): Isaret[] {
  const out: Isaret[] = [];
  for (const pad of economyConfig.pads) {
    const p = pad.id === 'zone3' ? zone3 : LAYOUT.padPos[pad.id];
    if (p) out.push({ ad: `pad:${pad.id}`, pos: p, c: padCercevesi(pad.label), grup: `${p[0]},${p[2]}` });
  }
  LAYOUT.tables.forEach((t, i) => {
    const p = t.upgradeSpot;
    out.push({ ad: `masa${i}`, pos: p, c: masaCercevesi(11), grup: `${p[0]},${p[2]}` });
  });
  for (const a of [1, 2, 3]) {
    const p = servicePlace(a).upgradeSpot;
    out.push({ ad: `servis(a${a})`, pos: p, c: servisCercevesi(), grup: `${p[0]},${p[2]}` });
  }
  out.push({ ad: 'lavabo', pos: LAVABO.spot, c: lavaboCercevesi(), grup: `${LAVABO.spot[0]},${LAVABO.spot[2]}` });
  return out;
}

function olc(zone3: Vec3) {
  const hepsi = isaretler(zone3);
  const z = hepsi.find((m) => m.ad === 'pad:zone3')!;
  let cakisma = 0;
  let bosluk = Infinity;
  let komsu = '';
  for (const m of hepsi) {
    if (m === z || m.grup === z.grup) continue;
    const ox = z.c.hw + m.c.hw - Math.abs(z.pos[0] - m.pos[0]);
    const oz = z.c.hh + m.c.hh - Math.abs(z.pos[2] - m.pos[2]);
    if (ox > 0 && oz > 0) cakisma++;
    const b = ox > 0 && oz > 0 ? -Math.min(ox, oz) : Math.max(-ox, -oz);
    if (b < bosluk) { bosluk = b; komsu = m.ad; }
  }
  // zone3 görünürken açık olan dünya: 2 salon, 8 masa.
  const katilar = activeSolids(8, 2);
  let ic = 0, top = 0;
  for (let i = -10; i <= 10; i++) {
    for (let j = -10; j <= 10; j++) {
      top++;
      if (!hitsSolid(zone3[0] + (i / 10) * z.c.hw, zone3[2] + (j / 10) * z.c.hh, katilar, LAYOUT.playerRadius)) ic++;
    }
  }
  return { cakisma, bosluk, komsu, durak: ic / top, esik: zone3[2], kapi: Math.abs(zone3[0]), hw: z.c.hw, hh: z.c.hh };
}

const ADAYLAR: Array<[string, Vec3]> = [
  ['T  taban', [2.0, 0, 1.8]],
  ['P1 orta', [0, 0, 1.8]],
  ['P2 orta-eşik', [0, 0, 1.2]],
  ['P3 sağ-eşik', [2.0, 0, 1.0]],
  ['P4 sağa-kay', [1.0, 0, 1.8]],
  ['P5 sağ-derin', [2.0, 0, 2.6]],
];

const f = (n: number) => n.toFixed(3);
console.log('# T7 · G-82 · zone3 pad yeri adayları (çerçeve çakışması = tetik-s24 §9 hesabı)');
const ornek = olc(ADAYLAR[0][1]);
console.log(`# zone3 çerçevesi yarı-ölçü hw ${f(ornek.hw)} · hh ${f(ornek.hh)}`);
console.log('aday            x      z      cakisma  bosluk   en-yakin        durak   esik   kapi');
for (const [ad, p] of ADAYLAR) {
  const r = olc(p);
  console.log(
    `${ad.padEnd(15)} ${f(p[0]).padStart(6)} ${f(p[2]).padStart(6)}  ${String(r.cakisma).padStart(5)}  ${f(r.bosluk).padStart(7)}   ${r.komsu.padEnd(14)} %${(100 * r.durak).toFixed(1).padStart(5)}  ${f(r.esik)}  ${f(r.kapi)}`,
  );
}
