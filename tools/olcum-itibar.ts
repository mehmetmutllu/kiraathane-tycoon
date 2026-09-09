/**
 * olcum-itibar.ts — D6: İtibar (eski XP) hangi KANALDAN ödesin — ve ödemesi nereye düşüyor?
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-itibar.ts > docs/olcum-itibar.txt
 *        (OLCUM verilmezse KISA koşar — ızgara seyrekleşir, rapora GİRMEZ.)
 *
 * SORU: `docs/plan-kat1-yayin.html` §6 İtibar'a "her seviye +%2 müşteri akışı, +%1 bahşiş"
 * yazdı — ikisi de denge sayısı, ikisi de hiç ölçülmedi. B4 ise Kat 1'de throughput kolunun
 * TÜKENDİĞİNİ ölçmüştü. Talep zaten bağlayıcı değilse planın kolu hiçbir şey yapmaz; bu bir
 * varsayım olarak değil, tablonun bir SATIRI olarak kararlaştırılır (D-084).
 *
 * NE ÖLÇÜYOR — altı kolon birden okunmadan karar verilemez:
 *   1) SEVİYE   12 sa penceresinde ulaşılan seviye + atlama sayısı. Ödülün TAŞIYICISI bu; kaç
 *               kez ödendiğini bilmeden dozun ne demek olduğu bilinemez.
 *   2) PENCERE  Atlamaların KAÇI 20 dk'yı aşan bekleme aralıklarının İÇİNE düştü. D3'ün dersi:
 *               pencereyi ödülün büyüklüğü değil YOĞUNLUĞU doldurur.
 *   3) ÖRTÜŞME  Atlamaların kaçı bir hedef kademesiyle AYNI pencereye düştü. Örtüşme yüksekse
 *               İtibar hedeflerin ikinci bir kopyasıdır — yeni bir kanal değil.
 *   4) İHLAL    20 dk'yı aşan alım — hüküm İDEALİZE profilde (D-087), Normal gözlem bandı.
 *   5) ŞERİT    Zincirin uzunluğu: ödül Kat 1 içeriğinden ne kadar GÖTÜRÜYOR (D1'in eleme ölçütü).
 *   6) AÇILIŞ   D-079'un üç ölçütü — ödül erken oyuna sızıp açılışı bozuyor mu (D4'te `hG`
 *               tam buradan elenmişti: otomasyon 6,1 → 1,7 dk).
 *
 * DAMGALAR: (a) atıl beklenen kol (t0 · r4 · r5) tabanın BİREBİR kopyası olmalı — r4 aynı
 * zamanda kancanın koşuyu kımıldatmadığının kanıtıdır; (b) etkili kol taban izinden AYRILMALI;
 * (c) her kolda en az bir seviye atlanmış olmalı — atlanmadıysa satır ölçüm değil (D1'de
 * `iade:0.25` varyantı tam bu şekilde hiç tetiklenmemişti); (d) `seviyeHesap` kopyası
 * `levelProgress`ten sapmamalı.
 */
