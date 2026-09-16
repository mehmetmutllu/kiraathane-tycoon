/**
 * olcum-hud-r3.mjs — R3 ÖLÇÜM: HUD çerçeveleri (G-45 · G-46 · G-47 · G-48 · G-49).
 *
 * NEDEN TEK ARAÇ: beş şikâyetin beşi de aynı soruyu soruyor — **bir kutu, kendi çerçevesinin
 * neresinde bitiyor?** Kaydırıcının çerçevesi kapanmıyor, ödül satırı iki ödülü tek satıra
 * diziyor, seviye rozeti bar ile madalyonu ayrı iki kutuda tutuyor, kese hiç kutu kullanmıyor,
 * FPS katmanı ise kutusuyla birlikte ekranda duruyor. Hepsinin cevabı DOM kutusu + ÇİZİLEN
 * pikselden okunur; kaynak metinden okunursa yalan söyler — `getComputedStyle` bu sayfada
 * `::-webkit-slider-thumb`u sorunca input'un KENDİ kutusunu döndürüyor (denendi: "192px").
 *
 * NE ÖLÇER
 *   §A kaydırıcı — satır/başlık/yatak/sayı kutuları + ÇİZİLEN sol çizginin piksel kutusu, üstteki
 *                  ayıraçla arasındaki açıklık, topuzun çizilen çapı ve yatağa taşması.
 *                  Kollar: A1 (topuz yatağa sığar) · A2 (kapalı dört kenar çerçeve).
 *   §B FPS      — katmanın kutusu, ekran yüzdesi, HUD ile çakışması.
 *                  Kollar: B1 (yalnız katman gider) · B2 (katman + ayar anahtarı gider).
 *   §C ödül     — ödül satırının çocukları (Range ile; ödüller ayrı ELEMAN DEĞİL), satır eni,
 *                  kart iç enine oranı. Kol: C1 (alt alta + arada "+").
 *   §D rozet    — madalyon + bar kutuları, aralarındaki boşluk, üst şeridin kaç satır kapladığı,
 *                  ilerleme yayının uzunluğu. Kollar: D1 (halka bar) · D2 (tek üst satır).
 *   §E kese     — para/elmas kutuları, kontur kalınlığı, ARKALARINDAKİ sahnenin parlaklık
 *                  dağılımı (D-106 "okunabilirliği kontur taşıyor" derken ölçtüğü şey budur).
 *                  Kol: E1 (hap çerçeve).
 *
 * KOLLAR KODA DEĞİL SAYFAYA UYGULANIR: her kol enjekte edilen CSS/DOM'dur, uygulama kaynağı
 * DEĞİŞMEZ. Her kol ETKİLİ mi diye denetlenir (taban sayısından farklı mı); etkisiz kol rapora
 * sayı olarak GİRMEZ, hata satırı olarak girer.
 *
 * Çıktı: `docs/olcum-hud-r3.json` (ham) + `docs/olcum-hud-r3.txt` (okunur) + `ss/r3-*.png`.
 * Koşu:  node tools/olcum-hud-r3.mjs        (OLCUM=kisa → yalnız telefon kadrajı)
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.HUD_PORT ?? '', 10) || 5235;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
const KIP = process.env.OLCUM === 'kisa' ? 'kisa' : 'tam';
mkdirSync(SS, { recursive: true });

const KADRAJLAR = KIP === 'kisa'
  ? [{ ad: 'telefon', width: 390, height: 844, dpr: 3, mobil: true }]
  : [{ ad: 'telefon', width: 390, height: 844, dpr: 3, mobil: true },
     { ad: 'masaustu', width: 1280, height: 800, dpr: 2, mobil: false }];

/** Tema renkleri — piksel taraması bunları arar. Kaynakla aynı kalsın diye tek yerde. */
const RENK = { ot: [0x10, 0x0b, 0x2e], oyuk: [0x1b, 0x14, 0x43], tx: [0xea, 0xe3, 0xff], ok: [0x7b, 0xd4, 0x6a], ac: [0xff, 0xc2, 0x4b] };

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const rapor = { damga: new Date().toISOString(), kip: KIP, A: [], B: [], C: [], D: [], E: [], hata: [] };
const hata = (m) => { rapor.hata.push(m); console.log('  ! ' + m); };

// =============================================================================================
//  ORTAK — piksel okuma. Ekran görüntüsü sayfaya GERİ yüklenip canvas'ta taranır; analiz
//  sayfada yapılır (ham ImageData'yı Node'a taşımak milyonlarca sayı demek).
// =============================================================================================
async function pikselYukle(sayfa, klip) {
  const b64 = (await sayfa.screenshot({ clip: klip })).toString('base64');
  return sayfa.evaluate(async (d) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + d;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    window.__px = g.getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height };
  }, b64);
}

