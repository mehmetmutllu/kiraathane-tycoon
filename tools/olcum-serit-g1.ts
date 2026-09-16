/**
 * olcum-serit-g1.ts — G1 ÖLÇÜM: GÖREV ŞERİDİ. Bir görev bittiğinde ekranda kaç ses aynı anda
 * konuşuyor, hangi sırayla — ve kamera yeni hedefe hangi anda gidiyor?
 *
 * Kullanıcının dört kalemi (2026-09-16, `docs/geribildirim-oyun-testi-2026-09-16.md`) tek kök:
 *   G-41  *"yeni görev hemen gelirken onun üstünde biten görevin tebrikleri var"*
 *   G-42  *"görev çubuğu da üstte yazısı kesiliyor"*
 *   G-43  *"görev bitti o kendi görev çubuğunda olsun kısaca her şey tek çubukta"*
 *   G-44  *"başarılı işareti gelmeden ve yeni görev yazılmadan o gelecek yeni göreve zoom atılmasın"*
 *
 * TAKLİT YOK. Zaman çizelgesi GERÇEK `tick.ts`ten, kutu ölçüleri GERÇEK DOM'dan okunur. Süreler
 * `QUEST_COMPLETE_DUR + QUEST_GAP_DUR`tan HESAPLANMAZ — sayılır; çünkü bu turda ölçülen şey
 * sabitlerin değeri değil, üç ayrı sistemin (görev fazı · bildirim kuyruğu · kamera odağı)
 * birbirine göre nereye düştüğü. Üçü birbirini görmüyor; rapor bunu sayıyla söylemeli.
 *
 * BEŞ KOL (hiçbiri uygulanmaz; beşi de ölçülür — varyant kapısı, D-084). Kollar denge
 * dosyalarına DOKUNMADAN, yalnız mevcut dev kancalarıyla (`__setState`) çalışma zamanında
 * kurulur; bu yüzden hepsi gerçek tick'ten geçer:
 *   T   taban        — bugünkü kod
 *   V1  toast yok    — `kind:'quest'` bildirimi hiç çizilmez (G-04'ün 2026-09-09'da alınıp
 *                      f4b1a52'de sessizce geri alınan kararı)
 *   V2  toast kısa   — tebrik ttl'i geçiş penceresine (1,3 sn) kısılır
 *   V3  pencere uzun — `gap` fazı toast'ı kapsayacak kadar uzatılır (yeni kart geç gelir)
 *   V4  pan kapısı   — geçiş fazı boyunca kamera odağı bastırılır, yeni kart gelince salınır
 *
 * §A ÖLÇÜLENLER (kol × senaryo):
 *   yeniKart   bitiş anından yeni görev kartına kaç sn                          → ritim
 *   toast      tebrik toast'ı kaç sn ekranda                                    → G-41
 *   ORTUSME    toast'ın YENİ KART ile aynı anda ekranda olduğu sn               → G-41/G-43 ASIL SAYI
 *   ses        aynı anda "bitti" diyen ayrı ekran bölgesi (en çok)              → G-43
 *   panSapma   ilk kamera panı − yeni kart anı (sn; NEGATİF = ERKEN)            → G-44 ASIL SAYI
 *   panKaynak  panı isteyen sistem — fazından türer                             → G-44 kök sebep
 *
 * §B AYRI GEÇİŞ, DOM'dan okunur (telefon portresi 390×844 ve masaüstü 1280×800):
 *   kickerTasma  üst satırın yatay taşması (px) + satır sayısı                  → G-42
 *   bantTasma    `.band-body`nin bandın İÇ yüksekliğini aşması (px)             → G-42
 *   bolge        "bitti" anında ekranda ayrı duran kutu sayısı + aralarındaki px→ G-43
 *
 * DAMGALAR:
 *   · bitis gercek   — her senaryoda görev GERÇEKTEN bitmeli (questIndex ilerledi). Bitmeyen
 *                      senaryo sıfır ortüşme üretir ve kolu haksız yere temiz gösterir.
 *   · varyant etkili — V1..V4'ün parmak izi T'den FARKLI olmalı (C4 tuzağı ②).
 *   · olcut kor degil— ORTUSME tabanda sıfırdan BÜYÜK çıkmalı; yoksa kolların "0,00" çıkması
 *                      bir şey kanıtlamaz, ölçüt hiçbir şey ölçmüyordur.
 *   · dom okundu     — §B en az bir görev için gerçek kutu döndürmeli.
 *
 * KOŞU KİPİ (D-084): `OLCUM=tam` altı senaryo + tüm görev hattının DOM taraması; kısa koşu üç
 * senaryo + ilk 12 görev. Rapora yalnız tam koşu girer.
 *
 * Çalıştır:
 *   OLCUM=tam npx tsx tools/olcum-serit-g1.ts > docs/olcum-serit-g1.txt
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KIP, KISA, damga, damgaOzeti, kipBandi, ort } from './olcum-lib.ts';
// @ts-expect-error — duman.mjs türsüz (tools/ tsc -b kapsamında değil).
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.SERIT_PORT ?? '', 10) || 5241;

/** Örnekleme adımı (sn). Görev fazı 0,5 sn → on örnek. */
const ADIM = 0.05;
/** Bitiş anından sonra kaç sn izlenir (toast 3,5 sn + pay). */
const IZLEME = 6.0;

