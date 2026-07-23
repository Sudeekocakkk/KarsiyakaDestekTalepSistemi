import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import EmptyState from "./EmptyState";

const TOP_N = 5;
// Son renk "Diğer" grubu için ayrılmıştır.
const COLORS = ["#1c3566", "#7c3aed", "#0284c7", "#059669", "#d97706", "#94a3b8"];

// categories: [{ categoryId, categoryName, count }, ...] — backend zaten
// sıfır sayılı kategorileri filtreleyip count'a göre sıralı döndürür
// (bkz. /reports/dashboard). Burada yalnızca "ilk 5 + Diğer" gruplaması
// (sunum katmanına özgü bir karar) yapılır.
const CategoryDistributionChart = ({ categories, onSliceClick }) => {
  const { data, total } = useMemo(() => {
    const source = (categories || []).filter((c) => c.count > 0);
    const top = source.slice(0, TOP_N);
    const rest = source.slice(TOP_N);
    const otherCount = rest.reduce((sum, c) => sum + c.count, 0);

    const result = top.map((c) => ({
      categoryId: c.categoryId,
      name: c.categoryName,
      value: c.count,
    }));

    if (otherCount > 0) {
      result.push({ categoryId: null, name: "Diğer", value: otherCount });
    }

    return {
      data: result,
      total: result.reduce((sum, c) => sum + c.value, 0),
    };
  }, [categories]);

  if (data.length === 0) {
    return <EmptyState title="Gösterilecek kategori verisi yok" />;
  }

  const handleSliceClick = (entry) => {
    const categoryId = entry?.categoryId ?? entry?.payload?.categoryId;
    if (categoryId) onSliceClick?.(categoryId);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto w-full max-w-[220px] sm:mx-0 sm:max-w-none sm:flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              onClick={onSliceClick ? handleSliceClick : undefined}
              style={onSliceClick ? { cursor: "pointer" } : undefined}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value} talep (%${Math.round((props?.payload?.percent ?? 0) * 100)})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {entry.name}
            </span>
            <span className="shrink-0 font-medium text-slate-700">
              {entry.value} · %{total > 0 ? Math.round((entry.value / total) * 100) : 0}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryDistributionChart;
