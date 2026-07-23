import dns from "dns";

const HOSTNAME_LOOKUP_TIMEOUT_MS = 700;

// IPv6-mapped IPv4 (::ffff:127.0.0.1) ve localhost (::1) adreslerini
// insanların tanıdığı IPv4 formuna indirger. Reverse proxy arkasında
// x-forwarded-for varsa onu, yoksa doğrudan soket adresini kullanır.
export const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  let ip = null;

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    ip = forwardedFor.split(",")[0].trim();
  } else {
    ip = req.socket?.remoteAddress || req.connection?.remoteAddress || null;
  }

  if (!ip) return null;

  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);

  return ip;
};

// Reverse DNS ile bilgisayar adını çözmeye çalışır. Yerel ağda PTR kaydı
// olmayabilir veya DNS yanıt vermeyebilir; bu yüzden kısa bir zaman aşımı
// ile sarılır ve HER durumda (hata/timeout) null döner, asla fırlatmaz.
export const resolveHostname = (ip) => {
  if (!ip) return Promise.resolve(null);

  return Promise.race([
    dns.promises
      .reverse(ip)
      .then((hostnames) => hostnames?.[0] || null)
      .catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), HOSTNAME_LOOKUP_TIMEOUT_MS)),
  ]);
};

// İstekten IP + bilgisayar adını çıkarır. Hostname çözülemezse "Bilinmiyor"
// döner ("bilgisayar adını zorla veya sahte şekilde üretme" kuralı gereği
// gerçek bir değer değil, sabit bir yer tutucu kullanılır).
export const getDeviceInfo = async (req) => {
  try {
    const ip = getClientIp(req);

    if (!ip) {
      return { ip: null, hostname: "Bilinmiyor" };
    }

    const hostname = await resolveHostname(ip);

    return { ip, hostname: hostname || "Bilinmiyor" };
  } catch (error) {
    console.error("[requestDevice] Cihaz bilgisi çözümlenemedi:", error.message);
    return { ip: null, hostname: "Bilinmiyor" };
  }
};
