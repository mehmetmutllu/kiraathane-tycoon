import {
  CanvasTexture, LinearFilter, SRGBColorSpace, Scene, Group, Mesh, LatheGeometry, CircleGeometry,
  MeshStandardMaterial, MeshBasicMaterial, BackSide, DoubleSide, Vector2, Box3, Vector3,
  OrthographicCamera, HemisphereLight, DirectionalLight, WebGLRenderTarget, Color,
} from 'three';
import type { WebGLRenderer, Object3D } from 'three';
import type { ProductId } from '../../config/economy.config';
import { PALETTE } from '../../config/palette';

/**
 * siparisBalonu.ts — müşterinin başının üstündeki SİPARİŞ göstergesi (S18 · S19b).
 *
 * NEDEN BALON: gösterge bugüne kadar **sarı bir küreydi** ve iki şeyi birden söyleyemiyordu —
 * "bu müşteri bekliyor" ile "ne bekliyor"u. Kullanıcı 2026-09-14: *"sipariş varsa üzerlerinde
 * sarı top çıkıyo ya onun yerine konuşma balonu vs olabilir içinde siparişin svgsi olan"*.
 *
 * NEDEN DOKU, NEDEN SAHNEDE 3B MESH DEĞİL: baloncuk her karede kameraya dönen düz bir levha
 * (billboard) ve müşteri sayısı 80'e kadar çıkıyor. Ürün başına TEK doku üretilip
 * `InstancedMesh`le çizilince maliyet ürün sayısı kadar çizim çağrısında kalıyor.
 *
 * İÇİ NEDEN ARTIK ÇİZİM DEĞİL, NESNE (S19b · D-116): balonun ÇERÇEVESİ (kalın koyu kontur,
 * krem gövde, kuyruk) S18'de kabul edildi; içindeki glif iki turdur kabul edilmedi
 * (*"o svgler hâlâ güzel değil"*). Üçüncü kez elle çizmek yerine yön değişti: model bir kez
 * karede PİŞİRİLİP doku oluyor. Çerçeve ve kuyruk aynen Canvas2D kalıyor — reddedilen o değildi.
 *
 * Tost = **Kenney Food Kit** `sandwich` (CC0; dokuz KayKit paketinde tost YOK — stil kilidi
 * bilerek açıldı, `public/assets/README.md`). Çay = **bizim ince belli bardağımız**: iki
 * pakette de yoktu, dönel yüzey olarak burada çiziliyor.
 *
 * KONTUR NESNEDE DE KORUNUR: arayüz gramerinin taşıyıcısı kalın koyu kontur
 * (`feedback_ui_game_feel`). Model, kendisinden biraz büyük ve yalnız ARKA yüzleri çizilen koyu
 * bir kopyanın önüne çiziliyor (ters kabuk) — silüetin çevresinde o kontur kalıyor.
 */

/** Doku çözünürlüğü. Balon ekranda ~0,5 br; 256 px yakın kamerada da yumuşak kalıyor. */
const BOY = 256;

/** Kalın koyu kontur — arayüz gramerinin taşıyıcısı (D-107/S11). */
const KONTUR = 12;

/** Balonun İÇ dikdörtgeni (balon gövdesine oran) — her ürün buraya sığar, kartlar eşit ağırlıkta. */
const IC = { ustPay: 0.1, genislik: 0.7, yukseklik: 0.72 };

/** Ters kabuk konturunun kalınlığı (nesnenin kendi boyuna oran). */
const KONTUR_KABUK = 0.055;

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

