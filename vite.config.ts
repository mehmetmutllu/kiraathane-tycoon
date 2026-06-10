import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Gradle, APK derlerken android/ altını yeniden yazar; vite watcher'ı bu sırada scandir
      // hatasıyla ÇÖKÜYORDU (gece 2026-06-10: npm run apk → dev sunucu öldü). Native klasörler
      // web dev'in parçası değil — izleme dışı.
      ignored: ['**/android/**', '**/dist/**'],
    },
  },
})
