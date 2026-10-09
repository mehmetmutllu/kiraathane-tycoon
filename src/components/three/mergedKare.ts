/**
 * drei `<Merged>` / `<Instances>` örnek matrislerini KAÇ KARE okusun (perf #9 · Sprint A).
 *
 * drei'nin varsayılanı `Infinity`: her karede her örneğin `matrixWorld`ü ayrıştırılıp yeniden
 * yazılıyor ve GPU'ya yükleniyordu — masalar, duvar modülleri, fayanslar durağan olduğu hâlde.
 *
 * NEDEN 3 VE NEDEN `key` GEREKMİYOR: drei sayacı (`let iterations = 0`) bileşen GÖVDESİNDE tutar,
 * yani `<Merged>` her render olduğunda sayaç sıfırlanır. Masa açılması, kademe, tema — hepsi
 * prop değişimiyle Merged'i yeniden render eder. İlk karede örneklerin `matrixWorld`ü henüz
 * bayattır (sahne matrisleri çizimde güncellenir), ikincide doğrudur; üçüncü pay.
 */
export const MERGED_KARE = 3;