import {
  olcutler, profilBosluklari, onbellekTemizle, milestoneTazele, m1Ayarla,
  modelDebisi, GERCEK, kolAyarla, VARSAYILAN, hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla,
  darbogazDagilimi,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { HEDEF_KOLLARI } from './hedef-kollari.ts';
import {
  ITIBAR_KOLLARI, kayitSifirla, sonKosuAtlamalari, sonKosuHedefAcilislari, sonKosuXp,
  egriDenetimi, type ItibarKolTanim,
} from './itibar-kollari.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const SINIR = 20 * 60;
const dk = (x: number) => (Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)} sn` : '—');

/** Kol uygulanmadan önce dünya TABANA döner; yoksa kollar birbirinin üstüne biner. */
function kolaGec(kol: ItibarKolTanim | null, doz: number): void {
  kayitSifirla();
  itibarAyarla(kol ? kol.fabrika(doz) : null);
  // D6 turunda hedef ₺ akışı ve hedef çarpanı KAPALI tutulur: ölçülen şey İtibar'ın kendi
  // kanalıdır. Hedeflerin kademe ZAMANLARI yine de kaydediliyor (örtüşme kolonu) — ama ₺
  // ödemiyor, yoksa D-090'ın çarpanı bu tablonun içine ikinci kez sızardı.
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(null);
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
}

/** Normal profilin davranış parmak izi — varyant gerçekten etkili mi, bunu karşılaştırır. */
function iz(bosluklar: Bosluk[]): string {
  const h = izOlustur();
  for (const b of bosluklar) h.ekle(b.t, b.gap);
  return h.deger;
}

interface Sonuc {
  o: Olcut;
  iz: string;
  sapma: number;
  /** Normal koşuda ulaşılan seviye ve atlama sayısı. */
  seviye: number;
  atlama: number;
  /** Atlamaların 20 dk'yı aşan bekleme aralıklarının İÇİNE düşen sayısı. */
  pencere: number;
  /** Atlamaların bir hedef kademesiyle AYNI 20 dk'lık pencereye düşen sayısı. */
  ortusme: number;
  /** Türetilen toplam XP (model sınırı: alt sınır). */
  xp: number;
}

function olc(): Sonuc {
  const o = olcutler();
  const sapmalar = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  // `olcutler()` son olarak NORMAL profili koşar → kayıt onundur.
  const atlamalar = sonKosuAtlamalari();
  const hedefler = sonKosuHedefAcilislari();
  // Her ihlal penceresi [alım anı - boşluk, alım anı] aralığıdır; oyuncu o aralık boyunca
  // biriktiriyordu. Seviye atlaması bu aralığın İÇİNE düşüyorsa bekleme fiilen dolar.
  const pencereler = o.bosluklarNormal.filter((b) => b.gap > SINIR).map((b) => [b.t - b.gap, b.t] as const);
  const icinde = atlamalar.filter((a) => pencereler.some(([x, y]) => a.t >= x && a.t <= y));
  // ÖRTÜŞME: aynı pencerede hem seviye atlaması hem hedef kademesi düştü mü. İki kanal aynı
  // yeri dolduruyorsa İtibar yeni bir kanal DEĞİL, hedeflerin ikinci kopyasıdır.
  const ortusen = icinde.filter((a) =>
    pencereler.some(([x, y]) => a.t >= x && a.t <= y && hedefler.some((h) => h >= x && h <= y)));
  return {
    o,
    iz: iz(o.bosluklarNormal),
    sapma: sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length,
    seviye: atlamalar.length ? atlamalar[atlamalar.length - 1].seviye : 1,
    atlama: atlamalar.length,
    pencere: icinde.length,
    ortusme: ortusen.length,
    xp: sonKosuXp(),
  };
}

kipBandi();
console.log('=== D6 — ITIBAR (eski XP): odul hangi KANALDAN gelsin (varyant olarak) ===');
console.log('');
console.log('Model: D-086 yururlukteki model (k1b + k2). economy.config.ts DOSYASI DEGISMEDI —');
console.log('kollar sim`in itibar kancasina takilir (tools/itibar-kollari.ts).');
console.log('');
console.log('MODEL SINIRI (rapora aynen gecer):');
console.log('  1) XP sim`de MODELLENMIYOR — egri sim durumundan TURETILIR (servis x oyuncu/garson');
console.log('     payi + gorev + pad + yukseltme). `perDishWashed` SIFIR sayilir (oyuncunun eliyle');
console.log('     bulasik yikamasi sim`de yok) → turetilen seviye gercegin bir ALT sinirdir.');
console.log('  2) Seviye atladigi an odul yururluge girer; gercekte oyuncu modali kapatana kadar');
console.log('     bekler → etkiler bir UST sinirdir. Ust sinir bile kucukse kol guvenle elenir.');
console.log('  3) Hedef kademeleri bu turda ₺ ODEMEZ (yalniz zaman kaydi, ortusme kolonu icin).');
console.log('');

kolAyarla(VARSAYILAN);

/* ── TABAN ─────────────────────────────────────────────────────────────────────────── */
kolaGec(null, 0);
const taban = olc();

