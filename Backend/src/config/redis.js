import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Loglarda asla ham REDIS_URL'yi (kullanıcı adı/şifre içerebilir) yazdırma;
// sadece host:port bilgisini çıkar.
const redactedTarget = (() => {
  try {
    const parsed = new URL(REDIS_URL);
    return `${parsed.hostname}:${parsed.port || 6379}`;
  } catch {
    return "(geçersiz REDIS_URL)";
  }
})();

// BullMQ Queue ve Worker'ların HER BİRİ bu fonksiyonla kendi bağlantısını
// oluşturmalı. Tek bir ioredis örneğini Queue (normal komutlar) ile Worker
// (bloklayan komutlar) arasında paylaşmak BullMQ'da önerilmez.
export const createRedisConnection = (label = "redis") => {
  const client = new IORedis(REDIS_URL, {
    // BullMQ Worker'ların bloklayan komutları (BRPOPLPUSH vb.) için şarttır;
    // aynı ayarı Queue bağlantısında da kullanmak güvenli ve tutarlıdır.
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    // Redis geçici olarak erişilemez olduğunda backend'in çökmesi yerine
    // giderek yavaşlayan bir aralıkla yeniden bağlanmayı denesin.
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });

  client.on("error", (error) => {
    console.error(`[redis:${label}] Bağlantı hatası (${redactedTarget}): ${error.message}`);
  });

  client.on("connect", () => {
    console.log(`[redis:${label}] Redis'e bağlanıldı (${redactedTarget}).`);
  });

  client.on("close", () => {
    console.warn(`[redis:${label}] Redis bağlantısı kapandı (${redactedTarget}).`);
  });

  return client;
};
