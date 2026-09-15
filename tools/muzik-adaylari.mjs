/**
 * muzik-adaylari.mjs — ARKA PLAN MÜZİĞİ ADAY HAVUZUNU ÜRETİR (S9 · kol O5).
 *
 * NEDEN ÜRETİLİYOR, ELLE YAZILMIYOR: bundle 253 parça taşıyor ve hepsini indirip dinlemek
 * 538 MB. Paketin kendi içinde bir KÜNYE dosyası var (`song_browser`in `csv_data.js`'i) ve her
 * parçanın etiketini, süresini, enerjisini, parlaklığını, hızını, karmaşıklığını ve bestecinin
 * kendi puanını taşıyor. Eleme bu veriden yapılıyor; indirme yalnız hayatta kalanlar için.
 * (S13'ün dersinin tersi değil, DEVAMI: orada "dört sayfa okuyup hüküm verme, indir" denmişti —
 * burada indirilen paketin KENDİ verisi okunuyor, üçüncü parti bir iddia değil.)
 *
 * SÜZGEÇ ve gerekçesi — bir tycoon arka planı ne DEĞİLDİR:
 *   · `chiptune` / `spooky` DIŞARIDA — oyunun sanat yönü flat-shaded low-poly ama retro değil;
 *     8-bit bir döngü sahneyle çelişir (D-013'ün "primitive NİHAİ stildir" kararının müzikteki
 *     karşılığı: stil tutarlılığı, nostalji değil).
 *   · `acoustic` / `jazz` İÇERİDE — çalınan enstrüman, sıcak ahşap salonla aynı dili konuşuyor.
 *   · enerji 2-4 — 1 uyutur, 5 oynanışla yarışır.
 *   · besteci puanı >= 4 — paketin kendi kalite sıralaması; bizim uyduracağımız bir ölçüt değil.
 *
 * Çıktı: `indirilen-muzik/_liste.json` (ses-coz.mjs'in beklediği biçim) + ekrana eleme tablosu.
 * Kullanım: node tools/muzik-adaylari.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const KOK = 'indirilen-muzik';
const KUNYE = path.join(KOK, 'pak3/js/csv_data.js');

if (!existsSync(KUNYE)) {
  console.error(`künye yok: ${KUNYE} — song_browser paketi indirilmemiş`);
  process.exit(1);
}

const ham = readFileSync(KUNYE, 'utf8').match(/CSV_RAW = `([\s\S]*?)`/)[1].trim().split('\n');
const basliklar = ham[0].split(',').map((s) => s.trim());
const parcalar = ham.slice(1).map((satir) => {
  const h = satir.split(',');
  const o = {};
  basliklar.forEach((b, i) => { o[b] = (h[i] ?? '').trim(); });
  return o;
}).filter((p) => p.filename);

const say = (x) => parseFloat(x) || 0;

/** Tycoon arka plan profili — gerekçesi dosya başlığında. */
const uygun = parcalar.filter((p) =>
  /acoustic|jazz/.test(p.tags) &&
  !/chiptune|spooky/.test(p.tags) &&
  say(p.energy) >= 2 && say(p.energy) <= 4 &&
  say(p.speed) >= 2 && say(p.speed) <= 4 &&
  say(p.ben_score) >= 4);

// "desert" etiketli tek parça süzgece takılmasa da havuza ALINIR: mekân bir Türk kıraathanesi
// ve dokuz CC0 pakette Anadolu tınısı hiç yok (ölçüldü). Tek yakın komşu bu.
const col = parcalar.filter((p) => /desert/.test(p.tags) && !uygun.includes(p));

/** Diskte gerçekten hangi dosyalar var? Paketler ayrı klasörlere açıldı, adla eşleştirilir. */
const klasorler = readdirSync(KOK).filter((d) => {
  try { return readdirSync(path.join(KOK, d)).some((f) => f.endsWith('.ogg')); } catch { return false; }
});
const diskte = new Map();
for (const k of klasorler) {
  for (const f of readdirSync(path.join(KOK, k))) {
    if (f.endsWith('.ogg')) diskte.set(f, path.join(KOK, k, f));
  }
}

const havuz = [...uygun, ...col]
  .sort((a, b) => say(b.ben_score) - say(a.ben_score) || say(b.duration) - say(a.duration));

const liste = [];
const eksik = [];
for (const p of havuz) {
  const yol = diskte.get(p.filename);
  if (!yol) { eksik.push(p); continue; }
  liste.push({
    ad: p.song_name.replace(/[^\w.-]+/g, '_'),
    yol,
    paket: p.folder.replace(/^[Mm]usic-loop-bundle-/, ''),
    kunye: `Abstraction / Tallbeard — CC0 · ${p.tags || 'etiketsiz'} · besteci puanı ${p.ben_score}`,
    etiket: p.tags,
    sure: +say(p.duration).toFixed(1),
    enerji: say(p.energy),
    parlaklik: say(p.brightness),
    hiz: say(p.speed),
    karmasiklik: say(p.complexity),
    puan: say(p.ben_score),
  });
}

console.log(`KÜNYEDEN ELEME — bundle ${parcalar.length} parça taşıyor`);
console.log(`  profil süzgecini geçen : ${uygun.length}`);
console.log(`  "desert" istisnası     : ${col.length}`);
console.log(`  diskte bulunan         : ${liste.length}`);
console.log(`  paketi indirilmemiş    : ${eksik.length}${eksik.length ? ' — ' + [...new Set(eksik.map((p) => p.folder))].join(' · ') : ''}`);
console.log('');
console.log('ad'.padEnd(34) + 'paket'.padEnd(12) + 'sure  E P H K  puan  etiket');
for (const a of liste) {
  console.log(a.ad.padEnd(34) + a.paket.padEnd(12) +
    String(a.sure).padStart(5) + ' ' + a.enerji + ' ' + a.parlaklik + ' ' + a.hiz + ' ' + a.karmasiklik +
    '   ' + a.puan + '    ' + (a.etiket || '-'));
}

writeFileSync(path.join(KOK, '_liste.json'), JSON.stringify(liste, null, 1));
console.log(`\nyazıldı: ${KOK}/_liste.json (${liste.length} aday)`);
