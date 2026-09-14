/**
 * oturus-kiyafet.test.ts — S19b'nin BEKÇİSİ (D-116).
 *
 * S19a ölçtü, kullanıcı seçti, bu tur uyguladı. Korunan şey üç ayrı sessiz kusur: üçü de
 * konsol hatası vermez, üçü de ancak bir ekran görüntüsüyle yakalanır — yani bekçisiz
 * bırakılırsa bir sonraki turda fark edilmeden geri gelir.
 *
 * 1. **Oturuş çapası.** Sabit ölçümden türer; elle "ayarlanırsa" kalça taburenin arkasından
 *    yeniden sarkar. Test sayıyı ham süpürmeden YENİDEN HESAPLAR (`docs/olcum-oturus.json`),
 *    yani rapordaki cümleye değil ölçünün kendisine bakar.
 * 2. **Çapanın UYGULANIŞI.** Doğru sabit yanlış eksende kullanılırsa (dünya z'sine sabit
 *    yazılırsa) masanın yalnız bir yanındaki müşteri düzelir, karşı yandaki iki kat dışarı
 *    çıkar. Kaynakta çapanın gövdenin KENDİ açısıyla döndüğü denetlenir.
 * 3. **Kıyafetin biçimi.** Önlük "yüzey" olduğu için (silindir dilimi + koni etek) kutuya
 *    dönmesi tek satırlık bir gerilemedir; patronun ayırt edici işareti de öyle.
 *
 * Sayılar: `docs/patron-oturus-glif-raporu-s19a.md` · ham `docs/olcum-oturus.json`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { KAY_OTURMA_ILERI, KAY_OTURMA_KALDIRMA, KAY_KIYAFET, KAY_MODEL, KAY_MUSTERI_GOVDE } from '../src/config/actor';
import { onlukIzgarasi, ONLUK_PARCALARI, ONLUK_PAY, ONLUK_EKSEN_Z, ONLUK_DILIM, ONLUK_HALKA } from '../src/components/three/onluk';
import { govdeTepeleri } from '../tools/olcum-onluk.mjs';
import { sivamaOrani } from '../tools/olcum-patron.mjs';
import { ALT_KOL_KEMIGI, SIVAMA_ESIGI, HAVLU_YUKSEKLIK, HAVLU_DERINLIK } from '../src/components/three/patron';
import { BARDAK_BEL, BARDAK_AGIZ } from '../src/components/three/siparisBalonu';
import { existsSync } from 'node:fs';
import { PALETTE } from '../src/config/palette';

const OLCUM = JSON.parse(readFileSync('docs/olcum-oturus.json', 'utf8')) as {
  tabure: { oturakUstu: number; kenarYaricapi: number };
  govdeler: {
    govde: string;
    masaAcikligi: number;
    kalcaKemigi: { z: number };
    supurme: { dz: number; arkaTasma: number; onTasma: number; zAraligi: [number, number] }[];
  }[];
};

const KAYNAK_MUSTERI = readFileSync('src/components/three/Customers.tsx', 'utf8');
/**
 * YORUMSUZ KOD. Bir kusuru anlatan yorum o kusurun KALIBINI da içerir ("dünya eksenine sabit
 * yazılsa…") ve olumsuz bir bekçi o açıklamayla eşleşip DOĞRU kodu yanlış diye bildirir.
 * `karakter-senkron.test.ts` bunu bir kez öğrendi; aynı süzgeç burada da uygulanır.
 */
const KOD_MUSTERI = KAYNAK_MUSTERI.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Süpürmedeki bir dz adımında beş gövdenin EN KÖTÜSÜ — kod tek sabit yazar, karar o sayıyladır. */
function enKotu(dz: number) {
  const satirlar = OLCUM.govdeler.map((g) => {
    const s = g.supurme.find((r) => Math.abs(r.dz - dz) < 1e-9);
    if (!s) throw new Error(`süpürmede dz=${dz} yok — ölçüm ızgarası değişmiş`);
    return s;
  });
  return {
    arka: Math.max(...satirlar.map((s) => s.arkaTasma)),
    on: Math.max(...satirlar.map((s) => s.onTasma)),
    ileri: Math.max(...satirlar.map((s) => s.zAraligi[1])),
  };
}

