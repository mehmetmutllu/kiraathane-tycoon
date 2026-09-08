/**
 * kuyruk.test.ts — SİPARİŞ KUYRUĞU BEKÇİSİ (Faz C3; D-046 ② + ③).
 *
 * D-046 (2026-09-06) beş kural yazdı ve doğrulama satırında *"'hiçbir masa X saniyeden fazla
 * beklemedi' iddiası TESTE yazılır"* dedi. C3'te önce ÖLÇÜLDÜ (`docs/kuyruk-raporu-c3.md`) ve
 * ölçüm iki şey gösterdi:
 *
 *  1. Kural ② (**üstlenme bağlayıcı**) hiç uygulanmamıştı: `claimed` yalnız O KARE için tutuluyor,
 *     hedef her karede yeniden seçiliyordu. Garson ilk durağına giderken hedefinden başlangıç
 *     mesafesinin **5,6 katı** kadar uzaklaşabiliyordu.
 *  2. "X saniye" ölçütü bu mimaride **kendiliğinden doğru ama boş**: sabrı aşan bekleme zaten
 *     "terk" sayılıyor, bekleme süresi sabır tavanıyla kelepçeli. Anlamlı bekçi süre değil,
 *     **üstlenmenin bağlayıcılığı** — çünkü ölçülen kusur oydu.
 *
 * Bu yüzden bekçi bir EŞİK LİSTESİ değil, bir DAVRANIŞ SÖZLEŞMESİ: *bir garson üstlendiği masayı,
 * ancak teslim edince ya da o masa servis edilemez hâle gelince bırakır.* Sözleşme hem elle kurulan
 * durumlarda (blok 1) hem de gerçek akışta her karede (blok 2) doğrulanır.
 */
import { describe, it, expect } from 'vitest';
import { useGame, LAYOUT, servicePlace, dirtyTables, parkSpot } from '../src/game/store';
import { economyConfig as C } from '../src/config/economy.config';
import type { Npc, Vec3 } from '../src/game/types';

