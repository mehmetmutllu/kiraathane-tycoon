/**
 * olcum-panel-f1b.mjs — F1b TUR 2: AÇILAN EKRANLAR + YD REVİZE + TABLET BASAMAĞI.
 *
 * NEDEN VAR — kapsam deliği, eksiklik değil. F1b'nin ilk turu yalnız HUD'u ölçtü. Kullanıcı
 * karar paketine bakınca *"bana açılan ekranlar nasıl duracak onları da göstermen gerek"*
 * dedi (G-54). Bu bir "şunu da ekle" değil: yön kararı verilirken **açılan ekranların o yönde
 * ne yaptığı bilinmiyordu**, yani karar eksik öncüle oturacaktı. Kısa ekranda panel yüksekliği
 * en olası kırılma noktasıdır ve hiç bakılmamıştı.
 *
 * DÖRT BÖLÜM (ilk üçü planlıydı, §I ölçüm sırasında KAREDEN doğdu):
 *   §F  açılan ekranlar — 5 panel × 3 kadraj = 15 hücre
 *   §G  YD REVİZE (G-51 + G-52) — şerit ve nav ikisi de doğal genişlik + ORTALI
 *   §H  TABLET BASAMAĞI (G-55) — taban ↔ mevcut ölçeğin bir üst basamağı
 *   §I  PANEL YERLEŞİMİ — 4 kol × 5 panel, telefon yatayı (§F'nin karesi doğurdu)
 *
 * KOLLAR GERÇEK OYUNUN ÜSTÜNE CSS KATMANI OLARAK UYGULANIR (`addStyleTag`); depoda hiçbir şey
 * değişmez. "Göster, sonra karar al" sırası böyle korunuyor (D-084): kolun hem karesi hem
 * sayısı karar ÖNCESİ elde edilir, kod sonra yazılır.
 *
 * TUR 1'İN İKİ DERSİ BU ARACA YAZILI:
 *   · HUD sayımı `background-color` alfasına ek olarak zemin GÖRSELİNİ (gradyan) ve görünür
 *     kenarlığı da sayar — tur 1'de `.band`/`.botnav` bu yüzden sayımdan düşmüştü (İYİMSER hata).
 *   · Her hücre bir DÜNYA İMZASI basar. Tur 1'de dünyanın hiç kurulmadığı ancak imza satırıyla
 *     anlaşılmıştı; imza olmadan "ölçtüm" demek "aynı sahneyi ölçtüm" anlamına gelmiyor.
 *
 * Koşu: node tools/olcum-panel-f1b.mjs   ·   OLCUM=kisa ile kadraj/panel sayısı kısılır
 *       F1B_PORT=5215 ile port değiştirilir
 * Çıktı: docs/gorsel/ss/f1b-panel-*.png · f1b-yd-*.png · f1b-tablet-*.png · f1b-yerlesim-*.png
 *        + stdout tablo (ham çıktı: docs/olcum-panel-f1b.txt)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5215;
const KISA = (process.env.OLCUM ?? 'tam').toLowerCase() === 'kisa';
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

/** Pad listesi ELLE YAZILMAZ — tur 1'in 5. kusuru buydu (liste bayatlamıştı). */
const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const KADRAJLAR = [
  { id: 'P1', ad: 'portre 20:9', w: 412, h: 915, dpr: 2.625 },
  { id: 'L1', ad: 'telefon yatayi 20:9', w: 915, h: 412, dpr: 2.625 },
  { id: 'T2', ad: 'tablet yatayi 4:3', w: 1280, h: 800, dpr: 2 },
];

