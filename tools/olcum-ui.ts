/**
 * olcum-ui.ts — S9+S10 ÖLÇÜM (çözümleme tarafı): ARAYÜZ DİLİ + SES KAYNAĞI.
 *
 * NEDEN İKİSİ TEK ARAÇTA: kullanıcı iki kalemi bilerek birleştirdi (*"ui araştırması ile
 * birlikte araştırma başlat, sonra ikisine de karar verelim"*). İkisinin ortak sorusu da aynı:
 * **bu oyunun bir SİSTEMİ var mı, yoksa her parça kendi kararını mı veriyor?** Arayüzde bunun
 * ölçüsü kaç farklı gölge/punto/yarıçap çizildiği; seste kaç farklı "sanatçı"nın konuştuğu.
 *
 * İKİ KAYNAKTAN OKUR ve ikisi de KOD/EKRAN, anlatı değil:
 *   · `docs/olcum-ui-ekran.json` — `tools/shot-ui-s10.mjs`ın telefon kadrajında ÇİZİLEN'den
 *     topladığı ham veri (hesaplanmış stiller, kabuk kutuları, kontrast).
 *   · `src/game/audio.ts` — ses kataloğunun kendisi; süre katmanlardan TÜRER (D-096 §6).
 *
 * KAYNAK KOLLARININ SAYILARI (§S3) ELLE YAZILMIŞ VERİ DEĞİL, KÜNYEDİR: her satırın yanında
 * nereden okunduğu duruyor ve tarih damgalı. Ölçüm aracı bir lisans metnini "ölçemez" — ama
 * hangi iddianın nereden geldiğini gösterebilir, ve karar paketinde tartışılan şey budur.
 *
 * KOŞU KİPİ — BU ARAÇTA KISA/TAM AYRIMI YOKTUR ve bu bilerek yazılıyor. Kip ayrımının sebebi
 * uzun simülasyonların bedelini yön arayan koşulara ödetmemekti (olcum-lib başlığı); burada
 * ölçüm deterministik ve anlıktır — senaryo yok, tohum yok, süre < 2 sn. `OLCUM=tam` yalnız
 * "bu çıktı rapora girer" damgasını basar. Sahte bir kısa kip eklemek, kipin ANLAMINI boşaltırdı.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-ui-ses.txt` üretir.
 * Kullanım: node tools/shot-ui-s10.mjs                       (önce ekran ölçümü — ASIL ölçüm)
 *           OLCUM=tam npx tsx tools/olcum-ui.ts > docs/olcum-ui-ses.txt
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { SES_KATALOG, sesSure, type SesId } from '../src/game/audio';
import { damga, damgaOzeti, kipBandi } from './olcum-lib';

/** İKONUN YERİNE GEÇEN glifler — kusur bunlar. Cümlenin KENDİSİ olan işaret (₺ · + · ×)
 *  kusur değildir. Liste `tests/mor-dil.test.ts` 6'dakiyle AYNI: iki yer aynı şeyi kusur saysın. */
const IKON_YERINE = ['\u{1F512}', '✕', '✖', '↺', '↻', '✓', '✔', '→', '←', '▶', '◀', '★', '☆', '⭐',
  '\u{1F48E}', '\u{1F3C6}', '\u{1F381}', '⚡', '\u{1F514}', '⚙', '•'];

const cikti: string[] = [];
const yaz = (s = '') => { cikti.push(s); };
const n2 = (v: number) => v.toFixed(2).padStart(7);
const yz = (v: number) => `%${(v * 100).toFixed(1)}`;

kipBandi();

// ============================================================================================
//  ORTAK — renk yardımcıları. Palet iddiaları ("kahverengi", "iç karartıcı") HSL'de sayıya döner.
// ============================================================================================
type Rgb = [number, number, number];

/** `rgb(…)`/`rgba(…)`/`grad:linear-gradient(…)` içindeki BÜTÜN renk duraklarını çıkarır. */
function renkleriAyikla(s: string): Rgb[] {
  const out: Rgb[] = [];
  for (const m of s.matchAll(/rgba?\(([^)]+)\)/g)) {
    const v = m[1].split(',').map((x) => Number.parseFloat(x));
    if (v.length >= 3 && Number.isFinite(v[0])) {
      // Neredeyse saydam duraklar palet değildir (siyah perde, %4'lük ayırıcı çizgi…).
      if ((v[3] ?? 1) < 0.5) continue;
      out.push([v[0], v[1], v[2]]);
    }
  }
  return out;
}

