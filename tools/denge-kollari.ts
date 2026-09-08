/**
 * denge-kollari.ts — D1 turunun VARYANT KATMANI (D-084 varyant kapısı).
 *
 * NEDEN AYRI DOSYA: `economy.config.ts`'e dokunan bir denge değişikliği, raporun §Bulgular
 * tablosunda o kolun SAYI SATIRI olmadan yapılamaz. Yani kolları önce ölçmek, ölçerken de
 * config'e KALICI yazmamak gerekiyor. Bu modül kolları çalışma anında uygular ve geri alır;
 * `economy.config.ts` dosyası tur boyunca DEĞİŞMEZ (git diff'i temiz kalır).
 *
 * SORU (D-086 Bulgu 7): model gerçeğe yaklaşınca Normal profilde 20 dk'yı aşan alım 2 → 6 oldu
 * (en uzun 43,4 dk → `servis L6`). Ölçüt mü bayat, eğri mi pahalı — düzeltilecekse hangi
 * kaldıraçtan?
 *
 * KOLLARIN OKUNMA BİÇİMİ — doz TAHMİN EDİLMEZ, ÇÖZÜLÜR. Her kol tek bir skaler "doz" ile
 * parametrelenir ve tarayıcı, ihlali hedefe indiren EN KÜÇÜK dozu bulur. Böylece karar paketi
 * "L6'yı 5500 yapalım mı?" gibi uydurma bir sayıyla değil, "bu kol ölçütü ancak %X indirimle
 * karşılıyor" cümlesiyle gelir.
 *
 * SAVER MODELİ — ÖNEMLİ SINIR: sim'in oyuncusu darboğaz kalemi için BİRİKTİRİR (trySpend erken
 * döner), yani bir boşluğu kısaltmanın yalnız iki yolu vardır: (a) beklenen şeyin fiyatı düşsün
 * (f-kolları · b1), (b) bekleme penceresindeki GELİR artsın (g-kolları). "Araya alınacak yeni
 * ucuz kalem koymak" bu modelde boşluğu KAPATMAZ — bu yüzden derinlik kolu ölçülmüyor; ölçülse
 * yapısal olarak sıfır çıkardı (C5 Bulgu 4'ün k4'ü gibi).
 */
import { economyConfig as C } from '../src/config/economy.config.ts';

/* ── Dokunulan alanların anlık görüntüsü. Kol uygulamadan ÖNCE geri yüklenir; böylece kollar
 *    birbirinin üstüne binmez (C5'te `hepsi` kolunun öğrettiği şey: kollar bağımsız değildir,
 *    o yüzden birleşim AYRI bir kol olarak ölçülür, kazara oluşmaz). */
type Yazilabilir = {
  servisCosts: number[];
  servisMax: number;
  servisOut: number;
  tostShare: number[];
  padCosts: Map<string, number>;
  garsonHiz: number[];
  garsonHizUcret: number[];
  garsonTepsiUcret: number[];
  quests: unknown[];
  tipBase: number;
};

const cfg = C as unknown as {
  service: {
    upgrade: { costsByLevel: number[]; maxLevel: number; outputMult: number };
    tostShareByLevel: number[];
  };
  pads: { id: string; cost: number }[];
  waiter: { speedUpgrades: { speeds: number[]; costs: number[] }; trayUpgrades: { costs: number[] } };
  quests: { id: string; title: string; target: unknown; reward?: number }[];
  tables: { tipBase: number };
};

function anlikGoruntu(): Yazilabilir {
  return {
    servisCosts: [...cfg.service.upgrade.costsByLevel],
    servisMax: cfg.service.upgrade.maxLevel,
    servisOut: cfg.service.upgrade.outputMult,
    tostShare: [...cfg.service.tostShareByLevel],
    padCosts: new Map(cfg.pads.map((p) => [p.id, p.cost])),
    garsonHiz: [...cfg.waiter.speedUpgrades.speeds],
    garsonHizUcret: [...cfg.waiter.speedUpgrades.costs],
    garsonTepsiUcret: [...cfg.waiter.trayUpgrades.costs],
    quests: [...cfg.quests],
    tipBase: cfg.tables.tipBase,
  };
}

