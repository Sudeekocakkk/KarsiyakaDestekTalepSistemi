import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import Tooltip from "./Tooltip";
import { inputClass } from "./FormField";

// ADMIN/TEKNIK_PERSONEL/PERSONEL dashboardlarının üstünde ortak kullanılan
// arama kutusu. Kendisi hiçbir API çağrısı yapmaz ve her tuş vuruşunda istek
// göndermez: yalnızca Enter'a basılınca veya arama ikonuna tıklanınca,
// resultPath'e (çağıran dashboard, kendi rolüne göre doğru talep listesi
// sayfasını verir) ?search=... ekleyerek yönlendirir. Gerçek arama o
// sayfada, backend'e karşı debounce'lu olarak çalışır.
const DashboardSearch = ({ resultPath }) => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const term = value.trim();
    if (!term) return;
    navigate(`${resultPath}?search=${encodeURIComponent(term)}`);
  };

  const handleClear = () => setValue("");

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full max-w-md">
      <label htmlFor="dashboard-search" className="sr-only">
        Talep ara
      </label>

      <Tooltip content="Ara">
        <button
          type="submit"
          aria-label="Ara"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-navy-700"
        >
          <Search className="h-4 w-4" />
        </button>
      </Tooltip>

      <input
        id="dashboard-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Talep ara..."
        aria-label="Talep ara"
        className={`${inputClass} pl-9 ${value ? "pr-9" : ""}`}
      />

      {value && (
        <Tooltip content="Temizle">
          <button
            type="button"
            onClick={handleClear}
            aria-label="Aramayı temizle"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </form>
  );
};

export default DashboardSearch;
