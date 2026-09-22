/**
 * olcum-izdiham-t6.ts — T6: KAPI ÖNÜNDEKİ İZDİHAM ve KARE SÜRÜKLENMESİ (G-91).
 *
 * ## Soru
 * Kullanıcı: *"girişte bir süre sonra kapı dışında izdiham oluyor, içeri girmeye çalışan
 * 100lerce npc birikiyor."* T5b'nin kısıksız tam koşusu aynı şeyi bağımsız olarak ölçtü:
 * dünya 240 sn ısıtılmış olmasına rağmen **2 dakikada** üçgen +%80, kare işi +%31,
 * NPC **39 → 56** — üstelik T4 §C'nin ölçtüğü tavan 39'du ve tırmanış sürüyordu.
 *
 * ## BU ARACIN İLK İŞİ KOLLARI ÖLÇMEK DEĞİL
 * Önce **büyümenin bu ortamda yeniden üretilip üretilemediği** sınanır. T4 §B sürüklenmeyi
 * ölçüp DÜZ bulmuştu (%0,5); T5b aynı dünyada +%31 gördü. İki ölçüm çelişiyorsa üçüncü bir
 * ölçüm eklemeden önce hangisinin neyi ölçtüğü anlaşılmalı. **Büyüme burada çıkmazsa kollar
 * burada ölçülemez** ve tur tarayıcıya taşınır — bu bir başarısızlık değil, aracın kapsamının
 * dürüst sınırıdır (T5b'nin dersi: node ile tarayıcı farklı şeyler ölçebilir).
 *
 * ## Yapısal şüpheli (kodda doğrulandı, ölçülmedi)
 * `tick.ts:389` doğma tavanını yalnız `!hasLeftTable` olan NPC'lere uyguluyor.
 * `hasLeftTable` (`rules.ts:325`) şunları SAYMIYOR: `leaving` · `toWc` · `wcGiris` · `inWc` ·
 * `wcCikis`. Yani oturan/gelen nüfusun tavanı var, **ekrandaki TOPLAM nüfusun yok**.
 *
 * ## Piyasa standardı (araştırıldı — `docs/geribildirim-oyun-testi-2026-09-21.md` §G)
 * Restaurant Tycoon 2/3 müşteriyi ORANLA değil KAPASİTEYLE doğuruyor ("uygun masa yoksa hiç
 * doğma"). Kuramı Little yasası `N = λ × W`: `λ` sabitken `W` sıkışmayla büyürse `N` sınırsız
 * büyür. Kodumuz bunu zaten yapmaya çalışıyor; kusur tasarımda değil KAPSAMDA.
 *
 * ## D-140'tan sonra (commit #2)
 * S1 kalıcı oldu (`AYRISMASIZ`'a `leaving`), yani `null` kol artık S1'dir ve eski S0 bu araçla
 * üretilemez — onun sayısı `docs/olcum-izdiham-t6.txt`in commit #1 hâlinde (git). Damgalar
 * ters döndü: taban artık BÜYÜMEMELİ ve commit #1'deki S1 satırını birebir vermeli.
 *
 * Koşu:  npx tsx tools/olcum-izdiham-t6.ts             (kısa)
 *        OLCUM=tam npx tsx tools/olcum-izdiham-t6.ts   (tam — rapora yalnız bu girer)
 */
