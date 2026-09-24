/**
 * kozmetik.ts — 💎 VİTRİNİNİN GÖRÜNÜMLERİ (F4c). Denge değil görünüm: fiyat ve sıra
 * `economy.config.ts` `cosmetics.outfits/trays`'te, burada yalnız neyin nasıl çizildiği.
 *
 * Adaylar aynı kadrajda render edilip seçildi (`tools/vitrin-adaylari.html`, 2026-09-24):
 * kurucu = K4 (başlangıç paketi) · vitrin K2 K5 K7 K8 K10 · tepsi T2 T3 T4 T7.
 */
import { PALETTE } from './palette';

export interface KiyafetGorunum {
  gomlek: string;
  pantolon: string;
  /** Göğse sarılan üç parçalı yelek; yoksa gömlek açıkta. */
  yelek?: string;
  dugme?: string;
  kostek?: boolean;
  papyon?: string;
  atki?: string;
  kasket?: string;
  fes?: string;
  hasir?: string;
  /** Klasik patron işaretleri (D-116): omuz havlusu + sıvalı kol. */
  havlu?: boolean;
  sivaliKol?: boolean;
}

const ALTIN = '#d4af37';

export const KIYAFET_GORUNUM: Record<string, KiyafetGorunum> = {
  klasik: { gomlek: PALETTE.shirt, pantolon: PALETTE.pants, havlu: true, sivaliKol: true },
  // K4 — başlangıç paketine özel; fes başka hiçbir üründe yok (K3 bu yüzden elendi).
  kurucu: { gomlek: PALETTE.shirt, pantolon: PALETTE.pants, yelek: '#7c2230', fes: '#9b1c22', sivaliKol: true },
  yesil: { gomlek: PALETTE.shirt, pantolon: PALETTE.pants, yelek: PALETTE.awning, kostek: true, dugme: ALTIN, sivaliKol: true },
  sef: { gomlek: '#fbfaf6', pantolon: '#1f1d1a', yelek: '#1f1d1a', papyon: '#9b1c22' },
  yazlik: { gomlek: '#a9cbe6', pantolon: '#cdbb94', hasir: '#dcc588', sivaliKol: true },
  kislik: { gomlek: '#8a2b2f', pantolon: PALETTE.pants, atki: '#efe6cf', kasket: '#3a3a3a' },
  altin: { gomlek: '#1f1d1a', pantolon: '#1f1d1a', yelek: ALTIN, dugme: '#1f1d1a', papyon: '#1f1d1a' },
};

export const kiyafetGorunum = (id: string): KiyafetGorunum => KIYAFET_GORUNUM[id] ?? KIYAFET_GORUNUM.klasik;

export interface TepsiGorunum {
  /** kutu = bugünkü dikdörtgen; yuvarlak; aski = yuvarlak + üç kol + halka (elden ASILI taşınır). */
  tip: 'kutu' | 'yuvarlak' | 'aski';
  renk: string;
  metal?: boolean;
  kenar?: string;
  desen?: string;
  /** İnce belli bardak + tabak (klasikte düz bardak kalır). */
  belli: boolean;
  tabak?: string;
}

export const TEPSI_GORUNUM: Record<string, TepsiGorunum> = {
  klasik: { tip: 'kutu', renk: '#8d6e63', belli: false },
  bakir: { tip: 'yuvarlak', renk: '#b8733a', metal: true, belli: true, tabak: '#f4f1ea' },
  emaye: { tip: 'yuvarlak', renk: '#b3262a', desen: '#f4f1ea', belli: true, tabak: '#f4f1ea' },
  aski: { tip: 'aski', renk: '#c9ccd1', metal: true, belli: true, tabak: '#f4f1ea' },
  altin: { tip: 'yuvarlak', renk: ALTIN, metal: true, kenar: ALTIN, belli: true, tabak: ALTIN },
};

export const tepsiGorunum = (id: string): TepsiGorunum => TEPSI_GORUNUM[id] ?? TEPSI_GORUNUM.klasik;

/** Vitrin şeridindeki renk pulu (iki ton: ana + ikincil). */
export function kiyafetPulu(id: string): [string, string] {
  const k = kiyafetGorunum(id);
  return [k.yelek ?? k.gomlek, k.fes ?? k.hasir ?? k.papyon ?? k.atki ?? k.pantolon];
}
export function tepsiPulu(id: string): [string, string] {
  const t = tepsiGorunum(id);
  return [t.renk, t.kenar ?? t.desen ?? t.tabak ?? t.renk];
}

/** 💎 dekorun vitrin pulu (F4c-2): eşyanın kendi iki ana rengi (ahşap/metal/kumaş). */
const DEKOR_PULU: Record<string, [string, string]> = {
  radyo: ['#6b4226', '#d9c79b'],
  koltuk: ['#7a5230', '#c9a36a'],
  lamba: ['#2a1c12', '#f4ead2'],
  tablo: [ALTIN, '#6b8fb3'],
  semaver: ['#b8733a', '#f4f1ea'],
  gramofon: [ALTIN, '#6b4226'],
  kanarya: ['#ffd23f', ALTIN],
  saat: ['#5a3a22', '#f4ead2'],
  'yilbasi-kirmizi': ['#b3262a', '#f4f1ea'],
  'yilbasi-yesil': ['#2f7d4a', '#f4f1ea'],
  'yilbasi-mavi': ['#2f5f9e', '#f4f1ea'],
  'yilbasi-kahve': ['#6b4226', '#f4f1ea'],
};
export const dekorPulu = (id: string): [string, string] => DEKOR_PULU[id] ?? ['#8d6e63', '#d7ccc8'];
