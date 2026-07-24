import nodemailer from "nodemailer";

// Belediyenin SMTP sunucusu ile e-posta göndermek için zorunlu değişkenler.
// SMTP_SECURE ve SMTP_FROM_NAME zorunlu değildir (güvenli varsayılanları vardır).
const REQUIRED_SMTP_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_EMAIL",
];

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
} = process.env;

// Yalnızca eksik değişkenlerin ADLARINI döner — değerleri asla döndürmez/loglamaz.
export const getMissingSmtpVars = () =>
  REQUIRED_SMTP_VARS.filter((key) => !process.env[key]);

const missingVars = getMissingSmtpVars();
const isConfigured = missingVars.length === 0;

if (!isConfigured) {
  missingVars.forEach((key) => console.error(`[mail-config] Eksik SMTP değişkeni: ${key}`));
  console.error(
    "[mailer] Yukarıdaki SMTP ortam değişken(ler)i eksik olduğu için e-posta gönderimi devre dışı kalacak."
  );
}

const fromName = SMTP_FROM_NAME || "Karşıyaka Destek";
// "Karşıyaka Destek <bimdestek@karsiyaka.bel.tr>" biçiminde gönderen adresi.
const fromAddress = SMTP_FROM_EMAIL ? `"${fromName}" <${SMTP_FROM_EMAIL}>` : undefined;

export const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      // Port 587 için secure:false doğru ayardır: bağlantı düz başlar ve
      // sunucu destekliyorsa Nodemailer otomatik olarak STARTTLS ile TLS'e
      // yükseltir. Port 465 kullanılacaksa SMTP_SECURE=true yapılmalı
      // (bağlantı baştan itibaren TLS ile kurulur, upgrade adımı olmaz).
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // NOT: TLS sertifika doğrulaması kasıtlı olarak varsayılan (açık/güvenli)
      // bırakılmıştır. `tls: { rejectUnauthorized: false }` EKLENMEMELİDİR.
      // Belediye SMTP sunucusunda gerçek bir sertifika hatası çıkarsa önce
      // hatayı (bkz. describeSmtpError) raporlayın, güvenlik kontrolünü
      // gerekçesiz kapatmayın.
    })
  : null;

// Nodemailer/SMTP hatalarını, hassas ayrıntı (kimlik bilgisi, ham sunucu
// yanıtı, stack trace) sızdırmadan anlaşılır Türkçe açıklamaya çevirir.
// mailer.js ve scripts/testSmtp.js tarafından ortak kullanılır.
export const describeSmtpError = (error) => {
  const code = error?.code;
  const responseCode = error?.responseCode;
  const message = (error?.message || "").toLowerCase();

  if (code === "EAUTH" || responseCode === 535) {
    return "Kullanıcı adı veya şifre hatalı (SMTP kimlik doğrulaması başarısız).";
  }

  if (
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EDNS" ||
    code === "EAI_AGAIN"
  ) {
    return "SMTP sunucusuna ulaşılamıyor (adres bulunamadı veya bağlantı reddedildi). SMTP_HOST değerini ve ağ erişimini kontrol edin.";
  }

  if (code === "ETIMEDOUT" || message.includes("timeout") || message.includes("timed out")) {
    return "SMTP bağlantısı zaman aşımına uğradı. Port kapalı olabilir veya sunucuya ağ üzerinden erişilemiyor.";
  }

  if (code === "ESOCKET" && (message.includes("cert") || message.includes("tls") || message.includes("ssl"))) {
    return "TLS/sertifika doğrulama hatası. Sunucu sertifikası geçersiz, süresi dolmuş veya eksik ara sertifikalı olabilir.";
  }

  if (code === "ESOCKET") {
    return "SMTP sunucusuyla ağ bağlantısı kurulamadı (port kapalı veya güvenlik duvarı engeli olabilir).";
  }

  if (message.includes("relay")) {
    return "SMTP sunucusu relay iznini reddetti (bu hesap/IP üzerinden mail göndermeye yetkili değil).";
  }

  if (code === "EENVELOPE" || responseCode === 550 || responseCode === 553 || responseCode === 554) {
    return "Gönderen veya alıcı e-posta adresi SMTP sunucusu tarafından reddedildi.";
  }

  return `SMTP hatası (kod: ${code || responseCode || "bilinmiyor"}). Ayrıntı için sunucu yöneticisine başvurun.`;
};

// Sunucu açılışında bir kez çağrılır; SMTP kimlik bilgilerinin ve
// bağlantının gerçekten çalıştığını terminale yazdırır.
export const verifyMailTransport = async () => {
  if (!transporter) {
    console.error("[mailer] Transporter oluşturulmadı (eksik ortam değişkeni), SMTP doğrulaması atlanıyor.");
    return false;
  }

  try {
    await transporter.verify();
    console.log(`[mailer] SMTP bağlantısı doğrulandı (${SMTP_HOST}:${SMTP_PORT}).`);
    return true;
  } catch (error) {
    console.error(`[mailer] SMTP bağlantı doğrulaması BAŞARISIZ: ${describeSmtpError(error)}`);
    return false;
  }
};

// Hata durumunda asla fırlatmaz (talep atama/devretme akışını bozmamak için);
// ancak hatayı asla sessizce yutmaz — güvenli, anlaşılır açıklama terminale
// yazdırılır (ham hata nesnesi/kimlik bilgisi loglanmaz).
export const sendMail = async ({ to, subject, text, html }) => {
  console.log(`[mailer] Mail gönderimi başlıyor. Alıcı: ${to || "(alıcı yok)"}, Konu: ${subject}`);

  if (!transporter) {
    console.error(
      `[mailer] Mail GÖNDERİLEMEDİ (alıcı: ${to || "(alıcı yok)"}): transporter yok, SMTP ortam değişkenleri eksik.`
    );
    return null;
  }

  if (!to) {
    console.error("[mailer] Mail GÖNDERİLEMEDİ: alıcı e-posta adresi boş/tanımsız.");
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress || SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    console.log(`[mailer] Mail başarıyla gönderildi. Alıcı: ${to}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[mailer] Mail gönderilemedi (alıcı: ${to}): ${describeSmtpError(error)}`);
    return null;
  }
};
