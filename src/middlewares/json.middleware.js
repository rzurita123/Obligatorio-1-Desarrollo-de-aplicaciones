//Valida tamaño del body JSON, como medida de seguridad

const express = require("express");

// Se aumenta limite a 6mb para aceptar fotos de perfil
const limit = process.env.JSON_BODY_LIMIT || "6mb";

module.exports = express.json({ limit });
