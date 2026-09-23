/**
 * olcum-t8a.ts — T8a: ZİNCİR SIRASI (G-86) + T3 DENGE KOLLARI (K1-K8 · K11), yürürlükteki oyunda.
 *
 * Koşu:  npx tsx tools/olcum-t8a.ts                              (KISA — yön, rapora girmez)
 *        OLCUM=tam npx tsx tools/olcum-t8a.ts > docs/olcum-t8a.txt (TAM — rapora yalnız bu girer)
 *
 * SORU — kullanıcı (G-86): *"garson veya bulaşıkçı sıralaması görev sıralamaları vs mantıksal
 * olarak sence okey mi? bazı yerlerde sanki saçma"*. Buna ek olarak 2026-09-18 planının T3'ü
 * (K1-K11) dört turdur bekliyor. İkisi aynı soru: **zincirin hangi halkası yerinde değil ve
 * yerinden oynarsa tempo ne öder?** Tahmin edilmez, her kol yürürlükteki oyunun (HRE yığını,
 * D-095) üstünde AYNI ölçütlerle koşturulur.
 *
 * ÖLÇÜTLER (hepsi `simulate.ts olcutler()`ten, D-079 / D-087 / D-095 ile aynı):
 *   açılış üçlüsü  ilk alım < 90 sn · garsona kadar en uzun boşluk ≤ 2 dk · otomasyon < 15 dk
 *   HÜKÜM          İdealize profilde 20 dk'yı aşan alım (hedef ≤ 1, D-087)
 *   GÖZLEM         Normal profilde aşan alım + en uzunu (D-095 bandı: taban 2)
 *   KAT 1          Normal profilde ŞERİT DOLDU (20. masa) — zincirin uzunluğu
 *   UĞRAKLAR       Normal profilde Garson · Bulaşıkçı · 2. Garson · 2. Salon anı
 *
 * KOLLAR `economy.config.ts`'e YAZILMAZ: her kol çalışma anında uygulanır, koşudan sonra config
 * anlık görüntüden geri yüklenir (dosya tur boyunca değişmez).
 *
 * TABAN = OYUNUN KENDİ SIRA KURALI. Sim'in varsayılanı masa yükseltmesini SERBEST sırayla (en ucuz)
 * alıyor; oysa oyunda D-124'ten beri TEK HEDEF kuralı var (`rules.ts · tableUpgradeTarget`). T7 dahil
 * yığın ölçümleri serbest sırayla koştu. Burada taban tek hedeftir; eski sim tabanı `K6T` satırıdır ve
 * damga (a) onu T7'nin sayısına bağlar.
 *
 * DAMGALAR: (a) K6T = T7'nin ölçtüğü dünya (Normal aşan 2 · İdealize aşan 0); (b) her kol tabanın
 * parmak izini kımıldatmalı (C4 tuzağı ②); (c) kancalar koşu sonunda kapalı, taban geri geliyor;
 * (d) K8 kolunda en az bir seviye ödülü ÖDENMİŞ olmalı.
 */
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla, kosuGozle,
  kolAyarla, VARSAYILAN, hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla,
  masaSirasiAyarla, garsonTepsiTabaniAyarla, durtuselAyarla,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { HEDEF_KOLLARI } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla, sonKosuAtlamalari, sonKosuSeviyesi } from './itibar-kollari.ts';
import { USTA_KOLLARI, kayitSifirla as ustaKayitSifirla } from './usta-kollari.ts';
import { fabrika as siraFabrikasi, kolBul } from './sira-kollari.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const dk = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 60).toFixed(1)}` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)}` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)}` : '—');
const yuzde = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

/* ── Config'in yazılabilir görünümü + anlık görüntü ───────────────────────────────────── */
type Pad = { id: string; cost: number; area?: number; requires: Record<string, unknown> };
type Quest = { id: string; kicker?: string; title: string; target: Record<string, unknown>; reward?: number; area?: number };
const cfg = C as unknown as {
  pads: Pad[];
  quests: Quest[];
  character: { tray: { costs: number[] } };
  waiter: { trayUpgrades: { costs: number[] } };
  xp: { levelBase: number; levelGrowth: number };
};
const TABAN = {
  pads: structuredClone(cfg.pads),
  quests: structuredClone(cfg.quests),
  trayCosts: [...cfg.character.tray.costs],
  wTrayCosts: [...cfg.waiter.trayUpgrades.costs],
  xpBase: cfg.xp.levelBase,
  xpGrowth: cfg.xp.levelGrowth,
};
function geriAl(): void {
  cfg.pads = structuredClone(TABAN.pads);
  cfg.quests = structuredClone(TABAN.quests);
  cfg.character.tray.costs = [...TABAN.trayCosts];
  cfg.waiter.trayUpgrades.costs = [...TABAN.wTrayCosts];
  cfg.xp.levelBase = TABAN.xpBase;
  cfg.xp.levelGrowth = TABAN.xpGrowth;
  garsonTepsiTabaniAyarla(1);
  durtuselAyarla(false);
  masaSirasiAyarla(null);
  hedefAkisiAyarla(null);
}