/** Verilen renge `tol` yakınlıktaki piksellerin kutusu + sayısı (CSS px'e ölçeklenmiş). */
function renkKutusu(sayfa, renk, tol, dpr) {
  return sayfa.evaluate(([r, t, d0]) => {
    const p = window.__px; const d = p.data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
      const i = (y * p.width + x) * 4;
      if (Math.abs(d[i] - r[0]) <= t && Math.abs(d[i + 1] - r[1]) <= t && Math.abs(d[i + 2] - r[2]) <= t && d[i + 3] > 200) {
        n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (n === 0) return null;
    const k = (v) => +(v / d0).toFixed(2);
    return { n, x: k(x0), y: k(y0), w: k(x1 - x0 + 1), h: k(y1 - y0 + 1) };
  }, [renk, tol, dpr]);
}

/**
 * Bir DİKEY ŞERİTTEKİ renkli piksellerin KESİNTİSİZ EN UZUN koşusu.
 *
 * NEDEN "en uzun koşu" ve neden ham kapsam DEĞİL: ilk sürüm şeritteki tüm boyalı satırların
 * ilkini ve sonuncusunu alıyordu ve `solCizgiBoy` 58,67 px çıkıyordu — satırın kendisi 45 px.
 * Fark gürültü: satırın ALT AYIRACI da aynı `--oyuk` rengiyle ve tam bu sütunlardan geçiyor,
 * üstteki ayıraç da öyle. Yani şerit "çizgi + iki ayıraç" ölçüyordu. Çizilen dikey çizginin
 * kendisi yalnızca EN UZUN kesintisiz koşudur; ayıraçlar 1-2 px'lik ayrı koşular olarak durur.
 */
function seritKapsami(sayfa, renk, tol, dpr, xA, xB) {
  return sayfa.evaluate(([r, t, d0, a, b]) => {
    const p = window.__px; const d = p.data;
    const satirlar = [];
    for (let y = 0; y < p.height; y++) {
      let say = 0;
      for (let x = Math.max(0, a); x <= Math.min(p.width - 1, b); x++) {
        const i = (y * p.width + x) * 4;
        if (Math.abs(d[i] - r[0]) <= t && Math.abs(d[i + 1] - r[1]) <= t && Math.abs(d[i + 2] - r[2]) <= t && d[i + 3] > 200) say++;
      }
      if (say > 0) satirlar.push(y);
    }
    if (!satirlar.length) return null;
    const parca = []; let bas = satirlar[0], onc = satirlar[0];
    for (const y of satirlar.slice(1)) { if (y > onc + 1) { parca.push([bas, onc]); bas = y; } onc = y; }
    parca.push([bas, onc]);
    const k = (v) => +(v / d0).toFixed(2);
    const enUzun = parca.reduce((a2, c) => (c[1] - c[0] > a2[1] - a2[0] ? c : a2), parca[0]);
    return {
      ust: k(satirlar[0]), alt: k(satirlar[satirlar.length - 1]),
      parcaSayisi: parca.length, cizgiUst: k(enUzun[0]), cizgiAlt: k(enUzun[1] + 1),
      cizgiBoy: k(enUzun[1] - enUzun[0] + 1),
      parcalar: parca.map(([u, s]) => ({ ust: k(u), boy: k(s - u + 1) })),
    };
  }, [renk, tol, dpr, xA, xB]);
}

/**
 * Bir SÜTUNDAKİ "arka plan olmayan" piksellerin dikey kapsamı.
 *
 * Topuzun DIŞ çapı için gerekli: beyaz blob taraması topuzun yalnız iç dairesini görüyor
 * (kutu `border-box`, 20 px'in 5 px'i kontura gidiyor → beyaz 15 px) ve araç ilk koşularda
 * o 16 px'i "topuz çapı" sanıp yatağa 6 px SIĞIYOR diye rapor ediyordu. Topuzun merkez
 * sütununda ray tamamen topuzun altında kalır; dolayısıyla o sütunda arka plandan farklı olan
 * her şey topuzun kendisidir — kontur dahil.
 */
function sutunKapsami(sayfa, xPiksel, dpr) {
  return sayfa.evaluate(([xp, d0]) => {
    const p = window.__px; const d = p.data;
    const x = Math.min(p.width - 1, Math.max(0, Math.round(xp)));
    const arka = (y) => { const i = (y * p.width + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const ust0 = arka(0), alt0 = arka(p.height - 1);
    const benzer = (a, b) => Math.abs(a[0] - b[0]) < 12 && Math.abs(a[1] - b[1]) < 12 && Math.abs(a[2] - b[2]) < 12;
    // İLK KESİNTİSİZ KOŞU — "ilk boyalıdan son boyalıya" DEĞİL. Halka ölçümünde fark ölümcül:
    // madalyonun merkez sütunu üstteki halkayı, madalyonun kendisini ve alttaki halkayı birden
    // geçiyor; uçtan uca ölçüm "halka 54 px" diyordu, oysa halkanın kendisi çok daha ince.
    // Topuz için de doğru: topuz kendi merkez sütununda tek bir kesintisiz blob.
    let ilk = -1, son = -1;
    for (let y = 0; y < p.height; y++) {
      const c = arka(y);
      const dolu = !benzer(c, ust0) && !benzer(c, alt0);
      if (dolu) { if (ilk < 0) { ilk = y; son = y; } else if (y === son + 1) son = y; else break; }
      else if (ilk >= 0) break;
    }
    if (ilk < 0) return null;
    return { ust: +(ilk / d0).toFixed(2), boy: +((son - ilk + 1) / d0).toFixed(2) };
  }, [xPiksel, dpr]);
}

/**
 * PİKSEL-BAŞI SAPMA BİRİKTİRİCİSİ — §E'nin ortanca ölçütünün yerine geçti.
 *
 * `oynama` (örneklerin ortancasının gezindiği aralık) fazla kabaydı: kesenin arkasındaki bölge
 * düz zemin olduğu için ortanca yalnız birkaç ayrık değer alıyordu ve iki seri saçma bir şey
 * söyledi — sahne 0,0 oynarken yatak 3,3 oynadı, yani %82 mat bir hapın ARDINDAKİ manzara
 * kendisinden fazla değişti. Sapma piksel piksel biriktirilince ölçüt sürekli hâle gelir:
 * her pikselin altı örnek boyunca standart sapması, sonra bunların ortalaması.
 */
const birikimSifirla = (sayfa) => sayfa.evaluate(() => { window.__bir = null; });
const birikimEkle = (sayfa) => sayfa.evaluate(() => {
  const p = window.__px; const d = p.data; const n = p.width * p.height;
  if (!window.__bir) window.__bir = { n: 0, s: new Float64Array(n), s2: new Float64Array(n), boy: n };
  const b = window.__bir;
  if (b.boy !== n) return false; // kırpma değiştiyse biriktirme geçersiz
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    b.s[j] += l; b.s2[j] += l * l;
  }
  b.n++;
  return true;
});
const birikimOzet = (sayfa) => sayfa.evaluate(() => {
  const b = window.__bir;
  if (!b || b.n < 2) return null;
  let top = 0, maks = 0;
  for (let j = 0; j < b.boy; j++) {
    const o = b.s[j] / b.n;
    const v = Math.max(0, b.s2[j] / b.n - o * o);
    const sd = Math.sqrt(v);
    top += sd; if (sd > maks) maks = sd;
  }
  return { ornek: b.n, ortSapma: +(top / b.boy).toFixed(2), maksSapma: +maks.toFixed(2) };
});

/** Yüklü bölgenin parlaklık dağılımı. */
function parlaklik(sayfa) {
  return sayfa.evaluate(() => {
    const p = window.__px; const d = p.data; const l = [];
    for (let i = 0; i < d.length; i += 4) l.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    l.sort((a, b) => a - b);
    const q = (t) => +l[Math.floor(t * (l.length - 1))].toFixed(1);
    return { min: q(0), p10: q(0.1), orta: q(0.5), p90: q(0.9), maks: q(1) };
  });
}

const kutu = (sayfa, sec) => sayfa.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  const f = (v) => +v.toFixed(1);
  return { x: f(r.x), y: f(r.y), w: f(r.width), h: f(r.height), alt: f(r.bottom), sag: f(r.right) };
}, sec);

/** Kol uygula: enjekte edilen CSS (+ istenirse DOM işi). Uygulama kaynağına DOKUNMAZ. */
async function kolAc(sayfa, id, css, dom) {
  await sayfa.evaluate(([i, c]) => {
    document.getElementById('kol-' + i)?.remove();
    const s = document.createElement('style');
    s.id = 'kol-' + i; s.textContent = c;
    document.head.appendChild(s);
  }, [id, css]);
  if (dom) await sayfa.evaluate(dom);
  await sayfa.waitForTimeout(280);
}
const kolKapa = async (sayfa, id) => {
  await sayfa.evaluate((i) => document.getElementById('kol-' + i)?.remove(), id);
  await sayfa.waitForTimeout(200);
};

/**
 * AÇILIŞ ANİMASYONU BİTENE KADAR BEKLE — ölçümün kendi kazasından doğdu.
 *
 * İlk koşuda yapıca BİREBİR AYNI iki satır (ses · müzik) apayrı sayı verdi: çizilen sol çizgi
 * ses'te 18 px (oran 0,40 · 6 parça), müzik'te 45 px (oran 1,00 · 2 parça). Fark satırlarda
 * değil SIRADAYDI — ses ilk ölçülen satır ve panelin açılış animasyonu daha bitmemişti; yarı
 * saydam kenar renk eşiğini geçemeyip çizgiyi paramparça gösteriyordu. Sabit bir bekleme
 * yetmez, ölçüm tarayıcıya SORAR: koşan animasyon kalmayana kadar bekler.
 */
async function animasyonBekle(sayfa, ms = 3000) {
  await sayfa.waitForFunction(
    () => !document.getAnimations().some((a) => a.playState === 'running'),
    { timeout: ms },
  ).catch(() => {});
  await sayfa.waitForTimeout(200);
}

async function sahneyiHazirla(sayfa) {
  await sayfa.waitForSelector('canvas', { timeout: 20000 });
  await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
  await sayfa.evaluate(() => window.__addMoney(5_000_000));
  await sayfa.evaluate(() => window.__advanceTime(180));
  await sayfa.waitForTimeout(900);
  await sayfa.evaluate(() => {
    const g = window.__game();
    window.__setState({ diamonds: 500, xp: 340, stats: { ...g.stats, teasServed: 500, dishesWashed: 300 }, lifetime: 900000 });
  });
  // DEV sandbox düğmesi seviye çubuğunun ÜSTÜNE biniyor (yalnız `npm run dev`de var, üretimde
  // yok) — ölçümde gizlenir, yoksa §D'nin piksel taraması onu bar sanar.
  await kolAc(sayfa, 'dev', '.dsb-fab, .dsb { display: none !important; }');
  await sayfa.waitForTimeout(400);
}

