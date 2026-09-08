/**
 * camera.ts — KAMERA ANKRAJININ TEK KAYNAĞI (D-072 katman 1 · BM adım 6).
 *
 * NEDEN VAR: D-072 kamerayı ölçü/ankraj katmanına koyuyor ("kat · duvar · masa · koltuk ·
 * **kamera** · servis yüzü · pad noktaları · nav katıları"), ama sayıları `Scene.tsx`'in
 * `CameraRig`'inin içinde, `useFrame` gövdesinde gömülüydü. Scene.tsx vitest'te import
 * EDİLEMEZ (Canvas + `recolor` → `Image` zinciri node ortamında yok), yani ölçü dondurulsa
 * bile kamera bekçilenemiyordu: sanat cilası turlarından biri fov'u ya da mesafeyi
 * değiştirse hiçbir test kırılmazdı.
 *
 * `actor.ts` ile aynı desen: sayı burada durur, `CameraRig` okur, bekçi testi de buradan
 * okur. Kamera BAKIŞ YÜKSEKLİĞİ (`CAMERA_LOOK_Y`) bilerek burada değil `actor.ts`'te —
 * o sayı kameranın değil AKTÖRÜN türevi (gövdenin %46'sı), gövde büyüyünce o da büyüdü.
 */

/**
 * DÜŞEY GÖRÜŞ AÇISI. BM adım 4'te 34 ölçüldü ve **50 KALSIN** diye karar verildi (D-076):
 * fov 50 → 34 sahneyi yalnız %16 düzleştiriyor (uzak/yakın görünen boyut oranı 0,60 → 0,70),
 * kazanç kadrajda zar zor okunuyor; bedeli ise kameranın katın uzak köşesine uzaklığının
 * 45 → 66'ya çıkması, yani uzak kenardaki sisin %29 → %84 olması (`LIGHTING.fogNear/fogFar`
 * yeniden ayarlanmadan). Maketin 34'ü bir GÖZLEM aracının tercihiydi, oyunun değil.
 */
export const CAMERA_FOV = 50;

/**
 * TAKİP MESAFESİ (landscape tabanı). Kamera oyuncunun +z'sinde ve aynı miktarda yukarıda
 * durur (`[p.x, d, p.z + d]`), yani bu sayı hem yüksekliktir hem geri çekilme.
 *
 * Tarihçe: ilk APK 6 × clamp 1,3 → 7 → 6,4 + clamp 1,4 → yeniden 6. **D-061'de taban 6 elendi**:
 * kat 21 × 21'den 34 × 34'e büyüyünce portrede oyuncu hizasında yalnız 4,6 birim kalıyordu
 * (sürekli koridor hissi). 8,5 ≈ 6,5 birim = bir banket adası tam sığar.
 *
 * D-076'da karakter 1,29 → 1,75'e çıkarken bu sayıya BİLEREK DOKUNULMADI: mesafe odanın
 * kadrajını anlatır, oda büyümedi. Karakterin kadrajda %36 büyümesi o işin AMACIYDI.
 */
export const CAMERA_DIST = 8.5;

/** Portre modunda geri çekilme tavanı — dar ekranda kadraj `1/aspect` ile açılır, 1,3'te durur. */
export const CAMERA_PORTRAIT_CLAMP = 1.3;

/** HUD'un uzaklaş düğmesi (B ↔ C kademesi, D-061): 8,5 → 11,5 (~8,9 birim). */
export const CAMERA_ZOOM_OUT_MUL = 1.35;

/** Quest odağı sırasında hafif yakınlaşma (odak bitince damping kendiliğinden geri süzülür). */
export const CAMERA_FOCUS_MUL = 0.72;

/**
 * Ekran oranına göre takip mesafesi. Portrede kadraj `1/aspect` ile açılır ama
 * `CAMERA_PORTRAIT_CLAMP`'te durur; landscape'te taban mesafe aynen kullanılır.
 * `CameraRig` bunu YALNIZ gerçek resize'da çağırır (her kare `size` okumak mobil viewport
 * titremesini kameraya taşıyordu — D-017 §6).
 */
export const cameraDistance = (aspect: number): number =>
  CAMERA_DIST * (aspect < 1 ? Math.min(CAMERA_PORTRAIT_CLAMP, 1 / aspect) : 1);