type KolAd = 'T' | 'K' | 'V1' | 'V2' | 'V3' | 'V4';
const KOLLAR: readonly { ad: KolAd; baslik: string }[] = [
  { ad: 'T', baslik: 'taban (bugünkü kod)' },
  // KONTROL KOLU — kolun kendisi bir öneri değil, ARACIN GÖZÜ. Karar uygulandıktan sonra taban
  // örtüşmesi 0,00 çıkıyor; ama "0,00" iki ayrı şeyin cevabı olabilir: örtüşme gerçekten yok, ya
  // da araç artık hiçbir tebriği göremiyor. K, biten görevin tebriğini ÇİZİLEN bir türe çevirir;
  // burada örtüşme 0 çıkarsa tabanın 0'ı da hiçbir şey kanıtlamaz (F2'nin "ucuz ≠ ölçülemedi" dersi).
  { ad: 'K', baslik: 'KONTROL: tebrik çizilebilir türe çevrilir' },
  { ad: 'V1', baslik: 'tebrik toast’ı çizilmez' },
  { ad: 'V2', baslik: 'toast ttl 3,5 → 1,3 sn' },
  { ad: 'V3', baslik: 'gap 0,8 → 3,0 sn (yeni kart geç)' },
  { ad: 'V4', baslik: 'geçişte kamera panı kapısı' },
];

/** Senaryo = bitirilecek görev + nasıl bitirileceği. */
interface Senaryo {
  id: string;
  nasil: 'sayac' | 'pad' | 'ocak';
  stat?: string;
  count?: number;
  /** Önce açılmış sayılacak pad'ler (omurga zinciri: `visiblePads` `requires.prev`i atlamaz). */
  hazir?: string[];
}
const TUM_SENARYO: readonly Senaryo[] = [
  { id: 'q_pickup', nasil: 'sayac', stat: 'teaPickups', count: 1 },
  { id: 'q_coin', nasil: 'sayac', stat: 'coinsCollected', count: 1 },
  { id: 'q_table2', nasil: 'pad' },
  { id: 'q_serve5', nasil: 'sayac', stat: 'teasServed', count: 5 },
  { id: 'q_station1', nasil: 'ocak' },
  { id: 'q_table3', nasil: 'pad', hazir: ['table2'] },
  // SALON AÇILIŞI ayrı bir senaryo, çünkü `tick.ts` orada ÜÇÜNCÜ bir kamera odağı isteği kuruyor
  // (`unlockArea` → yeni alanın merkezine, prio 3) ve bu istek görev geçişinden BAĞIMSIZ, bitişin
  // KENDİ tick'inde atılıyor. İlk kısa koşu bu senaryo olmadan yapıldı ve V4 kolu (pan kapısı)
  // tabanın birebir kopyası çıktı — damga onu yakaladı. Kolun ölçülecek bir şeyi olması için
  // erken panın GERÇEKTEN atıldığı senaryo listede olmak zorunda.
  { id: 'q_zone2', nasil: 'pad', hazir: ['table2', 'table3', 'waiter', 'table4'] },
];
const SENARYOLAR: readonly Senaryo[] = KISA
  ? [TUM_SENARYO[0], TUM_SENARYO[2], TUM_SENARYO[6]]
  : TUM_SENARYO;

interface Ornek {
  t: number;
  faz: string;
  bantDone: boolean;
  yeniKart: boolean;
  toastVar: boolean;
  camVar: boolean;
}
interface Olcum {
  kol: KolAd;
  senaryo: string;
  bitti: boolean;
  yeniKartSn: number | null;
  toastSn: number;
  ortusmeSn: number;
  sesSayisi: number;
  panSapma: number | null;
  panKaynak: string;
  iz: string;
}

