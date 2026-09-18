/**
 * olcum-perf-t4.mjs — T4 PERFORMANS ÖLÇÜMÜ (G-80, 2026-09-18).
 *
 * ## Soru F2'ninkinden FARKLI — bu yüzden yeni araç
 * F2 (`tools/olcum-telefon-f2.mjs`) **DONDURULMUŞ** bir dünyada gölge/dpr/bayt ölçtü ve
 * gölgenin kare süresinin %40'ı olduğunu buldu. Kullanıcının 2026-09-18 şikâyeti başka bir şey
 * söylüyor: *"çok ciddi şarj yiyor ve ÇOK HIZLI KASMAYA BAŞLIYOR"* — yani ağırlık sabit değil,
 * **zamanla artıyor**. Dondurulmuş dünya bu soruyu tanım gereği cevaplayamaz.
 *
 * Üç şey ayrı ayrı ölçülür ve karıştırılmaz:
 *   §A **YÜK**        — mekân büyüdükçe kare süresi ne oluyor (erken · orta · geç)
 *   §B **SÜRÜKLENME** — AYNI dünyada zaman geçtikçe kare süresi/bellek/nesne sayısı kayıyor mu
 *                       (bu, "ağır" ile "sızdırıyor"u ayıran tek ölçüm)
 *   §C **NÜFUS**      — NPC · yerdeki para · kirli kap popülasyonu ve tavanları
 *   §D **KOLLAR**     — gölge / dpr / kare-hızı tavanı: geç oyunda kazanç ne
 *
 * ## Şarj ≠ kare süresi
 * 8 ms'lik bir kare de saniyede 120 kez çizilirse pil yakar. O yüzden §A/§B **gerçek FPS**i de
 * yazar: bugün `<Canvas>`ta `frameloop` verilmemiş (varsayılan `always`) ve kare-hızı tavanı
 * YOK — 120 Hz ekranda oyun 120 kare çizer. Bu bir kol adayıdır, ölçüm onu görünür kılar.
 *
 * ## Kapsam damgası (F2'nin dersi, aynen geçerli)
 * Cihaz bağlı değilse ölçüm MASAÜSTÜNDEN alınır ve **vekildir**: kollar arası SIRALAMA için
 * yeterli, mutlak ms için değil. Sürücü adı ham çıktıya yazılır; SwiftShader'a düşerse koşu
 * kendini damgalar (F2 kusur 1).
 *
 * Koşu:  node tools/olcum-perf-t4.mjs            (kısa — geliştirirken)
 *        OLCUM=tam node tools/olcum-perf-t4.mjs  (tam — rapora yalnız bu girer)
 *        T4_PORT=5218 ... (port çakışırsa)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const PORT = Number.parseInt(process.env.T4_PORT ?? '', 10) || 5218;
const ADRES = `http://localhost:${PORT}/`;
const CIKTI = path.join(KOK, 'docs/olcum-perf-t4.txt');
const CIKTI_JSON = path.join(KOK, 'docs/olcum-perf-t4.json');

const TELEFON = { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
/** F2 ile AYNI kısma — iki turun sayıları karşılaştırılabilir kalsın. */
const CPU_KISMA = 4;

const ORNEK_MS = TAM ? 10_000 : 3_500;
const ISINMA_MS = TAM ? 4_000 : 2_000;
/** §B sürüklenme koşusunun toplam süresi ve dilim uzunluğu (GERÇEK zaman — render ölçülüyor). */
const SURUKLENME_DILIM_MS = TAM ? 20_000 : 6_000;
const SURUKLENME_DILIM = TAM ? 9 : 4; // tam: 3 dk · kısa: 24 sn

const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const tr = (n) => Math.round(n).toLocaleString('tr-TR');

function gorevSayisiOku() {
  // Hattın uzunluğu: `quests: [` ile `] as readonly QuestDef[]` arasındaki `id:` sayısı.
  // (Düz metin arama — çok satırlı regex kaçışları bu dosyada bir kez kırıldı, tekrarlanmasın.)
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const bas = s.indexOf('quests: [');
  const son = s.indexOf('] as readonly QuestDef[]', bas);
  if (bas < 0 || son < 0) throw new Error('gorev hatti bulunamadi (economy.config.ts degisti mi?)');
  return [...s.slice(bas, son).matchAll(/\{\s*id:\s*'([^']+)'/g)].length;
}

function padKimlikleri() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
}

