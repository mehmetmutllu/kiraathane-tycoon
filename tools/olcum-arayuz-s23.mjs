/**
 * olcum-arayuz-s23.mjs — S23 ÖLÇÜM: S19'un kalan GÖRSEL üçlüsü (K · E · O).
 *
 * NEDEN BU ÜÇÜ TEK ARAÇTA: üçü de aynı soruyu soruyor — **ekranda gerçekten ne çiziliyor?**
 * Üçünün de cevabı kaynak metinden YALANCI çıkar: panelin CSS'i tam ekran diyor ama içerik
 * ekranın yarısını boş bırakabilir; karakter paneli "önizleme" diyor ama içindeki gövde
 * salondakinden başka bir gövde olabilir; ok "OK_GENIS = 0,34" diyor ama çizilen üçgen o
 * bloktan geniş olabilir. Bu yüzden üç bölüm de ÇİZİLEN'den okur: DOM kutuları, canvas
 * pikselleri ve three sahnesinin kendi `Box3`ları.
 *
 * NE ÖLÇER
 *   §E doluluk  — 5 ekran × 2 kadraj (telefon 390×844 · masaüstü 1280×800). Kart kutusu,
 *                 gövdenin görünür yüksekliği, İÇERİĞİN kapladığı birleşik kutu, en büyük
 *                 boş dikey bant, kaydırma gerekiyor mu. "Ekranı tam ve düzgün kullansın"ın
 *                 sayısı bu: doluluk %'si ve boş bandın yeri.
 *   §K gövde    — karakter panelinin önizleme canvas'ı: kutusu, İÇİNDE çizilen silüetin
 *                 PİKSEL kutusu (arka plandan ayrıştırılarak) ve doluluğu — üç sekme için
 *                 ayrı. Yanında salonun KayActor'ünden okunan sayılar (üçgen · silüet · parça)
 *                 duruyor; fark böylece bir cümle değil bir tablo oluyor.
 *   §O ok       — işaretin GERÇEK sahnedeki parçaları (`ok-govde` · `ok-uc` · `parantez0..3` ·
 *                 `etiket`) dünya `Box3`larıyla ölçülür; okun ayrılmış bloğu, gerçek eni,
 *                 parantezlere ve yazıya kalan açıklık. Her işaret yarıçapı ayrı satır.
 *
 * ADLANDIRMA NOTU: §O'nun ölçebilmesi için `GroundMarker.tsx`teki mesh'lere `name` verildi.
 * Salt enstrümantasyon — geometri, konum, malzeme ve çizim sırası DEĞİŞMEDİ.
 *
 * Çıktı: `docs/olcum-arayuz-s23.json` (ham) + `docs/gorsel/ss/s23-*.png`.
 * Koşu:  node tools/olcum-arayuz-s23.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.UI_PORT ?? '', 10) || 5231;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });

/** Telefon kadrajı — arayüz burada yaşıyor. Masaüstü de ölçülür: kullanıcı PC'de de oynuyor. */
const KADRAJLAR = [
  { ad: 'telefon', width: 390, height: 844, mobil: true },
  { ad: 'masaustu', width: 1280, height: 800, mobil: false },
];

