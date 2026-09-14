/**
 * olcum-patron.mjs — S19b · P7'nin iki parçası ölçülür: omuz havlusunun ÇAPASI ve
 * "kolları sıvalı" kolunun gerçekten mesh bölmeden yapılıp yapılamayacağı.
 *
 * P7 (D-116) iki işaret taşıyor: omuz havlusu + kolları sıvalı. İkincisi teknik bir iddiaya
 * dayanıyordu — *"KayKit'te kol TEK mesh, ama tepe noktalarının kemik ağırlıkları dosyada
 * yazılı; alt kol/bilek/el kemiklerine ağırlığı yarıdan fazla olan tepe noktaları ten rengine
 * boyanır, geometri kesilmez"*. Bu araç o iddiayı SAYIYA çevirir: kaç tepe noktası dönüyor,
 * sınır hangi yükseklikte, dirsekte mi kalıyor.
 *
 * Ölçü HAM rig biriminde. Kullanım: node tools/olcum-patron.mjs
 */
import { glbAc, vec3Oku } from './olcum-onluk.mjs';

const KOK = 'public/assets/models/kaykit-characters/';
/**
 * Sıvalı kolun ten rengine dönecek kemikleri — dirsekten aşağısı.
 *
 * DOSYADA ADLAR NOKTALI (`lowerarm.r`), ÇALIŞMA ZAMANINDA NOKTASIZ (`lowerarmr`): three'nin
 * `PropertyBinding` düğüm adlarındaki ayırıcıları siliyor. İlk koşu tam bu yüzden 0 tepe
 * noktası saydı ve ölçüm "sıvalı kol yapılamaz" diyecekti. Karşılaştırma NOKTASIZ yapılır.
 */
const ALT_KOL = ['lowerarm.l', 'lowerarm.r', 'wrist.l', 'wrist.r', 'hand.l', 'hand.r'];
const sade = (ad) => ad.split('.').join('');

/** Bir accessor'ın vec4 değerleri (JOINTS_0 ushort, WEIGHTS_0 float olabilir). */
function vec4Oku(j, bin, idx) {
  const acc = j.accessors[idx];
  const bv = j.bufferViews[acc.bufferView];
  const bas = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const bayt = acc.componentType === 5126 ? 4 : acc.componentType === 5123 ? 2 : 1;
  const adim = bv.byteStride ?? bayt * 4;
  const oku = (p) =>
    acc.componentType === 5126 ? bin.readFloatLE(p)
    : acc.componentType === 5123 ? bin.readUInt16LE(p)
    : bin.readUInt8(p);
  const cik = [];
  for (let i = 0; i < acc.count; i++) {
    const p = bas + i * adim;
    cik.push([oku(p), oku(p + bayt), oku(p + bayt * 2), oku(p + bayt * 3)]);
  }
  return cik;
}

const ANA_TEN = (process.argv[1] ?? '').includes('olcum-patron');

/**
 * Bir gövdede, verilen kemik süzgecine göre sıvanacak tepe noktalarının oranı. Bekçi testi
 * OYUNUN kendi regex'ini buraya verir — kopya bir süzgeç yazsaydı test kodu değil kendini
 * doğrulardı.
 */
export function sivamaOrani(ad, kemikSecici, esik = 0.5) {
  const { j, bin } = glbAc(`${KOK}${ad}.glb`);
  const kemikAd = j.skins[0].joints.map((i) => sade(j.nodes[i].name));
  const idx = new Set(kemikAd.map((n, i) => (kemikSecici(n) ? i : -1)).filter((i) => i >= 0));
  let toplam = 0;
  let donen = 0;
  for (const n of j.nodes.filter((x) => x.mesh !== undefined && /_Arm(Left|Right)$/.test(x.name))) {
    for (const pr of j.meshes[n.mesh].primitives) {
      const J = vec4Oku(j, bin, pr.attributes.JOINTS_0);
      const W = vec4Oku(j, bin, pr.attributes.WEIGHTS_0);
      for (let i = 0; i < J.length; i++) {
        toplam++;
        let a = 0;
        for (let k = 0; k < 4; k++) if (idx.has(J[i][k])) a += W[i][k];
        if (a > esik) donen++;
      }
    }
  }
  return { secilenKemik: idx.size, kolTepesi: toplam, sivananTepe: donen, oran: donen / toplam };
}

