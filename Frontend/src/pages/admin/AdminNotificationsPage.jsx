import { useEffect, useState } from "react";
import { getAdminNotifications } from "../../api/notification.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import ScrollableListContainer from "../../components/common/ScrollableListContainer";
import { inputClass } from "../../components/common/FormField";
import { formatDateTime } from "../../utils/formatters";
import { NOTIFICATION_TYPE_LABELS } from "../../utils/constants";

const TYPE_OPTIONS = Object.keys(NOTIFICATION_TYPE_LABELS);

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "", isRead: "" });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.isRead) params.isRead = filters.isRead;
        const data = await getAdminNotifications(params);
        setNotifications(data.notifications);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Bildirimler</h1>
        <p className="text-sm text-slate-500">
          Sistemde gönderilen tüm bildirimleri türüne, alıcısına ve okunma durumuna göre görüntüleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl2 bg-white p-4 shadow-card sm:grid-cols-2">
        <select name="type" className={inputClass} value={filters.type} onChange={handleFilterChange}>
          <option value="">Tüm Türler</option>
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {NOTIFICATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select name="isRead" className={inputClass} value={filters.isRead} onChange={handleFilterChange}>
          <option value="">Okunma Durumu (Tümü)</option>
          <option value="true">Okundu</option>
          <option value="false">Okunmadı</option>
        </select>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        {isLoading ? (
          <Loader label="Bildirimler yükleniyor..." />
        ) : notifications.length === 0 ? (
          <EmptyState title="Filtreye uygun bildirim bulunamadı" />
        ) : (
          <ScrollableListContainer rowCount={notifications.length}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Tür</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Başlık / Mesaj</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Alıcı</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Gönderilme</th>
                  <th className="sticky top-0 z-10 bg-white pb-2 pr-4">Durum</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 text-slate-600">
                      {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-slate-700">{notification.title}</p>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {notification.user?.name}
                      <p className="text-xs text-slate-400">{notification.user?.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{formatDateTime(notification.createdAt)}</td>
                    <td className="py-2.5 pr-4">
                      {notification.isRead ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                          Okundu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                          Okunmadı
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableListContainer>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
