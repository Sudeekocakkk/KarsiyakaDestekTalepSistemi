// Liste arama kutuları için ortak, büyük/küçük harf duyarsız ve Türkçe
// karaktere duyarlı normalizasyon. "tr-TR" locale'i ile küçültme, "İ/I"
// gibi Türkçe'ye özgü harf çiftlerinin varsayılan (İngilizce) toLowerCase
// davranışıyla yanlış eşleşmesini önler.
// Not: Talep listelerinin arama (search) filtresi artık backend'de yapılır
// (bkz. Backend/src/controllers/ticket.controller.js buildTicketSearchOr).
// Bu yardımcı hâlâ Departman/Kategori/Uzmanlık/Kullanıcı gibi tamamen
// frontend'e alınmış küçük listelerin client-side aramasında kullanılır.
const normalize = (value) => (value ?? "").toString().trim().toLocaleLowerCase("tr-TR");

// term boşsa (temizlenmişse) her zaman true döner, böylece liste tamamen
// geri gelir. Aksi halde fields içindeki herhangi bir alanda alt dize eşleşmesi arar.
export const matchesSearch = (term, fields) => {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return true;

  return fields.some((field) => normalize(field).includes(normalizedTerm));
};
