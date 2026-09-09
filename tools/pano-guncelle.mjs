/**
 * pano-guncelle.mjs — İLERLEME PANOSUNUN SAYILARI `progress.md`'DEN TÜRETİLİR (D-084 P3).
 *
 * NEDEN: pano `docs/pano/ilerleme-panosu.html` kapanışta ELLE güncelleniyordu (altı ayrı yer:
 * faz sayacı, toplam sayaç, özet, sıradaki, günlük kartı, tarih). Altı elle adımın her biri
 * sessizce kayabilir — ve kaydı: bu araç ilk koşusunda üç gerçek sapma buldu.
 *
 * İKİ İŞİ VAR — ve ikincisi daha önemli:
 *   1) TÜRETME  — sayıları `memory-bank/progress.md` tablosundan alıp panonun JSON bloğuna yazar.
 *                 Anlatıya (özet · sıradaki · günlük kartları · faz açıklamaları) DOKUNMAZ:
 *                 onlar türetilebilir değil, elle yazılır.
 *   2) DENETİM  — defterin KENDİ İÇ TUTARLILIĞINI sınar. Aynı sayı progress.md'de üç yerde
 *                 duruyor (bütçe satırı · pano tablosu · faz başlığı) ve dördüncü bir yerden
 *                 türetilebiliyor (faz altındaki kalem listesi). Dördü birbirini tutmuyorsa
 *                 yazma YAPILMAZ, çıkış kodu 1 olur.
 *
 * Tek doğru kaynak `progress.md` tablosudur; pano onun TÜREVİDİR. Bu yüzden araç panoyu
 * progress'ten yazar, tersini asla yapmaz.
 *
 * KULLANIM
 *   node tools/pano-guncelle.mjs              # denetle + yaz
 *   node tools/pano-guncelle.mjs --kontrol    # yalnız denetle (yazma yok) — kapanış adımı
 *   node tools/pano-guncelle.mjs --simdi=C    # "şu an buradayız" işaretini C fazına al
 *   node tools/pano-guncelle.mjs --tarih=09.09.2026
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Türkçe büyük harf sınıfı: `İA` gibi bir faz kodu [A-Z] ile eşleşmez.
const HARF = 'A-ZÇĞİÖŞÜ';
const PAY = /(\d+)\s*\/\s*(\d+)/;
const DURUM_IM = /[✅🔧⏳]/u;

// ---------------------------------------------------------------------------
// 1. OKUMA — progress.md'nin dört sayı yeri
// ---------------------------------------------------------------------------

/**
 * `progress.md` metnini dört ayrı yerden okur. Hiçbirini diğerinden türetmez — denetimin
 * anlamı zaten dördünü BAĞIMSIZ okuyup karşılaştırmak.
 */
