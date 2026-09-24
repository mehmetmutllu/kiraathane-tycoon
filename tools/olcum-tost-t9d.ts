/**
 * olcum-tost-t9d.ts — T9d: `q_tost5` ("5 tost servis et") ELLE kaç dakika sürüyor?
 *
 * Koşu:  npx tsx tools/olcum-tost-t9d.ts                                  (KISA)
 *        OLCUM=tam npx tsx tools/olcum-tost-t9d.ts > docs/olcum-tost-t9d.txt (TAM)
 *
 * SORU (D-147 ertelemesi): T9c kilidi açtı (`serveTost` sayacı), ama sayaç yalnız OYUNCUNUN elle
 * verdiği tostu sayıyor (`tick.ts` serveSystem). Garsonlar tezgâhta hazır tostu oyuncudan önce
 * kapıyor (T9b botu 40 dk'da 0 elle tost) → görev uzun sürebilir. Kaç dakika?
 *
 * NASIL: ikinci model kurulmaz; oyunun KENDİ `tick()`i başsız koşar, dünya görev hattının TAM o
 * noktası (pad'ler `z3table3`e kadar, tezgâh L5, `questIndex` = q_tost5). Oyuncuyu bir BOT yürütür:
 * gerçek `inputKeyboard` + gerçek çarpışma, rota oyuncunun kendi ızgarasından (`getPlayerNavGrid`).
 * Bot "tost-odaklı insan"dır: tepside teslim edilebilir ürün varsa en yakın bekleyen müşteriye,
 * elinde kirli varsa bulaşığa, yoksa tezgâha gidip BEKLER. Teslim edilemeyen ürünle 15 sn kalırsa
 * tepsiyi boşaltır (oyunun kendi düğmesi, `emptyTray`).
 *
 * KOLLAR (kod YAZILMADAN, aynı koşudan ve AFK koşusundan okunur — tick'e dikiş yok):
 *   V0  eski (D-148 öncesi): yalnız OYUNCUNUN tostu sayılır, hedef 5
 *   V3  yürürlük (D-148): yalnız oyuncunun tostu, hedef 3
 *   V1  HER tost sayılır (garson dahil), hedef 5 — oyuncu aktif
 *   V1a HER tost sayılır, hedef 5 — oyuncu AFK (parkta): görevin kendiliğinden bitme süresi
 *
 * DAMGALAR: bot yürüdü (yol > 0) · varyant etkili (ELLE izi ≠ AFK izi) · rejim (masa/tezgâh sabit).
 */
import { KISA, kipBandi, damga, damgaOzeti, seedRandom, varyantDamgasi, izOlustur } from './olcum-lib';
import { useGame, parkSpot } from '../src/game/store';
import { D } from '../src/game/decimal';
import { deriveWorld } from '../src/game/world';
import { economyConfig as C } from '../src/config/economy.config';
import { LAYOUT, servicePlace, getPlayerNavGrid, atServiceBody, atTableBody, tableHalfFor } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';

const DT = 1 / 60;
const TAVAN_SN = KISA ? 10 * 60 : 45 * 60;
const TOHUMLAR = KISA ? [20260924] : [20260924, 20260925, 20260926];
const ROTA_SN = 0.5;
const TAKILI_SN = 15;

const Q_IDX = C.quests.findIndex((q) => q.id === 'q_tost5');
/** q_tost'un hedef seviyesi — tost sacı bu seviyede açılır. */
const TEZGAH = (C.quests.find((q) => q.id === 'q_tost')!.target as { level: number }).level;

function kur(tohum: number): void {
  seedRandom(tohum);
  useGame.getState().hardReset();
  const son = C.pads.findIndex((p) => p.id === 'z3table3');
  useGame.setState({
    padsDone: C.pads.slice(0, son + 1).map((p) => p.id),
    wallet: D(0),
    questIndex: Q_IDX,
  } as never);
  const s0 = useGame.getState();
  // Görev hattının o noktasındaki durum: q_tableL2x2 (2 masa L2) + q_tableL2 geçti · tezgâh L5 (q_tost) ·
  // tepsi kademesi 2 (q_charTray2) · mıknatıs 1 · garson hızı 1 (q_waiterL2).
  const masalar = s0.tableLevels.map((_, i) => (i < 2 ? 2 : i < 4 ? 1 : 0));
  useGame.setState({
    tableLevels: masalar,
    stationLevels: s0.stationLevels.map(() => TEZGAH),
    charUpgrades: { ...s0.charUpgrades, tray: 2, magnet: 1 },
    waiterUpgrades: { ...s0.waiterUpgrades, speed: 1 },
  } as never);
  // Bir kare: masa/garson/salon `padsDone`dan tick içinde türer (store yalnız yüklemede kurar).
  useGame.getState().tick(DT);
  const s1 = useGame.getState();
  useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables), questBase: s1.stats.tostServed } as never);
}

