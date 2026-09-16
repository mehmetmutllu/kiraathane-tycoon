/**
 * olcum-sira-h2.ts — H2: masa yükseltmelerinin SIRASI. Bugün sıra serbest; bu araç
 * serbestliğin iki ayrı bedelini ve sırayı zorunlu kılmanın iki ayrı bedelini ölçer.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-sira-h2.ts > docs/olcum-sira-h2.txt
 *        (OLCUM verilmezse KISA koşar — kol sayısı azalır, rapora GİRMEZ.)
 *
 * NE ÖLÇÜLÜYOR — dört kolon, dördü birden okunmadan karar verilemez:
 *
 *  1) DİKKAT     Ekranda aynı anda kaç masa noktası canlı — ZAMAN ağırlıklı. `olcum-tek-odak.ts`
 *                bunu ADIM başına sayıyor (ort 7,82 · en çok 16) ama bir adım 3 sn de sürer
 *                40 dk da; oyuncunun gerçekten baktığı sayı saniyeyle ağırlıklı olandır.
 *                Kamera bir salonu çerçevelediği için "en yoğun TEK ALAN" ayrıca sayılır.
 *
 *  2) TUZAK      Serbest sırada oyuncunun kendine verebileceği ceza: en iyi politika (T/D/P/R
 *                içinde) ile en kötüsü arasındaki tempo farkı. Fark küçükse serbestlik zararsız
 *                ve zorlama boşuna özgürlük alır; büyükse serbest sıra bir TUZAKTIR.
 *
 *  3) KAPININ BEDELİ  Sırayı zorunlu kılmak tempodan ne götürüyor (A/B ile T'nin farkı) ve
 *                oyuncunun parası yettiği hâlde kapı yüzünden bekleyen saniye kaç ("ölü para").
 *
 *  4) OKUNABİLİRLİK  Aynı anda kaç masa YARIM (0 < L < tavan) ve salondaki seviye YAYILIMI
 *                (en yüksek − en düşük). Yayılım 0 ise salon tekdüze görünür, 4 ise merdiven
 *                gözle okunur — `feedback_upgrade_legibility` bu sayıyı istiyor.
 *
 * DAMGALAR:
 *   · kanca saydam   — T kolunun parmak izi, kanca KAPALI tabanınkiyle aynı olmak zorunda.
 *                      (Aynı değilse kanca ölçtüğü şeyi değiştiriyordur → koşu ölçüm değildir.)
 *   · varyant etkili — D/P/R/A/B'nin izi T'den FARKLI olmak zorunda (C4 tuzağı ②: sessizce
 *                      etkisiz kalan kol, kontrolün kopyasını "fark yok" diye rapora sokar).
 *   · kapı tutarlı   — A'da canlı nokta hiçbir tick'te 1'i aşamaz.
 *   · kuşak tutarlı  — B'de canlı nokta kümesi TEK seviyeden oluşmak zorunda (0 sn sapma).
 *   · ölçüt kör değil— aynı sayacın TABAN'da sıfırdan BÜYÜK çıkması şart; yoksa B'nin temiz
 *                      çıkması bir şey kanıtlamaz, sayaç hiçbir şey ölçmüyordur.
 */
import {
  kosuGozle, masaSirasiAyarla, kolAyarla, VARSAYILAN,
  onbellekTemizle, milestoneTazele,
  type TikGozlem, type SiraDurum,
} from './simulate.ts';
import { SIRA_KOLLARI, fabrika, kolBul, type SiraKol } from './sira-kollari.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KISA, kipBandi, damga, damgaOzeti, izOlustur, ort } from './olcum-lib.ts';

/** Ölçümün okunduğu profil: Normal (0,55) — oyuncunun gerçekten yaşadığı tempo.
 *  İdealize (1,0) ikinci bant olarak basılır; hüküm Normal'de verilir çünkü soru
 *  "oyuncu ne görüyor / ne kaybediyor", "tavan nerede" değil. */
const PROFILLER: readonly { ad: string; eff: number }[] = [
  { ad: 'Normal', eff: 0.55 },
  { ad: 'İdealize', eff: 1.0 },
];

const SAAT = 3600;
const ORNEK_T = [1 * SAAT, 3 * SAAT, 6 * SAAT];

