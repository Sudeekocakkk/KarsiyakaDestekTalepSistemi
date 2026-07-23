import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRightLeft } from "lucide-react";
import { getTicketById, updateTicket } from "../../api/ticket.api";
import { getUsers } from "../../api/user.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import Button from "../../components/common/Button";
import { inputClass } from "../../components/common/FormField";
import PhotoThumbnailGallery from "../../components/common/PhotoThumbnailGallery";
import TransferTicketModal from "../../components/tickets/TransferTicketModal";
import { useAuth } from "../../context/useAuth";
import { formatDateTime } from "../../utils/formatters";
import {
  ROLES,
  TICKET_LOG_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_OPTIONS,
} from "../../utils/constants";

const CLOSED_STATUSES = ["COZULDU", "IPTAL_EDILDI"];

const emptyForm = {
  assignedToId: "",
  status: "",
  resolutionDescription: "",
  message: "",
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isAssignedTechnician =
    user?.role === ROLES.TEKNIK_PERSONEL && ticket?.assignedToId === user?.id;

  const canAssign = isAdmin;
  const canEditStatus = isAdmin || isAssignedTechnician;
  const canEditSolution = isAdmin || isAssignedTechnician;

  const isClosed = ticket ? CLOSED_STATUSES.includes(ticket.status) : false;
  const canTransfer = isAssignedTechnician && !isClosed;

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getTicketById(id);
      setTicket(data.ticket);

      const snapshot = {
        assignedToId: data.ticket.assignedToId ? String(data.ticket.assignedToId) : "",
        status: data.ticket.status,
        resolutionDescription: data.ticket.resolutionDescription || "",
        message: "",
      };

      setForm(snapshot);
      setInitialForm(snapshot);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!isAdmin) return;
    getUsers({ role: ROLES.TEKNIK_PERSONEL, isActive: "true" })
      .then((data) => setTechnicians(data.users))
      .catch(() => {});
  }, [isAdmin]);

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = useMemo(() => {
    return (
      (canAssign && form.assignedToId !== initialForm.assignedToId) ||
      (canEditStatus && form.status !== initialForm.status) ||
      (canEditSolution && form.resolutionDescription.trim() !== initialForm.resolutionDescription) ||
      form.message.trim() !== ""
    );
  }, [form, initialForm, canAssign, canEditStatus, canEditSolution]);

  const handleSave = async () => {
    if (isSaving || !hasChanges) return;

    const payload = {};

    if (canAssign && form.assignedToId && form.assignedToId !== initialForm.assignedToId) {
      payload.assignedToId = Number(form.assignedToId);
    }

    if (canEditStatus && form.status !== initialForm.status) {
      payload.status = form.status;
    }

    if (
      canEditSolution &&
      form.resolutionDescription.trim() !== initialForm.resolutionDescription
    ) {
      payload.resolutionDescription = form.resolutionDescription.trim();
    }

    if (form.message.trim()) {
      payload.message = form.message.trim();
    }

    if (Object.keys(payload).length === 0) return;

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateTicket(id, payload);
      setSuccess("Talep güncellendi.");
      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader label="Talep yükleniyor..." />;

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-400">#{ticket.ticketNumber}</p>
            <h1 className="text-lg font-semibold text-slate-800">{ticket.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {canTransfer && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsTransferModalOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" /> İşi Devret
            </Button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Kategori" value={ticket.category?.name} />
          <InfoRow label="Müdürlük" value={ticket.department?.name} />
          <InfoRow label="Konum" value={ticket.location || "-"} />
          <InfoRow label="Oluşturan" value={ticket.createdBy?.name} />
          <InfoRow label="Atanan Personel" value={ticket.assignedTo?.name || "Henüz atanmadı"} />
          <InfoRow label="Oluşturma Tarihi" value={formatDateTime(ticket.createdAt)} />
          {ticket.device && (
            <InfoRow
              label="Talebin Açıldığı Cihaz"
              value={`${ticket.device.ipAddress} · ${ticket.device.hostname}`}
            />
          )}
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-slate-400">Açıklama</p>
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {ticket.description}
          </p>
        </div>

        {ticket.attachments?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Fotoğraflar</p>
            <PhotoThumbnailGallery attachments={ticket.attachments} />
          </div>
        )}

        {ticket.resolutionDescription && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-slate-400">Çözüm Açıklaması</p>
            <p className="whitespace-pre-wrap rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              {ticket.resolutionDescription}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <p className="mb-4 text-sm font-semibold text-slate-700">Talebi Güncelle</p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {canAssign && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Personele Ata</p>
              <select
                className={inputClass}
                value={form.assignedToId}
                onChange={handleFieldChange("assignedToId")}
                disabled={isSaving}
              >
                <option value="">Teknik personel seçin</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canEditStatus && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Durum</p>
              <select
                className={inputClass}
                value={form.status}
                onChange={handleFieldChange("status")}
                disabled={isSaving}
              >
                {TICKET_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {TICKET_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canEditSolution && (
            <div className="lg:col-span-2">
              <p className="mb-2 text-xs font-medium text-slate-400">Çözüm Açıklaması</p>
              <textarea
                rows={3}
                className={inputClass}
                value={form.resolutionDescription}
                onChange={handleFieldChange("resolutionDescription")}
                placeholder="Çözüm açıklaması girin..."
                disabled={isSaving}
              />
            </div>
          )}

          <div className="lg:col-span-2">
            <p className="mb-2 text-xs font-medium text-slate-400">Açıklama / Not Ekle</p>
            <textarea
              rows={2}
              className={inputClass}
              value={form.message}
              onChange={handleFieldChange("message")}
              placeholder="Talebe açıklama veya not ekleyin..."
              disabled={isSaving}
            />
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Kaydedilmemiş değişiklikleriniz var.
          </div>
        )}

        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!hasChanges}
        >
          Kaydet
        </Button>
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <p className="mb-3 text-sm font-semibold text-slate-700">İşlem Geçmişi</p>
        {ticket.logs?.length ? (
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {ticket.logs.map((log) => (
              <li key={log.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-navy-700" />
                <p className="text-sm font-medium text-slate-700">
                  {TICKET_LOG_TYPE_LABELS[log.type] || log.type}
                </p>
                {log.description && (
                  <p className="whitespace-pre-wrap text-sm text-slate-600">{log.description}</p>
                )}
                <p className="text-xs text-slate-400">
                  {log.user?.name || "Sistem"} · {formatDateTime(log.createdAt)}
                </p>
                {log.device && (
                  <p className="text-[11px] text-slate-400">
                    IP: {log.device.ipAddress} · {log.device.hostname}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">Henüz kayıt yok.</p>
        )}
      </div>

      <TransferTicketModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        ticket={ticket}
        onSuccess={loadTicket}
      />
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-400">{label}</p>
    <p className="text-sm text-slate-700">{value || "-"}</p>
  </div>
);

export default TicketDetailPage;
