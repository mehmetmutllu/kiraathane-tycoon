/**
 * wc-odasi.test.ts — S7'nin BEKÇİSİ (D-104).
 *
 * **Bu paketin bekçilik ettiği asıl değişmez üç tane ve üçü de bir KULLANICI KARARI:**
 *   K  kabin kapısı KayKit `door_A` (gri kasa + yeşil kanat), bugünkü kabin gözünü BOZMADAN.
 *   L  lavabo seviyesi MEKÂNSAL okunur ve her seviye tam bir şeyi büyütür (G-36).
 *   M  müşteri kapı eşiğinde buharlaşmaz; içeri yürüyüp görünmez bir noktada kaybolur (G-35).
 *
 * **Neden bu dosya `wcLook`/`layout`u okuyor da `maketParts`ı değil:** `maketParts.tsx` bir R3F
 * dosyası, vitest'te import edilemez. S6/③'ün dersi tam buydu — `Decor.tsx`e yazılmış bir karar
 * (gölge) bekçilenemedi ve onu geri açan mutasyon KAÇTI. Bu turun kararları da bu yüzden ölçü
 * katmanında duruyor.
 *
 * Ölçümler: `docs/wc-odasi-raporu-s7.md` · ham çıktı `docs/olcum-wc-odasi.txt`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  KABIN_ADIM,
  KABIN_ARALIK_ACI,
  KABIN_CARPITMA,
  KABIN_DZ,
  KABIN_GOZ,
  KABIN_KUTU,
  KABIN_MENTESE_ORTA,
  KABIN_NATIVE,
  KABIN_SAYI_BY_LEVEL,
  KABIN_SCALE,
  KABIN_X_OFSET,
  LAVABO_CARPITMA,
  LAVABO_KUTU,
  LAVABO_SAYI_BY_LEVEL,
  LAVABO_SLOT_ARALIK,
  kabinSayisi,
  lavaboSayisi,
  lavaboSlotOfset,
  wcSeviye,
} from '../src/components/three/wcLook';
import { BAND, BAND_SHELL, LAVABO, WC_GECIS, WC_SOLMA_ESIGI, wcOlcek, wcYol } from '../src/game/layout';
import { lavaboMaxLevel } from '../src/config/economy.config';
import { hasLeftTable } from '../src/game/rules';

// Odanın kutusu — `MaketLavaboBlock` ile AYNI kaynaklardan türetilir, sayı kopyalanmaz.
const X1 = BAND.wc.minX;
const X2 = BAND_SHELL.innerRight;
const Z_BACK = BAND_SHELL.innerBack;
const Z_FRONT = BAND.front;
const KAPI_YARI = 0.7;

describe('S7/K — kabin kapısı KayKit door_A', () => {
  it('ham ölçüler modelin kendi gltf sayılarıdır (node tools/model-olc.mjs ... door_A)', () => {
    expect(KABIN_NATIVE.w).toBe(1.6);
    expect(KABIN_NATIVE.h).toBe(2.8);
    expect(KABIN_NATIVE.d).toBeCloseTo(0.771, 3);
    // Menteşe SOL kenarda: kapı origin'i etrafında açılabiliyor. Bu sayı bozulursa aralık kapı
    // yine havada kayar (eski kutunun kusuru).
    expect(KABIN_NATIVE.minX).toBe(0);
    // z'de simetrik → telafi SIFIR olmalı. Lavaboda bu sayı 0 DEĞİLDİ; ikisi karışmasın.
    expect(KABIN_NATIVE.minZ + KABIN_NATIVE.maxZ).toBeCloseTo(0, 6);
  });

  it('bbox derinliği modelin kalınlığı DEĞİL — bar hariç gövde çok daha ince', () => {
    // Ölçüldü: y<0,80 ve y>1,30 dilimlerinde kalınlık 0,300; bar (y 0,80…1,20) 0,771'e çıkıyor.
    expect(KABIN_NATIVE.govdeD).toBeLessThan(KABIN_NATIVE.d / 2);
    expect(KABIN_NATIVE.bar.min).toBeLessThan(KABIN_NATIVE.bar.max);
  });

  it('kabin gözü DEĞİŞMEDİ — yerleşim, nav ve yürüme açıklığı bu turda oynamadı', () => {
    expect(KABIN_KUTU.w).toBe(1.36);
    expect(KABIN_KUTU.h).toBe(1.95);
    expect(KABIN_MENTESE_ORTA).toBeCloseTo(KABIN_KUTU.w / 2, 6);
  });

  it('ölçek hedef gözü BİREBİR tutturur ve z telafisi türetilir', () => {
    expect(KABIN_NATIVE.w * KABIN_SCALE[0]).toBeCloseTo(KABIN_KUTU.w, 6);
    expect(KABIN_NATIVE.h * KABIN_SCALE[1]).toBeCloseTo(KABIN_KUTU.h, 6);
    // Derinlik x'e bağlı: kapı z'de ezilmemeli (kanat kalınlığı oranını korur).
    expect(KABIN_SCALE[2]).toBeCloseTo(KABIN_SCALE[0], 6);
    expect(KABIN_DZ).toBeCloseTo(0, 6);
  });

  it('çarpıtma D-103ün kabul ettiği bedelin ALTINDA (tekdüze kollar ölçülüp elendi)', () => {
    // Ölçülen değer 1,221. Eşitlikle değil, "kabul edilmiş bedelin altında" diye bekçilenir:
    // asıl kural bu. Ama tekdüzeye kaçarsa da haber versin diye alt sınır da var — tekdüze
    // ölçek 1,000 verir ve o kol ölçümde ELENDİ (boydan 0,25 br boşluk, enden bölmeyi 0,38 aşar).
    expect(KABIN_CARPITMA).toBeGreaterThan(1.0001);
    expect(KABIN_CARPITMA).toBeLessThan(LAVABO_CARPITMA);
    expect(KABIN_CARPITMA).toBeCloseTo(1.221, 3);
  });

  it('kapı bölmeden TAŞMAZ — bölme 2,00, kapı 1,95', () => {
    expect(KABIN_KUTU.h).toBeLessThan(2.0);
    // ENDEN ölçek kolu tam burada ölmüştü: 1,36 eni tutturmak boyu 2,38'e çıkarıyordu.
    expect((KABIN_NATIVE.h * KABIN_KUTU.w) / KABIN_NATIVE.w).toBeGreaterThan(2.0);
  });

  it('GÖZ TAŞIMASI YOK — kanadın yeşili kullanıcı kararıdır, sessizce grileştirilemez', () => {
    // door_A zaten %73 [0,3] #828c91 = lavabo/ayna grisi. Kalan %25 kanadın yeşili ve kullanıcı
    // kahve bloğu kırılsın diye A'yı seçti (feedback_color_variety). Liste dolarsa karar döner.
    expect(KABIN_GOZ).toHaveLength(0);
  });

  it('aralık kapı GERÇEK menteşeden döner (maketin açısı korundu)', () => {
    expect(KABIN_ARALIK_ACI).toBeCloseTo(0.55, 6);
  });
});

describe('S7/L — seviye MEKÂNSAL okunuyor (G-36)', () => {
  it('iki sinyal de her seviyeyi kapsar', () => {
    expect(LAVABO_SAYI_BY_LEVEL).toHaveLength(lavaboMaxLevel());
    expect(KABIN_SAYI_BY_LEVEL).toHaveLength(lavaboMaxLevel());
  });

  it('oda KAPALIYKEN hiçbir şey çizilmez', () => {
    expect(lavaboSayisi(0)).toBe(0);
    expect(kabinSayisi(0)).toBe(0);
    expect(wcSeviye(0, false)).toBe(0);
    expect(wcSeviye(4, false)).toBe(0);
  });

  it('oda AÇIKKEN seviye asla 0 okunmaz — açık ama BOŞ oda çizilemez', () => {
    // Bu kusuru testler değil GÖRSEL TUR yakaladı: `padsDone` ile `lavaboLevel` dev kancasında
    // ayrışıyor ve oda bomboş çiziliyordu. Kural artık türetilmiş ve bekçili.
    expect(wcSeviye(0, true)).toBe(1);
    expect(lavaboSayisi(wcSeviye(0, true))).toBeGreaterThan(0);
    expect(kabinSayisi(wcSeviye(0, true))).toBeGreaterThan(0);
    for (let lv = 1; lv <= lavaboMaxLevel(); lv++) expect(wcSeviye(lv, true)).toBe(lv);
  });

  it('HER yükseltme ekranda TAM BİR ŞEYİ büyütür — "hiçbir şey değişmedi" seviyesi yok', () => {
    for (let lv = 2; lv <= lavaboMaxLevel(); lv++) {
      const dLavabo = lavaboSayisi(lv) - lavaboSayisi(lv - 1);
      const dKabin = kabinSayisi(lv) - kabinSayisi(lv - 1);
      expect(dLavabo).toBeGreaterThanOrEqual(0);
      expect(dKabin).toBeGreaterThanOrEqual(0);
      expect(dLavabo + dKabin).toBe(1);
    }
  });

  it('sayılar hiç KÜÇÜLMEZ ve seviye tavanında donar', () => {
    expect(lavaboSayisi(lavaboMaxLevel() + 3)).toBe(lavaboSayisi(lavaboMaxLevel()));
    expect(kabinSayisi(lavaboMaxLevel() + 3)).toBe(kabinSayisi(lavaboMaxLevel()));
  });

  it('lavabolar GÖRÜNÜR slotlarda kalır — ön duvarın kör bandına taşmaz', () => {
    // §V ölçümü: ön duvara 1,39 br kalan slot üç kamera kipinde de %0 görünür. Bekçi son
    // lavabonun ÖN kenarını duvardan güvenli uzaklıkta tutar.
    const sonZ = Z_BACK + lavaboSlotOfset(lavaboSayisi(lavaboMaxLevel()) - 1);
    const onKenar = sonZ + LAVABO_KUTU.w / 2;
    expect(Z_FRONT - onKenar).toBeGreaterThan(2.0);
  });

  it('lavabolar doğu duvarına SIĞAR (ölçüm: duvar 7,40 br, 6 tane almıyor)', () => {
    const duvarBoy = Z_FRONT - Z_BACK;
    const kaplanan = (lavaboSayisi(lavaboMaxLevel()) - 1) * LAVABO_SLOT_ARALIK + LAVABO_KUTU.w;
    expect(kaplanan).toBeLessThan(duvarBoy);
    // Ölçümün asıl bulgusu: maxLevel kadar (6) lavabo SIĞMIYOR. Sinyal o yüzden ikiye bölündü.
    const altiTane = (lavaboMaxLevel() - 1) * LAVABO_SLOT_ARALIK + LAVABO_KUTU.w;
    expect(altiTane).toBeGreaterThan(duvarBoy);
  });

  it('lavabolar üst üste binmez (aralık ≥ gövde eni)', () => {
    expect(LAVABO_SLOT_ARALIK).toBeGreaterThanOrEqual(LAVABO_KUTU.w);
    expect(lavaboSlotOfset(1) - lavaboSlotOfset(0)).toBeCloseTo(LAVABO_SLOT_ARALIK, 6);
  });

  it('kabinler odanın x boyuna sığar ve lavabo duvarına DEĞMEZ', () => {
    const sonBolmeX = X1 + KABIN_X_OFSET + kabinSayisi(lavaboMaxLevel()) * KABIN_ADIM;
    expect(sonBolmeX).toBeLessThan(X2 - LAVABO_KUTU.d - 1.0);
    // Kapı kanadı bölme adımını aşmamalı, yoksa kapılar birbirine girer.
    expect(KABIN_KUTU.w).toBeLessThan(KABIN_ADIM);
  });
});

describe('S7/M — müşteri kapıda buharlaşmıyor (G-35)', () => {
  it('WC geçiş durumları koltuğu ve spawn tavanını MEŞGUL ETMEZ', () => {
    // Bu, dengeye dokunmama sözünün ta kendisi: `spawnSystem` tavanı `hasLeftTable` DIŞINDAKİ
    // müşterileri sayıyor. Yeni durumlar listeye girmezse geçiş süresi spawn hızını kısar.
    for (const s of ['toWc', 'wcGiris', 'inWc', 'wcCikis', 'leaving'] as const) {
      expect(hasLeftTable(s)).toBe(true);
    }
    for (const s of ['toTable', 'waitingForTea', 'drinking'] as const) {
      expect(hasLeftTable(s)).toBe(false);
    }
  });

  it('yol kapı EŞİĞİNDEN başlar ve içeride biter', () => {
    const [bx, bz] = wcYol(0);
    expect(bx).toBeCloseTo(LAVABO.door[0], 6);
    expect(bz).toBeCloseTo(LAVABO.door[2], 6);
    const [sx, sz] = wcYol(1);
    expect(sx).toBeCloseTo(LAVABO.wcCorner[0], 6);
    expect(sz).toBeCloseTo(LAVABO.wcCorner[2], 6);
    // Eşik ön duvarın ÖNÜNDE, hedef ARKASINDA: yolun gerçekten odaya girdiğinin ölçütü.
    expect(LAVABO.door[2]).toBeGreaterThan(Z_FRONT);
    expect(LAVABO.wcCorner[2]).toBeLessThan(Z_FRONT);
  });

  it('hedef nokta kapı boşluğunun ARKASINA saklanır (ölçüm: orada görünürlük %0)', () => {
    // Ölçümün asıl bulgusu: kapı EKSENİNDE içeri yürüyen müşteri HİÇ saklanmıyor (%78–100
    // görünür, çünkü boşluktan bakılıyor). Saklanma yalnız YANA sapınca ve yalnız duvarın
    // dibindeki 0,2–1,2 br'lik bantta oluyor; daha içeride oda duvarın ÜSTÜNDEN yeniden açılıyor.
    // Bu yüzden köşe noktası hem yeterince yanda hem de o bandın İÇİNDE olmak zorunda.
    expect(Math.abs(LAVABO.wcCorner[0] - LAVABO.door[0])).toBeGreaterThan(KAPI_YARI + 1.0);
    const derinlik = Z_FRONT - LAVABO.wcCorner[2];
    expect(derinlik).toBeGreaterThan(0.2);
    expect(derinlik).toBeLessThan(1.2);
  });

  it('yol duvara SÜRTMEZ — duvar düzlemini kapı boşluğunun içinde geçer', () => {
    // Tek bacaklı (eşik → köşe) düz yol duvarı x ≈ 12,69'da keser, boşluk 12,70'te başlar:
    // 0,01 br payla duvarın köşesini yalar. Bu yüzden yol İKİ bacaklı. Bekçi kesişimi ölçer.
    let gecis: number | null = null;
    let onceki = wcYol(0);
    for (let i = 1; i <= 400; i++) {
      const p = wcYol(i / 400);
      if (onceki[1] > Z_FRONT && p[1] <= Z_FRONT) gecis = p[0];
      onceki = p;
    }
    expect(gecis).not.toBeNull();
    expect(Math.abs((gecis as number) - LAVABO.door[0])).toBeLessThan(KAPI_YARI - 0.2);
  });

  it('yol SÜREKLİ — hiçbir karede ışınlanma yok', () => {
    let onceki = wcYol(0);
    for (let i = 1; i <= 200; i++) {
      const p = wcYol(i / 200);
      expect(Math.hypot(p[0] - onceki[0], p[1] - onceki[1])).toBeLessThan(0.1);
      onceki = p;
    }
  });

  it('sönme SONDA olur — müşteri kapıda değil, içeride kaybolur', () => {
    expect(wcOlcek(0)).toBe(1);
    expect(wcOlcek(WC_SOLMA_ESIGI)).toBe(1);
    expect(wcOlcek(1)).toBeCloseTo(0, 6);
    // Eşik gerçekten SON tarafta: yolun ilk yarısında müşteri tam boyunda.
    expect(WC_SOLMA_ESIGI).toBeGreaterThan(0.5);
    expect(wcOlcek(0.5)).toBe(1);
    // Monotonik azalır (zıplamasın).
    for (let i = 1; i <= 50; i++) expect(wcOlcek(i / 50)).toBeLessThanOrEqual(wcOlcek((i - 1) / 50));
  });

  it('geçiş süresi görünür ama oyalayıcı değil', () => {
    expect(WC_GECIS).toBeGreaterThan(0.3);
    expect(WC_GECIS).toBeLessThan(2);
  });
});

/**
 * `maketParts.tsx` R3F olduğu için import EDİLEMEZ — S6/③'ün dersi tam buydu: çizim dosyasına
 * yazılmış bir karar bekçilenemedi ve mutasyon kaçtı. Sayılar ölçü katmanına çıktı, ama "çizim
 * gerçekten o katmanı okuyor mu" sorusu import'la cevaplanamıyor. `olcu-donduruldu.test.ts`in
 * belge denetimiyle aynı desen: kaynak METNİ okunur.
 */
