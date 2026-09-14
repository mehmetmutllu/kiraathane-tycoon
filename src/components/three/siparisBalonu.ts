import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import type { ProductId } from '../../config/economy.config';
import { PALETTE } from '../../config/palette';

/**
 * siparisBalonu.ts — müşterinin başının üstündeki SİPARİŞ göstergesi (S18).
 *
 * NEDEN DEĞİŞTİ: gösterge bugüne kadar **sarı bir küreydi** ve iki şeyi birden söyleyemiyordu —
 * "bu müşteri bekliyor" ile "ne bekliyor"u. Kullanıcı 2026-09-14: *"sipariş varsa üzerlerinde
 * sarı top çıkıyo ya onun yerine konuşma balonu vs olabilir içinde siparişin svgsi olan"*.
 * Katalogda iki ürün var (çay · tost) ve ikisinin hazırlama süresi/fiyatı çok farklı; hangisinin
 * beklendiğini görmek oyuncunun sırasını kurmasına yarıyor, süs değil.
 *
 * NEDEN DOKU, NEDEN 3B MESH DEĞİL: baloncuk her karede kameraya dönen düz bir levha (billboard)
 * ve müşteri sayısı 80'e kadar çıkıyor. Ürün başına TEK doku üretilip `InstancedMesh`le çizilince
 * maliyet ürün sayısı kadar çizim çağrısında kalıyor; 3B bir bardak modeli her müşteri için ayrı
 * geometri demekti. Doku bir kez üretilir ve önbelleklenir.
 *
 * NEDEN EMOJİ DEĞİL, NEDEN ELLE ÇİZİM: `feedback_ui_game_feel` — emoji ve sistem ikonu yasak,
 * "chunky" hissin kaynağı KALIN KOYU KONTUR. Balon da, içindeki glif de o gramerle çiziliyor
 * (kontur `PALETTE.outline`, gövde krem, aksan amber). Dosya asseti gerekmiyor: şekiller
 * Canvas2D'de üretiliyor, yani lisans yüzeyi sıfır ve tema rengiyle birlikte değişebilir.
 */

/** Doku çözünürlüğü. Balon ekranda ~0,5 br; 256 px yakın kamerada da yumuşak kalıyor. */
const BOY = 256;

/** Kalın koyu kontur — arayüz gramerinin taşıyıcısı (D-107/S11). */
const KONTUR = 12;

/** Yuvarlatılmış dikdörtgen + aşağı bakan kuyruk: "konuşma balonu" şekli. */
function balonYolu(c: CanvasRenderingContext2D, x: number, y: number, g: number, y2: number, r: number) {
  const kx = x + g / 2;          // kuyruk orta ekseni
  const kg = g * 0.16;           // kuyruk genişliği
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + g - r, y);
  c.quadraticCurveTo(x + g, y, x + g, y + r);
  c.lineTo(x + g, y + y2 - r);
  c.quadraticCurveTo(x + g, y + y2, x + g - r, y + y2);
  // kuyruk: sağdan sola giderken aşağı bir üçgen çıkar
  c.lineTo(kx + kg, y + y2);
  c.lineTo(kx, y + y2 + g * 0.17);
  c.lineTo(kx - kg, y + y2);
  c.lineTo(x + r, y + y2);
  c.quadraticCurveTo(x, y + y2, x, y + y2 - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

/** İNCE BELLİ BARDAK — kıraathanenin kendi kabı (projectBrief'in çekirdek imgesi). */
function cayCiz(c: CanvasRenderingContext2D, mx: number, my: number, o: number) {
  const g = 104 * o;  // balon ic genisliginin ~%45i
  const y = 132 * o;
  c.lineWidth = 13 * o;
  c.lineJoin = 'round';
  c.strokeStyle = PALETTE.outline;
  // Gövde: belden içeri giren silüet (ince belli).
  c.beginPath();
  c.moveTo(mx - g / 2, my - y / 2);
  c.quadraticCurveTo(mx - g * 0.22, my, mx - g * 0.36, my + y / 2);
  c.lineTo(mx + g * 0.36, my + y / 2);
  c.quadraticCurveTo(mx + g * 0.22, my, mx + g / 2, my - y / 2);
  c.closePath();
  c.fillStyle = '#d2701f'; // demli çay — tavsan kani, koyu degil
  c.fill();
  c.stroke();
  // Üstte açık bir çay yüzeyi şeridi: bardağın dolu olduğunu söyler.
  c.beginPath();
  c.moveTo(mx - g / 2 + 4 * o, my - y / 2 + 7 * o);
  c.lineTo(mx + g / 2 - 4 * o, my - y / 2 + 7 * o);
  c.lineWidth = 11 * o;
  c.strokeStyle = '#f2a95c';
  c.stroke();
  // Tabak.
  c.beginPath();
  c.ellipse(mx, my + y / 2 + 13 * o, g * 0.70, 11 * o, 0, 0, Math.PI * 2);
  c.fillStyle = '#e9e2d2';
  c.fill();
  c.lineWidth = 12 * o;
  c.strokeStyle = PALETTE.outline;
  c.stroke();
}

/** TOST — üçgen kesilmiş, kabuk + iç dolgu. */
function tostCiz(c: CanvasRenderingContext2D, mx: number, my: number, o: number) {
  const s = 82 * o;
  c.lineWidth = 13 * o;
  c.lineJoin = 'round';
  c.strokeStyle = PALETTE.outline;
  c.beginPath();
  c.moveTo(mx - s * 0.9, my + s * 0.62);
  c.lineTo(mx + s * 0.9, my + s * 0.62);
  c.lineTo(mx, my - s * 0.72);
  c.closePath();
  c.fillStyle = '#d9a04e'; // kızarmış ekmek
  c.fill();
  c.stroke();
  // İç dolgu: alt kenara paralel koyu bir şerit (peynir/kaşar okunuşu).
  c.beginPath();
  c.moveTo(mx - s * 0.52, my + s * 0.18);
  c.lineTo(mx + s * 0.52, my + s * 0.18);
  c.lineWidth = 17 * o;
  c.strokeStyle = '#c4622a';
  c.stroke();
}

const onbellek = new Map<ProductId, CanvasTexture>();

/**
 * Ürünün baloncuk dokusu. Ürün başına BİR KEZ üretilir; `InstancedMesh` aynı dokuyu paylaşır.
 * Tarayıcı yoksa (test/SSR) `null` döner — çağıran ilkel kola düşer.
 */
export function siparisDokusu(urun: ProductId): CanvasTexture | null {
  const onceki = onbellek.get(urun);
  if (onceki) return onceki;
  if (typeof document === 'undefined') return null;

  const cv = document.createElement('canvas');
  cv.width = BOY;
  cv.height = BOY;
  const c = cv.getContext('2d');
  if (!c) return null;

  // Balon: üstte, kuyruk için altta pay bırakılır.
  const pay = KONTUR;
  const g = BOY - pay * 2;
  const y2 = BOY * 0.72 - pay;
  c.lineWidth = KONTUR * 1.6;
  c.lineJoin = 'round';
  c.strokeStyle = PALETTE.outline;
  balonYolu(c, pay, pay, g, y2, 34);
  c.fillStyle = '#f6efe0';
  c.fill();
  c.stroke();

  const o = BOY / 256;
  if (urun === 'tost') tostCiz(c, BOY / 2, pay + y2 / 2, o);
  else cayCiz(c, BOY / 2, pay + y2 / 2, o);

  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.needsUpdate = true;
  onbellek.set(urun, t);
  return t;
}
