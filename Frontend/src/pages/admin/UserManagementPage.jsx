import { useEffect, useState } from "react";
import { Plus, Pencil, UserX, Search } from "lucide-react";
import { createUser, deactivateUser, getUsers, updateUser } from "../../api/user.api";
import { getDepartments } from "../../api/department.api";
import { getSpecializations } from "../../api/specialization.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import FormField, { inputClass } from "../../components/common/FormField";
import { ROLES, ROLE_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";

const ROLE_OPTIONS = Object.values(ROLES);

const emptyForm = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: ROLES.PERSONEL,
  departmentId: "",
  isActive: true,
  specializationIds: [],
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState({ role: "", isActive: "", search: "" });
  const [modalMode, setModalMode] = useState(null); // "create" | "edit"
  const [form, setForm] = useState(emptyForm);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.isActive) params.isActive = filters.isActive;
      if (filters.search) params.search = filters.search;
      const data = await getUsers(params);
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDepartments().then((data) => setDepartments(data.departments)).catch(() => {});
    getSpecializations().then((data) => setSpecializations(data.specializations)).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  };

  const openEditModal = (user) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      departmentId: user.departmentId ? String(user.departmentId) : "",
      isActive: user.isActive,
      specializationIds: user.specializations?.map((spec) => spec.id) || [],
    });
    setFormError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleSpecialization = (specId) => {
    setForm((prev) => {
      const exists = prev.specializationIds.includes(specId);
      return {
        ...prev,
        specializationIds: exists
          ? prev.specializationIds.filter((id) => id !== specId)
          : [...prev.specializationIds, specId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Ad soyad ve e-posta zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === "create") {
        if (!form.password || form.password.length < 6) {
          setFormError("Şifre en az 6 karakter olmalıdır.");
          setIsSaving(false);
          return;
        }
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        });
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          isActive: form.isActive,
        };
        if (form.password) {
          if (form.password.length < 6) {
            setFormError("Şifre en az 6 karakter olmalıdır.");
            setIsSaving(false);
            return;
          }
          payload.password = form.password;
        }
        if (form.role === ROLES.TEKNIK_PERSONEL) {
          payload.specializationIds = form.specializationIds;
        }
        await updateUser(form.id, payload);
      }

      closeModal();
      await loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`${user.name} kullanıcısını pasif hale getirmek istediğinize emin misiniz?`)) return;
    try {
      await deactivateUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Kullanıcı / Personel Yönetimi</h1>
          <p className="text-sm text-slate-500">Kullanıcı ekleyin, düzenleyin ve rollerini yönetin.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Yeni Kullanıcı
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl2 bg-white p-4 shadow-card sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="İsim veya e-posta ara..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
        </div>
        <select
          className={inputClass}
          value={filters.role}
          onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
        >
          <option value="">Tüm Roller</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filters.isActive}
          onChange={(event) => setFilters((prev) => ({ ...prev, isActive: event.target.value }))}
        >
          <option value="">Tüm Durumlar</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        {isLoading ? (
          <Loader label="Kullanıcılar yükleniyor..." />
        ) : users.length === 0 ? (
          <EmptyState title="Kullanıcı bulunamadı" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Ad Soyad</th>
                  <th className="pb-2 pr-4">E-posta</th>
                  <th className="pb-2 pr-4">Rol</th>
                  <th className="pb-2 pr-4">Müdürlük</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4">Kayıt Tarihi</th>
                  <th className="pb-2 pr-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{user.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{user.email}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{ROLE_LABELS[user.role]}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{user.department?.name || "-"}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{formatDate(user.createdAt)}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(user)}
                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                            aria-label="Pasif hale getir"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title={modalMode === "create" ? "Yeni Kullanıcı" : "Kullanıcıyı Düzenle"}
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Vazgeç
            </Button>
            <Button onClick={handleSubmit} isLoading={isSaving}>
              Kaydet
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={formError} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Ad Soyad" required>
              <input name="name" className={inputClass} value={form.name} onChange={handleChange} />
            </FormField>
            <FormField label="E-posta" required>
              <input name="email" type="email" className={inputClass} value={form.email} onChange={handleChange} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={modalMode === "create" ? "Şifre" : "Yeni Şifre"}
              required={modalMode === "create"}
              hint={modalMode === "edit" ? "Değiştirmek istemiyorsanız boş bırakın." : "En az 6 karakter."}
            >
              <input
                name="password"
                type="password"
                className={inputClass}
                value={form.password}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Rol" required>
              <select name="role" className={inputClass} value={form.role} onChange={handleChange}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Müdürlük">
            <select name="departmentId" className={inputClass} value={form.departmentId} onChange={handleChange}>
              <option value="">Müdürlük seçilmedi</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </FormField>

          {form.role === ROLES.TEKNIK_PERSONEL && (
            <FormField label="Uzmanlık Alanları" hint="Yalnızca teknik personele atanabilir.">
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => {
                  const active = form.specializationIds.includes(spec.id);
                  return (
                    <button
                      type="button"
                      key={spec.id}
                      onClick={() => toggleSpecialization(spec.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-navy-700 bg-navy-700 text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {spec.name}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}

          {modalMode === "edit" && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300"
              />
              Hesap aktif
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
