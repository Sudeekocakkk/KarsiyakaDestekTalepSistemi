import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const UnauthorizedPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-center">
    <ShieldAlert className="h-10 w-10 text-rose-500" />
    <p className="text-lg font-semibold text-slate-700">Bu sayfayı görüntüleme yetkiniz yok.</p>
    <Link to="/" className="text-sm font-medium text-navy-700 hover:underline">
      Ana sayfaya dön
    </Link>
  </div>
);

export default UnauthorizedPage;
