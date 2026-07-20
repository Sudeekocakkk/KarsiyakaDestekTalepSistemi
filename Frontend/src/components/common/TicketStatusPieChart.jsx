import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import EmptyState from "./EmptyState";
import {
  TICKET_STATUS_CHART_COLORS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_OPTIONS,
} from "../../utils/constants";

const renderSliceLabel = ({ name, percent }) => `${name} %${Math.round(percent * 100)}`;

// statusCounts: { YENI, ATANDI, ISLEMDE, BEKLEMEDE, COZULDU, IPTAL_EDILDI } şeklinde sayı eşlemesi.
// onSliceClick(status): bir dilime veya alt tıklanabilir duruma tıklanınca çağrılır.
const TicketStatusPieChart = ({ statusCounts, onSliceClick }) => {
  const data = useMemo(
    () =>
      TICKET_STATUS_OPTIONS.map((status) => ({
        status,
        name: TICKET_STATUS_LABELS[status],
        value: statusCounts?.[status] ?? 0,
      })).filter((entry) => entry.value > 0),
    [statusCounts]
  );

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  if (total === 0) {
    return <EmptyState title="Gösterilecek talep verisi yok" />;
  }

  const handleSliceClick = (entry) => {
    const status = entry?.status ?? entry?.payload?.status;
    if (status) onSliceClick?.(status);
  };

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderSliceLabel}
            onClick={onSliceClick ? handleSliceClick : undefined}
            style={onSliceClick ? { cursor: "pointer" } : undefined}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={TICKET_STATUS_CHART_COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [
              `${value} talep (%${Math.round((props?.payload?.percent ?? 0) * 100)})`,
              name,
            ]}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>

      {onSliceClick && (
        <div className="flex flex-wrap justify-center gap-2">
          {data.map((entry) => (
            <button
              key={entry.status}
              type="button"
              onClick={() => onSliceClick(entry.status)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {entry.name} · {entry.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketStatusPieChart;