const EKRANLAR = [
  { ad: 'gorevler', tikla: '[data-testid="quests"]', panel: '[data-testid="quests-panel"]' },
  { ad: 'hedefler', tikla: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
  { ad: 'magaza', tikla: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
  { ad: 'karakter', tikla: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { ad: 'ayarlar', tikla: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
];

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const rapor = { damga: new Date().toISOString(), kip: 'tam', E: [], K: {}, O: null, hata: [] };

/** Panelleri açabilmek için oyunu ZENGİN ve PERSONELLİ hâle getirir — boş panel yanlış ölçer. */
async function sahneyiHazirla(sayfa) {
  await sayfa.waitForSelector('canvas', { timeout: 20000 });
  await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
  await sayfa.evaluate(() => window.__addMoney(5_000_000));
  await sayfa.evaluate(() => window.__advanceTime(120));
  await sayfa.waitForTimeout(900);
}

/**
 * İLERLEME İKİ EVREDE — ve bu ayrım ÖLÇÜMÜN KENDİ BULGUSU, süsleme değil.
 *
 * Tek adımda tam ilerleme denendi ve §E'nin 10 satırının 10'u birden düştü: masa pad'leri
 * tamamlanmış sayılınca alan açılış kaplaması geliyor ve ALT GEZİNMEYİ tıklanamaz yapıyor
 * (`page.click: Timeout` ×10). Yani panel ölçümü ile ok ölçümü aynı oyun hâlinde YAPILAMAZ.
 *
 * evre A (asgari) — yalnız personel tutulur. Garson/bulaşıkçı SEKMELERİ ancak tutulmuşsa
 *   çiziliyor (turu-5 m.7); §K'nın üç sekmesi için gereken en küçük hâl budur ve gezinme açık.
 * evre B (tam)    — yükseltme İŞARETLERİ kapılı: servis noktası `table2`, masa noktaları
 *   `table4` pad'ini ister (`economy.config.ts` upgradeRequires). Açılış hâlinde ekranda TEK
 *   BİR ok yoktur; ilk koşu bu yüzden §O'yu boş döndürdü. Bir masa ₺ tavanına çekilir ki 💎
 *   USTA noktası da (r = 0,60, aynı ok) ölçülebilsin.
 */
async function evreA_personel(sayfa) {
  return sayfa.evaluate(() => {
    const pads = new Set(window.__game().padsDone ?? []);
    pads.add('waiter');
    pads.add('dishwasher');
    window.__setState({ padsDone: [...pads] });
    return [...pads];
  });
}

async function evreB_isaretler(sayfa) {
  return sayfa.evaluate(() => {
    const pads = new Set(window.__game().padsDone ?? []);
    for (const p of ['table2', 'table3', 'table4']) pads.add(p);
    const seviyeler = Array.from({ length: 20 }, (_, i) => (i === 0 ? 4 : 1));
    window.__setState({ padsDone: [...pads], tables: 4, tableLevels: seviyeler, diamonds: 500 });
    return [...pads];
  });
}

// =============================================================================================
//  §E — PANEL DOLULUĞU. Kabuk zaten tam ekran (D-106); soru İÇERİĞİN o ekranı doldurup
//  doldurmadığı. Üç sayı ayrı tutulur: kart kutusu · içeriğin birleşik kutusu · en büyük boşluk.
// =============================================================================================
async function doluluk(sayfa, panelSec) {
  return sayfa.evaluate((sec) => {
    const panel = document.querySelector(sec);
    if (!panel) return null;
    const kart = panel.querySelector('.modal-card') ?? panel;
    const govde = panel.querySelector('.sheet-body');
    const kb = kart.getBoundingClientRect();
    const gb = govde ? govde.getBoundingClientRect() : kb;

    // İçeriğin GERÇEK kutusu: gövdenin YAPRAK çocuklarının birleşimi. Sarmalayıcı div'ler
    // gövde kadar uzun görünür (yükseklik %100 akar) ve doluluğu yalancı %100 yapar.
    const yapraklar = [...govde.querySelectorAll('*')].filter(
      (e) => e.children.length === 0 && e.getBoundingClientRect().height > 0,
    );
    let ust = Infinity, alt = -Infinity, sol = Infinity, sag = -Infinity;
    const bantlar = [];
    for (const e of yapraklar) {
      const r = e.getBoundingClientRect();
      if (r.height <= 0 || r.width <= 0) continue;
      ust = Math.min(ust, r.top); alt = Math.max(alt, r.bottom);
      sol = Math.min(sol, r.left); sag = Math.max(sag, r.right);
      bantlar.push([r.top, r.bottom]);
    }
    // Canvas yaprak sayılmaz (çocuğu yok ama İÇİ dolu) — ayrıca eklenir.
    for (const c of govde.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      ust = Math.min(ust, r.top); alt = Math.max(alt, r.bottom);
      sol = Math.min(sol, r.left); sag = Math.max(sag, r.right);
      bantlar.push([r.top, r.bottom]);
    }
    if (!Number.isFinite(ust)) return null;

    // En büyük boş dikey bant: kaplanmış aralıkları birleştirip aradaki en geniş deliği bul.
    bantlar.sort((a, b) => a[0] - b[0]);
    const birlesik = [];
    for (const [a, b] of bantlar) {
      const son = birlesik[birlesik.length - 1];
      if (son && a <= son[1] + 0.5) son[1] = Math.max(son[1], b);
      else birlesik.push([a, b]);
    }
    let bosluk = 0, bosNerede = null;
    for (let i = 1; i < birlesik.length; i++) {
      const d = birlesik[i][0] - birlesik[i - 1][1];
      if (d > bosluk) { bosluk = d; bosNerede = Math.round(birlesik[i - 1][1]); }
    }
    // Gövdenin altında kalan kuyruk da boşluktur (içerik bitti, ekran devam ediyor).
    const kuyruk = Math.max(0, gb.bottom - alt);

    return {
      ekranW: innerWidth, ekranH: innerHeight,
      kart: { w: Math.round(kb.width), h: Math.round(kb.height), x: Math.round(kb.left) },
      govde: { w: Math.round(gb.width), h: Math.round(gb.height) },
      icerik: {
        w: Math.round(sag - sol), h: Math.round(alt - ust),
        solPay: Math.round(sol - gb.left), sagPay: Math.round(gb.right - sag),
      },
      kaydirma: { icerik: govde.scrollHeight, gorunur: govde.clientHeight },
      enBuyukBosluk: Math.round(bosluk), boslukNerede: bosNerede,
      altKuyruk: Math.round(kuyruk),
      yatayDoluluk: +((sag - sol) / innerWidth).toFixed(3),
      dikeyDoluluk: +((alt - ust) / gb.height).toFixed(3),
      kartDoluluk: +(kb.width / innerWidth).toFixed(3),
    };
  }, panelSec);
}

// =============================================================================================
//  §K — ÖNİZLEME GÖVDESİ. Canvas'ın İÇİNDE çizilen silüet piksel piksel bulunur.
//
//  NEDEN KARE ÜZERİNDEN, canvas'ı doğrudan okuyarak DEĞİL: önizleme `PREVIEW_GL` ile kuruluyor
//  ve orada `preserveDrawingBuffer` YOK — `drawImage(canvas)` kare sunulduktan sonra BOŞ verir
//  (ilk koşuda üç sekmenin üçü de `bos: true` döndü). Ölçüm uğruna uygulamanın GL ayarını
//  değiştirmek ölçülen şeyi değiştirmek olurdu; onun yerine Playwright'ın bileşik karesi
//  alınıp piksel çözümlemesi o karede yapılıyor.
// =============================================================================================
async function silueti(sayfa) {
  // Kutu değil TUVALİN KENDİSİ ölçülür: `.char-canvas` sarmalayıcısının kendi kenarlığı ve
  // yuvarlak köşeleri var, o pikseller kroma zemine uymuyor ve silüet kutusunu ekranın tamamına
  // şişiriyordu (düzeltme öncesi üç sekmede de kutu 724×280'in tamamıydı).
  const kutu = await sayfa.locator('[data-testid="char-panel"] .char-canvas canvas').first();
  if (!(await kutu.count())) return null;
  // KROMA ZEMİN — ölçüm süresince, sonra geri alınır. Önizleme kutusunun kendi zemini MOR bir
  // degrade; köşe örneklemesiyle "arka plan" tahmini degradede çöküyor ve silüet doluluk %100
  // çıkıyordu (ilk düzeltmede birebir bu oldu: üç sekme de 1,000). WebGL tuvali saydam olduğu
  // için altına düz bir renk koymak silüeti KESİN ayırır. DOM'da geçici; kaynak dosya değişmez.
  await sayfa.evaluate(() => {
    const el = document.querySelector('[data-testid="char-panel"] .char-canvas canvas');
    el.dataset.eskiStil = el.getAttribute('style') ?? '';
    el.style.background = '#00ff00';
  });
  await sayfa.waitForTimeout(250);
  const png = await kutu.screenshot();
  if (process.env.S23_AYIKLA) writeFileSync(path.join(SS, `_s23-kroma-${Date.now()}.png`), png);
  const olculer = await kutu.boundingBox();
  await sayfa.evaluate(() => {
    const el = document.querySelector('[data-testid="char-panel"] .char-canvas canvas');
    el.setAttribute('style', el.dataset.eskiStil);
    delete el.dataset.eskiStil;
  });
  return sayfa.evaluate(async ({ b64, kut }) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const g = document.createElement('canvas');
    g.width = bmp.width; g.height = bmp.height;
    const ctx = g.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const W = g.width, H = g.height;
    const { data } = ctx.getImageData(0, 0, W, H);
    const px = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    // Kroma zemin: saf yeşil. Yeşilden yeterince ayrılan her piksel ÇİZİM'dir.
    const zemin = [0, 255, 0];
    const ayri = (p) => Math.abs(p[0] - zemin[0]) + Math.abs(p[1] - zemin[1]) + Math.abs(p[2] - zemin[2]) > 90;
    // SATIR/SÜTUN DOLULUĞU ile kutu — tek piksellik kutu yerine. Gerekçe ölçümün kendi kazası:
    // ham en-büyük/en-küçük ile kutu üç sekmede de tuvalin TAMAMI çıktı (712×268), çünkü tuvalin
    // kenarında kroma zemine uymayan tek tek pikseller var (kenar yumuşatma). Bir satır ancak
    // içinde yeterli çizim pikseli varsa silüete dahil edilir; eşik genişliğin %1'i (en az 3).
    // KENAR ŞERİDİ ATILIR. Tuval sarmalayıcının yuvarlak köşesiyle kırpılıyor, o yüzden karenin
    // dış çeperinde MOR bir şerit kalıyor ve bu şerit her satır ile her sütuna kroma-dışı piksel
    // koyuyordu — kutu üç sekmede de tuvalin tamamı çıkıyordu. Pay kısa kenarın %5'i (13 px).
    const kenar = Math.round(Math.min(W, H) * 0.05);
    const satirSayi = new Array(H).fill(0);
    const sutunSayi = new Array(W).fill(0);
    let adet = 0;
    for (let y = kenar; y < H - kenar; y++) for (let x = kenar; x < W - kenar; x++) {
      if (!ayri(px(x, y))) continue;
      adet++; satirSayi[y]++; sutunSayi[x]++;
    }
    if (!adet) return { kutu: { w: Math.round(kut.width), h: Math.round(kut.height) }, bos: true, zemin };
    const esikY = Math.max(3, Math.round(W * 0.01));
    const esikX = Math.max(3, Math.round(H * 0.01));
    const ilk = (a, e) => a.findIndex((v) => v >= e);
    const son = (a, e) => { for (let i = a.length - 1; i >= 0; i--) if (a[i] >= e) return i; return -1; };
    const ust = ilk(satirSayi, esikY), alt = son(satirSayi, esikY);
    const sol = ilk(sutunSayi, esikX), sag = son(sutunSayi, esikX);
    if (ust < 0 || sol < 0) return { kutu: { w: Math.round(kut.width), h: Math.round(kut.height) }, bos: true, zemin };
    return {
      kutu: { w: Math.round(kut.width), h: Math.round(kut.height) },
      karePx: { w: W, h: H }, kenarPayi: kenar,
      siluetPx: { w: sag - sol + 1, h: alt - ust + 1, ust, alt, sol, sag },
      // Silüet önizleme kutusunun ne kadarını dolduruyor — "kutu boşuna mı duruyor" sayısı.
      dikeyDoluluk: +((alt - ust + 1) / H).toFixed(3),
      yatayDoluluk: +((sag - sol + 1) / W).toFixed(3),
      // Kenara DAYANIYORSA kadraj gövdeyi kırpıyor demektir.
      // Kırpık = silüet çözümleme alanının kenarına DAYANMIŞ (kadraj gövdeyi kesiyor).
      kirpik: { ust: ust <= kenar + 1, alt: alt >= H - kenar - 2, sol: sol <= kenar + 1, sag: sag >= W - kenar - 2 },
      pikselOran: +(adet / (W * H)).toFixed(4),
      // Silüetin dikey ORTASI kutunun neresinde — 0,5 ortalı, altına kayarsa baş boşlukta kalır.
      merkezY: +(((ust + alt) / 2) / H).toFixed(3),
    };
  }, { b64: png.toString('base64'), kut: olculer });
}

/**
 * Salondaki GERÇEK personel gövdesi — panelde gösterilenle karşılaştırma satırı.
 * Rol başına ayrılır (`KAY_MODEL`: owner→Ranger · waiter→Knight · dishwasher→Rogue ·
 * kitchenHand→Barbarian), çünkü panelin üç sekmesi bu üç gövdeyi gösterecek ve turun sorusu
 * "bedeli ne" — toplam üçgen değil ROL BAŞINA üçgen o sorunun cevabı.
 */
async function salonGovdesi(sayfa) {
  return sayfa.evaluate(() => {
    const t = window.__three;
    if (!t) return { hata: '__three yok (DEV değil)' };
    const ROL = { Ranger: 'owner', Knight: 'waiter', Rogue: 'dishwasher', Barbarian: 'kitchenHand' };
    const rol = {};
    let toplam = 0, mesh = 0;
    t.scene.traverse((n) => {
      if (!n.isSkinnedMesh) return;
      const ucgen = (n.geometry.index ? n.geometry.index.count : n.geometry.attributes.position.count) / 3;
      toplam += ucgen; mesh++;
      const govde = Object.keys(ROL).find((k) => n.name.startsWith(k + '_'));
      if (!govde) return;
      const r = (rol[ROL[govde]] ??= { govde, mesh: 0, ucgen: 0, parca: [] });
      r.mesh++; r.ucgen += ucgen;
      if (!r.parca.includes(n.name)) r.parca.push(n.name);
    });
    for (const k of Object.keys(rol)) rol[k].ucgen = Math.round(rol[k].ucgen);
    return { skinnedMesh: mesh, ucgenToplam: Math.round(toplam), rol };
  });
}

/**
 * PANELİN KAYNAKTAKİ GÖVDESİ. Piksel kanıtı "panelde başka bir adam duruyor" diyor; bu bölüm
 * o cümlenin KAYNAKTAKİ karşılığını damgalar — panel hangi bileşeni çiziyor, salon hangisini.
 * Kaynak metni okur, yeniden yazmaz: iddia tek satırlık bir import'tur ve doğrulanabilir.
 */
function panelKaynagi(okuKok) {
  const oku = (y) => readFileSync(path.join(okuKok, y), 'utf8');
  const panel = oku('src/components/ui/CharacterPanel.tsx');
  const sahne = oku('src/components/three/Player.tsx');
  const bul = (m, re) => (m.match(re) ?? []).length;
  return {
    panelImport: (panel.match(/import\s*\{[^}]*\}\s*from\s*'\.\.\/three\/Player'/) ?? ['—'])[0].replace(/\s+/g, ' '),
    panelKayActorKullaniyor: /KayActor/.test(panel),
    panelOwnerBodyKullaniyor: /<OwnerBody[\s/>]/.test(panel),
    panelKapsulOnizleme: bul(panel, /capsuleGeometry/g),
    sahneKayActorKullaniyor: /KayActor/.test(sahne),
    /**
     * KİMLİK İŞARETLERİ — panelin çaycısı ile oyunun çaycısı aynı kişi mi?
     * Oyunun cevabı `KAY_KIYAFET.owner` satırında yazılı; panelinki `OwnerBody`nin çizdiği
     * parçalarda. İkisi yan yana konur: iddia "panelde başka bir adam var" değil, DÖRT
     * işaretin kaçının tuttuğu olur.
     */
    kimlik: (() => {
      const govde = (sahne.match(/export function OwnerBody[\s\S]*?\n}/) ?? [''])[0];
      const cfg = oku('src/config/actor.ts');
      const ownerSatir = (cfg.match(/^\s*owner:\s*\{[^}]*\}/m) ?? [''])[0];
      const oyunda = (ad) => new RegExp(ad + ':\\s*true').test(ownerSatir);
      return {
        ownerSatir: ownerSatir.replace(/\s+/g, ' ').trim(),
        kasket: { panelde: /kasket/i.test(govde), oyunda: oyunda('kasket') },
        onluk: { panelde: /PALETTE\.apron/.test(govde), oyunda: oyunda('onluk') },
        havlu: { panelde: /havlu/i.test(govde), oyunda: oyunda('havlu') },
        sivaliKol: { panelde: /siva/i.test(govde), oyunda: oyunda('sivaliKol') },
      };
    })(),
  };
}

