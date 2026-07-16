import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedTickets } from "../../api/ticket.api";
import { getCategories } from "../../api/category.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import { inputClass } from "../../components/common/FormField";
import { formatDateTime } from "../../utils/formatters";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_OPTIONS,
} from "../../utils/constants";

const AssignedTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "", categoryId: "" });

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        const data = await getAssignedTickets(params);
        setTickets(data.tickets);
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
        <h1 className="text-lg font-semibold text-slate-800">Bana Atanan Talepler</h1>
        <p className="text-sm text-slate-500">Size atanan tüm destek taleplerini görüntüleyin.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl2 bg-white p-4 shadow-card sm:grid-cols-3">
        <select name="status" className={inputClass} value={filters.status} onChange={handleFilterChange}>
          <option value="">Tüm Durumlar</option>
          {TICKET_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {TICKET_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select name="priority" className={inputClass} value={filters.priority} onChange={handleFilterChange}>
          <option value="">Tüm Öncelikler</option>
          {TICKET_PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {TICKET_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
        <select name="categoryId" className={inputClass} value={filters.categoryId} onChange={handleFilterChange}>
          <option value="">Tüm Kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <ErrorAlert message={error} />

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        {isLoading ? (
          <Loader label="Talepler yükleniyor..." />
        ) : tickets.length === 0 ? (
          <EmptyState title="Filtreye uygun talep bulunamadı" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Talep No</th>
                  <th className="pb-2 pr-4">Başlık</th>
                  <th className="pb-2 pr-4">Oluşturan</th>
                  <th className="pb-2 pr-4">Öncelik</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4">
                      <Link to={`/teknik/talepler/${ticket.id}`} className="font-medium text-navy-700 hover:underline">
                        #{ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{ticket.title}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{ticket.createdBy?.name}</td>
                    <td className="py-2.5 pr-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{formatDateTime(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTicketsPage;
