/**
 * olcum-elmas-fiyat-f4c5.ts — F4c-5: 💎 VİTRİNİNİN FİYATLARI (varyant kapısı · D-084)
 *
 * Koşu:  npx tsx tools/olcum-elmas-fiyat-f4c5.ts                                        (KISA — yön)
 *        OLCUM=tam npx tsx tools/olcum-elmas-fiyat-f4c5.ts > docs/olcum-elmas-fiyat-f4c5-tam.txt (TAM)
 *
 * SORU — Kıyafet · Tepsi · Dekor (21 ürün) TASLAK fiyatlarla duruyor (D-154/D-155). Fiyat ne olmalı?
 * Fiyat `economy.config.ts` `cosmetics.*.diamonds`e yazılır → varyant kapısı. BU ARAÇ CONFIG'E DOKUNMAZ;
 * kollar yalnız fiyat tablosu olarak defterde koşar.
 *
 * ÜÇ ÖLÇEK:
 *   §0 ETİK (statik): kozmetik alanları (outfit · trayLook · dekor · ownedCosmetics) oyun mantığının
 *      hiçbir dosyasında okunmuyor mu? Okunuyorsa kozmetik ilerleme verir → fiyat sorusundan önce dur.
 *   §1 SİM (saat): hedef 💎'ının hangi aktif saatte düştüğü · masaların ₺ tavanına varışı (Usta talebi) ·
 *      3. Salon'un açılışı (dekor kilidi). Yürürlükteki taban koşusu (F4a T0 izi 38fd43d5), Normal profil.
 *   §2 DEFTER (gün): oyuncu profili × fiyat kolu × harcama sırası → ilk kozmetik · 7/30. gün · tüm vitrin.
 *   §3 PAKET: 25/60/150 💎 tek başına ne alır, tam harcanır mı (artık 💎).
 *
 * DAMGALAR: taban izi = 38fd43d5 (kanca sızmadı) · sim iki profil koştu · K0 = config fiyatları ·
 * her kolda 21 ürün · defter korunumu (kazanılan = harcanan + kalan) · §0 temiz.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla, kolAyarla, VARSAYILAN,
  hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla, masaSirasiAyarla,
  type HedefDurum, type UstaKol,
} from './simulate.ts';
import { HEDEF_KOLLARI, kademeAkisi } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla, sonKosuAtlamalari } from './itibar-kollari.ts';
import { USTA_KOLLARI, kayitSifirla as ustaKayitSifirla } from './usta-kollari.ts';
import { fabrika as siraFabrikasi, kolBul } from './sira-kollari.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { LAYOUT } from '../src/game/layout.ts';
import { dekorSalonu } from '../src/game/vitrin.ts';
import { KISA, kipBandi, damga, damgaOzeti, izOlustur } from './olcum-lib.ts';

const vir = (x: number, n = 1) => x.toFixed(n).replace('.', ',');
const gunYaz = (g: number | null) => (g == null ? '> 365' : String(g));

/* ── §0 ETİK — kozmetik oyun mantığına giriyor mu? ─────────────────────────────────── */
/** Kozmetik alanlarının OKUNMASINA izin verilen dosyalar: durum/kayıt/vitrin kuralı/dev kancası ·
 *  satın alma SESİ (audioBridge `alimSayisi`, D-157 — alım sayısı yalnız ses tetikler). */
const IZINLI = new Set(['store.ts', 'save.ts', 'vitrin.ts', 'devHooks.ts', 'audio.ts', 'audioBridge.ts']);
const KOZMETIK_ALAN = /\b(outfit|trayLook|ownedCosmetics|dekor)\b|kozmetik|kiyafetGorunum|tepsiGorunum/;
const oyunDosyalari = readdirSync('src/game').filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
const sizinti: string[] = [];
for (const f of oyunDosyalari) {
  if (IZINLI.has(f)) continue;
  readFileSync(join('src/game', f), 'utf8').split('\n').forEach((satir, i) => {
    const kod = satir.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '').replace(/^\s*(\/\*\*?|\*).*$/, '');
    if (KOZMETIK_ALAN.test(kod)) sizinti.push(`${f}:${i + 1}`);
  });
}
// store.ts'te 💎 kozmetik alımı yalnız görünüm alanlarını yazar (cüzdan/masa/hız değil).
const store = readFileSync('src/game/store.ts', 'utf8');
const alim = store.slice(store.indexOf('buyGemCosmetic: (kind, id) =>'), store.indexOf('buyGemCosmetic: (kind, id) =>') + 1400);
const alimYazar = [...alim.matchAll(/set\(\{([\s\S]*?)\}\);/g)].map((m) => m[1]).join(' ');
const yasakYazim = ['wallet', 'tables', 'stationLevels', 'char', 'mastersOwned', 'xp', 'padsDone'].filter((k) =>
  new RegExp(`\\b${k}\\b`).test(alimYazar));

