import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import {
  addMessage,
  addSolution,
  assignTicket,
  getTicketById,
  updateTicketStatus,
} from "../../api/ticket.api";
import { getUsers } from "../../api/user.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import SuccessAlert from "../../components/common/SuccessAlert";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import Button from "../../components/common/Button";
import { inputClass } from "../../components/common/FormField";
import { useAuth } from "../../context/useAuth";
import { formatDateTime, resolveFileUrl } from "../../utils/formatters";
import {
  ROLES,
  TICKET_LOG_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_OPTIONS,
} from "../../utils/constants";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusValue, setStatusValue] = useState("");
  const [assigneeValue, setAssigneeValue] = useState("");
  const [solutionValue, setSolutionValue] = useState("");
  const [messageValue, setMessageValue] = useState("");

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [savingSolution, setSavingSolution] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getTicketById(id);
      setTicket(data.ticket);
      setStatusValue(data.ticket.status);
      setAssigneeValue(data.ticket.assignedToId ? String(data.ticket.assignedToId) : "");
      setSolutionValue(data.ticket.resolutionDescription || "");
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

  const handleStatusSave = async () => {
    setSavingStatus(true);
    setError("");
    setSuccess("");
    try {
      await updateTicketStatus(id, statusValue);
      setSuccess("Talep durumu güncellendi.");
      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssigneeSave = async () => {
    if (!assigneeValue) return;
    setSavingAssignee(true);
    setError("");
    setSuccess("");
    try {
      await assignTicket(id, Number(assigneeValue));
      setSuccess("Talep personele atandı.");
      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAssignee(false);
    }
  };

  const handleSolutionSave = async () => {
    if (!solutionValue.trim()) {
      setError("Çözüm açıklaması zorunludur.");
      return;
    }
    setSavingSolution(true);
    setError("");
    setSuccess("");
    try {
      await addSolution(id, solutionValue.trim());
      setSuccess("Çözüm açıklaması kaydedildi.");
      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSolution(false);
    }
  };

  const handleMessageSend = async (event) => {
    event.preventDefault();
    if (!messageValue.trim()) return;
    setSendingMessage(true);
    setError("");
    try {
      await addMessage(id, messageValue.trim());
      setMessageValue("");
      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingMessage(false);
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

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Kategori" value={ticket.category?.name} />
          <InfoRow label="Müdürlük" value={ticket.department?.name} />
          <InfoRow label="Konum" value={ticket.location || "-"} />
          <InfoRow label="Oluşturan" value={ticket.createdBy?.name} />
          <InfoRow label="Atanan Personel" value={ticket.assignedTo?.name || "Henüz atanmadı"} />
          <InfoRow label="Oluşturma Tarihi" value={formatDateTime(ticket.createdAt)} />
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
            <div className="flex flex-wrap gap-3">
              {ticket.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={resolveFileUrl(attachment.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachment.originalName}
                </a>
              ))}
            </div>
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

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl2 bg-white p-5 shadow-card">
            <p className="mb-2 text-sm font-semibold text-slate-700">Personele Ata</p>
            <select
              className={inputClass}
              value={assigneeValue}
              onChange={(event) => setAssigneeValue(event.target.value)}
            >
              <option value="">Teknik personel seçin</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
            <Button className="mt-3 w-full" onClick={handleAssigneeSave} isLoading={savingAssignee}>
              Ata
            </Button>
          </div>

          <div className="rounded-xl2 bg-white p-5 shadow-card">
            <p className="mb-2 text-sm font-semibold text-slate-700">Durum Güncelle</p>
            <select
              className={inputClass}
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value)}
            >
              {TICKET_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Button className="mt-3 w-full" onClick={handleStatusSave} isLoading={savingStatus}>
              Güncelle
            </Button>
          </div>

          <div className="rounded-xl2 bg-white p-5 shadow-card">
            <p className="mb-2 text-sm font-semibold text-slate-700">Çözüm Açıklaması</p>
            <textarea
              rows={3}
              className={inputClass}
              value={solutionValue}
              onChange={(event) => setSolutionValue(event.target.value)}
              placeholder="Çözüm açıklaması girin..."
            />
            <Button className="mt-3 w-full" onClick={handleSolutionSave} isLoading={savingSolution}>
              Kaydet
            </Button>
          </div>
        </div>
      )}

      {!isAdmin && user?.role === ROLES.TEKNIK_PERSONEL && (
        <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Durum güncelleme ve çözüm girme işlemleri şu anda backend tarafında yalnızca
          yöneticilere açık. Bu talebe yalnızca açıklama/mesaj ekleyebilirsiniz.
        </div>
      )}

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
                {log.description && <p className="text-sm text-slate-600">{log.description}</p>}
                <p className="text-xs text-slate-400">
                  {log.user?.name || "Sistem"} · {formatDateTime(log.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">Henüz kayıt yok.</p>
        )}

        <form onSubmit={handleMessageSend} className="mt-4 flex gap-2">
          <input
            className={inputClass}
            placeholder="Açıklama / mesaj ekle..."
            value={messageValue}
            onChange={(event) => setMessageValue(event.target.value)}
          />
          <Button type="submit" isLoading={sendingMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
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