describe('S19b · oturuş çapası (D-116 · O3)', () => {
  it('ÖLÇÜLEN kusur gerçekten vardı: çapasız oturuşta kalça taburenin arkasından sarkıyor', () => {
    // Bu satır olmadan aşağıdaki testler "hiçbir şeyi düzeltmeyen bir sabiti" doğrulayabilirdi.
    expect(enKotu(0).arka).toBeGreaterThan(0.2);
    // Kök sebep: klipte kalça kemiği kökün arkasında. Beş gövdede de aynı (hepsi aynı rig).
    for (const g of OLCUM.govdeler) expect(g.kalcaKemigi.z).toBeLessThan(-0.3);
  });

  it('SEÇİLEN çapa, arka taşmayı sıfırlayan EN KÜÇÜK süpürme adımıdır', () => {
    const adimlar = OLCUM.govdeler[0].supurme.map((s) => s.dz).filter((dz) => dz >= 0).sort((a, b) => a - b);
    const enKucukSifirlayan = adimlar.find((dz) => enKotu(dz).arka === 0);
    expect(enKucukSifirlayan).toBeDefined();
    expect(KAY_OTURMA_ILERI).toBeCloseTo(enKucukSifirlayan as number, 6);
    expect(enKotu(KAY_OTURMA_ILERI).arka).toBe(0);
  });

  it('çapa gövdeyi masaya SOKMUYOR — en ileri deri, masa açıklığının altında kalır', () => {
    const acikli = Math.min(...OLCUM.govdeler.map((g) => g.masaAcikligi));
    expect(enKotu(KAY_OTURMA_ILERI).ileri).toBeLessThan(acikli);
  });

  it('DÜŞEY eş hâlâ yerinde — yatay çapa onun yerine geçmez', () => {
    // İkisi ayrı eksen: kaldırma kalçayı oturağın YÜKSEKLİĞİNE, çapa oturağın ORTASINA getirir.
    expect(KAY_OTURMA_KALDIRMA).toBeCloseTo(OLCUM.tabure.oturakUstu - 0.382, 3);
  });
});