// =============================================================================================
//  §A — AYARLAR KAYDIRICISI (G-45). "Çerçevesi kesik" cümlesinin sayısı: sol çizginin ÇİZİLEN
//  kapsamı, üstündeki ayıraca uzaklığı, ve topuzun yatağa taşması.
// =============================================================================================
async function olcA(sayfa, kadraj, kolAdi) {
  const satirlar = [];
  const hedefler = [
    { ad: 'ses', satir: 0, input: '[data-testid="set-sound-vol"]' },
    { ad: 'muzik', satir: 1, input: '[data-testid="set-music-vol"]' },
  ];
  for (const h of hedefler) {
    // DEĞER ÖNCE, ÖLÇÜ SONRA — ve bu sıra ölçümün ikinci kazasından çıktı.
    //
    // İlk iki koşuda yapıca birebir aynı iki satır apayrı sayı verdi (ses: çizgi 18 px / oran
    // 0,40 ↔ müzik: 45 px / 1,00) ve sayılar koşudan koşuya DEĞİŞMEDİ, yani gürültü değildi.
    // Animasyon beklemesi de düzeltmedi. Sebep sıraydı: kutular okunuyor, SONRA `fill()`
    // çağrılıyordu — `fill()` input'a odaklanıyor ve kaydırılabilir panel o input'u görünür
    // kılmak için kayıyor. Kırpma kutusu kaymadan önceki koordinatla alınıyordu, yani araç
    // satırın bir yerini değil ekranın başka bir yerini tarıyordu.
    await sayfa.locator(h.input).fill('45');
    await animasyonBekle(sayfa);

    const g = await sayfa.evaluate((i) => {
      const r = document.querySelectorAll('.setting-slider')[i];
      if (!r) return null;
      const f = (v) => +v.toFixed(2);
      const b = (e) => { const x = e.getBoundingClientRect(); return { x: f(x.x), y: f(x.y), w: f(x.width), h: f(x.height), alt: f(x.bottom) }; };
      const cs = getComputedStyle(r);
      const inp = r.querySelector('input');
      // ÜSTTEKİ ayıraç: bir önceki kardeşin alt kenarı (kendi border-bottom'ı oradan geçiyor).
      const onc = r.previousElementSibling;
      return {
        satir: b(r), input: b(inp), label: b(r.querySelector('.setting-label')), val: b(r.querySelector('.setting-val')),
        solKalinlik: parseFloat(cs.borderLeftWidth), altKalinlik: parseFloat(cs.borderBottomWidth),
        ustKalinlik: parseFloat(cs.borderTopWidth), sagKalinlik: parseFloat(cs.borderRightWidth),
        solMargin: parseFloat(cs.marginLeft), solPad: parseFloat(cs.paddingLeft),
        oncekiAlt: onc ? f(onc.getBoundingClientRect().bottom) : null,
        oncekiSol: onc ? f(onc.getBoundingClientRect().x) : null,
      };
    }, h.satir);
    if (!g) { hata(`${kadraj.ad}/${kolAdi}: §A ${h.ad} satiri bulunamadi`); continue; }

    // (Kaydırıcı %45'e yukarıda çekildi: %100'de topuz sağ uçta durur ve yatağın sağ kapağıyla
    //  örtüşmesi ayrı bir kusur olarak sayılamaz. %45 hem ortada hem dolu/boş sınırını gösterir.)

    // ÇİZİLENİ oku — İKİ AYRI KLİP, çünkü iki ayrı şey aranıyor:
    //   ① satırın kendi kutusu + üstündeki ayıraç → sol çizginin çizilen boyu ve köşe açıklığı
    //   ② YALNIZ input kutusu → topuz. İlk sürüm tek klip kullanıyordu ve beyaz blob taraması
    //      üstteki anahtarın topuzunu da yakalayıp topuz çapını "194 px" sanıyordu.
    const klip = { x: Math.max(0, g.satir.x - 6), y: Math.max(0, g.satir.y - 14), width: Math.min(g.satir.w + 12, kadraj.width), height: g.satir.h + 22 };
    await pikselYukle(sayfa, klip);
    const solSeritX = Math.round((g.satir.x - klip.x) * kadraj.dpr);
    const solCizgi = await seritKapsami(sayfa, RENK.oyuk, 26, kadraj.dpr, solSeritX, solSeritX + Math.round(g.solKalinlik * kadraj.dpr) + 1);
    //      Klip input'tan 10 px UZUN: tam da taşmayı ölçüyoruz, kutuyu birebir kırparsak taşma
    //      görünmez olur (ölçüm kendi sorusunu kırpar). x aralığı input'la sınırlı — solundaki
    //      başlık ve sağındaki "%45" yazısı beyaz blob taramasına girmesin.
    await pikselYukle(sayfa, { x: g.input.x, y: Math.max(0, g.input.y - 10), width: g.input.w, height: g.input.h + 20 });
    const topuzIc = await renkKutusu(sayfa, RENK.tx, 16, kadraj.dpr);
    // Dış çap: topuzun merkez sütununda arka plandan farklı olan her şey (kontur dahil).
    const topuz = topuzIc
      ? await sutunKapsami(sayfa, (topuzIc.x + topuzIc.w / 2) * kadraj.dpr, kadraj.dpr)
      : null;

    satirlar.push({
      kadraj: kadraj.ad, kol: kolAdi, ad: h.ad,
      satirH: g.satir.h, inputH: g.input.h,
      kenar: { sol: g.solKalinlik, alt: g.altKalinlik, ust: g.ustKalinlik, sag: g.sagKalinlik },
      kapaliKenar: [g.solKalinlik, g.altKalinlik, g.ustKalinlik, g.sagKalinlik].filter((v) => v > 0).length,
      // Çizilen sol çizginin (en uzun kesintisiz koşu) boyu ve satır boyuna oranı.
      solCizgiBoy: solCizgi ? solCizgi.cizgiBoy : null,
      solCizgiOran: solCizgi ? +(solCizgi.cizgiBoy / g.satir.h).toFixed(3) : null,
      solCizgiParca: solCizgi?.parcaSayisi ?? null,
      // ÜST KÖŞE AÇIKLIĞI: çizginin üst ucu ile ÜSTÜNDEKİ yatay ayıraç arasındaki boşluk.
      // > 0 → köşe kapanmıyor; çizgi havada başlıyor.
      ustKoseAcik: solCizgi && g.oncekiAlt != null ? +(klip.y + solCizgi.cizgiUst - g.oncekiAlt).toFixed(2) : null,
      // ALT KÖŞE AÇIKLIĞI: çizginin alt ucu ile satırın KENDİ alt ayıracı arasındaki boşluk.
      altKoseAcik: solCizgi ? +(g.satir.alt - (klip.y + solCizgi.cizgiAlt)).toFixed(2) : null,
      // Sol çizginin, üstteki ayıracın sol ucundan İÇERİ kaçması (hizasızlık).
      solHizasizlik: g.oncekiSol != null ? +(g.satir.x - g.oncekiSol).toFixed(2) : null,
      topuzIcCap: topuzIc ? +Math.max(topuzIc.w, topuzIc.h).toFixed(2) : null,
      topuzDisCap: topuz ? topuz.boy : null,
      topuzTasma: topuz ? +(topuz.boy - g.input.h).toFixed(2) : null,
    });
    await sayfa.locator(h.input).fill('100');
    await sayfa.waitForTimeout(150);
  }
  return satirlar;
}

// =============================================================================================
//  §B — FPS KATMANI (G-46). "Kaldır" tek satır gibi görünür; ölçülen şey kapsamı.
// =============================================================================================
async function olcB(sayfa, kadraj) {
  const ov = await kutu(sayfa, '[data-testid="fps-overlay"]');
  if (!ov) return null;
  const ekran = kadraj.width * kadraj.height;
  const sahne = await sayfa.evaluate(() => (document.querySelector('[data-testid="menu"]') ? 'ayarlar' : 'oyun'));
  /**
   * ALTTA NE KALIYOR — ve bu denetim ilk hâlinde YANLIŞ YERE bakıyordu.
   *
   * İlk sürüm yalnız `.hud` ve `.topbar` altını geziyordu ve "çakışan: —" basıyordu; katman
   * gerçekten de oyun ekranında boş bir köşede duruyor. Ama §A'nın kareleri gösterdi ki katman
   * AYARLAR PANELİNİN üstüne biniyor ve "Ses seviyesi" satırının sol çizgisinin ilk 31 px'ini
   * örtüyor — ölçüm o satırı 18 px sanıyordu. Yani denetim doğru sayıyı doğru olmayan sahnede
   * arıyordu: katmanın bedeli panel AÇIKKEN ortaya çıkıyor. Artık açık sayfa ne ise o taranır.
   */
  const cakisan = await sayfa.evaluate(() => {
    const o = document.querySelector('[data-testid="fps-overlay"]')?.getBoundingClientRect();
    if (!o) return [];
    const ad = [];
    for (const e of document.querySelectorAll('[data-testid], button, .setting-slider, .setting-row, .sheet-sec')) {
      if (e.closest('[data-testid="fps-overlay"]')) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      // Yalnız GÖRÜNÜR öğe sayılır: kapalı panellerin kutuları hâlâ ölçülebilir olabiliyor.
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
      if (r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top) {
        ad.push(e.dataset.testid || e.className?.toString().split(' ')[0] || e.tagName);
      }
    }
    return [...new Set(ad)];
  });
  return {
    kadraj: kadraj.ad, sahne, kutu: ov, alanPx2: +(ov.w * ov.h).toFixed(0),
    ekranYuzde: +((ov.w * ov.h * 100) / ekran).toFixed(2), cakisan,
  };
}