// =============================================================================================
//  §O — OK. Sahnedeki her yükseltme işareti gezilir. ÖNEMLİ: kutu (AABB) burada YETMEZ —
//  parantez bir L'dir ve AABB'si L'nin BOŞ iç köşesini de kaplar, yani kutu "çakıştı" derken
//  ekranda çakışma olmayabilir (ilk koşuda birebir bu oldu: dördü de "çakışıyor" çıktı).
//  Bu yüzden açıklık ÜÇGEN ÜÇGENE ölçülür: iki mesh'in gerçek üçgenleri zemin düzlemine
//  (x,z) indirilir ve aralarındaki en küçük mesafe hesaplanır. Ölçü birimi işaretin KENDİ
//  yarıçapı (r) — küçük ve büyük işaret aynı satırda karşılaştırılabilsin.
// =============================================================================================
async function okOlc(sayfa) {
  return sayfa.evaluate(() => {
    const t = window.__three;
    if (!t) return { hata: '__three yok' };

    /** Dünya AABB'si — sayfa bağlamına `three` import edilemiyor (bare specifier). */
    const dunyaKutusu = (kok) => {
      let mnx = Infinity, mny = Infinity, mnz = Infinity;
      let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
      kok.updateWorldMatrix(true, true);
      kok.traverse((n) => {
        const g = n.geometry;
        if (!n.isMesh || !g) return;
        if (!g.boundingBox) g.computeBoundingBox();
        const b = g.boundingBox;
        if (!b || !Number.isFinite(b.min.x)) return;
        const e = n.matrixWorld.elements;
        for (const cx of [b.min.x, b.max.x]) for (const cy of [b.min.y, b.max.y]) for (const cz of [b.min.z, b.max.z]) {
          const x = e[0] * cx + e[4] * cy + e[8] * cz + e[12];
          const y = e[1] * cx + e[5] * cy + e[9] * cz + e[13];
          const z = e[2] * cx + e[6] * cy + e[10] * cz + e[14];
          if (x < mnx) mnx = x; if (x > mxx) mxx = x;
          if (y < mny) mny = y; if (y > mxy) mxy = y;
          if (z < mnz) mnz = z; if (z > mxz) mxz = z;
        }
      });
      return Number.isFinite(mnx) ? { min: { x: mnx, y: mny, z: mnz }, max: { x: mxx, y: mxy, z: mxz } } : null;
    };

    /** Mesh'in üçgenleri, dünya uzayında ve zemin düzlemine indirilmiş: [[x,z]×3, ...]. */
    const ucgenler = (mesh) => {
      const g = mesh.geometry;
      if (!g?.attributes?.position) return [];
      mesh.updateWorldMatrix(true, false);
      const e = mesh.matrixWorld.elements;
      const pos = g.attributes.position;
      const idx = g.index ? g.index.array : null;
      const say = idx ? idx.length : pos.count;
      const nokta = (i) => {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        return [e[0] * x + e[4] * y + e[8] * z + e[12], e[2] * x + e[6] * y + e[10] * z + e[14]];
      };
      const out = [];
      for (let i = 0; i + 2 < say; i += 3) {
        out.push([nokta(idx ? idx[i] : i), nokta(idx ? idx[i + 1] : i + 1), nokta(idx ? idx[i + 2] : i + 2)]);
      }
      return out;
    };

    const nokUzak = (p, a, b) => {
      const vx = b[0] - a[0], vy = b[1] - a[1];
      const uzun = vx * vx + vy * vy;
      const s = uzun === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / uzun));
      return Math.hypot(p[0] - (a[0] + s * vx), p[1] - (a[1] + s * vy));
    };
    const icinde = (p, tri) => {
      const isaret = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
      const d1 = isaret(p, tri[0], tri[1]), d2 = isaret(p, tri[1], tri[2]), d3 = isaret(p, tri[2], tri[0]);
      const eksi = d1 < 0 || d2 < 0 || d3 < 0, arti = d1 > 0 || d2 > 0 || d3 > 0;
      return !(eksi && arti);
    };
    /** İki üçgen kümesi arasındaki en küçük mesafe; kesişiyorlarsa 0. */
    const kumeUzak = (A, B) => {
      let en = Infinity;
      for (const t1 of A) for (const t2 of B) {
        for (const p of t1) if (icinde(p, t2)) return 0;
        for (const p of t2) if (icinde(p, t1)) return 0;
        for (const p of t1) for (let i = 0; i < 3; i++) en = Math.min(en, nokUzak(p, t2[i], t2[(i + 1) % 3]));
        for (const p of t2) for (let i = 0; i < 3; i++) en = Math.min(en, nokUzak(p, t1[i], t1[(i + 1) % 3]));
      }
      return en;
    };

    // "Konuşan" katman uzaktayken görünmez (TEXT_ON) — ölçüm için geçici olarak AÇILIR.
    const gizliler = [];
    t.scene.traverse((n) => {
      if (n.name === 'ok-govde' || n.name === 'ok-uc' || n.name === 'etiket') {
        let p = n.parent;
        while (p) { if (p.visible === false) { gizliler.push(p); p.visible = true; } p = p.parent; }
      }
    });
    t.scene.updateMatrixWorld(true);

    const satirlar = [];
    t.scene.traverse((kok) => {
      if (!kok.name?.startsWith('isaret:')) return;
      const o = kok.userData?.olcum;
      if (!o?.arrow) return;
      let govde = null, uc = null, etiket = null;
      const parantez = [];
      kok.traverse((n) => {
        if (n.name === 'ok-govde') govde = n;
        else if (n.name === 'ok-uc') uc = n;
        else if (n.name === 'etiket') etiket = n;
        else if (n.name?.startsWith('parantez')) parantez.push(n);
      });
      if (!govde || !uc) return;
      const bg = dunyaKutusu(govde), bu = dunyaKutusu(uc), be = etiket ? dunyaKutusu(etiket) : null;
      if (!bg || !bu) return;
      const r = o.r;
      const okSol = Math.min(bg.min.x, bu.min.x);
      const okSag = Math.max(bg.max.x, bu.max.x);
      const cerceveSol = kok.position.x - o.hw;

      const okTri = [...ucgenler(govde), ...ucgenler(uc)];
      let enYakin = Infinity, hangi = null;
      for (let i = 0; i < parantez.length; i++) {
        const d = kumeUzak(okTri, ucgenler(parantez[i]));
        if (d < enYakin) { enYakin = d; hangi = parantez[i].name; }
      }

      satirlar.push({
        etiketAdi: o.label, r: +r.toFixed(3), hw: +o.hw.toFixed(4),
        okGercekEn_r: +((okSag - okSol) / r).toFixed(4),
        ucEn_r: +((bu.max.x - bu.min.x) / r).toFixed(4),
        govdeEn_r: +((bg.max.x - bg.min.x) / r).toFixed(4),
        solPay_r: +((okSol - cerceveSol) / r).toFixed(4),
        yaziVar: !!etiket,
        yaziKutusu: be ? { solX: +be.min.x.toFixed(4), sagX: +be.max.x.toFixed(4) } : null,
        yaziyaAciklik_r: be ? +((be.min.x - okSag) / r).toFixed(4) : null,
        parantezAciklik_r: Number.isFinite(enYakin) ? +(enYakin / r).toFixed(4) : null,
        parantezAciklik_br: Number.isFinite(enYakin) ? +enYakin.toFixed(4) : null,
        enYakinParantez: hangi,
        okDikeyEn_r: +((Math.max(bg.max.z, bu.max.z) - Math.min(bg.min.z, bu.min.z)) / r).toFixed(4),
      });
    });
    for (const p of gizliler) p.visible = false;
    return { isaret: satirlar.length, satirlar };
  });
}

