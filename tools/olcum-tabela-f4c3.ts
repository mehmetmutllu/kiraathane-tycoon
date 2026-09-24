/**
 * olcum-tabela-f4c3.ts — F4c-3: giriş cephesi (tabela + tente) oyun kamerasında NE ZAMAN ve NE BOYDA görünüyor?
 *
 * ## Soru
 * Tabela adayları (C2 C4 C7 C8, `tools/vitrin-adaylari.html?sayfa=tabela`) cepheyi bir 💎 ürününe çeviriyor:
 * tente rengi + fırfır + alınlıktaki yazılı tabela. Ürünün değeri, oyuncunun onu GÖRMESİNE bağlı. Aday
 * karesi cepheyi tam karşıdan çiziyor; oyunun kamerası ise oyuncunun +z'sinde, 42° yukarıdan −z'ye bakıyor
 * ve cephe (z 17,5) kameranın ARKASINDA kalabiliyor. Bu araç şunları ölçer:
 *
 *  - **ekranda** : levhanın (35 × 40 örnek nokta) ekrana düşen payı.
 *  - **görünen** : ekranda, HUD kutusunun altında değil, lento/üst kordonun arkasında değil (kutular tarayıcıdan:
 *                  `tools/tabela-kadraj-f4c3.mjs` → `docs/gorsel/ss/f4c3-hud.json`).
 *  - **harf px** : yazının büyük harfinin ekrandaki boyu (CSS px). Harf, aday dokusunun oranlarıyla levhaya
 *                  sığan en büyük boydur — boy da en de sınırlar (oranlar tarayıcıda `measureText` ile ölçülür).
 *  - **okunur**  : yazı şeridinin (levha ortası, harf boyunda) ≥ %90'ı görünür ve büyük harf ≥ OKUNUR_PX.
 *  - **kollar**  : yazının geçeceği yüzey VARYANT olarak (K0 bugün … K5 fırfır) — kod yazılmadı, levha tanımı.
 *  - **ekran payı** : yüzeyin görünen alanı / ekran alanı — tabela, tente üst yüzü, fırfır ve toplamı (CEPHE;
 *                  renk adayları üçünü de boyuyor).
 *
 * "Hangi anda" sorusu için oyuncunun ZAMANI gerekir, tek bir konum değil: T9b'nin oyun botu
 * (`tools/tarama-botu-t9b.txt`, tarayıcıda koşuyordu) buraya taşındı; oyunun kendi `tick()`i başsız
 * koşar, bot gerçek `inputKeyboard` ile görev hattını oynar. Her saniye oyuncunun (ya da görev
 * odağının) konumu kaydedilir; kamera `CameraRig`'in aynı formülüyle kurulur ve izdüşüm oyunun KENDİ
 * `cameraView.izdusur`'u ile yapılır (tarayıcıdaki `__izdusur` ile aynı kod — damga karşılaştırır).
 *
 * Profiller: dikey telefon 390×844 · yatay telefon 844×390 · dikey tablet 820×1180 · dikey + uzaklaş.
 *
 * Koşu:  npx tsx tools/olcum-tabela-f4c3.ts                                      (kısa)
 *        OLCUM=tam npx tsx tools/olcum-tabela-f4c3.ts > docs/olcum-tabela-f4c3.txt
 * Önce:  node tools/tabela-kadraj-f4c3.mjs  (HUD kutuları + tarayıcı izdüşümü + kareler)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { KIP, KISA, kipBandi, damga, damgaOzeti, seedRandom, botDamgasi, yuzdelik } from './olcum-lib';
import { useGame, LAYOUT, servicePlace, visiblePads } from '../src/game/store';
import { questFocusPos, tableUpgradeTarget, gateOf } from '../src/game/rules';
import { getNavGrid, doorX } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';
import { economyConfig as C } from '../src/config/economy.config';
import { CAMERA_LOOK_Y } from '../src/config/actor';
import { CAMERA_FOCUS_MUL, CAMERA_FOV, CAMERA_ZOOM_OUT_MUL, cameraDistance } from '../src/config/camera';
import { cameraViewYaz, izdusur } from '../src/game/cameraView';
import { STREET_Z0, TABELA, TENTE } from '../src/components/three/streetLook';

const DT = 0.1;
const SURE_SN = KISA ? 20 * 60 : 6 * 3600;
const KAYIT_SN = KISA ? 1 : 2;
const OKUNUR_PX = 8;


// ---------------------------------------------------------------------------------------------
//  1) BOT — T9b oyun botunun node karşılığı (karar sırası birebir; `__game().padCost` → `visiblePads`)
// ---------------------------------------------------------------------------------------------
type V3 = readonly [number, number, number] | number[];
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;
const seatOf = (n: S) => {
  const t = LAYOUT.tables[n.tableIndex] as S;
  return (t.seats && t.seats[n.seatIndex]) || t.seat;
};

function decide(s: S): { pos: V3; why: string; stand: boolean } {
  const q = C.quests[s.questIndex] as S;
  const tgt = q ? q.target : null;
  const p = s.player;
  const place = servicePlace(s.areasOpen);
  const trayN = s.tray + s.trayFood;
  const dirtyN = s.carriedDirty + (s.carriedDirtyFood || 0);
  const waiting = s.npcs.filter((n: S) => n.state === 'waitingForTea');
  const off = [place.pickup[0] - place.station[0], 0, place.pickup[2] - place.station[2]];
  const k = 0.8;
  const dishFront = [place.dish[0] + off[0] * k, 0, place.dish[2] + off[2] * k];
  const pick = [place.station[0] + off[0] * k, 0, place.station[2] + off[2] * k];
  if (tgt && tgt.type === 'charStat') s.buyCharUpgrade(tgt.stat);
  if (tgt && tgt.type === 'waiterTray') s.buyWaiterTray();
  if (tgt && tgt.type === 'waiterSpeed') s.buyWaiterSpeed();
  let focus: V3 | null = q
    ? questFocusPos(tgt, s.tableLevels, s.tables, s.areasOpen, q.area ?? 0, tableUpgradeTarget(gateOf(s)))
    : null;
  if (tgt && (tgt.type === 'tableLevel' || tgt.type === 'tablesAtLevel')) {
    const lt = tableUpgradeTarget(gateOf(s));
    if (lt != null && LAYOUT.tables[lt]) focus = LAYOUT.tables[lt].upgradeSpot;
  }
  const standTypes = ['pad', 'stationLevel', 'lavaboLevel', 'tableLevel', 'tablesAtLevel'];
  if (focus && standTypes.includes(tgt.type) && trayN === 0 && dirtyN === 0) {
    const gate = {
      padsDone: s.padsDone, tables: s.tables, stationLevel: s.stationLevels[0], lifetime: s.lifetime.toNumber(),
      waiterServed: s.stats.waiterServed, waiterServedByService: s.stats.waiterServedByService, tableLevels: s.tableLevels,
    };
    const pad = visiblePads(s.questIndex, gate as never)[0];
    const cost = tgt.type === 'pad' && pad ? pad.cost : 0;
    if (tgt.type !== 'pad' || s.wallet.toNumber() >= cost) return { pos: focus, why: 'gorev:' + tgt.type, stand: true };
  }
  if (dirtyN > 0 && (trayN === 0 || waiting.length === 0)) return { pos: dishFront, why: 'bulasik-birak', stand: true };
  const ok = waiting.filter((n: S) => (n.product === 'tost' ? s.trayFood > 0 : s.tray > 0));
  if (trayN > 0 && ok.length) {
    const w = ok.slice().sort((a: S, b: S) => dist(seatOf(a), p) - dist(seatOf(b), p))[0];
    return { pos: LAYOUT.tables[w.tableIndex].table, why: 'servis', stand: false };
  }
  if (s.coins.length) {
    const c = s.coins.slice().sort((a: S, b: S) => dist(a.pos, p) - dist(b.pos, p))[0];
    return { pos: c.pos, why: 'para', stand: false };
  }
  if (waiting.length && trayN === 0) return { pos: pick, why: 'cay-al', stand: true };
  if (s.dishes.length && !s.dishwasher && trayN === 0) {
    const d = s.dishes.slice().sort((a: S, b: S) => dist(a.pos, p) - dist(b.pos, p))[0];
    return { pos: LAYOUT.tables[d.tableIndex].table, why: 'kirli-topla', stand: false };
  }
  if (focus) {
    const pos = tgt.type === 'pickupTea' || tgt.type === 'serveTea' ? pick : tgt.type === 'washDish' ? dishFront : focus;
    return { pos, why: 'gorev-bekle:' + tgt.type, stand: true };
  }
  return { pos: pick, why: 'bos', stand: true };
}

function steer(s: S, goal: V3): [number, number] {
  const dd = Math.hypot(goal[0] - s.player[0], goal[2] - s.player[2]);
  if (dd < 1e-6) return [0, 0];
  if (dd < 2.6) return [(goal[0] - s.player[0]) / dd, (goal[2] - s.player[2]) / dd];
  const grid = getNavGrid(s.tables, s.areasOpen);
  const path =
    findNavPath(grid, s.player, goal[0], goal[2], 0.35) ??
    findNavPath(grid, s.player, goal[0], goal[2], 0.9) ??
    findNavPath(grid, s.player, goal[0], goal[2], 1.25);
  let wp: V3 = goal;
  if (path && path.length) {
    for (const pt of path) {
      wp = [pt[0], 0, pt[1]];
      if (Math.hypot(pt[0] - s.player[0], pt[1] - s.player[2]) > 0.45) break;
    }
  }
  const dx = wp[0] - s.player[0];
  const dz = wp[2] - s.player[2];
  const m = Math.hypot(dx, dz);
  return m < 0.2 ? [0, 0] : [dx / m, dz / m];
}

interface Kare {
  t: number;
  x: number; // kamera hedefi (oyuncu ya da görev odağı)
  z: number;
  odak: boolean;
  alan: number;
  q: number;
}

function oyna(tohum: number): { kareler: Kare[]; yol: number; sonQ: number } {
  seedRandom(tohum);
  useGame.getState().hardReset();
  const kareler: Kare[] = [];
  let dec: ReturnType<typeof decide> | null = null;
  let decT = -1;
  let enD: number | null = null;
  let enT = 0;
  let enKey = '';
  let yol = 0;
  let still = 0;
  let unstick = 0;
  let side = 1;
  let prev: number[] | null = null;
  const adim = Math.round(SURE_SN / DT);
  const kayitAdim = Math.round(KAYIT_SN / DT);
  for (let i = 0; i < adim; i++) {
    const t = i * DT;
    let s = useGame.getState() as S;
    if (s.levelUp) s.claimLevelUp();
    if (!dec || t - decT > 0.5) {
      dec = decide(s);
      decT = t;
    }
    let d = dist(s.player, dec.pos);
    if (enD == null || d < enD - 0.2 || enKey !== dec.why) {
      enD = d;
      enT = t;
      enKey = dec.why;
    } else if (t - enT > 25 && d > 0.6) {
      useGame.setState({ player: [dec.pos[0], 0.6, dec.pos[2]] } as never);
      enD = null;
      s = useGame.getState();
      d = 0; // ışınlandı: T9b botunda bu satır yoktu, eski d ile steer 0/0 bölüp oyuncuyu NaN yapıyordu
    }
    let inp: [number, number] = [0, 0];
    if (!(dec.stand && d < (dec.why.startsWith('gorev:') ? 0.5 : 0.1))) inp = steer(s, dec.pos);
    if (unstick > 0) {
      unstick -= DT;
      inp = [-inp[1] * side + inp[0] * 0.3, inp[0] * side + inp[1] * 0.3];
    } else if ((inp[0] || inp[1]) && prev && Math.hypot(s.player[0] - prev[0], s.player[2] - prev[2]) < 0.005) {
      if (++still > 5) {
        unstick = 0.6 + Math.random() * 1.2;
        side = Math.random() < 0.5 ? 1 : -1;
        still = 0;
      }
    } else still = 0;
    if (prev) yol += Math.hypot(s.player[0] - prev[0], s.player[2] - prev[2]);
    prev = [...s.player];
    useGame.setState({ inputKeyboard: inp } as never);
    s.tick(DT);
    if (i % kayitAdim === 0) {
      const g = useGame.getState() as S;
      const f = g.camFocus;
      kareler.push({ t, x: f ? f.pos[0] : g.player[0], z: f ? f.pos[2] : g.player[2], odak: !!f, alan: g.areasOpen, q: g.questIndex });
    }
    if ((useGame.getState() as S).questIndex >= C.quests.length && t > 60) break;
  }
  const son = (useGame.getState() as S).player;
  damga(`oyuncu konumu sonlu (tohum ${tohum})`, Number.isFinite(son[0]) && Number.isFinite(son[2]), String(son));
  return { kareler, yol, sonQ: (useGame.getState() as S).questIndex };
}

// ---------------------------------------------------------------------------------------------
//  2) KAMERA + İZDÜŞÜM — CameraRig'in formülü, oyunun kendi izdüşüm kodu
// ---------------------------------------------------------------------------------------------
interface Profil {
  ad: string;
  w: number;
  h: number;
  uzak?: boolean;
}
const PROFILLER: Profil[] = [
  { ad: 'dikey telefon', w: 390, h: 844 },
  { ad: 'dikey + uzaklaş', w: 390, h: 844, uzak: true },
  { ad: 'yatay telefon', w: 844, h: 390 },
  { ad: 'dikey tablet', w: 820, h: 1180 },
];
type Kutu = { x: number; y: number; w: number; h: number };
type Ortucu = { mn: number[]; mx: number[] };
const HUD_DOSYA = 'docs/gorsel/ss/f4c3-hud.json';
const hudVeri: {
  profiller: Record<string, { kutular: Kutu[] }>;
  izdusum: { profil: string; ad: string; x: number; z: number; dx: number; ndc: ([number, number] | null)[]; piksel: { gorunen: number; tum: number; pay: number } }[];
  ortucu: { ilk: Ortucu[]; tam: Ortucu[] };
  yazi: { en: number; harf: number; tuvalEn: number; tuvalBoy: number };
} | null = existsSync(HUD_DOSYA) ? JSON.parse(readFileSync(HUD_DOSYA, 'utf8')) : null;
damga('HUD kutuları var (önce tabela-kadraj-f4c3.mjs)', !!hudVeri);
const hudKey = (p: Profil) => `${p.w}x${p.h}`;

const kam = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
const hedef = new Vector3();
function kameraKur(p: Profil, x: number, z: number, odak = false): void {
  kam.aspect = p.w / p.h;
  kam.updateProjectionMatrix();
  const d = cameraDistance(p.w / p.h) * (odak ? CAMERA_FOCUS_MUL : 1) * (p.uzak ? CAMERA_ZOOM_OUT_MUL : 1);
  kam.position.set(x, d, z + d);
  hedef.set(x, CAMERA_LOOK_Y, z);
  kam.lookAt(hedef);
  kam.updateMatrixWorld();
  cameraViewYaz(kam.projectionMatrix.elements, kam.matrixWorldInverse.elements);
}
/** NDC → CSS px (sol üst köşe başlangıç). */
const px = (p: Profil, n: [number, number]) => [((n[0] + 1) / 2) * p.w, ((1 - n[1]) / 2) * p.h] as const;

