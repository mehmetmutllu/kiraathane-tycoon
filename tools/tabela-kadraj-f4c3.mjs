/**
 * tabela-kadraj-f4c3.mjs — F4c-3: cephenin OYUN kamerasındaki kareleri + HUD kutuları + izdüşüm denetimi.
 * Sunucuyu kendi kaldırır (shot-f4c2 deseni). Kullanım: node tools/tabela-kadraj-f4c3.mjs
 *
 * Çıktı:
 *  - docs/gorsel/ss/f4c3-hud.json : profil başına HUD'un opak kutuları (CSS px) + tabela köşelerinin
 *    `__izdusur` NDC'si. `olcum-tabela-f4c3.ts` bunları okur: HUD altı "serbest" sayılmaz; node izdüşümü
 *    tarayıcınınkiyle karşılaştırılır (damga).
 *  - docs/gorsel/ss/f4c3-kadraj-<profil>-<konum>.png : HUD açık, gerçek oyun karesi.
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5243);
const OUT = 'docs/gorsel/ss';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
// Tabela: `olcum-tabela-f4c3.ts` K0'ı `streetLook.TABELA`dan türetip f4c3-kollar.json'a yazar (tek kaynak).
const K0 = JSON.parse(readFileSync(`${OUT}/f4c3-kollar.json`, 'utf8')).find((k) => k.kod === 'K0');
const T = { y: K0.y, w: K0.w, h: K0.h, z: K0.z };
const koseler = (dx) => [
  [dx - T.w / 2, T.y - T.h / 2, T.z], [dx + T.w / 2, T.y - T.h / 2, T.z],
  [dx - T.w / 2, T.y + T.h / 2, T.z], [dx + T.w / 2, T.y + T.h / 2, T.z],
];
/** Sahneden örtücü kutular: tabelanın ÖNÜNDE (z > yüz) ve alt kenarından YUKARIDA (y > 2,75) uzanan her
 *  statik mesh'in dünya AABB'si. Tabelanın kendisi, şeridi, tente + fırfır (eğik → AABB şişer; ölçüm aracı
 *  tenteyi kendi yönlü kutusuyla sınar) ve iskeletli aktörler hariç. */
async function ortuculer(sayfa) {
  return sayfa.evaluate(() => {
    const { scene } = window.__three;
    const out = [];
    scene.updateMatrixWorld(true);
    const kutuAl = (m, mat) => {
      const g = m.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      const e = mat.elements;
      let mn = [Infinity, Infinity, Infinity];
      let mx = [-Infinity, -Infinity, -Infinity];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        const w = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
        mn = mn.map((v, i) => Math.min(v, w[i]));
        mx = mx.map((v, i) => Math.max(v, w[i]));
      }
      return { mn, mx };
    };
    scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
      for (let a = o; a; a = a.parent) if (!a.visible) return;
      const p = o.geometry.parameters ?? {};
      if (o.userData.tabela) return; // tabelanın kendisi (D-156: `Tabela.tsx` işaretler)
      if (p.width === 6.4) return; // tente + fırfır
      const n = o.isInstancedMesh ? o.count : 1;
      for (let i = 0; i < n; i++) {
        let mat = o.matrixWorld;
        if (o.isInstancedMesh) {
          const im = o.matrixWorld.clone();
          const t = im.clone();
          o.getMatrixAt(i, t);
          mat = im.multiply(t);
        }
        const k = kutuAl(o, mat);
        if (k.mx[2] <= 17.84 || k.mx[1] <= 2.75 || k.mn[2] > 22 || k.mx[0] < -14 || k.mn[0] > 6) continue;
        if (k.mx[1] - k.mn[1] > 30) continue; // zemin/gök düzlemleri değil
        out.push({ mn: k.mn.map((v) => +v.toFixed(3)), mx: k.mx.map((v) => +v.toFixed(3)), ad: o.name || o.parent?.name || (o.isInstancedMesh ? 'instanced' : 'mesh') });
      }
    });
    return out;
  });
}