// =============================================================================================
//  §A — ZAMAN ÇİZELGESİ. Tek `evaluate`: tick'ler senkron koşar, örnekler aralıksız çıkar.
// =============================================================================================
const CIZELGE_KODU = `(async ({ kol, sen, ADIM, IZLEME }) => {
  // TOHUM. Sayfadaki \`Math.random\` müşteri doğumunu ve bahşişi sürüyor; tohumsuz koşuda AYNI
  // kolun parmak izi iki koşu arasında değişiyordu (431eba5f ↔ 189a8bbb). O hâlde \"varyant
  // etkili\" damgası hiçbir şey denetlemez: her kol tabandan farklı çıkar, çünkü her koşu
  // farklıdır. Kollar aynı dünyayı ölçmek zorunda — tohum bunun için var, üslup için değil.
  let _a = 0x9e3779b9 >>> 0;
  Math.random = function () {
    _a = (_a + 0x6d2b79f5) >>> 0;
    let t = _a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // DÜNYAYI DONDUR. Sayfanın KENDİ rAF sürücüsü ölçüm çağrıları ARASINDA da tick atıyordu
  // (gerçek dt ile), yani dünya ben bakmazken ilerliyor ve kadar ilerlediği kare süresine
  // bağlı oluyordu. Tohum bunu çözmedi, çünkü sapmanın kaynağı rastgelelik değil KARE SAYISIYDI:
  // aynı kol iki koşuda 431eba5f ve 189a8bbb verdi. Donmuş dünyada tek zaman kaynağı benim
  // \`__advanceTime\`im olur — F2'nin \`__zaman(0)\` dersinin aynısı.
  window.__zaman(0);
  const G = () => window.__game();
  const S = (p) => window.__setState(p);
  const ilerle = (sn) => window.__advanceTime(sn);

  window.__resetGame();
  await new Promise((r) => setTimeout(r, 80));
  // Omurga zincirini kur (gerekiyorsa), sonra DÜNYAYI YATIŞTIR: seeding'in açtığı reveal'lar
  // kendi toast'larını ve panlarını burada harcasın — ölçüm penceresine sızmasınlar.
  if (sen.hazir) {
    window.__setState({ padsDone: sen.hazir.slice() });
    ilerle(1.5);
    for (let i = 0; i < 40 && (G().notice || G().camFocus); i++) ilerle(0.25);
  }
  window.__setQuest(sen.id);
  window.__park();
  ilerle(0.2);
  const basIndex = G().questIndex;

  // KUSUR 1 (kısa koşuda yakalandı): taze oyun AÇILIŞ PANI ile başlıyor (store, questIndex 0 ve
  // lifetime 0 iken ilk hedefe kamera odağı kuruyor). Temizlenmezse o odak ölçüm penceresine
  // sızıyor ve araç "pan yeni karttan 1,33 sn ÖNCE atıldı" diye SAHTE bir erken pan basıyordu —
  // sayaç senaryolarında ortada hiç reveal yokken bile. Pencere temiz başlar: buradan sonraki
  // her odak, BİTİŞİN kendisinin sebep olduğu odaktır.
  S({ camFocus: null });
  ilerle(ADIM);
  if (G().camFocus != null) return { hata: 'kamera odagi temizlenemedi (' + sen.id + ')' };

  // --- Görevi GERÇEK yoldan bitir (pad senaryosu reveal zincirini de ateşler — G-44'ün şüphelisi).
  if (sen.nasil === 'sayac') {
    const g = G();
    window.__grantStat(sen.stat, (g.stats[sen.stat] || 0) + sen.count);
  } else if (sen.nasil === 'ocak') {
    window.__addMoney(100000);
    window.__upgradeStation();
  } else {
    window.__addMoney(100000);
    const g = G();
    if (!g.padPos) return { hata: 'pad gorunmuyor (' + sen.id + '), currentPad=' + g.currentPad };
    window.__teleport(g.padPos[0], g.padPos[2]);
    for (let i = 0; i < 600 && G().questIndex === basIndex; i++) ilerle(ADIM);
  }

  // --- Bitiş anı: questIndex'in ilerlediği tick.
  let t = 0, bitisT = null;
  for (let i = 0; i < 300 && bitisT === null; i++) {
    ilerle(ADIM);
    t += ADIM;
    if (G().questIndex > basIndex) bitisT = t;
  }
  if (bitisT === null) return { hata: 'gorev bitmedi (' + sen.id + ')' };
  // Biten görevin başlığı: tebrik toast'ı bunu yazar. Tür yerine METİN+ÇİZİLİRLİK üzerinden
  // sayılır, yoksa K kolu türü değiştirdiği an sayaç onu görmez ve kontrol kendini kandırır.
  const bitenBaslik = (G().quest || {}).title || '';

  // --- Bitişten sonra adım adım izle. Kol müdahalesi HER tick'te, örnekten ÖNCE uygulanır:
  //     kaydedilen şey oyuncunun o karede GÖRDÜĞÜ hâldir.
  const ornekler = [];
  let iz = 0x811c9dc5 >>> 0;
  const izEkle = function () {
    for (let k = 0; k < arguments.length; k++) {
      iz = (iz ^ (Math.round(arguments[k] * 100) | 0)) >>> 0;
      iz = Math.imul(iz, 0x01000193) >>> 0;
    }
  };
  let v3Uygulandi = false;
  let panKaynak = '—';
  let oncekiCam = false;

  const n = Math.round(IZLEME / ADIM);
  for (let i = 0; i <= n; i++) {
    const se = G().serit;
    if (kol === 'K' && se.noticeKind === 'quest') {
      S({ notice: Object.assign({}, se.noticeRaw, { kind: 'level' }) });
    }
    if (kol === 'V1' && se.noticeKind === 'quest') {
      S({ notice: null, noticeQueue: se.noticeQueueRaw.filter((x) => x.kind !== 'quest') });
    }
    if (kol === 'V2' && se.noticeKind === 'quest' && se.noticeTtl > 1.3) {
      S({ notice: Object.assign({}, se.noticeRaw, { ttl: 1.3 }) });
    }
    if (kol === 'V3' && se.questPhase === 'gap' && !v3Uygulandi) {
      S({ questPhaseT: 3.0 });
      v3Uygulandi = true;
    }
    if (kol === 'V4' && se.questPhase !== 'active') S({ camFocus: null });

    const g2 = G();
    const s2 = g2.serit;
    const yeniKart = s2.questPhase === 'active' && !s2.questDone;
    // EKRANDA olan sayılır, DURUMDA olan değil: noticeCizilir HUD'un kapısının kendisidir.
    const toastVar = !!s2.noticeCizilir && g2.notice === bitenBaslik;
    const camVar = g2.camFocus != null;
    if (camVar && !oncekiCam && panKaynak === '—') {
      panKaynak = s2.questPhase === 'active' ? 'gorev gecisi (prio 2)' : 'reveal/alan — GECIS SIRASINDA (prio 1/3)';
    }
    oncekiCam = camVar;

    ornekler.push({
      t: +(i * ADIM).toFixed(2),
      faz: s2.questPhase,
      bantDone: !!s2.questDone,
      yeniKart: yeniKart,
      toastVar: toastVar,
      camVar: camVar,
    });
    izEkle(i, s2.questPhase === 'active' ? 1 : s2.questPhase === 'completing' ? 2 : 3, toastVar ? 1 : 0, camVar ? 1 : 0, s2.questDone ? 1 : 0);
    ilerle(ADIM);
  }

  return { ornekler: ornekler, iz: (iz >>> 0).toString(16), panKaynak: panKaynak, bitisT: bitisT };
})`;

