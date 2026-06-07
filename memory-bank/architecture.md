# architecture — Stack, Skill/MCP, Asset Pipeline

## Stack (kesin — Unity DEĞİL)
| Katman | Seçim | Sürüm (kurulu) |
|---|---|---|
| Dil | TypeScript | ~6.0 |
| Build | Vite | 8.x |
| UI | React | 19.x |
| 3D | @react-three/fiber | 9.6 |
| 3D yardımcı | @react-three/drei | 10.7 |
| Fizik | @react-three/rapier | (kurulu) |
| Post-proc | @react-three/postprocessing | (kurulu) |
| 3D çekirdek | three | 0.184 |
| State | zustand | 5.x |
| Büyük sayı | break_infinity.js | (kurulu) |
| Test (mantık) | vitest | (kurulu) |
| Test (UI/duman) | Playwright MCP | mcp eklendi |
| Mobil (Faz 7→öne çekildi) | Capacitor | 8.4 (android platformu eklendi, debug APK derlendi) |
| IAP (Faz 5) | @revenuecat/purchases-capacitor | henüz yok |
| Reklam (Faz 5) | Capacitor AdMob eklentisi (doğrulanacak) | henüz yok |

### Neden Unity değil (özet, tam gerekçe decisions.md'de)
Tüm-metin kod tabanı Claude Code akışını (memory-bank, resume, Playwright MCP,
diff-tabanlı inceleme) akıcı tutar. Monetizasyon Capacitor + RevenueCat/AdMob ile
çözülmüş. Web build anında test edilebilir.

## Kurulu Skill / MCP
- **code-index MCP** — kod tabanı sembol/dosya araması (ortamda mevcuttu).
- **Playwright MCP** — `claude mcp add playwright npx @playwright/mcp@latest` ile eklendi;
  Faz 1 UI/duman testleri için. (Bu oturumda eklendi; sonraki oturumda aktif.)
- Bundled skill'ler arasında frontend/React odaklı `frontend:react-patterns`,
  `frontend:design-review` ve test için `e2e` faydalı; gerektiğinde çağrılacak. Bu
  oturumda yeni harici plugin KURULMADI (az ve isabetli tut prensibi; mevcut bundled
  skill'ler yeterli).

## Android APK derleme (Capacitor — Faz 7 öne çekildi, 2026-06-07)
Kullanıcı gerçek cihazda test + arkadaşına gönderme istedi → Capacitor öne çekildi.
- **Kurulum:** `@capacitor/core|cli|android` 8.4; `capacitor.config.ts` (appId `com.kosekiraathanesi.game`,
  webDir `dist`); `npx cap add android` → `android/` native projesi.
- **Bu makinede ÖNEMLİ ortam notları (build için):**
  - **Android SDK alışılmadık yerde: `C:\flutter\bin`** (Flutter ile gelmiş; build-tools 35.0.1 + platforms/android-35).
    `android/local.properties` → `sdk.dir=C:/flutter/bin` (git-ignored, makineye özel).
  - **Sistem PATH java = JDK 23 (AGP 8 için fazla yeni, build kırar).** Android Studio'nun JBR'i (OpenJDK **21**)
    kullanılır: `android/gradle.properties` → `org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr`
    → CLI'da JAVA_HOME ayarlamadan `gradlew assembleDebug` çalışır.
- **Yeniden derleme:** `npm run apk` (= build + `cap sync android` + `gradlew.bat assembleDebug`). Çıktı:
  `android/app/build/outputs/apk/debug/app-debug.apk` (~4.6 MB, debug-imzalı). Web değişince `npm run cap:sync`.
- **Cihaza kurulum:** APK'yı telefona at → "Bilinmeyen kaynaklara izin ver" → kur (debug imza, mağaza değil).

## Asset pipeline kararı
- **Greybox-first:** oyun, hiç model olmadan ilkel şekillerle (box/cylinder/capsule)
  TAM oynanır. Faz 1-5 tamamen greybox.
- **Fallback loader:** `.glb` yoksa otomatik ilkel şekle düşen `<Model>` sarmalayıcı
  (Faz 6'da gerçek modeller takılınca kod değişmez).
- **Format:** `.glb`. Tekrarlı mesh'lerde GPU instancing.
- **Seçilen stil (kilit):** bütçesiz başlangıç için **Quaternius / Kenney (CC0)**
  low-poly. Cila için ileride Synty POLYGON (ücretli) değerlendirilebilir AMA tek
  kaynakta kalınır (karışık sanatçı = bozuk görüntü). Türk'e özgü objeler (semaver,
  ince belli bardak, okey, nargile, bakır demlik) AI üretimi (Meshy/Tripo, low-poly).
- Detay: `docs/assets.md` ve `public/assets/README.md` (manifest + lisans).

## Klasör yapısı
```
memory-bank/      hafıza (bu klasör)
docs/             planlama dokümanları
tools/            simulate.ts (ekonomi simülasyonu)
public/assets/    models/ audio/ + README manifest
src/
  config/         economy.config.ts (TEK sayı kaynağı)
  game/           zustand store, sistemler, kayıt, decimal yardımcı
  components/
    three/        3D sahne, oyuncu, istasyon, NPC, pad, para
    ui/           HUD, joystick
.claude/skills/   kiraathane-devam, oturum-bitir
```

## Test kancaları (dev)
`window.__game` ile oyun durumu (wallet, diamonds, masa/istasyon/NPC sayısı) dışa açılır;
`window.__advanceTime(sn)` simülasyonu hızlı ileri sarar. 3D sahne görsel doğrulanamadığı
için testler bu kancaları + DOM HUD'unu + konsol hatalarını + simüle klavye girişini
kontrol eder.
