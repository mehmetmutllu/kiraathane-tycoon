/**
 * olcum-ses-s17.ts — S9/S17'NİN ÜÇ KOLUNU ÖLÇER: dosya mı sentez mi (K) · seri ivmesi (İ) ·
 * ortam uğultusu (O).
 *
 * NE SORUYOR: D-106 ses kaynağını S-C'ye (tek CC0 sanatçı, Kenney) bağladı ama üç şey açık kaldı:
 *   K — hangi olayın sesi DOSYADAN gelecek? Sentez E4'te "36 çiftin 36'sı AYRI" ölçüsüyle
 *       nihai seçilmişti; hazır dosyalar aynı cetvelden geçmeden yerine konamaz.
 *   İ — seri ivmesi (art arda toplamada perde basamağı). D-106 bunu "kaynaktan bağımsız" diye
 *       ayırdı: dosya da koysak, basamak olmadan yığın hissi doğmuyor.
 *   O — ortam uğultusu. `settings.music` bugün hiçbir şeye bağlı değil (S10 · B9).
 *
 * TAKLİT YOK: aday dosyalar oyunun KENDİ çözücüsüyle (Chromium `decodeAudioData`) PCM'e çevrildi
 * (`tools/ses-coz.mjs`), sentez de `audioSynth.seslendir()`in tam tamponu. İkisi de aynı metrikten
 * geçiyor (`tools/ses-metrik.ts`) — S17'de tek kaynağa çıkarıldı, çıkarma çıktıyı değiştirmedi.
 *
 * METRİĞİN BU TURDAKİ SINIRI, açıkça: JEST kanalı (perde silinmiş karşılaştırma) KATMAN
 * tanımlıdır — bir dosyanın "katmanı" yok, transpoze edilemez. Dosyalar bu yüzden MUTLAK kanal +
 * SÜRE (JND) ile hükümlenir; jest kanalının yapısal karşılığı olarak PCM'den ölçülen iki sayı
 * basılır: spektral DÜZLÜK (gürültü mü tonal mı) ve spektral AĞIRLIK MERKEZİ (parlaklık).
 * Bu bir eksiklik değil kapsam: dosya seçimi kulağa da sorulacak (`feedback_show_dont_ask`).
 *
 * KOŞU KİPİ YOK: araç ANALİTİK (tick simülasyonu yok), deterministik, saniyeler sürer —
 * `olcum-ses-ayirt.ts` ile aynı gerekçe. Yine de `OLCUM=tam` ile alınır ki damga özeti
 * "tam" etiketi bassın (D-084: rapora yalnız tam-koşu damgalı sayı girer).
 *
 * Çalıştır:
 *   node tools/ses-coz.mjs indirilen/_liste.json indirilen/_pcm      # bir kez, PCM önbelleği
 *   OLCUM=tam npx tsx tools/olcum-ses-s17.ts > docs/olcum-ses-s17.txt
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, sesSure, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth.ts';
import {
  BANT, SURE_WEBER, YARIM_SES, etkinSure, izParmak, izParmakPcm, mesafe, rms, sessizKuyruk,
  spektrogram, tepe, transpoze,
} from './ses-metrik.ts';
import { HAVUZ, KOK, TUM_ADAYLAR } from './ses-adaylari.ts';
import { ortamYatagi, seriKarisim } from './ses-taslak.ts';
import { damga, damgaOzeti } from './olcum-lib';

const PCM_KLASOR = 'indirilen/_pcm';

/** `.f32` önbelleğinden PCM. `ses-coz.mjs` little-endian Float32 yazar. */
function pcmOku(ad: string): Float32Array {
  const b = readFileSync(path.join(PCM_KLASOR, `${ad}.f32`));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

// --- PCM tarafinin YAPISAL sayilari (jest kanalinin karsiligi degil, TAMAMLAYICISI) --------
const PENCERE = 2048;

/** Spektral DÜZLÜK (Wiener entropisi): 1'e yakın = gürültü (fiziksel), 0'a yakın = tonal. */
function duzluk(pcm: Float32Array): number {
  const n = Math.min(PENCERE, pcm.length);
  if (n < 64) return 0;
  // Sesin en gürültülü/enerjik yerini al: tepe örneğin etrafı.
  let tepeI = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]) > Math.abs(pcm[tepeI])) tepeI = i;
  const bas = Math.max(0, Math.min(pcm.length - n, tepeI - (n >> 2)));
  const guc: number[] = [];
  for (let k = 1; k < n / 2; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
      const a = (2 * Math.PI * k * i) / n;
      re += pcm[bas + i] * w * Math.cos(a);
      im -= pcm[bas + i] * w * Math.sin(a);
    }
    guc.push(re * re + im * im + 1e-12);
  }
  const geo = Math.exp(guc.reduce((a, b) => a + Math.log(b), 0) / guc.length);
  const ari = guc.reduce((a, b) => a + b, 0) / guc.length;
  return geo / ari;
}

