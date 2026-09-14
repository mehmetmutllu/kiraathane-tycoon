/**
 * ses-disari.ts — SES KATALOĞUNU DİNLENEBİLİR HÂLE GETİRİR (WAV).
 *
 * NEDEN VAR: D-096 sesleri ölçtü ve "36 çiftin 35'i ayrı" dedi — sayı doğruydu ama kimse o
 * sesleri karar anında DUYAMIYORDU. Kullanıcı 2026-09-10'da bunu şöyle söyledi:
 * *"panodaki seslere çok ısınmadım"* ve sonra *"şu anki ses çok kötü"*. Yani ses, tarayıcıda
 * oyunu açmadan dinlenemediği için, bir karar paketinde hiç dinlenmemişti.
 *
 * Bu araç `audioSynth.seslendir()`in ürettiği TAM TAMPONU WAV'a yazar — ölçülen şeyle duyulan
 * şey aynı kalsın diye (D-096 §6'nın kuralı). Çıkan dosyalar bir karar panosuna gömülüp
 * aday hazır kayıtlarla yan yana dinletilebilir.
 *
 * Kullanım: npx tsx tools/ses-disari.ts <hedef-klasör>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, type SesId } from '../src/game/audio';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth';
import { seriKarisim, wav } from './ses-taslak.ts';

// WAV yazici `tools/ses-taslak.ts`te (S17): pano ve olcum de ayni yaziciyi kullaniyor.

const hedef = process.argv[2];
if (!hedef) {
  console.error('kullanım: npx tsx tools/ses-disari.ts <hedef-klasör>');
  process.exit(1);
}
mkdirSync(hedef, { recursive: true });

let toplam = 0;
for (const id of Object.keys(SES_KATALOG) as SesId[]) {
  const buf = wav(seslendir(SES_KATALOG[id].katmanlar));
  writeFileSync(path.join(hedef, `${id}.wav`), buf);
  toplam += buf.length;
  console.log(`${id.padEnd(10)} ${(buf.length / 1024).toFixed(1).padStart(7)} KB`);
}

/**
 * SERİ İVMESİ ÖRNEĞİ — kullanıcının istediği şey ("fazla para topladıkça ses de ivme almalı")
 * bugün KODDA YOK; burada yalnız DİNLETİLİR, katalog değişmez. Beş toplama, her biri bir
 * basamak (yarım ton) yukarıda. Karar paketinde "olan" ile "olabilecek" yan yana duysun diye.
 */
// S17: karışım artık `ses-taslak.ts`te — ölçüm (§5b) ve dinleme panosu AYNI tamponu kullanıyor.
const seriBuf = wav(seriKarisim(SES_KATALOG.coin.katmanlar, 1, 4).karisim);
writeFileSync(path.join(hedef, 'coin_seri_basamakli.wav'), seriBuf);

// Karşılaştırma: bugünkü hâl — beş toplama, hepsi AYNI perdede (basamak 0, tavan 0).
writeFileSync(path.join(hedef, 'coin_seri_duz.wav'),
  wav(seriKarisim(SES_KATALOG.coin.katmanlar, 0, 0).karisim));

console.log(`\n${Object.keys(SES_KATALOG).length} ses + 2 seri örneği · toplam ${((toplam + seriBuf.length * 2) / 1024).toFixed(0)} KB → ${hedef}`);
