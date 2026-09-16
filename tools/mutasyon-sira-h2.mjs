/**
 * mutasyon-sira-h2.mjs — H2 / D-124 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Her mutasyon kaynakta D-124'ün kapattığı kusurlardan birini GERİ GETİRİR:
 * kapıyı alan kapısına döndürmek · "başladığını bitir" sırasını bozmak · tavan kelepçesini
 * kaldırmak · alan kapısını atlamak · tick'i eski "bütün masaları tara" döngüsüne çevirmek ·
 * Scene'i kuralı yok saymaya zorlamak · bildirimi yine alanın ilk masasına sabitlemek.
 * Bekçi o mutasyonda kırmızı yanmıyorsa o kolun bekçisi yoktur ve araç "KAÇTI" diye basar.
 *
 * Satır sonları normalize edilir (`.gitattributes` S24'te eklendi ama araç tahmin yapmaz).
 *
 * Kullanım: node tools/mutasyon-sira-h2.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const RULES = 'src/game/rules.ts';
const TICK = 'src/game/tick.ts';
const SCENE = 'src/components/three/Scene.tsx';

const HEDEF_GOVDE = `export function tableUpgradeTarget(g: GateState): number | null {
  const levels = g.tableLevels ?? [];
  const max = tableSoftMaxLevel();
  let elDegmemis: number | null = null;
  for (let i = 0; i < g.tables; i++) {
    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;
    const lv = levels[i] ?? 0;
    if (lv >= max) continue;
    if (lv > 0) return i; // yarım kalan: "başladığını bitir" (en küçük indeks)
    if (elDegmemis == null) elDegmemis = i;
  }
  return elDegmemis;
}`;

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- KURAL: tek hedef ----------------------------------------------------------------------
  {
    ad: 'M1 kural D-124 ÖNCESİNE dönüyor (alan kapısı, hepsi canlı)',
    dosya: RULES, bul: HEDEF_GOVDE,
    koy: `export function tableUpgradeTarget(g: GateState): number | null {
  const levels = g.tableLevels ?? [];
  const max = tableSoftMaxLevel();
  for (let i = 0; i < g.tables; i++) {
    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;
    if ((levels[i] ?? 0) >= max) continue;
    return i;
  }
  return null;
}`,
    kusur: 'yarım masa atlanır; "en küçük indeks" kuralı sırayı dağıtır (eski serbest sıra)',
  },
  {
    ad: 'M2 "başladığını bitir" kalkıyor (yarım masa öncelik kaybediyor)',
    dosya: RULES, bul: '    if (lv > 0) return i; // yarım kalan: "başladığını bitir" (en küçük indeks)',
    koy: '    if (false) return i;',
    kusur: 'sıra hep en küçük indeksi hedefler; yarım bırakılmış masalar birikir',
  },
  {
    ad: 'M3 tavan kelepçesi kalkıyor',
    dosya: RULES, bul: '    if (lv >= max) continue;', koy: '    if (false) continue;',
    kusur: 'tavana varmış masa hedef kalır; sıra hiç ilerlemez, sonraki masa hiç açılmaz',
  },
  {
    ad: 'M4 ALAN kapısı atlanıyor',
    dosya: RULES, bul: '    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;',
    koy: '    if (false) continue;',
    kusur: 'kapısı kapalı salonun masası hedef olur — kilitli alan yükseltilebilir görünür',
  },
  {
    ad: 'M5 "yarım masa" ölçütü TAVANDAKİNİ de sayıyor',
    dosya: RULES, bul: '    if (lv > 0) return i; // yarım kalan: "başladığını bitir" (en küçük indeks)',
    koy: '    if (lv >= 0) return i;',
    kusur: 'el değmemiş masa da "yarım" sayılır; tercih sırası anlamını yitirir',
  },
  {
    ad: 'M6 hedef bulunamayınca 0 dönüyor (null yerine)',
    dosya: RULES, bul: '  return elDegmemis;\n}', koy: '  return elDegmemis ?? 0;\n}',
    kusur: 'her şey tavandayken bile hayalet nokta çizilir ve tetiklenir',
  },

  // --- TETİK: tick çizilenden türüyor mu -----------------------------------------------------
  {
    ad: 'M7 tick eski "bütün masaları tara" döngüsüne dönüyor',
    dosya: TICK,
    bul: `    const hedefMasa = tableUpgradeTarget(padGate);
    if (hedefMasa != null) {`,
    koy: `    const hedefMasa = ((): number | null => {
      for (let i = 0; i < tables; i++) if ((tableLevels[i] ?? 0) < tableSoftMaxLevel()) return i;
      return null;
    })();
    if (hedefMasa != null) {`,
    kusur: 'tetik çizilen noktadan koparılır: Scene tek nokta çizerken tick başka masayı tetikler',
  },
  {
    ad: 'M8 tetik hedefi yok sayıp ilk masaya sabitleniyor',
    dosya: TICK, bul: '    const hedefMasa = tableUpgradeTarget(padGate);',
    koy: '    const hedefMasa: number | null = 0;',
    kusur: 'sıra ilerlese de tetik hep 1. masada kalır — sonraki masalar satın alınamaz',
  },

  // --- ÇİZİM: Scene ---------------------------------------------------------------------------
  {
    ad: 'M9 Scene kuralı yok sayıp bütün masaları çiziyor',
    dosya: SCENE, bul: '        if (i !== hedefMasa) return null;',
    koy: '        if (hedefMasa == null) return null;',
    kusur: 'ekranda yine 12 nokta belirir; yalnız biri tetikler (görünen ≠ çalışan)',
  },
  {
    ad: 'M10 Scene gate\'e tableLevels vermeyi bırakıyor',
    dosya: SCENE,
    bul: '  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber(), tableLevels };',
    koy: '  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };',
    kusur: 'kural seviyeleri göremez; çizilen nokta hep 1. masada donar',
  },

  // --- BİLDİRİM / PAN -------------------------------------------------------------------------
  {
    ad: 'M11 bildirim yine ALANIN İLK masasına panlıyor',
    dosya: RULES,
    bul: '      out.push([`tableUp:${a}`, `Yeni: ${pre(a)}Masaları yükseltebilirsin 🪑`, LAYOUT.tables[hedefMasa].upgradeSpot]);',
    koy: '      out.push([`tableUp:${a}`, `Yeni: ${pre(a)}Masaları yükseltebilirsin 🪑`, LAYOUT.tables[areaTableStart(a)].upgradeSpot]);',
    kusur: 'kamera canlı olmayan bir masaya kayar — H1\'in kapattığı "pan yalanı" geri gelir',
  },
  {
    ad: 'M12 bildirim hedef yokken de çıkıyor',
    dosya: RULES, bul: '  if (hedefMasa != null) {', koy: '  if (true) {',
    kusur: 'her şey tavandayken bile "masaları yükseltebilirsin" toast\'ı atar',
  },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/sira-h2.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('H2 / D-124 bekçisi — mutasyon doğrulaması\n');
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
