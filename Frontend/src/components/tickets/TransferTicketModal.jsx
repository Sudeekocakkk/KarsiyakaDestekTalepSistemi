import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ErrorAlert from "../common/ErrorAlert";
import FormField, { inputClass } from "../common/FormField";
import { getSpecializations, getSpecializationById } from "../../api/specialization.api";
import { transferTicket } from "../../api/ticket.api";

const emptyForm = {
  specializationId: "",
  assignMode: "auto",
  technicianId: "",
  reason: "",
  workDescription: "",
};

// Atanmış teknik personelin (veya ADMIN'in), bir talebi başka bir uzmanlık
// alanına — isteğe bağlı olarak belirli bir kişiye — aktarmasını sağlar.
// "Fark etmez, otomatik ata" seçilirse backend en az yüklü aktif teknik
// personeli seçer (bkz. ticketAssignment.service.js).
const TransferTicketModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [specializations, setSpecializations] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(emptyForm);
    setError("");
    setTechnicians([]);

    getSpecializations()
      .then((data) => setSpecializations(data.specializations.filter((s) => s.isActive)))
      .catch(() => setSpecializations([]));
  }, [isOpen]);

  useEffect(() => {
    if (!form.specializationId) {
      setTechnicians([]);
      return;
    }

    setIsLoadingTechnicians(true);
    getSpecializationById(form.specializationId)
      .then((data) => {
        const activeTechnicians = (data.specialization.users || []).filter(
          (user) => user.role === "TEKNIK_PERSONEL" && user.isActive
        );
        setTechnicians(activeTechnicians);
      })
      .catch(() => setTechnicians([]))
      .finally(() => setIsLoadingTechnicians(false));
  }, [form.specializationId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!form.specializationId) {
      setError("Hedef uzmanlık alanı seçmelisiniz.");
      return;
    }

    if (form.assignMode === "specific" && !form.technicianId) {
      setError("Belirli personel seçeneği için bir teknik personel seçmelisiniz.");
      return;
    }

    if (!form.reason.trim() || !form.workDescription.trim()) {
      setError("Aktarma nedeni ve yapılan işlemin açıklaması zorunludur.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await transferTicket(ticket.id, {
        toSpecializationId: Number(form.specializationId),
        toUserId: form.assignMode === "specific" ? Number(form.technicianId) : undefined,
        reason: form.reason.trim(),
        workDescription: form.workDescription.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Uzmanlığa Aktar"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Aktar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />

        <FormField label="Hedef Uzmanlık Alanı" required>
          <select
            className={inputClass}
            value={form.specializationId}
            onChange={handleChange("specializationId")}
            disabled={isSubmitting}
          >
            <option value="">Uzmanlık alanı seçin</option>
            {specializations.map((specialization) => (
              <option key={specialization.id} value={specialization.id}>
                {specialization.name}
              </option>
            ))}
          </select>
        </FormField>

        {form.specializationId && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="assignMode"
                value="auto"
                checked={form.assignMode === "auto"}
                onChange={handleChange("assignMode")}
                disabled={isSubmitting}
              />
              Fark etmez, otomatik ata
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="assignMode"
                value="specific"
                checked={form.assignMode === "specific"}
                onChange={handleChange("assignMode")}
                disabled={isSubmitting}
              />
              Belirli personel seç
            </label>

            {form.assignMode === "specific" && (
              <select
                className={inputClass}
                value={form.technicianId}
                onChange={handleChange("technicianId")}
                disabled={isSubmitting || isLoadingTechnicians}
              >
                <option value="">
                  {isLoadingTechnicians ? "Yükleniyor..." : "Teknik personel seçin"}
                </option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            )}
            {form.assignMode === "specific" &&
              !isLoadingTechnicians &&
              technicians.length === 0 && (
                <p className="text-xs text-amber-600">
                  Bu uzmanlık alanında aktif teknik personel bulunamadı.
                </p>
              )}
          </div>
        )}

        <FormField label="Aktarma Nedeni" required>
          <textarea
            rows={2}
            className={inputClass}
            value={form.reason}
            onChange={handleChange("reason")}
            placeholder="Bu talebi neden aktarıyorsunuz?"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="Yaptığınız İşlemin Açıklaması" required>
          <textarea
            rows={3}
            className={inputClass}
            value={form.workDescription}
            onChange={handleChange("workDescription")}
            placeholder="Kendi uzmanlık alanınızda yaptığınız işlemi açıklayın..."
            disabled={isSubmitting}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default TransferTicketModal;