/* ── §1 SİM ───────────────────────────────────────────────────────────────────────── */
const seviyeOdeyici = () => () => {
  let odenen = 0;
  return (d: HedefDurum): number => {
    const at = sonKosuAtlamalari();
    if (at.length <= odenen) return 0;
    const n = at.slice(odenen).filter((a) => a.seviye >= C.xp.levelRewardFromLevel).length;
    odenen = at.length;
    return n * C.xp.levelRewardSec * d.oran;
  };
};

interface Iz { t: number; hedefElmas: number; masaTavanda: number; kategori: number[] }
const kosular: Iz[][] = [];
/** Yürürlükteki Usta kolunu SARAR: yalnız gözler (hedef kademesi · tavandaki masa), etkiyi aynen döndürür. */
function gozcu(ic: () => UstaKol): () => UstaKol {
  return () => {
    const kol = ic();
    const akis = kademeAkisi();
    const iz: Iz[] = [];
    kosular.push(iz);
    let elmas = 0;
    const kat = C.goals.categories.map(() => 0);
    return (d) => {
      for (const k of akis({ t: d.t, lifetime: d.lifetime, padSayisi: d.padSayisi, ustaMasa: d.ustaMasa, oran: 0 })) {
        elmas += C.goals.diamondByTier[k.ti] ?? 0;
        kat[k.ci] += 1;
      }
      const son = iz[iz.length - 1];
      if (!son || son.hedefElmas !== elmas || son.masaTavanda !== d.masaTavanda) {
        iz.push({ t: d.t, hedefElmas: elmas, masaTavanda: d.masaTavanda, kategori: [...kat] });
      }
      return kol(d);
    };
  };
}
function simKos(gozle: boolean) {
  masaSirasiAyarla(siraFabrikasi(kolBul('A')));
  hedefAkisiAyarla(seviyeOdeyici());
  itibarKayitSifirla();
  ustaKayitSifirla();
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  itibarAyarla(ITIBAR_KOLLARI.rUYG.fabrika(1));
  const ic = USTA_KOLLARI.eUYG.fabrika(1);
  ustaAyarla(gozle ? gozcu(ic) : ic);
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
  const o = olcutler();
  hedefAkisiAyarla(null);
  masaSirasiAyarla(null);
  const h = izOlustur();
  for (const b of o.bosluklarNormal) h.ekle(b.t, b.gap);
  return { o, iz: h.deger };
}

kipBandi();
console.log('=== F4c-5 — 💎 VİTRİN FİYATLARI: kazanma hızı · kollar · paket hizası ===');
console.log('');
console.log('economy.config.ts DOSYASI DEĞİŞMEDİ — fiyat kolları yalnız defterde koşar.');
console.log('');

console.log('--- §0 ETİK: kozmetik ilerleme veriyor mu? (statik tarama) ---');
console.log(`src/game/*.ts (${oyunDosyalari.length} dosya, izinli: ${[...IZINLI].join(' · ')}) içinde kozmetik alanı okuyan satır: ${sizinti.length}`);
for (const s of sizinti) console.log(`  ! ${s}`);
console.log(`💎 kozmetik alımı (store.buyGemCosmetic) oynanış alanı yazıyor mu: ${yasakYazim.length ? yasakYazim.join(', ') : 'hayır'} ` +
  '(yazdıkları: diamonds · ownedCosmetics · outfit/trayLook/dekor · bildirim)');
console.log('Dekor yuvaları müşteri/oyuncu yolunda değil: 9 yuvada trafik %0,0 (D-155, docs/dekor-raporu-f4c2.md).');
console.log('');

