import { BufferGeometry, BufferAttribute, MeshStandardMaterial, DoubleSide } from 'three';
import type { Mesh, Object3D } from 'three';

/**
 * ÖNLÜK: SABİT YARIÇAPLI SİLİNDİR DEĞİL, GÖVDENİN KENDİ PROFİLİ (S19b · D-116 · A2).
 *
 * S19a önlüğü kutudan yüzeye çevirdi ve **sabit** bir yarıçap seçti (0,335-0,365). Kullanıcı
 * kusuru bildirdi: *"gövdenin göğsündeki rozet önlüğün içinden çıkıyor, önlük parçalanmış gibi
 * duruyor"*. S19b önce ölçtü (`tools/olcum-onluk.mjs` → `docs/olcum-onluk.json`) ve iki şey
 * çıktı:
 *
 * 1. **Rozet AYRI DÜĞÜM DEĞİL.** Dört gövdenin meshli düğümleri sayıldı; süs diye
 *    gizlenebilecek bir düğüm yok (`Knight_Body` tek parça). Yani "önlüklü aktörde gizle"
 *    kolu ölçümle DÜŞTÜ; önlük o geometrinin ÖNÜNE geçmek zorunda.
 * 2. **Sabit yarıçap üç gövdenin ikisinde yetmiyor.** Göğüslüğün 110°'lik yayı içinde gövdenin
 *    eksenden yarıçapı: Knight 0,3529 · Barbarian 0,4069 · **Rogue 0,4526** — A2'nin 0,365'i
 *    ikisini deliyor. Delinme yayın ORTASINDA değil KENARINDA oluyor (gövde yassı, silindir
 *    yuvarlak), "parçalanmış" görüntüsünün kalıbı bu. "Önlüğü 1-2 mm öne al" bu yüzden yetmez:
 *    açık 2 mm değil **8,8 cm**.
 *
 * ÇÖZÜM YAPISAL: önlüğün yarıçapı sayı olarak YAZILMAZ, gövdenin kendi tepe noktalarından
 * (yükseklik halkası × açı dilimi ızgarasında en büyük yarıçap) TÜRETİLİR ve üstüne sabit bir
 * PAY eklenir. Böylece her gövdede sarar, bugün olmayan bir gövde eklense de sarar — tek sayı
 * payın kendisidir (`ONLUK_PAY`).
 */
export const ONLUK_EKSEN_Z = 0.02;
/** Gövdeyle önlük arasındaki hava (ham rig birimi). Ölçüm değil KARAR: altında kumaş deriye yapışır. */
export const ONLUK_PAY = 0.02;
/** Izgara çözünürlüğü: yay boyunca dilim, yükseklik boyunca halka. */
export const ONLUK_DILIM = 20;
export const ONLUK_HALKA = 8;

/**
 * Gövde mesh'inin tepe noktaları, önlük ekseninden kutup koordinatında.
 * BIND pozu okunur (KayKit'te A-poz) — önlük `chest`/`hips` kemiğine takılı ve gövdenin
 * kendisi bu iki kemiğin arasında bükülmüyor, yani bind pozu doğru profili verir.
 */
export function govdeProfili(kok: Object3D): { y: number; a: number; r: number }[] {
  const noktalar: { y: number; a: number; r: number }[] = [];
  kok.traverse((n) => {
    const m = n as Mesh;
    if (!m.isMesh || !/body|torso/i.test(m.name)) return;
    const pos = m.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i) - ONLUK_EKSEN_Z;
      noktalar.push({ y, a: Math.atan2(x, z), r: Math.hypot(x, z) });
    }
  });
  return noktalar;
}

/**
 * Profilden bir önlük parçası üretir: yay boyunca `ONLUK_DILIM`, boy boyunca `ONLUK_HALKA`
 * bölünmüş bir yüzey. Her düğümün yarıçapı, o hücreye düşen gövde tepe noktalarının EN
 * BÜYÜĞÜ + pay; hücre boşsa komşulardan taşınır (gövde orada yok demektir, kumaş da düşmez).
 *
 * `genisleme` eteğin aşağı doğru açılmasıdır (0 = düz iner). Yay **+z'de ortalanır**: KayKit
 * gövdesi +z'ye bakar ve `CylinderGeometry`de θ=0 zaten +z'dir — S19a'nın düştüğü tuzak
 * yayı `Math.PI/2`de ortalayıp önlüğü gövdenin YANINA düşürmekti.
 */
export type OnlukIzgara = {
  halkaY: (i: number) => number;
  dilimA: (j: number) => number;
  /** [halka][dilim] — önlük yüzeyinin o düğümdeki yarıçapı (pay ve açılma DAHİL). */
  yaricap: number[][];
};