/**
 * Her ölçüm KENDİ TAZE SAYFASINDA koşar. Aynı sayfada arka arkaya koşulduğunda aynı kolun
 * parmak izi kayıyordu (431eba5f → 189a8bbb) — tohum sabit, dünya donmuş ve yine de kayıyordu,
 * yani sayfada koşudan koşuya BİRİKEN bir şey var. Kaynağını aramak yerine koşullar eşitlendi:
 * sayfa ömrü tek ölçüm. Bedeli birkaç saniye, kazancı "kollar aynı dünyada mı" sorusunun
 * cevabının artık bir varsayım değil kurulum olması.
 */
async function tazeSayfa(): Promise<Page> {
  const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 } });
  sayfa.on('console', (m) => { if (m.type() === 'error') konsolHata.push(m.text().slice(0, 160)); });
  await sayfa.goto(adres(PORT), { waitUntil: 'domcontentloaded' });
  await sayfa.waitForSelector('canvas', { timeout: 20000 });
  await sayfa.waitForFunction(() => typeof (window as never as { __game?: unknown }).__game === 'function', { timeout: 20000 });
  await bekleAcilis(sayfa);
  return sayfa;
}

async function cizelgeTaze(kol: KolAd, sen: Senaryo): Promise<Olcum> {
  const sayfa = await tazeSayfa();
  try {
    return await cizelge(sayfa, kol, sen);
  } finally {
    await sayfa.close();
  }
}

async function cizelge(sayfa: Page, kol: KolAd, sen: Senaryo): Promise<Olcum> {
  const bos: Olcum = {
    kol, senaryo: sen.id, bitti: false, yeniKartSn: null, toastSn: 0,
    ortusmeSn: 0, sesSayisi: 0, panSapma: null, panKaynak: '—', iz: '--------',
  };
  // Playwright'a dize verilince ARGÜMAN geçilmiyor (dize bir İFADE olarak değerlendirilir ve
  // değeri döner — fonksiyon dönerse sonuç `undefined` olur; ilk koşu tam buna düştü).
  // Bu yüzden çağrı dizenin İÇİNDE kurulur.
  const cagri = `${CIZELGE_KODU}(${JSON.stringify({ kol, sen, ADIM, IZLEME })})`;
  const r = (await sayfa.evaluate(cagri)) as
    | { hata: string }
    | { ornekler: Ornek[]; iz: string; panKaynak: string; bitisT: number };

  if ('hata' in r) {
    damga(`bitis gercek (${kol}/${sen.id})`, false, r.hata);
    return bos;
  }

  const o = r.ornekler;
  const ilkYeniKart = o.find((x) => x.yeniKart) ?? null;
  const toastSn = o.filter((x) => x.toastVar).length * ADIM;
  const ortusme = o.filter((x) => x.toastVar && x.yeniKart).length * ADIM;
  // "Bitti" diyen ayrı bölge: bandın done hâli + tebrik toast'ı. İkisi aynı anda varsa ses 2'dir.
  const ses = o.reduce((m, x) => Math.max(m, (x.bantDone ? 1 : 0) + (x.toastVar ? 1 : 0)), 0);
  const ilkPan = o.find((x) => x.camVar) ?? null;

  return {
    kol,
    senaryo: sen.id,
    bitti: true,
    yeniKartSn: ilkYeniKart ? ilkYeniKart.t : null,
    toastSn: +toastSn.toFixed(2),
    ortusmeSn: +ortusme.toFixed(2),
    sesSayisi: ses,
    panSapma: ilkPan && ilkYeniKart ? +(ilkPan.t - ilkYeniKart.t).toFixed(2) : null,
    panKaynak: ilkPan ? r.panKaynak : '— (pan atilmadi)',
    iz: r.iz,
  };
}

// =============================================================================================
//  §B — DOM: bant TEK çubuk mu, yazı kesiliyor mu?
// =============================================================================================
interface DomSatir {
  id: string;
  kicker: string;
  kickerTasma: number;
  kickerSatir: number;
  baslikTasma: number;
  ustTasma: number;
  altTasma: number;
  govdeTasma: number;
  icYukseklik: number;
  istenen: number;
}
interface DomSonuc {
  satirlar: DomSatir[];
  font: { yuklu: string[]; baslikAile: string; kickerAile: string; baslik: boolean; govde: boolean };
  bolge: { bant: number[] | null; toast: number[] | null; arayPx: number | null; kutuSayisi: number };
}

