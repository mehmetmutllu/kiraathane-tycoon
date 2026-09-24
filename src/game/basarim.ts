/**
 * basarim.ts — PLAY GAMES BAŞARIMLARI (F4b · D-153). Saf: kayıttan hangi başarımların açık
 * olduğunu türetir. Başarımın kendi sayacı ya da kayıt alanı YOK — `goalMetricsOf` deseni: her
 * yoklamada durumdan hesaplanır. Böylece bulut kaydından gelen oyuncu, çevrimdışıyken kazandığı
 * başarımlar ve girişten ÖNCE kazanılanlar ayrı bir defter tutulmadan bir sonraki yoklamada gider.
 */
import { economyConfig as C, levelProgress } from '../config/economy.config';
import { playGamesConfig, type BasarimOlcu } from '../config/playGames.config';
import { totalTiers } from './goals';
import { activeQuestIndex } from './questProgress';
import type { SaveData } from './save';
import { deriveWorld } from './world';

export type BasarimKaydi = Pick<
  SaveData,
  'stats' | 'padsDone' | 'lifetime' | 'tableLevels' | 'mastersOwned' | 'goalsClaimed' | 'questsDone' | 'xp'
>;

export function basarimOlculeri(s: BasarimKaydi): Record<BasarimOlcu, number> {
  const masa = deriveWorld(s.padsDone).tables.length;
  return {
    servis: s.stats.teasServed + s.stats.waiterServed,
    pad: s.padsDone.length,
    kazanc: Math.max(0, Math.floor(Number(s.lifetime) || 0)),
    bulasik: s.stats.dishesWashed,
    garson: s.stats.waiterServed,
    sonSeviyeMasa: s.tableLevels.slice(0, masa).filter((l) => l >= C.tables.upgrade.maxLevel).length,
    usta: s.mastersOwned.length,
    hedef: s.goalsClaimed.length >= totalTiers() ? 1 : 0,
    gorevHatti: activeQuestIndex(C.quests, s.questsDone) >= C.quests.length ? 1 : 0,
    seviye: levelProgress(s.xp).level,
  };
}

/** Koşulu sağlanmış başarımların anahtarları (config sırasıyla). */
export function acikBasarimlar(s: BasarimKaydi): string[] {
  const o = basarimOlculeri(s);
  return playGamesConfig.basarimlar.filter((b) => o[b.olcu] >= b.esik).map((b) => b.anahtar);
}