import { KIP, KISA, kipBandi, damga, damgaOzeti, seedRandom } from './olcum-lib';
import { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import { izdihamKoluAyarla, type IzdihamKolu } from '../src/game/tick';
import { D } from '../src/game/decimal';
import { economyConfig } from '../src/config/economy.config';
import type { NpcState } from '../src/game/types';

const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const tr = (n: number) => Math.round(n).toLocaleString('tr-TR');

const DT = 1 / 60;
const ISINMA_SN = KISA ? 120 : 240;
/**
 * Kayıt süresi. T5b'nin penceresi 2 dk'ydı ve tırmanış bitmemişti — burada çok daha uzun.
 *
 * TAM koşu neden 1800 DEĞİL 600: korunum denetiminin gücü servis OLAY SAYISINDAN gelir
 * (~6,5/dk), yani 600 sn × 3 tohum = ~195 olay/kol — kısa koşunun (34) beş katı. Daha uzun
 * pencere gücü artırmıyor ama S0'ı boğuyor: `npcAyristir` O(n²) ve taban kolunda nüfus
 * serbestçe büyüdüğü için maliyet karesel artıyor (turun kendi bulgusu, §2.4). 600 sn,
 * gücün doyduğu ve tabanın hâlâ koşabildiği yer.
 */
const KAYIT_SN = KISA ? 300 : 600;
const ORNEK_SN = KISA ? 10 : 30;

/**
 * Geç oyun: tüm pad'ler açık, masalar tavanda, **OCAK TAVANDA**, görev hattı bitmiş, oyuncu parkta.
 *
 * ## `stationLevels` NEDEN BURADA — devralınan kurulumun sessiz kusuru
 * Bu fonksiyon `tools/olcum-nav-t5.ts`ten devralındı ve orada `stationLevels`e HİÇ dokunulmuyor.
 * Pad listesi servis merdivenini taşımaz (tezgâh/tost `stationLevel` GÖREVLERİYLE gelir), yani
 * "tüm pad'ler açık" kurulumu **20 masaya seviye-0 ocak** demek oluyordu. Sonucu ölçüldü:
 * temiz bardak havuzu 30 (3 alan × poolBase 10) ve koşu boyunca **0-2'de** kalıyor, hazır çay
 * **0**, `drinking` **0** — yani ölçülen dünyada hiç kimse servis edilmiyor ve her müşteri
 * sabrı dolup `leaving`e düşüyor. Bu bir oyun kusuru değil, **kurulum kusuru**.
 *
 * Önemi kapsamı aşıyor: aynı kurulum T5/T5b'nin korpusunu da üretti ve tarayıcı aracının
 * `dunyaKur`u da `stationLevels` yazmıyor. O turların ölçtüğü şey geçersiz değil (nav maliyeti
 * ızgaraya ve mesafeye bağlı, servis zincirine değil) ama **dünyanın ne olduğu yanlış
 * biliniyordu**. Kayda geçti: `docs/izdiham-raporu-t6.md` §1.
 */
function gecOyunKur(isinmaSn: number, tohum = 20260921): void {
  seedRandom(tohum);
  useGame.getState().hardReset();
  useGame.setState({
    padsDone: economyConfig.pads.map((p) => p.id),
    wallet: D(1e12),
    diamonds: D(1e6),
    questIndex: economyConfig.quests.length,
  } as never);
  const s0 = useGame.getState();
  useGame.setState({
    tableLevels: s0.tableLevels.map(() => 4),
    // Görev hattı bitmişse `q_stationMax` da bitmiştir: ocak tavanda.
    stationLevels: s0.stationLevels.map(() => stationSoftMaxLevel()),
    cleanCups: totalCupPool(s0.areasOpen, s0.stationLevels.map(() => stationSoftMaxLevel())),
  } as never);
  const s1 = useGame.getState();
  useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) } as never);
  const tick = useGame.getState().tick;
  for (let i = 0; i < Math.round(isinmaSn / DT); i++) tick(dtOf(i));
}
/** Sabit adım; ayrı fonksiyon olması yalnız okunurluk için (dt hiç değişmiyor). */
const dtOf = (_i: number) => DT;

/** Durum dökümü — hangi durumda kaç NPC var. İzdiham bir TOPLAM değil, bir DAĞILIM sorusudur. */
const DURUMLAR: NpcState[] = [
  'toTable', 'waitingForTea', 'drinking', 'toWc', 'wcGiris', 'inWc', 'wcCikis', 'leaving',
];