// ---------------------------------------------------------------------------------------------
//  LEVHA — kapı hizasında (x = kapı) duran dikdörtgen yüzey. Merkez (y, z), en w, boy h, "yukarı"
//  yönü (0, uy, uz) — dik tabela (0,1,0); tente üstü duvara doğru yükselen eğim.
// ---------------------------------------------------------------------------------------------
interface Levha {
  kod: string;
  ad: string;
  y: number;
  z: number;
  w: number;
  h: number;
  uy: number;
  uz: number;
}
const dik = (kod: string, ad: string, y: number, z: number, w: number, h: number): Levha => ({ kod, ad, y, z, w, h, uy: 1, uz: 0 });
const TC = Math.cos(TENTE.rotX);
const TS = Math.sin(TENTE.rotX);
/** Tente üst yüzünde lz (yerel derinlik, +z dışa) noktası. */
const tenteY = (lz: number) => TENTE.y + (TENTE.h / 2) * TC - lz * TS;
const tenteZ = (lz: number) => TENTE.z + (TENTE.h / 2) * TS + lz * TC;
/** Tentenin duvar yüzündeki lz'si — gerisi duvarın içinde, çizilmiyor. */
const TENTE_LZ0 = (STREET_Z0 - TENTE.z - (TENTE.h / 2) * TS) / TC;
function tenteLevha(kod: string, ad: string, lz0: number, lz1: number, w: number): Levha {
  const m = (lz0 + lz1) / 2;
  return { kod, ad, y: tenteY(m), z: tenteZ(m), w, h: lz1 - lz0, uy: TS, uz: -TC };
}
const FIRFIR_Y = TENTE.y - (TENTE.d / 2) * TS - 0.14;
const FIRFIR_Z = TENTE.z + (TENTE.d / 2) * TC + 0.025;

