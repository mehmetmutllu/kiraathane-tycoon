import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MathUtils, MeshBasicMaterial, Shape, type Group, type Mesh } from 'three';
import { activeStep, markerTier } from '../../game/activeStep';
import { dwellState } from '../../game/dwell';
import { useGame } from '../../game/store';
import type { Vec3 } from '../../game/types';

/** Oyun fontu (Baloo 2, OFL) — YEREL bundle; troika'nın CDN default fontu kullanılmaz
 * (D-018 dersi + offline APK'da zemin yazıları her zaman çalışsın). */
const GAME_FONT_3D = '/assets/fonts/Baloo2.ttf';

/**
 * ÖLÇEK ARTIK MESAFEYE GÖRE DEĞİŞMEZ (kullanıcı 2026-09-09: "yaklaşınca büyümesi çirkin duruyor").
 * Eskiden işaret uzaktayken 0,55 ölçekte duruyor, oyuncu yaklaştıkça 1,00'e doğru büyüyordu —
 * yani ekranda sürekli nefes alan bir şey vardı. Artık boy SABİT; yalnız oyuncu işaretin
 * ÜZERİNDEYKEN hafif bir kabarma olur. Tek Odak (D-080) katmanlaması ölçekten değil, YAZIDAN
 * devam ediyor: uzaktaki işaret hâlâ yazısız çizilir.
 */
const UZERINDE_BUYUME = 1.12;
/** Oyuncu bu yarıçapın içindeyse "üzerinde" sayılır (işaretin kendi ölçüsüne oranlı). */
const UZERINDE_PAYI = 1.35;
/** Nabız: aktif adımın işareti yalnızca bu kadar oynar (hafif — `feedback_visual_polish`). */
const PULSE_AMP = 0.04;
const PULSE_HZ = 0.52;
/** Ses geçişi yumuşatma katsayısı (MathUtils.damp) — yaklaşınca "pat" diye açılmasın. */
const SAY_DAMP = 14;
/** Yazı bu ses seviyesinin üstünde çizilir. */
const TEXT_ON = 0.55;

/**
 * ÇERÇEVENİN GENİŞLİĞİ YAZIDAN ÇÖZÜLÜR, TAHMİN EDİLMEZ.
 *
 * İlk hâlde çerçeve `radius`tan türüyordu ve yazı ortalanıyordu; küçük işaretlerde (masa/Usta,
 * r = 0,6) "YÜKSELT" ile solundaki ok **üst üste biniyordu** (kullanıcı 2026-09-09). Sebep
 * ikisinin aynı genişlik için yarışması ve kimsenin ölçmemesiydi. Artık genişlik
 * `ok bloğu + boşluk + yazının gerçek genişliği` olarak kuruluyor. Baloo 2 Bold'da ortalama
 * harf ilerlemesi ≈ 0,58 em; kısa büyük-harf etiketlerde yeterli yaklaşım — ve `maxWidth` üst
 * sınırı ayrıca kilitliyor, yani hata payı taşmaya değil sarmaya gider.
 */
const HARF_EM = 0.58;
const ETIKET_PUNTO = 0.38;
const OK_GENIS = 0.34;
const OK_BOSLUK = 0.16;
const KENAR_PAYI = 0.18;

/** Köşe parantezi: kol uzunluğu · kalınlık · DIŞ KÖŞE YARIÇAPI (yarı-yüksekliğe oran). */
const KOL = 0.46;
const KALINLIK = 0.17;
const KOSE_R = 0.3;
/** İç zeminin çerçeveden içeri kaçtığı pay — parantez çizgilerinin DIŞINA taşmasın. */
const ZEMIN_ICE = 0.055;

/* İşaretin zemin düzlemindeki YEREL ekseni: `rotation=[-PI/2,0,0]` sonrası yerel +Y dünyada
   −Z'ye bakar; yani "yukarı" = kameradan uzağa. Yazı, ok ve dolum bu eksende kurulur. */

/** Elmas silüeti — eski "mavi kare" pulun yerine gerçek taş kesimi (G-08). */
function gemShape(): Shape {
  const s = new Shape();
  s.moveTo(-0.42, 0.34);
  s.lineTo(0.42, 0.34);
  s.lineTo(0.6, 0.1);
  s.lineTo(0, -0.56);
  s.lineTo(-0.6, 0.1);
  s.closePath();
  return s;
}