interface Ornek {
  sn: number;
  toplam: number;
  /** Tavanın SAYDIĞI nüfus (`!hasLeftTable`) — bugünkü kelepçenin gördüğü sayı. */
  sayilan: number;
  /** Tavanın SAYMADIĞI nüfus (leaving + WC) — kelepçenin görmediği sayı. */
  sayilmayan: number;
  durum: Record<string, number>;
  /** Kapı kuşağındaki NPC (z > 14) — kullanıcının "kapı dışında izdiham" dediği yer. */
  kapida: number;
  /** Kümülatif kazanç (₺) — korunum denetimi bunun eğiminden okunur. */
  kazanc: number;
  servis: number;
  /** SERVİS ZİNCİRİ — izdiham bir sonuç olabilir; sebebi zincirin tıkanması olabilir. */
  temizBardak: number;
  hazirCay: number;
  kirliMasa: number;
  garsonDurum: Record<string, number>;
  /** Şimdiye kadar DOĞAN toplam (nextId) — silinen = doğan − sahnedeki. */
  dogan: number;
  /** `leaving` NPC'lerin z dağılımı: çıkış hattının NERESİNDE takılıyorlar. */
  leavingZ: { salonda: number; kapiOnu: number; esikte: number; sokakta: number };
  /** Bu örnekte hâlâ sahnede olan, bir ÖNCEKİ örnekte de `leaving` olan NPC sayısı. */
  kalici: number;
}

function kosuOlc(kayitSn: number): Ornek[] {
  const tick = useGame.getState().tick;
  const kare = Math.round(kayitSn / DT);
  const ornekKare = Math.round(ORNEK_SN / DT);
  const ornekler: Ornek[] = [];
  let oncekiLeaving = new Set<number>();
  const bas = Number(useGame.getState().wallet.toString());
  for (let i = 0; i <= kare; i++) {
    if (i % ornekKare === 0) {
      const s = useGame.getState();
      const durum: Record<string, number> = {};
      for (const d of DURUMLAR) durum[d] = 0;
      let sayilan = 0, kapida = 0;
      for (const n of s.npcs) {
        durum[n.state] = (durum[n.state] ?? 0) + 1;
        // `hasLeftTable` ile AYNI küme — burada elle yazılmıyor, kuralın kendisi okunuyor olsun
        // diye aşağıda `SAYILMAYAN` sabitiyle karşılaştırılıyor.
        if (!SAYILMAYAN.has(n.state)) sayilan++;
        if (n.pos[2] > 14) kapida++;
      }
      // Garsonun "durumu" yok (tip: pos · claim · tray · trayFood · dirtyCarry). İşi bunlardan okunur.
      const gd: Record<string, number> = { ustlenen: 0, tepsiCay: 0, kirliTasiyan: 0 };
      for (const w of s.waiters) {
        if (w.claim !== undefined) gd.ustlenen++;
        gd.tepsiCay += w.tray;
        if ((w.dirtyCarry ?? 0) + (w.dirtyCarryFood ?? 0) > 0) gd.kirliTasiyan++;
      }
      /* ÇIKIŞ HATTININ HARİTASI — "yavaş" ile "takılmış"ı ayıran tek ölçü.
       * Kapı z = 16,6 · sokak z = 20,5. Hat: salon (z<14) → kapı önü (14..16,4) →
       * eşik (16,4..20) → sokak (>20, orada silinir). Yığılma hangi bantta olursa
       * sebep de orası olur. */
      const lz = { salonda: 0, kapiOnu: 0, esikte: 0, sokakta: 0 };
      const simdikiLeaving = new Set<number>();
      for (const n of s.npcs) {
        if (n.state !== 'leaving') continue;
        simdikiLeaving.add(n.id);
        const z = n.pos[2];
        if (z < 14) lz.salonda++;
        else if (z < 16.4) lz.kapiOnu++;
        else if (z < 20) lz.esikte++;
        else lz.sokakta++;
      }
      let kalici = 0;
      for (const id of simdikiLeaving) if (oncekiLeaving.has(id)) kalici++;
      oncekiLeaving = simdikiLeaving;
      ornekler.push({
        dogan: s.nextId ?? -1,
        leavingZ: lz,
        kalici,
        temizBardak: s.cleanCups,
        hazirCay: s.ready?.tea ?? -1,
        kirliMasa: s.dirty?.size ?? -1,
        garsonDurum: gd,
        sn: i * DT,
        toplam: s.npcs.length,
        sayilan,
        sayilmayan: s.npcs.length - sayilan,
        durum,
        kapida,
        kazanc: Number(s.wallet.toString()) - bas,
        servis: (s.stats?.waiterServed ?? 0) + (s.stats?.teasServed ?? 0),
      });
    }
    tick(DT);
  }
  return ornekler;
}

