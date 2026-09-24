/**
 * Kameranın ŞU ANKİ görüş-izdüşümü — **sahne yazar, tick okur** (H1/K2).
 *
 * NEDEN MODÜL DEĞİŞKENİ: matris her karede değişiyor; React state'i olsaydı saniyede 60 kez
 * yeniden render olurdu. `dwellState` (D-038) ve `activeStep` ile aynı desen — iki `useFrame`
 * değil, bir `useFrame` ile bir `tick` bu nesne üzerinden konuşuyor.
 *
 * NEDEN VAR: görev panı, hedefin ekranda olup olmadığını bilmeden atılıyordu. Ölçüldü
 * (`docs/erisim-raporu-h1.md`): erken görev zincirindeki **6 panın 6'sında hedef pan başlamadan
 * zaten ekrandaydı**, yani pan bilgi taşımıyor, yalnız hareket taşıyordu; bu sırada oyuncu
 * toplam **11,02 sn** kendi karakterini göremiyordu. Soruyu doğru yanıtlamanın tek yolu gerçek
 * izdüşümdür: "hedef kaç br uzakta" YETMEZ, çünkü eğik kamerada görüş yarıçapı yöne göre
 * **4,25 br ile 24,50 br** arasında değişiyor — tek bir mesafe eşiği bu ikisinin ya birini ya
 * ötekini yanlış yapardı.
 *
 * KAMERA YOKSA (vitest · `tools/simulate.ts` · sahne kurulmadan): `hazir` false kalır ve
 * `hedefEkranda` **false** döner → pan atılır, yani H1 ÖNCESİ davranış. Bu bilerek böyle:
 * ölçüm aracı olmayan bir ortam, ölçüye dayanan bir kısıtı uygulayamaz; sessizce pan'ı yutmak
 * yerine eski hâle düşmek doğru olan.
 */

/** Görüş-izdüşüm matrisi (projection × matrixWorldInverse), three.js düzeni: sütun-öncelikli. */
const pv = new Float64Array(16);

export const cameraView = {
  /** Sahne en az bir kare yazdı mı? */
  hazir: false,
};

/**
 * Sahne her karede çağırır. İki matrisi burada çarpıyoruz ki çağıran taraf `THREE.Matrix4`
 * ayırmak zorunda kalmasın (kare başına çöp üretmemek için tek `Float64Array` yeniden kullanılır).
 */
export function cameraViewYaz(proj: ArrayLike<number>, viewInv: ArrayLike<number>): void {
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += proj[k * 4 + r] * viewInv[c * 4 + k];
      pv[c * 4 + r] = s;
    }
  }
  cameraView.hazir = true;
}

/** Yalnız testler/sahne sökümü için: kamera bilgisini unut (bir sonraki kare yeniden yazar). */
export function cameraViewSifirla(): void {
  cameraView.hazir = false;
}

/**
 * Dünya noktası şu an ekranda mı? `y` göz hizası değil OBJE hizasıdır (zemin işaretleri ~0,6).
 * Kamera henüz yazmadıysa false — gerekçe dosya başlığında.
 */
export function hedefEkranda(x: number, z: number, y = 0.6): boolean {
  if (!cameraView.hazir) return false;
  const w = pv[3] * x + pv[7] * y + pv[11] * z + pv[15];
  if (Math.abs(w) < 1e-9) return false;
  const nx = (pv[0] * x + pv[4] * y + pv[8] * z + pv[12]) / w;
  const ny = (pv[1] * x + pv[5] * y + pv[9] * z + pv[13]) / w;
  const nz = (pv[2] * x + pv[6] * y + pv[10] * z + pv[14]) / w;
  return nz > -1 && nz < 1 && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
}

/** Dünya noktasının NDC izdüşümü (x,y ∈ [−1,1]; kamera arkasındaysa null). DEV ölçüm kareleri için. */
export function izdusur(x: number, y: number, z: number): [number, number] | null {
  if (!cameraView.hazir) return null;
  const w = pv[3] * x + pv[7] * y + pv[11] * z + pv[15];
  if (w < 1e-6) return null;
  return [(pv[0] * x + pv[4] * y + pv[8] * z + pv[12]) / w, (pv[1] * x + pv[5] * y + pv[9] * z + pv[13]) / w];
}
