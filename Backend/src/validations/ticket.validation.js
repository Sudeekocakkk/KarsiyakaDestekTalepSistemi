const validPriorities = ["DUSUK", "NORMAL", "YUKSEK", "ACIL"];

export const validateCreateTicket = (req, res, next) => {
  const { title, description, categoryId, priority, creatorId, createdById } =
    req.body;

  if (creatorId !== undefined || createdById !== undefined) {
    return res.status(400).json({
      message:
        "Talep oluşturucu bilgisi gönderilemez. Oluşturan kullanıcı oturum bilgisinden alınır.",
    });
  }

  if (!title?.trim() || !description?.trim() || categoryId === undefined || categoryId === null || categoryId === "") {
    return res.status(400).json({
      message: "Başlık, açıklama ve kategori zorunludur.",
    });
  }

  const parsedCategoryId = Number(categoryId);

  if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
    return res.status(400).json({
      message: "Geçerli bir kategori seçmelisiniz.",
    });
  }

  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({
      message: "Geçersiz öncelik değeri.",
    });
  }

  next();
};
