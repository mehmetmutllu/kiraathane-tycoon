# Fable 5 Brief — Progression Curve + Genel Tasarım Yeniden Düşünme

> **Bu ne:** Kullanıcının 2026-06-09'da verdiği büyük tasarım/denge geri bildiriminin
> SONRAKİ OTURUMDA araştırılıp uygulanması için hazırlanmış brief/prompt. Bu oturumda
> KOD YAZILMADI — sadece istekler net bir göreve dönüştürüldü.
>
> **Kim çalıştıracak:** Sonraki sohbette kullanıcı `/model` ile **Claude Fable 5**'e geçecek
> (9 Haziran 2026 çıktı, Mythos-sınıfı, Opus üstü; Pro/Max/Team planlarında 22 Haziran'a kadar
> dahil). Fable kendi yapacak veya alt-agent'lara (Explore / general-purpose / Plan) dağıtacak.
>
> **Çalışma kuralı (D / feedback `workflow_plan_approve`):** Her başlıkta ÖNCE araştır + öner +
> kullanıcı onayı al, SONRA `economy.config.ts`/kod/docs'a uygula. Tek seferde her şeyi kodlama;
> başlık başlık ilerle, faz bitmeden sonrakine geçme (CLAUDE.md).

---

## 0. Nasıl başla
1. `/kiraathane-devam` → hafıza bankasını oku (özellikle `memory-bank/activeContext.md`,
   `progress.md`, `decisions.md` ve `docs/progression-and-economy-v2.md`,
   `docs/serving-and-automation.md`, `docs/visual-and-layout-polish.md`).
2. `src/config/economy.config.ts` = TÜM denge sayılarının tek kaynağı; mevcut değerleri oku.
3. Önce kullanıcının telefon test feedback'ini iste (onboarding "hareketli olmalı" beklemede).
4. Sonra bu brief'i başlık başlık aç; her birinde **araştır → öner → onayla → uygula**.

---

## 1. PROGRESSION = GÖREV/QUEST TABANLI, TEK ADIM (en yüksek öncelik)

**Kullanıcı ne istiyor:**
- İlerleme "pad'ler aynı anda açılsın" değil, **sıralı görev görev** olmalı.
  Örnek akış: *en başta 2. masayı aç → sonra ilk masanın seviyesini yükselt → sonra garson
  tut → ...* Her görev bitince **sıradaki tek görev** açılır.
- **Ekranda aynı anda SADECE BİR pad/işaret görünsün.** (Şu an birden çok pad aynı anda
  belirebiliyor; kullanıcı bunu istemiyor.)
- Yani: bir "görev hattı" (quest line) + tek tek odaklanmış adımlar.

**Mevcut durumdan delta:**
- `economy.config.ts` `pads[]` zaten `requires.prev` zinciriyle sıralı; ama birden çok pad'in
  önkoşulu aynı anda karşılanabildiği için ekranda 2+ işaret çıkabiliyor. Ayrıca masa-başı
  yükseltme işaretleri ve garson/bulaşıkçı opsiyonel pad'leri ile ekran kalabalıklaşıyor.
- `optional:true` pad'ler omurgayı kilitlemiyor → birden çok seçenek aynı anda açık olabiliyor.

**Araştırılacak / kararlaştırılacak:**
- Tek-aktif-görev modeli: store'a "şu an gösterilen tek pad" mantığı (`currentPad` zaten var —
  genişletilip TEK görünür adıma indirgenecek mi?). Opsiyonel pad'ler (garson/bulaşıkçı) sıraya
  nasıl sokulur — onları da zorunlu sıralı görev mi yapalım, yoksa "atla" seçeneğiyle mi?
- Görev hattı verisi: pad listesini "quest" kavramına mı çevirelim (yükseltmeler de görev:
  "1. masayı L2 yap")? Yoksa pad + ayrı görev katmanı mı?
- Referans: My Hotel / Idle restoran tycoon'larda quest/hedef akışı nasıl (tek tek mi, liste mi).

---

## 2. ZONE MİMARİSİ — 1 katta 4 zone, servis modeli kararı

