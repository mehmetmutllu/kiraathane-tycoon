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
| `maket-v5-mutfak.html` | ✅ **Yayında olan sürüm** | v4 + **mutfak odası**. Sol duvardaki 22 birimlik mutfak şeridi kaldırıldı, yerine 6,5 × 8,6 **dört duvarlı mutfak odası** kuruldu; boşalan sol bant A adasına verildi (ada 9,8 → 12,8, 3×2 ünite). Sekmelerde **iki varyant**: A kapalı oda, B yarı açık (lambri + cam). Mutfağın içi ikisinde birebir aynı. |
| `maket-v4-duzen.html` | 📌 Referans (v5'in çıkış noktası) | v2 + **ada disiplini** düzen revizyonu (şu an yalnız **Kat 1**; Kat 2-3 hâlâ v2 yerleşimi). Her oturma bölgesi tek dikdörtgen ada: zemin yaması + kilim + mobilya aynı merkezde, kilim grubun altında, yama kilimden ~0,9 taşar. Orta aks yolluğu, mutfak şeridi eşit 4,5 ritim, Ocakbaşı gerçek U, bekleme köşeleri. |
| `maket-v2-ONAYLI.html` | 📌 Referans (dokunulmadı) | Genişletilmiş yerleşim, dış çevre (cadde+komşu binalar), alt kat kütleleri, WC, terasa dönüşlü merdiven. v4'ün çıkış noktası; olduğu gibi saklanıyor. |
| `maket-v3-REDDEDILDI.html` | ❌ Reddedildi | Kat 1 ızgara yeniden dizilimi (L mutfak, Ana Salon/Cam Kenarı/Sedir Köşesi), 3.6 duvar. Kullanıcı: "çok kötü oldu". **Geri dönülecek: v2.** |
| `plan-v2.html` | Referans | Geliştirme planı (teşhis, servis modelleri, oyun akışı, arayüz, faz planı, performans bütçesi, kararlar, asset listesi). |
| `ss/kat1-v2.png` `ss/kat2-v2.png` `ss/kat3-v2.png` | Referans | v2'nin ekran görüntüleri. |
| `ss/kat1-v4.png` | Referans | v4 Kat 1 (ada disiplini). |
| `ss/kat1-v5A.png` `ss/kat1-v5B.png` | Referans | v5 Kat 1, iki varyantın tam kat görünümü. |
| `ss/mutfak-A.png` `ss/mutfak-B.png` | Referans | v5 mutfak odası yakın plan (kapalı / yarı açık). |

## Yayınlanmış Artifact linkleri

- **Plan:** https://claude.ai/code/artifact/c45e15a9-9dd1-4bd1-ae00-cd1d35ed0aa8
- **Maket:** https://claude.ai/code/artifact/d8bbf576-e755-46b7-9608-3ebd0ab57245
  (2026-09-04: v2 → v4 düzen revizyonu → **v5 mutfak odası (A/B varyant)** — link hep aynı)

## Düzen kuralları (v4, Kat 1'de uygulandı; Kat 2-3 bekliyor)

1. Her oturma bölgesi **tek dikdörtgen ada**: zemin yaması, kilim ve mobilya aynı merkezde; kilim grubun altını kaplar, yama kilimden ~0,9 taşıp görünür pervaz bırakır.
2. Ada içi üniteler **eşit aralıkta**, her ünite (masa + oturanlar + para istifi) tek grup olarak **±3,5° serbest** sapar — hizalı ama CAD gibi ölü değil.
3. **Bölge başına tek tip mobilya YASAK** (v3'ün hatası): çeşitlilik korunur, yalnız hizalama disipline edilir.
4. Para istifi hep ünitenin **+x/+z köşesinde**.
5. Duvar öğeleri (tezgâh, raf, tablo, aplik) **kendi duvarı içinde eşit aralıklı**.
6. Orta koridor bir **aks**: açık tonlu yolluk + iki yanda simetrik lamba/saksı ritmi; ölü boşluk bırakılmaz.

## Mutfak odası kuralları (v5)

Kullanıcı geri bildirimi: *"mutfak şeridi bi mutfakmış gibi izlenim uyandırmıyo; mutfak dediğin 4 köşe bir yer olur."*

1. Mutfak bir **hacim**dir, duvar kenarı değil: 6,5 × 8,6 oda, x∈[-16,9, -10,4] × z∈[-7,6, 1,0].
2. Kamera -x/+z köşesinden baktığı için **doğu ve güney duvarları arka plandır** — beyaz fayans, davlumbaz
   ve raflar yalnız orada okunur, bu yüzden o iki duvar iki varyantta da tam yüksekliktedir.
3. Mutfağı mutfak yapan sinyaller: gri seramik karo zemin + gider · tezgâh üstü beyaz fayans ·
   kesintisiz tezgâh · çelik davlumbaz + tavana giren baca · asılı tencere rayı · serbest hazırlık
   tezgâhı · boy dolabı/kasa/damacana deposu · asma tavan çerçevesi + **soğuk beyaz** aydınlatma
   (salonun sıcak ışığından ayrışır).
4. Salonla tek bağ **sipariş çıkış penceresi** (çelik tezgâh, adisyon askısı, ısı lambası, hazır tepsiler)
   + ayrı personel kapısı. Garson mutfağa girmez. (Karar 3: tek çıkış penceresi.)
5. Kapalı varyantta salona bakan duvar **menü tahtasını** taşır — mutfak, salondan bakınca da kendini anlatır.
6. **Açık uç:** mutfak solda kaldığı için B (Cam Kenarı) ve D (Vitrin) adaları çıkış penceresine ~19-23 birim
   uzakta; karar 5'teki "≤10 birim" kısıtı bu yerleşimde sağlanmıyor. Gerçek oyunda ya ikinci servis noktası
   ya da mutfağın merkeze kaydırılması gerekecek.
