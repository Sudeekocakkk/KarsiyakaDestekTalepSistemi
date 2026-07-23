import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserPlus2,
} from "lucide-react";
import {
  getTicketSummaryReport,
  getDashboardChartsReport,
  getTopDepartmentsReport,
} from "../../api/report.api";
import { getAllTickets } from "../../api/ticket.api";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import TicketStatusPieChart from "../../components/common/TicketStatusPieChart";
import MonthlyTicketTrendChart from "../../components/common/MonthlyTicketTrendChart";
import CategoryDistributionChart from "../../components/common/CategoryDistributionChart";
import DashboardSearch from "../../components/common/DashboardSearch";
import TopDepartmentsCard from "../../components/common/TopDepartmentsCard";
import { formatDateTime } from "../../utils/formatters";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topDepartments, setTopDepartments] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const statusCounts = useMemo(
    () => ({
      YENI: summary?.newTickets ?? 0,
      ATANDI: summary?.assignedTickets ?? 0,
      ISLEMDE: summary?.inProgressTickets ?? 0,
      BEKLEMEDE: summary?.waitingTickets ?? 0,
      COZULDU: summary?.solvedTickets ?? 0,
      IPTAL_EDILDI: summary?.cancelledTickets ?? 0,
    }),
    [summary]
  );

  const handleStatusSliceClick = (status) => {
    navigate(`/admin/talepler?status=${status}`);
  };

  const handleCategorySliceClick = (categoryId) => {
    navigate(`/admin/talepler?categoryId=${categoryId}`);
  };

  const handleDepartmentRowClick = (departmentId) => {
    navigate(`/admin/talepler?departmentId=${departmentId}`);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [summaryData, chartsData, ticketsData, topDepartmentsData] = await Promise.all([
          getTicketSummaryReport(),
          getDashboardChartsReport(),
          getAllTickets(),
          getTopDepartmentsReport(),
        ]);
        setSummary(summaryData.summary);
        setMonthly(chartsData.monthly);
        setCategories(chartsData.categories);
        setRecentTickets(ticketsData.tickets.slice(0, 6));
        setTopDepartments(topDepartmentsData.topDepartments);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <Loader label="Dashboard yükleniyor..." />;

  return (
    <div className="space-y-6">
      <DashboardSearch resultPath="/admin/talepler" />

      <ErrorAlert message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Talep" value={summary?.totalTickets ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Yeni Talepler" value={summary?.newTickets ?? 0} icon={Clock} color="slate" />
        <StatCard label="Atanan Talepler" value={summary?.assignedTickets ?? 0} icon={UserPlus2} color="violet" />
        <StatCard label="İşlemdeki Talepler" value={summary?.inProgressTickets ?? 0} icon={Wrench} color="amber" />
        <StatCard label="Çözülen Talepler" value={summary?.solvedTickets ?? 0} icon={CheckCircle2} color="emerald" />
        <StatCard label="İptal Edilen Talepler" value={summary?.cancelledTickets ?? 0} icon={XCircle} color="rose" />
        <StatCard label="Acil Öncelikli Talepler" value={summary?.urgentTickets ?? 0} icon={AlertTriangle} color="rose" />
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <p className="mb-4 text-sm font-semibold text-slate-700">Duruma Göre Talep Dağılımı</p>
        <TicketStatusPieChart statusCounts={statusCounts} onSliceClick={handleStatusSliceClick} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        <div className="rounded-xl2 bg-white p-5 shadow-card lg:col-span-3">
          <p className="mb-4 text-sm font-semibold text-slate-700">Aylık Talep Dağılımı</p>
          <MonthlyTicketTrendChart data={monthly} />
        </div>

        <div className="rounded-xl2 bg-white p-5 shadow-card lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-slate-700">Taleplerin Kategoriye Göre Dağılımı</p>
          <CategoryDistributionChart categories={categories} onSliceClick={handleCategorySliceClick} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <div className="rounded-xl2 bg-white p-5 shadow-card">
          <p className="mb-4 text-sm font-semibold text-slate-700">En Yoğun Müdürlükler</p>
          <TopDepartmentsCard departments={topDepartments} onRowClick={handleDepartmentRowClick} />
        </div>

        <div className="rounded-xl2 bg-white p-5 shadow-card">
          <p className="mb-4 text-sm font-semibold text-slate-700">Hızlı Erişim</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Link to="/admin/talepler" className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm text-slate-600 hover:bg-slate-50">
              Tüm Talepleri Yönet
            </Link>
            <Link to="/admin/kullanicilar" className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm text-slate-600 hover:bg-slate-50">
              Kullanıcı / Personel Ekle
            </Link>
            <Link to="/admin/raporlar" className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm text-slate-600 hover:bg-slate-50">
              Performans Raporlarını Gör
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Son Talepler</p>
          <Link to="/admin/talepler" className="text-sm font-medium text-navy-700 hover:underline">
            Tümünü Gör
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <EmptyState title="Henüz talep yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Talep No</th>
                  <th className="pb-2 pr-4">Başlık</th>
                  <th className="pb-2 pr-4">Müdürlük</th>
                  <th className="pb-2 pr-4">Öncelik</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link to={`/admin/talepler/${ticket.id}`} className="font-medium text-navy-700 hover:underline">
                        #{ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{ticket.title}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{ticket.department?.name}</td>
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

export default AdminDashboardPage;
