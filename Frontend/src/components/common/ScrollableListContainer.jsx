import { useLayoutEffect, useRef, useState } from "react";

const VISIBLE_ROWS = 7;

// Herhangi bir <table> tabanlı listeyi sarar. rowCount, VISIBLE_ROWS'u
// (7) geçmiyorsa max-height uygulanmaz — liste doğal yüksekliğinde kalır,
// gereksiz kaydırma alanı oluşmaz. Geçtiğinde, gerçek başlık (<thead>) ve
// satır (<tbody> ilk <tr>) yüksekliği DOM'dan ölçülüp tam olarak ilk 7
// satır görünecek şekilde max-height hesaplanır — sayfaya göre değişen
// satır yapıları için sabit bir piksel tahmini kullanılmaz. rowCount
// değiştiğinde (örn. arama sonucu daralınca) davranış yeniden değerlendirilir.
// overflow-x-auto her zaman açık kalır (mobilde geniş tablolar için).
const ScrollableListContainer = ({ rowCount, children, className = "" }) => {
  const containerRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const tbody = container?.querySelector("tbody");

    if (!container || !tbody) {
      setMaxHeight(null);
      return undefined;
    }

    const measure = () => {
      if (rowCount <= VISIBLE_ROWS) {
        setMaxHeight(null);
        return;
      }

      const header = container.querySelector("thead");
      const firstRow = tbody.querySelector("tr");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const rowHeight = firstRow?.getBoundingClientRect().height ?? 0;

      setMaxHeight(rowHeight > 0 ? headerHeight + rowHeight * VISIBLE_ROWS : null);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(tbody);

    return () => resizeObserver.disconnect();
  }, [rowCount, children]);

  const isScrollable = rowCount > VISIBLE_ROWS && Boolean(maxHeight);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto ${isScrollable ? "overflow-y-auto" : ""} ${className}`}
      style={isScrollable ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
};

export default ScrollableListContainer;