/** Piksel doğrusu: tabelayı saf macenta boyar, kareyi alır, macenta pikselleri sayar. `derinlik=false` →
 *  tabela her şeyin üstünde çizilir (örtülmemiş hâl; HUD de gizlenir) = paydanın kendisi. */
async function macentaSay(sayfa, derinlik) {
  await sayfa.evaluate((derinlik) => {
    const { scene } = window.__three;
    scene.traverse((o) => {
      if (o.isMesh && o.userData.tabela) {
        if (!o.userData.asil) o.userData.asil = o.material;
        const asil = Array.isArray(o.userData.asil) ? o.userData.asil[4] : o.userData.asil;
        const m = asil.clone();
        m.color?.set?.('#ff00ff');
        m.emissive?.set?.('#ff00ff');
        m.emissiveIntensity = 1;
        m.map = null;
        m.lights = false;
        m.depthTest = derinlik;
        m.toneMapped = false;
        // Yalnız ÖN yüz (+z, BoxGeometry grup 4) boyanır; öteki yüzler çizilmez — üst yüz (0,06) paydaya girmesin.
        const gizli = asil.clone();
        gizli.visible = false;
        o.material = [gizli, gizli, gizli, gizli, m, gizli];
        o.renderOrder = derinlik ? 0 : 999;
      }
    });
    document.body.classList.toggle('dsb-hide-hud', !derinlik);
  }, derinlik);
  await sayfa.waitForTimeout(400);
  const png = (await sayfa.screenshot()).toString('base64');
  const n = await sayfa.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let say = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] > 200) say++;
    return say;
  }, png);
  await sayfa.evaluate(() => {
    const { scene } = window.__three;
    scene.traverse((o) => {
      if (o.userData?.asil) {
        o.material = o.userData.asil;
        o.renderOrder = 0;
        delete o.userData.asil;
      }
    });
    document.body.classList.remove('dsb-hide-hud');
  });
  return n;
}

const PROFILLER = [
  { ad: 'dikey', w: 390, h: 844, konum: [['dogus', -8.5, 13.4], ['kapi', -8.5, 16.2], ['z12', -8.5, 12], ['tam-kapi', 0, 16.2, true], ['tam-z14', 0, 14, true]] },
  { ad: 'yatay', w: 844, h: 390, konum: [['dogus', -8.5, 13.4], ['kapi', -8.5, 16.2], ['tam-kapi', 0, 16.2, true]] },
  { ad: 'tablet', w: 820, h: 1180, konum: [['dogus', -8.5, 13.4], ['kapi', -8.5, 16.2]] },
];

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const hatalar = [];
const cikti = { profiller: {}, izdusum: [], ortucu: {}, yazi: null };

/**
 * KOL KARELERİ (`KARE=kollar`): her yazı kolunu (geometri `olcum-tabela-f4c3.ts` → f4c3-kollar.json) sahneye
 * GEÇİCİ bir levha olarak koyar ve oyun kamerasından çeker. Oyun kodu değişmez; bugünkü tabela gizlenir.
 * Renk: C2 (ahşap zemin + krem yazı); tente/fırfır üstündeki yazının zemini saydam.
 */
