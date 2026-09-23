/**
 * olcum-kayma-t6b.mjs — T6'nın TARAYICI yansıması: 10 dakikalık KARE KAYMASI, T6 öncesi ↔ sonrası.
 *
 * ## Soru
 * T6 (D-140) node'da ölçüldü: 10 dk'da kapıdaki NPC 494 → 59, ayrışma çifti ~27.700 → ~1.700.
 * Kullanıcının sorusu ise *"performans ne kadar gelişti"* — yani tarayıcıdaki KARE. Node sayısı
 * bunun vekili; T5b'nin dersi vekilin ×2,5 yanılabileceğiydi. Bu araç kareyi doğrudan ölçer.
 *
 * ## Tasarım
 * ① **İki kol iki SÜRÜM, iki sunucu.** S0 (T6 öncesi) bugünkü kodla üretilemez (D-140'ta kol
 *    kalıcı oldu). Önce kolu `583f75a`nın worktree'sinden (`T6B_ONCE_KOK`), sonra kolu bu depodan
 *    sunulur. İkisi AYNI tarayıcıda, AYNI kadrajda, AYNI tohumla kurulur.
 * ② **Kayma bir ZAMAN serisidir.** Kol başına 10 kontrol noktası: her noktada simülasyon 60 sn
 *    ileri sarılır (1/60 adımla — `__advanceTime`in 0,1'lik adımı değil, oyunun kendi adımı),
 *    sonra kare gerçek zamanda ölçülür.
 * ③ **Ölçülmeyen sayfa DONDURULUR** (CDP `Page.setWebLifecycleState frozen`) — iki sayfa aynı
 *    CPU'yu paylaşmaz. Her noktada sıra ABBA'dır: makinenin sürüklenmesi kola yazılmaz.
 *
 * ## Dünya — `stationLevels` artık yazılıyor
 * T5b'nin `dunyaKur`u ocakları seviye 0'da bırakıyordu ("20 masaya seviye-0 ocak", T6 rapor §1).
 * Burada kurulum T6 node aracının `gecOyunKur`u ile BİREBİR: pad'ler açık, masalar 4, ocak
 * tavanda, bardak havuzu ona göre, görev hattı bitmiş, oyuncu parkta.
 *
 * Koşu:  node tools/olcum-kayma-t6b.mjs                       (kısa)
 *        OLCUM=tam node tools/olcum-kayma-t6b.mjs             (tam — rapora yalnız bu girer)
 *        T6B_CPU=1 T6B_ETIKET=masaustu ...                    (kısıksız profil)
 *        T6B_ONCE_KOK=../kiraathane-t6once                    (varsayılan bu)
 *
 * Worktree kurulumu (koşu sonrası silinir, gerekince yeniden kurulur):
 *   git worktree add ../kiraathane-t6once 583f75a
 *   node_modules → bu deponunkine JUNCTION (PowerShell: New-Item -ItemType Junction ...)
 *   worktree'nin vite.config.ts'ine (commit'lenmez): `cacheDir: '.vite-t6once'` — iki sunucu aynı
 *   `.vite` önbelleğini paylaşınca birbirini yeniden yüklüyor, sayfa hiç açılmıyordu — ve
 *   `server.fs.allow: ['..']` — junction gerçek yola çözülünce fontlar 403 dönüyordu.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ONCE_KOK = path.resolve(KOK, process.env.T6B_ONCE_KOK || '../kiraathane-t6once');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const CPU_KISMA = Number.parseInt(process.env.T6B_CPU ?? '', 10) || 4;
const ETIKET = (process.env.T6B_ETIKET || (CPU_KISMA === 1 ? 'masaustu' : 'telefon')).trim();
const CIKTI = path.join(KOK, `docs/olcum-kayma-t6b-${ETIKET}.txt`);
const CIKTI_JSON = path.join(KOK, `docs/olcum-kayma-t6b-${ETIKET}.json`);

/** T5b ile aynı kadraj — bağlam sayıları aynı ailede okunsun. */
const TELEFON = { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
const ISINMA_SN = TAM ? 240 : 120;
const NOKTA = TAM ? 10 : 3;
const ADIM_SN = 60;
const DILIM_MS = TAM ? 6000 : 2500;
const TOHUM = 20260921;

const KOLLAR = [
  { ad: 'once', etiket: 'T6 öncesi (583f75a)', kok: ONCE_KOK, port: 5231 },
  { ad: 'sonra', etiket: 'T6 sonrası (HEAD)', kok: KOK, port: 5232 },
];

const T0 = Date.now();
const adim = (s) => process.stderr.write(`[${((Date.now() - T0) / 1000).toFixed(1)} sn] ${s}
`);
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const tr = (n) => Math.round(n).toLocaleString('tr-TR');
const ortanca = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

function sunucuBaslat(kok, port) {
  const s = spawn(process.execPath, [
    path.join(kok, 'node_modules', 'vite', 'bin', 'vite.js'), 'dev', '--port', String(port), '--strictPort',
  ], { cwd: kok, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, at) => {
    const z = setTimeout(() => at(new Error(`sunucu ${port} 60 sn icinde hazir olmadi`)), 60000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); at(new Error(`sunucu ${port} ${k} koduyla kapandi`)); });
  });
}

