// Belediye SMTP sunucusu ile bağlantıyı ve kimlik doğrulamasını doğrulayan
// tek seferlik test scripti. Kullanım (Backend/ dizininden):
//
//   npm run test:smtp
//
// Adımlar: .env'den SMTP ayarlarını okur -> zorunlu alanları kontrol eder ->
// transporter.verify() ile bağlantı/kimlik doğrulamayı test eder -> SMTP_TEST_TO
// tanımlıysa o adrese kısa bir test maili gönderir. Hiçbir adımda şifre veya
// ham sunucu hata gövdesi terminale yazılmaz.

import "dotenv/config";
import {
  getMissingSmtpVars,
  transporter,
  sendMail,
  describeSmtpError,
} from "../src/utils/mailer.js";

const main = async () => {
  console.log("[smtp-test] SMTP ayarları .env üzerinden okunuyor...");

  const missingVars = getMissingSmtpVars();

  if (missingVars.length > 0) {
    missingVars.forEach((key) => console.error(`[mail-config] Eksik SMTP değişkeni: ${key}`));
    console.error(
      "[smtp-test] Zorunlu SMTP değişkenleri eksik olduğu için test durduruldu. Backend/.env dosyasını kontrol edin."
    );
    process.exitCode = 1;
    return;
  }

  if (!transporter) {
    console.error("[smtp-test] Transporter oluşturulamadı, test durduruldu.");
    process.exitCode = 1;
    return;
  }

  console.log(`[smtp-test] Bağlantı deneniyor: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);

  try {
    await transporter.verify();
    console.log("[smtp-test] SMTP bağlantısı ve kimlik doğrulaması başarılı.");
  } catch (error) {
    console.error(`[smtp-test] SMTP bağlantı testi BAŞARISIZ: ${describeSmtpError(error)}`);
    process.exitCode = 1;
    return;
  }

  const testTo = process.env.SMTP_TEST_TO;

  if (!testTo) {
    console.log(
      "[smtp-test] SMTP_TEST_TO tanımlı değil, test maili gönderilmedi (yalnızca bağlantı testi yapıldı)."
    );
    return;
  }

  console.log(`[smtp-test] Test maili gönderiliyor -> ${testTo}`);

  const info = await sendMail({
    to: testTo,
    subject: "Karşıyaka Destek SMTP Testi",
    text: "Karşıyaka Destek uygulamasının belediye SMTP sunucusu üzerinden mail gönderimi başarıyla çalışmaktadır.",
  });

  if (info) {
    console.log(`[smtp-test] Test maili gönderildi. messageId: ${info.messageId}`);
  } else {
    console.error("[smtp-test] Test maili gönderilemedi. Ayrıntılar için yukarıdaki [mailer] satırına bakın.");
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error(`[smtp-test] Beklenmeyen hata: ${describeSmtpError(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    // nodemailer transporter'ı açık soket tutabilir; script bittiğinde
    // terminalin process'i bırakması için kapatıyoruz.
    transporter?.close?.();
  });
