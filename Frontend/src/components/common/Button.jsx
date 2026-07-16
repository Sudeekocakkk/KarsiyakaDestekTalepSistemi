const VARIANT_MAP = {
  primary: "bg-navy-900 text-white hover:bg-navy-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const Button = ({
  children,
  variant = "primary",
  className = "",
  isLoading = false,
  disabled,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
      VARIANT_MAP[variant] || VARIANT_MAP.primary
    } ${className}`}
    {...rest}
  >
    {isLoading ? "Kaydediliyor..." : children}
  </button>
);

export default Button;
