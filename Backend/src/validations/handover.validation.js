const VALID_DECISIONS = ["ACCEPTED", "REJECTED"];

export const validateCreateHandoverRequest = (req, res, next) => {
  const { requestedToId, reason } = req.body;

  if (requestedToId === undefined || requestedToId === null || requestedToId === "") {
    return res.status(400).json({
      message: "Devredilecek personel zorunludur.",
    });
  }

  const parsedRequestedToId = Number(requestedToId);

  if (!Number.isInteger(parsedRequestedToId) || parsedRequestedToId <= 0) {
    return res.status(400).json({
      message: "Geçerli bir personel kimliği gönderilmelidir.",
    });
  }

  if (!reason?.trim()) {
    return res.status(400).json({
      message: "Devir nedeni zorunludur.",
    });
  }

  next();
};

export const validateRespondHandoverRequest = (req, res, next) => {
  const { decision } = req.body;

  if (!VALID_DECISIONS.includes(decision)) {
    return res.status(400).json({
      message: "Geçersiz karar. ACCEPTED veya REJECTED gönderilmelidir.",
    });
  }

  next();
};
