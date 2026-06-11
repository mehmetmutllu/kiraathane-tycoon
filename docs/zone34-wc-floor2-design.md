# İçerik Tasarım Raporu — Zone 3-4 + Lavabo/Depo + Üst Kat

> 2026-06-11/12 araştırma oturumu. PLANLAMA dokümanı — kod yok, sayılar öneri (uygulamada
> sim ile kalibre edilir). Onaylanan kısımlar uygulama planına çevrilecek.
> Taban: `floorplan-master.md` (kat planı + kıraathane tipolojisi), D-016 (zone atomik),
> D-022 (per-zone temalı servis), D-010 (fiyat sabit; artış YENİ menü ürünüyle), D-012 (KASA yok,
> manuel toplama, bölge-başı personel), D-020 (karışık tepsi hazır; tost altyapısı uygun).

## 1) Tür araştırması özeti (ne öğrendik)

**My Perfect Hotel deseni (deconstruction + rehberler):** her yeni alan = AYNI iskelet
(servis et→para yerde→topla) + **yeni tüketilebilir** (havlu/soda/kahve/kâğıt) + **yeni personel**
+ tema farkı. Tasarımcının kendisi "dört otel benzer görevler sunar" diye kabul ediyor — tazelik
ürün/tema değişiminden geliyor, mekanik devrimden değil. Bizim D-022 "kopyala-yapıştır değil
TEMALI" kararıyla birebir örtüşüyor.

**Tuvalet (My Perfect Hotel'de kanıtlı döngü):** müşteri tuvaleti kullanır → **girişte para bırakır**;
kâğıt biter → oyuncu depodan taşır; **görevli (attendant)** ikmali otomatikler. Yani tuvalet
"angarya" değil **gelir noktası + tüketilebilir döngüsü + personel slotu** — bizim 3c taslağıyla uyumlu,
üstüne "girişte ödeme" gelir kancasını ekliyoruz.

**Gerçek kıraathane kültürü (floorplan-master §1 + menü araştırması):** kıraathanede yemek ≠ restoran;
**tost (10+ çeşit), sahanda yumurta, gazoz/soda** standart atıştırmalık üçlüsü. Ocağın yanında küçük
tost tezgâhı tipiktir. Okey/tavla AYRI bölümde; TV maç günleri odak; nargile açık alanda (yasal).
→ "Yemek salonu" kıraathane kimliğini BOZMADAN yapılabilir: adı **tost ocağı**, restoran değil.

## 2) Sonraki 2 zone — seçenekler

### Seçenek A — Zone-3 TOST OCAĞI + Zone-4 MAÇ SALONU  ⭐ ÖNERİM

**Zone-3 · Tost Ocağı ("yemek salonu"nun kıraathane hali):**
- İskelet aynı (D-022): 1 istasyon + 1 bulaşık + 1→4 masa + ops. garson/bulaşıkçı.
- **İstasyon = tost tezgâhı** (sac/tost makinesi + ekmek rafı; ocak modülü deseni, başında
  **tost ustası** NPC — çaycının muadili).
- **Ürün = tost: İKİNCİ ürün hattı.** D-010'un ta kendisi: "fiyat artışı yeni menü ürünüyle".
  Çay 5₺ sabit kalır; tost **pahalı + yavaş** (öneri: fiyat ~4-6× çay, hazırlama ~2-3× brewTime)
  → throughput matematiği aynı, sabitler farklı; zone başına gelir profili değişir.
- Bulaşık karşılığı: **kirli tabak** (mevcut dishes sistemi, farklı görsel; ayrı havuz —
  bardak korunumu deseninin kopyası).
- Müşteri: zone-3 masasına oturan tost sipariş eder (MVP'de zone'un ürünü tek; "çay+tost combo"
  Faz 3d'ye aday).
- Dekor: vitrin tezgâhı, ekmek kasası, ketçap/mayonez şişeleri, ızgara dumanı.

**Zone-4 · Maç Salonu (TV köşesi):**
- İskelet = çay salonu (ocak+bulaşık+masalar; ürün yine çay — yeni ürün hattı YOK, tempo farkı VAR).
- **Büyük duvar TV + MAÇ SAATİ event'i:** periyodik (örn. ~10 dk'da bir, ~90sn) "maç başladı!" →
  bu zone'da spawn hızlanır + bahşiş çarpanı (rush). D-022 bunu "mekanik Faz 4" demişti; MVP'de
  **yalnız dekoratif TV + sabit hafif bahşiş bonusu** ile açılıp, rush event'i Faz 4'te
  etkinleştirilebilir (iki aşamalı — onayına göre).
- Dekor: sıra sıra TV'ye dönük masalar, takım atkıları, skor panosu. (Zone-1'deki küçük TV
  zaten maç oynatıyor — buradaki BÜYÜK ekran + tribün hissi.)
