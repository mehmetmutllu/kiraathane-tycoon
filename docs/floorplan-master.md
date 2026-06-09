# Kat Master Planı — Zemin Kat + Üst Kat (D-022 uygulama planı)

> Gece oturumu 2026-06-10 (madde 2/7). Gerçek Türk kıraathanesi tipolojisi araştırmasına dayanır;
> oyunun 4-zone (2×2) D-022 kararına oturtulmuştur. Bu bir PLANLAMA dokümanıdır — koordinatlar
> uygulama sırasında `LAYOUT`'a çevrilirken ekonomi/sim ile birlikte ayarlanır.

## 1) Araştırma özeti — gerçek kıraathane neye benzer

Tipik mahalle kıraathanesinin fiziki bölümleri (kaynaklar §5):

| Bölüm | Gerçekte | Oyundaki karşılığı |
|---|---|---|
| **Çay ocağı (ocakbaşı)** | Mekânın kalbi; tezgâh + semaver/demlikler + bardak rafları. Salona hâkim bir kenarda; ocakçı her masayı görür. | Zone'un ocak istasyonu (per-zone, D-022) |
| **Salon (oturma)** | Kare/yuvarlak masalar + tabure/ahşap sandalye; masa üstü yeşil çuha (oyun) veya muşamba. | Zone masaları 2×2 |
| **Oyun bölümü** | Okey/tavla/kâğıt masaları çoğunlukla AYRI bir bölüm/köşede (gürültü + kalabalık yönetimi). Otomatik okey masası modern kıraathanenin statü sembolü. | ÜST KAT okey/tavla salonu (D-022) |
| **TV köşesi** | Duvara yüksek monte TV; maç günleri odak. Genelde ocaktan görülen ortak duvarda. | Zemin kat TV köşesi (zone 3/4 ile birlikte düşünülecek dekor+buff adayı) |
| **Tuvalet + lavabo** | Arka koridorda, salondan ayrı. Belediye ruhsatında zorunlu. | KATA özel oda (Faz 3c: kâğıt döngüsü + temizlikçi) |
| **Depo** | Çay/şeker/tüp/malzeme; ocağın arkasında küçük oda. | KATA özel oda (Faz 3c: depodan malzeme alma) |
| **Dış oturma (kaldırım/bahçe)** | Kapı önü kaldırım masaları — yaz işletmesinin yarısı. | Sokak tarafı bahçe masaları (madde 4 görsel iş + ileride oynanır alan adayı) |
| **Nargile/teras** | Ayrı teras/bahçe bölümü (yasal olarak açık alan). | Üst kat BALKON (D-022) |
| **Mutfak şeridi (tost vb.)** | Çoğu kıraathanede ocağın yanında küçük tost/sandviç tezgâhı. | Zone 3/4 "tost" konsepti için mutfak-tost şeridi rezervi |

Mekânsal gramer çıkarımı: **ocak hep kenarda/duvarda, masalar ortada, ıslak hacimler (tuvalet/depo)
arka koridorda, oyun ve nargile AYRI bölümde.** Mevcut zone-1 yerleşimimiz (mutfak arka duvarda,
masalar önde 2×2) bu grameri zaten doğru kuruyor.

## 2) ZEMİN KAT planı — 4 zone (2×2) + servis odaları

```
                          ARKA (z-)
 ┌────────────┬──────────────┬──────────────┬───────────┐
 │   DEPO     │   ZONE 3     │   ZONE 4     │ TUVALET + │
 │ (Faz 3c)   │ (tost/mutfak │ (TV köşesi   │  LAVABO   │
 │            │  şeridi      │  salonu      │ (Faz 3c)  │
 │            │  konsepti)   │  konsepti)   │           │
 ├────────────┴──────────────┼──────────────┴───────────┤
 │        ZONE 1             │        ZONE 2            │
 │  ÇAY SALONU (mevcut)      │  ÇAY SALONU 2 (gece m.3) │
 │  ocak+bulaşık arka duvar  │  ocak+bulaşık kendi      │
 │  4 masa 2×2               │  köşesinde, 4 masa 2×2   │
 ├──────────── KAPI ─────────┴──── MERDİVEN (Faz 3b) ───┤
 │   SOKAK: kaldırım + BAHÇE MASALARI (madde 4 görsel)  │
 └──────────────────────────────────────────────────────┘
                          ÖN (z+)
```

