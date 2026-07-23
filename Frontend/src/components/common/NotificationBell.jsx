import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../context/useNotifications";
import { formatDateTime } from "../../utils/formatters";
import { ticketDetailPath } from "../../utils/constants";

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (notification) => {
    if (!notification.isRead) markAsRead(notification.id);
    setIsOpen(false);
    if (notification.ticketId) {
      navigate(ticketDetailPath(user?.role, notification.ticketId));
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Bildirimler"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl2 border border-slate-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-navy-700 hover:underline"
                >
                  Tümünü okundu yap
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Henüz bildirim yok.
                </p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleItemClick(notification)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${
                      notification.isRead ? "" : "bg-sky-50/60"
                    }`}
                  >
                    <div className="flex w-full items-center gap-2">
                      {!notification.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                      )}
                      <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                    </div>
                    <p className="text-xs text-slate-600">{notification.message}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
