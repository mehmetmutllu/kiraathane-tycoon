/**
 * hedef-kollari.ts — D3 turunun VARYANT KATMANI (D-084 varyant kapısı).
 *
 * NEDEN AYRI DOSYA: hedeflerin (koleksiyon) ₺ ödülü `economy.config.ts`'e girecek bir DENGE
 * sayısıdır. Kapı gereği önce ÖLÇÜLÜR, ölçülürken config'e KALICI yazılmaz — bu modül kolları
 * yalnız çalışma anında, `simulate.ts`'in hedef-akışı kancasına takarak uygular. `denge-kollari.ts`
 * ile aynı sözleşme; farkı, hiç config alanına dokunmaması (kanca sim'in kendi kancası).
 *
 * SORU (D1'in açık bıraktığı yarısı): meta katmanın ₺ akışı geç-oyunun bekleme pencerelerini
 * DOLDURUYOR mu, yoksa yalnız zinciri mi kısaltıyor? D1'de ölçülen düzeltici kolların hepsi Kat 1
 * içeriğinden %7-42 götürüyordu ve o yüzden hiçbiri alınmadı; hedef ödülü aynı tuzağa düşerse
 * aynı gerekçeyle elenir.
 *
 * KOLLARIN OKUNMA BİÇİMİ — doz TAHMİN EDİLMEZ, TARANIR. Her kol tek bir skaler oranla (`doz`)
 * parametrelenir: kademe ödülü = o kademenin ÖLÇEĞİ × doz. Böylece karar paketi "hedef başına
 * 500₺ verelim mi?" gibi uydurma bir sayıyla değil, "%X dozda zincir şu kadar kısalıyor,
 * pencereye şu kadar düşüyor" cümlesiyle gelir.
 *
 * MODEL SINIRI (dürüstlük notu, rapora da yazılır): ödül düşer düşmez cüzdana geçer sayılır.
 * Gerçekte oyuncu paneli açıp "Al"a basana kadar bekler → buradan çıkan etki bir ÜST SINIRdır.
 */
import { economyConfig as C } from '../src/config/economy.config.ts';
import type { HedefDurum, HedefOdeyici } from './simulate.ts';

const cfg = C as unknown as { pads: { id: string; cost: number }[] };

/** Omurga pad'lerin maliyetleri, zincir sırasıyla (ücretsiz olanlar hariç). */
const OMURGA = cfg.pads.filter((p) => p.cost > 0).map((p) => p.cost);

/**
 * KAZANÇ kademeleri — toplam kazanılan ₺ eşikleri (plan §6 "Kazanç" kategorisi).
 * Logaritmik: her kademe bir öncekinin ~4-5 katı, sonuncusu 12 saatlik pencerenin ucunda.
 */
export const KAZANC_ESIKLERI = [1_000, 5_000, 25_000, 100_000, 300_000, 1_000_000] as const;

/**
 * MEKÂN kademeleri — açılmış omurga pad SAYISI eşikleri (plan §6 "Mekân": salon aç, tezgâh kur).
 * Ödülün ölçeği o kademedeki pad'in kendi maliyeti: eğri büyüdükçe ödül de büyür.
 */
export const MEKAN_ESIKLERI = [3, 6, 10, 14, 18, 24] as const;

/** Kademe ödülünün ÖLÇEĞİ (doz 1.0'da ödenecek ₺). Doz bunu çarpar. */
const mekanOlcek = (n: number): number => OMURGA[Math.min(n, OMURGA.length) - 1] ?? OMURGA[OMURGA.length - 1];

/** Eşik listesini tek seferlik ödeyen üreteç: eşik geçilince ölçek×doz düşer, bir daha düşmez. */
function esikOdeyici(
  esikler: readonly number[],
  oku: (d: HedefDurum) => number,
  olcek: (esik: number) => number,
  doz: number,
): HedefOdeyici {
  let i = 0;
  return (d) => {
    let toplam = 0;
    while (i < esikler.length && oku(d) >= esikler[i]) {
      toplam += olcek(esikler[i]) * doz;
      i += 1;
    }
    return toplam;
  };
}

/* Son PROFİL koşusunun ödeme kaydı. `olcutler()` önce İdealize sonra NORMAL profili koşar, yani
 * burada kalan kayıt Normal profilinkidir — tablonun "ÖDENEN" ve "PENCERE" kolonları onu okur.
 * PENCERE, asıl sorunun cevabı: ödül geç-oyunun uzun bekleme aralığına DÜŞÜYOR mu, yoksa çoktan
 * bitmiş bir yere mi biniyor? Toplam ₺ bunu söylemez, zamanlama söyler. */
