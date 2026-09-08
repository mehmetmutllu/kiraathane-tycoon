/**
 * bardak.test.ts — BARDAK DÖNGÜSÜ BEKÇİSİ (Faz C4; D-082 → D-083).
 *
 * C4'te ÖLÇÜLDÜ (`docs/bardak-raporu-c4.md`): bardak KAPALI bir sistemdir ve temiz bardağın tek
 * kaynağı yıkamadır. Bulaşıkçı zincirde 8. pad olduğu için ondan önce yıkayan tek kişi oyuncudur;
 * oyuncu elini çektiğinde 4 masalı mekân 15 dakikada 12 müşteri (= tam havuz kadar) ağırlayıp
 * **dakika 3'te kalıcı olarak duruyordu** — üç ayrı tohumda birebir aynı, yani zarın değil yapının
 * sonucu. Havuzu büyütmek çözmüyordu (fazladan bardak temiz durur, masalar yine kirli kalır),
 * servise ORANTILI çareler de çözmüyordu (servis durunca çare de durur).
 *
 * Çözüm (D-083, kullanıcı kararı): **servis edecek kimsesi kalmayan garson bulaşık toplar.**
 *
 * Bu bekçi bir EŞİK LİSTESİ değil, bir DAVRANIŞ SÖZLEŞMESİ — üç madde:
 *   ① DAR TETİK: garson ancak TEMİZ BARDAK BİTTİĞİNDE bulaşığa gider. Temiz bardak varken —
 *      servis edecek kimsesi olsun olmasın — kirliye dokunmaz; bulaşık işi OYUNCUNUNDUR
 *      (kısmi assist, D-014: garson oyuncunun yerini almaz). Geniş tetik ölçüldü ve REDDEDİLDİ:
 *      AFK debisi 7,27 servis/dk'ya çıkıyordu, dikkatli oyuncunun %90'ı.
 *   ② BOŞTAKİ GARSON ZİNCİRİ KAPATIR: bekleyen kalmayınca kirliyi toplar, leğende yıkar.
 *   ③ MEKÂN AFK'DA KALICI OLARAK DURMAZ — ve bu, aynı testin içinde kuralı KAPATARAK kanıtlanır
 *      (kural kapalıyken aynı koşu gerçekten duruyor; yani test kuralın kendisini yakalıyor).
 * Ayrıca KORUNUM: bardak yoktan var olmaz, yok olmaz.
 */
import { describe, it, expect } from 'vitest';
import { useGame, LAYOUT, servicePlace, parkSpot } from '../src/game/store';
import { economyConfig as C } from '../src/config/economy.config';
import type { Dish, Npc, Vec3 } from '../src/game/types';

const PARK = parkSpot();

