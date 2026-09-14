/**
 * shot-ui-s10.mjs — S10 ÖLÇÜM (ekran tarafı): arayüzün BUGÜNKÜ hâli, telefon kadrajında.
 *
 * NEDEN EKRANDAN ÖLÇÜLÜYOR, CSS DOSYASINDAN DEĞİL: `hud.css` 1166 satır ve içinde asla
 * çizilmeyen kurallar, üstüne yazılan değerler, `var()` zincirleri var. "Kaç farklı köşe
 * yarıçapı var" sorusunun cevabı kaynak metinde YALANCI çıkar — ekranda gerçekten çizilen
 * `getComputedStyle` değerleri sayılır. Ders D-096 §6'nın aynısı: bir ölçüm aracı ölçtüğü
 * şeyi yeniden yazıyorsa (ya da başka bir yerden okuyorsa), ölçtüğü şey o değildir.
 *
 * NE ÖLÇER
 *   §E kabuk envanteri — her ekran açılır, kutusu ölçülür, kabuk tipi SINIFLANIR
 *                        (tam ekran / kart-modal / alt sayfa) ve kapatma jesti sayılır.
 *   §P palet          — HUD içindeki HER çizilen elemanın `color` ve `background-color`u,
 *                        öğe sayısıyla AĞIRLIKLI. Bir renk kaç öğede görünüyor, o sayılır.
 *   §Ö ölçek          — çizilen border-radius · box-shadow · font-size · font-family kümeleri.
 *                        Tasarım sistemi olan arayüzde bunlar küçük bir ÖLÇEKtir; olmayanda
 *                        her bileşen kendi değerini uydurur. "Çalışılmış hissettirmiyor"un sayısı bu.
 *   §K kaplama        — HUD kromunun ekranda kapladığı alan (sahne ne kadar görünüyor).
 *   §S simge          — SVG simge sayısı vs metin-glif sayısı (plan §9 kuralının denetimi).
 *
 * Çıktı: `docs/olcum-ui-ekran.json` (olcum-ui.ts bunu okur) + `docs/gorsel/ss/s10-*.png`.
 * Koşu:  node tools/shot-ui-s10.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.UI_PORT ?? '', 10) || 5198;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });

/** Telefon kadrajı — arayüz burada YAŞIYOR; masaüstü kadrajı yanlış soruyu ölçer. */
const EKRAN = { width: 390, height: 844 };

/** Açılabilir ekranlar: nav sekmesi / düğme → panelin testid'i. */
const EKRANLAR = [
  { ad: 'gorevler', tikla: '[data-testid="quests"]', panel: '[data-testid="quests-panel"]' },
  { ad: 'hedefler', tikla: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
  { ad: 'magaza', tikla: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
  { ad: 'karakter', tikla: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { ad: 'ayarlar', tikla: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
];

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: EKRAN, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 30000 });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 15000 });
await sayfa.waitForTimeout(1500);

/** Sahne biraz ilerlesin ki HUD boş değil DOLU ölçülsün (görev şeridi, para, tepsi). */
await sayfa.evaluate(() => window.__addMoney?.(5000));
await sayfa.waitForTimeout(800);

const sonuc = { ekran: EKRAN, kabuklar: [], palet: { metin: {}, zemin: {} }, olcek: {}, kaplama: {}, simge: {}, katman: {} };

/**
 * §P/§Ö — çizilen HER elemanın hesaplanmış stili. Kaynak metni değil, EKRAN.
 *
 * İKİ KEZ ÇAĞRILIR ve bu bilerek: arayüz İKİ MALZEMEDEN kurulu (hud.css başlığı) — üst katman
 * ceviz+pirinç overlay, sayfa katmanı krem kâğıt. Yalnız HUD ölçülürse kâğıt katmanının rengi,
 * puntosu ve gölgesi hiç sayılmaz ve palet olduğundan DAR görünür. Sayılar birleşimden çıkar.
 */
