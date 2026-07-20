import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, PowerOff } from "lucide-react";
import {
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from "../../api/category.api";
import { getSpecializations } from "../../api/specialization.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import FormField, { inputClass } from "../../components/common/FormField";
import Tooltip from "../../components/common/Tooltip";
import ScrollableListContainer from "../../components/common/ScrollableListContainer";
import ListSearchInput from "../../components/common/ListSearchInput";
import { matchesSearch } from "../../utils/search";

const emptyForm = { id: null, name: "", description: "", specializationId: "", isActive: true };

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        matchesSearch(searchTerm, [category.name, category.description])
      ),
    [categories, searchTerm]
  );

  const loadCategories = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCategories({ includeInactive: "true" });
      setCategories(data.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    getSpecializations().then((data) => setSpecializations(data.specializations)).catch(() => {});
  }, []);

  const specializationName = (id) => specializations.find((spec) => spec.id === id)?.name || "-";

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  };

  const openEdit = (category) => {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description || "",
      specializationId: String(category.specializationId),
      isActive: category.isActive,
    });
    setFormError("");
    setModalMode("edit");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError("Kategori adı zorunludur.");
      return;
    }

    if (modalMode === "create" && !form.specializationId) {
      setFormError("Uzmanlık seçimi zorunludur.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (modalMode === "create") {
        await createCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          specializationId: Number(form.specializationId),
        });
      } else {
        // Backend yalnızca name ve isActive günceller; specializationId oluşturma sonrası sabittir.
        await updateCategory(form.id, {
          name: form.name.trim(),
          isActive: form.isActive,
        });
      }
      setModalMode(null);
      await loadCategories();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (category) => {
    if (!window.confirm(`"${category.name}" kategorisini pasif hale getirmek istediğinize emin misiniz?`)) return;
    try {
      await deactivateCategory(category.id);
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-500">Talep kategorilerini ve bağlı oldukları uzmanlık alanını yönetin.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Yeni Kategori
        </Button>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <ListSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Kategori ara..."
          className="mb-4 max-w-sm"
        />

        {isLoading ? (
          <Loader label="Kategoriler yükleniyor..." />
        ) : categories.length === 0 ? (
          <EmptyState title="Henüz kategori eklenmemiş" />
        ) : filteredCategories.length === 0 ? (
          <EmptyState title="Aramanızla eşleşen kayıt bulunamadı." />
        ) : (
          <ScrollableListContainer rowCount={filteredCategories.length}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Kategori Adı</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Uzmanlık Alanı</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Durum</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{category.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {category.specialization?.name || specializationName(category.specializationId)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {category.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex justify-end gap-2">
                        <Tooltip content="Düzenle">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            aria-label="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        {category.isActive && (
                          <Tooltip content="Pasif Hale Getir">
                            <button
                              type="button"
                              onClick={() => handleDeactivate(category)}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                              aria-label="Pasif hale getir"
                            >
                              <PowerOff className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableListContainer>
        )}
      </div>

      <Modal
        title={modalMode === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}
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
          <FormField label="Kategori Adı" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormField>

          <FormField
            label="Uzmanlık Alanı"
            required={modalMode === "create"}
            hint={modalMode === "edit" ? "Oluşturma sonrası backend tarafından değiştirilemez." : undefined}
          >
            <select
              className={inputClass}
              value={form.specializationId}
              onChange={(event) => setForm((prev) => ({ ...prev, specializationId: event.target.value }))}
              disabled={modalMode === "edit"}
            >
              <option value="">Uzmanlık seçin</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Açıklama">
            <textarea
              rows={3}
              className={inputClass}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              disabled={modalMode === "edit"}
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

export default CategoryManagementPage;
