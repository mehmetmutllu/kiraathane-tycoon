# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-28 — YAYIN SPRİNTİ: iOS önce · D-158)

Orkestratör + 6 paralel ajan (worktree). Kullanıcı gece PC'yi kapattı; ajanlar WIP commit'leyip durdu.
**Dallar origin'e push'landı** (diğer makinede `git fetch` ile gelir). Ana dala birleşen: 💎 ölçüm (commit #1) + mağaza taslağı.

| Dal (worktree-agent-…) | İş | Durum |
|---|---|---|
| `aff4ff65cadd3400c` | iOS platformu (`ios/`, plist, ATT/UMP sırası, platform.ts, ios:sync) | WIP de7b860 · vitest 1695 · build ✅ · duman 66/67 (worktree font 403) |
| `aefd746525239279b` | E5 onboarding (5 adım, Atla, `ogreticiAtlandi`) | WIP e20fdb2 · vitest 1698 · duman 70/70 · build koşulmadı |
| `a3f497b96e0f6164b` | açık kalemler: pano ✅ · bildirim konumu ✅ · offline sayaç ✅ · bundle bölme WIP | 9903f3b WIP: `yukleme-dongusu.test.ts` kırmızı beklenir |
| `a112be0549e49cfbc` | yayın öncesi tam tarama (bulgu raporu) | bkz. dal son commit'i |
| (birleşti) | 💎 fiyat ölçümü `docs/elmas-fiyat-raporu-f4c5.md` | karar bekliyor (K2 önerildi) |
| (birleşti) | App Store içerik taslağı — artifact KfNEdtK71YzUupBjrvyxEj | ✅ |

**Worktree tuzağı:** `node_modules` junction'ı Vite fs izninin dışında → font 403 → duman "konsol hatası". Birleştirip
**ana depoda** doğrula (build + test + `DUMAN_PORT=4000 npm run duman`).

## ⏭️ SIRADAKİ ADIM (yeni oturum)
1. Dalları sırayla main'e birleştir: iOS → E5 → açık kalemler (bundle WIP'i bitir: bekçi + 2 mutasyon) → tarama raporu.
   Çakışma beklenen: `HUD.tsx`, `hud.css`, `tools/smoke.mjs`. Her birleşmeden sonra test; sonunda build + duman.
2. Tarama bulgularını ikinci dalgada dağıt + şu iki red riski: Paketler'deki "Google hesabında saklanır" → iOS'ta Apple;
   Ayarlar'a gizlilik politikası bağlantısı.
3. Codemagic: wordmaster `codemagic.yaml` kalıbıyla kiraathane iş akışı (ASC entegrasyonu `appstore`), Codemagic API ile
   uygulamayı ekle; ASC API ile 5 IAP ürünü + metinler + gizlilik/yaş cevapları (taslaktan). Anahtarlar: `C:\dev-ortam\gizli\wordmaster`.
4. Gizlilik/destek: kelime-ezberle-yasal GitHub Pages kalıbı; bu oyun IAP (RevenueCat) içerdiği için AYRI sayfa yazılmalı.

## KULLANICIYA SORULACAKLAR (yanıt bekliyor)
- 💎 vitrin fiyatı K0/K1/K2/K3 (öneri K2) → onayla varyant kapısı commit #2.
- IAP fiyatları: 25💎 34,99₺ · 60💎 64,99₺ · 150💎 129,99₺ · Başlangıç 64,99₺ · Reklamsız 129,99₺ (USD 0,99/1,99/3,99/1,99/3,99).
- İlk sürüm yalnız iPhone mu (öneri evet) · İngilizce arayüz mü, "şimdilik Türkçe" notu mu.
- **Uygulama simgesi yok** (Capacitor varsayılanı) — 1024×1024 simge: kullanıcıda var mı, biz mi üretelim?
- E5 ajanının 4 küçük sorusu: kamera müşteriye kaysın mı · satır üst şeritte kalsın mı · iz beyaz mı amber mi.
- iOS: dev'de plist'te gerçek App ID + test birimleri kalsın mı · durum çubuğu görünür mü.

## KULLANICININ YAPACAĞI (tek kalan el işi)
- ASC → Users and Access → Integrations → **In-App Purchase** anahtarı (.p8) oluştur → RevenueCat'te iOS uygulaması
  (bundle `com.mutlubadem.teahouse`) + .p8 + Key ID + Issuer ID → `appl_…` anahtarını ver → `iap.config.ts` `revenueCatAnahtar.ios`.
- (Sözleşmeler/banka/vergi TAMAM — kullanıcı 2026-09-28.)

## AÇIK KALEMLER (öncekiler)
- AdMob: iOS için UMP (GDPR) + IDFA açıklama mesajı yayımlanmalı; `app-ads.txt` pazarlama alanında.
- Play Games / Play Console: DONDURULDU (D-158). YouTube Playables yayından sonra.
- `logic.test.ts` kararsız testi yeniden üretilemedi (kök neden bilinmiyor). Sim "serbest oyun" bloğu ölü DEĞİL (`olcum-gec-oyun.ts` kullanıyor).

---
**Karar paketleri ve kare arşivi:** `memory-bank/karar-paketleri.md`
## TUR KARTI ŞABLONU
```
SORU / ÖLÇÜLECEK KOLLAR / SAYILAR / KARAR / UYGULAMA / BEKÇİ
```
**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