export function progressOku(metin) {
  const satirlar = metin.split(/\r?\n/);
  const p = {
    butce: null,            // "Oturum bütçesi (TOPLAM n · YAPILAN m · %y)"
    kurulus: null,          // tablonun Kuruluş satırı (yedi fazın toplamı, tek satır)
    program: [],            // tablonun yayın programı satırları (faz faz)
    programToplam: null,    // tablonun "Program toplam" satırı
    basliklar: {},          // "## Faz C — ... (4/5)" başlıkları
    kalemler: {},           // faz başlığı altındaki "- ✅ **C1 — ..." kalemleri
  };

  const b = metin.match(/\*\*Oturum bütçesi \(TOPLAM (\d+) · YAPILAN (\d+) · %(\d+)\)/);
  if (b) p.butce = { toplam: +b[1], yapilan: +b[2], yuzde: +b[3] };

  // --- pano tablosu
  let donem = '';
  for (const ham of satirlar) {
    const s = ham.trim();
    if (!s.startsWith('|')) continue;
    const h = s.split('|').slice(1, -1).map((x) => x.trim());
    if (h.length < 3) continue;
    if (h.every((x) => /^:?-{2,}:?$/.test(x))) continue;   // |---|---|---|
    const m = h[2].match(PAY);
    if (!m) continue;                                       // başlık satırı
    const sayi = { yapilan: +m[1], toplam: +m[2] };
    const im = (h[2].match(DURUM_IM) || [''])[0];

    if (h[0].includes('Program toplam')) { p.programToplam = sayi; continue; }
    if (h[0]) donem = h[0];

    const ad = h[1].replace(/\*\*/g, '').trim();
    if (donem.startsWith('Kuruluş')) {
      // Kuruluş yedi fazı TEK satırda toplar: "F0 planlama · F1 greybox · ..."
      p.kurulus = { ...sayi, kodlar: ad.split('·').map((x) => x.trim().split(/\s+/)[0]).filter(Boolean) };
      continue;
    }
    p.program.push({ kod: ad.split(/\s+/)[0], ad, ...sayi, im, aktif: h[1].includes('**') });
  }

  // --- faz başlıkları + altlarındaki kalemler
  const basRe = new RegExp(`^## Faz ([${HARF}]+\\d*) — .*?\\((\\d+)\\/(\\d+)\\)`, 'u');
  const kalemRe = new RegExp(`^- (${DURUM_IM.source}) \\*\\*([${HARF}]+)(\\d+) `, 'u');
  let acik = null;
  for (const s of satirlar) {
    const hm = s.match(basRe);
    if (hm) { acik = hm[1]; p.basliklar[acik] = { yapilan: +hm[2], toplam: +hm[3] }; p.kalemler[acik] = []; continue; }
    if (s.startsWith('## ')) { acik = null; continue; }
    if (!acik) continue;
    const km = s.match(kalemRe);
    if (km) p.kalemler[acik].push({ im: km[1], onEk: km[2], no: +km[3] });
  }

  // Kalem ön eki faz koduyla aynı olmak zorunda değil (Faz İA'nın kalemleri P1..P3) ama bir
  // fazın altında TEK ön ek olmalı — karışıksa hangisinin sayıldığı belirsizleşir, o yüzden
  // sessizce seçmek yerine hata verilir (denetle · E4). "D-079" gibi alt karar satırları
  // `- ✅ **D-079 —` biçiminde harf+sayı kalıbına uymadığı için zaten kalem sayılmaz.
  for (const [kod, liste] of Object.entries(p.kalemler)) {
    const onEkler = [...new Set(liste.map((k) => k.onEk))];
    p.kalemler[kod] = { onEk: onEkler[0] ?? null, onEkler, liste };
  }
  return p;
}

/** Panonun `<script id="durum">` JSON bloğunu ayıklar.
 *  SATIR SONUNDAN BAĞIMSIZ (D8): regex önce yalnız LF kabul ediyordu ve araç CRLF görünce
 *  "JSON bloğu bulunamadı" deyip panoyu yazmıyordu. Bu İKİ kez oldu ve ikisinde de sebep
 *  dosyanın içeriği değildi: depoda `core.autocrlf=true` açık, yani **her `git checkout`**
 *  tuzağı yeniden kuruyor. Çözüm dosyayı elle LF'e çevirmek değil, aracın umursamaması. */
export function panoOku(html) {
  const m = html.match(/(<script type="application\/json" id="durum">\r?\n)([\s\S]*?)(\r?\n<\/script>)/);
  if (!m) throw new Error('panoda `id="durum"` JSON bloğu bulunamadı');
  return { durum: JSON.parse(m[2]), ham: m[2], onEk: m[1], sonEk: m[3] };
}

// ---------------------------------------------------------------------------
// 2. DENETİM — dört yer birbirini tutuyor mu?
// ---------------------------------------------------------------------------