export interface Odeme { t: number; tutar: number }
let sonOdemeler: Odeme[] = [];
export const sonKosuOdemeleri = (): readonly Odeme[] => sonOdemeler;
/** Kol DEĞİŞTİRİLİRKEN çağrılır. Yoksa kanca kapalı bir koşu, bir öncekinin kaydını okur ve
 *  tabana ait olmayan bir "ödenen" sayısı basar — ilk koşuda damganın yakaladığı hata tam buydu. */
export const odemeleriSifirla = (): void => { sonOdemeler = []; };
export const sonKosuToplami = (): number => sonOdemeler.reduce((a, o) => a + o.tutar, 0);

/** Ödeyiciyi kayıtla sarar (koşu başına sıfırlanır — fabrika her profil koşusunda yeniden çağrılır). */
function sayacli(f: HedefOdeyici): HedefOdeyici {
  sonOdemeler = [];
  return (d) => {
    const r = f(d);
    if (r > 0) sonOdemeler.push({ t: d.t, tutar: r });
    return r;
  };
}

/** `n` kademelik GEOMETRİK kazanç eşiği dizisi (1.000 ₺ → 1.000.000 ₺).
 *  DİKKAT: n=6 hâli hA'nın eşiklerine EŞİT DEĞİLDİR (hA'nınkiler elle seçilmiş yuvarlak sayılar:
 *  1k/5k/25k/100k/300k/1M · buradaki geometrik dizi 1k/4k/16k/63k/251k/1M). Bu yüzden hD'nin
 *  6 kademelik satırı hA %5'in kopyası değil, hD'nin KENDİ tabanıdır — yoğunluk okuması hD'nin
 *  satırları arasında yapılır, hA ile kıyaslanarak değil. */
function yogunEsikler(n: number): number[] {
  const alt = KAZANC_ESIKLERI[0];
  const ust = KAZANC_ESIKLERI[KAZANC_ESIKLERI.length - 1];
  return Array.from({ length: n }, (_, i) => Math.round(alt * (ust / alt) ** (i / (n - 1))));
}

export interface HedefKol {
  ad: string;
  ne: string;
  birim: string;
  /** "Değişiklik yok" dozu. */
  taban: number;
  dozlar: number[];
  /** Doz için ödeyici fabrikası; `null` = akış yok (kanca kapalı kalır). */
  fabrika(doz: number): (() => HedefOdeyici) | null;
  yaz(doz: number): string;
  /** Kolun ATIL kalması BEKLENEN sonuçtur — damga farkı değil AYNILIĞI arar (C5 deseni). */
  atilBeklenir?: boolean;
}

/** Doz ızgarası: tabandan (ödül yok) uzaklaşarak, LOGARİTMİK. İlk taslak %2'den başlıyordu ve
 *  hA'da %2 bile son kademede 20.000 ₺ demekti — yani ızgaranın en küçük adımı zaten büyüktü ve
 *  "küçük dozda ne oluyor" sorusu hiç sorulmamış oluyordu. %0,5'e inildi. */
