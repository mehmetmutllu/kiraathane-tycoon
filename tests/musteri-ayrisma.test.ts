import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../src/game/store';
import { LAYOUT, NPC_SPEED } from '../src/game/layout';

/**
 * musteri-ayrisma.test.ts — S18'in BEKÇİSİ (D-115).
 *
 * Kullanıcı 2026-09-14: *"gelen misafirler baya yan yana iç içe yürüyo"*.
 *
 * ÖLÇÜM (`docs/olcum-musteri.txt` §3): yürüyen çiftlerin **%1,40'ı** iç içeydi ve görülen en kısa
 * merkez arası **0,046 br**'ydi (çakışma eşiği 2r = 0,560) — yani gövdeler neredeyse tamamen
 * üst üsteydi. Sebep bir eşiğin küçüklüğü değildi: `navStep`in ayrışma parametresi yalnız
 * personele veriliyordu, müşteriler arasında böyle bir kuvvet KODDA HİÇ YOKTU.
 *
 * NEDEN KAYNAK METNİ DEĞİL DAVRANIŞ: "tick.ts'te `npcAyristir` çağrısı var mı" sorusu, kuvvetin
 * DOĞRU çalıştığını söylemez — yanlış eksende iten, oturanı masadan kaldıran ya da hiç etki
 * etmeyen bir uygulama da o denetimden geçerdi. Aşağıdakiler gerçek `tick()`i koşturur.
 */
type Npc = ReturnType<typeof useGame.getState>['npcs'][number];

const CAKISMA = LAYOUT.actorRadius * 2;
const ara = (a: Npc, b: Npc) => Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);

/** İki müşteriyi elle üst üste koy ve `tick`i koştur. */
function ikiMusteriKur(durum: string, x: number, z: number, sapma: number) {
  useGame.getState().hardReset();
  // ŞABLON GERÇEK BİR NPC'DEN alınır: alanları elle yazsaydık (`product`, `seatIndex`, `timer`…)
  // şema değiştiğinde test sessizce anlamsızlaşır ya da `tick` tanımsız alana düşerdi — ilk
  // yazılışında tam bu oldu: `npcs[0]` daha doğmamıştı ve `slot.seats` patladı.
  const tick = useGame.getState().tick;
  for (let i = 0; i < 2000 && useGame.getState().npcs.length === 0; i++) tick(0.1);
  const taban = useGame.getState().npcs[0];
  if (!taban) throw new Error('senaryo kurulamadı: hiç müşteri doğmadı');
  const yap = (id: number, dx: number): Npc => ({
    ...taban, id, tableIndex: 0, seatIndex: 0,
    state: durum as Npc['state'], pos: [x + dx, 0, z] as Npc['pos'],
  });
  useGame.setState({ npcs: [yap(901, 0), yap(902, sapma)] });
}

