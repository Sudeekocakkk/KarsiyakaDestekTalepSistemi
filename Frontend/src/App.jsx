import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useAuth } from "./context/useAuth";
import { ROLES } from "./utils/constants";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import SetupAdminPage from "./pages/auth/SetupAdminPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import TicketManagementPage from "./pages/admin/TicketManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import DepartmentManagementPage from "./pages/admin/DepartmentManagementPage";
import SpecializationManagementPage from "./pages/admin/SpecializationManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";

import TechnicianDashboardPage from "./pages/technician/TechnicianDashboardPage";
import AssignedTicketsPage from "./pages/technician/AssignedTicketsPage";

import PersonnelDashboardPage from "./pages/personnel/PersonnelDashboardPage";
import MyTicketsPage from "./pages/personnel/MyTicketsPage";
import CreateTicketPage from "./pages/personnel/CreateTicketPage";

import TicketDetailPage from "./pages/shared/TicketDetailPage";
import ProfilePage from "./pages/shared/ProfilePage";
import UpdateProfilePage from "./pages/shared/UpdateProfilePage";
import ChangePasswordPage from "./pages/shared/ChangePasswordPage";

import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Loader from "./components/common/Loader";

const roleHomePath = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.TEKNIK_PERSONEL]: "/teknik",
  [ROLES.PERSONEL]: "/personel",
};

const RootRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Loader label="Yükleniyor..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomePath[user.role] || "/login"} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kayit" element={<RegisterPage />} />
        <Route path="/ilk-kurulum" element={<SetupAdminPage />} />
      </Route>

      <Route path="/yetkisiz" element={<UnauthorizedPage />} />

      {/* Ortak: Profil ve şifre değiştirme (tüm roller) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/profil-duzenle" element={<UpdateProfilePage />} />
          <Route path="/sifre-degistir" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/talepler" element={<TicketManagementPage />} />
          <Route path="/admin/talepler/:id" element={<TicketDetailPage />} />
          <Route path="/admin/kullanicilar" element={<UserManagementPage />} />
          <Route path="/admin/mudurlukler" element={<DepartmentManagementPage />} />
          <Route path="/admin/uzmanliklar" element={<SpecializationManagementPage />} />
          <Route path="/admin/kategoriler" element={<CategoryManagementPage />} />
          <Route path="/admin/raporlar" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Teknik Personel */}
      <Route element={<ProtectedRoute roles={[ROLES.TEKNIK_PERSONEL]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/teknik" element={<TechnicianDashboardPage />} />
          <Route path="/teknik/talepler" element={<AssignedTicketsPage />} />
          <Route path="/teknik/talepler/:id" element={<TicketDetailPage />} />
        </Route>
      </Route>

      {/* Personel (Normal Kullanıcı) */}
      <Route element={<ProtectedRoute roles={[ROLES.PERSONEL]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/personel" element={<PersonnelDashboardPage />} />
          <Route path="/personel/yeni-talep" element={<CreateTicketPage />} />
          <Route path="/personel/taleplerim" element={<MyTicketsPage />} />
          <Route path="/personel/talepler/:id" element={<TicketDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
