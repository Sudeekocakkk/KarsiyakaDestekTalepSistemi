// Tek seferlik, kontrollü veritabanı sıfırlama scripti.
//
// Ne yapar: Uygulama verisi tutan tüm tabloların İÇERİĞİNİ (satırları) siler ve
// auto-increment ID sayaçlarını 1'den yeniden başlatır. Tabloları, kolonları veya
// Prisma migration geçmişini SİLMEZ / DEĞİŞTİRMEZ; şema aynen kalır.
//
// Güvenlik kapıları (ikisi de sağlanmadan hiçbir satır silinmez):
//   1) NODE_ENV production OLMAMALI.
//   2) CONFIRM_DATABASE_RESET ortam değişkeni tam olarak "true" olmalı.
//
// Kullanım (Backend/ dizininden):
//   Bash / Git Bash:    CONFIRM_DATABASE_RESET=true npm run reset-database
//   PowerShell:         $env:CONFIRM_DATABASE_RESET="true"; npm run reset-database
//
// Sıfırlama sonrası hiçbir admin/kullanıcı/müdürlük/uzmanlık/kategori otomatik
// oluşturulmaz. İlk kurulum (POST /api/auth/setup) ve admin panelindeki oluşturma
// uç noktaları (müdürlük/uzmanlık/kategori/kullanıcı) elle kullanılarak veri
// yeniden girilebilir.

import "dotenv/config";
import prisma from "../src/config/prisma.js";

// FK ilişkilerine göre okunabilir sırayla listelendi (TRUNCATE ... CASCADE zaten
// bağımlı tüm satırları/örtük join tablolarını da temizler, sıralama yalnızca
// çıktının anlaşılır olması içindir).
const TABLES = [
  "ticket_attachments",
  "ticket_logs",
  "tickets",
  "categories",
  "specializations",
  "users",
  "departments",
];

const countRows = async (table) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "${table}"`
  );
  return rows[0].count;
};

async function main() {
  console.log("=== Karşıyaka Destek — Veritabanı Sıfırlama ===\n");

  if (process.env.NODE_ENV === "production") {
    console.error(
      "HATA: Bu script production ortamında çalıştırılamaz (NODE_ENV=production). İşlem durduruldu."
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_DATABASE_RESET !== "true") {
    console.error(
      "HATA: Güvenlik onayı bulunamadı.\n" +
        "Bu işlem tüm uygulama verilerini kalıcı olarak siler. Devam etmek için\n" +
        "CONFIRM_DATABASE_RESET=true ortam değişkenini ayarlayıp scripti tekrar çalıştırın.\n" +
        "Hiçbir kayıt silinmedi."
    );
    process.exit(1);
  }

  console.log("Güvenlik kontrolleri geçildi. Mevcut kayıt sayıları alınıyor...\n");

  const countsBefore = {};
  for (const table of TABLES) {
    countsBefore[table] = await countRows(table);
    console.log(`  - ${table}: ${countsBefore[table]} kayıt bulundu`);
  }

  const totalBefore = Object.values(countsBefore).reduce((a, b) => a + b, 0);

  if (totalBefore === 0) {
    console.log("\nTüm tablolar zaten boş. Yapılacak bir işlem yok.");
    await prisma.$disconnect();
    return;
  }

  console.log(
    `\n${TABLES.length} tablo temizleniyor (TRUNCATE ... RESTART IDENTITY CASCADE)...`
  );

  const tableList = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`
  );

  console.log("\nSonuçlar doğrulanıyor...\n");

  let allEmpty = true;

  for (const table of TABLES) {
    const remaining = await countRows(table);
    const deleted = countsBefore[table];
    const ok = remaining === 0;

    if (!ok) allEmpty = false;

    console.log(
      `  - ${table}: ${deleted} kayıt silindi, kalan: ${remaining} [${ok ? "OK" : "HATA"}]`
    );
  }

  await prisma.$disconnect();

  if (!allEmpty) {
    console.error("\n✘ Sıfırlama tamamlanamadı: bazı tablolar hâlâ dolu.");
    process.exit(1);
  }

  console.log(
    `\n✔ Veritabanı başarıyla sıfırlandı. Toplam ${totalBefore} kayıt silindi, tüm tablolar boş.\n` +
      "Tablo yapısı ve migration geçmişi korundu; yeni admin/müdürlük/uzmanlık/kategori\n" +
      "otomatik oluşturulmadı — bunları /ilk-kurulum ve admin panelinden elle ekleyebilirsiniz."
  );
}

main().catch(async (error) => {
  console.error("\n✘ Veritabanı sıfırlanırken beklenmeyen bir hata oluştu:", error);
  await prisma.$disconnect();
  process.exit(1);
});
