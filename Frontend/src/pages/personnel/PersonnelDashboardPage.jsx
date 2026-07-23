import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Clock, Wrench, CheckCircle2, Plus } from "lucide-react";
import { getMyTickets } from "../../api/ticket.api";
import { getDashboardChartsReport } from "../../api/report.api";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import TicketStatusPieChart from "../../components/common/TicketStatusPieChart";
import MonthlyTicketTrendChart from "../../components/common/MonthlyTicketTrendChart";
import CategoryDistributionChart from "../../components/common/CategoryDistributionChart";
import DashboardSearch from "../../components/common/DashboardSearch";
import { formatDateTime } from "../../utils/formatters";
import { TICKET_STATUS, TICKET_STATUS_OPTIONS } from "../../utils/constants";

const PersonnelDashboardPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [ticketsData, chartsData] = await Promise.all([
          getMyTickets(),
          getDashboardChartsReport(),
        ]);
        setTickets(ticketsData.tickets);
        setMonthly(chartsData.monthly);
        setCategories(chartsData.categories);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => [TICKET_STATUS.YENI, TICKET_STATUS.ATANDI].includes(t.status)).length,
      inProgress: tickets.filter((t) => t.status === TICKET_STATUS.ISLEMDE).length,
      solved: tickets.filter((t) => t.status === TICKET_STATUS.COZULDU).length,
    }),
    [tickets]
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(TICKET_STATUS_OPTIONS.map((status) => [status, 0]));
    tickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) counts[ticket.status] += 1;
    });
    return counts;
  }, [tickets]);

  const handleStatusSliceClick = (status) => {
    navigate(`/personel/taleplerim?status=${status}`);
  };

  const handleCategorySliceClick = (categoryId) => {
    navigate(`/personel/taleplerim?categoryId=${categoryId}`);
  };

  const recentTickets = tickets.slice(0, 5);

  if (isLoading) return <Loader label="Talepler yükleniyor..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Ana Sayfa</h1>
          <p className="text-sm text-slate-500">Destek taleplerinizin durumunu buradan takip edebilirsiniz.</p>
        </div>
        <Link to="/personel/yeni-talep">
          <Button>
            <Plus className="h-4 w-4" /> Yeni Talep Oluştur
          </Button>
        </Link>
      </div>

      <DashboardSearch resultPath="/personel/taleplerim" />

      <ErrorAlert message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Taleplerim" value={counts.total} icon={ClipboardList} color="blue" />
        <StatCard label="Bekleyen" value={counts.pending} icon={Clock} color="violet" />
        <StatCard label="İşlemde" value={counts.inProgress} icon={Wrench} color="amber" />
        <StatCard label="Tamamlanan" value={counts.solved} icon={CheckCircle2} color="emerald" />
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

      <div className="rounded-xl2 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Taleplerim</p>
          <Link to="/personel/taleplerim" className="text-sm font-medium text-navy-700 hover:underline">
            Tümünü Gör
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <EmptyState
            title="Henüz talep oluşturmadınız"
            description="Yeni bir destek talebi oluşturmak için yukarıdaki butonu kullanabilirsiniz."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Talep No</th>
                  <th className="pb-2 pr-4">Başlık</th>
                  <th className="pb-2 pr-4">Öncelik</th>
                  <th className="pb-2 pr-4">Durum</th>
                  <th className="pb-2 pr-4">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4">
                      <Link
                        to={`/personel/talepler/${ticket.id}`}
                        className="font-medium text-navy-700 hover:underline"
                      >
                        #{ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{ticket.title}</td>
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

export default PersonnelDashboardPage;