console.log('--- TABAN: dort profilde 20 dk`yi asan alimlar (Itibar odulu YOK) ---');
for (const [ad, eff] of [['Idealize', 1.0], ['Yogun', 0.8], ['Normal', 0.55], ['Rahat', 0.35]] as [string, number][]) {
  const bs = profilBosluklari(eff);
  const asan = bs.filter((b) => b.gap > SINIR);
  const enUzun = bs.reduce((a, b) => (b.gap > a.gap ? b : a), { t: 0, gap: 0, label: '—' });
  console.log(`  ${ad.padEnd(8)} asan ${String(asan.length).padStart(2)} · en uzun ${dk(enUzun.gap).padStart(8)} -> ${enUzun.label}`);
}
console.log('');
console.log(`  TABAN olcutleri: ilk alim ${sn(taban.o.ilkAlim)} · acilis enUzun ${dk(taban.o.acilisEnUzun)}` +
  ` · otomasyon ${dk(taban.o.otomasyon ?? NaN)} · SERIT ${sa(taban.o.serit)} · sapma %${(taban.sapma * 100).toFixed(0)}`);
console.log(`  TABAN en uzun bekleme (Normal): ${dk(taban.o.normalEnUzun)} -> ${taban.o.normalEnUzunEtiket}`);
console.log(`  TABAN hukum (Idealize): asan ${taban.o.idealAsan} · en uzun ${dk(taban.o.idealEnUzun)} -> ${taban.o.idealEnUzunEtiket}`);
console.log('');

/* ── TANI: geliri KIM kelepceliyor (r1/r3'un atil kalmasinin sebebi) ───────────────── */
console.log('--- DARBOGAZ dagilimi: gelirin kelepcesi zamanin yuzde kacinda kimde ---');
for (const [ad, eff] of [['Idealize', 1.0], ['Normal', 0.55]] as [string, number][]) {
  const pay = darbogazDagilimi(eff);
  const toplam = Object.values(pay).reduce((a, b) => a + b, 0);
  const satir = Object.entries(pay).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} %${((100 * v) / toplam).toFixed(1)}`).join(' · ');
  console.log(`  ${ad.padEnd(8)} ${satir}`);
}
console.log('');

/* ── KOL TARAMASI ──────────────────────────────────────────────────────────────────── */
interface Satir { kol: ItibarKolTanim; doz: number; s: Sonuc }
const satirlar: Satir[] = [];

for (const ad of Object.keys(ITIBAR_KOLLARI)) {
  const kol = ITIBAR_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  // Kisa kosuda izgara seyreltilir AMA SON DOZ hep kalir: en uc doz duserse kolun etkisiz mi
  // yoksa atil mi oldugu ayirt edilemez (D1'de m1 kolu tam bu yuzden hic olculmemisti).
  const dozlar = KISA ? [...new Set([...kol.dozlar.filter((_, i) => i % 2 === 0), son])] : kol.dozlar;
  for (const doz of dozlar) {
    kolaGec(kol, doz);
    satirlar.push({ kol, doz, s: olc() });
  }
}

/* ── §Bulgular TABLOSU ─────────────────────────────────────────────────────────────── */
const bas = 'kol | doz    | SEVIYE | atlama | PENCERE | ORTUSME | ihlal(N/I) | enUzun  | SERIT   | d.SERIT | ilk alim | acilis | otom.';
console.log('--- KOL x DOZ: odulun KANALI, YOGUNLUGU ve takasi ---');
console.log('  acilis olcutleri (D-079): ilk alim < 90 sn · acilis enUzun <= 2 dk · otomasyon < 15 dk');
console.log('  ihlal(N/I): Normal (gozlem) / Idealize (HUKUM, D-087) profilinde 20 dk`yi asan alim');
console.log('  PENCERE   : 20 dk`yi asan bekleme araliginin ICINE dusen seviye atlamasi sayisi');
console.log('  ORTUSME   : bunlarin kacinda AYNI pencerede bir hedef kademesi de aciliyor');
console.log('  d.SERIT   : zincirin TABANA gore kisalmasi — D1`in eleme olcutu (Kat 1 icerigi)');
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));