/** Bugünkü cephe: tabela (`Scene.tsx` Street, alınlık) + tente üst yüzü + fırfır. Renk adayları üçünü de boyuyor. */
/** K0 = OYUNDAKİ tabela (`streetLook.TABELA`, D-156'dan beri K2'nin geometrisi). Commit #1'in K0'ı (3,4 × 0,34,
 *  lento/kordon arasında) raporun taban tablosunda; K1 onun öne alınmış hâli olarak listede kalır. */
const TABELA_BUGUN = dik('K0', `oyundaki tabela (D-156): ${TABELA.w} × ${TABELA.h}, z ${TABELA.z}`, TABELA.y, TABELA.z + TABELA.d / 2, TABELA.w, TABELA.h);
const TENTE_YUZ = tenteLevha('tente', 'tente üst yüzü (duvar önü)', TENTE_LZ0, TENTE.d / 2, TENTE.w);
const FIRFIR = dik('fırfır', 'fırfır', FIRFIR_Y, FIRFIR_Z, TENTE.w, 0.26);

/** Yazının geçeceği yüzey KOLLARI (varyant; kod YAZILMADI). Örtücüler (lento/kordon) z 17,89'da biter. */
const KOLLAR: Levha[] = [
  TABELA_BUGUN,
  dik('K1', 'tabela öne: aynı boy, z 17,95 (örtücünün önünde)', 2.92, 17.95, 3.4, 0.34),
  dik('K2', 'alınlığı doldur: 5,0 × 0,55, z 17,95 (lento+kordonun önü)', 2.925, 17.95, 5.0, 0.55),
  tenteLevha('K3', 'yazı TENTENİN ÜSTÜNDE: 5,4 × 0,8 şerit, örtücüden dışarıda', 0.95 - 0.1 - 0.8, 0.95 - 0.1, 5.4),
  dik('K4', 'çatı tabelası: kordonun üstünde 4,4 × 0,6 dik', 3.55, 17.7, 4.4, 0.6),
  { ...dik('K4e', 'çatı tabelası 25° geriye eğik', 3.55, 17.7, 4.4, 0.6), uy: Math.cos(0.436), uz: -Math.sin(0.436) },
  { ...FIRFIR, kod: 'K5', ad: 'yazı FIRFIRDA: 6,4 × 0,26' },
];

