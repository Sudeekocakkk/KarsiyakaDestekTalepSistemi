import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SHOW_DELAY = 600;
const VIEWPORT_MARGIN = 8;
const ESTIMATED_WIDTH = 160;

// Ortak, yeniden kullanılabilir tooltip: tetikleyici öğeyi (genelde ikon
// butonu) sarar; hover/focus'ta ~600ms sonra gösterir, mouseleave/blur'da
// hemen gizler. document.body'ye portal edilir ki tablo/kart gibi
// overflow: auto/hidden konteynerlerin içinde kırpılmasın veya kalan
// içeriğin altında kalmasın.
const Tooltip = ({ content, children, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "top" });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!isValidElement(children)) return children;

  const computePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const placement = rect.top > 48 ? "top" : "bottom";
    const gap = 8;

    let left = rect.left + rect.width / 2;
    left = Math.min(
      Math.max(left, ESTIMATED_WIDTH / 2 + VIEWPORT_MARGIN),
      window.innerWidth - ESTIMATED_WIDTH / 2 - VIEWPORT_MARGIN
    );

    const top = placement === "top" ? rect.top - gap : rect.bottom + gap;

    setCoords({ top, left, placement });
  };

  const show = () => {
    if (disabled || !content) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      computePosition();
      setIsVisible(true);
    }, SHOW_DELAY);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event);
      show();
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      hide();
    },
    onFocus: (event) => {
      children.props.onFocus?.(event);
      show();
    },
    onBlur: (event) => {
      children.props.onBlur?.(event);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: `translate(-50%, ${coords.placement === "top" ? "-100%" : "0"})`,
            }}
            className="pointer-events-none z-[100] max-w-[200px] whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
