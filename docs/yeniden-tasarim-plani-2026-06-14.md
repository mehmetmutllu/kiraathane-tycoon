# Köşe Kıraathanesi — Yeniden Tasarım Planı (2026-06-14)

> Çalışan oyun `checkpoint-2026-06-14-calisan-oyun` etiketinde güvende. Bu plan, kıraathaneyi
> "her ürün ayrı zone" modelinden **tek-mekân + alan çeşitliliği** modeline taşıma tartışmasıdır.
> Greybox preview: `localhost:5180/?layout` (çalışan oyuna dokunmaz).

## 0. Durum etiketleri
- ✅ KARAR (kullanıcı onayladı) · 💡 ÖNERİ (onay bekliyor) · ❓ AÇIK SORU

## 1. Çekirdek model
- 💡 **Zone = ürün DEĞİL, zone = ALAN.** Mekân tek bir kıraathane; alanlar farklı *atmosfer/işlev*.
- ✅ **Mutfak/ocak HER SALONDA ayrı olabilir** (kullanıcı 2026-06-14; eski per-zone ocak korunur).
  Menü o salonun ocağından çıkar; ocak yükseldikçe ürün/çıktı artar.
- ❓ Menü "global mi (her salonda çay+kahve+tost) yoksa salon-bazlı mı"? — per-salon ocak kararıyla
  birlikte netleşecek. İlk varsayım: her salonun ocağı temel içecekleri verir, çeşit yükseltmeyle açılır.

## 2. Servis felsefesi (yorgunluk çözümü)
- ✅ **Müdavim sistemi İPTAL** (kullanıcı: abartı).
- 💡 **Oyuncu = yönetici + yardımcı, baş garson DEĞİL:**
  - Rutin servis → **garson** (erken açılır, otomatik). Oyuncu tek tek koşmaz.
  - Oyuncunun fiziksel işi **tek tip + toplu** (tepsi porsiyon, "kişiye özel sipariş eşleştirme" yok).
  - Aktif keyif: ocak stokla/yükselt, para/bulaşık **toplu** topla, maç günü yoğunluğu, genişleme.
  - Gerekçe: "gör-git-al-gel" hem fiziksel hem **zihinsel** yorucu (kullanıcı). My Hotel = tek tip iş,
    keyif büyümeden gelir.
  - NOT: Bu, eski "servis tamamen manuel" feedback'inin **revizyonu** (kullanıcı güncelledi).

## 3. Zemin kat — alanlar
- ✅ İlk 2 alan = **kıraathane salonu** (Ana Salon + 2. Salon).
- ✅ 1 alan = **MAÇ ALANI** (büyük, TV duvarı + sıralar; maç günü kalabalık + içecek talebi patlar).
- 💡 4. alan = **ÇAY BAHÇESİ / TERAS** (yarı açık, yeşillik; görsel olarak en farklı katman).
  Alternatifler: Kahvaltı Salonu / Lobi-Büfe (kullanıcı seçecek).
- ✅ **Açılış sırası:** ilk 2 salon → sonra **Alan 3 (Maç) + Alan 4 (Bahçe) AYNI ANDA** açılabilir →
  oyuncu istediğinden ilerler → sonra merdiven/üst kat.

## 4. WC + Depo (kullanıcı fotoğrafına göre — My Hotel WC kalıbı)
- ✅ **Kat başına 1 ortak WC** (mavi fayanslı oda, kapaklı kabinler, lavabo sırası).
- ✅ Kabin önünde **kağıt yuvarlağı**: **DEPO**'dan tuvalet kağıdı alınıp getirilince takılır
  (fotoğraftaki mekanik). Kilitli kabin sonra parayla açılır.
- 💡 Kağıt yenileme "koş-getir" olduğu için → **temizlikçi personele** yıkanır (oyuncuya zorunlu değil;
  madde 2 felsefesi).

## 5. Üst kat — Oyun Salonu
- ✅ Okey (4'lü masa) · Tavla (2'li) · Kâğıt/pişti. **KUMAR YOK** (kullanıcı + etik kural).
- 💡 Mekanik: masa **süre-bazlı doluluk ücreti** + oynayanlara içecek **çapraz-satış** (üst kat talebi
  alt mutfağı besler → sistemik bağ). Turnuva = olay/yoğunluk.

## 6. Kuş bakışı kroki (zemin kat)
```
            ════ ARKA DUVAR ════
┌───────────────────────────────────────────────┐
│ [STAIRS↑]   her salonun kendi OCAĞI    [WC+DEPO]│
│ ┌──────────┐  ┌──────────┐   ┌ ─ ─ ─ ─ ─ ┐     │
│ │ ANA SALON│  │ MAÇ ALANI│     ÇAY BAHÇESİ      │
│ │ +ocak    │  │ büyük TV  │     +ocak           │
│ └──────────┘  │ + sıralar │    (yarı açık)      │
│ ┌──────────┐  └──────────┘   └ ─ ─ ─ ─ ─ ┘     │
│ │ 2. SALON │                                    │
│ │ +ocak    │        [GİRİŞ ▒▒ KAPI]             │
│ └──────────┘                                    │
└───────────────────────────────────────────────┘
            ════ SOKAK / ÖN CEPHE ════
```

## 7. Asset
- ✅ **KayKit** (CC0, glTF native). Karakter: Adventurers'tan sivil + ekipman sök + ele tepsi.
  Furniture/Restaurant/City/Forest Bits prop kaynağı. Kenney reddedildi.
- ⚠️ KayKit karakterleri skinned → coin/NPC InstancedMesh uygulanmaz; mobil için ayrı optim (Faz 6).

## 8. Kapsam dışı / iptal
- Müdavim sistemi (iptal). Kumar (yasak). Nargile (çocuk-güvenli risk → koyma ya da dumansız prop).

## 9. Mevcut oyunla ilişki + fazlama
- Çalışan oyun `checkpoint-2026-06-14-calisan-oyun` etiketinde. Bu pivot büyük (LAYOUT + zone↔ürün
  eşlemesi + ekonomi). **Önce greybox preview ile mekânsal tasarımı onayla**, sonra gerçek refactor.
- Fazlama: tasarım onayı → preview iterasyonu → LAYOUT/store refactor (yeni alanlar + per-salon ocak) →
  servis felsefesi (garson-öncelikli) → WC/depo + temizlikçi → üst kat oyun salonu.

## 10. Sonraki oyunlar (ayrı proje — auto-memory'de)
Kıraathane bitince: Ortaçağ tycoon (kervansaray + harita genişleme) → Idle Space Colony. Detay
auto-memory `user_game_dev_goals.md`.

## SIRADAKİ ADIM
Greybox preview (`?layout`) ile alanları gez → madde 1/2/3-(4.alan) onayla → ekonomi+menü taslağı.