const pad = (id: string): Pad => {
  const p = cfg.pads.find((x) => x.id === id);
  if (!p) throw new Error(`pad yok: ${id}`);
  return p;
};
/** Görevi listeden çıkarıp `sonra` id'li görevin ARKASINA koyar. */
function gorevTasi(id: string, sonra: string): void {
  const i = cfg.quests.findIndex((q) => q.id === id);
  const [q] = cfg.quests.splice(i, 1);
  const j = cfg.quests.findIndex((x) => x.id === sonra);
  if (i < 0 || j < 0) throw new Error(`görev yok: ${id} / ${sonra}`);
  cfg.quests.splice(j + 1, 0, q);
}
function gorevEkle(q: Quest, sonra: string): void {
  const j = cfg.quests.findIndex((x) => x.id === sonra);
  if (j < 0) throw new Error(`görev yok: ${sonra}`);
  cfg.quests.splice(j + 1, 0, q);
}
/** Pad zincirinde `id`'yi çıkarır (arkasındaki halka `id`'nin önkoşulunu devralır) ve `sonra`nın arkasına bağlar. */
function padTasi(id: string, sonra: string): void {
  const p = pad(id);
  const eskiOnce = (p.requires.prev as string[] | undefined)?.[0];
  const arkasi = cfg.pads.find((x) => (x.requires.prev as string[] | undefined)?.[0] === id);
  if (arkasi && eskiOnce) arkasi.requires = { ...arkasi.requires, prev: [eskiOnce] };
  const yeniArka = cfg.pads.find((x) => x !== p && (x.requires.prev as string[] | undefined)?.[0] === sonra);
  if (yeniArka) yeniArka.requires = { ...yeniArka.requires, prev: [id] };
  p.requires = { ...p.requires, prev: [sonra] };
}

/* ── Yürürlükteki oyun: HRE yığını (D-095) ─────────────────────────────────────────── */
let seviyeOdulu = 0;
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

/* ── KOLLAR ──────────────────────────────────────────────────────────────────────── */
interface Kol { kod: string; kalem: string; ad: string; uygula: () => void; kisa?: boolean }

/** K8: seviye atlayınca o anki gelirin `saniye` kadarı ₺ olarak düşer (ekonomiye ölçekli). */
const seviyeOdemesi = (saniye: number) => () => hedefAkisiAyarla(() => {
  let odenen = 0;
  return (d) => {
    const n = sonKosuAtlamalari().length;
    if (n <= odenen) return 0;
    const k = n - odenen;
    odenen = n;
    const odul = k * saniye * d.oran;
    seviyeOdulu += odul;
    return odul;
  };
});

