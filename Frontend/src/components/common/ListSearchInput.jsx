import { Search } from "lucide-react";
import { inputClass } from "./FormField";

// Liste/tablo sayfalarının üstünde kullanılan ortak arama kutusu. Kontrollü
// bileşendir; sayfa kendi search state'ini tutar, burada sadece görsel ve
// input davranışı standardize edilir.
const ListSearchInput = ({ value, onChange, placeholder, className = "" }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      className={`${inputClass} pl-9`}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export default ListSearchInput;
