import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, TorusGeometry, BoxGeometry, Vector3 } from 'three';
import type { KiyafetGorunum } from '../../config/kozmetik';
import { onlukParcasi, onlukIzgarasi, kumas, ONLUK_DILIM, ONLUK_EKSEN_Z } from './onluk';

/**
 * 💎 VİTRİNİ KIYAFET PARÇALARI (F4c) — sahibin kıyafetine eklenen yelek/fes/şapka/papyon/atkı.
 *
 * YELEK ÖNLÜK GİBİ GÖVDENİN PROFİLİNDEN üretilir (`onluk.ts`). Aday karesindeki kutu yelek
 * (`tools/vitrin-adaylari.html`) gövdeyi sarmıyordu; S18'de "göğse takılan levha" kolları tam da
 * bu yüzden elenmişti. İki panel önde açık bir V bırakır — gömlek ortada görünür, yelek okunur.
 * Ölçüler HAM rig biriminde (gövde 0,38…1,24 · baş eni 0,86), `kiyafetTak` ile aynı dil.
 */
export const YELEK = {
  yAlt: 0.6,
  yUst: 1.14,
  /** Her panelin yayı; merkezleri ±105° → önde 60°'lik açıklık, arkada paneller buluşur. */
  yayDerece: 150,
  merkezDerece: 105,
  payEk: 0.008,
} as const;

type Profil = { y: number; a: number; r: number }[];
type Tak = (kemik: string, mesh: Mesh | Group, nokta: Vector3) => void;

const mat = (renk: string, metal = false) =>
  new MeshStandardMaterial({ color: renk, roughness: metal ? 0.35 : 0.85, metalness: metal ? 0.6 : 0 });

/** Yelek panelinin yüzeyinde (halka i, dilim j) noktası — düğme ve köstek buraya oturur. */
function panelNoktasi(profil: Profil, isaret: 1 | -1, i: number, j: number, disa = 0.012): Vector3 {
  const yay = (YELEK.yayDerece * Math.PI) / 180;
  const merkez = (isaret * YELEK.merkezDerece * Math.PI) / 180;
  const iz = onlukIzgarasi(profil, YELEK.yAlt, YELEK.yUst, yay, 0, YELEK.payEk, merkez);
  const a = iz.dilimA(j);
  const r = iz.yaricap[i][j] + disa;
  return new Vector3(Math.sin(a) * r, iz.halkaY(i), ONLUK_EKSEN_Z + Math.cos(a) * r);
}

