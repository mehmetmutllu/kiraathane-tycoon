/**
 * olcum-odullu-f3b.ts — F3b: ÖDÜLLÜ VİDEONUN ÖDÜLÜ ne olmalı? (varyant kapısı · D-084)
 *
 * Koşu:  npx tsx tools/olcum-odullu-f3b.ts                                  (KISA — yön, rapora girmez)
 *        OLCUM=tam npx tsx tools/olcum-odullu-f3b.ts > docs/olcum-odullu-f3b.txt (TAM — rapora yalnız bu)
 *
 * SORU — F3 altyapısı kuruldu (D-149), ödüllü düğmeler pasif. Beş yüzey ödül bekliyor ve her biri
 * `economy.config.ts`e bir sayı yazar:
 *   ① ödül ekranı "İzle, 2× al" — seviye ₺ · çevrimdışı ₺ · günlük görev 💎 · hedef 💎
 *   ② Usta "İzle" — kaç video bir Usta, günde kaç
 *   ③ G-57 video hakkı (kullanıcı taslağı: "2 saatte 4 hak · video başına 1 💎 ya da 200 ₺")
 *
 * ÜÇ BÖLÜM, ÜÇ ÖLÇEK:
 *   §1 SİM (dakika-saat): ₺ kolları Kat 1 zincirine ne yapıyor. Ölçütler `olcutler()` (D-079/D-087/D-095).
 *      ÜST SINIR: oyuncu HER fırsatta izliyor ve dolum %100. Üst sınır küçükse kol güvenle geçer.
 *   §2 ÇEVRİMDIŞI DEFTERİ: sim tek oturumdur, yokluğu oynamaz. Taban koşusunun Normal profilinden
 *      5 dk'da bir ÖRNEK alınır (oran + açılmış pad'ler) ve oyunun kendi `computeOfflineEarned`i
 *      o örnekte koşturulur → "dönüşte ödül sıradaki pad'in kaçı" (kullanıcı kuralı: alan açılır,
 *      İÇİ bitmez — `offline.capNextPadFrac`).
 *   §3 ELMAS DEFTERİ (gün ölçeği, D7 §5'in yöntemi): tick 12 sa'i okur, Usta kuyruğu günlerce sürer.
 *
 * DAMGALAR: (a) taban tekrar = taban (kancalar sızmadı); (b) her ₺ kolu taban izinden ayrılmalı;
 * (c) her ₺ kolunda en az bir ödül ÖDENMİŞ olmalı; (d) §2'de en az 30 örnek.
 */
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla,
  kolAyarla, VARSAYILAN, hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla, masaSirasiAyarla,
  type Olcut, type Bosluk, type HedefDurum,
} from './simulate.ts';
import { HEDEF_KOLLARI, kademeAkisi } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla, sonKosuAtlamalari } from './itibar-kollari.ts';
import { USTA_KOLLARI, HEDEF_ELMAS_TOPLAM, kayitSifirla as ustaKayitSifirla } from './usta-kollari.ts';
import { fabrika as siraFabrikasi, kolBul } from './sira-kollari.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { computeOfflineEarned } from '../src/game/rules.ts';
import { LAYOUT } from '../src/game/layout.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur, yuzdelik } from './olcum-lib.ts';

