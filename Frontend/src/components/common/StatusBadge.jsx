import { TICKET_STATUS_LABELS, TICKET_STATUS_STYLES } from "../../utils/constants";

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
      TICKET_STATUS_STYLES[status] || "bg-slate-100 text-slate-600"
    }`}
  >
    {TICKET_STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
