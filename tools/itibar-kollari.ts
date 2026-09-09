/**
 * itibar-kollari.ts — D6 turunun VARYANT KATMANI (D-084 varyant kapısı).
 *
 * NEDEN AYRI DOSYA: `docs/plan-kat1-yayin.html` §6 İtibar'a **"her seviye +%2 müşteri akışı,
 * +%1 bahşiş"** yazdı. İkisi de `economy.config.ts`'e girecek DENGE sayısıdır; kapı gereği önce
 * ÖLÇÜLÜR, ölçülürken config'e yazılmaz. Bu modül kolları yalnız çalışma anında, `simulate.ts`in
 * `itibarAyarla` kancasına takarak uygular — `hedef-kollari.ts` ile aynı sözleşme.
 *
 * SORU: B4 Kat 1'de throughput kolunun TÜKENDİĞİNİ ölçtü (arz servis L6'da 0,78 fincan/sn,
 * taşıma tavanı 1,25). Talep zaten bağlayıcı değilse "+%2 müşteri akışı" HİÇBİR ŞEY yapmaz —
 * ama bu bir varsayım, tablonun bir satırı olmalı. İtibar hangi KANALDAN ödesin: talep · gelir ·
 * arz · yoksa hiç (kapı olsun, ödül değil)?
 *
 * ═══ XP MODELİ — ölçüm değil TÜREV (rapora aynen yazılır) ═══
 * Sim XP'yi hiç modellemiyor. Buradaki eğri sim durumundan türetilir:
 *   servis akışı × oyuncu payı × `perTeaServed` + × garson payı × `perWaiterServed`
 *   + `perQuest` × tamamlanan görev + `perPad` × açılan pad + `perUpgrade` × alınan yükseltme.
 * ÜÇ SINIR:
 *   ① `perDishWashed` SIFIR sayılır — oyuncunun eliyle bulaşık yıkaması sim'de yok (AFK kurulumu).
 *   ② Oyuncu/garson payı taşıma KAPASİTESİ payından okunur; gerçekte kimin taşıdığı anlıktır.
 *   ③ Seviye atladığı an ödül YÜRÜRLÜĞE GİRER — gerçekte oyuncu modali kapatana kadar bekler.
 * ①+② eğriyi bir ALT sınır, ③ etkiyi bir ÜST sınır yapar. Üst sınır bile küçükse kol elenir.
 */
import { economyConfig as C } from '../src/config/economy.config.ts';
import { levelProgress } from '../src/config/economy.config.ts';
import type { HedefDurum, ItibarDurum, ItibarEtki, ItibarKol } from './simulate.ts';
import { kademeAkisi } from './hedef-kollari.ts';

const X = C.xp;

/* ─────────────────────────── KOŞU KAYDI ───────────────────────────
 * Damgalar ve örtüşme ölçümü "bu koşuda ne oldu" diye soruyor; kollar bunu buraya bırakır.
 * Her koşu başında `kayitSifirla()` çağrılır — yoksa önceki kolun izi sonrakine sızar
 * (C4 tuzağı ②, `hedef-kollari.ts`teki `odemeleriSifirla` ile aynı gerekçe). */
export interface Atlama { t: number; seviye: number }
let sonAtlamalar: Atlama[] = [];
let sonHedefAcilislari: number[] = [];
let sonXp = 0;
export const kayitSifirla = (): void => { sonAtlamalar = []; sonHedefAcilislari = []; sonXp = 0; };
export const sonKosuAtlamalari = (): readonly Atlama[] => sonAtlamalar;
export const sonKosuHedefAcilislari = (): readonly number[] => sonHedefAcilislari;
export const sonKosuXp = (): number => sonXp;
export const sonKosuSeviyesi = (): number => (sonAtlamalar.length ? sonAtlamalar[sonAtlamalar.length - 1].seviye : 1);

/**
 * Seviye hesabı — `levelProgress`in `levelGrowth` PARAMETRİK hâli. r5 (eğri kolu) büyümeyi
 * tarayabilsin diye kopyalandı; config'in kendi büyümesiyle çağrıldığında `levelProgress` ile
 * BİREBİR aynı sonucu verir ve bunu `egriDenetimi()` her koşuda doğrular (kopya sessizce
 * sapmasın — D-090'ın dersi: bekçi kendi ızgarasını kurmaz, asıl fonksiyonu çağırır; burada
 * asıl fonksiyon parametrik olmadığı için kopya kaçınılmaz, o yüzden DENETLENİR).
 */