describe('S18 · müşteri-müşteri ayrışması (D-115)', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
  });

  it('üst üste duran İKİ YÜRÜYEN müşteri birbirinden ayrılır', () => {
    ikiMusteriKur('toTable', LAYOUT.tables[0].seat[0], LAYOUT.tables[0].seat[2] + 4, 0.05);
    const once = ara(useGame.getState().npcs[0], useGame.getState().npcs[1]);
    expect(once).toBeLessThan(CAKISMA); // başlangıç gerçekten iç içe
    const tick = useGame.getState().tick;
    for (let i = 0; i < 10; i++) tick(0.1);
    const npcs = useGame.getState().npcs;
    if (npcs.length < 2) return; // biri oturduysa senaryo bitmiştir, ayrışma zaten iş görmüş
    expect(ara(npcs[0], npcs[1])).toBeGreaterThan(once);
  });

  it('TAM ÜST ÜSTE (mesafe 0) durumda da ayrılır — sıfıra bölme kilitlemez', () => {
    ikiMusteriKur('toTable', LAYOUT.tables[0].seat[0], LAYOUT.tables[0].seat[2] + 4, 0);
    const tick = useGame.getState().tick;
    for (let i = 0; i < 10; i++) tick(0.1);
    const npcs = useGame.getState().npcs;
    if (npcs.length < 2) return;
    const d = ara(npcs[0], npcs[1]);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(0.01);
  });

  /**
   * OTURAN İTİLMEZ. İlk yazılışı "konum hiç değişmesin" diyordu ve HAKSIZ yere kırmızıydı:
   * sabrı biten müşteri `leaving`e geçip yürüyor, yani konumu DURUM MAKİNESİ taşıyor — ayrışma
   * değil. Bekçi artık yalnız İKİSİ DE OTURUYORKEN bakıyor; ölçtüğü şey ayrışma kuvvetinin
   * koltuktaki gövdeye dokunup dokunmadığı.
   */
  it('OTURAN müşteri itilmez — yeri koltuktur', () => {
    const seat = LAYOUT.tables[0].seat;
    ikiMusteriKur('waitingForTea', seat[0], seat[2], 0.02);
    // SABIR TIMER'INI UZAT: şablon NPC'nin `timer`ı başka bir durumdan geliyor ve ilk tick'te
    // tükenip müşteriyi `leaving`e atıyordu — senaryo ayrışmayı hiç sınayamadan bitiyordu.
    useGame.setState({ npcs: useGame.getState().npcs.map((n) => ({ ...n, timer: 9999 })) });
    const tick = useGame.getState().tick;
    const oturan = (n: Npc) => n.state === 'waitingForTea' || n.state === 'drinking';
    let denetim = 0;
    for (let i = 0; i < 20; i++) {
      const once = useGame.getState().npcs.map((n) => ({ id: n.id, pos: [...n.pos], otur: oturan(n) }));
      tick(0.1);
      const sonra = useGame.getState().npcs;
      for (const o of once) {
        if (!o.otur) continue;
        const y = sonra.find((n) => n.id === o.id);
        if (!y || !oturan(y)) continue; // bu karede kalktıysa durum makinesinin işi, atla
        expect(Math.hypot(y.pos[0] - o.pos[0], y.pos[2] - o.pos[2])).toBeLessThan(0.001);
        denetim++;
      }
    }
    expect(denetim, 'hiç oturan kare görülmedi — senaryo ayrışmayı sınamamış').toBeGreaterThan(0);
  });

  /**
   * KARIŞIK ÇİFT: biri OTURUYOR, öteki YÜRÜYOR ve üstünden geçiyor.
   *
   * Asıl korunan durum budur — ve ilk test takımı bunu KAÇIRIYORDU: iki NPC de oturuyordu, o
   * yüzden dış döngünün `AYRISMASIZ` bekçisini silmek hiçbir testi kırmıyordu (iç döngünün
   * bekçisi örtüyordu). Mutasyonla yakalandı. Yürüyen biri, koltuktaki müşteriyi masadan
   * itebilmemeli.
   */
  it('YÜRÜYEN, OTURANI koltuğundan itemez', () => {
    // YÜRÜYENİN HEDEFİ UZAK OLMALI. İlk kurulumda ikisi de masa 0'ın koltuğundaydı: yürüyen
    // TEK TICK'te varıp `waitingForTea`ye geçiyordu, yani karışık çift hiç oluşmuyor ve test
    // vakumda yeşil kalıyordu (M3 bu yüzden kaçtı). Artık yürüyen uzak bir masaya gidiyor ve
    // oturanın üstünden GEÇİYOR.
    const seat = LAYOUT.tables[0].seat;
    const uzak = LAYOUT.tables.length - 1;
    ikiMusteriKur('waitingForTea', seat[0], seat[2], 0.02);
    const npcs0 = useGame.getState().npcs;
    useGame.setState({
      npcs: [
        { ...npcs0[0], timer: 9999 },                                             // OTURAN
        { ...npcs0[1], state: 'toTable' as Npc['state'], tableIndex: uzak },      // YÜRÜYEN
      ],
    });
    const tick = useGame.getState().tick;
    let denetim = 0;
    for (let i = 0; i < 20; i++) {
      const once = useGame.getState().npcs.find((n) => n.id === 901);
      const yuruyen = useGame.getState().npcs.find((n) => n.id === 902);
      // Denetim ancak İKİSİ DE sahnedeyken ve GERÇEKTEN İÇ İÇEYKEN anlamlı: ayrılmışlarsa
      // ayrışma zaten devreye girmez ve test hiçbir şey sınamamış olur.
      if (!once || !yuruyen || once.state !== 'waitingForTea') break;
      const icIce = ara(once, yuruyen) < CAKISMA;
      const bas = [...once.pos];
      tick(0.1);
      const sonra = useGame.getState().npcs.find((n) => n.id === 901);
      if (!sonra || sonra.state !== 'waitingForTea' || !icIce) continue;
      expect(Math.hypot(sonra.pos[0] - bas[0], sonra.pos[2] - bas[2])).toBeLessThan(0.001);
      denetim++;
    }
    // SAYAÇ ŞART: bu olmadan test, hiç iç içe kare görmeden VAKUMDA yeşil kalıyordu ve
    // "oturan da itiliyor" mutasyonu kaçıyordu (M3).
    expect(denetim, 'iç içe oturan/yürüyen çifti hiç görülmedi — senaryo sınamamış').toBeGreaterThan(0);
  });

  /**
   * AYRIŞMA YOL BULMAYI KİLİTLEMEZ. Dayanak bilerek EKONOMİ DEĞİL, yolun kendisi: ilk hâli
   * "servis edilen çay > 0" diyordu ve tek başına yeşil, tam takımda kırmızıydı — servis, çay
   * demlenmesine ve garson pad'ine bağlı, yani ayrışmayla ilgisi olmayan bir sürü şeye. Ölçülen
   * şey artık doğrudan soru: müşteri koltuğa VARABİLİYOR MU.
   */
  it('ayrışma HEDEFE VARMAYI bozmaz — müşteri yine koltuğa oturur', () => {
    useGame.getState().hardReset();
    const tick = useGame.getState().tick;
    let oturanGoruldu = false;
    for (let i = 0; i < 4000 && !oturanGoruldu; i++) {
      tick(0.1);
      oturanGoruldu = useGame.getState().npcs.some(
        (n) => n.state === 'waitingForTea' || n.state === 'drinking');
    }
    expect(oturanGoruldu, 'hiçbir müşteri koltuğa varamadı — ayrışma yolu kilitliyor').toBe(true);
  });

  it('müşteri hızı yürüyüş klibinin taşıyabileceği menzilde (D-115)', () => {
    // 1,40 seçildi; kelepçe tavanında Walking_A 1,028 br/sn taşıyor → kayma 1,36×.
    expect(NPC_SPEED).toBeCloseTo(1.4, 6);
  });
});
