import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MathUtils, MeshBasicMaterial, Shape, type Group, type Mesh } from 'three';
import { activeStep, markerTier } from '../../game/activeStep';
import { useGame } from '../../game/store';
import type { Vec3 } from '../../game/types';

/** Oyun fontu (Baloo 2, OFL) — YEREL bundle; troika'nın CDN default fontu kullanılmaz
 * (D-018 dersi + offline APK'da zemin yazıları her zaman çalışsın; Faz 7 TODO kapandı). */
const GAME_FONT_3D = '/assets/fonts/Baloo2.ttf';

/** Sessiz işaretin ölçeği (konuşan hâlinin oranı) — yer bilgisi durur, ses düşer. */
const SILENT_SCALE = 0.55;
/** Nabız: aktif adımın işareti yalnızca bu kadar oynar (hafif — `feedback_visual_polish`). */
const PULSE_AMP = 0.04;
const PULSE_HZ = 0.52;
/** Ses geçişi yumuşatma katsayısı (MathUtils.damp) — yaklaşınca "pat" diye açılmasın. */
const SAY_DAMP = 14;
/** Yazı bu ses seviyesinin üstünde çizilir. */
const TEXT_ON = 0.55;

/** Köşe parantezinin kol uzunluğu ve kalınlığı (yarı-ölçüye oran). */
const BRACKET_ARM = 0.44;
const BRACKET_THICK = 0.18;

/**
 * İşaretin zemin düzlemindeki YEREL ekseni: `rotation=[-PI/2,0,0]` sonrası yerel +Y dünyada
 * −Z'ye bakar. Yani "yukarı" = kameradan uzağa. Yazı, ok ve dolum bu eksende kurulur —
 * dolumun "alttan üste" gitmesi bu yüzden yerel +Y yönüdür.
 */

