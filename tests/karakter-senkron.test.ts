/**
 * karakter-senkron.test.ts — S15'in BEKÇİSİ (D-113).
 *
 * **Neyi koruyor:** bu turda üç şey aynı anda değişti ve üçü de sessizce bozulabilir cinsten.
 *
 * 1. **Yürüme senkronu.** Kullanıcının "havada süzülüyor" dediği kusurun sebebi kliplerin
 *    `timeScale = 1`de çalmasıydı: `Walking_A` 0,571 br/sn için çizilmiş, oyuncu 4,5-5,4 br/sn
 *    gidiyordu (ayak 7,9-9,5 katı kayıyor). Artık klip HIZDAN seçiliyor ve katsayı hızdan
 *    türüyor. `KLIP_HIZI`'ndaki sayılar ÖLÇÜMDÜR (`docs/olcum-yuruyus.json` §S_senkron) —
 *    elle "ayarlanırsa" kusur geri gelir ve kimse fark etmez, çünkü konsol hatası vermez.
 *    Sayılar ham rig hızının `KAY_SCALE` ile çarpımıdır: ölçek değişirse bunlar da değişmeli.
 *
 * 2. **Kafa ölçeği TELAFİSİZ olmalı.** Kolun seçilme sebebi `ACTOR_HEIGHT`e ve ondan türeyen
 *    hiçbir şeye dokunmamasıydı (SEATED_DROP, PLAYER_RADIUS, BUBBLE_Y, CAMERA_LOOK_Y, nav).
 *    Biri `KAY_SCALE`i kafa ölçeğiyle "telafi" ederse omuz blob sınırını aşar (ölçüldü: ×0,80
 *    telafili kolda omuz 0,616 > 0,60) ve bunu ancak bir ekran görüntüsü yakalar.
 *
 * 3. **`head` ölçek izinin sökülmesi.** KayKit her klipte her kemiğin ölçeğini yazıyor; iz
 *    sökülmezse mixer `KAY_KAFA_OLCEK`in üstüne her karede 1,0 yazar ve kafa küçülmez. Sökmek
 *    ancak izler TAM 1,0 olduğu için güvenli — o varsayım burada doğrulanır.
 *
 * Sayılar: `docs/karakter-raporu-s15.md` · ham `docs/olcum-yuruyus.json`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  ACTOR_HEIGHT,
  KAY_SCALE,
  KAY_AUTHORED,
  KAY_KAFA_OLCEK,
  KAY_KIYAFET,
  KLIP_HIZI,
  TIMESCALE_TAVAN,
  TIMESCALE_TABAN,
  KAY_OTURMA_KALDIRMA,
  NPC_SKIN_CAP,
  KAY_TEPSI_KAYMA,
  KAY_GARSON_TEPSI_KAYMA,
  SEATED_DROP,
  BUBBLE_Y,
  PLAYER_RADIUS,
  CAMERA_LOOK_Y,
} from '../src/config/actor';
import { lokomosyonSec, LOKOMOSYON } from '../src/components/three/KayActor';
// @ts-expect-error — ölçüm aracı düz .mjs; tip yok, glTF okuyucu var.
import { gltfOku } from '../tools/olcum-karakter.mjs';

const OLCUM = JSON.parse(readFileSync('docs/olcum-yuruyus.json', 'utf8'));
const OLCUM_TEPSI = JSON.parse(readFileSync('docs/olcum-tepsi.json', 'utf8'));
/** Karakter dosyasının GERÇEK kemik adları (glTF düğümleri) — ölçüm aracının okuyucusuyla. */
function rigKemikleri(): string[] {
  const { j } = gltfOku('public/assets/models/kaykit-characters/Knight.glb') as {
    j: { nodes: { name: string }[]; skins?: { joints: number[] }[] };
  };
  const joints = j.skins?.[0]?.joints ?? [];
  return joints.map((i) => j.nodes[i].name);
}

/** Kodun seçtiği taşıma klibi — kaynaktan okunur ki test ile kod tek yerden beslensin. */
const KLIP_TUT = /tut: '([^']+)'/.exec(readFileSync('src/components/three/KayActor.tsx', 'utf8'))?.[1] ?? '';
const KAYNAK_ACTOR = readFileSync('src/components/three/KayActor.tsx', 'utf8');
const KAYNAK_MUSTERI = readFileSync('src/components/three/Customers.tsx', 'utf8');