const TABAN = anlikGoruntu();

/** Config'i turun başındaki hâline döndürür. Her kol uygulamasından ÖNCE çağrılır. */
export function geriAl(): void {
  cfg.service.upgrade.costsByLevel = [...TABAN.servisCosts];
  cfg.service.upgrade.maxLevel = TABAN.servisMax;
  cfg.service.upgrade.outputMult = TABAN.servisOut;
  cfg.service.tostShareByLevel = [...TABAN.tostShare];
  for (const p of cfg.pads) p.cost = TABAN.padCosts.get(p.id)!;
  cfg.waiter.speedUpgrades.speeds = [...TABAN.garsonHiz];
  cfg.waiter.speedUpgrades.costs = [...TABAN.garsonHizUcret];
  cfg.waiter.trayUpgrades.costs = [...TABAN.garsonTepsiUcret];
  cfg.quests = [...TABAN.quests] as typeof cfg.quests;
  cfg.tables.tipBase = TABAN.tipBase;
}

/** D-086 Bulgu 7'nin listesi: Normal profilde 20 dk'yı aşan ALTI alımın pad olanları. */
export const ASAN_PADLER = ['z2table4', 'zone3', 'z3table3', 'waiter3'] as const;

/** Garson SONRASI (otomasyondan sonraki) tüm omurga pad'leri — f3'ün tektip indirim alanı. */
function garsonSonrasiPadler(): string[] {
  const i = cfg.pads.findIndex((p) => p.id === 'waiter');
  return cfg.pads.slice(i + 1).filter((p) => p.cost > 0).map((p) => p.id);
}

const padCarp = (idler: readonly string[], p: number): void => {
  for (const pad of cfg.pads) {
    if (idler.includes(pad.id)) pad.cost = Math.max(1, Math.round((TABAN.padCosts.get(pad.id)! * p) / 5) * 5);
  }
};

export interface DengeKol {
  ad: string;
  ne: string;
  /** Doz birimi — rapor kolonunda başlık olur. */
  birim: string;
  /** "Değişiklik yok" dozu; tarama buradan uzaklaşarak ilerler. */
  taban: number;
  /** Taranacak dozlar, TABANA en yakından en uzağa. İlk hedefi tutan kazanır (en küçük müdahale). */
  dozlar: number[];
  uygula(p: number): void;
  /** Dozun insan diliyle karşılığı (rapor hücresi). */
  yaz(p: number): string;
  /** Bu kol `m1` MODEL kolu açıkken mi ölçülüyor? (Bkz. m1 kolunun gerekçesi.) */
  m1?: boolean;
  /** Kolun ATIL kalması BEKLENEN sonuçtur (bulgunun kendisi). Damga farkı değil AYNILIĞI arar. */
  atilBeklenir?: boolean;
}

/** ₺ ızgarası: %5'lik adımlarla %60'a kadar indirim (1.00 = dokunma). */
const INDIRIM = Array.from({ length: 13 }, (_, i) => Number((1 - i * 0.05).toFixed(2)));

