/**
 * mutasyon-serit-g1.mjs — G1 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Bu turda mesele daha da keskin: korunan şey bir fonksiyonun doğruluğu değil,
 * bir KARARIN silinemezliği. Görev tebriği 2026-09-09'da kaldırılmıştı ve `f4b1a52`de tek bir
 * `if` silinerek sessizce geri geldi. Buradaki mutasyonlar tam o silmeyi (ve akrabalarını)
 * kaynağa geri koyar: bekçi kırmızı yanmıyorsa karar yine silinebilir demektir.
 *
 * Satır sonları normalize edilir (`.gitattributes` S24'te eklendi ama araç tahmin yapmaz).
 *
 * Kullanım: node tools/mutasyon-serit-g1.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const RULES = 'src/game/rules.ts';
const TICK = 'src/game/tick.ts';
const HUD = 'src/components/ui/HUD.tsx';
const CSS = 'src/components/ui/hud.css';
const KOK_CSS = 'src/index.css';
const CFG = 'src/config/economy.config.ts';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  // --- TEBRİK TEK YERDE (G-41 · G-43) --------------------------------------------------------
  {
    ad: 'M1 f4b1a52 aynen tekrar: HUD kapısı siliniyor',
    dosya: HUD, bul: '{toastCizilir(notice) && (', koy: '{notice && (',
    kusur: 'görev tebriği yeniden çizilir — kullanıcının iki kez bildirdiği 2,20 sn örtüşme geri gelir',
  },
  {
    ad: 'M2 çizilen tür listesine "quest" geri giriyor',
    dosya: RULES,
    bul: "export const CIZILEN_TOAST: readonly GameNotice['kind'][] = ['level', 'reveal'];",
    koy: "export const CIZILEN_TOAST: readonly GameNotice['kind'][] = ['quest', 'level', 'reveal'];",
    kusur: 'kapı yerinde durur ama içinden geçirir — "kod var, karar yok" hâli',
  },
  {
    ad: 'M3 kapı HER ŞEYİ kapatıyor (aşırı düzeltme)',
    dosya: RULES,
    bul: "export const CIZILEN_TOAST: readonly GameNotice['kind'][] = ['level', 'reveal'];",
    koy: "export const CIZILEN_TOAST: readonly GameNotice['kind'][] = [];",
    kusur: 'seviye atlama ve yeni-özellik toast\'ları da susar — kullanıcının görmek istediği iki şey',
  },
  {
    ad: 'M4 kapı listeyi yok sayıyor (her bildirim çizilir)',
    dosya: RULES,
    bul: '  n != null && CIZILEN_TOAST.includes(n.kind);',
    koy: '  n != null;',
    kusur: 'liste süs olur; tür ayrımı ortadan kalkar ve tebrik geri gelir',
  },
  {
    ad: 'M5 tick olayı hiç üretmiyor (yanlış katmanda düzeltme)',
    dosya: TICK,
    bul: "      enqueueNotice({ text: C.quests[questIndex].title, ttl: 3.5, kind: 'quest', reward: qReward > 0 ? qReward : undefined });",
    koy: '      void 0;',
    kusur: 'sunum kararı mantığa taşınır; olayı dinleyen her şey sessizce kırılır (E3/D-096 deseni bozulur)',
  },

  // --- KAMERA GEÇİŞ KAPISI (G-44) -------------------------------------------------------------
  {
    ad: 'M6 geçiş kapısı kalkıyor (pan yine erken)',
    dosya: TICK,
    bul: '  if (questPhase !== \'active\' && c.camIstek && c.camIstek.prio !== 2) {',
    koy: '  if (false) {',
    kusur: 'alan açılışının panı bitişin kendi tick\'inde atılır — ölçülen −1,30 sn geri gelir',
  },
  {
    ad: 'M7 kapı panı ERTELEMİYOR, SİLİYOR',
    dosya: TICK, bul: '    c.camBekleyen = c.camIstek;', koy: '    c.camBekleyen = null;',
    kusur: '"orada yeni bir dünya var" panı tamamen kaybolur — kullanıcının 2026-06-09 isteği silinir',
  },
  {
    ad: 'M8 bekleyen odak hiç salınmıyor',
    dosya: TICK,
    bul: '    requestFocus(bekleyen.pos, bekleyen.prio);',
    koy: '    void bekleyen;',
    kusur: 'pan sıraya girer ve orada kalır; yeni salon hiç gösterilmez',
  },
  {
    ad: 'M9 kapı GÖREV panını da erteliyor (prio 2 istisnası kalkıyor)',
    dosya: TICK, bul: 'c.camIstek.prio !== 2', koy: 'true',
    kusur: 'yeni görevin kendi panı bir tur gecikir; ölçümdeki 0,00 sn sapma bozulur',
  },
  {
    ad: 'M10 kapı bu tick\'in odağını geri almıyor',
    dosya: TICK, bul: '    c.camFocus = s.camFocus;', koy: '    void s.camFocus;',
    kusur: 'istek beklemeye alınır ama kamera yine de kayar — kapı görünürde var, işlevde yok',
  },

  // --- BANT BİÇİMİ (G-42 + kullanıcının gri şikâyeti) -----------------------------------------
  {
    ad: 'M11 bant sabit yüksekliğe dönüyor',
    dosya: CSS, bul: '  min-height: 58px;', koy: '  height: 58px;',
    kusur: 'içerik 54 px isterken kutu 52 px kalır — yazı yine üstten kesilir',
  },
  {
    ad: 'M12 bandın üst/alt boşluğu sıfırlanıyor',
    dosya: CSS, bul: '  padding: 6px 10px 6px 8px;', koy: '  padding: 0 10px 0 8px;',
    kusur: 'lakap üst kenara yapışır — kullanıcı: "o kadar üste yapışık olmasın"',
  },
  {
    ad: 'M13 gri iç parlama geri geliyor',
    dosya: CSS, bul: '  box-shadow: var(--k3duz);', koy: '  box-shadow: var(--k3);',
    kusur: 'bandın üstünde gri şerit belirir ve yeşil tamamlanma kenarıyla çarpışır',
  },
  {
    ad: 'M14 düz gölge tokenına inset sızıyor',
    dosya: KOK_CSS,
    bul: '  --k3duz: 0 5px 0 var(--ot), 0 10px 18px rgba(0, 0, 0, 0.3);',
    koy: '  --k3duz: inset 0 3px 0 rgba(255, 255, 255, 0.5), 0 5px 0 var(--ot), 0 10px 18px rgba(0, 0, 0, 0.3);',
    kusur: 'ad "düz" kalır, gri geri gelir — en sinsi hâli, çünkü bant CSS\'i doğru görünür',
  },
  {
    ad: 'M15 kırpılan başlık geri uzuyor',
    dosya: CFG, bul: "title: '4 masayı Seviye 4 yap'", koy: "title: 'Salonun 4 masasını Seviye 4 yap'",
    kusur: 'telefon portresinde 32 px üç noktayla kırpılır (ölçülen tek vaka)',
  },
];

const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/gorev-seridi-g1.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('G1 bekçisi — mutasyon doğrulaması\n');
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
