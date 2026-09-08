/**
 * olcum-bardak.ts — D-082'nin BARDAK KİLİDİNİ ölçer (Faz C4).
 *
 * Çalıştır:  npx tsx tools/olcum-bardak.ts > docs/olcum-bardak.txt
 *
 * NEDEN: C3 ölçümünün yan bulgusu (docs/kuyruk-raporu-c3.md §5): 4 masa · bulaşıkçı yok ·
 * oyuncu yokken karelerin %90,8'inde temiz bardak SIFIR ve 15 dakikada yalnız 18 müşteri
 * oturuyor. Kullanıcı bunu tasarım gereği saymadı (D-082): *"oyuncu telefonu bıraktığında
 * mekânın tamamen durması istenmiyor"*. Karar verilmeden hiçbir denge sayısına dokunulmaz;
 * önce SAYI görülür (D-078/D-080/D-081 deseni).
 *
 * NASIL: ikinci bir model KURULMAZ; oyunun KENDİ `tick()`'i başsız koşturulur (tick-fingerprint
 * deseni: tohumlu Math.random + sahte localStorage), her kare bardak envanteri örneklenir.
 *
 * İKİ OYUNCU KİPİ — kilidin iki ucu ölçülür, arası kestirilmez:
 *   `park`      : oyuncu sokakta durur (AFK / telefon bırakılmış). İlgi bütçesi %0.
 *   `oyuncu`    : DİKKATLİ OYUNCU botu — elindeki ürünü bekleyen masaya dağıtır, gerisini bulaşık
 *                 döngüsüne verir (topla → yıka). İlgi bütçesi %100.
 * Arada kalan her şey "oyuncu ne kadar iyi oynadı" sorusudur ve bir bot yazıp onu ölçmek kendi
 * botumuzu ölçmek olurdu. Bu yüzden ALT SINIR (park) ile ÜST SINIR (oyuncu) ölçülür, karar
 * arasına verilir. `oyuncu` satırları bir denge sayısı değil, TAVAN göstergesidir.
 *
 * KORUNUM DENETİMİ: bardak kapalı bir sistemdir — temiz + hazır + tepsilerde + müşteri elinde +
 * masada kirli = havuz. Her kare toplanır; sapma varsa ölçüm değil KOD hatalıdır ve rapor bunu
 * söyler (ölçüm aracının kendi bekçisi).
 */
import { useGame, LAYOUT, servicePlace, streetAt } from '../src/game/store';
import { getNavGrid, activeSolids, hitsSolid, clampToOpenAreas, LAYOUT as L } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';
import { writeSave, defaultSave, type SaveData } from '../src/game/save';
import { dirtyTables, totalCupPool, WASH_QUEST_INDEX } from '../src/game/rules';
import { economyConfig as C, playerSpeedFor, trayCapacityFor, type WaiterUpgrades } from '../src/config/economy.config';
import { THE_SERVICE, MAX_SERVICES } from '../src/game/world';
import type { Vec3 } from '../src/game/types';

// --- Tohumlu rastgelelik (mulberry32) — olcum-kuyruk.ts / tick-fingerprint.ts ile AYNI.
function seedRandom(seed: number): void {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const g = globalThis as unknown as Record<string, unknown>;
if (!g.localStorage) {
  const mem: Record<string, string> = {};
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
}

const d2 = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const n1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');
const n2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '—');
const pct = (a: number, b: number) => (b === 0 ? '—' : `%${((100 * a) / b).toFixed(1)}`);

