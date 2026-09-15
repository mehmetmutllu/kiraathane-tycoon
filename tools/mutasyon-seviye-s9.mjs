/**
 * mutasyon-seviye-s9.mjs — SES/MÜZİK SEVİYESİ BEKÇİSİNİ MUTASYONLA DOĞRULAR (S9 · D-122).
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Mutasyonlar üç ayrı yerden saldırıyor ve üçü de bu turda GERÇEKTEN
 * yapılabilecek hatalar:
 *   · kayıt birleştirme (eski kaydı sessizleştiren yüzeysel yayılım — turun kapattığı hata)
 *   · motor (seviye anahtardan ayrı mı, kelepçe/seri seviye 0'da duruyor mu)
 *   · müzik (anahtar bağlı mı, tavan aşılıyor mu, sessiz döngü dönüyor mu)
 *
 * Kullanım: node tools/mutasyon-seviye-s9.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const SAVE = 'src/game/save.ts';
const AUDIO = 'src/game/audio.ts';
const MUSIC = 'src/game/music.ts';

const MUTASYONLAR = [
  // --- KAYIT: eski kaydı sessizleştiren hata geri geliyor
  { ad: 'M1 eksik ayar alanı undefined kalıyor', dosya: SAVE,
    bul: '    typeof v === \'number\' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : varsayilan;',
    koy: '    v as number;',
    kusur: 'eski kayıt açılınca ses seviyesi undefined → oyun tamamen sessiz' },
  { ad: 'M2 varsayılan seviye 0', dosya: SAVE,
    bul: 'showFps: false, soundVolume: 1, musicVolume: 1 };',
    koy: 'showFps: false, soundVolume: 0, musicVolume: 0 };',
    kusur: 'yeni oyuncu sessiz başlar; eski kayıt bugünkü sesini kaybeder' },
  { ad: 'M3 aralık kelepçesi kalkıyor', dosya: SAVE,
    bul: 'typeof v === \'number\' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : varsayilan;',
    koy: 'typeof v === \'number\' && Number.isFinite(v) ? v : varsayilan;',
    kusur: 'bozuk kayıt 9× kazanç yazabilir; ses kırpılır' },
  { ad: 'M4 birleştirme oyuncunun seçimini yok sayıyor', dosya: SAVE,
    bul: '    soundVolume: oran(s.soundVolume, d.soundVolume),',
    koy: '    soundVolume: d.soundVolume,',
    kusur: 'kaydırıcı kaydediliyor ama yüklemede hep 1\'e dönüyor' },

  // --- MOTOR: seviye anahtardan ayrılmıyor / kazanca girmiyor
  { ad: 'M5 seviye çalma kazancına hiç girmiyor', dosya: AUDIO,
    bul: '        arkaUc.sentezCal(id, tanim.katmanlar, yarimSes, ses);',
    koy: '        arkaUc.sentezCal(id, tanim.katmanlar, yarimSes, 1);',
    kusur: 'kaydırıcı görünür ama hiçbir şey yapmaz' },
  { ad: 'M6 dosya yolu seviyeyi yutuyor', dosya: AUDIO,
    bul: '      if (!arkaUc.dosyaCal(tanim.dosya, ses, yarimSes)) {',
    koy: '      if (!arkaUc.dosyaCal(tanim.dosya, 1, yarimSes)) {',
    kusur: 'bir .ogg bırakılınca seviye ayarı sessizce kaybolur' },
  { ad: 'M7 seviye 0 sesi durdurmuyor', dosya: AUDIO,
    bul: '      if (!aktif || kilitli || ses <= 0) return false;',
    koy: '      if (!aktif || kilitli) return false;',
    kusur: 'seviye 0\'da sessiz tamponlar üretilir; seri sayacı da ilerler' },
  { ad: 'M8 seviye 0 anahtarı da kapatıyor', dosya: AUDIO,
    bul: '      if (yeniSeviye !== undefined) ses = Math.min(1, Math.max(0, yeniSeviye));',
    koy: '      if (yeniSeviye !== undefined) { ses = Math.min(1, Math.max(0, yeniSeviye)); aktif = aktif && ses > 0; }',
    kusur: '"kıs" ile "kapat" tekrar tek şeye düşer — turun düzelttiği kusur' },
  { ad: 'M9 motor seviyeyi kelepçelemiyor', dosya: AUDIO,
    bul: '  let ses = Math.min(1, Math.max(0, seviye));',
    koy: '  let ses = seviye;',
    kusur: 'aralık dışı seviye doğrudan kazanca gider' },

  // --- MÜZİK: anahtar bağlı değil / tavan aşılıyor / sessiz döngü dönüyor
  { ad: 'M10 müzik anahtarı yok sayılıyor', dosya: MUSIC,
    bul: '    const calmali = aktif && !kilitli && ses > 0;',
    koy: '    const calmali = !kilitli && ses > 0;',
    kusur: '"Müzik" anahtarı yine hiçbir şeye bağlı değil (S10 · B9\'a dönüş)' },
  { ad: 'M11 tarayıcı kilidi yok sayılıyor', dosya: MUSIC,
    bul: '    const calmali = aktif && !kilitli && ses > 0;',
    koy: '    const calmali = aktif && ses > 0;',
    kusur: 'dokunuş öncesi başlatılan döngü askıda kalır' },
  { ad: 'M12 seviye 0 döngüyü döndürmeye devam ediyor', dosya: MUSIC,
    bul: '    const calmali = aktif && !kilitli && ses > 0;',
    koy: '    const calmali = aktif && !kilitli;',
    kusur: 'sessiz döngü arka planda dönüp pil yakar' },
  { ad: 'M13 müzik ölçülen TAVANI aşıyor', dosya: MUSIC,
    bul: '  parca.tavan * Math.min(1, Math.max(0, seviye));',
    koy: '  Math.min(1, Math.max(0, seviye));',
    kusur: 'müzik dokuz olay sesini örter — ölçümün tek kuralı delinir' },
  { ad: 'M14 slider tavanın üstüne çıkabiliyor', dosya: MUSIC,
    bul: '  parca.tavan * Math.min(1, Math.max(0, seviye));',
    koy: '  parca.tavan * Math.max(0, seviye);',
    kusur: 'bozuk bir ayar değeri tavanı katlar' },
  { ad: 'M15 tavan sayısı sessizce büyüyor', dosya: MUSIC,
    bul: '  tavan: 0.0759,',
    koy: '  tavan: 0.3,',
    kusur: 'ölçülen −22,4 dB koda yanlış geçer' },
  { ad: 'M16 ayar değişmese de arka uca yazılıyor', dosya: MUSIC,
    bul: '      if (oncekiAktif === aktif && oncekiSes === ses) return;',
    koy: '      if (false) return;',
    kusur: 'her karede WebAudio kazanç yazması — gereksiz trafik' },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/ses-seviye-s9.test.ts', 'tests/ses.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false;
  } catch {
    return true;
  }
}

console.log('S9 seviye + müzik bekçisi — mutasyon doğrulaması\n');
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
