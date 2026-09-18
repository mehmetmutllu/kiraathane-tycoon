/**
 * shot-t2b.mjs — T2b'nin GÖRSEL KANITI (G-58 · G-62 · G-63 · G-64 · G-81, 2026-09-18).
 *
 * `feedback_visual_polish`: *"mantık + test yeşil ≠ bitti."* Bu turun beş kalemi de bir
 * ANIN nasıl göründüğüyle ilgili; vitest yalnız o anın DOĞDUĞUNU tutabiliyor, nasıl durduğunu
 * tutamıyor. Araç dört kareyi çeker ve karar kullanıcıya bırakılır:
 *
 *   ① kutlama      — görev tamamlanma anı: bant + Görevler sekmesinin halkası
 *   ② öğretme      — bulaşık kartı, kamera tezgâha çevrilmişken (yazı hedefi ÖRTMEMELİ)
 *   ③ yönlendirme  — karakter spotlight'ı + yeni "buradan yükselt" kartı ve oku
 *   ④ hedef panosu — toplanabilir ödül listenin ÜSTÜNDE mi
 *
 * Koşu:  node tools/shot-t2b.mjs   ·   T2B_PORT=5216 node tools/shot-t2b.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.T2B_PORT ?? '', 10) || 5216;
const KOK_URL = `http://127.0.0.1:${PORT}`;
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

// Telefon portresi — kalemlerin hepsi orada yaşıyor (HUD yerleşimi en dar burada).
const KADRAJ = { width: 412, height: 915, dpr: 2.625 };

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

async function sayfaAc(tarayici) {
  const baglam = await tarayici.newContext({
    viewport: { width: KADRAJ.width, height: KADRAJ.height },
    deviceScaleFactor: KADRAJ.dpr,
    isMobile: true,
    hasTouch: true,
  });
  const s = await baglam.newPage();
  await s.goto(`${KOK_URL}/`, { waitUntil: 'domcontentloaded' });
  await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 30_000 });
  await s.waitForSelector('.splash', { state: 'detached', timeout: 30_000 }).catch(() => {});
  await s.evaluate(() => window.__park?.());
  return { baglam, s };
}

async function main() {
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const uretilen = [];
  try {
    // ─────────────────────────────────────────────────── ① KUTLAMA ANI
    // Kutlama SAHTE kurulmaz: `questPhase`i elle yazmak ölçmediğimiz bir hâl üretirdi. Görev
    // gerçekten tamamlanır (ocağa git → tepsi dolar → `q_pickup` biter) ve pencere açılır açılmaz
    // kare alınır — yani karede görülen şey oyuncunun göreceğinin birebir aynısı.
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => { window.__resetGame?.(); window.__addMoney?.(5000); });
      const d = await s.evaluate(() => window.__advanceTime(15));
      await s.evaluate((p) => window.__teleport(p[0], p[2]), d.stationPos);
      // Pencere AÇILIR AÇILMAZ dur: küçük adımlarla ilerle, faz değişince çık.
      const acildi = await s.evaluate(() => {
        for (let i = 0; i < 200; i++) {
          window.__advanceTime(0.05);
          if (window.__game().serit.questPhase !== 'active') return true;
        }
        return false;
      });
      if (!acildi) throw new Error('kutlama penceresi acilmadi (gorev tamamlanmadi)');
      /*
       * PENCEREYİ KARE İÇİN UZAT. İlk kurulum bunu yapmıyordu ve kare YANLIŞ ÇIKIYORDU: oyun
       * kare alınırken akmaya devam ediyor, 1,3 sn'lik pencere ekran görüntüsü alınana kadar
       * kapanıyor ve karede yeni görevin kartı görünüyordu. Yani araç, düzelttiğimiz kusurun
       * ta kendisini resmediyordu. Uzatılan yalnız SAYAÇ; sınıf, animasyon ve CSS aynen çalışır.
       */
      await s.evaluate(() => window.__setState?.({ questPhaseT: 8 }));
      await s.waitForTimeout(150); // React commit + kutlama animasyonunun ilk kareleri
      const p = path.join(OUT, 't2b-1-kutlama.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }

    // ─────────────────────────────────────────────────── ② ÖĞRETME KARTI (bulaşık)
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => {
        window.__resetGame?.();
        window.__addMoney?.(5000);
        window.__setQuest?.('q_wash');
        window.__setState?.({ washTipSeen: false, questPhase: 'active', questPhaseT: 0, notice: null, noticeQueue: [] });
      });
      await s.waitForSelector('[data-testid="ogretme-bulasik"]', { timeout: 10_000 });
      await s.waitForTimeout(900); // kamera tezgâha otursun
      const p = path.join(OUT, 't2b-2-ogretme-bulasik.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }

    // ─────────────────────────────────────────────────── ③ KARAKTER YÖNLENDİRMESİ
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => {
        window.__resetGame?.();
        window.__addMoney?.(5000);
        window.__setQuest?.('q_charTray1');
        window.__setState?.({ charPanelSeen: false, questPhase: 'active', questPhaseT: 0, notice: null, noticeQueue: [] });
      });
      await s.waitForSelector('[data-testid="char-tip"]', { timeout: 10_000 });
      await s.waitForTimeout(500);
      const p = path.join(OUT, 't2b-3-karakter-yonlendirme.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }

    // ─────────────────────────────────────────────────── ④ HEDEF PANOSU (hazır ödül üstte)
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => {
        window.__resetGame?.();
        // Son kategoriyi (masa ustalığı DEĞİL, listede sonda duran) toplanabilir yap ki
        // sıralamanın gerçekten çalıştığı görülsün: hazır satır config sırasında SONDA.
        window.__setState?.({ stats: { ...window.__game().stats, dishesWashed: 999999 } });
      });
      await s.click('[data-testid="goals"]');
      await s.waitForSelector('[data-testid="goals-panel"]', { timeout: 10_000 });
      await s.waitForTimeout(500);
      const p = path.join(OUT, 't2b-4-hedef-panosu.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }
  console.log(uretilen.map((p) => path.relative(KOK, p)).join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