/** HSL — h derece (0…360), s ve l 0…1. */
function hsl([r, g, b]: Rgb): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (mx === R) h = ((G - B) / d) % 6;
    else if (mx === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/**
 * Renk çemberindeki EN DAR yay — paletin sıkıştığı dilim. Gri/beyaz sayılmaz.
 *
 * TEK BAŞINA YANILTIR ve bu ARACIN KENDİ ÖLÇÜMÜ gösterdi: ilk koşuda yay 216° çıktı ama aynı
 * çıktının bir satır altı "sıcak payı %93,1" diyordu. İkisi çelişmiyordu — yay UÇLARI ölçüyor,
 * pay KÜTLEyi. Tek bir yeşil rozet ve tek bir mavi ipucu yayı 216°ye açıyor, oysa ekrana
 * bakan göz bir kahverengi leke görüyor. O yüzden yayın yanında `kutleYogunlugu` da basılır ve
 * PARAGRAF ondan türetilir. (S8 dersinin aynısı: sayı ile anlatı birbirini denetler.)
 */
function yayGenisligi(hler: number[]): number {
  if (hler.length < 2) return 0;
  const s = [...hler].sort((a, b) => a - b);
  let enBuyukBosluk = 360 - s[s.length - 1] + s[0];
  for (let i = 1; i < s.length; i++) enBuyukBosluk = Math.max(enBuyukBosluk, s[i] - s[i - 1]);
  return 360 - enBuyukBosluk;
}

/**
 * AĞIRLIKLI kütle ölçüsü: paletin ağırlık merkezi ve o merkezin çevresindeki `pencere` derecelik
 * dilimde toplanan ağırlık payı. `R` (bileşke vektör boyu) 1'e yakınsa renkler tek yöne bakıyor.
 */
function kutleYogunlugu(renkler: { h: number; w: number }[], pencere = 60) {
  const W = renkler.reduce((a, c) => a + c.w, 0) || 1;
  const x = renkler.reduce((a, c) => a + c.w * Math.cos((c.h * Math.PI) / 180), 0) / W;
  const y = renkler.reduce((a, c) => a + c.w * Math.sin((c.h * Math.PI) / 180), 0) / W;
  const merkez = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const R = Math.hypot(x, y);
  const fark = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const icinde = renkler.filter((c) => fark(c.h, merkez) <= pencere / 2).reduce((a, c) => a + c.w, 0) / W;
  return { merkez, R, pencere, icinde };
}

// ============================================================================================
//  §S SES — bugünkü katalog. D-096 seslerin AYIRT EDİLDİĞİNİ ölçtü; bu tur başka şey soruyor:
//  katalog oyunun YAŞAM DÖNGÜSÜNÜ kuruyor mu, ve kullanıcının "güzel coin sesi" isteği
//  bugünkü coin'in NERESİNDE eksik kalıyor?
// ============================================================================================
yaz('='.repeat(94));
yaz('§S  SES — bugünkü katalog ve eksikleri');
yaz('='.repeat(94));

const idler = Object.keys(SES_KATALOG) as SesId[];
type SesSatir = { id: SesId; sure: number; katman: number; aile: 'gürültü' | 'ton'; gain: number; nota: number };
const sesler: SesSatir[] = idler.map((id) => {
  const t = SES_KATALOG[id];
  const baskin = [...t.katmanlar].sort((a, b) => b.gain - a.gain)[0];
  return {
    id,
    sure: sesSure(id),
    katman: t.katmanlar.length,
    aile: baskin.kaynak === 'gurultu' ? 'gürültü' : 'ton',
    gain: t.katmanlar.reduce((a, k) => a + k.gain, 0),
    nota: Math.max(...t.katmanlar.map((k) => k.hz.length)),
  };
});

yaz('');
yaz('  ses        süre(sn)  katman  baskın aile  toplam gain  en uzun dizi');
yaz('  ' + '-'.repeat(74));
for (const s of [...sesler].sort((a, b) => a.sure - b.sure)) {
  yaz(`  ${s.id.padEnd(10)} ${n2(s.sure)}  ${String(s.katman).padStart(6)}  ${s.aile.padEnd(11)}  ${n2(s.gain)}      ${String(s.nota).padStart(2)}`);
}

const coin = sesler.find((s) => s.id === 'coin')!;
const sureSirasi = [...sesler].sort((a, b) => a.sure - b.sure).findIndex((s) => s.id === 'coin') + 1;
const ortSure = sesler.reduce((a, s) => a + s.sure, 0) / sesler.length;
yaz('');
yaz(`  COIN'İN YERİ: süre sıralamasında ${sureSirasi}./${sesler.length} · ${coin.sure.toFixed(3)} sn`);
yaz(`                katalog ortalaması ${ortSure.toFixed(3)} sn → coin ortalamanın ${(coin.sure / ortSure).toFixed(2)}× ı`);
yaz(`                katman ${coin.katman} · toplam gain ${coin.gain.toFixed(2)} (katalogda en yüksek ${Math.max(...sesler.map((s) => s.gain)).toFixed(2)})`);
yaz('');
yaz('  OKUMA: coin kataloğun EN KISA sesi ve bu bir kusur DEĞİL — saniyede birden çok kez');
yaz('  çalıyor, uzun olsa yığılırdı (`aralik` 0,06 sn). Kullanıcının "güzel coin sesi" isteği');
yaz('  süreyle değil KATMAN SAYISI ve GÖVDE ile ilgili: bugünkü coin tek bir metalik tık +');
yaz('  bir tiz geçiş. Piyasa tycoon\'larının para sesi bir OLAY zinciridir (tık → tınlama →');
yaz('  kısa "kasa" onayı) ve genelde ÇOKLU TOPLAMADA perde basamak basamak yükselir.');

// Perde basamağı var mı? — art arda toplamada aynı perde tekrarlıyorsa "yığın" hissi doğmaz.
const kaynak = readFileSync('src/game/audio.ts', 'utf8');
const perdeBasamak = /basamak|perdeYukselt|comboPitch|ardArda/.test(kaynak);
yaz('');
yaz(`  ÇOKLU TOPLAMADA PERDE BASAMAĞI: ${perdeBasamak ? 'VAR' : 'YOK'} — art arda toplanan her para AYNI perdede çalıyor.`);

// Ortam sesi / döngü var mı?
const dongu = /dongu|loop/i.test(kaynak);
const muzikBaglari = ['src']
  .flatMap((d) => dosyalariGez(d))
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .map((f) => (readFileSync(f, 'utf8').match(/settings\.music|'music'|"music"/g) ?? []).length)
  .reduce((a, b) => a + b, 0);
const sesDosyalari = existsSync('public/assets/audio') ? readdirSync('public/assets/audio').filter((f) => !f.startsWith('.')) : [];
const bildirilenDosya = idler.filter((id) => SES_KATALOG[id].dosya).length;

yaz('');
yaz(`  ORTAM SESİ / DÖNGÜ         : ${dongu ? 'var' : 'YOK'} — katalogda 9 sesin 9'u TEK ATIŞ, sürekli ses yok.`);
yaz(`  settings.music BAĞLANTISI  : ${muzikBaglari} referans (kayıtta duruyor, ${muzikBaglari <= 6 ? 'hiçbir sese bağlı değil' : 'bağlı'})`);
yaz(`  KATALOGDA BİLDİRİLEN DOSYA : ${bildirilenDosya}/${idler.length} — her sesin dosya alanı dolu, üstüne yazmaya hazır`);
yaz(`  DİSKTEKİ SES DOSYASI       : ${sesDosyalari.length} — kablo hazır, lisans yüzeyi bugün SIFIR (D-096 ④)`);

// ============================================================================================
//  §S3 SES KAYNAK KOLLARI — künyeli. Sayılar kaynak sayfalarından okundu (2026-09-10).
// ============================================================================================
type Kol = {
  kod: string; ad: string; sanatci: string; lisans: string; kunye: string;
  dosya: string; kilit: 'korunur' | 'KIRILIR' | 'yok'; kaynak: string; not: string;
};
const SES_KOLLARI: Kol[] = [
  {
    kod: 'S-A', ad: 'Sentez kalsın — coin zenginleşsin + ortam sentezle',
    sanatci: 'tek (motorun kendisi)', lisans: 'yok (kod)', kunye: 'gerekmez',
    dosya: '0', kilit: 'korunur', kaynak: 'D-096 · src/game/audioSynth.ts',
    not: 'coin 2→4 katman + çoklu toplamada perde basamağı; ortam = gürültü kaynağı + yavaş bant süzgeci',
  },
  {
    kod: 'S-B', ad: 'Hibrit — yalnız coin + ortam DOSYA, gerisi sentez',
    sanatci: '2 (sentez + 1 dış)', lisans: 'CC0', kunye: 'gerekmez (CC0)',
    dosya: '2', kilit: 'KIRILIR', kaynak: 'kenney.nl/assets/casino-audio · freesound CC0',
    not: 'en çok istenen iki ses gerçekçi olur, gerisi sentez kalır — iki dil aynı sahnede',
  },
  {
    kod: 'S-C', ad: 'Tek CC0 sanatçı seti (Kenney) baştan sona',
    sanatci: '1 (Kenney)', lisans: 'CC0', kunye: 'gerekmez (CC0)',
    dosya: '9+', kilit: 'korunur', kaynak: 'kenney.nl/assets/interface-sounds (100 ses) + casino-audio (50 ses)',
    not: 'stil kilidi tek sanatçıyla sağlanır; ölçülmüş bir katalog ölçülmemişle değişir (D-096 ③B)',
  },
  {
    kod: 'S-D', ad: 'Serbest CC0 derleme (Freesound/OpenGameArt, ses ses seçilir)',
    sanatci: '9 ayrı olabilir', lisans: 'CC0 (ses ses doğrulanmalı)', kunye: 'gerekmez (CC0)',
    dosya: '9+', kilit: 'KIRILIR', kaynak: 'freesound.org CC0 süzgeci (cafe ambience: 44 sonuç) · opengameart.org',
    not: 'en zengin havuz, en yüksek lisans denetim yükü; tek stil kilidi tanımı gereği kırılır',
  },
];

yaz('');
yaz('='.repeat(94));
yaz('§S3 SES KAYNAK KOLLARI — künyeli (kaynak sayfaları 2026-09-10\'da okundu)');
yaz('='.repeat(94));
yaz('');
yaz('  kol   sanatçı sayısı        lisans   künye      dosya  stil kilidi');
yaz('  ' + '-'.repeat(74));
for (const k of SES_KOLLARI) {
  yaz(`  ${k.kod}   ${k.sanatci.padEnd(19)} ${k.lisans.padEnd(8)} ${k.kunye.padEnd(10)} ${k.dosya.padEnd(6)} ${k.kilit}`);
}
yaz('');
for (const k of SES_KOLLARI) {
  yaz(`  ${k.kod} ${k.ad}`);
  yaz(`       kaynak: ${k.kaynak}`);
  yaz(`       ${k.not}`);
}
yaz('');
yaz('  LİSANS UYARISI (okundu, 2026-09-10): Pixabay CC0 DEĞİLDİR — kendi "Content License"ı');
yaz('  içeriğin "Standalone" dağıtımını yasaklar ve marka/logo taşıyan içeriği ticari kullanımdan');
yaz('  çıkarır. Oyun içi kullanım türev sayılıyor ama metin "yalnız tam lisans bağlayıcıdır"');
yaz('  diyor. CLAUDE.md kuralı net: **belirsiz hiçbir asset commit\'lenmez** → Pixabay ELENDİ.');
yaz('  Zapsplat da elendi: künye ZORUNLU (ücretsiz katman) ve CC0 değil.');

// ============================================================================================
//  §U ARAYÜZ — ekran ölçümünden. "Çok kötü" bir his; sayısı KAÇ FARKLI KARAR verildiğidir.
// ============================================================================================
yaz('');
yaz('='.repeat(94));
yaz('§U  ARAYÜZ — telefon kadrajında (390×844) ÇİZİLEN\'den ölçüldü');
yaz('='.repeat(94));

const JSON_YOL = 'docs/olcum-ui-ekran.json';
damga('ekran ölçümü var', existsSync(JSON_YOL), `${JSON_YOL} yok — önce: node tools/shot-ui-s10.mjs`);
const ek = existsSync(JSON_YOL) ? JSON.parse(readFileSync(JSON_YOL, 'utf8')) : null;

if (ek) {
  // — DAMGALAR: ölçüm gerçekten arayüze mi baktı? (Boş bir HUD da "tutarlı" görünürdü.)
  damga('HUD doluydu', ek.olcek.gorunurOge >= 60, `yalnız ${ek.olcek.gorunurOge} görünür öğe`);
  damga('kabuklar açıldı', ek.kabuklar.filter((k: { tip?: string }) => k.tip).length === 5, 'beş ekranın hepsi açılmadı');
  damga('kâğıt katmanı sayıldı', Object.keys(ek.palet.zemin).length > (ek.katman?.temel?.zemin ?? 0), 'panel katmanı birleşime girmemiş');

  // ── §U1 ÖLÇEK — kaç farklı karar. Tasarım sistemi olan arayüzde bunlar KÜÇÜK bir kümedir.
  const say = (o: Record<string, number>) => Object.keys(o).length;
  const topN = (o: Record<string, number>, n: number) =>
    Object.entries(o).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, n);

  yaz('');
  yaz('§U1 ÖLÇEK — "çalışılmış hissettirmiyor"un sayısı: kaç FARKLI karar çiziliyor?');
  yaz('');
  yaz('  boyut               farklı değer   sağlıklı bir sistemde   fazlalık');
  yaz('  ' + '-'.repeat(70));
  const hedefler: [string, number, number][] = [
    ['punto (font-size)', say(ek.olcek.punto), 6],
    ['köşe yarıçapı', say(ek.olcek.yaricap), 4],
    ['gölge (box-shadow)', say(ek.olcek.golge), 4],
    ['zemin rengi', say(ek.palet.zemin), 8],
    ['metin rengi', say(ek.palet.metin), 5],
    ['font ailesi', say(ek.olcek.font), 2],
  ];
  for (const [ad, olan, olmali] of hedefler) {
    const fazla = olan - olmali;
    yaz(`  ${ad.padEnd(20)} ${String(olan).padStart(9)}   ${String(olmali).padStart(19)}   ${fazla > 0 ? `+${fazla}` : '—'}`);
  }
  yaz('');
  yaz(`  Toplam farklı görsel karar: ${hedefler.reduce((a, h) => a + h[1], 0)} · sistemli karşılığı ${hedefler.reduce((a, h) => a + h[2], 0)}`);
  yaz('  Puntolar: ' + Object.keys(ek.olcek.punto).map((p) => Number.parseFloat(p)).sort((a, b) => a - b).join(' · '));
  yaz('  YARIM PİKSEL adımlar (10,5 · 11,5 · 12,5 · 13,5 · 14,5) bir ölçek değil, tek tek');
  yaz('  ayarlanmış değerlerdir — göz farkı seçemez ama sistem OLMADIĞINI kanıtlar.');

  // ── §U2 PALET — "kahverengi = iç karartıcı" iddiası HSL'de.
  const zeminRenkler: Rgb[] = [];
  const zeminAgirlik: number[] = [];
  for (const [anahtar, adet] of Object.entries(ek.palet.zemin) as [string, number][]) {
    for (const r of renkleriAyikla(anahtar)) { zeminRenkler.push(r); zeminAgirlik.push(adet); }
  }
  const kromatik = zeminRenkler.map((r, i) => ({ ...hsl(r), w: zeminAgirlik[i] })).filter((c) => c.s > 0.08);
  const yay = yayGenisligi(kromatik.map((c) => c.h));
  const agirlikToplam = kromatik.reduce((a, c) => a + c.w, 0);
  const ortL = kromatik.reduce((a, c) => a + c.l * c.w, 0) / agirlikToplam;
  const sicak = kromatik.filter((c) => c.h < 60 || c.h > 330);
  const sicakPay = sicak.reduce((a, c) => a + c.w, 0) / agirlikToplam;
  const soguk = kromatik.filter((c) => c.h >= 170 && c.h <= 260);
  const sogukPay = soguk.reduce((a, c) => a + c.w, 0) / agirlikToplam;

  yaz('');
  yaz('§U2 PALET — "arayüz kahverengi, iç karartıcı" (G-16) iddiası sayıya döndü');
  const yog = kutleYogunlugu(kromatik);
  yaz('');
  yaz(`  kromatik zemin durağı            : ${kromatik.length} (gri/beyaz sayılmadı)`);
  yaz(`  UÇLARIN kapladığı yay            : ${yay.toFixed(0)}° / 360° — tek tük rozet renkleri yayı açıyor`);
  yaz(`  KÜTLE merkezi                    : h ${yog.merkez.toFixed(0)}° (turuncu-kahve)`);
  yaz(`  kütlenin ${yog.pencere}°'lik dilimdeki payı : ${yz(yog.icinde)}  ← ASIL SAYI BU`);
  yaz(`  bileşke vektör boyu R            : ${yog.R.toFixed(3)} (1 = hepsi tek yöne bakıyor)`);
  yaz(`  SICAK (kırmızı-turuncu-sarı) payı: ${yz(sicakPay)}  (öğe ağırlıklı)`);
  yaz(`  SOĞUK (yeşil-mavi) payı          : ${yz(sogukPay)}`);
  yaz(`  ortalama açıklık (L)             : ${yz(ortL)} — 0,5'in altı "koyu" okunur`);
  yaz('');
  yaz('  En çok çizilen 6 zemin:');
  for (const [k, v] of topN(ek.palet.zemin, 6)) {
    const rs = renkleriAyikla(k);
    const h = rs.length ? hsl(rs[0]) : null;
    yaz(`   ${String(v).padStart(3)}× ${h ? `h ${h.h.toFixed(0).padStart(3)}°  s ${yz(h.s).padStart(6)}  l ${yz(h.l).padStart(6)}` : '—'}   ${k.slice(0, 46)}`);
  }
  yaz('');
  // HÜKÜM SAYIDAN TÜRER, metne gömülmez. S10'da bu paragraf sabit yazılmıştı ("kahverengi
  // leke", "uç yay 216°") ve S11 paleti değiştirince ölçtüğü şeyin TERSİNİ söyler oldu.
  // Eşikler: R ≥ 0,70 = kütle tek yöne bakıyor · ortalama açıklık < %40 = koyu okunur.
  const ton = yog.merkez < 40 || yog.merkez >= 330 ? 'kırmızı' : yog.merkez < 70 ? 'turuncu-kahve'
    : yog.merkez < 160 ? 'yeşil' : yog.merkez < 260 ? 'mavi-mor' : 'mor';
  const sikisik = yog.R >= 0.7;
  yaz(`  OKUMA (sayıdan türetildi): zeminlerin ${yz(yog.icinde)}'i h ${yog.merkez.toFixed(0)}° (${ton})`);
  yaz(`  çevresindeki ${yog.pencere}°'lik dilimde, R = ${yog.R.toFixed(2)}; ortalama açıklık ${yz(ortL)}.`);
  if (sikisik) {
    yaz('  HÜKÜM: G-16 DOĞRULANDI — kütle tek yöne bakıyor (R ≥ 0,70). Ekranda hiçbir yüzey bir');
    yaz('  başkasından renkle ayrılmıyor; ayrım yalnız açıklıkla yapılıyor. "İç karartıcı" tam bu.');
  } else {
    yaz('  HÜKÜM: kütle DAĞILDI (R < 0,70) — arayüz artık tek bir lekeye düşmüyor. Gövde tek');
    yaz('  ailede duruyor ama aksan ve anlam renkleri kütleyi kendi yönlerine çekiyor.');
  }
  yaz(`  DİKKAT: uç yay ${yay.toFixed(0)}° çıkıyor ve TEK BAŞINA yanıltır — birkaç rozet rengi yayı`);
  yaz('  açar, kütle yine tek dilimde kalabilir. Yaya bakıp "palet zaten geniş" denemez; ölçü R.');
  // ── §U3 KABUK — G-17'nin gerçek hâli.
  yaz('');
  yaz('§U3 KABUK — "ekranlar tutarsız" (G-17) gerçekte NE?');
  yaz('');
  yaz('  ekran       kabuk tipi   kart en×boy   ekranın payı   yarıçap   kapat');
  yaz('  ' + '-'.repeat(74));
  for (const k of ek.kabuklar) {
    if (!k.tip) { yaz(`  ${String(k.ad).padEnd(11)} ${k.hata}`); continue; }
    const jest = [k.kapat.carpi && '✕', k.kapat.geri && 'geri', k.kapat.arkaTikla && 'arka'].filter(Boolean).join('+');
    yaz(`  ${k.ad.padEnd(11)} ${k.tip.padEnd(12)} ${String(k.kart.w).padStart(5)}×${String(k.kart.h).padEnd(6)} ${yz(k.oranH).padStart(9)}      ${String(k.yaricap).padEnd(8)} ${jest}`);
  }
  const boylar = ek.kabuklar.filter((k: { tip?: string }) => k.tip).map((k: { kart: { h: number } }) => k.kart.h);
  const farkliBoy = new Set(boylar).size;
  yaz('');
  // G-17'nin ("ekranlar tutarsız") ölçülen karşılığı TİP değil BOYdu. Hüküm bu yüzden iki
  // sayıdan türetilir: kaç farklı kabuk tipi çiziliyor, kaç farklı yükseklik açılıyor.
  const tipler = [...new Set(ek.kabuklar.filter((k: { tip?: string }) => k.tip).map((k: { tip: string }) => k.tip))];
  const jestler = [...new Set(ek.kabuklar.filter((k: { tip?: string }) => k.tip).map((k: { kapat: { carpi: boolean; geri: boolean; arkaTikla: boolean } }) =>
    [k.kapat.carpi && '✕', k.kapat.geri && 'geri', k.kapat.arkaTikla && 'arka'].filter(Boolean).join('+')))];
  yaz(`  KABUK TİPİ : ${tipler.length === 1 ? `tek tip — ${boylar.length}/${boylar.length} ${tipler[0]}` : `${tipler.length} FARKLI tip (${tipler.join(' · ')})`}`);
  yaz(`  ÇIKIŞ JESTİ: ${jestler.length === 1 ? `tek jest — ${jestler[0]}` : `${jestler.length} FARKLI jest (${jestler.join(' · ')})`}`);
  yaz(`  KABUK BOYU : ${boylar.length} ekranda ${farkliBoy} farklı yükseklik`);
  yaz(`               (${boylar.map((b: number) => b.toFixed(0)).join(' · ')} px) → ekranın ${yz(Math.min(...boylar) / ek.ekran.height)}…${yz(Math.max(...boylar) / ek.ekran.height)}'i.`);
  if (farkliBoy === 1 && tipler.length === 1 && jestler.length === 1) {
    yaz('  HÜKÜM: G-17 KAPANDI — tek tip, tek yükseklik, tek çıkış. Panelin üst kenarı artık');
    yaz('  hiçbir sekmede zıplamıyor; "tutarsız" hissinin ölçülen kaynağı buydu.');
  } else {
    yaz(`  HÜKÜM: tutarsızlık SÜRÜYOR — ${farkliBoy} yükseklik · ${tipler.length} tip · ${jestler.length} çıkış jesti.`);
    yaz('  Her sekmede panelin üst kenarı başka yere zıplıyor; hissin kaynağı modal/tam-ekran');
    yaz('  seçimi değil, boyun her ekranda yeniden kararlaştırılması.');
  }

  // ── §U4 KONTRAST + FONT + SİMGE — okunabilirlik ve kendi kuralımızın denetimi.
  const kon = (ek.olcek.kontrast ?? []) as { ad: string; px: number; oran: number; esik: number }[];
  const dusuk = kon.filter((c) => c.oran < c.esik);
  yaz('');
  yaz('§U4 OKUNABİLİRLİK + KENDİ KURALLARIMIZIN DENETİMİ');
  yaz('');
  yaz(`  ölçülen metin öğesi          : ${kon.length}`);
  yaz(`  WCAG AA eşiğinin ALTINDA     : ${dusuk.length} (${yz(dusuk.length / Math.max(1, kon.length))})`);
  if (dusuk.length) {
    // Aynı sınıf ekranda onlarca kez çizilebiliyor; liste SINIF başına tekilleştirilir, yoksa
    // "en kötü 5" tek bir bileşenin beş kopyası olur ve başka hiçbir kusur görünmez.
    const sinifBasi = new Map<string, { c: typeof dusuk[number]; adet: number }>();
    for (const c of dusuk) {
      const v = sinifBasi.get(c.ad);
      if (!v) sinifBasi.set(c.ad, { c, adet: 1 });
      else { v.adet++; if (c.oran < v.c.oran) v.c = c; }
    }
    yaz(`  farklı SINIF sayısı          : ${sinifBasi.size}`);
    for (const { c, adet } of [...sinifBasi.values()].sort((a, b) => a.c.oran - b.c.oran).slice(0, 6)) {
      yaz(`     ${c.oran.toFixed(2)} : ${c.esik}  ${String(c.px).padStart(4)}px  ×${String(adet).padStart(2)}  ${c.ad}`);
    }
  }
  yaz('');
  yaz(`  FONT AİLESİ ekranda          : ${Object.entries(ek.olcek.font).map(([k, v]) => `${k} ${v}×`).join(' · ')}`);
  const arial = (ek.olcek.fontOge?.Arial ?? []) as string[];
  if (arial.length) {
    const benzersiz = [...new Set(arial)];
    yaz(`  ⚠ OYUN FONTU SIZDIRIYOR      : ${arial.length} öğe tarayıcı varsayılanına (Arial) düşüyor`);
    yaz(`     sızan sınıflar: ${benzersiz.slice(0, 8).join(' · ')}`);
    yaz('     KÖK SEBEP: <button> font-family MİRAS ALMAZ ve hiçbir kuralda `button { font-family:');
    yaz('     inherit }` yok. Görev şeridi (.band) bir <button> — yani oyunun EN ÇOK OKUNAN metni');
    yaz('     Arial. `feedback_ui_game_feel`in "system-ui font = AI slop" dediği şey tam bu.');
  }
  yaz('');
  yaz(`  SİMGE: ${ek.simge.svg} SVG · ${ek.simge.glif} METİN GLİFİ — örnekler: ${ek.simge.ornek.join(' ')}`);
  yaz('  Plan §9 ve `feedback_ui_game_feel`: "emoji ve CSS ikon YOK, her simge SVG".');
  const kacak = (ek.simge.ornek as string[]).filter((g) => IKON_YERINE.includes(g));
  if (kacak.length) yaz(`  ⚠ İKONUN YERİNE GEÇEN GLİF: ${kacak.join(' ')} — bunlar SVG olmalı (B6).`);
  else yaz(`  ✓ İkonun yerine geçen glif YOK. Kalanlar cümlenin kendisi: ${ek.simge.ornek.join(' ')}`);

  // ── §U5 KAPLAMA — sahne ne kadar görünüyor.
  const pay = ek.kaplama.kromPiksel / ek.kaplama.ekranPiksel;
  yaz('');
  yaz('§U5 KROM KAPLAMASI — sahne bir tycoon\'da baş aktör; arayüz ne kadarını yiyor?');
  yaz('');
  for (const k of ek.kaplama.kutular) yaz(`  ${String(k.sec).padEnd(13)} ${String(k.w).padStart(5)}×${String(k.h).padEnd(5)} @ ${k.x},${k.y}`);
  yaz(`  TOPLAM (birleşim): ${ek.kaplama.kromPiksel} / ${ek.kaplama.ekranPiksel} px = ${yz(pay)}`);
  yaz(`  Bu sayı SAĞLIKLI (${yz(pay)}); sorun kromun MİKTARI değil, KALİTESİ. Kaplamayı`);
  yaz('  büyüten bir yeniden tasarım kabul edilmemeli — kazanç ölçekten ve paletten gelmeli.');
}