// =============================================================================================
//  §C — ÖDÜL SATIRI (G-47). Kritik bulgu ölçüden ÖNCE geliyor: iki ödül ayrı ELEMAN değil,
//  `.reward-amount`ın düz çocukları (svg + metin düğümü ×2). Bu yüzden Range ile ölçülür ve
//  C1 kolu önce onları SARMAK zorunda — "alt alta koy" bir CSS satırı değil, bir yeniden yapı.
// =============================================================================================
async function olcC(sayfa, kadraj, kolAdi) {
  return sayfa.evaluate((kad) => {
    const satir = document.querySelector('.reward-amount');
    const kart = document.querySelector('.reward-card');
    if (!satir || !kart) return null;
    const f = (v) => +v.toFixed(2);
    const kutular = [];
    for (const d of satir.childNodes) {
      let r;
      if (d.nodeType === 3) {
        if (!d.textContent.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(d); r = rg.getBoundingClientRect();
      } else r = d.getBoundingClientRect();
      if (r.width < 1) continue;
      kutular.push({ tip: d.nodeType === 3 ? 'metin' : d.tagName.toLowerCase(), metin: (d.textContent || '').trim().slice(0, 24), x: f(r.x), w: f(r.width), y: f(r.y), h: f(r.height) });
    }
    const sb = satir.getBoundingClientRect();
    const kb = kart.getBoundingClientRect();
    const ks = getComputedStyle(kart);
    const icEn = kb.width - parseFloat(ks.paddingLeft) - parseFloat(ks.paddingRight);
    // Ödülü ödülden ayıran boşluk: çocuklar x'e göre sıralanır, ardışık kutular arası en büyük açıklık.
    const s = [...kutular].sort((a, b) => a.x - b.x);
    let enBuyukAcik = 0;
    for (let i = 1; i < s.length; i++) enBuyukAcik = Math.max(enBuyukAcik, s[i].x - (s[i - 1].x + s[i - 1].w));
    return {
      kadraj: kad, kol: null, cocuk: kutular.length, kutular,
      satir: { x: f(sb.x), y: f(sb.y), w: f(sb.width), h: f(sb.height) },
      kart: { w: f(kb.width), h: f(kb.height), icEn: f(icEn) },
      satirOran: f(sb.width / icEn), enBuyukAcik: f(enBuyukAcik),
      dizilim: getComputedStyle(satir).flexDirection,
      // "+" ayracı ELEMANDAN okunur, metinden değil: ödül metinlerinin kendisi zaten "+%0,4"
      // ve "+3" diye başlıyor, metin taraması her hâlde "var" derdi (ilk sürüm öyle yaptı).
      artiVar: !!satir.querySelector('.odul-arti'),
      // Satırın kaç GÖRSEL satıra taştığı. Birim `line-height` OLAMAZ: bu kartta hesaplanan
      // değer "normal" ve parseFloat NaN döndürüyor (ilk koşuda tablo NaN bastı). Birim,
      // ölçülen en yüksek çocuk — yani tek satırın gerçek yüksekliği.
      gorselSatir: (() => {
        const bir = Math.max(...kutular.map((k) => k.h), 1);
        return +(sb.height / bir).toFixed(2);
      })(),
    };
  }, kadraj.ad);
}

// =============================================================================================
//  §D — SEVİYE ROZETİ (G-48). Kullanıcı "bar ve yuvarlak birleşik olmalı" diyor; sayısı
//  ikisinin arasındaki boşluk, rozetin kapladığı satır sayısı ve ilerleme yayının uzunluğu.
// =============================================================================================
async function olcD(sayfa, kadraj, kolAdi) {
  const d = await sayfa.evaluate(() => {
    const rep = document.querySelector('.rep');
    const med = document.querySelector('.rep-medal');
    const bar = document.querySelector('.rep-bar');
    const dolu = document.querySelector('.rep-fill');
    const halka = document.querySelector('.rep-halka');
    const purse = document.querySelector('.purse');
    const cur = document.querySelectorAll('.purse .cur');
    const top = document.querySelector('.topbar');
    if (!rep || !top) return null;
    const f = (v) => +v.toFixed(2);
    // GİZLENEN ÖĞE = YOK sayılır: `display:none` bir kutuyu silmez, 0×0 yapar. İlk koşuda D1
    // kolunda gizlenen çubuk 0×0 olarak "var" sayıldı ve "aray = -64 px" gibi bir sayı üretti.
    const b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null; return { x: f(r.x), y: f(r.y), w: f(r.width), h: f(r.height), alt: f(r.bottom), sag: f(r.right) }; };
    const mb = b(med), bb = b(bar), hb = b(halka);
    // İlerleme YAYININ uzunluğu: düz barda dolu genişlik, halkada dolu yayın çevre uzunluğu.
    let yayBoy = null, yolBoy = null, oran = null;
    if (hb) {
      const kal = parseFloat(getComputedStyle(halka).getPropertyValue('--kal') || '0');
      const r = (hb.w - kal) / 2;
      oran = parseFloat(halka.dataset.oran || '0');
      yolBoy = f(2 * Math.PI * r); yayBoy = f(yolBoy * oran);
    } else if (bb && dolu) {
      oran = Math.min(1, (parseFloat(dolu.style.width) || 0) / 100);
      yolBoy = bb.w; yayBoy = f(dolu.getBoundingClientRect().width);
    }
    // Üst şerit KAÇ SATIR: farklı y merkezlerine düşen öğe kümesi (12 px hoşgörü).
    const merkezler = [];
    for (const e of [med, bar, halka, ...cur]) {
      if (!e) continue; const r = e.getBoundingClientRect(); if (r.width < 2) continue;
      const m = (r.top + r.bottom) / 2;
      if (!merkezler.some((v) => Math.abs(v - m) < 12)) merkezler.push(m);
    }
    return {
      medalyon: mb, bar: bb, halka: hb, rozet: b(rep), purse: b(purse), topbar: b(top),
      arayBosluk: mb && bb ? f(bb.y - mb.alt) : null,
      rozetH: b(rep).h, topbarH: b(top).h, satirSayisi: merkezler.length,
      yayBoy, yolBoy, oran,
      barKalinlik: bb ? bb.h : hb ? parseFloat(getComputedStyle(halka).getPropertyValue('--kal') || '0') : null,
    };
  });
  if (!d) { hata(`${kadraj.ad}/${kolAdi}: §D rozet okunamadi`); return null; }

  /**
   * HALKA KALINLIĞI PİKSELDEN — çünkü CSS değişkeninden okumak YANLIŞ SAYI verdi.
   *
   * İlk hâl `--kal`ı okuyup "6,0 px" yazıyordu; aday karesi (`ss/r3-aday-rozet-D.png`) bunun
   * yalan olduğunu gösterdi — çizilen halka ~17 px'ti. Sebep maskeydi: `radial-gradient(circle,
   * … 50% …)` yüzdeyi kutunun yarıçapına değil, varsayılan `farthest-corner` bitiş şekline
   * (köşegene, ×1,41) göre ölçüyor. Kural artık şu: bir kolun ilan ettiği ölçü, o kolun
   * ölçüsü değildir; ölçü çizilenden alınır.
   */
  if (d.halka) {
    const hb = d.halka;
    // KLİP HALKADAN GENİŞ — yoksa sütunun ilk pikseli halkanın KENDİSİ olur ve tarayıcı onu
    // "arka plan" kabul eder. İlk denemede tam da bu oldu: halka 54 px ölçüldü, yani araç
    // halkayı atlayıp madalyonu ölçtü. Ölçüt "arka plandan farklı ilk koşu" olduğu sürece,
    // kırpmanın kenarı gerçekten arka plan OLMALI.
    const pay = 6;
    await pikselYukle(sayfa, {
      x: Math.max(0, hb.x - pay), y: Math.max(0, hb.y - pay),
      width: hb.w + pay * 2, height: hb.h + pay * 2,
    });
    // HALKAYI KENDİ RENGİNDEN ARA, arka plan farkından DEĞİL.
    //
    // Sütunu "arka plandan farklı ilk koşu" diye taramak 3B zeminde iki kez çuvalladı: zemin
    // düz değil (ışık geçişli), bir pikselle kurulan arka-plan ölçütü hemen bozuluyor ve koşu
    // 70,7 px'e kadar uzuyordu; masaüstünde ise hiç koşu bulamayıp null döndü. Halkanın dolu
    // yayı `--ac` (amber) ve 12 yönü oran > 0 olduğu sürece hep dolu — yani halkanın kalınlığı
    // o sütundaki en uzun KESİNTİSİZ AMBER koşusudur. Renk ölçütü sahneden bağımsızdır.
    const seritX = Math.round((hb.w / 2 + pay) * kadraj.dpr);
    const kal = await seritKapsami(sayfa, RENK.ac, 30, kadraj.dpr, seritX - 1, seritX + 1)
      .then((v) => (v ? { boy: v.cizgiBoy } : null));
    if (kal) {
      d.halkaKalinlikCizilen = kal.boy;
      // Yol, halkanın ORTA yarıçapından geçer.
      const rOrta = hb.w / 2 - kal.boy / 2;
      d.yolBoy = +(2 * Math.PI * rOrta).toFixed(2);
      d.yayBoy = +(d.yolBoy * (d.oran ?? 0)).toFixed(2);
      d.barKalinlik = kal.boy;
    }
  }
  return { kadraj: kadraj.ad, kol: kolAdi, ...d };
}