/** Hata → yazma yapılmaz, çıkış 1. Uyarı → yazılır ama söylenir. */
export function denetle(p, durum) {
  const hatalar = [];
  const uyarilar = [];
  const H = (k, s) => hatalar.push(`${k}: ${s}`);

  if (!p.butce) return { hatalar: ['A1: "Oturum bütçesi (TOPLAM n · YAPILAN m · %y)" satırı okunamadı'], uyarilar };
  if (!p.kurulus) H('A2', 'tablonun Kuruluş satırı okunamadı');
  if (!p.programToplam) H('A3', 'tablonun "Program toplam" satırı okunamadı');
  if (!p.program.length) H('A4', 'tabloda yayın programı fazı yok');
  if (hatalar.length) return { hatalar, uyarilar };

  // B — faz satırının kendi içi
  for (const f of p.program) {
    if (f.yapilan > f.toplam) H('B1', `${f.kod}: yapılan ${f.yapilan} > toplam ${f.toplam}`);
    const beklenen = f.yapilan === 0 ? '⏳' : f.yapilan === f.toplam ? '✅' : '🔧';
    if (f.im && f.im !== beklenen) uyarilar.push(`${f.kod} tablo imi ${f.im}, sayıya göre ${beklenen} olmalı`);
  }

  // C — tablo kendi toplamını tutuyor mu
  const top = (xs, a) => xs.reduce((t, x) => t + x[a], 0);
  const pY = top(p.program, 'yapilan');
  const pT = top(p.program, 'toplam');
  if (pY !== p.programToplam.yapilan || pT !== p.programToplam.toplam) {
    H('C1', `faz satırlarının toplamı ${pY}/${pT}, "Program toplam" satırı ${p.programToplam.yapilan}/${p.programToplam.toplam}`);
  }
  const gY = p.kurulus.yapilan + p.programToplam.yapilan;
  const gT = p.kurulus.toplam + p.programToplam.toplam;
  if (gY !== p.butce.yapilan || gT !== p.butce.toplam) {
    H('C2', `Kuruluş + Program = ${gY}/${gT}, bütçe satırı ${p.butce.yapilan}/${p.butce.toplam}`);
  }
  const yuzde = Math.round((100 * p.butce.yapilan) / p.butce.toplam);
  if (yuzde !== p.butce.yuzde) H('C3', `bütçe satırındaki %${p.butce.yuzde}, sayıya göre %${yuzde} olmalı`);

  // D — faz BAŞLIĞI tabloyla aynı mı (aynı sayının ikinci yazıldığı yer)
  for (const [kod, bas] of Object.entries(p.basliklar)) {
    const f = p.program.find((x) => x.kod === kod);
    if (!f) { H('D1', `"## Faz ${kod}" başlığı var ama tabloda böyle bir faz yok`); continue; }
    if (bas.yapilan !== f.yapilan || bas.toplam !== f.toplam) {
      H('D2', `Faz ${kod}: başlık (${bas.yapilan}/${bas.toplam}) ≠ tablo (${f.yapilan}/${f.toplam})`);
    }
  }

  // E — faz altındaki KALEM listesi (sayının TÜRETİLEBİLDİĞİ tek yer) başlığı tutuyor mu
  for (const [kod, k] of Object.entries(p.kalemler)) {
    const f = p.program.find((x) => x.kod === kod);
    if (!f || !k.liste.length) continue;
    const biten = k.liste.filter((x) => x.im === '✅').length;
    const dokum = k.liste.map((x) => k.onEk + x.no + x.im).join(' ');
    if (biten !== f.yapilan) H('E1', `Faz ${kod}: ✅ kalem sayısı ${biten} ≠ tablo yapılan ${f.yapilan} (${dokum})`);
    if (k.liste.length !== f.toplam) H('E2', `Faz ${kod}: kalem sayısı ${k.liste.length} ≠ tablo toplam ${f.toplam} (${dokum})`);
    const nolar = k.liste.map((x) => x.no).sort((a, b) => a - b);
    if (nolar.join(',') !== nolar.map((_, i) => i + 1).join(',')) {
      H('E3', `Faz ${kod}: kalem numaraları 1..${nolar.length} değil (${k.onEk}${nolar.join(', ' + k.onEk)})`);
    }
    if (k.onEkler.length > 1) {
      H('E4', `Faz ${kod}: kalemler tek ön ek taşımalı, ${k.onEkler.length} tane var (${k.onEkler.join(', ')}) — hangisinin sayıldığı belirsiz`);
    }
  }

  // F — pano ile tablo aynı fazlardan mı söz ediyor
  const dKurulus = durum.donemler[0].fazlar;
  const dProgram = durum.donemler[1].fazlar;
  const kSet = dKurulus.map((f) => f.k).join(',');
  if (kSet !== p.kurulus.kodlar.join(',')) H('F1', `Kuruluş fazları pano [${kSet}] ≠ tablo [${p.kurulus.kodlar.join(',')}]`);
  const kY = top(dKurulus, 'yapilan');
  const kT = top(dKurulus, 'toplam');
  if (kY !== p.kurulus.yapilan || kT !== p.kurulus.toplam) {
    H('F2', `panodaki Kuruluş fazları ${kY}/${kT}, tablo satırı ${p.kurulus.yapilan}/${p.kurulus.toplam}`);
  }
  const pSet = dProgram.map((f) => f.k).join(',');
  const tSet = p.program.map((f) => f.kod).join(',');
  if (pSet !== tSet) H('F3', `program fazları pano [${pSet}] ≠ tablo [${tSet}] — pano fazı elle eklenir, sayısı türetilir`);

  return { hatalar, uyarilar };
}

