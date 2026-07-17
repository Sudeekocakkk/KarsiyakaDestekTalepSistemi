import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Loader from "../components/common/Loader";

// Giriş yapılmamışsa /login'e yönlendirir. `roles` verilirse ek olarak
// rol bazlı yetki kontrolü yapar (kullanıcı yetkili değilse 403 sayfasına yönlendirir).
const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Loader label="Oturum kontrol ediliyor..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.mustChangePassword && location.pathname !== "/sifre-degistir") {
    return <Navigate to="/sifre-degistir" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/yetkisiz" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