/** Aday dokusunun yazı oranları (tarayıcıda ölçüldü): büyük harf / tuval boyu · yazı eni / büyük harf. */
const HARF_BOY = hudVeri ? hudVeri.yazi.harf / hudVeri.yazi.tuvalBoy : 0.43;
const YAZI_EN = hudVeri ? hudVeri.yazi.en / hudVeri.yazi.harf : 17;
const DOLULUK = hudVeri ? hudVeri.yazi.en / hudVeri.yazi.tuvalEn : 0.79;
/** Levhaya sığan büyük harf boyu (dünya): boydan ya da enden hangisi darsa. */
const harfBoyu = (l: Levha) => Math.min(HARF_BOY * l.h, (DOLULUK * l.w) / YAZI_EN);

/** Kamera → nokta ışını örtücü kutudan (lento · üst kordon — tarayıcıdan) geçiyor mu? Slab testi. */
let ortucuKume: Ortucu[] = [];
const ortucuSec = (dx: number) => {
  ortucuKume = (dx === doorX(1) ? hudVeri?.ortucu.ilk : hudVeri?.ortucu.tam) ?? [];
};
function ortulu(x: number, y: number, z: number): boolean {
  const o = [x, y, z];
  const d = [kam.position.x - x, kam.position.y - y, kam.position.z - z];
  for (const k of ortucuKume) {
    let t0 = 1e-4;
    let t1 = 1;
    let bos = false;
    for (let a = 0; a < 3 && !bos; a++) {
      if (Math.abs(d[a]) < 1e-12) {
        if (o[a] < k.mn[a] || o[a] > k.mx[a]) bos = true;
        continue;
      }
      let ta = (k.mn[a] - o[a]) / d[a];
      let tb = (k.mx[a] - o[a]) / d[a];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) bos = true;
    }
    if (!bos) return true;
  }
  return false;
}
function hudAltinda(p: Profil, q: readonly [number, number]): boolean {
  const kutular = hudVeri?.profiller[hudKey(p)]?.kutular ?? [];
  return kutular.some((k) => q[0] >= k.x && q[0] <= k.x + k.w && q[1] >= k.y && q[1] <= k.y + k.h);
}