function sunucuBaslat() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, at) => {
    const z = setTimeout(() => at(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); at(new Error(`sunucu ${k} koduyla kapandi (port dolu olabilir)`)); });
  });
}

async function sayfaAc(tarayici, sorgu) {
  const baglam = await tarayici.newContext({
    viewport: { width: TELEFON.width, height: TELEFON.height },
    deviceScaleFactor: TELEFON.deviceScaleFactor,
    isMobile: TELEFON.isMobile, hasTouch: TELEFON.hasTouch,
  });
  await baglam.addInitScript(() => {
    // TOHUM (F2 kusur 4): müşteri gelişi Math.random'a bağlı; sabitlenmezse kollar farklı
    // dünyaları ölçer. `__tohumla` simülasyondan HEMEN ÖNCE çağrılır.
    let t = 0x9e3779b9;
    window.__tohumla = (n) => { t = (n ?? 0x9e3779b9) | 0; return t; };
    Math.random = () => {
      t |= 0; t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    // REACT COMMIT SAYACI (2026-09-06 ölçümünün metriği). DevTools kancası React'ten ÖNCE
    // kurulmalı, o yüzden initScript'te. Kimlik koruma (`keepIdentity`) bozulursa kare başına
    // commit yeniden fırlar ve bu sayı onu yakalar — o turun kazanımı sessizce geri alınamaz.
    window.__commit = 0;
    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        renderers: new Map(),
        supportsFiber: true,
        inject() { return 1; },
        onCommitFiberRoot() { window.__commit++; },
        onCommitFiberUnmount() {},
        onPostCommitFiberRoot() {},
        checkDCE() {},
      };
    }
  });
  const sayfa = await baglam.newPage();
  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push(String(e.message).slice(0, 160)));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(String(m.text()).slice(0, 160)); });
  const cdp = await baglam.newCDPSession(sayfa);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_KISMA });
  const t0 = Date.now();
  await sayfa.goto(ADRES + sorgu, { waitUntil: 'load', timeout: 90_000 });
  await sayfa.waitForFunction(() => !!document.querySelector('canvas'), null, { timeout: 60_000 });
  await sayfa.waitForFunction(() => !!window.__three?.gl, null, { timeout: 60_000 });
  return { baglam, sayfa, hatalar, tuvalMs: Date.now() - t0 };
}

/**
 * Dünyayı belirli bir KADEMEYE kurar ve **canlı bırakır** (F2 donduruyordu — burada amaç tam
 * tersi: yaşayan mekânı ölçmek). `padSayisi` omurga pad listesinin ilk N'i.
 */
async function dunyaKur(sayfa, padler, padSayisi, masaSeviye, isinmaSn, gorevSayisi) {
  await sayfa.evaluate(({ pads, lv, gorevSayisi }) => {
    window.__resetGame?.();
    /*
     * KUSUR 2 (kısa koşuda yakalandı): ilk kurulum yalnız `padsDone` yazıyordu ve `questIndex`
     * 0'da kalıyordu. Kirli bardak `questIndex >= WASH_QUEST_INDEX` kapısından doğuyor
     * (`tick.ts`), yani ölçüm **bulaşık döngüsünü hiç çalıştırmadan** "kirli kap: 0" raporluyordu
     * — koca bir alt sistem ölçüm dışındaydı ve sayı "sorun yok" diye okunacaktı.
     * Hat BİTMİŞ kurulur: dünyanın en yüklü hâli ölçülsün.
     */
    window.__setState?.({ padsDone: pads, wallet: 1e12, diamonds: 1e6, questIndex: gorevSayisi });
    const n = window.__game?.().tables ?? 4;
    for (let i = 0; i < n; i++) window.__setTableLevel?.(i, lv);
    window.__park?.();
  }, { pads: padler.slice(0, padSayisi), lv: masaSeviye, gorevSayisi });
  // Mekân dolsun: NPC akışı kararlı hâle gelene kadar ileri sar (tohum burada sıfırlanır).
  await sayfa.evaluate((sn) => { window.__tohumla?.(12345); window.__advanceTime?.(sn); }, isinmaSn);
  await sayfa.evaluate(() => window.__park?.());
  await sayfa.waitForTimeout(300);
}