interface Olcum {
  /** Zaman ağırlıklı ortalama canlı nokta sayısı. */
  isaretOrt: number;
  isaretMax: number;
  /** Canlı noktanın 1'i aştığı sürenin payı (0..1). */
  cokIsaretPay: number;
  /** En yoğun TEK ALAN (kamera vekili): zaman ağırlıklı ortalama + tepe. */
  alanOrt: number;
  alanMax: number;
  /** Zaman ağırlıklı ortalama YARIM masa sayısı (0 < L < tavan). */
  yarimOrt: number;
  /** Zaman ağırlıklı ortalama seviye YAYILIMI (açık masalarda max − min). */
  yayilimOrt: number;
  yayilimMax: number;
  /** Parası bir masaya yetiyor ama SIRA kapısı kapalı → beklenen saniye. */
  oluParaSn: number;
  /** Canlı nokta kümesinin BİRDEN ÇOK seviyeye yayıldığı saniye. Kuşak kapısında 0 olmalı —
   *  "hepsi L'ye varmadan hiçbiri L+1'e çıkamaz" kuralının makine karşılığı budur.
   *  (Salon geneli yayılımı DEĞİL: tavana varmış masa kümeden çıktığı için oradaki fark
   *  kuralın ihlali değil, kapının geçmişe dokunamamasıdır.) */
  cokSeviyeSn: number;
  /** Milestone süreleri (sn). */
  serit: number | undefined;
  lt10k: number | undefined;
  masaL1: number | undefined;
  /** 20 masanın hepsi tavanda — ilk an (sn). Ulaşılmazsa undefined. */
  tumTavan: number | undefined;
  /** Örnek anlarda lifetime ₺ ve toplam koltuk. */
  lifetimeAt: number[];
  koltukAt: number[];
  bahsisAt: number[];
  /** İki ardışık masa yükseltmesi arasındaki EN UZUN boşluk (sn) + kaç tanesi 20 dk'yı aştı. */
  masaEnUzunBosluk: number;
  masaAsan: number;
  /** Toplam alınan masa yükseltmesi. */
  masaAlim: number;
  /** Koşunun bittiği an (sn). */
  sonT: number;
  iz: string;
}

/** Gözlemden SiraDurum kur — kol kendi işaret kuralını bununla sorgular. */
function durumdan(g: TikGozlem): SiraDurum {
  return {
    seviyeler: g.seviyeler,
    alanlar: g.alanlar,
    kapiAcik: g.kapiAcik,
    tavan: g.tavan,
    maliyet: (i) => g.maliyetler[i] ?? Infinity,
  };
}

