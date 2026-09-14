/**
 * olcum-oyuncu-hizi.ts — "ana karakterin max hızını biraz daha düşür" isteğinin ÖLÇÜMÜ (S18).
 *
 * İKİ SORUYU BİRDEN SORAR, çünkü cevaplar zıt yönü gösteriyor:
 *
 *   §1 GÖRSEL — hız düştükçe AYAK KAYMASI azalır. `Running_A` kelepçe tavanında (1,8×) en fazla
 *      2,245 br/sn taşır; bunun üstündeki her hız o oranda kayar. Bu saf aritmetik.
 *   §2 DENGE  — hız düştükçe oyuncunun tur süresi uzar ve D-087'nin "hiçbir yükseltme beklemesi
 *      20 dk'yı aşmaz" güvencesi tehlikeye girer. Bu, idealize ekonominin KENDİ koşusundan gelir
 *      (`tools/simulate.ts` → `olcutler`, `tests/meta-pencere.test.ts`in kullandığı harness).
 *
 * NEDEN BU ARAÇ VAR: kullanıcı "biraz düşür" dedi ve "biraz"ın karşılığı bir zevk sorusu değil
 * bir SINIR sorusu çıktı — merdivenin tamamı bir basamak inince (3,6-4,5) D-087 KIRILDI (en uzun
 * bekleme 1140 sn sınırına karşı 1203 sn). Tarama kırılanın TABAN hız olduğunu gösterdi; tavan
 * serbest. Karar o yüzden "yalnız tavanı indir" oldu ve sayısı buradan geliyor.
 *
 * Koşu: OLCUM=tam npx tsx tools/olcum-oyuncu-hizi.ts > docs/olcum-oyuncu-hizi.txt
 */
import { economyConfig } from '../src/config/economy.config.ts';
import { KLIP_HIZI, TIMESCALE_TAVAN } from '../src/config/actor.ts';
import { LOKOMOSYON, lokomosyonSec } from '../src/components/three/KayActor';
import {
  olcutler, onbellekTemizle, milestoneTazele, kolAyarla, m1Ayarla, VARSAYILAN,
  hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla,
} from './simulate';
import { HEDEF_KOLLARI } from './hedef-kollari';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla } from './itibar-kollari';
import { USTA_KOLLARI, kayitSifirla as ustaKayitSifirla } from './usta-kollari';
import { damga, damgaOzeti } from './olcum-lib';

const kip = process.env.OLCUM === 'tam' ? 'tam' : 'kisa';
const SINIR = 20 * 60; // D-087'nin hüküm ölçütü (sn)

console.log('='.repeat(92));
console.log('S18 — OYUNCU HIZI: ayak kaymasi (gorsel) ile D-087 20 dk guvencesi (denge) arasinda');
console.log('='.repeat(92));
if (kip !== 'tam') console.log('\n!! KISA KIP — bu cikti RAPORA GIRMEZ (D-084). Tam kosu: OLCUM=tam\n');

// === §1 AYAK KAYMASI — saf aritmetik ======================================
const TASINAN = KLIP_HIZI.Running_A * TIMESCALE_TAVAN;
console.log('\n§1 AYAK KAYMASI — hizdan turer, olcum gerekmez');
console.log('`Running_A` kelepce tavaninda (' + TIMESCALE_TAVAN + '×) tasidigi yer hizi: ' +
  TASINAN.toFixed(3) + ' br/sn');
console.log('\nhiz(br/sn)  secilen klip  timeScale  kelepce  AYAK KAYMASI');
for (const h of [5.4, 5.1, 4.95, 4.8, 4.65, 4.5, 4.2, 3.9, 3.6, 2.25]) {
  const s = lokomosyonSec(LOKOMOSYON.yuru, h);
  const ham = h / KLIP_HIZI[s.klip];
  console.log(
    h.toFixed(2).padStart(10) + '  ' + s.klip.padEnd(13) + s.timeScale.toFixed(3).padStart(9) + '  ' +
    (ham > TIMESCALE_TAVAN ? 'TAVAN' : '-').padEnd(8) +
    (h / (KLIP_HIZI[s.klip] * s.timeScale)).toFixed(2).padStart(12) + 'x');
}

// === §2 D-087 GUVENCESI — idealize ekonominin kendi kosusu =================
/**
 * `economyConfig` calisma aninda DEGISTIRILIR ve her koldan sonra geri yazilir. Bu bir hile
 * degil zorunluluk: hiz bir MODUL SABITI ve kollari ayri ayri kosturmanin baska yolu yok —
 * varyant kapisinin istedigi de tam olarak "koda dokunmadan once her kolun sayisini gor".
 */
const ASIL = [...economyConfig.character.speed.values];