describe('S7 — çizim ölçü katmanını gerçekten okuyor mu (kaynak denetimi)', () => {
  const kaynak = readFileSync(new URL('../src/components/three/maketParts.tsx', import.meta.url), 'utf8');

  it('kabin kapısı KayKit modelidir, elle çizilmiş kutu DEĞİL', () => {
    // METNİ değil KULLANIMI ara: `door_A.gltf` bu dosyada bir YORUMDA da geçiyor ve düz
    // `toContain` mutasyonu kaçırıyordu (M13). Ölçüt artık gerçek `src=` ifadesi.
    expect(kaynak).toMatch(/src=\{`\$\{KAY_REST\}door_A\.gltf`\}/);
    expect(kaynak).toContain('scale={KABIN_SCALE}');
    expect(kaynak).toContain('KABIN_MENTESE_ORTA');
  });

  it('sayılar seviyeden türer — sabit "üç lavabo / dört kabin" geri gelemez', () => {
    expect(kaynak).toContain('lavaboSayisi(level)');
    expect(kaynak).toContain('kabinSayisi(level)');
    expect(kaynak).toContain('wcSeviye(st.lavaboLevel');
    // Maketin eski sabit dizileri: geri dönerlerse sinyal ölür.
    expect(kaynak).not.toContain('[-1.7, 0, 1.7]');
    expect(kaynak).not.toContain('[0, 1, 2, 3, 4].map');
  });
});
