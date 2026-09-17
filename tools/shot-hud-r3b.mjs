/**
 * shot-hud-r3b.mjs — R3'ÜN İKİNCİ KARAR YÜZEYİ: kullanıcının SEÇERKEN açtığı üç ince çatal.
 *
 * NEDEN İKİNCİ TUR: karar paketi üç soruyu kapattı (A4 · B2 · C1) ama üç yenisini açtı ve
 * üçü de "hangisi güzel" sorusu — `feedback_show_dont_ask` gereği metinle kol anlatılmaz:
 *
 *   §D2 MADALYONUN İÇİ — kullanıcı G kapsülünü seçti ama *"4'ün arkasında yıldız gözükmüyor
 *       bile ... yıldız yarım, kötü duruyor"*. Sebep ölçülebilir: `.rep-num`un 5 px'lik OT
 *       konturu 56 px'lik madalyonun ortasını kaplıyor, yıldızdan geriye yalnız uç dilimleri
 *       kalıyor. Kullanıcının kendi iki önerisi de kol: yıldızı kaldır · zemini açık mora al.
 *   §E2 KESENİN DİZİLİMİ — F hap çerçevesi seçildi, *"yan yana mı alt alta mı bilemedim"*.
 *       Bu çatalın ölçülebilir yanı var: yan yana dizilim üst şeridi genişletir, rozetin
 *       kapsülüyle çakışabilir. Kareyle birlikte ŞERİDİN kalan payı da basılır.
 *   §C2 ÖDÜL SATIRI — C1 uygulandı ama *"+%0,4 yazıyor ya, çok fazla işaret var"*. Satırda
 *       beş işaret üst üste biniyor: ikon · "+" · "%" · ondalık · iki kelime.
 *
 * Adayların hepsi ENJEKTE CSS/DOM'dur — uygulama kaynağına dokunulmaz, yani bu araç bir
 * "yarı uygulama" bırakmaz. Seçilen aday sonra elle koda taşınır.
 *
 * Çıktı: `docs/gorsel/ss/r3b-aday-{madalyon,kese,odul}-*.png` + `docs/olcum-hud-r3b.txt`
 * Koşu:  node tools/shot-hud-r3b.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.HUD_PORT ?? '', 10) || 5237;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });
const satirlar = [];
const y = (s) => { satirlar.push(s); console.log(s); };

/* ═══════════════ §D2 — MADALYONUN İÇİ ═══════════════
   Taban HER adayda aynı: kullanıcının seçtiği G kapsülü (madalyon sola gömülü, bar kapsülün
   içinde). Değişen yalnız madalyonun İÇİ. */
const KAPSUL = `
  .rep { flex-direction: row; align-items: center; gap: 0; }
  .rep-medal { z-index: 2; }
  .rep-bar {
    width: 112px; height: 22px; margin-left: -26px;
    border: 2.5px solid var(--ot); border-radius: var(--rr); background: var(--oyuk);
  }
  .rep-fill { inset: 2.5px auto 2.5px 2.5px; }
`;
/** Madalyon SVG'sinin parçaları: `circle` = disk, `path` = yıldız (icons.tsx · ReputationIcon). */
const DISK = '.rep-medal svg circle';
const YILDIZ = '.rep-medal svg path';

