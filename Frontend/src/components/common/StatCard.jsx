const COLOR_MAP = {
  blue: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

const StatCard = ({ label, value, icon: Icon, color = "blue" }) => (
  <div className="flex items-center gap-4 rounded-xl2 bg-white p-5 shadow-card">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
      {Icon && <Icon className="h-6 w-6" />}
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export default StatCard;
