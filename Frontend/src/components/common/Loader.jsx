import { Loader2 } from "lucide-react";

const Loader = ({ label = "Yükleniyor..." }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    <span className="text-sm">{label}</span>
  </div>
);

export default Loader;
