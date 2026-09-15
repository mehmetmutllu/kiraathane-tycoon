/**
 * mutasyon-seri-s9.mjs — S9 SERİ İVMESİ BEKÇİSİNİ MUTASYONLA DOĞRULAR (D-122 · kol I2).
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Her mutasyon aşağıda S9'un kapattığı kusurlardan birini GERİ GETİRİYOR:
 * basamağı hiç uygulamamak · tavanı kaldırmak · seriyi hiç kesmemek · perdelemeyi sessizce
 * yutmak · her basamağı aynı tampona yazmak · ölçüm ile oyunu ikinci bir kopyayla ayırmak.
 *
 * BU TURUN ÖZEL RİSKİ — mutasyon listesi bilerek buna göre yazıldı: seri ivmesi iki AYRI
 * parçadan oluşuyor ve biri doğru olup diğeri hiç çalışmayabilir. Motor basamağı doğru sayıp
 * `perdele` hiçbir şey yapmasa bütün çalmalar aynı perdeden çıkardı ve "sayaç" testleri yine
 * yeşil kalırdı (M6-M8 tam olarak bunu sınıyor). Tersi de mümkün: perdeleme çalışıp sayaç hep
 * 0 verirse ses hiç kıpırdamaz (M1).
 *
 * Kullanım: node tools/mutasyon-seri-s9.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const AUDIO = 'src/game/audio.ts';
const SYNTH = 'src/game/audioSynth.ts';
const WEB = 'src/game/audioWeb.ts';
const TASLAK = 'tools/ses-taslak.ts';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- SAYAÇ: merdiven hiç çıkmıyor / durmuyor / kesilmiyor
  { ad: 'M1 basamak hiç uygulanmıyor (I1\'e dönüş)', dosya: AUDIO,
    bul: '        yarimSes = adim * tanim.seri.basamak;',
    koy: '        yarimSes = 0;',
    kusur: 'ölçülen 0,00 dB\'lik hâl geri gelir — "ivme" hissi hiç doğmaz' },
  { ad: 'M2 tavan kalkıyor (merdiven sonsuz tırmanıyor)', dosya: AUDIO,
    bul: 'const adim = surdu ? Math.min((seriAdim.get(id) ?? 0) + 1, tanim.seri.tavan) : 0;',
    koy: 'const adim = surdu ? (seriAdim.get(id) ?? 0) + 1 : 0;',
    kusur: 'uzun seride perde kulağın dışına çıkar (I3\'ün elenme sebebi)' },
  { ad: 'M3 seri hiç kesilmiyor', dosya: AUDIO,
    bul: 'const surdu = son != null && t - son <= tanim.seri.pencere;',
    koy: 'const surdu = son != null;',
    kusur: 'dakikalar sonraki tek bir toplama bile tavandan çalar' },
  { ad: 'M4 pencere karşılaştırması ters', dosya: AUDIO,
    bul: 'const surdu = son != null && t - son <= tanim.seri.pencere;',
    koy: 'const surdu = son != null && t - son >= tanim.seri.pencere;',
    kusur: 'seri tam tersine döner: hızlı toplama tabanda kalır' },
  { ad: 'M5 ilk çalma tabandan başlamıyor', dosya: AUDIO,
    bul: '        const adim = surdu ? Math.min((seriAdim.get(id) ?? 0) + 1, tanim.seri.tavan) : 0;',
    koy: '        const adim = Math.min((seriAdim.get(id) ?? 0) + 1, tanim.seri.tavan);',
    kusur: 'seri kesilse de perde tabana dönmez' },

  // --- PERDELEME: sayaç doğru ama SES kıpırdamıyor
  { ad: 'M6 perdele hiçbir şey yapmıyor', dosya: SYNTH,
    bul: '  if (yarimSes === 0) return katmanlar as Katman[];\n  const k = Math.pow(YARIM_SES, yarimSes);',
    koy: '  return katmanlar as Katman[];\n  const k = Math.pow(YARIM_SES, yarimSes);',
    kusur: 'motor basamağı doğru sayar ama her çalma AYNI perdeden çıkar' },
  { ad: 'M7 perdeleme yalnız ilk katmana uygulanıyor', dosya: SYNTH,
    bul: '  return katmanlar.map((kat) => ({ ...kat, hz: kat.hz.map((h) => h * k) }));',
    koy: '  return katmanlar.map((kat, i) => (i === 0 ? { ...kat, hz: kat.hz.map((h) => h * k) } : { ...kat }));',
    kusur: 'tiz gürültü geçişi perdeden kopar; merdiven çıktıkça ses ikiye ayrılır' },
  { ad: 'M8 perdeleme yönü ters (merdiven aşağı iniyor)', dosya: SYNTH,
    bul: '  const k = Math.pow(YARIM_SES, yarimSes);',
    koy: '  const k = Math.pow(YARIM_SES, -yarimSes);',
    kusur: 'çok toplayınca ses PESLEŞİR — kullanıcının istediğinin tersi' },

  // --- ARKA UÇ: her basamak aynı tampona yazılıyor
  { ad: 'M9 önbellek anahtarı basamağı unutuyor', dosya: WEB,
    bul: '      const anahtar = `${id}:${yarimSes}`;',
    koy: '      const anahtar = `${id}`;',
    kusur: 'ilk basamak önbelleğe girer, sonraki bütün basamaklar onu çalar' },
  { ad: 'M10 arka uç perdelemeyi hiç çağırmıyor', dosya: WEB,
    bul: '        const ornekler = seslendir(perdele(katmanlar, yarimSes));',
    koy: '        const ornekler = seslendir(katmanlar);',
    kusur: 'tampon başına ayrı anahtar üretilir ama içerikleri aynıdır' },
  { ad: 'M11 dosya yolu basamağı yutuyor', dosya: WEB,
    bul: '      calTampon(c, buf, Math.pow(2, yarimSes / 12));',
    koy: '      calTampon(c, buf);',
    kusur: 'bir .ogg bırakılınca seri ivmesi sessizce kaybolur' },

  // --- KATALOG: kol geri alınıyor / sessizce yayılıyor
  { ad: 'M12 coin serisi katalogdan siliniyor', dosya: AUDIO,
    bul: '    seri: { pencere: 1.2, basamak: 1, tavan: 5 },',
    koy: '',
    kusur: 'D-122 kol I2 sessizce geri alınır' },
  { ad: 'M13 seri kataloğun tamamına yayılıyor', dosya: AUDIO,
    bul: "    aralik: 0.45,\n  },\n  // İLERLEME (💎) — Usta",
    koy: "    aralik: 0.45,\n    seri: { pencere: 1.2, basamak: 1, tavan: 5 },\n  },\n  // İLERLEME (💎) — Usta",
    kusur: 'seyrek olaylara merdiven takılır; `level` sebepsiz tizleşir' },
  { ad: 'M14 kelepçe sesin boyuna çıkıyor (kol A1)', dosya: AUDIO,
    bul: '    aralik: 0.06,\n    // D-122 · I2',
    koy: '    aralik: 0.32,\n    // D-122 · I2',
    kusur: 'seri seyrekleşir, I2\'nin merdiveni görünmez olur' },
  { ad: 'M15 kelepçeye takılan çağrı seriyi ilerletiyor', dosya: AUDIO,
    bul: '      if (son != null && t - son < tanim.aralik) return false;\n\n      // SERİ',
    koy: '      const kelepce = son != null && t - son < tanim.aralik;\n\n      // SERİ',
    kusur: 'duyulmayan çağrılar basamak yer; merdiven bir karede tavana fırlar' },

  // --- TEK KAYNAK: ölçüm ile oyun yeniden ayrışıyor
  { ad: 'M16 taslak kendi perdeleme kopyasını geri alıyor', dosya: TASLAK,
    bul: '    parca.push(seslendir(perdele(katmanlar, adim)));',
    koy: '    parca.push(seslendir(katmanlar.map((kat) => ({ ...kat, hz: kat.hz.map((h) => h * Math.pow(2, adim / 12)) }))));',
    kusur: 'panoda DUYULAN basamak ile oyunda ÇALAN basamak ayrışabilir' },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/seri-ivmesi-s9.test.ts', 'tests/ses.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('S9 seri ivmesi bekçisi — mutasyon doğrulaması\n');
let tutan = 0;
const kacan = [];
try {
  for (const m of MUTASYONLAR) {
    const asil = ded(m.dosya);
    const duz = lf(asil);
    if (!duz.includes(m.bul)) {
      kacan.push(`${m.ad} — KALIP BULUNAMADI (${m.dosya})`);
      console.log(`  ?  ${m.ad} — kalıp bulunamadı`);
      continue;
    }
    writeFileSync(y(m.dosya), duz.replace(m.bul, m.koy), 'utf8');
    const kirmizi = testKirmiziMi();
    writeFileSync(y(m.dosya), asil, 'utf8');
    if (kirmizi) { tutan++; console.log(`  ✓  ${m.ad}`); }
    else { kacan.push(`${m.ad} — ${m.kusur}`); console.log(`  ✗  KAÇTI: ${m.ad}`); }
  }
} finally {
  geri();
}

console.log(`\n${tutan}/${MUTASYONLAR.length} mutasyon kırmızı yandı.`);
if (kacan.length) {
  console.log('KAÇANLAR (bekçisiz kollar):');
  for (const k of kacan) console.log('  ! ' + k);
  process.exit(1);
}
