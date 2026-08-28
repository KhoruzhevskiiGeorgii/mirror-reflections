(() => {
  "use strict";

  const BASE_DENOM = 36;
  const BASE_MULT = 36;
  const Y_MIN = 0.005;
  const Y_MAX = 1.2;

  const canvas = document.getElementById("plot");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("plotWrap");
  const tooltip = document.getElementById("tooltip");
  const denseGridInput = document.getElementById("denseGrid");
  const parameterIds = ["a", "b", "c", "m"];
  const inputs = parameterIds.map(id => document.getElementById(id));
  const ranges = parameterIds.map(id => document.getElementById(`${id}Range`));
  const values = Object.fromEntries(parameterIds.map(id => [id, document.getElementById(`${id}Value`)]));

  const state = {
    zoom: 1,
    segments: [],
    points: [],
    bounds: null,
    params: null
  };

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function normalizeEvenInteger(value, fallback = 4) {
    let n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    n = Math.round(n / 2) * 2;
    if (n < 2) n = 2;
    return n;
  }

  function numValue(id, fallback) {
    const n = Number(document.getElementById(id).value);
    return Number.isFinite(n) ? n : fallback;
  }

  function setParameter(id, rawValue, source) {
    const numberInput = document.getElementById(id);
    const rangeInput = document.getElementById(`${id}Range`);
    let value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    if (id === "m") value = normalizeEvenInteger(value, 4);
    else if (id === "a") value = Math.max(0.1, value);
    else value = Math.max(0, value);
    numberInput.value = String(value);
    if (source !== rangeInput) {
      const min = Number(rangeInput.min);
      const max = Number(rangeInput.max);
      rangeInput.value = String(Math.min(max, Math.max(min, value)));
    }
    values[id].value = String(value);
  }

  function readParams() {
    const a = Math.max(0.1, numValue("a", 3));
    const b = Math.max(0, numValue("b", 1));
    const c = Math.max(0, numValue("c", 36));
    const m = normalizeEvenInteger(document.getElementById("m").value, 4);
    document.getElementById("m").value = String(m);
    return { a, b, c, m, denseGrid: denseGridInput.checked };
  }

  function f(y, {a, b, c, m}) {
    const core = BASE_MULT * y - c / Math.E;
    const value = a * y * Math.log(y) - (b / BASE_DENOM) * Math.exp(-Math.pow(core, m));
    return Number.isFinite(value) ? value : NaN;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawMessage(w, h, text) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css("--muted");
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
  }

  function drawGridLineVertical(x, sx, margin, ph, style, width = 1) {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    const px = sx(x);
    ctx.beginPath();
    ctx.moveTo(px, margin.top);
    ctx.lineTo(px, margin.top + ph);
    ctx.stroke();
  }

  function drawGridLineHorizontal(y, sy, margin, pw, style, width = 1) {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    const py = sy(y);
    ctx.beginPath();
    ctx.moveTo(margin.left, py);
    ctx.lineTo(margin.left + pw, py);
    ctx.stroke();
  }

  function draw() {
    const p = readParams();
    state.params = p;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const margin = { left: 60, right: 20, top: 20, bottom: 48 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;

    ctx.clearRect(0, 0, w, h);

    const samples = Math.max(1800, Math.floor((pw + ph) * 2.8));
    const segments = [];
    const allPoints = [];
    let currentSegment = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const y = Y_MIN + (Y_MAX - Y_MIN) * i / samples;
      const x = f(y, p);
      const valid = Number.isFinite(x) && x < 0;
      if (valid) {
        const point = { x, y };
        currentSegment.push(point);
        allPoints.push(point);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else if (currentSegment.length) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (currentSegment.length) segments.push(currentSegment);

    state.segments = segments;
    state.points = allPoints;

    if (!allPoints.length) {
      state.bounds = null;
      tooltip.style.display = "none";
      drawMessage(w, h, "No points with x(y) < 0 in the current range");
      return;
    }

    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const baseUnitsPerPixelX = Math.max(
      rangeX / Math.max(pw, 1),
      2 * rangeY / Math.max(ph, 1)
    ) * 1.14;
    const unitsPerPixelX = baseUnitsPerPixelX / state.zoom;
    const unitsPerPixelY = unitsPerPixelX / 2;
    const drawRangeX = unitsPerPixelX * pw;
    const drawRangeY = unitsPerPixelY * ph;

    const viewMinX = centerX - drawRangeX / 2;
    const viewMaxX = centerX + drawRangeX / 2;
    const viewMinY = centerY - drawRangeY / 2;
    const viewMaxY = centerY + drawRangeY / 2;

    state.bounds = { margin, pw, ph, viewMinX, viewMaxX, viewMinY, viewMaxY };

    const sx = x => margin.left + (x - viewMinX) / (viewMaxX - viewMinX) * pw;
    const sy = y => margin.top + (viewMaxY - y) / (viewMaxY - viewMinY) * ph;

    ctx.fillStyle = css("--muted");
    ctx.font = window.innerWidth <= 760 ? "11px system-ui, sans-serif" : "12px system-ui, sans-serif";
    ctx.textBaseline = "middle";

    const majorXStep = 1;
    const majorYStep = 0.5;
    const minorXStep = 0.125;
    const minorYStep = 0.0625;

    if (p.denseGrid) {
      for (let x = Math.ceil(viewMinX / minorXStep) * minorXStep; x <= viewMaxX + minorXStep * 1e-6; x += minorXStep) {
        if (Math.abs(x / majorXStep - Math.round(x / majorXStep)) < 1e-9) continue;
        drawGridLineVertical(x, sx, margin, ph, css("--minor-grid"), 1);
      }
      for (let y = Math.ceil(viewMinY / minorYStep) * minorYStep; y <= viewMaxY + minorYStep * 1e-6; y += minorYStep) {
        if (Math.abs(y / majorYStep - Math.round(y / majorYStep)) < 1e-9) continue;
        drawGridLineHorizontal(y, sy, margin, pw, css("--minor-grid"), 1);
      }
    }

    for (let x = Math.ceil(viewMinX / majorXStep) * majorXStep; x <= viewMaxX + majorXStep * 1e-6; x += majorXStep) {
      drawGridLineVertical(x, sx, margin, ph, css("--grid"), 1.15);
      const px = sx(x);
      ctx.textAlign = "center";
      ctx.fillText(Number(x.toPrecision(6)).toString(), px, margin.top + ph + 18);
    }

    for (let y = Math.ceil(viewMinY / majorYStep) * majorYStep; y <= viewMaxY + majorYStep * 1e-6; y += majorYStep) {
      drawGridLineHorizontal(y, sy, margin, pw, css("--grid"), 1.15);
      const py = sy(y);
      ctx.textAlign = "right";
      ctx.fillText(Number(y.toPrecision(6)).toString(), margin.left - 8, py);
    }

    ctx.strokeStyle = css("--line");
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, pw, ph);

    if (viewMinX <= 0 && viewMaxX >= 0) {
      ctx.strokeStyle = css("--muted");
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(sx(0), margin.top);
      ctx.lineTo(sx(0), margin.top + ph);
      ctx.stroke();
    }
    if (viewMinY <= 0 && viewMaxY >= 0) {
      ctx.strokeStyle = css("--muted");
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(margin.left, sy(0));
      ctx.lineTo(margin.left + pw, sy(0));
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, pw, ph);
    ctx.clip();

    ctx.strokeStyle = css("--accent");
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (const segment of segments) {
      if (!segment.length) continue;
      ctx.beginPath();
      ctx.moveTo(sx(segment[0].x), sy(segment[0].y));
      for (let i = 1; i < segment.length; i++) {
        ctx.lineTo(sx(segment[i].x), sy(segment[i].y));
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = css("--text");
    ctx.font = window.innerWidth <= 760 ? "600 12px system-ui, sans-serif" : "600 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("x(y)", margin.left + pw / 2, h - 12);

    ctx.save();
    ctx.translate(14, margin.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("y", 0, 0);
    ctx.restore();
  }

  function showTooltip(event) {
    if (!state.bounds || !state.points.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const { margin, pw, ph, viewMinX, viewMaxX, viewMinY, viewMaxY } = state.bounds;

    if (mx < margin.left || mx > margin.left + pw || my < margin.top || my > margin.top + ph) {
      tooltip.style.display = "none";
      return;
    }

    const sx = x => margin.left + (x - viewMinX) / (viewMaxX - viewMinX) * pw;
    const sy = y => margin.top + (viewMaxY - y) / (viewMaxY - viewMinY) * ph;

    let best = null;
    let bestDist = Infinity;
    for (const point of state.points) {
      const dx = sx(point.x) - mx;
      const dy = sy(point.y) - my;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = point;
      }
    }

    if (!best) {
      tooltip.style.display = "none";
      return;
    }

    tooltip.innerHTML = `x = ${best.x.toPrecision(7)}<br>y = ${best.y.toPrecision(7)}`;
    tooltip.style.left = `${mx}px`;
    tooltip.style.top = `${my}px`;
    tooltip.style.display = "block";
  }

  for (const input of inputs) {
    const update = () => {
      setParameter(input.id, input.value, input);
      state.zoom = 1;
      draw();
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  }

  for (const range of ranges) {
    range.addEventListener("input", () => {
      const id = range.id.replace(/Range$/, "");
      setParameter(id, range.value, range);
      state.zoom = 1;
      draw();
    });
  }

  for (const id of parameterIds) setParameter(id, document.getElementById(id).value);
  denseGridInput.addEventListener("change", draw);

  canvas.addEventListener("mousemove", showTooltip);
  canvas.addEventListener("mouseleave", () => tooltip.style.display = "none");
  canvas.addEventListener("wheel", event => {
    event.preventDefault();
    state.zoom *= event.deltaY < 0 ? 1.18 : 1 / 1.18;
    state.zoom = Math.min(30, Math.max(0.25, state.zoom));
    draw();
  }, { passive: false });

  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(wrap);
  resize();
})();