/**
 * Yuvarlak köşeli dikdörtgen — işaretin İÇ ZEMİNİ.
 *
 * Önce düz `planeGeometry` idi: parantezlerin köşesi yuvarlaktı ama içteki koyu kare keskin
 * kalıyor ve kenarları parantezlerin dışına TAŞIYORDU (kullanıcı 2026-09-09: "etrafındaki
 * çizgilere border radius geldi ama içindeki kareye gelmedi... üstteki çizgilerin etrafından
 * taşıyor"). Zemin artık hem yuvarlak köşeli hem de çerçevenin İÇİNE gömülü (`ZEMIN_ICE`).
 */
function roundedRectShape(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const hw = w / 2;
  const hh = h / 2;
  const rr = Math.min(r, hw, hh);
  s.moveTo(-hw + rr, -hh);
  s.lineTo(hw - rr, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + rr);
  s.lineTo(hw, hh - rr);
  s.quadraticCurveTo(hw, hh, hw - rr, hh);
  s.lineTo(-hw + rr, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - rr);
  s.lineTo(-hw, -hh + rr);
  s.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
  s.closePath();
  return s;
}

/** Dış köşesi YUVARLATILMIŞ L parantezi; köşe orijinde, kollar +x ve +y yönünde. */
function bracketShape(kol: number, kalinlik: number, r: number): Shape {
  const s = new Shape();
  const rr = Math.min(r, kalinlik * 0.95, kol * 0.5);
  s.moveTo(kol, 0);
  s.lineTo(rr, 0);
  s.quadraticCurveTo(0, 0, 0, rr);
  s.lineTo(0, kol);
  s.lineTo(kalinlik, kol);
  s.lineTo(kalinlik, kalinlik);
  s.lineTo(kol, kalinlik);
  s.closePath();
  return s;
}

/**
 * Sade zemin işareti (D-017 §2): havada rozet / iri disk+koni YOK. Yerde işaret + düz zemin
 * yazısı + maliyet.
 *
 * **TEK BİÇİM (G-10 → 2026-09-09 ikinci tur):** köşe parantezli, dış köşeleri yuvarlatılmış
 * çerçeve; kenar ortaları boş, dolum alttan üste. Usta noktası bir ara yuvarlak yapılmıştı;
 * kullanıcı *"yuvarlak yapma, direkt yükseltme gibi olsun"* dedi — biçim ayrımı kalktı, geriye
 * tek fark kaldı: Usta'da dolum ₺ değil **BEKLEME** ve rengi yeşil (`dwellId`).
 *
 * **C2 — KATMAN AYRIMI (D-038'in dördüncü kanalı).** Hepsi aynı ağırlıkta çizilince "hangisi şu
 * anki adım" okunmuyordu (ölçüm: ekranda ort. 7,8 / en çok 16 işaret). Nokta silinmez, sesi üç
 * kademeye ayrılır (`markerTier`): `aktif` · `konusan` · `sessiz`. Geçiş `useFrame` içinde
 * damp'lenir ve React'e DOKUNMAZ (her kare setState = 60 render/sn).
 */