kolAyarla(VARSAYILAN);
const taban = simKos(false);
const gozlu = simKos(true);
damga('taban = F4a T0 (parmak izi 38fd43d5)', taban.iz === '38fd43d5', `taban izi ${taban.iz}`);
damga('gözcü etkisiz (gözlü koşu = taban)', gozlu.iz === taban.iz, `${gozlu.iz} ≠ ${taban.iz}`);
damga('sim iki profil koştu (ideal + normal)', kosular.length === 2, `${kosular.length} koşu`);
damga('§0 kozmetik oyun mantığına sızmıyor', sizinti.length === 0 && yasakYazim.length === 0, `${sizinti.join(', ')} ${yasakYazim.join(', ')}`);

const NORMAL = kosular[1] ?? [];
const SIM_SON = 12 * 3600;
const ci = (id: string) => C.goals.categories.findIndex((c) => c.id === id);
const TEMIZLIK = ci('clean');
const SERVIS = ci('service');
/**
 * Hedef 💎 (t saniye aktif oyunda). Sim elle yıkamayı oynamaz → Temizlik kategorisi sim'de hiç
 * ilerlemez. MODEL: Temizlik'in n. kademesi Servis'in n. kademesiyle AYNI anda düşer (ikisi de servis
 * hacmiyle büyür). 12 sa'ten sonrası bilinmiyor → 12 sa'teki değerde TUTULUR (arz ALT sınırı).
 */
function hedefElmas(t: number): number {
  let s: Iz | undefined;
  for (const x of NORMAL) { if (x.t <= Math.min(t, SIM_SON)) s = x; else break; }
  if (!s) return 0;
  const servisKademe = s.kategori[SERVIS];
  const temizlik = C.goals.diamondByTier.slice(0, servisKademe).reduce((a, b) => a + b, 0);
  return s.hedefElmas + (s.kategori[TEMIZLIK] === 0 ? temizlik : 0);
}
const USTA_HEDEF = LAYOUT.tables.length;
/** Tavandaki masa (Usta'ya uygun). 12 sa'ten sonra HEPSİ uygun sayılır (F4a §2 kuralı: talebin üst sınırı). */
function uygunMasa(t: number): number {
  if (t > SIM_SON) return USTA_HEDEF;
  let m = 0;
  for (const x of NORMAL) { if (x.t <= t) m = x.masaTavanda; else break; }
  return m;
}
const alanPadleri = new Set((C.pads as readonly { id: string; effect: { type: string } }[])
  .filter((p) => p.effect.type === 'unlockArea').map((p) => p.id));
const alanAcilis: number[] = [0]; // alanAcilis[k] = (k+1). salonun açıldığı sn (Normal profil)
for (const b of taban.o.bosluklarNormal) {
  if (b.label.startsWith('pad: ') && alanPadleri.has(b.label.slice(5))) alanAcilis.push(b.t);
}
const salonAcikMi = (salon: number, t: number) => salon <= 1 || (alanAcilis[salon - 1] != null && alanAcilis[salon - 1] <= t);

const saatler = [0.5, 1, 2, 3, 5.58, 8, 12];
console.log('--- §1 SİM: aktif oyun saatine göre hedef 💎 · Usta\'ya uygun masa · salon (Normal profil) ---');
console.log(`Taban izi ${taban.iz} (F4a T0 ile aynı) · gözlü koşu ${gozlu.iz}`);
console.log('aktif sa | hedef 💎 (sim) | +Temizlik modeli | toplam | tavandaki masa | açık salon');
for (const h of saatler) {
  const t = h * 3600;
  let s: Iz | undefined;
  for (const x of NORMAL) { if (x.t <= t) s = x; else break; }
  const sim = s?.hedefElmas ?? 0;
  const top = hedefElmas(t);
  const salon = alanAcilis.filter((a) => a <= t).length;
  console.log(`${vir(h, 2).padStart(8)} | ${String(sim).padStart(14)} | ${String(top - sim).padStart(16)} | ${String(top).padStart(6)} | ${String(uygunMasa(t)).padStart(14)} | ${salon}`);
}
console.log(`Salon açılışları (sa): ${alanAcilis.slice(1).map((t) => vir(t / 3600, 2)).join(' · ')}`);
const hedefToplam = C.goals.diamondByTier.reduce((a, b) => a + b, 0) * C.goals.categories.length;
console.log(`12 sa'te düşen hedef 💎: ${hedefElmas(SIM_SON)} / ${hedefToplam} (kalanı 12 sa'ten sonra — defterde SAYILMADI, alt sınır)`);
console.log('');

