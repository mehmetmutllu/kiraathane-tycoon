# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-28, 2. oturum — YAYIN SPRİNTİ: iOS önce · D-158)

Gece yarım kalan 4 ajan dalı **main'e birleşti** (iOS · E5 · açık kalemler · tarama), worktree'ler temizlendi.
- **Bundle bölme bitti:** ilk paket three'siz — index 363 kB + palette 34 kB (eskiden tek parça 1.633 kB).
  Bekçi `tests/ilk-paket-three.test.ts` (main.tsx statik import ağacı) + 2 mutasyon.
- **Tarama yüksekleri:** Y-16/Y-17 (ödül ekranından sonra geçişli), Y-23 (göç pad kilidi), Y-25 (bulutta 💎 kaybı),
  Y-34 yazım, Paketler "Google hesabında" → iOS'ta "Apple hesabında". Durum tablosu raporun başında.
- Test 1737 · duman 71/71 · lint temiz · build ✅.
- **Worktree tuzağı (yeni):** `git worktree remove --force` node_modules JUNCTION'ının içine girip ana
  `node_modules`'u sildi → `npm ci` ile onarıldı. Önce `cmd /c rmdir <wt>\node_modules` (yalnız bağı söker), sonra sil.
- Duman erken akışında 1 kez kararsız düşüş görüldü (q_coin → table2 zinciri; tekrarında 71/71).

## ⏭️ SIRADAKİ ADIM
1. Tarama raporunun kalan orta/düşük bulguları (G1…G11 grupları) + taranmamış fazlar:
   `TARAMA_FAZ=kayit,ui,perf node tools/tarama-yayin.mjs`.
2. Y-06: Ayarlar'a gizlilik politikası bağlantısı + UMP "reklam tercihleri" girişi — gizlilik sayfası yayınlanınca.
3. Codemagic iş akışı (wordmaster `codemagic.yaml` kalıbı) + ASC API ile IAP ürünleri/metinler — **kullanıcı onayıyla** (dış servis).
4. Gizlilik/destek sayfası (GitHub Pages, IAP içerdiği için ayrı metin) — **yayınlamadan önce onay**.

## KULLANICIYA SORULACAKLAR (yanıt bekliyor)
- 💎 vitrin fiyatı K0/K1/K2/K3 (öneri K2) → onayla varyant kapısı commit #2.
- IAP fiyatları: 25💎 34,99₺ · 60💎 64,99₺ · 150💎 129,99₺ · Başlangıç 64,99₺ · Reklamsız 129,99₺ (USD 0,99/1,99/3,99/1,99/3,99).
- İlk sürüm yalnız iPhone mu (öneri evet) · İngilizce arayüz mü, "şimdilik Türkçe" notu mu.
- **Uygulama simgesi yok** — 1024×1024: kullanıcıda var mı, biz mi üretelim?
- E5: kamera müşteriye kaysın mı · satır üst şeritte kalsın mı · iz beyaz mı amber mi.
- iOS: dev'de plist'te gerçek App ID + test birimleri kalsın mı · durum çubuğu görünür mü.
- Codemagic + ASC API işlemleri ve GitHub Pages yayını için onay.

## KULLANICININ YAPACAĞI (tek kalan el işi)
- ASC → Users and Access → Integrations → **In-App Purchase** anahtarı (.p8) → RevenueCat'te iOS uygulaması
  (bundle `com.mutlubadem.teahouse`) + .p8 + Key ID + Issuer ID → `appl_…` anahtarını ver → `iap.config.ts` `revenueCatAnahtar.ios`.

## AÇIK KALEMLER (öncekiler)
- AdMob: iOS için UMP (GDPR) + IDFA açıklama mesajı yayımlanmalı; `app-ads.txt` pazarlama alanında.
- Play Games / Play Console: DONDURULDU (D-158). YouTube Playables yayından sonra.
- `logic.test.ts` kararsız testi yeniden üretilemedi.

---
**Karar paketleri ve kare arşivi:** `memory-bank/karar-paketleri.md`
## TUR KARTI ŞABLONU
```
SORU / ÖLÇÜLECEK KOLLAR / SAYILAR / KARAR / UYGULAMA / BEKÇİ
```
**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