/** Pad zinciri TEK KAYNAKTAN (economy.config'in kendi sırası) — elle liste tutulmaz. */
const zincireKadar = (son: string): string[] => {
  const i = C.pads.findIndex((p) => p.id === son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return C.pads.slice(0, i + 1).map((p) => p.id);
};

function musteri(id: number, tableIndex: number, timer = 999): Npc {
  const seat = LAYOUT.tables[tableIndex].seats[0];
  return {
    id, state: 'waitingForTea', pos: [...seat] as Vec3,
    tableIndex, seatIndex: 0, timer, product: 'tea', color: '#27ae60',
  };
}

function kirli(tableIndex: number, id: number): Dish {
  const t = LAYOUT.tables[tableIndex].table;
  return { id, pos: [t[0], 0.95, t[2]] as Vec3, tableIndex, kind: 'cup' };
}

/** Bardağın kapalı sistemi: nerede olurlarsa olsunlar toplamları HAVUZ olmalı. */
function bardakToplami(s: ReturnType<typeof useGame.getState>): number {
  return (
    s.cleanCups +
    s.ready.tea + s.ready.tost +
    s.tray + s.trayFood + s.carriedDirty + s.carriedDirtyFood +
    s.waiters.reduce((a, w) => a + w.tray + w.trayFood + (w.dirtyCarry ?? 0) + (w.dirtyCarryFood ?? 0), 0) +
    (s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0) +
    s.npcs.filter((n) => n.state === 'drinking').length +
    s.dishes.length
  );
}

describe('boşta bulaşık (D-083)', () => {
  it('① temiz bardak VARKEN garson kirliye dokunmaz (bulaşık oyuncunun işi)', () => {
    useGame.getState().hardReset();
    // Garson tepsisinde çay + TEMİZ masada bekleyen müşteri + başka masada kirli yığını.
    // Havuzda temiz bardak VAR: zincir kilitli değil, yani garsonun bulaşıkta hiçbir işi yok.
    const bekleyenMasa = 0;
    const kirliMasa = 1;
    const wPos = servicePlace(1).pickup;
    useGame.setState({
      padsDone: zincireKadar('waiter'),
      waiters: [{ pos: [wPos[0], 0.6, wPos[2]] as Vec3, tray: 1, trayFood: 0, dirtyCarry: 0 }],
      npcs: [musteri(900, bekleyenMasa)],
      dishes: [kirli(kirliMasa, 5001), kirli(kirliMasa, 5002)],
      cleanCups: 5,
      player: PARK, inputKeyboard: [0, 0], inputJoystick: [0, 0], spawnTimer: 999,
    });
    let servisEdildi = false;
    for (let k = 0; k < 600; k++) {
      useGame.getState().tick(0.1);
      const s = useGame.getState();
      expect(s.waiters[0]?.dirtyCarry ?? 0).toBe(0); // temiz varken kirli TAŞINMAZ
      expect(s.dishes.length).toBe(2); // kirliye hiç dokunulmadı
      if (s.npcs.find((n) => n.id === 900)?.state === 'drinking') servisEdildi = true;
    }
    expect(servisEdildi).toBe(true); // boş denetim değil: garson servis işini gerçekten yaptı
  });

  it('② temiz bardak BİTİNCE garson kirliyi toplar ve leğende yıkar', () => {
    useGame.getState().hardReset();
    const wPos = servicePlace(1).pickup;
    const temizOnce = 0;
    useGame.setState({
      padsDone: zincireKadar('waiter'),
      waiters: [{ pos: [wPos[0], 0.6, wPos[2]] as Vec3, tray: 0, trayFood: 0, dirtyCarry: 0 }],
      npcs: [],
      dishes: [kirli(0, 6001), kirli(0, 6002)],
      cleanCups: 0, // zincir KİLİTLİ: tetik bu (bkz. ①)
      player: PARK, inputKeyboard: [0, 0], inputJoystick: [0, 0], spawnTimer: 999,
    });
    let elineAldi = false;
    for (let k = 0; k < 900; k++) {
      useGame.getState().tick(0.1);
      if ((useGame.getState().waiters[0]?.dirtyCarry ?? 0) > 0) elineAldi = true;
      if (useGame.getState().cleanCups >= temizOnce + 2) break;
    }
    const s = useGame.getState();
    expect(elineAldi).toBe(true); // toplama gerçekten oldu (doğrudan ışınlanma değil)
    expect(s.dishes.length).toBe(0);
    expect(s.cleanCups).toBe(temizOnce + 2); // ikisi de temiz havuza döndü
    expect(s.waiters[0]?.dirtyCarry ?? 0).toBe(0);
  });

  it('③ oyuncu yokken mekân KALICI olarak durmaz — kural kapatılınca DURUYOR', () => {
    // Ölçümün B2 senaryosu (`tools/olcum-bardak.ts`): 4 masa · ocak L1 · 1 garson · oyuncu park.
    // Kuralın AÇIK ve KAPALI hâli aynı testte koşulur: kapalı hâlin gerçekten durması, bu bekçinin
    // neyi yakaladığının kanıtıdır (C3 dersi: bir bekçinin ötmesi, onu ÖTTÜREN şey doğrulanmadan
    // yakalama sayılmaz).
    const sonPencere = 1200; // son 120 sn'lik kare sayısı (dt 0,1)
    const kosu = (idleDishCarry: number): number => {
      const cfg = C.waiter as { idleDishCarry: number };
      const eski = cfg.idleDishCarry;
      cfg.idleDishCarry = idleDishCarry;
      try {
        useGame.getState().hardReset();
        useGame.setState({
          padsDone: zincireKadar('table4'),
          stationLevels: useGame.getState().stationLevels.map((_, i) => (i === 0 ? 1 : 0)),
          // ONBOARDING KAPISI ŞART: `q_wash` görevinden önce kirli bardak HİÇ doğmaz (bardak
          // doğrudan temiz havuza döner) — o rejimde kilit de yoktur ve test hiçbir şey ölçmez.
          // (İlk yazılışında bu satır yoktu: "kural kapalı" koşusu 17 müşteri servis etti, yani
          // bekçi kuralı değil, kapalı kapıyı ölçüyordu.)
          questIndex: C.quests.length,
          player: PARK, inputKeyboard: [0, 0], inputJoystick: [0, 0],
        });
        // Havuz DURUMDAN okunur, formülden değil: `stationLevels`i elle kurmak (test/araç deseni)
        // ocak yükseltmesinin havuza eklediği bardakları getirmez — o ekleme `stationUpgradeSystem`
        // içinde olur. Korunum zaten "toplam DEĞİŞMEZ" demektir, "formüle eşittir" değil.
        const havuz = bardakToplami(useGame.getState());
        let sonServis = 0;
        const toplamKare = 4800; // 480 sn (kilit dakika 3'te kuruluyor — fazlası ölçüme bir şey katmaz)
        let onceki = new Map<number, string>();
        // KORUNUM her karede denetlenir ama `expect` SICAK DÖNGÜDE ÇAĞRILMAZ: on binlerce
        // assertion vitest'i yavaşlatıp testi zaman aşımına düşürüyordu — yani yeşil/kırmızı
        // sinyali kuralla değil, koşu süresiyle belirleniyordu (C3'te kayda geçen tuzağın aynısı).
        let sapma = 0;
        for (let k = 0; k < toplamKare; k++) {
          useGame.getState().tick(0.1);
          const s = useGame.getState();
          sapma = Math.max(sapma, Math.abs(bardakToplami(s) - havuz));
          if (k >= toplamKare - sonPencere) {
            for (const n of s.npcs) {
              if (n.state === 'drinking' && onceki.get(n.id) === 'waitingForTea') sonServis += 1;
            }
          }
          const yeni = new Map<number, string>();
          for (const n of s.npcs) yeni.set(n.id, n.state);
          onceki = yeni;
        }
        expect(sapma).toBe(0); // bardak yoktan var olmadı, yok olmadı
        return sonServis;
      } finally {
        cfg.idleDishCarry = eski;
      }
    };
    const kapali = kosu(0);
    const acik = kosu(C.waiter.idleDishCarry);
    expect(kapali).toBe(0); // kuralsız mekân gerçekten ÖLÜ (yakalanan kusur bu)
    expect(acik).toBeGreaterThan(0); // kuralla mekân son 2 dakikada hâlâ servis veriyor
  }, 30_000);
});