/* ── §2 DEFTER ────────────────────────────────────────────────────────────────────── */
type Tur = 'kiyafet' | 'tepsi' | 'dekor';
interface Urun { tur: Tur; id: string; ad: string; k0: number; kademe: 'A' | 'B' | 'C' | 'D'; salon: number }
/** Kademe haritası: A küçük · B orta · C büyük · D altın. K1-K3 fiyatı kademeden gelir, K0 config'ten. */
const KADEME: Record<string, Urun['kademe']> = {
  'kiyafet:yesil': 'B', 'kiyafet:sef': 'B', 'kiyafet:yazlik': 'B', 'kiyafet:kislik': 'B', 'kiyafet:altin': 'D',
  'tepsi:bakir': 'A', 'tepsi:emaye': 'A', 'tepsi:aski': 'C', 'tepsi:altin': 'D',
  'dekor:lamba': 'A', 'dekor:radyo': 'B', 'dekor:tablo': 'B', 'dekor:kanarya': 'B', 'dekor:saat': 'B',
  'dekor:koltuk': 'C', 'dekor:semaver': 'C', 'dekor:gramofon': 'C',
  'dekor:yilbasi-kirmizi': 'C', 'dekor:yilbasi-yesil': 'C', 'dekor:yilbasi-mavi': 'C', 'dekor:yilbasi-kahve': 'C',
};
const URUNLER: Urun[] = [
  ...C.cosmetics.outfits.filter((o) => o.diamonds > 0).map((o) => ({ tur: 'kiyafet' as Tur, id: o.id, ad: o.label, k0: o.diamonds, salon: 1 })),
  ...C.cosmetics.trays.filter((o) => o.diamonds > 0).map((o) => ({ tur: 'tepsi' as Tur, id: o.id, ad: o.label, k0: o.diamonds, salon: 1 })),
  ...C.cosmetics.decor.map((o) => ({ tur: 'dekor' as Tur, id: o.id, ad: o.label, k0: o.diamonds, salon: dekorSalonu(o.id) })),
].map((u) => ({ ...u, kademe: KADEME[`${u.tur}:${u.id}`] }));
damga('her ürünün kademesi var', URUNLER.every((u) => u.kademe), URUNLER.filter((u) => !u.kademe).map((u) => u.id).join());
damga('vitrin 21 ürün', URUNLER.length === 21, `${URUNLER.length}`);

interface FiyatKolu { kod: string; ad: string; fiyat: (u: Urun) => number }
const kademeli = (k: Record<Urun['kademe'], number>) => (u: Urun) => k[u.kademe];
const KOLLAR: FiyatKolu[] = [
  { kod: 'K0', ad: 'bugünkü TASLAK (config)', fiyat: (u) => u.k0 },
  { kod: 'K1', ad: 'ucuz — A 15 · B 25 · C 40 · D 60', fiyat: kademeli({ A: 15, B: 25, C: 40, D: 60 }) },
  { kod: 'K2', ad: 'orta, paket-hizalı — A 25 · B 60 · C 90 · D 150', fiyat: kademeli({ A: 25, B: 60, C: 90, D: 150 }) },
  { kod: 'K3', ad: 'pahalı — A 60 · B 100 · C 150 · D 300', fiyat: kademeli({ A: 60, B: 100, C: 150, D: 300 }) },
];
const secKollar = KISA ? KOLLAR.slice(0, 2) : KOLLAR;
damga('K0 = config fiyatları', URUNLER.every((u) => KOLLAR[0].fiyat(u) === u.k0), '');