export const DENGE_KOLLARI: Record<string, DengeKol> = {
  /* ── m1: DENGE DEĞİL MODEL kolu; ama g-kollarının kapısı olduğu için burada ölçülür.
   *    Sim'in oyuncusu garson tepsisini/hızını YALNIZ görev hattı isteyince alıyordu; hat
   *    `tepsi t2`de bitiyor, üçüncü kademe (₺2.500 → tepsi 4) hiçbir koşuda satın alınmıyordu.
   *    Oysa 8 masadan sonra bağlayıcı kol HEP taşıma ve o kademe oyunda karakter panelinden
   *    alınabiliyor. Kural, servis merdiveni ve bulaşıkçı için zaten yazılı olanın aynısı:
   *    darboğaz olan kolu yükselt. Bu kol açılmadan "taşıma tavanı" (g1) ölçülemez — dozu ne
   *    olursa olsun kimse satın almadığı için sonuç yapısal olarak SIFIR çıkar. */
  m1: {
    ad: 'm1',
    ne: 'MODEL: taşıma darboğazken oyuncu garson merdivenini alır (config DEĞİŞMEZ)',
    birim: 'açık/kapalı',
    taban: 0,
    dozlar: [0, 1],
    m1: true,
    atilBeklenir: true,
    uygula() { /* config'e dokunmaz — kol `kolaGec` içinde m1 bayrağını açar */ },
    yaz(p) { return p >= 1 ? 'm1 AÇIK (config değişmedi)' : 'm1 kapalı'; },
  },

  /* ── f-KOLLARI: beklenen şeyin FİYATI düşer.
   *    Karşı basınç: `feedback_economy_pacing_offline` — "garson sonrası ÖLÇÜLÜ PAHALI". */
  f1: {
    ad: 'f1',
    ne: 'servis merdiveninin son iki basamağı (L5 2.400₺ · L6 9.000₺) ucuzlar',
    birim: 'çarpan',
    taban: 1,
    dozlar: INDIRIM,
    uygula(p) {
      const c = [...TABAN.servisCosts];
      c[4] = Math.round((c[4] * p) / 50) * 50;
      c[5] = Math.round((c[5] * p) / 50) * 50;
      cfg.service.upgrade.costsByLevel = c;
    },
    yaz(p) {
      const c = cfg.service.upgrade.costsByLevel;
      return `×${p.toFixed(2)} → L5 ${c[4]} · L6 ${c[5]}`;
    },
  },

  f2: {
    ad: 'f2',
    ne: '20 dk`yı aşan DÖRT pad ucuzlar (z2table4 · zone3 · z3table3 · waiter3)',
    birim: 'çarpan',
    taban: 1,
    dozlar: INDIRIM,
    uygula(p) { padCarp(ASAN_PADLER, p); },
    yaz(p) {
      const g = (id: string) => cfg.pads.find((x) => x.id === id)!.cost;
      return `×${p.toFixed(2)} → ${ASAN_PADLER.map(g).join('/')}`;
    },
  },

  f3: {
    ad: 'f3',
    ne: 'garson SONRASI tüm eğri tektip ucuzlar (pad`ler + servis L4-L6)',
    birim: 'çarpan',
    taban: 1,
    dozlar: INDIRIM,
    uygula(p) {
      padCarp(garsonSonrasiPadler(), p);
      const c = [...TABAN.servisCosts];
      for (let i = 3; i < c.length; i++) c[i] = Math.round((c[i] * p) / 50) * 50;
      cfg.service.upgrade.costsByLevel = c;
    },
    yaz(p) {
      const c = cfg.service.upgrade.costsByLevel;
      return `×${p.toFixed(2)} → servis ${c.slice(3).join('/')} · zone3 ${cfg.pads.find((x) => x.id === 'zone3')!.cost}`;
    },
  },

  f4: {
    ad: 'f4',
    ne: 'CERRAHİ: yalnız 20 dk`yı aşan ALTI basamak ucuzlar (servis L5-L6 + dört pad)',
    birim: 'çarpan',
    taban: 1,
    dozlar: INDIRIM,
    /* f1 tek başına 4'ün, f2 tek başına 2'nin altına inemiyor: biri servis basamaklarını,
     * öteki pad'leri kısıyor ve KALAN öbür türden ihlal ayakta duruyor. Bu kol ikisini AYNI
     * anda ve YALNIZ ihlal eden kalemlerde uygular — f3'ün tektip indiriminin cerrahi karşıtı.
     * Sorusu net: zinciri kısaltmadan ölçüt tutar mı? */
    uygula(p) {
      padCarp(ASAN_PADLER, p);
      const c = [...TABAN.servisCosts];
      c[4] = Math.round((c[4] * p) / 50) * 50;
      c[5] = Math.round((c[5] * p) / 50) * 50;
      cfg.service.upgrade.costsByLevel = c;
    },
    yaz(p) {
      const c = cfg.service.upgrade.costsByLevel;
      const g = (id: string) => cfg.pads.find((x) => x.id === id)!.cost;
      return `×${p.toFixed(2)} → L5 ${c[4]}/L6 ${c[5]} · pad ${ASAN_PADLER.map(g).join('/')}`;
    },
  },

  /* ── g-KOLLARI: bekleme penceresindeki GELİR artar (fiyata dokunmaz).
   *    Bugün geç oyunda bağlayıcı kol TAŞIMA; yani gelir iki yoldan büyür: tavanı aç (g1)
   *    ya da müşteri başına ₺'yi büyüt (g2 — `feedback_economy_throughput`'un onayladığı yol). */
  g1: {
    ad: 'g1',
    ne: 'TAŞIMA tavanı: görev hattına eksik taşıyıcı kademeleri eklenir',
    birim: '+kademe',
    taban: 0,
    dozlar: [0, 1, 2, 3],
    /* NEDEN GÖREV HATTINDAN, "akıllı oyuncu"dan değil (ölçülerek öğrenildi — bkz. m1 kolu):
     * sim'in oyuncusu görev hattını takip eder, serbest oyun bloğu hat bitmeden neredeyse hiç
     * çalışmaz. Yani taşıyıcı merdiveninin hatta OLMAYAN kademesi hiçbir koşuda satın alınmaz.
     * Bugünkü hat `waiterTray t2`de (tepsi 3) bitiyor; ÜÇÜNCÜ kademe (₺2.500 → tepsi 4) hattın
     * hiçbir yerinde yok. Oysa `q_waiter3`in kendi yorumu "arz tavana dayanınca darboğaz
     * TAŞIMAYA geçer" diyor — hat darboğazı adlandırıyor ama onu açan kademeyi istemiyor.
     * (ÜÇ KOL tablosunun 20-masa satırı da `waiterTray: 3` varsayıyor; zincir onu teslim etmiyor.)
     * Kademeler `q_z1allL4` ile `q_stationMax` ARASINA girer — 43,4 dk'lık boşluğun tam önüne. */
    uygula(n) {
      if (n <= 0) return;
      const tepsi = [...TABAN.garsonTepsiUcret];
      if (n >= 2) tepsi.push(5000);                       // 4. kademe: tepsi 5
      cfg.waiter.trayUpgrades.costs = tepsi;
      if (n >= 3) {                                        // hız merdivenine 3. kademe
        cfg.waiter.speedUpgrades.speeds = [...TABAN.garsonHiz, 2.5];
        cfg.waiter.speedUpgrades.costs = [...TABAN.garsonHizUcret, 1200];
      }
      const yeni: typeof cfg.quests = [
        { id: 'q_waiterTray3', title: "Garsonun tepsisini 4'e çıkar", target: { type: 'waiterTray', tier: 3 }, reward: 500 },
      ];
      if (n >= 2) yeni.push({ id: 'q_waiterTray4', title: "Garsonun tepsisini 5'e çıkar", target: { type: 'waiterTray', tier: 4 }, reward: 700 });
      if (n >= 3) yeni.push({ id: 'q_waiterL3', title: 'Garsonu daha da hızlandır', target: { type: 'waiterSpeed', tier: 2 }, reward: 400 });
      const q = [...TABAN.quests] as typeof cfg.quests;
      const i = q.findIndex((x) => x.id === 'q_stationMax');
      q.splice(i, 0, ...yeni);
      cfg.quests = q;
    },
    yaz(n) {
      if (n <= 0) return 'kademe eklenmedi';
      return `tepsi ₺${cfg.waiter.trayUpgrades.costs.join('/')} · hiz ${cfg.waiter.speedUpgrades.speeds.join('→')}`;
    },
  },

  g2: {
    ad: 'g2',
    ne: 'masa bahşişi (₺/müşteri) büyür — tipBase',
    birim: 'tipBase',
    taban: 2,
    dozlar: [2, 2.5, 3, 3.5, 4, 5, 6, 8],
    uygula(p) { cfg.tables.tipBase = p; },
    yaz(p) { return `tipBase ${TABAN.tipBase} → ${p}`; },
  },

  /* ── b-KOLU: fiyat da gelir de değişmez; PAHALI BASAMAK BÖLÜNÜR.
   *    "Aynı toplam ₺, aynı toplam çıktı, daha çok basamak" — `pacing_offline`'ın "ölçülü pahalı"
   *    kuralını bozmadan tek bir uzun beklemeyi ikiye/üçe böler.
   *    BUGÜNKÜ ŞEMANIN SINIRI: çıktı çarpanı basamak-başı değil MERDİVEN-GENELİdir, o yüzden
   *    tavanı korumak için çarpan seyreltilir ve bu ERKEN OYUNU da yavaşlatır. Erken oyuna
   *    dokunmadan bölmek `outputMultByLevel` alanı ister — ayrı kalem. */
  b1: {
    ad: 'b1',
    ne: 'servis merdiveni 6 → 6+n basamak; L4+ TOPLAM ₺ ve TOPLAM çıktı korunur',
    birim: '+basamak',
    taban: 0,
    dozlar: [0, 1, 2, 3],
    uygula(n) {
      if (n <= 0) return;
      const erken = TABAN.servisCosts.slice(0, 3);           // L1-L3 dokunulmaz (20/30/45)
      const ustToplam = TABAN.servisCosts.slice(3).reduce((a, b) => a + b, 0); // 12.200 ₺
      const adet = 3 + n;
      // Geometrik dağılım (bugünkü üst yarının oranı ~1.9'a yakın), toplamı ustToplam'a normalize.
      const r = 1.9;
      const agirlik = Array.from({ length: adet }, (_, i) => Math.pow(r, i));
      const top = agirlik.reduce((a, b) => a + b, 0);
      const ust = agirlik.map((w) => Math.round((ustToplam * w) / top / 50) * 50);
      ust[ust.length - 1] += ustToplam - ust.reduce((a, b) => a + b, 0); // yuvarlama artığı sona
      cfg.service.upgrade.costsByLevel = [...erken, ...ust];
      cfg.service.upgrade.maxLevel = TABAN.servisMax + n;
      // TOPLAM çıktı korunur: out^(yeniMax) = taban^(eskiMax)
      cfg.service.upgrade.outputMult = Math.pow(TABAN.servisOut, TABAN.servisMax / (TABAN.servisMax + n));
      // Tost payı tablosu yeni seviyeleri de kapsasın (son değer tekrarlanır).
      const ts = [...TABAN.tostShare];
      while (ts.length < TABAN.servisMax + n + 1) ts.push(ts[ts.length - 1]);
      cfg.service.tostShareByLevel = ts;
    },
    yaz(n) {
      if (n <= 0) return 'bölme yok';
      const c = cfg.service.upgrade.costsByLevel;
      return `L${cfg.service.upgrade.maxLevel} · ${c.slice(3).join('/')} · çarpan ${cfg.service.upgrade.outputMult.toFixed(3)}`;
    },
  },

  /* ── c1: KARMA. C5'in dersi "kollar bağımsız değildir" idi; o yüzden birleşim sonradan
   *    toplanmaz, KENDİ kolu olarak ölçülür. Buradaki soru: iki kaldıraç da HAFİF kalarak
   *    ölçütü tutabiliyor mu — yani zinciri f3/g2 kadar kısaltmadan? Bahşiş sabit tutulur
   *    (tipBase 3 = g2'nin ölçütü tutturamayan dozu), indirim taranır. */
  c1: {
    ad: 'c1',
    ne: 'KARMA: tipBase 2→3 SABİT + ihlal eden altı basamakta indirim (taranır)',
    birim: 'çarpan',
    taban: 1,
    dozlar: INDIRIM,
    uygula(p) {
      cfg.tables.tipBase = 3;
      DENGE_KOLLARI.f4.uygula(p);
    },
    yaz(p) {
      const c = cfg.service.upgrade.costsByLevel;
      return `tipBase 3 + ×${p.toFixed(2)} (L5 ${c[4]}/L6 ${c[5]})`;
    },
  },
};