const MADALYON = [
  { id: 'A', ad: 'bugunku — koyu disk + amber yildiz (sayinin konturu yildizi yiyor)', css: '' },
  {
    id: 'B', ad: 'YILDIZSIZ: duz koyu disk, ortada sayi',
    css: `${YILDIZ} { display: none; }`,
  },
  {
    id: 'C', ad: 'YILDIZSIZ + ACIK MOR disk (kullanicinin ikinci onerisi)',
    css: `${YILDIZ} { display: none; } ${DISK} { fill: #6b5bd6; }`,
  },
  {
    id: 'D', ad: 'ACIK MOR disk + amber yildiz (yildiz kalir, zemin acilir)',
    css: `${DISK} { fill: #6b5bd6; }`,
  },
  {
    id: 'E', ad: 'yildiz DISKIN ICINE SIGAR (kucultulmus, ucu kesilmiyor) + ince sayi konturu',
    css: `${YILDIZ} { transform: translate(12px, 12px) scale(0.86) translate(-12px, -12px); }
          .rep-num { -webkit-text-stroke-width: 3px; }`,
  },
  {
    id: 'F', ad: 'yildiz FILIGRAN: acik mor diskin uzerinde bir ton koyu, sayi one cikar',
    css: `${DISK} { fill: #6b5bd6; } ${YILDIZ} { fill: #5a4bc0; stroke: #5a4bc0; }`,
  },
  {
    id: 'G', ad: 'YILDIZSIZ + iki tonlu disk (ust acik / alt koyu) — low-poly madalyon',
    css: `.rep-medal svg { visibility: hidden; }
          .rep-medal::before {
            content: ''; position: absolute; inset: 2px; border-radius: 50%;
            border: 3px solid var(--ot); box-sizing: border-box;
            background: linear-gradient(180deg, #7a6ae0 0%, #7a6ae0 48%, #4a3bb0 48%, #4a3bb0 100%);
          }
          .rep-num { z-index: 1; }`,
  },
  {
    id: 'H', ad: 'YILDIZSIZ + acik mor disk + AMBER kontur halkasi (madalyon hissi)',
    css: `${YILDIZ} { display: none; } ${DISK} { fill: #6b5bd6; }
          .rep-medal::after {
            content: ''; position: absolute; inset: 5px; border-radius: 50%;
            border: 3px solid var(--ac); pointer-events: none;
          }`,
  },
  {
    id: 'I', ad: 'MADALYON YILDIZIN KENDISI: disk yok, tam yildiz rozet, sayi icinde',
    css: `${DISK} { display: none; }
          ${YILDIZ} { d: path('M12 1.8l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2L12 18.2l-6.4 3.4 1.2-7.2L1.6 9.3l7.2-1z');
                      fill: var(--ac); stroke: var(--ot); stroke-width: 2.2px; }
          .rep-num { -webkit-text-stroke-width: 4px; transform: translateY(-38%); }`,
  },
];

/* ═══════════════ §E2 — KESENİN DİZİLİMİ ═══════════════
   Taban HER adayda aynı: kullanıcının seçtiği F hapı (kenar para birimine göre renkli).
   Değişen yalnız iki hapın birbirine göre yeri. */
const HAP = `
  .cur { padding: 3px 12px 3px 4px; border: 2.5px solid var(--ot); border-radius: var(--rr);
         background: rgba(27,20,67,0.85); box-shadow: inset 0 0 0 2px var(--para); }
  .cur.gem { box-shadow: inset 0 0 0 2px #8fd8ff; }
`;
const KESE = [
  { id: 'ALT', ad: 'F hap · ALT ALTA (bugunku dizilim)', css: '' },
  { id: 'YAN', ad: 'F hap · YAN YANA (tek satir)', css: `.purse { flex-direction: row; align-items: center; gap: 6px; }` },
  {
    id: 'YANB', ad: 'F hap · YAN YANA + elmas bir tik kucuk (para bas aktor kalir)',
    css: `.purse { flex-direction: row; align-items: center; gap: 6px; }
          .cur.gem { padding: 2px 9px 2px 3px; }`,
  },
];

/* ═══════════════ §C2 — ÖDÜL SATIRININ İŞARETLERİ ═══════════════
   C1 kodda UYGULANDI (ödüller alt alta, arada "+"), yani taban artık C1'dir. Adaylar yalnız
   BONUS satırının kaç işaret taşıdığını değiştiriyor. Metin DOM'dan yeniden yazılıyor. */
