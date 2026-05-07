//Valida tamaño del body JSON, como medida de seguridad

const express = require("express");

const limit = process.env.JSON_BODY_LIMIT || "100kb";

module.exports = express.json({ limit });
