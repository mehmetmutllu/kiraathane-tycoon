// ALT GEZİNME ÖLÇÜMÜ — `docs/alt-gezinme-maketi.html` içindeki palet kollarını, barın gerçekten
// yaşadığı yere karşı ölçer: oyun karesinin barın HEMEN ÜSTÜNDEKİ şeridine.
//
// NEDEN: "renkler kötü" ve "mor iyi mi bilmiyorum" iki HİS. B2 ölçümü arayüzün kütlesinin
// sahneyle aynı renk diliminde olduğunu göstermişti (R = 0,91). Bir palet kolunun bu bulguya
// dokunup dokunmadığı gözle değil, iki sayıyla belli olur:
//   ① Δh  — barın gövde rengi sahnenin baskın renginden kaç derece uzakta (ayrışma)
//   ② ΔL  — aynı ikilinin açıklık farkı (bar "biten bir çubuk" mu, sahnenin devamı mı)
// Üçüncü sayı okunabilirlik: etiket ve aktif sekme metni için WCAG oranı (B4: bugün 45/184 öğe AA altı).
//
// TEK KAYNAK: kollar maketin kendi <script type="application/json" id="kollar"> bloğundan okunur.
// Maket değişirse ölçüm de değişir; iki yerde palet tutulmaz.
//
// Koşu:  node tools/olcum-altnav.mjs > docs/olcum-altnav.txt
// Piksel okuması deterministiktir (tek kare, tek geçiş) — kısa/tam koşu ayrımı YOK.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const MAKET = 'docs/alt-gezinme-maketi.html';
const KARE = 'docs/gorsel/ss/s10-hud.png';
/** Kare 780×1688 = 390×844 CSS'in 2 katı. Bar CSS 772…844 → cihaz 1544…1688. */
const OLCEK = 2;
const BAR_UST_CSS = 772;
/** Barın altında yaşadığı şerit: barın hemen üstündeki 72 px — sahne orada ne renk? */
const SERIT_CSS = [BAR_UST_CSS - 72, BAR_UST_CSS];

const html = readFileSync(MAKET, 'utf8');
const blok = html.match(/<script type="application\/json" id="kollar">([\s\S]*?)<\/script>/);
if (!blok) { console.error('maketin kollar bloğu bulunamadı'); process.exit(1); }
const KOLLAR = JSON.parse(blok[1]);

const hex = (s) => {
  const m = s.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
};
const hsl = ([r, g, b]) => {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === R) h = ((G - B) / d) % 6;
    else if (mx === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
};
/** WCAG bağıl parlaklık + kontrast oranı. */
const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const kontrast = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** Renk çemberinde en kısa açı farkı (0…180). */
const dh = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
/** Gövdenin görünen rengi: barın dikey gradyanının ortası (göz kütleyi oradan okur). */
const orta = (a, b) => a.map((v, i) => Math.round((v + b[i]) / 2));

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage();
await sayfa.setContent('<html><body></body></html>');
const png = 'data:image/png;base64,' + readFileSync(KARE).toString('base64');

const sahne = await sayfa.evaluate(async ([png, olcek, serit, barUst]) => {
  const img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = png; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  const ctx = c.getContext('2d');
  const oku = (y0, y1) => {
    const d = ctx.getImageData(0, y0 * olcek, c.width, (y1 - y0) * olcek).data;
    const px = [];
    for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    return px;
  };
  return { serit: oku(serit[0], serit[1]), bar: oku(barUst + 4, 844), en: c.width, boy: c.height };
}, [png, OLCEK, SERIT_CSS, BAR_UST_CSS]);
await tarayici.close();

/** Ağırlıklı baskın renk: kromatik pikselleri 10°'lik kovalara at, en dolu kovanın ortalaması. */
function baskin(px) {
  const kova = new Map();
  let topL = 0, topS = 0;
  for (const p of px) {
    const c = hsl(p);
    topL += c.l; topS += c.s;
    if (c.s < 0.08) continue;
    const k = Math.floor(c.h / 10);
    const v = kova.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    v.n++; v.r += p[0]; v.g += p[1]; v.b += p[2];
    kova.set(k, v);
  }
  const en = [...kova.values()].sort((a, b) => b.n - a.n)[0];
  const rgb = en ? [en.r / en.n, en.g / en.n, en.b / en.n].map(Math.round) : [128, 128, 128];
  const kromatik = [...kova.values()].reduce((a, v) => a + v.n, 0);
  return { rgb, hsl: hsl(rgb), ortL: topL / px.length, ortS: topS / px.length, kromatikPay: kromatik / px.length };
}

