/**
 * olcum-elmas.ts — D7a: elmasın ARZI ile HARCAMASI (Usta katmanı) birlikte ölçülür.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-elmas.ts > docs/olcum-elmas.txt
 *        (OLCUM verilmezse KISA koşar — ızgara seyrekleşir, rapora GİRMEZ.)
 *
 * SORU: Elmas bugün KAZANILIYOR (hedeflerden 250 💎) ama harcanamıyor — sink SIFIR. D3'ün `h0`
 * kolu "💎 tempoya girmez" sonucunu tam bu yüzden vermişti ve D7 o ölçümü bayatlatıyor. Plan §6
 * "hiç reklam izlemeyen ~2,5 GÜNDE BİR Usta alır" diyor; oysa 250 💎, planın 15 💎'lık fiyatında
 * 16 Usta demek. Kuyruk daha doğmadan çöküyor mu — ve Usta'nın "üstüne ×2"si zinciri ne kadar yiyor?
 *
 * TABAN NEDEN BUGÜNKÜ DÜNYA: D6 kendi kanalını yalıtmak için hedef çarpanını kapatmıştı. D7'de
 * soru bir İÇERİK KUYRUĞU sorusudur ve kuyruk ₺ merdiveninin BİTTİĞİ yerde başlar — yani ölçüm
 * dünyası, D-090'ın kalıcı çarpanı ile D-092'nin taşıma ödülünün AÇIK olduğu bugünkü dünyadır.
 * Kapalı bir dünyada ölçmek, tavana varış zamanını olduğundan geç gösterirdi.
 *
 * NE ÖLÇÜYOR — beş kolon birden okunmadan karar verilemez:
 *   1) ALIM     12 sa penceresinde kaç Usta alındı ve İLKİ ne zaman. Kuyruğun var olup olmadığı
 *               buradan okunur: ilk Usta 11. saatteyse "meta katman" ilk oturumda yok demektir.
 *   2) KUYRUK   Koşu sonunda UYGUN ama alınamamış hedef sayısı. 0 ise kuyruk ÇÖKMÜŞTÜR — oyuncu
 *               açılan her Usta'yı anında alıyor, bekleyecek bir şey kalmıyor.
 *   3) İHLAL    20 dk'yı aşan alım — hüküm İDEALİZE profilde (D-087), Normal gözlem bandı.
 *   4) ŞERİT    Zincirin uzunluğu: Usta Kat 1 içeriğinden ne kadar GÖTÜRÜYOR (D1'in eleme ölçütü,
 *               eşik %7 — D-092'nin %15,5'i emsal değil, sayısı yazılı istisnaydı).
 *   5) AÇILIŞ   D-079'un üç ölçütü. Usta tavan-üstü bir basamak olduğu için açılışa dokunmaması
 *               BEKLENİR; beklenti ölçülmeden doğrulanmış sayılmaz (D-090 Bulgu 10).
 *
 * DAMGALAR: (a) `e0` ve `eKAPI` tabanın BİREBİR kopyası olmalı — `eKAPI` aynı zamanda kancanın
 * koşuyu kımıldatmadığının kanıtıdır; (b) etkili kol taban izinden AYRILMALI; (c) her kolda en az
 * bir Usta ALINMIŞ olmalı — alınmadıysa satır ölçüm değil (D1'de `iade:0.25` tam böyle kaçmıştı);
 * (d) 💎 KORUNUMU: kazanılan − harcanan = kalan.
 */
import {
  olcutler, profilBosluklari, onbellekTemizle, milestoneTazele, m1Ayarla,
  modelDebisi, GERCEK, kolAyarla, VARSAYILAN, hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla,
  ustaAyarla, darbogazDagilimi,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { HEDEF_KOLLARI } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla } from './itibar-kollari.ts';
