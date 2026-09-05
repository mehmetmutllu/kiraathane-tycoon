/**
 * DEV SANDBOX durumu — yalnız geliştirmede kullanılır (kullanıcı isteği 2026-09-06:
 * "her şeyin seviyesini ayarlamam için ayar koy"). Oyun mantığına GİRMEZ: burada
 * tutulan tek şey sunum/hile anahtarları. `import.meta.env.DEV` false olduğunda
 * panel hiç import edilmez → üretim paketinde ölü kod.
 */
import { create } from 'zustand';

interface SandboxState {
  /** Panel açık mı. */
  open: boolean;
  /** Simülasyon hız çarpanı (tick dt × bu). 1 = normal. */
  timeScale: number;
  /** Açıkken cüzdan sürekli tepeye çekilir (yükseltmeler bedava denenebilsin). */
  infiniteMoney: boolean;
  /** Panel görünürken oyun HUD'ını gizle (temiz ekran görüntüsü için). */
  hideHud: boolean;
  set: (patch: Partial<SandboxState>) => void;
}

export const useSandbox = create<SandboxState>((set) => ({
  open: false,
  timeScale: 1,
  infiniteMoney: false,
  hideHud: false,
  set: (patch) => set(patch),
}));

/** Simülasyon hız çarpanı — Scene'deki tick sürücüsü okur (DEV dışında hep 1). */
export function devTimeScale(): number {
  return useSandbox.getState().timeScale;
}
