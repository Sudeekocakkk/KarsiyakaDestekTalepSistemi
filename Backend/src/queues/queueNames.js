// Kuyruk adları ayrı bir dosyada tutulur ki worker, sadece adı öğrenmek için
// mail.queue.js'i (ve onun Queue/Redis bağlantısını) import etmek zorunda kalmasın.
export const MAIL_QUEUE_NAME = "ticket-email";