- Gerekçe: maç günü kıraathanenin en otantik sahnesi; rush mekaniği idle türünde kanıtlı
  (event-driven talep dalgası); yeni istasyon kodu gerektirmez → zone-3'ün yanında ucuz çeşitlilik.

**Neden bu ikili:** biri ÜRÜN ekseninde yenilik (tost hattı), öbürü TEMPO ekseninde (rush) —
ikisi de aynı zone iskeletini kullanır (kod riski düşük), ikisi de %100 kıraathane.

### Seçenek B — Zone-3 Tost + Zone-4 üçüncü çay salonu
En düşük risk/iş; ama zemin kat "2 aynı çay salonu + 1 tost + 1 daha çay" = tekdüze.
My Perfect Hotel dersi: tema/ürün farkı olmadan tekrar hissi büyür. Önermiyorum.

### Seçenek C — Bahçe zone'u (kullanıcının şüphesi)
**Şüphen haklı, önermiyorum:** (1) Duvar/nav/kat ızgarası modeli kapalı mekâna göre kurulu —
zemin katın ortasında "açık alan" zone'u duvar gramerini bozar; (2) bahçenin doğal yeri zaten
planda var: **sokak kaldırım masaları (görsel)** + **üst kat nargile BALKONU (açık alan slotu)**;
(3) gazoz gibi "bahçe ürünü" istersek tost tezgâhının yanına dolap olarak Faz 3d'de eklenebilir.
Bahçe hissi kaybolmuyor — doğru kata taşınıyor.

## 3) Lavabo (tuvalet) + Depo — yerleşim ve döngü