- **Zone 1 (mevcut):** çay salonu; bugünkü LAYOUT olduğu gibi zone-1'in içeriği olur.
- **Zone 2 (gece madde 3):** zemin katın ikinci çay salonu, zone-1'in SAĞINDA (x+ yönü).
  Kendi ocak+bulaşık köşesi (D-022 per-zone) — ocak yine kendi arka duvarında, masalar önünde.
- **Zone 3-4 (sonra):** FARKLI konsept (D-022): zone-3 tost/mutfak şeridi, zone-4 TV köşesi salonu.
  Konsept = farklı ürün/fiyat + farklı dekor; mekanik iskelet (ocak→masa→bulaşık) aynı kalır.
- **Tuvalet+lavabo / depo:** kata özel İKİ servis odası, arka köşelerde (Faz 3c'de oynanır olur;
  şimdilik kat planında YER REZERVE — zone-2 yerleşimi bu odaların yerini yemesin).
- **Merdiven:** ön-sağ (zone-2 tarafı), Faz 3b kat geçişinin fiziki yeri. Kapı mevcut (x=0 ön duvar).
- **Sokak:** kaldırım + yol mevcut; kapı önü bahçe masaları madde 4'te görsel olarak eklenir
  (oynanır masa DEĞİL — ileride aday).

### Dünya koordinat taslağı (uygulamada kalibre edilir)
- Zone footprint'i bugünkü alan (~10.6×10.3) korunur; zone-2 = zone-1'in x+ kopyası, aralarında
  ~2 br iç duvar/geçit. Kat genişliği ~2 zone + servis odaları; kamera `fit` mevcut davranışla
  alanı sarar (zone'lar arası geçişte odak — uygulamada netleşir).
- Tuvalet/depo arka şeritte z ≈ minZ-2 bandında küçük odalar (≈3×3); Faz 3c'ye kadar kapalı kapı +
  tabela (görsel rezerv).

## 3) ÜST KAT planı (Faz 3b+ — şimdilik NOT)
- **Okey/tavla salonu:** 4 zone'luk ızgaranın üst-kat karşılığı; masalar OYUN masası (yeşil çuha,
  okey ıstakası/tavla görseli), müşteri oturma süresi uzun + harcama farklı (denge Faz 4).
- **Balkon:** ön cephede nargile/çay balkonu (açık alan ferahlığı; dekoratif başlar).
- **Kata özel:** kendi tuvalet+depo çifti (Faz 3c kuralı kat-başına).
- Merdiven zemin kattaki konumun üstüne iner; ekran kararma geçişi (Faz 3b).

## 4) Uygulama sırası (bu plana bağlı işler)
1. **Gece madde 3:** zone modül refactor + zone-2 (bu plandaki yerine) + zone-açma pad'i + SAVE bump.
2. **Gece madde 4:** görsel kimlik (zone-1/2 + sokak + bahçe masaları + TV köşesi dekoru zone-4 rezervine değil, zone-1 duvarına basit TV ile başlanabilir — karar uygulamada).
3. **Faz 3b:** merdiven + üst kat. **Faz 3c:** tuvalet/depo mekanikleri (yer bu planda hazır).
4. Lavabo MEKANİĞİ (müşteri tuvalet ihtiyacı vb.) zone-3 ile birlikte SABAH netleşir (gece yapılmaz).

## 5) Kaynaklar
- [Yahya Kaptan Kahvesi — bölümlü kahvehane örneği (restoran + şark köşesi + oyun bölümü; TV ocak yakınında; teras=oyun+nargile)](https://www.kocaelilife.com/ezber-bozan-kahvehane-yahya-kaptan-kahvesi/)
- [Kıraathanecilik Meslek Kılavuzu — Ticaret Bakanlığı esnaf kılavuzu (ruhsat/bölüm gereksinimleri)](https://esnafkoop.ticaret.gov.tr/data/60d30d9e13b876f3e8562f4a/c2f70fc7fbb2b39ed2e24e5dab03654b.pdf)
- [Kahvehane — Vikipedi (tarihçe + işlev: oyun, sohbet, TV)](https://tr.wikipedia.org/wiki/Kahvehane)
- [Kahvehanelerin Sosyal Hayattaki Yeri (ResearchGate)](https://www.researchgate.net/publication/325825673_Kahvehanelerin_Sosyal_Hayattaki_Yeri)
- [Kıraathane Kültürü ve Kahvehaneler](https://blog.delphinhotel.com/kiraathane-kulturu-ve-kahvehaneler)
