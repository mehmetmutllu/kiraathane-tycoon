# Sprint A ③ — Kayıt + bulut ara notu

## Ne değişti
- `kalicilik.ts`: Preferences ana depo (native), önbellek + localStorage hızlı kopya. Tarayıcı/test = düz localStorage.
  Hazırlıkta `kiraathane.save*` + `kiraathane.rcKimlik` localStorage'dan taşınır; OS'un sildiği kopya geri yazılır.
  İki depo ayrışırsa ikisi de durur (`kaliciYerelOku`), `save.ts` zarf sayacıyla tazeyi seçer.
- `main.tsx`: render `kalicilikHazirla()` bitince (hata olsa da). `i18n/baslat` import anında `loadSave` okur →
  dil ayarı yalnız OS'un localStorage'ı sildiği ilk açılışta 'oto'ya düşer (sonraki açılışta düzelir).
- `save.ts`: zarf `{...kayıt, zarf:{v,n,sum}}` — gövde BİLEREK üst düzeyde (duman + 6 test dosyası
  `JSON.parse(kayıt).settings` okuyor). Sağlama FNV-1a 32. Yedek `…save.yedek.0..2` (≥5 dk, yalnız sağlam
  anadan), karantina `…save.bozuk` = `{an, ana, yedekler}`. `kayitDogrula` `kayitCoz` içinde.
  `SaveData.sifirlamaNo` (additive, sürüm artmadı); `clearSave` artırır, `defaultSave` taşır → `kayitVerisi` dokunulmadan yazar.
- `bulut.ts`: kayıt kanalı `BulutArkaUcu` (Play: `playGamesKayitUcu`, iOS: `icloudArkaUcu`, test: `sahteBulut`).
  Kural `sifirlamaNo > lifetime > xp > lastSaved`. Bulut metni de zarflı. Zamanlayıcılar gizliyken durur.
- iOS: `eklentiler/bulut-kayit` (Swift, SPM, `BulutKayit`), `App.entitlements`, pbxproj (entitlements + PrivacyInfo), codemagic iki denetim.
- Android: `@xml/yedek_kurallari` + `@xml/yedek_eski` (ALT ÇİZGİ: Android kaynak adında `-` derlemeyi kırar).
  Kapsam: `shared_prefs/CapacitorStorage.xml` (Preferences dosya adı — eklenti kaynağında doğrulandı) + WebView Local Storage.

## Başka dosyada yapılan (gerekçeli) test düzeltmeleri
- `tests/play-games-f4b.test.ts`: sıfırlamadan sonra olağan yazım artık `true` (sifirlamaNo önce gelir).
- `tests/ios-platform.test.ts`: iOS'ta yalnız iCloud `varMi` çağrılır (Play Games çağrısı yine yok).

## Oyuncu notu metinleri (taslak, `kayitSorunu()`)
| durum | TR | EN |
|---|---|---|
| yedekten | Kaydın bozulmuştu; birkaç dakika önceki yedekten devam ediyorsun. | Your save was damaged, so we restored a backup from a few minutes ago. |
| onarildi | Kaydında bozuk bir değer vardı; düzelttik, ilerlemen korundu. | Part of your save was damaged. We fixed it and kept your progress. |
| sifirdan | Kaydın okunamadı, oyun baştan başladı. Eski kayıt cihazda saklı; destekle iletişime geçebilirsin. | We couldn't read your save, so the game started fresh. Your old save is kept on this device; contact support for help. |