/** Spektral AĞIRLIK MERKEZİ (Hz) — sesin "parlaklığı". */
function merkez(pcm: Float32Array): number {
  const n = Math.min(PENCERE, pcm.length);
  if (n < 64) return 0;
  let tepeI = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]) > Math.abs(pcm[tepeI])) tepeI = i;
  const bas = Math.max(0, Math.min(pcm.length - n, tepeI - (n >> 2)));
  let ust = 0;
  let alt = 0;
  for (let k = 1; k < n / 2; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
      const a = (2 * Math.PI * k * i) / n;
      re += pcm[bas + i] * w * Math.cos(a);
      im -= pcm[bas + i] * w * Math.sin(a);
    }
    const g = Math.sqrt(re * re + im * im);
    ust += g * ((k * ORNEKLEME) / n);
    alt += g;
  }
  return alt > 0 ? ust / alt : 0;
}

// ---------------------------------------------------------------------------
const IDLER = Object.keys(SES_KATALOG) as SesId[];
const kip = process.env.OLCUM === 'tam' ? 'tam' : 'kisa';

console.log('='.repeat(92));
console.log('S17 — SES ASSETLERI: dosya mi sentez mi (K) · seri ivmesi (I) · ortam ugultusu (O)');
console.log('ANALITIK ARAC · deterministik · adaylar Chromium decodeAudioData ile cozuldu (taklit yok)');
console.log('='.repeat(92));
if (kip !== 'tam') console.log('\n!! KISA KIP — bu cikti RAPORA GIRMEZ (D-084). Tam kosu: OLCUM=tam\n');

// === §1 ENVANTER ===========================================================
console.log('\n§1 ENVANTER — indirilen CC0 paketler (kenney.nl, hepsi CC0, tek sanatci = S-C)');
const paketler = existsSync(KOK)
  ? readdirSync(KOK).filter((d) => d.startsWith('kenney_') && statSync(path.join(KOK, d)).isDirectory())
  : [];
const oggListesi: string[] = [];
const tara = (d: string): void => {
  for (const g of readdirSync(d)) {
    const p = path.join(d, g);
    if (statSync(p).isDirectory()) tara(p);
    else if (g.endsWith('.ogg')) oggListesi.push(p);
  }
};
for (const p of paketler) tara(path.join(KOK, p));
console.log('paket sayisi          : ' + paketler.length + ' — ' + paketler.map((p) => p.replace('kenney_', '')).join(' · '));
console.log('toplam .ogg           : ' + oggListesi.length);
const toplamBayt = oggListesi.reduce((a, f) => a + statSync(f).size, 0);
console.log('toplam boyut          : ' + (toplamBayt / 1024 / 1024).toFixed(2) + ' MB');

/** Ad taramasi: bir kavramin paketlerde KARSILIGI VAR MI. Metrikten tamamen bagimsiz sayi. */
const adTara = (kalip: RegExp): string[] =>
  oggListesi.filter((f) => kalip.test(path.basename(f))).map((f) => path.basename(f));
