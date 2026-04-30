function map(valor, inMin, inMax, outMin, outMax) {
  return Math.round((valor - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSoil(value) {
  const soilValue = Number(value);

  if (!Number.isFinite(soilValue)) {
    return 0;
  }

  if (soilValue <= 100) {
    return clamp(soilValue, 0, 100);
  }

  return clamp(map(soilValue, 3200, 1500, 0, 100), 0, 100);
}

function setSoilPalette(porcentaje) {
  const potBox = document.getElementById("potBox");
  const stem = document.getElementById("stem");
  const leafLeft = document.getElementById("leafLeft");
  const leafRight = document.getElementById("leafRight");

  let waterFront = "#4d6de3";
  let waterBack = "#97b7ff";
  let stemBg = "linear-gradient(180deg, #90e296 0%, #4bb04f 100%)";
  let leafColor = "#7ee196";

  if (porcentaje < 30) {
    waterFront = "#de5959";
    waterBack = "#f2a2a2";
    stemBg = "linear-gradient(180deg, #d19a84 0%, #a85e4a 100%)";
    leafColor = "#c68875";
  } else if (porcentaje < 70) {
    waterFront = "#f0ad4e";
    waterBack = "#ffd99f";
    stemBg = "linear-gradient(180deg, #b9d685 0%, #7e9f44 100%)";
    leafColor = "#9fc464";
  }

  potBox.style.setProperty("--water-front", waterFront);
  potBox.style.setProperty("--water-back", waterBack);
  stem.style.background = stemBg;
  leafLeft.style.background = leafColor;
  leafRight.style.background = leafColor;
}

function animatePlant(porcentaje) {
  const stem = document.getElementById("stem");
  const leafLeft = document.getElementById("leafLeft");
  const leafRight = document.getElementById("leafRight");

  const stemHeight = 25 + porcentaje * 0.65;
  const leafScale = 0.5 + (porcentaje / 100) * 0.9;
  const leafOpacity = (0.35 + porcentaje / 150).toFixed(2);

  stem.style.height = `${stemHeight}px`;
  leafLeft.style.transform = `rotate(-35deg) scale(${leafScale})`;
  leafRight.style.transform = `rotate(145deg) scale(${leafScale})`;
  leafLeft.style.opacity = leafOpacity;
  leafRight.style.opacity = leafOpacity;
}

function getRangeSlice(data, range) {
  if (range === "mensual") {
    return data.slice(-30);
  }

  if (range === "semanal") {
    return data.slice(-7);
  }

  return data.slice(-24);
}

function formatHourLabel(fecha) {
  return new Date(fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function drawLineChart(canvas, data, valueKey, maxValue, lineColor, gradientColor1, gradientColor2) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  const points = data.map((item, index) => {
    const value = valueKey === 'temperatura'
      ? clamp(Number(item[valueKey]) || 0, 0, maxValue)
      : valueKey === 'suelo'
        ? normalizeSoil(item[valueKey])
        : clamp(Number(item[valueKey]) || 0, 0, maxValue);
    
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = height - padding - (value / maxValue) * chartHeight;
    return { x, y, value };
  });

  // Calcular estadísticas
  const values = points.map(p => p.value);
  const minValue = Math.min(...values);
  const maxMeasured = Math.max(...values);
  const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  // Dibujar líneas de cuadrícula horizontales con etiquetas de porcentaje
  const gridLines = [0, 25, 50, 75, 100];
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.font = "11px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "right";

  gridLines.forEach((percentage) => {
    const y = height - padding - (percentage / 100) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding - 5, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    // Etiqueta de porcentaje
    ctx.fillText(`${percentage}%`, padding - 12, y + 4);
  });

  // Dibujar área bajo la línea con gradiente
  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, gradientColor1);
  gradient.addColorStop(1, gradientColor2);

  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding);
  points.forEach((point, index) => {
    if (index === 0) ctx.lineTo(point.x, point.y);
    else {
      const prev = points[index - 1];
      const cpx = (prev.x + point.x) / 2;
      const cpy = (prev.y + point.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
    }
  });
  ctx.lineTo(points[points.length - 1].x, height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Dibujar línea principal
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else {
      const prev = points[index - 1];
      const cpx = (prev.x + point.x) / 2;
      const cpy = (prev.y + point.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
    }
  });
  ctx.stroke();

  // Dibujar puntos en los datos
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Dibujar estadísticas en la esquina superior derecha
  ctx.font = "bold 12px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "left";
  const statsX = padding + 12;
  const statsY = padding + 15;
  
  ctx.fillText(`Min: ${minValue.toFixed(1)}%`, statsX, statsY);
  ctx.fillText(`Prom: ${avgValue}%`, statsX, statsY + 18);
  ctx.fillText(`Max: ${maxMeasured.toFixed(1)}%`, statsX, statsY + 36);
}

function buildHistoryChart(data, range = "diario") {
  const chart = document.getElementById("historyChart");

  if (!chart) {
    return;
  }

  const items = getRangeSlice(data, range);

  if (!items.length) {
    chart.innerHTML = "<div class='chart-empty'>Sin datos disponibles</div>";
    return;
  }

  chart.innerHTML = `
    <div class="chart-canvas-container">
      <canvas id="tempCanvas" class="metric-canvas" width="900" height="320"></canvas>
      <canvas id="humCanvas" class="metric-canvas" width="900" height="320"></canvas>
      <canvas id="soilCanvas" class="metric-canvas" width="900" height="320"></canvas>
    </div>
  `;

  setTimeout(() => {
    const tempCanvas = document.getElementById("tempCanvas");
    const humCanvas = document.getElementById("humCanvas");
    const soilCanvas = document.getElementById("soilCanvas");

    if (tempCanvas && humCanvas && soilCanvas) {
      const container = chart.querySelector(".chart-canvas-container");
      const width = container.offsetWidth;
      
      tempCanvas.width = width;
      humCanvas.width = width;
      soilCanvas.width = width;

      drawLineChart(tempCanvas, items, "temperatura", 50, "#4fa1ff", "rgba(79, 161, 255, 0.3)", "rgba(79, 161, 255, 0)");
      drawLineChart(humCanvas, items, "humedad", 100, "#2ac8df", "rgba(42, 200, 223, 0.3)", "rgba(42, 200, 223, 0)");
      drawLineChart(soilCanvas, items, "suelo", 100, "#2fdb78", "rgba(47, 219, 120, 0.3)", "rgba(47, 219, 120, 0)");
    }
  }, 0);
}

let currentHistoryRange = "diario";
let currentHistoryData = [];

function wireTabs() {
  const tabs = document.querySelectorAll(".tab[data-range]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentHistoryRange = tab.dataset.range;

      tabs.forEach((button) => {
        const active = button === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });

      buildHistoryChart(currentHistoryData, currentHistoryRange);
    });
  });
}

