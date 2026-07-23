import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ErrorAlert from "../common/ErrorAlert";
import FormField from "../common/FormField";
import SearchableSelect from "../common/SearchableSelect";
import { getSpecializations, getSpecializationById } from "../../api/specialization.api";
import { getTechnicians } from "../../api/user.api";
import { transferTicket } from "../../api/ticket.api";

const ANY_VALUE = "";
const AUTO_ASSIGN_LABEL = "Fark Etmez - Otomatik Atama";

const emptyForm = { specializationId: ANY_VALUE, technicianId: ANY_VALUE };

// Atanmış teknik personelin (veya ADMIN'in) bir talebi doğrudan başka bir
// teknik personele devretmesini sağlar. Hem hedef uzmanlık hem hedef
// personel "Fark Etmez" olabilir; backend (transferTicket) bu kombinasyona
// göre otomatik atama yapar (bkz. ticketAssignment.service.js).
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

    getSpecializations()
      .then((data) => setSpecializations(data.specializations.filter((s) => s.isActive)))
      .catch(() => setSpecializations([]));
  }, [isOpen]);

  // Hedef uzmanlık değiştikçe teknik personel listesi anlık güncellenir:
  // belirli bir uzmanlık seçiliyse yalnızca o uzmanlıktaki aktif personel,
  // "Fark Etmez" seçiliyse tüm aktif teknik personeller listelenir.
  // `cancelled` bayrağı, kullanıcı hızlıca uzmanlık değiştirdiğinde eski bir
  // isteğin sonucunun yeni seçimin üzerine yazmasını engeller.
  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setIsLoadingTechnicians(true);

    const request = form.specializationId
      ? getSpecializationById(form.specializationId).then((data) =>
          (data.specialization.users || []).filter(
            (user) => user.role === "TEKNIK_PERSONEL" && user.isActive
          )
        )
      : getTechnicians().then((data) => data.technicians);

    request
      .then((list) => {
        if (cancelled) return;
        setTechnicians(list);
        // Önceden seçilmiş belirli bir teknik personel yeni uzmanlıkla
        // eşleşmiyorsa seçim otomatik temizlenir ("Fark Etmez" her zaman geçerlidir).
        setForm((prev) => {
          if (!prev.technicianId) return prev;
          const stillValid = list.some((tech) => String(tech.id) === String(prev.technicianId));
          return stillValid ? prev : { ...prev, technicianId: ANY_VALUE };
        });
      })
      .catch(() => {
        if (!cancelled) setTechnicians([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTechnicians(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, form.specializationId]);

  const specializationOptions = [
    { value: ANY_VALUE, label: "Fark Etmez" },
    ...specializations.map((specialization) => ({
      value: String(specialization.id),
      label: specialization.name,
    })),
  ];

  const technicianOptions = [
    { value: ANY_VALUE, label: AUTO_ASSIGN_LABEL },
    ...technicians.map((technician) => ({ value: String(technician.id), label: technician.name })),
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      await transferTicket(ticket.id, {
        toSpecializationId: form.specializationId || undefined,
        toUserId: form.technicianId || undefined,
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
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Devret
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />

        <FormField label="Hedef Uzmanlık Alanı">
          <SearchableSelect
            value={form.specializationId}
            onChange={(value) => setForm((prev) => ({ ...prev, specializationId: value }))}
            options={specializationOptions}
            placeholder="Uzmanlık adı yazın veya listeden seçin..."
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Teknik Personel Seçin"
          hint={isLoadingTechnicians ? "Personel listesi yükleniyor..." : undefined}
        >
          <SearchableSelect
            value={form.technicianId}
            onChange={(value) => setForm((prev) => ({ ...prev, technicianId: value }))}
            options={technicianOptions}
            placeholder="Personel adı yazın veya listeden seçin..."
            disabled={isSubmitting || isLoadingTechnicians}
            emptyMessage="Aktif teknik personel bulunamadı"
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default TransferTicketModal;