const satirYaz = (ad: string, doz: string, s: Sonuc) => {
  const dSerit = s.o.serit != null && taban.o.serit != null ? (s.o.serit - taban.o.serit) / taban.o.serit : NaN;
  console.log(
    ad.padEnd(3) + ' | ' + doz.padStart(6) +
    ' | ' + String(s.seviye).padStart(6) +
    ' | ' + String(s.atlama).padStart(6) +
    ' | ' + String(s.pencere).padStart(7) +
    ' | ' + String(s.ortusme).padStart(7) +
    ' | ' + `${s.o.normalAsan}/${s.o.idealAsan}`.padStart(10) +
    ' | ' + dk(s.o.normalEnUzun).padStart(7) +
    ' | ' + sa(s.o.serit).padStart(7) +
    ' | ' + (Number.isFinite(dSerit) ? `%${(dSerit * 100).toFixed(1)}` : '—').padStart(7) +
    ' | ' + sn(s.o.ilkAlim).padStart(8) +
    ' | ' + dk(s.o.acilisEnUzun).padStart(6) +
    ' | ' + dk(s.o.otomasyon ?? NaN).padStart(6),
  );
};

satirYaz('tab', '—', taban);
let oncekiKol = '';
for (const r of satirlar) {
  if (r.kol.ad !== oncekiKol) {
    console.log(`    ${r.kol.ad}: ${r.kol.ne}`);
    oncekiKol = r.kol.ad;
  }
  satirYaz(r.kol.ad, r.kol.yaz(r.doz), r.s);
}
console.log('');

/* ── ATLAMALARIN ZAMAN DAGILIMI (r4 = etkisiz kol; taban egrisinin kendisi) ────────── */
console.log('--- Seviye atlamalarinin ZAMAN dagilimi (Normal profil) ---');
console.log('  r4 = yururlukteki egri (levelGrowth 1,5), ekonomik etki yok → tabanin kendi cizelgesi.');
for (const ad of ['r4', 'r5'] as const) {
  const kol = ITIBAR_KOLLARI[ad];
  for (const doz of ad === 'r4' ? [0] : kol.dozlar) {
    kolaGec(kol, doz);
    const s = olc();
    const at = sonKosuAtlamalari();
    console.log(`  ${ad} ${kol.yaz(doz).padStart(6)}: L${s.seviye} · ${at.length} atlama · XP ${Math.round(s.xp).toLocaleString('tr-TR')}` +
      ` · pencerede ${s.pencere} · ortusen ${s.ortusme}`);
    console.log(`      ${at.map((a) => `L${a.seviye}@${(a.t / 3600).toFixed(2)}sa`).join(' · ') || '(atlama yok)'}`);
  }
}
console.log('');

/* ── HEDEF KADEMELERININ ZAMANI (ortusme kolonunun ikinci yarisi) ─────────────────── */
kolaGec(ITIBAR_KOLLARI.r4, 0);
olc();
const hedefZaman = sonKosuHedefAcilislari();
console.log('--- Hedef kademelerinin acilis zamani (Normal profil, ayni kosu) ---');
console.log(`  ${hedefZaman.length} kademe · ${hedefZaman.map((t) => `${(t / 3600).toFixed(2)}sa`).join(' · ') || '(yok)'}`);
console.log('');

/* ── BIRLIKTE: yururlukteki hedef carpani ACIKKEN aday dozlarin bedeli ────────────────
 * Kol taramasi hedef carpanini KAPALI tutuyor (olculen sey Itibar'in KENDI kanali). Ama
 * D-090'in carpani zaten YURURLUKTE; karar o dunyada verilecek. Iki kolun ust uste binmesi
 * dogrusal olmak ZORUNDA DEGIL (ikisi de ayni akisi carpiyor) → varsayilmaz, olculur.
 */
function birlikteOlc(kol: ItibarKolTanim | null, doz: number): Sonuc {
  kayitSifirla();
  itibarAyarla(kol ? kol.fabrika(doz) : null);
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
  return olc();
}

