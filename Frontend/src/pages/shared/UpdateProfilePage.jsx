import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { updateMe } from "../../api/user.api";
import { useAuth } from "../../context/useAuth";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";

const UpdateProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges =
    form.name.trim() !== (user?.name || "") ||
    form.email.trim().toLowerCase() !== (user?.email || "").toLowerCase() ||
    form.phone.trim() !== (user?.phone || "");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) return;

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Ad soyad boş bırakılamaz.");
      return;
    }

    if (!form.email.trim()) {
      setError("E-posta boş bırakılamaz.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMe({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      });

      setSuccess("Bilgileriniz güncellendi. Profilinize yönlendiriliyorsunuz...");
      await refreshUser();

      setTimeout(() => {
        navigate("/profil", { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <button
        type="button"
        onClick={() => navigate("/profil")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>

      <div>
        <h1 className="text-lg font-semibold text-slate-800">Kullanıcı Bilgilerimi Güncelle</h1>
        <p className="text-sm text-slate-500">Ad soyad, e-posta ve telefon bilgilerinizi düzenleyin.</p>
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <FormField label="Ad Soyad" htmlFor="name" required>
            <input
              id="name"
              name="name"
              className={inputClass}
              value={form.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="E-posta" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClass}
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Telefon" htmlFor="phone" hint="Opsiyonel.">
            <input
              id="phone"
              name="phone"
              className={inputClass}
              value={form.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <Button type="submit" isLoading={isSubmitting} disabled={!hasChanges} className="w-full">
            Kaydet
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
