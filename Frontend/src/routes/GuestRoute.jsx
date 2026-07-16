import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ROLES } from "../utils/constants";
import Loader from "../components/common/Loader";

const roleHomePath = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.TEKNIK_PERSONEL]: "/teknik",
  [ROLES.PERSONEL]: "/personel",
};

// Zaten oturum açmış kullanıcıyı /login, /kayit, /ilk-kurulum gibi
// yalnızca ziyaretçilere özel sayfalardan kendi paneline yönlendirir.
const GuestRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Loader label="Yükleniyor..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={roleHomePath[user.role] || "/"} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