/** Beş ekran. `ac` = paneli açan tıklama hedefi (HUD'daki gerçek düğme). */
const PANELLER = [
  { id: 'quests', ad: 'Gorevler', tetik: '[data-testid="quests"]', panel: '[data-testid="quests-panel"]' },
  { id: 'goals', ad: 'Hedefler', tetik: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
  { id: 'shop', ad: 'Magaza', tetik: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
  { id: 'char', ad: 'Karakter', tetik: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { id: 'menu', ad: 'Ayarlar', tetik: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
];

/**
 * §G KOLLARI — kullanıcının iki cümlesi doğrudan kola çevrildi (`feedback_ui_form_not_color`).
 *
 * G-51: *"görev neden sola yaslı ortada olamaz mı?"*  → şerit ORTALANIR.
 * G-52: *"bence navbar da görev de ortada daha iyi"*  → nav zaten ortalıydı, ONAYLANDI.
 *
 * Kullanıcı YD'nin GENİŞLİĞİNİ onayladı, HİZASINI reddetti. YD+ bu yüzden YD'nin aynısı,
 * tek fark şeridin `right:auto` yerine `left:50% + translateX(-50%)` ile ortalanması.
 * Hipotez: HUD% ve açık zemin GENİŞLİKTEN türediği için hizadan bağımsız — yani YD+ ile YD'nin
 * sayıları AYNI çıkmalı. Bu hipotez ölçülmeden yazılamaz; ölçülüyor.
 */
const YD_ORTAK = `
  .botnav {
    left: 50%; right: auto; transform: translateX(-50%);
    width: auto; gap: 10px;
    padding: 6px 20px calc(var(--sab) + 6px);
    border: 3px solid var(--ot); border-bottom: none;
    border-radius: 18px 18px 0 0;
  }
  .navtab { flex: 0 0 auto; padding: 4px 14px; }
`;

const YD_KOLLARI = [
  { id: 'Y0', ad: 'Taban (bugun)', css: '' },
  {
    id: 'YD',
    ad: 'Dogal genislik — SOLA YASLI (tur 1)',
    css: `${YD_ORTAK}\n  .band { right: auto; width: min(430px, 56vw); }`,
  },
  {
    id: 'YD+',
    ad: 'Dogal genislik — ORTALI (G-51 revizesi)',
    css: `${YD_ORTAK}\n  .band { left: 50%; right: auto; width: min(430px, 56vw); transform: translateX(-50%); }`,
  },
];

/**
 * §H KOLLARI — G-55: *"tablette level barını vs biraz daha büyütebilirsin aynı şekilde
 * kaynaklar ve butonları da"*.
 *
 * KURALIN KENDİSİ (D-128, `index.css`'te yazılı): **dar ekranda basamak AŞAĞI inilir** (p3 → p2),
 * yeni punto uydurulmaz. Tabletin doğru hamlesi bunun simetriği: **mevcut ölçeğin bir basamak
 * YUKARISI**. Aşağıdaki her sayı ölçekten alınmıştır, hiçbiri icat edilmemiştir:
 *   --p1 11 → --p2 13 · --p2 13 → --p3 15 · --p3 15 → --p4 18
 *   --pill-h 32 → 38 (taban 32'nin dar dalı 28/26; 38 aynı ritmin bir üstü)
 * Madalyon (`.lvl-star` 52), kese ikonu (30) ve yuvarlak düğmeler (`.round-btn`) aynı oranla
 * (×1,18) ölçeklenir — oran `--pill-h`in 32→38 adımından türetildi, ayrıca seçilmedi.
 */
const TABLET_KOLLARI = [
  { id: 'T0', ad: 'Tablet TABAN (bugun)', css: '' },
  {
    id: 'T+',
    ad: 'Tablet BIR BASAMAK YUKARI (G-55)',
    css: `
      .hud { --pill-h: 38px; }
      .lvl-star { width: 52px; height: 52px; left: -13px; }
      .lvl-num { font-size: var(--p4); }
      .lvl-bar { width: 84px; height: 17px; }
      .lvl-text { font-size: var(--p2); line-height: 17px; }
      .cur-item { min-width: 80px; padding: 0 13px 0 27px; }
      .cur-item > svg { width: 36px; height: 36px; }
      .cur-val { font-size: var(--p3); }
      .round-btn { width: 46px; height: 46px; }
      .round-btn > svg { width: 26px; height: 26px; }
      .navtab-label { font-size: var(--p2); }
      .band-title { font-size: var(--p3); }
      .band-sub, .band-count { font-size: var(--p2); }
    `,
  },
  {
    id: 'T+D',
    ad: 'Bir basamak yukari + YD+ (birlikte)',
    css: `
      .hud { --pill-h: 38px; }
      .lvl-star { width: 52px; height: 52px; left: -13px; }
      .lvl-num { font-size: var(--p4); }
      .lvl-bar { width: 84px; height: 17px; }
      .lvl-text { font-size: var(--p2); line-height: 17px; }
      .cur-item { min-width: 80px; padding: 0 13px 0 27px; }
      .cur-item > svg { width: 36px; height: 36px; }
      .cur-val { font-size: var(--p3); }
      .round-btn { width: 46px; height: 46px; }
      .round-btn > svg { width: 26px; height: 26px; }
      .navtab-label { font-size: var(--p2); }
      .band-title { font-size: var(--p3); }
      .band-sub, .band-count { font-size: var(--p2); }
      ${YD_ORTAK}
      .band { left: 50%; right: auto; width: min(430px, 56vw); transform: translateX(-50%); }
    `,
  },
];

/**
 * §I KOLLARI — PANEL YERLEŞİMİ, telefon yatayı. Bu bölüm ölçüm sırasında DOĞDU, plandan değil.
 *
 * §F'nin karesi (`ss/f1b-panel-goals-L1.png`) sayının söylemediğini gösterdi: yatayda panel
 * 915 px'lik ekranın ortasında **520 px'lik dar bir sütun**, iki yanda 395 px bomboş zemin.
 * Yani ekranın BOL olan ekseni (genişlik) israf ediliyor, KIT olan eksende (yükseklik) 2,24×
 * kaydırma var ve ödül-alma düğmesi alt kenarda kesiliyor. Sayı bunu tek başına söylemiyordu;
 * kabuk 520×412 satırı "dar sütun" diye okunmuyor — kare okuyor. (Turun 2. dersi, üçüncü kez.)
 *
 * Kolların ortak fikri: kıt ekseni bol eksene çevirmek. Hiçbiri yeni punto/yeni renk getirmez,
 * yalnız kabuğun genişliğini ve gövdenin akışını değiştirir.
 */
const PANEL_KOLLARI = [
  { id: 'P0', ad: 'Taban — 520 px sutun', css: '' },
  {
    id: 'PA',
    ad: 'GENIS KABUK (tek sutun, 820 px)',
    /* En ucuz kol: yalnız kabuk genişler. Kartlar full-width satır olduğu için yükseklik
       BEKLENTİSİ düşmüyor — bu kolun işi tam olarak o beklentiyi SINAMAK. Düşmezse kol düşer. */
    css: `@media (orientation: landscape) and (max-height: 480px) {
      .modal-card.screen { width: min(100%, 820px); }
    }`,
  },
  {
    id: 'PB',
    ad: 'IKI SUTUN (genis kabuk + gride akan govde)',
    /* Kıt eksen (yükseklik) bol eksene (genişlik) çevriliyor: gövde iki sütuna akıyor.
       Bölüm kuşakları (`.sheet-sec`) ve üst özet kartı tam satır kalır ki ekranın iskeleti
       (S12'nin işi) bozulmasın. */
    css: `@media (orientation: landscape) and (max-height: 480px) {
      .modal-card.screen { width: min(100%, 880px); }
      .sheet-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; align-content: start; }
      .sheet-body > .sheet-sec, .sheet-body > .rep-card, .sheet-body > .usta-strip,
      .sheet-body > .sheet-foot-note, .sheet-body > .char-head { grid-column: 1 / -1; }
      .sheet-pad { display: contents; }
    }`,
  },
  {
    id: 'PC',
    ad: 'TAM EN (kenardan kenara, tek sutun)',
    /* Karşı uç: panel ekranın tamamını kaplar. Kullanıcının *"tüm ekran kaplayınca kötü
       duruyor"* cümlesi HUD içindi; panel için aynı şeyi söyleyip söylemediği BİLİNMİYOR —
       bu yüzden kol ölçülüyor, varsayılmıyor. */
    css: `@media (orientation: landscape) and (max-height: 480px) {
      .modal-card.screen { width: 100%; }
    }`,
  },
];

// ─────────────────────────── tarayıcı içinde koşan ölçüler ───────────────────────────

/** Boyalı HUD öğeleri — gradyan ve kenarlık DAHİL (tur 1'in iyimser hatasının düzeltmesi). */
const HUD_OLC = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const oge = [];
  for (const el of document.querySelectorAll('.hud *, .touch-layer *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number.parseFloat(cs.opacity) < 0.05) continue;
    const alfa = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; const p = m[1].split(','); return p[3] !== undefined ? Number.parseFloat(p[3]) : 1; };
    const boyali = alfa(cs.backgroundColor) > 0.05
      || (cs.backgroundImage && cs.backgroundImage !== 'none')
      || (Number.parseFloat(cs.borderTopWidth) > 0 && alfa(cs.borderTopColor) > 0.05)
      || ['SVG', 'svg', 'IMG'].includes(el.tagName);
    if (!boyali) continue;
    oge.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  const ADIM = 4;
  let kapali = 0, toplam = 0;
  const kapaliMi = (px, py) => oge.some((o) => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h);
  for (let py = 0; py < vh; py += ADIM) for (let px = 0; px < vw; px += ADIM) { toplam++; if (kapaliMi(px, py)) kapali++; }

  const t3 = window.__three, cam = t3.camera;
  cam.updateMatrixWorld(true);
  const mvi = cam.matrixWorldInverse.elements, pr = cam.projectionMatrix.elements;
  const vp = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r2 = 0; r2 < 4; r2++) { let s = 0; for (let k = 0; k < 4; k++) s += pr[k * 4 + r2] * mvi[c * 4 + k]; vp[c * 4 + r2] = s; }
  const H = 17, N = 260, adim = (2 * H) / (N - 1);
  let icerde = 0, acik = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -H + i * adim, z = -H + j * adim;
    const cx = vp[0] * x + vp[8] * z + vp[12], cy = vp[1] * x + vp[9] * z + vp[13], cw = vp[3] * x + vp[11] * z + vp[15];
    if (cw <= 0) continue;
    const nx = cx / cw, ny = cy / cw;
    if (nx < -1 || nx > 1 || ny < -1 || ny > 1) continue;
    icerde++;
    if (!kapaliMi((nx * 0.5 + 0.5) * vw, (-ny * 0.5 + 0.5) * vh)) acik++;
  }
  const noktaAlani = (2 * H) * (2 * H) / (N * N);

  // Şeridin ve navın MERKEZ KAÇIKLIĞI: G-51'in tek ölçülebilir büyüklüğü. 0 = tam ortalı.
  const kacik = (sec) => {
    const el = document.querySelector(sec);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { g: +r.width.toFixed(0), kacik: +((r.left + r.width / 2) - vw / 2).toFixed(0) };
  };

  // En küçük GÖRÜNÜR yazı ve 44 px altındaki dokunma hedefleri (G-55'in iki kanıtı).
  let enKucukYazi = 999;
  let kucukHedef = 0, hedefToplam = 0;
  for (const el of document.querySelectorAll('.hud button, .hud .navtab, .hud .round-btn')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    hedefToplam++;
    if (Math.min(r.width, r.height) < 44) kucukHedef++;
  }
  for (const el of document.querySelectorAll('.hud *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const yazi = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length);
    if (!yazi) continue;
    const fs2 = Number.parseFloat(cs.fontSize);
    if (fs2 > 0 && fs2 < enKucukYazi) enKucukYazi = fs2;
  }

  return {
    vw, vh,
    hudYuzde: +(100 * kapali / toplam).toFixed(1),
    acikBr2: +(acik * noktaAlani).toFixed(1),
    band: kacik('.band'),
    nav: kacik('.botnav'),
    enKucukYazi: enKucukYazi === 999 ? null : +enKucukYazi.toFixed(0),
    kucukHedef, hedefToplam,
    tasan: oge.filter((o) => o.x < -1 || o.y < -1 || o.x + o.w > vw + 1 || o.y + o.h > vh + 1).length,
  };
};

/**
 * PANEL ÖLÇÜSÜ — §F'nin tamamı.
 *
 * Ölçülen şey "güzel mi" değil, **ekranın ne kadarı ilk bakışta var**:
 *   kaydirma   = gövdenin içeriği / gövdenin yüksekliği (1,00 = hiç kaydırma gerekmiyor)
 *   ilkEkran%  = ilk bakışta görünen içerik oranı (1/kaydirma)
 *   gorunurDugme/toplamDugme = kaç eylem düğmesi ilk ekranda TAM görünüyor
 *   gizliOnemli = ilk ekranda görünmeyen ÖDÜL ALMA düğmesi sayısı (ekranın işi bu)
 * Ayrıca kabuğun kendi geometrisi (kabuk w/h, üst şerit yüksekliği, gövde yüksekliği) ve
 * taşma/kesilme denetimi.
 */
const PANEL_OLC = (sec) => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const kabuk = document.querySelector(`${sec} .modal-card`);
  const govde = document.querySelector(`${sec} .sheet-body`) || document.querySelector(`${sec} .char-body`);
  if (!kabuk) return { yok: true };
  const kr = kabuk.getBoundingClientRect();
  const ust = document.querySelector(`${sec} .screen-top`);
  const ur = ust ? ust.getBoundingClientRect() : null;

  let kaydirma = null, icerikPx = null, govdePx = null;
  if (govde) {
    govdePx = govde.clientHeight;
    icerikPx = govde.scrollHeight;
    kaydirma = govdePx > 0 ? +(icerikPx / govdePx).toFixed(2) : null;
  }

  const gorunurMu = (r) => r.top >= -1 && r.bottom <= vh + 1 && r.left >= -1 && r.right <= vw + 1;
  const dugmeler = [...document.querySelectorAll(`${sec} button`)].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && getComputedStyle(b).display !== 'none';
  });
  const govdeKutu = govde ? govde.getBoundingClientRect() : { top: 0, bottom: vh };
  const govdedeGorunur = (r) => r.top >= govdeKutu.top - 1 && r.bottom <= govdeKutu.bottom + 1;

  let gorunurDugme = 0, kucukHedef = 0;
  for (const b of dugmeler) {
    const r = b.getBoundingClientRect();
    if (gorunurMu(r) && govdedeGorunur(r)) gorunurDugme++;
    if (Math.min(r.width, r.height) < 44) kucukHedef++;
  }

  /* ÖDÜL ALMA düğmeleri ekranın asıl işi: görünmüyorlarsa panel işlevini kaybeder. */
  const odul = dugmeler.filter((b) => /claim|buy|cta/i.test(b.getAttribute('data-testid') || '' + b.className));
  const gizliOdul = odul.filter((b) => !govdedeGorunur(b.getBoundingClientRect())).length;

  let enKucukYazi = 999;
  for (const el of document.querySelectorAll(`${sec} *`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length)) continue;
    const fs2 = Number.parseFloat(cs.fontSize);
    if (fs2 > 0 && fs2 < enKucukYazi) enKucukYazi = fs2;
  }

  /* KESİLME: panelin içinde ekranın dışına taşan öğe (yatayda ya da dikeyde). */
  let kesilen = 0;
  for (const el of document.querySelectorAll(`${sec} *`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(el).display === 'none') continue;
    if (r.left < -1 || r.right > vw + 1) kesilen++;
  }

  return {
    vw, vh,
    kabukG: +kr.width.toFixed(0), kabukY: +kr.height.toFixed(0),
    yanBosluk: +((vw - kr.width) / 2).toFixed(0),
    ustPx: ur ? +ur.height.toFixed(0) : null,
    govdePx, icerikPx, kaydirma,
    ilkEkranYuzde: kaydirma ? +(100 / kaydirma).toFixed(0) : null,
    gorunurDugme, toplamDugme: dugmeler.length,
    gizliOdul, odulToplam: odul.length,
    kucukHedef,
    enKucukYazi: enKucukYazi === 999 ? null : +enKucukYazi.toFixed(0),
    kesilen,
  };
};

