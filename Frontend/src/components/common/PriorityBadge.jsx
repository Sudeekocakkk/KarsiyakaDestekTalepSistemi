import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_STYLES } from "../../utils/constants";

const PriorityBadge = ({ priority }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
      TICKET_PRIORITY_STYLES[priority] || "bg-slate-100 text-slate-600"
    }`}
  >
    {TICKET_PRIORITY_LABELS[priority] || priority}
  </span>
);

export default PriorityBadge;
