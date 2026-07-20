import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { createTicket } from "../../api/ticket.api";
import { getCategories } from "../../api/category.api";
import FormField, { inputClass } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Tooltip from "../../components/common/Tooltip";
import { useAuth } from "../../context/useAuth";
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_OPTIONS, TICKET_PRIORITY } from "../../utils/constants";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CreateTicketPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: TICKET_PRIORITY.NORMAL,
    location: "",
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setError("");

    if (images.length + files.length > MAX_FILES) {
      setError(`En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError("Her fotoğraf en fazla 5MB olabilir.");
      return;
    }

    setImages((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
      setError("Başlık, açıklama ve kategori zorunludur.");
      return;
    }

    if (!user?.departmentId) {
      setError(
        "Talep oluşturmak için hesabınıza bağlı bir müdürlük bulunmalıdır. Lütfen yöneticinizden hesabınızı bir müdürlüğe atamasını isteyin."
      );
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("categoryId", form.categoryId);
    formData.append("priority", form.priority);
    if (form.location.trim()) formData.append("location", form.location.trim());
    images.forEach((file) => formData.append("images", file));

    setIsSubmitting(true);
    try {
      const data = await createTicket(formData);
      navigate(`/personel/talepler/${data.ticket.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Yeni Destek Talebi</h1>
        <p className="text-sm text-slate-500">Sorununuzu detaylı bir şekilde açıklayın, ilgili birime iletelim.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-6 shadow-card">
        <ErrorAlert message={error} />

        <FormField label="Başlık" required>
          <input
            name="title"
            className={inputClass}
            placeholder="Örn: Yazıcı çalışmıyor"
            value={form.title}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Açıklama" required>
          <textarea
            name="description"
            rows={4}
            className={inputClass}
            placeholder="Sorunu detaylı şekilde açıklayın..."
            value={form.description}
            onChange={handleChange}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Kategori" required>
            <select name="categoryId" className={inputClass} value={form.categoryId} onChange={handleChange}>
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Öncelik" required>
            <select name="priority" className={inputClass} value={form.priority} onChange={handleChange}>
              {TICKET_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {TICKET_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Konum" hint="Örn: 2. Kat, Bilgi İşlem Ofisi">
          <input name="location" className={inputClass} value={form.location} onChange={handleChange} />
        </FormField>

        <FormField label="Fotoğraflar" hint="En fazla 5 fotoğraf, her biri en fazla 5MB (JPG, PNG, WEBP, HEIC).">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:bg-slate-50">
            <ImagePlus className="h-5 w-5" />
            Fotoğraf ekle
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                >
                  {file.name}
                  <Tooltip content="Kaldır">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`${file.name} fotoğrafını kaldır`}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </FormField>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Talebi Oluştur
        </Button>
      </form>
    </div>
  );
};

export default CreateTicketPage;
