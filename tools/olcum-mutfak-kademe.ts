/**
 * olcum-mutfak-kademe.ts — S22 ÖLÇÜM: mutfak seviyeyle nasıl büyür?
 *
 * NEREDEN GELDİ: S20 ölçümünün §K bulgusu (`docs/mutfak-raporu-s20.md`): servis noktası
 * **6 kademe** çıkarken mutfak odası her seviyede aynı **19 sabit** üniteyi çiziyor,
 * `KitchenUnit`'te seviye alanı **0**, `Kitchen.tsx`in seviye okuması **0**. D-118 bu kolu
 * (D2) bu tura erteledi ve kullanıcının kuralını da yazdı: *"önce ilerleme adımlarını
 * tasarla — objeler küçük doğup yerinde büyür."*
 *
 * KESİCİ SAYI — S7/D-104'ün WC kuralı burada da geçerli: *"her seviye TAM BİR ŞEYİ büyütür;
 * hiçbir yükseltme 'ekranda hiçbir şey değişmedi' hissi bırakmaz."* Yani bir kolu eleyen
 * şey güzelliği değil, **bir basamağının deltasının %0 görünür olması**.
 *
 * YEDİ KOL, hepsi VARYANT olarak ölçülür (kod yazılmadan — D-084 varyant kapısı):
 *   K0  taban            19 sabit ünite, seviye okuması 0  (bugünkü hâl)
 *   K1  AÇILIM           ünite SAYISI seviyeyle artar; bugünkü oda = L6, L1'de seyrek
 *   K2  TADİLAT          19 ünite HEP çizilir; kilitliler tahta perde hâlinde durur
 *                        (`feedback_locked_object_renovation`)
 *   K3  YERİNDE BÜYÜME   ünite sayısı sabit; üniteler paketin KENDİ kademe ailesiyle
 *                        (stove_single → stove_multi → …) yerinde büyür — her gövde kendi
 *                        zincirini yayar
 *   K3b YERİNDE BÜYÜME   aynı malzeme, geçişler havuzlanıp basamaklara EŞİT dağıtılır
 *   K4  YERİNDE BÜYÜME   aynı malzeme, geçişler basamakların BEDEL PAYINA orantılı dağıtılır
 *   K5  KARMA            erken basamak takas, geç (pahalı) basamakta ADADA yeni gövde doğar
 * Ayrıca §Y: büyüme NEREDE olur — arka hatta mı (Y0), odanın %42'lik boşluğundaki adada mı (Y1).
 *
 * GÖRÜNÜRLÜK YÖNTEMİ S6 + S7 + S20 ile BİREBİR aynı (kadraj + ışın–kutu slab örtmesi); sayılar
 * S20 raporuyla kıyaslanabilsin diye tek satırı bile değiştirilmedi.
 *
 * Bu araç HİÇBİR ŞEYİ DEĞİŞTİRMEZ; ölçer ve `docs/olcum-mutfak-kademe.txt` üretir.
 * Kullanım: npx tsx tools/olcum-mutfak-kademe.ts                                       (kısa)
 *           OLCUM=tam npx tsx tools/olcum-mutfak-kademe.ts > docs/olcum-mutfak-kademe.txt
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { CAMERA_LOOK_Y, PLAYER_RADIUS } from '../src/config/actor';
import { CAMERA_DIST, CAMERA_FOV } from '../src/config/camera';
import { BAND, WAITER_STATION, servicePlace } from '../src/game/layout';
import { economyConfig } from '../src/config/economy.config';
import {
  COUNTER_TOP_Y, FAYANS, FRONT_TOP_Y, KITCHEN_S, KITCHEN_UNITS, LEFT_X, MODULE_W,
  NATIVE, RIGHT_X, modulX, unitBox, type KitchenUnit,
} from '../src/components/three/kitchenLook';
import { KIP, damga, damgaOzeti, kipBandi, pearson } from './olcum-lib';
import { bbox } from './model-olc.mjs';

const yaz = (s = '') => console.log(s);
const n2 = (v: number) => v.toFixed(2).padStart(7);
const yz = (v: number) => `${(v * 100).toFixed(0).padStart(4)}%`;
const cizgi = (n = 112) => yaz('='.repeat(n));

yaz('='.repeat(112));
yaz('S22 ÖLÇÜM — KADEMELİ MUTFAK: oda servis noktasının 6 kademesiyle nasıl büyür?');
yaz('='.repeat(112));
kipBandi();
yaz();

const ADIM = KIP === 'tam' ? 0.05 : 0.2;        // doluluk ızgarası
const ADIM_GOR = KIP === 'tam' ? 0.25 : 0.5;    // görünürlük örnekleme
const ADIM_OYUNCU = KIP === 'tam' ? 0.5 : 1.0;  // oyuncunun duruş noktaları
const PAKET = 'public/assets/models/kaykit-restaurant-bits/';

const ODA = { x0: FAYANS.x0, x1: FAYANS.x1, z0: FAYANS.z0, z1: FAYANS.z1 };
const ODA_ALAN = (ODA.x1 - ODA.x0) * (ODA.z1 - ODA.z0);

// =============================================================================================
// §L — SEVİYE MERDİVENİ (economy.config'ten; elle sayı yazılmaz)
// =============================================================================================
cizgi();
yaz('§L — SEVİYE MERDİVENİ: mutfağın bağlanacağı kademe kaç basamak, ne zaman çıkılıyor?');
cizgi();
yaz();
const SV = economyConfig.service;
const MAXL = SV.upgrade.maxLevel;
const MALIYET = SV.upgrade.costsByLevel as readonly number[];
yaz(`servis noktası maxLevel            ${MAXL}`);
yaz(`kademe maliyetleri (L1..L${MAXL})       ${MALIYET.join(' · ')} ₺`);
yaz(`kimlik dönüm noktaları             L${SV.counterLevel} TEZGÂH (ocak → tezgâh) · L${SV.tostLevel} TOST açılır`);
const toplamMaliyet = MALIYET.reduce((a, b) => a + b, 0);
const ilkUc = MALIYET.slice(0, 3).reduce((a, b) => a + b, 0);
yaz(`merdivenin toplam bedeli           ${toplamMaliyet} ₺`);
yaz(`ilk ÜÇ basamağın payı              ${ilkUc} ₺ = %${((100 * ilkUc) / toplamMaliyet).toFixed(2)}`);
yaz(`son BİR basamağın payı             ${MALIYET[MAXL - 1]} ₺ = %${((100 * MALIYET[MAXL - 1]) / toplamMaliyet).toFixed(2)}`);
yaz();
yaz('  OKUMA: merdiven ASİMETRİK. İlk üç basamak toplam bedelin yüzde birkaçı — oyuncu onları');
yaz('         ilk dakikalarda çıkar; son üçü saatlere yayılır (rapor: tezgâh ~1,7 sa · tost');
yaz('         ~2,1 sa · L6 ~3,4 sa). Görsel kademe kalıbı bu asimetriye oturmalı: eşit');
yaz('         büyüklükte altı adım, ilk üçünü saniyeler içinde tüketip geri kalanı boşaltır.');
yaz();
damga('seviye merdiveni 6 basamak', MAXL === 6, `maxLevel ${MAXL}`);
damga('maliyet listesi tam', MALIYET.length === MAXL, `${MALIYET.length} girdi`);
damga('merdiven asimetrik', ilkUc / toplamMaliyet < 0.05, `ilk üç %${((100 * ilkUc) / toplamMaliyet).toFixed(1)}`);

// =============================================================================================
// §S — KAYNAK: paket "yerinde büyüme" taşıyabiliyor mu? (K3'ün varlık şartı)
// =============================================================================================
cizgi();
yaz('§S — KAYNAK ENVANTERİ: KayKit restaurant-bits kaç KADEME AİLESİ veriyor?');
cizgi();
yaz();
const modeller = readdirSync(PAKET).filter((f) => f.endsWith('.gltf')).map((f) => f.slice(0, -5)).sort();
yaz(`pakette model sayısı               ${modeller.length}`);

/**
 * KADEME AİLESİ — aynı gövdenin küçük/büyük/donanımlı sürümleri. Aile kökü, adın sonundaki
 * kademe ekleri soyularak bulunur; ek listesi PAKETİN KENDİ adlandırmasından çıkarıldı
 * (elle eşleştirme yok). Bir ailede ≥2 üye varsa o gövde YERİNDE büyüyebilir.
 */
const EKLER = ['_decorated', '_large', '_half', '_small', '_medium', '_countertop', '_backsplash', '_multi', '_single', '_plates'];
/**
 * EK İKİ BOYUTLU: bir ad hem ÖLÇEK hem DONANIM eki taşıyabilir (`stove_multi_decorated`).
 * Tek ek soyulursa aynı ailenin üyeleri ayrı köklere düşer ve zincir kısa görünür — ilk
 * koşuda ocak zinciri 5 yerine 2 çıktı. Bu yüzden ekler TÜKENENE KADAR soyulur.
 */
