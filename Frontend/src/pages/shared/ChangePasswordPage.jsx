import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  const [showPasswords, setShowPasswords] = useState(false);

  const wasForcedChange = Boolean(user?.mustChangePassword);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

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
        if (wasForcedChange) {
          navigate(roleHomePath[updatedUser?.role] || "/", { replace: true });
        } else {
          navigate("/profil", { replace: true });
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordInputType = showPasswords ? "text" : "password";

  return (
    <div className="mx-auto max-w-md space-y-5">
      {!wasForcedChange && (
        <button
          type="button"
          onClick={() => navigate("/profil")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>
      )}

      <div>
        <h1 className="text-lg font-semibold text-slate-800">Şifre Değiştir</h1>
        <p className="text-sm text-slate-500">
          {wasForcedChange
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
              type={passwordInputType}
              className={inputClass}
              value={form.currentPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Yeni Şifre" htmlFor="newPassword" required hint="En az 6 karakter.">
            <input
              id="newPassword"
              name="newPassword"
              type={passwordInputType}
              className={inputClass}
              value={form.newPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Yeni Şifre (Tekrar)" htmlFor="confirmPassword" required>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={passwordInputType}
              className={inputClass}
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPasswords ? "Şifreleri Gizle" : "Şifreleri Göster"}
          </button>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Şifreyi Güncelle
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