const PARK = parkSpot();
const SP = (areasOpen = 1) => servicePlace(areasOpen);
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/** Pad zinciri TEK KAYNAKTAN (economy.config'in kendi sırası) — elle liste tutulmaz. */
const zincireKadar = (son: string): string[] => {
  const i = C.pads.findIndex((p) => p.id === son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return C.pads.slice(0, i + 1).map((p) => p.id);
};

function musteri(id: number, tableIndex: number, timer: number, product: 'tea' | 'tost' = 'tea'): Npc {
  const seat = LAYOUT.tables[tableIndex].seats[0];
  return {
    id, state: 'waitingForTea', pos: [...seat] as Vec3,
    tableIndex, seatIndex: 0, timer, product, color: '#27ae60',
  };
}

describe('üstlenme BAĞLAYICI (D-046 ② — C3)', () => {
  /**
   * REGRESYON: eski kod bu durumda dönerdi. Garson UZAK ve acil masaya yollanır; sonra YAKIN masa
   * daha acil hâle gelir. Bağlayıcı üstlenmede garson yoluna devam etmeli — eski "her karede
   * yeniden seç" davranışında yakın masaya döner ve (mesafe ~0 olduğu için) anında servis ederdi.
   */
  it('yol ortasında daha acil bir masa belirse bile üstlenilen masa BIRAKILMAZ', () => {
    useGame.getState().hardReset();
    const yakin = 0;
    const uzak = 3;
    const yakinKoltuk = LAYOUT.tables[yakin].seats[0];
    const uzakMasa = LAYOUT.tables[uzak].table;
    useGame.setState({
      padsDone: zincireKadar('waiter'),
      waiters: [{ pos: [yakinKoltuk[0], 0.6, yakinKoltuk[2]] as Vec3, tray: 1, trayFood: 0 }],
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [musteri(901, yakin, 17), musteri(902, uzak, 2)],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1);
    // İlk seçim ③ gereği EN ACİL olan uzak masa.
    expect(useGame.getState().waiters[0]?.claim).toBe(uzak);
    const uzaklikBasta = dist(useGame.getState().waiters[0]!.pos, uzakMasa);

    // Şimdi yakın masa DAHA acil olsun (2 → 0,5). Eski kod burada döner ve 901'i servis ederdi.
    useGame.setState({
      npcs: useGame.getState().npcs.map((n) => (n.id === 901 ? { ...n, timer: 0.5 } : n)),
    });
    for (let i = 0; i < 5; i++) useGame.getState().tick(0.1);

    const s = useGame.getState();
    expect(s.waiters[0]?.claim).toBe(uzak); // üstlenme korundu
    expect(s.npcs.find((n) => n.id === 901)?.state).toBe('waitingForTea'); // yakın masa servis EDİLMEDİ
    expect(dist(s.waiters[0]!.pos, uzakMasa)).toBeLessThan(uzaklikBasta); // uzak masaya yaklaştı
  });

  it('üstlenilen müşteri kalkarsa üstlenme DÜŞER ve garson yeniden seçer', () => {
    useGame.getState().hardReset();
    const yakin = 0;
    const uzak = 3;
    const yakinKoltuk = LAYOUT.tables[yakin].seats[0];
    useGame.setState({
      padsDone: zincireKadar('waiter'),
      waiters: [{ pos: [yakinKoltuk[0], 0.6, yakinKoltuk[2]] as Vec3, tray: 1, trayFood: 0 }],
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [musteri(901, yakin, 17), musteri(902, uzak, 2)],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().waiters[0]?.claim).toBe(uzak);

    // Uzak müşteri sabrı bitip gitti (listeden çıkar).
    useGame.setState({ npcs: useGame.getState().npcs.filter((n) => n.id !== 902) });
    useGame.getState().tick(0.1);
    const s = useGame.getState();
    // Tek servis edilebilir masa kaldı: garson ona geçti (ve mesafe ~0 olduğu için servis etti).
    expect(s.npcs.find((n) => n.id === 901)?.state).toBe('drinking');
  });

  it('iki garson AYNI masayı üstlenmez', () => {
    useGame.getState().hardReset();
    const home = SP().waiterHome;
    useGame.setState({
      padsDone: zincireKadar('waiter2'),
      waiters: [
        { pos: [home[0], 0.6, home[2]] as Vec3, tray: 1, trayFood: 0 },
        { pos: [home[0], 0.6, home[2] + 0.7] as Vec3, tray: 1, trayFood: 0 },
      ],
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [musteri(901, 0, 5), musteri(902, 1, 6), musteri(903, 2, 7)],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1);
    const w = useGame.getState().waiters;
    expect(w.length).toBe(2);
    expect(w[0]?.claim).not.toBeUndefined();
    expect(w[1]?.claim).not.toBeUndefined();
    expect(w[0]?.claim).not.toBe(w[1]?.claim);
  });

  /**
   * REGRESYON (ikinci yarı): üstlenmenin bağlayıcı olması, ancak SIRA GÖZETMEZSE işe yarar.
   * Önceki karenin üstlenmeleri, bu karenin YENİ seçimlerinden ÖNCE yer tutmazsa 1. garsonun
   * taze seçimi, 2. garsonun yolun yarısında olduğu masayı kapar ve onu geri döndürür.
   */
  it('bir garsonun taze seçimi, diğerinin YOLDA olduğu masayı çalamaz', () => {
    useGame.getState().hardReset();
    const home = SP().waiterHome;
    const hedef = 2; // 2. garsonun üstlendiği, aynı zamanda EN ACİL masa
    const digeri = 5;
    useGame.setState({
      padsDone: zincireKadar('waiter2'),
      waiters: [
        { pos: [home[0], 0.6, home[2]] as Vec3, tray: 1, trayFood: 0 },
        { pos: [home[0], 0.6, home[2] + 0.7] as Vec3, tray: 1, trayFood: 0, claim: hedef },
      ],
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [musteri(901, hedef, 2), musteri(902, digeri, 12)],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1);
    const w = useGame.getState().waiters;
    // 1. garson EN ACİL masayı seçmek isterdi ama o masa üstlenilmiş → kalanı alır.
    expect(w[1]?.claim).toBe(hedef);
    expect(w[0]?.claim).toBe(digeri);
  });

  it('tepsisi boşalan garson üstlenmez (yüklemeye dönerken claim düşer)', () => {
    useGame.getState().hardReset();
    const koltuk = LAYOUT.tables[0].seats[0];
    useGame.setState({
      padsDone: zincireKadar('waiter'),
      waiters: [{ pos: [koltuk[0], 0.6, koltuk[2]] as Vec3, tray: 1, trayFood: 0 }],
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [musteri(901, 0, 10)],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1); // mesafe ~0 → teslim eder, tepsi boşalır
    expect(useGame.getState().npcs.find((n) => n.id === 901)?.state).toBe('drinking');
    useGame.getState().tick(0.1);
    expect(useGame.getState().waiters[0]?.claim).toBeUndefined();
  });
});

describe('üstlenme sözleşmesi GERÇEK AKIŞTA her karede tutuyor', () => {
  /**
   * Sözleşme: bir garsonun üstlenmesi A'dan başka bir masaya kaydıysa, ya A'ya TESLİMAT yapılmıştır
   * ya da A artık servis edilemez hâldedir (bekleyen kalmadı · masa kirlendi · tepside o ürün yok).
   * Başka hiçbir sebeple bırakılamaz — eski kodun her karede yeniden seçmesi tam olarak bunu ihlal
   * ediyordu. Kirli masa kümesi tick'in KENDİ `dirtyTables`'ıyla okunur (ikinci kaynak yazılmaz).
   */
  it('üstlenme yalnız teslimatla ya da servis edilemez olunca bırakılır (12 masa · 2 garson · 150 sn)', () => {
    useGame.getState().hardReset();
    // `tools/olcum-kuyruk.ts`'in G3 senaryosunun aynısı: 12 masa · 2 garson · tezgâh L5 · masa L2.
    // SEVİYELER ŞART — L0 ocakla demleme kilitlenir, kuyruk hiç doymaz ve test boş kalır.
    useGame.setState({
      padsDone: zincireKadar('waiter2'),
      stationLevels: useGame.getState().stationLevels.map((_, i) => (i === 0 ? 5 : 0)),
      tableLevels: LAYOUT.tables.map(() => 2),
      waiterUpgrades: { tray: 1, speed: 1, dishCarry: 1, dishSpeed: 1 },
      cleanCups: 60,
      player: PARK,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    // Oyuncu park hâlinde; taşımayı YALNIZ garson yapar (kısmi assist ölçümüyle aynı kurulum).
    const ihlaller: string[] = [];
    let kaymaSayisi = 0;
    for (let k = 0; k < 1500; k++) {
      const once = useGame.getState();
      const onceClaim = once.waiters.map((w) => w.claim);
      const onceBekleyen = new Set(once.npcs.filter((n) => n.state === 'waitingForTea').map((n) => n.id));
      once.tick(0.1);
      const sonra = useGame.getState();
      const kirli = dirtyTables(sonra.dishes, sonra.tableLevels);
      for (let i = 0; i < sonra.waiters.length; i++) {
        const eski = onceClaim[i];
        const yeni = sonra.waiters[i].claim;
        if (eski == null || yeni === eski) continue;
        kaymaSayisi += 1;
        const teslimEdildi = sonra.npcs.some(
          (n) => n.tableIndex === eski && n.state === 'drinking' && onceBekleyen.has(n.id),
        );
        const w = sonra.waiters[i];
        const halaServisEdilebilir = sonra.npcs.some(
          (n) =>
            n.tableIndex === eski &&
            n.state === 'waitingForTea' &&
            !kirli.has(eski) &&
            (n.product === 'tost' ? w.trayFood > 0 : w.tray > 0),
        );
        if (!teslimEdildi && halaServisEdilebilir) {
          ihlaller.push(`kare ${k}: garson ${i} masa ${eski} → ${yeni} (teslimat yok, masa hâlâ bekliyor)`);
        }
      }
    }
    // Testin gerçekten iş gördüğünü kanıtla: üstlenme akış boyunca ONLARCA kez el değiştiriyor.
    expect(kaymaSayisi).toBeGreaterThan(25);
    expect(ihlaller.slice(0, 5)).toEqual([]);
  }, 30_000);
});
