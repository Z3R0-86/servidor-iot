const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let datos = [];

app.post("/api/datos", (req, res) => {
    const nuevoDato = req.body;
    nuevoDato.fecha = new Date();

    datos.push(nuevoDato);

    console.log("Dato recibido:", nuevoDato);
    res.send("OK");
});

app.get("/api/datos", (req, res) => {
    res.json(datos);
});

app.get("/", (req, res) => {
    res.send("Servidor IoT funcionando");
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});