function olc(kol: SiraKol | null, eff: number): Olcum {
  masaSirasiAyarla(kol ? fabrika(kol) : null);
  onbellekTemizle();
  milestoneTazele();

  const iz = izOlustur();
  let sureIsaret = 0, sureAlan = 0, sureYarim = 0, sureYayilim = 0;
  let isaretMax = 0, alanMax = 0, yayilimMax = 0;
  let cokIsaretSn = 0, oluParaSn = 0, cokSeviyeSn = 0, sonT = 0;
  let tumTavan: number | undefined;
  let onceki: number[] = [];
  let masaAlim = 0, sonAlimT = 0, masaEnUzunBosluk = 0, masaAsan = 0;
  const lifetimeAt: number[] = ORNEK_T.map(() => NaN);
  const koltukAt: number[] = ORNEK_T.map(() => NaN);
  const bahsisAt: number[] = ORNEK_T.map(() => NaN);
  // Kanca kapalıyken bugünkü kural okunur (serbest kapı) — T kolununkiyle aynı fonksiyon.
  const isaretKurali = kol ? kol.isaretler : SIRA_KOLLARI[0].isaretler;

  const gozlem = (g: TikGozlem) => {
    sonT = g.t;
    const d = durumdan(g);
    const canli = isaretKurali(d);
    const n = canli.length;
    sureIsaret += n;
    if (n > isaretMax) isaretMax = n;
    if (n > 1) cokIsaretSn += 1;
    if (n > 1) {
      const lv0 = g.seviyeler[canli[0]];
      for (const i of canli) if (g.seviyeler[i] !== lv0) { cokSeviyeSn += 1; break; }
    }

    // Kamera vekili: en kalabalık TEK alan.
    const sayac = new Map<number, number>();
    for (const i of canli) sayac.set(g.alanlar[i], (sayac.get(g.alanlar[i]) ?? 0) + 1);
    let enAlan = 0;
    for (const v of sayac.values()) if (v > enAlan) enAlan = v;
    sureAlan += enAlan;
    if (enAlan > alanMax) alanMax = enAlan;

    // Okunabilirlik: yarım masa + seviye yayılımı (yalnız kapısı AÇIK masalar).
    let yarim = 0, en = Infinity, ust = -Infinity, acik = 0;
    for (let i = 0; i < g.seviyeler.length; i++) {
      if (!g.kapiAcik[i]) continue;
      acik += 1;
      const lv = g.seviyeler[i];
      if (lv > 0 && lv < g.tavan) yarim += 1;
      if (lv < en) en = lv;
      if (lv > ust) ust = lv;
    }
    const yayilim = acik > 0 ? ust - en : 0;
    sureYarim += yarim;
    sureYayilim += yayilim;
    if (yayilim > yayilimMax) yayilimMax = yayilim;

    // Ölü para: parası bir masaya yetiyor ama sıra kapısı o masayı kapatmış.
    if (g.serbestCost != null && g.wallet >= g.serbestCost && (g.hedefCost == null || g.wallet < g.hedefCost)) {
      oluParaSn += 1;
    }

    // Masa alımı oldu mu (seviye dizisi değişti mi)?
    if (onceki.length === g.seviyeler.length) {
      let degisti = false;
      for (let i = 0; i < onceki.length; i++) if (onceki[i] !== g.seviyeler[i]) { degisti = true; break; }
      if (degisti) {
        masaAlim += 1;
        const bosluk = g.t - sonAlimT;
        if (bosluk > masaEnUzunBosluk) masaEnUzunBosluk = bosluk;
        if (bosluk > 20 * 60) masaAsan += 1;
        sonAlimT = g.t;
        iz.ekle(g.t, g.seviyeler.reduce((a, b) => a + b, 0));
      }
    }
    onceki = [...g.seviyeler];

    // 20 masanın hepsi tavanda mı (şerit tam açıldıktan sonra)?
    if (tumTavan == null && g.seviyeler.length >= 20) {
      let hepsi = true;
      for (const lv of g.seviyeler) if (lv < g.tavan) { hepsi = false; break; }
      if (hepsi) tumTavan = g.t;
    }

    for (let k = 0; k < ORNEK_T.length; k++) {
      if (g.t === ORNEK_T[k]) { lifetimeAt[k] = g.lifetime; koltukAt[k] = g.koltuk; bahsisAt[k] = g.bahsisOrt; }
    }
  };

  const ms = kosuGozle(eff, gozlem, true); // tam pencere: son milestone'da kesme
  masaSirasiAyarla(null);
  const T = Math.max(1, sonT);
  return {
    isaretOrt: sureIsaret / T, isaretMax,
    cokIsaretPay: cokIsaretSn / T,
    alanOrt: sureAlan / T, alanMax,
    yarimOrt: sureYarim / T,
    yayilimOrt: sureYayilim / T, yayilimMax,
    oluParaSn, cokSeviyeSn,
    serit: ms.get('ŞERİT DOLDU (20. masa)'),
    lt10k: ms.get('lifetime 10.000 ₺'),
    masaL1: ms.get('Masa yükseltme L1 (bahşiş)'),
    tumTavan,
    lifetimeAt, koltukAt, bahsisAt,
    masaEnUzunBosluk, masaAsan, masaAlim,
    sonT,
    iz: iz.deger,
  };
}

/* ─────────────────────────── ÇIKTI ─────────────────────────── */

const line = (s = '') => console.log(s);
const sn = (x: number | undefined) =>
  x != null && Number.isFinite(x)
    ? x < 60 ? `${x.toFixed(0)} sn` : x < 3600 ? `${(x / 60).toFixed(1)} dk` : `${(x / 3600).toFixed(2)} sa`
    : '—';
const n2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const tl = (x: number) => (Number.isFinite(x) ? Math.round(x).toLocaleString('tr-TR') : '—');