const KOLLAR: Kol[] = [
  // ── G-86 · zincir sırası ──
  { kod: 'K3a', kalem: 'G-73', ad: '2. garson Salon 1 sonunda (4. masadan sonra) · ₺1.600', kisa: true, uygula: () => {
    padTasi('waiter2', 'table4'); gorevTasi('q_waiter2', 'q_charMagnet'); pad('waiter2').area = 0;
  } },
  { kod: 'K3b', kalem: 'G-73', ad: '2. garson Salon 1 sonunda · ₺800', uygula: () => {
    padTasi('waiter2', 'table4'); gorevTasi('q_waiter2', 'q_charMagnet'); pad('waiter2').cost = 800;
  } },
  { kod: 'K3c', kalem: 'G-73', ad: '2. garson Salon 2 başında (S2 2. masadan sonra) · ₺1.600', uygula: () => {
    padTasi('waiter2', 'z2table2'); gorevTasi('q_waiter2', 'q_z2table2');
  } },
  { kod: 'D1', kalem: 'G-86 ①②', ad: 'bulaşıkçı Salon 1 sonunda (4. masadan sonra) · ₺900', kisa: true, uygula: () => {
    padTasi('dishwasher', 'table4'); gorevTasi('q_dish', 'q_charMagnet'); pad('dishwasher').area = 0;
  } },
  { kod: 'D2', kalem: 'G-86 ②', ad: 'bulaşıkçı GARSONDAN ÖNCE (yer + fiyat takası: bulaşıkçı ₺130, garson ₺900)', uygula: () => {
    // Sıra: table3 → dishwasher → table4 ... z2table3 → waiter → z2table4.
    padTasi('dishwasher', 'table3'); pad('dishwasher').area = 0; pad('dishwasher').cost = 130;
    padTasi('waiter', 'z2table3'); pad('waiter').area = 1; pad('waiter').cost = 900;
    gorevTasi('q_dish', 'q_charTray2');
    gorevTasi('q_waiter', 'q_waiterTray1');
    // Garson görevleri garson yokken tutulamaz: garson hızı/tepsisi garsonun arkasına.
    gorevTasi('q_waiterL2', 'q_waiter');
    gorevTasi('q_waiterTray1', 'q_waiterL2');
  } },
  { kod: 'W3', kalem: 'G-86 ⑤', ad: 'garson tepsi 3. kademe hatta (3. garsondan sonra, ₺2.500)', uygula: () => {
    gorevEkle({ id: 'q_waiterTray3', title: 'Garson tepsisi 4', target: { type: 'waiterTray', tier: 3 }, reward: 600 }, 'q_waiter3');
  } },
  { kod: 'K5a', kalem: 'G-75', ad: '2. salondan önce: Salon 1 dört masa Seviye 2', uygula: () => {
    gorevEkle({ id: 'q_z1allL1', title: '4 masayı Seviye 2 yap', target: { type: 'tablesAtLevel', level: 1, count: 4, area: 0 }, reward: 60 }, 'q_charMagnet');
  } },
  { kod: 'K5b', kalem: 'G-75', ad: '2. salondan önce: dört masa Seviye 2 + iki masa Seviye 3', uygula: () => {
    gorevEkle({ id: 'q_z1allL1', title: '4 masayı Seviye 2 yap', target: { type: 'tablesAtLevel', level: 1, count: 4, area: 0 }, reward: 60 }, 'q_charMagnet');
    gorevEkle({ id: 'q_z1L2x2', title: '2 masayı Seviye 3 yap', target: { type: 'tablesAtLevel', level: 2, count: 2, area: 0 }, reward: 90 }, 'q_z1allL1');
  } },
  // ── T3 fiyat/doz kolları ──
  { kod: 'K1a', kalem: 'G-65', ad: 'oyuncu tepsi T1 ₺75 → ₺30', kisa: true, uygula: () => { cfg.character.tray.costs[0] = 30; } },
  { kod: 'K1b', kalem: 'G-65', ad: 'oyuncu tepsi T1 ₺75 → ₺50', uygula: () => { cfg.character.tray.costs[0] = 50; } },
  { kod: 'K2a', kalem: 'G-72', ad: 'garson tepsi tabanı 1 → 2 (kademeler aynı: 2→3→4→5)', kisa: true, uygula: () => { garsonTepsiTabaniAyarla(2); } },
  { kod: 'K2b', kalem: 'G-72', ad: 'garson tepsi tabanı 2, ilk kademe düşer (2→3→4 · ₺1.200/2.500)', uygula: () => {
    garsonTepsiTabaniAyarla(2); cfg.waiter.trayUpgrades.costs = [1200, 2500];
    // Hat kademe 2'yi istiyordu; kademe sayısı bir azaldı → görev hedefleri bir kaydırılır.
    const t1 = cfg.quests.find((q) => q.id === 'q_waiterTray1')!; const t2 = cfg.quests.find((q) => q.id === 'q_waiterTray2')!;
    cfg.quests = cfg.quests.filter((q) => q !== t1);
    t2.target = { type: 'waiterTray', tier: 1 };
  } },
  { kod: 'K4a', kalem: 'G-74', ad: '4. masa ₺380 → ₺250', kisa: true, uygula: () => { pad('table4').cost = 250; } },
  { kod: 'K4b', kalem: 'G-74', ad: '4. masa ₺380 → ₺300', uygula: () => { pad('table4').cost = 300; } },
  { kod: 'K6T', kalem: 'G-76', ad: 'masa sırası SERBEST + en ucuz (D-124 öncesi · T7 dahil sim tabanı)', kisa: true, uygula: () => { masaSirasiAyarla(null); } },
  { kod: 'K6B', kalem: 'G-76', ad: 'masa sırası GENİŞLİK-ÖNCE (1111→2222, kuşak)', kisa: true, uygula: () => { masaSirasiAyarla(siraFabrikasi(kolBul('B'))); } },
  { kod: 'K7a', kalem: 'G-66', ad: 'seviye eğrisi: taban 60 → 90', uygula: () => { cfg.xp.levelBase = 90; } },
  { kod: 'K7b', kalem: 'G-66', ad: 'seviye eğrisi: büyüme 1,5 → 1,6', kisa: true, uygula: () => { cfg.xp.levelGrowth = 1.6; } },
  { kod: 'K8a', kalem: 'G-67', ad: 'seviye ödülü + ₺ = o anki gelirin 30 sn\'si', uygula: seviyeOdemesi(30) },
  { kod: 'K8b', kalem: 'G-67', ad: 'seviye ödülü + ₺ = o anki gelirin 60 sn\'si', kisa: true, uygula: seviyeOdemesi(60) },
  { kod: 'K8c', kalem: 'G-67', ad: 'seviye ödülü + ₺ = o anki gelirin 120 sn\'si', uygula: seviyeOdemesi(120) },
  { kod: 'K11', kalem: 'G-61', ad: 'KAPISIZ dünyanın dürtüsel oyuncusu (parası yeten ucuz yan kalemi alır)', kisa: true, uygula: () => { durtuselAyarla(true); } },
];

