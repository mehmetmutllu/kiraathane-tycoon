/**
 * olcum-iap-f4a.ts — F4a: SATIN ALIMLAR neyi satıyor? (varyant kapısı · D-084)
 *
 * Koşu:  npx tsx tools/olcum-iap-f4a.ts                               (KISA — yön, rapora girmez)
 *        OLCUM=tam npx tsx tools/olcum-iap-f4a.ts > docs/olcum-iap-f4a.txt (TAM — rapora yalnız bu)
 *
 * SORU — F4 üç ürün satacak: Reklamları Kaldır (+10 💎/gün, D-040) · başlangıç paketi (💎 + kozmetik) ·
 * elmas paketleri (sınırsız alınır). İkisi `economy.config.ts`e 💎 miktarı yazar → varyant kapısı.
 *
 * İKİ BÖLÜM, İKİ ÖLÇEK:
 *   §1 SİM (saat): peşin 💎 Kat 1 zincirini hızlandırıyor mu? Paket oyunun İLK saniyesinde alınır ve
 *      💎 Usta uygun olduğu an harcanır → ÜST SINIR. P∞ = sınırsız 💎 (en çok ödeyen oyuncu).
 *   §2 ELMAS DEFTERİ (gün): 💎'ın harcanacak yeri ne kadar? Bir paket, alındığı gün kalan
 *      talebin ne kadarını karşılar, ne kadarı ÖLÜ 💎 olur (harcanacak yer kalmaz).
 *
 * DAMGALAR: (a) B0 = yürürlükteki taban (F3b T0 izi 38fd43d5); (b) taban tekrar = taban;
 * (c) her peşin kolunda Usta alımı tabandan ÖNCE ya da FAZLA; (d) 💎 korunumu 0.
 */
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla, kolAyarla, VARSAYILAN,
  hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla, masaSirasiAyarla,
  type Olcut, type Bosluk, type HedefDurum,
} from './simulate.ts';
import { HEDEF_KOLLARI } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla, sonKosuAtlamalari } from './itibar-kollari.ts';
import {
  USTA_KOLLARI, HEDEF_ELMAS_TOPLAM, kayitSifirla as ustaKayitSifirla, sonKosuAlimlari, korunumSapmasi,
} from './usta-kollari.ts';
import { fabrika as siraFabrikasi, kolBul } from './sira-kollari.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { LAYOUT } from '../src/game/layout.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)}` : '—');
const dk = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 60).toFixed(1)}` : '—');
const yuzde = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
const vir = (x: number, n = 1) => x.toFixed(n).replace('.', ',');

/* ── §1 SİM ─────────────────────────────────────────────────────────────────────────── */
/** Seviye ₺ ödülü (D-142) — F3b T0'ın ödeyicisinin aynısı, video yok: taban = reklamsız oyuncu. */
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

interface Kol { kod: string; ad: string; pesin: number; kisa?: boolean }
const KOLLAR: Kol[] = [
  { kod: 'B50', ad: 'peşin 50 💎 (2 Usta)', pesin: 50, kisa: true },
  { kod: 'B100', ad: 'peşin 100 💎 (4 Usta)', pesin: 100 },
  { kod: 'B250', ad: 'peşin 250 💎 (10 Usta — hedeflerin toplamı kadar)', pesin: 250 },
  { kod: 'P∞', ad: 'sınırsız 💎 (her Usta uygun olduğu an alınır)', pesin: 1_000_000, kisa: true },
];

interface Sonuc { o: Olcut; iz: string; alim: number; ilkUsta?: number; korunum: number }
function iz(b: Bosluk[]): string {
  const h = izOlustur();
  for (const x of b) h.ekle(x.t, x.gap);
  return h.deger;
}
function olc(pesin: number | null): Sonuc {
  masaSirasiAyarla(siraFabrikasi(kolBul('A')));
  hedefAkisiAyarla(seviyeOdeyici());
  itibarKayitSifirla();
  ustaKayitSifirla();
  hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
  itibarAyarla(ITIBAR_KOLLARI.rUYG.fabrika(1));
  ustaAyarla(pesin == null ? USTA_KOLLARI.eUYG.fabrika(1) : USTA_KOLLARI.eIAP.fabrika(pesin));
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
  const o = olcutler();
  const al = sonKosuAlimlari();
  const s: Sonuc = { o, iz: iz(o.bosluklarNormal), alim: al.length, ilkUsta: al[0]?.t, korunum: korunumSapmasi() };
  hedefAkisiAyarla(null);
  masaSirasiAyarla(null);
  return s;
}

