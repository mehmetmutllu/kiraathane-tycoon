/**
 * usta-kollari.ts — D7a turunun VARYANT KATMANI (D-084 varyant kapısı).
 *
 * NEDEN AYRI DOSYA: elmas bugün KAZANILIYOR (hedeflerden 250 💎) ama harcanamıyor — sink SIFIR.
 * D7 hem harcamayı (Usta katmanı) hem ek arzı (günlük görev) getiriyor ve ikisi de
 * `economy.config.ts`'e girecek DENGE sayılarıdır. Kapı gereği önce ÖLÇÜLÜR, ölçülürken
 * config'e yazılmaz: bu modül kolları yalnız çalışma anında `simulate.ts`in `ustaAyarla`
 * kancasına takarak uygular — `hedef-kollari.ts` / `itibar-kollari.ts` ile aynı sözleşme.
 *
 * SORU: Plan §6 "hiç reklam izlemeyen ~2,5 GÜNDE BİR Usta alır" diyor. Oysa hedefler tek
 * başına 250 💎 ödüyor; planın 15 💎'lık fiyatında bu **16 Usta** demek — yani kuyruk daha
 * doğmadan çökebilir. Bu bir varsayım değil, tablonun satırı olmalı.
 *
 * ═══ ELMAS MODELİ — ölçüm değil TÜREV (rapora aynen yazılır) ═══
 * Sim elması hiç modellemiyor. Buradaki arz sim durumundan türetilir:
 *   `kademeAkisi()` (hedef-kollari) hangi kademenin NE ZAMAN açıldığını verir →
 *   `C.goals.diamondByTier[kademe]` o kademenin 💎'ı. Günlük görev arzı sürekli akış
 *   olarak eklenir (`gunluk × dt / 86400`).
 * DÖRT SINIR:
 *   ① 12 sa'lik pencere yarım GÜN — günlük görev arzı bu tabloda tanım gereği küçük kalır.
 *      Gün ölçeği DEFTER kolunun işidir (`olcum-elmas.ts` §5); tick kolu yalnız "ilk 12 saatte
 *      ne kadar düşüyor" sorusunu cevaplar.
 *   ② Ödüllü reklam ve IAP arzı YOK sayılır — alt sınır.
 *   ③ Usta hedefleri: SERVİS NOKTASI (1) + MASALAR (20) + PERSONEL merdivenleri (5: garson ·
 *      bulaşıkçı · karakterin üç statı) = **26**, planın listesiyle örtüşüyor. Personel kanalı
 *      tur kartında YOKTU, ölçüm sırasında eklendi (`e6`) — gerekçesi orada.
 *   ④ Oyuncu 💎'ı biriktiği ANDA harcar (personel → servis → masa). Gerçek oyuncu
 *      bekletebilir; yani ölçülen etki bir ÜST sınırdır.
 * ①+②+③ arzı ALT sınır, ④ etkiyi ÜST sınır yapar. Üst sınır bile küçükse kol elenir.
 */
import { economyConfig as C } from '../src/config/economy.config.ts';
import type { HedefDurum, UstaDurum, UstaEtki, UstaKol } from './simulate.ts';
import { kademeAkisi } from './hedef-kollari.ts';

/** Sim adımı — `simulate.ts`in DT'si. Günlük arzı sürekli akışa çevirmek için gerekiyor. */
const DT = 1;
const GUN = 24 * 3600;

/** Planın §6 tablosundaki sayılar — kolların TABAN dozu bunlar, ölçülecek olan da bunlar. */
export const PLAN = {
  /** Usta seviyesinin 💎 fiyatı (plan §6: "15 💎 veya 1 reklam"). */
  fiyat: 15,
  /** Usta'nın etkisi (plan §5 servis merdiveni: "üstüne ×2"). */
  etki: 2,
  /** Günlük görev arzı (plan §6: "3 görev/gün ≈ 6 💎/gün"). */
  gunluk: 6,
} as const;

