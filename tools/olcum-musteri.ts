/**
 * olcum-musteri.ts — Kullanıcının 2026-09-14'te verdiği İKİ müşteri şikâyetini ÖLÇER (S18):
 *   ② *"gelen misafirler baya yan yana iç içe yürüyo"*  → AYRIŞMA (separation) var mı?
 *   ③ *"müşteriler koşmasın yürüsün"*                   → hangi klip seçiliyor ve NEDEN?
 *
 * (① *"ellerı sağa açık"* burada DEĞİL: o bir animasyon bağlama kusuruydu, `tools/olcum-kol.mjs`
 * ile ölçüldü ve `KayActor`'de kapatıldı — denge dosyalarına dokunmuyordu.)
 *
 * NEDEN ÖLÇÜM GEREKİYOR, "düzelt geç" DEĞİL: ikisinin de düzeltmesi DENGEYE dokunuyor.
 * Müşteri hızı, müşterinin masaya varma süresini ve dolayısıyla koltuk devir hızını —yani
 * ₺/dk'yı— belirler; ayrışma ise `tick.ts` içindeki `npcSystem`e girer ve `tick.ts` varyant
 * kapısının bekçilediği üç dosyadan biridir (`tools/sira-kilidi.mjs`). CLAUDE.md'nin kuralı net:
 * sayı satırı olmadan denge değişmez. Bu araç o satırları üretir.
 *
 * ÖLÇÜLEN ÜÇ ŞEY
 *   §1 KLİP SEÇİMİ — mevcut hızda `lokomosyonSec` neyi seçiyor, kaç kat hızlandırıyor, kelepçeye
 *      takılıyor mu, geriye ne kadar AYAK KAYMASI kalıyor. Saf aritmetik, simülasyon gerekmez.
 *   §2 DÖNGÜ PAYI — GERÇEK tick koşusundan: bir müşteri ömrünün ne kadarı YÜRÜMEKLE geçiyor?
 *      Hızı k kat yavaşlatmak döngüye `(k-1) × yürüme payı` ekler; ₺/dk etkisi buradan TÜRER,
 *      tahmin edilmez. Bu yüzden hız varyantlarını ayrı ayrı koşturmaya gerek yok — ve zaten
 *      koşturulamaz: `NPC_SPEED` bir modül sabiti, karar verilmeden koda dokunulmaz.
 *   §3 İÇ İÇELİK — GERÇEK tick koşusundan: aynı anda yürüyen müşteri çiftlerinin mesafeleri.
 *      "İç içe" ölçülebilir bir şeydir: iki gövdenin merkez mesafesi 2×yarıçaptan küçükse
 *      siluetler ÜST ÜSTE biner.
 *
 * Çalıştır: OLCUM=tam npx tsx tools/olcum-musteri.ts > docs/olcum-musteri.txt
 */
import { seedRandom } from './olcum-lib';
import { damga, damgaOzeti } from './olcum-lib';
import { useGame } from '../src/game/store';
import { LAYOUT, NPC_SPEED } from '../src/game/layout';
import { KLIP_HIZI, TIMESCALE_TAVAN, TIMESCALE_TABAN, ACTOR_HEIGHT } from '../src/config/actor';
import { LOKOMOSYON, lokomosyonSec } from '../src/components/three/KayActor';

const kip = process.env.OLCUM === 'tam' ? 'tam' : 'kisa';
/** Kısa kipte 6 dk, tam kipte 30 dk simüle edilir (D-084 koşu kipi). */
const SURE_SN = kip === 'tam' ? 1800 : 360;

console.log('='.repeat(92));
console.log('S18 — MUSTERI HAREKETI: ayrisma (ic ice yurume) + yurume/kosma klibi');
console.log('GERCEK tick kosusu (store) · tohumlu · ' + SURE_SN + ' sn');
console.log('='.repeat(92));
if (kip !== 'tam') console.log('\n!! KISA KIP — bu cikti RAPORA GIRMEZ (D-084). Tam kosu: OLCUM=tam\n');