import {
  USTA_KOLLARI, PLAN, HEDEF_ELMAS_TOPLAM, kayitSifirla as ustaKayitSifirla,
  sonKosuAlimlari, sonKosuElmasi, sonKosuKuyrugu, korunumSapmasi,
  type UstaKolTanim,
} from './usta-kollari.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const SINIR = 20 * 60;
const dk = (x: number) => (Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)} sn` : '—');

/**
 * Kol uygulanmadan önce dünya TABANA döner; yoksa kollar birbirinin üstüne biner.
 * TABAN = BUGÜNKÜ DÜNYA: hedef çarpanı (D-090 `hUYGF`) ve taşıma ödülü (D-092 `rUYG`) AÇIK.
 * Hedeflerin ₺ akışı KAPALI — D-090'da ₺ kolu tamamen kalktı, bugün ödenen tek şey çarpandır.
 */
function kolaGec(kol: UstaKolTanim | null, doz: number): void {
  itibarKayitSifirla();
  ustaKayitSifirla();
  ustaAyarla(kol ? kol.fabrika(doz) : null);
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  itibarAyarla(ITIBAR_KOLLARI.rUYG.fabrika(1));
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
  /** 12 sa penceresinde alınan Usta sayısı ve ilkinin zamanı (sn). */
  alim: number;
  ilkUsta: number;
  /** Koşu sonunda UYGUN ama alınamamış Usta hedefi. */
  kuyruk: number;
  /** 💎 defteri (Normal profil koşusu). */
  kazanilan: number;
  harcanan: number;
  kalan: number;
  korunum: number;
}

function olc(): Sonuc {
  const o = olcutler();
  const sapmalar = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  // `olcutler()` son olarak NORMAL profili koşar → kayıt onundur.
  const alimlar = sonKosuAlimlari();
  const e = sonKosuElmasi();
  return {
    o,
    iz: iz(o.bosluklarNormal),
    sapma: sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length,
    alim: alimlar.length,
    ilkUsta: alimlar.length ? alimlar[0].t : NaN,
    kuyruk: sonKosuKuyrugu(),
    kazanilan: e.kazanilan,
    harcanan: e.harcanan,
    kalan: e.kalan,
    korunum: korunumSapmasi(),
  };
}

kipBandi();
console.log('=== D7a — ELMAS: arz (hedef + gunluk gorev) ve harcama (USTA katmani) birlikte ===');
console.log('');
console.log('Model: D-086 yururlukteki model (k1b + k2). economy.config.ts DOSYASI DEGISMEDI —');
console.log('kollar sim`in usta kancasina takilir (tools/usta-kollari.ts).');
console.log('');
console.log('TABAN = BUGUNKU DUNYA: hedef carpani (D-090 hUYGF) + tasima odulu (D-092 rUYG) ACIK.');
console.log('Usta bir ICERIK KUYRUGUDUR ve kuyruk ₺ merdiveninin BITTIGI yerde baslar; kapali bir');
console.log('dunyada olcmek tavana varis zamanini oldugundan GEC gosterirdi.');
console.log('');
console.log('MODEL SINIRI (rapora aynen gecer):');
console.log('  1) 12 sa`lik pencere YARIM GUN — gunluk gorev arzi (e5) bu tabloda tanim geregi');
console.log('     kucuk kalir. Gun olcegindeki hesap §5 DEFTER bolumundedir.');
console.log('  2) Odullu reklam ve IAP arzi YOK sayilir → arz bir ALT sinirdir.');
console.log('  3) Usta hedefleri: servis (1) + masalar (20) + PERSONEL merdivenleri (5: garson ·');
console.log('     bulasikci · 3 karakter stati) = 26. Personel kanali TUR KARTINDA YOKTU, olcum');
console.log('     sirasinda eklendi (e6): ilk kisa kosu kelepcenin %91,5 tasimada oldugunu gosterdi.');
console.log('  4) Oyuncu 💎`i biriktigi ANDA harcar (personel → servis → masa) → etki UST sinir.');
console.log(`  5) Hedeflerin bugunku 💎 toplami: ${HEDEF_ELMAS_TOPLAM} 💎 (economy.config.ts`);
console.log('     goals.diamondByTier`den turer, elle yazilmadi).');
console.log('');

kolAyarla(VARSAYILAN);

/* ── TABAN ─────────────────────────────────────────────────────────────────────────── */
kolaGec(null, 0);
const taban = olc();

console.log('--- TABAN: dort profilde 20 dk`yi asan alimlar (Usta katmani YOK) ---');
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