const sivi = adTara(/pour|water|liquid|flow|splash|drip|bubbl|fluid|steam|boil/i);
const ortam = adTara(/ambien|crowd|loop|room|chatter|murmur|cafe|tavern|backgro|atmo|drone|hum/i);
console.log('AKAN SIVI adayi       : ' + sivi.length + ' — ' + (sivi.slice(0, 6).join(' · ') || 'YOK'));
console.log('ORTAM/DONGU adayi     : ' + ortam.length + ' — ' + (ortam.slice(0, 6).join(' · ') || 'YOK'));
console.log('  -> iki KALICI BOSLUK ad taramasiyla dogrulandi; O kolunun adayi dosya DEGIL (bkz §6).');

// === §2 ADAY OLCULERI ======================================================
console.log('\n§2 ADAY OLCULERI (36 aday · 9 olay) — hepsi Chromium cozucusunden, 44100 mono');
console.log('aday                        dosya(KB) sure(sn) etkin(sn) kuyruk(sn)  RMS    tepe   duzluk  merkez(Hz)');
interface Olcu {
  ad: string; olay: SesId; kb: number; sure: number; etkin: number; kuyruk: number;
  rms: number; tepe: number; duzluk: number; merkez: number; pcm: Float32Array;
}
const olculer: Olcu[] = [];
for (const olay of IDLER) {
  for (const a of HAVUZ[olay] ?? []) {
    const pcm = pcmOku(a.ad);
    const o: Olcu = {
      ad: a.ad,
      olay,
      kb: statSync(a.yol).size / 1024,
      sure: pcm.length / ORNEKLEME,
      etkin: etkinSure(pcm),
      kuyruk: sessizKuyruk(pcm),
      rms: rms(pcm),
      tepe: tepe(pcm),
      duzluk: duzluk(pcm),
      merkez: merkez(pcm),
      pcm,
    };
    olculer.push(o);
    console.log(
      o.ad.padEnd(28) + o.kb.toFixed(1).padStart(8) + ' ' + o.sure.toFixed(3).padStart(8) + ' ' +
      o.etkin.toFixed(3).padStart(9) + ' ' + o.kuyruk.toFixed(3).padStart(10) + ' ' +
      o.rms.toFixed(4).padStart(7) + ' ' + o.tepe.toFixed(3).padStart(6) + ' ' +
      o.duzluk.toFixed(3).padStart(7) + ' ' + o.merkez.toFixed(0).padStart(10));
  }
}

console.log('\n§2b SENTEZ KARSILIGI (bugunku katalog, ayni olculer)');
console.log('olay        sure(sn) etkin(sn)   RMS    tepe   duzluk  merkez(Hz)  aralik(sn)');
const sentezPcm = new Map<SesId, Float32Array>();
for (const id of IDLER) {
  const p = seslendir(SES_KATALOG[id].katmanlar);
  sentezPcm.set(id, p);
  console.log(
    id.padEnd(11) + sesSure(id).toFixed(3).padStart(8) + ' ' + etkinSure(p).toFixed(3).padStart(9) + ' ' +
    rms(p).toFixed(4).padStart(7) + ' ' + tepe(p).toFixed(3).padStart(6) + ' ' +
    duzluk(p).toFixed(3).padStart(7) + ' ' + merkez(p).toFixed(0).padStart(10) + ' ' +
    SES_KATALOG[id].aralik.toFixed(2).padStart(11));
}