kipBandi();
console.log('=== F4a — SATIN ALIMLAR: peşin 💎 → Kat 1 (sim) · 💎 talebi ve paket boyu (defter) ===');
console.log('');
console.log('economy.config.ts DOSYASI DEĞİŞMEDİ — peşin 💎 sim kancasıyla (usta-kollari eIAP) uygulanır.');
console.log('Taban = yürürlükteki oyun, reklamsız: seviye ₺ 1× · Usta eUYG · HRE yığını · masa sırası A.');
console.log('ÜST SINIR: paket t=0\'da alınmış, 💎 Usta uygun olduğu an harcanıyor.');
console.log('');

kolAyarla(VARSAYILAN);
const taban = olc(null);
const b0 = olc(0);
const secilen = KISA ? KOLLAR.filter((k) => k.kisa) : KOLLAR;
const sonuc = new Map<string, Sonuc>();
for (const k of secilen) sonuc.set(k.kod, olc(k.pesin));
const tekrar = olc(null);

damga('B0 = taban (peşin 0 kancası birebir)', b0.iz === taban.iz, `${b0.iz} ≠ ${taban.iz}`);
damga('taban = F3b T0 (parmak izi 38fd43d5)', taban.iz === '38fd43d5', `taban izi ${taban.iz}`);
damga('kancalar sızmadı (taban tekrar = taban)', tekrar.iz === taban.iz, `${tekrar.iz} ≠ ${taban.iz}`);
for (const k of secilen) {
  const s = sonuc.get(k.kod)!;
  damga(`${k.kod} 💎 korunumu 0`, s.korunum === 0, `sapma ${s.korunum}`);
  damga(`${k.kod} peşin 💎 harcandı (alım tabandan fazla ya da erken)`,
    s.alim > taban.alim || (s.ilkUsta ?? Infinity) < (taban.ilkUsta ?? Infinity),
    `alım ${s.alim} / taban ${taban.alim}`);
  varyantDamgasi(k.kod, taban.iz, s.iz);
}

console.log('--- §1 PEŞİN 💎 → KAT 1 (Normal profil · dKat1 tabana göre · eleme eşiği %7) ---');
const bas = 'kol  | KAT1 sa | dKat1  | HÜKÜM ideal | GÖZLEM normal | Usta alımı (12 sa) | ilk Usta sa';
console.log(bas);
console.log('-'.repeat(bas.length));
function satir(kod: string, s: Sonuc): void {
  const d = s.o.serit != null && taban.o.serit != null ? yuzde((s.o.serit - taban.o.serit) / taban.o.serit) : '—';
  console.log(
    kod.padEnd(4) + ' | ' + sa(s.o.serit).padStart(7) + ' | ' + d.padStart(6) +
    ' | ' + `${s.o.idealAsan} · ${dk(s.o.idealEnUzun)}`.padStart(11) +
    ' | ' + `${s.o.normalAsan} · ${dk(s.o.normalEnUzun)}`.padStart(13) +
    ' | ' + String(s.alim).padStart(18) + ' | ' + sa(s.ilkUsta).padStart(11),
  );
}
satir('T0', taban);
for (const k of secilen) satir(k.kod, sonuc.get(k.kod)!);
console.log('Kollar:');
console.log('  T0   taban: reklamsız, paket yok (B0 = peşin 0, birebir)');
for (const k of secilen) console.log(`  ${k.kod.padEnd(4)} ${k.ad}`);
console.log(`Parmak izi: taban ${taban.iz} · ${secilen.map((k) => `${k.kod} ${sonuc.get(k.kod)!.iz}`).join(' · ')}`);
console.log('');

