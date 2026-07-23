import EmptyState from "./EmptyState";

// departments: [{ departmentId, departmentName, ticketCount }] — backend
// zaten talep sayısına göre azalan sıralı, en fazla 5 kayıt ve talebi olmayan
// müdürlükler hariç döner (bkz. GET /reports/departments/top, yalnızca ADMIN).
// En yüksek talep sayısı %100 kabul edilip diğer çubuklar buna oranlanır.
const TopDepartmentsCard = ({ departments, onRowClick }) => {
  if (!departments || departments.length === 0) {
    return <EmptyState title="Henüz müdürlük bazlı talep verisi bulunmuyor." />;
  }

  const maxCount = departments[0].ticketCount || 1;

  return (
    <ul className="space-y-3">
      {departments.map((department) => {
        const percent = Math.round((department.ticketCount / maxCount) * 100);

        return (
          <li key={department.departmentId}>
            <button
              type="button"
              onClick={() => onRowClick?.(department.departmentId)}
              className="w-full rounded-lg px-1.5 py-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-700">{department.departmentName}</span>
                <span className="text-slate-500">{department.ticketCount}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-navy-700" style={{ width: `${percent}%` }} />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default TopDepartmentsCard;