// --- YUKSEKLIK: dosya ile sentez AYNI SEVIYEDE mi? -------------------------
const sentezRmsOrt = IDLER.reduce((a, id) => a + rms(sentezPcm.get(id)!), 0) / IDLER.length;
const dosyaRmsOrt = olculer.reduce((a, o) => a + o.rms, 0) / olculer.length;
console.log('\n§2c YUKSEKLIK FARKI (normalizasyon gerekiyor mu?)');
console.log('sentez RMS ortalamasi : ' + sentezRmsOrt.toFixed(4));
console.log('dosya  RMS ortalamasi : ' + dosyaRmsOrt.toFixed(4));
console.log('fark                  : ' + (20 * Math.log10(dosyaRmsOrt / sentezRmsOrt)).toFixed(1) + ' dB' +
  '  (dosyalar sentezden bu kadar ' + (dosyaRmsOrt > sentezRmsOrt ? 'YUKSEK' : 'ALCAK') + ')');
const kirpan = olculer.filter((o) => o.tepe > 0.99);
console.log('tepesi 0,99 ustu aday : ' + kirpan.length + '/36 — ' + (kirpan.map((o) => o.ad).join(' · ') || 'yok'));

// === §3 K KOLU — dosya seti 36 ciftlik matristen geciyor mu? ===============
console.log('\n§3 K KOLU — DOSYALI KATALOG, sentezin cetveliyle');
console.log('Kalibrasyon: MUTLAK TABAN sentez tarafinda olculur (ayni ses, 1 yarim ses tiz) —');
console.log('dosyanin "1 yarim ses tizi" yok, o yuzden taban ORTAK ve sentezden gelir.');

const mutlakTabanlar = IDLER.map((id) =>
  mesafe(izParmak(SES_KATALOG[id].katmanlar), izParmak(transpoze(SES_KATALOG[id].katmanlar, YARIM_SES))));
const MUTLAK_TABAN = mutlakTabanlar.reduce((a, b) => a + b, 0) / mutlakTabanlar.length;
console.log('MUTLAK TABAN = ' + MUTLAK_TABAN.toFixed(2) + ' dB');

/**
 * HER OLAY ICIN EN IYI ADAY — "en iyi" burada estetik degil GEOMETRIK: secilen dokuz ses
 * birbirine ne kadar uzaksa katalog o kadar okunabilir. Aclikli (greedy) degil TAM arama da
 * degil: her olay icin adaylar, DIGER olaylarin TUM adaylarina olan EN KISA mesafesine gore
 * siralanir. Boylece bir adayin puani, hangi adayin secildigine bagli olmaz (sira etkisi yok).
 */
const iz = new Map<string, number[][]>();
for (const o of olculer) iz.set(o.ad, izParmakPcm(o.pcm));

console.log('\n§3b ADAY SIRALAMASI — "en yakin yabanci" mesafesi (buyuk = daha ayirt edilebilir)');
console.log('olay        aday                        enYakinYabanci(dB)  o yabanci          senteze mesafe(dB)');
const secim = new Map<SesId, Olcu>();
for (const olay of IDLER) {
  const havuz = olculer.filter((o) => o.olay === olay);
  if (havuz.length === 0) { console.log(olay.padEnd(11) + ' — havuz bos (bkz §1 kalici bosluk)'); continue; }
  const puanli = havuz.map((o) => {
    let enKisa = Infinity;
    let kim = '';
    for (const b of olculer) {
      if (b.olay === olay) continue;
      const d = mesafe(iz.get(o.ad)!, iz.get(b.ad)!);
      if (d < enKisa) { enKisa = d; kim = b.ad; }
    }
    const dSentez = mesafe(iz.get(o.ad)!, izParmakPcm(sentezPcm.get(olay)!));
    return { o, enKisa, kim, dSentez };
  }).sort((a, b) => b.enKisa - a.enKisa);
  for (const p of puanli) {
    console.log(
      (p === puanli[0] ? olay.padEnd(11) : ' '.repeat(11)) + p.o.ad.padEnd(28) +
      p.enKisa.toFixed(2).padStart(14) + '      ' + p.kim.padEnd(20) +
      p.dSentez.toFixed(2).padStart(8) + (p === puanli[0] ? '   <- ONERI' : ''));
  }
  secim.set(olay, puanli[0].o);
}

