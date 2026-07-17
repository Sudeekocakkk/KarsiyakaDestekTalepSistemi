import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import { useAuth } from "../../context/useAuth";
import { ROLES } from "../../utils/constants";

const roleHomePath = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.TEKNIK_PERSONEL]: "/teknik",
  [ROLES.PERSONEL]: "/personel",
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      const redirectTo = user.mustChangePassword
        ? "/sifre-degistir"
        : location.state?.from?.pathname || roleHomePath[user.role] || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Giriş Yap"
      subtitle="Hesabınıza erişmek için bilgilerinizi girin."
      footer={
        <>
          Hesabınız yok mu?{" "}
          <Link to="/kayit" className="font-medium text-white hover:underline">
            Kayıt olun
          </Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link to="/ilk-kurulum" className="font-medium text-white hover:underline">
            İlk kurulum
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <FormField label="E-posta" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className={inputClass}
            placeholder="ornek@karsiyaka.local"
            value={form.email}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Şifre" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />
        </FormField>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Giriş Yap
        </Button>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
