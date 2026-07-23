import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { ROLE_LABELS } from "../../utils/constants";
import NotificationBell from "../common/NotificationBell";

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm text-slate-500">
            Hoş geldiniz, <span className="font-semibold text-slate-800">{user?.name}</span>
          </p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role]}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          type="button"
          onClick={() => navigate("/profil")}
          title="Profilim"
          aria-label="Profilime git"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/40 focus:ring-offset-2"
        >
          {initials || "?"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
