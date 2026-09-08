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
import type { HedefCarpani, HedefDurum, HedefOdeyici } from './simulate.ts';

const cfg = C as unknown as {
  pads: { id: string; cost: number }[];
  service: { basePrice: number };
  goals: {
    incomeBonusTotal: number;
    diamondByTier: number[];
    categories: { id: string; name: string; metric: string; tiers: number[] }[];
  };
};

/**
 * D-089'un SABİT ₺ MERDİVENİ — DONDURULMUŞ tarihsel veri, config'ten kopya değil.
 * `economy.config.ts` D-090'da bu merdiveni sildi (ödül kalıbı çarpana döndü), ama raporun §4
 * tablosundaki `hUYG` satırı yeniden üretilebilir kalmalı: o satır kararın kıyas noktasıdır.
 * Bu yüzden merdiven buraya, ölçüm aracına, "artık yürürlükte olmayan hâl" olarak taşındı.
 * BURAYA BAKARAK DENGE DEĞİŞTİRİLMEZ — yürürlükteki sayı `goals.incomeBonusTotal`.
 */
const D089_MERDIVEN: Record<string, number[]> = {
  service: [5, 25, 90, 260, 700],
  space: [5, 20, 80, 300, 850],
  earn: [5, 20, 75, 280, 800],
  clean: [5, 25, 90, 260, 700],
  master: [100, 220, 420, 750, 1_400],
};

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

/** O tick'te AÇILAN kademeler (kategori index + kademe index). D3b'de üç kol da bu AYNI
 *  merdiveni yürütür — aralarındaki tek fark ödülün KALIBI (sabit ₺ / gelire oranlı ₺ / çarpan).
 *  Merdiven ortak olmasaydı kalıplar kıyaslanamazdı: fark kalıptan mı eşikten mi gelirdi
 *  ayırt edilemezdi. */
function kademeAkisi(): (d: HedefDurum) => { ci: number; ti: number }[] {
  const ortFiyat = cfg.service.basePrice;
  const durum = cfg.goals.categories.map(() => 0); // kategori başına AÇILMIŞ kademe sayısı
  const oku = (d: HedefDurum, metric: string): number => {
    switch (metric) {
      case 'lifetime': return d.lifetime;
      case 'pads': return d.padSayisi;
      case 'masterTables': return d.ustaMasa;
      // VEKİL: sim kümülatif servis saymıyor (bkz. hUYG yorumu).
      case 'served': return ortFiyat > 0 ? d.lifetime / ortFiyat : 0;
      // Oyuncunun eliyle yıkaması sim'de yok → kategori ilerlemez.
      default: return 0;
    }
  };
  return (d) => {
    const acilan: { ci: number; ti: number }[] = [];
    cfg.goals.categories.forEach((cat, ci) => {
      while (durum[ci] < cat.tiers.length && oku(d, cat.metric) >= cat.tiers[durum[ci]]) {
        acilan.push({ ci, ti: durum[ci] });
        durum[ci] += 1;
      }
    });
    return acilan;
  };
}

/** Config'teki toplam kademe sayısı (5 × 5 = 25) — hF'nin doz birimi "TAM koleksiyonda çarpan". */
const TOPLAM_KADEME = cfg.goals.categories.reduce((a, c) => a + c.tiers.length, 0);

/**
 * `economy.config.ts`'in GERÇEK `goals` bloğunu çalıştıran ödeyici (hUYG kolu). Kategori başına
 * kademeler SIRAYLA açılır — oyunun kendi kuralı (`goals.ts`: önceki kademe toplanmadan sonraki
 * kilitli), yani sim de aynı sırayı izler; atlamalı ödeme gerçekte mümkün değil.
 */