kipBandi();
kolAyarla(VARSAYILAN); // D-086 yürürlükteki model: k1b + k2
const KOLLAR = KISA ? SIRA_KOLLARI.filter((k) => ['T', 'A', 'B'].includes(k.kod)) : SIRA_KOLLARI;
const KULLANILAN_PROFILLER = KISA ? PROFILLER.slice(0, 1) : PROFILLER;

line('=== H2 ÖLÇÜMÜ — MASA YÜKSELTME SIRASI ===');
line(`Model: D-086 (k1b çok duraklı tur + k2 masa kalem kalem) · kol ${KOLLAR.length} · profil ${KULLANILAN_PROFILLER.length}`);
line('Kapı = ekranda canlı nokta kümesi · Politika = oyuncunun o kümeden seçimi.');
line();

for (const k of KOLLAR) {
  line(`  ${k.kod}  ${k.ad}`);
  line(`       kapı    : ${k.kapi}`);
  line(`       oyuncu  : ${k.oyuncu}`);
}
line();

const sonuc = new Map<string, Map<string, Olcum>>();
for (const p of KULLANILAN_PROFILLER) {
  const m = new Map<string, Olcum>();
  m.set('TABAN', olc(null, p.eff));
  for (const k of KOLLAR) m.set(k.kod, olc(k, p.eff));
  sonuc.set(p.ad, m);
}

// --- DAMGALAR ---
for (const p of KULLANILAN_PROFILLER) {
  const m = sonuc.get(p.ad)!;
  const taban = m.get('TABAN')!;
  const t = m.get('T');
  if (t) damga(`kanca saydam (${p.ad})`, t.iz === taban.iz, `T izi ${t.iz} != taban izi ${taban.iz}`);
  for (const k of KOLLAR) {
    if (k.kod === 'T') continue;
    const o = m.get(k.kod)!;
    damga(`varyant etkili (${k.kod}·${p.ad})`, o.iz !== taban.iz, `iz tabanla aynı (${o.iz}) — kol dünyaya dokunmamış`);
  }
  const a = m.get('A');
  if (a) damga(`kapı tutarlı (A·${p.ad})`, a.isaretMax <= 1, `A'da en çok ${a.isaretMax} nokta canlı`);
  const b = m.get('B');
  if (b) damga(`kuşak tutarlı (B·${p.ad})`, b.cokSeviyeSn === 0, `B'de canlı küme ${b.cokSeviyeSn} sn boyunca birden çok seviyeye yayıldı`);
  // Karşı-denetim: TABAN bu kuralı İHLAL etmek ZORUNDA. Etmiyorsa ölçüt kör demektir
  // (sayaç hep 0 dönüyorsa B'nin "temiz" çıkması bir şey kanıtlamaz).
  if (b) damga(`ölçüt kör değil (${p.ad})`, taban.cokSeviyeSn > 0, 'taban da hiç çok-seviyeli olmadı — sayaç ölçmüyor');
}