/** Hedeflerin bugün ödediği TOPLAM 💎 — `economy.config.ts`ten türer, elle yazılmaz. */
export const HEDEF_ELMAS_TOPLAM = C.goals.categories.reduce(
  (a, cat) => a + cat.tiers.reduce((b, _t, ti) => b + (C.goals.diamondByTier[ti] ?? 0), 0), 0);

/* ─────────────────────────── KOŞU KAYDI ───────────────────────────
 * Damgalar ve rapor kolonları "bu koşuda ne oldu" diye soruyor; kollar bunu buraya bırakır.
 * Her koşu başında fabrika sıfırlar — yoksa önceki kolun izi sonrakine sızar (C4 tuzağı ②). */
export interface Alim { t: number; hedef: string }
let sonAlimlar: Alim[] = [];
let sonKazanilan = 0;
let sonHarcanan = 0;
let sonKalan = 0;
/** Koşu sonunda UYGUN ama alınamamış hedef sayısı — "kuyruk" kolonu budur. */
let sonKuyruk = 0;
export const kayitSifirla = (): void => {
  sonAlimlar = []; sonKazanilan = 0; sonHarcanan = 0; sonKalan = 0; sonKuyruk = 0;
};
export const sonKosuAlimlari = (): readonly Alim[] => sonAlimlar;
export const sonKosuElmasi = () => ({ kazanilan: sonKazanilan, harcanan: sonHarcanan, kalan: sonKalan });
export const sonKosuKuyrugu = (): number => sonKuyruk;

/** 💎 korunumu: kazanılan − harcanan = kalan. Sapma varsa ölçüm değil KOD hatasıdır. */
export const korunumSapmasi = (): number =>
  Math.round((sonKazanilan - sonHarcanan - sonKalan) * 1000) / 1000;

export type Kapsam = 'servis' | 'masa' | 'personel' | 'ikisi' | 'hepsi';
const KAPSAMLAR = ['servis', 'masa', 'personel', 'ikisi', 'hepsi'] as const;
const KAPSAM_ADI = ['yalnız servis', 'yalnız masa', 'yalnız personel', 'servis+masa', 'hepsi'] as const;
/** Planın PERSONEL Usta hedefleri: garson · bulaşıkçı · karakterin üç statı. */
const PERSONEL_HEDEF = 5;
const kanalVar = (k: Kapsam, kanal: 'servis' | 'masa' | 'personel'): boolean =>
  k === 'hepsi' || k === kanal || (k === 'ikisi' && kanal !== 'personel');

interface Ayar {
  /** Usta basamağının çarpanı (plan: 2 = "üstüne ×2"). */
  etki: number;
  /** Bir Usta'nın 💎 fiyatı. */
  fiyat: number;
  /** Hangi objeler Usta olabilir. */
  kapsam: Kapsam;
  /** Günlük görev arzı (💎/gün). */
  gunluk: number;
  /** Hedef 💎 arzının ölçeği (1 = bugünkü toplam). */
  hedefOlcek: number;
  /** PERSONEL Usta`sı için ₺ TAVANI şartı aransın mı. Ölçüm sırasında knob oldu: personel
   *  merdivenleri 12 sa penceresinde tavana HİÇ varmıyor (ölçüldü), o yüzden şartlı kol
   *  dejenere bir sıfır satırı üretiyordu. Şartsız satır (`e6X`) hem KANALIN takılı olduğunu
   *  kanıtlar hem de kanalın ÜST sınırını verir. */
  tavanSarti: boolean;
}

