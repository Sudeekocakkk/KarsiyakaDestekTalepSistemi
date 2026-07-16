import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { setupAdmin } from "../../api/auth.api";

// POST /api/auth/setup yalnızca sistemde hiç kullanıcı yokken çalışır;
// aksi halde backend 403 döner ve burada mesaj olarak gösterilir.
const SetupAdminPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Ad, e-posta ve şifre zorunludur.");
      return;
    }

    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setIsSubmitting(true);
    try {
      await setupAdmin(form);
      setSuccess("İlk yönetici hesabı oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="İlk Kurulum"
      subtitle="Sistemde hiç kullanıcı yoksa ilk yönetici (ADMIN) hesabını burada oluşturabilirsiniz. Kurulum daha önce tamamlandıysa bu işlem reddedilir."
      footer={
        <>
          <Link to="/login" className="font-medium text-white hover:underline">
            Giriş sayfasına dön
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />
        <SuccessAlert message={success} />

        <FormField label="Ad Soyad" htmlFor="name" required>
          <input id="name" name="name" className={inputClass} value={form.name} onChange={handleChange} />
        </FormField>

        <FormField label="E-posta" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Şifre" htmlFor="password" required hint="En az 8 karakter.">
          <input
            id="password"
            name="password"
            type="password"
            className={inputClass}
            value={form.password}
            onChange={handleChange}
          />
        </FormField>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Yönetici Hesabı Oluştur
        </Button>
      </form>
    </AuthShell>
  );
};

export default SetupAdminPage;
