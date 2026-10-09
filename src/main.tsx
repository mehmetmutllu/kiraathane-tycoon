import './i18n/baslat';
import { createRoot } from 'react-dom/client';
// Oyun fontları YEREL bundle (D-018 dersi: CDN yok — offline APK'da da çalışır).
// Baloo 2 = metin (TR latin-ext), Luckiest Guy = iri rakamlar/başlıklar (Türkçe harfler tam; Lilita One'da İ/ğ/ş yoktu).
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-600.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import './assets/fonts/luckiest-guy.css';
import './index.css';
import App from './App.tsx';
import { kalicilikHazirla } from './game/kalicilik';

// Sprint A: kayıt deposu (Preferences) önbelleğe okunmadan oyun kaydı okunmaz — `init` render'dan
// sonra çalışır ve kaydı SENKRON ister. Depo hata verirse de oyun açılır (localStorage ile).
// StrictMode bilerek kapalı: çift mount, useFrame tick'ini ikiye katlayıp
// simülasyonu hızlandırırdı (R3F oyunlarında yaygın tercih).
const kok = createRoot(document.getElementById('root')!);
void kalicilikHazirla()
  .catch(() => {})
  .finally(() => kok.render(<App />));