/** Pad zinciri TEK KAYNAKTAN (elle liste tutulmaz). */
const ZINCIR = C.pads.map((p) => p.id);
const zincireKadar = (son: string): string[] => {
  const i = ZINCIR.indexOf(son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return ZINCIR.slice(0, i + 1);
};

type Kip = 'park' | 'oyuncu';

interface Senaryo {
  ad: string;
  sonPad: string;
  stationLevel: number;
  tableLevel: number;
  waiterUpgrades: WaiterUpgrades;
  charTray: number;
  sure: number;
}

/**
 * Zincirin bardak açısından ANLAMLI durakları. Kirli bardak `q_wash` görevinden itibaren çıkar
 * (WASH_QUEST_INDEX) — o an mekân 2 masa · ocak L1 · garson YOK, yani kilit ta oradan başlayabilir.
 * B6 geç-oyun doygunluğu içindir (C3'te G4 %23,3 bardak darboğazı göstermişti).
 */
const SENARYOLAR: Senaryo[] = [
  { ad: 'B1 · 2 masa · L1 · garson yok  (bulaşık görevinin hemen ardı)', sonPad: 'table2', stationLevel: 1, tableLevel: 0,
    waiterUpgrades: { tray: 0, speed: 0, dishCarry: 0, dishSpeed: 0 }, charTray: 1, sure: 900 },
  { ad: 'B2 · 4 masa · L1 · 1 garson    (D-082 vakası = C3/G1)', sonPad: 'table4', stationLevel: 1, tableLevel: 0,
    waiterUpgrades: { tray: 0, speed: 0, dishCarry: 0, dishSpeed: 0 }, charTray: 1, sure: 900 },
  { ad: 'B3 · 7 masa · L2 · 1 garson    (bulaşıkçıdan HEMEN ÖNCE)', sonPad: 'z2table3', stationLevel: 2, tableLevel: 0,
    waiterUpgrades: { tray: 1, speed: 0, dishCarry: 0, dishSpeed: 0 }, charTray: 2, sure: 900 },
  { ad: 'B4 · 8 masa · L3 · 1 garson + BULAŞIKÇI', sonPad: 'z2table4', stationLevel: 3, tableLevel: 1,
    waiterUpgrades: { tray: 1, speed: 1, dishCarry: 1, dishSpeed: 1 }, charTray: 2, sure: 900 },
  { ad: 'B5 · 20 masa · L6 · 3 garson + bulaşıkçı (geç-oyun doygunluğu)', sonPad: 'z3table12', stationLevel: 6, tableLevel: 4,
    waiterUpgrades: { tray: 2, speed: 1, dishCarry: 2, dishSpeed: 1 }, charTray: 2, sure: 900 },
  // B6: "her şeyi satın aldım" hâli — bulaşıkçının hızı VE leğeni TAVANDA, garson tepsisi tavanda.
  // Soru: oyuncu parasını verdiğinde bulaşık tamamen otomatikleşiyor mu, yoksa geç oyunda yine
  // oyuncuya iş mi düşüyor? (Kullanıcı 2026-09-08: "bulaşığı ben yapmak istemiyorum, bir süre
  // sonra otomatize olmalı".)
  { ad: 'B6 · 20 masa · L6 · 3 garson + bulaşıkçı TAVAN YÜKSELTMELİ', sonPad: 'z3table12', stationLevel: 6, tableLevel: 4,
    waiterUpgrades: { tray: 3, speed: 1, dishCarry: 3, dishSpeed: 2 }, charTray: 2, sure: 900 },
];

interface Sonuc {
  senaryo: Senaryo;
  kip: Kip;
  varyant: Varyant;
  /** Varyantın temize döndürdüğü bardak (sızıntı + iade). */
  sizintiToplam: number;
  havuz: number;
  masaSayisi: number;
  garsonSayisi: number;
  bulasikci: boolean;
  kareToplam: number;
  /** Temiz bardak 0 olan kare. */
  kareSifir: number;
  /** İlk kez temiz bardak 0 olduğu an (sn) — NaN = hiç olmadı. */
  ilkSifir: number;
  /** En uzun kesintisiz "temiz 0" serisi (sn). */
  enUzunSifir: number;
  /** Son çeyrekte temiz bardak 0 olan kare oranı (kilidin KALICI mı olduğu). */
  sonCeyrekSifir: number;
  sonCeyrekKare: number;
  /** Bekleyen müşteri varken temiz bardak 0 olan kare (bardağın gerçekten ısırdığı an). */
  kareBekleyenVar: number;
  kareBekleyenVeSifir: number;
  oturan: number;
  servis: number;
  terk: number;
  /** Dakika kovalarında servis edilen müşteri. */
  dkServis: number[];
  dkOturan: number[];
  /** Dakika kovalarında ortalama temiz bardak / masadaki kirli / kirli masa. */
  dkTemiz: number[];
  dkKirli: number[];
  dkKirliMasa: number[];
  /** Yıkama olayları (bardak adedi). */
  yikananOyuncu: number;
  yikananBulasikci: number;
  /** Kirli masa (D-019 eşiği) istatistiği. */
  ortKirliMasa: number;
  enCokKirliMasa: number;
  kareHepsiKirli: number;
  /** Bitiş envanteri: bardaklar nerede kaldı. */
  son: Record<string, number>;
  /** Korunum sapması (kare başına |toplam − havuz| en büyüğü). 0 olmalı. */
  korunumSapma: number;
  /** Oyuncunun yürüdüğü toplam mesafe (`oyuncu` kipinde anlamlı). */
  yol: number;
  /** Senaryo boyunca masa/ocak seviyesi değişti mi (değişmemeli — ölçüm sabit rejimde). */
  rejimBozuldu: boolean;
}

function kur(sn: Senaryo, ekPadlar: string[] = []): void {
  const padsDone = [...zincireKadar(sn.sonPad), ...ekPadlar];
  const save: SaveData = {
    ...defaultSave(),
    wallet: '0',
    lifetime: '999999',
    padsDone,
    stationLevels: Array.from({ length: MAX_SERVICES }, (_, i) => (i === THE_SERVICE ? sn.stationLevel : 0)),
    tableLevels: LAYOUT.tables.map(() => sn.tableLevel),
    lavaboLevel: padsDone.includes('lavabo') ? 1 : 0,
    waiterUpgrades: { ...sn.waiterUpgrades },
    charUpgrades: { tray: sn.charTray, magnet: 0, speed: 0 },
    // Görev hattı BİTMİŞ sayılır: ödül parası/toast/kamera ölçüme karışmasın. (Kirli bardak
    // zaten WASH_QUEST_INDEX'ten sonra çıkar; bitmiş hat = kapı açık.)
    questIndex: C.quests.length,
  };
  writeSave(save);
  useGame.getState().init();
}

/** Oyuncunun taşıdığı toplam (ürün + kirli). */
function elde(s: ReturnType<typeof useGame.getState>): number {
  return s.tray + s.trayFood + s.carriedDirty + s.carriedDirtyFood;
}

/**
 * VARYANT — kararın üç kolunu (D-082 kapsamı) ölçmek için. Hiçbiri OYUN KODUNU DEĞİŞTİRMEZ;
 * hepsi dışarıdan, `tick` etrafından uygulanır. Böylece kontrol koşusu (varyantsız) taban
 * çıktının birebir aynısıdır ve karşılaştırma temiz kalır.
 *   havuz:N   → havuz N katına çıkar (poolBase/poolPerLevel'ın karşılığı)
 *   bulasikci → bulaşıkçı ZİNCİRDE ÖNE alınmış gibi bu senaryoda hazır bulunur
 *   sizinti:R → dakikada R kirli bardak kendiliğinden temize döner (minimum sızıntı)
 *   iade:P    → müşterilerin P oranı bardağını kendi geri götürür (kirli hiç doğmaz)
 */
interface Varyant {
  havuzKat?: number;
  bulasikci?: boolean;
  /** `idleDishCarry` bu koşu boyunca bu değere çekilir (0 = boşta bulaşık KAPALI). */
  garsonBulasik?: number;
  sizintiDk?: number;
  iadeOran?: number;
  ad: string;
}
const VARYANT_YOK: Varyant = { ad: 'taban' };

function varyantOku(spec: string | undefined): Varyant {
  if (!spec) return VARYANT_YOK;
  const v: Varyant = { ad: spec };
  for (const parca of spec.split(',')) {
    const [k, deger] = parca.split(':');
    if (k === 'havuz') v.havuzKat = Number(deger);
    else if (k === 'bulasikci') v.bulasikci = true;
    else if (k === 'garson') v.garsonBulasik = Number(deger);
    else if (k === 'sizinti') v.sizintiDk = Number(deger);
    else if (k === 'iade') v.iadeOran = Number(deger);
    else throw new Error(`bilinmeyen varyant: ${parca}`);
  }
  return v;
}

function kosu(sn: Senaryo, kip: Kip, dt: number, vr: Varyant = VARYANT_YOK): Sonuc {
  let eskiPadAlani = -1;
  // `idleDishCarry` geçici olarak değiştirilir; koşunun SONUNDA geri alınır (bkz. bulaşıkçı
  // varyantındaki tuzak: erken geri alma varyantı sessizce etkisiz bırakıyordu).
  const wCfg = C.waiter as { idleDishCarry: number };
  const eskiIdleDish = wCfg.idleDishCarry;
  if (vr.garsonBulasik !== undefined) wCfg.idleDishCarry = vr.garsonBulasik;
  if (vr.bulasikci) {
    // "Bulaşıkçı pad'i zincirde ÖNE alınsaydı": pad'in ALANI geçici olarak 1. salona çekilir ve
    // pad tamamlanmış sayılır. `world` store'da tutulmaz — her tick `padsDone`'dan TÜRETİLİR
    // (deriveWorld), o yüzden dünyayı dışarıdan yamamak işe yaramaz; tek doğru kapı pad listesi.
    // Config değişikliği GEÇİCİDİR ve koşu biter bitmez geri alınır (aşağıda).
    const pad = C.pads.find((p) => p.id === 'dishwasher') as { area: number } | undefined;
    if (!pad) throw new Error('dishwasher pad bulunamadı');
    eskiPadAlani = pad.area;
    pad.area = 0;
    kur(sn, ['dishwasher']);
    // GERİ ALMA KOŞUNUN SONUNDA: `world` her karede `padsDone`'dan YENİDEN türetilir, yani config
    // koşu boyunca değişik kalmalı. (İlk denemede kur()'dan hemen sonra geri alınmıştı ve varyant
    // sessizce etkisiz kaldı: B2 satırı kontrolle BİREBİR aynı çıkmıştı — sahte "fark yok" sonucu.)
  } else kur(sn);
  const s0 = useGame.getState();
  const ekBardak = vr.havuzKat && vr.havuzKat > 1
    ? Math.round(totalCupPool(s0.areasOpen, s0.stationLevels) * (vr.havuzKat - 1))
    : 0;
  if (ekBardak > 0) useGame.setState({ cleanCups: s0.cleanCups + ekBardak });
  const place = servicePlace(s0.areasOpen);
  // PARK kipi sokakta durur (AFK). OYUNCU kipi mekânın İÇİNDE, bulaşık noktasında başlar:
  // sokak açık alanların DIŞINDADIR ve `clampToOpenAreas` oyuncuyu orada tutar — dışarıda
  // başlatılan bot hiç içeri giremiyordu (ilk koşuda tam bu oldu: sayılar park kipiyle
  // BİREBİR aynı çıktı, yani "ölçüm" hiçbir şey ölçmüyordu).
  const park = streetAt(s0.areasOpen);
  useGame.setState({
    player: kip === 'oyuncu'
      ? ([place.dish[0], 0.6, place.dish[2] + 1] as Vec3)
      : ([park[0], 0.6, park[2] + 3] as Vec3),
  });
  const tick = s0.tick;
  const navGrid = getNavGrid(s0.tables, s0.areasOpen);
  const katiEngeller = activeSolids(s0.tables, s0.areasOpen);
  const hiz = playerSpeedFor(s0.charUpgrades.speed);
  const trayCap = trayCapacityFor(s0.charUpgrades.tray);
  const havuz = totalCupPool(s0.areasOpen, s0.stationLevels) + ekBardak;
  const masaSayisi = s0.tables;
  const tableLevels = [...s0.tableLevels];

  // --- Oyuncu botunun rotası: bulaşıkçının KURALI, oyuncunun bacağı. Yol her `YOL_TAZELE`
  // saniyede bir BFS ile tazelenir (her karede BFS ölçümü saatlerce sürerdi) ve ARA NOKTALARIN
  // TAMAMI izlenir. TAKILMA TESPİTİ şart: nav ızgarası `actorRadius`, oyuncu çarpışması ise
  // `playerRadius` + `activeSolids` ile hesaplanır — ızgaraya göre açık bir hücre oyuncuya kapalı
  // olabiliyor ve oyuncu masaya dayanıp süresiz itiyordu (ilk koşuda tam bu oldu). Ulaşılamayan
  // kirli bir süre KARA LİSTEYE alınır: gerçek bir oyuncu da erişemediği bardağı bırakır.
  const YOL_TAZELE = 0.4;
  const TAKILMA_PENCERE = 0.6; // sn
  const TAKILMA_ESIK = 0.15; // br
  const KARA_LISTE_SURE = 45; // sn
  let yolT = 0;
  let rota: [number, number][] = [];
  let hedefKilit: 'topla' | 'yika' | 'servis' | 'bekle' = 'bekle';
  let hedefDish = -1;
  const karaListe = new Map<number, number>(); // dish id → hangi ana kadar yasak
  let takilmaSayac = 0;
  let takilmaPos: Vec3 = [0, 0, 0];
  let takilmaAdim = 0;
  // KURTULMA: sıkışınca kısa süre rastgele bir yöne bas (insan da öyle yapar). Rastgeleliği
  // oyunun tohumlu `Math.random` akışından ALMAZ — yoksa botun sıkışması oyunun zarını kaydırır
  // ve iki kip karşılaştırılamaz hâle gelirdi. Bu yüzden ayrı, yerel bir üreteç.
  let botSeed = 1234567;
  const botRnd = () => {
    botSeed = (botSeed * 1103515245 + 12345) & 0x7fffffff;
    return botSeed / 0x7fffffff;
  };
  let kacisT = 0;
  let kacisYon: [number, number] = [0, 0];
  let sizintiBirikim = 0;
  let sizintiToplam = 0;

  const dkServis: number[] = [];
  const dkOturan: number[] = [];
  const dkTemizTop: number[] = [];
  const dkKirliTop: number[] = [];
  const dkKirliMasaTop: number[] = [];
  const dkKare: number[] = [];

  const oncekiDurum = new Map<number, string>();
  let oturan = 0;
  let servis = 0;
  let terk = 0;
  let kareToplam = 0;
  let kareSifir = 0;
  let ilkSifir = NaN;
  let enUzunSifir = 0;
  let sifirSeri = 0;
  let sonCeyrekSifir = 0;
  let sonCeyrekKare = 0;
  let kareBekleyenVar = 0;
  let kareBekleyenVeSifir = 0;
  let kirliMasaTop = 0;
  let enCokKirliMasa = 0;
  let kareHepsiKirli = 0;
  let korunumSapma = 0;
  let yol = 0;
  let yikananOyuncu = 0;
  let yikananBulasikci = 0;
  let oncekiYikanan = s0.stats.dishesWashed;
  let oncekiDwYuk = 0;
  let rejimBozuldu = false;

  const adim = Math.round(sn.sure / dt);
  const sonCeyrekBas = Math.floor(adim * 0.75);
  let t = 0;

  for (let k = 0; k < adim; k++) {
    // --- Oyuncu girdisi (oyuncu kipi): hedefi seç, yolu tazele, yönü inputKeyboard'a yaz.
    if (kip === 'oyuncu') {
      const s = useGame.getState();
      const tasiyor = elde(s);
      const alinabilir = s.dishes.filter((d) => (karaListe.get(d.id) ?? 0) <= t);
      // SERVİS ÖNCE: tepsi PAYLAŞIMLI (ürün + kirli aynı kapasiteyi yer). Ocağın yanından geçerken
      // hazır çay tepsiye kendiliğinden giriyor; bunu dağıtmayan bir bot tepsisi ürün dolu takılıp
      // bir daha kirli toplayamıyordu (ilk koşuda tam bu oldu: 17 yıkamadan sonra süresiz kilit).
      // Bu yüzden kip "yalnız yıkayan" değil, DİKKATLİ OYUNCU: elindekini dağıtır, sonra bulaşığa.
      let servisHedefi: { pos: readonly number[] } | null = null;
      if (s.tray > 0 || s.trayFood > 0) {
        let ed = Infinity;
        for (const n of s.npcs) {
          if (n.state !== 'waitingForTea') continue;
          if (n.product === 'tost' ? s.trayFood <= 0 : s.tray <= 0) continue;
          const masa = LAYOUT.tables[n.tableIndex].table;
          const dd = d2(s.player, masa);
          if (dd < ed) { ed = dd; servisHedefi = { pos: masa }; }
        }
      }
      const yikamaVakti = !servisHedefi && (tasiyor >= trayCap || (tasiyor > 0 && alinabilir.length === 0));
      const yeniKilit: 'topla' | 'yika' | 'servis' | 'bekle' = servisHedefi
        ? 'servis'
        : yikamaVakti
          ? 'yika'
          : alinabilir.length > 0
            ? 'topla'
            : 'bekle';

      // TAKILMA: pencere boyunca yer değiştirme eşiğin altındaysa hedef ulaşılamaz sayılır.
      takilmaAdim += 1;
      if (takilmaAdim * dt >= TAKILMA_PENCERE) {
        const gitti = d2(takilmaPos, s.player);
        if (gitti < TAKILMA_ESIK && hedefKilit !== 'bekle') {
          if (hedefKilit === 'topla' && hedefDish >= 0) karaListe.set(hedefDish, t + KARA_LISTE_SURE);
          yolT = 0;
          rota = [];
          takilmaSayac += 1;
          const a = botRnd() * Math.PI * 2;
          kacisYon = [Math.cos(a), Math.sin(a)];
          kacisT = 0.8;
        }
        takilmaPos = [...s.player] as Vec3;
        takilmaAdim = 0;
      }

      yolT -= dt;
      const hedefKayboldu = hedefKilit === 'topla' && !s.dishes.some((d) => d.id === hedefDish);
      if (yeniKilit !== hedefKilit || hedefKayboldu || yolT <= 0 || rota.length === 0) {
        hedefKilit = yeniKilit;
        yolT = YOL_TAZELE;
        let hedef: readonly number[] | null = null;
        let reach = C.cups.collectRadius * 0.7;
        if (yeniKilit === 'servis') {
          hedef = servisHedefi!.pos;
          reach = C.serving.serveRadius * 0.7;
          hedefDish = -1;
        } else if (yeniKilit === 'yika') {
          hedef = place.dish;
          reach = C.cups.washRadius * 0.7;
          hedefDish = -1;
        } else if (yeniKilit === 'topla') {
          let en = alinabilir[0];
          let ed = Infinity;
          for (const d of alinabilir) {
            const dd = d2(s.player, d.pos);
            if (dd < ed) { ed = dd; en = d; }
          }
          hedef = en.pos;
          hedefDish = en.id;
        } else hedefDish = -1;
        rota = [];
        if (hedef) {
          const p = findNavPath(navGrid, s.player, hedef[0], hedef[2], reach);
          rota = p && p.length ? p : [[hedef[0], hedef[2]]];
        }
      }
      // Ara noktaları sırayla izle (yakınına gelince bir sonrakine geç).
      while (rota.length > 1 && d2(s.player, [rota[0][0], 0, rota[0][1]]) < 0.35) rota.shift();
      if (kacisT > 0) {
        kacisT -= dt;
        useGame.getState().setKeyboardInput(kacisYon[0], kacisYon[1]);
      } else if (rota.length) {
        const dx = rota[0][0] - s.player[0];
        const dz = rota[0][1] - s.player[2];
        const d = Math.hypot(dx, dz);
        if (d < 1e-3) useGame.getState().setKeyboardInput(0, 0);
        else {
          // KAYARAK İLERLE: rota ızgarası `actorRadius` (0,28) ve SANDALYESİZ kurulur; oyuncu ise
          // `playerRadius` (0,47) ve sandalyelerle çarpışır (`navSolids` ≠ `activeSolids`). Yani
          // personelin geçtiği boşluktan oyuncu geçemeyebilir. Gerçek oyuncu bu durumda kenardan
          // dolanır; bot da öyle yapar: istenen yönü bulamazsa ±30/60/90° adayları denenir.
          const ang0 = Math.atan2(dz / d, dx / d);
          const adim = hiz * dt;
          let secildi = false;
          for (const sap of [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57]) {
            const a = ang0 + sap;
            const ux = Math.cos(a);
            const uz = Math.sin(a);
            const [tx, tz] = clampToOpenAreas(s.player[0] + ux * adim, s.player[2] + uz * adim, s.areasOpen);
            if (!hitsSolid(tx, tz, katiEngeller, L.playerRadius)) {
              useGame.getState().setKeyboardInput(ux, uz);
              secildi = true;
              break;
            }
          }
          if (!secildi) useGame.getState().setKeyboardInput(dx / d, dz / d);
        }
      } else useGame.getState().setKeyboardInput(0, 0);
    }

    if (process.env.BARDAK_DBG && kip === 'oyuncu' && k % 300 === 0) {
      const sd = useGame.getState();
      console.error(`DBG t=${t.toFixed(0)} kilit=${hedefKilit} dishes=${sd.dishes.length} rota=${rota.length} pos=${sd.player.map((x) => x.toFixed(1))} elde=${elde(sd)}/${trayCap} yik=${sd.stats.dishesWashed} takilma=${takilmaSayac}`);
    }
    const oncePos = [...useGame.getState().player] as Vec3;
    const dishOnce = useGame.getState().dishes;
    tick(dt);

    // --- VARYANT KOLLARI (tick'ten SONRA, oyun koduna dokunmadan)
    if (vr.iadeOran || vr.sizintiDk) {
      const sv = useGame.getState();
      let dishesYeni = sv.dishes;
      let iadeEdilen = 0;
      if (vr.iadeOran) {
        // "Müşterinin P oranı bardağını kendi geri götürür": bu karede DOĞAN kirliler süzülür.
        const eskiIds = new Set(dishOnce.map((d) => d.id));
        dishesYeni = dishesYeni.filter((d) => {
          if (eskiIds.has(d.id)) return true;
          if (botRnd() < vr.iadeOran!) { iadeEdilen += 1; return false; }
          return true;
        });
      }
      if (vr.sizintiDk) {
        // "Minimum sızıntı": dakikada R kirli kendiliğinden temize döner (en eskiden başlayarak).
        sizintiBirikim += (vr.sizintiDk / 60) * dt;
        while (sizintiBirikim >= 1 && dishesYeni.length > 0) {
          dishesYeni = dishesYeni.slice(1);
          iadeEdilen += 1;
          sizintiBirikim -= 1;
        }
      }
      if (iadeEdilen > 0) {
        // Korunum bozulmaz: masadan kalkan bardak TEMİZ havuza yazılır.
        useGame.setState({ dishes: dishesYeni, cleanCups: sv.cleanCups + iadeEdilen });
        sizintiToplam += iadeEdilen;
      }
    }
    t += dt;
    kareToplam += 1;
    const s = useGame.getState();
    yol += d2(oncePos, s.player);

    if (s.tables !== masaSayisi || s.stationLevels[THE_SERVICE] !== sn.stationLevel) rejimBozuldu = true;

    // --- Bardak envanteri + korunum
    const musteriElinde = s.npcs.filter((n) => n.state === 'drinking').length;
    const garsonda = s.waiters.reduce((a, w) => a + w.tray + w.trayFood + (w.dirtyCarry ?? 0) + (w.dirtyCarryFood ?? 0), 0);
    const dwDa = s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0;
    const toplam =
      s.cleanCups + s.ready.tea + s.ready.tost + garsonda + elde(s) + musteriElinde + s.dishes.length + dwDa;
    korunumSapma = Math.max(korunumSapma, Math.abs(toplam - havuz));

    // --- Kilit sayaçları
    if (s.cleanCups === 0) {
      kareSifir += 1;
      sifirSeri += 1;
      enUzunSifir = Math.max(enUzunSifir, sifirSeri * dt);
      if (Number.isNaN(ilkSifir)) ilkSifir = t;
    } else sifirSeri = 0;
    if (k >= sonCeyrekBas) {
      sonCeyrekKare += 1;
      if (s.cleanCups === 0) sonCeyrekSifir += 1;
    }
    const bekleyen = s.npcs.filter((n) => n.state === 'waitingForTea').length;
    if (bekleyen > 0) {
      kareBekleyenVar += 1;
      if (s.cleanCups === 0 && s.ready.tea + s.ready.tost === 0) kareBekleyenVeSifir += 1;
    }

    // --- Kirli masa (D-019 eşiği)
    const kirliSet = dirtyTables(s.dishes, tableLevels);
    kirliMasaTop += kirliSet.size;
    enCokKirliMasa = Math.max(enCokKirliMasa, kirliSet.size);
    if (kirliSet.size >= masaSayisi) kareHepsiKirli += 1;

    // --- Yıkama olayları
    const yik = s.stats.dishesWashed;
    if (yik > oncekiYikanan) yikananOyuncu += yik - oncekiYikanan;
    oncekiYikanan = yik;
    if (s.dishwasher) {
      const dwYuk = s.dishwasher.tray + s.dishwasher.trayFood;
      if (dwYuk === 0 && oncekiDwYuk > 0) yikananBulasikci += oncekiDwYuk;
      oncekiDwYuk = dwYuk;
    }

    // --- Müşteri olayları
    const canli = new Set<number>();
    for (const n of s.npcs) {
      canli.add(n.id);
      const onc = oncekiDurum.get(n.id);
      if (n.state === 'waitingForTea' && onc !== 'waitingForTea') oturan += 1;
      if (onc === 'waitingForTea' && n.state === 'drinking') servis += 1;
      if (onc === 'waitingForTea' && n.state === 'leaving') terk += 1;
      oncekiDurum.set(n.id, n.state);
    }
    for (const id of [...oncekiDurum.keys()]) if (!canli.has(id)) oncekiDurum.delete(id);

    // --- Dakika kovaları
    const dk = Math.floor(t / 60);
    while (dkServis.length <= dk) {
      dkServis.push(0); dkOturan.push(0); dkTemizTop.push(0); dkKirliTop.push(0); dkKirliMasaTop.push(0); dkKare.push(0);
    }
    dkTemizTop[dk] += s.cleanCups;
    dkKirliTop[dk] += s.dishes.length;
    dkKirliMasaTop[dk] += kirliSet.size;
    dkKare[dk] += 1;
    dkServis[dk] = servis;
    dkOturan[dk] = oturan;
  }

  // Kovalar kümülatiften farka çevrilir.
  for (let i = dkServis.length - 1; i > 0; i--) {
    dkServis[i] -= dkServis[i - 1];
    dkOturan[i] -= dkOturan[i - 1];
  }

  wCfg.idleDishCarry = eskiIdleDish;
  if (eskiPadAlani >= 0) {
    (C.pads.find((p) => p.id === 'dishwasher') as { area: number }).area = eskiPadAlani;
  }
  const s = useGame.getState();
  return {
    senaryo: sn,
    kip,
    varyant: vr,
    sizintiToplam,
    havuz,
    masaSayisi,
    garsonSayisi: s.waiters.length,
    bulasikci: !!s.dishwasher,
    kareToplam,
    kareSifir,
    ilkSifir,
    enUzunSifir,
    sonCeyrekSifir,
    sonCeyrekKare,
    kareBekleyenVar,
    kareBekleyenVeSifir,
    oturan,
    servis,
    terk,
    dkServis,
    dkOturan,
    dkTemiz: dkTemizTop.map((v, i) => v / Math.max(1, dkKare[i])),
    dkKirli: dkKirliTop.map((v, i) => v / Math.max(1, dkKare[i])),
    dkKirliMasa: dkKirliMasaTop.map((v, i) => v / Math.max(1, dkKare[i])),
    yikananOyuncu,
    yikananBulasikci,
    ortKirliMasa: kirliMasaTop / Math.max(1, kareToplam),
    enCokKirliMasa,
    kareHepsiKirli,
    son: {
      temiz: s.cleanCups,
      'tezgâhta hazır': s.ready.tea + s.ready.tost,
      'garson tepsisinde': s.waiters.reduce((a, w) => a + w.tray + w.trayFood, 0),
      'garson elinde kirli': s.waiters.reduce((a, w) => a + (w.dirtyCarry ?? 0) + (w.dirtyCarryFood ?? 0), 0),
      'oyuncu tepsisinde': elde(s),
      'müşteri elinde': s.npcs.filter((n) => n.state === 'drinking').length,
      'MASADA KİRLİ': s.dishes.length,
      'bulaşıkçıda': s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0,
    },
    korunumSapma,
    yol,
    rejimBozuldu,
  };
}

function rapor(r: Sonuc): void {
  const sn = r.senaryo;
  console.log(`\n${'-'.repeat(78)}`);
  console.log(`${sn.ad}   [oyuncu: ${r.kip.toUpperCase()}]${r.varyant.ad === 'taban' ? '' : `  [VARYANT: ${r.varyant.ad}]`}`);
  console.log(
    `${r.masaSayisi} masa · ${r.garsonSayisi} garson · bulaşıkçı ${r.bulasikci ? 'VAR' : 'yok'}` +
    ` · ocak L${sn.stationLevel} · masa L${sn.tableLevel} · HAVUZ ${r.havuz} bardak · ${sn.sure} sn`,
  );
  console.log('-'.repeat(78));
  if (r.rejimBozuldu) console.log('!! REJİM BOZULDU (masa/ocak seviyesi koşu içinde değişti) — sayılar karşılaştırılamaz.');
  if (r.korunumSapma > 0) console.log(`!! KORUNUM SAPMASI ${r.korunumSapma} bardak — kod hatası (ölçüm değil).`);

  console.log(`Müşteri: oturan ${r.oturan} · servis ${r.servis} (${pct(r.servis, r.oturan)}) · terk ${r.terk} (${pct(r.terk, r.oturan)})`);
  console.log(`  servis / dk : ${n2((60 * r.servis) / sn.sure)}   ·  oturan / dk : ${n2((60 * r.oturan) / sn.sure)}`);

  console.log(`\nKİLİT:`);
  console.log(`  temiz bardak 0 olan kare      : ${pct(r.kareSifir, r.kareToplam)}  (${r.kareSifir}/${r.kareToplam})`);
  console.log(`  ilk sıfırlanma                : ${Number.isNaN(r.ilkSifir) ? 'hiç' : n1(r.ilkSifir) + ' sn'}`);
  console.log(`  en uzun kesintisiz sıfır      : ${n1(r.enUzunSifir)} sn`);
  console.log(`  SON ÇEYREKTE sıfır            : ${pct(r.sonCeyrekSifir, r.sonCeyrekKare)}  (kalıcı mı?)`);
  console.log(`  bekleyen müşteri VAR + hazır 0 + temiz 0 : ${pct(r.kareBekleyenVeSifir, r.kareBekleyenVar)} (bardağın ısırdığı an)`);

  console.log(`\nKİRLİ MASA (D-019 eşiği: >${C.cups.dirtyThreshold}×koltuk kirli ⇒ masa kapalı):`);
  console.log(`  ortalama kirli masa : ${n2(r.ortKirliMasa)} / ${r.masaSayisi} · en çok ${r.enCokKirliMasa}`);
  console.log(`  TÜM masaların kirli olduğu kare : ${pct(r.kareHepsiKirli, r.kareToplam)}`);

  // ÖLÇÜM ARACININ KENDİ BEKÇİSİ (C3 dersi: bir sayının çıkması, onu ÜRETEN şeyin çalıştığı
  // anlamına gelmez). Oyuncu kipinde bot yürümüyorsa satır ölçüm değildir.
  if (r.kip === 'oyuncu' && r.yol / (sn.sure / 60) < 30) {
    console.log('!! OYUNCU KİPİ ÇALIŞMADI (oyuncu neredeyse hiç yürümedi) — bu koşu ölçüm DEĞİL.');
  }
  console.log(`\nYIKAMA: oyuncu ${r.yikananOyuncu} · bulaşıkçı ${r.yikananBulasikci} bardak (garsonun boşta yıkadığı sayaca girmez)` +
    ` (toplam ${n2((60 * (r.yikananOyuncu + r.yikananBulasikci)) / sn.sure)} bardak/dk)` +
    (r.kip === 'oyuncu' ? ` · oyuncu yolu ${n1(r.yol / (sn.sure / 60))} br/dk` : ''));

  console.log(`\nBİTİŞ ENVANTERİ (havuz ${r.havuz}):`);
  for (const [k, v] of Object.entries(r.son)) if (v > 0) console.log(`  ${k.padEnd(20)} ${v}`);

  console.log(`\nDAKİKA DAKİKA (temiz bardak ort · masada kirli ort · kirli masa ort · o dk servis):`);
  const N = r.dkServis.length;
  const gost = Array.from({ length: N }, (_, i) => i).filter((i) => i < 5 || i % 3 === 0 || i === N - 1);
  for (const i of gost) {
    console.log(
      `  dk ${String(i + 1).padStart(2)}  temiz ${n1(r.dkTemiz[i]).padStart(5)}` +
      `  kirli ${n1(r.dkKirli[i]).padStart(5)}  kirliMasa ${n1(r.dkKirliMasa[i]).padStart(4)}` +
      `  servis ${String(r.dkServis[i]).padStart(3)}  oturan ${String(r.dkOturan[i]).padStart(3)}`,
    );
  }
}

// ---------------------------------------------------------------------------
const DT = 0.1;
const TOHUM = 20260908;
console.log('OLCUM — BARDAK KİLİDİ (Faz C4, D-082)');
console.log(`Oyunun kendi tick()'i · dt = ${DT} sn · tohum ${TOHUM}`);
console.log(`Havuz kuralı: alan başına ${C.cups.poolBase} + ocak seviyesi başına ${C.cups.poolPerLevel} bardak`);
console.log(`Kirli masa eşiği: koltuk başına ${C.cups.dirtyThreshold} (eşiği AŞAN masa kapanır)`);
console.log(
  `Kirli bardak ${WASH_QUEST_INDEX < 0 ? 'HEP' : `görev #${WASH_QUEST_INDEX + 1} "${C.quests[WASH_QUEST_INDEX].title}"'dan itibaren`} çıkar` +
  ` — o an mekân: 2 masa · garson yok.`,
);

const KIPLER: Kip[] = (process.env.BARDAK_KIP ? [process.env.BARDAK_KIP as Kip] : ['park', 'oyuncu']);
const sonuclar: Sonuc[] = [];
for (const sn of SENARYOLAR) {
  console.log(`\n\n${'='.repeat(78)}\n${sn.ad}\n${'='.repeat(78)}`);
  for (const kip of KIPLER) {
    seedRandom(TOHUM);
    const r = kosu(sn, kip, DT);
    sonuclar.push(r);
    rapor(r);
  }
}

console.log(`\n\n${'#'.repeat(78)}`);
console.log('# ÖZET — zincir boyunca bardak kilidi');
console.log('#'.repeat(78));
console.log('senaryo                              kip        havuz  masa  dw   temiz0%   servis/dk  terk%');
for (const r of sonuclar) {
  const ad = r.senaryo.ad.split('·')[0].trim() + ' ' + r.senaryo.ad.split('·').slice(1, 3).join('·').trim();
  console.log(
    `${ad.padEnd(36).slice(0, 36)} ${r.kip.padEnd(10)} ${String(r.havuz).padStart(5)} ${String(r.masaSayisi).padStart(5)}` +
    ` ${(r.bulasikci ? 'var' : '-').padStart(4)} ${pct(r.kareSifir, r.kareToplam).padStart(8)}` +
    ` ${n2((60 * r.servis) / r.senaryo.sure).padStart(10)} ${pct(r.terk, r.oturan).padStart(7)}`,
  );
}
const sapma = Math.max(...sonuclar.map((r) => r.korunumSapma));
console.log(`\nKORUNUM DENETİMİ: en büyük sapma ${sapma} bardak ${sapma === 0 ? '✓ (bardak kapalı sistem)' : '✗ KOD HATASI'}`);

// ---------------------------------------------------------------------------
// VARYANT KARŞILAŞTIRMASI — D-082'nin üç kolu, AFK (park) altında, D-082 vakası (B2) ve
// bulaşıkçıdan hemen önceki en kötü nokta (B3) üstünde. KONTROL KOŞUSU listenin başındadır:
// varyantsız çıktı yukarıdaki taban koşusuyla BİREBİR aynı olmalı (enjeksiyonun yan etkisi yok).
// TOHUM SAĞLAMLIĞI: bulgu tek zar atışının eseri mi? Kilit yapısal olduğu için tohumdan
// bağımsız çıkmalı. (Tek koşuya dayanan bir bulgu, ölçülmemiş bir bulgudur.)
if (!process.env.BARDAK_VARYANTSIZ) {
  console.log(`\n\n${'#'.repeat(78)}`);
  console.log('# TOHUM SAĞLAMLIĞI — B2/B3 · park · taban · sizinti:2 · bulasikci · üç ayrı tohum');
  console.log('# (taban ve sizinti satırlarının tohumdan BAĞIMSIZ çıkması beklenir: o rejimlerde debi');
  console.log('#  havuz/demleme ya da sızıntı oranıyla TAVANLANIR, zar sonucu değiştirmez. Zarın');
  console.log('#  gerçekten döndüğü, bulasikci satırlarının tohumla oynamasından görülür.)');
  console.log('#'.repeat(78));
  console.log('senaryo   varyant            tohum      servis/dk  sonÇeyrek0%  ilkSıfır(sn)');
  for (const sn of [SENARYOLAR[1], SENARYOLAR[2]]) {
    for (const spec of ['garson:0', 'garson:2', 'garson:0,sizinti:2']) {
      for (const tohum of [20260908, 7, 31337]) {
        seedRandom(tohum);
        const r = kosu(sn, 'park', DT, varyantOku(spec || undefined));
        console.log(
          `${sn.ad.split('·')[0].trim().padEnd(9)} ${spec.padEnd(18)} ${String(tohum).padStart(8)}` +
          ` ${n2((60 * r.servis) / sn.sure).padStart(10)} ${pct(r.sonCeyrekSifir, r.sonCeyrekKare).padStart(12)}` +
          ` ${(Number.isNaN(r.ilkSifir) ? 'hiç' : n1(r.ilkSifir)).padStart(13)}`,
        );
      }
    }
  }
}

if (!process.env.BARDAK_VARYANTSIZ) {
  const VARYANTLAR = [
    'garson:0',         // KONTROL = D-083 öncesi davranış (boşta bulaşık kapalı)
    'garson:1',
    'garson:2',
    'garson:4',
    'garson:0,havuz:2',
    'garson:0,havuz:4',
    'garson:0,bulasikci',
    'garson:0,sizinti:2',
    'garson:0,sizinti:6',
    'garson:0,iade:0.25',
    'garson:0,iade:0.5',
  ];
  const HEDEF = [SENARYOLAR[1], SENARYOLAR[2]];
  console.log(`\n\n${'#'.repeat(78)}`);
  console.log('# VARYANTLAR — AFK (park) altında D-082 kolları');
  console.log('#'.repeat(78));
  console.log("('garson:N' = boşta kalan garsonun taşıdığı kirli sayısı; garson:0 = D-083 ÖNCESİ davranış)");
  console.log('senaryo   varyant              havuz  temiz0%  sonÇeyrek0%  servis/dk  oturan/dk  kirliMasa  terk%');
  for (const sn of HEDEF) {
    for (const spec of VARYANTLAR) {
      seedRandom(TOHUM);
      const r = kosu(sn, 'park', DT, varyantOku(spec || undefined));
      if (process.env.BARDAK_DETAY) rapor(r);
      const ad = sn.ad.split('·')[0].trim();
      console.log(
        `${ad.padEnd(9)} ${(spec === 'garson:0' ? 'KONTROL' : spec).padEnd(20)} ${String(r.havuz).padStart(5)}` +
        ` ${pct(r.kareSifir, r.kareToplam).padStart(7)} ${pct(r.sonCeyrekSifir, r.sonCeyrekKare).padStart(12)}` +
        ` ${n2((60 * r.servis) / sn.sure).padStart(10)} ${n2((60 * r.oturan) / sn.sure).padStart(10)}` +
        ` ${n2(r.ortKirliMasa).padStart(10)} ${pct(r.terk, r.oturan).padStart(6)}`,
      );
    }
    console.log('');
  }
}