const ODUL_DOM = (kip) => `(() => {
  const sat = document.querySelectorAll('.reward-amount .odul-sat');
  const bonus = sat[0]; if (!bonus) return;
  bonus.querySelector('.odul-etiket')?.remove();
  const svg = bonus.querySelector('svg');
  if (svg) svg.style.display = '';
  // METİN TEK DÜĞÜM DEĞİL: JSX \`{yuzde(bonus)} kalıcı gelir\` üç ayrı metin düğümü üretiyor
  // (" " · "+%0,4" · " kalıcı gelir"). İlkini bulup yazmak, ikincisini ekranda bırakıyordu —
  // ilk koşuda D ve E kolları taban metniyle aynı çıktı, kusur buydu.
  const dugumler = [...bonus.childNodes].filter((d) => d.nodeType === 3);
  const dugum = dugumler[0];
  if (!dugum) return;
  if (!bonus.dataset.ham) bonus.dataset.ham = dugumler.map((d) => d.textContent).join('');
  for (const d of dugumler.slice(1)) d.textContent = '';
  const ham = bonus.dataset.ham;                      // " +%0,4 kalıcı gelir"
  const sayi = (ham.match(/\\+%[\\d,]+/) || [''])[0];   // "+%0,4"
  const kip = '${kip}';
  bonus.classList.remove('iki-katman');
  if (kip === 'taban') { dugum.textContent = ham; return; }
  if (kip === 'ikonsuz') { dugum.textContent = ham; if (svg) svg.style.display = 'none'; return; }
  if (kip === 'kisa') { dugum.textContent = ' ' + sayi + ' gelir'; return; }
  if (kip === 'yalin') { dugum.textContent = ' ' + sayi; return; }
  if (kip === 'katman') {
    dugum.textContent = ' ' + sayi;
    const e = document.createElement('small');
    e.className = 'odul-etiket'; e.textContent = 'kalıcı gelir';
    bonus.after(e); bonus.classList.add('iki-katman');
    return;
  }
})()`;
const ODUL_CSS = `
  .odul-etiket {
    display: block; margin-top: -2px; font-family: var(--font-ui, inherit);
    font-size: var(--p2); font-weight: 800; letter-spacing: 0.04em;
    color: var(--tx2); -webkit-text-stroke: 0; text-transform: uppercase;
  }
`;
/* ═══════════════ §C3 — ÖDÜL SATIRININ İKİNCİ TURU ═══════════════
   Kullanıcı ilk turda B'ye (ikonsuz) yaklaştı ama *"bu ödülü daha düzgün söylemenin başka bir
   yolu yok mu? bi araştırsan"* dedi. İki dış referans aynı yere çıkıyor: Idle Miner Tycoon
   kalıcı yükseltmeyi *"Double Cash forever"*, Idle Restaurant Tycoon *"%30 Profit Boost"* diye
   yazıyor — ikisi de KÜTLELİ bir sayı + gündelik kelime. Bizim sayımız ise %0,4: küçük, ondalıklı
   ve tek başına hiçbir şey hissettirmiyor. Yani asıl sorun kelime sayısı değil, SAYININ KENDİSİ;
   bu yüzden bu turda kolların bir kısmı metni değil, GÖSTERİLEN BÜYÜKLÜĞÜ değiştiriyor
   (deltayı değil TOPLAMI göster, ya da etkiyi cümleyle söyle). İkonu hepsinden attım —
   kullanıcı *"ikon çok karmaşa oluşturuyomuş"* dedi. */
const ODUL2_CSS = `
  .reward-amount .odul-sat.iki-kat { flex-direction: column; gap: 0; line-height: 1.05; }
  .reward-amount .kucuk-etiket {
    font-family: var(--font-ui, inherit); font-size: var(--p2); font-weight: 800;
    letter-spacing: .05em; color: var(--tx2); -webkit-text-stroke: 0;
  }
  .reward-amount .ok { opacity: .55; margin: 0 2px; }
  .reward-amount .eski { opacity: .5; }
  .reward-amount .hap {
    font-family: var(--font-ui, inherit); font-size: var(--p1); font-weight: 800;
    letter-spacing: .06em; color: var(--tx); -webkit-text-stroke: 0;
    padding: 2px 8px 3px; border-radius: 99px; background: var(--oyuk); align-self: center;
  }
  .reward-amount .cumle {
    font-family: var(--font-ui, inherit); font-size: var(--p3); font-weight: 800;
    color: var(--tx); -webkit-text-stroke: 0; line-height: 1.25; max-width: 240px;
  }
  .reward-amount .cumle b { color: var(--para); }
`;
/** Bonus satırının İÇERİĞİNİ tamamen yeniden yazar (ikon dahil) — kol başına bir HTML. */
const ODUL2_DOM = (html) => `(() => {
  const sat = document.querySelectorAll('.reward-amount .odul-sat');
  const bonus = sat[0]; if (!bonus) return;
  // §C2'nin "katman" kolu satırın ALTINA bir etiket bırakıyor; ikinci tur kendi zeminini kurar.
  document.querySelectorAll('.reward-amount .odul-etiket').forEach((e) => e.remove());
  bonus.className = 'odul-sat';
  bonus.innerHTML = ${JSON.stringify(html)};
  if (bonus.querySelector('.iki-kat-im')) bonus.classList.add('iki-kat');
})()`;
const ODUL2 = [
  { id: 'B', ad: 'IKONSUZ (kullanicinin su anki favorisi): "+%0,4 kalici gelir"',
    html: '+%0,4 kalıcı gelir' },
  { id: 'K1', ad: 'KELIME ONDE: "Kalici gelir +%0,4" — once ne, sonra ne kadar',
    html: '<span class="kucuk-etiket">Kalıcı gelir</span>&nbsp;+%0,4' },
  { id: 'K2', ad: 'IKI KATMAN: buyuk "+%0,4", altinda kucuk "kalici gelir"',
    html: '<i class="iki-kat-im"></i>+%0,4<span class="kucuk-etiket">kalıcı gelir</span>' },
  { id: 'K3', ad: 'TOPLAMI GOSTER: "%3,2 → %3,6" (delta degil, statin kendisi oynuyor)',
    html: '<i class="iki-kat-im"></i><span class="kucuk-etiket">Kalıcı gelir</span>'
        + '<span><span class="eski">%3,2</span><span class="ok">→</span>%3,6</span>' },
  { id: 'K4', ad: 'HAP ETIKET: kucuk "KALICI" hapi + "+%0,4 gelir"',
    html: '<span class="hap">KALICI</span>+%0,4 gelir' },
  { id: 'K5', ad: 'CUMLE: "Artik her satistan %0,4 fazla kazaniyorsun" (sayi degil ETKI)',
    html: '<span class="cumle">Artık her satıştan <b>%0,4</b> fazla kazanıyorsun</span>' },
  { id: 'K6', ad: 'SONSUZA DEK (Idle Miner kalibi): "+%0,4 gelir · sonsuza dek"',
    html: '<i class="iki-kat-im"></i>+%0,4 gelir<span class="kucuk-etiket">sonsuza dek</span>' },
];

