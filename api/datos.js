const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wdlspckqbhafctwncgko.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_UAPRbPh3T_E2cQ7zCk1iwQ_O3TQRk7L";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "datos";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function normalizeDato(dato) {
  return {
    ...dato,
    temperatura: dato.temperatura ?? dato.temp ?? dato.temperature ?? 0,
    humedad: dato.humedad ?? dato.hum ?? dato.humidity ?? 0,
    suelo: dato.suelo ?? dato.soil ?? dato.suelo_porcentaje ?? dato.soil_percentage ?? 0,
    fecha: dato.fecha || dato.created_at || dato.createdAt || dato.inserted_at || dato.insertedAt || new Date().toISOString()
  };
}

function ordenarDatos(a, b) {
  const fechaA = new Date(a.fecha).getTime();
  const fechaB = new Date(b.fecha).getTime();

  if (Number.isFinite(fechaA) && Number.isFinite(fechaB)) {
    return fechaA - fechaB;
  }

  return 0;
}

async function obtenerDatosSupabase() {
  const orderCandidates = ["fecha", "created_at", "inserted_at", "id"];

  for (const column of orderCandidates) {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select("*")
      .order(column, { ascending: false })
      .limit(200);

    if (!error) {
      return (data || []).map(normalizeDato).sort(ordenarDatos);
    }
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .limit(200);

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeDato).sort(ordenarDatos);
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    try {
      const datos = await obtenerDatosSupabase();
      return res.status(200).json(datos);
    } catch (error) {
      console.error("Error al cargar datos desde Supabase:", error);
      return res.status(500).json({ error: "No se pudieron cargar los datos" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const nuevoDato = normalizeDato({
        ...body,
        fecha: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .insert([nuevoDato])
        .select();

      if (error) {
        console.error("Error al guardar dato en Supabase:", error);
        return res.status(500).json({ error: "No se pudo guardar el dato" });
      }

      console.log("Dato recibido:", data?.[0] || nuevoDato);
      return res.status(201).send("OK");
    } catch (error) {
      console.error("Error inesperado al guardar dato:", error);
      return res.status(500).json({ error: "No se pudo guardar el dato" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
};