/* ── §2 ELMAS DEFTERİ (gün ölçeği) ──────────────────────────────────────────────────── */
const USTA_HEDEF = LAYOUT.tables.length; // oyunda Usta yalnız masada (rules.masterId 'table')
const FIYAT = C.master.diamondCost;
const TALEP = USTA_HEDEF * FIYAT;
const GUNLUK = C.dailyQuests.diamondsPerDay;
const KALDIR_GUNLUK = 10; // D-040 — F4a'da config'e yazılacak sayı; burada kıyas için sabit
const USTA_VIDEO_GUN = C.rewarded.masterPerDay;
/** Oyunda 💎 harcanan başka yer var mı? — defterin kapsamını KOD belirler, varsayım değil. */
const DIGER_HARCAMA = 'yok (kozmetik ₺ ile · diamondExtendHours tanımlı ama hiçbir yerde kullanılmıyor)';

interface Oyuncu { kod: string; ad: string; gunluk: number; videoUsta: number }
const OYUNCULAR: Oyuncu[] = [
  { kod: 'E0', ad: 'reklam izlemez, satın almaz', gunluk: GUNLUK, videoUsta: 0 },
  { kod: 'U1', ad: 'her gün Usta videosunu izler (D-150)', gunluk: GUNLUK, videoUsta: USTA_VIDEO_GUN },
  { kod: 'K', ad: 'Reklamları Kaldır aldı (+10 💎/gün), video izlemez', gunluk: GUNLUK + KALDIR_GUNLUK, videoUsta: 0 },
];
/** Kat 1 sonunda (gün 0) hedeflerin 💎'ı düşmüş ve masalar tavanda varsayılır (F3b §3 modeli). */
const kalanTalep = (o: Oyuncu, gun: number) =>
  Math.max(0, TALEP - HEDEF_ELMAS_TOPLAM - gun * (o.gunluk + o.videoUsta * FIYAT));
const kuyrukGunu = (o: Oyuncu) => (TALEP - HEDEF_ELMAS_TOPLAM) / (o.gunluk + o.videoUsta * FIYAT);

console.log(`--- §2 💎 TALEBİ (Usta ${USTA_HEDEF} masa × ${FIYAT} 💎 = ${TALEP} · hedeflerden ${HEDEF_ELMAS_TOPLAM} · günlük ${GUNLUK}) ---`);
console.log(`Diğer 💎 harcaması: ${DIGER_HARCAMA}.`);
console.log('kalan talep = o gün hâlâ bir şeye harcanabilecek 💎 (gün 0 = Kat 1 sonu, masalar tavanda).');
const gunler = [0, 1, 3, 7, 14];
const tBas = 'oyuncu | ' + gunler.map((g) => `gün ${g}`.padStart(6)).join(' | ') + ' | talep biter';
console.log(tBas);
console.log('-'.repeat(tBas.length));
for (const o of OYUNCULAR) {
  console.log(`${o.kod.padEnd(6)} | ${gunler.map((g) => String(Math.round(kalanTalep(o, g))).padStart(6)).join(' | ')} | ${vir(kuyrukGunu(o))} gün`);
}
console.log('');

const PAKETLER = [25, 60, 150, 300, 600];
console.log('--- §2b PAKET BOYU: gün g\'de alınan P 💎 paketin İŞE YARAYAN / ÖLÜ kısmı ---');
console.log('işe yarar = min(P, kalan talep) · ölü = P − işe yarar (bugün harcanacak yer yok) · kısaltır = kuyruğu kaç gün öne çeker');
const pBas = 'oyuncu | gün | ' + PAKETLER.map((p) => `${p} 💎`.padStart(18)).join(' | ');
console.log(pBas);
console.log('-'.repeat(pBas.length));
for (const o of OYUNCULAR) {
  for (const g of [0, 3]) {
    const kt = kalanTalep(o, g);
    const hucre = (p: number) => {
      const yarar = Math.min(p, kt);
      const kisaltir = yarar / (o.gunluk + o.videoUsta * FIYAT);
      return `${Math.round(yarar)}/${p - Math.round(yarar)} ölü · ${vir(kisaltir)}g`.padStart(18);
    };
    console.log(`${o.kod.padEnd(6)} | ${String(g).padStart(3)} | ${PAKETLER.map(hucre).join(' | ')}`);
  }
}
console.log('Oyuncular:');
for (const o of OYUNCULAR) console.log(`  ${o.kod.padEnd(6)} ${o.ad}`);
console.log('MODEL SINIRI: Kat 1 bitmeden masalar tavanda değil → gün 0 talebi, Usta\'nın gerçekten açıldığı anın ÜST sınırı.');

damgaOzeti();