export function seviyeHesap(totalXp: number, growth: number): number {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  let need = Math.round(X.levelBase * Math.pow(growth, 0));
  while (rest >= need && level < 10_000) {
    rest -= need;
    level += 1;
    need = Math.round(X.levelBase * Math.pow(growth, level - 1));
  }
  return level;
}

/** Kopyanın sapmadığını doğrular: config büyümesinde `levelProgress` ile aynı seviyeyi vermeli. */
export function egriDenetimi(): string | null {
  for (const xp of [0, 59, 60, 61, 149, 150, 500, 5_000, 50_000, 500_000]) {
    const a = seviyeHesap(xp, X.levelGrowth);
    const b = levelProgress(xp).level;
    if (a !== b) return `seviyeHesap(${xp}) = ${a} ≠ levelProgress = ${b}`;
  }
  return null;
}

/** XP biriktirici — sim durumundan türetir (yukarıdaki üç sınır). Koşu başına taze kurulur. */
function xpAkisi(): (d: ItibarDurum) => number {
  let xp = 0;
  let q = 0;
  let p = 0;
  let u = 0;
  return (d) => {
    xp += d.servis * (d.oyuncuPayi * X.perTeaServed + (1 - d.oyuncuPayi) * X.perWaiterServed);
    if (d.questIdx > q) { xp += X.perQuest * (d.questIdx - q); q = d.questIdx; }
    if (d.padSayisi > p) { xp += X.perPad * (d.padSayisi - p); p = d.padSayisi; }
    if (d.yukseltme > u) { xp += X.perUpgrade * (d.yukseltme - u); u = d.yukseltme; }
    return xp;
  };
}

/**
 * HER KOLUN ORTAK GÖVDESİ. XP'yi biriktirir, seviyeyi türetir, atlamaları ve hedef kademe
 * açılışlarını kaydeder — sonra `etki` fonksiyonuna seviyeyi verip çarpanı sorar.
 *
 * Hedef kademeleri BURADA da yürütülür (ö1 örtüşme kolu): iki zaman çizelgesi ayrı koşulardan
 * gelirse "aynı pencereye mi düşüyor" sorusu sorulamaz. Kademeler ₺ ÖDEMEZ (yalnız zaman
 * kaydı) — yürürlükteki config zaten çarpan ödüyor ve o çarpan `hedefCarpaniAyarla` kancasının
 * işi; burada iki kez sayılmaz.
 */
function kolGovdesi(growth: number, etki: (seviye: number) => ItibarEtki): () => ItibarKol {
  return () => {
    // Kayıt KOŞU BAŞINA sıfırlanır (fabrika her profil koşusunda bir kez çağrılır) — böylece
    // `olcutler()` bittiğinde elde kalan, en son koşan NORMAL profilin izidir. `hedef-kollari`in
    // `izle()` deseninin aynısı; dışarıdan sıfırlamak dört profili üst üste bindirirdi.
    sonAtlamalar = [];
    sonHedefAcilislari = [];
    const xpAl = xpAkisi();
    const kademe = kademeAkisi();
    let onceki = 1;
    return (d) => {
      const xp = xpAl(d);
      sonXp = xp;
      const sv = seviyeHesap(xp, growth);
      while (onceki < sv) {
        onceki += 1;
        sonAtlamalar.push({ t: d.t, seviye: onceki });
      }
      const hd: HedefDurum = {
        t: d.t, lifetime: d.lifetime, padSayisi: d.padSayisi, ustaMasa: d.ustaMasa, oran: 0,
      };
      for (const _ of kademe(hd)) sonHedefAcilislari.push(d.t);
      return etki(sv);
    };
  };
}

const ETKISIZ: ItibarEtki = { talep: 1, gelir: 1, arz: 1, tasima: 1 };

