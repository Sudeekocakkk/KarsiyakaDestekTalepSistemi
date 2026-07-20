import { TICKET_STATUS_LABELS } from "./constants";

// Liste arama kutuları için ortak, büyük/küçük harf duyarsız ve Türkçe
// karaktere duyarlı normalizasyon. "tr-TR" locale'i ile küçültme, "İ/I"
// gibi Türkçe'ye özgü harf çiftlerinin varsayılan (İngilizce) toLowerCase
// davranışıyla yanlış eşleşmesini önler.
const normalize = (value) => (value ?? "").toString().trim().toLocaleLowerCase("tr-TR");

// term boşsa (temizlenmişse) her zaman true döner, böylece liste tamamen
// geri gelir. Aksi halde fields içindeki herhangi bir alanda alt dize eşleşmesi arar.
export const matchesSearch = (term, fields) => {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return true;

  return fields.some((field) => normalize(field).includes(normalizedTerm));
};

// Talep listesi sayfalarında (admin/teknik/personel) ortak arama alanları:
// talep no, başlık, durum (Türkçe etiket), kategori, oluşturan/atanan personel.
// İlgili alan o listenin API yanıtında yoksa (örn. getMyTickets createdBy
// döndürmez) sonuç undefined olur ve matchesSearch bunu güvenle atlar.
export const buildTicketSearchFields = (ticket) => [
  ticket.ticketNumber,
  ticket.title,
  TICKET_STATUS_LABELS[ticket.status],
  ticket.category?.name,
  ticket.createdBy?.name,
  ticket.assignedTo?.name,
];