const DOM_KODU = `(async ({ idler }) => {
  window.__zaman(0);
  // YAZI TİPİ KÖRLÜĞÜ: taşma ölçüsü tamamen font metriklerine bağlı. Oyun fontu yüklenmemişse
  // tarayıcı yedeğiyle ölçeriz ve "0/50 taşma" temiz DEĞİL, KÖR bir sonuç olur. Önce beklenir,
  // sonra yüklendiği DOĞRULANIR ve rapora damga olarak basılır.
  await document.fonts.ready;
  // \`check()\` sorulan AĞIRLIĞA bakar ve yanıltır (Lilita One yalnız 400 var, \"700\" sorusuna
  // yine de evet diyor). Doğrusu yüklü yüzleri SAYMAK: bant hangi yüzle çizildiyse o listede olur.
  const yuklu = [];
  document.fonts.forEach((f) => { if (f.status === 'loaded') yuklu.push(f.family + ' ' + f.weight); });
  const ailesi = (el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/['\"]/g, '').trim();
  const fontDurum = {
    yuklu: [...new Set(yuklu)].sort(),
    baslikAile: '',
    kickerAile: '',
    baslik: false,
    govde: false,
  };
  const kare = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const olc = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };

  window.__resetGame();
  await kare();

  const satirlar = [];
  for (const gorev of idler) {
    const id = gorev.id;
    window.__setQuest(id);
    // KUSUR 2 (kısa koşuda yakalandı): \`__setQuest\` yalnız questIndex'i yazar; bandın çizdiği
    // QuestView tick'te türetilir. Tek tick atılmazsa bant ESKİ görevi göstermeye devam ediyordu
    // ve 12 görevin 8'i "İLK ÇAY" olarak ölçülüp taşma 0/12 çıkıyordu — ölçümün üçte ikisi tek
    // görevin kopyasıydı. Bir tick + iki kare, sonra çizilenin İSTENEN görev olduğu doğrulanır.
    window.__advanceTime(0.05);
    // SABİT SAYIDA KARE BEKLEMEK YETMEDİ (ikinci kısa koşu): store doğru görevi gösterirken DOM
    // 12 görevin 7'sinde hâlâ İLK görevin lakabını çiziyordu — yani ölçüm ilk kartın yedi
    // kopyasını alıyordu. Araç artık kare SAYMIYOR, çizilen YAZININ kendisini bekliyor; gelmezse
    // o satır ölçüme girmez ve sebebi basılır (s24'ün "sayının kendisini bekle" dersi).
    let bant = null;
    for (let bekle = 0; bekle < 60; bekle++) {
      await kare();
      bant = document.querySelector('[data-testid="quest"]');
      const k = bant ? bant.querySelector('.band-kicker') : null;
      const a = window.__game().quest;
      if (bant && k && a && a.id === id && k.textContent === gorev.kicker) break;
      bant = null;
    }
    if (!bant) {
      const a = window.__game().quest;
      const k0 = document.querySelector('.band-kicker');
      satirlar.push({ id: id, yok: true, sebep: 'DOM yetismedi (store=' + (a ? a.id : 'bos') + ', cizilen="' + (k0 ? k0.textContent : '-') + '")' });
      continue;
    }
    const kicker = bant.querySelector('.band-kicker');
    const baslik = bant.querySelector('.band-title');
    const govde = bant.querySelector('.band-body');
    const bs = getComputedStyle(bant);
    const icUst = bant.getBoundingClientRect().top + parseFloat(bs.borderTopWidth) + parseFloat(bs.paddingTop);
    const icAlt = bant.getBoundingClientRect().bottom - parseFloat(bs.borderBottomWidth) - parseFloat(bs.paddingBottom);
    const gr = govde.getBoundingClientRect();
    const kr = kicker ? kicker.getBoundingClientRect() : null;
    const ks = kicker ? getComputedStyle(kicker) : null;
    const satirY = ks ? parseFloat(ks.lineHeight) || parseFloat(ks.fontSize) * 1.15 : 1;
    satirlar.push({
      id: id,
      kicker: kicker ? kicker.textContent : '',
      kickerTasma: kicker ? Math.max(0, kicker.scrollWidth - kicker.clientWidth) : 0,
      kickerSatir: kr ? Math.max(1, Math.round(kr.height / satirY)) : 0,
      baslikTasma: baslik ? Math.max(0, baslik.scrollWidth - baslik.clientWidth) : 0,
      // Bandın İÇ yüksekliği ile gövdenin İSTEDİĞİ yükseklik. Taşma bunların farkıdır; ikisi ayrı
      // basılır çünkü "1 px kesiliyor" ile "bant içeriğe 1 px yetmiyor" aynı cümle değil — ilki
      // kaza gibi okunur, ikincisi yapısal.
      icYukseklik: +(icAlt - icUst).toFixed(1),
      istenen: +govde.scrollHeight.toFixed(1),
      ustTasma: +Math.max(0, icUst - gr.top).toFixed(1),
      altTasma: +Math.max(0, gr.bottom - icAlt).toFixed(1),
      govdeTasma: +(Math.max(0, icUst - gr.top) + Math.max(0, gr.bottom - icAlt)).toFixed(1),
    });
  }

  // --- "BİTTİ" ANI: bant done hâlinde + tebrik toast'ı ekranda. İkisi ayrı kutu mu?
  window.__setQuest(idler[0].id);
  await kare();
  const q = window.__game().quest;
  window.__setState({
    questPhase: 'completing',
    questPhaseT: 0.5,
    questDoneIndex: window.__game().questIndex,
    notice: { text: q ? q.title : 'Görev', ttl: 3.5, kind: 'quest', reward: 3 },
  });
  window.__advanceTime(0.05); // \`done\` bayrağı da tick'te kurulur — aynı kusur (bkz. KUSUR 2).
  await kare();
  const bantEl = document.querySelector('.band');
  const toastEl = document.querySelector('[data-testid="notice"]');
  const b = bantEl ? olc(bantEl) : null;
  const tt = toastEl ? olc(toastEl) : null;
  const ornekBant = document.querySelector('[data-testid=\"quest\"]');
  if (ornekBant) {
    const bb = ornekBant.querySelector('.band-title');
    const kk = ornekBant.querySelector('.band-kicker');
    fontDurum.baslikAile = bb ? ailesi(bb) : '';
    fontDurum.kickerAile = kk ? ailesi(kk) : '';
    fontDurum.baslik = fontDurum.yuklu.some((x) => x.indexOf(fontDurum.baslikAile) === 0);
    fontDurum.govde = fontDurum.yuklu.some((x) => x.indexOf(fontDurum.kickerAile) === 0);
  }

  return {
    satirlar: satirlar,
    font: fontDurum,
    bolge: {
      bant: b,
      toast: tt,
      arayPx: b && tt ? Math.round(b[1] - (tt[1] + tt[3])) : null,
      kutuSayisi: (b ? 1 : 0) + (tt ? 1 : 0),
    },
  };
})`;