for (const p of KULLANILAN_PROFILLER) {
  const m = sonuc.get(p.ad)!;
  line('-'.repeat(104));
  line(`PROFİL: ${p.ad} (verim ${p.eff})`);
  line('-'.repeat(104));
  line();
  line('--- 1) DİKKAT — ekranda aynı anda canlı masa noktası (ZAMAN ağırlıklı) ---');
  line('  kol     ort   tepe   >1 nokta süre payı   en yoğun TEK ALAN (ort/tepe)');
  for (const k of KOLLAR) {
    const o = m.get(k.kod)!;
    line(`  ${k.kod.padEnd(4)} ${n2(o.isaretOrt).padStart(7)} ${String(o.isaretMax).padStart(6)}   ${`%${(o.cokIsaretPay * 100).toFixed(1)}`.padStart(18)}   ${n2(o.alanOrt).padStart(6)} / ${o.alanMax}`);
  }
  line();
  line('--- 2) TEMPO — sıra hangi kilometre taşını ne zaman veriyor ---');
  line('  kol    masa L1    ŞERİT DOLDU   lifetime 10k   20 masa TAVANDA   masa alımı');
  for (const k of KOLLAR) {
    const o = m.get(k.kod)!;
    line(`  ${k.kod.padEnd(4)} ${sn(o.masaL1).padStart(10)} ${sn(o.serit).padStart(14)} ${sn(o.lt10k).padStart(14)} ${sn(o.tumTavan).padStart(17)} ${String(o.masaAlim).padStart(12)}`);
  }
  line();
  line('--- 3) BİRİKİM — örnek anlarda lifetime ₺ / toplam koltuk / koltuk-ağırlıklı ort. bahşiş ---');
  line('      (gelirin masa ayağı iki çarpandır: KOLTUK talebi, BAHŞİŞ ₺/servisi büyütür.');
  line('       Hangi kolun hangisini büyüttüğü ayrı basılmazsa "şu sıra kazanıyor" açıklamasız kalır.)');
  line('  kol              1 sa                     3 sa                     6 sa');
  for (const k of KOLLAR) {
    const o = m.get(k.kod)!;
    const c = (i: number) =>
      `${tl(o.lifetimeAt[i])} ₺ / ${Number.isFinite(o.koltukAt[i]) ? o.koltukAt[i] : '—'} klt / ${n2(o.bahsisAt[i])} ₺bhş`;
    line(`  ${k.kod.padEnd(4)} ${c(0).padStart(24)} ${c(1).padStart(24)} ${c(2).padStart(24)}`);
  }
  line();
  line('--- 4) KAPININ BEDELİ + OKUNABİLİRLİK ---');
  line('  kol   ölü para   masa bekleme (en uzun)  20dk aşan   yarım masa (ort)   seviye yayılımı (ort/tepe)   çok-seviyeli küme');
  for (const k of KOLLAR) {
    const o = m.get(k.kod)!;
    line(`  ${k.kod.padEnd(4)} ${sn(o.oluParaSn).padStart(9)} ${sn(o.masaEnUzunBosluk).padStart(22)} ${String(o.masaAsan).padStart(10)} ${n2(o.yarimOrt).padStart(18)}   ${n2(o.yayilimOrt).padStart(6)} / ${String(o.yayilimMax).padEnd(12)} ${sn(o.cokSeviyeSn).padStart(10)}`);
  }
  line();
  const serbest = KOLLAR.filter((k) => ['T', 'D', 'P', 'R'].includes(k.kod)).map((k) => m.get(k.kod)!);
  if (serbest.length >= 2) {
    const lt6 = serbest.map((o) => o.lifetimeAt[2]).filter((x) => Number.isFinite(x));
    const enIyi = Math.max(...lt6);
    const enKotu = Math.min(...lt6);
    line('--- TUZAK ÖLÇÜSÜ (serbest kapıda oyuncunun kendine verebileceği ceza) ---');
    line(`  6 saatlik lifetime: en iyi politika ${tl(enIyi)} ₺ · en kötü ${tl(enKotu)} ₺ · fark ${tl(enIyi - enKotu)} ₺ (%${(((enIyi - enKotu) / enKotu) * 100).toFixed(1)})`);
    line(`  ortalama serbest politika: ${tl(ort(lt6))} ₺`);
    line();
  }
  line('--- PARMAK İZLERİ (varyant gerçekten etkili mi) ---');
  line(`  TABAN (kancasız)  ${m.get('TABAN')!.iz}`);
  for (const k of KOLLAR) line(`  ${k.kod.padEnd(17)} ${m.get(k.kod)!.iz}`);
  line();
}

/* ═══ 5) ÖLÜ BASAMAK KOLU — sıranın NEDEN önemli olduğunu sınayan karşı-deney ═══════════
 * §3 sırayı değil MEKANİZMAYI gösterdi: derin kol hem koltuğu hem bahşişi öne çekiyor.
 * Sebep koltuk merdiveninde duruyor: dörtlü masa L1'de 2, **L2'de yine 2**, L3'te 4 koltuk
 * veriyor — yani L2 KAPASİTE AÇISINDAN ÖLÜ bir basamak. "En ucuzu al" politikası tam da bu
 * ölü basamakta oyalanır (her masanın L1/L2'si, bir masanın L3'ünden ucuzdur), derin politika
 * ise onu hızla geçer. Eğer tuzağın kaynağı buysa, basamağı canlandırmak tuzağı SIRAYA
 * DOKUNMADAN kapatmalı. Bu kol onu sınar: `seatsByLevel.four` L2'ye bir koltuk ekler.
 *
 * Kol yalnız KOŞU ANINDA uygulanır ve geri alınır; `economy.config.ts` dosyası DEĞİŞMEZ
 * (denge-kollari.ts'in kalıbı — git diff'i temiz kalır). */
