const FormField = ({ label, htmlFor, error, required, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-rose-600">{error}</p>}
  </div>
);

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10 disabled:bg-slate-50 disabled:text-slate-400";

export default FormField;