const DOZ = [0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

/** Kolun doz 1.0'daki toplam ödül ölçeği (rapor hücresi — koşudan bağımsız, analitik). */
const kazancOlcekToplam = KAZANC_ESIKLERI.reduce((a, e) => a + e, 0);
const mekanOlcekToplam = MEKAN_ESIKLERI.reduce((a, n) => a + mekanOlcek(n), 0);

export const HEDEF_KOLLARI: Record<string, HedefKol> = {
  /* h0 — ödül YALNIZ 💎: ₺ akışı sıfır. Sonucun TABANIN BİREBİR KOPYASI olması beklenir; damga
   *      bunu doğrular. Kol bu yüzden ölçülüyor: "elmas versek tempoya hiç dokunmaz" bir
   *      VARSAYIM değil, tablonun bir satırı olmalı (D-084). */
  h0: {
    ad: 'h0',
    ne: 'hedefler YALNIZ 💎 verir — ₺ akışı yok',
    birim: '—',
    taban: 0,
    dozlar: [0],
    atilBeklenir: true,
    fabrika: () => null,
    yaz: () => '₺ ödülü yok (elmas tempoya girmez: bugün harcaması da yok)',
  },

  /* hA — KAZANÇ kategorisi: ödül lifetime eşiğine ORANTILI. Geç oyunda kademeler seyrekleşir
   *      ama ödül büyür — yani akış tam da uzun bekleme pencerelerinin olduğu yere biner. */
  hA: {
    ad: 'hA',
    ne: 'KAZANÇ eşikleri (1k · 5k · 25k · 100k · 300k · 1M ₺) — ödül = eşik × doz',
    birim: 'eşik oranı',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) =>
      doz <= 0 ? null : () => sayacli(esikOdeyici(KAZANC_ESIKLERI, (d) => d.lifetime, (e) => e, doz)),
    yaz: (doz) =>
      doz <= 0
        ? 'ödül yok'
        : `%${(doz * 100).toFixed(0)} → ${KAZANC_ESIKLERI.map((e) => Math.round(e * doz)).join('/')} ₺ (top. ${Math.round(kazancOlcekToplam * doz).toLocaleString('tr-TR')})`,
  },

  /* hB — MEKÂN kategorisi: ödül açılan pad SAYISI eşiklerinde, ölçeği o pad'in kendi maliyeti.
   *      Zamanlaması hA'dan farklı (eğri boyunca daha düzgün) — asıl soru "ne kadar" değil
   *      "NE ZAMAN düşüyor" olduğu için iki dağılım ayrı kol. */
  hB: {
    ad: 'hB',
    ne: 'MEKÂN eşikleri (3 · 6 · 10 · 14 · 18 · 24. pad) — ödül = o pad`in maliyeti × doz',
    birim: 'pad oranı',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) =>
      doz <= 0
        ? null
        : () => sayacli(esikOdeyici(MEKAN_ESIKLERI, (d) => d.padSayisi, (n) => mekanOlcek(n), doz)),
    yaz: (doz) =>
      doz <= 0
        ? 'ödül yok'
        : `%${(doz * 100).toFixed(0)} → ${MEKAN_ESIKLERI.map((n) => Math.round(mekanOlcek(n) * doz)).join('/')} ₺ (top. ${Math.round(mekanOlcekToplam * doz).toLocaleString('tr-TR')})`,
  },

  /* hD — YOĞUNLUK. İlk üç kolun ortak bulgusu şuydu: ödülün BÜYÜKLÜĞÜNÜ artırmak 20 dk'yı aşan
   *      pencerelerin İÇİNE düşen ₺'yi artırmıyor — çünkü altı kademe, altı pencereyle pek
   *      örtüşmüyor. Yani asıl kaldıraç "ne kadar" değil "KAÇ TANE" olabilir. Bu kol tam onu
   *      ayırır: TOPLAM ödül hA %5'te sabit tutulur, yalnız kademe SAYISI değişir. Tek değişken
   *      yoğunluk → "sık ve küçük mü, seyrek ve büyük mü" sorusu tablodan okunabilir hâle gelir.
   *      (Plan §6 zaten ~30 hedef diyor; bu kol o sayının tempo karşılığını ölçer.) */
  hD: {
    ad: 'hD',
    ne: 'YOĞUNLUK: toplam ödül SABİT (hA %5), kademe SAYISI doz — sık/küçük mü, seyrek/büyük mi',
    birim: 'kademe adedi',
    taban: 6,
    dozlar: [6, 10, 16, 24, 40],
    fabrika: (n) => {
      const esikler = yogunEsikler(n);
      const pay = esikler.reduce((a, e) => a + e, 0);
      // Toplam, hA %5'in ölçek toplamına sabitlenir; kademe ödülü eşikle ORANTILI bölünür
      // (geç ödül büyük kalsın — eşit bölüşüm geç oyunda ödülü değersizleştirirdi).
      const toplam = kazancOlcekToplam * 0.05;
      return () => sayacli(esikOdeyici(esikler, (d) => d.lifetime, (e) => (toplam * e) / pay, 1));
    },
    yaz: (n) => {
      const esikler = yogunEsikler(n);
      const pay = esikler.reduce((a, e) => a + e, 0);
      const toplam = kazancOlcekToplam * 0.05;
      const ilk = Math.round((toplam * esikler[0]) / pay);
      const son = Math.round((toplam * esikler[esikler.length - 1]) / pay);
      return `${n} kademe · ${ilk}…${son} ₺ (top. ${Math.round(toplam).toLocaleString('tr-TR')} — SABİT)`;
    },
  },

  /* hC — İKİSİ BİRLİKTE. C5'in dersi: kollar bağımsız değildir, birleşim KAZARA oluşmaz —
   *      uygulanacak hâl neyse o ayrı bir varyant satırı olarak ölçülür. */
  hC: {
    ad: 'hC',
    ne: 'hA + hB birlikte (plan §6: hem Kazanç hem Mekân ₺ verir)',
    birim: 'ortak oran',
    taban: 0,
    dozlar: DOZ,
    fabrika: (doz) =>
      doz <= 0
        ? null
        : () => {
            const a = esikOdeyici(KAZANC_ESIKLERI, (d) => d.lifetime, (e) => e, doz);
            const b = esikOdeyici(MEKAN_ESIKLERI, (d) => d.padSayisi, (n) => mekanOlcek(n), doz);
            return sayacli((d) => a(d) + b(d));
          },
    yaz: (doz) =>
      doz <= 0
        ? 'ödül yok'
        : `%${(doz * 100).toFixed(0)} → top. ${Math.round((kazancOlcekToplam + mekanOlcekToplam) * doz).toLocaleString('tr-TR')} ₺`,
  },
};