const SUTUN = 35;
const SATIR = 40;
const nokta = (l: Levha, dx: number, a: number, b: number): [number, number, number] => [dx + a, l.y + b * l.uy, l.z + b * l.uz];
const koseler = (l: Levha, dx: number) => [
  nokta(l, dx, -l.w / 2, -l.h / 2), nokta(l, dx, l.w / 2, -l.h / 2), nokta(l, dx, l.w / 2, l.h / 2), nokta(l, dx, -l.w / 2, l.h / 2),
];
function alanPx(p: Profil, k: [number, number, number][]): number {
  const q = k.map(([x, y, z]) => izdusur(x, y, z));
  if (q.some((n) => !n)) return 0;
  const a = q.map((n) => px(p, n!));
  let t = 0;
  for (let i = 0; i < a.length; i++) t += a[i][0] * a[(i + 1) % a.length][1] - a[(i + 1) % a.length][0] * a[i][1];
  return Math.abs(t) / 2;
}

interface Olc {
  ekranda: number; // ekrana düşen örnek payı
  gorunen: number; // ekranda + HUD altında değil + örtülü değil
  yazi: number; // yazı şeridinin (ortada, büyük harf boyunda) görünen payı
  harfPx: number; // büyük harfin ekrandaki boyu (CSS px)
  ekranPay: number; // görünen alan / ekran alanı
}
function levhaOlc(p: Profil, l: Levha, dx: number): Olc {
  ortucuSec(dx);
  const yaziYari = harfBoyu(l) / 2 / l.h; // yazı şeridi: ortanın ±(harf/2)'si
  let ekranda = 0;
  let gorunen = 0;
  let yazi = 0;
  let yaziTop = 0;
  for (let i = 0; i < SUTUN; i++)
    for (let j = 0; j < SATIR; j++) {
      const fb = (j + 0.5) / SATIR - 0.5;
      const yz_ = Math.abs(fb) <= yaziYari;
      if (yz_) yaziTop++;
      const [x, y, z] = nokta(l, dx, -l.w / 2 + (l.w * (i + 0.5)) / SUTUN, fb * l.h);
      const n = izdusur(x, y, z);
      if (!n || Math.abs(n[0]) > 1 || Math.abs(n[1]) > 1) continue;
      ekranda++;
      if (hudAltinda(p, px(p, n)) || ortulu(x, y, z)) continue;
      gorunen++;
      if (yz_) yazi++;
    }
  const top = SUTUN * SATIR;
  const hb = harfBoyu(l) / 2;
  const u = izdusur(...nokta(l, dx, 0, hb));
  const a = izdusur(...nokta(l, dx, 0, -hb));
  const g = gorunen / top;
  return {
    ekranda: ekranda / top,
    gorunen: g,
    yazi: yaziTop ? yazi / yaziTop : 0,
    harfPx: u && a ? Math.abs(px(p, u)[1] - px(p, a)[1]) : 0,
    ekranPay: g > 0 ? (alanPx(p, koseler(l, dx)) * g) / (p.w * p.h) : 0,
  };
}
const okunur = (o: Olc) => o.yazi >= 0.9 && o.harfPx >= OKUNUR_PX;