/**
 * KOL GÖVDESİ — bütün kollar bu AYNI satın alma kuralını yürütür; aralarındaki tek fark
 * ayarlardır. Kural ortak olmasaydı satırlar kıyaslanamazdı: fark kuraldan mı ayardan mı
 * gelirdi ayırt edilemezdi (`kademeAkisi`in ortak merdiven gerekçesinin aynısı).
 *
 * SATIN ALMA SIRASI: önce PERSONEL (taşıma), sonra SERVİS (arz), sonra MASALAR (bahşiş).
 * Akıllı-oyuncu kuralı sim'in ₺ merdivenindekiyle aynı: önce darboğaza dokunan kol — ve
 * darboğaz TAHMİN edilmedi, ölçüldü: ilk kısa koşuda kelepçe zamanın %91,5'inde taşımadaydı.
 * Ters sıra ayrı bir kol olarak ölçülebilir; bu turda sorulan soru o değil.
 */
function kolGovdesi(a: Ayar): () => UstaKol {
  return () => {
    kayitSifirla();
    const akis = kademeAkisi();
    let elmas = 0;
    let servisUsta = false;
    let ustaMasaSayisi = 0;
    let ustaPersonelSayisi = 0;
    return (d: UstaDurum): UstaEtki => {
      // --- ARZ: hedef kademeleri + günlük görev akışı.
      const hd: HedefDurum = {
        t: d.t, lifetime: d.lifetime, padSayisi: d.padSayisi, ustaMasa: d.ustaMasa, oran: 0,
      };
      for (const k of akis(hd)) {
        const v = (C.goals.diamondByTier[k.ti] ?? 0) * a.hedefOlcek;
        elmas += v; sonKazanilan += v;
      }
      if (a.gunluk > 0) {
        const v = (a.gunluk * DT) / GUN;
        elmas += v; sonKazanilan += v;
      }

      // --- UYGUN HEDEFLER: Usta ancak ₺ TAVANINDA açılır (plan K6: kritik yol dışı).
      const servisUygun = kanalVar(a.kapsam, 'servis') && !servisUsta && d.servisSeviye >= d.servisTavan;
      const masaUygun = kanalVar(a.kapsam, 'masa') ? Math.max(0, d.masaTavanda - ustaMasaSayisi) : 0;
      const personelHavuz = a.tavanSarti ? d.personelTavanda : PERSONEL_HEDEF;
      const personelUygun = kanalVar(a.kapsam, 'personel')
        ? Math.max(0, personelHavuz - ustaPersonelSayisi) : 0;

      // --- HARCAMA: tick başına en fazla bir alım (okunabilir alım hattı için).
      if (elmas >= a.fiyat) {
        if (personelUygun > 0) {
          elmas -= a.fiyat; sonHarcanan += a.fiyat; ustaPersonelSayisi += 1;
          sonAlimlar.push({ t: d.t, hedef: 'personel ' + ustaPersonelSayisi });
        } else if (servisUygun) {
          elmas -= a.fiyat; sonHarcanan += a.fiyat; servisUsta = true;
          sonAlimlar.push({ t: d.t, hedef: 'servis' });
        } else if (masaUygun > 0) {
          elmas -= a.fiyat; sonHarcanan += a.fiyat; ustaMasaSayisi += 1;
          sonAlimlar.push({ t: d.t, hedef: 'masa ' + ustaMasaSayisi });
        }
      }
      sonKalan = elmas;
      sonKuyruk = (servisUygun && !servisUsta ? 1 : 0)
        + (kanalVar(a.kapsam, 'masa') ? Math.max(0, d.masaTavanda - ustaMasaSayisi) : 0)
        + (kanalVar(a.kapsam, 'personel') ? Math.max(0, personelHavuz - ustaPersonelSayisi) : 0);

      // --- ETKİ.
      // Servis: hazırlama süresi kısalır (üç tavandan birine dokunan tek kanal).
      const arz = servisUsta ? a.etki : 1;
      // Masa: çarpan yalnız BAHŞİŞİN payına biner. Müşteri başına ₺'nin tamamını çarpmak,
      // bahşişi olmayan sabit fiyatı da büyütür ve sahte bir gelir üretirdi.
      const oran = d.masaSayisi > 0 ? Math.min(1, ustaMasaSayisi / d.masaSayisi) : 0;
      const gelir = 1 + d.bahsisPayi * oran * (a.etki - 1);
      // Personel: taşıma kapasitesi — ölçülen TEK bağlayıcı kanal. Çarpan alınan hedef
      // sayısıyla orantılı biner. MODEL SINIRI: gerçekte mıknatıs para toplamaya, bulaşıkçı
      // yıkamaya biner; sim üçünü de taşıma kanalında topluyor → kolun etkisi ÜST sınırdır.
      const tasima = 1 + (ustaPersonelSayisi / PERSONEL_HEDEF) * (a.etki - 1);
      return { arz, gelir, tasima };
    };
  };
}