/* ── TANI: geliri KIM kelepceliyor ─────────────────────────────────────────────────── */
console.log('--- DARBOGAZ dagilimi: gelirin kelepcesi zamanin yuzde kacinda kimde ---');
console.log('  D6`da bu dagilim planin talep kolunu elemisti; Usta`nin arz kanali da ayni tabloda okunur.');
for (const [ad, eff] of [['Idealize', 1.0], ['Normal', 0.55]] as [string, number][]) {
  const pay = darbogazDagilimi(eff);
  const toplam = Object.values(pay).reduce((a, b) => a + b, 0);
  const satir = Object.entries(pay).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} %${((100 * v) / toplam).toFixed(1)}`).join(' · ');
  console.log(`  ${ad.padEnd(8)} ${satir}`);
}
console.log('');

/* ── KOL TARAMASI ──────────────────────────────────────────────────────────────────── */
interface Satir { kol: UstaKolTanim; doz: number; s: Sonuc }
const satirlar: Satir[] = [];

for (const ad of Object.keys(USTA_KOLLARI)) {
  const kol = USTA_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  // Kisa kosuda izgara seyreltilir AMA SON DOZ hep kalir: en uc doz duserse kolun etkisiz mi
  // yoksa atil mi oldugu ayirt edilemez (D1`de m1 kolu tam bu yuzden hic olculmemisti).
  const dozlar = KISA ? [...new Set([...kol.dozlar.filter((_, i) => i % 2 === 0), son])] : kol.dozlar;
  for (const doz of dozlar) {
    kolaGec(kol, doz);
    satirlar.push({ kol, doz, s: olc() });
  }
}

/* ── §Bulgular TABLOSU ─────────────────────────────────────────────────────────────── */
const bas = 'kol   | doz              | ALIM | ilk Usta | KUYRUK | 💎 kalan | ihlal(N/I) | enUzun  | SERIT   | d.SERIT | ilk alim | acilis | otom.';
console.log('--- KOL x DOZ: Usta katmaninin kuyrugu ve takasi ---');
console.log('  acilis olcutleri (D-079): ilk alim < 90 sn · acilis enUzun <= 2 dk · otomasyon < 15 dk');
console.log('  ihlal(N/I): Normal (gozlem) / Idealize (HUKUM, D-087) profilinde 20 dk`yi asan alim');
console.log('  ALIM      : 12 sa`de alinan Usta sayisi · ilk Usta: ilkinin zamani');
console.log('  KUYRUK    : kosu sonunda UYGUN ama alinamamis Usta hedefi (0 = kuyruk COKTU)');
console.log('  d.SERIT   : zincirin TABANA gore kisalmasi — D1`in eleme olcutu, esik %7');
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));

