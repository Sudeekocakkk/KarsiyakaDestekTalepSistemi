// Kayıt sırasında kabul edilen e-posta sağlayıcıları. Yalnızca bu domainlere
// izin verilir; büyük/küçük harf farkı normalize edildikten sonra karşılaştırılır.
export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "yandex.com",
  "yandex.com.tr",
];

export const UNSUPPORTED_EMAIL_DOMAIN_MESSAGE =
  "Lütfen Gmail, Hotmail, Outlook, iCloud, Yahoo veya Yandex gibi desteklenen bir e-posta adresi kullanın.";

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isAllowedRegistrationEmail = (email) => {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_FORMAT_REGEX.test(normalized)) {
    return false;
  }

  const domain = normalized.split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export const validateRegister = (req, res, next) => {
  const { name, email, password, role, departmentId } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      message: "Ad soyad, e-posta ve şifre zorunludur.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Şifre en az 6 karakter olmalıdır.",
    });
  }

  if (role !== undefined && role !== null && role !== "") {
    return res.status(400).json({
      message: "Kayıt sırasında rol seçilemez. Yeni hesaplar PERSONEL rolüyle oluşturulur.",
    });
  }

  if (!isAllowedRegistrationEmail(email)) {
    return res.status(400).json({
      message: UNSUPPORTED_EMAIL_DOMAIN_MESSAGE,
    });
  }

  if (departmentId === undefined || departmentId === null || departmentId === "") {
    return res.status(400).json({
      message: "Müdürlük seçimi zorunludur.",
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      message: "E-posta ve şifre zorunludur.",
    });
  }

  next();
};
