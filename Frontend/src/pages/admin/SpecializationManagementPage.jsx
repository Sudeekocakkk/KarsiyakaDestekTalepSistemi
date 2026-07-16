import { useEffect, useState } from "react";
import { Plus, Pencil, PowerOff, Power } from "lucide-react";
import {
  createSpecialization,
  deleteSpecialization,
  getSpecializations,
  updateSpecialization,
} from "../../api/specialization.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import FormField, { inputClass } from "../../components/common/FormField";

const emptyForm = { id: null, name: "", description: "", isActive: true };

const SpecializationManagementPage = () => {
  const [specializations, setSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadSpecializations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getSpecializations();
      setSpecializations(data.specializations);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpecializations();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  };

  const openEdit = (spec) => {
    setForm({ id: spec.id, name: spec.name, description: spec.description || "", isActive: spec.isActive });
    setFormError("");
    setModalMode("edit");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Uzmanlık adı zorunludur.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (modalMode === "create") {
        await createSpecialization({ name: form.name.trim(), description: form.description.trim() || undefined });
      } else {
        await updateSpecialization(form.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        });
      }
      setModalMode(null);
      await loadSpecializations();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Backend rotası DELETE olsa da yalnızca isActive:false yapıyor (soft delete).
  const handleToggleActive = async (spec) => {
    try {
      if (spec.isActive) {
        await deleteSpecialization(spec.id);
      } else {
        await updateSpecialization(spec.id, { isActive: true });
      }
      await loadSpecializations();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Uzmanlık Alanı Yönetimi</h1>
          <p className="text-sm text-slate-500">
            Teknik personelin uzmanlık alanlarını ve kategorilerin bağlı olduğu uzmanlıkları yönetin.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Yeni Uzmanlık
        </Button>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        {isLoading ? (
          <Loader label="Uzmanlık alanları yükleniyor..." />
        ) : specializations.length === 0 ? (
          <EmptyState title="Henüz uzmanlık alanı eklenmemiş" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Ad</th>
                  <th className="pb-2 pr-4">Açıklama</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {specializations.map((spec) => (
                  <tr key={spec.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{spec.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{spec.description || "-"}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          spec.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {spec.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(spec)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(spec)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label={spec.isActive ? "Pasifleştir" : "Aktifleştir"}
                        >
                          {spec.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
        title={modalMode === "create" ? "Yeni Uzmanlık Alanı" : "Uzmanlık Alanını Düzenle"}
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
          <FormField label="Uzmanlık Adı" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormField>
          <FormField label="Açıklama">
            <textarea
              rows={3}
              className={inputClass}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </FormField>
          {modalMode === "edit" && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Aktif
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default SpecializationManagementPage;