/** DÜNYA İMZASI — tur 1'in 5. kusurunun bekçisi. Aynı imza = aynı sahne ölçüldü. */
const IMZA = () => {
  const g = window.__game();
  return `t${g.tables}|s${Object.keys(g.stations ?? {}).length}|a${g.areasOpen ?? '?'}|n${g.npcCount}`;
};

// ─────────────────────────────────── koşucu ───────────────────────────────────

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

/**
 * Bir kadraj bağlamı açar, dünyayı KURAR ve dondurur.
 * Sıra kasıtlı: yaz → bir tur türet → dondur. `tick.ts` dünyayı her karede `padsDone`tan
 * türetiyor (`deriveWorld`); zaman önce durursa türetme hiç koşmaz ve sahne boş kalır.
 */
async function sahneAc(tarayici, kadraj, hatalar) {
  const baglam = await tarayici.newContext({
    viewport: { width: kadraj.w, height: kadraj.h }, deviceScaleFactor: kadraj.dpr,
    isMobile: true, hasTouch: true,
  });
  const s = await baglam.newPage();
  s.on('pageerror', (e) => hatalar.push(e.message));
  s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await s.waitForTimeout(6000);
  await s.evaluate((pads) => {
    window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
    window.__zaman(1); window.__advanceTime(1);
  }, PADS);
  await s.waitForTimeout(1500);
  await s.evaluate(() => { window.__zaman(0); window.__teleport(0, 0); });
  await s.waitForTimeout(2500);
  return { baglam, sayfa: s };
}

