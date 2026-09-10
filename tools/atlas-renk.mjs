/**
 * atlas-renk.mjs — KayKit atlasındaki 8×4 gözün GERÇEK rengini ölçer.
 *
 * NEDEN: `atlas-goz.mjs` (S3) bir modelin hangi göze baktığını söylüyordu ama o gözün NE RENK
 * olduğunu söylemiyordu — renk seçimi paketin tanıtım görseline bakıp tahmin etmeye kalıyordu.
 * S4'te bu bir kez ısırdı: "kahve zemin" istendi, göz tahminle seçildi ve yüksek kontrastlı
 * kahve/krem dama çıktı; oysa istenen birbirine YAKIN iki kahveydi (derzli düz karo görünümü).
 * Artık göz sayıyla seçiliyor.
 *
 * BAĞIMLILIK YOK: PNG node'un kendi `zlib`iyle çözülür (pngjs kurulu değil ve tek bir doku
 * okumak için paket eklemeye değmez). Desteklenen: 8-bit, renk tipi 2 (RGB) / 6 (RGBA),
 * interlace yok — KayKit atlaslarının hepsi böyle.
 *
 * Kullanım:
 *   node tools/atlas-renk.mjs                       # restaurant-bits
 *   node tools/atlas-renk.mjs kaykit-furniture-bits
 *   node tools/atlas-renk.mjs kaykit-restaurant-bits --kahve   # yalnız kahve tonları
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const DOKU = {
  'kaykit-restaurant-bits': 'restaurantbits_texture.png',
  'kaykit-furniture-bits': 'furniturebits_texture.png',
  'kaykit-city-builder-bits': 'citybits_texture.png',
};

/** Minimal PNG çözücü → { w, h, px: Uint8Array (RGBA) }. */
export function pngOku(dosya) {
  const b = readFileSync(dosya);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG değil: ' + dosya);
  let off = 8;
  let ihdr = null;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const tip = b.toString('ascii', off + 4, off + 8);
    const veri = b.subarray(off + 8, off + 8 + len);
    if (tip === 'IHDR')
      ihdr = {
        w: veri.readUInt32BE(0),
        h: veri.readUInt32BE(4),
        derinlik: veri[8],
        renkTipi: veri[9],
        interlace: veri[12],
      };
    else if (tip === 'IDAT') idat.push(veri);
    else if (tip === 'IEND') break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error('IHDR yok');
  if (ihdr.derinlik !== 8 || ihdr.interlace !== 0 || ![2, 6].includes(ihdr.renkTipi))
    throw new Error(`desteklenmeyen PNG: derinlik ${ihdr.derinlik} tip ${ihdr.renkTipi} interlace ${ihdr.interlace}`);
  const kanal = ihdr.renkTipi === 6 ? 4 : 3;
  const ham = inflateSync(Buffer.concat(idat));
  const satirBayt = ihdr.w * kanal;
  const px = new Uint8Array(ihdr.w * ihdr.h * 4);
  const onceki = new Uint8Array(satirBayt);
  const simdi = new Uint8Array(satirBayt);
  let p = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const filtre = ham[p++];
    for (let i = 0; i < satirBayt; i++) {
      const x = ham[p + i];
      const a = i >= kanal ? simdi[i - kanal] : 0; // sol
      const c = onceki[i]; // üst
      const d = i >= kanal ? onceki[i - kanal] : 0; // sol-üst
      let v;
      switch (filtre) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + c; break;
        case 3: v = x + ((a + c) >> 1); break;
        case 4: {
          // Paeth
          const pp = a + c - d;
          const pa = Math.abs(pp - a), pb = Math.abs(pp - c), pc = Math.abs(pp - d);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? c : d);
          break;
        }
        default: throw new Error('bilinmeyen filtre ' + filtre);
      }
      simdi[i] = v & 0xff;
    }
    p += satirBayt;
    for (let x = 0; x < ihdr.w; x++) {
      const s = x * kanal;
      const t = (y * ihdr.w + x) * 4;
      px[t] = simdi[s];
      px[t + 1] = simdi[s + 1];
      px[t + 2] = simdi[s + 2];
      px[t + 3] = kanal === 4 ? simdi[s + 3] : 255;
    }
    onceki.set(simdi);
  }
  return { w: ihdr.w, h: ihdr.h, px };
}

const N = 8;
const M = 4;
const hx = (v) => Math.round(v).toString(16).padStart(2, '0');
const hex = (r, g, b) => `#${hx(r)}${hx(g)}${hx(b)}`;

/** Gözün ortalama rengi + üst/orta/alt örnekleri (KayKit gözleri dikey gradyanlıdır). */
export function gozRenkleri(dosya) {
  const { w, h, px } = pngOku(dosya);
  const out = [];
  for (let r = 0; r < M; r++)
    for (let c = 0; c < N; c++) {
      const x0 = Math.floor((c * w) / N);
      const y0 = Math.floor((r * h) / M);
      const gw = Math.floor(w / N);
      const gh = Math.floor(h / M);
      // kenar payı bırak: gözlerin sınırında komşu renk sızıyor
      const pay = Math.max(1, Math.floor(gw * 0.15));
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = y0 + pay; y < y0 + gh - pay; y++)
        for (let x = x0 + pay; x < x0 + gw - pay; x++) {
          const i = (y * w + x) * 4;
          sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; n++;
        }
      const orn = (f) => {
        const i = ((y0 + Math.floor(gh * f)) * w + x0 + (gw >> 1)) * 4;
        return [px[i], px[i + 1], px[i + 2]];
      };
      out.push({ goz: [r, c], ort: [sr / n, sg / n, sb / n], ust: orn(0.15), alt: orn(0.85) });
    }
  return out;
}

/** Kabaca ton adı — insan gözüyle taramayı kolaylaştırır. */
function ton([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const doy = mx === 0 ? 0 : (mx - mn) / mx;
  if (doy < 0.14) return mx > 205 ? 'beyaz' : mx > 95 ? 'gri' : 'siyah';
  if (r > g && g > b) {
    if (mx < 120) return 'KOYU KAHVE';
    if (g / r > 0.72) return 'AÇIK KAHVE/TAN';
    return g / r > 0.55 ? 'KAHVE/KİREMİT' : 'TURUNCU/KIRMIZI';
  }
  if (g >= r && g > b) return 'yeşil';
  if (b > r && b > g) return 'mavi';
  return 'kırmızı/pembe';
}

// CLI bloğu — SADECE doğrudan çalıştırılınca. Guard'sızken bu dosyayı IMPORT eden her ölçüm
// aracının stdout'una 32 satırlık atlas dökümü karışıyordu (rapor çıktısı `>` ile dosyaya gider).
if (process.argv[1] && process.argv[1].endsWith('atlas-renk.mjs')) {
const paket = process.argv.find((a) => a.startsWith('kaykit-')) ?? 'kaykit-restaurant-bits';
const yalnizKahve = process.argv.includes('--kahve');
const dosya = `public/assets/models/${paket}/${DOKU[paket]}`;
const gozler = gozRenkleri(dosya);
console.log(`${dosya}`);
console.log('göz     ortalama   üst       alt        ton');
for (const g of gozler) {
  const t = ton(g.ort);
  if (yalnizKahve && !t.includes('KAHVE') && !t.includes('KİREMİT')) continue;
  console.log(
    `[${g.goz[0]},${g.goz[1]}]  ${hex(...g.ort)}    ${hex(...g.ust)}  ${hex(...g.alt)}   ${t}`,
  );
}
}