console.log('\n§3c SECILEN DOKUZLU ile 36 CIFT (sentezin 36/36 AYRI olcusuyle ayni cetvel)');
console.log('NOT: JEST kanali KATMAN tanimli (transpoze gerekir) — dosyada yok. Dosya hukmu');
console.log('     MUTLAK + SURE(JND) ile verilir; sentezin ucuncu kanali bu satirlarda bilerek bos.');
console.log('cift                                        mutlak(dB) sure(JND) hukum      mutlak/taban');
interface Cift { a: string; b: string; dm: number; sureJnd: number; hukum: string }
const cifter: Cift[] = [];
const secIdler = IDLER.filter((id) => secim.has(id));
for (let i = 0; i < secIdler.length; i++) {
  for (let j = i + 1; j < secIdler.length; j++) {
    const A = secim.get(secIdler[i])!;
    const B = secim.get(secIdler[j])!;
    const dm = mesafe(iz.get(A.ad)!, iz.get(B.ad)!);
    const sureJnd = Math.abs(Math.log(A.etkin / B.etkin)) / Math.log(SURE_WEBER);
    const hukum = dm < MUTLAK_TABAN && sureJnd < 2 ? 'KARISIR' : 'AYRI';
    cifter.push({ a: A.ad, b: B.ad, dm, sureJnd, hukum });
  }
}
cifter.sort((x, y) => x.dm - y.dm);
for (const c of cifter.slice(0, 12)) {
  console.log((c.a + ' <-> ' + c.b).padEnd(44) + c.dm.toFixed(2).padStart(7) + '  ' +
    c.sureJnd.toFixed(1).padStart(8) + '  ' + c.hukum.padEnd(10) + ' x' + (c.dm / MUTLAK_TABAN).toFixed(2));
}
const karisan = cifter.filter((c) => c.hukum === 'KARISIR');
const N = cifter.length;
console.log('  ... (en yakin 12 satir basildi, toplam ' + N + ')');
console.log('OZET: KARISIR ' + karisan.length + '/' + N + '  ·  AYRI ' + (N - karisan.length) + '/' + N +
  '   [sentez tabani: 0/36 KARISIR]');
console.log('EN YAKIN CIFT: ' + cifter[0].a + ' <-> ' + cifter[0].b + ' (' + cifter[0].dm.toFixed(2) +
  ' dB = x' + (cifter[0].dm / MUTLAK_TABAN).toFixed(2) + ' taban)');

// --- SURE BUTCESI: dosya `aralik` kelepcesine sigiyor mu? ------------------
console.log('\n§3d SURE BUTCESI — secilen dosya, olayin `aralik` kelepcesine siger mi?');
console.log('olay        aralik(sn)  sentez(sn)  dosya sure(sn)  dosya etkin(sn)  tasma?');
let tasan = 0;
for (const id of secIdler) {
  const o = secim.get(id)!;
  const aralik = SES_KATALOG[id].aralik;
  const tasar = o.etkin > aralik;
  if (tasar) tasan++;
  console.log(id.padEnd(11) + aralik.toFixed(2).padStart(10) + ' ' + sesSure(id).toFixed(3).padStart(11) + ' ' +
    o.sure.toFixed(3).padStart(14) + ' ' + o.etkin.toFixed(3).padStart(16) + '  ' + (tasar ? 'TASIYOR' : '-'));
}
console.log('tasan: ' + tasan + '/' + secIdler.length + '  -> tasan seste iki calis USTUSTE biner; `aralik` buyumeli ya da dosya kirpilmali.');

// === §4 BUTCE ==============================================================
console.log('\n§4 DOSYA BUTCESI (APK payi)');
const secKb = secIdler.reduce((a, id) => a + secim.get(id)!.kb, 0);
console.log('secilen ' + secIdler.length + ' dosya : ' + secKb.toFixed(1) + ' KB');
console.log('sentez karsiligi  : 0 KB (kod)');
console.log('havuzun tamami    : ' + olculer.reduce((a, o) => a + o.kb, 0).toFixed(1) + ' KB (36 aday)');

