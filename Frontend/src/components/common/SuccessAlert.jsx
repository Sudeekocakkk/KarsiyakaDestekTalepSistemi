import { CheckCircle2 } from "lucide-react";

const SuccessAlert = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default SuccessAlert;
