/**
 * Yükleme ilerlemesi köprüsü — açılış ekranı ile 3D paketi arasında.
 *
 * Sahne (three · r3f · drei) ilk pakette DEĞİL, ayrı bir parçada gelir (Faz F kod-bölme): açılış
 * ekranı o parça inerken çizilebilsin diye. Ekran ilerlemeyi eskiden drei'nin `useProgress`inden
 * okuyordu; o import three'yi de ilk pakete çekiyordu. Artık 3D parçası yüklenince kendi okuyucusunu
 * buraya KAYDEDER; ekran yalnız bu modülü bilir. Okuyucu yokken parça henüz inmemiştir → "hazır değil".
 */
export type Ilerleme = { active: boolean; progress: number };

let okuyucu: (() => Ilerleme) | null = null;

export function yuklemeOkuyucusuKaydet(oku: () => Ilerleme): void {
  okuyucu = oku;
}

/** null = 3D parçası henüz inmedi (sahnenin yükleyicisi daha yok). */
export function yuklemeOku(): Ilerleme | null {
  return okuyucu ? okuyucu() : null;
}
