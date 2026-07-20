import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, Building2, ShieldCheck, Wrench, Settings, UserCog, KeyRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { ROLES, ROLE_LABELS } from "../../utils/constants";
import { formatDateTime } from "../../utils/formatters";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-xl font-semibold text-white">
              {initials || "?"}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
              <p className="text-sm text-slate-500">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>

          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isSettingsOpen}
              aria-label="Ayarlar"
              title="Ayarlar"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>

            {isSettingsOpen && (
              <div
                role="menu"
                className="absolute right-0 z-10 mt-2 w-56 rounded-xl2 border border-slate-100 bg-white py-1.5 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    navigate("/profil-duzenle");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserCog className="h-4 w-4 text-slate-400" />
                  Kullanıcı Bilgilerimi Güncelle
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    navigate("/sifre-degistir");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  Şifremi Güncelle
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ProfileRow icon={Mail} label="E-posta" value={user?.email} />
          <ProfileRow icon={Phone} label="Telefon" value={user?.phone || "-"} />
          <ProfileRow icon={Building2} label="Müdürlük" value={user?.department?.name || "Atanmadı"} />
          {user?.role === ROLES.TEKNIK_PERSONEL && (
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Uzmanlık Alanları</p>
                {user?.specializations?.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {user.specializations.map((specialization) => (
                      <span
                        key={specialization.id}
                        className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700"
                      >
                        {specialization.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-700">Henüz uzmanlık alanı atanmadı.</p>
                )}
              </div>
            </div>
          )}
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