// === §1 KLIP SECIMI — saf aritmetik ========================================
console.log('\n§1 KLIP SECIMI — "musteriler kosmasin yurusun" sikayetinin SAYISI');
console.log('Bugunku NPC_SPEED = ' + NPC_SPEED.toFixed(2) + ' br/sn   (aktor boyu ' + ACTOR_HEIGHT + ' br)');
console.log('Klip yazili hizlari: ' + Object.entries(KLIP_HIZI).map(([k, v]) => k + ' ' + v.toFixed(3)).join(' · '));
console.log('`lokomosyonSec` bozulmayi LOGARITMIK olcer: |ln(hiz / klip hizi)| en kucuk olan kazanir.');
console.log('\nhiz(br/sn)  Walking_A bozulma  Running_A bozulma  SECILEN     timeScale  kelepce  ARTIK KAYMA');
const ADAYLAR = [NPC_SPEED, 2.0, 1.6, 1.4, 1.2, 1.0, 0.9];
for (const h of ADAYLAR) {
  const bozW = Math.abs(Math.log(h / KLIP_HIZI.Walking_A));
  const bozR = Math.abs(Math.log(h / KLIP_HIZI.Running_A));
  const s = lokomosyonSec(LOKOMOSYON.yuru, h);
  const ham = h / KLIP_HIZI[s.klip];
  const kelepce = ham > TIMESCALE_TAVAN ? 'TAVAN' : ham < TIMESCALE_TABAN ? 'TABAN' : '-';
  // ARTIK KAYMA: klip kelepceli timeScale ile ne kadar yer tasiyor, aktor ne kadar gidiyor.
  const tasinan = KLIP_HIZI[s.klip] * s.timeScale;
  console.log(
    h.toFixed(2).padStart(10) + bozW.toFixed(3).padStart(18) + bozR.toFixed(3).padStart(19) + '  ' +
    s.klip.padEnd(11) + s.timeScale.toFixed(3).padStart(9) + '  ' + kelepce.padEnd(8) +
    (h / tasinan).toFixed(2).padStart(9) + 'x' + (h === NPC_SPEED ? '   <- BUGUN' : ''));
}
console.log('\nARTIK KAYMA 1,00x = ayak yere basili gibi durur; buyudukce "havada suzulme" artar.');
console.log('Walking_A ile kelepce ustunde kalan en yuksek hiz: ' +
  (KLIP_HIZI.Walking_A * TIMESCALE_TAVAN).toFixed(3) + ' br/sn (yani bu hizin ustunde YURUYUS KAYAR).');

// === GERCEK KOSU ===========================================================
seedRandom(20260914);
useGame.getState().hardReset();
// Salonu ac: yalniz bir masa varken "ic ice yurume" hic olusmaz — sikayet KALABALIKTA dogdu.
useGame.getState().addMoney(500000);
useGame.setState({
  padsDone: ['table2', 'table3', 'waiter', 'table4', 'zone2', 'z2table2', 'z2table3', 'dishwasher', 'z2table4'],
  padFills: {},
});

const tick = useGame.getState().tick;
const DT = 0.1;
const adim = Math.round(SURE_SN / DT);

/** Iki govde merkez mesafesi bunun altindaysa siluetler UST USTE biner. */
const CAKISMA = LAYOUT.actorRadius * 2;

let cift = 0;             // ayni karede YURUYEN musteri cifti sayisi
let cakisan = 0;          // bunlarin kaci cakisiyordu
let enYakin = Infinity;   // gorulen en kucuk merkez mesafesi
let mesafeToplam = 0;     // yakin-komsu ortalamasi icin
let komsuOrnek = 0;
let yuruyenKare = 0;      // yuruyen musteri x kare
let oturanKare = 0;
const YURUYEN = new Set(['toTable', 'leaving', 'toWc', 'wcGiris', 'wcCikis', 'backToTable']);

for (let t = 0; t < adim; t++) {
  tick(DT);
  const npcs = useGame.getState().npcs;
  const hareketli = npcs.filter((n) => YURUYEN.has(n.state));
  yuruyenKare += hareketli.length;
  oturanKare += npcs.length - hareketli.length;
  // Cift taramasi her karede degil, her saniyede bir (10 karede bir): sayiyi degistirmez,
  // maliyeti 10 kat dusurur — N^2 tarama 80 musteride kare basina 3160 cift demek.
  if (t % 10 !== 0) continue;
  for (let i = 0; i < hareketli.length; i++) {
    let yakin = Infinity;
    for (let j = 0; j < hareketli.length; j++) {
      if (i === j) continue;
      const a = hareketli[i].pos;
      const b = hareketli[j].pos;
      const d = Math.hypot(a[0] - b[0], a[2] - b[2]);
      if (j > i) {
        cift++;
        if (d < CAKISMA) cakisan++;
        if (d < enYakin) enYakin = d;
      }
      if (d < yakin) yakin = d;
    }
    if (yakin < Infinity) { mesafeToplam += yakin; komsuOrnek++; }
  }
}