async function stilTopla(sayfa) {
  return sayfa.evaluate(() => {
    const kokler = [...document.querySelectorAll('.hud, .modal-backdrop')];
    const hepsi = new Set();
    for (const k of kokler) { hepsi.add(k); for (const e of k.querySelectorAll('*')) hepsi.add(e); }
    const say = (m, k) => { if (k) m[k] = (m[k] ?? 0) + 1; };
    const renk = {}, zemin = {}, yaricap = {}, golge = {}, punto = {}, font = {}, fontOge = {};
    let gorunur = 0;

    // ── Kontrast: metnin ALTINDAKİ gerçek zemini bulup WCAG oranını hesaplar. Zemin statik
    // CSS'ten eşleştirilemez (saydam katmanlar, gradyanlar, miras) — ağaçta YUKARI yürünür.
    const ayir = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const kanal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    const parlaklik = ([r, g, b]) => 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
    const zeminBul = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        // Gradyan varsa İLK durağı temsilci sayarız (en koyu/açık uç değil, üst uç).
        if (s.backgroundImage && s.backgroundImage !== 'none') {
          const m = s.backgroundImage.match(/rgba?\([^)]+\)/);
          if (m) { const v = ayir(m[0]); if ((v[3] ?? 1) > 0.6) return v.slice(0, 3); }
        }
        const v = ayir(s.backgroundColor);
        if (v.length >= 3 && (v[3] ?? 1) > 0.6) return v.slice(0, 3);
      }
      return null;
    };
    const oran = (a, b) => { const l1 = parlaklik(a), l2 = parlaklik(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
    const kontrast = [];
    for (const el of hepsi) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;      // çizilmeyen kural sayılmaz
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none') continue;
      gorunur++;
      // Metin rengi yalnız GERÇEKTEN metin taşıyan öğede sayılır; boş kutunun rengi palet değildir.
      const metin = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (metin) {
        say(renk, s.color); say(punto, s.fontSize);
        const f = s.fontFamily.split(',')[0].replace(/["']/g, '');
        say(font, f);
        const ad = `${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className ?? ''}`.slice(0, 40);
        (fontOge[f] ??= []).push(ad);
        const zr = zeminBul(el), mr = ayir(s.color).slice(0, 3);
        if (zr && mr.length === 3) {
          const px = Number.parseFloat(s.fontSize);
          // WCAG "büyük metin" eşiği: ≥18,66px kalın ya da ≥24px. Oyun HUD'unda çoğu metin küçük.
          const buyuk = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
          kontrast.push({ ad, px, oran: +oran(mr, zr).toFixed(2), esik: buyuk ? 3 : 4.5 });
        }
      }
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') say(zemin, s.backgroundColor);
      if (s.backgroundImage && s.backgroundImage !== 'none') say(zemin, `grad:${s.backgroundImage.slice(0, 60)}`);
      const yc = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].join(' ');
      if (yc !== '0px 0px 0px 0px') say(yaricap, yc);
      if (s.boxShadow && s.boxShadow !== 'none') say(golge, s.boxShadow.replace(/\s+/g, ' ').slice(0, 90));
    }
    return { renk, zemin, yaricap, golge, punto, font, fontOge, kontrast, gorunur, toplam: hepsi.size };
  });
}

/** §S — kaç <svg>, kaç metin-glif çiziliyor (plan §9: her simge SVG olmalı). */
async function simgeTopla(sayfa) {
  return sayfa.evaluate(() => {
    const kokler = [...document.querySelectorAll('.hud, .modal-backdrop')];
    let svg = 0;
    for (const k of kokler) svg += k.querySelectorAll('svg').length;
    // Harf/rakam/noktalama/boşluk DIŞINDAKİ her görünür karakter bir "glif"tir: emoji, ok, çarpı.
    const GLIF = /[^\p{L}\p{N}\p{P}\p{Zs}\p{Cc}]/u;
    let glif = 0; const ornek = [];
    const yur = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { const m = c.textContent.match(GLIF); if (m) { glif++; ornek.push(m[0]); } }
        else if (c.nodeType === 1) yur(c);
      }
    };
    for (const k of kokler) yur(k);
    return { svg, glif, ornek: [...new Set(ornek)] };
  });
}