// ---------------------------------------------------------------------------------------------
//  3) KOŞU
// ---------------------------------------------------------------------------------------------
kipBandi();
const yz = (x: number) => `%${(100 * x).toFixed(1)}`.padStart(6);
const f1 = (x: number) => (isNaN(x) ? '—' : x.toFixed(1));
const pc = (x: number) => (isNaN(x) ? '—' : `%${(100 * x).toFixed(1)}`);
console.log(`# F4c-3 tabela/cephe görünürlüğü · kip ${KIP} · bot ${SURE_SN / 60} dk tavan · kayıt ${KAYIT_SN} sn`);
console.log(`# YAZI OKUNUR = yazı şeridinin ≥ %90'ı görünür (ekranda, HUD altında değil, lento/kordon arkasında değil) VE büyük harf ≥ ${OKUNUR_PX} px`);
console.log(`# yazı oranları (aday dokusu, tarayıcıda ölçüldü): büyük harf = ${HARF_BOY.toFixed(3)} × levha boyu · yazı eni = ${YAZI_EN.toFixed(2)} × harf · levha enine doluluk ${DOLULUK.toFixed(3)}`);
if (hudVeri) {
  const [l, k] = hudVeri.ortucu.ilk;
  console.log(`# örtücü (tarayıcıdan): 1. Salon ${hudVeri.ortucu.ilk.length} · tam kat ${hudVeri.ortucu.tam.length} kutu — lento y ${l?.mn[1]}–${l?.mx[1]} · üst kordon y ${k?.mn[1]}–${k?.mx[1]}; ikisi de z ${l?.mx[2]}'e uzanıyor`);
}
console.log('\n## Kollar (yazının geçeceği yüzey) — geometri');
// Tarayıcı kareleri (`KARE=kollar node tools/tabela-kadraj-f4c3.mjs`) kolları buradan okur — geometri tek yerde.
writeFileSync('docs/gorsel/ss/f4c3-kollar.json', JSON.stringify(KOLLAR.map((l) => ({ ...l, harf: harfBoyu(l) }))));
console.log('kod    merkez y     z      en × boy      büyük harf (dünya)  yüzey');
for (const l of [...KOLLAR, TENTE_YUZ]) {
  console.log(`${l.kod.padEnd(6)} ${l.y.toFixed(2).padStart(6)} ${l.z.toFixed(2).padStart(6)}   ${l.w.toFixed(2)} × ${l.h.toFixed(2)}   ${harfBoyu(l).toFixed(3).padStart(8)}            ${l.ad}`);
}

// 3a) Doğrulama: izdüşüm (node ↔ tarayıcı `__izdusur`) + görünen pay (node ışın testi ↔ macenta piksel sayımı).
if (hudVeri) {
  let enKotu = 0;
  let payFark = 0;
  console.log('\n## 0. Araç doğrulaması — bugünkü tabela, tarayıcı kareleriyle');
  console.log('profil      konum      piksel görünen/tüm   piksel payı   node payı   fark');
  for (const r of hudVeri.izdusum) {
    const p = PROFILLER.find((q) => hudKey(q) === r.profil && !q.uzak)!;
    kameraKur(p, r.x, r.z);
    const t = TABELA_BUGUN;
    const k4 = [nokta(t, r.dx, -t.w / 2, -t.h / 2), nokta(t, r.dx, t.w / 2, -t.h / 2), nokta(t, r.dx, -t.w / 2, t.h / 2), nokta(t, r.dx, t.w / 2, t.h / 2)];
    k4.forEach(([x, y, z], i) => {
      const a = izdusur(x, y, z);
      const b = r.ndc[i];
      if (!a || !b) return;
      const pa = px(p, a);
      const pb = px(p, b);
      enKotu = Math.max(enKotu, Math.hypot(pa[0] - pb[0], pa[1] - pb[1]));
    });
    const o = levhaOlc(p, t, r.dx);
    const nodePay = o.ekranda > 0 ? o.gorunen / o.ekranda : 0;
    const fark = Math.abs(nodePay - r.piksel.pay);
    payFark = Math.max(payFark, fark);
    console.log(`${r.profil.padEnd(11)} ${r.ad.padEnd(10)} ${String(r.piksel.gorunen).padStart(7)}/${String(r.piksel.tum).padEnd(7)}      ${yz(r.piksel.pay)}      ${yz(nodePay)}   ${fark.toFixed(3)}`);
  }
  damga('izdüşüm tarayıcıyla birebir (≤ 3 px)', enKotu <= 3, `${enKotu.toFixed(2)} px`);
  damga('görünen pay piksel sayımıyla tutarlı (≤ 0,05)', payFark <= 0.05, payFark.toFixed(3));
  console.log(`izdüşüm: en büyük sapma ${enKotu.toFixed(2)} px · görünen pay: en büyük fark ${payFark.toFixed(3)}`);
}

