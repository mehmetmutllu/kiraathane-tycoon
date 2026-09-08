/**
 * questProgress.ts — GÖREV HATTININ KİMLİĞİ (D2, D-088).
 *
 * NEDEN: kayıt bugüne dek "kaçıncı görevdeyim"i (`questIndex: number`) saklıyordu. Hattın
 * ortasına bir görev eklendiği an o sayı BAŞKA bir görevi göstermeye başlar — ve bu, her hat
 * değişikliğinde kayda elle bir kimlik eşleme listesi yazdırıyordu (plan §D: beş tane birikmiş).
 *
 * KURAL — index çalışma zamanının kodlaması, kimlik listesi DEPONUN kodlaması. İkisi aynı anda
 * SAKLANMAZ; biri diğerinden türer:
 *   kaydetme : index → o index'ten önceki görevlerin id'leri   `completedQuestIds`
 *   yükleme  : id listesi → index                              `activeQuestIndex`
 * Bu, `padsDone`'un deseninin aynısı (D-015: tables/stations padsDone'dan TÜRETİLİR) — kayıtta
 * tek liste durur, ikinci bir konum alanı olmadığı için ikisi desenkronize OLAMAZ.
 *
 * İLERLEME GERİYE GİTMEZ: aktif görev, listedeki EN GEÇ görevden SONRAKİ ilk yapılmamış görevdir.
 * Böylece hattın ortasına sonradan eklenen bir görev, oraya çoktan varmış bir kaydı geri çekmez
 * (o kayıt için atlanır); hattın SONUNA eklenen görev ise normal şekilde sıraya girer. Silinen ya
 * da yeniden adlandırılan bir görevin id'si listede zararsızca durur — konum kalan id'lerden
 * okunduğu için kayıt yine doğru yere oturur.
 */
import type { QuestDef } from '../config/economy.config';

/**
 * Aktif görev index'i → tamamlanmış görev kimlikleri (KAYDETME yönü).
 * Hat sıralı olduğu için index'ten öncekilerin tamamı tanım gereği bitmiştir.
 */
export function completedQuestIds(quests: readonly QuestDef[], index: number): string[] {
  const n = Math.max(0, Math.min(Math.floor(index) || 0, quests.length));
  return quests.slice(0, n).map((q) => q.id);
}

/**
 * Tamamlanmış görev kimlikleri → aktif görevin index'i (YÜKLEME yönü).
 * `quests.length` döndürmesi "hat bitti" demektir (çağıranların beklediği hâl).
 */
export function activeQuestIndex(quests: readonly QuestDef[], completed: readonly string[]): number {
  const done = new Set(completed);
  // Kaydın hattaki EN GEÇ konumu: geriye çekilmenin engellendiği yer burası.
  let last = -1;
  for (let i = 0; i < quests.length; i++) if (done.has(quests[i].id)) last = i;
  for (let i = last + 1; i < quests.length; i++) if (!done.has(quests[i].id)) return i;
  return quests.length;
}