// === §5 I KOLU — SERI IVMESI ==============================================
console.log('\n§5 I KOLU — SERI IVMESI (perde basamagi). KAYNAKTAN BAGIMSIZ: dosyada');
console.log('   `playbackRate`, sentezde frekans carpani; ikisi de ayni orani uygular.');
const KOLLAR = [
  { ad: 'I1 basamak yok (BUGUNKU)', basamak: 0, tavan: 0 },
  { ad: 'I2 +1 yarim ses, tavan 5', basamak: 1, tavan: 5 },
  { ad: 'I3 +2 yarim ses, tavan 8', basamak: 2, tavan: 8 },
];
const coinKat = SES_KATALOG.coin.katmanlar;
const coinTemel = coinKat[0].hz[0];
const coinAralik = SES_KATALOG.coin.aralik;
console.log('\nkol                        tavan perde(Hz)  tavan orani  adim<->adim(dB)  ilk<->tavan(dB)  tavana varis(sn)');
for (const k of KOLLAR) {
  const oranTavan = Math.pow(YARIM_SES, k.basamak * k.tavan);
  const adim0 = izParmak(coinKat);
  const adim1 = izParmak(transpoze(coinKat, Math.pow(YARIM_SES, k.basamak)));
  const adimT = izParmak(transpoze(coinKat, oranTavan));
  const dAdim = mesafe(adim0, adim1);
  const dTavan = mesafe(adim0, adimT);
  console.log(
    k.ad.padEnd(27) + (coinTemel * oranTavan).toFixed(0).padStart(13) + ' ' +
    oranTavan.toFixed(3).padStart(12) + ' ' + dAdim.toFixed(2).padStart(16) + ' ' +
    dTavan.toFixed(2).padStart(16) + ' ' + (k.tavan * coinAralik).toFixed(2).padStart(17));
}
console.log('\nMUTLAK TABAN = ' + MUTLAK_TABAN.toFixed(2) + ' dB  -> "adim<->adim" bunun ALTINDAYSA iki ardisik');
console.log('toplama KULAKTAN AYNI perdede duyulur, yani basamak bosa gider.');

/**
 * TAVAN NEDEN OLCUMU TERS CEVIREBILIYOR — I3'un "ilk<->tavan" sayisi I2'ninkinden KUCUK cikti
 * ve bu bir arac hatasi DEGIL, kolun kendi kusuru: coin metalik tinisini INHARMONIK kismilerden
 * aliyor (1 · 2,76 · 5,40 · 8,93). Tavanda butun kismiler yukari otelenir; metrigin bandi
 * 12 kHz'te, insan isitmesi ~16-18 kHz'te biter. Kismiler disari cikinca geriye yalnizca temel
 * kalir: ses TIZLESMEZ, TINISINI KAYBEDER. Asagidaki satirlar bunu sayiyla gosteriyor.
 */
console.log('\n§5c TAVANDA KISMILER NEREYE GIDIYOR (coin kismileri: ' +
  (coinKat[0].kismi ?? [1]).join(' · ') + ' x temel)');
console.log('kol                        temel(Hz)  2.kismi(Hz)  3.kismi(Hz)  4.kismi(Hz)  12kHz ustu  16kHz ustu');
for (const k of KOLLAR) {
  const oran = Math.pow(YARIM_SES, k.basamak * k.tavan);
  const kismi = coinKat[0].kismi ?? [1];
  const f = kismi.map((c) => coinTemel * c * oran);
  console.log(
    k.ad.padEnd(27) + f.map((v) => v.toFixed(0).padStart(11)).join(' ') +
    (f.filter((v) => v > 12000).length + '/' + f.length).padStart(12) +
    (f.filter((v) => v > 16000).length + '/' + f.length).padStart(12));
}
console.log('  -> 12 kHz ustundeki kismi METRIKTE yok; 16 kHz ustundeki KULAKTA da yok.');