// =============================================================================================
//  §E — KESE (G-49). D-106 kutuyu bilerek KALDIRMIŞTI ("okunabilirliği kontur taşır"); bu kol
//  onu geri alır, o yüzden ölçüm kontur/zemin kontrastını da sayıya çevirir.
// =============================================================================================
async function olcE(sayfa, kadraj, kolAdi, sabitKlip) {
  const e = await sayfa.evaluate(() => {
    const p = document.querySelector('.purse');
    if (!p) return null;
    const f = (v) => +v.toFixed(2);
    const b = (el) => { const r = el.getBoundingClientRect(); return { x: f(r.x), y: f(r.y), w: f(r.width), h: f(r.height), alt: f(r.bottom), sag: f(r.right) }; };
    const oku = (sec) => {
      const el = document.querySelector(sec); if (!el) return null;
      const cs = getComputedStyle(el);
      const val = el.querySelector('.cur-val');
      return { kutu: b(el), cerceve: parseFloat(cs.borderTopWidth) || 0, zemin: cs.backgroundColor,
        pad: [cs.paddingTop, cs.paddingRight].join(' '),
        kontur: val ? getComputedStyle(val).webkitTextStrokeWidth : null };
    };
    return { purse: b(p), para: oku('[data-testid="wallet"]'), elmas: oku('[data-testid="diamonds"]') };
  });
  if (!e) { hata(`${kadraj.ad}/${kolAdi}: §E kese okunamadi`); return null; }
  /**
   * KIRPMA SABİT — kolun kendisi kırpmayı büyütmemeli.
   *
   * İkinci koşu §E'yi çürüttü: "sahne" satırı iki kolda FARKLI çıktı (173/173 ↔ 47/173) — oysa
   * kese her iki ölçümde de gizliydi, kolun sahneye dokunması imkânsız. Sebep şuydu: kırpma
   * kutusu kesenin KENDİ kutusundan türetiliyordu ve çerçeveli kol keseyi büyüttüğü için ölçüm
   * daha geniş, daha karanlık bir bölgeyi tarıyordu. Yani kollar aynı dünyayı ölçmüyordu.
   * Kırpma artık TABAN kolundan bir kez türetilip bütün kollara aynen verilir.
   */
  const klip = sabitKlip ?? { x: Math.max(0, e.purse.x - 4), y: Math.max(0, e.purse.y - 4), width: Math.min(e.purse.w + 8, kadraj.width - e.purse.x), height: e.purse.h + 8 };

  /**
   * YATAK = YAZININ ÜSTÜNE OTURDUĞU ZEMİN, OYUNCU YÜRÜRKEN ÖRNEKLENMİŞ.
   *
   * İlk deneme zamanı bekleyerek örnekledi ve `oynama` her kolda 0,0 çıktı — doğru ama boş bir
   * sayı: kamera oyuncuyu izliyor, oyuncu durduğu için manzara hiç değişmiyordu. Kutusuz kesenin
   * riski zaten "bekleyince" doğmuyor, **gezinince** doğuyor. Bu yüzden örnekler arasında
   * oyuncu gerçekten yürütülür (WASD, duman testiyle aynı yol) ve asıl sayı `oynama` olur:
   * yazının altındaki zeminin ortancası kaç birim geziyor. D-106'nın *"okunabilirliği kontur
   * taşır"* kararı tam olarak bu oynamayı göze almıştı; çerçeve onu sıfırlar.
   */
  const TUS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyW', 'KeyD'];
  const N = 6;
  const sahneOrnek = [], yatakOrnek = [];
  // HER KOL AYNI YERDEN BAŞLAR. Dördüncü koşuda taban kolu 19,0 oynarken çerçeveli kol 0,0
  // oynadı ve sönümleme hesaplanamadı — çünkü ikinci kol, birincinin bıraktığı yerden yürüyordu
  // ve oradan bakınca manzara değişmiyordu. Kolları aynı güzergâha oturtmayan bir ölçüm,
  // kolların farkı yerine güzergâhın farkını basar.
  await sayfa.evaluate(() => window.__teleport(-8.5, 13.4));
  await sayfa.waitForTimeout(500);
  for (let i = 0; i < N; i++) {
    // İKİ ÖLÇÜM AYNI DURAKTA — ayrı yürüyüşlerde alındıklarında karşılaştırılamaz oluyorlardı:
    // taban kolunda sahne 19,0 oynarken yatak 0,0 çıkmıştı, oysa kutusuz kolda yatak sahnenin
    // TA KENDİSİ. Fark kolun değil güzergâhın farkıydı (her örnekleme oyuncuyu bıraktığı
    // yerden yürütüyordu). Artık oyuncu bir adım atıyor, DURUYOR, ve iki kare o durakta alınıyor.
    await sayfa.keyboard.down(TUS[i % TUS.length]);
    await sayfa.waitForTimeout(600);
    await sayfa.keyboard.up(TUS[i % TUS.length]);
    await sayfa.waitForTimeout(320);

    await kolAc(sayfa, 'e-gizle', '.purse { visibility: hidden !important; }');
    await pikselYukle(sayfa, klip);
    sahneOrnek.push(await parlaklik(sayfa));
    await sayfa.evaluate(() => { window.__bir = window.__birSahne ?? null; });
    await birikimEkle(sayfa);
    await sayfa.evaluate(() => { window.__birSahne = window.__bir; });
    await kolKapa(sayfa, 'e-gizle');

    await kolAc(sayfa, 'e-gizle', '.purse svg, .purse .cur-val { visibility: hidden !important; }');
    await pikselYukle(sayfa, klip);
    yatakOrnek.push(await parlaklik(sayfa));
    await sayfa.evaluate(() => { window.__bir = window.__birYatak ?? null; });
    await birikimEkle(sayfa);
    await sayfa.evaluate(() => { window.__birYatak = window.__bir; });
    await kolKapa(sayfa, 'e-gizle');
  }
  const sahneSapma = await sayfa.evaluate(() => { window.__bir = window.__birSahne; return null; }).then(() => birikimOzet(sayfa));
  const yatakSapma = await sayfa.evaluate(() => { window.__bir = window.__birYatak; return null; }).then(() => birikimOzet(sayfa));
  await sayfa.evaluate(() => { window.__bir = window.__birSahne = window.__birYatak = null; });
  const ozet = (ornek) => {
    const ortalar = ornek.map((o) => o.orta);
    return {
      ornek: ornek.length,
      p10: Math.min(...ornek.map((o) => o.p10)), p90: Math.max(...ornek.map((o) => o.p90)),
      ortaMin: Math.min(...ortalar), ortaMaks: Math.max(...ortalar),
      oynama: +(Math.max(...ortalar) - Math.min(...ortalar)).toFixed(1),
    };
  };
  const sahne = { ...ozet(sahneOrnek), ...sahneSapma }, yatak = { ...ozet(yatakOrnek), ...yatakSapma };
  return {
    kadraj: kadraj.ad, kol: kolAdi, ...e, klip, sahne, yatak,
    // Kolun asıl kazancı: sahnenin oynamasını yatağa ne oranda GEÇİRDİĞİ. 1,00 = hiç sönümlemez.
    gecirme: sahne.ortSapma > 0.01 ? +(yatak.ortSapma / sahne.ortSapma).toFixed(3) : null,
  };
}

