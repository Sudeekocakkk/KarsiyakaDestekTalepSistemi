import { Landmark } from "lucide-react";

const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
          <Landmark className="h-8 w-8 text-white" />
        </div>
        <p className="text-lg font-bold tracking-wide text-white">KARŞIYAKA BELEDİYESİ</p>
        <p className="text-sm text-slate-400">Destek Talep Sistemi</p>
      </div>

      <div className="rounded-xl2 bg-white p-6 shadow-xl sm:p-8">
        <h1 className="mb-1 text-xl font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="mb-5 text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>

      {footer && <div className="mt-4 text-center text-sm text-slate-400">{footer}</div>}
    </div>
  </div>
);

export default AuthShell;