/** Oyunun hareket hızları — ölçüm dosyasının damgaladığı takım. */
const HIZLAR = OLCUM.kaynak.hizlar as Record<string, number>;

describe('S15 · yürüme senkronu (D-113)', () => {
  it('KLIP_HIZI ölçüm dosyasıyla birebir aynı — koddaki sayı elle "ayarlanamaz"', () => {
    for (const [ad, hiz] of Object.entries(KLIP_HIZI)) {
      const olculen = OLCUM.S_senkron[ad];
      expect(olculen, `${ad} ölçüm dosyasında yok`).toBeDefined();
      expect(hiz, `${ad} koddaki hız ölçümden sapmış`).toBeCloseTo(olculen.dunyaHizi, 3);
    }
  });

  it('klip hızları KAY_SCALE ile tutarlı — ölçek değişirse bu sayılar da değişmeli', () => {
    for (const [ad, hiz] of Object.entries(KLIP_HIZI)) {
      const ham = OLCUM.S_senkron[ad].hamHiz;
      expect(hiz, `${ad}: ham hız × KAY_SCALE tutmuyor`).toBeCloseTo(ham * KAY_SCALE, 2);
    }
    expect(KAY_SCALE).toBeCloseTo(ACTOR_HEIGHT / KAY_AUTHORED, 6);
  });

  it('klipler YERİNDE — kök kayması sıfır olmasaydı timeScale yaklaşımı geçersizdi', () => {
    for (const ad of Object.keys(KLIP_HIZI)) {
      expect(OLCUM.S_senkron[ad].kokKayma, `${ad} kök kayması var`).toBeCloseTo(0, 3);
    }
  });

  it('yavaş aktör YÜRÜR, hızlı aktör KOŞAR', () => {
    expect(lokomosyonSec(LOKOMOSYON.yuru, 0.6).klip).toBe('Walking_A');
    expect(lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['garson k0']).klip).toBe('Running_A');
    expect(lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['oyuncu k3']).klip).toBe('Running_A');
    // Taşıyan garson kendi klibinden başlar; hızlanınca koşuya geçer.
    expect(lokomosyonSec(LOKOMOSYON.tasi, 0.7).klip).toBe('Walking_B');
  });

  it('katsayı hızdan türer — personel ve müşteride ayak KAYMAZ', () => {
    // Kelepçeye çarpmayan aktörlerde seçilen klip × katsayı = gerçek hız (kayma = 1,00×).
    for (const ad of ['garson k0', 'garson k1', 'bulasikci k0']) {
      const hiz = HIZLAR[ad];
      const { klip, timeScale } = lokomosyonSec(LOKOMOSYON.yuru, hiz);
      expect(timeScale, `${ad} kelepçeye çarpmamalı`).toBeLessThan(TIMESCALE_TAVAN);
      expect(KLIP_HIZI[klip] * timeScale, `${ad} ayak kayıyor`).toBeCloseTo(hiz, 2);
    }
  });

  it('OYUNCU kelepçeye çarpar ve artık kayma raporun söylediği kadardır (2,0×)', () => {
    const { klip, timeScale } = lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['oyuncu k0']);
    expect(timeScale).toBe(TIMESCALE_TAVAN);
    const tasinan = KLIP_HIZI[klip] * timeScale;
    expect(HIZLAR['oyuncu k0'] / tasinan).toBeCloseTo(2.0, 1);
    // Kelepçe OLMASAYDI kayma 7,9× olurdu — kusurun bugünkü hâli.
    expect(HIZLAR['oyuncu k0'] / KLIP_HIZI.Walking_A).toBeCloseTo(7.9, 1);
  });

  it('katsayı iki uçtan da kelepçelidir', () => {
    expect(lokomosyonSec(LOKOMOSYON.yuru, 50).timeScale).toBe(TIMESCALE_TAVAN);
    expect(lokomosyonSec(LOKOMOSYON.yuru, 0.001).timeScale).toBe(TIMESCALE_TABAN);
  });

  it('katsayı KOD içinde her kare yazılır — yalnız klip değişince yazılsa hız yükseltmesi tutmazdı', () => {
    expect(KAYNAK_ACTOR).toMatch(/lokomosyon\.timeScale = secim \? secim\.timeScale : 1;/);
    // Atama, erken dönüşten ÖNCE gelmeli. Çapa `varOlan` süzgeci: erken dönüş bloğunun
    // ilk satırı odur (S18'de iki koşullu hâle geldi, bkz. "T-POZ" testleri).
    expect(KAYNAK_ACTOR.indexOf('lokomosyon.timeScale =')).toBeLessThan(
      KAYNAK_ACTOR.indexOf('const varOlan = hedefler.filter('),
    );
  });

  /**
   * T-POZ HATASI (S18) — kullanıcı: *"tüm karakterlerin elleri sağa açık garsonlar için vs"*.
   *
   * Klipleri geç çözülen bir aktörde mount kancası hiçbir eylem başlatamıyordu (`actions` henüz
   * boş) ve `useFrame`in erken dönüşü "hedef değişmedi" diye her karede vuruyordu → o aktörde
   * HİÇBİR klip hiç çalmıyor, kemikler KayKit'in bind pozunda (T-poz) kalıyordu. Ölçüm:
   * `docs/olcum-kol.json` — donuk gövdede el oynaması TAM 0.
   *
   * Bekçi, erken dönüşün İKİ koşula birden bağlı kalmasını denetler. Tek koşula geri dönerse
   * hata sessizce geri gelir; sahne görsel olarak doğrulanamadığı için bunu yakalayacak başka
   * bir şey yok.
   */
  it('T-POZ: erken dönüş "hedef değişmedi" ile yetinmez, hedefin ÇALDIĞINI da arar', () => {
    expect(KAYNAK_ACTOR).toMatch(/const ayniHedef = hedefler\.length === suAn\.current\.length/);
    // İkinci koşul: var olan eylemlerin HEPSİ gerçekten çalıyor olmalı.
    expect(KAYNAK_ACTOR).toMatch(/if \(ayniHedef && varOlan\.every\(\(ad\) => actions\[ad\]!\.isRunning\(\)\)\) return;/);
  });

  it('T-POZ: erken dönüş yalnız VAR OLAN eylemlere bakar — olmayanı beklemek sonsuz yeniden başlatır', () => {
    expect(KAYNAK_ACTOR).toMatch(/const varOlan = hedefler\.filter\(\(ad\) => actions\[ad\]\);/);
    // Hiç eylem yoksa çıkılır: yoksa her kare yeniden başlatma denenirdi.
    expect(KAYNAK_ACTOR).toMatch(/if \(varOlan\.length === 0\) return;/);
    // Sıra: `varOlan` süzgeci, "çalıyor mu" denetiminden ÖNCE gelmeli.
    expect(KAYNAK_ACTOR.indexOf('const varOlan = hedefler.filter(')).toBeLessThan(
      KAYNAK_ACTOR.indexOf('varOlan.every((ad) => actions[ad]!.isRunning())'),
    );
  });

  it('katsayı YALNIZ lokomosyon yarısına uygulanır — tutuş pozu hızlanmamalı', () => {
    // Taşırken iki yarım klip aynı anda çalıyor; `Holding_A` hızlandırılırsa tepsi titrer.
    expect(KAYNAK_ACTOR).toMatch(/const lokomosyon = actions\[hedefler\[0\]\];/);
  });
});

