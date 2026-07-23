import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ErrorAlert from "../common/ErrorAlert";
import FormField, { inputClass } from "../common/FormField";
import { getTechnicians } from "../../api/user.api";
import { createHandoverRequest } from "../../api/handover.api";

const emptyForm = { technicianId: "", reason: "" };

// Talebe atanmış teknik personelin, işi doğrudan devretmek yerine önce
// hedef teknik personele bir ONAY isteği göndermesini sağlar (bkz.
// handover.controller.js — istek PENDING olarak oluşturulur, ticket
// yalnızca hedef kişi kabul edince devredilir).
const HandoverRequestModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(emptyForm);
    setError("");

    getTechnicians({ excludeSelf: "true" })
      .then((data) => setTechnicians(data.technicians))
      .catch(() => setTechnicians([]));
  }, [isOpen]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!form.technicianId) {
      setError("Devredilecek personeli seçmelisiniz.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Devir nedeni zorunludur.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await createHandoverRequest(ticket.id, {
        requestedToId: Number(form.technicianId),
        reason: form.reason.trim(),
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
      title="İşi Devret"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Devir İsteği Gönder
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />

        <FormField label="Devredilecek Personel" required>
          <select
            className={inputClass}
            value={form.technicianId}
            onChange={handleChange("technicianId")}
            disabled={isSubmitting}
          >
            <option value="">Teknik personel seçin</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Devir Nedeni" required>
          <textarea
            rows={3}
            className={inputClass}
            value={form.reason}
            onChange={handleChange("reason")}
            placeholder="Bu işi neden devretmek istiyorsunuz?"
            disabled={isSubmitting}
          />
        </FormField>

        <p className="text-xs text-slate-400">
          İstek, hedef personel kabul edene kadar talep sizde kalır. Personel isteği reddederse talep sizde kalmaya devam eder.
        </p>
      </div>
    </Modal>
  );
};

export default HandoverRequestModal;