interface Oyuncu { kod: string; ad: string; gunluk: number; video: boolean; pesin: number }
const G = C.dailyQuests.diamondsPerDay;
const OYUNCULAR: Oyuncu[] = [
  { kod: 'E0', ad: 'reklam izlemez, satın almaz', gunluk: G, video: false, pesin: 0 },
  { kod: 'İ', ad: 'ödüllü izler: günlük 💎 2× + günde 1 Usta videoyla', gunluk: G * C.rewarded.claimMult, video: true, pesin: 0 },
  { kod: 'K', ad: 'Reklamları Kaldır aldı (+10/gün), izlemez', gunluk: G + C.iap.removeAdsDiamondsPerDay, video: false, pesin: 0 },
  { kod: 'K+İ', ad: 'Reklamları Kaldır + ödüllü izler', gunluk: G * C.rewarded.claimMult + C.iap.removeAdsDiamondsPerDay, video: true, pesin: 0 },
  { kod: 'B', ad: 'başlangıç paketi (100 💎, gün 1) · izlemez', gunluk: G, video: false, pesin: C.iap.starterDiamonds },
];
const secOyuncular = KISA ? OYUNCULAR.slice(0, 2) : OYUNCULAR;

type Sira = 'kozmetik' | 'usta';
interface Sonuc {
  ilk: number | null; g7: number; g30: number; tum: number | null; set18: number | null; usta20: number | null;
  kazanilan30: number; kazanilan7: number; kazanilan1: number; korunum: number;
}
const UFUK = 365;
function defter(o: Oyuncu, kol: FiyatKolu, sira: Sira, saatGun: number): Sonuc {
  let elmas = o.pesin, kazanilan = o.pesin, harcanan = 0, usta = 0;
  const sahip = new Set<string>();
  const yuvaDolu = new Set<string>();
  const r: Sonuc = { ilk: null, g7: 0, g30: 0, tum: null, set18: null, usta20: null, kazanilan30: 0, kazanilan7: 0, kazanilan1: 0, korunum: 0 };
  const PRICE = C.master.diamondCost;
  for (let g = 1; g <= UFUK; g++) {
    const t = g * saatGun * 3600;
    const arz = hedefElmas(t) - hedefElmas((g - 1) * saatGun * 3600) + o.gunluk;
    elmas += arz; kazanilan += arz;
    const uygun = uygunMasa(t);
    if (o.video && usta < uygun) usta += C.rewarded.masterPerDay;
    const ustaAl = () => { while (usta < uygun && elmas >= PRICE) { elmas -= PRICE; harcanan += PRICE; usta++; } };
    const acik = URUNLER.filter((u) => !sahip.has(`${u.tur}:${u.id}`) && salonAcikMi(u.salon, t))
      .sort((a, b) => kol.fiyat(a) - kol.fiyat(b));
    const kozAl = () => {
      for (const u of acik) {
        const k = `${u.tur}:${u.id}`;
        if (sahip.has(k)) continue;
        const f = kol.fiyat(u);
        if (elmas < f) break; // en ucuzunu biriktirir, atlamaz
        elmas -= f; harcanan += f; sahip.add(k);
        yuvaDolu.add(u.tur === 'dekor' ? `dekor:${u.id.startsWith('yilbasi') ? 'yilbasi' : u.id}` : k);
        if (r.ilk == null) r.ilk = g;
      }
    };
    if (sira === 'usta') { ustaAl(); kozAl(); } else { kozAl(); if (acik.every((u) => sahip.has(`${u.tur}:${u.id}`))) ustaAl(); }
    if (g === 1) r.kazanilan1 = kazanilan;
    if (g === 7) { r.g7 = sahip.size; r.kazanilan7 = kazanilan; }
    if (g === 30) { r.g30 = sahip.size; r.kazanilan30 = kazanilan; }
    if (r.set18 == null && yuvaDolu.size === 18) r.set18 = g;
    if (r.tum == null && sahip.size === URUNLER.length) r.tum = g;
    if (r.usta20 == null && usta >= USTA_HEDEF) r.usta20 = g;
  }
  r.korunum = kazanilan - harcanan - elmas;
  return r;
}

const SAAT_GUN = 1; // birincil model: günde 1 sa aktif oyun
console.log(`--- §2a 💎 KAZANMA HIZI (günde ${SAAT_GUN} sa aktif oyun · birikimli kazanılan, harcamadan bağımsız) ---`);
console.log('oyuncu | gün 1 | gün 7 | gün 30 | ad');
for (const o of secOyuncular) {
  const r = defter(o, KOLLAR[0], 'usta', SAAT_GUN);
  damga(`${o.kod} korunum 0`, Math.abs(r.korunum) < 1e-9, `${r.korunum}`);
  console.log(`${o.kod.padEnd(6)} | ${String(r.kazanilan1).padStart(5)} | ${String(r.kazanilan7).padStart(5)} | ${String(r.kazanilan30).padStart(6)} | ${o.ad}`);
}
console.log(`Usta talebi: ${USTA_HEDEF} masa × ${C.master.diamondCost} = ${USTA_HEDEF * C.master.diamondCost} 💎 (aynı havuzdan).`);
console.log('');