/** `rules.ts:325`in kümesi — araç kendi kopyasını tutuyor VE bekçisi aşağıda damgalıyor. */
const SAYILMAYAN = new Set<NpcState>(['leaving', 'toWc', 'wcGiris', 'inWc', 'wcCikis']);

// ===========================================================================
// KOŞU
// ===========================================================================
kipBandi();
console.log('=== T6 — IZDIHAM: buyume bu ortamda yeniden uretilebiliyor mu? ===');
console.log(`kip ${KIP} · isinma ${ISINMA_SN} sn · kayit ${KAYIT_SN} sn · ornek ${ORNEK_SN} sn`);
console.log('');

gecOyunKur(ISINMA_SN);
const s = useGame.getState();
console.log(`dunya: ${s.tables} masa · ${s.areasOpen} alan · ${s.npcs.length} NPC (isinma sonu)`);
console.log('');

const o = kosuOlc(KAYIT_SN);
const ilk = o[0];
const son = o[o.length - 1];

console.log('--- §A NUFUS EGRISI ---');
console.log('   sn | toplam | sayilan | sayilmayan | kapida | toTable | bekleyen | icen | leaving |   ₺/dk');
let oncekiKazanc = 0, oncekiSn = 0;
for (const x of o) {
  const dk = (x.sn - oncekiSn) / 60;
  const hiz = dk > 0 ? (x.kazanc - oncekiKazanc) / dk : 0;
  oncekiKazanc = x.kazanc; oncekiSn = x.sn;
  console.log(
    `${String(Math.round(x.sn)).padStart(5)} | ${String(x.toplam).padStart(6)} | ${String(x.sayilan).padStart(7)}`
    + ` | ${String(x.sayilmayan).padStart(10)} | ${String(x.kapida).padStart(6)}`
    + ` | ${String(x.durum.toTable).padStart(7)} | ${String(x.durum.waitingForTea).padStart(8)}`
    + ` | ${String(x.durum.drinking).padStart(4)} | ${String(x.durum.leaving).padStart(7)}`
    + ` | ${tr(hiz).padStart(8)}`,
  );
}
console.log('');

console.log('--- §A2 SERVIS ZINCIRI (izdiham sonuc mu, sebep mi) ---');
console.log('   sn | temiz bardak | hazir cay | kirli masa | garson durumlari');
for (const x of o) {
  console.log(
    `${String(Math.round(x.sn)).padStart(5)} | ${String(x.temizBardak).padStart(12)}`
    + ` | ${String(x.hazirCay).padStart(9)} | ${String(x.kirliMasa).padStart(10)}`
    + ` | ${Object.entries(x.garsonDurum).map(([k, v]) => k + ':' + v).join(' ')}`,
  );
}
console.log('');

console.log('--- §A3 CIKIS HATTI — "yavas" mi "takilmis" mi ---');
console.log('   sn | leaving | salonda | kapi onu | esikte | sokakta | onceki ornekten KALAN | silinen/dk');
let oncDogan = o[0].dogan, oncToplam = o[0].toplam, oncSn2 = o[0].sn;
for (const x of o) {
  const dk = (x.sn - oncSn2) / 60;
  const silinen = dk > 0 ? ((x.dogan - oncDogan) - (x.toplam - oncToplam)) / dk : 0;
  oncDogan = x.dogan; oncToplam = x.toplam; oncSn2 = x.sn;
  console.log(
    `${String(Math.round(x.sn)).padStart(5)} | ${String(x.durum.leaving).padStart(7)}`
    + ` | ${String(x.leavingZ.salonda).padStart(7)} | ${String(x.leavingZ.kapiOnu).padStart(8)}`
    + ` | ${String(x.leavingZ.esikte).padStart(6)} | ${String(x.leavingZ.sokakta).padStart(7)}`
    + ` | ${String(x.kalici).padStart(21)} | ${tr(silinen).padStart(10)}`,
  );
}
console.log('');

