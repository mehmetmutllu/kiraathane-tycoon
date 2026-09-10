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

/** Float32 [-1,1] → 16-bit PCM WAV. Tarayıcı hiçbir kütüphane olmadan çalar. */
function wav(ornekler: Float32Array, hz = ORNEKLEME): Buffer {
  const veri = Buffer.alloc(ornekler.length * 2);
  for (let i = 0; i < ornekler.length; i++) {
    const s = Math.max(-1, Math.min(1, ornekler[i]));
    veri.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const bas = Buffer.alloc(44);
  bas.write('RIFF', 0);
  bas.writeUInt32LE(36 + veri.length, 4);
  bas.write('WAVE', 8);
  bas.write('fmt ', 12);
  bas.writeUInt32LE(16, 16);          // fmt yığın boyu
  bas.writeUInt16LE(1, 20);           // PCM
  bas.writeUInt16LE(1, 22);           // mono
  bas.writeUInt32LE(hz, 24);
  bas.writeUInt32LE(hz * 2, 28);      // bayt/sn
  bas.writeUInt16LE(2, 32);           // blok hizası
  bas.writeUInt16LE(16, 34);          // bit derinliği
  bas.write('data', 36);
  bas.writeUInt32LE(veri.length, 40);
  return Buffer.concat([bas, veri]);
}

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
const YARIM_TON = 2 ** (1 / 12);
const seri: Float32Array[] = [];
for (let i = 0; i < 5; i++) {
  const k = SES_KATALOG.coin.katmanlar.map((x) => ({ ...x, hz: x.hz.map((f) => f * YARIM_TON ** i) }));
  seri.push(seslendir(k));
}
const ARA = Math.round(0.16 * ORNEKLEME);
const boy = ARA * (seri.length - 1) + seri[seri.length - 1].length;
const karisim = new Float32Array(boy);
seri.forEach((s, i) => { for (let j = 0; j < s.length; j++) karisim[i * ARA + j] += s[j]; });
for (let i = 0; i < boy; i++) karisim[i] = Math.tanh(karisim[i]);
const seriBuf = wav(karisim);
writeFileSync(path.join(hedef, 'coin_seri_basamakli.wav'), seriBuf);

// Karşılaştırma: bugünkü hâl — beş toplama, hepsi AYNI perdede.
const duz = new Float32Array(boy);
const tek = seslendir(SES_KATALOG.coin.katmanlar);
for (let i = 0; i < 5; i++) for (let j = 0; j < tek.length; j++) duz[i * ARA + j] += tek[j];
for (let i = 0; i < boy; i++) duz[i] = Math.tanh(duz[i]);
writeFileSync(path.join(hedef, 'coin_seri_duz.wav'), wav(duz));

console.log(`\n${Object.keys(SES_KATALOG).length} ses + 2 seri örneği · toplam ${((toplam + seriBuf.length * 2) / 1024).toFixed(0)} KB → ${hedef}`);
