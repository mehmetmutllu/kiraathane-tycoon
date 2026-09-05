# Arayüz v2 — uygulanan tasarım (2026-09-06)

Plan §9'un bilgi mimarisi **gerçek oyunun içinde** uygulandı (statik mockup değil).
Kullanıcı isteği: *"arayüz işini direkt oyunu oynuyormuşum gibi tam bir oyun ekranında yap
ki anlaşılır ve gerçek senaryo gibi olsun."* Karar: `memory-bank/decisions.md` **D-051**.

Ekran görüntüleri `ss/` altında (412×915, gerçek telefon oranı, gerçek oyun durumu).

## Yerleşim

```
ÜST ŞERİT   İtibar madalyonu + çubuğu · ₺ · 💎 · ayar
SAHNE       yalnız AKTİF ADIM'ın işareti + EKRAN KENARI OKU (hedef dışarıdaysa)
ALT BANT    AKTİF ADIM — tek satır, Tek Odak'ın metin kanalı (dokun → kamera hedefe)
ALT NAV     Görevler · Hedefler · Mağaza · Karakter
```

Kaldırılanlar: sol-üstteki dağınık dört yan buton (dişli/posta/fırça/karakter), sağ-üstteki
görev kartı, **Posta** paneli (K16).

## Görsel dil — iki katman, bilinçli olarak farklı malzeme

| Katman | Malzeme | Neden |
|---|---|---|
| **Overlay** (üst şerit · alt bant · alt nav) | ceviz ahşap + pirinç kenar, krem yazı | Sahnenin üstünde durur; zemin/duvar teması ne olursa olsun kontrast korunur |
| **Sayfa** (sheet) | eski kâğıt / krem, koyu kahve metin | İçerik yoğun ekranlar; menü kâğıdı hissi. Mevcut mağaza/karakter içerikleri de okunaklı kalır |

Emoji ve CSS ikon **yok** (plan §9 zorunlu kuralı): her simge `src/components/ui/icons.tsx`
içinde elle çizilmiş SVG. Bu oturumda eklenenler: `QuestListIcon` · `TargetIcon` ·
`ShopAwningIcon` (kıraathane cephesinin kendisi — maket v15 dili) · `ChevronIcon` ·
`ReputationIcon` · `PlayAdIcon`. Fontlar zaten yerel: Baloo 2 (metin) + Lilita One (rakam).

## Dosyalar

| Dosya | İş |
|---|---|
| `src/components/ui/HUD.tsx` | Kabuk + Görevler + Hedefler + ödül modali + mağaza (mevcut) |
| `src/components/ui/Sheet.tsx` | Ortak alt sayfa kabuğu — mağaza ve karakter de bunu kullanır |
| `src/components/ui/hud.css` | Arayüz v2'nin tüm stili (eski `index.css` bozulmadan üstüne biner) |
| `src/components/ui/icons.tsx` | SVG ikon seti (6 yeni ikon) |
| `src/game/screenPointer.ts` | Aktif adımın ekran izdüşümü (singleton; `perf` kalıbı) |
| `src/components/three/Scene.tsx` | `QuestPointer` — hedefi kameraya izdüşürür |

## Ekran kenarı oku

`QuestPointer` (R3F `useFrame`) aktif görevin dünya hedefini kameraya izdüşürür ve sonucu
`screenPointer` singleton'ına yazar — **store'a yazmaz**, yoksa her kare React render'ı
tetiklenirdi (`perf` ile aynı kalıp). HUD ~20 Hz okur. Hedef güvenli dikdörtgenin dışındaysa
kenarda pirinç ok belirir, dokununca kamera hedefe kayar.

## Hedefler ekranı — veri gerçek

Beş kategori **mevcut `stats`/durumdan türetilir**, sahte veri yok:
Servis (`teasServed + waiterServed`) · Temizlik (`dishesWashed`) · Büyüme (açılan masa) ·
Kazanç (`lifetime`) · Usta (soft-max seviyeye çıkan masa sayısı).
Ödül **toplama** Faz D'de bağlanacak (K5) — sayfa bunu açıkça söylüyor.
İtibar çubuğu bugün XP/seviye sistemini kullanıyor; Faz D'de İtibar'a devrolur.

## Geliştirici sandbox'ı (DEV-only)

`src/components/ui/DevSandbox.tsx` — sol-üstteki **DEV** düğmesi veya **`** tuşu açar.
Üretim paketine **girmez** (`import.meta.env.DEV` + lazy import; `dist/` içinde `dsb-` yok).

Para (sınırsız anahtarı) · zaman ×1…×25 ve +1dk/+10dk/+1sa · **her salonun ocak/tezgâh
seviyesi** · **12 masanın tek tek seviyesi** (+ "hepsi L1…L5") · karakter kademeleri ·
personel kademeleri · pad zinciri (sol tık aç/kapat, **sağ tık o pad'e kadar hepsini aç**) ·
görev atlama · kozmetik temalar ("hepsini aç") · HUD'ı gizle · kaydet/sıfırla.

Oyun mantığına dokunmaz: yalnız store'a yazar, oyunun kendi türetme zinciri (D-015 —
her şey `padsDone`'dan türer) aynen çalışır.
