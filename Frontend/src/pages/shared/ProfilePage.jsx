import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { ROLE_LABELS } from "../../utils/constants";
import { formatDateTime } from "../../utils/formatters";

// Backendde kendi profilini güncelleyen bir endpoint (ör. PATCH /users/me) bulunmuyor,
// bu yüzden bu sayfa GET /api/auth/me verisini salt okunur şekilde gösterir.
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="rounded-xl2 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-xl font-semibold text-white">
            {initials || "?"}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ProfileRow icon={Mail} label="E-posta" value={user?.email} />
          <ProfileRow icon={Phone} label="Telefon" value={user?.phone || "-"} />
          <ProfileRow icon={Building2} label="Müdürlük" value={user?.department?.name || "Atanmadı"} />
          <ProfileRow icon={ShieldCheck} label="Hesap Durumu" value={user?.isActive ? "Aktif" : "Pasif"} />
          <ProfileRow label="Kayıt Tarihi" value={formatDateTime(user?.createdAt)} />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Not: Profil bilgilerinizi değiştirmek için backendde bir self-servis endpoint
        bulunmuyor; değişiklik gerekiyorsa yöneticinizle iletişime geçin.
      </p>
    </div>
  );
};

const ProfileRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
    {Icon && (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
    )}
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
