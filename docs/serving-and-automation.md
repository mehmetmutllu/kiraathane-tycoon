# Servis, Personel & Mekân Modeli — manuel-önce, kademeli otomasyon (My Hotel DNA)

> ✅ FİNAL (2026-06-06). Kullanıcı onayladı. D-011 (servis) + D-012 (zone/personel) +
> D-013 (primitive sanat) bu dokümana dayanır. Önceki "garson çayı otomatik taşır" planı
> ve "kasa/kayıt" fikri İPTAL edildi.

## 0. Tek cümle
Oyuncu her işi **önce kendi** yapar (tepsiyle servis, kirli bardak/para toplama); büyüdükçe
o işe **bölgeye özel personel** alır; bir salon dolunca **yeni salon + yeni personel slotu**
açılır. Referans: My Perfect Hotel (arcade-idle). Para toplama **kalıcı manuel** (çekirdek eğlence).

## 1. Müşteri döngüsü (çember) — KASA YOK
```
Giriş → boş masaya YÜRÜ/OTUR → çay bekler (sabır timer'ı) →
OCAK hazır-kuyruğa demler → oyuncu/garson TEPSİ ile masaya taşır → içer →
öder (para yere düşer) → SEN toplarsın → masada KİRLİ bardak kalır →
topla → bulaşıkta yıka → temiz bardak havuzuna döner → müşteri çıkar
```
- **Kasa/kayıt/karşılama YOK.** Müşteri girer, direkt boş masaya oturur (mevcut davranış korunur).
- Sabır aşımında müşteri **sessizce kalkıp gider** (ödeme yok, ceza/öfke yok → çocuk-güvenli).

## 2. Manuel işler ve devri (her biri bölgeye özel personelle otomatikleşir)
| İş | Önce (oyuncu) | Sonra (personel) | Ne zaman |
|---|---|---|---|
| Tepsiyle çay servisi | sen | **Garson** | 2. masadan sonra (gated) |
| Kirli bardak topla + yıka | sen | **Bulaşıkçı** | bardak döngüsüyle |
| Tuvalet kâğıdı yenileme | sen | **Temizlikçi** | tuvalet ODASI açılınca |
| **Para toplama** | sen | — **kalıcı SEN** | hiç (oto toplayıcı YOK) |

## 3. Ocak hazır-kuyruğu (throughput'u sahnede gerçek kılar — D-010 §3.1)
- Ocak `brewTime`'da bir bardak çay demler, tezgâhta **hazır** biriktirir.
- **Kuyruk kapasitesi ocak seviyesine bağlı** (L0=3, her seviye +1; ayrı upgrade DEĞİL).
- Kuyruk doluysa demleme **durur** (teslimat darboğaz); boşsa servis **çay bekler** (demleme darboğaz).
- Ocak seviyesi hem demleme hızını hem kuyruk kapasitesini büyütür.

## 4. Tepsi (manuel ama toplu servis)
- Oyuncu ocağa yaklaşınca tepsiye hazır çaylardan **kapasite kadar** alır (yakınlık, dokunma yok).
- Bekleyen masalara yürür → yakınlıkta çay bırakır → müşteri içmeye başlar.
- **Tepsi kapasitesi yükseltilebilir** (2 → 4 → 6 → 8; Faz 2e). Hareket hızı + tepsi = erken öncelikli yükseltmeler.
- "Sürekli tek-tek taşıma" sorununu çözer; yine de gidip-gelmek gerekir (oynanış korunur).

## 5. Bardak döngüsü (My Hotel "odayı temizle" karşılığı — Faz 2e)
- **Bardak = sınırlı kaynak.** Temiz bardak biterse servis edilemez → kirlileri toplamaya mecbur kalırsın (darboğaz).
- Ocak temiz bardağa demler → tepsiyle git → müşteri içer → masada **kirli bardak** kalır.
- Oyuncu kirli bardakları toplar → **bulaşık** noktasında yıkar → temiz havuza döner.
- **Bardak havuzu ocak seviyesine bağlı** (L0=örn. 4, her seviye +2).
- Sonra **bulaşıkçı** yıkamayı devralır.
- İki "çember": **servis (temiz çay git)** + **toplama (kirli bardak/para dön)** → zengin ama boğmayan aktif döngü.
- **Çaydanlığa ham çay/su getirme YOK** (sürekli ham-madde taşımak angarya; bardak döngüsü zaten kaynak-darboğazı verir).

## 6. Garson = kısmi otomasyon (bölgeye özel)
- Garson, oyuncuyla **aynı döngüyü** yapan özerk NPC: ocak→tepsi→bekleyen masa→ocak.
- **Bölgeye özel** (global havuz değil): 1 ocak ≈ 4 masa kümesine 1 garson.
- **Kasıtlı sınırlar:** oyuncudan yavaş ve/veya küçük tepsi → tek garson büyüyen mekânı tek
  başına döndüremez; kalanı + para toplamayı oyuncu kapatır.