async function sayfaAc(tarayici, kol) {
  const baglam = await tarayici.newContext({
    viewport: { width: TELEFON.width, height: TELEFON.height },
    deviceScaleFactor: TELEFON.deviceScaleFactor, isMobile: TELEFON.isMobile, hasTouch: TELEFON.hasTouch,
  });
  await baglam.addInitScript(() => {
    let t = 0x9e3779b9;
    window.__tohumla = (n) => { t = (n ?? 0x9e3779b9) | 0; return t; };
    Math.random = () => {
      t |= 0; t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  });
  const sayfa = await baglam.newPage();
  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push(String(e.message).slice(0, 160)));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(String(m.text()).slice(0, 160)); });
  const cdp = await baglam.newCDPSession(sayfa);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_KISMA });
  // Gölge montajda sabitlenir (T5b dersi: cihaz sınıfı hükmü koşu ortasında kapatıyordu).
  await sayfa.goto(`http://localhost:${kol.port}/?f2golge=2048&f2ad=t6b`, { waitUntil: 'load', timeout: 90000 });
  await sayfa.waitForFunction(() => !!window.__three?.gl, null, { timeout: 90000 });
  return { ...kol, sayfa, cdp, hatalar };
}

/** Kurulum (ısınmasız). T6 node aracının `gecOyunKur`u ile birebir; modüller uygulamanın KENDİ örnekleridir (aynı URL). */
async function dunyaKur(sayfa) {
  return sayfa.evaluate(async ({ tohum }) => {
    const { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } = await import('/src/game/store.ts');
    const { economyConfig } = await import('/src/config/economy.config.ts');
    const { D } = await import('/src/game/decimal.ts');
    window.__zaman(0);
    window.__tohumla(tohum);
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: economyConfig.pads.map((p) => p.id), wallet: D(1e12), diamonds: D(1e6),
      questIndex: economyConfig.quests.length,
    });
    const s0 = useGame.getState();
    const ocak = s0.stationLevels.map(() => stationSoftMaxLevel());
    useGame.setState({ tableLevels: s0.tableLevels.map(() => 4), stationLevels: ocak, cleanCups: totalCupPool(s0.areasOpen, ocak) });
    const s1 = useGame.getState();
    useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) });
    const g = useGame.getState();
    return { masa: g.tableLevels.length, ocak: g.stationLevels.join(','), havuz: g.cleanCups };
  }, { tohum: TOHUM });
}

/**
 * Simülasyonu oyunun kendi adımıyla ileri sarar; sarmanın süresi tick maliyetinin kaydıdır.
 * CPU kısması sarma sırasında KALKAR (kare değil durum üretiliyor; 4× kısıkta telefon koşusu
 * saat sürüyordu) — bu yüzden `tickMs` her iki profilde de KISIKSIZ maliyettir.
 */
async function ilerle(k, sn) {
  await k.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const r = await k.sayfa.evaluate(async (sn) => {
    const { useGame } = await import('/src/game/store.ts');
    const tick = useGame.getState().tick;
    const t0 = performance.now();
    for (let i = 0; i < Math.round(sn * 60); i++) tick(1 / 60);
    const ms = performance.now() - t0;
    window.__park?.();
    return { tickMs: ms / Math.round(sn * 60) };
  }, sn);
  await k.cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_KISMA });
  return r;
}

async function dilim(sayfa, ms) {
  return sayfa.evaluate(async (ms) => {
    const gl = window.__three.gl;
    const isler = [], cagri = [], ucgen = [];
    let dur = false;
    const olc = () => {
      const v = window.__perf?.().isMs;
      if (v > 0) isler.push(v);
      cagri.push(gl.info.render.calls); ucgen.push(gl.info.render.triangles);
      if (!dur) requestAnimationFrame(olc);
    };
    requestAnimationFrame(olc);
    const f0 = gl.info.render.frame;
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, ms));
    dur = true;
    const gecen = performance.now() - t0;
    const s = [...isler].sort((a, b) => a - b);
    const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
    const g = window.__game();
    return {
      fps: ((gl.info.render.frame - f0) / gecen) * 1000,
      isMs: q(0.5), isP95: q(0.95),
      cagri: cagri.sort((a, b) => a - b)[cagri.length >> 1] ?? 0,
      ucgen: ucgen.sort((a, b) => a - b)[ucgen.length >> 1] ?? 0,
      npc: g.npcCount,
      golge: !!gl.shadowMap.enabled,
      heapMB: (performance.memory?.usedJSHeapSize ?? 0) / 1048576,
    };
  }, ms);
}

