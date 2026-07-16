// Backend/src/validations/auth.validation.js ile birebir aynı liste ve mesaj.
// Bu yalnızca kullanıcıya erken geri bildirim vermek içindir; asıl doğrulama
// backend tarafında tekrar yapılır.
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