interface Olcum {
  oyuncuTost: number[]; // her elle tostun sim-saniyesi
  herTost: number[]; // her tostun (kim verirse) sim-saniyesi
  yol: number;
  tostPay: number; // gelen müşterilerde tost isteyenlerin payı
  bosalt: number;
  rejim: boolean;
  iz: string;
}

function kos(tohum: number, elle: boolean, hedefOyuncu: number, hedefHer: number): Olcum {
  kur(tohum);
  const tick = useGame.getState().tick;
  const bas = useGame.getState();
  const masa = bas.tables;
  const tezgah = bas.stationLevels[0];
  const areasOpen = deriveWorld(bas.padsDone).areasOpen;
  const sp = servicePlace(areasOpen);
  const grid = getPlayerNavGrid(masa, areasOpen);
  const tostBas = bas.stats.tostServed;
  const oyuncuTost: number[] = [];
  const herTost: number[] = [];
  const bekleyen = new Set<number>();
  const gorulen = new Set<number>();
  let tostIsteyen = 0;
  let bosalt = 0;
  let yol = 0;
  let rejim = true;
  let rota: [number, number][] | null = null;
  let rotaT = 0;
  let takiliT = 0;
  const iz = izOlustur();
  const adim = Math.round(TAVAN_SN / DT);
  for (let i = 0; i < adim; i++) {
    const t = i * DT;
    const s = useGame.getState();
    if (elle) {
      const p = s.player;
      const teslimVar = s.npcs.some(
        (n) => n.state === 'waitingForTea' && (n.product === 'tost' ? s.trayFood > 0 : s.tray > 0),
      );
      let hedef: { x: number; z: number; r: number; vardi: boolean } | null = null;
      if (teslimVar) {
        let en = Infinity;
        for (const n of s.npcs) {
          if (n.state !== 'waitingForTea') continue;
          if (n.product === 'tost' ? s.trayFood <= 0 : s.tray <= 0) continue;
          const tc = LAYOUT.tables[n.tableIndex].table;
          const d = Math.hypot(tc[0] - p[0], tc[2] - p[2]);
          if (d < en) {
            en = d;
            const h = tableHalfFor(n.tableIndex);
            hedef = { x: tc[0], z: tc[2], r: Math.max(h[0], h[1]) + 0.9, vardi: atTableBody(p[0], p[2], n.tableIndex, C.cups.collectReach) };
          }
        }
        takiliT = 0;
      } else if (s.tray + s.trayFood > 0) {
        // Teslim edilemeyen ürün: bir süre tezgâhta bekle, sonra boşalt (oyunun kendi düğmesi).
        takiliT += DT;
        if (takiliT > TAKILI_SN) {
          if (s.trayFood > 0) s.emptyTray('food');
          if (s.tray > 0) s.emptyTray('tea');
          bosalt++;
          takiliT = 0;
        }
      } else takiliT = 0;
      if (!hedef && s.carriedDirty + s.carriedDirtyFood > 0) {
        hedef = { x: sp.dish[0], z: sp.dish[2], r: C.cups.washRadius - 0.15, vardi: Math.hypot(sp.dish[0] - p[0], sp.dish[2] - p[2]) < C.cups.washRadius - 0.1 };
      }
      if (!hedef) {
        hedef = { x: sp.pickup[0], z: sp.pickup[2], r: 0.3, vardi: atServiceBody(p[0], p[2], sp, C.serving.pickupReach * 0.8) };
      }
      let ix = 0, iz2 = 0;
      if (!hedef.vardi) {
        rotaT -= DT;
        if (!rota || rotaT <= 0) {
          rota = findNavPath(grid, p, hedef.x, hedef.z, hedef.r);
          rotaT = ROTA_SN;
        }
        let wx = hedef.x, wz = hedef.z;
        if (rota) {
          while (rota.length > 1 && Math.hypot(rota[0][0] - p[0], rota[0][1] - p[2]) < 0.2) rota.shift();
          if (rota.length) [wx, wz] = rota[0];
        }
        const dx = wx - p[0], dz = wz - p[2];
        const m = Math.hypot(dx, dz);
        if (m > 0.02) { ix = dx / m; iz2 = dz / m; }
      } else rota = null;
      s.setKeyboardInput(ix, iz2);
    }
    const onceki = useGame.getState().player;
    tick(DT);
    const sn = useGame.getState();
    yol += Math.hypot(sn.player[0] - onceki[0], sn.player[2] - onceki[2]);
    if (sn.tables !== masa || sn.stationLevels[0] !== tezgah) rejim = false;
    for (const n of sn.npcs) {
      if (!gorulen.has(n.id) && n.state === 'waitingForTea') {
        gorulen.add(n.id);
        if (n.product === 'tost') tostIsteyen++;
      }
      if (n.product !== 'tost') continue;
      if (n.state === 'waitingForTea') bekleyen.add(n.id);
      else if (bekleyen.has(n.id) && n.state === 'drinking') {
        bekleyen.delete(n.id);
        herTost.push(t + DT);
      }
    }
    while (oyuncuTost.length < sn.stats.tostServed - tostBas) oyuncuTost.push(t + DT);
    if (i % 60 === 0) iz.ekle(sn.player[0], sn.player[2], herTost.length);
    if (process.env.IZLE && elle && i % 600 === 0)
      console.error(`t=${(t / 60).toFixed(1)}dk p=${sn.player[0].toFixed(1)},${sn.player[2].toFixed(1)} tepsi=${sn.tray}/${sn.trayFood} kirli=${sn.carriedDirty + sn.carriedDirtyFood} hazır=${sn.ready.tea}/${sn.ready.tost} bekleyen=${sn.npcs.filter((n) => n.state === 'waitingForTea').map((n) => n.product[0] + n.tableIndex).join(',')} elle=${oyuncuTost.length} her=${herTost.length}`);
    if (oyuncuTost.length >= hedefOyuncu && herTost.length >= hedefHer) break;
  }
  useGame.getState().setKeyboardInput(0, 0);
  return { oyuncuTost, herTost, yol, tostPay: gorulen.size ? tostIsteyen / gorulen.size : 0, bosalt, rejim, iz: iz.deger };
}