// =============================================================================================
//  KOLLAR — hepsi enjekte CSS/DOM. Kaynak dosyalara DOKUNULMAZ.
// =============================================================================================
const KOL_A1 = `
  /* A1: topuz YATAĞA sığar — input 22 → 28 px, topuz ray ortasına oturur. */
  .setting-slider input[type='range'] { height: 28px; }
  .setting-slider input[type='range']::-webkit-slider-thumb { margin-top: -6px; }
`;
const KOL_A2 = `
  /* A2: satır KAPALI dört kenar çerçeve — sol 3px/alt 1,5px karışımı yerine tek kalınlık. */
  .setting-slider {
    border: 2px solid var(--oyuk);
    border-radius: var(--rr);
    margin: 4px 0 4px 4px;
    padding: 8px 10px 8px 12px;
  }
`;
const KOL_A3 = `
  /* A3: L KALSIN ama KAPANSIN — sol çizgi üstteki/alttaki ayıraçla aynı x'ten başlar ve aynı
     kalınlığa iner. Satırı karta çevirmeden köşeyi kapatan en küçük değişiklik. */
  .setting-slider { margin-left: 0; border-left-width: 1.5px; padding-left: 18px; }
`;
const KOL_A4 = `
  /* A4: A3 + DİKEY açıklık da kapanır. A3 sol çizgiyi ayıraçla aynı x'e getirdi ama üst köşe
     yine 4 px açık kaldı: .sheet-pad bir flex kolon ve gap 4px her satırın arasına hava
     koyuyor. Yani açıklığın yarısı kaydırıcının değil, panelin kuralı. */
  .setting-slider { margin-left: 0; margin-top: -4px; border-left-width: 1.5px; padding-left: 18px; padding-top: 12px; }
`;
const KOL_B1 = `[data-testid="fps-overlay"] { display: none !important; }`;
const KOL_B2 = `[data-testid="fps-overlay"], [data-testid="set-showfps"] { display: none !important; }
  .setting-row:has([data-testid="set-showfps"]) { display: none !important; }`;
const KOL_C1 = `
  /* C1: iki ödül ALT ALTA, aralarında "+". Sarmalama DOM'da yapılıyor (aşağıdaki fonksiyon) —
     ödüller bugün ayrı eleman olmadığı için yalnız CSS ile alt alta konamıyor. */
  .reward-amount { flex-direction: column; gap: 2px; }
  .reward-amount .odul-sat { display: flex; align-items: center; gap: 9px; }
  .reward-amount .odul-arti { font-size: var(--p4); line-height: 1; opacity: 0.85; }
`;
const DOM_C1 = () => {
  const satir = document.querySelector('.reward-amount');
  if (!satir || satir.querySelector('.odul-sat')) return;
  const gruplar = []; let g = [];
  for (const d of [...satir.childNodes]) {
    if (d.nodeName === 'svg' && g.length) { gruplar.push(g); g = []; }
    g.push(d);
  }
  if (g.length) gruplar.push(g);
  satir.textContent = '';
  gruplar.forEach((grup, i) => {
    if (i > 0) { const a = document.createElement('span'); a.className = 'odul-arti'; a.textContent = '+'; satir.appendChild(a); }
    const s = document.createElement('span'); s.className = 'odul-sat';
    for (const d of grup) s.appendChild(d);
    satir.appendChild(s);
  });
};
const KOL_D1 = `
  /* D1: HALKA bar — çubuk madalyonun ÇEVRESİNE sarılır (Clash of Clans kalıbı). */
  .rep-bar { display: none !important; }
  .rep-halka {
    position: absolute; inset: -5px; border-radius: 50%;
    background: conic-gradient(var(--ac) calc(var(--oran) * 360deg), var(--oyuk) 0);
    -webkit-mask: radial-gradient(circle closest-side, transparent calc(100% - var(--kal)), #000 calc(100% - var(--kal)));
    mask: radial-gradient(circle closest-side, transparent calc(100% - var(--kal)), #000 calc(100% - var(--kal)));
    pointer-events: none;
  }
  .rep-medal { position: relative; }
`;
const DOM_D1 = () => {
  const med = document.querySelector('.rep-medal');
  const fill = document.querySelector('.rep-fill');
  if (!med || med.querySelector('.rep-halka')) return;
  // Oran çubuğun ÖLÇÜLEN eninden DEĞİL, React'in yazdığı inline yüzdeden okunur: kolun CSS'i
  // çubuğu zaten gizlemiş oluyor, ölçülen en 0 ve oran 0/0 = NaN çıkıyordu (ilk koşuda öyle oldu).
  const oran = fill ? Math.min(1, (parseFloat(fill.style.width) || 0) / 100) : 0;
  const h = document.createElement('i');
  h.className = 'rep-halka';
  h.dataset.oran = String(oran);
  h.style.setProperty('--oran', String(oran));
  h.style.setProperty('--kal', '6px');
  med.appendChild(h);
};
const KOL_D2 = `
  /* D2: rozet + para + elmas TEK ÜST SATIR. */
  .purse { flex-direction: row; align-items: center; gap: 14px; }
  .rep { flex-direction: row; align-items: center; gap: 6px; }
`;
const KOL_E1 = `
  /* E1: kese HAP ÇERÇEVE — D-106'nın kutusuz kararını geri alır. */
  .cur {
    padding: 3px 12px 3px 4px;
    border: 2.5px solid var(--ot);
    border-radius: var(--rr);
    background: rgba(27, 20, 67, 0.82);
  }
`;

// =============================================================================================
//  KOŞU
// =============================================================================================
async function odulEkraniAc(sayfa) {
  await sayfa.click('[data-testid="level"]', { timeout: 8000 });
  await sayfa.waitForSelector('[data-testid="goals-panel"]', { timeout: 8000 });
  await animasyonBekle(sayfa);
  const b = sayfa.locator('[data-testid^="goal-claim-"]').first();
  if (!(await b.count())) return false;
  await b.click();
  await sayfa.waitForSelector('[data-testid="goal-reward"]', { timeout: 8000 });
  await animasyonBekle(sayfa);
  return true;
}

