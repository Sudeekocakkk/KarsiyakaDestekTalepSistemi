import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../context/useNotifications";
import { ticketDetailPath } from "../../utils/constants";
import PriorityBadge from "./PriorityBadge";

// "Yeni talep oluşturuldu" mesaj kutusu: sayfa yenilenmeden, socket
// üzerinden gelen her bildirim için sağ üstte ~8sn görünen bir toast.
// NotificationContext zaten otomatik kaybolmayı yönetiyor; burada yalnızca
// "Talebi Görüntüle" ve "Kapat" aksiyonları var.
const NotificationToastStack = () => {
  const { user } = useAuth();
  const { toasts, dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  const handleView = (toast) => {
    markAsRead(toast.id);
    dismissToast(toast.id);
    if (toast.ticketId) {
      navigate(ticketDetailPath(user?.role, toast.ticketId));
    }
  };

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl2 border border-slate-100 bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {toast.ticket?.ticketNumber || ""}
              </p>
              <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>

          {toast.ticket && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {toast.ticket.priority && <PriorityBadge priority={toast.ticket.priority} />}
              {toast.ticket.department?.name && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {toast.ticket.department.name}
                </span>
              )}
              {toast.ticket.category?.name && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {toast.ticket.category.name}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Kapat
            </button>
            {toast.ticketId && (
              <button
                type="button"
                onClick={() => handleView(toast)}
                className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800"
              >
                Talebi Görüntüle
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToastStack;
