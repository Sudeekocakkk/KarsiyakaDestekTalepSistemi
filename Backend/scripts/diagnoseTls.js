// SMTP sunucusunun STARTTLS sertifikasını teşhis eden tek seferlik script.
// Kullanım (Backend/ dizininden): npm run diagnose:tls
//
// Şifre, auth bilgisi veya tam transporter config ASLA loglanmaz.
// Yalnızca: sertifika subject/issuer/SAN/geçerlilik tarihleri, TLS hata kodu
// (authorizationError) ve nodemailer'ın verdiği güvenli hata alanları basılır.

import "dotenv/config";
import net from "node:net";
import tls from "node:tls";
import { transporter, describeSmtpError } from "../src/utils/mailer.js";

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 587);

const readOnce = (socket) =>
  new Promise((resolve, reject) => {
    const onData = (data) => {
      cleanup();
      resolve(data.toString("utf8"));
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    socket.once("data", onData);
    socket.once("error", onError);
  });

const printCertChain = (tlsSocket) => {
  console.log("\n--- TLS Bağlantı Bilgisi ---");
  console.log("Protokol:", tlsSocket.getProtocol());
  console.log("Cipher  :", tlsSocket.getCipher()?.name);
  console.log("authorized (zincir güvenilir mi):", tlsSocket.authorized);
  if (!tlsSocket.authorized) {
    console.log("authorizationError (tam hata kodu):", tlsSocket.authorizationError);
  }

  console.log("\n--- Sertifika Zinciri ---");
  let cert = tlsSocket.getPeerCertificate(true);
  let depth = 0;
  const seen = new Set();

  while (cert && Object.keys(cert).length && !seen.has(cert.fingerprint)) {
    seen.add(cert.fingerprint);
    const isSelfSigned =
      cert.subject && cert.issuer && JSON.stringify(cert.subject) === JSON.stringify(cert.issuer);

    console.log(`\n[Zincir seviyesi ${depth}]`);
    console.log("  Subject      :", JSON.stringify(cert.subject));
    console.log("  Issuer       :", JSON.stringify(cert.issuer));
    console.log("  Geçerli baş. :", cert.valid_from);
    console.log("  Geçerli bit. :", cert.valid_to);
    console.log("  SAN          :", cert.subjectaltname || "(yok)");
    console.log("  Self-signed  :", Boolean(isSelfSigned));

    cert = cert.issuerCertificate;
    depth += 1;
    if (depth > 10) break; // güvenlik: sonsuz döngü koruması
  }
};

const main = async () => {
  if (!HOST) {
    console.error("[diagnose-tls] SMTP_HOST tanımlı değil (.env kontrol edin).");
    process.exitCode = 1;
    return;
  }

  console.log(`[diagnose-tls] ${HOST}:${PORT} adresine düz TCP bağlantısı açılıyor...`);
  const socket = net.connect({ host: HOST, port: PORT });

  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  const greeting = await readOnce(socket);
  console.log("[diagnose-tls] Sunucu karşılama:", greeting.trim());

  socket.write("EHLO diagnose.local\r\n");
  const ehloResp = await readOnce(socket);
  console.log("[diagnose-tls] EHLO yanıtı:\n" + ehloResp.trim());

  socket.write("STARTTLS\r\n");
  const startTlsResp = await readOnce(socket);
  console.log("[diagnose-tls] STARTTLS yanıtı:", startTlsResp.trim());

  if (!startTlsResp.startsWith("220")) {
    console.error("[diagnose-tls] Sunucu STARTTLS'i kabul etmedi, işlem durduruldu.");
    socket.end();
    process.exitCode = 1;
    return;
  }

  console.log("[diagnose-tls] TLS el sıkışması başlatılıyor (sertifika doğrulaması AÇIK)...");

  await new Promise((resolve) => {
    const tlsSocket = tls.connect({
      socket,
      servername: HOST,
      rejectUnauthorized: true,
    });

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        printCertChain(tlsSocket);
      } catch (e) {
        console.error("[diagnose-tls] Sertifika bilgisi okunamadı:", e.message);
      }
      tlsSocket.destroy();
      resolve();
    };

    tlsSocket.on("secureConnect", () => {
      console.log("[diagnose-tls] TLS el sıkışması BAŞARILI (zincir güvenilir).");
      finish();
    });

    tlsSocket.on("error", (err) => {
      console.error("\n[diagnose-tls] TLS el sıkışması hata verdi:");
      console.error("  code   :", err.code);
      console.error("  message:", err.message);
      finish();
    });
  });

  console.log("\n[diagnose-tls] --- Nodemailer transporter.verify() sonucu ---");
  if (!transporter) {
    console.error("Transporter oluşturulmadı (env eksik).");
  } else {
    try {
      await transporter.verify();
      console.log("transporter.verify() başarılı.");
    } catch (error) {
      console.error("code         :", error.code);
      console.error("command      :", error.command);
      console.error("responseCode :", error.responseCode);
      console.error("reason       :", error.reason);
      console.error("message      :", error.message);
      console.error("\nOkunabilir açıklama:", describeSmtpError(error));
    }
    transporter.close?.();
  }
};

main().catch((err) => {
  console.error("[diagnose-tls] Beklenmeyen hata:", err.message);
  process.exitCode = 1;
});