console.log('--- §B BUYUME ---');
const buyume = (a: number, b: number) => (a === 0 ? '—' : `${a} → ${b} (${b >= a ? '+' : ''}%${f1(((b - a) / a) * 100)})`);
console.log(`  toplam NPC   : ${buyume(ilk.toplam, son.toplam)}`);
console.log(`  sayilan      : ${buyume(ilk.sayilan, son.sayilan)}   ← tavanin GORDUGU nufus`);
console.log(`  SAYILMAYAN   : ${buyume(ilk.sayilmayan, son.sayilmayan)}   ← tavanin GORMEDIGI nufus`);
console.log(`  kapi kusagi  : ${buyume(ilk.kapida, son.kapida)}`);
console.log(`  leaving      : ${buyume(ilk.durum.leaving, son.durum.leaving)}`);
console.log('');

// Tavanı hesapla: `tick.ts` ile aynı formül (koltuk + 2, taban 8).
const st = useGame.getState();
let koltuk = 0;
for (let i = 0; i < st.tables; i++) koltuk += st.tableLevels[i] !== undefined ? 0 : 0;
console.log('--- §C TAVAN ---');
console.log(`  C.npc.maxConcurrent (taban) : ${economyConfig.npc.maxConcurrent}`);
console.log(`  olculen en yuksek 'sayilan' : ${Math.max(...o.map((x) => x.sayilan))}`);
console.log(`  olculen en yuksek TOPLAM    : ${Math.max(...o.map((x) => x.toplam))}`);
console.log('');

console.log('--- §D KORUNUM (kollar bunu DUSURMEMELI) ---');
const toplamDk = (son.sn - ilk.sn) / 60;
const gelirDk = toplamDk > 0 ? (son.kazanc - ilk.kazanc) / toplamDk : 0;
console.log(`  gelir        : ${tr(gelirDk)} ₺/dk (${tr(son.kazanc)} ₺ / ${f1(toplamDk)} dk)`);
console.log(`  servis       : ${son.servis < 0 ? 'olculemedi' : tr(son.servis)}`);
console.log('');

console.log('--- DAMGALAR ---');
damga('dunya gec-oyun', st.tables >= 12, `${st.tables} masa · ${st.areasOpen} alan`);
damga('kosu kayit aldi', o.length >= 5, `${o.length} ornek`);
damga('NPC akiyor (bot canli)', son.servis !== 0, `servis ${son.servis}`);
const artis = ilk.toplam === 0 ? 0 : ((son.toplam - ilk.toplam) / ilk.toplam) * 100;
damga('izdiham YOK (D-140 uygulandi)', artis < 15, `toplam NPC %${f1(artis)}`);
damga('gelir olculdu', gelirDk > 0, `${tr(gelirDk)} ₺/dk`);
damgaOzeti();

// ===========================================================================
// §E KOLLAR — hepsi AYNI tohumda, AYNI dünyada, aynı süreyle
// ===========================================================================
/*
 * VARYANT KAPISI: kollar `tick.ts`e dokunuyor, o yüzden hiçbiri dosyaya YAZILMADAN ölçülür
 * (`izdihamKoluAyarla` çalışma anında takar ve geri alır). Rapora giren sayı budur; kod
 * yalnız kullanıcının seçtiği kola yazılır.
 *
 * KORUNUM ŞARTI: hiçbir kol ₺/dk'yı düşürmemeli. İzdihamı "doğmayı kısarak" çözmek kolaydır
 * ama o, oyunu yavaşlatmaktır — S4 tam olarak bu riski taşır ve tablo onu görünür kılacak.
 */
