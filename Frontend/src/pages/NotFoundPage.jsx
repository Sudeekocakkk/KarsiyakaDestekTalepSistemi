import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-center">
    <p className="text-5xl font-bold text-navy-900">404</p>
    <p className="text-slate-600">Aradığınız sayfa bulunamadı.</p>
    <Link to="/" className="text-sm font-medium text-navy-700 hover:underline">
      Ana sayfaya dön
    </Link>
  </div>
);

export default NotFoundPage;