/** Karesi çekilecek hâli kurar: ya normal bant, ya "bitti" anı (bant done + tebrik toast'ı). */
const KARE_KODU = `(async ({ bitti }) => {
  window.__zaman(0);
  const kare = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__resetGame();
  window.__setQuest('q_serve5');
  window.__advanceTime(0.05);
  await kare();
  if (bitti) {
    const q = window.__game().quest;
    window.__setState({
      questPhase: 'completing',
      questPhaseT: 0.5,
      questDoneIndex: window.__game().questIndex,
      notice: { text: q ? q.title : 'Görev', ttl: 3.5, kind: 'quest', reward: 15 },
    });
    window.__advanceTime(0.05);
    await kare();
  }
  return true;
})`;

/** AÇILIŞ EKRANI kalkana kadar bekler. Kare çekilirken kalkmamışsa kadraj mor bir perde olur —
 *  ilk kare tam öyle çıktı: ölçüm doğruydu, GÖRÜNTÜ boştu. Ölçüm yerini perde etkilemiyor
 *  (splash sabit konumlu bir örtü), ama karar paketi kadrajla konuşuyor; o yüzden şart. */
async function bekleAcilis(sayfa: Page): Promise<void> {
  await sayfa.waitForSelector('.splash', { state: 'detached', timeout: 30000 }).catch(() => {});
}

async function domGecisi(sayfa: Page, idler: Array<{ id: string; kicker: string }>): Promise<DomSonuc> {
  return (await sayfa.evaluate(`${DOM_KODU}(${JSON.stringify({ idler })})`)) as DomSonuc;
}

// =============================================================================================
//  KOŞU
// =============================================================================================
const say = (n: number | null, b = 2) => (n == null ? '—' : n.toFixed(b).replace('.', ','));

const komut = sunucuKomutu(PORT, process.env.SERIT_MOD ?? 'dev', KOK);
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const konsolHata: string[] = [];

kipBandi();
console.log(`GÖREV ŞERİDİ ÖLÇÜMÜ (G1) · kip=${KIP} · adım ${ADIM} sn · izleme ${IZLEME} sn`);
console.log(`Senaryolar: ${SENARYOLAR.map((s) => s.id).join(', ')}`);
console.log('');

// --- §A -------------------------------------------------------------------------------------
const olcumler: Olcum[] = [];
for (const kol of KOLLAR) {
  for (const sen of SENARYOLAR) olcumler.push(await cizelgeTaze(kol.ad, sen));
}

// TEKRARLANABİLİRLİK: ilk senaryo T kolunda bir kez daha koşulur. İzler ayrışıyorsa kollar aynı
// dünyayı ölçmüyor demektir ve aşağıdaki "varyant etkili" damgası sahte yeşil verir — sıra önemli.
const tekrar = await cizelgeTaze('T', SENARYOLAR[0]);

const kolun = (k: KolAd) => olcumler.filter((o) => o.kol === k && o.bitti);
const izi = (k: KolAd) => kolun(k).map((o) => o.iz).join('/');

console.log('§A — GEÇİŞ ZAMAN ÇİZELGESİ (kol × ortalama; sn)');
console.log('');
console.log('| kol | ne | yeniKart | toast | ORTÜŞME | ses | panSapma | panKaynak |');
console.log('|---|---|---|---|---|---|---|---|');
for (const k of KOLLAR) {
  const r = kolun(k.ad);
  if (!r.length) { console.log(`| ${k.ad} | ${k.baslik} | — | — | — | — | — | ölçülemedi |`); continue; }
  const panlar = r.map((x) => x.panSapma).filter((x): x is number => x != null);
  const kaynak = [...new Set(r.map((x) => x.panKaynak))].join(' · ');
  console.log(
    `| **${k.ad}** | ${k.baslik} | ${say(ort(r.map((x) => x.yeniKartSn ?? 0)))} | ${say(ort(r.map((x) => x.toastSn)))} ` +
    `| **${say(ort(r.map((x) => x.ortusmeSn)))}** | ${Math.max(...r.map((x) => x.sesSayisi))} ` +
    `| ${panlar.length ? say(ort(panlar)) : '—'} | ${kaynak} |`,
  );
}