// Ust uste binme: seri sirasinda tepe degeri 1,0'a dayaniyor mu (kirpilma)?
console.log('\n§5b SERI KIRPILMASI — bes toplama, 0,16 sn arayla ust uste');
console.log('(Karisim `tools/ses-taslak.ts`ten — PANODA DUYULAN tamponun ta kendisi.)');
for (const k of KOLLAR) {
  const { karisim, hamTepe } = seriKarisim(coinKat, k.basamak, k.tavan);
  console.log(k.ad.padEnd(27) + ' ham tepe ' + hamTepe.toFixed(3) +
    '  ·  sinirlayici sonrasi tepe ' + tepe(karisim).toFixed(3) +
    '  ·  RMS ' + rms(karisim).toFixed(4) + '  ·  kirpilma ' + (hamTepe > 1 ? 'VAR (tanh sart)' : 'yok'));
}

// === §6 O KOLU — ORTAM UGULTUSU ===========================================
console.log('\n§6 O KOLU — ORTAM UGULTUSU');
console.log('O2 (Kenney icinden dongu adayi): §1\'e gore ' + ortam.length + ' aday -> KOL DUSTU, dosya yok.');
console.log('Geriye O1 (sentez uğultu) ile O3 (tek-dosya CC0 istisnasi, S-C stil kilidini deler) kaliyor.');
console.log('\nMOTOR NE ISTIYOR (O1 secilirse): audioSynth bugun yalnizca TEK ATIS uretiyor —');
console.log('her katmanin bir atak + sonme zarfi var, surekli/donen kaynak YOK. Sayi: katalogda');
console.log('9/9 ses tek atis, dongu alani 0. O1 motora "dongu" kabiliyeti ekler (S16 sonrasi ilk');
console.log('motor genislemesi); O3 eklemez ama lisans yuzeyini 1 sanatcidan 2\'ye cikarir.');

/**
 * MASKELEME BANT-SINIRLI OLCULUR, genis bant DEGIL.
 *
 * Ilk kurulusta oranlar tum tayf uzerinden alinmisti ve her seviyede "coin BASTIRILIR" cikiyordu.
 * Sayi yanlis degildi, SORU yanlisti: yatagin enerjisi 300-900 Hz'te (konusma govdesi), coin'in
 * agirlik merkezi 8,1 kHz'te. Iki ses ayni bantlarda YARISMIYOR; genis bant orani, ortusmeyen
 * enerjiyi maskeleme sanip kolu haksiz yere eliyordu. Dogru olcu: her sesin KENDI baskin
 * bandinda yatagin ne kadar enerjisi var.
 */
