import nodemailer from "nodemailer";

const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM } = process.env;

const isConfigured = Boolean(MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASSWORD);

if (!isConfigured) {
  console.error(
    "[mailer] MAIL_HOST, MAIL_PORT, MAIL_USER veya MAIL_PASSWORD ortam değişkenlerinden biri eksik. " +
      `Yüklenen değerler -> MAIL_HOST: ${MAIL_HOST || "(boş)"}, MAIL_PORT: ${MAIL_PORT || "(boş)"}, ` +
      `MAIL_USER: ${MAIL_USER ? "(dolu)" : "(boş)"}, MAIL_PASSWORD: ${MAIL_PASSWORD ? "(dolu)" : "(boş)"}. ` +
      "E-posta gönderimi devre dışı kalacak."
  );
}

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      // Mailtrap sandbox ve çoğu test SMTP sunucusu 2525/587 üzerinde STARTTLS
      // kullanır; 465 dışındaki portlarda secure:false + gerektiğinde upgrade
      // doğru davranıştır.
      secure: Number(MAIL_PORT) === 465,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASSWORD,
      },
    })
  : null;

// Sunucu açılışında bir kez çağrılır; SMTP kimlik bilgilerinin ve
// bağlantının gerçekten çalıştığını terminale yazdırır.
export const verifyMailTransport = async () => {
  if (!transporter) {
    console.error("[mailer] Transporter oluşturulmadı (eksik ortam değişkeni), SMTP doğrulaması atlanıyor.");
    return false;
  }

  try {
    await transporter.verify();
    console.log(`[mailer] SMTP bağlantısı doğrulandı (${MAIL_HOST}:${MAIL_PORT}).`);
    return true;
  } catch (error) {
    console.error("[mailer] SMTP bağlantı doğrulaması BAŞARISIZ:", error);
    return false;
  }
};

// Hata durumunda asla fırlatmaz (talep atama akışını bozmamak için); ancak
// hatayı asla sessizce yutmaz — tam hata terminale yazdırılır.
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
      from: MAIL_FROM || MAIL_USER,
      to,
      subject,
      text,
      html,
    });

    console.log(`[mailer] Mail gönderildi. Alıcı: ${to}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[mailer] Mail gönderilirken HATA oluştu. Alıcı: ${to}`, error);
    return null;
  }
};
