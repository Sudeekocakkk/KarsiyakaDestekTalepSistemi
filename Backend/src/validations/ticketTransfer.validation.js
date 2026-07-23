// Hedef uzmanlık alanı ve teknik personel — ikisi de opsiyoneldir ("Fark
// Etmez"): boş bırakılırsa controller sırasıyla "uzmanlık şartı aranmadan"
// veya "en az yüklü aktif teknik personeli otomatik ata" mantığını uygular.
export const validateTransferTicket = (req, res, next) => {
  const { toSpecializationId, toUserId } = req.body;

  if (toSpecializationId !== undefined && toSpecializationId !== null && toSpecializationId !== "") {
    const parsedSpecializationId = Number(toSpecializationId);

    if (!Number.isInteger(parsedSpecializationId) || parsedSpecializationId <= 0) {
      return res.status(400).json({
        message: "Geçerli bir uzmanlık alanı seçmelisiniz.",
      });
    }
  }

  if (toUserId !== undefined && toUserId !== null && toUserId !== "") {
    const parsedUserId = Number(toUserId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({
        message: "Geçerli bir personel kimliği gönderilmelidir.",
      });
    }
  }

  next();
};
