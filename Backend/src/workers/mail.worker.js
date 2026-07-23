import "dotenv/config";
import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { MAIL_QUEUE_NAME } from "../queues/queueNames.js";
import { sendMail } from "../utils/mailer.js";

const CONCURRENCY = Number(process.env.MAIL_WORKER_CONCURRENCY) || 3;

const connection = createRedisConnection("mail-worker");

const buildTicketAssignedEmail = (data) => ({
  to: data.toEmail,
  subject: `Yeni Talep Atandı: ${data.ticketNumber}`,
  text:
    `Merhaba ${data.technicianName},\n\n` +
    `"${data.title}" başlıklı (${data.ticketNumber}) destek talebi size atandı.\n\n` +
    `Öncelik: ${data.priority}\n` +
    (data.categoryName ? `Kategori: ${data.categoryName}\n` : "") +
    (data.ticketUrl ? `Talep bağlantısı: ${data.ticketUrl}\n` : "") +
    "\nKarşıyaka Destek",
});

const worker = new Worker(
  MAIL_QUEUE_NAME,
  async (job) => {
    if (job.name !== "ticket-assigned") {
      console.warn(`[mail-worker] Bilinmeyen iş tipi, atlanıyor: ${job.name}`);
      return;
    }

    // mailer.js'teki sendMail() (mevcut, değiştirilmemiş Nodemailer
    // fonksiyonu) kendi hatasını zaten ayrıntılı loglar ve fırlatmaz
    // (başarısızlıkta null döner). BullMQ'nun retry/backoff mekanizmasının
    // devreye girmesi için burada null dönüşü bir hataya çeviriyoruz.
    const info = await sendMail(buildTicketAssignedEmail(job.data));

    if (!info) {
      throw new Error(
        `Mail gönderilemedi (alıcı: ${job.data?.toEmail || "bilinmiyor"}, talep no: ${job.data?.ticketNumber}). Ayrıntılar için önceki [mailer] hata satırına bakın.`
      );
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  }
);

worker.on("completed", (job) => {
  console.log(`[mail-worker] İş tamamlandı. jobId: ${job.id}, talep no: ${job.data?.ticketNumber}`);
});

worker.on("failed", (job, error) => {
  console.error(
    `[mail-worker] İş BAŞARISIZ. jobId: ${job?.id}, talep no: ${job?.data?.ticketNumber}, ` +
      `deneme: ${job?.attemptsMade}/${job?.opts?.attempts}. Hata: ${error.message}`
  );
});

worker.on("error", (error) => {
  console.error(`[mail-worker] Worker bağlantı hatası: ${error.message}`);
});

console.log(`[mail-worker] "${MAIL_QUEUE_NAME}" kuyruğu dinleniyor (concurrency: ${CONCURRENCY}).`);

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[mail-worker] ${signal} alındı, düzgün şekilde kapatılıyor...`);

  try {
    await worker.close();
  } catch (error) {
    console.error(`[mail-worker] Worker kapatılırken hata: ${error.message}`);
  }

  connection.disconnect();
  console.log("[mail-worker] Kapatıldı.");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
