function map(valor, inMin, inMax, outMin, outMax) {
  return Math.round((valor - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setSoilPalette(porcentaje) {
  const potBox = document.getElementById("potBox");
  const stem = document.getElementById("stem");
  const leafLeft = document.getElementById("leafLeft");
  const leafRight = document.getElementById("leafRight");

  let waterFront = "#4d6de3";
  let waterBack = "#97b7ff";
  let stemBg = "linear-gradient(180deg, #90e296 0%, #4bb04f 100%)";
  let leafColor = "#77d98a";

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

async function cargarDatos() {
  try {
    const res = await fetch("/api/datos");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const d = data[data.length - 1];

    document.getElementById("temp").innerText = `${d.temperatura} °C`;
    let tempPorcentaje = clamp(map(d.temperatura, 0, 50, 0, 100), 0, 100);
    const tempBar = document.getElementById("tempBar");
    tempBar.style.height = `${tempPorcentaje}%`;

    if (d.temperatura < 20) {
      tempBar.style.background = "#00bcd4";
    } else if (d.temperatura < 30) {
      tempBar.style.background = "#ffc107";
    } else {
      tempBar.style.background = "#f44336";
    }

    document.getElementById("hum").innerText = `${d.humedad} %`;
    const humBar = document.getElementById("humBar");
    const humPorcentaje = clamp(Number(d.humedad), 0, 100);
    humBar.style.height = `${humPorcentaje}%`;

    if (humPorcentaje < 30) {
      humBar.style.background = "#ff4d4d";
    } else if (humPorcentaje < 70) {
      humBar.style.background = "#ffa500";
    } else {
      humBar.style.background = "#00c853";
    }

    const seco = 3200;
    const humedo = 1500;
    const porcentaje = clamp(map(d.suelo, seco, humedo, 0, 100), 0, 100);

    document.getElementById("sueloPorcentaje").innerText = porcentaje;

    const water = document.getElementById("water");
    water.style.transform = `translate(0, ${100 - porcentaje}%)`;

    setSoilPalette(porcentaje);
    animatePlant(porcentaje);

    document.getElementById("fecha").innerText =
      `Última actualización: ${new Date(d.fecha).toLocaleString()}`;
  } catch (error) {
    console.error("No se pudieron cargar datos:", error);
  }
}

setInterval(cargarDatos, 2000);
cargarDatos();
