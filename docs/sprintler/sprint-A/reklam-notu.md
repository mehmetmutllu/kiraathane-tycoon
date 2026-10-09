# Sprint A ② Reklam + kabuk — ara not

- Rıza sırası: `requestConsentInfo` → (REQUIRED) form → iOS görünürlük ≤ 3 sn + ATT ayrı try → `canRequestAds` ise `initialize` → yükle. Bilgi yok / izin yok → `kur` hata atar, `bekleyen` tutulur; `reklamYenidenKur()` ön plana dönüşte (App.tsx) tek uçuşta yeniden dener.
- `kapanisiBekle` hata atmaz: dinleyiciler await ile kaydedilir, Showed 10 sn'de gelmezse `gosterilemedi`, 180 sn'de `zamanAsimi`; finally'de zamanlayıcı + remove. `reklamAcik` her yolda finally'de iner ve `bildir()` edilir.
- Ödüllü: `odulluIzleSonuc(): OdulluSonuc`; `odulluIzle(): boolean` geriye uyumlu sarmalayıcı (HUD 3 çağrı yeri).
- Yükleme hatası: tür başına 15·2^n sn, tavan 300 sn (`adsConfig.yeniden`).
- App.tsx: `arkaPlanda()` / `onPlanda()` tek giriş; kayıt reklam açıkken de yazılır (çevrimdışı saat başlatılmaz). Ses: `sesDuraklat('gizli'|'reklam')` (audioWeb) → `ctx.suspend()`; musicWeb değişmedi (döngü bağlamla birlikte durur).
- `HataSiniri` + `SahneKurtarici` (webglcontextlost preventDefault, restored'da Scene yeniden kurulur).
- Mutasyon: 5/5 yakalandı (ATT rızaya bağlı · üst sınır yok · yeniden deneme yok · canRequestAds yok · suspend yok).