/* ── Ölçüm ───────────────────────────────────────────────────────────────────────── */
interface Sonuc {
  o: Olcut;
  iz: string;
  ugrak: Map<string, number>;
  seviye: number;
  odul: number;
}
const UGRAKLAR = ['Garson', 'Bulaşıkçı', '2. Garson'];

function iz(b: Bosluk[]): string {
  const h = izOlustur();
  for (const x of b) h.ekle(x.t, x.gap);
  return h.deger;
}

function olc(kol: Kol | null): Sonuc {
  geriAl();
  masaSirasiAyarla(siraFabrikasi(kolBul('A'))); // oyunun kuralı (D-124); K6 kolları üstüne yazar
  kol?.uygula();
  yiginKur();
  seviyeOdulu = 0;
  const o = olcutler(); // son koşan profil Normal → itibar kaydı Normal'in
  const seviye = sonKosuSeviyesi();
  const odul = seviyeOdulu;
  yiginKur();
  const ugrak = kosuGozle(0.55, () => {});
  geriAl();
  return { o, iz: iz(o.bosluklarNormal), ugrak, seviye, odul };
}

kipBandi();
console.log('=== T8a — ZİNCİR SIRASI (G-86) + T3 DENGE KOLLARI, yürürlükteki oyunda (HRE + D-124 tek hedef) ===');
console.log('');
console.log('Model: D-086 (k1b + k2) + H·R·E yığını. economy.config.ts DOSYASI DEĞİŞMEDİ — kollar çalışma');
console.log('anında uygulanır ve her satırdan sonra anlık görüntüden geri yüklenir.');
console.log('Ölçütler: ilk alım < 90 sn · açılış boşluğu ≤ 2 dk · otomasyon < 15 dk · İdealize aşan ≤ 1 (D-087)');
console.log('          · Normal aşan = D-095 gözlem bandı · KAT 1 = Normal profilde 20. masa.');
console.log('');

kolAyarla(VARSAYILAN);
const taban = olc(null);

const secilen = KISA ? KOLLAR.filter((k) => k.kisa) : KOLLAR;
const sonuclar = new Map<string, Sonuc>();
for (const k of secilen) sonuclar.set(k.kod, olc(k));
const eski = sonuclar.get('K6T')!;
damga('K6T = T7 dünyası (Normal aşan 2)', eski.o.normalAsan === 2, `Normal aşan ${eski.o.normalAsan}`);
damga('K6T = T7 dünyası (İdealize aşan 0)', eski.o.idealAsan === 0, `İdealize aşan ${eski.o.idealAsan}`);
damga('K6T = T7 dünyası (Kat 1 23 323 sn)', eski.o.serit === 23323, `Kat 1 ${eski.o.serit}`);