/**
 * Önlüğün yarıçap ızgarası. Geometriden AYRI durur çünkü bekçi testi tam bu sayıyı sorar:
 * "gövdenin her tepe noktası önlüğün İÇİNDE mi". Oyun ve test aynı ızgaradan beslenir.
 */
export function onlukIzgarasi(
  profil: { y: number; a: number; r: number }[],
  yAlt: number,
  yUst: number,
  yay: number,
  genisleme = 0,
  payEk = 0,
  merkez = 0,
): OnlukIzgara {
  const halkaY = (i: number) => yAlt + ((yUst - yAlt) * i) / ONLUK_HALKA;
  // Yay `merkez` etrafında ortalanır; merkez 0 ise +z, yani gövdenin ÖNÜ (S19a tuzağı:
  // `Math.PI/2` yayı gövdenin YANINA düşürüyordu). Askılar merkezi kaydırarak omuza çıkar.
  const dilimA = (j: number) => merkez - yay / 2 + (yay * j) / ONLUK_DILIM;

  // Izgara hücresine düşen en büyük gövde yarıçapı. Hücre komşusundan biraz geniş alınır ki
  // iki hücrenin ARASINA düşen bir çıkıntı (rozet gibi) hiçbir hücreye düşmeden kaçamasın.
  const hucreYari = { y: (yUst - yAlt) / ONLUK_HALKA, a: yay / ONLUK_DILIM };
  const yaricap: number[][] = [];
  for (let i = 0; i <= ONLUK_HALKA; i++) {
    const y = halkaY(i);
    yaricap.push([]);
    for (let j = 0; j <= ONLUK_DILIM; j++) {
      const a = dilimA(j);
      let r = 0;
      for (const p of profil) {
        if (Math.abs(p.y - y) > hucreYari.y) continue;
        let da = p.a - a;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > hucreYari.a) continue;
        if (p.r > r) r = p.r;
      }
      yaricap[i].push(r);
    }
  }
  // Boş hücreler: satırın kendi en büyüğüne çekilir (önlük orada içeri çökmesin).
  for (const satir of yaricap) {
    const enBuyuk = Math.max(...satir);
    for (let j = 0; j < satir.length; j++) if (satir[j] === 0) satir[j] = enBuyuk;
  }

  /**
   * PÜRÜZSÜZLEŞTİRME — kumaş gibi dursun diye, ÖRTMEYİ BOZMADAN.
   *
   * Ham ızgara "her hücrenin en büyüğü" olduğu için testereye benziyor: bir hücrede omuz
   * çıkıntısı, komşusunda düz gömlek. İlk karede (`docs/gorsel/ss/s19b-onluk.png` v1) önlük
   * bu yüzden **yırtık pırtık** çıktı — kusur örtmede değil, yüzeyin kendisindeydi.
   *
   * İki geçiş komşu ortalaması alınır, ama sonuç HAM değerin altına indirilmez — yani
   * yumuşatma yalnız ÇUKURU doldurur, örtmeyi bozamaz. Kumaş gerçekte de böyle davranır:
   * çıkıntının üstünden geçer, çukura girmez.
   *
   * 3×3 GENİŞLETME DENENDİ VE GERİ ALINDI (v2 karesi): tepeleri yanlara taşıdığı için etek
   * şişip TÜTÜYE dönüyordu. Yumuşatma tek başına yeterli, çünkü ham ızgara zaten örtüyor.
   */
  const ham = yaricap.map((satir) => satir.slice());
  for (let gecis = 0; gecis < 2; gecis++) {
    const onceki = yaricap.map((satir) => satir.slice());
    for (let i = 0; i <= ONLUK_HALKA; i++) {
      for (let j = 0; j <= ONLUK_DILIM; j++) {
        let toplam = 0;
        let adet = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const a = onceki[i + di]?.[j + dj];
            if (a !== undefined) { toplam += a; adet++; }
          }
        }
        // HAM DEĞERİN ALTINA İNİLMEZ: yumuşatma çukuru doldurur ama örtmeyi bozamaz.
        yaricap[i][j] = Math.max(ham[i][j], toplam / adet);
      }
    }
  }
  // Pay ve eteğin açılması ızgaraya BURADA işlenir; geometri de bekçi de aynı sayıyı görür.
  for (let i = 0; i <= ONLUK_HALKA; i++) {
    // Etek aşağı doğru açılır: en alt halkada `genisleme` kadar fazla.
    const acilma = genisleme * (1 - (halkaY(i) - yAlt) / (yUst - yAlt));
    for (let j = 0; j <= ONLUK_DILIM; j++) yaricap[i][j] += ONLUK_PAY + payEk + acilma;
  }
  return { halkaY, dilimA, yaricap };
}

