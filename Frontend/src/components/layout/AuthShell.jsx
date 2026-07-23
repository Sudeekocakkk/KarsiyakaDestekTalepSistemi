import logo from "../../assets/logoV2.svg";

const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <img
          src={logo}
          alt="Karşıyaka Belediyesi logosu"
          className="h-20 w-20 object-contain"
        />
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