const rapor = { damga: new Date().toISOString(), birim: 'ham rig', altKolKemikleri: ALT_KOL, govdeler: [] };

if (ANA_TEN) for (const ad of ['Ranger', 'Knight', 'Rogue', 'Barbarian']) {
  const { j, bin } = glbAc(`${KOK}${ad}.glb`);
  const meshli = j.nodes.filter((n) => n.mesh !== undefined);

  // Omuz havlusunun çapası: omuz kemiğinin BIND pozundaki dünya konumu. Ters bağlanma
  // matrisinin tersi, kemiğin dünya matrisidir; son sütunu konumdur.
  const skin = j.skins[0];
  const kemikAd = skin.joints.map((i) => j.nodes[i].name);
  const ibm = vec4Oku(j, bin, skin.inverseBindMatrices); // 4x4 = dört vec4 satırı DEĞİL —
  // accessor MAT4 olduğu için vec4Oku yalnız ilk dört bileşeni okur; konum için ayrı okunur.
  const omuzlar = {};
  {
    const acc = j.accessors[skin.inverseBindMatrices];
    const bv = j.bufferViews[acc.bufferView];
    const bas = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    for (let i = 0; i < acc.count; i++) {
      const m = [];
      for (let k = 0; k < 16; k++) m.push(bin.readFloatLE(bas + i * 64 + k * 4));
      // glTF matrisleri sütun-öncelikli; ters matrisin öteleme sütunu m[12..14].
      // Kemiğin dünya konumu = ters bağlanmanın tersinin ötelemesi = -R⁻¹·t.
      const t = [m[12], m[13], m[14]];
      const p = [
        -(m[0] * t[0] + m[1] * t[1] + m[2] * t[2]),
        -(m[4] * t[0] + m[5] * t[1] + m[6] * t[2]),
        -(m[8] * t[0] + m[9] * t[1] + m[10] * t[2]),
      ];
      if (/^upperarm/.test(kemikAd[i])) omuzlar[sade(kemikAd[i])] = p.map((v) => +v.toFixed(4));
    }
  }

  // Sıvalı kol: kol mesh'lerinde alt-kol kemiklerine ağırlığı > 0,5 olan tepe noktaları.
  const altKolSade = ALT_KOL.map(sade);
  const altKolIdx = new Set(kemikAd.map((n, i) => (altKolSade.includes(sade(n)) ? i : -1)).filter((i) => i >= 0));
  let toplam = 0;
  let donen = 0;
  let sinirAlt = Infinity;
  let sinirUst = -Infinity;
  let xIc = Infinity;
  let xDis = -Infinity;
  for (const n of meshli.filter((x) => /_Arm(Left|Right)$/.test(x.name))) {
    for (const pr of j.meshes[n.mesh].primitives) {
      const P = vec3Oku(j, bin, pr.attributes.POSITION);
      const J = vec4Oku(j, bin, pr.attributes.JOINTS_0);
      const W = vec4Oku(j, bin, pr.attributes.WEIGHTS_0);
      for (let i = 0; i < P.length; i++) {
        toplam++;
        let agirlik = 0;
        for (let k = 0; k < 4; k++) if (altKolIdx.has(J[i][k])) agirlik += W[i][k];
        if (agirlik > 0.5) {
          donen++;
          sinirAlt = Math.min(sinirAlt, P[i][1]);
          sinirUst = Math.max(sinirUst, P[i][1]);
          // A-pozunda kol YANA açık: sıvama sınırı y'de değil |x|'te okunur (dirsek burada).
          xIc = Math.min(xIc, Math.abs(P[i][0]));
          xDis = Math.max(xDis, Math.abs(P[i][0]));
        }
      }
    }
  }

  // OMUZ YÜZEYİ — havlunun oturacağı yer. Kemik konumu yetmez: havlu derinin ÜSTÜNDE durur,
  // kemiğin içinde değil. Omuz bölgesi, kol mesh'inin kemiğe en yakın |x| kuşağıdır.
  let omuzUst = -Infinity;
  let omuzZIc = Infinity;
  let omuzZDis = -Infinity;
  let omuzXDis = -Infinity;
  for (const n of meshli.filter((x) => /_Arm(Left|Right)$/.test(x.name))) {
    for (const pr of j.meshes[n.mesh].primitives) {
      for (const v of vec3Oku(j, bin, pr.attributes.POSITION)) {
        if (Math.abs(v[0]) < 0.15 || Math.abs(v[0]) > 0.34) continue;
        omuzUst = Math.max(omuzUst, v[1]);
        omuzZIc = Math.min(omuzZIc, v[2]);
        omuzZDis = Math.max(omuzZDis, v[2]);
        omuzXDis = Math.max(omuzXDis, Math.abs(v[0]));
      }
    }
  }

  rapor.govdeler.push({
    govde: ad,
    omuzKemikleri: omuzlar,
    omuzYuzeyi: { ustY: +omuzUst.toFixed(4), zAraligi: [+omuzZIc.toFixed(4), +omuzZDis.toFixed(4)], enDisX: +omuzXDis.toFixed(4) },
    kolTepesi: toplam,
    sivananTepe: donen,
    sivananOran: +(donen / toplam).toFixed(3),
    // Sınırın DİRSEKTE olması beklenir: kolun tamamı ya da hiçbiri dönerse kol sıvalı okunmaz.
    sivananYAraligi: donen ? [+sinirAlt.toFixed(4), +sinirUst.toFixed(4)] : null,
    sivananXAraligi: donen ? [+xIc.toFixed(4), +xDis.toFixed(4)] : null,
  });
}