const S = baskin(sahne.serit);
const B = baskin(sahne.bar);

const yaz = (s = '') => console.log(s);
const n = (v, d = 1) => v.toFixed(d).padStart(6);
const cizgi = '='.repeat(94);

yaz(cizgi);
yaz('ALT GEZİNME — palet kolları, barın gerçekten yaşadığı yere karşı ölçüldü');
yaz(cizgi);
yaz();
yaz(`  kare      : ${KARE}  (${sahne.en}×${sahne.boy} px = ${sahne.en / OLCEK}×${sahne.boy / OLCEK} CSS)`);
yaz(`  maket     : ${MAKET}  (${KOLLAR.length} kol)`);
yaz(`  sahne şeridi : CSS y ${SERIT_CSS[0]}…${SERIT_CSS[1]} — barın hemen üstü, ${sahne.serit.length} piksel`);
yaz();
yaz('§1  SAHNE — barın karşısındaki zemin');
yaz('-'.repeat(94));
yaz(`  baskın renk      rgb(${S.rgb.join(', ')})   h ${S.hsl.h.toFixed(0)}°  s %${(S.hsl.s * 100).toFixed(0)}  L %${(S.hsl.l * 100).toFixed(0)}`);
yaz(`  şeridin ortalaması  açıklık %${(S.ortL * 100).toFixed(1)} · doygunluk %${(S.ortS * 100).toFixed(1)} · kromatik pay %${(S.kromatikPay * 100).toFixed(1)}`);
yaz(`  BUGÜNKÜ BAR      rgb(${B.rgb.join(', ')})   h ${B.hsl.h.toFixed(0)}°  s %${(B.hsl.s * 100).toFixed(0)}  L %${(B.hsl.l * 100).toFixed(0)}`);
yaz(`                   Δh sahneden ${dh(B.hsl.h, S.hsl.h).toFixed(0)}°  ·  ΔL ${((S.hsl.l - B.hsl.l) * 100).toFixed(0)} puan`);
yaz();
yaz('  OKUMA: bugünkü bar sahnenin baskın renginden ' + dh(B.hsl.h, S.hsl.h).toFixed(0) + '° uzakta. B2 (R = 0,91)');
yaz('  tam olarak bunu ölçmüştü: arayüz sahnenin renk dilimini terk etmiyor, ayrım yalnız açıklıkla');
yaz('  yapılıyor. Bir palet kolunun bu bulguya dokunup dokunmadığı §2\'deki Δh sütununda görünür.');
yaz();
yaz('§2  KOLLAR — ayrışma ve okunabilirlik');
yaz('-'.repeat(94));
yaz();
yaz('  kol   gövde(orta)      h      s      L      Δh     ΔL   etiket  aktif   min');
yaz('  ' + '-'.repeat(90));

