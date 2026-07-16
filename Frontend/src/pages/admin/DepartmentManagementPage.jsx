import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../api/department.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import FormField, { inputClass } from "../../components/common/FormField";

const DepartmentManagementPage = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState({ id: null, name: "" });

  const loadDepartments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getDepartments();
      setDepartments(data.departments);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openCreate = () => {
    setForm({ id: null, name: "" });
    setFormError("");
    setModalMode("create");
  };

  const openEdit = (department) => {
    setForm({ id: department.id, name: department.name });
    setFormError("");
    setModalMode("edit");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Müdürlük adı zorunludur.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (modalMode === "create") {
        await createDepartment({ name: form.name.trim() });
      } else {
        await updateDepartment(form.id, { name: form.name.trim() });
      }
      setModalMode(null);
      await loadDepartments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`"${department.name}" müdürlüğünü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteDepartment(department.id);
      await loadDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Müdürlük Yönetimi</h1>
          <p className="text-sm text-slate-500">Müdürlükleri oluşturun, düzenleyin ve silin.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Yeni Müdürlük
        </Button>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        {isLoading ? (
          <Loader label="Müdürlükler yükleniyor..." />
        ) : departments.length === 0 ? (
          <EmptyState title="Henüz müdürlük eklenmemiş" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Müdürlük Adı</th>
                  <th className="pb-2 pr-4">Personel Sayısı</th>
                  <th className="pb-2 pr-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{department.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{department._count?.users ?? 0}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(department)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(department)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        title={modalMode === "create" ? "Yeni Müdürlük" : "Müdürlüğü Düzenle"}
        isOpen={Boolean(modalMode)}
        onClose={() => setModalMode(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalMode(null)}>
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
          <FormField label="Müdürlük Adı" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentManagementPage;