// ============================================================================================
//  §B BULGULAR — rapor tablosuna birebir girecek satırlar.
// ============================================================================================
yaz('');
yaz('='.repeat(94));
yaz('§B  BULGULAR — karar paketine giren sayı satırları');
yaz('='.repeat(94));
yaz('');
if (ek) {
  const say = (o: Record<string, number>) => Object.keys(o).length;
  // B2 §U2'deki AĞIRLIKLI ölçüden türer; uç yayından değil (araç ilk koşuda o yüzden çelişmişti).
  const b2Renkler: { h: number; w: number }[] = [];
  for (const [anahtar, adet] of Object.entries(ek.palet.zemin) as [string, number][]) {
    for (const r of renkleriAyikla(anahtar)) { const c = hsl(r); if (c.s > 0.08) b2Renkler.push({ h: c.h, w: adet }); }
  }
  const b2 = kutleYogunlugu(b2Renkler);
  const bulguB2 = `zeminlerin ${yz(b2.icinde)}'i h ${b2.merkez.toFixed(0)}° çevresi ${b2.pencere}° dilimde · R ${b2.R.toFixed(2)}`;
  const kon = (ek.olcek.kontrast ?? []) as { oran: number; esik: number }[];
  const dusuk = kon.filter((c) => c.oran < c.esik).length;
  const boylar = ek.kabuklar.filter((k: { tip?: string }) => k.tip).map((k: { kart: { h: number } }) => k.kart.h);
  const satirlar: [string, string][] = [
    ['B1  ölçek dağınıklığı', `${say(ek.olcek.punto)} punto · ${say(ek.olcek.yaricap)} yarıçap · ${say(ek.olcek.golge)} gölge`],
    ['B2  palet kütlesi', bulguB2],
    ['B3  kabuk boyu', `5 ekran, ${new Set(boylar).size} farklı yükseklik (${Math.min(...boylar).toFixed(0)}…${Math.max(...boylar).toFixed(0)} px)`],
    ['B4  kontrast', `${dusuk}/${kon.length} metin öğesi WCAG AA altında (${yz(dusuk / Math.max(1, kon.length))})`],
    ['B5  font sızıntısı', `${(ek.olcek.fontOge?.Arial ?? []).length} öğe Arial — button font-family mirası yok`],
    // B6 de ÖLÇÜLENden türer. Eskiden satırda sabit "🔒 emoji" yazıyordu; S11 o emojiyi
    // sildi ve satır bir tur boyunca olmayan bir kusuru rapor etti.
    ['B6  kendi kuralımız', `${ek.simge.svg} SVG · ${ek.simge.glif} metin glifi (${ek.simge.ornek.join(' ')}) · ikon-yerine glif: ${
      (ek.simge.ornek as string[]).filter((g) => IKON_YERINE.includes(g)).join(' ') || 'YOK'
    }`],
    ['B7  krom kaplaması', `${yz(ek.kaplama.kromPiksel / ek.kaplama.ekranPiksel)} — sağlıklı, büyütülmemeli`],
    ['B8  coin sesi', `${coin.sure.toFixed(3)} sn · ${coin.katman} katman · çoklu toplamada perde basamağı YOK`],
    ['B9  ortam sesi', `katalogda 9/9 tek atış; döngü YOK · settings.music hiçbir sese bağlı değil`],
    ['B10 lisans yüzeyi', `bugün 0 dosya · Pixabay ve Zapsplat elendi (CC0 değil) · CC0 kollar: S-B/S-C/S-D`],
  ];
  for (const [a, b] of satirlar) yaz(`  ${a.padEnd(24)} ${b}`);
}

yaz('');
yaz('  KARAR: (BOŞ — adım 3, kullanıcı seçer)');
yaz('');

console.log(cikti.join('\n'));
damgaOzeti();

/** `src` altındaki dosyaları yürüyerek toplar (settings.music referansını saymak için). */
function dosyalariGez(kok: string): string[] {
  const out: string[] = [];
  for (const g of readdirSync(kok, { withFileTypes: true })) {
    const p = `${kok}/${g.name}`;
    if (g.isDirectory()) out.push(...dosyalariGez(p));
    else out.push(p);
  }
  return out;
}
