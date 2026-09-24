/**
 * mutasyon-tabela-f4c3.mjs — F4c-3 tabela + kafe adı bekçisinin MUTASYON SINAVI (D-156).
 *
 * Tabelanın yerine, yazı sığdırmaya, ad temizliğine, kayda ve ekran sırasına bilerek kusur sokulur;
 * `tests/tabela-f4c3.test.ts` düşmelidir. Gövde `mutasyon-dekor-f4c2.mjs`ten (zaman aşımı artık yakalama sayılmaz).
 *
 * Koşu:  node tools/mutasyon-tabela-f4c3.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/tabela-f4c3.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 tabela eski hatta', dosya: 'src/components/three/streetLook.ts',
    bul: '  z: STREET_Z0 + 0.45,', koy: '  z: STREET_Z0 + 0.33,', ne: 'tabela lento/kordonun arkasina duser, yazinin yarisi ortulur (B4)' },
  { ad: 'M2 tabela eski boyda', dosya: 'src/components/three/streetLook.ts',
    bul: '  h: 0.55,', koy: '  h: 0.34,', ne: 'alinlik dolmaz, harf 7,7 px (B5)' },
  { ad: 'M3 yazi enden sinirlanmaz', dosya: 'src/components/three/streetLook.ts',
    bul: '  return Math.min(boydan, enden);', koy: '  return boydan;', ne: 'uzun ad levhadan tasar' },
  { ad: 'M4 20 harf siniri yok', dosya: 'src/game/kafeAdi.ts',
    bul: "  return Array.from(tek).slice(0, KAFE_ADI_MAX).join('').trim();", koy: '  return tek;', ne: 'uzun ad tabelada okunmaz hale gelir' },
  { ad: 'M5 Turkce buyuk harf yok', dosya: 'src/game/kafeAdi.ts',
    bul: ".toLocaleUpperCase('tr')", koy: '.toUpperCase()', ne: 'KAHVESI yazar (i noktasiz)' },
  { ad: 'M6 bos ad bos kalir', dosya: 'src/game/store.ts',
    bul: '    set({ kafeAdi: kafeAdiTemizle(ad) || KAFE_ADI_VARSAYILAN });', koy: '    set({ kafeAdi: kafeAdiTemizle(ad) });', ne: 'bos tabela; kutu da bir daha acilmaz' },
  { ad: 'M7 ad kayda girmez', dosya: 'src/game/store.ts',
    bul: '    kafeAdi: s.kafeAdi,\n', koy: '', ne: 'ad her acilista yeniden sorulur' },
  { ad: 'M8 eski kayda sorulmaz', dosya: 'src/game/kafeAdi.ts',
    bul: "(typeof ham === 'string' ? kafeAdiTemizle(ham) || KAFE_ADI_VARSAYILAN : null)", koy: "(typeof ham === 'string' ? kafeAdiTemizle(ham) || KAFE_ADI_VARSAYILAN : KAFE_ADI_VARSAYILAN)", ne: 'guncellemeden sonra oyuncu adini hic secemez' },
  { ad: 'M9 cevrimdisi once gelir', dosya: 'src/game/ekranKanali.ts',
    bul: "  if (g.kafeAdiSorulacak) return 'kafe-adi';\n  if (g.cevrimdisiVar) return 'cevrimdisi';\n", koy: "  if (g.cevrimdisiVar) return 'cevrimdisi';\n  if (g.kafeAdiSorulacak) return 'kafe-adi';\n", ne: 'ad kutusu kazanc ekraninin arkasinda bekler' },
  { ad: 'M10 splash kafe adini yazar', dosya: 'src/components/ui/SplashScreen.tsx',
    bul: '{OYUN_ADI}', koy: 'Köşe Kıraathanesi', ne: 'yukleniyor ekraninda oyunun adi yok' },
  { ad: 'M11 tabela sabit yazi', dosya: 'src/components/three/Tabela.tsx',
    bul: '  const metin = tabelaYazisi(kafeAdi);', koy: "  const metin = tabelaYazisi(null) || String(kafeAdi);", ne: 'tabela oyuncunun adini gostermez' },
];

const dosyalar = [...new Set(MUTASYONLAR.map((m) => m.dosya))];
const asil = new Map();
const crlf = new Map();
for (const d of dosyalar) {
  const ham = readFileSync(path.join(KOK, d), 'utf8');
  crlf.set(d, ham.includes('\r\n'));
  asil.set(d, ham.replace(/\r\n/g, '\n'));
}
const yaz = (d, metin) => writeFileSync(path.join(KOK, d), crlf.get(d) ? metin.replace(/\n/g, '\r\n') : metin, 'utf8');
const hepsiniGeriYaz = () => { for (const d of dosyalar) yaz(d, asil.get(d)); };

// KIRLI BASLANGIC KORUMASI (gerekce `mutasyon-izdiham-t6.mjs`): askida kalmis bir onceki kosu
// dosyayi mutasyonlu birakmissa sinav KOSMAZ.
const kirli = MUTASYONLAR.filter((m) => m.koy && asil.get(m.dosya).includes(m.koy) && !asil.get(m.dosya).includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad} (${m.dosya})`);
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;
console.log('=== F4c-3 tabela + kafe adi bekcisi — mutasyon sinavi ===');
console.log('');
try {
  for (const m of MUTASYONLAR) {
    const govde = asil.get(m.dosya);
    if (!govde.includes(m.bul)) {
      console.log(`?? ${m.ad}: KALIP BULUNAMADI (${m.dosya})`);
      bulunamayan++;
      continue;
    }
    yaz(m.dosya, govde.replace(m.bul, m.koy));
    let dustu = false;
    try {
      execFileSync(path.join(KOK, 'node_modules', '.bin', 'vitest'), ['run', ...TESTLER], { cwd: KOK, stdio: 'pipe', shell: true, timeout: 400_000 });
    } catch (e) {
      // Zaman asimi YAKALAMA sayilmaz (yavas makinede sahte "OK" uretiyordu) — bulunamayan gibi sayilir.
      if (e.signal || e.killed) {
        yaz(m.dosya, govde);
        console.log(`?? ${m.ad}: ZAMAN ASIMI`);
        bulunamayan++;
        continue;
      }
      dustu = true;
    }
    yaz(m.dosya, govde);
    console.log(`${dustu ? 'OK ' : '!! '}${m.ad} -> ${dustu ? 'bekci YAKALADI' : 'bekci KACIRDI'}`);
    console.log(`    ${m.ne}`);
    if (!dustu) kacan++;
  }
} finally {
  hepsiniGeriYaz();
}

console.log('');
console.log(`${MUTASYONLAR.length - kacan - bulunamayan}/${MUTASYONLAR.length} mutasyon yakalandi.`);
if (kacan || bulunamayan) {
  console.error('!! SINAV TEMIZ DEGIL — kacan mutasyon ya da bulunamayan kalip var.');
  process.exitCode = 1;
}
