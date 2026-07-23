import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "./EmptyState";

const SERIES = [
  { key: "total", name: "Toplam Talepler", color: "#1c3566" },
  { key: "completed", name: "Tamamlanan Talepler", color: "#059669" },
  { key: "pending", name: "Bekleyen Talepler", color: "#d97706" },
];

// data: [{ month: "2026-02", label: "Şub", total, completed, pending }, ...]
// (backend /reports/dashboard'dan gelir, son 6 ay kronolojik sırada,
// veri olmayan aylar 0 olarak dolu gelir — burada sabit/örnek veri yok).
const MonthlyTicketTrendChart = ({ data }) => {
  const hasData = useMemo(() => (data || []).some((month) => month.total > 0), [data]);

  if (!data || data.length === 0 || !hasData) {
    return <EmptyState title="Gösterilecek talep verisi yok" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
        <Tooltip formatter={(value, name) => [`${value} talep`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {SERIES.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.name}
            stroke={series.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyTicketTrendChart;