const OLCEK: Record<string, number> = { _small: 0, _single: 0, _half: 0, _medium: 1, _multi: 2, _large: 3 };
const DONANIM: Record<string, number> = { _countertop: 1, _backsplash: 1, _plates: 1, _decorated: 2 };
function kokAyir(ad: string): { kok: string; olcek: number; donanim: number } {
  let k = ad;
  let olcek = 1; // eksiz = "standart boy"
  let donanim = 0;
  let degisti = true;
  while (degisti) {
    degisti = false;
    for (const e of EKLER) {
      if (!k.endsWith(e) || k.length === e.length) continue;
      if (e in OLCEK) olcek = OLCEK[e];
      else donanim = Math.max(donanim, DONANIM[e] ?? 0);
      k = k.slice(0, -e.length);
      degisti = true;
      break;
    }
  }
  return { kok: k, olcek, donanim };
}
/** Bir modelin GERÇEK sınır kutusu — .gltf accessor'larından, tahmin yok. */
const bboxOnbellek = new Map<string, { mn: number[]; mx: number[]; boyut: number[] }>();
function bboxHam(ad: string) {
  if (!bboxOnbellek.has(ad)) bboxOnbellek.set(ad, bbox(`${PAKET}${ad}.gltf`) as { mn: number[]; mx: number[]; boyut: number[] });
  return bboxOnbellek.get(ad)!;
}
const ham = bboxHam;

const aileler = new Map<string, { ad: string; olcek: number; donanim: number }[]>();
for (const m of modeller) {
  const { kok, olcek, donanim } = kokAyir(m);
  if (!aileler.has(kok)) aileler.set(kok, []);
  aileler.get(kok)!.push({ ad: m, olcek, donanim });
}
// Sıra ÖNCE ölçek, SONRA donanım: gövde büyür, sonra üstü donanır.
for (const [, uyeler] of aileler) uyeler.sort((a, b) => (a.olcek - b.olcek) || (a.donanim - b.donanim));

/**
 * PARÇA SÜZGECİ — ad benzerliği "aynı ailedendir" demeye yetmiyor.
 *
 * `stove_single_countertop` adı ocağın bir kademesi gibi okunuyor ama model bağımsız bir
 * gövde DEĞİL: yüksekliği 0,278 ve tabanı y = 0,930'da, yani tezgâhın içine gömülen ocak
 * GÖZÜ. Zincire kademe diye girseydi oyunda ocak ortadan kalkıp havada ince bir plaka
 * kalırdı — ve sınır kutusu ölçen bir araç bunu asla yakalayamazdı, çünkü kutu geçerli.
 *
 * Türetilmiş kural (elle liste değil): bir üye, ailenin EN YÜKSEK üyesinin
 *   · yüksekliğinin %40'ından kısaysa VE
 *   · tabanı o yüksekliğin yarısından yukarıdaysa
 * o bir PARÇADIR, kademe değil. Kural duvar dolabını (h %50, ikisi de asılı) ve
 * bulaşıklığı (h %55) elemiyor; yalnız gömme gözleri eliyor.
 */
const PARCA_ORAN = 0.4;
let elenenParca = 0;
for (const [kok, uyeler] of aileler) {
  if (uyeler.length < 2) continue;
  const enYuksek = Math.max(...uyeler.map((u) => bboxHam(u.ad).boyut[1]));
  const kalan = uyeler.filter((u) => {
    const b = bboxHam(u.ad);
    const parca = b.boyut[1] < enYuksek * PARCA_ORAN && b.mn[1] > enYuksek * 0.5;
    if (parca) elenenParca++;
    return !parca;
  });
  aileler.set(kok, kalan);
}
const cokluAile = [...aileler.entries()].filter(([, u]) => u.length >= 2);
const enUzun = Math.max(...cokluAile.map(([, u]) => u.length));
yaz(`≥2 üyeli kademe ailesi             ${cokluAile.length}`);
yaz(`en uzun zincir                     ${enUzun} kademe`);
yaz();

/** Bugünkü ünitelerin KULLANDIĞI gövdeler — hangisinin ailesi var? */
const kullanilan = [...new Set(KITCHEN_UNITS.map((u) => u.key as string))].sort();
yaz('BUGÜNKÜ ÜNİTELERİN AİLESİ — "bu gövde yerinde büyüyebilir mi?"');
yaz('  ünite'.padEnd(40) + 'zincir (küçük → büyük)');
let ailesiOlan = 0;
const zincirler = new Map<string, string[]>();
for (const k of kullanilan) {
  const { kok } = kokAyir(k);
  const zincir = (aileler.get(kok) ?? []).map((x) => x.ad);
  if (zincir.length >= 2) ailesiOlan++;
  zincirler.set(k, zincir);
  yaz('  ' + k.padEnd(38) + (zincir.length >= 2 ? `${zincir.length}: ${zincir.join(' → ')}` : '1: — tek üye (yerinde büyüyemez)'));
}
yaz();
yaz(`bugünkü ${kullanilan.length} gövdenin ${ailesiOlan} tanesinin ailesi VAR.`);
yaz();
damga('paket kademe ailesi veriyor', cokluAile.length >= 10, `${cokluAile.length} aile`);
damga('en uzun zincir merdiveni taşır', enUzun >= 3, `${enUzun} kademe`);


yaz('ZİNCİRLERİN GERÇEK BÜYÜMESİ — ayak izi (ham birim; dünya için ×' + KITCHEN_S + ')');
yaz('  zincir'.padEnd(52) + 'en'.padStart(12) + 'derinlik'.padStart(12) + 'yükseklik'.padStart(12) + '  hacim');
const buyumeler: { ad: string; oran: number; siluet: boolean }[] = [];
for (const [k, z] of zincirler) {
  if (z.length < 2) continue;
  if (k === 'waterRack') continue; // paket karşılığı yok (elle çizili)
  const a = ham(z[0]);
  const b = ham(z[z.length - 1]);
  const hacimA = a.boyut[0] * a.boyut[1] * a.boyut[2];
  const hacimB = b.boyut[0] * b.boyut[1] * b.boyut[2];
  const oran = hacimB / hacimA;
  // SİLUET değişimi: en veya derinlik gözle okunur biçimde büyüyor mu (%5 eşik)?
  const siluet = b.boyut[0] > a.boyut[0] * 1.05 || b.boyut[2] > a.boyut[2] * 1.05 || b.boyut[1] > a.boyut[1] * 1.05;
  buyumeler.push({ ad: k, oran, siluet });
  yaz('  ' + `${z[0]} → ${z[z.length - 1]}`.slice(0, 50).padEnd(52)
    + `${a.boyut[0].toFixed(2)}→${b.boyut[0].toFixed(2)}`.padStart(12)
    + `${a.boyut[2].toFixed(2)}→${b.boyut[2].toFixed(2)}`.padStart(12)
    + `${a.boyut[1].toFixed(2)}→${b.boyut[1].toFixed(2)}`.padStart(12)
    + `  ×${oran.toFixed(2)}${siluet ? '  SİLUET' : '  detay'}`);
}
const siluetSayisi = buyumeler.filter((b) => b.siluet).length;
yaz();
yaz(`  OKUMA: ${buyumeler.length} zincirin ${siluetSayisi} tanesi SİLUET değiştiriyor (en/derinlik/yükseklik > %5);`);
yaz('         kalanı aynı kutuda DONANIM ekliyor (`_decorated` = üstüne eşya). İkisi de');
yaz('         "yerinde büyüme"dir ama gözle okunması farklıdır: biri uzaktan, biri yakından.');
yaz();

// =============================================================================================
// §G — GÖRÜNÜRLÜK MAKİNESİ (S6 + S7 + S20 ile birebir)
// =============================================================================================
const YARIM_DUSEY = (CAMERA_FOV * Math.PI) / 360;
const YARIM_YATAY = Math.atan(Math.tan(YARIM_DUSEY) * (16 / 9));

interface Kutu { x: number; y: number; z: number; w: number; h: number; d: number }
interface AABB { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }

const kutuya = (b: AABB): Kutu => ({
  x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, z: (b.minZ + b.maxZ) / 2,
  w: b.maxX - b.minX, h: b.maxY - b.minY, d: b.maxZ - b.minZ,
});

/** ÖN HAT — oyunun işleyen üç gövdesi. COLLISION kutularından türer. */
const SP = servicePlace(3);
const ON_HAT: Kutu[] = [
  { x: SP.station[0], y: FRONT_TOP_Y / 2, z: SP.station[2], w: SP.half[0] * 2, h: FRONT_TOP_Y, d: SP.half[1] * 2 },
  { x: WAITER_STATION.pos[0], y: FRONT_TOP_Y / 2, z: WAITER_STATION.pos[2], w: WAITER_STATION.half[0] * 2, h: FRONT_TOP_Y, d: WAITER_STATION.half[1] * 2 },
  { x: SP.dish[0], y: FRONT_TOP_Y / 2, z: SP.dish[2], w: SP.dishHalf[0] * 2, h: FRONT_TOP_Y, d: SP.dishHalf[1] * 2 },
];
const UNITE_KUTU: Kutu[] = KITCHEN_UNITS.map((u) => kutuya(unitBox(u)));
/** Örtenler: TABAN sahne (K0). Kollar kendi örtenlerini eklemez — kıyas tek zeminde kalsın. */
const ORTENLER = [...ON_HAT, ...UNITE_KUTU];

