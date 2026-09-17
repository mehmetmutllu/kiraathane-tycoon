/**
 * apk-temizle.mjs — assembleDebug'dan ÖNCE bayat APK'yı siler.
 *
 * NEDEN: gradle çıktı dosyasının üzerine yazarken onu KISALTMIYOR. F2 turunda (2026-09-16)
 * asset'lerin 11 MB'ı silindikten sonra `npm run apk` hâlâ **21,88 MB** raporladı; dosya
 * elle silinip yeniden üretilince gerçek boyut **11,84 MB** çıktı. Yani içeriğin 11,66 MB'ı
 * 21,88 MB'lik bir kabuğun içinde duruyordu ve aradaki 10 MB ölü boşluktu.
 *
 * Bu, yayın gününde yanlış okunacak türden sessiz bir kusur: mağaza için "APK ne kadar"
 * sorusuna 9 MB fazla cevap verilirdi ve küçültme çalışmaları boşa gider görünürdü.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/*
 * F1a EKİ: aynı tuzak AAB için de açıktı. Bundle çıktısı ayrı klasöre (`outputs/bundle`) yazılır
 * ve gradle onu da kısaltmadan üzerine yazar — yani mağazaya giden dosyanın boyutu da yanlış
 * okunabilirdi. Kusur bir kez debug APK'da görüldüğü için orada kapatılmıştı; kapatılan şey
 * dosya değil DAVRANIŞ olduğundan, aynı davranışın öteki çıktısı da alınır.
 */
const CIKTILAR = [
  path.join(KOK, 'android', 'app', 'build', 'outputs', 'apk'),
  path.join(KOK, 'android', 'app', 'build', 'outputs', 'bundle'),
];

let silinen = 0;
const gez = (d) => {
  if (!fs.existsSync(d)) return;
  for (const g of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, g.name);
    if (g.isDirectory()) gez(p);
    else if (g.name.endsWith('.apk') || g.name.endsWith('.aab')) { fs.rmSync(p); silinen++; }
  }
};
for (const d of CIKTILAR) gez(d);
console.log(`apk-temizle: ${silinen} bayat APK/AAB silindi`);