/** İki toplama sonucunu BİRLEŞTİRİR (sayaçlar toplanır) — katmanlar üst üste ölçülür. */
function birlestir(hedef, kaynak) {
  for (const alan of ['renk', 'zemin', 'yaricap', 'golge', 'punto', 'font']) {
    hedef[alan] ??= {};
    for (const [k, v] of Object.entries(kaynak[alan])) hedef[alan][k] = (hedef[alan][k] ?? 0) + v;
  }
  hedef.fontOge ??= {};
  for (const [k, v] of Object.entries(kaynak.fontOge ?? {})) (hedef.fontOge[k] ??= []).push(...v);
  hedef.kontrast ??= [];
  hedef.kontrast.push(...(kaynak.kontrast ?? []));
  hedef.gorunur = Math.max(hedef.gorunur ?? 0, kaynak.gorunur);
  return hedef;
}

const stilToplam = {};
const temelStil = await stilTopla(sayfa);
birlestir(stilToplam, temelStil);
sonuc.katman.temel = { gorunurOge: temelStil.gorunur, zemin: Object.keys(temelStil.zemin).length };
sonuc.simge = await simgeTopla(sayfa);

// ── §K — HUD kromunun kapladığı alan. Sahne bir tycoon'da BAŞ AKTÖR; krom ne kadar yiyor? ──
sonuc.kaplama = await sayfa.evaluate(({ width, height }) => {
  const parcalar = ['.topbar', '.botnav', '.band', '.side-stack', '.joy', '.joystick', '.joy-base'];
  const kutular = [];
  for (const s of parcalar) for (const el of document.querySelectorAll(s)) {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) kutular.push({ sec: s, x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  }
  // Birleşim alanı: 1 px'lik ızgarada tarama (kutu sayısı az, kaba kuvvet yeter ve doğrudur).
  const dolu = new Uint8Array(width * height);
  for (const k of kutular) {
    const x0 = Math.max(0, Math.floor(k.x)), x1 = Math.min(width, Math.ceil(k.x + k.w));
    const y0 = Math.max(0, Math.floor(k.y)), y1 = Math.min(height, Math.ceil(k.y + k.h));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) dolu[y * width + x] = 1;
  }
  let n = 0; for (let i = 0; i < dolu.length; i++) n += dolu[i];
  return { kutular, kromPiksel: n, ekranPiksel: width * height };
}, EKRAN);

await sayfa.screenshot({ path: path.join(SS, 's10-hud.png') });