// =============================================================================================
//  KOŞU
// =============================================================================================
for (const kadraj of KADRAJLAR) {
  const sayfa = await tarayici.newPage({
    viewport: { width: kadraj.width, height: kadraj.height },
    deviceScaleFactor: 2, isMobile: kadraj.mobil, hasTouch: kadraj.mobil,
  });
  const hatalar = [];
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
  await sahneyiHazirla(sayfa);
  await evreA_personel(sayfa);
  await sayfa.waitForTimeout(500);

  for (const ek of EKRANLAR) {
    try {
      await sayfa.click(ek.tikla, { timeout: 8000 });
      await sayfa.waitForSelector(ek.panel, { timeout: 8000 });
      await sayfa.waitForTimeout(700);
      const d = await doluluk(sayfa, ek.panel);
      rapor.E.push({ kadraj: kadraj.ad, ekran: ek.ad, ...d });
      if (ek.ad === 'karakter') {
        await sayfa.screenshot({ path: path.join(SS, `s23-karakter-${kadraj.ad}.png`) });
        if (kadraj.mobil) {
          for (const sekme of ['player', 'waiter', 'dish']) {
            const sec = `[data-testid="char-tab-${sekme}"]`;
            if (await sayfa.locator(sec).count()) {
              await sayfa.click(sec);
              await sayfa.waitForTimeout(1200);
            }
            rapor.K[sekme] = await silueti(sayfa);
            await sayfa.screenshot({ path: path.join(SS, `s23-karakter-${sekme}.png`) });
          }
          await sayfa.click('[data-testid="char-tab-player"]').catch(() => {});
        }
      } else if (kadraj.mobil) {
        await sayfa.screenshot({ path: path.join(SS, `s23-panel-${ek.ad}.png`) });
      }
      await sayfa.click('.sheet-back', { timeout: 5000 });
      await sayfa.waitForTimeout(400);
    } catch (e) {
      rapor.hata.push(`${kadraj.ad}/${ek.ad}: ${e.message.split('\n')[0]}`);
      await sayfa.keyboard.press('Escape').catch(() => {});
    }
  }

  if (kadraj.mobil) {
    rapor.K.salon = await salonGovdesi(sayfa);
    rapor.K.kaynak = panelKaynagi(KOK);
    // EVRE B — panel ölçümü bittikten SONRA; sırası bu yüzden kilitli (yukarıdaki gerekçe).
    await evreB_isaretler(sayfa);
    // Oyuncu NÖTR noktaya alınır. Gerekçe ölçümün kendi kazası: masa 1 ₺ tavanına çekilince
    // oyuncu USTA noktasının üstünde kalıyor, bekleme doluyor ve modal açılıyor; modal açıkken
    // işaretler çizilmiyor ve §O sessizce SIFIR satır döndürüyordu (bir koşu 5, sonraki 0).
    await sayfa.evaluate(() => { window.__teleport(-8.5, 13.4); });
    await sayfa.waitForTimeout(1200);
    await sayfa.locator('.usta-card button, .modal-card button').first().click({ timeout: 2000 }).catch(() => {});
    await sayfa.waitForTimeout(1200);
    rapor.O = await okOlc(sayfa);
    if (!rapor.O?.isaret) rapor.hata.push('§O: ekranda ok taşiyan isaret bulunamadi — olcum GECERSIZ');
    await sayfa.screenshot({ path: path.join(SS, 's23-oyun.png') });
  }
  rapor.hata.push(...hatalar.slice(0, 5).map((h) => `${kadraj.ad}/konsol: ${h.slice(0, 160)}`));
  await sayfa.close();
}