// 3b) Durağan tarama: oyuncunun durabileceği her nokta (dikey telefon).
console.log('\n## A. Konum haritası — dikey telefon · satır oyuncu z · sütun oyuncu x (−16…16, 2 br)');
console.log('değer: görünen pay ×10 (· = hiç, # = YAZI OKUNUR) · sağda: oyuncu kapı hizasındayken büyük harf px');
{
  const p = PROFILLER[0];
  for (const alan of [1, 2]) {
    const dx = doorX(alan);
    for (const l of KOLLAR.filter((k) => ['K0', 'K2', 'K3', 'K4'].includes(k.kod))) {
      console.log(`\n${l.kod} · kapı x = ${dx} (${alan === 1 ? '1. Salon' : '2. Salon ve sonrası'})`);
      let enDerin = Infinity;
      let say = 0;
      for (let z = 17; z >= 8; z -= 1) {
        let satir = `z ${String(z).padStart(3)} `;
        for (let x = -16; x <= 16; x += 2) {
          kameraKur(p, x, z);
          const o = levhaOlc(p, l, dx);
          if (okunur(o)) say++;
          satir += okunur(o) ? '#' : o.gorunen <= 0 ? '·' : String(Math.min(9, Math.floor(o.gorunen * 10)));
          if (o.gorunen > 0 && z < enDerin) enDerin = z;
        }
        kameraKur(p, dx, z);
        const o = levhaOlc(p, l, dx);
        console.log(`${satir}   harf ${f1(o.harfPx).padStart(5)} px · yazı şeridi ${yz(o.yazi)}`);
      }
      console.log(`görünen en derin oyuncu z: ${enDerin} · yazının okunduğu hücre: ${say}/${17 * 10}`);
    }
  }
}

// 3c) Oynanış izi.
const TOHUMLAR = KISA ? [20260924] : [20260924, 20260925, 20260926];
const izler = TOHUMLAR.map((t) => ({ tohum: t, ...oyna(t) }));
for (const iz of izler) {
  botDamgasi(`tohum ${iz.tohum}`, iz.yol, iz.kareler.length / 60);
  damga(`görev hattı ilerledi (tohum ${iz.tohum})`, iz.sonQ >= (KISA ? 5 : 30), `son görev ${iz.sonQ}`);
}

console.log('\n## B. Oynanış zamanı (bot, görev hattı, saniyede bir kare)');
for (const iz of izler) {
  const son = iz.kareler[iz.kareler.length - 1];
  console.log(`tohum ${iz.tohum}: ${(son.t / 60).toFixed(1)} dk · son görev ${iz.sonQ}/${C.quests.length} · yol ${(iz.yol / 1000).toFixed(1)} km · kamera odağı ${yz(iz.kareler.filter((k) => k.odak).length / iz.kareler.length)}`);
}
const DONEMLER: [string, (k: Kare) => boolean][] = [
  ['ilk 2 dk', (k) => k.t < 120],
  ['1. Salon', (k) => k.alan === 1],
  ['2. Salon', (k) => k.alan === 2],
  ['3. Salon', (k) => k.alan >= 3],
  ['TÜMÜ', () => true],
];
const kareHepsi = izler.flatMap((i) => i.kareler);
const donemSay = DONEMLER.map(([ad, f]) => `${ad} ${kareHepsi.filter(f).length}`).join(' · ');
console.log(`kare: ${donemSay}`);

// Tek geçiş: her profil × her kare için bütün yüzeyler bir kez ölçülür, dönemlere sonra dağıtılır.
const YUZEYLER = [...KOLLAR, TENTE_YUZ];
type Olcum = { olc: Olc[]; donem: boolean[] };
const olcumler = new Map<string, Olcum[]>();
for (const p of PROFILLER) {
  olcumler.set(
    p.ad,
    kareHepsi.map((k) => {
      kameraKur(p, k.x, k.z, k.odak);
      const dx = doorX(k.alan);
      return { olc: YUZEYLER.map((l) => levhaOlc(p, l, dx)), donem: DONEMLER.map(([, f]) => f(k)) };
    }),
  );
}
const iK0 = 0;
const iK5 = KOLLAR.findIndex((l) => l.kod === 'K5');
const iTente = YUZEYLER.length - 1;

console.log('\n### B1. Bugünkü CEPHE (renk adaylarının boyadığı üç yüzey: tabela · tente · fırfır) — ekranda olduğu süre · ekran payı (görünürken medyan / p90)');
console.log('profil            dönem       | tabela ekranda  pay med | tente ekranda  pay med | CEPHE ekranda  pay med / p90');
const ozet: Record<string, number> = {};
for (const p of PROFILLER) {
  const ol = olcumler.get(p.ad)!;
  DONEMLER.forEach(([ad], di) => {
    const ks = ol.filter((o) => o.donem[di]);
    if (!ks.length) return;
    const tb = ks.filter((o) => o.olc[iK0].gorunen > 0).map((o) => o.olc[iK0].ekranPay);
    const te = ks.filter((o) => o.olc[iTente].gorunen > 0).map((o) => o.olc[iTente].ekranPay);
    const ce = ks.map((o) => o.olc[iK0].ekranPay + o.olc[iTente].ekranPay + o.olc[iK5].ekranPay).filter((x) => x > 0);
    const n = ks.length;
    ozet[`${p.ad}|${ad}|cephe`] = ce.length / n;
    console.log(
      `${p.ad.padEnd(17)} ${ad.padEnd(10)}  |        ${yz(tb.length / n)}  ${pc(yuzdelik(tb, 0.5)).padStart(6)} |        ${yz(te.length / n)}  ${pc(yuzdelik(te, 0.5)).padStart(6)} |` +
        `        ${yz(ce.length / n)}  ${pc(yuzdelik(ce, 0.5)).padStart(6)} / ${pc(yuzdelik(ce, 0.9)).padStart(6)}`,
    );
  });
}
damga('ölçüm kör değil (dikey telefon, ilk 2 dk cephe ekranda)', (ozet['dikey telefon|ilk 2 dk|cephe'] ?? 0) > 0, '%0');