// ── §E — kabuk envanteri: her ekran açılır, KUTUSU ölçülür ve kabuk tipi sınıflanır. ──
async function kabukOlc(ad, panelSec, ss) {
  const k = await sayfa.evaluate((sec) => {
    const arka = document.querySelector(sec);
    if (!arka) return null;
    const kart = arka.querySelector('.modal-card') ?? arka.firstElementChild ?? arka;
    const ar = arka.getBoundingClientRect(), kr = kart.getBoundingClientRect();
    const s = getComputedStyle(kart);
    return {
      arka: { w: +ar.width.toFixed(1), h: +ar.height.toFixed(1) },
      kart: { x: +kr.x.toFixed(1), y: +kr.y.toFixed(1), w: +kr.width.toFixed(1), h: +kr.height.toFixed(1) },
      yaricap: s.borderTopLeftRadius, zemin: s.backgroundColor,
      kapat: {
        carpi: !!arka.querySelector('.sheet-x, .modal-x'),
        geri: !!arka.querySelector('.sheet-back, .modal-back'),
        // Arka plana tıklayınca kapanıyor mu — React onClick DOM'dan okunamaz. Eskiden KABUK
        // SINIFI belirliyordu; K3 (tam ekran) bunu yalancı yaptı: kart perdeyi tamamen örtünce
        // `modal-backdrop` sınıfı duruyor ama tıklanacak arka KALMIYOR. Ölçü artık kaplamaya
        // bakıyor — kart ekranı doldurmuyorsa arka var, dolduruyorsa yok.
        arkaTikla:
          (arka.classList.contains('modal-backdrop') || arka.classList.contains('sheet-backdrop')) &&
          !(kr.width >= ar.width - 2 && kr.height >= ar.height - 2),
      },
    };
  }, panelSec);
  if (!k) { sonuc.kabuklar.push({ ad, hata: 'panel açılmadı' }); return; }
  const oranW = k.kart.w / k.arka.w, oranH = k.kart.h / k.arka.h;
  k.ad = ad; k.oranW = +oranW.toFixed(3); k.oranH = +oranH.toFixed(3);
  k.tip = oranW > 0.97 && oranH > 0.97 ? 'tam ekran'
    : k.kart.y + k.kart.h > k.arka.h - 4 && k.kart.y > 4 ? 'alt sayfa'
      : 'kart-modal';
  sonuc.kabuklar.push(k);
  await sayfa.screenshot({ path: path.join(SS, ss) });
}

for (const e of EKRANLAR) {
  const dugme = await sayfa.$(e.tikla);
  if (!dugme) { sonuc.kabuklar.push({ ad: e.ad, hata: `düğme yok: ${e.tikla}` }); continue; }
  await dugme.click();
  await sayfa.waitForSelector(e.panel, { timeout: 6000 }).catch(() => {});
  await sayfa.waitForTimeout(500);
  await kabukOlc(e.ad, e.panel, `s10-${e.ad}.png`);
  // Sayfa AÇIKKEN ölç: kâğıt katmanının rengi/puntosu/gölgesi yalnız burada görünür.
  birlestir(stilToplam, await stilTopla(sayfa));
  const sm = await simgeTopla(sayfa);
  sonuc.simge.svg = Math.max(sonuc.simge.svg, sm.svg);
  sonuc.simge.glif = Math.max(sonuc.simge.glif, sm.glif);
  sonuc.simge.ornek = [...new Set([...sonuc.simge.ornek, ...sm.ornek])];
  // K3'te tek çıkış GERİ düğmesi (perde yok). Eski perde tıklaması yedek olarak duruyor —
  // kabuk değişirse ölçüm sessizce yarım kalmasın, ekran gerçekten kapansın.
  const geri = await sayfa.$(`${e.panel} .sheet-back`);
  if (geri) await geri.click();
  else await sayfa.mouse.click(EKRAN.width / 2, 6);
  await sayfa.waitForTimeout(400);
}

sonuc.palet = { metin: stilToplam.renk, zemin: stilToplam.zemin };
sonuc.olcek = {
  yaricap: stilToplam.yaricap, golge: stilToplam.golge, punto: stilToplam.punto,
  font: stilToplam.font, fontOge: stilToplam.fontOge, kontrast: stilToplam.kontrast,
  gorunurOge: stilToplam.gorunur, toplamOge: temelStil.toplam,
};

writeFileSync(path.join(KOK, 'docs', 'olcum-ui-ekran.json'), JSON.stringify(sonuc, null, 2));
console.log(`ok — ${sonuc.kabuklar.length} kabuk · ${Object.keys(sonuc.olcek.yaricap).length} yaricap · ${Object.keys(sonuc.olcek.golge).length} golge · ${Object.keys(sonuc.palet.zemin).length} zemin rengi · svg ${sonuc.simge.svg} glif ${sonuc.simge.glif}`);

await tarayici.close();
sunucu.kill('SIGTERM');