const yok: IzdihamKolu = { cikisDagitimi: 0, silmeYariCapi: 0, tavanTumNufusa: false };
const KOLLAR: { ad: string; not: string; kol: IzdihamKolu | null }[] = [
  { ad: 'S1 taban (D-140)', not: 'uygulanan hal = commit #1 S1 satiri', kol: null },
  { ad: 'S1 + S2 dagitim 0,6', not: 'eski S2, artik kokun ustune', kol: { ...yok, cikisDagitimi: 0.6 } },
  { ad: 'S1 + S3 (= eski S6)', not: 'yaricap kok varken tetikleniyor mu', kol: { ...yok, silmeYariCapi: 0.8 } },
  { ad: 'S1 + S4 (= eski S5)', not: 'emniyet kemeri — C kolunun olcum tabani', kol: { ...yok, tavanTumNufusa: true } },
];

interface KolSonuc {
  ad: string; not: string;
  /** Tohum başına ölçüm — tek tohumun gürültüsü karar kolunu seçmesin. */
  tohumlar: { ilk: number; son: number; artis: number; leaving: number; kapida: number; servisDk: number; gelirDk: number }[];
  artis: number; leaving: number; kapida: number; servisDk: number; gelirDk: number; enYuksek: number;
}

/*
 * İKİ TOHUM — ve bu bir özen değil ZORUNLULUK.
 *
 * İlk koşuda korunum ₺ üstünden okundu ve BEŞ kolda birden kırıldı (−%10 … −%60). Sonra ölçümün
 * kendi gücü sınandı: 2 dakikada **15 servis / 52 ₺**. Yani 5 dakikalık ₺ toplamı bir avuç
 * ödemeden ibaret — %10'luk bir "düşüş" tek bir ödemenin oraya değil buraya düşmesi demek.
 * Korunum artık SERVİS sayacından okunuyor (yüzlerce olay) ve her kol iki tohumda koşuyor:
 * tohumlar arasındaki yayılım, kolun etkisinin ölçülebilir olup olmadığını kendisi söyler.
 */
const TOHUMLAR = KISA ? [20260921, 20260922] : [20260921, 20260922, 20260923];

/*
 * İLERLEME ÇIKTISI — araç kusuruydu, koşarken yaşandı ve düzeltildi.
 *
 * İlk tam koşuda kol döngüsü **21 koşunun hepsi bitene kadar tek satır yazmadı**; 37 dakika
 * sonra "ne kadar kaldı" sorusuna araç cevap veremedi. Uzun koşan bir ölçüm aracının ilerlemesi
 * gözlenebilir olmalı — hele maliyeti ölçtüğü kusura bağlıysa (taban kolu O(n²) yüzünden
 * diğerlerinin ~7 katı sürüyor). Satır `stderr`e yazılır: `> dosya` ile yönlendirilen ham
 * çıktıya karışmaz.
 */
const t0 = Date.now();
const gecen = () => `${Math.floor((Date.now() - t0) / 60000)}:${String(Math.floor(((Date.now() - t0) % 60000) / 1000)).padStart(2, '0')}`;
const toplamKosu = KOLLAR.length * TOHUMLAR.length;
let kosuNo = 0;