/** Elmas silüeti (G-08: eski "mavi kare" pulun yerine gerçek taş kesimi). */
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
 * Sade zemin işareti (D-017 §2): havada Html rozet / iri disk+koni YOK. Yerde UFAK işaret +
 * ortasında DÜZ zemin yazısı + maliyet. Kategori rengi yalnız köşe parantezlerinde ve dolumda.
 *
 * **G-10 (2026-09-09 kullanıcı):** çember "oyun yansıtmıyor" → **köşe parantezli kare**.
 * Kenarların ortası boş; yalnız dört köşe çizilir. Nişangâh hissi, tycoon dili.
 * **G-13:** dolum artık büyüyen disk değil, **alttan üste dolan kare** — sıvı/şarj okuması.
 * **G-11/G-12:** her yükseltme noktası aynı sözü söyler ("YÜKSELT") ve solunda düz yukarı ok
 * durur; ayrımı METİN değil KONUM yapar (mekânsal tycoon, `feedback_spatial_tycoon_ux`).
 *
 * **C2 — KATMAN AYRIMI (D-038'in dördüncü kanalı).** İşaretlerin hepsi aynı ağırlıkta çizilince
 * "hangisi şu anki adım" okunmuyordu (ölçüm: ekranda ort. 7,8 / en çok 16 işaret, hepsi aynı ses).
 * Nokta silinmez — kullanıcı kararı gereği her objenin yükseltme noktası kendi yanında durur — ama
 * sesi üç kademeye ayrılır (`markerTier`):
 *   - `aktif`   → yazı + maliyet + tam parlak parantez + hafif nabız. Ekranda EN FAZLA BİR TANE.
 *   - `konusan` → oyuncu yaklaştı: yazı + maliyet açılır, nabız yok.
 *   - `sessiz`  → uzakta: küçük, YAZISIZ parantez. Dolum her hâlde görünür (kısmi dolum kaybolmasın).
 * Geçiş `useFrame` içinde damp'lenir ve React'e DOKUNMAZ (her kare setState = 60 render/sn).
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
}: {
  pos: Vec3;
  label: string;
  sub?: string;
  /** Sub bir MALİYETSE yanına para birimi pulu çiz: altın pul (₺) ya da mavi elmas (💎).
   *  D8: Usta noktası aynı işaretin 💎 kimliğidir — ayrı bir görsel dil açılmadı, para birimi
   *  değişti (kullanıcı kararı: "aynı nokta, 💎 kimliği + onay çubuğu"). */
  pip?: 'coin' | 'gem';
  tint: string;
  progress?: number;
  afford?: boolean;
  /** Karenin yarı-ölçüsü (eski adı yarıçaptı; kare geçişinde anlam korundu). */
  radius?: number;
  /** Yükseltme noktası mı — öyleyse yazının soluna düz yukarı ok çizilir (G-12). */
  arrow?: boolean;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const r = radius;
  const scaleRef = useRef<Group>(null);
  const speakRef = useRef<Group>(null);
  const fillRef = useRef<Mesh>(null);
  /** 0 = sessiz … 1 = konuşuyor (damp'lenmiş). */
  const say = useRef(0);

  // Parantez sekiz ayrı mesh ama TEK materyal — opaklık her karede bir kez yazılır.
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

  // Dört köşe × iki kol. Kollar köşeden İÇERİ doğru uzar; kenarların ortası bilerek boş.
  const arms = useMemo(() => {
    const arm = r * BRACKET_ARM;
    const th = r * BRACKET_THICK;
    const out: { pos: [number, number, number]; size: [number, number] }[] = [];
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        // yatay kol: köşeden içeri
        out.push({ pos: [sx * (r - arm / 2), sy * (r - th / 2), 0], size: [arm, th] });
        // dikey kol: köşe karesi iki kez çizilmesin diye th kadar kısaltılır
        out.push({ pos: [sx * (r - th / 2), sy * (r - th / 2 - (arm - th) / 2), 0], size: [th, arm - th] });
      }
    }
    return out;
  }, [r]);

  useFrame((state, dt) => {
    const tier = markerTier(pos, activeStep, useGame.getState().player);
    say.current = MathUtils.damp(say.current, tier === 'sessiz' ? 0 : 1, SAY_DAMP, dt);
    const s = say.current;

    if (scaleRef.current) {
      const pulse = tier === 'aktif'
        ? 1 + PULSE_AMP * Math.sin(state.clock.elapsedTime * PULSE_HZ * Math.PI * 2)
        : 1;
      scaleRef.current.scale.setScalar((SILENT_SCALE + (1 - SILENT_SCALE) * s) * pulse);
    }
    if (speakRef.current) speakRef.current.visible = s > TEXT_ON;
    // Parantez: sessizken soluk, konuşurken afford'a göre, AKTİF adımda tam parlak (tek yüksek ses).
    const loud = tier === 'aktif' ? 1 : afford ? 0.95 : 0.72;
    bracketMat.opacity = 0.45 + (loud - 0.45) * s;
    plateMat.opacity = 0.10 + ((afford ? 0.34 : 0.24) - 0.10) * s;
  });

  // Alttan üste dolum: yerel −Y kenarına yapışık kalsın diye ölçekle birlikte kaydırılır.
  const fillH = 2 * r * 0.86;
  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.scale.y = p;
      fillRef.current.position.y = -fillH / 2 + (fillH * p) / 2;
    }
  }, [p, fillH]);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={scaleRef}>
        {/* şeffaf beyazımsı zemin karesi */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={plateMat}>
          <planeGeometry args={[2 * r, 2 * r]} />
        </mesh>

        {/* dolum (progress) — ALTTAN ÜSTE dolan kare. Sessizken de görünür: kısmi dolum kaybolmasın. */}
        {p > 0.001 && (
          <group position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={fillRef}>
              <planeGeometry args={[2 * r * 0.86, fillH]} />
              <meshBasicMaterial color={tint} transparent opacity={0.42} depthWrite={false} />
            </mesh>
          </group>
        )}

        {/* köşe parantezleri — kenar ortaları BOŞ (G-10) */}
        <group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {arms.map((a, i) => (
            <mesh key={i} position={a.pos} material={bracketMat}>
              <planeGeometry args={a.size} />
            </mesh>
          ))}
        </group>

        {/* KONUŞAN katman: yazı + maliyet. Sessizken hiç çizilmez (16 kez "YÜKSELT" yazmasın). */}
        <group ref={speakRef} visible={false}>
          {/* Düz yukarı ok — yalnız yükseltme noktalarında, yazının solunda (G-12). */}
          {arrow && (
            <group position={[-r * 0.66, 0.05, sub ? -0.16 : 0]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* gövde */}
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
          {/* zemin yazısı (havada değil; objenin değil yerin üstünde) */}
          <Text
            font={GAME_FONT_3D}
            fontWeight={800}
            letterSpacing={0.02}
            position={[arrow ? r * 0.14 : 0, 0.05, sub ? -0.16 : 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={r * 0.42}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={r * 0.038}
            outlineColor="#14202a"
            maxWidth={r * 2.4}
            textAlign="center"
          >
            {label}
          </Text>
          {sub && (
            <>
              {pip && (
                <group position={[-0.2 - sub.length * 0.08, 0.05, 0.32]}>
                  {/* Elmas GERÇEK taş silüeti, para pulu YUVARLAK — renk körü bir oyuncu için de
                      iki para birimi biçimden ayrılır (çoklu sinyal, feedback_upgrade_legibility). */}
                  {pip === 'gem' ? (
                    <>
                      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[0.3, 0.3, 1]}>
                        <shapeGeometry args={[gem]} />
                        <meshBasicMaterial color="#0277bd" depthWrite={false} />
                      </mesh>
                      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.24, 0.24, 1]}>
                        <shapeGeometry args={[gem]} />
                        <meshBasicMaterial color="#81d4fa" depthWrite={false} />
                      </mesh>
                    </>
                  ) : (
                    <>
                      <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.115, 20]} />
                        <meshBasicMaterial color="#ffc933" depthWrite={false} />
                      </mesh>
                      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.085, 0.115, 20]} />
                        <meshBasicMaterial color="#b87400" depthWrite={false} />
                      </mesh>
                    </>
                  )}
                </group>
              )}
              <Text
                font={GAME_FONT_3D}
                fontWeight={800}
                position={[pip ? 0.08 : 0, 0.05, 0.32]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.29}
                color="#ffe082"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.016}
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