/**
 * İNCE BELLİ BARDAĞIN PROFİLİ — dönel yüzeyin (`LatheGeometry`) kesiti: (yarıçap, yükseklik).
 *
 * Kıraathanenin çekirdek imgesi (`projectBrief` → "ince belli bardaklarda çay"). Ne dokuz KayKit
 * paketinde ne Kenney'de var: Kenney'nin `cup-tea`si kulplu fincan, `glass`ı düz bardak — ikisi
 * de başka bir içecek kültürünü anlatıyor. Bu yüzden ÇİZİLDİ, indirilmedi (D-116 · B1).
 *
 * Sıra: dar ayak → şişen karın → **bel** → açılan ağız. Silüeti okutan şey belin ağızdan dar
 * olması; ikisi yakınlaşırsa bardak düz bir silindire döner ve çayhane imgesi kaybolur.
 */
const BARDAK_PROFILI: readonly (readonly [number, number])[] = [
  [0.0, 0.0], [0.26, 0.0], [0.28, 0.03], [0.23, 0.08],
  [0.34, 0.2], [0.42, 0.34], [0.39, 0.46],
  [0.3, 0.6], [0.31, 0.68],
  [0.38, 0.84], [0.45, 0.97], [0.45, 1.0],
];

/** Belin ağızdan ne kadar dar olduğu — silüetin okunması bu farka bağlı, bekçisi de bunu ölçer. */
export const BARDAK_BEL = 0.3;
export const BARDAK_AGIZ = 0.45;

function cayBardagi(): Group {
  const g = new Group();
  // Bardağın İÇİ boyanır: 44 px'te cam saydamlığı okunmuyor (S18'de denendi ve elendi),
  // okunan şey demli çayın kendi rengi — tavşan kanı.
  const cam = new Mesh(
    new LatheGeometry(BARDAK_PROFILI.map(([r, y]) => new Vector2(r, y)), 22),
    new MeshStandardMaterial({ color: '#d2701f', roughness: 0.35, metalness: 0.05, side: DoubleSide }),
  );
  g.add(cam);
  // Çayın yüzeyi: ağza yakın açık bir disk — bardağın DOLU olduğunu söyler.
  const yuzey = new Mesh(new CircleGeometry(0.4, 22), new MeshStandardMaterial({ color: '#f2a95c', roughness: 0.5 }));
  yuzey.rotation.x = -Math.PI / 2;
  yuzey.position.y = 0.9;
  g.add(yuzey);
  // Tabak: bardak havada durmasın.
  const tabak = new Mesh(
    new LatheGeometry(
      ([[0, 0], [0.62, 0], [0.66, 0.05], [0.6, 0.06], [0, 0.045]] as const).map(([r, y]) => new Vector2(r, y)),
      22,
    ),
    new MeshStandardMaterial({ color: '#e9e2d2', roughness: 0.8, side: DoubleSide }),
  );
  tabak.position.y = -0.06;
  g.add(tabak);
  return g;
}

/** Nesnenin çevresine kalın koyu kontur: kendisinden büyük, yalnız ARKA yüzleri çizilen kopya. */
function tersKabuk(nesne: Object3D, kalinlik: number): Object3D {
  const kabuk = nesne.clone(true);
  const koyu = new MeshBasicMaterial({ color: PALETTE.outline, side: BackSide });
  kabuk.traverse((n) => {
    const m = n as Mesh;
    if (m.isMesh) m.material = koyu;
  });
  kabuk.scale.multiplyScalar(1 + kalinlik);
  return kabuk;
}

/**
 * Nesneyi kare bir hedefe pişirir ve piksellerini döndürür. Kamera ORTOGRAFİK ve nesnenin KENDİ
 * sınır kutusundan çerçeveleniyor — böylece tost ile bardak, gerçek boyları çok farklı olsa da
 * balonun içinde AYNI ağırlıkta duruyor (S19a'nın kart kuralı: adaylar ortak iç dikdörtgene
 * sığdırılır, yoksa karşılaştırma boyu büyük olanı seçer).
 */
