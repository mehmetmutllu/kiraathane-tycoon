/**
 * SALT-GÖRSEL AKTÖR KAYDI (Faz G1) — store'da yeri olmayan, konumunu kendi `useFrame`'inde süren
 * NPC'ler (bugün: çaycı/tost ustası) temas gölgesi alabilsin diye konumunu buraya yazar.
 *
 * Neden store değil: bu aktörler her karede kımıldar; store'a yazmak her karede React render'ı
 * tetiklerdi. `perf` ve `screenPointer` ile AYNI kalıp — render dışı, salt-okunur paylaşım noktası.
 *
 * Anahtar sahibine ait sabit bir dize (örn. `kitchen-2`); bileşen unmount olurken kendi kaydını siler.
 */
export const visualActors = new Map<string, { x: number; z: number }>();
