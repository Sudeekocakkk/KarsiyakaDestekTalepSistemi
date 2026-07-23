export const validateTransferTicket = (req, res, next) => {
  const { toSpecializationId, toUserId, reason, workDescription } = req.body;

  if (
    toSpecializationId === undefined ||
    toSpecializationId === null ||
    toSpecializationId === ""
  ) {
    return res.status(400).json({
      message: "Hedef uzmanlık alanı zorunludur.",
    });
  }

  const parsedSpecializationId = Number(toSpecializationId);

  if (!Number.isInteger(parsedSpecializationId) || parsedSpecializationId <= 0) {
    return res.status(400).json({
      message: "Geçerli bir uzmanlık alanı seçmelisiniz.",
    });
  }

  if (toUserId !== undefined && toUserId !== null && toUserId !== "") {
    const parsedUserId = Number(toUserId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({
        message: "Geçerli bir personel kimliği gönderilmelidir.",
      });
    }
  }

  if (!reason?.trim()) {
    return res.status(400).json({
      message: "Aktarma nedeni zorunludur.",
    });
  }

  if (!workDescription?.trim()) {
    return res.status(400).json({
      message: "Yapılan işlemin açıklaması zorunludur.",
    });
  }

  next();
};