export function kiyafetParcalari(g: KiyafetGorunum, profil: Profil, tak: Tak, bas: { tepe: number; yaricap: number }) {
  const sifir = new Vector3(0, 0, 0);
  if (g.yelek) {
    const yay = (YELEK.yayDerece * Math.PI) / 180;
    for (const isaret of [1, -1] as const) {
      const merkez = (isaret * YELEK.merkezDerece * Math.PI) / 180;
      tak('chest', new Mesh(onlukParcasi(profil, YELEK.yAlt, YELEK.yUst, yay, 0, YELEK.payEk, merkez), kumas(g.yelek)), sifir);
    }
    // Düğmeler sol panelin ön kenarında (dilim 0 = açıklığa bakan kenar, +x tarafı).
    if (g.dugme) {
      for (const i of [2, 4, 6]) {
        const d = new Mesh(new CylinderGeometry(0.022, 0.022, 0.02, 8), mat(g.dugme, true));
        const p = panelNoktasi(profil, 1, i, 1);
        d.rotation.x = Math.PI / 2;
        d.rotation.z = -Math.atan2(p.x, p.z - ONLUK_EKSEN_Z);
        tak('chest', d, p);
      }
    }
    // Köstek: ön kenardaki düğmeden cebe inen altın zincir + cepte saat.
    if (g.kostek) {
      const bas0 = panelNoktasi(profil, 1, 4, 1);
      const cep = panelNoktasi(profil, 1, 3, Math.round(ONLUK_DILIM * 0.35));
      const zincir = new Mesh(new CylinderGeometry(0.009, 0.009, bas0.distanceTo(cep), 5), mat('#d4af37', true));
      zincir.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), cep.clone().sub(bas0).normalize());
      tak('chest', zincir, bas0.clone().lerp(cep, 0.5));
      const saat = new Mesh(new CylinderGeometry(0.045, 0.045, 0.02, 12), mat('#d4af37', true));
      saat.rotation.x = Math.PI / 2;
      tak('chest', saat, cep);
    }
  }
  if (g.papyon) {
    const p = new Group();
    for (const yon of [-1, 1]) {
      const kanat = new Mesh(new BoxGeometry(0.1, 0.07, 0.04), mat(g.papyon));
      kanat.position.x = yon * 0.055;
      kanat.rotation.z = -yon * 0.25;
      p.add(kanat);
    }
    p.add(new Mesh(new BoxGeometry(0.035, 0.045, 0.05), mat(g.papyon)));
    tak('chest', p, new Vector3(0, 1.17, boynunOnu(profil)));
  }
  if (g.atki) {
    const a = new Group();
    const halka = new Mesh(new TorusGeometry(boynunOnu(profil) * 0.95, 0.07, 6, 14), kumas(g.atki));
    halka.rotation.x = Math.PI / 2;
    a.add(halka);
    const uc = new Mesh(new BoxGeometry(0.12, 0.4, 0.05), kumas(g.atki));
    uc.position.set(0.1, -0.22, boynunOnu(profil));
    a.add(uc);
    tak('chest', a, new Vector3(0, 1.2, ONLUK_EKSEN_Z));
  }
  const { tepe, yaricap } = bas;
  if (g.kasket) {
    const k = new Group();
    k.add(new Mesh(new CylinderGeometry(yaricap * 0.94, yaricap, 0.16, 14), mat(g.kasket)));
    const vizor = new Mesh(new BoxGeometry(yaricap * 1.15, 0.045, yaricap * 0.7), mat(g.kasket));
    vizor.position.set(0, -0.06, yaricap * 0.95);
    k.add(vizor);
    tak('head', k, new Vector3(0, tepe - 0.05, 0));
  }
  if (g.fes) {
    const f = new Group();
    f.add(new Mesh(new CylinderGeometry(yaricap * 0.62, yaricap * 0.8, 0.34, 14), mat(g.fes)));
    const puskul = new Mesh(new BoxGeometry(0.03, 0.2, 0.03), mat('#1a1a1a'));
    puskul.position.set(yaricap * 0.5, 0.02, 0);
    f.add(puskul);
    tak('head', f, new Vector3(0, tepe + 0.08, 0));
  }
  if (g.hasir) {
    const h = new Group();
    h.add(new Mesh(new CylinderGeometry(yaricap * 1.7, yaricap * 1.7, 0.035, 18), mat(g.hasir)));
    const tac = new Mesh(new CylinderGeometry(yaricap * 0.8, yaricap * 0.9, 0.22, 14), mat(g.hasir));
    tac.position.y = 0.11;
    h.add(tac);
    const bant = new Mesh(new CylinderGeometry(yaricap * 0.91, yaricap * 0.91, 0.06, 14), mat('#3b2b1d'));
    bant.position.y = 0.04;
    h.add(bant);
    tak('head', h, new Vector3(0, tepe - 0.02, 0));
  }
}

/** Boyun dibinde gövdenin ön yüzü (z) — papyon ve atkı ucu derinin üstüne otursun. */
function boynunOnu(profil: Profil): number {
  let r = 0;
  for (const p of profil) if (Math.abs(p.y - 1.14) < 0.05 && Math.abs(p.a) < 0.3) r = Math.max(r, p.r);
  return ONLUK_EKSEN_Z + (r || 0.25) + 0.02;
}