export interface UstaKolTanim {
  ad: string;
  ne: string;
  birim: string;
  /** "Değişiklik yok" dozu. */
  taban: number;
  dozlar: number[];
  /** Doz için kol fabrikası; `null` = kanca kapalı (gerçek TABAN satırı). */
  fabrika(doz: number): (() => UstaKol) | null;
  /** Kolun ATIL kalması BEKLENEN sonuçtur — damga farkı değil AYNILIĞI arar (h0/r4 deseni). */
  atilBeklenir?: boolean;
  /** Kol hiç Usta ALMAZ (kapsam/arz sıfır) → "alım düştü" damgası ona uygulanmaz. */
  alimsiz?: boolean;
  yaz(doz: number): string;
}

const VARSAYILAN: Ayar = {
  etki: PLAN.etki, fiyat: PLAN.fiyat, kapsam: 'hepsi', gunluk: 0, hedefOlcek: 1, tavanSarti: true,
};

export const USTA_KOLLARI: Record<string, UstaKolTanim> = {
  /* e0 — kanca KAPALI. Gerçek taban: tek bir ek hesap bile yapılmaz, çıktı birebir korunur.
   *      D7'nin tabanı BUGÜNKÜ DÜNYA'dır: D-090'ın kalıcı çarpanı ve D-092'nin taşıma
   *      ödülü AÇIK koşulur (bkz. `olcum-elmas.ts` `kolaGec`), yalnız Usta yoktur. */
  e0: {
    ad: 'e0',
    ne: 'Usta katmanı YOK — kanca kapalı (gerçek taban; D-090 + D-092 açık)',
    birim: '—',
    taban: 0,
    dozlar: [0],
    atilBeklenir: true,
    alimsiz: true,
    fabrika: () => null,
    yaz: () => '—',
  },

  /* eKAPI — kanca AÇIK ama etki 1 ve fiyat ulaşılmaz. e0'ın BİREBİR kopyası olmalı; değilse
   *         kancanın KENDİSİ koşuyu kımıldatıyor demektir ve tablonun tamamı şüpheli olur.
   *         Bu bir kol değil, ARACIN KENDİ DENETİMİDİR (r4 deseni). */
  eKAPI: {
    ad: 'eKAPI',
    ne: 'kanca açık, etki 1, fiyat ulaşılmaz — aracın kendi denetimi',
    birim: '—',
    taban: 0,
    dozlar: [0],
    atilBeklenir: true,
    alimsiz: true,
    fabrika: () => kolGovdesi({ ...VARSAYILAN, etki: 1, fiyat: Number.POSITIVE_INFINITY }),
    yaz: () => '—',
  },

  /* e1 — USTA'NIN ETKİSİ. Planın "üstüne ×2"si ızgaranın ORTASINDA kalsın diye hem altına hem
   *      üstüne bakılır. Bu kol zincire dokunur (arz kanalı) → D1'in %7 eleme eşiği geçerli. */
  e1: {
    ad: 'e1',
    ne: 'Usta basamağının ETKİSİ (servis arz ×N · Usta masa bahşiş ×N) — PLANIN kolu ×2',
    birim: 'çarpan',
    taban: 1,
    dozlar: [1.25, 1.5, 2, 3],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, etki: doz }),
    yaz: (doz) => '×' + doz.toFixed(2),
  },

  /* e2 — USTA'NIN FİYATI. Etki plan dozunda (×2) sabit tutulur; değişen yalnız kuyruğun
   *      hızıdır. Asıl soru burada: 250 💎'lık hedef arzı fiyatı hangi noktada anlamlı kılıyor? */
  e2: {
    ad: 'e2',
    ne: 'Usta seviyesinin 💎 FİYATI (etki ×2 sabit) — kuyruk hangi fiyatta doğuyor',
    birim: '💎',
    taban: PLAN.fiyat,
    dozlar: [15, 25, 40, 60],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, fiyat: doz }),
    yaz: (doz) => doz + ' 💎',
  },

  /* e3 — KAPSAM. Usta hangi objelere gelsin? Servis noktası üç tavandan birine dokunuyor,
   *      masalar yalnız bahşişe. İkisinin tempo payını AYIRMADAN doz seçilemez. */
  e3: {
    ad: 'e3',
    ne: 'KAPSAM: hangi kanal ödüyor — servis (arz) · masa (bahşiş) · personel (taşıma)',
    birim: 'kapsam',
    taban: 4,
    dozlar: [0, 1, 2, 3, 4],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, kapsam: KAPSAMLAR[doz] }),
    yaz: (doz) => KAPSAM_ADI[doz],
  },

  /* e4 — HEDEF 💎 ARZI. Bugünkü toplam ölçeklenir. Kuyruk arzın hangi noktasında ayakta
   *      kalıyor — yani "hedefler fazla mı ödüyor" sorusunun sayı satırı. */
  e4: {
    ad: 'e4',
    ne: 'hedeflerin 💎 arzı ölçeklenir (bugün ' + HEDEF_ELMAS_TOPLAM + ' 💎) — kuyruk arzın neresinde ayakta',
    birim: 'ölçek',
    taban: 1,
    dozlar: [0, 0.32, 0.6, 1],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, hedefOlcek: doz }),
    yaz: (doz) => '×' + doz.toFixed(2) + ' (' + Math.round(HEDEF_ELMAS_TOPLAM * doz) + ' 💎)',
  },

  /* e6 — PERSONEL (TAŞIMA) KOLU: tur kartında YOKTU, ölçüm sırasında eklendi. İlk kısa koşu
   *      darboğaz dağılımını verdi: kelepçe zamanın **%91,5**'inde TAŞIMADA (arz %7,2 ·
   *      talep %1,3). Yani tur kartının iki kanalı da (servis arzı · masa bahşişi) gerçek
   *      kelepçeye dokunmuyordu — D6’da `r6` tam bu şekilde eklenmişti (D-092 Bulgu 8).
   *      Planın ~26 Usta hedefindeki garson · bulaşıkçı · 3 karakter statı bu kanalda durur. */
  e6: {
    ad: 'e6',
    ne: 'yalnız PERSONEL Usta — ₺ tavanı ŞARTLI (bugünkü kural); 12 sa`de tavana hiç varılmıyor',
    birim: 'çarpan',
    taban: 1,
    dozlar: [1.25, 1.5, 2, 3],
    atilBeklenir: true,
    alimsiz: true,
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, etki: doz, kapsam: 'personel' }),
    yaz: (doz) => '×' + doz.toFixed(2),
  },

  /* e6X — PERSONEL kanalının ₺ tavanı şartı KALDIRILMIŞ hâli. İki işi var: (a) KANAL DENETİMİ —
   *       e6 sıfır ölçtüğü için "kol etkisiz mi, kanca takılı değil mi" ayırt edilemiyordu
   *       (D1`de `iade:0.25` tam böyle kaçmıştı); (b) kanalın ÜST SINIRI — personel Usta`sı
   *       ilk andan alınabilseydi tempoya ne verirdi. Üst sınır bile küçükse kanal iki kez
   *       elenmiş olur: hem ulaşılamıyor hem de ulaşılsa değmiyor. */
  e6X: {
    ad: 'e6X',
    ne: 'yalnız PERSONEL Usta — ₺ tavanı şartı YOK (kanal denetimi + kanalın ÜST sınırı)',
    birim: 'çarpan',
    taban: 1,
    dozlar: [1.25, 1.5, 2, 3],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, etki: doz, kapsam: 'personel', tavanSarti: false }),
    yaz: (doz) => '×' + doz.toFixed(2),
  },

  /* eUYG — UYGULANAN KOL (D-093). `hUYGF` / `rUYG` deseninin aynısı: uygulanacak hâl,
   *        uygulandıktan sonra AYRI bir varyant satırı olarak ölçülür.
   *
   *        BU TURDA ZORUNLU, çünkü karar İKİ KNOB'u birleştirdi ve ikisi de tabloda AYRI ayrı
   *        ölçülmüştü: etki ×1,5 (`e1`, fiyat 15 💎 ile) ve fiyat 25 💎 (`e2`, etki ×2 ile).
   *        Birleşimleri hiçbir satırda yok. "Seçtiğim dozlar iyiydi, ikisi birlikte de öyledir"
   *        varsayımı D3'te iki kez çürüdü (D-090 Bulgu 10) — o yüzden varsayılmaz, ölçülür.
   *
   *        Kol `economy.config.ts`in GERÇEK sayılarını okur: `master.tipMult`,
   *        `master.diamondCost`, `dailyQuests.diamondsPerDay`. */
  eUYG: {
    ad: 'eUYG',
    ne: 'UYGULANAN: economy.config.ts`in GERÇEK master + dailyQuests sayıları',
    birim: 'açık/kapalı',
    taban: 0,
    dozlar: [0, 1],
    fabrika: (v) => (v <= 0 ? null : kolGovdesi({
      ...VARSAYILAN,
      etki: C.master.tipMult,
      fiyat: C.master.diamondCost,
      gunluk: C.dailyQuests.diamondsPerDay,
    })),
    yaz: (v) => (v <= 0 ? 'kapalı'
      : `×${C.master.tipMult} · ${C.master.diamondCost} 💎 · ${C.dailyQuests.diamondsPerDay}/gün`),
  },

  /* e5 — GÜNLÜK GÖREV ARZI. MODEL SINIRI ①: 12 sa yarım gündür, bu kolun tick tablosundaki
   *      payı tanım gereği küçüktür. Yine de ölçülüyor, çünkü "günlük görev ilk 12 saatte
   *      hiçbir şey yapmaz" bir VARSAYIM değil, tablonun satırı olmalı (D-084 · h0 deseni).
   *      Gün ölçeğindeki asıl hesap DEFTER kolundadır (`olcum-elmas.ts` §5).
   *      IZGARA planın 6 💎/gün dozunun ÇOK ÜSTÜNE uzatıldı (80). Sebep ölçüldü: ilk koşuda
   *      40 💎/gün bile 12 saatte 11,5 💎 biriktirip TEK Usta alamadı — yani satırda hiç alım
   *      düşmüyordu ve "kol etkisiz" ile "kanca takılmamış" ayırt edilemiyordu (D1'de
   *      `iade:0.25` tam böyle kaçmıştı). Eşik 30 💎/gün: 12 sa yarım gün olduğundan günlük
   *      arzın 15 💎'lık fiyatı geçmesi için gün başına en az 30 💎 gerekiyor. */
  e5: {
    ad: 'e5',
    ne: 'günlük görev arzı (💎/gün) — hedef arzı KAPALI, yalnız günlük akış',
    birim: '💎/gün',
    taban: PLAN.gunluk,
    dozlar: [6, 12, 20, 40, 80],
    fabrika: (doz) => kolGovdesi({ ...VARSAYILAN, gunluk: doz, hedefOlcek: 0 }),
    yaz: (doz) => doz + ' 💎/gün',
  },
};