**Kullanıcı ne istiyor (henüz emin değil — KARAR araştırmayla verilecek):**
- 1 katta **4 zone** olacak. Açık soru: her zone'un **AYRI çay ocağı + ayrı bulaşığı + zone'a
  özel bulaşıkçısı + ekstra garsonu** mu olsun; YOKSA **tek bir servis noktası** olup sürekli
  mi yükseltilsin?
- Masalar daha çok seviye yükseltir; "lavabolardaki olaylar" olur (sink/bulaşık event'leri);
  her zone için ekstra garson + zone'a özel bulaşıkçı tutulur.
- **Üst kata çıkış** olacak (çok katlı). Kat geçişi nasıl olmalı (asansör/merdiven, yeni kat
  = yeni zone seti?).

**Mevcut durumdan delta:**
- Şu an TEK salon, TEK ocak : 4 masa (D-012). Zone kavramı henüz YOK. `derivedFromPads` tek
  `stations:1` döndürüyor. 2. ocak Faz 3a'da "yeni salon" ile gelecek diye planlanmıştı.
- Bu brief, Faz 3a "yeni salon"u **4-zone mimarisine** genişletmeyi tetikliyor.

**Araştırılacak / kararlaştırılacak:**
- **Per-zone vs tek-servis** kararı: oyun derinliği, ekran karmaşası, denge ve "balance grindi"
  (Idle Miner: kapasiteleri dengele) açısından hangisi daha iyi? Karma model? (ör. her zone
  kendi ocak+bulaşık; garson/bulaşıkçı zone-başı tutulur.)
- Zone başına ekonomi: 4 zone paralel throughput → gelir 4×'e mi çıkar, yoksa zone'lar
  kademeli mi açılır (zone 2/3/4 önkoşul + maliyet eğrisi)?
- Çok kat: kat = prestige benzeri büyük adım mı, yoksa düz devam mı? Kamera/yerleşim etkisi.
- Lavabo/bulaşık event'leri ne (rastgele kirlilik dalgası, tıkanan lavabo mini-olayı?).

---

## 3. AKTİF ↔ IDLE DENGESİ (My Hotel referansı)

**Kullanıcı ne istiyor:**
- My Hotel modeli: en başta direkt **temizlikçi** tutulur, sonra **kasiyer** vs. Ama temizlikçi
  YAVAŞ temizler → para çok hızlı kazanılmaz. Sonuç: oyuncu (a) bir şeyleri açana kadar
  **sürekli koşmaz**, (b) açtıktan sonra da **hep yatmaz/idle kalmaz**. Aktif ve idle arası denge.
- Yani yardımcılar "aç/kapa flip" gibi olmamalı (açınca her şey aniden otomatik+çok hızlı
  olmamalı — bu mevcut bilinen sorun).

**Mevcut durumdan delta:**
- `activeContext.md`: bilinen KÖK sorun = tek darboğaz manuel servis; garson+bulaşıkçı açılınca
  "açık/kapalı flip" → aniden çok hızlı/ucuz hissi. Offline zaten sert kısıldı (`rateMult 0.5`,
  `baseCapHours 1`).
- `waiter.moveSpeedByLevel [1.8, 2.3]`, `dishwasher.moveSpeed 1.8`, `carryCapacity 2` — hepsi
  oyuncudan (4.5) yavaş; ama denge "kısmi assist" hedefine tam oturmuyor.

**Araştırılacak / kararlaştırılacak:**
- Yardımcı hızları/kapasiteleri: garson ve bulaşıkçı ne kadar yavaş olmalı ki "kısmi yardım"
  korunsun (tek başına büyüyen mekânı döndüremesin) ama oyuncu da kölelik yapmasın?
- "Yavaş temizlikçi → para yavaş" prensibini sayısallaştır: bulaşıkçı throughput'u darboğazı
  ne kadar açsın? Her seviye neyi ne kadar etkilesin?
- Flip yerine kademeli geçiş: yardımcı seviyeleri (L1→L2→...) ile yumuşak rampa.
- Referans: My Hotel, Idle restoran — ilk yardımcı timing'i, hız eğrisi, aktif/idle oranı.

---

## 4. ONBOARDING + UI (menüler, üst chip'ler, para birimi)

**Kullanıcı ne istiyor:**
- Mevcut onboarding **iyi değil**; ayrıca daha önce "onboarding **HAREKETLİ** olmalı" dedi
  (statik koç bandı yerine animasyonlu işaretçi/ok/zoom — kullanıcıya tam ne hayal ettiğini SOR).
- **Menüler olmalı mı?** UI yapısı sorgulanıyor.
- **Üstteki chip'ler** ne kadar mantıklı ve güzel — gözden geçir.
- **Para birimi: ₺/TL OLMASIN.** Direkt bir **"money" ikonu** olsun; paraya isim bulmak
  zorunda kalmayalım (jenerik para simgesi).

**Mevcut durumdan delta:**
- `economy.config.ts` `CURRENCY.soft = '₺'` → **jenerik para ikonuna** çevrilecek (tüm HUD,
  pad fiyatları, toast'lar etkilenir). Elmas `💎` kalabilir.
- Onboarding şu an `onboardingHint(g)` saf helper + `.coach` yeşil statik bant. Kullanıcı
  hareketli istiyor.
- Üst chip'ler `.hud-top` (responsive yapıldı) — içerik/estetik gözden geçirilecek.

**Araştırılacak / kararlaştırılacak:**
- Hareketli onboarding tasarımı (ok/parıltı/animasyonlu el/işaretçi/kamera zoom — kullanıcıya sor).
- UI bilgi mimarisi: menü(ler) gerekli mi (ayarlar, mağaza, istatistik, görevler)? Alt nav bar?
- Üst chip seti: hangi metrikler gösterilmeli, ikonografi, sadeleştirme.
- Para ikonu: hangi simge (jenerik altın/coin), `microcopy-tr` skill'i ile metin tutarlılığı.

---

## 5. KARAKTER + GÖRSEL KİMLİK (Türk mimarisi / kıraathane)

**Kullanıcı ne istiyor:**
- Artık **karakterler tasarlanmalı** (oyuncu + NPC + yardımcılar).
- **Seviye arttıkça görüntü değişmeli**: Türk mimarisine / geleneksel kıraathane yapısına uygun
  öğeler (mobilya, dekor, mimari detaylar gelişmeli).

**Mevcut durumdan delta:**
- Stil kilidi: LOW-POLY STİLİZE, flat-shaded; primitive = nihai sanat (placeholder değil, D-013).
- Model fallback loader var (`components/three/Model.tsx`); `.glb` opsiyonel.
- Asset kuralı: Quaternius/Kenney (CC0), tek stil, lisansı belirsiz asset commit'lenmez.

**Araştırılacak / kararlaştırılacak:**
- Görsel-evrim sistemi: zone/masa/ocak seviyesi → mesh/material/dekor değişimi (kademeli "tier"
  görselleri). Semaver zaten ocak seviyesiyle büyüyor — bunu tüm objelere yay.
- Kıraathane estetiği: hangi öğeler (semaver, nargile?, tavla/okey masaları, ahşap, halı, çini,
  ahşap kafes, gaz lambası → modern aydınlatma). Türk kahvehanesi referans panosu.
- Karakter tasarımı: low-poly stilize karakter kiti (CC0) — oyuncu/garson/bulaşıkçı/müşteri ayrımı.
- Asset planı `docs/assets.md` + `public/assets/README.md` manifest güncellenecek.

---

## 6. MAĞAZA (kozmetik: parke, duvar kağıdı, dekor)

**Kullanıcı ne istiyor:**
- **Mağaza gelmeli**; oradan **parke, duvar kağıdı vs.** seçilebilsin (kozmetik kişiselleştirme).

**Mevcut durumdan delta:**
- Şu an mağaza YOK. Yeni sistem: kozmetik envanter + uygulanan tema (zemin/duvar/dekor).
- Para birimi ile bağ: kozmetikler soft para mı, elmas mı, ikisi mi?

**Araştırılacak / kararlaştırılacak:**
- Kozmetik veri modeli (config'te tema/eşya listesi; uygulanınca material/mesh değişir).
- Satın alma para birimi + fiyat eğrisi; kozmetiklerin oynanışa etkisi YOK (yalnız görsel) mu,
  yoksa hafif itibar/talep bonusu mu (etik: pay-to-win değil)?
- Monetizasyon kuralları (CLAUDE.md): gerçek parayla loot-box YOK; kozmetik etik kalsın.

---

## 7. TAM DENGE GEÇİŞİ (her sayı gözden geçirilecek)

**Kullanıcı ne istiyor — "her şey düşünülmeli":**
- Progression bar / genel tasarım / zone yerleşimi / üst kata çıkış.
- Garson hızı, bulaşıkçı hızı ve zamanı.
- Çay ne kadar olmalı (fiyat).
- **Her yükseltme neyi ne kadar etkilemeli** — net sayısal etki.

**Mevcut anahtar sayılar (başlangıç noktası — hepsi gözden geçirilecek):**
- Çay: `baseBrewTime 6`, `basePrice 5` (sabit; throughput büyür, fiyat değil — D-010).
- Çay ocağı yük.: `costBase 20`, `costGrowth 1.5`, `outputMult 1.35`, L5 `💎15`/×2.0.
- Masa yük. (masa-başı): `costBase 60`, `costGrowth 1.8` → L1-4 60/108/194/349; `tipBase 2`,
  `patiencePerLevel 2`.
- NPC: `spawnInterval 1.6`, `patience 18`, `maxConcurrent 8`, `eatTime 4`.
- Servis: `trayCapacity 4` (paylaşımlı), `pickup/serveRadius 1.6`.
- Garson: `moveSpeedByLevel [1.8, 2.3]`, `trayCapacity 1`, `upgradeCost 250`.
- Bulaşıkçı: `moveSpeed 1.8`, `carryCapacity 2`.
- Bardak: `poolBase 10`, `poolPerLevel 2`, `dirtyThreshold 2`.
- Offline: `baseCapHours 1`, `rateMult 0.5`.
- Pad maliyetleri: table2 25 / waiter 150 / table3 130 / dishwasher 330 / table4 420.

**Araştırılacak / kararlaştırılacak:**
- `tools/simulate.ts` ile tempo doğrula: ilk alım <90sn, ilk 5-10dk her ~20-40sn alım,
  otomasyon <15dk, zone ~1sa+ aktif (mevcut hedefler — zone/quest modeline göre güncelle).
- Her yükseltme için "neyi ne kadar" tablosu (etki şeffaflığı): masa seviyesi → bahşiş+sabır;
  ocak → throughput+kuyruk+bardak; garson/bulaşıkçı → servis/temizlik throughput'u.
- Progression bar tasarımı: oyuncuya "şu an buradasın / sıradaki hedef" görünür ilerleme.

---

## 8. Çıktı beklentisi (sonraki oturum sonunda)
- Her başlıkta: kullanıcı-onaylı KARAR + (onaylandıysa) `economy.config.ts`/kod/docs güncellemesi.
- Yeni/又 güncellenen dokümanlar: zone mimarisi, görev/quest sistemi, görsel-evrim & kozmetik
  mağaza, denge tablosu. `decisions.md`'ye D-numaralı kararlar.
- `simulate.ts` + Vitest + Playwright duman yeşil; `oturum-bitir` ile commit+push.

## Referans oyunlar (araştırma için)
My Hotel (Hutch) · Idle Restaurant/Cafe Tycoon · Idle Miner Tycoon (kapasite dengesi) ·
Restaurant Tycoon 2/3 (Roblox) · genel idle progression matematiği (Pecorella/Kongregate).

## İlgili skill'ler
`microcopy-tr` (TR UX metin), `impeccable` / `frontend-design` / `emil-design-eng` (UI/juice),
`e2e` / `playwright-cli` (duman testi), `frontend:react-patterns` (perf), `graphify`
(quest/yükseltme ağacı görseli), `simplify` (kod sadeleştirme).