function configOdeyici(): HedefOdeyici {
  const akis = kademeAkisi();
  return (d) => akis(d).reduce((a, k) => a + (D089_MERDIVEN[cfg.goals.categories[k.ci].id]?.[k.ti] ?? 0), 0);
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
  /** D3b — ödülü ₺ olarak DEĞİL kalıcı çarpan olarak veren kollar (hF) bunu doldurur. */
  carpanFabrika?(doz: number): (() => HedefCarpani) | null;
  yaz(doz: number): string;
  /** Kolun ATIL kalması BEKLENEN sonuçtur — damga farkı değil AYNILIĞI arar (C5 deseni). */
  atilBeklenir?: boolean;
  /** Kol hiç ₺ ÖDEMEZ (etkisi çarpandan gelir) → "ödeme düştü" damgası ona uygulanmaz;
   *  yerine varyant damgası (iz taban'dan farklı mı) tek başına sorumludur. */
  odemesiz?: boolean;
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

  /* hE — İKİNCİ EKSEN. hD yoğunluğu SABİT TOPLAMLA taradı; yani "24 kademe ama daha az ₺" hiç
   *      sorulmadı. Karar paketi iki eksenli olmalı (kaç tane × ne kadar), yoksa seçilen kolun
   *      bedeli ölçülmemiş bir varsayıma dayanır. Bu kol kademe sayısını hD'nin en verimli
   *      noktasında (24) sabitler ve yalnız TOPLAMI kısar. */
  hE: {
    ad: 'hE',
    ne: 'YOĞUN + KISIK: 24 kademe SABİT, toplam ödül doz (hA ölçeğinin oranı)',
    birim: 'ölçek oranı',
    taban: 0,
    dozlar: [0, 0.005, 0.01, 0.02, 0.03, 0.05],
    fabrika: (oran) => {
      if (oran <= 0) return null;
      const esikler = yogunEsikler(24);
      const pay = esikler.reduce((a, e) => a + e, 0);
      const toplam = kazancOlcekToplam * oran;
      return () => sayacli(esikOdeyici(esikler, (d) => d.lifetime, (e) => (toplam * e) / pay, 1));
    },
    yaz: (oran) => {
      if (oran <= 0) return 'ödül yok';
      const esikler = yogunEsikler(24);
      const pay = esikler.reduce((a, e) => a + e, 0);
      const toplam = kazancOlcekToplam * oran;
      const ilk = Math.round((toplam * esikler[0]) / pay);
      const son = Math.round((toplam * esikler[esikler.length - 1]) / pay);
      return `24 kademe · ${ilk}…${son} ₺ (top. ${Math.round(toplam).toLocaleString('tr-TR')})`;
    },
  },

  /* hUYG — D-089'da UYGULANMIŞ olan kol (sabit ₺ merdiveni). D-090'dan beri YÜRÜRLÜKTE DEĞİL;
   *        merdiveni `D089_MERDIVEN`de dondurulmuş durumda tutuluyor ki raporun §4 tablosu ve
   *        D3b'nin kıyas satırı yeniden üretilebilsin. Uygulanan HÂLİ ölçen kol artık `hUYGF`. C5'in `secilen` kolunun deseni: uygulanacak hâl, uygulanmadan ÖNCE
   *        ayrı bir varyant satırı olarak ölçülür. "Seçilen doz iyiydi, config'e yazdığım şey de
   *        ona denktir" bir VARSAYIMDIR — bu kol onu sayıya çevirir. Kollar sentetik merdivenler
   *        kullanıyordu; bu kol `economy.config.ts`'in GERÇEK `goals` bloğunu okur.
   *
   *        MODELLENEN 4/5 KATEGORİ (bilerek eksik, rapora yazılır):
   *          Kazanç · Mekân · Usta — sim'de birebir karşılığı var.
   *          Servis — sim kümülatif servis saymıyor; lifetime / ortalama fiyat ile VEKİL okunur
   *                   (Bulgu 2'de zaten "servis lifetime ile monoton aynı" ölçülmüştü).
   *          Temizlik — oyuncunun ELİYLE yıkaması sim'de hiç modellenmiyor → bu kategori
   *                   ilerlemez, ödülü hiç düşmez. Yani hUYG satırı gerçek etkinin ALT sınırıdır. */
  hUYG: {
    ad: 'hUYG',
    ne: 'UYGULANAN: economy.config.ts`in GERÇEK goals bloğu (5 kategori × 5 kademe)',
    birim: 'açık/kapalı',
    taban: 0,
    dozlar: [0, 1],
    fabrika: (v) => (v <= 0 ? null : () => sayacli(configOdeyici())),
    yaz: (v) =>
      v <= 0
        ? 'kapalı'
        : `${cfg.goals.categories.length} kategori × ${cfg.goals.categories[0].tiers.length} kademe · ` +
          `toplam ${Object.values(D089_MERDIVEN).reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0).toLocaleString('tr-TR')} ₺ (DONDURULMUŞ D-089 merdiveni)`,
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

  /* ── D3b: SEKTÖRÜN İKİ KALIBI ───────────────────────────────────────────────────────────
   * D3'ün kolları (hA-hE, hUYG) tek bir kalıbın DOZUNU tarıyordu: sabit ₺ merdiveni. Kullanıcı
   * kapanışta o kalıbın kendisini sorguladı ("sektörde kaliteli olan hangisi"). Idle/tycoon'da
   * koleksiyon ödülü ya sert para (h0 — ölçüldü, bedeli sıfır) ya KALICI ÇARPAN olur; yumuşak
   * para kullanılacaksa GELİRE ORANLI tanımlanır. İkisi de bu turda tabloya giriyor. */

  /* hF — KALICI ÇARPAN (AdVenture Capitalist milestone · Cookie Clicker milk · Egg Inc.).
   *      Ödül tek seferlik DÜŞMEZ: her toplanan kademe ₺/müşteriyi kalıcı olarak büyütür.
   *      Kalıbın vaadi "ödül oyuncuyla birlikte büyür, bayatlamaz". Sınavı D1'inkiyle aynı:
   *      geliri sürekli çarptığı için zinciri her yerde kısaltır — %7 eşiğinin ALTINDA kalan
   *      bir doz var mı, tablo söyleyecek. Doz = TAM koleksiyondaki (25/25) toplam çarpan. */
  hF: {
    ad: 'hF',
    ne: 'KALICI ÇARPAN: her kademe ₺/müşteriyi kalıcı büyütür (doz = 25/25`te toplam artış)',
    birim: 'tam koleksiyon artışı',
    taban: 0,
    dozlar: [0, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5],
    odemesiz: true,
    fabrika: () => null,
    carpanFabrika: (doz) => {
      if (doz <= 0) return null;
      return () => {
        const akis = kademeAkisi();
        let acik = 0;
        return (d) => {
          acik += akis(d).length;
          return 1 + (doz * acik) / TOPLAM_KADEME;
        };
      };
    },
    yaz: (doz) =>
      doz <= 0
        ? 'çarpan yok'
        : `+%${(doz * 100).toFixed(0)} tam koleksiyonda · kademe başına +%${((doz * 100) / TOPLAM_KADEME).toFixed(2)} (${TOPLAM_KADEME} kademe)`,
  },

  /* hG — GELİRE ORANLI ₺. Bulgu 10 ②'nin YAPISAL karşılığı: ödül kademe INDEX'ine değil,
   *      oyuncunun oraya ULAŞTIĞI ANDAKİ gelirine bağlanır ("şu anki gelirin N saniyesi").
   *      Böylece ödeme, eğrinin neresinde toplanırsa toplansın aynı ağırlıkta düşer — kısılmış
   *      merdivenin "toplam tuttu, YERİ tutmadı" kusuru tanım gereği ortadan kalkar.
   *      Kıyası doğrudan hUYG satırıdır: aynı 25 kademe, aynı eşikler, yalnız ödül kalıbı farklı. */
  hG: {
    ad: 'hG',
    ne: 'GELİRE ORANLI ₺: ödül = o anki gelirin N saniyesi (kademe index`ine DEĞİL)',
    birim: 'sn gelir',
    taban: 0,
    dozlar: [0, 15, 30, 60, 120, 300, 600],
    fabrika: (sn) => {
      if (sn <= 0) return null;
      return () => {
        const akis = kademeAkisi();
        return sayacli((d) => akis(d).length * d.oran * sn);
      };
    },
    yaz: (sn) =>
      sn <= 0
        ? 'ödül yok'
        : `${TOPLAM_KADEME} kademe × o anki gelirin ${sn} sn`,
  },

  /* hUYGF — UYGULANAN KOL (D-090). `hUYG` deseninin aynısı, yeni kalıp için: uygulanacak hâl,
   *         uygulanmadan önce ayrı bir varyant satırı olarak ölçülür. D3'ün en pahalı dersi
   *         buydu — "seçilen doz iyiydi, config'e yazdığım da ona denktir" varsayımı İKİ KEZ
   *         çürüdü (Bulgu 10). Bu kol `economy.config.ts`'in GERÇEK `incomeBonusTotal`ini ve
   *         GERÇEK kademe sayısını okur; sentetik `hF` koluna denk çıkması BEKLENTİDİR, ölçüm
   *         onu doğrular ya da çürütür.
   *
   *         MODELLENEN 4/5 KATEGORİ (hUYG ile aynı, bilerek eksik): Temizlik sim'de hiç ilerlemez,
   *         Servis vekil okunur → bu satır gerçek etkinin ALT sınırıdır. */
  hUYGF: {
    ad: 'hUYGF',
    ne: 'UYGULANAN: economy.config.ts`in GERÇEK goals.incomeBonusTotal`i (kalıcı çarpan)',
    birim: 'açık/kapalı',
    taban: 0,
    dozlar: [0, 1],
    odemesiz: true,
    fabrika: () => null,
    carpanFabrika: (v) => {
      if (v <= 0) return null;
      return () => {
        const akis = kademeAkisi();
        let acik = 0;
        return (d) => {
          acik += akis(d).length;
          return 1 + (cfg.goals.incomeBonusTotal * acik) / TOPLAM_KADEME;
        };
      };
    },
    yaz: (v) =>
      v <= 0
        ? 'kapalı'
        : `${TOPLAM_KADEME} kademe · tam koleksiyonda +%${(cfg.goals.incomeBonusTotal * 100).toFixed(0)} · ` +
          `kademe başına +%${((cfg.goals.incomeBonusTotal * 100) / TOPLAM_KADEME).toFixed(2)}`,
  },
};