await tarayici.close();
sunucu.kill();

writeFileSync(path.join(KOK, 'docs', 'olcum-arayuz-s23.json'), JSON.stringify(rapor, null, 1), 'utf8');

// ── İNSAN-OKUNUR HAM ÇIKTI ───────────────────────────────────────────────────────────────────
// Rapora yalnız buradan sayı girer; JSON makine için, bu dosya okuyan için. Damga zorunlu:
// hangi koşunun sayısı olduğu belli olmayan bir satır rapora giremez (D-084 koşu kipi).
const sat = [];
const y = (s = '') => sat.push(s);
const n = (v, g = 3) => (v == null ? '  —' : Number(v).toFixed(g));
y('S23 ÖLÇÜM — arayüz: karakter menüsü (K) · panel doluluğu (E) · yükseltme oku (O)');
y(`damga: ${rapor.damga} · kip: TAM · hata: ${rapor.hata.length}`);
y('araç: tools/olcum-arayuz-s23.mjs · ham: docs/olcum-arayuz-s23.json');
y('');
y('§E — PANEL DOLULUĞU (kabuk zaten tam ekran; ölçülen İÇERİĞİN ekranı doldurması)');
y('kadraj   ekran     kart(w@x)  govdeH icerikH  dikDol  yatDol kartDol enBosluk altKuyruk solPay sagPay kaydirma');
for (const e of rapor.E) {
  y([
    e.kadraj.padEnd(8), e.ekran.padEnd(9), `${e.kart.w}@${e.kart.x}`.padEnd(10),
    String(e.govde.h).padStart(6), String(e.icerik.h).padStart(7),
    n(e.dikeyDoluluk).padStart(7), n(e.yatayDoluluk).padStart(7), n(e.kartDoluluk).padStart(7),
    String(e.enBuyukBosluk).padStart(8), String(e.altKuyruk).padStart(9),
    String(e.icerik.solPay).padStart(6), String(e.icerik.sagPay).padStart(6),
    `${e.kaydirma.icerik}/${e.kaydirma.gorunur}`.padStart(9),
  ].join(' '));
}
y('');
y('§K — ÖNİZLEME GÖVDESİ (kroma zeminli karede piksel silüeti; kutu 356×134 CSS)');
y('sekme    siluet(px)  dikDol  yatDol merkezY  altKirpik');
for (const k of ['player', 'waiter', 'dish']) {
  const v = rapor.K[k];
  if (!v || v.bos) { y(`${k.padEnd(8)} — okunamadi`); continue; }
  y([k.padEnd(8), `${v.siluetPx.w}x${v.siluetPx.h}`.padEnd(11),
    n(v.dikeyDoluluk).padStart(7), n(v.yatayDoluluk).padStart(7), n(v.merkezY).padStart(7),
    String(v.kirpik.alt).padStart(10)].join(' '));
}
y('');
y('§K — SALONDAKİ GERÇEK GÖVDE (rol başına bedel; panelin geçeceği gövde budur)');
for (const [rol, v] of Object.entries(rapor.K.salon?.rol ?? {})) {
  y(`  ${rol.padEnd(12)} ${v.govde.padEnd(10)} mesh ${String(v.mesh).padStart(2)} · ucgen ${String(v.ucgen).padStart(5)}`);
}
y(`  TOPLAM sahnede: ${rapor.K.salon?.skinnedMesh} skinned mesh · ${rapor.K.salon?.ucgenToplam} ucgen`);
y('');
y('§K — KİMLİK: panelin çaycısı ile oyunun çaycısı (kaynak okundu, yeniden yazılmadı)');
y(`  panel import : ${rapor.K.kaynak?.panelImport}`);
y(`  panel KayActor kullaniyor mu : ${rapor.K.kaynak?.panelKayActorKullaniyor} · salon: ${rapor.K.kaynak?.sahneKayActorKullaniyor}`);
y(`  panelde kapsul onizleme sayisi: ${rapor.K.kaynak?.panelKapsulOnizleme}`);
y(`  oyunun satiri: ${rapor.K.kaynak?.kimlik?.ownerSatir}`);
y('  isaret        panelde  oyunda  tutuyor mu');
for (const [ad, v] of Object.entries(rapor.K.kaynak?.kimlik ?? {})) {
  if (ad === 'ownerSatir') continue;
  y(`  ${ad.padEnd(13)} ${String(v.panelde).padEnd(8)} ${String(v.oyunda).padEnd(7)} ${v.panelde === v.oyunda ? 'EVET' : 'HAYIR'}`);
}
y('');
y('§O — YÜKSELTME OKU (gerçek sahne, üçgen üçgene; ölçü birimi işaretin kendi r yarıçapı)');
y('  kaynaktaki ayrilan blok: OK_GENIS 0,340 r · OK_BOSLUK 0,160 r · KENAR_PAYI 0,180 r');
y('etiket    r      okEn_r  ucEn_r govdeEn_r solPay_r yaziAcik_r parantezAcik_r  (br)   enYakin');
for (const s of rapor.O?.satirlar ?? []) {
  y([s.etiketAdi.padEnd(9), n(s.r, 2).padStart(5),
    n(s.okGercekEn_r).padStart(7), n(s.ucEn_r).padStart(7), n(s.govdeEn_r).padStart(9),
    n(s.solPay_r).padStart(8), n(s.yaziyaAciklik_r).padStart(10), n(s.parantezAciklik_r).padStart(14),
    n(s.parantezAciklik_br, 4).padStart(7), String(s.enYakinParantez).padStart(11)].join(' '));
}
y('');
for (const h of rapor.hata) y(`! ${h}`);
writeFileSync(path.join(KOK, 'docs', 'olcum-arayuz-s23.txt'), sat.join('\n') + '\n', 'utf8');

console.log(`E satiri: ${rapor.E.length} · K sekmesi: ${Object.keys(rapor.K).length} · O isareti: ${rapor.O?.isaret ?? '—'} · hata: ${rapor.hata.length}`);
for (const h of rapor.hata) console.log('  ! ' + h);
process.exit(0);
