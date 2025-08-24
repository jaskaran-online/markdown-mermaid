export function attachMermaidZoom(
  placeholder: HTMLElement,
  wrapper: HTMLElement,
  svgContainer: HTMLElement
) {
  wrapper.style.overflow = "auto";
  wrapper.style.touchAction = "none"; // prevent touch zoom interfering
  svgContainer.style.transformOrigin = "0 0";

  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  const getScale = () => {
    const raw = placeholder.dataset.zoomScale;
    const parsed = raw ? parseFloat(raw) : 1;
    return isNaN(parsed) ? 1 : parsed;
  };

  const applyScale = (scale: number) => {
    const clamped = Math.min(4, Math.max(0.25, scale));
    placeholder.dataset.zoomScale = String(clamped);
    svgContainer.style.transform = `scale(${clamped})`;
    updateZoomIndicator(clamped);

    const bbox = svgContainer.querySelector("svg") as SVGElement | null;
    if (bbox) {
      const w = (bbox.getAttribute("width") || "0").replace("px", "");
      const h = (bbox.getAttribute("height") || "0").replace("px", "");
      const width = parseFloat(w) || bbox.clientWidth || 0;
      const height = parseFloat(h) || bbox.clientHeight || 0;
      (wrapper.style as any).setProperty("--_mw", `${width * clamped}px`);
      (wrapper.style as any).setProperty("--_mh", `${height * clamped}px`);
      svgContainer.style.minWidth = `calc(var(--_mw))`;
      svgContainer.style.minHeight = `calc(var(--_mh))`;
      svgContainer.style.willChange = "transform";
      svgContainer.style.display = "inline-block";
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
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

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    isPanning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    wrapper.style.cursor = "grabbing";
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    wrapper.scrollLeft -= dx;
    wrapper.scrollTop -= dy;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  };

  const onMouseUp = (e: MouseEvent) => {
    isPanning = false;
    wrapper.style.cursor = "grab";
    e.preventDefault();
  };

  const createControls = () => {
    const controls = document.createElement("div");
    controls.className = "mermaid-zoom-controls";

    const zoomInBtn = document.createElement("button");
    zoomInBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    zoomInBtn.onclick = () => applyScale(getScale() * 1.2);

    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    zoomOutBtn.onclick = () => applyScale(getScale() / 1.2);

    const resetBtn = document.createElement("button");
    resetBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>`;
    resetBtn.onclick = () => applyScale(1);

    const zoomIndicator = document.createElement("div");
    zoomIndicator.className = "zoom-indicator";

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(zoomIndicator);

    wrapper.style.position = "relative";
    wrapper.appendChild(controls);
    return zoomIndicator;
  };

  const updateZoomIndicator = (scale: number) => {
    const indicator = wrapper.querySelector(".zoom-indicator") as HTMLElement;
    if (indicator) {
      indicator.innerText = `${Math.round(scale * 100)}%`;
    }
  };

  const zoomIndicator = createControls();
  applyScale(getScale());

  wrapper.addEventListener("wheel", onWheel, { passive: false });
  wrapper.addEventListener("dblclick", onDblClick);
  wrapper.addEventListener("mousedown", onMouseDown);
  wrapper.addEventListener("mousemove", onMouseMove);
  wrapper.addEventListener("mouseup", onMouseUp);
  wrapper.addEventListener("mouseleave", onMouseUp); // Stop panning if mouse leaves
  wrapper.style.cursor = "grab";

  return () => {
    wrapper.removeEventListener("wheel", onWheel as any);
    wrapper.removeEventListener("dblclick", onDblClick as any);
    wrapper.removeEventListener("mousedown", onMouseDown as any);
    wrapper.removeEventListener("mousemove", onMouseMove as any);
    wrapper.removeEventListener("mouseup", onMouseUp as any);
    wrapper.removeEventListener("mouseleave", onMouseUp as any);
    const controls = wrapper.querySelector(".mermaid-zoom-controls");
    if (controls) {
      wrapper.removeChild(controls);
    }
  };
}
