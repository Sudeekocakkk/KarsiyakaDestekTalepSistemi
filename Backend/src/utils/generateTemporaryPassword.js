import crypto from "crypto";

// Karışabilecek karakterler (0/O, 1/l/I) hariç tutuldu.
const CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// Yönetici tarafından oluşturulan hesaplar için kriptografik olarak güvenli,
// tek seferlik geçici şifre üretir. Düz metin olarak yalnızca oluşturma
// anındaki API yanıtında döner; veritabanına her zaman bcrypt hash'i yazılır.
export const generateTemporaryPassword = (length = 12) => {
  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += CHARSET[bytes[i] % CHARSET.length];
  }

  return password;
};