**Yerleşim (floorplan-master'daki rezervler korunur):** arka şerit, z ≈ minZ−2 bandı;
**DEPO sol-arka köşe** (zone-3'ün arkası), **TUVALET+LAVABO sağ-arka köşe** (zone-4'ün arkası).
Kata özel TEK çift (D-016 §6); zone içinde değil, ızgaranın arka bandında küçük odalar (≈3×3),
kapıları salona bakar. Açılana kadar kapalı kapı + tabela (bugünkü görsel rezerv).

**Açılma sırası (öneri):** tuvalet pad'i **zone-3 ile zone-4 arasında** omurgaya girer
(zone-3 gelirleriyle alınır; zone-4'ten önce "farklı bir şey" temposu). Depo AYRI satın alınmaz —
**tuvaletle birlikte açılır** (kâğıdın kaynağı; tek pad, iki oda).

**Döngü (MVP — tek yeni mekanik kuralı):**
1. Müşteri çayını/tostunu bitirip ödedikten sonra **%~25-30 olasılıkla tuvalete uğrar**.
2. Kullanım **1 kâğıt** harcar (tuvalet stoğu, örn. kapasite 8) ve **kapı önüne küçük ödeme düşer**
   (öneri: çay fiyatı civarı — My Perfect Hotel'in kanıtlı gelir kancası; manuel toplanır, D-012).
3. **Kâğıt bittiyse** müşteri kapıda bekler (kısa sabır) → dolmadan kâğıt gelmezse vazgeçer
   (gelir kaybı + mutsuz baloncuk). Oyunculuğu üreten an: "kâğıt bitti!" koşusu.
4. Oyuncu **depodan kâğıt kolisi alır** (raf = sonsuz kaynak, ücretsiz; angarya = TAŞIMA,
   tepsi gibi elde, örn. 4 rulo) → tuvalete takar (stok dolar). Aktif-oynanış ruhu (D-012).
5. **Temizlikçi personeli** (pad, garson deseni; bölge-başı=kat-başı): kâğıt ikmalini otomatikler —
   yavaş/kısmi assist; oyuncu rush'ta yine devreye girer.
- **Faz 4+ adayları (MVP'de YOK):** kirlilik/temizleme sayacı, müşterinin tuvalet İHTİYACI yüzünden
  masadan kalkması, depoya tost ekmeği/çay rafı eklenmesi.

## 4) Üst kat konsepti (Faz 3b)

**Kat teması: OYUN KATI** — zemin "içecek/yiyecek", üst kat "oyun + keyif" (gerçek tipoloji:
oyun bölümü ayrı durur; otomatik okey masası modern kıraathanenin statü sembolü).

```
                         ARKA (z-)
 ┌──────────┬─────────────┬─────────────┬──────────┐
 │  DEPO-2  │  ZONE-B     │  ZONE-C     │ TUVALET-2│
 │ (kat 2)  │ TAVLA/KÂĞIT │ OKEY SALONU │ (kat 2)  │
 ├──────────┴─────────────┼─────────────┴──────────┤
 │       ZONE-A           │       ZONE-D           │
 │   OKEY SALONU (ilk)    │   ÇAY SALONU (servis)  │
 ├───── MERDİVEN ─────────┴──── BALKON KAPISI ─────┤
 │     ÖN CEPHE: NARGİLE BALKONU (açık alan)       │
 └─────────────────────────────────────────────────┘
                         ÖN (z+)
```

- **Okey/tavla zone'u (yeni gelir profili):** masa = OYUN masası (yeşil çuha, ıstaka/pullar);
  **4 müşteri birlikte** oturur, **uzun oturum** (birkaç dk), kalkarken **masa ücreti** (yüksek,
  tek seferde) + oturum boyunca **periyodik çay siparişi** (katın çay ocağından — D-016 zone
  atomikliği için kata 1 servis çay-zone'u: ZONE-D). Düşük frekans × yüksek tutar = zemin katın
  tersine "bekle-ve-büyük-topla" hissi.
- **Nargile balkonu:** ön cephe açık şerit; nargile istasyonu + köz/kömür tüketilebilir döngüsü
  (depodan kömür — kâğıt deseninin kopyası). Dekoratif başlar, mekanik sonra (D-022 ile uyumlu).
- **Merdiven:** zemin ön-sağ rezervin üstüne iner; geçiş = ekran kararma + kat değişimi; aynı anda
  TEK kat render/kamera (D-016 §3). SAVE bump (aktif kat + kat-2 state).
- Çocuk-güvenlik notu: okey/tavla **kumarsız** (skor/keyif oyunu olarak sunulur), nargile görseli
  stilize — mağaza derecelendirmesi (Faz 8) gözetilir.

## 5) Önerilen uygulama sırası (onay sonrası ayrı plana çevrilir)
1. **Zone-3 Tost Ocağı** (ikinci ürün hattı: istasyon modülü + tabak döngüsü + tost ustası; SAVE bump).
2. **Tuvalet+Depo MVP** (kâğıt döngüsü + girişte ödeme + temizlikçi pad'i).
3. **Zone-4 Maç Salonu** (MVP: dekor TV + hafif bahşiş bonusu; rush event'i Faz 4 anahtarıyla).
4. **Faz 3b üst kat** (merdiven + okey zone'u — ayrı tasarım turu: masa ücreti/çay temposu sim'le).

Her adım kendi içinde küçük + test edilebilir (CLAUDE.md kuralı); sayılar `economy.config.ts`'e,
denge değişiklikleri onaysız uygulanmaz.

## 5b) UYGULAMA PLANI — 1. kat tamamlama (ONAYLI, 2026-06-12 gece oturumu)

> Kullanıcı onayı: "Seçenek A + tuvalet/depo MVP + oyun katı konsepti" + "1. kattaki her şeyi
> görevlerle planla-yap; görev para ödülleri eklenebilir; yemek masaları farklı görünsün,
> seviye arttıkça görsel de artsın." Üst kat (Faz 3b) BU oturumda YAPILMAZ (ayrı tasarım turu).

### Geometri kararı: 2×2 kat ızgarası
- `MAX_ZONES 2→4`; zone index: z0 ön-sol (çay), z1 ön-sağ (çay), **z2 arka-sol (TOST)**,
  **z3 arka-sağ (MAÇ)**. Dönüşüm: `zonePoint(z,v)` = x aynalama (tek index'ler) + z kaydırma
  (arka sıra: −ZONE_DZ ≈ 10.3). Mutfak şablonu YAN duvarda olduğundan arka sıra çeviri ile çalışır
  (rotasyon gerekmez). Tek kapı önde kalır; iç duvar yok (D-023) → müşteri BFS ile arkaya yürür.
- Duvarlar yalnız AÇIK zone'ları sarar; 3 zone açıkken L-şekli (zonesOpen'a göre segment listesi).
  Kilitli zone = boş arsa (v22 deseni). Kamera fit alanı açık zone'lara göre büyür.
- Açılış sırası: zone2(z1) → zone3(z2 tost) → tuvalet+depo → zone4(z3 maç).

### Milestone'lar (her biri: vitest + sim + smoke + Playwright + commit + push)
1. **M1 Görev ödülleri:** `QuestDef.reward?` (₺) + tamamlanınca cüzdana + toast/HUD'da gösterim.
   Mevcut görevlere ölçülü ödüller (erken 10-30, geç 100-500; sim tempo bozmamalı).
2. **M2 Izgara altyapısı:** MAX_ZONES=4 + zonePoint + LAYOUT dizileri + duvar/zemin/kamera/nav
   arka sıra desteği; zone-3/4 KİLİTLİ (davranış değişmez, tüm testler yeşil).
3. **M3 Tost hattı (zone-3):** `economy.config.products` (tea/tost: fiyat+hazırlama+istasyon
   yükseltme spec'i); zone→ürün eşlemesi; tepside ayrı `trayFood`; kirli TABAK (Dish.kind görsel);
   temiz havuz ORTAK ("kap" soyutlaması — korunum değişmezi tek kalır). Tost istasyonu görseli
   (sac/izgara + tost ustası NPC) + YEMEK MASASI ayrı görsel evrimi (L1-L4 tost temalı).
   Pad zinciri: zone3 → z3table2 → z3waiter → z3table3 → z3dishwasher → z3table4.
   Görevler SONA EKLENİR (append-only → questIndex İD-eşleme gerekmez). SAVE v24.
4. **M4 Tuvalet+Depo MVP:** zone-3 arka duvarında TUVALET modülü + DEPO rafı (tek pad'le açılır,
   zone3 zinciri sonrası). Müşteri ödeme sonrası %~25 kapıya gider → 3sn kullanır → 1 kâğıt düşer +
   kapı önüne ödeme; kâğıt 0 → kısa bekleyip vazgeçer. Oyuncu depodan kâğıt taşır (≤4), kapıya takar.
   TEMİZLİKÇİ pad'i (kat personeli): stok azalınca depo→tuvalet ikmal turu. Görevler + SAVE v25.
5. **M5 Maç salonu (zone-4):** pad zinciri (z4...) + büyük TV (mevcut maç dokusunun büyüğü) +
   zone-4 servis bahşiş bonusu (config `zoneTipBonus`); maç RUSH event'i Faz 4'e (anahtar hazır).
   Final: tam sim kalibrasyonu + smoke + yeni APK (v25).

### Denge yaklaşımı
Mevcut sayılara DOKUNULMAZ; yalnız YENİ içerik sayıları eklenir ve `tools/simulate.ts` ile
kalibre edilir (hedef: zone-3 açılışı zone-2 bitiminden ~30-60dk aktif oyun sonrası; tost geliri
çaydan belirgin yüksek ama tempoyu kırmaz). Görev ödülleri pad maliyetlerinin ~%10-20'si bandında.

## 6) Kaynaklar
- [My Perfect Hotel — arcade idle deconstruction (ARPU Brothers)](https://arpubrothers.com/blog/my-perfect-hotel-arcade-idle-deconstruction/)
- [My Perfect Hotel Guide — Level Winner (tuvalet/kâğıt/attendant + alan açılışları)](https://www.levelwinner.com/my-perfect-hotel-saygames-guide-tips-tricks-strategies/)
- [ATO 2024 kahvehane/kıraathane azami fiyat tarifesi (menü: çay/tost/gazoz kalemleri)](https://www.atonet.org.tr/Uploads/Birimler/Internet/Hizmetlerimiz/Azami%20Fiyat%20Tarifleri/2024_azami_fiyat/2024_oyun_salonlari_kahvehane_kiraathaneler.pdf)
- floorplan-master.md §5'teki kıraathane tipolojisi kaynakları (Yahya Kaptan örneği, Ticaret
  Bakanlığı kılavuzu, Vikipedi, ResearchGate).