const satirlar = [];
for (const k of [{ id: 'BUGÜN', ad: 'bugünkü bar (karadan okundu)', rgbOrta: B.rgb, tx: null }, ...KOLLAR]) {
  const govde = k.rgbOrta ?? orta(hex(k.g1), hex(k.g2));
  const c = hsl(govde);
  const kEtiket = k.tx ? kontrast(hex(k.tx), govde) : null;
  const kAktif = k.txa ? kontrast(hex(k.txa), orta(hex(k.ac), hex(k.ac2))) : null;
  const min = kEtiket && kAktif ? Math.min(kEtiket, kAktif) : null;
  satirlar.push({ id: k.id, ad: k.ad ?? '', govde, c, dh: dh(c.h, S.hsl.h), dL: (S.hsl.l - c.l) * 100, kEtiket, kAktif, min });
  yaz(`  ${k.id.padEnd(6)}rgb(${govde.map((v) => String(v).padStart(3)).join(',')})${n(c.h, 0)}°  %${(c.s * 100).toFixed(0).padStart(3)}  %${(c.l * 100).toFixed(0).padStart(3)}  ${n(dh(c.h, S.hsl.h), 0)}°  ${n((S.hsl.l - c.l) * 100, 0)}  ${kEtiket ? kEtiket.toFixed(2).padStart(6) : '     —'}  ${kAktif ? kAktif.toFixed(2).padStart(6) : '     —'}  ${min ? (min >= 4.5 ? 'AA ✓' : 'AA ✗') : '  —'}`);
}
yaz();
yaz('  Δh = gövdenin sahne baskın renginden açı farkı (büyük = bar sahneden ayrışıyor)');
yaz('  ΔL = sahne açıklığı − gövde açıklığı, puan (büyük = bar sahneden koyu, kenarı net)');
yaz('  etiket = pasif sekme yazısı / gövde · aktif = aktif sekme yazısı / aksan · eşik WCAG AA 4,5');
yaz();
yaz('§3  KOLLARIN KARŞILAŞTIRMASI');
yaz('-'.repeat(94));
const kol = (id) => satirlar.find((s) => s.id === id);
const bug = kol('BUGÜN');
for (const s of satirlar.filter((x) => x.id !== 'BUGÜN')) {
  yaz();
  yaz(`  ${s.id} — ${s.ad}`);
  yaz(`     ayrışma  : Δh ${s.dh.toFixed(0)}°  (bugün ${bug.dh.toFixed(0)}° → ${(s.dh - bug.dh >= 0 ? '+' : '')}${(s.dh - bug.dh).toFixed(0)}°)`);
  const yon = s.c.s < bug.c.s
    ? 'gövde renkten ÇIKIYOR — kütle nötre iner, sıcaklık tek aksanda toplanır (B2\'nin reçetesi)'
    : s.dh < 30
      ? 'gövde daha DOYGUN ve sahnenin DİLİMİNDE — B2 bulgusu barda aynen durur'
      : 'gövde doygun ama BAŞKA dilimde — tek leke çözülür, yerine ikinci bir renk kütlesi kurulur';
  yaz(`     doygunluk: %${(s.c.s * 100).toFixed(0)}  (bugün %${(bug.c.s * 100).toFixed(0)}) — ${yon}`);
  yaz(`     kenar    : ΔL ${s.dL.toFixed(0)} puan — ${s.dL > 0 ? 'bar sahneden KOYU, üst kenarı kendiliğinden çiziliyor' : 'bar sahneden AÇIK, kenarı yalnız kontur taşıyor'}`);
  yaz(`     okunur   : etiket ${s.kEtiket.toFixed(2)} · aktif ${s.kAktif.toFixed(2)} → ${s.min >= 4.5 ? 'ikisi de AA geçer' : 'AA ALTINDA kalan var'}`);
}
yaz();
yaz(cizgi);
yaz('SONUÇ');
yaz(cizgi);
const enAyrik = satirlar.filter((x) => x.id !== 'BUGÜN').sort((a, b) => b.dh - a.dh)[0];
const enNotr = satirlar.filter((x) => x.id !== 'BUGÜN').sort((a, b) => a.c.s - b.c.s)[0];
yaz();
yaz(`  Sahneden EN ÇOK ayrışan kol : ${enAyrik.id} (Δh ${enAyrik.dh.toFixed(0)}°)`);
yaz(`  Gövdesi EN NÖTR kol         : ${enNotr.id} (doygunluk %${(enNotr.c.s * 100).toFixed(0)})`);
yaz(`  WCAG AA'yı geçemeyen kol    : ${satirlar.filter((x) => x.min && x.min < 4.5).map((x) => x.id).join(', ') || 'yok'}`);
yaz();
yaz('  Bu sayılar bir kolu SEÇMEZ — hangi bedelin ödendiğini söyler. Δh büyüdükçe bar sahneden');
yaz('  ayrışır ama kıraathanenin sıcak kimliğinden de uzaklaşır; karar kullanıcınındır.');
yaz();