/** Bir örnekleme dilimi: GERÇEK rAF döngüsünde kare süresi + sayaçlar + nesne sayıları. */
async function dilimOlc(sayfa, sure) {
  return sayfa.evaluate(async (ms) => {
    const kareler = [], cagrilar = [], ucgenler = [];
    const commit0 = window.__commit ?? 0;
    const t0 = performance.now();
    await new Promise((coz) => {
      let onceki = performance.now();
      const bitis = onceki + ms;
      const adim = (t) => {
        kareler.push(t - onceki);
        onceki = t;
        const bilgi = window.__three?.gl?.info?.render;
        if (bilgi) { cagrilar.push(bilgi.calls); ucgenler.push(bilgi.triangles); }
        if (t < bitis) requestAnimationFrame(adim);
        else coz();
      };
      requestAnimationFrame(adim);
    });
    kareler.shift(); // ilk aralık ölçüme girmez (çağrı gecikmesi)
    const gecen = performance.now() - t0;
    const orta = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
    const yuzde = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0; };
    const gl = window.__three?.gl;
    const g = window.__game?.() ?? {};
    const bellek = performance.memory;
    return {
      kare: kareler.length,
      fps: (kareler.length / gecen) * 1000,
      ortanca: orta(kareler),
      p95: yuzde(kareler, 0.95),
      enKotu: Math.max(...kareler, 0),
      commit: (window.__commit ?? 0) - commit0,
      commitKare: kareler.length ? ((window.__commit ?? 0) - commit0) / kareler.length : 0,
      cagri: orta(cagrilar),
      ucgen: orta(ucgenler),
      geometri: gl?.info?.memory?.geometries ?? 0,
      doku: gl?.info?.memory?.textures ?? 0,
      program: gl?.info?.programs?.length ?? 0,
      dpr: gl?.getPixelRatio?.() ?? 0,
      golgeAcik: !!gl?.shadowMap?.enabled,
      npc: g.npcCount ?? -1,
      para: g.coins ?? -1,
      kirli: g.dirtyCount ?? -1,
      masa: g.tables ?? -1,
      heapMB: bellek ? bellek.usedJSHeapSize / 1048576 : 0,
    };
  }, sure);
}

async function surucuAdi(sayfa) {
  return sayfa.evaluate(() => {
    const gl = window.__three?.gl?.getContext?.();
    if (!gl) return 'bilinmiyor';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'maskeli';
  });
}

// ---------------------------------------------------------------- koşu