const tekrar = olc(null);
damga('kancalar sızmadı (taban tekrar = taban)', tekrar.iz === taban.iz, `${tekrar.iz} ≠ ${taban.iz}`);
for (const k of secilen) varyantDamgasi(k.kod, taban.iz, sonuclar.get(k.kod)!.iz);
for (const k of secilen.filter((x) => x.kod.startsWith('K8'))) {
  damga(`${k.kod} seviye ödülü ödendi`, sonuclar.get(k.kod)!.odul > 0, '0 ₺');
}

/* §1 ─────────────────────────────────────────────────────────────────────────────── */
console.log('--- §1 KOL TABLOSU (Kat 1 = Normal 20. masa · dKat1 tabana göre) ---');
const bas = 'kol  | kalem     | ilk alım sn | açılış dk | otom. dk | HÜKÜM ideal | GÖZLEM normal      | KAT1 sa | dKat1  ';
console.log(bas);
console.log('-'.repeat(bas.length));
function satir(kod: string, kalem: string, s: Sonuc): void {
  const d = s.o.serit != null && taban.o.serit != null ? yuzde((s.o.serit - taban.o.serit) / taban.o.serit) : '—';
  console.log(
    kod.padEnd(4) + ' | ' + kalem.padEnd(9) + ' | ' + sn(s.o.ilkAlim).padStart(11) + ' | ' + dk(s.o.acilisEnUzun).padStart(9) +
    ' | ' + dk(s.o.otomasyon).padStart(8) + ' | ' + `${s.o.idealAsan} · ${dk(s.o.idealEnUzun)} dk`.padStart(11) +
    ' | ' + `${s.o.normalAsan} · ${dk(s.o.normalEnUzun)} dk`.padStart(18) + ' | ' + sa(s.o.serit).padStart(7) + ' | ' + d.padStart(6),
  );
}
satir('T0', 'taban', taban);
for (const k of secilen) satir(k.kod, k.kalem, sonuclar.get(k.kod)!);
console.log('');

/* §2 ─────────────────────────────────────────────────────────────────────────────── */
console.log('--- §2 KOLLARIN TARİFİ ---');
for (const k of secilen) console.log(`  ${k.kod.padEnd(4)} ${k.ad}`);
console.log('');

/* §3 ─────────────────────────────────────────────────────────────────────────────── */
console.log('--- §3 UĞRAKLAR (Normal profil, dk) — zincirin personel halkaları nerede ---');
const ugBas = 'kol  | Garson | Bulaşıkçı | 2. Garson | 2. Salon | seviye(12sa) | seviye ₺ toplam';
console.log(ugBas);
console.log('-'.repeat(ugBas.length));
function ugSatir(kod: string, s: Sonuc): void {
  const u = UGRAKLAR.map((a) => dk(s.ugrak.get(a)));
  const z2 = [...s.ugrak.entries()].find(([a]) => a.startsWith('ZONE-2'))?.[1];
  console.log(
    kod.padEnd(4) + ' | ' + u[0].padStart(6) + ' | ' + u[1].padStart(9) + ' | ' + u[2].padStart(9) + ' | ' + dk(z2).padStart(8) +
    ' | ' + String(s.seviye).padStart(12) + ' | ' + (s.odul > 0 ? `₺${Math.round(s.odul).toLocaleString('tr-TR')}` : '—').padStart(15),
  );
}
ugSatir('T0', taban);
for (const k of secilen) ugSatir(k.kod, sonuclar.get(k.kod)!);
console.log('');

/* §4 ─────────────────────────────────────────────────────────────────────────────── */
console.log('--- §4 20 dk\'yı AŞAN ALIMLAR (Normal gözlem bandı) ---');
const ihlal = (kod: string, s: Sonuc) =>
  console.log(`  ${kod.padEnd(4)} ${s.o.asanlar.map((a) => `${dk(a.gap)} dk → ${a.label}`).join(' · ') || 'yok'}`);
ihlal('T0', taban);
for (const k of secilen) ihlal(k.kod, sonuclar.get(k.kod)!);
console.log('');
console.log(`Parmak izi (Normal boşluklar): taban ${taban.iz}`);
for (const k of secilen) console.log(`  ${k.kod.padEnd(4)} ${sonuclar.get(k.kod)!.iz}`);

damgaOzeti();