export interface ItibarKolTanim {
  ad: string;
  ne: string;
  birim: string;
  /** "Değişiklik yok" dozu. */
  taban: number;
  dozlar: number[];
  /** Doz için kol fabrikası; `null` = kanca kapalı (gerçek TABAN satırı). */
  fabrika(doz: number): (() => ItibarKol) | null;
  /** Kolun ATIL kalması BEKLENEN sonuçtur — damga farkı değil AYNILIĞI arar (C5/h0 deseni). */
  atilBeklenir?: boolean;
  yaz(doz: number): string;
}

/** Doz ızgarası — planın yazdığı %2 ızgaranın ORTASINDA kalsın diye hem altına hem üstüne
 *  bakılır. Seviye başına oran olduğu için %5 bile 10. seviyede ×1,45 demektir. */
const DOZ = [0, 0.005, 0.01, 0.02, 0.05, 0.1];

/** Seviye başına DOĞRUSAL çarpan: L1'de etkisiz, her seviye +doz. Planın "her seviye +%2"si. */
const dogrusal = (sv: number, doz: number): number => 1 + Math.max(0, sv - 1) * doz;

export const ITIBAR_KOLLARI: Record<string, ItibarKolTanim> = {
  /* t0 — kanca KAPALI. Gerçek taban: tek bir ek hesap bile yapılmaz, çıktı birebir korunur.
   *      Tabloya girer çünkü kalan her satır buna göre okunur. */
  t0: {
    ad: 't0',
    ne: 'İtibar ödülü YOK — kanca kapalı (gerçek taban)',
    birim: '—',
    taban: 0,
    dozlar: [0],
    atilBeklenir: true,
    fabrika: () => null,
    yaz: () => '—',
  },

  /* r4 — kanca AÇIK ama etkisi yok. t0'ın BİREBİR kopyası olmalı; değilse kancanın kendisi
   *      koşuyu kımıldatıyor demektir ve tablonun tamamı şüpheli olur. Bu yüzden r4 bir kol
   *      değil, ARACIN KENDİ DENETİMİDİR — ve aynı zamanda "İtibar bir KAPI olsun, ödül değil"
   *      seçeneğinin tempo satırıdır (yalnız 💎 + kozmetik açar; h0 deseni). */
  r4: {
    ad: 'r4',
    ne: 'İtibar KAPI: tempoya sıfır dokunur (yalnız 💎 + kozmetik) — kanca açık, etki 1',
    birim: '—',
    taban: 0,
    dozlar: [0],
    atilBeklenir: true,
    fabrika: () => kolGovdesi(X.levelGrowth, () => ETKISIZ),
    yaz: () => '—',
  },

  /* r1 — PLANIN KOLU: "her seviye +%2 müşteri akışı". Talep = koltuk/döngü. Kat 1'de talep
   *      bağlayıcı değilse etki SIFIR çıkar; çıkarsa bu bir bulgudur, varsayım değil. */
  r1: {
    ad: 'r1',
    ne: 'talep: her seviye +%N müşteri akışı (PLANIN kolu)',
    birim: 'seviye başına oran',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) => (doz === 0 ? null : kolGovdesi(X.levelGrowth, (sv) => ({ ...ETKISIZ, talep: dogrusal(sv, doz) }))),
    yaz: (doz) => (doz === 0 ? '0' : `%${(doz * 100).toFixed(doz < 0.01 ? 1 : 0)}/sv`),
  },

  /* r2 — D-090'ın kalıbı: müşteri BAŞINA ₺. Planın "+%1 bahşiş"i de tam buraya düşer
   *      (bahşiş `perCustomer`ın içinde). Üç tavana dokunmaz. */
  r2: {
    ad: 'r2',
    ne: 'gelir: her seviye +%N müşteri başına ₺ (D-090 kalıbı; "+%1 bahşiş" buraya düşer)',
    birim: 'seviye başına oran',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) => (doz === 0 ? null : kolGovdesi(X.levelGrowth, (sv) => ({ ...ETKISIZ, gelir: dogrusal(sv, doz) }))),
    yaz: (doz) => (doz === 0 ? '0' : `%${(doz * 100).toFixed(doz < 0.01 ? 1 : 0)}/sv`),
  },

  /* r3 — ARZ: hazırlama süresini kısaltır, yani üç tavandan BİRİNE dokunan tek kol. Tempoyu
   *      en çok bunun açması beklenir; bedeli de en yüksek olan bu (Kat 1 içeriğini yer). */
  r3: {
    ad: 'r3',
    ne: 'arz: her seviye +%N servis çıktısı (hazırlama süresi kısalır — tavana dokunan tek kol)',
    birim: 'seviye başına oran',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) => (doz === 0 ? null : kolGovdesi(X.levelGrowth, (sv) => ({ ...ETKISIZ, arz: dogrusal(sv, doz) }))),
    yaz: (doz) => (doz === 0 ? '0' : `%${(doz * 100).toFixed(doz < 0.01 ? 1 : 0)}/sv`),
  },

  /* r6 — TAŞIMA: tur kartında YOKTU, ölçüm sırasında eklendi. Darboğaz dağılımı kelepçenin
   *      zamanın **%93'ünde taşımada** olduğunu gösterdi (talep %1,1 · arz %5,9): r1-r3'ün
   *      üçü de gerçek kelepçeye dokunmuyordu. Bu kol oyuncu+garson taşıma kapasitesini
   *      seviyeyle büyütür — throughput'a dokunan TEK gerçek kanal. Bedeli de en yüksek
   *      olması beklenir (Kat 1 içeriğini yer, D1'in eleme ölçütü). */
  r6: {
    ad: 'r6',
    ne: 'taşıma: her seviye +%N taşıma kapasitesi (gerçek kelepçe — ölçüm sırasında eklendi)',
    birim: 'seviye başına oran',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) => (doz === 0 ? null : kolGovdesi(X.levelGrowth, (sv) => ({ ...ETKISIZ, tasima: dogrusal(sv, doz) }))),
    yaz: (doz) => (doz === 0 ? '0' : `%${(doz * 100).toFixed(doz < 0.01 ? 1 : 0)}/sv`),
  },

  /* rUYG — UYGULANAN KOL (D-092). `hUYGF` deseninin aynısı: uygulanacak hâl, uygulanmadan ÖNCE
   *        ayrı bir varyant satırı olarak ölçülür. Sentetik `r6` kolu dozu elle alır; bu kol
   *        `economy.config.ts`in GERÇEK `xp.carryBonusPerLevel`ini okur. r6 %2/sv satırına DENK
   *        çıkması BEKLENTİDİR — ölçüm onu doğrular ya da çürütür ("seçilen doz iyiydi, config'e
   *        yazdığım da ona denktir" varsayımı D3'te iki kez çürümüştü, D-090 Bulgu 10). */
  rUYG: {
    ad: 'rUYG',
    ne: 'UYGULANAN: economy.config.ts`in GERÇEK xp.carryBonusPerLevel`i (taşıma çarpanı)',
    birim: 'açık/kapalı',
    taban: 0,
    dozlar: [0, 1],
    fabrika: (v) => (v <= 0 ? null : kolGovdesi(X.levelGrowth, (sv) => ({ ...ETKISIZ, tasima: dogrusal(sv, X.carryBonusPerLevel) }))),
    yaz: (v) => (v <= 0 ? 'kapalı' : `%${(X.carryBonusPerLevel * 100).toFixed(1)}/sv (config)`),
  },

  /* r5 — EĞRİ: `levelGrowth` taranır. Ekonomik etkisi YOKTUR (r4 gibi atıl) — ölçtüğü şey
   *      atlamaların ZAMANDAKİ YOĞUNLUĞU. D3'ün dersi: bekleme penceresini ödülün büyüklüğü
   *      değil YOĞUNLUĞU dolduruyor; o yüzden yoğunluk kendi satırını hak ediyor. Doz = büyüme
   *      katsayısının kendisi (1,5 = yürürlükteki). */
  r5: {
    ad: 'r5',
    ne: 'eğri: levelGrowth taranır — atlama YOĞUNLUĞU (ekonomik etki yok)',
    birim: 'büyüme katsayısı',
    taban: X.levelGrowth,
    dozlar: [1.2, 1.3, 1.4, 1.5, 1.7, 2.0],
    atilBeklenir: true,
    fabrika: (doz) => kolGovdesi(doz, () => ETKISIZ),
    yaz: (doz) => `×${doz.toFixed(2)}`,
  },
};