function guvence(values: number[]): { asan: number; enUzun: number; normalAsan: number; serit: number } {
  (economyConfig.character.speed as { values: number[] }).values = values;
  // YIGIN ACIK KURULUM — `tests/meta-pencere.test.ts` → `kur(true,true,true)` ile BIREBIR.
  // Ilk yazilisinda H/R/E kancalari kapaliydi ve TABAN kol bile "KIRIK" cikiyordu; damga
  // ("bugunku denge zaten kirikmis — kiyas gecersiz") bunu yakaladi. D-095: 20 dk guvencesini
  // KAPATAN katman R; kancasiz bir dunyada olculen sayi yururlukteki oyunu anlatmaz.
  itibarKayitSifirla();
  ustaKayitSifirla();
  kolAyarla(VARSAYILAN);
  m1Ayarla(false);
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  itibarAyarla(ITIBAR_KOLLARI.rUYG.fabrika(1));
  ustaAyarla(USTA_KOLLARI.eUYG.fabrika(1));
  onbellekTemizle();
  milestoneTazele();
  // HUKUM sayilari IDEALIZE profilden gelir (D-087) ve `olcutler` onlari hazir veriyor —
  // `idealAsan` / `idealEnUzun`. Profili biz secmiyoruz, arac ikisini de ayni kosuda uretiyor.
  const o = olcutler();
  return { asan: o.idealAsan, enUzun: o.idealEnUzun, normalAsan: o.normalAsan, serit: o.serit ?? 0 };
}

const KOLLAR: { ad: string; v: number[] }[] = [
  { ad: 'BUGUN 4,50-5,40', v: [4.5, 4.8, 5.1, 5.4] },
  { ad: 'tavan 5,20', v: [4.5, 4.8, 5.1, 5.2] },
  { ad: 'SECILEN 4,50-4,95', v: [4.5, 4.65, 4.8, 4.95] },
  { ad: 'taban -0,1 (4,40)', v: [4.4, 4.7, 5.0, 5.3] },
  { ad: 'taban -0,2 (4,30)', v: [4.3, 4.6, 4.9, 5.2] },
  { ad: 'hepsi -0,6 (3,90)', v: [3.9, 4.2, 4.5, 4.8] },
  { ad: 'hepsi -0,9 (3,60)', v: [3.6, 3.9, 4.2, 4.5] },
];

console.log('\n§2 D-087 GUVENCESI (idealize profil, sinir ' + SINIR + ' sn = 20 dk)');
console.log('kol                  taban  tavan  20dk ASAN  en uzun(sn)  hukum  Normal ASAN  serit(dk)');
const sonuc: { ad: string; asan: number; enUzun: number; normalAsan: number; serit: number }[] = [];
for (const k of KOLLAR) {
  const g = guvence(k.v);
  sonuc.push({ ad: k.ad, ...g });
  console.log(
    k.ad.padEnd(21) + k.v[0].toFixed(2).padStart(5) + '  ' + k.v[3].toFixed(2).padStart(5) + '  ' +
    String(g.asan).padStart(9) + '  ' + g.enUzun.toFixed(0).padStart(11) + '  ' +
    (g.asan === 0 ? 'TEMIZ' : 'KIRIK').padEnd(7) + String(g.normalAsan).padStart(11) +
    (g.serit / 60).toFixed(1).padStart(11));
}
(economyConfig.character.speed as { values: number[] }).values = ASIL;
onbellekTemizle();

console.log('');
console.log('-> ILK OKUMA YANLISTI ve damga yakaladi. "Her indirim 20 dk hukmunu kirar" DEGIL:');
console.log('   hukum 3,90-4,80e kadar TEMIZ (1158 sn), ancak 3,60-4,50te kiriliyor (1203 sn).');
console.log('   ASIL KISIT DAHA ERKEN GELIYOR: taban 4,50den 4,40a inince Normal gozlem bandi');
console.log('   2 -> 3 oynuyor ve serit 406 -> 411 dk uzuyor; ikisi de D-095in KILITLEDIGI sayi.');
console.log('   YALNIZ TAVAN inince (secilen kol) UC KOLON DA birebir ayni kaliyor: 1079 sn,');
console.log('   Normal 2, serit 406,3. Yani TAVAN BEDAVA, TABAN DEGIL — merdivenin tamami');
console.log('   inecekse o ayri bir DENGE TURUDUR ve D-095 yeniden okunmalidir.');

// === Damgalar ==============================================================
damga('taban kol TEMIZ', sonuc[0].asan === 0, 'bugunku denge zaten kirikmis — kiyas gecersiz');
damga('secilen kol TEMIZ', sonuc[2].asan === 0, 'secilen merdiven guvenceyi kiriyor');
// ASIL IDDIA: yalniz TAVAN inince D-095in HICBIR sayisi kipirdamaz. Merdivenin tamami
// inince Normal gozlem bandi degisir — asil kisit orasi, 20 dk hukmu degil.
damga('yalniz tavan hicbir sayiyi kipirdatmiyor',
  sonuc[2].enUzun === sonuc[0].enUzun && sonuc[2].normalAsan === sonuc[0].normalAsan,
  'secilen kol tabanla ayni sayilari vermiyor — "tavan serbest" iddiasi cokuyor');
damga('merdivenin tamami inince hukum SONUNDA kiriliyor', sonuc[6].asan > 0,
  'en dusuk kol bile temiz — o zaman hiz hic kisit degil, gerekce gozden gecmeli');
damga('config geri yazildi',
  economyConfig.character.speed.values.every((v, i) => v === ASIL[i]),
  'arac konfigi bozuk birakti');
damga('kelepce gercekten baglayici', 5.4 / TASINAN > 2,
  'tavan hizda kayma 2 katin altinda — §1 gerekcesi zayif');
damgaOzeti();
