import { useEffect, useState } from "react";

// Talep listesi arama kutuları için ortak debounce hook'u: kullanıcı her
// harfte değil, yazmayı ~delay ms kestiğinde backend'e istek atılır.
// Input'un kendisi (value) anında güncellenir; yalnızca dönen değer gecikmelidir.
const useDebouncedValue = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;