console.log('');
console.log('§A2 — SENARYO KIRILIMI (taban T)');
console.log('');
console.log('| senaryo | yeniKart | toast | ORTÜŞME | ses | panSapma | panKaynak |');
console.log('|---|---|---|---|---|---|---|');
for (const o of kolun('T')) {
  console.log(`| ${o.senaryo} | ${say(o.yeniKartSn)} | ${say(o.toastSn)} | **${say(o.ortusmeSn)}** | ${o.sesSayisi} | ${say(o.panSapma)} | ${o.panKaynak} |`);
}

// --- §B -------------------------------------------------------------------------------------
const hepsi = C.quests.map((q) => ({ id: q.id, kicker: q.kicker }));
const domIdler = KISA ? hepsi.slice(0, 12) : hepsi;
const domlar: Array<{ en: number; boy: number; ad: string; s: DomSonuc }> = [];
for (const [en, boy, ad] of [[390, 844, 'telefon portre'], [1280, 800, 'masaüstü']] as const) {
  const p = await tarayici.newPage({ viewport: { width: en, height: boy } });
  p.on('console', (m) => { if (m.type() === 'error') konsolHata.push(m.text().slice(0, 160)); });
  await p.goto(adres(PORT), { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('canvas', { timeout: 20000 });
  await p.waitForFunction(() => typeof (window as never as { __game?: unknown }).__game === 'function', { timeout: 20000 });
  await bekleAcilis(p);
  domlar.push({ en, boy, ad, s: await domGecisi(p, domIdler) });
  await p.close();
}

console.log('');
console.log(`§B — BANT DOM'U (${domIdler.length} görev tarandı)`);
console.log('');
console.log('| ekran | oyun fontu | taşan kicker | KISALAN başlık | bant iç yükseklik px | gövdenin istediği px | AÇIK px | gövde ÜST/ALT taşması px |');
console.log('|---|---|---|---|---|---|---|---|');
for (const d of domlar) {
  const s = d.s.satirlar.filter((x) => !(x as unknown as { yok?: boolean }).yok);
  const kt = s.filter((x) => x.kickerTasma > 0);
  const cok = s.filter((x) => x.kickerSatir > 1);
  const bt = s.filter((x) => x.baslikTasma > 0);
  const gt = Math.max(0, ...s.map((x) => x.govdeTasma));
  const ut = Math.max(0, ...s.map((x) => x.ustTasma));
  const at = Math.max(0, ...s.map((x) => x.altTasma));
  const ic = Math.max(0, ...s.map((x) => x.icYukseklik));
  const ist = Math.max(0, ...s.map((x) => x.istenen));
  void gt; void cok;
  console.log(
    `| ${d.ad} ${d.en}×${d.boy} | ${d.s.font.baslik && d.s.font.govde ? `yüklü ✓ (${d.s.font.kickerAile}/${d.s.font.baslikAile})` : `EKSİK: ${d.s.font.kickerAile}=${d.s.font.govde ? '✓' : '✗'} ${d.s.font.baslikAile}=${d.s.font.baslik ? '✓' : '✗'}`} ` +
    `| ${kt.length}/${s.length} | ${bt.length}/${s.length} | ${ic.toFixed(1).replace('.', ',')} | ${ist.toFixed(1).replace('.', ',')} ` +
    `| ${(ic - ist).toFixed(1).replace('.', ',')} | ${ut.toFixed(1).replace('.', ',')} / ${at.toFixed(1).replace('.', ',')} |`,
  );
}

console.log('');
console.log('§B2 — EN ÇOK TAŞAN ON GÖREV (telefon portre)');
console.log('');
console.log('| görev | kicker | kicker taşma px | satır | başlıkta kısalan px | başlık |');
console.log('|---|---|---|---|---|---|');
const portre = domlar[0].s.satirlar.filter((x) => !(x as unknown as { yok?: boolean }).yok);
for (const x of [...portre].sort((a, b) => (b.kickerTasma + b.baslikTasma) - (a.kickerTasma + a.baslikTasma)).slice(0, 10)) {
  console.log(`| ${x.id} | ${x.kicker} | ${x.kickerTasma} | ${x.kickerSatir} | ${x.baslikTasma} | ${C.quests.find((q) => q.id === x.id)?.title ?? ''} |`);
}

// --- KARE: kullanıcının GÖRDÜĞÜ hâl. `feedback_show_dont_ask` — karar paketi metinle değil
// kadrajla konuşur. İki kare: normal bant ve "bitti" anı (bant + tebrik toast'ı üst üste).
const kareSayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 } });
await kareSayfa.goto(adres(PORT), { waitUntil: 'domcontentloaded' });
await kareSayfa.waitForSelector('canvas', { timeout: 20000 });
await kareSayfa.waitForFunction(() => typeof (window as never as { __game?: unknown }).__game === 'function', { timeout: 20000 });
await bekleAcilis(kareSayfa);
mkdirSync(path.join(KOK, 'docs/gorsel/ss'), { recursive: true });
for (const [ad, bitti] of [['g1-serit-normal', false], ['g1-serit-bitti', true]] as const) {
  await kareSayfa.evaluate(`(${KARE_KODU})(${JSON.stringify({ bitti })})`);
  await kareSayfa.screenshot({
    path: path.join(KOK, 'docs/gorsel/ss', `${ad}.png`),
    clip: { x: 0, y: 844 - 300, width: 390, height: 300 },
  });
}
await kareSayfa.close();
console.log('');
console.log('Kareler: docs/gorsel/ss/g1-serit-normal.png · docs/gorsel/ss/g1-serit-bitti.png');