console.log('--- BIRLIKTE: yururlukteki hedef carpani (hUYGF) ACIK ---');
console.log('  Tabanin kendisi de degisir: hedef carpani zaten yururlukte. d.SERIT bu satirlarda');
console.log('  ITIBARSIZ-AMA-CARPANLI tabana gore okunur (asagidaki ilk satir).');
const birlikteTaban = birlikteOlc(null, 0);
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));
{
  const yazB = (ad: string, doz: string, s: Sonuc) => {
    const d = (s.o.serit! - birlikteTaban.o.serit!) / birlikteTaban.o.serit!;
    console.log(
      ad.padEnd(3) + ' | ' + doz.padStart(6) +
      ' | ' + String(s.seviye).padStart(6) + ' | ' + String(s.atlama).padStart(6) +
      ' | ' + String(s.pencere).padStart(7) + ' | ' + String(s.ortusme).padStart(7) +
      ' | ' + `${s.o.normalAsan}/${s.o.idealAsan}`.padStart(10) +
      ' | ' + dk(s.o.normalEnUzun).padStart(7) + ' | ' + sa(s.o.serit).padStart(7) +
      ' | ' + `%${(d * 100).toFixed(1)}`.padStart(7) +
      ' | ' + sn(s.o.ilkAlim).padStart(8) + ' | ' + dk(s.o.acilisEnUzun).padStart(6) +
      ' | ' + dk(s.o.otomasyon ?? NaN).padStart(6),
    );
  };
  yazB('hUY', 'carpan', birlikteTaban);
  for (const ad of ['r2', 'r6'] as const) {
    for (const doz of KISA ? [0.005, 0.02] : [0.005, 0.01, 0.02, 0.05]) {
      yazB(ad, ITIBAR_KOLLARI[ad].yaz(doz), birlikteOlc(ITIBAR_KOLLARI[ad], doz));
    }
  }
}
// Carpan kancasi kapatilir; kalan damgalar TABAN dunyasinda okunur.
kolaGec(null, 0);
console.log('');

/* ── DAMGALAR ──────────────────────────────────────────────────────────────────────── */
damga('seviyeHesap kopyasi sapmadi', egriDenetimi() === null, egriDenetimi() ?? '');

for (const ad of Object.keys(ITIBAR_KOLLARI)) {
  const kol = ITIBAR_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  const uc = satirlar.filter((r) => r.kol.ad === ad).pop()!;
  if (kol.atilBeklenir) {
    // t0 · r4 · r5: BULGUNUN KENDISI atil kalmalaridir. r4 ayrica ARACIN DENETIMIDIR — kanca
    // acikken tabanin birebir kopyasi cikmiyorsa tablonun tamami suphelidir.
    damga(`${kol.ad} ATIL kaldi (beklenen)`, uc.s.iz === taban.iz, `iz ${uc.s.iz} != taban ${taban.iz}`);
    continue;
  }
  varyantDamgasi(`${kol.ad} (en uc doz)`, taban.iz, uc.s.iz);
}

// Kol hic seviye atlatmadiysa satir olcum degil, tabanin kopyasidir (C4 tuzagi ②'nin karsiligi).
for (const ad of Object.keys(ITIBAR_KOLLARI)) {
  if (ad === 't0') continue; // kanca kapali: atlama kaydi da yok, dogru davranis budur
  const uc = satirlar.filter((r) => r.kol.ad === ad).pop()!;
  damga(`${ad} seviye atladi`, uc.s.atlama > 0, 'itibar kancasi hic tetiklenmedi (XP birikmiyor)');
}

kolaGec(null, 0);
const kontrol = olc();
damga('taban geri donusu', kontrol.iz === taban.iz, `iz ${kontrol.iz} != ${taban.iz} — itibarAyarla(null) eksik`);
damga('taban atlama yok', kontrol.atlama === 0, `${kontrol.atlama} atlama — kanca kapaliyken kayit dusmus`);
damga('taban serit geri dondu', Math.abs((kontrol.o.serit ?? 0) - (taban.o.serit ?? 0)) < 1e-6,
  `${sa(kontrol.o.serit)} != ${sa(taban.o.serit)} — kol sizmasi`);
damga('taban ihlal 6 (Normal)', taban.o.normalAsan === 6, `${taban.o.normalAsan} (D-086 Bulgu 7'de 6 idi)`);
damga('taban hukum 1 (Idealize)', taban.o.idealAsan <= 1, `${taban.o.idealAsan} (D-087'de 1 idi)`);
damgaOzeti();