console.log(`\n### B2. YAZI KOLLARI — oyun süresinin ne kadarında yazı OKUNUR (şeridin ≥ %90'ı, harf ≥ ${OKUNUR_PX} px) · TÜMÜ: yarısı okunur (≥ %50) · ekranda · büyük harf px (görünürken medyan / en büyük) · ekran payı med`);
for (const p of PROFILLER) {
  const ol = olcumler.get(p.ad)!;
  console.log(`\n${p.ad} (${p.w}×${p.h}${p.uzak ? ', ×' + CAMERA_ZOOM_OUT_MUL : ''}) · kamera mesafesi ${(cameraDistance(p.w / p.h) * (p.uzak ? CAMERA_ZOOM_OUT_MUL : 1)).toFixed(2)}`);
  console.log('kol   ' + DONEMLER.map(([ad]) => `| ${ad.padEnd(8)} okunur`).join(' ') + ' | yarısı okunur  ekranda  harf px med/max  pay med');
  KOLLAR.forEach((l, li) => {
    let satir = l.kod.padEnd(5);
    DONEMLER.forEach((_, di) => {
      const ks = ol.filter((o) => o.donem[di]);
      satir += ` | ${ks.length ? yz(ks.filter((o) => okunur(o.olc[li])).length / ks.length).padStart(15) : '—'.padStart(15)}`;
    });
    const n = ol.length;
    const gor = ol.filter((o) => o.olc[li].gorunen > 0);
    const yari = ol.filter((o) => o.olc[li].yazi >= 0.5 && o.olc[li].harfPx >= OKUNUR_PX).length;
    const harf = gor.map((o) => o.olc[li].harfPx);
    satir += ` |        ${yz(yari / n)}   ${yz(gor.length / n)}    ${f1(yuzdelik(harf, 0.5)).padStart(5)} / ${f1(harf.length ? Math.max(...harf) : NaN).padStart(5)}   ${pc(yuzdelik(gor.map((o) => o.olc[li].ekranPay), 0.5)).padStart(6)}`;
    console.log(satir);
  });
}

// 3d) Hangi anlar: bugünkü cephe ekrandayken oyuncunun görevi (dikey telefon).
console.log('\n## C. Cephe ekrandayken oyuncunun görevi (dikey telefon, TÜMÜ) — ilk 8');
{
  const ol = olcumler.get(PROFILLER[0].ad)!;
  const say = new Map<string, number>();
  let top = 0;
  kareHepsi.forEach((k, i) => {
    if (ol[i].olc[iK0].gorunen <= 0 && ol[i].olc[iTente].gorunen <= 0) return;
    top++;
    const q = C.quests[k.q] as S;
    const key = q ? `${q.id} (${q.target.type})` : 'hat sonu';
    say.set(key, (say.get(key) ?? 0) + 1);
  });
  for (const [k, v] of [...say.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`${k.padEnd(34)} ${yz(v / Math.max(1, top))}`);
}

// 3e) Renk adaylarının yazı karşıtlığı (WCAG oranı, `vitrin-adaylari.html` TABELA listesi).
console.log('\n## D. Aday renkleri — yazı / zemin karşıtlığı (WCAG; ≥ 4,5 küçük yazıda okunur sayılır, ≥ 3 büyük yazıda)');
{
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const oran = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const ADAY = [
    { ad: 'C2 yeşil-krem çizgili · ahşap', tabela: '#6b4a2e', yazi: '#f4ead2', tente: '#2e6b4f' },
    { ad: 'C4 lacivert + altın yazı', tabela: '#1b2438', yazi: '#d4af37', tente: '#233049' },
    { ad: 'C7 NEON gece', tabela: '#141418', yazi: '#ff4fa3', tente: '#1d1d22' },
    { ad: 'C8 çini mavisi', tabela: '#f4f1ea', yazi: '#2f6fb3', tente: '#2f6fb3' },
  ];
  for (const a of ADAY) console.log(`${a.ad.padEnd(32)} yazı/zemin ${oran(a.yazi, a.tabela).toFixed(2).padStart(5)} · tente/duvar (#e6d7b8) ${oran(a.tente, '#e6d7b8').toFixed(2).padStart(5)}`);
}
damgaOzeti();
