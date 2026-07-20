import { useEffect, useMemo, useState } from "react";
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
import ScrollableListContainer from "../../components/common/ScrollableListContainer";
import ListSearchInput from "../../components/common/ListSearchInput";
import { matchesSearch } from "../../utils/search";
import { ClipboardList, CheckCircle2, Wrench, XCircle } from "lucide-react";

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [categoryReport, setCategoryReport] = useState([]);
  const [departmentReport, setDepartmentReport] = useState([]);
  const [personnelReport, setPersonnelReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [categorySearch, setCategorySearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [personnelSearch, setPersonnelSearch] = useState("");

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

  const filteredCategoryReport = useMemo(
    () =>
      categoryReport.filter((item) =>
        matchesSearch(categorySearch, [item.categoryName, item.isActive ? "Aktif" : "Pasif"])
      ),
    [categoryReport, categorySearch]
  );

  const filteredDepartmentReport = useMemo(
    () => departmentReport.filter((item) => matchesSearch(departmentSearch, [item.departmentName])),
    [departmentReport, departmentSearch]
  );

  const filteredPersonnelReport = useMemo(
    () => personnelReport.filter((item) => matchesSearch(personnelSearch, [item.name, item.email])),
    [personnelReport, personnelSearch]
  );

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

      <ReportSection
        title="Kategori Bazlı Rapor"
        hasData={categoryReport.length > 0}
        searchValue={categorySearch}
        onSearchChange={setCategorySearch}
        searchPlaceholder="Kategori ara..."
      >
        {categoryReport.length === 0 ? (
          <EmptyState title="Kategori raporu yok" />
        ) : filteredCategoryReport.length === 0 ? (
          <EmptyState title="Aramanızla eşleşen kayıt bulunamadı." />
        ) : (
          <ReportTable
            columns={["Kategori", "Durum", "Talep Sayısı"]}
            rows={filteredCategoryReport.map((item) => [
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
        hasData={departmentReport.length > 0}
        searchValue={departmentSearch}
        onSearchChange={setDepartmentSearch}
        searchPlaceholder="Müdürlük ara..."
      >
        {departmentReport.length === 0 ? (
          <EmptyState title="Müdürlük raporu yok" />
        ) : filteredDepartmentReport.length === 0 ? (
          <EmptyState title="Aramanızla eşleşen kayıt bulunamadı." />
        ) : (
          <ReportTable
            columns={["Müdürlük", "Personel Sayısı", "Toplam Talep", "Çözülen", "Bekleyen"]}
            rows={filteredDepartmentReport.map((item) => [
              item.departmentName,
              item.userCount,
              item.totalTickets,
              item.solvedTickets,
              item.waitingTickets,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection
        title="Teknik Personel Performansı"
        hasData={personnelReport.length > 0}
        searchValue={personnelSearch}
        onSearchChange={setPersonnelSearch}
        searchPlaceholder="Personel ara..."
      >
        {personnelReport.length === 0 ? (
          <EmptyState title="Personel performans verisi yok" />
        ) : filteredPersonnelReport.length === 0 ? (
          <EmptyState title="Aramanızla eşleşen kayıt bulunamadı." />
        ) : (
          <ReportTable
            columns={["Personel", "Toplam Atanan", "Çözülen", "İşlemde", "İptal", "Ort. Çözüm Süresi (saat)"]}
            rows={filteredPersonnelReport.map((item) => [
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

const ReportSection = ({
  title,
  note,
  children,
  hasData,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}) => (
  <div className="rounded-xl2 bg-white p-5 shadow-card">
    <p className="mb-1 text-sm font-semibold text-slate-700">{title}</p>
    {note && <p className="mb-3 text-xs text-slate-400">{note}</p>}
    {hasData && (
      <ListSearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="mb-4 max-w-sm"
      />
    )}
    {children}
  </div>
);

const ReportTable = ({ columns, rows }) => (
  <ScrollableListContainer rowCount={rows.length}>
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          {columns.map((col) => (
            <th key={col} className="sticky top-0 z-10 bg-white pb-2 pr-4">
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
  </ScrollableListContainer>
);

export default ReportsPage;