describe('S19b · çapanın uygulanışı (yön bekçisi)', () => {
  it('çapa gövdenin KENDİ açısıyla döner — dünya eksenine sabit yazılmaz', () => {
    expect(KOD_MUSTERI).toMatch(/Math\.sin\(y\.aci\)\s*\*\s*KAY_OTURMA_ILERI/);
    expect(KOD_MUSTERI).toMatch(/Math\.cos\(y\.aci\)\s*\*\s*KAY_OTURMA_ILERI/);
  });

  it('çapa YALNIZ oturana uygulanır — yürüyen müşteri yana kaymaz', () => {
    expect(/if \(oturan\) \{\s*capaX = Math\.sin/.test(KOD_MUSTERI)).toBe(true);
  });

  it('kök ve balon AYNI çapayı taşır — balon başın arkasında asılı kalmaz', () => {
    expect(KOD_MUSTERI).toMatch(/y\.kok\.position\.set\(\s*x \+ capaX,/);
    expect(KOD_MUSTERI).toMatch(/x \+ capaX,[\s\S]{0,400}?z \+ capaZ,/);
  });

  it('KAPSÜL kolu çapasız kalır — kapsül oturmaz, iner (bilerek eski davranış)', () => {
    const kapsul = KOD_MUSTERI.slice(KOD_MUSTERI.indexOf('kapsul.setMatrixAt') - 600, KOD_MUSTERI.indexOf('kapsul.setMatrixAt'));
    expect(kapsul).not.toMatch(/KAY_OTURMA_ILERI/);
  });
});

describe('S19b · patron ile personel ayrışır (D-116 · P7)', () => {
  it('ÖNLÜK personelin üniforması — patron takmaz (S18 kararı korunur)', () => {
    expect(KAY_KIYAFET.owner.onluk).toBe(false);
    expect(KAY_KIYAFET.waiter.onluk).toBe(true);
  });
});

/**
 * ÖNLÜK (D-116 · A2). Bekçi, önlüğün ÇİZİMİNİ değil VAADİNİ sınar: gövdenin hiçbir tepe
 * noktası önlüğün dışında kalmaz. S19a'nın sabit yarıçapı tam burada düşmüştü — sayı yayın
 * ortasında doğru, kenarında 8,8 cm yanlıştı ve kimse fark etmedi.
 *
 * Test oyunun KENDİ ızgarasını (`onlukIzgarasi`) ve KENDİ parça tablosunu (`ONLUK_PARCALARI`)
 * çağırır; kopya bir hesap yazsaydı önlüğü değil kendi kopyasını doğrulardı.
 */
const ONLUK_TAKANLAR = (Object.keys(KAY_KIYAFET) as (keyof typeof KAY_KIYAFET)[])
  .filter((k) => KAY_KIYAFET[k].onluk)
  .map((k) => KAY_MODEL[k]);

/** Tepe noktasının önlük eksenine göre kutup koordinatı — `onluk.ts` ile aynı eksen. */
const kutup = (v: number[]) => ({ y: v[1], a: Math.atan2(v[0], v[2] - ONLUK_EKSEN_Z), r: Math.hypot(v[0], v[2] - ONLUK_EKSEN_Z) });

/**
 * Bir tepe noktasının bulunduğu yerde önlük yüzeyinin yarıçapı. Yüzey ızgara düğümleri
 * arasında düz gerildiği için KUYTU köşe, dört komşu düğümün EN KÜÇÜĞÜdür — bekçi oradan
 * bakar, yani en kötü durumdan.
 */
function onlukYaricapi(izgara: ReturnType<typeof onlukIzgarasi>, y: number, a: number, yAlt: number, yUst: number, yay: number) {
  const fi = ((y - yAlt) / (yUst - yAlt)) * ONLUK_HALKA;
  const fj = ((a + yay / 2) / yay) * ONLUK_DILIM;
  const i0 = Math.max(0, Math.min(ONLUK_HALKA - 1, Math.floor(fi)));
  const j0 = Math.max(0, Math.min(ONLUK_DILIM - 1, Math.floor(fj)));
  return Math.min(
    izgara.yaricap[i0][j0], izgara.yaricap[i0][j0 + 1],
    izgara.yaricap[i0 + 1][j0], izgara.yaricap[i0 + 1][j0 + 1],
  );
}

describe('S19b · önlük gövdeyi SARAR (D-116 · A2)', () => {
  it('ölçümle düşen kol: gizlenebilecek ayrı bir süs düğümü YOK', () => {
    // "Rozet önlükten çıkıyor" kusurunun ilk kolu buydu; ölçüm elemişti, bekçi ona bağlanmasın.
    const rapor = JSON.parse(readFileSync('docs/olcum-onluk.json', 'utf8'));
    expect(rapor.hukum.ayriSusDugumuVarMi).toBe(false);
  });

  it('SABİT yarıçap yetmiyordu: S19a kolunun 0,365 sayısı gövdeyi deliyor (gerileme bekçisi)', () => {
    const rapor = JSON.parse(readFileSync('docs/olcum-onluk.json', 'utf8'));
    // Bu satır olmasa, aşağıdaki testler sabit bir yarıçapla da yeşil kalabilirdi.
    expect(rapor.hukum.gogusGereken).toBeGreaterThan(0.365);
  });

  for (const govde of ONLUK_TAKANLAR) {
    const tepeler = govdeTepeleri(govde) as number[][];

    for (const [ad, p] of Object.entries(ONLUK_PARCALARI)) {
      it(`${govde} · ${ad}: gövdenin hiçbir tepe noktası önlüğün dışında kalmaz`, () => {
        const yay = (p.yayDerece * Math.PI) / 180;
        const merkez = (p.merkezDerece * Math.PI) / 180;
        const izgara = onlukIzgarasi(
          tepeler.map((v) => kutup(v)),
          p.yAlt, p.yUst, yay, p.genisleme, p.payEk, merkez,
        );
        let enKotuTasma = 0;
        let sayilan = 0;
        for (const v of tepeler) {
          const k = kutup(v);
          let da = k.a - merkez;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          if (k.y < p.yAlt || k.y > p.yUst || Math.abs(da) > yay / 2) continue;
          sayilan++;
          const tasma = k.r - onlukYaricapi(izgara, k.y, da, p.yAlt, p.yUst, yay);
          if (tasma > enKotuTasma) enKotuTasma = tasma;
        }
        expect(sayilan).toBeGreaterThan(0); // parça gövdenin BOŞLUĞUNA çizilmiş olmasın
        expect(enKotuTasma).toBeLessThanOrEqual(0);
      });
    }
  }

  it('önlük deriye YAPIŞMAZ — pay her düğümde gerçekten var', () => {
    const p = ONLUK_PARCALARI.gogus;
    const tepeler = govdeTepeleri(KAY_MODEL.waiter) as number[][];
    const yay = (p.yayDerece * Math.PI) / 180;
    const izgara = onlukIzgarasi(tepeler.map((v) => kutup(v)), p.yAlt, p.yUst, yay, p.genisleme, p.payEk);
    expect(ONLUK_PAY).toBeGreaterThan(0);
    const enKucuk = Math.min(...izgara.yaricap.flat());
    expect(enKucuk).toBeGreaterThanOrEqual(ONLUK_PAY);
  });

  it('parça tablosu TEK yerde — oyun ile bekçi aynı sayıları okur', () => {
    const kod = readFileSync('src/components/three/KayActor.tsx', 'utf8');
    expect(kod).toMatch(/Object\.values\(ONLUK_PARCALARI\)/);
    // Yay +z'de ortalı olmalı: `Math.PI/2` S19a'nın önlüğü gövdenin YANINA düşüren tuzağıydı.
    const onluk = readFileSync('src/components/three/onluk.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(onluk).toMatch(/merkez - yay \/ 2 \+ \(yay \* j\) \/ ONLUK_DILIM/);
  });
});

/**
 * PATRONUN DOKUNUŞU (D-116 · P7). İki işaret birden bekçilenir — tek işaret ekranda zayıf
 * kalıyor (`feedback_upgrade_legibility`) ve biri sessizce düşerse patron garsona dönüşür.
 */
const OLCUM_PATRON = JSON.parse(readFileSync('docs/olcum-patron.json', 'utf8')) as {
  ten: { ortak: { renk: string } };
  govdeler: { govde: string; omuzKemikleri: Record<string, number[]>; omuzYuzeyi: { ustY: number; zAraligi: [number, number] } }[];
};

describe('S19b · patron dokunuşu (D-116 · P7)', () => {
  it('İKİ işaret de patronda var, personelde YOK', () => {
    expect(KAY_KIYAFET.owner.havlu).toBe(true);
    expect(KAY_KIYAFET.owner.sivaliKol).toBe(true);
    for (const rol of ['waiter', 'dishwasher', 'kitchenHand'] as const) {
      expect(KAY_KIYAFET[rol].havlu).toBe(false);
      expect(KAY_KIYAFET[rol].sivaliKol).toBe(false);
    }
  });

  it('sıvama süzgeci rigde GERÇEKTEN kemik seçiyor ve sınır dirsekte kalıyor', () => {
    const o = sivamaOrani(KAY_MODEL.owner, (ad: string) => ALT_KOL_KEMIGI.test(ad), SIVAMA_ESIGI);
    // Hiç kemik seçmeyen bir regex (ör. dosyadaki noktalı ada göre yazılmış olan) sessizce
    // kolu hiç sıvamaz: kol kremde kalır, kimse konsol hatası görmez.
    expect(o.secilenKemik).toBeGreaterThan(0);
    // Ne hiç (0) ne tamamı (1): kolun yarıya yakını dönerse sınır dirsektedir.
    expect(o.oran).toBeGreaterThan(0.3);
    expect(o.oran).toBeLessThan(0.8);
  });

  it('`handslot` SIVANMAZ — o bir eşya çapası, deri değil', () => {
    expect(ALT_KOL_KEMIGI.test('handslotl')).toBe(false);
    expect(ALT_KOL_KEMIGI.test('handl')).toBe(true);
    expect(ALT_KOL_KEMIGI.test('lowerarmr')).toBe(true);
    // Noktalı ad ÇALIŞMA ZAMANINDA görülmez; regex noktalıya göre yazılırsa sıvama ölür.
    expect(ALT_KOL_KEMIGI.test('lowerarm.r')).toBe(false);
  });

  it('ten rengi ÖLÇÜMDEN gelir — palete elle yazılmış bir ton değil', () => {
    expect(PALETTE.kayTen).toBe(OLCUM_PATRON.ten.ortak.renk);
    // İlkel gövdenin teni AYRI kalır: ikisi karışırsa biri diğerini bozar.
    expect(PALETTE.skin).not.toBe(PALETTE.kayTen);
  });

  it('havlunun ölçüsü OMUZDAN türer — sabit sayı değil', () => {
    const r = OLCUM_PATRON.govdeler.find((g) => g.govde === KAY_MODEL.owner);
    expect(r).toBeDefined();
    const omuzY = (r as NonNullable<typeof r>).omuzKemikleri.upperarml[1];
    const deriTepesi = (r as NonNullable<typeof r>).omuzYuzeyi.ustY;
    // Havlu derinin ÜSTÜNDE durur: yükseklik, kemik ile deri tepesi arasındaki farktır.
    expect(HAVLU_YUKSEKLIK).toBeGreaterThanOrEqual(deriTepesi - omuzY - 0.01);
    // Boy omzun kendi derinliğinden: iki katı uzun olursa omuzda TAHTA gibi durur (v1 karesi).
    expect(HAVLU_DERINLIK).toBeCloseTo((r as NonNullable<typeof r>).omuzYuzeyi.zAraligi[1], 2);
  });

  it('sıvalı kol geometriyi KLONLUYOR — müşterilere bulaşmaz', () => {
    // Ranger hem patronun hem müşterilerin gövdesi; `SkeletonUtils.clone` geometriyi paylaşır.
    const kod = readFileSync('src/components/three/patron.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(kod).toMatch(/m\.geometry = m\.geometry\.clone\(\)/);
    expect((KAY_MUSTERI_GOVDE as readonly string[]).includes(KAY_MODEL.owner)).toBe(true);
  });
});

/**
 * BALONUN İÇİ (D-116 · Y1 + B1). Glif iki turdur elle çizilip reddedildi; üçüncüde yön değişti
 * — içeri NESNE giriyor. Bekçi üç şeyi tutuyor: asset gerçekten repoda mı, bardağın silüeti
 * hâlâ "ince belli" mi, ve pişirme sahnenin çizim hedefini geri veriyor mu.
 */
describe('S19b · sipariş balonunun içi (D-116 · Y1/B1)', () => {
  it('tostun modeli REPODA — künyesi manifestte, stil kilidi notuyla', () => {
    const yol = 'public/assets/models/kenney-food-kit/sandwich.glb';
    expect(existsSync(yol)).toBe(true);
    // Doku GÖRELİ yolla bağlı: `Textures/` gelmezse model beyaz çizilir, hata vermez.
    expect(existsSync('public/assets/models/kenney-food-kit/Textures/colormap.png')).toBe(true);
    const manifest = readFileSync('public/assets/README.md', 'utf8');
    expect(manifest).toContain('kenney-food-kit/');
    expect(manifest).toContain('CC0');
    // Stil kilidi tek sanatçıydı; açıldığı YAZILI olmazsa bir sonraki tur bunu emsal sanır.
    expect(manifest).toMatch(/STİL KİLİDİ BİR KEZ, BİLEREK AÇILDI/);
    // Kodun gösterdiği yol ile diskteki dosya aynı olmalı.
    expect(readFileSync('src/components/three/Customers.tsx', 'utf8')).toContain(`/${yol.replace('public/', '')}`);
  });

  it('bardağın BELİ ağzından dar — "ince belli" silüeti buna bağlı', () => {
    expect(BARDAK_BEL).toBeLessThan(BARDAK_AGIZ);
    // Fark kapanırsa bardak düz bir silindire döner ve çayhane imgesi kaybolur. Eşik gözle
    // seçildi (`docs/gorsel/ss/s19b-oyun-yakin.png`), ölçüm değil — ama bekçisiz bırakılamaz.
    expect(BARDAK_AGIZ - BARDAK_BEL).toBeGreaterThan(0.1);
  });

  it('pişirme sahnenin ÇİZİM HEDEFİNİ geri veriyor — vermezse ekran kararır', () => {
    const kod = readFileSync('src/components/three/siparisBalonu.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(kod).toMatch(/const eskiHedef = gl\.getRenderTarget\(\)/);
    expect(kod).toMatch(/gl\.setRenderTarget\(eskiHedef\)/);
    // Konturu taşıyan ters kabuk: arayüz grameri nesnede de sürüyor (`feedback_ui_game_feel`).
    expect(kod).toMatch(/side: BackSide/);
  });

  it('doku model GELMEDEN önbelleğe alınmıyor — boş balon kalıcı olmaz', () => {
    const kod = readFileSync('src/components/three/siparisBalonu.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(kod).toMatch(/if \(dolu\) onbellek\.set\(urun, t\)/);
  });
});