for (const kadraj of KADRAJLAR) {
  const sayfa = await tarayici.newPage({
    viewport: { width: kadraj.width, height: kadraj.height },
    deviceScaleFactor: kadraj.dpr, isMobile: kadraj.mobil, hasTouch: kadraj.mobil,
  });
  const konsol = [];
  sayfa.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
  await sahneyiHazirla(sayfa);

  // ── §D + §E: üst şerit (panel açılmadan) ───────────────────────────────────────────────────
  // D3 = D1 + D2: kullanıcının cümlesi İKİSİNİ birden istiyor ("birleşik olmalı ... ve en üst
  // satırda yan yana olmalı"). Kolları ayrı ayrı ölçüp birleşiğini ölçmemek, sorulmayan bir
  // kolu uygulamak olurdu.
  for (const [ad, css, dom] of [['T', null, null], ['D1', KOL_D1, DOM_D1], ['D2', KOL_D2, null], ['D3', KOL_D1 + KOL_D2, DOM_D1]]) {
    if (css) await kolAc(sayfa, 'd', css, dom);
    const d = await olcD(sayfa, kadraj, ad);
    if (d) rapor.D.push(d);
    if (kadraj.mobil) await sayfa.screenshot({ path: path.join(SS, `r3-rozet-${ad}.png`), clip: { x: 0, y: 0, width: kadraj.width, height: 150 } });
    if (css) { await kolKapa(sayfa, 'd'); await sayfa.evaluate(() => document.querySelector('.rep-halka')?.remove()); }
  }
  let eKlip = null;
  for (const [ad, css] of [['T', null], ['E1', KOL_E1]]) {
    if (css) await kolAc(sayfa, 'e', css);
    const e = await olcE(sayfa, kadraj, ad, eKlip);
    if (e) { rapor.E.push(e); eKlip ??= e.klip; }
    if (kadraj.mobil) await sayfa.screenshot({ path: path.join(SS, `r3-kese-${ad}.png`), clip: { x: kadraj.width - 210, y: 0, width: 210, height: 120 } });
    if (css) await kolKapa(sayfa, 'e');
  }

  // ── §B: FPS katmanı ────────────────────────────────────────────────────────────────────────
  await sayfa.evaluate(() => window.__setState({ settings: { ...window.__game().settings, showFps: true } }));
  await sayfa.waitForTimeout(700);
  const b0 = await olcB(sayfa, kadraj);
  if (b0) rapor.B.push({ kol: 'T', ...b0 });
  else hata(`${kadraj.ad}: §B FPS katmani acilmadi`);
  if (kadraj.mobil) await sayfa.screenshot({ path: path.join(SS, 'r3-fps-T.png'), clip: { x: 0, y: 0, width: 260, height: 220 } });
  for (const [ad, css] of [['B1', KOL_B1], ['B2', KOL_B2]]) {
    await kolAc(sayfa, 'b', css);
    const v = await olcB(sayfa, kadraj);
    rapor.B.push({ kol: ad, kadraj: kadraj.ad, kutu: v?.kutu ?? null, alanPx2: v ? +(v.kutu.w * v.kutu.h).toFixed(0) : 0, ekranYuzde: v?.ekranYuzde ?? 0, cakisan: v?.cakisan ?? [] });
    await kolKapa(sayfa, 'b');
  }

  // ── §A: ayarlar kaydırıcısı ────────────────────────────────────────────────────────────────
  try {
    await sayfa.click('[data-testid="gear"]', { timeout: 8000 });
    await sayfa.waitForSelector('[data-testid="menu"]', { timeout: 8000 });
    await animasyonBekle(sayfa);

    // §B'nin İKİNCİ sahnesi: katmanın bedeli panel AÇIKKEN ölçülür (oyun ekranında boş köşede).
    const bPanel = await olcB(sayfa, kadraj);
    if (bPanel) rapor.B.push({ kol: 'T', ...bPanel });
    if (kadraj.mobil) await sayfa.screenshot({ path: path.join(SS, 'r3-fps-ayarlar.png'), clip: { x: 0, y: 60, width: 390, height: 240 } });

    // §A ARTIK KATMAN KAPALI ölçülür. Açık bırakıldığı üç koşuda "Ses seviyesi" satırının sol
    // çizgisi 18 px / oran 0,40 çıkıyordu — çizgi kısa değildi, ÜSTÜ ÖRTÜLÜYDÜ. Ölçüm, ölçtüğü
    // kusurun üstüne kendi kurduğu bir kusuru koymuş oluyordu.
    await sayfa.evaluate(() => window.__setState({ settings: { ...window.__game().settings, showFps: false } }));
    await animasyonBekle(sayfa);

    for (const [ad, css] of [['T', null], ['A1', KOL_A1], ['A2', KOL_A2], ['A3', KOL_A3], ['A4', KOL_A4]]) {
      if (css) await kolAc(sayfa, 'a', css);
      rapor.A.push(...(await olcA(sayfa, kadraj, ad)));
      if (kadraj.mobil) {
        const el = sayfa.locator('.setting-slider').first();
        await sayfa.locator('[data-testid="set-sound-vol"]').fill('45');
        await sayfa.waitForTimeout(200);
        await el.screenshot({ path: path.join(SS, `r3-kaydirici-${ad}.png`) });
        await sayfa.locator('[data-testid="set-sound-vol"]').fill('100');
      }
      if (css) await kolKapa(sayfa, 'a');
    }
    if (kadraj.mobil) await sayfa.screenshot({ path: path.join(SS, 'r3-ayarlar-T.png') });
    await sayfa.click('.sheet-back', { timeout: 5000 });
    await sayfa.waitForTimeout(400);
  } catch (e) {
    hata(`${kadraj.ad}: §A ayarlar ekrani acilamadi — ${e.message.split('\n')[0]}`);
    await sayfa.keyboard.press('Escape').catch(() => {});
  }

  // ── §C: ödül ekranı ────────────────────────────────────────────────────────────────────────
  try {
    if (await odulEkraniAc(sayfa)) {
      const c0 = await olcC(sayfa, kadraj, 'T');
      if (c0) rapor.C.push({ ...c0, kol: 'T' });
      if (kadraj.mobil) await sayfa.locator('.reward-card').screenshot({ path: path.join(SS, 'r3-odul-T.png') });
      await kolAc(sayfa, 'c', KOL_C1, DOM_C1);
      const c1 = await olcC(sayfa, kadraj, 'C1');
      if (c1) rapor.C.push({ ...c1, kol: 'C1' });
      if (kadraj.mobil) await sayfa.locator('.reward-card').screenshot({ path: path.join(SS, 'r3-odul-C1.png') });
      await kolKapa(sayfa, 'c');
    } else hata(`${kadraj.ad}: §C toplanabilir hedef yok — odul ekrani acilamadi`);
  } catch (e) {
    hata(`${kadraj.ad}: §C — ${e.message.split('\n')[0]}`);
  }

  rapor.hata.push(...konsol.slice(0, 4).map((h) => `${kadraj.ad}/konsol: ${h.slice(0, 150)}`));
  await sayfa.close();
}

await tarayici.close();
sunucu.kill();

// ── ETKİLİ Mİ DENETİMİ: bir kol tabanla BİREBİR aynı sayı veriyorsa uygulanmamıştır ──────────
function etkiDenetle(ad, taban, kol, alanlar) {
  if (!taban || !kol) return;
  const ayni = alanlar.every((a) => JSON.stringify(taban[a]) === JSON.stringify(kol[a]));
  if (ayni) hata(`${ad}: kol tabanla birebir ayni (${alanlar.join('/')}) — ETKISIZ, rapora sayi giremez`);
}
{
  const tel = (dizi, kol) => dizi.find((v) => v.kadraj === 'telefon' && v.kol === kol);
  etkiDenetle('§A A1', rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'T' && v.ad === 'ses'),
    rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'A1' && v.ad === 'ses'), ['inputH', 'topuzTasma']);
  etkiDenetle('§A A2', rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'T' && v.ad === 'ses'),
    rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'A2' && v.ad === 'ses'), ['kapaliKenar']);
  etkiDenetle('§A A3', rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'T' && v.ad === 'ses'),
    rapor.A.find((v) => v.kadraj === 'telefon' && v.kol === 'A3' && v.ad === 'ses'), ['solHizasizlik', 'kenar']);
  etkiDenetle('§C C1', tel(rapor.C, 'T'), tel(rapor.C, 'C1'), ['dizilim', 'satir']);
  etkiDenetle('§D D1', tel(rapor.D, 'T'), tel(rapor.D, 'D1'), ['rozetH', 'yolBoy']);
  etkiDenetle('§D D2', tel(rapor.D, 'T'), tel(rapor.D, 'D2'), ['satirSayisi', 'topbarH']);
  etkiDenetle('§D D3', tel(rapor.D, 'T'), tel(rapor.D, 'D3'), ['satirSayisi', 'yolBoy']);
  etkiDenetle('§E E1', tel(rapor.E, 'T'), tel(rapor.E, 'E1'), ['para']);
  const b1 = rapor.B.find((v) => v.kadraj === 'telefon' && v.kol === 'B1');
  if (b1 && b1.alanPx2 > 0) hata('§B B1: katman hala ekranda — ETKISIZ');
}