async function cargarDatos() {
  try {
    const res = await fetch("/api/datos");
    const data = await res.json();
    currentHistoryData = Array.isArray(data) ? data : [];

    buildHistoryChart(currentHistoryData, currentHistoryRange);

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("fecha").innerText = "Sin lecturas todavía";
      return;
    }

    const d = data[data.length - 1];

    document.getElementById("temp").innerText = `${d.temperatura} °C`;
    const tempPorcentaje = clamp(map(Number(d.temperatura) || 0, 0, 50, 0, 100), 0, 100);
    document.getElementById("tempBar").style.width = `${tempPorcentaje}%`;

    if (Number(d.temperatura) < 20) {
      document.getElementById("tempBar").style.background = "#4fa1ff";
    } else if (Number(d.temperatura) < 30) {
      document.getElementById("tempBar").style.background = "#ffd24a";
    } else {
      document.getElementById("tempBar").style.background = "#f66a6a";
    }

    document.getElementById("hum").innerText = `${d.humedad} %`;
    const humPorcentaje = clamp(Number(d.humedad), 0, 100);
    document.getElementById("humBar").style.width = `${humPorcentaje}%`;

    if (humPorcentaje < 30) {
      document.getElementById("humBar").style.background = "#ff4d4d";
    } else if (humPorcentaje < 70) {
      document.getElementById("humBar").style.background = "#ffa500";
    } else {
      document.getElementById("humBar").style.background = "#2fdb78";
    }

    const porcentaje = normalizeSoil(d.suelo);
    document.getElementById("sueloPorcentaje").innerText = porcentaje;

    const water = document.getElementById("water");
    water.style.transform = `translate(0, ${100 - porcentaje}%)`;

    setSoilPalette(porcentaje);
    animatePlant(porcentaje);

    document.getElementById("fecha").innerText = `Última actualización: ${new Date(d.fecha).toLocaleString()}`;
  } catch (error) {
    console.error("No se pudieron cargar datos:", error);
  }
}

wireTabs();
setInterval(cargarDatos, 2000);
cargarDatos();
