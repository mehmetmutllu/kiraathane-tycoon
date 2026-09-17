/**
 * mutasyon-responsive-d131.mjs — `tests/responsive-canli.test.ts` BEKÇİSİNİ DOĞRULAR.
 *
 * NEDEN: yeşil test tek başına hiçbir şey kanıtlamaz — hiçbir şeyi denetlemeyen bir test de
 * yeşildir. D-084 §"kesilmez": bekçi en az iki MUTASYONLA doğrulanır. Burada dört mutasyon var
 * ve her biri D-131'in gerçek bir kırılma biçimini taklit ediyor:
 *
 *   M1  sınıf yeniden adlandırılır, medya sorgusu güncellenmez  → ÖLÜ KOD (fc061a0'nın ta kendisi)
 *   M2  kural index.css'in medya sorgusuna yazılır              → SESSİZCE EZİLİR (kaynak sırası)
 *   M3  eşik telefon portresini içine alacak şekilde düşürülür  → PORTREYİ BOZAR
 *   M4  `display: contents` düşer                               → Görevler/Hedefler iki sütuna girmez
 *
 * Her mutasyon uygulanır, test koşulur, dosya GERİ ALINIR. Test o mutasyonda kırılmıyorsa
 * bekçi o kırılma biçimini görmüyor demektir ve araç kırmızı döner.
 *
 * Koşu: node tools/mutasyon-responsive-d131.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HUD = path.join(KOK, 'src/components/ui/hud.css');
const IDX = path.join(KOK, 'src/index.css');

const MUTASYONLAR = [
  {
    id: 'M1',
    ad: 'sinif yeniden adlandirildi, medya sorgusu guncellenmedi (OLU KOD)',
    dosya: HUD,
    uygula: (s) => s.replace(/(\@media \(min-width: 560px\) \{[\s\S]*?)\.botnav \{/, '$1.bottomnav {'),
  },
  {
    id: 'M2',
    ad: 'kural index.css medya sorgusuna yazildi (SESSIZCE EZILIR)',
    dosya: IDX,
    /* index.css'te artık responsive dal YOK (D-131'de hepsi hud.css'e taşındı), o yüzden
       mutasyon var olan bir bloğu bozmuyor — YENİDEN AÇIYOR. Taklit ettiği hata tam olarak bu:
       bir sonraki tur "responsive kuralı index.css'e yazayım" der ve kural sessizce ezilir. */
    uygula: (s) => s + '\n@media (max-width: 400px) {\n  .botnav {\n    left: 50%;\n  }\n}\n',
  },
  {
    id: 'M3',
    ad: 'esik telefon portresini icine aliyor (PORTREYI BOZAR)',
    dosya: HUD,
    uygula: (s) => s.replace('@media (min-width: 560px)', '@media (min-width: 320px)'),
  },
  {
    id: 'M4',
    ad: 'display:contents dustu (Gorevler/Hedefler iki sutuna girmez)',
    dosya: HUD,
    uygula: (s) => s.replace(/\n\s*display: contents;/, '\n    display: block;'),
  },
];

function testKos() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/responsive-canli.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return { kirildi: false };
  } catch (e) {
    const cikti = String(e.stdout ?? '') + String(e.stderr ?? '');
    const satir = cikti.split('\n').find((l) => /×|FAIL/.test(l))?.trim() ?? '(ad okunamadi)';
    return { kirildi: true, satir };
  }
}

const taban = testKos();
if (taban.kirildi) {
  console.error('*** TABAN KIRMIZI — mutasyona gecilmez. Once testi duzelt.');
  console.error('   ', taban.satir);
  process.exit(1);
}
console.log('# MUTASYON DENETIMI — tests/responsive-canli.test.ts (D-131)');
console.log('');
console.log('  taban: TEMIZ (mutasyonsuz kosu yesil)');
console.log('');

let kacan = 0;
for (const m of MUTASYONLAR) {
  const orijinal = fs.readFileSync(m.dosya, 'utf8');
  const mutant = m.uygula(orijinal);
  if (mutant === orijinal) {
    console.log(`  ${m.id}  *** MUTASYON UYGULANAMADI (kalip tutmadi) — ${m.ad}`);
    kacan++;
    continue;
  }
  fs.writeFileSync(m.dosya, mutant);
  const s = testKos();
  fs.writeFileSync(m.dosya, orijinal);
  if (s.kirildi) {
    console.log(`  ${m.id}  YAKALANDI   ${m.ad}`);
    console.log(`        ${s.satir}`);
  } else {
    console.log(`  ${m.id}  *** KACTI *** ${m.ad}`);
    kacan++;
  }
}

console.log('');
if (kacan) {
  console.log(`SONUC: ${kacan} mutasyon KACTI — bekci bu kirilma bicimlerini gormuyor.`);
  process.exit(1);
}
console.log(`SONUC: ${MUTASYONLAR.length}/${MUTASYONLAR.length} mutasyon yakalandi — bekci gecerli.`);