const ODUL = [
  { id: 'A', ad: 'C1 tabani — ikon + "+%0,4 kalici gelir" (bes isaret)', kip: 'taban' },
  { id: 'B', ad: 'IKONSUZ — "+%0,4 kalici gelir" (ikon gereksiz: "gelir" zaten soyluyor)', kip: 'ikonsuz' },
  { id: 'C', ad: 'KISA — ikon + "+%0,4 gelir" (bir kelime dusuyor)', kip: 'kisa' },
  { id: 'D', ad: 'YALIN — ikon + "+%0,4" (kelime yok, baslik zaten kademeyi soyluyor)', kip: 'yalin' },
  { id: 'E', ad: 'IKI KATMAN — buyuk "+%0,4", altinda kucuk "KALICI GELIR" etiketi', kip: 'katman' },
];

// ═══════════════ KOŞU ═══════════════
const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const konsol = [];
sayfa.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
await sayfa.evaluate(() => window.__addMoney(5_000_000));
await sayfa.evaluate(() => window.__advanceTime(180));
await sayfa.waitForTimeout(900);
await sayfa.evaluate(() => window.__setState({ diamonds: 500, xp: 340 }));
await sayfa.addStyleTag({ content: '.dsb-fab, .dsb { display: none !important; }' });
await sayfa.waitForTimeout(600);

/** Bir kolun CSS'ini (ve varsa DOM kodunu) uygular. */
async function kolAc(css, dom) {
  await sayfa.evaluate((c) => {
    document.getElementById('aday')?.remove();
    if (!c) return;
    const s = document.createElement('style'); s.id = 'aday'; s.textContent = c;
    document.head.appendChild(s);
  }, css);
  if (dom) await sayfa.evaluate((kod) => { new Function(kod)(); }, dom);
  await sayfa.waitForTimeout(380);
}
const kolKapa = () => sayfa.evaluate(() => document.getElementById('aday')?.remove());

// ── §D2: madalyonun içi (hepsi G kapsülünün üstünde) ────────────────────────────────────────
y('§D2 — MADALYONUN İÇİ (taban: kullanıcının seçtiği G kapsülü)');
for (const a of MADALYON) {
  await kolAc(KAPSUL + a.css, null);
  await sayfa.screenshot({ path: path.join(SS, `r3b-aday-madalyon-${a.id}.png`), clip: { x: 0, y: 0, width: 210, height: 110 } });
  y(`  ${a.id} — ${a.ad}`);
}
await kolKapa();

