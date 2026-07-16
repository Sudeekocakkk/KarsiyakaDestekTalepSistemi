import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Building2,
  GraduationCap,
  FolderKanban,
  BarChart3,
  UserCircle,
  ListChecks,
} from "lucide-react";
import { ROLES } from "../../utils/constants";

// Rol bazlı yan menü tanımları. Her rota App.jsx içindeki gerçek path'lerle eşleşir.
export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/talepler", label: "Talepler", icon: ClipboardList },
    { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
    { to: "/admin/mudurlukler", label: "Müdürlükler", icon: Building2 },
    { to: "/admin/uzmanliklar", label: "Uzmanlık Alanları", icon: GraduationCap },
    { to: "/admin/kategoriler", label: "Kategoriler", icon: FolderKanban },
    { to: "/admin/raporlar", label: "Raporlar", icon: BarChart3 },
    { to: "/profil", label: "Profil", icon: UserCircle },
  ],
  [ROLES.TEKNIK_PERSONEL]: [
    { to: "/teknik", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/teknik/talepler", label: "Bana Atanan Talepler", icon: ListChecks },
    { to: "/profil", label: "Profil", icon: UserCircle },
  ],
  [ROLES.PERSONEL]: [
    { to: "/personel", label: "Ana Sayfa", icon: LayoutDashboard, end: true },
    { to: "/personel/yeni-talep", label: "Yeni Talep", icon: PlusCircle },
    { to: "/personel/taleplerim", label: "Taleplerim", icon: ClipboardList },
    { to: "/profil", label: "Profil", icon: UserCircle },
  ],
};