describe('S16 · taşıma pozu ve tepsi çapası', () => {
  it('ÜST - ALT gövde bölüşümü GERÇEK kemik adlarıyla rigi TAM ikiye ayırır', () => {
    // İki yarım klip aynı anda tam ağırlıkta çalıyor. Bir kemik İKİ kümede de olsaydı iki eylem
    // aynı özelliğe yazar ve poz bozulurdu; hiçbirinde olmasaydı o kemik donardı.
    //
    // TUZAK (S16'da birebir yaşandı): dosyada kemik `upperarm.l` yazıyor ama three'nin
    // `GLTFLoader`ı adı `sanitizeNodeName` ile geçiriyor ve NOKTAYI SİLİYOR → sahnede
    // `upperarml`. Noktalı yazılan küme hiçbir kolu yakalamıyordu ve KONSOL HATASI VERMİYORDU.
    // Bu yüzden adlar burada GERÇEK dosyadan okunup aynı kuralla sterilize ediliyor — kaynak
    // metnine değil, gövdenin gerçekten taşıdığı kemiklere bakılır.
    const ust = [...KAYNAK_ACTOR.slice(
      KAYNAK_ACTOR.indexOf('const UST_KEMIKLER'),
      KAYNAK_ACTOR.indexOf('* ADLAR NEDEN NOKTASIZ'),
    ).matchAll(/'([A-Za-z0-9_.]+)'/g)].map((m) => m[1]);

    const steril = (ad: string) => ad.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
    const kemikler = rigKemikleri().map(steril);

    expect(kemikler).toHaveLength(23); // Rig_Medium — S14'te ölçüldü
    // Kümedeki her ad gövdede GERÇEKTEN var mı (noktalı yazılsaydı burada patlardı).
    for (const k of ust) expect(kemikler, `${k} gövdede yok — steril ad mı?`).toContain(k);
    expect(ust).toHaveLength(13);
    expect(kemikler.filter((k) => !ust.includes(k))).toHaveLength(10);
  });

  it('el çapası GERÇEK kemik adıyla aranır — noktalı ad sessizce bulunamaz', () => {
    const steril = (ad: string) => ad.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
    const kemikler = rigKemikleri().map(steril);
    expect(kemikler).toContain(steril('handslot.l'));
    expect(kemikler).toContain(steril('handslot.r'));
    // Kod adı STERIL()'den geçirmeli; düz 'handslot.l' yazılırsa `getObjectByName` null döner
    // ve tepsi sessizce karakterin AYAKLARINDA kalır (S16'da birebir bu oldu).
    expect(KAYNAK_ACTOR).toMatch(/getObjectByName\(STERIL\('handslot\.l'\)\)/);
    expect(KAYNAK_ACTOR).toMatch(/getObjectByName\(STERIL\('handslot\.r'\)\)/);
  });

  it('taşıma pozu eller ÖNDE ve KIPIRDAMAYAN bir klipten gelir', () => {
    const olculen = OLCUM_TEPSI.adaylar.find((a) => a.klip === KLIP_TUT);
    expect(olculen).toBeDefined();
    expect(olculen.ellerOnde).toBe(true);
    // Eller klip boyunca oynarsa tepsi titrer: yürüme 0,3-0,5 oynuyor, tutuş 0,002.
    expect(olculen.elOynamasi).toBeLessThan(0.05);
  });

  it('taşıma klibi, yürüme kliplerinden BELİRGİN daha sabit el verir', () => {
    const tut = OLCUM_TEPSI.adaylar.find((a) => a.klip === KLIP_TUT);
    for (const ad of ['Walking_A', 'Running_A']) {
      const y = OLCUM_TEPSI.adaylar.find((a) => a.klip === ad);
      expect(tut.elOynamasi).toBeLessThan(y.elOynamasi);
    }
  });

  it('Walking_B taşıma klibi DEĞİLDİR — ölçüldü, elleri ARKADA', () => {
    // Kod S14'te onu "tasi" diye etiketlemişti; ölçüm çürüttü (orta z negatif).
    const wb = OLCUM_TEPSI.adaylar.find((a) => a.klip === 'Walking_B');
    expect(wb.ellerOnde).toBe(false);
    expect(wb.ortaZ).toBeLessThan(0);
  });

  it('taşınan eşya ELİ takip eder — sabit dünya noktasına asılı DEĞİL', () => {
    expect(KAYNAK_ACTOR).toMatch(/eller\.current = \[/);
    // Konum takip edilir, DÖNÜŞ edilmez: tepsi düz kalmalı, elin eğimiyle yalpalamamalı.
    expect(KAYNAK_ACTOR).toMatch(/t\.position\.copy\(solP\.current\)/);
    expect(KAYNAK_ACTOR).not.toMatch(/t\.quaternion\.copy/);
  });

  it('kaymalar bileşenin İÇ çapasını sıfırlar — eşya elin ORİJİNİNE otursun', () => {
    expect(KAY_TEPSI_KAYMA[1] + 1.0).toBeCloseTo(0, 6);
    expect(KAY_GARSON_TEPSI_KAYMA[1] + 0.95).toBeCloseTo(0, 6);
  });
});

describe('S15 · kafa ölçeği TELAFİSİZ (D-113)', () => {
  it('kafa ölçeği türeyen HİÇBİR sayıyı kıpırdatmaz — kolun seçilme sebebi bu', () => {
    expect(KAY_SCALE).toBeCloseTo(ACTOR_HEIGHT / KAY_AUTHORED, 6);
    expect(SEATED_DROP).toBeCloseTo(1.3 - ACTOR_HEIGHT, 6);
    expect(BUBBLE_Y).toBeCloseTo(ACTOR_HEIGHT + 0.15, 6);
    expect(PLAYER_RADIUS).toBeCloseTo(0.47, 2);
    expect(CAMERA_LOOK_Y).toBeCloseTo(0.8, 6);
  });

  it('KAY_SCALE kafa ölçeğini TELAFİ ETMEZ (telafi omuzu blob sınırının üstüne çıkarır)', () => {
    // Telafili kol `ACTOR_HEIGHT / (KAY_AUTHORED × f(kafa))` biçiminde olurdu; burada yok.
    const telafili = ACTOR_HEIGHT / (KAY_AUTHORED * KAY_KAFA_OLCEK);
    expect(KAY_SCALE).not.toBeCloseTo(telafili, 3);
    expect(KAY_SCALE * KAY_AUTHORED).toBeCloseTo(ACTOR_HEIGHT, 6);
  });

  it('kafa ölçeği 0 ile 1 arasında — 1 üstü büyütme, 0 baş yok demek', () => {
    expect(KAY_KAFA_OLCEK).toBeGreaterThan(0.3);
    expect(KAY_KAFA_OLCEK).toBeLessThanOrEqual(1);
  });

  it('kafa yalnız `head` KEMİĞİNDEN küçültülür ve kıyafetten ÖNCE — kasket onunla küçülsün', () => {
    expect(KAYNAK_ACTOR).toMatch(/n\.name === 'head'\) n\.scale\.setScalar\(KAY_KAFA_OLCEK\)/);
    expect(KAYNAK_ACTOR.indexOf('kafaKucult(o)')).toBeLessThan(KAYNAK_ACTOR.indexOf('kiyafetTak(o, kind)'));
  });

  it('`head` ölçek izi sökülür VE sökmek güvenli (kullanılan kliplerde ölçek tam 1,0)', () => {
    expect(KAYNAK_ACTOR).toMatch(/filter\(\(t\) => t\.name !== 'head\.scale'\)/);
    // Klip KLONLANMAMALI: klonlamak her render'da 139 klip üretiyor ve müşteri havuzunun
    // kimliğini kaydırıyordu — duman testi canvas'ı 15 sn'de göremiyordu.
    expect(KAYNAK_ACTOR).not.toMatch(/\.map\(\(klip\) => \{[\s\S]*?klip\.clone\(\)/);
  });
});

describe('S15 · sahibin kasketi kalktı (kullanıcı kararı)', () => {
  it('sahipte kasket YOK, mutfak elemanında VAR', () => {
    expect(KAY_KIYAFET.owner.kasket).toBe(false);
    expect(KAY_KIYAFET.kitchenHand.kasket).toBe(true);
  });

  it('önlük dört rolde de duruyor — kalkan yalnız kasketti', () => {
    for (const rol of ['owner', 'waiter', 'dishwasher', 'kitchenHand'] as const) {
      expect(KAY_KIYAFET[rol].onluk, `${rol} önlüğü kayboldu`).toBe(true);
    }
  });
});

describe('S15 · müşteri skinned (D-113)', () => {
  it('bütçe oyunun üretebildiği EN YÜKSEK müşteri sayısını kapsar — kapsül görünmemeli', () => {
    // `maxConcurrent = max(8, totalSeats + 2)`; 24 masa tam açıkken müşteri 70'i geçebiliyor.
    // Oyunda ölçüldü: yalnız 12 masada 38 eşzamanlı müşteri. Kullanıcı kararı: kapsül hiç
    // görünmesin (2026-09-14) → tavan o tepenin üstünde kalmalı.
    expect(NPC_SKIN_CAP).toBeGreaterThanOrEqual(80);
  });

  it('tavanı aşan müşteri için kapsül kolu DURUYOR — silinirse geç oyunda müşteri kaybolur', () => {
    expect(KAYNAK_MUSTERI).toMatch(/CapsuleGeometry/);
    expect(KAYNAK_MUSTERI).toMatch(/i < yuvalar\.length/);
  });

  it('havuz TAM BİR KEZ kurulur — useMemo kimliği kayarsa gövdeler her render yeniden kurulur', () => {
    expect(KAYNAK_MUSTERI).toMatch(/const havuz = useRef</);
    expect(KAYNAK_MUSTERI).toMatch(/if \(!havuz\.current\)/);
  });

  it('havuz TEMBEL büyür — mount anında tavan kadar gövde kurulmaz', () => {
    // Tavan 80'e çıkınca hepsini mount'ta kurmak ana iş parçacığını kilitliyordu: duman testi
    // üç koşudan birinde canvas'ı 15 sn'de göremedi. Yuvalar müşteri geldikçe, kare başına
    // en çok `YUVA_BASINA_KARE` tane ekleniyor.
    expect(KAYNAK_MUSTERI).toMatch(/const YUVA_BASINA_KARE = \d+;/);
    expect(KAYNAK_MUSTERI).toMatch(/havuz\.buyut\(n\)/);
    // Kurulum döngüsü kare başına SINIRLI olmalı.
    expect(KAYNAK_MUSTERI).toMatch(/kurulan < YUVA_BASINA_KARE/);
    const adet = Number(/const YUVA_BASINA_KARE = (\d+);/.exec(KAYNAK_MUSTERI)?.[1] ?? '999');
    expect(adet).toBeGreaterThan(0);
    expect(adet, 'kare başına kurulum tavana yakınsa tembellik anlamını yitirir').toBeLessThan(10);
  });

  it('oturan müşteri GERÇEK oturuş klibinde; kapsülün SEATED_DROP numarası ona uygulanmaz', () => {
    expect(KAY_OTURMA_KALDIRMA).toBeGreaterThan(0); // kapsül numarası NEGATİF (−0,45)
    expect(SEATED_DROP).toBeLessThan(0);
    // Skinned kol kaldırmayı, kapsül kolu düşürmeyi kullanır.
    expect(KAYNAK_MUSTERI).toMatch(/oturan \? KAY_OTURMA_KALDIRMA : 0/);
    expect(KAYNAK_MUSTERI).toMatch(/oturan \? SEATED_DROP \+ Math\.sin/);
  });

  it('gövde başına İKİ mesh — baş dokusunu korur, gövde köşe renginden boyanır', () => {
    expect(KAYNAK_MUSTERI).toMatch(/vertexColors: true/);
    expect(KAYNAK_MUSTERI).toMatch(/basMi\(p\.name\)/);
    // Baş boyanmamalı: `govdeMat` yalnız gövde kümesine verilir.
    const basBlok = KAYNAK_MUSTERI.slice(KAYNAK_MUSTERI.indexOf('if (bas.length)'), KAYNAK_MUSTERI.indexOf('if (govde.length)'));
    expect(basBlok).not.toMatch(/govdeMat/);
  });

  it('gömlek rengi müşteriden gelir — yuva el değiştirince yeniden yazılır', () => {
    expect(KAYNAK_MUSTERI).toMatch(/y\.govdeMat\.color\.set\(npc\.color\)/);
  });

  it('OTURAN müşteri MASAYA döner — yön hareketten değil masa merkezinden gelir', () => {
    // Yön normalde hareketten türüyor; oturunca hareket bitiyor ve müşteri geldiği yöne
    // bakakalıyordu (kullanıcı 2026-09-14: "oturmalar sıkıntı, masaya dönük değiller").
    expect(KAYNAK_MUSTERI).toMatch(/LAYOUT\.tables\[npc\.tableIndex\]\?\.table/);
    expect(KAYNAK_MUSTERI).toMatch(/Math\.atan2\(masa\[0\] - x, masa\[2\] - z\)/);
    // Oturan koluna, hareket kolundan ÖNCE bakılmalı; sonra bakılsa hareket yönü kazanırdı.
    const oturanDal = KAYNAK_MUSTERI.indexOf('if (oturan) {');
    const hareketDal = KAYNAK_MUSTERI.indexOf('} else if (dx * dx + dz * dz > 1e-5) {');
    expect(oturanDal).toBeGreaterThan(-1);
    expect(oturanDal).toBeLessThan(hareketDal);
  });

  it('yuva el değiştirince açı SNAP eder — önceki müşterinin yönünden dönmez', () => {
    expect(KAYNAK_MUSTERI).toMatch(/y\.yeniYuva = true;/);
    expect(KAYNAK_MUSTERI).toMatch(/y\.aci = y\.yeniYuva \? y\.hedefAci : MathUtils\.damp/);
  });
});
