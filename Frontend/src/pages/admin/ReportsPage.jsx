import { useEffect, useState } from "react";
import {
  getCategoryReport,
  getDepartmentReport,
  getPersonnelPerformanceReport,
  getTicketSummaryReport,
} from "../../api/report.api";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import StatCard from "../../components/common/StatCard";
import { ClipboardList, CheckCircle2, Wrench, XCircle } from "lucide-react";

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [categoryReport, setCategoryReport] = useState([]);
  const [departmentReport, setDepartmentReport] = useState([]);
  const [personnelReport, setPersonnelReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [summaryData, categoryData, departmentData, personnelData] = await Promise.all([
          getTicketSummaryReport(),
          getCategoryReport(),
          getDepartmentReport(),
          getPersonnelPerformanceReport(),
        ]);
        setSummary(summaryData.summary);
        setCategoryReport(categoryData.report);
        setDepartmentReport(departmentData.report);
        setPersonnelReport(personnelData.report);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <Loader label="Raporlar yükleniyor..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Raporlar</h1>
        <p className="text-sm text-slate-500">Talep, kategori, müdürlük ve personel performans raporları.</p>
      </div>

      <ErrorAlert message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Talep" value={summary?.totalTickets ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Çözülen" value={summary?.solvedTickets ?? 0} icon={CheckCircle2} color="emerald" />
        <StatCard label="İşlemde" value={summary?.inProgressTickets ?? 0} icon={Wrench} color="amber" />
        <StatCard label="İptal Edilen" value={summary?.cancelledTickets ?? 0} icon={XCircle} color="rose" />
      </div>

      <ReportSection title="Kategori Bazlı Rapor">
        {categoryReport.length === 0 ? (
          <EmptyState title="Kategori raporu yok" />
        ) : (
          <ReportTable
            columns={["Kategori", "Durum", "Talep Sayısı"]}
            rows={categoryReport.map((item) => [
              item.categoryName,
              item.isActive ? "Aktif" : "Pasif",
              item.ticketCount,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection
        title="Müdürlük Bazlı Rapor"
        note="Not: Backend'deki waitingTickets alanı, şemada bulunmayan bir durum değeriyle (BEKLIYOR) filtreleme yapıyor; bu nedenle her zaman 0 dönebilir."
      >
        {departmentReport.length === 0 ? (
          <EmptyState title="Müdürlük raporu yok" />
        ) : (
          <ReportTable
            columns={["Müdürlük", "Personel Sayısı", "Toplam Talep", "Çözülen", "Bekleyen"]}
            rows={departmentReport.map((item) => [
              item.departmentName,
              item.userCount,
              item.totalTickets,
              item.solvedTickets,
              item.waitingTickets,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="Teknik Personel Performansı">
        {personnelReport.length === 0 ? (
          <EmptyState title="Personel performans verisi yok" />
        ) : (
          <ReportTable
            columns={["Personel", "Toplam Atanan", "Çözülen", "İşlemde", "İptal", "Ort. Çözüm Süresi (saat)"]}
            rows={personnelReport.map((item) => [
              item.name,
              item.totalAssigned,
              item.solvedCount,
              item.inProgressCount,
              item.cancelledCount,
              item.averageSolutionHours ?? "-",
            ])}
          />
        )}
      </ReportSection>
    </div>
  );
};

const ReportSection = ({ title, note, children }) => (
  <div className="rounded-xl2 bg-white p-5 shadow-card">
    <p className="mb-1 text-sm font-semibold text-slate-700">{title}</p>
    {note && <p className="mb-3 text-xs text-slate-400">{note}</p>}
    {children}
  </div>
);

const ReportTable = ({ columns, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          {columns.map((col) => (
            <th key={col} className="pb-2 pr-4">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={index} className="border-b border-slate-50 last:border-0">
            {row.map((cell, cellIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <td key={cellIndex} className="py-2.5 pr-4 text-slate-600">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ReportsPage;