const sonuclar: KolSonuc[] = [];
for (const k of KOLLAR) {
  const t: KolSonuc['tohumlar'] = [];
  for (const tohum of TOHUMLAR) {
    kosuNo++;
    process.stderr.write(`  [${gecen()}] ${String(kosuNo).padStart(2)}/${toplamKosu} ${k.ad} · tohum ${tohum} ...`);
    izdihamKoluAyarla(k.kol);
    gecOyunKur(ISINMA_SN, tohum);
    const kk = kosuOlc(KAYIT_SN);
    const a = kk[0], b = kk[kk.length - 1];
    const dk = (b.sn - a.sn) / 60;
    process.stderr.write(` NPC ${b.toplam} · servis/dk ${((b.servis - a.servis) / ((b.sn - a.sn) / 60)).toFixed(1)}
`);
    t.push({
      ilk: a.toplam, son: b.toplam,
      artis: a.toplam === 0 ? 0 : ((b.toplam - a.toplam) / a.toplam) * 100,
      leaving: b.durum.leaving, kapida: b.kapida,
      servisDk: dk > 0 ? (b.servis - a.servis) / dk : 0,
      gelirDk: dk > 0 ? (b.kazanc - a.kazanc) / dk : 0,
    });
  }
  const ort = (f: (x: KolSonuc['tohumlar'][0]) => number) => t.reduce((x, y) => x + f(y), 0) / t.length;
  sonuclar.push({
    ad: k.ad, not: k.not, tohumlar: t,
    artis: ort((x) => x.artis), leaving: ort((x) => x.leaving), kapida: ort((x) => x.kapida),
    servisDk: ort((x) => x.servisDk), gelirDk: ort((x) => x.gelirDk),
    enYuksek: Math.max(...t.map((x) => x.son)),
  });
}
izdihamKoluAyarla(null);

console.log('');
console.log(`--- §E KOLLAR (${TOHUMLAR.length} tohum · ${KAYIT_SN} sn · ortalama) ---`);
console.log('  kol                    | NPC son |  artis  | leaving | kapida | servis/dk | korunum | ₺/dk');
const taban = sonuclar[0];
for (const r of sonuclar) {
  const kor = taban.servisDk === 0 ? '—' : `%${f1(((r.servisDk - taban.servisDk) / taban.servisDk) * 100)}`;
  console.log(
    `  ${r.ad.padEnd(22)} | ${f1(ortSon(r)).padStart(7)}`
    + ` | ${((r.artis >= 0 ? '+' : '') + f1(r.artis) + '%').padStart(8)}`
    + ` | ${f1(r.leaving).padStart(7)} | ${f1(r.kapida).padStart(6)}`
    + ` | ${f1(r.servisDk).padStart(9)} | ${kor.padStart(7)} | ${tr(r.gelirDk).padStart(5)}`,
  );
}
function ortSon(r: KolSonuc) { return r.tohumlar.reduce((a, b) => a + b.son, 0) / r.tohumlar.length; }
console.log('');
console.log('  TOHUM YAYILIMI (ayni kol, farkli tohum — gurultunun buyuklugu)');
console.log('  kol                    | ' + TOHUMLAR.map((t) => `NPC/servis (${t})`).join(' | '));
for (const r of sonuclar) {
  console.log(`  ${r.ad.padEnd(22)} | ` + r.tohumlar.map((x) => `${String(x.son).padStart(3)} / ${f1(x.servisDk).padStart(4)}`.padEnd(17)).join(' | '));
}
console.log('');
for (const r of sonuclar) console.log(`  ${r.ad.padEnd(22)} — ${r.not}`);
console.log('');

console.log('--- KOL DAMGALARI ---');
damga('taban duz (izdiham kapandi)', taban.artis < 15, `%${f1(taban.artis)}`);
/*
 * BİREBİR DENETİMİ: uygulama, ölçülen kolun AYNISI olmalı. Commit #1'in tam koşusunda S1
 * satırı NPC son 59,3 · servis 6,3/dk idi. Koşu tohumlu → sapma = uygulama ölçülenden farklı.
 */
if (!KISA) {
  const npcSon = ortSon(taban);
  damga('taban = commit #1 S1 satiri (birebir)',
    Math.abs(npcSon - 59.3) < 0.05 && Math.abs(taban.servisDk - 6.3) < 0.05,
    `NPC ${f1(npcSon)} (59,3) · servis ${f1(taban.servisDk)} (6,3)`);
}
damga('taban servis uretiyor (sayim guclu)', taban.servisDk >= 5, `${f1(taban.servisDk)} servis/dk`);
for (const r of sonuclar.slice(1)) {
  const kor = taban.servisDk === 0 ? 0 : ((r.servisDk - taban.servisDk) / taban.servisDk) * 100;
  damga(`${r.ad}: servis korundu`, kor >= -10, `%${f1(kor)} (${f1(r.servisDk)}/dk)`);
}
damgaOzeti();
