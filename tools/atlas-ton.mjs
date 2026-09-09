/**
 * atlas-ton.mjs — KayKit atlasının BİR KOPYASINI kıraathane tonlarına boyar (S3 varyantı).
 *
 * NEDEN: KayKit restaurant-bits'in paleti bir "diner" paleti (turuncu tezgâh, nane yeşili
 * soğutucu, kırmızı fırın). Kıraathane ahşap/krem/bakır. Atlas 8×4 gözlü bir renk şeridi
 * olduğu için takas MODELE dokunmadan yapılabilir: yalnız gözün rengi değişir.
 *
 * Hangi gözün hangi modele gittiği ÖLÇÜLDÜ: `node tools/atlas-goz.mjs` (UV → göz eşlemesi).
 * Gözün dikey gradyanı KORUNUR: piksel, gözün ortalama parlaklığına göre oranlanır, hedef renk
 * o oranla çarpılır — yani form ve gölge kalır, yalnız ton döner.
 *
 * Kullanım: node tools/atlas-ton.mjs <girdi.png> <cikti.png>
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

/** göz "satır,sütun" → hedef hex. Ölçülen kullanım: [3,6] tezgâh · [1,1] fırın/ocak · [1,2] soğutucu. */
export const TONLAR = {
  '3,6': '#a9713f', // turuncu tezgâh → ahşap tezgâh (kıraathane tablası)
  '1,1': '#6d4c41', // kırmızı gövde → koyu lambri kahvesi
  '1,2': '#cbb994', // nane yeşili soğutucu → krem (eski buzdolabı)
};

const [girdi, cikti] = process.argv.slice(2);
const b64 = readFileSync(girdi).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
const veri = await page.evaluate(
  async ({ b64, tonlar }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    const gw = c.width / 8;
    const gh = c.height / 4;
    for (const [k, hex] of Object.entries(tonlar)) {
      const [r, s] = k.split(',').map(Number);
      const n = parseInt(hex.slice(1), 16);
      const hedef = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      const x0 = s * gw, y0 = r * gh;
      // 1) gözün ortalama parlaklığı
      let top = 0, adet = 0;
      for (let y = y0; y < y0 + gh; y++)
        for (let x = x0; x < x0 + gw; x++) {
          const i = (y * c.width + x) * 4;
          top += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          adet++;
        }
      const ort = top / adet;
      // 2) her piksel: kendi parlaklığının ortalamaya oranıyla hedefi çarp
      for (let y = y0; y < y0 + gh; y++)
        for (let x = x0; x < x0 + gw; x++) {
          const i = (y * c.width + x) * 4;
          const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const k2 = ort > 0 ? l / ort : 1;
          d[i] = Math.min(255, hedef[0] * k2);
          d[i + 1] = Math.min(255, hedef[1] * k2);
          d[i + 2] = Math.min(255, hedef[2] * k2);
        }
    }
    ctx.putImageData(id, 0, 0);
    return c.toDataURL('image/png');
  },
  { b64, tonlar: TONLAR },
);
await browser.close();
writeFileSync(cikti, Buffer.from(veri.split(',')[1], 'base64'));
console.log('yazildi:', cikti, Object.keys(TONLAR).join(' '));