const bantEnerji = (pcm: Float32Array): number[] => {
  const s = spektrogram(pcm);
  const top = new Array<number>(BANT).fill(0);
  for (const kare of s) for (let j = 0; j < BANT; j++) top[j] += Math.pow(10, kare[j] / 10);
  return top;
};
console.log('\n§6b MASKELEME — BANT-SINIRLI (her ses kendi baskin bandinda yarisir)');
console.log('(Yatak olcum taslagi: 300-900 Hz agirlikli, yavas dalgalanan gurultu. Oyun kodu DEGIL.)');
const yatakBirim = ortamYatagi(2.0, 1 / 14); // gain x14 catsayisi notrlenir: birim yatak
const yatakBant = bantEnerji(yatakBirim);
const yatakBirimRms = rms(yatakBirim);
console.log('birim yatak RMS: ' + yatakBirimRms.toFixed(4) + '  (asagidaki "yatak/ses RMS" bunun katidir)');
console.log('\nses         baskin bant  o bantta yatak payi   yatak/ses RMS orani -> o bantta +12 dB pay icin');
for (const id of IDLER) {
  const p = sentezPcm.get(id)!;
  const sb = bantEnerji(p);
  let bi = 0;
  for (let j = 0; j < BANT; j++) if (sb[j] > sb[bi]) bi = j;
  // O bantta sesin ve yatagin enerjileri; yatak olceklenince enerji gain^2 ile carpilir.
  const sesE = sb[bi];
  const yatakE = yatakBant[bi] + 1e-12;
  // +12 dB pay: sesE / (yatakE * g^2) = 10^1.2  ->  g = sqrt(sesE / (yatakE * 15.85))
  const g12 = Math.sqrt(sesE / (yatakE * Math.pow(10, 1.2)));
  console.log(
    id.padEnd(11) + String(bi).padStart(11) + '  ' +
    (10 * Math.log10(yatakE / sesE)).toFixed(1).padStart(16) + ' dB' +
    (g12 * yatakBirimRms).toFixed(4).padStart(22) + '  (yatak RMS bunun ALTINDA kalmali)');
}
const enKisitli = IDLER.map((id) => {
  const sb = bantEnerji(sentezPcm.get(id)!);
  let bi = 0;
  for (let j = 0; j < BANT; j++) if (sb[j] > sb[bi]) bi = j;
  return { id, g: Math.sqrt(sb[bi] / ((yatakBant[bi] + 1e-12) * Math.pow(10, 1.2))) * yatakBirimRms };
}).sort((a, b) => a.g - b.g)[0];
console.log('\nEN KISITLAYICI ses: ' + enKisitli.id + '  -> yatak RMS <= ' + enKisitli.g.toFixed(4) +
  '  (bu, dokuz sesin HEPSINI +12 dB uzerde tutan tavan)');
console.log('  -> 12 dB kural disi degil: kisa bir gecis sesinin surekli bir yatagin ustunde');
console.log('     kalmasi icin gereken kaba pay. Kesin deger kulakla secilir (pano).');

// === Damgalar ==============================================================
damga('36 aday PCM onbellegi tam', olculer.length === TUM_ADAYLAR.length,
  olculer.length + '/' + TUM_ADAYLAR.length + ' — once `node tools/ses-coz.mjs` kosulmali');
damga('hicbir aday sessiz degil', olculer.every((o) => o.tepe > 1e-3),
  'bir aday hic ornek tasimiyor — cozucu bos dondu');
damga('mesafe kendisiyle 0', olculer.every((o) => mesafe(iz.get(o.ad)!, iz.get(o.ad)!) === 0));
damga('mesafe simetrik', cifter.every((c) => {
  const A = olculer.find((o) => o.ad === c.a)!;
  const B = olculer.find((o) => o.ad === c.b)!;
  return Math.abs(mesafe(iz.get(A.ad)!, iz.get(B.ad)!) - mesafe(iz.get(B.ad)!, iz.get(A.ad)!)) < 1e-9;
}));
damga('mutlak taban pozitif', MUTLAK_TABAN > 0, 'taban ' + MUTLAK_TABAN.toFixed(3));
// Cozucu GERCEKTEN dosyayi okudu mu? Iki farkli dosya ayni PCM veriyorsa onbellek bozuk.
damga('adaylar birbirinden farkli',
  new Set(olculer.map((o) => o.rms.toFixed(6) + '|' + o.sure.toFixed(4))).size === olculer.length,
  'iki aday ayni RMS+sure tasiyor — onbellek karismis olabilir');
// I kolunun anlamli olmasi basamagin OLCULEBILIR olmasina bagli.
damga('I2 basamagi tabanin ustunde',
  mesafe(izParmak(coinKat), izParmak(transpoze(coinKat, YARIM_SES))) > 0,
  'bir yarim ses hic fark uretmedi — metrik bu basamagi goremiyor');
// Ad taramasi gercekten dosya adlarina bakiyor mu (regex bos donuyor diye "kanit" sayilmasin)?
damga('ad taramasi calisiyor', adTara(/coin/i).length > 0,
  'bilinen bir ad (coin) bile bulunamadi — tarama bozuk, "0 aday" sonucu KANIT DEGIL');
damga('envanter bos degil', oggListesi.length > 600, oggListesi.length + ' .ogg bulundu');
damgaOzeti();
