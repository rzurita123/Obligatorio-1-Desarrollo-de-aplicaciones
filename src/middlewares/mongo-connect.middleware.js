const mongoose = require("mongoose");
const connectMongoDB = require("../models/mongo.client");

//Middleware creado porque en Vercel no estaba funcionando mongodb. Intenta hacer connect y si no devuelve error.
let connectPromise = null;

async function ensureMongoConnected(req, res, next) {
  try {
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    if (!connectPromise) {
      connectPromise = connectMongoDB().catch((err) => {
        connectPromise = null;
        throw err;
      });
    }

    await connectPromise;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = ensureMongoConnected;