for (const sira of ['kozmetik', 'usta'] as Sira[]) {
  console.log(`--- §2b DEFTER · harcama sırası: ${sira === 'kozmetik' ? 'KOZMETİK ÖNCE (en ucuzu biriktirip alır; Usta vitrin bitince)' : 'USTA ÖNCE (uygun masaya Usta, artanla en ucuz kozmetik)'} ---`);
  console.log('kol | oyuncu | ilk kozmetik (gün) | 7. gün adet | 30. gün adet | her yuvaya bir (18) gün | hepsi (21) gün | 20 Usta biter (gün)');
  for (const kol of secKollar) {
    for (const o of secOyuncular) {
      const r = defter(o, kol, sira, SAAT_GUN);
      damga(`${kol.kod}/${o.kod}/${sira} korunum 0`, Math.abs(r.korunum) < 1e-9, `${r.korunum}`);
      console.log(`${kol.kod.padEnd(3)} | ${o.kod.padEnd(6)} | ${gunYaz(r.ilk).padStart(18)} | ${String(r.g7).padStart(11)} | ${String(r.g30).padStart(12)} | ${gunYaz(r.set18).padStart(23)} | ${gunYaz(r.tum).padStart(14)} | ${gunYaz(r.usta20).padStart(19)}`);
    }
  }
  console.log('');
}

console.log('--- §2d TEK ÜRÜN HEDEFİ: yalnız o ürün için biriktiren oyuncu kaçıncı günde alır (harcama yok, 1 sa/gün) ---');
console.log('Başka hiçbir şeye 💎 harcamadan: birikimli kazanılan ≥ fiyat olduğu ilk gün. Usta alan oyuncuda gecikme §2b\'de.');
function birikimGunu(o: Oyuncu, fiyat: number, salon: number): number | null {
  let top = o.pesin;
  for (let g = 1; g <= UFUK; g++) {
    const t = g * SAAT_GUN * 3600;
    top += hedefElmas(t) - hedefElmas((g - 1) * SAAT_GUN * 3600) + o.gunluk;
    if (top >= fiyat && salonAcikMi(salon, t)) return g;
  }
  return null;
}
const ORNEK = ['tepsi:bakir', 'kiyafet:yesil', 'dekor:koltuk', 'dekor:yilbasi-kirmizi', 'tepsi:altin', 'kiyafet:altin'];
console.log('kol | ' + ORNEK.map((k) => URUNLER.find((u) => `${u.tur}:${u.id}` === k)!.ad).join(' | '));
for (const kol of secKollar) {
  const hucre = (o: Oyuncu) => ORNEK.map((k) => {
    const u = URUNLER.find((x) => `${x.tur}:${x.id}` === k)!;
    return `${kol.fiyat(u)}💎→${o.kod} ${gunYaz(birikimGunu(o, kol.fiyat(u), u.salon))}.g`;
  }).join(' | ');
  for (const o of secOyuncular.slice(0, 3)) console.log(`${kol.kod.padEnd(3)} | ${hucre(o)}`);
}
console.log('');

console.log('--- §2e RİTİM: hedef 💎\'ı bittikten sonra yalnız günlük akışla bir ürün kaç günde (fiyat ÷ günlük 💎) ---');
console.log('kol | kademe A | B | C | D   (E0 10/gün · İ ve K 20/gün · K+İ 30/gün)');
for (const kol of secKollar) {
  const tip = (k: Urun['kademe']) => URUNLER.filter((u) => u.kademe === k).map((u) => kol.fiyat(u));
  const hucre = (k: Urun['kademe']) => {
    const f = Math.max(...tip(k));
    return `${f}💎: ${[10, 20, 30].map((g) => vir(f / g)).join(' / ')} g`;
  };
  console.log(`${kol.kod.padEnd(3)} | ${(['A', 'B', 'C', 'D'] as const).map(hucre).join(' | ')}`);
}
console.log('(K0 kademe içinde fiyat farklıysa en pahalısı yazılır.)');
console.log('');