async function main() {
  const t0 = Date.now();
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const kadrajlar = KISA ? KADRAJLAR.slice(1, 2) : KADRAJLAR;
  const paneller = KISA ? PANELLER.slice(0, 2) : PANELLER;
  const panelSonuc = [], ydSonuc = [], tabletSonuc = [], yerlesimSonuc = [];
  const imzalar = new Map();
  const tumHatalar = [];

  try {
    // ── §F — AÇILAN EKRANLAR ────────────────────────────────────────────────
    for (const kadraj of kadrajlar) {
      const hatalar = [];
      const { baglam, sayfa } = await sahneAc(tarayici, kadraj, hatalar);
      const imza = await sayfa.evaluate(IMZA);
      imzalar.set(kadraj.id, imza);

      for (const p of paneller) {
        await sayfa.click(p.tetik);
        await sayfa.waitForTimeout(700);
        const m = await sayfa.evaluate(PANEL_OLC, p.panel);
        await sayfa.screenshot({ path: path.join(OUT, `f1b-panel-${p.id}-${kadraj.id}.png`) });
        panelSonuc.push({ kadraj, panel: p, ...m });
        // Paneli kapat: geri düğmesi (kabuğun tek çıkışı).
        const geri = await sayfa.$(`${p.panel} .sheet-back`);
        if (geri) await geri.click(); else await sayfa.click(p.tetik);
        await sayfa.waitForTimeout(500);
      }
      tumHatalar.push(...hatalar);
      await baglam.close();
    }

    // ── §G — YD REVİZE (telefon yatayı + tablet) ────────────────────────────
    const ydKadrajlar = KISA ? [KADRAJLAR[1]] : [KADRAJLAR[1], KADRAJLAR[2]];
    for (const kadraj of ydKadrajlar) {
      for (const kol of YD_KOLLARI) {
        const hatalar = [];
        const { baglam, sayfa } = await sahneAc(tarayici, kadraj, hatalar);
        if (kol.css) await sayfa.addStyleTag({ content: kol.css });
        await sayfa.waitForTimeout(900);
        const m = await sayfa.evaluate(HUD_OLC);
        await sayfa.screenshot({ path: path.join(OUT, `f1b-yd-${kol.id.replace('+', 'p')}-${kadraj.id}.png`) });
        ydSonuc.push({ kadraj, kol, imza: await sayfa.evaluate(IMZA), ...m, hata: hatalar.length });
        tumHatalar.push(...hatalar);
        await baglam.close();
      }
    }

    // ── §H — TABLET BASAMAĞI ────────────────────────────────────────────────
    if (!KISA) {
      const kadraj = KADRAJLAR[2];
      for (const kol of TABLET_KOLLARI) {
        const hatalar = [];
        const { baglam, sayfa } = await sahneAc(tarayici, kadraj, hatalar);
        if (kol.css) await sayfa.addStyleTag({ content: kol.css });
        await sayfa.waitForTimeout(900);
        const m = await sayfa.evaluate(HUD_OLC);
        await sayfa.screenshot({ path: path.join(OUT, `f1b-tablet-${kol.id.replace('+', 'p')}.png`) });
        tabletSonuc.push({ kol, imza: await sayfa.evaluate(IMZA), ...m, hata: hatalar.length });
        tumHatalar.push(...hatalar);
        await baglam.close();
      }
    }

    // ── §I — PANEL YERLEŞİMİ (telefon yatayı) ───────────────────────────────
    if (!KISA) {
      const kadraj = KADRAJLAR[1];
      for (const kol of PANEL_KOLLARI) {
        const hatalar = [];
        const { baglam, sayfa } = await sahneAc(tarayici, kadraj, hatalar);
        if (kol.css) await sayfa.addStyleTag({ content: kol.css });
        await sayfa.waitForTimeout(400);
        for (const p of PANELLER) {
          await sayfa.click(p.tetik);
          await sayfa.waitForTimeout(700);
          const m = await sayfa.evaluate(PANEL_OLC, p.panel);
          if (p.id === 'goals' || p.id === 'shop') {
            await sayfa.screenshot({ path: path.join(OUT, `f1b-yerlesim-${kol.id}-${p.id}.png`) });
          }
          yerlesimSonuc.push({ kol, panel: p, ...m });
          const geri = await sayfa.$(`${p.panel} .sheet-back`);
          if (geri) await geri.click(); else await sayfa.click(p.tetik);
          await sayfa.waitForTimeout(500);
        }
        tumHatalar.push(...hatalar);
        await baglam.close();
      }
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  // ─────────────────────────────── rapor ───────────────────────────────
  const kip = KISA ? 'KISA' : 'TAM';
  console.log(`# F1b TUR 2 — ACILAN EKRANLAR + YD REVIZE + TABLET BASAMAGI   [${kip} kosu · ${((Date.now() - t0) / 1000).toFixed(0)} sn]`);
  console.log('');
  console.log('## DUNYA IMZASI (ayni imza = ayni sahne olculdu)');
  for (const [k, v] of imzalar) console.log(`  ${k}: ${v}`);
  const tekImza = new Set(imzalar.values()).size === 1;
  console.log(`  DENETIM: ${tekImza ? 'TEMIZ — butun kadrajlar ayni dunyayi olctu' : '*** KIRMIZI: kadrajlar farkli dunya olctu ***'}`);
  console.log('');

  console.log('## §F — ACILAN EKRANLAR');
  console.log('');
  console.log('  kadraj  panel      ekran      kabuk      yanBos  ust  govde  icerik  kaydirma ilkEkran  dugme(gor/top)  gizliOdul  <44px  enKucukYazi  kesilen');
  for (const r of panelSonuc) {
    if (r.yok) { console.log(`  ${r.kadraj?.id} ${r.panel?.id} *** PANEL ACILMADI ***`); continue; }
    console.log(
      `  ${r.kadraj.id.padEnd(7)} ${r.panel.id.padEnd(10)} ${String(r.vw + '×' + r.vh).padEnd(10)} ` +
      `${String(r.kabukG + '×' + r.kabukY).padEnd(10)} ${String(r.yanBosluk).padStart(6)} ${String(r.ustPx).padStart(4)} ${String(r.govdePx).padStart(6)} ` +
      `${String(r.icerikPx).padStart(7)} ${String(r.kaydirma).padStart(8)}× ${String('%' + r.ilkEkranYuzde).padStart(8)} ` +
      `${String(r.gorunurDugme + '/' + r.toplamDugme).padStart(15)} ${String(r.gizliOdul + '/' + r.odulToplam).padStart(10)} ` +
      `${String(r.kucukHedef).padStart(6)} ${String(r.enKucukYazi + 'px').padStart(12)} ${String(r.kesilen).padStart(8)}`
    );
  }
  console.log('');
  console.log('  kaydirma = icerik / govde (1,00× = hic kaydirma gerekmiyor) · ilkEkran% = ilk bakista gorunen icerik');
  console.log('  gizliOdul = ilk ekranda GORUNMEYEN odul-alma dugmesi (ekranin asil isi) · kesilen = yatayda ekran disina tasan oge');
  console.log('  yanBos = kabugun IKI YANINDAKI bos zemin (px, tek yan) — yatayda bol eksenin ne kadari kullanilmiyor');
  console.log('');

  console.log('## §G — YD REVIZE (G-51 + G-52)');
  console.log('');
  console.log('  kadraj  kol   aciklama                                    HUD%   acik zemin  band(g/kacik)  nav(g/kacik)  tasan  hata');
  for (const r of ydSonuc) {
    const b = r.band ? `${r.band.g}/${r.band.kacik >= 0 ? '+' : ''}${r.band.kacik}` : '—';
    const n = r.nav ? `${r.nav.g}/${r.nav.kacik >= 0 ? '+' : ''}${r.nav.kacik}` : '—';
    console.log(
      `  ${r.kadraj.id.padEnd(7)} ${r.kol.id.padEnd(5)} ${r.kol.ad.padEnd(43)} ${String(r.hudYuzde).padStart(5)} ` +
      `${String(r.acikBr2).padStart(11)} ${b.padStart(14)} ${n.padStart(13)} ${String(r.tasan).padStart(6)} ${String(r.hata).padStart(5)}`
    );
  }
  console.log('');
  console.log('  kacik = blogun merkezinin ekran merkezinden sapmasi (px). 0 = tam ortali. G-51 tam olarak bu sayidir.');
  console.log('');

  if (tabletSonuc.length) {
    console.log('## §H — TABLET BASAMAGI (G-55) — 1280×800');
    console.log('');
    console.log('  kol   aciklama                                    HUD%   acik zemin  enKucukYazi  <44px hedef  tasan  hata');
    for (const r of tabletSonuc) {
      console.log(
        `  ${r.kol.id.padEnd(5)} ${r.kol.ad.padEnd(43)} ${String(r.hudYuzde).padStart(5)} ${String(r.acikBr2).padStart(11)} ` +
        `${String(r.enKucukYazi + 'px').padStart(12)} ${String(r.kucukHedef + '/' + r.hedefToplam).padStart(12)} ${String(r.tasan).padStart(6)} ${String(r.hata).padStart(5)}`
      );
    }
    console.log('');
  }

  if (yerlesimSonuc.length) {
    console.log('## §I — PANEL YERLESIMI (telefon yatayi 915×412) — kare uzerine dogdu, plandan degil');
    console.log('');
    console.log('  kol   panel      kabuk      yanBos  govde  icerik  kaydirma ilkEkran  dugme(gor/top)  gizliOdul  kesilen');
    for (const r of yerlesimSonuc) {
      if (r.yok) { console.log(`  ${r.kol.id} ${r.panel.id} *** PANEL ACILMADI ***`); continue; }
      console.log(
        `  ${r.kol.id.padEnd(5)} ${r.panel.id.padEnd(10)} ${String(r.kabukG + '×' + r.kabukY).padEnd(10)} ` +
        `${String(r.yanBosluk).padStart(6)} ${String(r.govdePx).padStart(6)} ${String(r.icerikPx).padStart(7)} ` +
        `${String(r.kaydirma).padStart(8)}× ${String('%' + r.ilkEkranYuzde).padStart(8)} ` +
        `${String(r.gorunurDugme + '/' + r.toplamDugme).padStart(15)} ${String(r.gizliOdul + '/' + r.odulToplam).padStart(10)} ${String(r.kesilen).padStart(8)}`
      );
    }
    console.log('');
    for (const kol of PANEL_KOLLARI) {
      const dal = yerlesimSonuc.filter((r) => r.kol.id === kol.id && r.kaydirma);
      if (!dal.length) continue;
      const ort = dal.reduce((a, r) => a + r.kaydirma, 0) / dal.length;
      const gizli = dal.reduce((a, r) => a + r.gizliOdul, 0);
      const kes = dal.reduce((a, r) => a + r.kesilen, 0);
      console.log(`  ${kol.id.padEnd(5)} ORTALAMA kaydirma ${ort.toFixed(2)}×  ·  gizli odul dugmesi toplam ${gizli}  ·  kesilen oge toplam ${kes}`);
    }
    console.log('');
  }

  console.log(`## SAYFA HATASI TOPLAM: ${tumHatalar.length}`);
  for (const h of [...new Set(tumHatalar)].slice(0, 10)) console.log(`  · ${h}`);
  console.log('');
  console.log('## KARELER');
  console.log(`  docs/gorsel/ss/f1b-panel-<panel>-<kadraj>.png   (${panelSonuc.length} kare)`);
  console.log(`  docs/gorsel/ss/f1b-yd-<kol>-<kadraj>.png        (${ydSonuc.length} kare)`);
  console.log(`  docs/gorsel/ss/f1b-tablet-<kol>.png             (${tabletSonuc.length} kare)`);
  console.log(`  docs/gorsel/ss/f1b-yerlesim-<kol>-<panel>.png   (${PANEL_KOLLARI.length * 2} kare)`);
}

main().catch((e) => { console.error('KIRILDI:', e.message, '\n', e.stack); process.exit(1); });