function kesisiyor(k: Kutu, o: number[], hedef: number[]): boolean {
  const d = [hedef[0] - o[0], hedef[1] - o[1], hedef[2] - o[2]];
  const o2 = [o[0] - k.x, o[1] - k.y, o[2] - k.z];
  const yari = [k.w / 2, k.h / 2, k.d / 2];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (Math.abs(o2[i]) > yari[i]) return false;
      continue;
    }
    let a = (-yari[i] - o2[i]) / d[i];
    let b = (yari[i] - o2[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}
const kameraKonum = (px: number, pz: number, d: number) => [px, d, pz + d];
function kadrajda(px: number, pz: number, P: number[], d: number): boolean {
  const C = kameraKonum(px, pz, d);
  const T = [px, CAMERA_LOOK_Y, pz];
  const f = [T[0] - C[0], T[1] - C[1], T[2] - C[2]];
  const fn = Math.hypot(...f);
  const fu = f.map((v) => v / fn);
  const v = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
  const ileri = v[0] * fu[0] + v[1] * fu[1] + v[2] * fu[2];
  if (ileri <= 0) return false;
  const r = [fu[2], 0, -fu[0]];
  const rn = Math.hypot(...r) || 1;
  const ru = r.map((x) => x / rn);
  const u = [ru[1] * fu[2] - ru[2] * fu[1], ru[2] * fu[0] - ru[0] * fu[2], ru[0] * fu[1] - ru[1] * fu[0]];
  const sag = v[0] * ru[0] + v[1] * ru[1] + v[2] * ru[2];
  const yuk = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  return Math.abs(Math.atan2(sag, ileri)) < YARIM_YATAY && Math.abs(Math.atan2(yuk, ileri)) < YARIM_DUSEY;
}
/**
 * ÖRTME — noktayı İÇİNDE bulunduran kutu örten sayılmaz.
 *
 * İlk koşuda bütün deltalar %0 çıktı ve sayı yalandı (S20 aynı odada 0/19 görünmez ölçmüştü):
 * ölçülen gövdenin kutusu `haric` olarak REFERANSLA eleniyordu, ama kol planları her çağrıda
 * YENİ kutu nesnesi üretiyor — referans hiç tutmadı, her gövde kendi kendini örttü. Kimlik
 * yerine GEOMETRİ: örnek noktası bir kutunun içindeyse o kutu o noktanın kendi gövdesidir.
 */
const icinde = (k: Kutu, P: number[]): boolean =>
  Math.abs(P[0] - k.x) <= k.w / 2 + 1e-6 && Math.abs(P[1] - k.y) <= k.h / 2 + 1e-6 && Math.abs(P[2] - k.z) <= k.d / 2 + 1e-6;
const ortulu = (px: number, pz: number, P: number[], haric: Kutu | null): boolean =>
  ORTENLER.some((k) => k !== haric && !icinde(k, P) && kesisiyor(k, kameraKonum(px, pz, CAMERA_DIST), P));

function durusNoktalari(): number[][] {
  const out: number[][] = [];
  for (let px = ODA.x0; px <= ODA.x1; px += ADIM_OYUNCU)
    for (let pz = BAND.front + 0.5; pz <= BAND.front + 4.5; pz += ADIM_OYUNCU) out.push([px, pz]);
  return out;
}
const DURUSLAR = durusNoktalari();

/** P noktası oyuncunun kaç duruşundan görünür? */
function gorunurOran(P: number[], haric: Kutu | null = null): number {
  let g = 0;
  for (const [px, pz] of DURUSLAR) if (kadrajda(px, pz, P, CAMERA_DIST) && !ortulu(px, pz, P, haric)) g++;
  return g / DURUSLAR.length;
}

/**
 * Bir GÖVDENİN görünürlüğü — kutusunun ön-üst yüzünden örneklenen noktaların EN İYİSİ.
 * Tek nokta yanıltır (bir köşe komşusunun arkasına düşebilir); gövde "ekranda var mı"
 * sorusunun cevabı o gövdenin HERHANGİ bir noktasının görülmesidir.
 */
function govdeGorunurluk(b: AABB): number {
  const k = kutuya(b);
  const xs = [b.minX + 0.05, (b.minX + b.maxX) / 2, b.maxX - 0.05];
  const ys = [b.maxY - 0.05, (b.minY + b.maxY) / 2];
  const zs = [b.maxZ - 0.05, (b.minZ + b.maxZ) / 2];
  let en = 0;
  for (const x of xs) for (const y of ys) for (const z of zs) en = Math.max(en, gorunurOran([x, y, z], k));
  return en;
}

cizgi();
yaz('§G — GÖRÜNÜRLÜK MAKİNESİ (S6/S7/S20 ile birebir aynı süzgeç)');
cizgi();
yaz();
yaz(`kamera oyuncunun +z'sinde (pz + ${n2(CAMERA_DIST)}), fov ${CAMERA_FOV}, bakış y ${CAMERA_LOOK_Y}`);
yaz(`örten gövde: ön hat ${ON_HAT.length} + oda ünitesi ${UNITE_KUTU.length} = ${ORTENLER.length}`);
yaz(`oyuncunun denenen duruşu: ${DURUSLAR.length} nokta · tarama adımı doluluk ${ADIM} · görünürlük ${ADIM_GOR}`);
yaz(`odanın kutusu: ${(ODA.x1 - ODA.x0).toFixed(2)} × ${(ODA.z1 - ODA.z0).toFixed(2)} = ${ODA_ALAN.toFixed(2)} br²`);
yaz();
damga('duruş kümesi dolu', DURUSLAR.length >= 20, `${DURUSLAR.length} duruş`);

// =============================================================================================
// §Y — BÜYÜMENİN YERİ: odanın boşluğu ne kadar, kaç modül alır, çaycının yolunu keser mi?
// =============================================================================================
cizgi();
yaz('§Y — BÜYÜMENİN YERİ: arka hatta mı (Y0), odanın boşluğundaki adada mı (Y1)?');
cizgi();
yaz();

/** Oda zemininin doluluk ızgarası (bugünkü 19 ünite + ön hat). */
const nx = Math.floor((ODA.x1 - ODA.x0) / ADIM);
const nz = Math.floor((ODA.z1 - ODA.z0) / ADIM);
const doluIzgara: boolean[][] = [];
const tumKutular = [...KITCHEN_UNITS.map((u) => unitBox(u)),
  ...ON_HAT.map((k) => ({ minX: k.x - k.w / 2, maxX: k.x + k.w / 2, minZ: k.z - k.d / 2, maxZ: k.z + k.d / 2, minY: 0, maxY: k.h }))];
for (let i = 0; i < nz; i++) {
  const satir: boolean[] = [];
  const z = ODA.z0 + (i + 0.5) * ADIM;
  for (let j = 0; j < nx; j++) {
    const x = ODA.x0 + (j + 0.5) * ADIM;
    satir.push(tumKutular.some((b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ));
  }
  doluIzgara.push(satir);
}
/** Histogram yöntemiyle EN BÜYÜK boş dikdörtgen. */
function enBuyukBosDikdortgen() {
  const yuk = new Array(nx).fill(0);
  let en = { alan: 0, i0: 0, i1: 0, j0: 0, j1: 0 };
  for (let i = 0; i < nz; i++) {
    for (let j = 0; j < nx; j++) yuk[j] = doluIzgara[i][j] ? 0 : yuk[j] + 1;
    const yigin: number[] = [];
    for (let j = 0; j <= nx; j++) {
      const h = j === nx ? 0 : yuk[j];
      while (yigin.length && yuk[yigin[yigin.length - 1]] >= h) {
        const t = yigin.pop()!;
        const sol = yigin.length ? yigin[yigin.length - 1] + 1 : 0;
        const alan = yuk[t] * (j - sol);
        if (alan > en.alan) en = { alan, i0: i - yuk[t] + 1, i1: i, j0: sol, j1: j - 1 };
      }
      yigin.push(j);
    }
  }
  return {
    alan: en.alan * ADIM * ADIM,
    x0: ODA.x0 + en.j0 * ADIM, x1: ODA.x0 + (en.j1 + 1) * ADIM,
    z0: ODA.z0 + en.i0 * ADIM, z1: ODA.z0 + (en.i1 + 1) * ADIM,
  };
}
const BOS = enBuyukBosDikdortgen();
yaz(`en büyük boş dikdörtgen        ${(BOS.x1 - BOS.x0).toFixed(2)} × ${(BOS.z1 - BOS.z0).toFixed(2)} = ${BOS.alan.toFixed(2)} br² (odanın %${((100 * BOS.alan) / ODA_ALAN).toFixed(0)}'si)`);
yaz(`                               x ${n2(BOS.x0)} … ${n2(BOS.x1)}   z ${n2(BOS.z0)} … ${n2(BOS.z1)}`);
yaz(`boşluğun ortasının görünürlüğü ${yz(gorunurOran([(BOS.x0 + BOS.x1) / 2, 1.0, (BOS.z0 + BOS.z1) / 2]))}`);
yaz();

/** ÇAYCININ YOLU — `servicePlace(areasOpen).staffWalk`; ada bu koridoru kesemez. */
const yol = SP.staffWalk;
const yolZ = yol.a[2];
const KORIDOR = PLAYER_RADIUS * 2; // çaycının geçmesi için gereken açıklık (oyuncuyla aynı ölçü)
yaz(`çaycının yolu                  x ${n2(yol.a[0])} … ${n2(yol.b[0])}  ·  z ${n2(yolZ)}  (uzunluk ${Math.abs(yol.b[0] - yol.a[0]).toFixed(2)} br)`);
yaz(`koridor payı (çaycı geçsin)    ${KORIDOR.toFixed(2)} br`);
yaz();

/**
 * ADA SLOTLARI (Y1) — hattın KENDİ ritmine (MODULE_W) oturan, boşluğun içinde duran modüller.
 * Her slot için: çakışma · çaycı koridorunu daraltma · görünürlük ölçülür.
 */
// Ada derinliği ADANIN KENDİ gövdesinden (zincirin üç üyesi de z'de −1,0…+1,0): 2,00 ham.
// Başka bir modelin derinliğiyle hesaplanırsa araç ile oyun 0,02 br ayrışır ve bekçi
// hangisinin doğru olduğunu söyleyemez.
const ADA_DERINLIK = 2.0;
const adaD = ADA_DERINLIK * KITCHEN_S;
const adaZ = (BOS.z0 + BOS.z1) / 2;
yaz('ADA SLOTLARI (Y1) — modül ritmine oturan, boşluğun ortasına dizilen gövdeler');
yaz(`  ada derinliği ${adaD.toFixed(2)} br · ada z ekseni ${n2(adaZ)} · modül eni ${MODULE_W.toFixed(2)} br`);
yaz('  slot'.padEnd(8) + 'x merkez'.padStart(11) + 'çakışma'.padStart(10) + 'çaycı payı'.padStart(13) + 'görünürlük'.padStart(13));
let slotSayisi = 0;
let slotCakisma = 0;
let enDarPay = Infinity;
/** Çakışmasız slotların x merkezleri — K5 adalarını buraya koyar. */
const TEMIZ_SLOTLAR: number[] = [];
for (let k = 0; ; k++) {
  const cx = modulX(k);
  if (cx + MODULE_W / 2 > RIGHT_X) break;
  const kutu: AABB = { minX: cx - MODULE_W / 2, maxX: cx + MODULE_W / 2, minZ: adaZ - adaD / 2, maxZ: adaZ + adaD / 2, minY: 0, maxY: COUNTER_TOP_Y };
  if (kutu.minX < ODA.x0) continue;
  const cakisan = tumKutular.filter((b) => kutu.minX < b.maxX && kutu.maxX > b.minX && kutu.minZ < b.maxZ && kutu.maxZ > b.minZ).length;
  // Çaycının yolu adanın ÖNÜNDEN geçiyor: kalan açıklık = yol z'si ile adanın ön yüzü arası.
  const pay = yolZ - kutu.maxZ;
  const gor = govdeGorunurluk(kutu);
  slotSayisi++;
  if (cakisan > 0) slotCakisma++;
  if (cakisan === 0) {
    enDarPay = Math.min(enDarPay, pay);
    TEMIZ_SLOTLAR.push(cx);
  }
  yaz('  ' + `k=${k}`.padEnd(6) + n2(cx).padStart(11) + String(cakisan).padStart(10)
    + `${pay.toFixed(2)} br`.padStart(13) + yz(gor).padStart(13));
}
yaz();
yaz(`  ada slotu toplam ${slotSayisi} · çakışan ${slotCakisma} · temiz ${slotSayisi - slotCakisma}`);
yaz(`  temiz slotların çaycıya bıraktığı EN DAR pay: ${Number.isFinite(enDarPay) ? enDarPay.toFixed(2) : '—'} br (gereken ${KORIDOR.toFixed(2)})`);
// Koridor dar çıkarsa: adayı kaç br geriye çekmek yeter, ve boşluğa hâlâ sığar mı?
const gerekenAdaZ = yolZ - KORIDOR - adaD / 2;
const kaydirma = adaZ - gerekenAdaZ;
const sigar = gerekenAdaZ - adaD / 2 >= BOS.z0;
yaz(`  koridoru ${KORIDOR.toFixed(2)} br'ye çıkaran ada ekseni: z ${n2(gerekenAdaZ)} (bugünkünden ${kaydirma.toFixed(2)} br geride)`);
yaz(`  o eksen boşluğun içinde kalıyor mu: ${sigar ? 'EVET' : 'HAYIR'} (boşluğun arka kenarı z ${n2(BOS.z0)})`);
yaz();
damga('ada koridoru çözülebilir', sigar, 'ada geri çekilince boşluktan taşıyor');
damga('boşluk ölçüldü', BOS.alan > 10, `${BOS.alan.toFixed(2)} br²`);
damga('ada slotu bulundu', slotSayisi > 0, `${slotSayisi} slot`);

// Y0 — arka hat: kaç modül daha alır?
const hatSonX = Math.max(...KITCHEN_UNITS.filter((u) => u.kat === 'zemin').map((u) => unitBox(u).maxX));
const hatBosluk = RIGHT_X - hatSonX;
yaz(`Y0 — ARKA HAT: hattın doğu ucu x ${n2(hatSonX)} · ara duvar x ${n2(RIGHT_X)} · kalan ${hatBosluk.toFixed(2)} br`);
yaz(`     kalan yere sığan tam modül: ${Math.floor(hatBosluk / MODULE_W)} (modül eni ${MODULE_W.toFixed(2)})`);
yaz();

// =============================================================================================
// §K — KOLLAR: dört kademe kalıbı, hepsi VARYANT
// =============================================================================================
cizgi();
yaz('§K — KADEME KALIPLARI: K0 taban · K1 açılım · K2 tadilat · K3/K3b/K4 yerinde · K5 karma');
cizgi();
yaz();

/** Bir ünitenin modül index'i — hattın ritmi (elle yazılmaz, `modulX`in tersi). */
const modulIndex = (u: KitchenUnit): number => Math.round((u.x - LEFT_X - MODULE_W / 2) / MODULE_W);
/** OCAĞIN modülü — oyunun L1 kimliği "derme çatma çay ocağı" oradan okunur. */
const OCAK_MODUL = modulIndex(KITCHEN_UNITS.find((u) => u.key === 'stove_multi')!);
const KAT_SIRA: Record<string, number> = { zemin: 0, tezgah: 1, duvar: 2 };

/**
 * K1/K2'NİN SIRALAMA KURALI — elle liste yazılmaz, TÜRETİLİR:
 * üniteler ocağın modülünden dışa doğru (|k − ocak|), eşitlikte zemin → tezgâh → duvar,
 * sonra x'e göre sıralanır. Gerekçe: oyunun kendi kimlik merdiveni L1'de "çay ocağı"
 * diyor; mutfak da oradan dışa doğru kurulur.
 */
const SIRALI = [...KITCHEN_UNITS].sort((a, b) => {
  const da = Math.abs(modulIndex(a) - OCAK_MODUL);
  const db = Math.abs(modulIndex(b) - OCAK_MODUL);
  if (da !== db) return da - db;
  const ka = KAT_SIRA[a.kat] - KAT_SIRA[b.kat];
  if (ka !== 0) return ka;
  return a.x - b.x;
});
/** i. ünitenin açıldığı seviye — 19 ünite 6 basamağa eşit bölünür. */
const acilisSeviyesi = (i: number): number => 1 + Math.floor((i * MAXL) / SIRALI.length);

yaz(`ocağın modülü k=${OCAK_MODUL} · ünite sayısı ${SIRALI.length} · basamak ${MAXL}`);
yaz();
yaz('K1/K2 AÇILIŞ SIRASI (türetilmiş — ocaktan dışa):');
yaz('  L'.padEnd(5) + 'ünite'.padEnd(46) + 'modül'.padStart(7) + 'kat'.padStart(9));
SIRALI.forEach((u, i) => {
  yaz('  L' + acilisSeviyesi(i) + '  ' + `${i + 1}. ${u.key}`.padEnd(46)
    + `k=${modulIndex(u)}`.padStart(7) + u.kat.padStart(9));
});
yaz();

/**
 * Bir kolun L seviyesinde ÇİZİLEN gövdeleri.
 *
 * `tur` neden var: "değişti mi" sorusu görünürlüğü ayırt etmeye yetmedi — bu odada her şey
 * görünür (S20: 0/19 görünmez). Ayırt eden şey değişimin KÜTLESİ. Üç tür üç ayrı kütle verir:
 *   dogus — gövde yoktan var olur      → ekranda değişen kütle = gövdenin TAMAMI
 *   perde — tahta perde kalkar, obje çıkar → aynı kutu ama tüm yüzey değişir = TAMAMI
 *   takas — gövde ailesinde bir üst basamağa geçer → değişen yalnız İKİ KUTUNUN FARKI
 * `feedback_upgrade_legibility`: "seviye gözle net belli olmalı, tek sinyal yetmez."
 */
type Tur = 'yok' | 'dogus' | 'perde' | 'takas';
interface Cizim { ad: string; kutu: AABB; degisti: boolean; tur: Tur; once?: AABB }

const hacim = (b: AABB): number => (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ);
/** Bu basamakta ekranda değişen kütle (br³). */
function deltaHacim(c: Cizim): number {
  if (!c.degisti) return 0;
  if (c.tur === 'takas' && c.once) return Math.abs(hacim(c.kutu) - hacim(c.once));
  return hacim(c.kutu);
}

/** K0 — bugünkü hâl: her seviyede aynı 19 ünite, hiçbir basamakta değişim yok. */
const K0 = (): Cizim[] =>
  KITCHEN_UNITS.map((u, i) => ({ ad: `${u.key}#${i}`, kutu: unitBox(u), degisti: false, tur: 'yok' as Tur }));

/** K1 — AÇILIM: ünite L'de doğar; doğduğu basamakta "değişti". */
const K1 = (L: number): Cizim[] =>
  SIRALI.map((u, i) => ({ u, i }))
    .filter(({ i }) => acilisSeviyesi(i) <= L)
    .map(({ u, i }) => ({ ad: `${u.key}#${i}`, kutu: unitBox(u), degisti: acilisSeviyesi(i) === L, tur: 'dogus' as Tur }));

/** K2 — TADİLAT: 19 gövde HEP çizilir; kilitli olan tahta perde. Delta = perdenin kalkması. */
const K2 = (L: number): Cizim[] =>
  SIRALI.map((u, i) => ({
    ad: `${u.key}#${i}${acilisSeviyesi(i) <= L ? '' : ':perde'}`,
    kutu: unitBox(u),
    degisti: acilisSeviyesi(i) === L,
    tur: 'perde' as Tur,
  }));

/**
 * K3 — YERİNDE BÜYÜME: ünite sayısı sabit, gövde kendi ailesinde tırmanır.
 * Kademe ATAMASI da türetilir: c üyeli zincir için L'deki üye index'i
 * `floor((L−1)·(c−1)/(MAXL−1))` — her gövde kendi zincirini altı basamağa yayar.
 */
function k3Uye(key: string, L: number): { ad: string; index: number } {
  const z = zincirler.get(key) ?? [];
  if (z.length < 2) return { ad: key, index: 0 };
  const i = Math.floor(((L - 1) * (z.length - 1)) / (MAXL - 1));
  return { ad: z[i], index: i };
}
/** Bir ünitenin BAŞKA bir gövdeyle çizilmiş AABB'si (ham kutu değişir, ankraj aynı kalır). */
function kutuGovdeyle(u: KitchenUnit, modelAd: string): AABB {
  const z = zincirler.get(u.key as string) ?? [];
  if (z.length < 2 || modelAd === u.key || u.key === 'waterRack') return unitBox(u);
  const h = ham(modelAd);
  const n = { w: h.boyut[0], h: h.boyut[1], minY: h.mn[1], minZ: h.mn[2], maxZ: h.mx[2] };
  const S = u.olcek ?? KITCHEN_S;
  const hw = (n.w / 2) * S;
  const z0 = n.minZ * S;
  const z1 = n.maxZ * S;
  const y = u.y ?? 0;
  const dus = { minY: y + n.minY * S, maxY: y + (n.minY + n.h) * S };
  switch (u.ceyrek) {
    case 0: return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z + z0, maxZ: u.z + z1, ...dus };
    case 2: return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z - z1, maxZ: u.z - z0, ...dus };
    case 1: return { minX: u.x + z0, maxX: u.x + z1, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
    default: return { minX: u.x - z1, maxX: u.x - z0, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
  }
}
const K3 = (L: number): Cizim[] =>
  KITCHEN_UNITS.map((u, i) => {
    const simdi = k3Uye(u.key as string, L);
    const once = k3Uye(u.key as string, Math.max(1, L - 1));
    return {
      ad: `${simdi.ad}#${i}`,
      kutu: kutuGovdeyle(u, simdi.ad),
      degisti: L > 1 && simdi.index !== once.index,
      tur: 'takas' as Tur,
      once: kutuGovdeyle(u, once.ad),
    };
  });

/**
 * K3b — HAVUZLANMIŞ MERDİVEN. K3'ün kuralı "her gövde kendi zincirini altı basamağa yaysın"
 * idi ve bu, kısa zincirlerin hepsini SON basamağa yığıp L2'yi boş bırakıyor (aşağıdaki
 * tabloda görünür). Aynı malzeme, farklı dağıtım: odadaki BÜTÜN kademe geçişleri tek havuza
 * toplanır ve beş basamağa sırayla dağıtılır — WC'nin elle yazılmış `LAVABO_SAYI_BY_LEVEL`
 * dizisinin türetilmiş karşılığı. Kol K3'ün kendisi değil, K3'ün MERDİVEN YAZIMI kolu.
 */
interface Gecis { i: number; u: KitchenUnit; hedef: number }
const HAVUZ: Gecis[] = [];
SIRALI.forEach((u) => {
  const i = KITCHEN_UNITS.indexOf(u);
  const z = zincirler.get(u.key as string) ?? [];
  for (let h = 1; h < z.length; h++) HAVUZ.push({ i, u, hedef: h });
});
/** Havuzdaki geçiş hangi basamakta olur? Sırayla L2..L6'ya dağıtılır. */
const gecisSeviyesi = (n: number): number => 2 + Math.floor((n * (MAXL - 1)) / Math.max(1, HAVUZ.length));
/** L'de i. ünitenin ulaştığı zincir index'i. */
function k3bIndex(i: number, L: number): number {
  let idx = 0;
  HAVUZ.forEach((g, n) => {
    if (g.i === i && gecisSeviyesi(n) <= L) idx = Math.max(idx, g.hedef);
  });
  return idx;
}
const K3b = (L: number): Cizim[] =>
  KITCHEN_UNITS.map((u, i) => {
    const z = zincirler.get(u.key as string) ?? [];
    const simdi = z.length >= 2 ? z[Math.min(k3bIndex(i, L), z.length - 1)] : (u.key as string);
    const onceIdx = z.length >= 2 ? k3bIndex(i, Math.max(1, L - 1)) : 0;
    const onceAd = z.length >= 2 ? z[Math.min(onceIdx, z.length - 1)] : (u.key as string);
    return {
      ad: `${simdi}#${i}`,
      kutu: kutuGovdeyle(u, simdi),
      degisti: L > 1 && z.length >= 2 && k3bIndex(i, L) !== onceIdx,
      tur: 'takas' as Tur,
      once: kutuGovdeyle(u, onceAd),
    };
  });

/**
 * K4 — BEDELE ORANTILI HAVUZ. K3b geçişleri EŞİT dağıtıyor; oysa basamakların bedeli eşit
 * değil (§L: L6 tek başına merdivenin %73'ü). K4 aynı havuzu, her basamağın BEDEL PAYINA
 * orantılı kütle düşecek biçimde dağıtır: geçişler kütlesine göre sıralanır ve her biri
 * o an en çok açığı olan basamağa verilir.
 */
const gecisKutlesi = (g: Gecis): number => {
  const z = zincirler.get(g.u.key as string) ?? [];
  if (z.length < 2) return 0;
  return Math.abs(hacim(kutuGovdeyle(g.u, z[Math.min(g.hedef, z.length - 1)]))
    - hacim(kutuGovdeyle(g.u, z[Math.min(g.hedef - 1, z.length - 1)])));
};
const BEDEL_PAY = MALIYET.slice(1).map((c) => c / MALIYET.slice(1).reduce((a, b) => a + b, 0));
const k4Atama = (() => {
  const sirali = HAVUZ.map((g, n) => ({ g, n, m: gecisKutlesi(g) })).sort((a, b) => b.m - a.m);
  const toplam = sirali.reduce((a, x) => a + x.m, 0);
  const birikim = new Array(MAXL - 1).fill(0);
  const atama = new Map<number, number>(); // havuz index → seviye
  for (const x of sirali) {
    let en = 0;
    let enAcik = -Infinity;
    for (let s = 0; s < MAXL - 1; s++) {
      const acik = BEDEL_PAY[s] * toplam - birikim[s];
      if (acik > enAcik) { enAcik = acik; en = s; }
    }
    birikim[en] += x.m;
    atama.set(x.n, en + 2);
  }
  return atama;
})();
function k4Index(i: number, L: number): number {
  let idx = 0;
  HAVUZ.forEach((g, n) => {
    if (g.i === i && (k4Atama.get(n) ?? MAXL) <= L) idx = Math.max(idx, g.hedef);
  });
  return idx;
}
const K4 = (L: number): Cizim[] =>
  KITCHEN_UNITS.map((u, i) => {
    const z = zincirler.get(u.key as string) ?? [];
    const simdi = z.length >= 2 ? z[Math.min(k4Index(i, L), z.length - 1)] : (u.key as string);
    const onceAd = z.length >= 2 ? z[Math.min(k4Index(i, Math.max(1, L - 1)), z.length - 1)] : (u.key as string);
    return {
      ad: `${simdi}#${i}`,
      kutu: kutuGovdeyle(u, simdi),
      degisti: L > 1 && simdi !== onceAd,
      tur: 'takas' as Tur,
      once: kutuGovdeyle(u, onceAd),
    };
  });

/**
 * K5 — KARMA: erken basamaklar YERİNDE takas, geç (pahalı) basamaklar YENİ ADA gövdesi.
 *
 * Gerekçesi ölçümden: havuzun taşıyabildiği toplam kütle sınırlı, ama L6 merdivenin %73'ü —
 * yalnız takasla o basamağa orantılı bir değişim düşmüyor. §Y ise boşlukta modül ritmine
 * oturan 4 TEMİZ ada slotu ölçtü. K5 ikisini birleştirir: L2-L3 takas, L4-L6 adada gövde
 * doğar ve doğduğu yerde kendi zincirinde büyür ("objeler küçük doğup yerinde büyür").
 */
const ADA_ZINCIR = ['kitchentable_A', 'kitchentable_A_large', 'kitchentable_A_large_decorated'];
/** Adanın z ekseni — §Y'de ölçülen, çaycıya tam koridor bırakan eksen (elle yazılmaz). */
const ADA_Z_GERCEK = gerekenAdaZ;
/**
 * ADA SAYISI ÜÇ DEĞİL İKİ — çakışma denetiminin kararı.
 *
 * §Y dört temiz slot ölçtü ve ilk taslak bitişik üç slota ada koydu. Ama ada da YERİNDE
 * büyüyor: `kitchentable_A_large` 3,0 ham = **2,70 br**, slot aralığı ise **1,80 br**.
 * Yani büyüyen iki komşu ada birbirinin içine 0,45 br giriyordu (§Ç yakaladı). Bitişik slot
 * ancak büyümeyen ada taşır; büyüyen ada BİR slot atlamalı. İkisi k=2 ve k=4'te, aralık
 * 3,60 br → en büyük hâllerinde bile 0,90 br ayrı duruyorlar.
 *
 * Kalan iki slot bilerek boş: oda tıkanmasın, S20'nin "boşluk tam da en görünür şeritte"
 * bulgusu tümden kapanmasın, ve çaycının koridoru 0,94'te kalsın.
 */
const ADA_PLAN: { slotX: number; asama: readonly number[] }[] = [
  // asama[L−1]: −1 = henüz yok · 0,1,2 = zincir üyesi
  { slotX: TEMIZ_SLOTLAR[0], asama: [-1, -1, -1, 0, 0, 2] },
  { slotX: TEMIZ_SLOTLAR[2], asama: [-1, -1, -1, -1, 0, 1] },
];
function adaKutu(slotX: number, z: number, modelAd: string): AABB {
  const h = ham(modelAd);
  const S = KITCHEN_S;
  return {
    minX: slotX - (h.boyut[0] / 2) * S, maxX: slotX + (h.boyut[0] / 2) * S,
    minZ: z + h.mn[2] * S, maxZ: z + h.mx[2] * S,
    minY: h.mn[1] * S, maxY: (h.mn[1] + h.boyut[1]) * S,
  };
}
const K5 = (L: number): Cizim[] => {
  // Erken basamaklar: havuzun ilk yarısı L2-L3'e (takas).
  const erken = HAVUZ.map((g, n) => ({ g, n })).filter(({ n }) => n < HAVUZ.length / 2);
  const erkenSeviye = (n: number) => 2 + Math.floor((n * 2) / Math.max(1, Math.ceil(HAVUZ.length / 2)));
  const idx = (i: number, seviye: number) => {
    let a = 0;
    erken.forEach(({ g, n }) => { if (g.i === i && erkenSeviye(n) <= seviye) a = Math.max(a, g.hedef); });
    return a;
  };
  const govdeler: Cizim[] = KITCHEN_UNITS.map((u, i) => {
    const z = zincirler.get(u.key as string) ?? [];
    const simdi = z.length >= 2 ? z[Math.min(idx(i, L), z.length - 1)] : (u.key as string);
    const onceAd = z.length >= 2 ? z[Math.min(idx(i, Math.max(1, L - 1)), z.length - 1)] : (u.key as string);
    return { ad: `${simdi}#${i}`, kutu: kutuGovdeyle(u, simdi), degisti: L > 1 && simdi !== onceAd, tur: 'takas' as Tur, once: kutuGovdeyle(u, onceAd) };
  });
  // Geç basamaklar: ada gövdeleri doğar (L4, L5, L6) ve doğduktan sonra zincirinde tırmanır.
  ADA_PLAN.forEach((a, s) => {
    const asama = a.asama[L - 1];
    if (asama < 0) return;
    const once = L > 1 ? a.asama[L - 2] : -1;
    const yeniDogdu = once < 0;
    govdeler.push({
      ad: `ada${s}:${ADA_ZINCIR[asama]}`,
      kutu: adaKutu(a.slotX, ADA_Z_GERCEK, ADA_ZINCIR[asama]),
      degisti: yeniDogdu || asama !== once,
      tur: yeniDogdu ? ('dogus' as Tur) : ('takas' as Tur),
      once: yeniDogdu ? undefined : adaKutu(a.slotX, ADA_Z_GERCEK, ADA_ZINCIR[once]),
    });
  });
  return govdeler;
};

/**
 * K5y — K5'in YAZILMIŞ MERDİVENİ (uygulanan kol).
 *
 * NEDEN: K5'in dağıtımı türetilmişti (havuzun ilk yarısı L2-L3'e sırayla) ve ocağın **5
 * kademelik** zincirinin dördünü birden L2'ye yığıyordu — odanın en görünür gövdesi tek
 * adımda `stove_single`'dan `stove_multi_decorated`'a atlıyor, L3'e üç küçük takas kalıyordu.
 * Bu kolun kendi kusuru değil, raporun K3 için zaten yazdığı şeyin aynısı: **yerinde büyüme
 * elle yazılmış bir merdiven ister.** Kol (K5 + Y1) değişmedi; değişen, aynı malzemenin
 * basamaklara dağıtımı.
 *
 * MERDİVEN OYUNUN KENDİ KİMLİĞİNE OTURUR (`economy.config.service`) — ama basamakları
 * ADIM KÜTLESİ tablosu belirledi, cümle değil: ocağın `stove_single → stove_multi` adımı
 * kulağa büyük geliyor, ölçüsü **×0,01** (göz sayısı değişiyor, siluet değil). Tek başına
 * bir basamağı taşıyamaz — yanına gövde büyüten adımlar konur.
 *   L1  derme çatma: ocak tek gözlü, hat sırtlıksız, dolaplar yarım, bulaşıklık boş
 *   L2  ocak çoğalır + bulaşıklık dolar + doğu tezgâhı sırtlanır
 *   L3  batı tezgâhı sırtlanır + ilk duvar dolabı tam boya çıkar
 *   L4  TEZGÂH kimliği: hazırlık tezgâhları + lavabo sırtlanır, ilk ADA kurulur
 *   L5  TOST: ocak tam donanımına geçer · ikinci dolap · peçetelik rafı · ikinci ada
 *   L6  son basamak: iki hazırlık tezgâhı donanır · soğutucu dolar · üçüncü ada,
 *       öncekiler kendi zincirlerinde büyür
 * Dördüncü temiz slot BİLEREK boş: oda tıkanmasın, çaycının koridoru 0,94'te kalsın.
 */
interface YaziliAdim { u: number; asama: number }
const K5Y_MERDIVEN: readonly (readonly YaziliAdim[])[] = [
  [], // L1 — başlangıç, hepsi zincirin ilk üyesinde
  [{ u: 3, asama: 1 }, { u: 6, asama: 1 }, { u: 5, asama: 1 }],   // L2 ocak çoğalır · bulaşıklık dolar · doğu tezgâhı
  [{ u: 11, asama: 1 }, { u: 2, asama: 1 }],                      // L3 batı tezgâhı · ilk duvar dolabı tam boya
  [{ u: 1, asama: 1 }, { u: 7, asama: 1 }, { u: 8, asama: 1 }],   // L4 TEZGÂH: hazırlık + lavabo sırtlanır (+ ada0 kurulur)
  [{ u: 9, asama: 1 }],                                           // L5 TOST: ikinci duvar dolabı (+ ada1 kurulur)
  [{ u: 17, asama: 1 }],                                          // L6 peçetelik rafı donanır (+ ada0 tam, ada1 büyür)
];
/**
 * SOĞUTUCU ZİNCİRİ ÇIKARILDI — bekçi testinin kararı, ölçümün değil.
 * İlk yazımda `fridge_A → fridge_A_decorated` vardı; `tests/mutfak-kademe-s22.test.ts`
 * yakaladı: o zincir L6'yı `KITCHEN_UNITS`in ilan ettiği gövdenin ÖTESİNE taşıyor, yani oda
 * iki ayrı yerde tanımlanmış oluyordu. Kural artık yazılı: **zincirin son üyesi = ünitenin
 * kendi anahtarı**, yani L6 tam olarak bugünkü odadır. Kaybedilen kütle ×0,00 (kutu aynı).
 */
const K5Y_ZINCIR_HARIC: readonly string[] = ['fridge_A'];
/** L'de i. ünitenin ulaştığı zincir aşaması (merdiven kümülatif okunur). */
function k5yAsama(i: number, L: number): number {
  let a = 0;
  for (let s = 0; s < L && s < K5Y_MERDIVEN.length; s++)
    for (const adim of K5Y_MERDIVEN[s]) if (adim.u === i) a = Math.max(a, adim.asama);
  return a;
}
const K5y = (L: number): Cizim[] => {
  const govdeler: Cizim[] = KITCHEN_UNITS.map((u, i) => {
    const z = K5Y_ZINCIR_HARIC.includes(u.key as string) ? [] : (zincirler.get(u.key as string) ?? []);
    const ad = (n: number) => (z.length >= 2 ? z[Math.min(n, z.length - 1)] : (u.key as string));
    const simdi = ad(k5yAsama(i, L));
    const onceAd = ad(k5yAsama(i, Math.max(1, L - 1)));
    return { ad: `${simdi}#${i}`, kutu: kutuGovdeyle(u, simdi), degisti: L > 1 && simdi !== onceAd, tur: 'takas' as Tur, once: kutuGovdeyle(u, onceAd) };
  });
  ADA_PLAN.forEach((a, s) => {
    const asama = a.asama[L - 1];
    if (asama < 0) return;
    const once = L > 1 ? a.asama[L - 2] : -1;
    const yeniDogdu = once < 0;
    govdeler.push({
      ad: `ada${s}:${ADA_ZINCIR[asama]}`,
      kutu: adaKutu(a.slotX, ADA_Z_GERCEK, ADA_ZINCIR[asama]),
      degisti: yeniDogdu || asama !== once,
      tur: yeniDogdu ? ('dogus' as Tur) : ('takas' as Tur),
      once: yeniDogdu ? undefined : adaKutu(a.slotX, ADA_Z_GERCEK, ADA_ZINCIR[once]),
    });
  });
  return govdeler;
};

const KOLLAR: { ad: string; baslik: string; plan: (L: number) => Cizim[] }[] = [
  { ad: 'K0', baslik: 'taban — 19 sabit ünite, seviye okuması yok', plan: K0 },
  { ad: 'K1', baslik: 'AÇILIM — ünite sayısı seviyeyle artar', plan: K1 },
  { ad: 'K2', baslik: 'TADİLAT — 19 gövde hep çizilir, kilitliler perde', plan: K2 },
  { ad: 'K3', baslik: 'YERİNDE BÜYÜME — her gövde kendi zincirini yayar', plan: K3 },
  { ad: 'K3b', baslik: 'YERİNDE BÜYÜME — geçişler havuzlanıp EŞİT dağıtılır', plan: K3b },
  { ad: 'K4', baslik: 'YERİNDE BÜYÜME — geçişler BEDEL PAYINA orantılı dağıtılır', plan: K4 },
  { ad: 'K5', baslik: 'KARMA — erken takas, geç basamakta adada yeni gövde doğar', plan: K5 },
  { ad: 'K5y', baslik: 'KARMA · YAZILMIŞ MERDİVEN — uygulanan kol (D-119)', plan: K5y },
];

/** Zemine düşen ayak izi alanı (odaya kırpılmış, ızgarayla — üst üste binen gövde iki kez sayılmaz). */
function doluAlan(cizimler: Cizim[]): number {
  let hucre = 0;
  let toplam = 0;
  for (let x = ODA.x0 + ADIM / 2; x < ODA.x1; x += ADIM)
    for (let z = ODA.z0 + ADIM / 2; z < ODA.z1; z += ADIM) {
      toplam++;
      if (cizimler.some((c) => x >= c.kutu.minX && x <= c.kutu.maxX && z >= c.kutu.minZ && z <= c.kutu.maxZ)) hucre++;
    }
  return (hucre / toplam) * ODA_ALAN;
}

/**
 * MERDİVENİN HAM MALZEMESİ — hangi ünite hangi adımda ne kadar kütle değiştiriyor?
 * Merdiven elle yazılacaksa (K5y) yazan kişinin elinde bu tablo olmalı; aksi hâlde
 * "ocak büyüsün" gibi bir cümle, ekranda 0,04 br³'lük bir değişime karşılık gelebilir.
 */
yaz('ZİNCİR ADIMLARININ DÜNYA KÜTLESİ — merdiveni yazan tablo (× ortalama ünite)');
yaz('  #'.padEnd(5) + 'ünite'.padEnd(40) + 'adım'.padStart(6) + 'geçiş'.padStart(52) + 'delta'.padStart(11));
const ORT_UNITE_ON = KITCHEN_UNITS.reduce((a, u) => a + hacim(unitBox(u)), 0) / KITCHEN_UNITS.length;
KITCHEN_UNITS.forEach((u, i) => {
  const z = zincirler.get(u.key as string) ?? [];
  for (let a = 1; a < z.length; a++) {
    const d = Math.abs(hacim(kutuGovdeyle(u, z[a])) - hacim(kutuGovdeyle(u, z[a - 1])));
    yaz('  ' + String(i).padEnd(3) + (u.key as string).padEnd(40) + `${a - 1}→${a}`.padStart(6)
      + `${z[a - 1]} → ${z[a]}`.slice(0, 50).padStart(52)
      + `×${(d / ORT_UNITE_ON).toFixed(2)}`.padStart(11));
  }
});
yaz();

yaz('KOL KOL — her seviyede kaç gövde, ne kadar dolu, ve O BASAMAĞIN DELTASI görünüyor mu?');
yaz();
const kolOzet: Record<string, { korAdim: number; enDusukDelta: number; l1Dolu: number; enDusukKutle: number; toplamKutle: number; uyum: number; detayAdim: number }> = {};
/** Kıyas ölçüsü: ortalama bir mutfak ünitesinin kütlesi — delta bunun yanında okunur. */
const ORT_UNITE = KITCHEN_UNITS.reduce((a, u) => a + hacim(unitBox(u)), 0) / KITCHEN_UNITS.length;
yaz(`kıyas — ortalama ünite kütlesi ${ORT_UNITE.toFixed(2)} br³ (delta bunun yanında okunur)`);
yaz();
for (const kol of KOLLAR) {
  yaz(`  ${kol.ad} — ${kol.baslik}`);
  yaz('    L'.padEnd(7) + 'gövde'.padStart(7) + 'dolu br²'.padStart(11) + 'dolu %'.padStart(9)
    + 'değişen'.padStart(9) + 'görünürlük'.padStart(12) + 'delta kütle'.padStart(13) + 'ünite eşd.'.padStart(12) + '   basamak');
  let korAdim = 0;
  let detayAdim = 0;
  let enDusuk = 1;
  let l1Dolu = 0;
  let enDusukKutle = Infinity;
  let toplamKutle = 0;
  const kutleler: number[] = [];
  for (let L = 1; L <= MAXL; L++) {
    const c = kol.plan(L);
    const dolu = doluAlan(c);
    if (L === 1) l1Dolu = dolu;
    const degisenler = c.filter((x) => x.degisti);
    const gor = degisenler.length ? Math.max(...degisenler.map((d) => govdeGorunurluk(d.kutu))) : 0;
    const kutle = degisenler.reduce((a, d) => a + deltaHacim(d), 0);
    const basamakVar = L === 1 || degisenler.length > 0;
    // ÜÇ DURUM, ikisi yetmedi: bir takas gövdeyi büyütmeden yalnız ÜSTÜNÜ donatabiliyor
    // (`_decorated`: aynı sınır kutusu, başka mesh). O basamak kör değil ama siluet de
    // değişmiyor — uzaktan bakan oyuncu için "detay" ile "okunur" aynı şey değil.
    const DETAY_ESIK = 0.05 * ORT_UNITE;
    const hal = !basamakVar || gor < 0.01 ? 'KÖR' : kutle < DETAY_ESIK ? 'detay' : 'okunur';
    if (L > 1) {
      if (hal === 'KÖR') korAdim++;
      enDusuk = Math.min(enDusuk, gor);
      enDusukKutle = Math.min(enDusukKutle, kutle);
      toplamKutle += kutle;
      kutleler.push(kutle);
    }
    yaz('    L' + L + '   ' + String(c.length).padStart(7) + dolu.toFixed(2).padStart(11)
      + yz(dolu / ODA_ALAN).padStart(9) + String(degisenler.length).padStart(9)
      + (degisenler.length ? yz(gor) : '   —').padStart(12)
      + `${kutle.toFixed(2)} br³`.padStart(13)
      + `×${(kutle / ORT_UNITE).toFixed(2)}`.padStart(12)
      + (L === 1 ? '   (başlangıç)' : hal === 'KÖR' ? '   ** KÖR **' : hal === 'detay' ? '   detay (siluet aynı)' : '   okunur'));
    if (L > 1 && hal === 'detay') detayAdim++;
  }
  // BEDEL–DEĞİŞİM UYUMU: basamağın bedeli ile o basamakta değişen kütle aynı yönde mi gidiyor?
  const uyum = pearson(MALIYET.slice(1) as number[], kutleler);
  kolOzet[kol.ad] = {
    korAdim, enDusukDelta: enDusuk, l1Dolu,
    enDusukKutle: Number.isFinite(enDusukKutle) ? enDusukKutle : 0, toplamKutle,
    uyum: Number.isNaN(uyum) ? 0 : uyum, detayAdim,
  };
  yaz(`    → KÖR BASAMAK ${korAdim}/${MAXL - 1} · en zayıf delta görünürlüğü ${yz(enDusuk)}`
    + ` · EN ZAYIF BASAMAĞIN KÜTLESİ ${kolOzet[kol.ad].enDusukKutle.toFixed(2)} br³ (×${(kolOzet[kol.ad].enDusukKutle / ORT_UNITE).toFixed(2)} ünite)`);
  yaz(`      L1 doluluk ${yz(l1Dolu / ODA_ALAN)} · merdivenin toplam değişimi ${toplamKutle.toFixed(2)} br³`
    + ` · BEDEL–DEĞİŞİM UYUMU r = ${kolOzet[kol.ad].uyum.toFixed(2)}`);
  yaz();
}

yaz('  OKUMA — İKİ AYRI SÜZGEÇ, ikisi de geçilmeli:');
yaz('    1) KÖR BASAMAK: o yükseltmede ekranda hiçbir şey değişmiyor ya da değişen şey hiçbir');
yaz('       duruştan görünmüyor. S7/D-104 bunu yasaklıyor.');
yaz('    2) DELTA KÜTLE: değişim görünür ama GÖZE ÇARPIYOR mu? Bu odada her şey görünür');
yaz('       (S20: 0/19 görünmez), o yüzden görünürlük tek başına hiçbir kolu elemiyor —');
yaz('       ayıran sayı, en zayıf basamağın kaç ünite kadar kütle değiştirdiği.');
yaz();
damga('K0 kör (taban doğrulaması)', kolOzet.K0.korAdim === MAXL - 1, `K0 ${kolOzet.K0.korAdim} kör basamak — taban zaten kademesiz olmalı`);

// ---------------------------------------------------------------------------------------------
// §Ç — ÇAKIŞMA: uygulanacak kol eski gövdelerin içine giriyor mu?
// ---------------------------------------------------------------------------------------------
//
// Zincirin üst üyeleri her zaman alt üyeyle AYNI kutuda değil: `stove_multi_decorated` x'te
// simetrik yazılmamış (minX −1,00 · maxX +1,20), yani doğu komşusunun üstüne taşıyor. Kutu
// ölçen bir kol tablosu bunu göstermez — ayrı sorulmalı. Bugün zaten kasıtlı iç içe duran
// çiftler var (kasa + kapak, tezgâh + bulaşıklık), o yüzden TABANDAKİ çakışmalar düşülür:
// yalnız kolun GETİRDİĞİ çakışma rapor edilir.
cizgi();
yaz('§Ç — ÇAKIŞMA: uygulanacak kolun getirdiği YENİ iç içe geçmeler');
cizgi();
yaz();
const kesisen = (a: AABB, b: AABB): boolean =>
  a.minX < b.maxX - 1e-6 && a.maxX > b.minX + 1e-6 &&
  a.minZ < b.maxZ - 1e-6 && a.maxZ > b.minZ + 1e-6 &&
  a.minY < b.maxY - 1e-6 && a.maxY > b.minY + 1e-6;
function ciftler(c: Cizim[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < c.length; i++)
    for (let j = i + 1; j < c.length; j++)
      if (kesisen(c[i].kutu, c[j].kutu)) {
        const ort = Math.min(c[i].kutu.maxX, c[j].kutu.maxX) - Math.max(c[i].kutu.minX, c[j].kutu.minX);
        m.set(`${i}|${j}`, ort);
      }
  return m;
}
const TABAN_CIFT = ciftler(K0());
yaz(`tabandaki (kasıtlı) iç içe çift: ${TABAN_CIFT.size}`);
yaz();
yaz('  L'.padEnd(6) + 'yeni çakışma'.padStart(14) + '   ayrıntı');
let yeniCakisma = 0;
const UYG = KOLLAR.find((k) => k.ad === 'K5y')!;
for (let L = 1; L <= MAXL; L++) {
  const c = UYG.plan(L);
  const cift = ciftler(c);
  const yeni = [...cift.entries()].filter(([k]) => !TABAN_CIFT.has(k));
  yeniCakisma += yeni.length;
  const ayrinti = yeni.map(([k, ort]) => {
    const [i, j] = k.split('|').map(Number);
    return `${c[i].ad.split('#')[0]} ∩ ${c[j].ad.split('#')[0]} (${ort.toFixed(2)} br)`;
  }).join(' · ');
  yaz('  L' + L + '   ' + String(yeni.length).padStart(12) + '   ' + (ayrinti || '—'));
}
yaz();
damga('uygulanan kol yeni çakışma getirmiyor', yeniCakisma === 0, `${yeniCakisma} yeni iç içe geçme`);
yaz();
damga('kollar ayrışıyor', new Set(KOLLAR.map((k) => kolOzet[k.ad].enDusukKutle.toFixed(2))).size >= 3,
  'kolların en zayıf basamak kütlesi birbirinden ayrışmıyor — ölçüm ayırt etmiyor');

// =============================================================================================
// ÖZET
// =============================================================================================
cizgi();
yaz('ÖZET — karar paketine giden satırlar');
cizgi();
yaz();
yaz('  kol'.padEnd(6) + 'kör'.padStart(6) + 'detay'.padStart(7) + 'en zayıf kütle'.padStart(17)
  + 'ünite eşd.'.padStart(12) + 'bedel uyumu'.padStart(13) + 'L1 doluluk'.padStart(12) + 'L6 doluluk'.padStart(12) + '   hüküm');
for (const kol of KOLLAR) {
  const o = kolOzet[kol.ad];
  const l6 = doluAlan(kol.plan(MAXL));
  const gecer = kol.ad !== 'K0' && o.korAdim === 0;
  yaz('  ' + kol.ad.padEnd(5) + `${o.korAdim}/${MAXL - 1}`.padStart(6) + `${o.detayAdim}`.padStart(7)
    + `${o.enDusukKutle.toFixed(2)} br³`.padStart(17) + `×${(o.enDusukKutle / ORT_UNITE).toFixed(2)}`.padStart(12)
    + `r ${o.uyum.toFixed(2)}`.padStart(13)
    + yz(o.l1Dolu / ODA_ALAN).padStart(12) + yz(l6 / ODA_ALAN).padStart(12)
    + (kol.ad === 'K0' ? '   taban (kademesiz)' : gecer ? '   GEÇER' : '   ELENİR (kör basamak)'));
}
yaz();
yaz('  kör       = o yükseltmede ekranda hiçbir şey değişmiyor / değişen görünmüyor → kol ELENİR');
yaz('  detay     = değişiyor ve görünüyor ama SİLUET aynı (yalnız üstüne eşya kondu)');
yaz('  bedel uyumu r = basamağın ₺ bedeli ile o basamakta değişen kütlenin korelasyonu.');
yaz('              r < 0 → merdiven TERS akıyor: en ucuz basamak en çok, en pahalısı en az değişiyor.');
yaz();
yaz('  Y — büyümenin yeri: Y0 arka hat KAPALI (kalan ' + hatBosluk.toFixed(2) + ' br, modül 1,80 istiyor)');
yaz(`      Y1 ada: ${slotSayisi - slotCakisma} temiz slot · boşluk ${BOS.alan.toFixed(2)} br² · çaycı payı ${enDarPay.toFixed(2)} → ${KORIDOR.toFixed(2)} için ada ${kaydirma.toFixed(2)} br geri`);
yaz();

// =============================================================================================
// PLAN DIŞA AKTARIMI — karar paketi kolları ANLATMAZ, GÖSTERİR (`feedback_show_dont_ask`)
// =============================================================================================
//
// Karar paketi kuşbakışı bir oda planı çizecek; o planın koordinatları BURADAN gelir, elle
// yazılmaz. Aksi hâlde paket ölçümden ayrı bir gerçeklik anlatır.
if (process.env.PLAN_JSON) {
  const dis = {
    oda: ODA,
    odaAlan: ODA_ALAN,
    maliyet: MALIYET,
    cayciYolu: { x0: yol.a[0], x1: yol.b[0], z: yolZ },
    onHat: ON_HAT.map((k) => ({ minX: k.x - k.w / 2, maxX: k.x + k.w / 2, minZ: k.z - k.d / 2, maxZ: k.z + k.d / 2 })),
    bosluk: BOS,
    kollar: Object.fromEntries(KOLLAR.map((kol) => [kol.ad, {
      baslik: kol.baslik,
      ozet: kolOzet[kol.ad],
      seviyeler: Array.from({ length: MAXL }, (_, i) => {
        const L = i + 1;
        const c = kol.plan(L);
        return {
          L,
          dolu: doluAlan(c),
          // Basamağın ÖLÇÜLEN delta kütlesi — karar paftası bunu çiziyor; gövde SAYISI değil.
          delta: c.filter((x) => x.degisti).reduce((a, x) => a + deltaHacim(x), 0),
          ortUnite: ORT_UNITE,
          govdeler: c.map((x) => ({
            ad: x.ad.split('#')[0], degisti: x.degisti, tur: x.tur,
            minX: x.kutu.minX, maxX: x.kutu.maxX, minZ: x.kutu.minZ, maxZ: x.kutu.maxZ, maxY: x.kutu.maxY,
          })),
        };
      }),
    }])),
  };
  writeFileSync(process.env.PLAN_JSON, JSON.stringify(dis), 'utf8');
  console.error(`✓ plan JSON yazıldı: ${process.env.PLAN_JSON}`);
}

damgaOzeti();