function nesneKaresi(gl: WebGLRenderer, nesne: Object3D, px: number): ImageData | null {
  if (typeof document === 'undefined') return null;
  const sahne = new Scene();
  const grup = new Group();
  grup.add(tersKabuk(nesne, KONTUR_KABUK));
  grup.add(nesne);
  // Çeyrek açı: karşıdan bakan bir kare, tostu da bardağı da düz bir lekeye çevirirdi.
  grup.rotation.set(0.42, 0.62, 0);
  sahne.add(grup);
  sahne.add(new HemisphereLight('#ffffff', '#8d8272', 2.1));
  const gunes = new DirectionalLight('#fff6e0', 1.7);
  gunes.position.set(2, 4, 3);
  sahne.add(gunes);

  grup.updateMatrixWorld(true);
  const kutu = new Box3().setFromObject(grup);
  const merkez = kutu.getCenter(new Vector3());
  const boy = kutu.getSize(new Vector3());
  const yari = Math.max(boy.x, boy.y) * 0.56; // hava payı
  const k = new OrthographicCamera(-yari, yari, yari, -yari, 0.01, 100);
  k.position.set(merkez.x, merkez.y, merkez.z + 10);
  k.lookAt(merkez);

  const hedef = new WebGLRenderTarget(px, px, { samples: 4 });
  const eskiHedef = gl.getRenderTarget();
  const eskiRenk = gl.getClearColor(new Color());
  const eskiAlfa = gl.getClearAlpha();
  gl.setRenderTarget(hedef);
  gl.setClearColor(0x000000, 0);
  gl.clear(true, true, false);
  gl.render(sahne, k);
  const tampon = new Uint8Array(px * px * 4);
  gl.readRenderTargetPixels(hedef, 0, 0, px, px, tampon);
  // SAHNENİN HEDEFİ GERİ VERİLİR: verilmezse oyunun kendi karesi bu küçük hedefe çizilir ve
  // ekran kararır — pişirme oyunun çizim döngüsünün İÇİNDEN çağrılıyor.
  gl.setRenderTarget(eskiHedef);
  gl.setClearColor(eskiRenk, eskiAlfa);
  hedef.dispose();

  const yardimci = document.createElement('canvas');
  yardimci.width = px;
  yardimci.height = px;
  const yc = yardimci.getContext('2d');
  if (!yc) return null;
  const im = yc.createImageData(px, px);
  // WebGL satırları ALTTAN ÜSTE verir; tuval üstten alta ister.
  for (let y = 0; y < px; y++) {
    const kaynak = (px - 1 - y) * px * 4;
    im.data.set(tampon.subarray(kaynak, kaynak + px * 4), y * px * 4);
  }
  return im;
}

const onbellek = new Map<ProductId, CanvasTexture>();

/**
 * Ürünün baloncuk dokusu. Ürün başına BİR KEZ üretilir; `InstancedMesh` aynı dokuyu paylaşır.
 *
 * `gl` yoksa (test/SSR) ya da tost modeli henüz yüklenmediyse balon **boş çerçeve** olarak
 * döner ve ÖNBELLEĞE ALINMAZ — çağıran model gelince yeniden ister. Sessizce `null` dönmek,
 * bekleyen müşterinin başında hiç gösterge olmaması demekti.
 */
export function siparisDokusu(urun: ProductId, gl?: WebGLRenderer, tostModeli?: Object3D): CanvasTexture | null {
  const onceki = onbellek.get(urun);
  if (onceki) return onceki;
  if (typeof document === 'undefined') return null;
  const nesne = urun === 'tost' ? tostModeli : cayBardagi();

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

  const dolu = Boolean(gl && nesne);
  if (gl && nesne) {
    const px = Math.round(Math.min(g * IC.genislik, y2 * IC.yukseklik));
    const im = nesneKaresi(gl, nesne.clone(true), px);
    if (im) {
      const yardimci = document.createElement('canvas');
      yardimci.width = px;
      yardimci.height = px;
      yardimci.getContext('2d')?.putImageData(im, 0, 0);
      c.drawImage(yardimci, pay + (g - px) / 2, pay + y2 * IC.ustPay);
    }
  }

  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.needsUpdate = true;
  if (dolu) onbellek.set(urun, t);
  return t;
}
