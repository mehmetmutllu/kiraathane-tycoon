# Tasarım Maketleri (2026-09-03 oturumu)

Bu klasör, 3 Eylül 2026 tasarım oturumunda üretilen **gezilebilir 3B kat maketlerini** ve
**geliştirme planını** saklar. Hepsi tek dosyalık, bağımsız HTML (three.js r128 CDN'den).
Tarayıcıda doğrudan açılmaz (charset/CORS) — bir HTTP sunucuyla servis et:

```bash
cd docs/maket && python -m http.server 8899
# http://localhost:8899/maket-v2-ONAYLI.html
```

## Dosyalar

| Dosya | Durum | Açıklama |
|---|---|---|
| `maket-v2-ONAYLI.html` | ✅ **Geçerli sürüm** | Genişletilmiş yerleşim, dış çevre (cadde+komşu binalar), alt kat kütleleri, WC, terasa dönüşlü merdiven. Kullanıcı bunu onayladı. |
| `maket-v3-REDDEDILDI.html` | ❌ Reddedildi | Kat 1 ızgara yeniden dizilimi (L mutfak, Ana Salon/Cam Kenarı/Sedir Köşesi), 3.6 duvar. Kullanıcı: "çok kötü oldu". **Geri dönülecek: v2.** |
| `plan-v2.html` | Referans | Geliştirme planı (teşhis, servis modelleri, oyun akışı, arayüz, faz planı, performans bütçesi, kararlar, asset listesi). |
| `ss/kat1-v2.png` `ss/kat2-v2.png` `ss/kat3-v2.png` | Referans | v2'nin ekran görüntüleri. |

## Yayınlanmış Artifact linkleri

- **Plan:** https://claude.ai/code/artifact/c45e15a9-9dd1-4bd1-ae00-cd1d35ed0aa8
- **Maket:** https://claude.ai/code/artifact/d8bbf576-e755-46b7-9608-3ebd0ab57245
  (şu an v3 yayında — **sonraki oturumda v2 içeriğiyle yeniden yayınlanacak**, link aynı kalır)

## Sonraki oturumda İLK İŞ

`maket-v2-ONAYLI.html` içeriğini maket artifact'ine yeniden yayınla (aynı URL). v3'ün
hiçbir parçası taşınmayacak — kullanıcı tümünü reddetti.