// ---------------------------------------------------------------------------
// 3. YAZMA — yalnız sayılar; anlatıya dokunulmaz
// ---------------------------------------------------------------------------

const bugun = () => {
  const d = new Date();
  const iki = (n) => String(n).padStart(2, '0');
  return `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** Panonun JSON nesnesini progress'ten türetilen sayılarla günceller; değişenleri döndürür. */
export function panoyaUygula(durum, p, { tarih = bugun(), simdi = null } = {}) {
  const degisen = [];
  const koy = (nesne, alan, deger, etiket) => {
    if (nesne[alan] === deger) return;
    degisen.push(`${etiket}: ${nesne[alan]} → ${deger}`);
    nesne[alan] = deger;
  };

  koy(durum, 'guncelleme', tarih, 'tarih');
  koy(durum, 'yapilan', p.butce.yapilan, 'toplam sayaç yapılan');
  koy(durum, 'toplam', p.butce.toplam, 'toplam sayaç toplam');

  for (const f of durum.donemler[1].fazlar) {
    const t = p.program.find((x) => x.kod === f.k);
    if (!t) continue;
    koy(f, 'yapilan', t.yapilan, `Faz ${f.k} yapılan`);
    koy(f, 'toplam', t.toplam, `Faz ${f.k} toplam`);
  }

  // Son kilometre taşı bütçenin sonuna oturur (73 → 76 düzeltmesinde geride kalmıştı).
  const son = durum.kilometre[durum.kilometre.length - 1];
  if (son) koy(son, 'at', p.butce.toplam, `son kilometre taşı ("${son.etiket}")`);

  if (simdi) {
    for (const f of durum.donemler.flatMap((d) => d.fazlar)) {
      if (f.k === simdi && f.durum !== 'now') { f.durum = 'now'; degisen.push(`"şu an" işareti → Faz ${simdi}`); }
      else if (f.k !== simdi && f.durum === 'now') { delete f.durum; degisen.push(`"şu an" işareti Faz ${f.k} üzerinden kaldırıldı`); }
    }
  }
  return degisen;
}

/**
 * Güncellenmiş JSON'u panonun içine geri yazar. Girinti panonun kendi biçimiyle BİREBİR aynı
 * olmalı: aksi hâlde tek sayı değişse bile 900 satırlık bir diff çıkar ve anlatının korunduğu
 * gözle görülemez. Bekçi: değişmemiş bir `durum` yazıldığında html BİREBİR aynı kalır.
 */
export function panoYaz(html, durum) {
  const { ham, onEk, sonEk } = panoOku(html);
  // JSON.stringify her zaman LF üretir; dosya CRLF ise blok da CRLF yazılır. Yoksa araç kendi
  // dosyasını KARIŞIK satır sonlu bırakır ve tek sayı değişen bir tur binlerce satırlık diff
  // gösterir (D8: okuma CRLF'e açıldı, yazma da aynı yerden geçmeli).
  const govde = JSON.stringify(durum, null, 1);
  return html.replace(onEk + ham + sonEk, onEk + (onEk.includes('\r\n') ? govde.replace(/\n/g, '\r\n') : govde) + sonEk);
}

/**
 * Dosya yazılmalı mı? İki sebep var ve İKİNCİSİ 2026-09-09'a kadar yoktu:
 *   ① veri değişti (`degisen` dolu) — asıl iş;
 *   ② veri aynı ama BAYT farklı — pano elle düzenlenip biçimi kaymış (JSON bloğunda `\uXXXX`
 *      kaçışları ile ham karakterler yan yana bulundu). Eski şart yalnız ①'e bakıyordu, bu yüzden
 *      araç "zaten güncel" diyip çıkıyor ve `panoYaz` bekçisi sessizce kırmızı kalıyordu.
 * Ayrı fonksiyon çünkü CLI'nin içinde kalsaydı test edilemezdi.
 */
export function yazmaliMi(html, hedef, degisen) {
  return degisen.length > 0 || hedef !== html;
}

/** Panonun `yapilan`'ı arttıysa o tarihe yeni bir günlük kartı da yazılmış olmalı. */
export function gunlukUyarisi(eskiYapilan, durum, tarih) {
  if (durum.yapilan <= eskiYapilan) return null;
  if (durum.gunluk?.[0]?.tarih === tarih) return null;
  return `sayaç ${eskiYapilan} → ${durum.yapilan} arttı ama ${tarih} tarihli yeni günlük kartı yok (anlatı elle yazılır)`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/pano-guncelle.mjs')) {
  const arg = (ad, vars = null) => {
    const bul = process.argv.find((a) => a.startsWith(`--${ad}=`));
    return bul ? bul.slice(ad.length + 3) : vars;
  };
  const yalnizKontrol = process.argv.includes('--kontrol');
  const progressYolu = arg('progress', 'memory-bank/progress.md');
  const panoYolu = arg('pano', 'docs/pano/ilerleme-panosu.html');
  const tarih = arg('tarih', bugun());
  const simdi = arg('simdi');

  const html = readFileSync(panoYolu, 'utf8');
  const p = progressOku(readFileSync(progressYolu, 'utf8'));
  const { durum } = panoOku(html);
  const eskiYapilan = durum.yapilan;

  const { hatalar, uyarilar } = denetle(p, durum);
  if (hatalar.length) {
    console.error(`\n!! DEFTER TUTARSIZ — ${hatalar.length} hata. Pano YAZILMADI.`);
    console.error('   (Aynı sayı üç yerde duruyor: bütçe satırı · pano tablosu · faz başlığı; dördüncüsü kalem listesinden türer.)');
    for (const h of hatalar) console.error(`   ✗ ${h}`);
    process.exit(1);
  }

  const degisen = panoyaUygula(durum, p, { tarih, simdi });
  const gu = gunlukUyarisi(eskiYapilan, durum, tarih);
  if (gu) uyarilar.push(gu);

  console.log(`Denetim temiz · ${p.butce.yapilan}/${p.butce.toplam} (%${p.butce.yuzde}) · ${p.program.length} program fazı`);
  for (const u of uyarilar) console.log(`   ⚠ ${u}`);

  // BİÇİM KAYMASI (2026-09-09): "veri değişti mi" yeterli bir yazma şartı DEĞİL. Pano elle
  // düzenlenince JSON bloğu aracın ürettiğinden farklı BİÇİMDE kalabilir (blokta 830 `\uXXXX`
  // kaçışı ile 15.020 ham karakter yan yana bulundu) — veri aynı, bayt farklı. O hâlde araç
  // "zaten güncel" deyip çıkıyor, ama `tests/pano-guncelle.test.ts`in "BİREBİR geri yazılır"
  // bekçisi kırmızı kalıyor: araç kendi dosyasını tanımıyor. Şart artık BAYT karşılaştırması.
  const hedef = panoYaz(html, durum);
  if (!yazmaliMi(html, hedef, degisen)) { console.log('Pano zaten güncel — dosya yazılmadı.'); process.exit(0); }
  for (const d of degisen) console.log(`   · ${d}`);
  if (!degisen.length) console.log('   · biçim kayması normalize edildi (veri aynı, bayt farklıydı)');

  if (yalnizKontrol) { console.log('\n--kontrol: dosya yazılmadı.'); process.exit(0); }
  writeFileSync(panoYolu, hedef, 'utf8');
  console.log(`\n${panoYolu} yazıldı. Anlatı (özet · sıradaki · günlük · faz açıklamaları) elle yazılır.`);
}