/** Izgarayı üçgenleyip yüzeye çevirir. Yay **+z'de ortalıdır** (yukarıdaki tuzak). */
export function onlukParcasi(
  profil: { y: number; a: number; r: number }[],
  yAlt: number,
  yUst: number,
  yay: number,
  genisleme = 0,
  payEk = 0,
  merkez = 0,
): BufferGeometry {
  const { halkaY, dilimA, yaricap } = onlukIzgarasi(profil, yAlt, yUst, yay, genisleme, payEk, merkez);
  const konum: number[] = [];
  const indis: number[] = [];
  for (let i = 0; i <= ONLUK_HALKA; i++) {
    for (let j = 0; j <= ONLUK_DILIM; j++) {
      const a = dilimA(j);
      const r = yaricap[i][j];
      konum.push(Math.sin(a) * r, halkaY(i), ONLUK_EKSEN_Z + Math.cos(a) * r);
    }
  }
  const sut = ONLUK_DILIM + 1;
  for (let i = 0; i < ONLUK_HALKA; i++) {
    for (let j = 0; j < ONLUK_DILIM; j++) {
      const a = i * sut + j;
      indis.push(a, a + sut, a + 1, a + 1, a + sut, a + sut + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(konum), 3));
  g.setIndex(indis);
  g.computeVertexNormals();
  return g;
}

/**
 * ÖNLÜĞÜN PARÇALARI — tek yer. Oyun bu tablodan çiziyor, bekçi testi de bu tablodan sınıyor;
 * ayrı yazılsalardı test önlüğü değil KENDİ KOPYASINI doğrulardı ve sessizce ayrışırlardı.
 *
 * Yay dereceleri ve boylar S19a'nın A2 kolundan (rapor §A); DEĞİŞEN yalnız yarıçap — o artık
 * sayı değil, gövdenin kendi profili. `kemik` parçanın hangi kemikle hareket ettiğidir.
 */
export const ONLUK_PARCALARI = {
  /** Göğüslük: göğüsten bele. Üst gövdeyle birlikte eğilir. */
  gogus: { kemik: 'chest', yAlt: 0.62, yUst: 1.02, yayDerece: 110, merkezDerece: 0, genisleme: 0, payEk: 0 },
  /**
   * Etek: belden uyluğa. Yay 220° → **180°**: 220'de yanlardan da dönüp ETEK/TÜTÜ okunuyordu
   * (v2 karesi), oysa istenen önlük. Açılma 0,05 → **0,015** aynı sebeple.
   */
  etek: { kemik: 'hips', yAlt: 0.36, yUst: 0.66, yayDerece: 180, merkezDerece: 0, genisleme: 0.015, payEk: 0 },
  /**
   * Bel bağı: göğüslük ile eteğin EK YERİNİ örten ince kuşak. `payEk` şart — payı olmasaydı
   * diğer iki parçayla aynı yarıçapta doğar, onların İÇİNE gömülür ve v1 karesindeki gibi
   * yatay bir raf gibi görünürdü. Ama payı BÜYÜK de olamaz: 0,035'te (v3 karesi) bedeni
   * dolanan bir KENARLIK gibi çıktı. Ölçüldüğü yer yok, gözle bulundu: 0,012.
   */
  belBagi: { kemik: 'hips', yAlt: 0.615, yUst: 0.665, yayDerece: 300, merkezDerece: 0, genisleme: 0, payEk: 0.012 },
  /**
   * ASKILAR — onlar da PROFİLDEN. Önce kutu şerit olarak denendi (v1-v2): sabit z'de durdukları
   * için gövdenin İÇİNDE kaldılar ve karede hiç görünmediler. Dar yaylı birer önlük parçası
   * olarak, merkezleri omuza kaydırılmış hâlde gövdeyi takip ediyorlar.
   */
  askiSol: { kemik: 'chest', yAlt: 0.98, yUst: 1.34, yayDerece: 15, merkezDerece: -26, genisleme: 0, payEk: 0.004 },
  askiSag: { kemik: 'chest', yAlt: 0.98, yUst: 1.34, yayDerece: 15, merkezDerece: 26, genisleme: 0, payEk: 0.004 },
} as const;

/** Önlük kumaşı ÇİFT YÜZLÜ: tek yüzlü olsaydı yandan bakınca içi delik görünürdü. */
export function kumas(renk: string) {
  return new MeshStandardMaterial({ color: renk, roughness: 0.9, side: DoubleSide });
}
