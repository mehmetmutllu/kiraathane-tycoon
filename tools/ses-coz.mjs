/**
 * ses-coz.mjs — `.ogg` DOSYALARINI TARAYICININ KENDİ ÇÖZÜCÜSÜYLE PCM'e ÇEVİRİR (S17).
 *
 * NEDEN TARAYICI: bu makinede `ffmpeg` YOK (S17'de ölçüldü) ve Node'un yerleşik bir Vorbis
 * çözücüsü de yok. Üçüncü parti bir npm çözücü eklemek mümkündü ama YANLIŞ olurdu: oyun bu
 * dosyaları `AudioContext.decodeAudioData` ile çözüyor (`src/game/audioWeb.ts`). Ölçüm başka
 * bir çözücü kullansaydı, "ölçülen ses" ile "duyulan ses" yine ayrışırdı — E4'ün tam da
 * düzelttiği kusur (`audio.ts` karar 4). Playwright zaten projenin devDependency'si; Chromium'un
 * çözücüsü oyunun çözücüsüdür.
 *
 * ÇIKTI: `<hedef>/<ad>.f32` (little-endian Float32, MONO, 44100 Hz) + `<hedef>/index.json`.
 * Ham PCM repoya girmez (`indirilen/` .gitignore'da) — araç yeniden üretir.
 *
 * Kullanım:
 *   node tools/ses-coz.mjs <liste.json> <hedef-klasör>
 *   liste.json:  [{ "ad": "coin_handleCoins", "yol": "indirilen/kenney_rpg-audio/Audio/handleCoins.ogg" }]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ORNEKLEME = 44100;

const [listeYolu, hedef] = process.argv.slice(2);
if (!listeYolu || !hedef) {
  console.error('kullanım: node tools/ses-coz.mjs <liste.json> <hedef-klasör>');
  process.exit(1);
}
const liste = JSON.parse(readFileSync(listeYolu, 'utf8'));
mkdirSync(hedef, { recursive: true });

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage();
await sayfa.goto('about:blank');

const index = [];
let hata = 0;

for (const { ad, yol } of liste) {
  let b64;
  try {
    b64 = readFileSync(yol).toString('base64');
  } catch {
    console.error(`  ! dosya yok: ${yol}`);
    hata++;
    continue;
  }

  const sonuc = await sayfa.evaluate(async ([veri, hz]) => {
    const ikili = Uint8Array.from(atob(veri), (c) => c.charCodeAt(0));
    // OfflineAudioContext SABİT 44100'de kurulur: Chromium çözerken kaynağın hızı ne olursa olsun
    // buna yeniden örnekler. Böylece bütün adaylar sentezle AYNI hızda karşılaştırılır — metrik
    // spektrogramda `ORNEKLEME`yi sabit varsayıyor (`ses-metrik.ts`).
    const ctx = new OfflineAudioContext(1, hz, hz);
    const tampon = await ctx.decodeAudioData(ikili.buffer);
    // MONO'ya indir: kanalların ortalaması. Kenney dosyaları çoğunlukla zaten mono.
    const n = tampon.length;
    const cikti = new Float32Array(n);
    for (let k = 0; k < tampon.numberOfChannels; k++) {
      const kan = tampon.getChannelData(k);
      for (let i = 0; i < n; i++) cikti[i] += kan[i] / tampon.numberOfChannels;
    }
    const bayt = new Uint8Array(cikti.buffer);
    let s = '';
    for (let i = 0; i < bayt.length; i += 8192) {
      s += String.fromCharCode.apply(null, bayt.subarray(i, i + 8192));
    }
    return {
      b64: btoa(s),
      kanal: tampon.numberOfChannels,
      kaynakHz: tampon.sampleRate,
      uzunluk: n,
    };
  }, [b64, ORNEKLEME]);

  const cikti = path.join(hedef, `${ad}.f32`);
  writeFileSync(cikti, Buffer.from(sonuc.b64, 'base64'));
  index.push({
    ad,
    yol,
    uzunluk: sonuc.uzunluk,
    sure: sonuc.uzunluk / ORNEKLEME,
    kanal: sonuc.kanal,
    kaynakHz: sonuc.kaynakHz,
    bayt: readFileSync(yol).length,
  });
  console.log(`  ${ad.padEnd(26)} ${(sonuc.uzunluk / ORNEKLEME).toFixed(3)} sn  ${sonuc.kanal}ch @${sonuc.kaynakHz}`);
}

await tarayici.close();
writeFileSync(path.join(hedef, 'index.json'), JSON.stringify(index, null, 2));
console.log(`\n${index.length}/${liste.length} çözüldü → ${hedef}  (hata ${hata})`);
if (hata > 0) process.exit(1);
