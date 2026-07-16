import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import { register } from "../../api/auth.api";
import { getActiveDepartmentsPublic } from "../../api/department.api";
import {
  isAllowedRegistrationEmail,
  UNSUPPORTED_EMAIL_DOMAIN_MESSAGE,
} from "../../utils/emailValidation";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    departmentId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      setDepartmentsError("");

      try {
        const data = await getActiveDepartmentsPublic();
        if (isMounted) setDepartments(data.departments);
      } catch (err) {
        if (isMounted) {
          setDepartmentsError(
            "Müdürlükler yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin."
          );
        }
      } finally {
        if (isMounted) setIsLoadingDepartments(false);
      }
    };

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Ad soyad, e-posta ve şifre zorunludur.");
      return;
    }

    if (form.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (!isAllowedRegistrationEmail(form.email)) {
      setError(UNSUPPORTED_EMAIL_DOMAIN_MESSAGE);
      return;
    }

    if (!form.departmentId) {
      setError("Müdürlük seçimi zorunludur.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        departmentId: Number(form.departmentId),
      });
      setSuccess("Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentSelectDisabled =
    isLoadingDepartments || Boolean(departmentsError);

  return (
    <AuthShell
      title="Hesap Oluştur"
      subtitle="Yeni hesaplar otomatik olarak Personel rolüyle oluşturulur."
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link to="/login" className="font-medium text-white hover:underline">
            Giriş yapın
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

        <FormField label="Şifre" htmlFor="password" required hint="En az 6 karakter.">
          <input
            id="password"
            name="password"
            type="password"
            className={inputClass}
            value={form.password}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Telefon" htmlFor="phone">
          <input id="phone" name="phone" className={inputClass} value={form.phone} onChange={handleChange} />
        </FormField>

        <FormField
          label="Müdürlük"
          htmlFor="departmentId"
          required
          error={departmentsError}
          hint={
            !departmentsError && !isLoadingDepartments
              ? "Aktif müdürlüklerden birini seçin."
              : undefined
          }
        >
          <select
            id="departmentId"
            name="departmentId"
            required
            className={inputClass}
            value={form.departmentId}
            onChange={handleChange}
            disabled={departmentSelectDisabled}
          >
            <option value="">
              {isLoadingDepartments ? "Müdürlükler yükleniyor..." : "Müdürlük seçin"}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </FormField>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={departmentSelectDisabled}
          className="w-full"
        >
          Kayıt Ol
        </Button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