export function GroundMarker({
  pos,
  label,
  sub,
  pip,
  tint,
  progress = 0,
  afford = false,
  radius = 0.85,
  arrow = false,
  dwellId,
}: {
  pos: Vec3;
  label: string;
  sub?: string;
  pip?: 'coin' | 'gem';
  tint: string;
  progress?: number;
  afford?: boolean;
  /** Ölçü tabanı: çerçevenin yarı-yüksekliği (genişlik yazıdan çözülür). */
  radius?: number;
  /** Yükseltme noktası mı — öyleyse yazının soluna düz yukarı ok çizilir (G-12). */
  arrow?: boolean;
  /** Verilirse: oyuncu üstünde DURDUKÇA işaret YEŞİL dolar; dolunca onay modali açılır.
   *  (Usta noktaları. Biçim ayrı değil — kullanıcı 2026-09-09: "yuvarlak yapma, yükseltme gibi olsun".) */
  dwellId?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const r = radius;
  const punto = r * ETIKET_PUNTO;
  const yaziGen = label.length * HARF_EM * punto;
  const okBlok = arrow ? (OK_GENIS + OK_BOSLUK) * r : 0;
  const hw = Math.max(r * 1.05, (okBlok + yaziGen) / 2 + KENAR_PAYI * r);
  const hh = r;
  const yaziSol = -hw + KENAR_PAYI * r + okBlok;
  const okX = -hw + KENAR_PAYI * r + (OK_GENIS * r) / 2;

  const scaleRef = useRef<Group>(null);
  const speakRef = useRef<Group>(null);
  const fillRef = useRef<Mesh>(null);
  const say = useRef(0);
  const buyume = useRef(1);

  const bracketMat = useMemo(
    () => new MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.5, depthWrite: false }),
    [tint],
  );
  const plateMat = useMemo(
    () => new MeshBasicMaterial({ color: '#14202a', transparent: true, opacity: 0.16, depthWrite: false }),
    [],
  );
  useEffect(() => () => { bracketMat.dispose(); plateMat.dispose(); }, [bracketMat, plateMat]);

  const gem = useMemo(gemShape, []);
  const bracket = useMemo(() => bracketShape(hh * KOL, hh * KALINLIK, hh * KOSE_R), [hh]);
  // Zemin çerçeveden ZEMIN_ICE kadar içeride ve köşeleri parantezle AYNI yarıçapta.
  const zeminW = 2 * (hw - hh * ZEMIN_ICE);
  const zeminH = 2 * (hh - hh * ZEMIN_ICE);
  const zemin = useMemo(() => roundedRectShape(zeminW, zeminH, hh * KOSE_R), [zeminW, zeminH, hh]);

  const koseler = useMemo(
    () => [
      { pos: [-hw, -hh, 0] as [number, number, number], rot: 0 },
      { pos: [hw, -hh, 0] as [number, number, number], rot: Math.PI / 2 },
      { pos: [hw, hh, 0] as [number, number, number], rot: Math.PI },
      { pos: [-hw, hh, 0] as [number, number, number], rot: -Math.PI / 2 },
    ],
    [hw, hh],
  );

  useFrame((state, dt) => {
    const tier = markerTier(pos, activeStep, useGame.getState().player);
    say.current = MathUtils.damp(say.current, tier === 'sessiz' ? 0 : 1, SAY_DAMP, dt);
    const s = say.current;

    if (scaleRef.current) {
      const pulse = tier === 'aktif'
        ? 1 + PULSE_AMP * Math.sin(state.clock.elapsedTime * PULSE_HZ * Math.PI * 2)
        : 1;
      const pl = useGame.getState().player;
      const uzerinde = (pl[0] - pos[0]) ** 2 + (pl[2] - pos[2]) ** 2 <= (hw * UZERINDE_PAYI) ** 2;
      buyume.current = MathUtils.damp(buyume.current, uzerinde ? UZERINDE_BUYUME : 1, 12, dt);
      scaleRef.current.scale.setScalar(buyume.current * pulse);
    }
    if (speakRef.current) speakRef.current.visible = s > TEXT_ON;
    const loud = tier === 'aktif' ? 1 : afford ? 0.95 : 0.72;
    bracketMat.opacity = 0.45 + (loud - 0.45) * s;
    plateMat.opacity = 0.1 + ((afford ? 0.34 : 0.24) - 0.1) * s;
  });

  // Dolum: alttan üste (kare) — ölçekle birlikte kaydırılır ki alt kenara yapışsın.
  const fillH = zeminH * 0.9;
  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.scale.y = p;
      fillRef.current.position.y = -fillH / 2 + (fillH * p) / 2;
    }
  }, [p, fillH]);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={scaleRef}>
        {/* şeffaf koyu zemin — yazı ve çerçeve açık ahşabın üstünde okunsun */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={plateMat}>
          <shapeGeometry args={[zemin]} />
        </mesh>

        {/* ₺ dolumu — ALTTAN ÜSTE */}
        {p > 0.001 && (
          <group position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={fillRef}>
              <planeGeometry args={[zeminW * 0.9, fillH]} />
              <meshBasicMaterial color={tint} transparent opacity={0.42} depthWrite={false} />
            </mesh>
          </group>
        )}

        {/* BEKLEME dolumu (Usta) — aynı kare, aynı yön, YEŞİL. Oyuncu üstünde durdukça dolar,
            dolunca onay modali açılır. React'e dokunmaz: ölçek her karede `dwellState`ten yazılır. */}
        {dwellId && <DwellFill w={zeminW * 0.9} h={fillH} dwellId={dwellId} />}

        {/* köşe parantezleri — kenar ortaları BOŞ, dış köşeler YUVARLATILMIŞ */}
        <group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {koseler.map((k, i) => (
            <mesh key={i} position={k.pos} rotation={[0, 0, k.rot]} material={bracketMat}>
              <shapeGeometry args={[bracket]} />
            </mesh>
          ))}
        </group>

        {/* KONUŞAN katman: yazı + maliyet. Sessizken hiç çizilmez. */}
        <group ref={speakRef} visible={false}>
          {arrow && (
            <group position={[okX, 0.05, -hh * 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh position={[0, -r * 0.13, 0]}>
                <planeGeometry args={[r * 0.2, r * 0.4]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} />
              </mesh>
              {/* uç: 3 kenarlı çember = üçgen; +90° döndürülünce yukarı bakar */}
              <mesh position={[0, r * 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <circleGeometry args={[r * 0.32, 3]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} />
              </mesh>
            </group>
          )}
          <Text
            font={GAME_FONT_3D}
            fontWeight={800}
            letterSpacing={0.02}
            position={[arrow ? yaziSol : 0, 0.05, sub ? -hh * 0.3 : 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={punto}
            color="#ffffff"
            anchorX={arrow ? 'left' : 'center'}
            anchorY="middle"
            outlineWidth={punto * 0.1}
            outlineColor="#14202a"
            maxWidth={2 * hw - okBlok - KENAR_PAYI * r * 2}
            textAlign={arrow ? 'left' : 'center'}
          >
            {label}
          </Text>
          {sub && (
            <>
              {pip && (
                <group position={[-(0.12 + sub.length * 0.1) * r, 0.05, hh * 0.52]}>
                  {/* Elmas GERÇEK taş silüeti, para pulu YUVARLAK — renk körü bir oyuncu için de
                      iki para birimi biçimden ayrılır (feedback_upgrade_legibility). */}
                  {pip === 'gem' ? (
                    <>
                      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[r * 0.5, r * 0.5, 1]}>
                        <shapeGeometry args={[gem]} />
                        <meshBasicMaterial color="#0277bd" depthWrite={false} />
                      </mesh>
                      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[r * 0.4, r * 0.4, 1]}>
                        <shapeGeometry args={[gem]} />
                        <meshBasicMaterial color="#81d4fa" depthWrite={false} />
                      </mesh>
                    </>
                  ) : (
                    <>
                      <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[r * 0.19, 20]} />
                        <meshBasicMaterial color="#ffc933" depthWrite={false} />
                      </mesh>
                      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[r * 0.14, r * 0.19, 20]} />
                        <meshBasicMaterial color="#b87400" depthWrite={false} />
                      </mesh>
                    </>
                  )}
                </group>
              )}
              <Text
                font={GAME_FONT_3D}
                fontWeight={800}
                position={[pip ? 0.13 * r : 0, 0.05, hh * 0.52]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={r * 0.36}
                color="#ffe082"
                anchorX="center"
                anchorY="middle"
                outlineWidth={r * 0.026}
                outlineColor="#14202a"
              >
                {sub}
              </Text>
            </>
          )}
        </group>
      </group>
    </group>
  );
}

/**
 * Bekleme dolumu — `dwellState`i her karede okuyup yeşil dikdörtgeni alttan üste büyütür.
 * Ayrı bileşen ve `useFrame` içinde ölçek yazıyor, çünkü bunu React state'i ile yapmak saniyede
 * 60 render demekti (`activeStep`/`dwellState` deseni, D-038).
 */
function DwellFill({ w, h, dwellId }: { w: number; h: number; dwellId: string }) {
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const d = dwellState.id === dwellId ? dwellState.p : 0;
    m.visible = d > 0.005;
    if (!m.visible) return;
    m.scale.y = d;
    m.position.y = -h / 2 + (h * d) / 2;
  });
  return (
    <group position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={mesh} visible={false}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#5ddb6a" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