const dondur = (k) => k.cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
const coz = (k) => k.cdp.send('Page.setWebLifecycleState', { state: 'active' });

async function main() {
  if (!fs.existsSync(path.join(ONCE_KOK, 'src/game/tick.ts'))) {
    throw new Error(`T6 oncesi worktree yok: ${ONCE_KOK} (git worktree add ../kiraathane-t6once 583f75a)`);
  }
  const sunucular = [];
  for (const k of KOLLAR) { adim('sunucu ' + k.port); sunucular.push(await sunucuBaslat(k.kok, k.port)); }
  const tarayici = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=default', '--enable-gpu-rasterization', '--ignore-gpu-blocklist',
      '--enable-precise-memory-info'],
  });
  const satir = [];
  const yaz = (s = '') => { satir.push(s); console.log(s); };
  const kayit = { tarih: new Date().toISOString(), kip: TAM ? 'tam' : 'kisa', cpuKisma: CPU_KISMA, isinmaSn: ISINMA_SN, noktalar: [] };
  const damgalar = [];
  let cikis = 0;
  try {
    const kollar = [];
    for (const k of KOLLAR) {
      adim(k.ad + ': sayfa aciliyor');
      const acik = await sayfaAc(tarayici, k);
      acik.dunya = await dunyaKur(acik.sayfa);
      // DENETİM (statik dünya): sim durdurulmuş, NPC yok — iki sürüm AYNI sahneyi çizmeli.
      // Isınmadan sonra kollar meşru olarak ayrışır (kod farklı), o yüzden denetim burada.
      // Modeller asenkron yüklenir: çizim çağrısı üç ardışık dilimde aynı kalana kadar beklenir.
      let onceki = -1, ayni = 0;
      for (let i = 0; i < 30 && ayni < 3; i++) {
        acik.statik = await dilim(acik.sayfa, 1000);
        ayni = acik.statik.cagri === onceki ? ayni + 1 : 0;
        onceki = acik.statik.cagri;
      }
      await acik.sayfa.evaluate(() => window.__zaman(1));
      adim(k.ad + ': isinma');
      // Tohum ISINMADAN HEMEN ÖNCE yeniden sabitlenir. İlk tam koşuda telefon profilinin S0'ı hiç
      // izdihama girmedi (67 NPC), masaüstününki girdi (262): yükleme ve statik bekleme sırasında
      // çizilen kareler de `Math.random` tüketiyor ve o sayı profile göre değişiyordu.
      await acik.sayfa.evaluate((t) => window.__tohumla(t), TOHUM);
      await ilerle(acik, ISINMA_SN);
      await dondur(acik);
      kollar.push(acik);
    }
    const gpu = await (async () => { await coz(kollar[0]); const g = await kollar[0].sayfa.evaluate(() => {
      const c = window.__three.gl.getContext(); const e = c.getExtension('WEBGL_debug_renderer_info');
      return e ? String(c.getParameter(e.UNMASKED_RENDERER_WEBGL)) : 'maskeli'; }); await dondur(kollar[0]); return g; })();
    kayit.gpu = gpu;
    yaz('='.repeat(78));
    yaz(`T6b KARE KAYMASI · kip=${kayit.kip} · ${kayit.tarih}`);
    yaz('GPU: ' + gpu);
    yaz(`Kadraj ${TELEFON.width}x${TELEFON.height} @ dpr ${TELEFON.deviceScaleFactor} · CPU ${CPU_KISMA === 1 ? 'KISILMADI' : CPU_KISMA + 'x kisik (yalniz olcum diliminde)'} · golge 2048 (montajda sabit)`);
    for (const k of kollar) yaz(`  ${k.etiket.padEnd(22)} masa ${k.dunya.masa} · ocak [${k.dunya.ocak}] · havuz ${k.dunya.havuz} · statik sahne ${k.statik.cagri} cagri / ${tr(k.statik.ucgen)} ucgen / ${k.statik.npc} NPC`);
    yaz(`Isinma ${ISINMA_SN} sn (1/60) · ${NOKTA} nokta x ${ADIM_SN} sn · her noktada ABBA dilim (${DILIM_MS} ms)`);
    yaz('='.repeat(78));
    yaz('dk   | kol    |  NPC | is ms (p50/p95) |  fps  | tick ms | cagri | ucgen   | heap MB');

    for (let n = 0; n <= NOKTA; n++) {
      const nokta = { dk: (ISINMA_SN + n * ADIM_SN) / 60 };
      const tick = {};
      for (const k of kollar) {
        if (n === 0) { tick[k.ad] = NaN; continue; }
        adim(`nokta ${n} ${k.ad}: ilerle`);
        await coz(k);
        tick[k.ad] = (await ilerle(k, ADIM_SN)).tickMs;
        await dondur(k);
      }
      const [A, B] = n % 2 === 0 ? kollar : [...kollar].reverse();
      const dilimler = { once: [], sonra: [] };
      for (const k of [A, B, B, A]) {
        await coz(k);
        await k.sayfa.waitForTimeout(1500);
        dilimler[k.ad].push(await dilim(k.sayfa, DILIM_MS));
        await dondur(k);
      }
      for (const k of kollar) {
        const [d1, d2] = dilimler[k.ad];
        const d = { isMs: (d1.isMs + d2.isMs) / 2, isP95: (d1.isP95 + d2.isP95) / 2, fps: (d1.fps + d2.fps) / 2,
          cagri: d2.cagri, ucgen: d2.ucgen, npc: d2.npc, heapMB: d2.heapMB, golge: d1.golge && d2.golge,
          yayilim: Math.abs(d1.isMs - d2.isMs) / Math.max(1e-9, (d1.isMs + d2.isMs) / 2), tickMs: tick[k.ad] };
        nokta[k.ad] = d;
        if (!d.golge) damgalar.push(`${k.ad} dk${nokta.dk}: golge KAPANDI`);
        yaz(`${f1(nokta.dk).padStart(4)} | ${k.ad.padEnd(6)} | ${String(d.npc).padStart(4)} | ${f2(d.isMs).padStart(6)} / ${f2(d.isP95).padStart(6)} | ${f1(d.fps).padStart(5)} | ${Number.isNaN(d.tickMs) ? '    -  ' : f2(d.tickMs).padStart(7)} | ${String(d.cagri).padStart(5)} | ${tr(d.ucgen).padStart(7)} | ${f1(d.heapMB)}`);
      }
      kayit.noktalar.push(nokta);
    }

    // Özet: ilk ↔ son nokta, kol başına kayma; son noktada iki kolun oranı.
    const ilk = kayit.noktalar[0], son = kayit.noktalar.at(-1);
    yaz('-'.repeat(78));
    for (const k of KOLLAR) {
      yaz(`${k.etiket.padEnd(22)} is ms ${f2(ilk[k.ad].isMs)} -> ${f2(son[k.ad].isMs)} (${f1((son[k.ad].isMs / ilk[k.ad].isMs - 1) * 100)}%) · NPC ${ilk[k.ad].npc} -> ${son[k.ad].npc} · fps ${f1(ilk[k.ad].fps)} -> ${f1(son[k.ad].fps)}`);
    }
    yaz(`Son noktada once/sonra: is ms x${f2(son.once.isMs / son.sonra.isMs)} · p95 x${f2(son.once.isP95 / son.sonra.isP95)} · tick x${f2(son.once.tickMs / son.sonra.tickMs)}`);
    const [so, ss] = [kollar[0].statik, kollar[1].statik];
    if (so.cagri !== ss.cagri || Math.abs(so.ucgen / Math.max(1, ss.ucgen) - 1) > 0.02) {
      damgalar.push(`statik sahne farkli: ${so.cagri}/${so.ucgen} <> ${ss.cagri}/${ss.ucgen} — ayni dunya degil`);
    }
    // Aynı kolun iki dilimi (A…A) %25'ten fazla ayrışıyorsa ölçüm gürültüsü kolun farkını yutar.
    const yay = kayit.noktalar.flatMap((p) => KOLLAR.map((k) => p[k.ad].yayilim));
    const yayMax = Math.max(...yay);
    yaz(`ABBA ic yayilim: ortanca %${f1(ortanca(yay) * 100)} · en cok %${f1(yayMax * 100)}`);
    if (yayMax > 0.25) damgalar.push(`ABBA ic yayilim %${f1(yayMax * 100)} > %25`);
    for (const k of kollar) if (k.hatalar.length) damgalar.push(`${k.ad}: ${k.hatalar.length} konsol hatasi (${k.hatalar[0]})`);
    yaz(damgalar.length ? `DAMGA (${damgalar.length}): ` + damgalar.join(' · ') : 'Damga: temiz (golge sabit, ayni dunya, konsol hatasi 0)');
    kayit.damgalar = damgalar;
    if (damgalar.length) cikis = 1;
  } finally {
    await tarayici.close();
    for (const s of sunucular) s.kill();
  }
  if (TAM) {
    fs.writeFileSync(CIKTI, satir.join('\n') + '\n');
    fs.writeFileSync(CIKTI_JSON, JSON.stringify(kayit, null, 1) + '\n');
    console.log('yazildi: ' + path.relative(KOK, CIKTI));
  }
  process.exit(cikis);
}

main().catch((e) => { console.error(e); process.exit(2); });
