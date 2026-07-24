import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { MAIL_QUEUE_NAME } from "./queueNames.js";

export { MAIL_QUEUE_NAME };

const ADD_JOB_TIMEOUT_MS = 3000;

// EMAIL_NOTIFICATIONS_ENABLED=false ise mail kuyruğuna yeni iş eklenmez.
// Değişken tanımsızsa (veya "false" dışında bir değerse) mevcut/eski
// davranış (bildirimler açık) korunur — bu yüzden yalnızca tam olarak
// "false" string'i devre dışı bırakır, güvenli varsayılan her zaman "açık".
const isEmailNotificationsEnabled = () => process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false";

const connection = createRedisConnection("mail-queue");

export const mailQueue = new Queue(MAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      // İlk tekrar deneme ~5 saniye sonra, sonrakiler katlanarak (10s, 20s...).
      delay: 5000,
    },
    // Başarılı işler bir süre sonra otomatik temizlenir.
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 500,
    },
    // Başarısız işler inceleme için daha uzun süre saklanır.
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
    },
  },
});

mailQueue.on("error", (error) => {
  console.error(`[mail-queue] Kuyruk bağlantı hatası: ${error.message}`);
});

// Verilen promise'i belirtilen sürede tamamlanmazsa reddeder. Redis geçici
// olarak kapalıyken mailQueue.add(...) çağrısının (ioredis'in offline
// komut kuyruğu nedeniyle) süresiz beklemesini — ve talep atama isteğini
// kilitlemesini — önler.
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} zaman aşımına uğradı (${ms}ms)`)), ms)
    ),
  ]);

// Talep bir teknik personele atandığında (manuel veya otomatik) çağrılır.
// jobId = `ticket-assigned-{ticketId}-{assignedToId}` sayesinde aynı talep
// aynı personele tekrar "kaydedilse" bile (veri değişmediği için zaten
// updateTicket bu durumda hiç çağırmıyor, ama başka bir yoldan tekrar
// tetiklenirse de) BullMQ aynı jobId için mevcut/tamamlanmış işi tekrar
// oluşturmaz — bu da tekrarlı maili engeller. Personel değişince
// (assignedToId farklı) jobId de değişir, yeni bir iş oluşur.
// Kuyruğa ekleme başarısız olursa (Redis kapalı, zaman aşımı vb.) hata
// terminale loglanır ama fırlatılmaz — talep atama işlemi bundan etkilenmez.
export const addTicketAssignedEmailJob = async ({
  ticketId,
  assignedToId,
  toEmail,
  technicianName,
  ticketNumber,
  title,
  priority,
  categoryName,
  ticketUrl,
}) => {
  if (!isEmailNotificationsEnabled()) {
    console.log(
      `[mail-queue] EMAIL_NOTIFICATIONS_ENABLED=false, iş kuyruğa eklenmedi. talep no: ${ticketNumber}`
    );
    return;
  }

  const jobId = `ticket-assigned-${ticketId}-${assignedToId}`;

  try {
    await withTimeout(
      mailQueue.add(
        "ticket-assigned",
        {
          toEmail,
          technicianName,
          ticketId,
          ticketNumber,
          title,
          priority,
          categoryName,
          ticketUrl,
        },
        { jobId }
      ),
      ADD_JOB_TIMEOUT_MS,
      "Mail kuyruğuna iş ekleme"
    );

    console.log(`[mail-queue] İş kuyruğa eklendi. jobId: ${jobId}, talep no: ${ticketNumber}`);
  } catch (error) {
    console.error(
      `[mail-queue] İş kuyruğa eklenemedi (jobId: ${jobId}, talep no: ${ticketNumber}): ${error.message}`
    );
  }
};
