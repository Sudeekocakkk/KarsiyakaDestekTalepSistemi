import { Inbox } from "lucide-react";

const EmptyState = ({ title = "Kayıt bulunamadı", description, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-slate-300 bg-white py-14 text-center">
    <Icon className="h-8 w-8 text-slate-300" />
    <p className="font-medium text-slate-600">{title}</p>
    {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
  </div>
);

export default EmptyState;