const dk = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 60).toFixed(1)}` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)}` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)}` : '—');
const yuzde = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
const tl = (x: number) => `₺${Math.round(x).toLocaleString('tr-TR')}`;
const vir = (x: number, n = 2) => x.toFixed(n).replace('.', ',');

/* ── §1 ödeyici: seviye ₺ (oyunun kuralı × kat) + video hakkı ───────────────────────── */
interface Video { hak: number; periyotSn: number; odul: (d: HedefDurum) => number }
interface KolTanim { kod: string; ad: string; seviyeKat: number; video?: Video; kisa?: boolean;
  /** Hedef ödülünün KALICI gelir payı bu katla (ödül ekranı 2× hedefte de izlenirse). */
  hedefKat?: number }

interface Ornek { t: number; oran: number; padsDone: string[] }
let seviyeTop = 0;
let videoTop = 0;
let videoSay = 0;
let ornekler: Ornek[] = [];
const ORNEK_SN = 300;

function odeyici(k: KolTanim) {
  return () => {
    let odenen = 0;
    let sonrakiVideo = k.video?.periyotSn ?? Infinity;
    let sonrakiOrnek = 0;
    // Her profil koşusu taze ödeyici ister; olcutler() Normal'i SON koşar → toplamlar Normal'inkidir.
    seviyeTop = 0;
    videoTop = 0;
    videoSay = 0;
    ornekler = [];
    return (d: HedefDurum): number => {
      let odul = 0;
      const at = sonKosuAtlamalari();
      if (at.length > odenen) {
        const n = at.slice(odenen).filter((a) => a.seviye >= C.xp.levelRewardFromLevel).length;
        odenen = at.length;
        const s = n * C.xp.levelRewardSec * d.oran * k.seviyeKat;
        seviyeTop += s;
        odul += s;
      }
      // Video hakkı pencerenin SONUNDA harcanır (o an gelir en yüksek → üst sınır).
      if (k.video && d.t >= sonrakiVideo) {
        sonrakiVideo += k.video.periyotSn;
        const v = k.video.hak * k.video.odul(d);
        videoTop += v;
        videoSay += k.video.hak;
        odul += v;
      }
      if (d.t >= sonrakiOrnek) {
        sonrakiOrnek += ORNEK_SN;
        ornekler.push({ t: d.t, oran: d.oran, padsDone: [...(d.padsDone ?? [])] });
      }
      return odul;
    };
  };
}

const IKI_SAAT = 2 * 3600;
const KOLLAR: KolTanim[] = [
  { kod: 'S2', ad: 'ödül ekranı 2×: seviye ₺ ikiye katlanır (her seviyede izler)', seviyeKat: 2, kisa: true },
  { kod: 'H2', ad: 'ödül ekranı 2×: hedefin KALICI gelir payı ikiye katlanır (her hedefte izler)', seviyeKat: 1, hedefKat: 2, kisa: true },
  { kod: 'V60', ad: "G-57 · 2 sa'te 4 hak · video = son 60 sn'nin ₺'si (ilerlemeye oranlı)", seviyeKat: 1,
    video: { hak: 4, periyotSn: IKI_SAAT, odul: (d) => 60 * d.oran } },
  { kod: 'V200', ad: 'G-57 · 2 sa\'te 4 hak · video = 200 ₺ sabit (kullanıcı taslağı)', seviyeKat: 1,
    video: { hak: 4, periyotSn: IKI_SAAT, odul: () => 200 } },
  { kod: 'V120', ad: "G-57 · 2 sa'te 4 hak · video = son 120 sn'nin ₺'si", seviyeKat: 1,
    video: { hak: 4, periyotSn: IKI_SAAT, odul: (d) => 120 * d.oran } },
  { kod: 'SV', ad: 'en çok izleyen: S2 + H2 + V60 birlikte', seviyeKat: 2, hedefKat: 2,
    video: { hak: 4, periyotSn: IKI_SAAT, odul: (d) => 60 * d.oran } },
];

/* ── Yürürlükteki oyun (olcum-t8a'nın `olc`u, taban = oyunun kuralları) ──────────────── */
function yiginKur(): void {
  itibarKayitSifirla();
  ustaKayitSifirla();
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  itibarAyarla(ITIBAR_KOLLARI.rUYG.fabrika(1));
  ustaAyarla(USTA_KOLLARI.eUYG.fabrika(1));
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
}

interface Sonuc { o: Olcut; iz: string; seviye: number; video: number; videoSay: number; ornek: Ornek[] }
function iz(b: Bosluk[]): string {
  const h = izOlustur();
  for (const x of b) h.ekle(x.t, x.gap);
  return h.deger;
}
/** hUYGF'nin (D-090, yürürlükteki) aynısı; yalnız kademe başına pay `kat` ile çarpılır. */
const TOPLAM_KADEME = C.goals.categories.reduce((a, c) => a + c.tiers.length, 0);
const hedefCarpani = (kat: number) => () => {
  const akis = kademeAkisi();
  let acik = 0;
  return (d: HedefDurum) => {
    acik += akis(d).length;
    return 1 + (kat * C.goals.incomeBonusTotal * acik) / TOPLAM_KADEME;
  };
};

function olc(k: KolTanim): Sonuc {
  masaSirasiAyarla(siraFabrikasi(kolBul('A'))); // oyunun kuralı (D-124)
  hedefAkisiAyarla(odeyici(k));
  yiginKur();
  if (k.hedefKat != null) hedefCarpaniAyarla(hedefCarpani(k.hedefKat));
  const o = olcutler();
  const s: Sonuc = { o, iz: iz(o.bosluklarNormal), seviye: seviyeTop, video: videoTop, videoSay, ornek: ornekler };
  hedefAkisiAyarla(null);
  masaSirasiAyarla(null);
  return s;
}

const TABAN_KOL: KolTanim = { kod: 'T0', ad: 'taban: reklam yok (seviye ₺ 1×)', seviyeKat: 1 };

kipBandi();
console.log('=== F3b — ÖDÜLLÜ VİDEONUN ÖDÜLÜ: ₺ kolları (sim) · çevrimdışı 2× (defter) · 💎/Usta (defter) ===');
console.log('');
console.log('economy.config.ts DOSYASI DEĞİŞMEDİ — kollar sim kancasıyla çalışma anında uygulanır.');
console.log('Taban = oyunun kuralları (D-124 tek hedef · D-142 seviye ₺ 60 sn, Sv 5\'ten) + HRE yığını.');
console.log('Ölçütler: ilk alım < 90 sn · açılış boşluğu ≤ 2 dk · otomasyon < 15 dk · İdealize aşan ≤ 1 (HÜKÜM)');
console.log('          · Normal aşan = gözlem · KAT 1 = Normal profilde 20. masa.');
console.log('ÜST SINIR: oyuncu her fırsatta izler, dolum %100, ödül düştüğü tick cüzdanda.');
console.log('');

kolAyarla(VARSAYILAN);
const taban = olc(TABAN_KOL);
const secilen = KISA ? KOLLAR.filter((k) => k.kisa) : KOLLAR;
const sonuc = new Map<string, Sonuc>();
for (const k of secilen) sonuc.set(k.kod, olc(k));
const tekrar = olc(TABAN_KOL);

damga('kancalar sızmadı (taban tekrar = taban)', tekrar.iz === taban.iz, `${tekrar.iz} ≠ ${taban.iz}`);
damga('taban seviye ödülü ödendi', taban.seviye > 0, '0 ₺');
for (const k of secilen) {
  varyantDamgasi(k.kod, taban.iz, sonuc.get(k.kod)!.iz);
  const s = sonuc.get(k.kod)!;
  if (k.hedefKat == null || k.video || k.seviyeKat !== 1)
    damga(`${k.kod} ödül ödendi`, (k.video ? s.video : s.seviye - taban.seviye) > 0, 'ek ödül 0');
}

console.log('--- §1 ₺ KOLLARI (Normal profil ödemeleri · dKat1 tabana göre) ---');
const bas = 'kol  | ilk alım sn | açılış dk | otom. dk | HÜKÜM ideal | GÖZLEM normal | KAT1 sa | dKat1  | seviye ₺   | video ₺ (adet)';
console.log(bas);
console.log('-'.repeat(bas.length));
function satir(kod: string, s: Sonuc): void {
  const d = s.o.serit != null && taban.o.serit != null ? yuzde((s.o.serit - taban.o.serit) / taban.o.serit) : '—';
  console.log(
    kod.padEnd(4) + ' | ' + sn(s.o.ilkAlim).padStart(11) + ' | ' + dk(s.o.acilisEnUzun).padStart(9) +
    ' | ' + dk(s.o.otomasyon).padStart(8) + ' | ' + `${s.o.idealAsan} · ${dk(s.o.idealEnUzun)}`.padStart(11) +
    ' | ' + `${s.o.normalAsan} · ${dk(s.o.normalEnUzun)}`.padStart(13) + ' | ' + sa(s.o.serit).padStart(7) + ' | ' + d.padStart(6) +
    ' | ' + tl(s.seviye).padStart(10) + ' | ' + (s.videoSay ? `${tl(s.video)} (${s.videoSay})` : '—'),
  );
}
satir('T0', taban);
for (const k of secilen) satir(k.kod, sonuc.get(k.kod)!);
console.log('');
console.log('Kolların tarifi:');
for (const k of [TABAN_KOL, ...secilen]) console.log(`  ${k.kod.padEnd(4)} ${k.ad}`);
console.log('');
console.log('20 dk\'yı aşan alımlar (Normal):');
for (const [kod, s] of [['T0', taban] as const, ...secilen.map((k) => [k.kod, sonuc.get(k.kod)!] as const)]) {
  console.log(`  ${kod.padEnd(4)} ${s.o.asanlar.map((a) => `${dk(a.gap)} dk → ${a.label}`).join(' · ') || 'yok'}`);
}
console.log(`Parmak izi: taban ${taban.iz} · ${secilen.map((k) => `${k.kod} ${sonuc.get(k.kod)!.iz}`).join(' · ')}`);
console.log('');

/* ── §2 ÇEVRİMDIŞI DEFTERİ ─────────────────────────────────────────────────────────── */
type Pad = { id: string; cost: number; optional?: boolean };
const PADS = C.pads as readonly Pad[];
const siradaki = (done: readonly string[]) => PADS.find((p) => !p.optional && !done.includes(p.id)) ?? null;
const tavan = (done: readonly string[]) => {
  const n = siradaki(done);
  return Math.floor((n ? n.cost : Math.max(...PADS.map((p) => p.cost))) * C.offline.capNextPadFrac);
};
const hamOdul = (oran: number, sure: number) =>
  Math.floor(oran * C.offline.rateMult * Math.min(sure, C.offline.baseCapHours * 3600));

interface OffKol { kod: string; ad: string; odul: (o: Ornek, sure: number) => number }
const OFF_KOLLAR: OffKol[] = [
  { kod: 'O0', ad: 'taban: reklam yok', odul: (o, t) => computeOfflineEarned(o.oran, t, o.padsDone) },
  { kod: 'O1', ad: '2× TAVANDAN SONRA (izleyen tavanın iki katını alır)', odul: (o, t) => 2 * computeOfflineEarned(o.oran, t, o.padsDone) },
  { kod: 'O2', ad: '2× TAVANDAN ÖNCE (tavan yine bağlar)', odul: (o, t) => Math.min(2 * hamOdul(o.oran, t), tavan(o.padsDone)) },
];
const ornek = taban.ornek.filter((o) => siradaki(o.padsDone) != null && o.oran > 0);
damga('§2 en az 30 örnek', ornek.length >= 30, `${ornek.length} örnek`);
console.log(`--- §2 ÇEVRİMDIŞI 2× (taban Normal profilinden ${ornek.length} örnek, ${ORNEK_SN / 60} dk'da bir; sıradaki pad hâlâ varken) ---`);
console.log('oran = dönüş ödülü / sıradaki omurga pad\'in fiyatı. ≥ 1 → dönen oyuncu sıradaki pad\'i TEK BAŞINA alır.');
console.log('≥ 2 → sıradaki pad + bir o kadar daha ("alanın içi bitmesin" kuralının kırılma yönü). Tavan = 1,15.');
const offBas = 'kol | yokluk | medyan oran | p90 oran | ≥1 pad | ≥2 pad | tavanda';
console.log(offBas);
console.log('-'.repeat(offBas.length));
for (const sure of [20 * 60, 3600]) {
  for (const k of OFF_KOLLAR) {
    const oranlar = ornek.map((o) => k.odul(o, sure) / siradaki(o.padsDone)!.cost);
    const tavanda = ornek.filter((o) => hamOdul(o.oran, sure) >= tavan(o.padsDone)).length;
    const pay = (x: number) => `%${((100 * oranlar.filter((r) => r >= x).length) / oranlar.length).toFixed(0)}`;
    console.log(
      `${k.kod.padEnd(3)} | ${(sure / 60).toFixed(0).padStart(3)} dk | ${vir(yuzdelik(oranlar, 50)).padStart(11)} | ` +
      `${vir(yuzdelik(oranlar, 90)).padStart(8)} | ${pay(1).padStart(6)} | ${pay(2).padStart(6)} | %${((100 * tavanda) / ornek.length).toFixed(0)}`,
    );
  }
}
console.log('Kollar:');
for (const k of OFF_KOLLAR) console.log(`  ${k.kod} ${k.ad}`);
console.log('');

/* ── §3 ELMAS DEFTERİ (gün ölçeği) ─────────────────────────────────────────────────── */
const USTA_HEDEF = LAYOUT.tables.length; // bugün Usta yalnız masada (rules.masterId 'table')
const FIYAT = C.master.diamondCost;
const GUNLUK = C.dailyQuests.diamondsPerDay;
interface ElmasKol { kod: string; ad: string; gunluk: number; hedefKat: number; reklamUstaGun: number }
const G57_ELMAS_OTURUM = 4; // 4 hak × 1 💎, oturum başına bir pencere
const ELMAS_KOLLAR: ElmasKol[] = [
  { kod: 'E0', ad: 'taban: reklam yok', gunluk: GUNLUK, hedefKat: 1, reklamUstaGun: 0 },
  { kod: 'Eg2', ad: 'günlük görev 💎 2× (her gün izler)', gunluk: 2 * GUNLUK, hedefKat: 1, reklamUstaGun: 0 },
  { kod: 'Eh2', ad: 'hedef 💎 2× (her hedefte izler)', gunluk: GUNLUK, hedefKat: 2, reklamUstaGun: 0 },
  { kod: 'Egh2', ad: 'günlük + hedef 2× birlikte', gunluk: 2 * GUNLUK, hedefKat: 2, reklamUstaGun: 0 },
  { kod: 'U1', ad: 'Usta "İzle": 1 video = 1 Usta, günde en çok 1', gunluk: GUNLUK, hedefKat: 1, reklamUstaGun: 1 },
  { kod: 'U3', ad: 'Usta "İzle": 1 video = 1 Usta, günde en çok 3', gunluk: GUNLUK, hedefKat: 1, reklamUstaGun: 3 },
  { kod: 'U∞', ad: 'Usta "İzle": 1 video = 1 Usta, sınırsız', gunluk: GUNLUK, hedefKat: 1, reklamUstaGun: Infinity },
  { kod: 'Ug1', ad: 'G-57 💎: 4 hak × 1 💎, günde 1 oturum', gunluk: GUNLUK + G57_ELMAS_OTURUM, hedefKat: 1, reklamUstaGun: 0 },
  { kod: 'Ug2', ad: 'G-57 💎: 4 hak × 1 💎, günde 2 oturum', gunluk: GUNLUK + 2 * G57_ELMAS_OTURUM, hedefKat: 1, reklamUstaGun: 0 },
  { kod: 'IAP', ad: 'KIYAS: Reklamları Kaldır (+10 💎/gün, D-040), video yok', gunluk: GUNLUK + 10, hedefKat: 1, reklamUstaGun: 0 },
];
console.log(`--- §3 ELMAS / USTA KUYRUĞU (Usta hedefi ${USTA_HEDEF} masa · fiyat ${FIYAT} 💎 · günlük ${GUNLUK} 💎 · hedef 💎 toplam ${HEDEF_ELMAS_TOPLAM}) ---`);
console.log('peşin = hedef 💎\'ıyla alınabilen Usta · kuyruk = kalan · gün = kuyruğun bitişi (masalar ₺ tavanında varsayılır).');
const eBas = 'kol  | peşin | kuyruk | 💎/gün | Usta/gün | kuyruk biter | gün/Usta';
console.log(eBas);
console.log('-'.repeat(eBas.length));
for (const k of ELMAS_KOLLAR) {
  const pesin = Math.min(USTA_HEDEF, Math.floor((HEDEF_ELMAS_TOPLAM * k.hedefKat) / FIYAT));
  const kuyruk = USTA_HEDEF - pesin;
  const ustaGun = k.gunluk / FIYAT + (Number.isFinite(k.reklamUstaGun) ? k.reklamUstaGun : 0);
  const gun = !Number.isFinite(k.reklamUstaGun) ? (kuyruk > 0 ? 1 : 0) : kuyruk / ustaGun;
  console.log(
    `${k.kod.padEnd(4)} | ${String(pesin).padStart(5)} | ${String(kuyruk).padStart(6)} | ${String(k.gunluk).padStart(6)} | ` +
    `${(Number.isFinite(k.reklamUstaGun) ? vir(ustaGun) : '∞').padStart(8)} | ${(vir(gun, 1) + ' gün').padStart(12)} | ` +
    `${kuyruk > 0 ? vir(gun / kuyruk) : '—'}`,
  );
}
console.log('Kollar:');
for (const k of ELMAS_KOLLAR) console.log(`  ${k.kod.padEnd(4)} ${k.ad}`);
console.log('MODEL SINIRI: kozmetikler (💎) aynı havuzu paylaşır, bu defter onları saymaz → gün sayıları ALT sınır.');

damgaOzeti();
