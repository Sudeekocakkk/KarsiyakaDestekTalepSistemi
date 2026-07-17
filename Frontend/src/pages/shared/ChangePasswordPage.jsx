import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/auth.api";
import { useAuth } from "../../context/useAuth";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { ROLES } from "../../utils/constants";

const roleHomePath = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.TEKNIK_PERSONEL]: "/teknik",
  [ROLES.PERSONEL]: "/personel",
};

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

const ChangePasswordPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
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

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Tüm alanlar zorunludur.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Yeni şifre ile onay şifresi eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess("Şifreniz güncellendi. Yönlendiriliyorsunuz...");
      setForm(emptyForm);

      const updatedUser = await refreshUser();

      setTimeout(() => {
        navigate(roleHomePath[updatedUser?.role] || "/", { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Şifre Değiştir</h1>
        <p className="text-sm text-slate-500">
          {user?.mustChangePassword
            ? "Devam edebilmek için önce geçici şifrenizi değiştirmeniz gerekiyor."
            : "Hesap şifrenizi güncelleyin."}
        </p>
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <FormField label="Mevcut Şifre" htmlFor="currentPassword" required>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className={inputClass}
              value={form.currentPassword}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Yeni Şifre" htmlFor="newPassword" required hint="En az 6 karakter.">
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className={inputClass}
              value={form.newPassword}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Yeni Şifre (Tekrar)" htmlFor="confirmPassword" required>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={inputClass}
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </FormField>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Şifreyi Güncelle
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