const s = useGame.getState();

console.log('\n§2 DONGU PAYI — musteri omrunun ne kadari YURUMEKLE geciyor?');
const toplamKare = yuruyenKare + oturanKare;
const yurumePayi = toplamKare > 0 ? yuruyenKare / toplamKare : 0;
console.log('yuruyen musteri-kare : ' + yuruyenKare);
console.log('oturan musteri-kare  : ' + oturanKare);
console.log('YURUME PAYI          : %' + (yurumePayi * 100).toFixed(1) + ' (musteri omrunun bu kadari ayakta)');
console.log('servis edilen cay    : ' + s.stats.teasServed + ' (oyuncu) + ' + s.stats.waiterServed + ' (garson)');
console.log('\nHIZ YAVASLATMANIN BEDELI — dongu suresi (1 + (k-1) x yurume payi) kat uzar:');
console.log('kol            hiz(br/sn)  k (yavaslama)  dongu uzamasi  kabaca urun kaybi');
for (const h of ADAYLAR) {
  const k = NPC_SPEED / h;
  const uzama = 1 + (k - 1) * yurumePayi;
  console.log(
    ('hiz ' + h.toFixed(2)).padEnd(15) + h.toFixed(2).padStart(10) + k.toFixed(2).padStart(15) + '  ' +
    uzama.toFixed(3).padStart(13) + '  %' + ((1 - 1 / uzama) * 100).toFixed(1).padStart(6) +
    (h === NPC_SPEED ? '   <- BUGUN' : ''));
}
console.log('  -> "urun kaybi" TAVAN bir tahmindir: koltuk doluluk darbogaz degilse (bos masa varsa)');
console.log('     gercek kayip daha KUCUK olur. Alt sinir 0, ust sinir bu sutun.');

console.log('\n§3 IC ICELIK — "yan yana ic ice yuruyo" sikayetinin SAYISI');
console.log('aktor yaricapi       : ' + LAYOUT.actorRadius.toFixed(3) + '  -> cakisma esigi (2r) = ' + CAKISMA.toFixed(3));
console.log('taranan yuruyen cift : ' + cift);
console.log('CAKISAN cift         : ' + cakisan + '  (%' + (cift > 0 ? (cakisan / cift * 100).toFixed(2) : '0') + ')');
console.log('gorulen EN KISA ara  : ' + (enYakin === Infinity ? '—' : enYakin.toFixed(3)) +
  (enYakin < CAKISMA ? '  <- 2r ALTINDA: siluetler ic ice' : ''));
console.log('yakin-komsu ort.     : ' + (komsuOrnek > 0 ? (mesafeToplam / komsuOrnek).toFixed(3) : '—'));
console.log('\nKOD TARAFI: `npcSystem` (tick.ts) musteriyi hedefe `moveToward`/`navStep` ile tasiyor.');
console.log('`navStep`in ayrisma (separation) parametresi YALNIZ personel icin veriliyor (avoid =');
console.log('oyuncu). Musteri-musteri ayrisma cagrisi KODDA HIC YOK — yani cakisma bir ayar');
console.log('degeri degil, EKSIK BIR KUVVET. Bu yuzden "esigi buyut" diye bir kol yok.');

// === Damgalar ==============================================================
damga('kosu gercekten dondu', yuruyenKare > 0, 'hic yuruyen musteri gorulmedi — senaryo bos');
damga('musteri uretildi', s.stats.teasServed + s.stats.waiterServed > 0, 'hic cay servis edilmedi');
damga('cift taramasi calisti', cift > 0, 'hicbir karede iki musteri ayni anda yurumedi');
damga('cakisma esigi pozitif', CAKISMA > 0);
// Bugun kosu klibi seciliyor mu? Sikayetin makine karsiligi bu satir.
damga('bugunku hizda KOSU seciliyor',
  lokomosyonSec(LOKOMOSYON.yuru, NPC_SPEED).klip === 'Running_A',
  'sikayet dogrulanamadi — secilen klip: ' + lokomosyonSec(LOKOMOSYON.yuru, NPC_SPEED).klip);
damgaOzeti();