console.log('');
console.log('§B3 — "BİTTİ" ANINDA EKRANDAKİ KUTULAR (G-43)');
console.log('');
console.log('| ekran | kutu sayısı | bant [x,y,w,h] | toast [x,y,w,h] | aradaki boşluk px |');
console.log('|---|---|---|---|---|');
for (const d of domlar) {
  const b = d.s.bolge;
  console.log(`| ${d.ad} | ${b.kutuSayisi} | ${b.bant ? b.bant.join(', ') : '—'} | ${b.toast ? b.toast.join(', ') : '—'} | ${b.arayPx ?? '—'} |`);
}

// --- DAMGALAR -------------------------------------------------------------------------------
const taban = kolun('T');
damga('bitis gercek (T)', taban.length === SENARYOLAR.length, `${taban.length}/${SENARYOLAR.length} senaryo bitti`);
const tabanOrtusme = taban.length ? ort(taban.map((x) => x.ortusmeSn)) : 0;
const tabanSes = taban.length ? Math.max(...taban.map((x) => x.sesSayisi)) : 0;
const tabanPan = Math.min(0, ...taban.map((x) => x.panSapma).filter((x): x is number => x != null));

// ÖLÇÜT KÖR MÜ — taban 0,00 verdiğinde bu soruyu tabanın kendisi cevaplayamaz. Kontrol kolu
// (K) tebriği çizilebilir türe çevirir: orada da 0 çıkıyorsa araç tebrik göremiyor demektir ve
// tabandaki 0 bir bulgu değil, bir körlüktür.
const kontrol = kolun('K');
const kontrolOrtusme = kontrol.length ? ort(kontrol.map((x) => x.ortusmeSn)) : 0;
damga('olcut kor degil (kontrol)', kontrolOrtusme > 0, `kontrol kolunda da örtüşme ${say(kontrolOrtusme)} sn — araç tebriği hiç göremiyor`);

const ilkT = olcumler.find((o) => o.kol === 'T' && o.senaryo === SENARYOLAR[0].id);
damga('tekrarlanabilir', !!ilkT && ilkT.iz === tekrar.iz, `${ilkT?.iz} ≠ ${tekrar.iz} — tohum tutmuyor, kol karşılaştırması anlamsız`);

// VARYANT ETKİLİ Mİ — ama bir kolun etkisi KODA GİRDİYSE tabanla aynı çıkması kusur değil,
// sonucun ta kendisidir. Ayrım tahminle değil TABANIN SAYISIYLA yapılır: taban zaten o kolun
// hedeflediği hâldeyse kol "uygulandı" diye basılır, damga aranmaz.
const izT = izi('T');
const uygulandi: Record<string, boolean> = {
  K: false,
  V1: tabanOrtusme === 0 && tabanSes <= 1,
  V2: tabanOrtusme === 0,
  V3: false, // ritmi her hâlükârda değiştirir; tabanla aynı çıkarsa gerçekten etkisizdir
  V4: tabanPan >= 0,
};
const uygulanmis: string[] = [];
for (const k of KOLLAR.filter((x) => x.ad !== 'T')) {
  if (uygulandi[k.ad]) { uygulanmis.push(k.ad); continue; }
  damga(`varyant etkili (${k.ad})`, izi(k.ad) !== izT, `parmak izi T ile aynı (${izi(k.ad)})`);
}
if (uygulanmis.length) {
  console.log('');
  console.log(`Kolun etkisi KODA GİRDİ (tabanla aynı çıkması beklenir): ${uygulanmis.join(' · ')}`);
}
const atlanan = domlar[0].s.satirlar.filter((x) => (x as unknown as { yok?: boolean }).yok);
damga('dom okundu', portre.length > 0, 'bant DOM\'da bulunamadı');
damga('dom kapsami', atlanan.length === 0, `${atlanan.length} görev çizilemedi: ${atlanan.slice(0, 4).map((x) => `${x.id}(${(x as unknown as { sebep?: string }).sebep})`).join(', ')}`);
damga('konsol temiz', konsolHata.length === 0, konsolHata.slice(0, 3).join(' | '));
damga('yazitipi yuklendi', domlar.every((d) => d.s.font.baslik && d.s.font.govde), 'oyun fontu yüklenmeden ölçülen taşma, yedek fontun taşmasıdır');

console.log('');
console.log(`Parmak izleri (senaryo başına, tam dizi): ${KOLLAR.map((k) => `${k.ad}=${izi(k.ad)}`).join(' · ')}`);
console.log(`Konsol hatası: ${konsolHata.length}`);
console.log(`Yüklü yazı tipi yüzleri: ${domlar[0].s.font.yuklu.join(' · ') || '(hiç)'}`);

await tarayici.close();
sunucu.kill();
damgaOzeti();
