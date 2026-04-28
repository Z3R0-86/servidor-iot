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

function buildHistoryChart(data, range = "diario") {
  const chart = document.getElementById("historyChart");

  if (!chart) {
    return;
  }

  const items = getRangeSlice(data, range);

  if (!items.length) {
    chart.innerHTML = "";
    return;
  }

  chart.innerHTML = `
    <div class="chart-columns">
      ${items.map((item) => {
        const temp = clamp(Number(item.temperatura) || 0, 0, 50);
        const hum = clamp(Number(item.humedad) || 0, 0, 100);
        const soil = normalizeSoil(item.suelo);
        const timeLabel = formatHourLabel(item.fecha || Date.now());

        return `
          <div class="chart-column">
            <div class="chart-bars">
              <div class="chart-bar" title="Temperatura ${temp}°C" style="height:${Math.max(10, (temp / 50) * 100)}%; background:#4f8dff"></div>
              <div class="chart-bar" title="Humedad ${hum}%" style="height:${Math.max(10, hum)}%; background:#19d0e0"></div>
              <div class="chart-bar" title="Suelo ${soil}%" style="height:${Math.max(10, soil)}%; background:#30e68f"></div>
            </div>
            <div class="chart-time">${timeLabel}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
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
