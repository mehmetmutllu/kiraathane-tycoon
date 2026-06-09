import { createRoot } from 'react-dom/client';
// Oyun fontları YEREL bundle (D-018 dersi: CDN yok — offline APK'da da çalışır).
// Baloo 2 = metin (TR latin-ext), Lilita One = iri rakamlar/sayılar.
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-600.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/lilita-one/latin-ext-400.css';
import './index.css';
import App from './App.tsx';

// StrictMode bilerek kapalı: çift mount, useFrame tick'ini ikiye katlayıp
// simülasyonu hızlandırırdı (R3F oyunlarında yaygın tercih).
createRoot(document.getElementById('root')!).render(<App />);