/**
 * TEN RENGİ ÖLÇÜMÜ — sıvanan kol hangi renge dönmeli.
 *
 * İlk uygulama `PALETTE.skin`i (#e0ac69) kullandı ve karede kol TURUNCU eldiven gibi çıktı:
 * o sayı oyunun kendi paletinden, gövde ise KayKit'in kendi dokusundan geliyor. Doğru renk
 * tahmin edilmez, DOKUNUN KENDİSİNDEN okunur: elin tepe noktalarının UV'si zaten derinin
 * üstüne düşüyor (KayKit'te el çıplak).
 *
 * PNG kendi elimizle çözülür — repoda çözücü yok, ama PNG'nin IDAT'ı zlib ve Node'da
 * `inflateSync` var; geriye satır süzgeçlerini geri almak kalıyor.
 */
import { inflateSync } from 'node:zlib';

/** 8 bit/kanal PNG çözücü (renk tipi 2 = RGB, 6 = RGBA). Palet/aralıklı PNG desteklenmez. */
export function pngCoz(bayt) {
  let o = 8;
  let en = 0, boy = 0, renkTipi = 0, derinlik = 0;
  const parcalar = [];
  while (o < bayt.length) {
    const uzunluk = bayt.readUInt32BE(o);
    const tur = bayt.slice(o + 4, o + 8).toString('latin1');
    const govde = bayt.slice(o + 8, o + 8 + uzunluk);
    if (tur === 'IHDR') {
      en = govde.readUInt32BE(0);
      boy = govde.readUInt32BE(4);
      derinlik = govde[8];
      renkTipi = govde[9];
    } else if (tur === 'IDAT') parcalar.push(govde);
    else if (tur === 'IEND') break;
    o += 12 + uzunluk;
  }
  if (derinlik !== 8 || (renkTipi !== 2 && renkTipi !== 6)) {
    throw new Error(`desteklenmeyen PNG: derinlik ${derinlik}, renk tipi ${renkTipi}`);
  }
  const kanal = renkTipi === 6 ? 4 : 3;
  const ham = inflateSync(Buffer.concat(parcalar));
  const cik = Buffer.alloc(en * boy * kanal);
  const satirBayt = en * kanal;
  for (let y = 0; y < boy; y++) {
    const suzgec = ham[y * (satirBayt + 1)];
    const satir = ham.slice(y * (satirBayt + 1) + 1, (y + 1) * (satirBayt + 1));
    for (let i = 0; i < satirBayt; i++) {
      const a = i >= kanal ? cik[y * satirBayt + i - kanal] : 0;        // sol
      const b = y > 0 ? cik[(y - 1) * satirBayt + i] : 0;               // üst
      const c = i >= kanal && y > 0 ? cik[(y - 1) * satirBayt + i - kanal] : 0; // sol üst
      let d = satir[i];
      if (suzgec === 1) d += a;
      else if (suzgec === 2) d += b;
      else if (suzgec === 3) d += (a + b) >> 1;
      else if (suzgec === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        d += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cik[y * satirBayt + i] = d & 0xff;
    }
  }
  return { en, boy, kanal, veri: cik };
}

const onalti = (n) => n.toString(16).padStart(2, '0');

/**
 * VEC2 float accessor (TEXCOORD_0). AYRI YAZILDI çünkü `vec3Oku`nun varsayılan adımı 12 bayt
 * ve sıkı paketlenmiş bir VEC2 dizisinde adım **8**'dir — ilk koşu UV'leri kaydırarak okudu,
 * dokudan hep aynı iki üç renk geldi ve ölçüm "eller eldivenli" diye yanlış bir hüküm verdi.
 */
export function indisOku(j, bin, idx) {
  const acc = j.accessors[idx];
  const bv = j.bufferViews[acc.bufferView];
  const bas = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const bayt = acc.componentType === 5125 ? 4 : acc.componentType === 5123 ? 2 : 1;
  const oku = (p) => (bayt === 4 ? bin.readUInt32LE(p) : bayt === 2 ? bin.readUInt16LE(p) : bin.readUInt8(p));
  const cik = [];
  for (let i = 0; i < acc.count; i++) cik.push(oku(bas + i * bayt));
  return cik;
}

export function vec2Oku(j, bin, idx) {
  const acc = j.accessors[idx];
  const bv = j.bufferViews[acc.bufferView];
  const bas = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const adim = bv.byteStride ?? 8;
  const cik = [];
  for (let i = 0; i < acc.count; i++) cik.push([bin.readFloatLE(bas + i * adim), bin.readFloatLE(bas + i * adim + 4)]);
  return cik;
}

/**
 * Bir gövdenin TEN rengi — dokudan, BAŞ mesh'inin UV'lerinden.
 *
 * İlk deneme ELİN UV'sinden okudu ve saçmaladı: KayKit'te eller ELDİVENLİ (Ranger #1e1e1c
 * siyah, Rogue #228993 turkuaz). Karakterde açıkta duran tek deri YÜZ. Ortanca da işe yaramaz
 * (saç, kaş, sakal yüzden büyük olabiliyor) — bu yüzden renk HİSTOGRAMI çıkarılır ve ten,
 * yüz bölgesinin en kalabalık tonu olarak okunur.
 */
export function tenRengi(ad) {
  const { j, bin } = glbAc(`${KOK}${ad}.glb`);
  const bv = j.bufferViews[j.images[0].bufferView];
  const png = pngCoz(bin.slice(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength));

  /**
   * ÖRNEK NOKTASI ÜÇGENİN AĞIRLIK MERKEZİ, tepe noktası DEĞİL. KayKit dokusu düz renk
   * yamalarından oluşuyor ve tepe noktalarının UV'si yamanın KENARINA düşüyor — orada iki
   * yamanın karışımı okunuyor. İlk koşuda yüzler bu yüzden gri geldi (#adadad, #90908f).
   * Ağırlık merkezi yamanın içine düşer. Örnek üçgenin ALANIYLA ağırlıklanır: büyük yüzey
   * (yanak) küçük yüzeyden (göz) daha çok sayılır.
   */
  const sayac = new Map();
  for (const n of j.nodes.filter((x) => x.mesh !== undefined && /_Head$/.test(x.name))) {
    for (const pr of j.meshes[n.mesh].primitives) {
      const UV = vec2Oku(j, bin, pr.attributes.TEXCOORD_0);
      const P = vec3Oku(j, bin, pr.attributes.POSITION);
      const I = pr.indices !== undefined ? indisOku(j, bin, pr.indices) : UV.map((_, i) => i);
      for (let t = 0; t + 2 < I.length; t += 3) {
        const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
        const u = (UV[a][0] + UV[b][0] + UV[c][0]) / 3;
        const v = (UV[a][1] + UV[b][1] + UV[c][1]) / 3;
        // Üçgenin alanı (çapraz çarpımın yarısı) — ağırlık budur.
        const e1 = [P[b][0] - P[a][0], P[b][1] - P[a][1], P[b][2] - P[a][2]];
        const e2 = [P[c][0] - P[a][0], P[c][1] - P[a][1], P[c][2] - P[a][2]];
        const n1 = e1[1] * e2[2] - e1[2] * e2[1];
        const n2 = e1[2] * e2[0] - e1[0] * e2[2];
        const n3 = e1[0] * e2[1] - e1[1] * e2[0];
        const alan = Math.hypot(n1, n2, n3) / 2;
        const x = Math.min(png.en - 1, Math.max(0, Math.round(u * png.en)));
        // V ÇEVRİLMEZ: glTF'te UV başlangıcı görüntünün SOL ÜSTÜ ve v aşağı doğru artar;
        // çözücü de satırları görüntü sırasıyla veriyor. `1 - v` (WebGL alışkanlığı) ilk koşuda
        // yüzü dokunun taş/metal bölgesine düşürdü ve ten GRİ okundu.
        const y = Math.min(png.boy - 1, Math.max(0, Math.round(v * png.boy)));
        const p = (y * png.en + x) * png.kanal;
        const anahtar = `#${onalti(png.veri[p])}${onalti(png.veri[p + 1])}${onalti(png.veri[p + 2])}`;
        sayac.set(anahtar, (sayac.get(anahtar) ?? 0) + alan);
      }
    }
  }
  const sirali = [...sayac].sort((a, b) => b[1] - a[1]).slice(0, 40);
  return { dokuBoyu: [png.en, png.boy], tepeRenkler: sirali.map(([r, n]) => ({ renk: r, alan: +n.toFixed(4) })) };
}

/**
 * TENİN KENDİSİ: dört başın da paylaştığı yama. Tek başa bakmak yetmez — en geniş yama saç
 * olabiliyor (Ranger'da #9f5e47 kahverengi saç, tenin önünde). Saç her gövdede farklı, TEN
 * aynı; o yüzden "dört gövdede de bulunan, en küçük alanı en büyük olan renk" aranır.
 */
export function ortakTen(adlar) {
  const tablolar = adlar.map((ad) => new Map(tenRengi(ad).tepeRenkler.map((r) => [r.renk, r.alan])));
  let enIyi = null;
  for (const renk of tablolar[0].keys()) {
    if (!tablolar.every((t) => t.has(renk))) continue;
    const enKucuk = Math.min(...tablolar.map((t) => t.get(renk)));
    if (!enIyi || enKucuk > enIyi.enKucukAlan) enIyi = { renk, enKucukAlan: +enKucuk.toFixed(4) };
  }
  return enIyi;
}

if (ANA_TEN) {
  const adlar = ['Ranger', 'Knight', 'Rogue', 'Barbarian'];
  rapor.ten = { ortak: ortakTen(adlar), govdeBasi: {} };
  for (const ad of adlar) rapor.ten.govdeBasi[ad] = tenRengi(ad);
  console.log(JSON.stringify(rapor, null, 1));
}