writeFileSync(path.join(KOK, 'docs', 'olcum-hud-r3.json'), JSON.stringify(rapor, null, 1), 'utf8');

// ── İNSAN-OKUNUR HAM ÇIKTI ───────────────────────────────────────────────────────────────────
const sat = [];
const y = (s = '') => sat.push(s);
const n = (v, g = 2) => (v == null ? '—' : Number(v).toFixed(g));
y('R3 ÖLÇÜM — HUD çerçeveleri: kaydırıcı (A) · FPS (B) · ödül (C) · rozet (D) · kese (E)');
y(`damga: ${rapor.damga} · kip: ${KIP.toUpperCase()} · kadraj: ${KADRAJLAR.map((k) => k.ad).join('+')} · hata: ${rapor.hata.length}`);
y('araç: tools/olcum-hud-r3.mjs · ham: docs/olcum-hud-r3.json');
y('kollar SAYFAYA enjekte edildi (CSS/DOM); uygulama kaynağı değişmedi.');
y('');
y('§A — AYARLAR KAYDIRICISI (kaydırıcı %45te; "kesik" = çizilen sol çizginin satıra oranı + köşe açıklıkları)');
y('  solCizgiBoy = en uzun KESİNTİSİZ koşu (ayıraçlar ayrı parça sayılır) · ustKose/altKose > 0 → köşe kapanmıyor');
y('kadraj   kol sat.  satirH inputH kenar(s/a/u/g)  kapali cizgiBoy oran ustKose altKose solHiza topuz(ic/dis) tasma');
for (const a of rapor.A) {
  y([a.kadraj.padEnd(8), a.kol.padEnd(3), a.ad.padEnd(5),
    n(a.satirH, 1).padStart(6), n(a.inputH, 1).padStart(6),
    `${n(a.kenar.sol, 1)}/${n(a.kenar.alt, 1)}/${n(a.kenar.ust, 1)}/${n(a.kenar.sag, 1)}`.padStart(15),
    String(a.kapaliKenar).padStart(6), n(a.solCizgiBoy).padStart(9), n(a.solCizgiOran, 3).padStart(5),
    n(a.ustKoseAcik).padStart(7), n(a.altKoseAcik).padStart(7), n(a.solHizasizlik).padStart(7),
    `${n(a.topuzIcCap, 1)}/${n(a.topuzDisCap, 1)}`.padStart(13), n(a.topuzTasma).padStart(6)].join(' '));
}
y('');
y('§B — FPS KATMANI (alan px² ve ekran yüzdesi; çakışan = katmanın altında kalan HUD öğeleri)');
y('kadraj   kol sahne    kutu(w×h@x,y)          alan px²  ekran%  cakisan (katmanin ALTINDA kalan)');
for (const b of rapor.B) {
  y([b.kadraj.padEnd(8), b.kol.padEnd(3), (b.sahne ?? '—').padEnd(8),
    (b.kutu ? `${b.kutu.w}×${b.kutu.h}@${b.kutu.x},${b.kutu.y}` : 'YOK').padEnd(24),
    String(b.alanPx2).padStart(9), n(b.ekranYuzde).padStart(7), '  ' + (b.cakisan.join(',') || '—')].join(' '));
}
y('');
y('§C — ÖDÜL SATIRI (cocuk = .reward-amount doğrudan çocuk sayısı; ödüller bugün AYRI ELEMAN DEĞİL)');
y('kadraj   kol cocuk dizilim  satir(w×h)   kart icEn  satir/icEn  enBuyukAcik gorselSatir arti?');
for (const c of rapor.C) {
  y([c.kadraj.padEnd(8), c.kol.padEnd(3), String(c.cocuk).padStart(5), c.dizilim.padEnd(8),
    `${n(c.satir.w, 1)}×${n(c.satir.h, 1)}`.padStart(12), n(c.kart.icEn, 1).padStart(9),
    n(c.satirOran, 3).padStart(11), n(c.enBuyukAcik).padStart(12), n(c.gorselSatir).padStart(11),
    (c.artiVar ? 'EVET' : 'hayir').padStart(6)].join(' '));
}
for (const c of rapor.C) {
  y(`  ${c.kadraj}/${c.kol} çocuklar: ` + c.kutular.map((k) => `${k.tip}${k.metin ? '"' + k.metin + '"' : ''}@${k.x}+${k.w}`).join(' · '));
}
y('');
y('§D — SEVİYE ROZETİ (satirSayisi = üst şeridin kaç ayrı y-merkezine yayıldığı; yolBoy = ilerleme yolunun tam uzunluğu)');
y('kadraj   kol medalyon(w×h) ilerleme       aray rozetH topbarH satir yolBoy yayBoy barKal  oran');
for (const d of rapor.D) {
  y([d.kadraj.padEnd(8), d.kol.padEnd(3),
    (d.medalyon ? `${n(d.medalyon.w, 1)}×${n(d.medalyon.h, 1)}` : '—').padStart(13),
    (d.bar ? `duz ${n(d.bar.w, 1)}×${n(d.bar.h, 1)}` : d.halka ? `halka c${n(d.halka.w, 1)}` : '—').padEnd(13),
    n(d.arayBosluk, 1).padStart(5), n(d.rozetH, 1).padStart(6), n(d.topbarH, 1).padStart(7),
    String(d.satirSayisi).padStart(5), n(d.yolBoy, 1).padStart(6), n(d.yayBoy, 1).padStart(6),
    n(d.barKalinlik, 1).padStart(6), n(d.oran, 3).padStart(6)].join(' '));
}
y('');
y('§E — KESE (cerceve = kutunun kenar kalınlığı)');
y('  sahne = kese TÜMÜYLE gizliyken o köşede çizilen oyun · yatak = YAZI gizliyken yazının altındaki zemin');
y('  6 durak — oyuncu YÜRÜTÜLÜR, her durakta iki kare AYNI ANDA alınır (kırpma bütün kollarda sabit)');
y('  SAPMA = her pikselin 6 örnek boyunca std sapmasının ortalaması · GECIRME = yatak/sahne (1,00 = hiç sönümlemez)');
y('kadraj   kol para(w×h)   cerceve kontur elmas(w×h)  cerceve  sahne p10/p90 sapma   yatak p10/p90 sapma gecirme');
for (const e of rapor.E) {
  const s = e.sahne, t = e.yatak;
  y([e.kadraj.padEnd(8), e.kol.padEnd(3),
    (e.para ? `${n(e.para.kutu.w, 1)}×${n(e.para.kutu.h, 1)}` : '—').padStart(11),
    n(e.para?.cerceve, 1).padStart(7), String(e.para?.kontur ?? '—').padStart(6),
    (e.elmas ? `${n(e.elmas.kutu.w, 1)}×${n(e.elmas.kutu.h, 1)}` : '—').padStart(11),
    n(e.elmas?.cerceve, 1).padStart(7),
    `  ${s.p10}/${s.p90}`.padStart(14), n(s.ortSapma, 2).padStart(6),
    `  ${t.p10}/${t.p90}`.padStart(14), n(t.ortSapma, 2).padStart(6), n(e.gecirme, 3).padStart(7)].join(' '));
}
y('');
for (const h of rapor.hata) y(`! ${h}`);
writeFileSync(path.join(KOK, 'docs', 'olcum-hud-r3.txt'), sat.join('\n') + '\n', 'utf8');

console.log(`A ${rapor.A.length} · B ${rapor.B.length} · C ${rapor.C.length} · D ${rapor.D.length} · E ${rapor.E.length} satir · hata ${rapor.hata.length}`);
process.exit(0);
