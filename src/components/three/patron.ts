import { BoxGeometry, Mesh, MeshStandardMaterial, BufferAttribute, Color, Group, Vector3 } from 'three';
import type { Object3D, SkinnedMesh } from 'three';
import { PALETTE } from '../../config/palette';

/**
 * PATRONUN DOKUNUŞU (S19b · D-116 · P7) — omuz havlusu + kolları sıvalı.
 *
 * NEDEN BU KOL. S18 patronu koyu lacivert gömlekle ayırmıştı; kullanıcı geri aldı:
 * *"üstü garip olmuş, beyaz daha ayırt ediciydi o kalabilir ama diğerlerinde olmayan farklı bir
 * dokunuş yap"*. S19a sekiz aday karesi çizdi (`docs/gorsel/ss/s19-patron.png`); göğse takılan
 * levha kolları (yelek/plaka) daha S18'de elenmişti — önlükten ayrışmıyorlar. Seçilen P7 iki
 * işareti birden taşır, çünkü tek işaret ekranda zayıf kalıyor (`feedback_upgrade_legibility`).
 *
 * `PALETTE.ownerShirt` BU TURDA KALKTI: gömlek yeniden krem, ayıran şey artık renk değil.
 */

/**
 * Sıvanan kemikler — dirsekten aşağısı. `handslot` BİLEREK DIŞARIDA: o bir eşya çapası,
 * deriye ağırlık taşımaz ve regex'e girerse hiçbir şey değişmez ama niyet okunmaz olur.
 *
 * ADLAR NOKTASIZ: dosyada kemik `lowerarm.r`, çalışma zamanında three'nin `PropertyBinding`i
 * ayırıcıyı siliyor ve `lowerarmr` oluyor. Ölçüm aracı ilk koşuda noktalı adı aradı ve
 * "sıvanacak tepe noktası yok" dedi — kol teknik olarak imkânsız görünecekti.
 */
export const ALT_KOL_KEMIGI = /^(lowerarm|wrist|hand)(l|r)$/;

/** Bir tepe noktası, alt-kol kemiklerine bu ağırlığın üstündeyse ten rengine döner. */
export const SIVAMA_ESIGI = 0.5;

/**
 * KOLLARI SIVA — mesh BÖLÜNMEDEN, kemik ağırlığından vertex color ile.
 *
 * KayKit'te kol tek mesh; dirsekten kesmek ayrı geometri, ayrı çizim çağrısı ve elde düzeltme
 * demekti. Ama ağırlıklar dosyada yazılı: alt kola ağırlığı yarıdan fazla olan tepe noktaları
 * ten rengine boyanır, renk bir **vertex color** katmanı olur. Geometri kesilmez, çizim sayısı
 * artmaz, sınır dirsekte doğal durur (ölçüldü: sıvanan tepe oranı 0,578 · sınır |x| = 0,528,
 * omuz 0,212 ile el 0,971 arasının tam ortası — `docs/olcum-patron.json`).
 *
 * GEOMETRİ KLONLANIR: `SkeletonUtils.clone` geometriyi PAYLAŞIR ve müşterilerin bir kısmı da
 * aynı Ranger gövdesini kullanıyor. Klonlanmasaydı patronun sıvalı kolu bütün Ranger
 * müşterilerine de bulaşırdı — sessiz, yaygın ve ancak ekran görüntüsüyle görülür bir kusur.
 */
export function kollariSiva(kok: Object3D, gomlekRengi: string = PALETTE.shirt) {
  const ten = new Color(PALETTE.kayTen);
  const gomlek = new Color(gomlekRengi);
  kok.traverse((n) => {
    const m = n as SkinnedMesh;
    if (!m.isSkinnedMesh || !/arm/i.test(m.name)) return;
    const altKol = new Set<number>();
    m.skeleton.bones.forEach((b, i) => {
      if (ALT_KOL_KEMIGI.test(b.name)) altKol.add(i);
    });
    if (!altKol.size) return;

    m.geometry = m.geometry.clone();
    const si = m.geometry.getAttribute('skinIndex');
    const sw = m.geometry.getAttribute('skinWeight');
    const adet = m.geometry.getAttribute('position').count;
    const renk = new Float32Array(adet * 3);
    for (let i = 0; i < adet; i++) {
      let agirlik = 0;
      for (let k = 0; k < 4; k++) if (altKol.has(si.getComponent(i, k))) agirlik += sw.getComponent(i, k);
      const c = agirlik > SIVAMA_ESIGI ? ten : gomlek;
      renk[i * 3] = c.r;
      renk[i * 3 + 1] = c.g;
      renk[i * 3 + 2] = c.b;
    }
    m.geometry.setAttribute('color', new BufferAttribute(renk, 3));
    // Malzemenin kendi rengi BEYAZ: vertex color onunla çarpılıyor, krem kalsaydı ten de
    // kremle çarpılıp sararırdı.
    m.material = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, vertexColors: true });
  });
}

/**
 * OMUZ HAVLUSU. Ölçüler SAYI SEÇİLEREK değil, omzun kendisinden alındı
 * (`docs/olcum-patron.json` → `omuzYuzeyi`):
 *
 *   omuz kemiği y 1,1068 · omuz DERİSİNİN tepesi y 1,2287 · omzun z derinliği ±0,147
 *
 * İlk uygulama havluyu kemiğin 0,10 üstüne koydu ve z boyunu 0,62 yaptı: derinin altında kalan,
 * omzun iki katı uzunlukta bir TAHTA gibi çıktı (`s19b-kiyafet.png` v1). Boy artık omzun kendi
 * derinliğinden, yükseklik de derinin tepesinden türüyor.
 *
 * Havlu üç parça: omuz üstündeki kıvrım + önde ve arkada sarkan iki dilim. Tek dilim havluyu
 * omuza YAPIŞIK bir yama gibi gösteriyordu.
 */
export const HAVLU_RENK = '#a83232';
/** Omuz derisinin tepesi ile omuz kemiği arasındaki fark — havlu derinin üstünde durur. */
export const HAVLU_YUKSEKLIK = 0.125;
/** Omzun z derinliği; kıvrımın boyu ve dilimlerin yeri bundan türer. */
export const HAVLU_DERINLIK = 0.147;
/** Havlu omuzdan biraz DIŞA taşar — boyun dibine yapışmış durmasın. */
export const HAVLU_DISA = 0.045;

export function omuzHavlusu(): Group {
  const g = new Group();
  const kumas = () => new MeshStandardMaterial({ color: HAVLU_RENK, roughness: 0.95 });
  // Omuz üstü: kemiğin üstünü örten kısa kıvrım, boyu omzun kendi derinliği kadar.
  g.add(new Mesh(new BoxGeometry(0.21, 0.055, HAVLU_DERINLIK * 2.05), kumas()));
  // Sarkan iki dilim: omzun önüne ve arkasına, hafif dışa açılı.
  for (const yon of [-1, 1]) {
    const dilim = new Mesh(new BoxGeometry(0.2, 0.4, 0.06), kumas());
    dilim.position.set(0, -0.2, yon * HAVLU_DERINLIK * 0.88);
    dilim.rotation.x = yon * 0.1;
    g.add(dilim);
  }
  return g;
}

/** Havlunun omuz kemiğine göre çapası — ikisi de yukarıdaki ölçümden. */
export const HAVLU_KAYMA = new Vector3(HAVLU_DISA, HAVLU_YUKSEKLIK, 0);
