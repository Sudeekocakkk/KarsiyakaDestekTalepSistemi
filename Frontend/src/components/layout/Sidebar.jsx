import { NavLink } from "react-router-dom";
import { Landmark } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";
import { ROLE_LABELS } from "../../utils/constants";

const Sidebar = ({ role, isOpen, onClose }) => {
  const items = NAV_ITEMS[role] || [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-navy-950 text-slate-200 transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-white">KARŞIYAKA</p>
            <p className="text-xs tracking-wide text-slate-400">BELEDİYESİ</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-navy-800 text-white"
                    : "text-slate-300 hover:bg-navy-900 hover:text-white"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-navy-800 px-4 py-4 text-xs text-slate-500">
          {ROLE_LABELS[role]} Paneli
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
