import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
import {
  getMyNotifications,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from "../api/notification.api";
import { ticketDetailPath } from "../utils/constants";

export const NotificationContext = createContext(null);

const TOAST_AUTO_DISMISS_MS = 8000;

// Masaüstü (tarayıcı/OS) bildirimi yalnızca "talep size atandı" tipinde
// tetiklenir — WhatsApp Web benzeri anlık bildirim kuralı yalnızca atama
// bildirimlerini kapsıyor (bkz. görev talebi). YENI_TALEP gibi birden çok
// teknik personele giden tipler burada bilinçli olarak dışarıda bırakılır.
const DESKTOP_NOTIFICATION_TYPES = new Set(["TALEP_ATANDI"]);

const isDesktopNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

// Bildirimleri hem listede (bildirim kutusu için) hem de geçici bir toast
// kuyruğunda (anlık mesaj kutusu için) tutar. Socket bağlantısı kesilip
// tekrar kurulduğunda (connectionEpoch değiştiğinde) liste DB'den tekrar
// çekilir — bu sayede offline kalınan süredeki bildirimler kaybolmaz.
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, connectionEpoch } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Tarayıcı bildirim izni daha önce hiç sorulmadıysa (permission==="default"),
  // kullanıcı giriş yaptığında bir kez istenir.
  useEffect(() => {
    if (!isAuthenticated || !isDesktopNotificationSupported()) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // İzin isteği reddedilir/başarısız olursa sessizce yok say —
        // uygulama içi toast/bildirim kutusu her durumda çalışmaya devam eder.
      });
    }
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await getMyNotifications({ limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Bildirim listesi alınamazsa sessizce yok say — arayüzün geri kalanını bloklamamalı.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
      return;
    }

    refresh();
  }, [isAuthenticated, refresh]);

  // Bağlantı koptuktan sonra yeniden kurulduğunda kaçırılmış olabilecek
  // bildirimleri DB'den tekrar çeker.
  useEffect(() => {
    if (connectionEpoch > 0) {
      refresh();
    }
  }, [connectionEpoch, refresh]);

  // Uygulama açıkken sayfa yenilenmeden gelen bildirimleri hem listeye/rozete
  // ekler hem de küçük toast kutusunu tetikler; uygun tipteyse (yalnızca
  // TALEP_ATANDI) ayrıca WhatsApp Web benzeri bir masaüstü/OS bildirimi
  // gösterir — bu bildirim yalnızca ilgili kullanıcının socket odasına
  // (user:{id}) emit edildiği için başka kimseye gitmez.
  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      setToasts((prev) => [...prev, notification]);

      if (
        DESKTOP_NOTIFICATION_TYPES.has(notification.type) &&
        isDesktopNotificationSupported() &&
        Notification.permission === "granted"
      ) {
        const desktopNotification = new Notification(notification.title, {
          body: notification.message,
          tag: `ticket-${notification.ticketId}`,
        });

        desktopNotification.onclick = () => {
          window.focus();
          if (notification.ticketId) {
            navigate(ticketDetailPath(user?.role, notification.ticketId));
          }
          desktopNotification.close();
        };
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, navigate, user?.role]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return undefined;

    const timers = toasts.map((toast) =>
      setTimeout(() => dismissToast(toast.id), TOAST_AUTO_DISMISS_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationReadRequest(id);
    } catch {
      // Optimistik güncelleme başarısız olsa bile arayüz kilitlenmemeli;
      // bir sonraki refresh() gerçek durumu düzeltir.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsReadRequest();
    } catch {
      // bkz. markAsRead
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      toasts,
      dismissToast,
      markAsRead,
      markAllAsRead,
      refresh,
    }),
    [notifications, unreadCount, toasts, dismissToast, markAsRead, markAllAsRead, refresh]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};