const satirYaz = (ad: string, doz: string, s: Sonuc) => {
  const dSerit = s.o.serit != null && taban.o.serit != null ? (s.o.serit - taban.o.serit) / taban.o.serit : NaN;
  console.log(
    ad.padEnd(5) + ' | ' + doz.padStart(16) +
    ' | ' + String(s.alim).padStart(4) +
    ' | ' + (Number.isFinite(s.ilkUsta) ? sa(s.ilkUsta) : '—').padStart(8) +
    ' | ' + String(s.kuyruk).padStart(6) +
    ' | ' + s.kalan.toFixed(1).padStart(8) +
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

/* ── USTA ALIM HATTI: kuyruk zamanda nasil dagiliyor ──────────────────────────────── */
console.log('--- USTA alim hatti (Normal profil) — plan dozu ×2 · 15 💎 ---');
kolaGec(USTA_KOLLARI.e1, PLAN.etki);
const hatSonuc = olc();
const hat = sonKosuAlimlari();
console.log(`  ${hat.length} alim · ilk ${Number.isFinite(hatSonuc.ilkUsta) ? sa(hatSonuc.ilkUsta) : '—'}` +
  ` · kuyrukta kalan ${hatSonuc.kuyruk} · 💎 kazanilan ${hatSonuc.kazanilan.toFixed(0)}` +
  ` · harcanan ${hatSonuc.harcanan.toFixed(0)} · kalan ${hatSonuc.kalan.toFixed(1)}`);
console.log(`      ${hat.map((a) => `${a.hedef}@${(a.t / 3600).toFixed(2)}sa`).join(' · ') || '(alim yok)'}`);
console.log('');

/* ── §5 DEFTER — GUN OLCEGI (tick ile olculemez, MODEL SINIRI ①) ──────────────────────
 * Tick tablosu ilk 12 saati okuyor. Planin vaadi ("~2,5 gunde bir Usta") GUN olceginde ve
 * o olcek sim`in penceresinin disinda kaliyor. Bu bolum analitik: kuyrugun 12 saatten SONRA
 * ne kadar dayandigini hesaplar. D6`nin `g1` kolunun ayni deseni — olculemeyen kol defterde
 * durur, tabloda sahte bir sayi olarak DURMAZ.
 */
console.log('--- §5 DEFTER (analitik, gun olcegi) — kuyruk 12 saatten sonra ne kadar dayaniyor ---');
console.log('  Hedef sayisi: 26 (servis 1 + masa 20 + personel 5) — planin ~26`si ile ortusuyor.');
console.log('  Hedeflerin 250 💎`i tek seferliktir: tick tablosu onun ne zaman dustugunu olcuyor.');
console.log('  Asagidaki gun sayilari, hedef 💎`i BITTIKTEN sonra kalan kuyruk icindir.');
console.log('');
const SENARYO: [string, number][] = [
  ['reklamsiz (gunluk gorev 3/gun)', PLAN.gunluk],
  ['Reklamlari Kaldir (+10/gun)', PLAN.gunluk + 10],
  ['odullu izleyen (~3 Usta/gun)', PLAN.gunluk + 45],
];
const HEDEF_SAYISI: [string, number][] = [['Kat 1 (26)', 26], ['yalniz masa (20)', 20]];
console.log('fiyat | hedef      | hedef 💎 kac Usta alir | kalan kuyruk | ' +
  SENARYO.map(([ad]) => ad.padEnd(30)).join('| '));
console.log('-'.repeat(150));
for (const fiyat of [15, 25, 40, 60]) {
  for (const [hAd, hSayi] of HEDEF_SAYISI) {
    const pesin = Math.min(hSayi, Math.floor(HEDEF_ELMAS_TOPLAM / fiyat));
    const kalan = hSayi - pesin;
    const gunler = SENARYO.map(([, arz]) => {
      if (kalan <= 0) return 'kuyruk YOK (arz fazla)'.padEnd(30);
      const gun = (kalan * fiyat) / arz;
      return `${gun.toFixed(1)} gun · ${(gun / kalan).toFixed(2)} gun/Usta`.padEnd(30);
    });
    console.log(
      `${String(fiyat).padStart(5)} | ${hAd.padEnd(10)} | ${String(pesin).padStart(22)} | ` +
      `${String(kalan).padStart(12)} | ${gunler.join('| ')}`);
  }
}
console.log('');
console.log('  Planin vaadi: "hic reklam izlemeyen ~2,5 gunde bir Usta alir" → gun/Usta ~2,5 olmali.');
console.log('');

/* ── DAMGALAR ──────────────────────────────────────────────────────────────────────── */
for (const ad of Object.keys(USTA_KOLLARI)) {
  const kol = USTA_KOLLARI[ad];
  const uc = satirlar.filter((r) => r.kol.ad === ad).pop()!;
  if (kol.atilBeklenir) {
    // e0 · eKAPI: BULGUNUN KENDISI atil kalmalaridir. eKAPI ayrica ARACIN DENETIMIDIR — kanca
    // acikken tabanin birebir kopyasi cikmiyorsa tablonun tamami suphelidir.
    damga(`${kol.ad} ATIL kaldi (beklenen)`, uc.s.iz === taban.iz, `iz ${uc.s.iz} != taban ${taban.iz}`);
    continue;
  }
  varyantDamgasi(`${kol.ad} (en uc doz)`, taban.iz, uc.s.iz);
}

// Kol hic Usta aldirmadiysa satir olcum degil, tabanin kopyasidir (C4 tuzagi ②'nin karsiligi).
for (const ad of Object.keys(USTA_KOLLARI)) {
  const kol = USTA_KOLLARI[ad];
  if (kol.alimsiz) continue;
  const uc = satirlar.filter((r) => r.kol.ad === ad).pop()!;
  damga(`${ad} Usta alindi`, uc.s.alim > 0, 'usta kancasi hic tetiklenmedi (💎 birikmiyor ya da tavan gelmiyor)');
}

// 💎 KORUNUMU: kapali defter. Sapma varsa olcum degil KOD hatasidir.
for (const r of satirlar) {
  if (r.kol.alimsiz) continue;
  damga(`💎 korunumu (${r.kol.ad} ${r.kol.yaz(r.doz)})`, Math.abs(r.s.korunum) < 1e-6,
    `${r.s.korunum} birim sapma`);
}

kolaGec(null, 0);
const kontrol = olc();
damga('taban geri donusu', kontrol.iz === taban.iz, `iz ${kontrol.iz} != ${taban.iz} — ustaAyarla(null) eksik`);
damga('taban alim yok', kontrol.alim === 0, `${kontrol.alim} alim — kanca kapaliyken kayit dusmus`);
damga('taban serit geri dondu', Math.abs((kontrol.o.serit ?? 0) - (taban.o.serit ?? 0)) < 1e-6,
  `${sa(kontrol.o.serit)} != ${sa(taban.o.serit)} — kol sizmasi`);
damgaOzeti();
