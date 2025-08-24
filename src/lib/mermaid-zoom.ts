export function attachMermaidZoom(
  placeholder: HTMLElement,
  wrapper: HTMLElement,
  svgContainer: HTMLElement
) {
  wrapper.style.overflow = "auto";
  wrapper.style.touchAction = "none"; // prevent touch zoom interfering
  svgContainer.style.transformOrigin = "0 0";

  const getScale = () => {
    const raw = placeholder.dataset.zoomScale;
    const parsed = raw ? parseFloat(raw) : 1;
    return isNaN(parsed) ? 1 : parsed;
  };

  const applyScale = (scale: number) => {
    const clamped = Math.min(4, Math.max(0.25, scale));
    placeholder.dataset.zoomScale = String(clamped);
    svgContainer.style.transform = `scale(${clamped})`;
    // Set min width/height so container scrollbars appear properly
    const bbox = svgContainer.querySelector('svg') as SVGElement | null;
    if (bbox) {
      const w = (bbox.getAttribute('width') || '0').replace('px','');
      const h = (bbox.getAttribute('height') || '0').replace('px','');
      const width = parseFloat(w) || bbox.clientWidth || 0;
      const height = parseFloat(h) || bbox.clientHeight || 0;
      // wrapper should allow scrolling of the scaled diagram
      (wrapper.style as any).setProperty('--_mw', `${width * clamped}px`);
      (wrapper.style as any).setProperty('--_mh', `${height * clamped}px`);
      svgContainer.style.minWidth = `calc(var(--_mw))`;
      svgContainer.style.minHeight = `calc(var(--_mh))`;
      svgContainer.style.willChange = 'transform';
      svgContainer.style.display = 'inline-block';
    }
  };

  // Initialize scale from dataset
  applyScale(getScale());

  const onWheel = (e: WheelEvent) => {
    // Zoom on wheel over diagram
    if (!e.ctrlKey && !e.metaKey) {
      // Prevent page scroll while zooming
      e.preventDefault();
    }
    const delta = e.deltaY;
    const current = getScale();
    const factor = e.ctrlKey || e.metaKey ? 0.0025 : 0.0015;
    const next = current * (1 - delta * factor);
    applyScale(next);
  };

  const onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    applyScale(1);
  };

  wrapper.addEventListener('wheel', onWheel, { passive: false });
  wrapper.addEventListener('dblclick', onDblClick);

  // Return cleanup to be called by caller if needed
  return () => {
    wrapper.removeEventListener('wheel', onWheel as any);
    wrapper.removeEventListener('dblclick', onDblClick as any);
  };
}