async function main() {
  const padler = padKimlikleri();
  const gorevSayisi = gorevSayisiOku();
  const sunucu = await sunucuBaslat();
  /*
   * KUSUR 1 (kısa koşuda yakalandı): ilk kurulumda kare süreleri **tam olarak 16,7 / 33,4 / 50,0**
   * çıkıyordu — yani ölçülen şey işin maliyeti değil **vsync aralığı**ydı. Kilitli rAF ile bir
   * kolun gerçek kazancı ancak bir vsync basamağı atlatırsa görünür; altındaki her fark 0 okunur.
   * Bayraklar kilidi kaldırır → kare süresi işin kendisini gösterir. (Kullanıcının GÖRDÜĞÜ fps
   * yine vsync'e tabidir; rapor ikisini ayrı okur.)
   */
  const tarayici = await chromium.launch({
    args: [
      '--use-gl=angle', '--use-angle=default', '--enable-gpu-rasterization', '--ignore-gpu-blocklist',
      '--disable-gpu-vsync', '--disable-frame-rate-limit',
    ],
  });
  const rapor = { tarih: new Date().toISOString(), kip: TAM ? 'tam' : 'kisa', cpuKisma: CPU_KISMA, gorevSayisi };
  const satirlar = [];
  const yaz = (s = '') => { satirlar.push(s); console.log(s); };

  try {
    // ───────────────────────────────────────── §A YÜK EĞRİSİ
    const kademeler = [
      { ad: 'A1 erken', padSayisi: 0, masaSeviye: 0, isinma: 60, not: '1 salon · 1 masa (oyunun ilk dakikası)' },
      { ad: 'A2 orta', padSayisi: padler.indexOf('zone2') + 1, masaSeviye: 2, isinma: 120, not: '2 salon · masalar L3' },
      { ad: 'A3 geç', padSayisi: padler.length, masaSeviye: 4, isinma: 240, not: 'tüm pad açık · masalar tavanda' },
    ];
    rapor.A = [];
    let surucu = 'bilinmiyor';
    for (const k of kademeler) {
      const { baglam, sayfa, hatalar, tuvalMs } = await sayfaAc(tarayici, '');
      await dunyaKur(sayfa, padler, k.padSayisi, k.masaSeviye, k.isinma, gorevSayisi);
      await sayfa.waitForTimeout(ISINMA_MS);
      if (surucu === 'bilinmiyor') surucu = await surucuAdi(sayfa);
      const o = await dilimOlc(sayfa, ORNEK_MS);
      rapor.A.push({ ...k, ...o, tuvalMs, hatalar });
      await baglam.close();
    }
    rapor.surucu = surucu;

    // ───────────────────────────────────────── §B SÜRÜKLENME (aynı dünya, uzun koşu)
    {
      const { baglam, sayfa, hatalar } = await sayfaAc(tarayici, '');
      await dunyaKur(sayfa, padler, padler.length, 4, 240, gorevSayisi);
      await sayfa.waitForTimeout(ISINMA_MS);
      rapor.B = { dilimMs: SURUKLENME_DILIM_MS, dilimler: [], hatalar };
      for (let i = 0; i < SURUKLENME_DILIM; i++) {
        const o = await dilimOlc(sayfa, SURUKLENME_DILIM_MS);
        rapor.B.dilimler.push({ i, ...o });
      }
      await baglam.close();
    }

    // ───────────────────────────────────────── §C NÜFUS (canlı örnekleme)
    {
      const { baglam, sayfa } = await sayfaAc(tarayici, '');
      await dunyaKur(sayfa, padler, padler.length, 4, 240, gorevSayisi);
      const orn = await sayfa.evaluate(async (adet) => {
        const kayit = [];
        for (let i = 0; i < adet; i++) {
          const g = window.__game();
          kayit.push({ npc: g.npcCount, para: g.coins, kirli: g.dirtyCount, temiz: g.cleanCups });
          window.__advanceTime(5);
        }
        return kayit;
      }, TAM ? 60 : 20);
      const koltuk = await sayfa.evaluate(() => {
        const g = window.__game();
        return { masa: g.tables };
      });
      rapor.C = { orneklem: orn, ...koltuk };
      await baglam.close();
    }

    // ───────────────────────────────────────── §D KOLLAR (geç oyun, CANLI)
    const kollar = [
      { ad: 'D0 taban', sorgu: '?f2golge=2048&f2ad=D0' },
      { ad: 'D1 gölge KAPALI', sorgu: '?f2golge=0&f2ad=D1' },
      { ad: 'D2 dpr tavanı 1', sorgu: '?f2golge=2048&f2dpr=1&f2ad=D2' },
      { ad: 'D3 gölge kapalı + dpr 1', sorgu: '?f2golge=0&f2dpr=1&f2ad=D3' },
    ];
    rapor.D = [];
    for (const k of kollar) {
      const { baglam, sayfa, hatalar } = await sayfaAc(tarayici, k.sorgu);
      await dunyaKur(sayfa, padler, padler.length, 4, 240, gorevSayisi);
      await sayfa.waitForTimeout(ISINMA_MS);
      const o = await dilimOlc(sayfa, ORNEK_MS);
      rapor.D.push({ ...k, ...o, hatalar });
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  // ---------------------------------------------------------------- çıktı
  yaz('='.repeat(78));
  yaz(`T4 PERFORMANS ÖLÇÜMÜ (G-80) · kip=${rapor.kip} · ${rapor.tarih}`);
  yaz(`GPU: ${rapor.surucu}`);
  yaz(`Kadraj: ${TELEFON.width}×${TELEFON.height} @ dpr ${TELEFON.deviceScaleFactor} · CPU ${CPU_KISMA}× kısık`);
  if (/SwiftShader|llvmpipe/i.test(rapor.surucu)) yaz('!! DAMGA: YAZILIM GPU\'SU — mutlak ms GEÇERSİZ, yalnız kol sıralaması okunur.');
  yaz('='.repeat(78));

  yaz('');
  yaz('§A YÜK EĞRİSİ — mekân büyüdükçe kare (canlı simülasyon)');
  yaz('kademe      | masa | NPC | para | kirli |  ms  |  p95 |  fps  | çağrı |   üçgen   | commit/kare | heapMB');
  for (const a of rapor.A) {
    yaz(
      `${a.ad.padEnd(11)} | ${String(a.masa).padStart(4)} | ${String(a.npc).padStart(3)} | ${String(a.para).padStart(4)} | ` +
      `${String(a.kirli).padStart(5)} | ${f1(a.ortanca).padStart(4)} | ${f1(a.p95).padStart(4)} | ${f1(a.fps).padStart(5)} | ` +
      `${String(a.cagri).padStart(5)} | ${tr(a.ucgen).padStart(9)} | ${f2(a.commitKare).padStart(11)} | ${f1(a.heapMB)}`,
    );
  }

  yaz('');
  yaz(`§B SÜRÜKLENME — AYNI dünya, ${rapor.B.dilimMs / 1000} sn'lik ${rapor.B.dilimler.length} dilim`);
  yaz('dilim |  ms  |  p95 |  fps  | çağrı |   üçgen   | geo | doku | prog | NPC | para | kirli | heapMB | commit/kare');
  for (const d of rapor.B.dilimler) {
    yaz(
      `${String(d.i).padStart(5)} | ${f1(d.ortanca).padStart(4)} | ${f1(d.p95).padStart(4)} | ${f1(d.fps).padStart(5)} | ` +
      `${String(d.cagri).padStart(5)} | ${tr(d.ucgen).padStart(9)} | ${String(d.geometri).padStart(3)} | ${String(d.doku).padStart(4)} | ` +
      `${String(d.program).padStart(4)} | ${String(d.npc).padStart(3)} | ${String(d.para).padStart(4)} | ${String(d.kirli).padStart(5)} | ` +
      `${f1(d.heapMB).padStart(6)} | ${f2(d.commitKare)}`,
    );
  }
  const ilk = rapor.B.dilimler[0], son = rapor.B.dilimler[rapor.B.dilimler.length - 1];
  const fark = (a, b) => (a === 0 ? 0 : ((b - a) / a) * 100);
  yaz(`  → kare süresi ${f1(ilk.ortanca)} → ${f1(son.ortanca)} ms (${f1(fark(ilk.ortanca, son.ortanca))}%)`);
  yaz(`  → heap ${f1(ilk.heapMB)} → ${f1(son.heapMB)} MB (${f1(fark(ilk.heapMB, son.heapMB))}%)`);
  yaz(`  → geometri ${ilk.geometri} → ${son.geometri} · doku ${ilk.doku} → ${son.doku} · program ${ilk.program} → ${son.program}`);
  yaz(`  → çizim çağrısı ${ilk.cagri} → ${son.cagri} · üçgen ${tr(ilk.ucgen)} → ${tr(son.ucgen)}`);

  yaz('');
  yaz('§C NÜFUS — geç oyunda popülasyon (5 sn aralıkla örneklem)');
  const npcler = rapor.C.orneklem.map((o) => o.npc);
  const paralar = rapor.C.orneklem.map((o) => o.para);
  const kirliler = rapor.C.orneklem.map((o) => o.kirli);
  const ozet = (a) => `min ${Math.min(...a)} · ort ${f1(a.reduce((x, y) => x + y, 0) / a.length)} · max ${Math.max(...a)}`;
  yaz(`  masa=${rapor.C.masa}`);
  yaz(`  NPC          : ${ozet(npcler)}`);
  yaz(`  yerdeki para : ${ozet(paralar)}`);
  yaz(`  kirli kap    : ${ozet(kirliler)}`);

  yaz('');
  yaz('§D KOLLAR — geç oyun, CANLI dünya');
  yaz('kol                      | gölge |  ms  |  p95 |  fps  | çağrı | dpr  | tabana fark');
  const taban = rapor.D[0];
  for (const k of rapor.D) {
    const d = k.ortanca - taban.ortanca;
    yaz(
      `${k.ad.padEnd(24)} | ${(k.golgeAcik ? 'açık' : 'kapalı').padEnd(5)} | ${f1(k.ortanca).padStart(4)} | ${f1(k.p95).padStart(4)} | ` +
      `${f1(k.fps).padStart(5)} | ${String(k.cagri).padStart(5)} | ${f2(k.dpr).padStart(4)} | ` +
      `${k === taban ? '—' : `${f1(d)} ms (${f1((d / taban.ortanca) * 100)}%)`}`,
    );
  }

  const tumHata = [...rapor.A.flatMap((a) => a.hatalar ?? []), ...(rapor.B.hatalar ?? []), ...rapor.D.flatMap((d) => d.hatalar ?? [])];
  yaz('');
  yaz(`KONSOL HATASI: ${tumHata.length === 0 ? 'yok' : tumHata.length}`);
  for (const h of tumHata.slice(0, 10)) yaz(`  ! ${h}`);

  fs.writeFileSync(CIKTI, satirlar.join('\n') + '\n', 'utf8');
  fs.writeFileSync(CIKTI_JSON, JSON.stringify(rapor, null, 1), 'utf8');
  console.log(`\nham çıktı: ${path.relative(KOK, CIKTI)} · ${path.relative(KOK, CIKTI_JSON)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