const dk = (sn: number | undefined) => (sn == null ? `> ${(TAVAN_SN / 60).toFixed(0)}` : (sn / 60).toFixed(1));
const ort = (xs: (number | undefined)[]) =>
  xs.some((x) => x == null) ? undefined : xs.reduce((a: number, x) => a + (x as number), 0) / xs.length;

kipBandi();
console.log('=== T9d — q_tost5 ELLE SÜRESİ (oyunun kendi tick\'i, görev hattının q_tost5 noktası) ===');
kur(TOHUMLAR[0]);
const w = useGame.getState();
console.log(
  `Dünya: ${w.tables} masa · ${deriveWorld(w.padsDone).areasOpen} salon · tezgâh iç seviye ${w.stationLevels[0]} · ` +
    `garson ${w.waiters.length} · oyuncu tepsisi kademe ${w.charUpgrades.tray} · tavan ${TAVAN_SN / 60} dk · tohum ${TOHUMLAR.length} · DT 1/60`,
);
console.log('');

const elle = TOHUMLAR.map((t) => kos(t, true, 5, 5));
const afk = TOHUMLAR.map((t) => kos(t, false, 0, 5));
varyantDamgasi('ELLE ≠ AFK', afk.map((x) => x.iz).join(''), elle.map((x) => x.iz).join(''));
damga('bot yürüdü', elle.every((x) => x.yol > 10), 'ELLE koşusunda oyuncu yerinden oynamadı');
damga('rejim', [...elle, ...afk].every((x) => x.rejim), 'masa/tezgâh koşu içinde değişti');

console.log('tohum | elle 1. / 3. / 5. tost (dk) | her tost 5. (elle) | her tost 5. (AFK) | tost payı | yürünen br | tepsi boşaltma');
for (let i = 0; i < TOHUMLAR.length; i++) {
  const e = elle[i], a = afk[i];
  console.log(
    `${TOHUMLAR[i]} | ${dk(e.oyuncuTost[0])} / ${dk(e.oyuncuTost[2])} / ${dk(e.oyuncuTost[4])} | ${dk(e.herTost[4])} | ${dk(a.herTost[4])} | ` +
      `%${(e.tostPay * 100).toFixed(1)} | ${e.yol.toFixed(0)} | ${e.bosalt}`,
  );
}
console.log('');
console.log('§KOLLAR (ortalama, dk)');
console.log(`V0  eski — yalnız oyuncunun tostu, 5  : ${dk(ort(elle.map((x) => x.oyuncuTost[4])))}`);
console.log(`V3  D-148 — yalnız oyuncunun tostu, 3: ${dk(ort(elle.map((x) => x.oyuncuTost[2])))}`);
console.log(`V1  her tost sayılır, 5 (oyuncu aktif): ${dk(ort(elle.map((x) => x.herTost[4])))}`);
console.log(`V1a her tost sayılır, 5 (oyuncu AFK)  : ${dk(ort(afk.map((x) => x.herTost[4])))}`);
console.log('');
console.log('Not: bot süresi insanın alt sınırı değildir (bot tezgâhta bekler, sıcak tostu görünce koşmaz).');
damgaOzeti();