console.log('--- §2c DUYARLILIK: günlük aktif oyun süresi (E0 · kozmetik önce · ilk kozmetik / 30. gün adet / hepsi) ---');
console.log('kol | 0,5 sa/gün | 1 sa/gün | 2 sa/gün');
for (const kol of secKollar) {
  const h = [0.5, 1, 2].map((s) => { const r = defter(OYUNCULAR[0], kol, 'kozmetik', s); return `${gunYaz(r.ilk)} / ${r.g30} / ${gunYaz(r.tum)}`; });
  console.log(`${kol.kod.padEnd(3)} | ${h.map((x) => x.padStart(14)).join(' | ')}`);
}
console.log('');

/* ── §3 PAKET HİZASI ──────────────────────────────────────────────────────────────── */
function paketAnalizi(kol: FiyatKolu, P: number) {
  const fiyatlar = URUNLER.map((u) => kol.fiyat(u));
  // Alt küme toplamı (her ürün bir kez): P'yi aşmayan en büyük toplam → artık = P − o.
  const ulas = new Set<number>([0]);
  for (const f of fiyatlar) for (const s of [...ulas]) if (s + f <= P) ulas.add(s + f);
  const enIyi = Math.max(...ulas);
  const tek = URUNLER.filter((u) => kol.fiyat(u) <= P).sort((a, b) => kol.fiyat(b) - kol.fiyat(a))[0];
  let kalan = P, adet = 0;
  for (const f of [...fiyatlar].sort((a, b) => a - b)) if (f <= kalan) { kalan -= f; adet++; }
  return { artik: P - enIyi, tek: tek ? `${tek.ad} (${kol.fiyat(tek)})` : 'HİÇBİR ŞEY', adet, enUcuz: Math.min(...fiyatlar) };
}
console.log('--- §3 PAKET HİZASI: paket TEK BAŞINA (0 💎 bakiye) ne alır · en iyi kombinasyonda artık 💎 ---');
console.log('kol | paket | en pahalı tek ürün | en ucuzdan kaç adet | en az artık 💎');
for (const kol of secKollar) {
  for (const P of C.iap.diamondPacks) {
    const a = paketAnalizi(kol, P);
    console.log(`${kol.kod.padEnd(3)} | ${String(P).padStart(5)} | ${a.tek.padEnd(34)} | ${String(a.adet).padStart(19)} | ${a.artik}`);
  }
}
console.log('');
console.log('--- §3b Vitrin toplamı ve kademe dağılımı ---');
for (const kol of secKollar) {
  const top = URUNLER.reduce((a, u) => a + kol.fiyat(u), 0);
  const tur = (t: Tur) => URUNLER.filter((u) => u.tur === t).map((u) => kol.fiyat(u));
  console.log(`${kol.kod} ${kol.ad}: toplam ${top} 💎 · kıyafet [${tur('kiyafet').join(', ')}] · tepsi [${tur('tepsi').join(', ')}] · dekor [${tur('dekor').join(', ')}]`);
}
console.log('');
console.log('Oyuncular:');
for (const o of secOyuncular) console.log(`  ${o.kod.padEnd(4)} ${o.ad} · ${o.gunluk} 💎/gün${o.pesin ? ` · peşin ${o.pesin}` : ''}`);
console.log('Kademe: A lamba · bakır · emaye | B 4 yelek/kıyafet · radyo · tablo · kanarya · saat | C askılı tepsi · koltuk · semaver · gramofon · 4 yılbaşı | D altın yelek · altın tepsi');
console.log('MODEL SINIRLARI: (1) günlük görev her gün tamamlanır; (2) hedef 💎 12 sa aktif oyundan sonra düşmüyor sayılır (alt sınır);');
console.log('(3) Temizlik kademeleri Servis ile aynı anda; (4) 12 sa\'ten sonra 20 masa Usta\'ya uygun (talep üst sınırı);');
console.log('(5) dekor yuvası salonu açılınca alınır (3. Salon: Normal profil saati).');

damgaOzeti();
