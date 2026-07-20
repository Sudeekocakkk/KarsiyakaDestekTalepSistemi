// Backend prisma şemasındaki enum değerleriyle birebir uyumludur.
// Bkz: Backend/prisma/schema.prisma

export const ROLES = {
  ADMIN: "ADMIN",
  TEKNIK_PERSONEL: "TEKNIK_PERSONEL",
  PERSONEL: "PERSONEL",
};

export const ROLE_LABELS = {
  ADMIN: "Yönetici",
  TEKNIK_PERSONEL: "Teknik Personel",
  PERSONEL: "Personel",
};

export const TICKET_STATUS = {
  YENI: "YENI",
  ATANDI: "ATANDI",
  ISLEMDE: "ISLEMDE",
  BEKLEMEDE: "BEKLEMEDE",
  COZULDU: "COZULDU",
  IPTAL_EDILDI: "IPTAL_EDILDI",
};

export const TICKET_STATUS_LABELS = {
  YENI: "Yeni",
  ATANDI: "Atandı",
  ISLEMDE: "İşlemde",
  BEKLEMEDE: "Beklemede",
  COZULDU: "Çözüldü",
  IPTAL_EDILDI: "İptal Edildi",
};

export const TICKET_STATUS_OPTIONS = Object.values(TICKET_STATUS);

// Referans görsellerdeki kart renklerine yakın, durum bazlı stil sınıfları.
export const TICKET_STATUS_STYLES = {
  YENI: "bg-sky-50 text-sky-700 border border-sky-200",
  ATANDI: "bg-violet-50 text-violet-700 border border-violet-200",
  ISLEMDE: "bg-amber-50 text-amber-700 border border-amber-200",
  BEKLEMEDE: "bg-orange-50 text-orange-700 border border-orange-200",
  COZULDU: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  IPTAL_EDILDI: "bg-rose-50 text-rose-700 border border-rose-200",
};

// Dashboard pasta grafiğinde TICKET_STATUS_STYLES ile aynı renk ailesini
// kullanan hex karşılıkları (recharts <Cell> doğrudan hex/CSS renk bekler).
export const TICKET_STATUS_CHART_COLORS = {
  YENI: "#0284c7",
  ATANDI: "#7c3aed",
  ISLEMDE: "#d97706",
  BEKLEMEDE: "#ea580c",
  COZULDU: "#059669",
  IPTAL_EDILDI: "#e11d48",
};

export const TICKET_PRIORITY = {
  DUSUK: "DUSUK",
  NORMAL: "NORMAL",
  YUKSEK: "YUKSEK",
  ACIL: "ACIL",
};

export const TICKET_PRIORITY_LABELS = {
  DUSUK: "Düşük",
  NORMAL: "Normal",
  YUKSEK: "Yüksek",
  ACIL: "Acil",
};

export const TICKET_PRIORITY_OPTIONS = Object.values(TICKET_PRIORITY);

export const TICKET_PRIORITY_STYLES = {
  DUSUK: "bg-slate-100 text-slate-600 border border-slate-200",
  NORMAL: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  YUKSEK: "bg-amber-50 text-amber-700 border border-amber-200",
  ACIL: "bg-rose-50 text-rose-700 border border-rose-200",
};

export const TICKET_LOG_TYPE_LABELS = {
  TALEP_OLUSTURULDU: "Talep oluşturuldu",
  PERSONEL_ATANDI: "Personel atandı",
  DURUM_DEGISTIRILDI: "Durum değiştirildi",
  ONCELIK_DEGISTIRILDI: "Öncelik değiştirildi",
  ACIKLAMA_EKLENDI: "Açıklama eklendi",
  COZUM_EKLENDI: "Çözüm eklendi",
  TALEP_KAPATILDI: "Talep kapatıldı",
  TALEP_YENIDEN_ACILDI: "Talep yeniden açıldı",
};

// Talebi oluşturan/atanan personel dışında görüntüleyemez (backend canViewTicket ile birebir).
export const canViewTicket = (ticket, user) => {
  if (!ticket || !user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.PERSONEL) return ticket.createdById === user.id;
  if (user.role === ROLES.TEKNIK_PERSONEL) return ticket.assignedToId === user.id;
  return false;
};
