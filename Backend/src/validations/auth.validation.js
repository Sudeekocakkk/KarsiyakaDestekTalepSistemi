export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

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