- Ek/yükseltme garson (gated) = daha çok otomasyon; geç oyunda oyuncunun işi toplama + büyütme + prestige.

## 7. Mekân / salon (zone) modeli — genişleme
- Mekân **salonlara** bölünür. Bir salon = ~{1 ocak : 4 masa} + (açılırsa tuvalet/bulaşık odaları).
- **Başlangıç dengesi:** 1 ocak : 4 masa (mevcut 2 ocak/geniş alan yeniden dengelenecek — Faz 2d).
- Bir salonun **tüm slotları açılınca** yeni salon kilidi açılır.
- **Yeni salon açılınca otomatik 1. ocak + 1. masa kurulu gelir** (oyuncu hemen servis edebilir);
  salonun gerisini (ek masa/ocak/oda) oyuncu parayla açar.
- **Tuvalet = parayla açılan ODA** (başlangıçta yok); açılınca tuvalet kâğıdı yenileme işi + temizlikçi gelir.
- Personel **bölge-başı**: her salonun kendi garson/bulaşıkçı/temizlikçi slotları.

## 8. Masa yükseltmesinin işlevi (D-010 uyumlu — fiyat sabit)
- Masa yükseltmesi fiyatı artırmaz; **konfor → müşteri sabrını artırır** (tek tepsi turunda daha
  çok masaya yetişirsin) **+ kozmetik/imaj**. İtibar Faz 4 prestige'e bağlanır.

## 9. Para toplama kalıcı manuel
- Oto para toplayıcı **YOK** (kullanıcı kararı). En fazla Faz 4'te yavaş/kısmi prestige ödülü düşünülür; çekirdeği değiştirmez.

## 10. Görsel yaklaşım (D-013): primitive = nihai sanat stili
- My Perfect Hotel "kodla çizilmiş" değil; Unity'de **düz-gölgeli, dokusuz, tek-renk low-poly**
  modeller kullanıyor → "primitive" görünür. Bizim **greybox-first** (box/cylinder/capsule + düz
  renk + yumuşak gölge) yaklaşımımız aynı estetiği üretir.
- **Karar:** primitive'leri placeholder değil **kasıtlı sanat stili** kabul et; cila = renk paleti,
  flat/toon shading, yumuşak gölge, "juice" (zıplama/ölçek), ışık. Faz 6 .glb geçişi **opsiyonel/hafif**
  olur. Türk'e özgü birkaç obje (semaver, ince belli bardak, nargile) yine CC0/AI model eklenebilir, zorunlu değil.

## 11. Uygulama sırası (küçük, test edilebilir dilimler)
**Faz 2 kalanı (servis çekirdeği):**
- **2c (HEMEN):** manuel tepsi servisi + ocak hazır-kuyruğu + sabır + sessiz-ayrılma. Çay artık oto
  servis EDİLMEZ. (Personel/kasa/tuvalet/zone YOK.) `tray`/`readyCups`/`brewProgress` **transient** →
  kalıcı şema değişmez, `SAVE_VERSION` 4'te kalır.
- **2d:** Garson (bölge-başı, yavaş/küçük tepsi, 2. masa sonrası gated) + harita dengesi (1 ocak:4 masa). `hasWaiter` persist → saveVersion bump.
- **2e:** Bardak/bulaşık döngüsü (bardak=ocak seviyesine bağlı, kirli→yıka) + bulaşıkçı + tepsi yükseltme. saveVersion bump.

**Faz 3 (My-Hotel zone & roller):**
- **3a:** Salon genişleme sistemi (salon dol → yeni salon + oto ocak/masa + personel slotları).
- **3b:** Tuvalet odası + tuvalet kâğıdı + temizlikçi.
- **3c:** Menü çeşitliliği (kahve/tost) + masa-yükseltme işlevi (sabır/imaj). Okey/tavla/nargile sonra.

## 12. Açık mikro-sorular (uygulama sırasında netleşir, bloklayıcı değil)
- Tepsi/hareket hızı yükseltme maliyet eğrisi (2e dengelemede).
- Garson hız/tepsi oranı (oyuncunun ~%50-60'ı?) — 2d dengelemede simulate ile.
- Bardak havuzu tam eğrisi (2e).

## 13. Kaynaklar
- My Perfect Hotel deconstruction (Udonis; arpubrothers) — arcade-idle döngü: manuel-önce, personel-otomasyon, kat/zone genişleme.
- Idle Restaurant Tycoon — kademeli personel, bottleneck baskısı.
- Roblox tycoon — erken manuel etkileşim, otomasyon ilerlemeyle.
- Perfect Hotel Unity template'leri — low-poly flat-shaded asset yaklaşımı (D-013 dayanağı).