// ── §E2: kesenin dizilimi — kare + ŞERİDİN KALAN PAYI ───────────────────────────────────────
y('');
y('§E2 — KESENİN DİZİLİMİ (taban: kullanıcının seçtiği F hapı) · ölçü: şeridin kalan payı');
y('  kol     | değer     | kese eni | kese boyu | rozet↔kese açıklık | ekrana kalan pay');
for (const a of KESE) {
  for (const [etiket, para, elmas] of [['normal', 5_000_000, 500], ['uzun', 999_990_000, 12_345]]) {
    await sayfa.evaluate(([p, e]) => window.__setState({ wallet: String(p), diamonds: e }), [para, elmas]);
    await kolAc(KAPSUL + HAP + a.css, null);
    const ol = await sayfa.evaluate(() => {
      const r = document.querySelector('.rep')?.getBoundingClientRect();
      const k = document.querySelector('.purse')?.getBoundingClientRect();
      const s = document.querySelector('.topbar')?.getBoundingClientRect();
      if (!r || !k || !s) return null;
      return { rSag: r.right, kSol: k.left, kEn: k.width, kBoy: k.height, sSag: s.right, sSol: s.left };
    });
    if (ol) {
      y(`  ${(a.id + '     ').slice(0, 7)} | ${(etiket + '      ').slice(0, 9)} | ${ol.kEn.toFixed(1).padStart(8)} | ${ol.kBoy.toFixed(1).padStart(9)} | ${(ol.kSol - ol.rSag).toFixed(1).padStart(18)} | ${(ol.sSag - ol.kSol - ol.kEn).toFixed(1).padStart(16)}`);
    } else y(`  ${a.id} ${etiket} — ÖLÇÜLEMEDİ`);
    await sayfa.screenshot({ path: path.join(SS, `r3b-aday-kese-${a.id}-${etiket}.png`), clip: { x: 0, y: 0, width: 390, height: 110 } });
  }
}
await kolKapa();
await sayfa.evaluate(() => window.__setState({ wallet: '5000000', diamonds: 500 }));

// ── §C2: ödül satırının işaretleri ──────────────────────────────────────────────────────────
y('');
y('§C2 — ÖDÜL SATIRININ İŞARETLERİ (taban: kodda UYGULANMIŞ C1)');
await sayfa.click('[data-testid="level"]', { timeout: 8000 });
await sayfa.waitForSelector('[data-testid="goals-panel"]', { timeout: 8000 });
await sayfa.waitForTimeout(500);
const dugme = sayfa.locator('[data-testid^="goal-claim-"]').first();
if (await dugme.count()) {
  await dugme.click();
  await sayfa.waitForSelector('[data-testid="goal-reward"]', { timeout: 8000 });
  await sayfa.waitForTimeout(700);
  for (const a of ODUL) {
    await kolAc(ODUL_CSS, ODUL_DOM(a.kip));
    const ol = await sayfa.evaluate(() => {
      const s = document.querySelector('.reward-amount .odul-sat');
      const k = document.querySelector('.reward-card');
      if (!s || !k) return null;
      const sr = s.getBoundingClientRect(), kr = k.getBoundingClientRect();
      const ic = kr.width - 2 * parseFloat(getComputedStyle(k).paddingLeft);
      return { en: sr.width, ic, oran: sr.width / ic };
    });
    await sayfa.locator('.reward-card').screenshot({ path: path.join(SS, `r3b-aday-odul-${a.id}.png`) });
    y(`  ${a.id} — ${a.ad}${ol ? ` · satır ${ol.en.toFixed(1)} / iç en ${ol.ic.toFixed(1)} = ${ol.oran.toFixed(3)}` : ''}`);
  }
  await kolKapa();

  y('');
  y('§C3 — ÖDÜL SATIRI, İKİNCİ TUR (hepsi İKONSUZ; bir kısmı sayının kendisini değiştiriyor)');
  for (const a of ODUL2) {
    await kolAc(ODUL_CSS + ODUL2_CSS, ODUL2_DOM(a.html));
    const ol = await sayfa.evaluate(() => {
      const s = document.querySelector('.reward-amount .odul-sat');
      const k = document.querySelector('.reward-card');
      if (!s || !k) return null;
      const sr = s.getBoundingClientRect(), kr = k.getBoundingClientRect();
      const ic = kr.width - 2 * parseFloat(getComputedStyle(k).paddingLeft);
      return { en: sr.width, boy: sr.height, ic, oran: sr.width / ic };
    });
    await sayfa.locator('.reward-card').screenshot({ path: path.join(SS, `r3b-aday-odul2-${a.id}.png`) });
    y(`  ${a.id} — ${a.ad}${ol ? ` · satır ${ol.en.toFixed(1)}×${ol.boy.toFixed(1)} / iç en ${ol.ic.toFixed(1)} = ${ol.oran.toFixed(3)}` : ''}`);
  }
  await kolKapa();
} else y('  ATLANDI — toplanabilir hedef yok, ödül ekranı açılamadı');

y('');
y(`konsol hatası: ${konsol.length}`);
for (const k of konsol.slice(0, 5)) y(`  ! ${k}`);

writeFileSync(path.join(KOK, 'docs', 'olcum-hud-r3b.txt'), satirlar.join('\n') + '\n', 'utf8');
await sayfa.close();
await tarayici.close();
sunucu.kill();
console.log(`\nmadalyon ${MADALYON.length} · kese ${KESE.length}×2 · ödül ${ODUL.length} → docs/gorsel/ss/r3b-aday-*.png`);
process.exit(0);
