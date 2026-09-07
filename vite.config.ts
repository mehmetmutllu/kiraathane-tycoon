// `defineConfig` VITEST'ten alınır: `vite`inki `test` alanını tanımıyor (TS2769).
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Gradle, APK derlerken android/ altını yeniden yazar; vite watcher'ı bu sırada scandir
      // hatasıyla ÇÖKÜYORDU (gece 2026-06-10: npm run apk → dev sunucu öldü). Native klasörler
      // web dev'in parçası değil — izleme dışı.
      ignored: ['**/android/**', '**/dist/**', '**/.claude/worktrees/**'],
    },
  },
  test: {
    // `.claude/worktrees/` altında EnterWorktree ile açılan çalışma kopyaları duruyor; onların
    // `tests/` klasörü de bulunuyordu ve `npm run test` her şeyi İKİ KEZ çalıştırıyordu
    // (2026-09-07: 277 yerine 556 test). Worktree kendi kökünde test çalıştırır, buradan değil.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'],
  },
})
