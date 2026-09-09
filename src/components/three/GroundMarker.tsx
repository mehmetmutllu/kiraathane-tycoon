import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MathUtils, type Group, type MeshBasicMaterial } from 'three';
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

/**
 * Sade zemin işareti (D-017 §2): havada Html rozet / iri disk+koni YOK. Yerde UFAK, şeffaf beyazımsı
 * çember + ortasında DÜZ zemin yazısı (ne yapacağı: "Yeni Masa" / "Garson" / "Yükselt") + maliyet.
 * Kategori rengi yalnız ince halka + dolum yayında (yeşil=aç / mavi=personel / altın=yükseltme).
 * Parası yetiyorsa hafif parlar (afford).
 *
 * **C2 — KATMAN AYRIMI (D-038'in dördüncü kanalı).** İşaretlerin hepsi aynı ağırlıkta çizilince
 * "hangisi şu anki adım" okunmuyordu (ölçüm: ekranda ort. 7,8 / en çok 16 işaret, hepsi aynı ses).
 * Nokta silinmez — kullanıcı kararı gereği her objenin yükseltme noktası kendi yanında durur — ama
 * sesi üç kademeye ayrılır (`markerTier`):
 *   - `aktif`   → yazı + maliyet + tam parlak halka + hafif nabız. Ekranda EN FAZLA BİR TANE olabilir,
 *                 çünkü kaynağı kameranın/okun/bandın okuduğu TEK `activeStep` hedefi.
 *   - `konusan` → oyuncu yaklaştı: yazı + maliyet açılır, nabız yok.
 *   - `sessiz`  → uzakta: küçük, YAZISIZ halka. Dolum yayı her hâlde görünür (kısmi dolum kaybolmasın).
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
  radius?: number;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const scaleRef = useRef<Group>(null);
  const speakRef = useRef<Group>(null);
  const discRef = useRef<MeshBasicMaterial>(null);
  const ringRef = useRef<MeshBasicMaterial>(null);
  /** 0 = sessiz … 1 = konuşuyor (damp'lenmiş). */
  const say = useRef(0);

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
    // Halka: sessizken soluk, konuşurken afford'a göre, AKTİF adımda tam parlak (tek yüksek ses).
    if (ringRef.current) {
      const loud = tier === 'aktif' ? 1 : afford ? 0.85 : 0.5;
      ringRef.current.opacity = 0.28 + (loud - 0.28) * s;
    }
    if (discRef.current) {
      const loud = afford ? 0.26 : 0.16;
      discRef.current.opacity = 0.07 + (loud - 0.07) * s;
    }
  });

  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={scaleRef}>
        {/* şeffaf beyazımsı zemin çemberi */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 40]} />
          <meshBasicMaterial ref={discRef} color="#ffffff" transparent opacity={0.16} depthWrite={false} />
        </mesh>
        {/* ince kategori halkası */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.9, radius, 40]} />
          <meshBasicMaterial ref={ringRef} color={tint} transparent opacity={0.5} depthWrite={false} />
        </mesh>
        {/* dolum yayı (progress) — büyüyen iç disk. Sessizken de görünür: kısmi dolum kaybolmasın. */}
        {p > 0.001 && (
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[p, p, 1]}>
            <circleGeometry args={[radius * 0.85, 40]} />
            <meshBasicMaterial color={tint} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        )}
        {/* KONUŞAN katman: yazı + maliyet. Sessizken hiç çizilmez (16 kez "Masa" yazmasın). */}
        <group ref={speakRef} visible={false}>
          {/* zemin yazısı (havada değil; objenin değil yerin üstünde) */}
          <Text
            font={GAME_FONT_3D}
            fontWeight={700}
            position={[0, 0.05, sub ? -0.16 : 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#1a1a1a"
            maxWidth={radius * 2.1}
            textAlign="center"
          >
            {label}
          </Text>
          {sub && (
            <>
              {pip && (
                <group position={[-0.2 - sub.length * 0.08, 0.05, 0.32]}>
                  {/* Elmas pulu DÖRTGEN, para pulu YUVARLAK — renk körü bir oyuncu için de
                      iki para birimi biçimden ayrılır (çoklu sinyal, feedback_upgrade_legibility). */}
                  <mesh rotation={[-Math.PI / 2, 0, pip === 'gem' ? Math.PI / 4 : 0]}>
                    <circleGeometry args={[pip === 'gem' ? 0.125 : 0.115, pip === 'gem' ? 4 : 20]} />
                    <meshBasicMaterial color={pip === 'gem' ? '#81d4fa' : '#ffc933'} depthWrite={false} />
                  </mesh>
                  <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, pip === 'gem' ? Math.PI / 4 : 0]}>
                    <ringGeometry args={
                      pip === 'gem' ? [0.09, 0.125, 4] : [0.085, 0.115, 20]} />
                    <meshBasicMaterial color={pip === 'gem' ? '#0277bd' : '#b87400'} depthWrite={false} />
                  </mesh>
                </group>
              )}
              <Text
                font={GAME_FONT_3D}
                fontWeight={700}
                position={[pip ? 0.08 : 0, 0.05, 0.32]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.29}
                color="#ffe082"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.012}
                outlineColor="#1a1a1a"
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
