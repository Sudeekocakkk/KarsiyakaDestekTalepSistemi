import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "./FormField";

const normalize = (value) => value.toString().toLocaleLowerCase("tr-TR");

// Yazarak filtrelenebilen, scrollbar'la gezilebilen açılır seçim alanı.
// Normal bir <select>'in yerine geçer; `options` = [{ value, label }].
// `value` null/"" olabilir (ör. "Fark Etmez" seçeneği) — value karşılaştırması
// referans eşitliğiyle değil String() ile yapılır ki hem sayısal id'ler hem
// de boş string/null seçenekler doğru eşleşsin.
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Seçin veya yazarak arayın...",
  emptyMessage = "Sonuç bulunamadı",
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return options;
    return options.filter((option) => normalize(option.label).includes(normalize(normalizedQuery)));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          className={`${inputClass} pr-8`}
          placeholder={placeholder}
          disabled={disabled}
          value={isOpen ? query : selectedOption?.label || ""}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value === null || option.value === "" ? `empty-${option.label}` : option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    String(option.value) === String(value)
                      ? "bg-sky-50 font-medium text-navy-700"
                      : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchableSelect;