async function kolKareleri() {
  const kollar = JSON.parse(readFileSync(`${OUT}/f4c3-kollar.json`, 'utf8'));
  const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
  await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await sayfa.waitForFunction(() => typeof window.__three === 'object' && typeof window.__teleport === 'function', null, { timeout: 30000 });
  await sayfa.evaluate(() => window.__setState({ kafeAdi: 'Köşe Kıraathanesi' }));
  await sayfa.waitForTimeout(2500);
  for (const [kAd, x, z] of [['dogus', -8.5, 13.4], ['kapi', -8.5, 16.2]]) {
    await sayfa.evaluate(([x, z]) => window.__teleport(x, z), [x, z]);
    await sayfa.waitForTimeout(3000);
    for (const kol of kollar) {
      await sayfa.evaluate(async (kol) => {
        // Uygulamanın kullandığı three modülü (aynı örnek — instanceof kontrolleri tutsun).
        const url = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\/deps\/three\.js/.test(n));
        const THREE = await import(url);
        const { scene } = window.__three;
        scene.getObjectByName('f4c3-kol')?.removeFromParent();
        scene.traverse((o) => {
          if (o.isMesh && o.userData.tabela) o.visible = kol.kod === 'K0';
        });
        if (kol.kod === 'K0') return; // K0 = oyundaki gerçek tabela (D-156), üstüne levha konmaz
        const saydam = kol.kod === 'K3' || kol.kod === 'K5';
        const W = 1024;
        const H = Math.round((W * kol.h) / kol.w);
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const x = c.getContext('2d');
        if (!saydam) {
          x.fillStyle = '#6b4a2e';
          x.fillRect(0, 0, W, H);
        }
        const harfPx = (kol.harf / kol.h) * H;
        x.font = `700 ${Math.round(harfPx / (47 / 68))}px Georgia, serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = kol.kod === 'K5' ? '#2e6b4f' : '#f4ead2';
        x.fillText('KÖŞE KIRAATHANESİ', W / 2, H / 2 + harfPx * 0.04);
        const doku = new THREE.CanvasTexture(c);
        doku.colorSpace = THREE.SRGBColorSpace;
        doku.anisotropy = 8;
        const g = new THREE.Group();
        g.name = 'f4c3-kol';
        const levha = new THREE.Mesh(new THREE.PlaneGeometry(kol.w, kol.h), new THREE.MeshStandardMaterial({ map: doku, transparent: saydam, roughness: 0.8 }));
        const aci = Math.atan2(kol.uz, kol.uy);
        levha.rotation.x = aci;
        // Yüzeyin 1 cm önüne (normal yönünde) — tente/fırfır/duvarla z-kavgası olmasın.
        levha.position.set(-8.5, kol.y - Math.sin(aci) * 0.01, kol.z + Math.cos(aci) * 0.01);
        g.add(levha);
        if (kol.kod.startsWith('K4')) {
          // Çatı tabelası: arkasında tahta pano + iki dikme (kordonun üstüne basar).
          const pano = new THREE.Mesh(new THREE.BoxGeometry(kol.w + 0.1, kol.h + 0.1, 0.06), new THREE.MeshStandardMaterial({ color: '#4a3220' }));
          pano.rotation.x = aci;
          pano.position.set(-8.5, kol.y + Math.sin(aci) * 0.035, kol.z - Math.cos(aci) * 0.035);
          g.add(pano);
          for (const dxx of [-kol.w / 3, kol.w / 3]) {
            const d = new THREE.Mesh(new THREE.BoxGeometry(0.08, kol.y - 3.2, 0.08), new THREE.MeshStandardMaterial({ color: '#3a2618' }));
            d.position.set(-8.5 + dxx, 3.2 + (kol.y - 3.2) / 2 - kol.h / 4, kol.z - 0.08);
            g.add(d);
          }
        }
        scene.add(g);
      }, kol);
      await sayfa.waitForTimeout(700);
      await sayfa.screenshot({ path: `${OUT}/f4c3-kol-${kol.kod}-${kAd}.png` });
    }
  }
  await sayfa.close();
}

try {
  if (process.env.KARE === 'kollar') {
    await kolKareleri();
    PROFILLER.length = 0;
  }
  for (const p of PROFILLER) {
    const sayfa = await tarayici.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 2 });
    sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
    sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
    await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await sayfa.waitForFunction(() => typeof window.__izdusur === 'function' && typeof window.__setState === 'function', null, { timeout: 30000 });
    await sayfa.evaluate(() => window.__setState({ kafeAdi: 'Köşe Kıraathanesi' })); // D-156 ad kutusu kareyi örtmesin
    await sayfa.waitForTimeout(3000);
    // HUD'un opak kutuları: arka planı/görseli olan ya da yazı taşıyan yaprak öğeler. Tuval ve tam
    // ekranı kaplayan kapsayıcılar sayılmaz (onlar tıklamayı geçirir, sahneyi örtmez).
    const kutular = await sayfa.evaluate(() => {
      const W = innerWidth;
      const H = innerHeight;
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.tagName === 'CANVAS' || el.closest('canvas')) continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < 150 || (r.width >= 0.9 * W && r.height >= 0.5 * H)) continue;
        if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
        let op = 1;
        for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
        if (op < 0.05) continue;
        const bg = cs.backgroundColor.match(/[\d.]+/g);
        const bgOpak = bg && (bg.length < 4 || Number(bg[3]) > 0.3) && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
        const gorsel = cs.backgroundImage !== 'none' || ['IMG', 'svg', 'SVG'].includes(el.tagName);
        const yazi = el.childElementCount === 0 && (el.textContent ?? '').trim().length > 0;
        if (!bgOpak && !gorsel && !yazi) continue;
        out.push({ x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), ad: el.getAttribute('data-testid') ?? el.className?.baseVal ?? el.className ?? el.tagName });
      }
      return out;
    });
    cikti.profiller[`${p.w}x${p.h}`] = { kutular };
    // Aday dokusunun yazısı (`vitrin-adaylari.html` yaziDokusu): genişlik / büyük harf boyu oranı.
    if (!cikti.yazi) {
      cikti.yazi = await sayfa.evaluate(() => {
        const x = document.createElement('canvas').getContext('2d');
        x.font = '700 68px Georgia, serif';
        const en = x.measureText('KÖŞE KIRAATHANESİ').width;
        const k = x.measureText('K');
        return { en: +en.toFixed(1), harf: +(k.actualBoundingBoxAscent + k.actualBoundingBoxDescent).toFixed(1), tuvalEn: 1024, tuvalBoy: 110 };
      });
    }
    await sayfa.screenshot({ path: `${OUT}/f4c3-kadraj-${p.ad}-acilis.png` });
    let tamKuruldu = false;
    for (const [ad, x, z, tam] of p.konum) {
      if (tam && !tamKuruldu) {
        await sayfa.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4), questIndex: 999 }), PADS);
        await sayfa.waitForTimeout(2500);
        tamKuruldu = true;
      }
      if (!cikti.ortucu[tam ? 'tam' : 'ilk']) cikti.ortucu[tam ? 'tam' : 'ilk'] = await ortuculer(sayfa);
      await sayfa.evaluate(([x, z]) => window.__teleport(x, z), [x, z]);
      await sayfa.waitForTimeout(3000);
      const dx = tam ? 0 : -8.5;
      const ndc = await sayfa.evaluate((pts) => window.__izdusur(pts), koseler(dx));
      const oyuncu = await sayfa.evaluate(() => window.__game().player);
      cikti.izdusum.push({ profil: `${p.w}x${p.h}`, ad, x: oyuncu[0], z: oyuncu[2], dx, ndc });
      await sayfa.screenshot({ path: `${OUT}/f4c3-kadraj-${p.ad}-${ad}.png` });
      const gorunen = await macentaSay(sayfa, true);
      const tum = await macentaSay(sayfa, false);
      cikti.izdusum[cikti.izdusum.length - 1].piksel = { gorunen, tum, pay: tum ? +(gorunen / tum).toFixed(3) : 0 };
    }
    await sayfa.close();
  }
} finally {
  await tarayici.close();
  sunucu.kill();
}
if (process.env.KARE === 'kollar') {
  console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'kol kareleri tamam · konsol temiz');
  process.exit(0);
}
writeFileSync(`${OUT}/f4c3-hud.json`, JSON.stringify(cikti, null, 1));
console.log(cikti.izdusum.map((r) => `${r.profil} ${r.ad}: piksel ${r.piksel.gorunen}/${r.piksel.tum} = ${r.piksel.pay}`).join(' | '));
console.log(`örtücü ilk ${cikti.ortucu.ilk?.length} · tam ${cikti.ortucu.tam?.length}`);
console.log(`HUD kutuları: ${Object.entries(cikti.profiller).map(([k, v]) => `${k} ${v.kutular.length}`).join(' · ')} · izdüşüm ${cikti.izdusum.length} kadraj`);
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