const cfgTables = C as unknown as { tables: { seatsByLevel: Record<string, number[]> } };
const merdivenYedek = [...cfgTables.tables.seatsByLevel.four];

line('-'.repeat(104));
line('5) ÖLÜ BASAMAK KARŞI-DENEYİ — tuzağın kaynağı SIRA mı, KOLTUK MERDİVENİ mi?');
line('-'.repeat(104));
line(`  Yürürlükteki dörtlü masa koltuk merdiveni: L0..L4 = ${merdivenYedek.join(' · ')}`);
line('  L1 ve L2 aynı koltuğu veriyor → L2 kapasite açısından ÖLÜ basamak.');
line(`  Karşı-deney merdiveni:                   L0..L4 = ${[1, 2, 3, 4, 4].join(' · ')}  (yalnız koşu anında)`);
line('  Not: bu kol bir ÖNERİ DEĞİL, bir TEŞHİS. Tuzak merdivenden geliyorsa sıra kapısı');
line('       semptomu örter, sebebi değil. Uygulanması ayrı bir denge kararıdır.');
line();
{
  const olcSeats = (kod: string, merdiven: number[]) => {
    cfgTables.tables.seatsByLevel.four = merdiven;
    const o = olc(kolBul(kod), 0.55);
    cfgTables.tables.seatsByLevel.four = [...merdivenYedek];
    return o;
  };
  const tEski = olcSeats('T', [...merdivenYedek]);
  const aEski = olcSeats('A', [...merdivenYedek]);
  const tYeni = olcSeats('T', [1, 2, 3, 4, 4]);
  const aYeni = olcSeats('A', [1, 2, 3, 4, 4]);
  damga('ölü basamak kolu etkili', tYeni.iz !== tEski.iz, `iz değişmedi (${tYeni.iz}) — merdiven uygulanmamış`);
  damga('merdiven geri alındı', cfgTables.tables.seatsByLevel.four.join(',') === merdivenYedek.join(','),
    `config geri alınmadı: ${cfgTables.tables.seatsByLevel.four.join(',')}`);
  line('  merdiven          kol   6 sa lifetime    3 sa koltuk   ŞERİT DOLDU   T↔A farkı');
  const satir = (ad: string, kod: string, o: Olcum, taban: Olcum) =>
    line(`  ${ad.padEnd(17)} ${kod.padEnd(4)} ${(`${tl(o.lifetimeAt[2])} ₺`).padStart(14)} ${String(Number.isFinite(o.koltukAt[1]) ? o.koltukAt[1] : '—').padStart(13)} ${sn(o.serit).padStart(13)} ${(`%${(((taban.lifetimeAt[2] - o.lifetimeAt[2]) / o.lifetimeAt[2]) * 100).toFixed(1)}`).padStart(11)}`);
  satir('1·2·2·4·4 (bugün)', 'T', tEski, aEski);
  satir('1·2·2·4·4 (bugün)', 'A', aEski, aEski);
  satir('1·2·3·4·4 (deney)', 'T', tYeni, aYeni);
  satir('1·2·3·4·4 (deney)', 'A', aYeni, aYeni);
  line();
  const tuzakEski = ((aEski.lifetimeAt[2] - tEski.lifetimeAt[2]) / tEski.lifetimeAt[2]) * 100;
  const tuzakYeni = ((aYeni.lifetimeAt[2] - tYeni.lifetimeAt[2]) / tYeni.lifetimeAt[2]) * 100;
  line(`  TUZAK (derin sıranın serbest-ucuz sıraya üstünlüğü, 6 sa lifetime):`);
  line(`    bugünkü merdivende  %${tuzakEski.toFixed(1)}`);
  line(`    deney merdiveninde  %${tuzakYeni.toFixed(1)}`);
  line();
}

line('-'.repeat(104));
line('NOT: bu araç yalnız ÖLÇER. Hiçbir kol koda uygulanmadı; `rules.ts` ve `economy.config.ts`');
line('bu turda DEĞİŞMEDİ. Kol seçimi karar paketinde kullanıcıya aittir (D-084 varyant kapısı).');
damgaOzeti();
